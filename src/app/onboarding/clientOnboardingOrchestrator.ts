/**
 * clientOnboardingOrchestrator.ts
 *
 * Shared orchestration layer for all client onboarding entry points:
 *   - Guest path  (email + phone, no account required)
 *   - Full path   (email/password or social auth)
 *   - Upgrade     (guest → full without losing booking/payment context)
 *   - Modules     (optional profile, payment, preferences, notifications, loyalty)
 *
 * All onboarding entry points (booking, discovery, direct) route through this
 * single orchestrator so session handling, conversion, and module tracking
 * behave consistently.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OnboardingModule =
  | "profile"
  | "payment"
  | "preferences"
  | "notifications"
  | "loyalty";

/** Per-module status tracked separately from raw completion. */
export type ModuleStatus = "pending" | "completed" | "skipped";

/**
 * Consent-safe defaults for any session that does not explicitly set a value.
 * Notifications + promotions are OFF until the user opts in (GDPR / consent posture).
 */
export type ConsentPreferences = {
  /** Transactional booking notifications (push/email). Off by default. */
  notificationsEnabled: boolean;
  /** Marketing/promotion emails. Off by default. */
  promotionsEnabled: boolean;
  /** Loyalty enrollment. Off by default; user must explicitly opt-in. */
  loyaltyOptIn: boolean;
};

export const DEFAULT_CONSENT_PREFERENCES: ConsentPreferences = {
  notificationsEnabled: false,
  promotionsEnabled: false,
  loyaltyOptIn: false,
};

export type GuestBookingContext = {
  /** ID of the booking this guest session was created for */
  bookingId: string;
  tenantId: string;
  serviceId: string;
  /** ISO-8601 datetime of the booked slot */
  slotAt: string;
  email: string;
  phone?: string;
};

export type FullOnboardingCredentials = {
  userId: string;
  email: string;
  authProvider: "email" | "google" | "apple";
};

export type AccountMergeStrategy =
  /** Keep existing account data, attach the new booking only. */
  | "preserve_existing"
  /** Overwrite booking/preferences with the in-flight session values. */
  | "prefer_session";

export type OnboardingSession = {
  sessionId: string;
  tenantId: string;
  /** "guest" = email+phone only; "full" = authenticated account; "merged" = guest folded into a pre-existing account. */
  mode: "guest" | "full" | "merged";
  email: string;
  phone?: string;
  /** Present for full-account sessions and after guest upgrade or merge. */
  userId?: string;
  /** Preserved from the originating booking when mode is "guest", "full" (with booking), or "merged". */
  bookingContext?: GuestBookingContext;
  completedModules: OnboardingModule[];
  /** Modules the user explicitly chose to skip (progressive prompting). */
  skippedModules: OnboardingModule[];
  /** Consent-safe preferences. Defaults applied at session creation. */
  preferences: ConsentPreferences;
  createdAt: number;
  /** Set when a guest session is upgraded to a full account. */
  upgradedAt?: number;
  /** Set when a guest session is merged into a pre-existing account. */
  mergedAt?: number;
  /** Strategy used during merge, when applicable. */
  mergeStrategy?: AccountMergeStrategy;
};

export type ClientOnboardingOrchestratorError =
  | "SESSION_NOT_FOUND"
  | "GUEST_REQUIRED_FOR_UPGRADE"
  | "ALREADY_FULL_ACCOUNT"
  | "MODULE_ALREADY_COMPLETED"
  | "MODULE_ALREADY_RESOLVED"
  | "INVALID_BOOKING_CONTEXT"
  | "INVALID_MERGE_TARGET";

// ---------------------------------------------------------------------------
// Persistence port (W16-DEBT-1)
// ---------------------------------------------------------------------------

