/**
 * clientOnboardingOrchestrator.test.ts
 *
 * Tests for:
 *   - Guest onboarding session creation
 *   - Full onboarding session creation
 *   - Guest-to-full account upgrade (data continuity)
 *   - Module completion tracking
 *   - Error paths
 */

import {
  createClientOnboardingOrchestrator,
  DEFAULT_CONSENT_PREFERENCES,
  type GuestBookingContext,
  type FullOnboardingCredentials,
} from "../clientOnboardingOrchestrator";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BOOKING_CTX: GuestBookingContext = {
  bookingId: "book-1",
  tenantId: "salon-A",
  serviceId: "svc-haircut",
  slotAt: "2025-09-15T10:00:00Z",
  email: "guest@example.com",
  phone: "+386 41 123 456",
};

const FULL_CREDS: FullOnboardingCredentials = {
  userId: "user-99",
  email: "full@example.com",
  authProvider: "email",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function newOrchestrator() {
  return createClientOnboardingOrchestrator();
}

// ---------------------------------------------------------------------------
// startGuestOnboarding
// ---------------------------------------------------------------------------

describe("startGuestOnboarding", () => {
  it("creates a guest session with mode='guest'", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    expect(session.mode).toBe("guest");
  });

  it("assigns a unique sessionId", () => {
    const orc = newOrchestrator();
    const s1 = orc.startGuestOnboarding(BOOKING_CTX);
    const s2 = orc.startGuestOnboarding({ ...BOOKING_CTX, bookingId: "book-2" });
    expect(s1.sessionId).not.toBe(s2.sessionId);
  });

  it("preserves booking context in session", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    expect(session.bookingContext).toEqual(BOOKING_CTX);
  });

  it("preserves email and phone", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    expect(session.email).toBe("guest@example.com");
    expect(session.phone).toBe("+386 41 123 456");
  });

  it("starts with no completed modules", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    expect(session.completedModules).toEqual([]);
  });

  it("does not set userId for guest sessions", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    expect(session.userId).toBeUndefined();
  });

  it("throws INVALID_BOOKING_CONTEXT when bookingId is empty", () => {
    const orc = newOrchestrator();
    expect(() =>
      orc.startGuestOnboarding({ ...BOOKING_CTX, bookingId: "" }),
    ).toThrow("INVALID_BOOKING_CONTEXT");
  });

  it("throws INVALID_BOOKING_CONTEXT when email is empty", () => {
    const orc = newOrchestrator();
    expect(() =>
      orc.startGuestOnboarding({ ...BOOKING_CTX, email: "" }),
    ).toThrow("INVALID_BOOKING_CONTEXT");
  });
});

// ---------------------------------------------------------------------------
// startFullOnboarding
// ---------------------------------------------------------------------------

describe("startFullOnboarding", () => {
  it("creates a full-account session with mode='full'", () => {
    const orc = newOrchestrator();
    const session = orc.startFullOnboarding(FULL_CREDS, "salon-A");
    expect(session.mode).toBe("full");
  });

  it("assigns userId from credentials", () => {
    const orc = newOrchestrator();
    const session = orc.startFullOnboarding(FULL_CREDS, "salon-A");
    expect(session.userId).toBe("user-99");
  });

  it("does not have a bookingContext by default", () => {
    const orc = newOrchestrator();
    const session = orc.startFullOnboarding(FULL_CREDS, "salon-A");
    expect(session.bookingContext).toBeUndefined();
  });

  it("accepts pre-seeded completed modules", () => {
    const orc = newOrchestrator();
    const session = orc.startFullOnboarding(FULL_CREDS, "salon-A", ["profile"]);
    expect(session.completedModules).toContain("profile");
  });

  it("throws INVALID_BOOKING_CONTEXT when userId is empty", () => {
    const orc = newOrchestrator();
    expect(() =>
      orc.startFullOnboarding({ ...FULL_CREDS, userId: "" }, "salon-A"),
    ).toThrow("INVALID_BOOKING_CONTEXT");
  });
});

// ---------------------------------------------------------------------------
// upgradeGuestToFull
// ---------------------------------------------------------------------------

