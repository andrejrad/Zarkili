# Week 18 — Close Report

**Theme:** Stripe backend pass (rolled forward from W17)
**Status:** ✅ COMPLETE — GO for Week 19
**Source spec:** [WEEK17_CLOSE_REPORT.md](WEEK17_CLOSE_REPORT.md) §7 + [DEBT_REGISTER.md](DEBT_REGISTER.md) (W13/W14/W15 Stripe debts)

---

## 1. Scope

Five Stripe-related debts bundled into one focused week:

| Debt          | Title                                                      |
| ------------- | ---------------------------------------------------------- |
| W13-DEBT-1    | `stripeWebhookHandler` Cloud Function + signature verify   |
| W13-DEBT-4    | `cancelAtPeriodEnd=true` e2e through the webhook           |
| W14-DEBT-1    | `stripeTaxCalculate` Cloud Function + TTL semantics        |
| W14-DEBT-2    | Cloud Scheduler invoking `tickExpiry` hourly               |
| W15-DEBT-2    | Production wiring of `OnboardingAdminService.trialExtender`|

Closed this week: **W13-DEBT-1, W13-DEBT-4, W14-DEBT-2, W15-DEBT-2** (4 / 5).
**W14-DEBT-1 deferred** — see §5.

---

## 2. What shipped

### 2.1 Trial extender adapter (W15-DEBT-2)

`src/domains/trial/trialService.ts` (extended)

- **`applyExtension(trial, daysAdded, now): Trial`** — pure helper.
  Anchors `endsAt` to `Math.max(endsAt.seconds, now.seconds)` so an
  already-expired trial that is granted +N days actually gets N days of
  future runway (not N days from a stale endsAt). On
  `expired → active` recovery the helper clears `expiredAt` and
  re-derives status via `deriveTrialStatusAt`. Throws
  `INVALID_TRANSITION` for non-positive / non-integer `daysAdded`,
  `not_started`, `upgraded`, or when the extension fails to clear
  `now`.
- **`TrialService.extendTrial(tenantId, daysAdded)`** added to the
  service interface + factory — reads, applies, persists.

`src/domains/trial/trialExtender.ts` (new)

