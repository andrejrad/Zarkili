# Week 16 — Close Report

**Theme:** Client Onboarding Integration v1
**Status:** ✅ COMPLETE — GO for Week 17
**Source spec:** [MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md) §16 (Tasks 16.1, 16.2)

---

## 1. Scope decision (recorded at week-start)

The W16 prompt is functionally about **client onboarding** — orchestrating the
guest → full-account flow, consent posture, and progressive prompting. The
DEBT_REGISTER had 11 candidate items targeting W16; bundling all of them into
a single iteration would have diluted both efforts.

| In-scope this week                                                  | Rationale                                       |
| ------------------------------------------------------------------- | ----------------------------------------------- |
| W16.1 ext — account merge on the orchestrator                       | Only piece of W16.1 not already implemented     |
| W16.2 — consent-safe defaults, skip/resume, preferences             | Net-new, fits the W16 theme                     |
| W11-DEBT-2 — campaign conversion tracking                           | Booking-completion → campaign metrics; small natural addition |
| KI-002 — `purgeExpiredSlotTokens` Cloud Function                    | Pairs with the maintenance-CF lane              |

| Rolled to W17 (dedicated Stripe backend pass) | Rationale                                       |
| --------------------------------------------- | ----------------------------------------------- |
| W13-DEBT-1, W13-DEBT-4, W14-DEBT-1, W14-DEBT-2, W15-DEBT-2 | All five share Stripe SDK + webhook signature scaffolding; shipping together is more efficient than five fragmented patches |

| Rolled forward (next planned target)          | Rationale                                       |
| --------------------------------------------- | ----------------------------------------------- |
| KI-003 — CI emulator wiring                   | Infra concern, deserves its own iteration       |
| KI-004 — separate domain                      | Out of scope                                    |
| W11-DEBT-1 — admin-side campaign UI           | Pulled with consumer-UI plan (Phase 2 W21)      |
| W14-DEBT-5 — optional                         | Stays on backlog                                |

---

## 2. What shipped

### 2.1 Account merge (W16.1 extension)

`src/app/onboarding/clientOnboardingOrchestrator.ts`

- New session mode: `"merged"` (in addition to `"guest"` and `"full"`).
- New `AccountMergeStrategy = "preserve_existing" | "prefer_session"`.
- New method `mergeWithExistingAccount(sessionId, existingUserId, strategy?, existingAccountState?)`:
  - Fails fast: empty `existingUserId` → `INVALID_MERGE_TARGET`; non-guest session → `GUEST_REQUIRED_FOR_UPGRADE`; unknown sessionId → `SESSION_NOT_FOUND`.
  - **Always preserves `bookingContext`** — this is the single most important property of merge.
  - `preserve_existing` (default): unions completed modules from both sides; preferences come from the existing account (folded over `DEFAULT_CONSENT_PREFERENCES`).
  - `prefer_session`: in-flight session values win.
  - Records `mergedAt` and `mergeStrategy` for audit/QA.

### 2.2 Consent + progressive prompting (W16.2)

Same file:

- `ConsentPreferences = { notificationsEnabled, promotionsEnabled, loyaltyOptIn }` — all `false` by default (`DEFAULT_CONSENT_PREFERENCES`).
- All session factories (`startGuestOnboarding`, `startFullOnboarding`, `upgradeGuestToFull`, `mergeWithExistingAccount`) now seed both `skippedModules: []` and `preferences: { ...DEFAULT_CONSENT_PREFERENCES }`.
- New methods:
  - `skipModule(sessionId, module)` — appends to `skippedModules`; throws `MODULE_ALREADY_RESOLVED` if already completed or skipped.
  - `updatePreferences(sessionId, patch)` — shallow-merge; never silently enables a flag.
  - `resume(sessionId)` — returns `{ session, pendingModules }` with the canonical module order, used when the user re-opens the app mid-flow.
- `completeModule` now clears any matching skip — explicit user action wins.
- New error codes: `MODULE_ALREADY_RESOLVED`, `INVALID_MERGE_TARGET`.

Documented in [CLIENT_ONBOARDING_MODULES.md](CLIENT_ONBOARDING_MODULES.md).

### 2.3 Campaign conversion tracking (W11-DEBT-2)

`src/domains/campaigns/{model.ts, repository.ts}`

- `CampaignSendLog` extended with optional `converted`, `conversionRef`, `convertedAt`.
- New `markSendLogConverted(tenantId, logId, conversionRef)`:
  - Idempotent — second call with the same `logId` does not double-count.
  - Atomic update of the log doc + increment of `metrics.converted` on the parent campaign.
  - Throws `SEND_LOG_NOT_FOUND` for unknown `logId`, `TENANT_REQUIRED` for empty tenant.