describe("upgradeGuestToFull", () => {
  it("converts session mode to 'full'", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    const upgraded = orc.upgradeGuestToFull(guest.sessionId, FULL_CREDS);
    expect(upgraded.mode).toBe("full");
  });

  it("assigns userId after upgrade", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    const upgraded = orc.upgradeGuestToFull(guest.sessionId, FULL_CREDS);
    expect(upgraded.userId).toBe("user-99");
  });

  it("preserves bookingContext after upgrade (data continuity)", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    const upgraded = orc.upgradeGuestToFull(guest.sessionId, FULL_CREDS);
    expect(upgraded.bookingContext).toEqual(BOOKING_CTX);
    expect(upgraded.bookingContext?.bookingId).toBe("book-1");
  });

  it("preserves previously completed modules after upgrade", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    orc.completeModule(guest.sessionId, "loyalty");
    const upgraded = orc.upgradeGuestToFull(guest.sessionId, FULL_CREDS);
    expect(upgraded.completedModules).toContain("loyalty");
  });

  it("sets upgradedAt timestamp", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    const upgraded = orc.upgradeGuestToFull(guest.sessionId, FULL_CREDS);
    expect(upgraded.upgradedAt).toBeDefined();
    expect(typeof upgraded.upgradedAt).toBe("number");
  });

  it("the same sessionId is still valid after upgrade", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    orc.upgradeGuestToFull(guest.sessionId, FULL_CREDS);
    const retrieved = orc.getSession(guest.sessionId);
    expect(retrieved?.mode).toBe("full");
  });

  it("throws SESSION_NOT_FOUND for unknown sessionId", () => {
    const orc = newOrchestrator();
    expect(() =>
      orc.upgradeGuestToFull("no-such-session", FULL_CREDS),
    ).toThrow("SESSION_NOT_FOUND");
  });

  it("throws GUEST_REQUIRED_FOR_UPGRADE when session is already full", () => {
    const orc = newOrchestrator();
    const full = orc.startFullOnboarding(FULL_CREDS, "salon-A");
    expect(() =>
      orc.upgradeGuestToFull(full.sessionId, FULL_CREDS),
    ).toThrow("GUEST_REQUIRED_FOR_UPGRADE");
  });
});

// ---------------------------------------------------------------------------
// completeModule
// ---------------------------------------------------------------------------

describe("completeModule", () => {
  it("adds module to completedModules", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    const updated = orc.completeModule(guest.sessionId, "profile");
    expect(updated.completedModules).toContain("profile");
  });

  it("accumulates multiple modules in order", () => {
    const orc = newOrchestrator();
    const session = orc.startFullOnboarding(FULL_CREDS, "salon-A");
    orc.completeModule(session.sessionId, "profile");
    orc.completeModule(session.sessionId, "payment");
    const s = orc.getSession(session.sessionId)!;
    expect(s.completedModules).toEqual(["profile", "payment"]);
  });

  it("all 5 modules can be completed", () => {
    const orc = newOrchestrator();
    const session = orc.startFullOnboarding(FULL_CREDS, "salon-A");
    const modules = ["profile", "payment", "preferences", "notifications", "loyalty"] as const;
    modules.forEach((m) => orc.completeModule(session.sessionId, m));
    const s = orc.getSession(session.sessionId)!;
    expect(s.completedModules).toHaveLength(5);
  });

  it("throws MODULE_ALREADY_COMPLETED on duplicate", () => {
    const orc = newOrchestrator();
    const session = orc.startFullOnboarding(FULL_CREDS, "salon-A");
    orc.completeModule(session.sessionId, "loyalty");
    expect(() =>
      orc.completeModule(session.sessionId, "loyalty"),
    ).toThrow("MODULE_ALREADY_COMPLETED");
  });

  it("throws SESSION_NOT_FOUND for unknown sessionId", () => {
    const orc = newOrchestrator();
    expect(() =>
      orc.completeModule("ghost-session", "profile"),
    ).toThrow("SESSION_NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// getSession
// ---------------------------------------------------------------------------

describe("getSession", () => {
  it("returns undefined for unknown sessionId", () => {
    const orc = newOrchestrator();
    expect(orc.getSession("nope")).toBeUndefined();
  });

  it("returns a copy (mutations do not affect stored session)", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    const retrieved = orc.getSession(session.sessionId)!;
    // Mutate the returned copy
    (retrieved as { mode: string }).mode = "full";
    // Stored session must be unchanged
    const stored = orc.getSession(session.sessionId)!;
    expect(stored.mode).toBe("guest");
  });
});

// ---------------------------------------------------------------------------
// W16.2 — consent-safe defaults
// ---------------------------------------------------------------------------

describe("consent-safe defaults (W16.2)", () => {
  it("guest sessions start with notifications/promotions/loyalty all off", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    expect(session.preferences).toEqual(DEFAULT_CONSENT_PREFERENCES);
    expect(session.preferences.notificationsEnabled).toBe(false);
    expect(session.preferences.promotionsEnabled).toBe(false);
    expect(session.preferences.loyaltyOptIn).toBe(false);
  });

  it("full sessions start with consent-safe defaults", () => {
    const orc = newOrchestrator();
    const session = orc.startFullOnboarding(FULL_CREDS, "salon-A");
    expect(session.preferences).toEqual(DEFAULT_CONSENT_PREFERENCES);
  });

  it("guest sessions start with empty skippedModules", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    expect(session.skippedModules).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// W16.2 — skipModule (progressive prompting)
// ---------------------------------------------------------------------------

describe("skipModule (W16.2)", () => {
  it("appends to skippedModules", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    const updated = orc.skipModule(session.sessionId, "loyalty");
    expect(updated.skippedModules).toContain("loyalty");
  });

  it("skipped modules are not added to completedModules", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    const updated = orc.skipModule(session.sessionId, "loyalty");
    expect(updated.completedModules).not.toContain("loyalty");
  });

  it("throws MODULE_ALREADY_RESOLVED when skipping the same module twice", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    orc.skipModule(session.sessionId, "loyalty");
    expect(() => orc.skipModule(session.sessionId, "loyalty")).toThrow(
      "MODULE_ALREADY_RESOLVED",
    );
  });

  it("throws MODULE_ALREADY_RESOLVED when skipping a completed module", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    orc.completeModule(session.sessionId, "profile");
    expect(() => orc.skipModule(session.sessionId, "profile")).toThrow(
      "MODULE_ALREADY_RESOLVED",
    );
  });

  it("throws SESSION_NOT_FOUND for unknown sessionId", () => {
    const orc = newOrchestrator();
    expect(() => orc.skipModule("ghost", "loyalty")).toThrow("SESSION_NOT_FOUND");
  });

  it("completing a previously skipped module clears the skip", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    orc.skipModule(session.sessionId, "loyalty");
    const completed = orc.completeModule(session.sessionId, "loyalty");
    expect(completed.completedModules).toContain("loyalty");
    expect(completed.skippedModules).not.toContain("loyalty");
  });
});