/**
 * Optional persistence port. Implementations persist onboarding sessions to a
 * durable store (e.g. Firestore at `userOnboardingDrafts/{sessionId}`) so that
 * users can resume on a different device or after the app is force-killed.
 *
 * The orchestrator's sync API stays sync — `save` is invoked fire-and-forget
 * after every mutation and any rejection is swallowed (logged via the optional
 * `onError` callback). Hydration is exposed via the new async `restoreSession`
 * method, which is opt-in.
 */
export type OnboardingPersistencePort = {
  save(session: OnboardingSession): Promise<void>;
  load(sessionId: string): Promise<OnboardingSession | null>;
};

export type ClientOnboardingOrchestratorOptions = {
  persistence?: OnboardingPersistencePort;
  /** Invoked when persistence.save() rejects (default: silent). */
  onPersistError?: (err: unknown) => void;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates an in-process orchestrator instance.
 * In production each app session will hold one orchestrator; in tests a fresh
 * one is created per test case to avoid shared state.
 *
 * Pass `options.persistence` to enable durable session persistence (W16-DEBT-1).
 * The sync mutation API is preserved — saves are fire-and-forget.
 */
export function createClientOnboardingOrchestrator(
  options: ClientOnboardingOrchestratorOptions = {},
) {
  const sessions = new Map<string, OnboardingSession>();
  const { persistence, onPersistError } = options;
  let _counter = 0;

  function _persist(session: OnboardingSession): void {
    if (!persistence) return;
    // Fire-and-forget so we keep the public API synchronous.
    void persistence.save(session).catch((e) => {
      if (onPersistError) {
        onPersistError(e);
      }
    });
  }

  function _nextId(): string {
    return `session-${(_counter += 1)}`;
  }

  /** Typed Error helper — keeps error codes in sync with the union type. */
  function err(code: ClientOnboardingOrchestratorError): Error {
    return new Error(code);
  }

  // -------------------------------------------------------------------------
  // startGuestOnboarding
  // -------------------------------------------------------------------------

  /**
   * Starts a lightweight guest onboarding session tied to a booking.
   * The caller supplies email (required) and optional phone — no Firebase Auth
   * account is created at this stage.
   */
  function startGuestOnboarding(ctx: GuestBookingContext): OnboardingSession {
    if (!ctx.bookingId || !ctx.bookingId.trim()) {
      throw err("INVALID_BOOKING_CONTEXT");
    }
    if (!ctx.email || !ctx.email.trim()) {
      throw err("INVALID_BOOKING_CONTEXT");
    }

    const session: OnboardingSession = {
      sessionId: _nextId(),
      tenantId: ctx.tenantId,
      mode: "guest",
      email: ctx.email,
      phone: ctx.phone,
      bookingContext: { ...ctx },
      completedModules: [],
      skippedModules: [],
      preferences: { ...DEFAULT_CONSENT_PREFERENCES },
      createdAt: Date.now(),
    };

    sessions.set(session.sessionId, session);
    _persist(session);
    return { ...session };
  }

  // -------------------------------------------------------------------------
  // startFullOnboarding
  // -------------------------------------------------------------------------

  /**
   * Starts a full-account onboarding session.
   * `modules` lets callers pre-seed already-completed optional modules
   * (e.g., when the user completed profile during social sign-up).
   */
  function startFullOnboarding(
    credentials: FullOnboardingCredentials,
    tenantId: string,
    modules: OnboardingModule[] = [],
  ): OnboardingSession {
    if (!credentials.userId || !credentials.userId.trim()) {
      throw err("INVALID_BOOKING_CONTEXT");
    }

    const session: OnboardingSession = {
      sessionId: _nextId(),
      tenantId,
      mode: "full",
      email: credentials.email,
      userId: credentials.userId,
      completedModules: [...modules],
      skippedModules: [],
      preferences: { ...DEFAULT_CONSENT_PREFERENCES },
      createdAt: Date.now(),
    };

    sessions.set(session.sessionId, session);
    _persist(session);
    return { ...session };
  }

  // -------------------------------------------------------------------------
  // upgradeGuestToFull
  // -------------------------------------------------------------------------

  /**
   * Converts an existing guest session to a full account.
   * Preserves bookingContext and all previously completed modules so
   * the user never loses their booking or payment state.
   */
  function upgradeGuestToFull(
    sessionId: string,
    credentials: FullOnboardingCredentials,
  ): OnboardingSession {
    const existing = sessions.get(sessionId);
    if (!existing) {
      throw err("SESSION_NOT_FOUND");
    }
    if (existing.mode !== "guest") {
      throw err("GUEST_REQUIRED_FOR_UPGRADE");
    }

    const upgraded: OnboardingSession = {
      ...existing,
      mode: "full",
      userId: credentials.userId,
      // Update email to the full-account email (may differ from guest email)
      email: credentials.email,
      // bookingContext and completedModules are intentionally preserved
      upgradedAt: Date.now(),
    };

    sessions.set(sessionId, upgraded);
    _persist(upgraded);
    return { ...upgraded };
  }

  // -------------------------------------------------------------------------
  // completeModule
  // -------------------------------------------------------------------------

  /**
   * Marks one optional onboarding module as complete for a session.
   * Idempotency: calling twice for the same module throws MODULE_ALREADY_COMPLETED.
   */
  function completeModule(
    sessionId: string,
    module: OnboardingModule,
  ): OnboardingSession {
    const session = sessions.get(sessionId);
    if (!session) {
      throw err("SESSION_NOT_FOUND");
    }
    if (session.completedModules.includes(module)) {
      throw err("MODULE_ALREADY_COMPLETED");
    }

    const updated: OnboardingSession = {
      ...session,
      completedModules: [...session.completedModules, module],
      // Completing a previously-skipped module clears the skip — explicit user action wins.
      skippedModules: session.skippedModules.filter((m) => m !== module),
    };

    sessions.set(sessionId, updated);
    _persist(updated);
    return { ...updated };
  }

  // -------------------------------------------------------------------------
  // skipModule (W16.2 — progressive prompting)
  // -------------------------------------------------------------------------

  /**
   * Marks an optional module as explicitly skipped.
   * The wizard will not re-prompt for skipped modules in the same session,
   * but the user can come back via `resume` and complete them later.
   */
  function skipModule(
    sessionId: string,
    module: OnboardingModule,
  ): OnboardingSession {
    const session = sessions.get(sessionId);
    if (!session) {
      throw err("SESSION_NOT_FOUND");
    }
    if (session.completedModules.includes(module) || session.skippedModules.includes(module)) {
      throw err("MODULE_ALREADY_RESOLVED");
    }

    const updated: OnboardingSession = {
      ...session,
      skippedModules: [...session.skippedModules, module],
    };

    sessions.set(sessionId, updated);
    _persist(updated);
    return { ...updated };
  }

  // -------------------------------------------------------------------------
  // updatePreferences (W16.2 — consent-safe defaults)
  // -------------------------------------------------------------------------

  /**
   * Updates one or more consent preferences. Defaults remain consent-safe
   * (everything off) until the user explicitly opts in.
   */
  function updatePreferences(
    sessionId: string,
    patch: Partial<ConsentPreferences>,
  ): OnboardingSession {
    const session = sessions.get(sessionId);
    if (!session) {
      throw err("SESSION_NOT_FOUND");
    }

    const updated: OnboardingSession = {
      ...session,
      preferences: { ...session.preferences, ...patch },
    };

    sessions.set(sessionId, updated);
    _persist(updated);
    return { ...updated };
  }

  // -------------------------------------------------------------------------
  // resume (W16.2 — progressive prompting)
  // -------------------------------------------------------------------------

  /**
   * Returns the session plus the list of pending (unresolved) modules,
   * in canonical order. Use this when the user returns to the app after
   * skipping/closing the onboarding wizard mid-flow.
   */
  function resume(
    sessionId: string,
  ): { session: OnboardingSession; pendingModules: OnboardingModule[] } {
    const session = sessions.get(sessionId);
    if (!session) {
      throw err("SESSION_NOT_FOUND");
    }

    const all: OnboardingModule[] = [
      "profile",
      "payment",
      "preferences",
      "notifications",
      "loyalty",
    ];
    const resolved = new Set<OnboardingModule>([
      ...session.completedModules,
      ...session.skippedModules,
    ]);
    const pendingModules = all.filter((m) => !resolved.has(m));

    return { session: { ...session }, pendingModules };
  }

  // -------------------------------------------------------------------------
  // mergeWithExistingAccount (W16.1 — account merge)
  // -------------------------------------------------------------------------

  /**
   * Folds an in-flight guest session into an already-existing user account
   * (e.g., the guest email matches an account that signed up earlier).
   * Booking context is always preserved. Module completion + preferences
   * follow the chosen merge strategy.
   */
  function mergeWithExistingAccount(
    sessionId: string,
    existingUserId: string,
    strategy: AccountMergeStrategy = "preserve_existing",
    existingAccountState?: {
      completedModules?: OnboardingModule[];
      preferences?: Partial<ConsentPreferences>;
    },
  ): OnboardingSession {
    if (!existingUserId || !existingUserId.trim()) {
      throw err("INVALID_MERGE_TARGET");
    }

    const existing = sessions.get(sessionId);
    if (!existing) {
      throw err("SESSION_NOT_FOUND");
    }
    if (existing.mode !== "guest") {
      throw err("GUEST_REQUIRED_FOR_UPGRADE");
    }

    let completedModules: OnboardingModule[];
    let preferences: ConsentPreferences;

    if (strategy === "preserve_existing") {
      // Existing account wins for completion + preferences; we only attach the booking.
      const fromExisting = existingAccountState?.completedModules ?? [];
      const merged = new Set<OnboardingModule>([...fromExisting, ...existing.completedModules]);
      completedModules = Array.from(merged);
      preferences = {
        ...DEFAULT_CONSENT_PREFERENCES,
        ...(existingAccountState?.preferences ?? {}),
      };
    } else {
      // prefer_session — in-flight session values win.
      completedModules = [...existing.completedModules];
      preferences = { ...existing.preferences };
    }

    const merged: OnboardingSession = {
      ...existing,
      mode: "merged",
      userId: existingUserId,
      // bookingContext is preserved — the whole point of merge.
      completedModules,
      preferences,
      mergedAt: Date.now(),
      mergeStrategy: strategy,
    };

    sessions.set(sessionId, merged);
    _persist(merged);
    return { ...merged };
  }

  // -------------------------------------------------------------------------
  // getSession
  // -------------------------------------------------------------------------

  function getSession(sessionId: string): OnboardingSession | undefined {
    const s = sessions.get(sessionId);
    return s ? { ...s } : undefined;
  }

  // -------------------------------------------------------------------------
  // restoreSession (W16-DEBT-1)
  // -------------------------------------------------------------------------

  /**
   * Hydrates a session from the persistence port (if configured) into the
   * in-memory Map and returns a copy. Returns null if no persistence is
   * configured or no document exists. Subsequent sync mutations operate on
   * the restored session.
   *
   * Internal counter is bumped to avoid id collisions when minting new ids
   * after restore.
   */
  async function restoreSession(
    sessionId: string,
  ): Promise<OnboardingSession | null> {
    if (!persistence) return null;
    const loaded = await persistence.load(sessionId);
    if (!loaded) return null;
    sessions.set(loaded.sessionId, loaded);
    const m = /^session-(\d+)$/.exec(loaded.sessionId);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > _counter) {
        _counter = n;
      }
    }
    return { ...loaded };
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    startGuestOnboarding,
    startFullOnboarding,
    upgradeGuestToFull,
    completeModule,
    skipModule,
    updatePreferences,
    resume,
    mergeWithExistingAccount,
    getSession,
    restoreSession,
  };
}

export type ClientOnboardingOrchestrator = ReturnType<
  typeof createClientOnboardingOrchestrator
>;
