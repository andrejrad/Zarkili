# Client Onboarding Modules — W16

> Reference for the unified client onboarding orchestrator
> (`src/app/onboarding/clientOnboardingOrchestrator.ts`).
> Audience: client app developers, growth/product, support.

---

## 1. Goals

A single orchestration layer for every client-side onboarding entry point so
that:

1. Booking, save, like, message, and direct sign-up all create the same
   `OnboardingSession` shape.
2. Booking context is **never lost** when a guest converts to a full account
   (or merges into an existing account).
3. Consent is **always opt-in** — no notification or marketing channel is
   enabled until the user explicitly turns it on.
4. The user can **skip and resume** optional steps without losing progress.

---

## 2. Session modes

| Mode      | Created via                                | Has `userId`? |
| --------- | ------------------------------------------ | ------------- |
| `guest`   | `startGuestOnboarding(bookingCtx)`         | No            |
| `full`    | `startFullOnboarding(creds, tenantId)`     | Yes           |
| `merged`  | `mergeWithExistingAccount(sessionId, …)`   | Yes (existing)|

A guest session can transition to `full` via `upgradeGuestToFull` (new account
provisioned in-flight) or to `merged` via `mergeWithExistingAccount` (a
pre-existing account claims the booking).

---

## 3. Modules

| Module          | Purpose                                       | Required? |
| --------------- | --------------------------------------------- | --------- |
| `profile`       | First name, last name, optional avatar        | Optional  |
| `payment`       | Save card-on-file via Stripe SetupIntent      | Optional  |
| `preferences`   | Service-specific preferences (length, allergies, etc.) | Optional |
| `notifications` | Channel choice (push/email) + reminder window | Optional  |
| `loyalty`       | Loyalty enrolment, rewards opt-in             | Optional  |

Each module is independently completable via `completeModule(sessionId, module)`
or skippable via `skipModule(sessionId, module)`.

`resume(sessionId)` returns the canonical pending list — the wizard uses this
when the user re-opens the app mid-flow.

---

## 4. Consent posture (defaults)

`DEFAULT_CONSENT_PREFERENCES` is the authoritative shape:

```ts
{
  notificationsEnabled: false,  // transactional pushes/emails
  promotionsEnabled:    false,  // marketing
  loyaltyOptIn:         false,  // loyalty programme membership
}
```

These defaults are applied on every session creation regardless of mode.
The user must explicitly call `updatePreferences(...)` to enable any flag.

This matches the GDPR / GenZ-trust posture documented in the
`AI_FIRST_GENZ_DESIGN_PLAYBOOK.md` and the `MULTITENANT_STRATEGY` consent
chapter.

---

## 5. Account merge strategies

When a guest tries to convert and the email already maps to an existing
account, callers invoke `mergeWithExistingAccount(sessionId, existingUserId,
strategy, existingAccountState?)`:

| Strategy            | Completed modules                              | Preferences                            |
| ------------------- | ---------------------------------------------- | -------------------------------------- |
| `preserve_existing` | Union of existing-account ∪ in-flight session  | Existing account values win            |
| `prefer_session`    | In-flight session values only                  | In-flight session values win           |

`bookingContext` is **always** preserved — that is the entire point of merge.

`mergedAt` and `mergeStrategy` are written to the session for audit/QA.

---

## 6. Public API surface

```ts
type ClientOnboardingOrchestrator = {
  startGuestOnboarding(ctx: GuestBookingContext): OnboardingSession;
  startFullOnboarding(creds, tenantId, modules?): OnboardingSession;
  upgradeGuestToFull(sessionId, creds): OnboardingSession;

  completeModule(sessionId, module): OnboardingSession;
  skipModule(sessionId, module): OnboardingSession;
  updatePreferences(sessionId, patch): OnboardingSession;

  resume(sessionId): { session, pendingModules };
  mergeWithExistingAccount(sessionId, existingUserId, strategy?, state?): OnboardingSession;
  getSession(sessionId): OnboardingSession | undefined;
};
```

All return values are deep copies — callers cannot accidentally mutate stored
state.

---

## 7. Error contract

```ts
type ClientOnboardingOrchestratorError =
  | "SESSION_NOT_FOUND"
  | "GUEST_REQUIRED_FOR_UPGRADE"
  | "ALREADY_FULL_ACCOUNT"
  | "MODULE_ALREADY_COMPLETED"
  | "MODULE_ALREADY_RESOLVED"
  | "INVALID_BOOKING_CONTEXT"
  | "INVALID_MERGE_TARGET";
```

The orchestrator throws plain `Error` instances whose `message` equals one of
the codes above so callers can `catch` and `switch` on `err.message`.

---

## 8. Storage notes (W16 → W17)

The current implementation is **in-memory** (`Map<sessionId, OnboardingSession>`)
because session lifetimes are short and confined to a single device process.
Persistence to `userOnboardingDrafts` (Firestore) is tracked as `W16-DEBT-1`
and will be wired up in a later week alongside cross-device resume.