// ---------------------------------------------------------------------------
// W16.2 — updatePreferences
// ---------------------------------------------------------------------------

describe("updatePreferences (W16.2)", () => {
  it("shallow-merges patch over current preferences", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    const updated = orc.updatePreferences(session.sessionId, {
      notificationsEnabled: true,
    });
    expect(updated.preferences.notificationsEnabled).toBe(true);
    // Other fields preserved at their default
    expect(updated.preferences.promotionsEnabled).toBe(false);
    expect(updated.preferences.loyaltyOptIn).toBe(false);
  });

  it("supports turning multiple flags on at once", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    const updated = orc.updatePreferences(session.sessionId, {
      notificationsEnabled: true,
      loyaltyOptIn: true,
    });
    expect(updated.preferences.notificationsEnabled).toBe(true);
    expect(updated.preferences.loyaltyOptIn).toBe(true);
    expect(updated.preferences.promotionsEnabled).toBe(false);
  });

  it("supports opting back out", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    orc.updatePreferences(session.sessionId, { notificationsEnabled: true });
    const off = orc.updatePreferences(session.sessionId, { notificationsEnabled: false });
    expect(off.preferences.notificationsEnabled).toBe(false);
  });

  it("throws SESSION_NOT_FOUND for unknown sessionId", () => {
    const orc = newOrchestrator();
    expect(() =>
      orc.updatePreferences("ghost", { notificationsEnabled: true }),
    ).toThrow("SESSION_NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// W16.2 — resume
// ---------------------------------------------------------------------------

describe("resume (W16.2)", () => {
  it("returns the session and pendingModules in canonical order", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    const { session: s, pendingModules } = orc.resume(session.sessionId);
    expect(s.sessionId).toBe(session.sessionId);
    expect(pendingModules).toEqual([
      "profile",
      "payment",
      "preferences",
      "notifications",
      "loyalty",
    ]);
  });

  it("excludes completed modules from pendingModules", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    orc.completeModule(session.sessionId, "profile");
    const { pendingModules } = orc.resume(session.sessionId);
    expect(pendingModules).not.toContain("profile");
    expect(pendingModules).toHaveLength(4);
  });

  it("excludes skipped modules from pendingModules", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    orc.skipModule(session.sessionId, "loyalty");
    const { pendingModules } = orc.resume(session.sessionId);
    expect(pendingModules).not.toContain("loyalty");
  });

  it("returns empty pendingModules when all modules are resolved", () => {
    const orc = newOrchestrator();
    const session = orc.startGuestOnboarding(BOOKING_CTX);
    orc.completeModule(session.sessionId, "profile");
    orc.completeModule(session.sessionId, "payment");
    orc.skipModule(session.sessionId, "preferences");
    orc.skipModule(session.sessionId, "notifications");
    orc.skipModule(session.sessionId, "loyalty");
    const { pendingModules } = orc.resume(session.sessionId);
    expect(pendingModules).toEqual([]);
  });

  it("throws SESSION_NOT_FOUND for unknown sessionId", () => {
    const orc = newOrchestrator();
    expect(() => orc.resume("ghost")).toThrow("SESSION_NOT_FOUND");
  });
});