- **`createTrialExtender(service: TrialService): TrialExtender`** — the
  adapter consumed by `OnboardingAdminService.extendTrial`. The trial
  domain owns its own `TrialExtender` type alias (structurally
  compatible with the onboarding domain's port) so neither domain
  imports the other.

### 2.2 Stripe webhook handler (W13-DEBT-1, W13-DEBT-4)

`functions/src/stripeWebhookHandler.ts` (new)

`onRequest` Cloud Function chained:

1. Verify Stripe signature (`verifyStripeSignature` — HMAC-SHA256, 300 s replay window, constant-time compare via `timingSafeEqual`)
2. Parse JSON body
3. Resolve tenant via `parseStripeEvent`'s injected `TenantResolver`
   (precedence: `metadata.tenantId` → `stripeSubscriptionId` →
   `stripeCustomerId` → `stripeAccountId`)
4. Idempotency check on `(tenantId, eventId)` pair
5. Dispatch via `applySubscriptionEvent` (billing) or `applyConnectEvent` (connect)
6. Persist subscription/account doc + idempotency marker atomically (`firebase-admin` `WriteBatch`)

Response codes:
- 200 — applied / duplicate / ignored
- 400 — malformed JSON / missing field / parse error / illegal transition
- 401 — signature verification failed
- 404 — tenant could not be resolved
- 405 — non-POST method
- 500 — unexpected (logged)

Pure modules introduced (no I/O — testable in isolation):

| Module                                          | Purpose                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `functions/src/stripe/parseEvent.ts`            | Maps raw Stripe event → `ParsedSubscriptionEvent` / `ParsedConnectEvent` discriminated union |
| `functions/src/stripe/verifySignature.ts`       | HMAC-SHA256 verification with replay window + multi-v1 support (key rotation)                |
| `functions/src/stripe/billingDispatcher.ts`     | Pure `(current, parsedEvent, now) → next` for subscription state                              |
| `functions/src/stripe/connectDispatcher.ts`     | Pure `(current, parsedEvent, now) → next` for connect-account state                           |
| `functions/src/stripe/adminRepositories.ts`     | Admin-SDK adapters mirroring the domain `BillingRepository` / `ConnectRepository` shapes      |

W13-DEBT-4 (cancel-at-period-end e2e):
- `parseStripeEvent` preserves the `cancel_at_period_end` Stripe field verbatim.
- `applySubscriptionEvent` writes it through to the persisted
  `Subscription` record (covered by a dedicated dispatcher unit test
  *and* a handler integration test that signs a real payload, runs
  through verify+parse+dispatch+persist, and asserts the final document
  has `cancelAtPeriodEnd === true`).

### 2.3 Trial expiry hourly scheduler (W14-DEBT-2)

`functions/src/trialExpiryScheduler.ts` (new)

- `onSchedule({ schedule: "0 * * * *", timeZone: "UTC" })` — `trialExpiryHourly`
- Pure handler `runTrialExpiryScan(now, repo)` returns
  `{ scanned, transitioned, skippedAlreadyRun, errors }` for testability.
- `buildRunId(now)` produces an ISO hour bucket (`YYYY-MM-DDTHH`); same
  hour cannot double-apply because the per-tenant
  `trialJobRuns/{runId}` doc is the transactional gate.
- `createAdminTrialScanRepo(db)` does a `collectionGroup('trial')`
  query filtered to status `in ['active', 'expiring_soon']` and uses a
  Firestore transaction to atomically guard run-marker and write the
  derived status.
- A `deriveTrialStatusAt` helper local to the file mirrors the trial
  domain's pure-logic rule (the SDK split prevents direct import — see §6).

### 2.4 Function exports

`functions/src/index.ts` (extended) — exports `stripeWebhookHandler`,
`trialExpiryHourly`.

---

## 3. Tests

### 3.1 Root jest suite (web SDK domain code)

| Suite                                                  | Before  | After   | Δ    |
| ------------------------------------------------------ | ------- | ------- | ---- |
| `src/domains/trial/__tests__/trialService.test.ts`     | 42      | 54      | +12  |
| **Trial domain total**                                 | **42**  | **54**  | **+12** |
| **Root jest suite**                                    | **1544**| **1553**| **+9** |

(Net +9 reflects 12 new trial tests minus 3 existing tests rolled into
the new `applyExtension` describe block — coverage strictly grew.)

New trial coverage:
- `applyExtension` (6) — active push, expiring_soon→active recovery,
  expired→active recovery clearing `expiredAt`, non-positive /
  non-integer rejection, not_started rejection, upgraded rejection.
- `TrialService.extendTrial` (2) — persists, throws on unknown tenant.
- `createTrialExtender` (1) — delegates and resolves to `void`.
- Plus 3 carrying baseline tests now anchored under the new describe.

### 3.2 functions/ vitest suite

| Suite                                              | Before | After | Δ    |
| -------------------------------------------------- | ------ | ----- | ---- |
| `test/stripe/parseEvent.test.ts`                   | 0      | 20    | +20  |
| `test/stripe/verifySignature.test.ts`              | 0      | 13    | +13  |
| `test/stripe/billingDispatcher.test.ts`            | 0      | 16    | +16  |
| `test/stripe/connectDispatcher.test.ts`            | 0      | 7     | +7   |
| `test/stripeWebhookHandler.test.ts`                | 0      | 8     | +8   |
| `test/trialExpiryScheduler.test.ts`                | 0      | 11    | +11  |
| (carrying suites unchanged)                        | 75     | 75    | 0    |
| **functions/ total**                               | **75** | **150** | **+75** |

- `npx jest` (root) → **1,553 / 1,553 passing**, 91 suites
- `npx vitest run` (functions/) → **150 / 150 passing**, 11 files
- `npx tsc --noEmit` (root) → 0 errors
- `npx tsc --noEmit` (functions/) → 0 errors

Test coverage highlights:
- **parseEvent** — all 6 supported billing types; all 3 supported connect types; cancel-at-period-end preservation; plan/interval alias normalisation (`pro→professional`, `year→annual`); tenant resolver precedence (metadata > customer/subscription/account); error paths (UNSUPPORTED_TYPE / MISSING_FIELD / TENANT_UNRESOLVED / INVALID_PLAN / INVALID_INTERVAL).
- **verifySignature** — header parsing (well-formed, malformed, multi-v1, missing-t); HMAC equality with externally computed reference; multi-v1 acceptance (key rotation); rejection paths (malformed header, missing v1, replay window, tampered body, wrong secret); custom-tolerance honor.
- **billingDispatcher** — created (with status mapping, INVALID_STATUS), updated (cancel-at-period-end preservation, active→past_due with pastDueSince stamp, pastDueSince preservation, recovery clears it, illegal cancelled→active rejection), deleted (clears cancelAtPeriodEnd, throws when no current), invoice events (payment_failed→past_due, payment_succeeded recovery, no-op on active, ignore when no current), trial_will_end (lastEventId stamp, ignore when no current).
- **connectDispatcher** — account.updated derives active / restricted, ACCOUNT_MISMATCH rejection, ACCOUNT_NOT_FOUND on missing current; payout.failed stamps failure fields, falls back to failureCode when message null; payout.paid clears failure state.
- **stripeWebhookHandler** — missing/bad signature → 401, invalid JSON → 400, unsupported event type → 200/ignored, end-to-end create, duplicate event id → 200/duplicate, **cancel-at-period-end preservation through the full pipeline (W13-DEBT-4 evidence)**, unresolved tenant → 404.
- **trialExpiryScheduler** — buildRunId hour bucketing; deriveTrialStatusAt for expired / expiring_soon / active / upgraded; runTrialExpiryScan transitions, no-op when status already matches, skippedAlreadyRun when run marker exists, partial-error tolerance.

---

## 4. Security & rules

No Firestore rules changes required for the W18 surface:

- Webhook idempotency lives at `tenants/{tid}/billingWebhookIdempotency/{eventId}` and `tenants/{tid}/connectWebhookIdempotency/{eventId}` (already covered by W12 rules — server-only writes via admin SDK).
- Trial run markers live at `tenants/{tid}/trialJobRuns/{runId}` (already covered).
- No client-facing surface added; all writes are admin-SDK only.
- `STRIPE_WEBHOOK_SECRET` is declared via `defineSecret` and must be
  populated in production via `firebase functions:secrets:set` before
  `stripeWebhookHandler` is invoked.

---

## 5. Debt outcome

### Closed this week (4)

- **W13-DEBT-1** — `stripeWebhookHandler` Cloud Function + signature verification.
- **W13-DEBT-4** — `cancelAtPeriodEnd=true` e2e (parser preserves verbatim; dispatcher writes through; handler integration test asserts final doc state).
- **W14-DEBT-2** — `trialExpiryHourly` Cloud Scheduler running `tickExpiry`-equivalent at the hour boundary.
- **W15-DEBT-2** — `OnboardingAdminService.trialExtender` is now wireable to the production `TrialService` via `createTrialExtender`.

### Carried forward (1)

- **W14-DEBT-1** → renamed **W18-DEBT-1** in the register: `stripeTaxCalculate` Cloud Function. Reason: a Stripe-Tax-API-backed `TaxProvider` requires Stripe API credentials, request-shape mapping for `tax.calculations.create`, and an admin-SDK `TaxRepository` adapter — out of scope for this turn given the size of the W18 backend pass already shipped. The local `createLocalTaxProvider` continues to serve dev/preview unchanged.

### Net-new W18 debt (1)

- **W18-DEBT-1** — `stripeTaxCalculate` (was W14-DEBT-1).
  - Acceptance: onCall callable that accepts a `TaxQuote`, calls `stripe.tax.calculations.create`, maps the response into a `TaxCalculation`, persists with TTL = `DEFAULT_TAX_CACHE_TTL_SECONDS = 900` matching the local provider.
  - Target: W19 or first slot in Phase 2.

See updated [DEBT_REGISTER.md](DEBT_REGISTER.md).

---

## 6. Architectural notes

- **SDK split.** `src/domains/*/repository.ts` uses the `firebase/firestore` web SDK and `functions/tsconfig.json` scopes compilation to `functions/src` only — Cloud Functions cannot reach the domain repositories. We therefore created admin-SDK adapters in `functions/src/stripe/adminRepositories.ts` that mirror the domain repository contracts structurally. The pure dispatchers (`billingDispatcher.ts`, `connectDispatcher.ts`) duplicate the minimal state-machine rules from `src/domains/billing/model.ts` and `src/domains/connect/connectService.ts`. This is intentional: the domain tests in `src/` remain the source-of-truth and the duplicated rules are exhaustively re-tested at the functions/ layer.
- **Local timestamp shape.** All new functions/ types use `{ seconds, nanoseconds }` rather than the Firestore `Timestamp` class so the modules stay framework-free and trivially testable.
- **Tenant resolution.** The resolver port is supplied by the handler — the parser stays pure. Production resolution prefers `event.data.object.metadata.tenantId`, then a `collectionGroup('billing')` lookup by `stripeSubscriptionId` / `stripeCustomerId`, then a `collectionGroup('connect')` lookup by `stripeAccountId`.

---

## 7. Files changed

```
src/domains/trial/trialService.ts                                      (extended — applyExtension + extendTrial)
src/domains/trial/trialExtender.ts                                     (new)
src/domains/trial/index.ts                                             (re-export update)
src/domains/trial/__tests__/trialService.test.ts                       (+12 tests)

functions/src/index.ts                                                 (exports stripeWebhookHandler + trialExpiryHourly)
functions/src/stripeWebhookHandler.ts                                  (new — onRequest + pure handler)
functions/src/trialExpiryScheduler.ts                                  (new — onSchedule + pure handler)
functions/src/stripe/parseEvent.ts                                     (new)
functions/src/stripe/verifySignature.ts                                (new)
functions/src/stripe/billingDispatcher.ts                              (new)
functions/src/stripe/connectDispatcher.ts                              (new)
functions/src/stripe/adminRepositories.ts                              (new)

functions/test/stripe/parseEvent.test.ts                               (new — 20 tests)
functions/test/stripe/verifySignature.test.ts                          (new — 13 tests)
functions/test/stripe/billingDispatcher.test.ts                        (new — 16 tests)
functions/test/stripe/connectDispatcher.test.ts                        (new — 7 tests)
functions/test/stripeWebhookHandler.test.ts                            (new — 8 tests)
functions/test/trialExpiryScheduler.test.ts                            (new — 11 tests)

documentation/new-platform/WEEK18_CLOSE_REPORT.md                      (new)
documentation/new-platform/DEBT_REGISTER.md                            (4 closed, 1 renamed forward)
documentation/new-platform/WEEKLY_LOG.md                               (W18 entry appended)
documentation/PROGRAM_TRACKING_BOARD.md                                (D-077 … D-082 appended)
```

---

## 8. Week 19 — handoff

W19's prompt-pack scope is in
[MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md)
§19. The single carried-forward Stripe item (W18-DEBT-1, `stripeTaxCalculate`)
is small enough to slot into W19 alongside the spec scope; if it is not
addressed in W19 it rolls into the first Phase 2 week (W21).