- New error code `SEND_LOG_NOT_FOUND` added to `CampaignErrorCode`.

### 2.4 Slot-token purge Cloud Function (KI-002)

`functions/src/purgeSlotTokens.ts` (+ exported from `functions/src/index.ts`)

- Pure handler `runSlotTokenPurge(now, db)`:
  - Scans `bookingSlotTokens where date < computeCutoffDate(now, GRACE_DAYS=1)`.
  - Deletes in batches of 400 (well under Firestore's 500-write commit limit).
  - Returns `{ scanned, deleted, cutoff }` for the structured log line.
- `computeCutoffDate(now, graceDays?)` is exported for unit testing across month/year boundaries.
- Scheduled export `purgeExpiredSlotTokens` runs daily at 02:30 UTC (after `dailyBookingReminders` at 01:00 UTC).

---

## 3. Tests

| Suite                                                              | Before  | After   | Δ    |
| ------------------------------------------------------------------ | ------- | ------- | ---- |
| `clientOnboardingOrchestrator.test.ts`                             | 27      | 57      | +30  |
| `campaigns/__tests__/repository.test.ts`                           | 26      | 32      | +6   |
| `functions/test/purgeSlotTokens.test.ts` (vitest)                  | 0       | 9       | +9   |
| **Root jest suite**                                                | **1471**| **1506**| **+35** |

- `npx jest` → **1,506 / 1,506 passing**
- `npx tsc --noEmit` (root + `functions/tsconfig.json`) → 0 errors
- `npx eslint` on changed files → 0 errors (the 1 `console`/`FirebaseFirestore` no-undef in `functions/src/purgeSlotTokens.ts` matches the existing baseline pattern in `scheduledReminders.ts` and `notificationTemplates.ts`)

---

## 4. Security & rules

No Firestore rules changes required.

- Orchestrator state is in-memory.
- `tenants/{tid}/campaignSendLogs/{logId}` already covered by tenant-admin rules from W11.
- `bookingSlotTokens` already covered; the new Cloud Function uses the admin SDK (bypasses rules) which is appropriate for a maintenance task.

---

## 5. Debt outcome

- **Closed:** KI-002, W11-DEBT-2.
- **Rolled to W17 (Stripe backend pass):** W13-DEBT-1, W13-DEBT-4, W14-DEBT-1, W14-DEBT-2, W15-DEBT-2.
- **Net-new W16 debt:** W16-DEBT-1 (orchestrator session persistence — currently `Map`; needs Firestore-backed `userOnboardingDrafts` when wiring the React Native wizard in Phase 2 W21).

See updated [DEBT_REGISTER.md](DEBT_REGISTER.md).

---

## 6. Files changed

```
src/app/onboarding/clientOnboardingOrchestrator.ts
src/app/onboarding/__tests__/clientOnboardingOrchestrator.test.ts
src/domains/campaigns/model.ts
src/domains/campaigns/repository.ts
src/domains/campaigns/__tests__/repository.test.ts
functions/src/index.ts
functions/src/purgeSlotTokens.ts                              (new)
functions/test/purgeSlotTokens.test.ts                        (new)
documentation/new-platform/CLIENT_ONBOARDING_MODULES.md       (new)
documentation/new-platform/WEEK16_CLOSE_REPORT.md             (new)
documentation/new-platform/DEBT_REGISTER.md                   (updated)
documentation/new-platform/WEEKLY_LOG.md                      (W16 entry appended)
documentation/new-platform/PROGRAM_TRACKING_BOARD.md          (D-068 … D-071 appended)
```

---

## 7. Week 17 — handoff

Theme: **Stripe backend pass** (the bundled rollover from W13/W14/W15).

1. `stripeWebhookHandler` Cloud Function — instantiate `createSubscriptionService` + `createConnectService`, dispatch `applyWebhookEvent` / `applyAccountEvent`, verify Stripe signature.
2. `cancelAtPeriodEnd=true` end-to-end coverage through the webhook path.
3. `stripeTaxCalculate` Cloud Function — Stripe Tax API + TTL semantics matching `createLocalTaxProvider`.
4. Cloud Scheduler invoking `tickExpiry` hourly.
5. Production wiring of `OnboardingAdminService.trialExtender` to the trial domain.

All five items share Stripe SDK setup + signature-verification scaffolding —
that is the rationale for bundling them into one focused week.