// ---------------------------------------------------------------------------
// W16.1 — mergeWithExistingAccount
// ---------------------------------------------------------------------------

describe("mergeWithExistingAccount (W16.1)", () => {
  it("sets mode='merged' and assigns existingUserId", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    const merged = orc.mergeWithExistingAccount(guest.sessionId, "user-existing");
    expect(merged.mode).toBe("merged");
    expect(merged.userId).toBe("user-existing");
  });

  it("preserves bookingContext after merge (data continuity)", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    const merged = orc.mergeWithExistingAccount(guest.sessionId, "user-existing");
    expect(merged.bookingContext).toEqual(BOOKING_CTX);
    expect(merged.bookingContext?.bookingId).toBe("book-1");
  });

  it("sets mergedAt timestamp", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    const merged = orc.mergeWithExistingAccount(guest.sessionId, "user-existing");
    expect(merged.mergedAt).toBeDefined();
    expect(typeof merged.mergedAt).toBe("number");
  });

  it("'preserve_existing' (default) honors existing-account preferences", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    // Session preferences set to true
    orc.updatePreferences(guest.sessionId, { notificationsEnabled: true });
    const merged = orc.mergeWithExistingAccount(
      guest.sessionId,
      "user-existing",
      "preserve_existing",
      { preferences: { notificationsEnabled: false, promotionsEnabled: true } },
    );
    // Existing account values win
    expect(merged.preferences.notificationsEnabled).toBe(false);
    expect(merged.preferences.promotionsEnabled).toBe(true);
  });

  it("'preserve_existing' merges completed modules from both sides", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    orc.completeModule(guest.sessionId, "loyalty");
    const merged = orc.mergeWithExistingAccount(
      guest.sessionId,
      "user-existing",
      "preserve_existing",
      { completedModules: ["profile", "payment"] },
    );
    expect(merged.completedModules).toEqual(
      expect.arrayContaining(["profile", "payment", "loyalty"]),
    );
  });

  it("'prefer_session' keeps session preferences and completed modules", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    orc.updatePreferences(guest.sessionId, { notificationsEnabled: true, loyaltyOptIn: true });
    orc.completeModule(guest.sessionId, "loyalty");
    const merged = orc.mergeWithExistingAccount(
      guest.sessionId,
      "user-existing",
      "prefer_session",
      { completedModules: ["profile"], preferences: { notificationsEnabled: false } },
    );
    expect(merged.preferences.notificationsEnabled).toBe(true);
    expect(merged.preferences.loyaltyOptIn).toBe(true);
    expect(merged.completedModules).toEqual(["loyalty"]);
  });

  it("records the strategy used", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    const merged = orc.mergeWithExistingAccount(guest.sessionId, "user-x", "prefer_session");
    expect(merged.mergeStrategy).toBe("prefer_session");
  });

  it("throws INVALID_MERGE_TARGET when existingUserId is empty", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    expect(() => orc.mergeWithExistingAccount(guest.sessionId, "")).toThrow(
      "INVALID_MERGE_TARGET",
    );
  });

  it("throws GUEST_REQUIRED_FOR_UPGRADE when session is already full", () => {
    const orc = newOrchestrator();
    const full = orc.startFullOnboarding(FULL_CREDS, "salon-A");
    expect(() => orc.mergeWithExistingAccount(full.sessionId, "user-x")).toThrow(
      "GUEST_REQUIRED_FOR_UPGRADE",
    );
  });

  it("throws SESSION_NOT_FOUND for unknown sessionId", () => {
    const orc = newOrchestrator();
    expect(() => orc.mergeWithExistingAccount("ghost", "user-x")).toThrow(
      "SESSION_NOT_FOUND",
    );
  });

  it("merged session is retrievable via getSession with mode='merged'", () => {
    const orc = newOrchestrator();
    const guest = orc.startGuestOnboarding(BOOKING_CTX);
    orc.mergeWithExistingAccount(guest.sessionId, "user-x");
    const retrieved = orc.getSession(guest.sessionId);
    expect(retrieved?.mode).toBe("merged");
  });
});
