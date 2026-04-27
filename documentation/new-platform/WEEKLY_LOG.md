# Weekly Development Log

Running log for the Zarkili multi-tenant platform build.
One entry per week. Do NOT rewrite prior entries.

---

## Week 11 — Analytics and Reporting
**Closed:** 2026-04-24 | **Test count:** 1201 | **TS errors:** 0

### Features Completed

| Task | Deliverable |
|------|------------|
| 11.1 | Retention, rebooking, at-risk, visit-interval metric computations (`metricsService.ts`) |
| 11.1 | Location + staff drilldown in `filterToWindow()` and `analyticsRepository` |
| 11.1 | `getTenantAnalyticsContext()` with plan-gated `accessibleReports` (free\_trial → enterprise) |
| 11.1 | `ANALYTICS_QUERIES.md` |
| 11.2 | `ReportingDashboardScreen` — KPI cards, staff/service performance tables, client attention list |
| 11.2 | `CampaignAnalyticsScreen` — campaign card grid, challenge card grid |
| 11.2 | Location filter UI row + `onChangeLocation` callback with `testID="location-filter-change"` |
| 11.2 | Date filter UI row with `testID="date-filter-change"` |
| 11.3 | Campaign KPIs incl. `converted` count field (real event, separate from `conversionRate` proxy) |
| 11.3 | Challenge KPIs (participants, completion rate, rewards awarded) |
| 11.3 | `MARKETING_ANALYTICS.md` |
| 11.4 | 4 AI feature contracts: Scheduling, Retention, NoShowRisk, MarketplacePersonalization |
| 11.4 | Per-field quality flags, `ConsentFilter` with 3 scopes, explainability fields on all contracts |
| 11.4 | `AI_DATA_CONTRACTS.md` |
| 11.5 | `exportBookings()`, `exportCampaignKpis()`, `exportClientAttentionList()` |
| 11.5 | RBAC enforcement (owner/admin full; location_manager scoped; technician/client forbidden) |
| 11.5 | CSV + JSON serialisers; 500-row default pagination; `ExportMetadata` on all exports |
| 11.5 | `logAuditEvent` optional callback on all export methods (security hardening) |

### Tests and Quality Outcomes

- **New tests added this week:** +11 (1190 → 1201 total)
- Test suites: 76 | Failures: 0 | TS errors: 0
- Coverage areas: metric computations, campaign KPIs, AI contracts, RBAC, pagination, filter-behavior smoke tests, export audit
- All filter-behavior smoke tests added (`date-filter-change`, `location-filter-change` by testID)

### Security Audit Findings and Resolutions

| Severity | Finding | Resolution |
|----------|---------|------------|
| **HIGH** | `fetchAllBookingsByTenant` fetched unbounded full history — potential OOM on large tenants | Added optional `since?: string` param to repository; `reportingService` now passes 2-year lookback (`analyticsLookbackSince()`) to all 5 call sites; `exportClientAttentionList` passes same cap |
| **MEDIUM** | Export actions had no audit trail — no record of who exported what | Added `logAuditEvent?: (event: ExportAuditEvent) => void` optional dependency to `createExportService`; emitted on all three successful export paths |
| **MEDIUM** | `reportingService` and `campaignAnalyticsService` have no actor-role check — rely on Firestore `tenantId` scoping only | **Deferred to Week 12/14 hardening** — add `actorRole` param to all report methods; reject technician/client roles at application layer (same pattern as `exportService`) |

### Open Defects and Technical Debt

1. **[W12-HARDENING-1]** `reportingService` and `campaignAnalyticsService` have no RBAC layer — defense-in-depth fix deferred. Priority: resolve before pilot launch (Week 12 security hardening task).
2. **[W11-DEBT-1]** Date and location Change buttons fire a callback stub — no date picker or location picker components are wired yet. UI shell is in place; picker implementations deferred to a future sprint.
3. **[W11-DEBT-2]** `conversionRate` in `CampaignKpis = clicked/sent` is a proxy. `converted` now tracks real conversion events, but actual booking-completion event emission is not yet integrated into the campaign send log pipeline.

### Index / Rule Changes

None. All Week 11 analytics queries use existing Firestore indexes (tenantId + status + date compound index on `bookings`). The new `since` date filter on `fetchAllBookingsByTenant` aligns with the `bookings` composite index: `(tenantId, date)`.

### Next-Week Prerequisites (Week 12)

- Implement actor-role checks in `reportingService` and `campaignAnalyticsService` (MEDIUM security finding above)
- Bootstrap Zara Tenant 1 migration script (Task 12.1)
- Firestore security rules final hardening pass (Task 12.2)
- Operational runbooks (Task 12.3)
- Pilot go-live validation pack (Task 12.4)

---

## Week 12 — Pilot Migration, Security Hardening, and Go-Live Readiness
**Closed:** 2026-05-01 | **Test count:** 1226 | **TS errors:** 0

### Features Completed

| Task | Deliverable |
|------|------------|
| 12.1 | `zaraMigration.ts` — idempotent 5-step Zara bootstrap script (tenant → location → users → bookings → loyalty) |
| 12.1 | `zaraMigration.ts` — `MigrationSummary` report with created/skipped/error counts and `overallStatus` |
| 12.1 | All docs stamped with `migrationRunId` for queryable rollback |
| 12.1 | 18 unit tests (idempotency, user batching, booking backfill, loyalty idempotency, summary, full re-run) |
| 12.2 | **W12-HARDENING-1 closed**: `actorRole: TenantUserRole` added to all 7 `reportingService` methods and 2 `campaignAnalyticsService` methods; `FORBIDDEN` guard before any Firestore reads |
| 12.2 | Explicit Firestore rules added for 11 previously implicit-deny collections: `loyaltyConfig`, `loyaltyStates`, `loyaltyTransactions`, `loyaltyIdempotency`, `campaigns`, `campaignSendLogs`, `activities`, `activityParticipations`, `segments`, `messages`, `waitlist` |
| 12.2 | `documentation/new-platform/SECURITY_RULES_FINAL.md` — coverage matrix, property guarantees, W12-HARDENING change log |
| 12.3 | `runbooks/INCIDENT_RESPONSE.md` — P0/P1/P2 playbooks, communication templates, escalation matrix |
| 12.3 | `runbooks/BACKUP_RESTORE.md` — PITR setup, GCS daily exports, collection-level purge, migration rollback |
| 12.3 | `runbooks/ROLLBACK_STRATEGY.md` — code/data/rules rollback decision tree, rollback script template |
| 12.3 | `runbooks/HEALTH_CHECKS.md` — post-deploy smoke tests, daily dashboard, weekly checks, 14-day KPI thresholds |
| 12.4 | `PILOT_GO_LIVE.md` — 28-item pre-launch E2E checklist, release signoff template, known-issues register, 14-day monitoring plan, go/no-go decision criteria |

### Tests and Quality Outcomes

- **New tests added this week:** +25 (1201 → 1226 total)
- Test suites: 77 | Failures: 0 | TS errors: 0
- Coverage areas: migration idempotency, RBAC FORBIDDEN paths (reporting + campaign analytics), loyalty idempotency, booking backfill accuracy, migration summary status

### Security Audit Findings and Resolutions

| Severity | Finding | Resolution |
|----------|---------|------------|
| **MEDIUM** (W12-HARDENING-1) | `reportingService` and `campaignAnalyticsService` had no actor-role check — technician and client could call analytics endpoints | Closed: `actorRole` param added to all 9 methods; FORBIDDEN returned before any data read; 10 RBAC tests added |
| **LOW** | 11 Firestore collections relied on implicit catch-all deny only — no explicit rules | Closed: Explicit `match` rules added for all 11 collections; client isolation, server-only writes, and admin-only access correctly specified |
| **NONE** | No dev backdoors, unbounded queries, or new privilege escalation vectors found in 12.1–12.4 | — |

### Open Defects and Technical Debt

1. **[KI-001]** `location_manager` role cannot yet read `staffSchedules` — still admin-only. Deferred to Week 14 RBAC review.
2. **[KI-002]** `bookingSlotTokens` expiry is app-enforced only; expired tokens not auto-purged. Low impact.
3. **[KI-003]** Firestore emulator rule tests not yet written for loyalty/campaigns. Deferred to Week 14.
4. **[KI-004]** No feature flags — tenant-level feature toggles require code deploy. Planned Week 16.
5. **[W11-DEBT-1]** Date/location picker wiring still pending — UI shell only.
6. **[W11-DEBT-2]** Booking-completion event emission into campaign send log pipeline still pending.

### Index / Rule Changes

- `firestore.rules` updated: 11 new explicit match blocks added (no new indexes needed — new rules extend existing patterns)

### Phase Completion — Weeks 1–12

All 12 planned development weeks are now complete:
- **Weeks 1–4**: Multi-tenant foundation (auth, tenant model, locations, bookings)
- **Weeks 5–8**: Loyalty, campaigns, activities, waitlist, AI budget guard
- **Weeks 9–12**: Analytics, exports, AI contracts, migration, security hardening, go-live readiness

**Pilot readiness**: PILOT_GO_LIVE.md pre-launch checklist is the gate before Zara go-live.


---

## Week 13 � Stripe Integration Foundation
**Closed:** 2026-04-26 | **Test count:** 1300 | **TS errors:** 0

### Features Completed

| Task | Deliverable |
|------|------------|
| 13.1 | `billing/model.ts` � SubscriptionStatus surface (trialing/active/past_due/suspended/cancelled), BillingPlanId, PlanInterval, StripeWebhookEvent envelope |
| 13.1 | `billing/model.ts` � `mapStripeStatus` (8 raw Stripe statuses), `isValidTransition` state-machine guard, BillingError taxonomy |
| 13.1 | `billing/repository.ts` � singleton `tenants/{tenantId}/billing/subscription` + `billingWebhookIdempotency/{eventId}`; atomic `saveSubscriptionWithIdempotency` writeBatch |
| 13.1 | `billing/subscriptionService.ts` � `applyWebhookEvent` with full idempotency, transition enforcement, `pastDueSince` stamping/clearing; `transitionSubscription` and `createInitialSubscription` pure helpers |
| 13.1 | 43 tests covering create/renew/past_due/recovery/suspended/cancel transitions, idempotency, illegal-transition rejection, missing-payload errors |
| 13.2 | `connect/model.ts` � ConnectStatus (not_started/pending_verification/active/restricted), ConnectAccountType (express default for US per US_PRIMARY_MARKET_ADDENDUM), TaxFormType (w9/w8ben), 1099-K eligibility flag, restriction reasons array |
| 13.2 | `connect/model.ts` � `deriveConnectStatusFromAccount` (snapshot ? status), `isValidConnectTransition` state-machine guard, ConnectError taxonomy |
| 13.2 | `connect/repository.ts` � singleton `tenants/{tenantId}/connect/account` + `connectWebhookIdempotency/{eventId}` |
| 13.2 | `connect/connectService.ts` � `onboardAccount` (US salons require W-9 or W-8BEN), `applyAccountEvent` for `account.updated` (with restriction-reason capture), `payout.failed` (with last-failure metadata), `payout.paid` (informational) |
| 13.2 | 31 tests covering onboarding success/restricted-recovery/payout-failure paths, idempotency, tax-form enforcement |
| Rules | 4 explicit Firestore match blocks: `billing/{docId}`, `billingWebhookIdempotency/{eventId}`, `connect/{docId}`, `connectWebhookIdempotency/{eventId}` � owner/admin reads on the singleton docs; admin-only writes everywhere |

### Tests and Quality Outcomes

- **New tests added this week:** +74 (1226 -> 1300 total)
- Test suites: 81 | Failures: 0 | TS errors: 0
- Web smoke gate: 6/6 | Native smoke gate: 22/22
- Coverage areas: webhook event mapping, state machine (allowed + forbidden transitions), idempotency (replayed events, atomic writeBatch), pastDueSince stamping/clearing, restriction-reason capture, tax-form enforcement at onboarding, missing-payload guards

### Security Audit Findings and Resolutions

| Severity | Finding | Resolution |
|----------|---------|------------|
| **MEDIUM** | New collections must not rely on implicit catch-all deny (Week 12 hardening principle) | Closed: explicit Firestore rules added for all 4 new collection paths; tenant owner/admin can read singleton docs (settings UI); all writes restricted to platform admin (server-side webhook handler) |
| **LOW** | State drift risk on malformed webhook payload | Closed: `mapStripeStatus` throws on unknown raw status; `isValidTransition` throws before persisting illegal moves; both surface as `BillingError`/`ConnectError` so the webhook handler NACKs Stripe (triggering retry) |
| **LOW** | US Connect tax-form gap | Closed at onboarding: `buildInitialAccount` throws `ConnectError(""TAX_FORM_REQUIRED"")` for US salons without W-9 / W-8BEN |
| **NONE** | No injection vectors, no unbounded queries, no client cap-bypass paths | n/a |

### Open Defects and Technical Debt

1. **[W13-DEBT-1]** No Cloud Function `stripeWebhookHandler` yet � domain is consumer-agnostic; handler wiring is part of Week 14 implementation.
2. **[W13-DEBT-2]** No admin UI for billing or connect health � owner billing settings + connect health surface are part of Phase 3 Week 34 (B-021).
3. **[W13-DEBT-3]** `eligible1099K` flag never auto-flipped � threshold-monitoring job ( AND 200 transactions) deferred to Phase 3.
4. **[W13-DEBT-4]** `cancelAtPeriodEnd=true` relies on Stripe sending `customer.subscription.deleted` at boundary � verified by review only, not by automated job.

### Index / Rule Changes

- `firestore.rules` updated: 4 new explicit match blocks. No new composite indexes required (singleton-doc reads only).

### Next-Week Prerequisites (Week 14)

- Wire Cloud Function `stripeWebhookHandler` to call `createSubscriptionService(...).applyWebhookEvent(event)`.
- Implement Stripe Tax (Task 14.0) � feeds into the SaaS billing checkout that produces the first `customer.subscription.created` event.
- Implement Free Trial Lifecycle Engine (Task 14.1) � reads `Subscription.trialEndsAt`.
- Implement Subscription/Trial Feature Gating (Task 14.2) � reads `Subscription.status` (past_due grace, suspended access gate) and `ConnectAccount.status` (in-app payments enable gate).

---

## Week 14 � Free Trial & Gating

**Window:** Week 14 (single execution day)
**Status:** ? COMPLETE � GO for Week 15
**Close report:** [WEEK14_CLOSE_REPORT.md](WEEK14_CLOSE_REPORT.md)

### Features Delivered
- **Task 14.0 � Stripe Tax integration:** `src/domains/tax/` � TaxQuote/TaxCalculation model, per-tenant + platform cache (15 min TTL), TaxProvider port, deterministic local rule engine covering US (CT/HI/NM/SD/WV taxable, NYC 4.5% surcharge, US SaaS delegated to Stripe Tax) and EU VAT (B2C destination, B2B reverse-charge cross-border).
- **Task 14.1 � Free Trial Lifecycle Engine:** `src/domains/trial/` � 5-state machine (not_started ? active ? expiring_soon ? expired/upgraded), default 14-day length with override, atomic `saveTrialWithJobRun` for idempotent expiry job, activation guarded by `onboardingComplete && launchActivated`.
- **Task 14.2 � Subscription/Trial Feature Gating:** `src/domains/gating/` � 5 feature groups (booking_creation, marketplace_visibility, outbound_campaigns, advanced_analytics, ai_automations), 7-day past-due grace with per-feature revoke policy (campaigns + AI revoke immediately), append-only `gateDenials` audit log, `GateDeniedError` for back-end enforcement.

### Tests
- 130 new tests across 5 suites (tax 39, trial 42, gating 49).
- Full suite: **1,430 / 1,430 passing** across 86 suites (? +130 / +5).
- `npx tsc --noEmit`: 0 errors.
- `npx eslint` on Week 14 code: 0 errors.
- Web smoke: 6 / 6. Native smoke: 22 / 22.

### Security
- Firestore rules: 4 new explicit match blocks before catch-all deny � `taxCalculations` (tenant + platform), `trial/{docId}`, `trialJobRuns/{runId}` (platformAdmin only), `gateDenials/{docId}`.
- Idempotency: tax keyed by `quoteId` (sha256), trial expiry by `runId` bucket; both paths combine state + marker via `writeBatch`.
- HIPAA non-applicability preserved � no PHI in tax calls.

### Debt Register
- W14-DEBT-1 � Cloud Function tax provider (Stripe Tax API call with the same TTL semantics).
- W14-DEBT-2 � Cloud Scheduler invoking `tickExpiry` hourly per active-trial tenant.
- W14-DEBT-3 � Admin shell suspension banner + upgrade CTA component (Phase 3 W34).
- W14-DEBT-4 � Tax breakdown on consumer/admin receipts + invoices (Phase 3 W34).
- W14-DEBT-5 � Pre-flight VIES VAT id validation (optional, Week 16).
- W13-DEBT-1 / W13-DEBT-4 carried into Week 14 backend follow-up.

### Index � New Files
- `src/domains/tax/{model.ts, repository.ts, taxService.ts, index.ts}` + 2 test suites
- `src/domains/trial/{model.ts, repository.ts, trialService.ts, index.ts}` + 2 test suites
- `src/domains/gating/{model.ts, repository.ts, gatingService.ts, index.ts}` + 1 test suite
- `firestore.rules` (4 new match blocks)
- `documentation/new-platform/WEEK14_CLOSE_REPORT.md`

### Next-Week Prerequisites (Week 15 � Salon Onboarding Wizard v1)
- `TrialService.activateTrial` is the launch trigger to fire at the wizard's final step.
- `GatingService.checkAll` powers the post-activation banner state in the admin shell.
- `TaxService` is ready to power the tax-jurisdiction summary on the wizard's *Business Profile* step.

---

## Week 15 — Salon Onboarding Wizard + Admin Controls

**Window:** Week 15 (single execution day)
**Status:** ✅ COMPLETE — GO for Week 16
**Close report:** [WEEK15_CLOSE_REPORT.md](WEEK15_CLOSE_REPORT.md)

### Features Delivered
- **Task 15.1 — Salon Onboarding Wizard v1:** Extended `src/domains/onboarding/` with versioned per-step drafts (`tenants/{tid}/onboardingDrafts/{step}`, schema v1), per-step required-field validation (`STEP_REQUIRED_FIELDS` + `validateStepPayload`), step-specific guidance copy (`STEP_GUIDANCE`), new `WizardService` with `validate` / `guidanceFor` / `saveDraft` / `submitStep` / `resume`. `submitStep` validates → persists draft → advances state. `resume` rehydrates state + per-step drafts.
- **Task 15.2 — Salon Onboarding Admin Controls:** New `OnboardingAdminService` with `extendTrial` / `resetStep` / `applyVerificationOverride` / `listTimeline`. RBAC: `platform_admin` or `tenant_owner` only (`OnboardingPermissionError` on others). Append-only audit at `tenants/{tid}/onboardingTimeline/{eventId}` with idempotent eventId enforcement. Optional injected `trialExtender` for production wiring.
- **KI-001 closed:** Audit confirmed `firestore.rules` already includes `location_manager` in `isTenantAdmin` (line 29) and `staffSchedules` allows reads via `isTenantMember`. Repository has no service-layer role check. Already permissive — no fix needed.

### Tests
- 41 net new tests across 4 onboarding suites (model 9, repository 27→37 (+10), wizardService 11, adminService 11) plus 5 new firestore.rules cases.
- Onboarding domain: **64 / 64 passing** across 4 suites (was 27).
- Full suite: **1,471 / 1,471 passing** across 89 suites (↑ +41 / +3 suites).
- `npx tsc --noEmit`: 0 errors.
- `npx eslint` on Week 15 code: 0 errors.

### Security
- Firestore rules: 2 new explicit match blocks before catch-all deny — `tenants/{tid}/onboardingDrafts/{step}` (tenant admin read+write, schemaVersion ≥ check) and `tenants/{tid}/onboardingTimeline/{eventId}` (read by tenant admin, create by `platform_admin`/`tenant_owner` only with required fields, **append-only — update/delete forbidden**).
- 5 new emulator-style rules tests for the two new collections (gated by KI-003 emulator wiring).

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Closed:** KI-001 (already permissive at rules layer).
- **Rolled to W16:** KI-003 (emulator wiring), W13-DEBT-1, W13-DEBT-4, W14-DEBT-1, W14-DEBT-2 (all backend / Cloud Function work — W15 was scoped to onboarding domain + admin).
- **New W15 debt:** W15-DEBT-1 (admin UI — Phase 3 W33), W15-DEBT-2 (production trialExtender wiring — W16), W15-DEBT-3 (wizard React Native screens — Phase 2 W21).

### Index — Changed Files
- `src/domains/onboarding/{model.ts, repository.ts}` — extended (drafts, timeline, validation, guidance)
- `src/domains/onboarding/{wizardService.ts, adminService.ts}` — new
- `src/domains/onboarding/index.ts` — re-exports
- `src/domains/onboarding/__tests__/{model.test.ts, wizardService.test.ts, adminService.test.ts}` — new
- `src/domains/onboarding/__tests__/repository.test.ts` — extended (drafts + timeline)
- `firestore.rules` — 2 new match blocks
- `__tests__/firestore.rules.test.ts` — 5 new cases
- `documentation/new-platform/SALON_ONBOARDING_OPERATIONS.md` — new
- `documentation/new-platform/WEEK15_CLOSE_REPORT.md` — new
- `documentation/new-platform/DEBT_REGISTER.md` — updated (KI-001 closed, W15 section, week-16 rollups)

### Next-Week Prerequisites (Week 16)
- W13-DEBT-1: wire Cloud Function `stripeWebhookHandler` to subscription + connect services.
- W14-DEBT-1: wire Cloud Function `stripeTaxCalculate` provider.
- W14-DEBT-2: wire Cloud Scheduler invoking `tickExpiry` hourly.
- W15-DEBT-2: wire `OnboardingAdminService.trialExtender` to the trial repo.
- KI-003: stand up Firestore emulator in CI to run rules tests.

---

## Week 16 — Client Onboarding Integration v1

**Window:** Week 16 (single execution day)
**Status:** ✅ COMPLETE — GO for Week 17 (dedicated Stripe backend pass)
**Close report:** [WEEK16_CLOSE_REPORT.md](WEEK16_CLOSE_REPORT.md)

### Features Delivered
- **Task 16.1 ext — Account merge:** Extended `clientOnboardingOrchestrator` with `mergeWithExistingAccount(sessionId, existingUserId, strategy?, existingAccountState?)`. New `mode: "merged"` and `mergeStrategy: "preserve_existing" | "prefer_session"`. Booking context is always preserved across merge. Two strategies: `preserve_existing` (default) unions completed modules and prefers existing-account preferences; `prefer_session` keeps in-flight session values. New `mergedAt` timestamp + `mergeStrategy` recorded on the session.
- **Task 16.2 — Client preference & notification setup:** Added `ConsentPreferences` model + `DEFAULT_CONSENT_PREFERENCES` (notifications/promotions/loyalty all `false` by default — GDPR/consent-safe). New methods: `skipModule(sessionId, module)` (progressive prompting; appends to `skippedModules`, throws `MODULE_ALREADY_RESOLVED` on duplicates), `updatePreferences(sessionId, patch)` (shallow-merge; never auto-enables a flag), `resume(sessionId)` (returns session + canonical pendingModules in order — for app-restart code path). `completeModule` now clears any matching skip (explicit completion wins).
- **W11-DEBT-2 — Campaign conversion tracking:** New `markSendLogConverted(tenantId, logId, conversionRef)` on `CampaignRepository`. Idempotent (second call does not double-increment), atomic update of the log doc + `metrics.converted++` on the parent campaign. `CampaignSendLog` extended with `converted`, `conversionRef`, `convertedAt`. New error code `SEND_LOG_NOT_FOUND`.
- **KI-002 — Slot token TTL purge:** New scheduled Cloud Function `purgeExpiredSlotTokens` in `functions/src/purgeSlotTokens.ts`. Daily 02:30 UTC, queries `bookingSlotTokens where date < (today − 1 day)`, deletes in 400-doc batches. Pure handler `runSlotTokenPurge(now, db)` + `computeCutoffDate(now, graceDays?)` helper for unit testing.

### Tests
- **30 net new tests** in `clientOnboardingOrchestrator.test.ts` (was 27 → 57): consent-safe defaults (3), `skipModule` (6), `updatePreferences` (4), `resume` (5), `mergeWithExistingAccount` (11), plus +1 default-skippedModules check on guest creation.
- **6 net new tests** in `campaigns/repository.test.ts` for `markSendLogConverted` (was 26 → 32): flag flip, persistence, metric increment, idempotency, missing-log error, missing-tenant error.
- **9 net new vitest cases** in `functions/test/purgeSlotTokens.test.ts`: `computeCutoffDate` (4 — default, custom grace, month boundary, year boundary), `runSlotTokenPurge` (5 — empty, strict-less filter, today-or-later kept, batched 950-doc scale, cutoff reported).
- Full root suite: **1,506 / 1,506 passing** (↑ +35 vs W15's 1,471).
- `npx tsc --noEmit`: 0 errors (root + `functions/tsconfig.json`).
- `npx eslint` on changed files: 0 errors (1 pre-existing `console`/`FirebaseFirestore` no-undef pattern in `functions/src/` matches the existing baseline in `scheduledReminders.ts` / `notificationTemplates.ts`).

### Security
- No Firestore rules changes required. Orchestrator is in-memory; campaign send-logs already covered by tenant-admin rules from W11; `bookingSlotTokens` already covered.

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Closed:** KI-002 (slot-token purge function), W11-DEBT-2 (campaign conversion tracking).
- **Rolled to W17 (dedicated Stripe backend pass):** W13-DEBT-1, W13-DEBT-4, W14-DEBT-1, W14-DEBT-2, W15-DEBT-2 — all share Stripe SDK + webhook signature scaffolding; bundling delivers them as one consistent integration rather than five fragmented patches.
- **Rolled forward:** KI-003 (CI emulator infra — separate iteration), KI-004 (separate domain), W11-DEBT-1 (admin UI — pulled with consumer UI plan), W14-DEBT-5 (optional).
- **New W16 debt:** W16-DEBT-1 (orchestrator session persistence — currently `Map`; cross-device resume needs `userOnboardingDrafts` wiring; deferred to Phase 2 W21 alongside the wizard React Native screens).

### Index — Changed Files
- `src/app/onboarding/clientOnboardingOrchestrator.ts` — extended (merge / skip / preferences / resume; consent-safe defaults; typed `err` helper to satisfy babel)
- `src/app/onboarding/__tests__/clientOnboardingOrchestrator.test.ts` — +30 tests
- `src/domains/campaigns/{model.ts, repository.ts}` — extended (`converted`/`conversionRef`/`convertedAt`; `markSendLogConverted`; `SEND_LOG_NOT_FOUND` error)
- `src/domains/campaigns/__tests__/repository.test.ts` — +6 tests
- `functions/src/purgeSlotTokens.ts` — new
- `functions/src/index.ts` — exports `purgeExpiredSlotTokens`
- `functions/test/purgeSlotTokens.test.ts` — new (9 vitest cases)
- `documentation/new-platform/CLIENT_ONBOARDING_MODULES.md` — new
- `documentation/new-platform/WEEK16_CLOSE_REPORT.md` — new
- `documentation/new-platform/DEBT_REGISTER.md` — updated (KI-002 + W11-DEBT-2 closed, W16-DEBT-1 added, W17 backend-pass rollup)

### Next-Week Prerequisites (Week 17 — Stripe backend pass)
- W13-DEBT-1: wire `stripeWebhookHandler` Cloud Function to subscription + connect services with signature verification.
- W13-DEBT-4: end-to-end `cancelAtPeriodEnd=true` validation through the webhook handler.
- W14-DEBT-1: ship `stripeTaxCalculate` Cloud Function provider (Stripe Tax API + same TTL semantics as `createLocalTaxProvider`).
- W14-DEBT-2: stand up Cloud Scheduler invoking `tickExpiry` hourly.
- W15-DEBT-2: wire `OnboardingAdminService.trialExtender` to the trial domain in production.

---

## Week 17 — Marketplace Launch v1

**Window:** Week 17 (single execution day)
**Status:** ✅ COMPLETE — GO for Week 18 (Stripe backend pass, rolled forward)
**Close report:** [WEEK17_CLOSE_REPORT.md](WEEK17_CLOSE_REPORT.md)

### Scope decision (recorded at week-start)
The W16 close report had pre-committed W17 to a dedicated Stripe backend pass bundling W13/W14/W15 debts. The W17 prompt-pack spec ([MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md) §17) instead defines W17 as **Marketplace Launch v1** — Tasks 17.1 (Feed/Search/Profile + "Book this look" deep-link) and 17.2 (Anti-Client-Theft Enforcement). User explicitly chose the prompt-pack scope. The five Stripe debts were rolled forward to **Week 18** with their bundled rationale intact.

### Features Delivered
- **Task 17.1 — Marketplace discovery surface:** New pure-logic service `src/domains/marketplace/discoveryService.ts`. `getFeedPage({ candidates, cursor?, limit, tenantContext })` returns one page of posts ordered `createdAt DESC, postId DESC` with opaque cursor encoding (`encodeFeedCursor` / `decodeFeedCursor`, format `"<millis>:<postId>"`). `searchProfiles({ candidates, filters, tenantContext })` filters profiles by city / serviceTag / styleTag / free-text, honoring `filterVisibleProfiles` (hidden + opted-out tenants suppressed; own-salon suppressed inside booking funnel). `assembleProfileView({ profile, posts, postLimit? })` composes a profile view with newest-first published posts owned by that profile. `buildBookThisLookDeepLink(post)` returns `{ path: "/book", params: { salon, sourcePostId, service? } }` — `sourcePostId` is always present so attribution can be captured at booking time.
- **Task 17.2 — Anti-client-theft guardrails:** New pure-logic service `src/domains/marketplace/guardrailsService.ts`. `assertNoCompetitorRecommendations(context, recs)` throws `COMPETITOR_RECOMMENDATION_BLOCKED` if any rec.tenantId !== context.tenantId (cross-promotion forbidden inside an active booking funnel). `filterToContextTenant` is the non-throwing companion. `attributeAcquisition(input)` builds a `MarketplaceAttribution` value object (defaults `sourceTenantId` to `tenantId`, defaults `capturedAt` to `Date.now()`; throws `INVALID_ATTRIBUTION` on missing required fields). `assertNoCommissionMessaging(text)` scans for forbidden tokens (`commission`, `per-booking fee`, `marketplace fee`, `booking fee`, `platform fee`, `new client fee`, `percentage of revenue` — all case-insensitive); `findCommissionTokens` is the non-throwing companion.
- **Model layer:** `src/domains/marketplace/model.ts` extended with `MarketplaceAttribution`, `BookingFlowContext`, `RecommendedSalon` types and three new `MarketplaceErrorCode` values (`COMPETITOR_RECOMMENDATION_BLOCKED`, `COMMISSION_MESSAGING_FORBIDDEN`, `INVALID_ATTRIBUTION`). Booking shape is **deliberately unmodified** — attribution is a sidecar value object, not a Booking field, keeping W17 surgical.
- **Documentation:** `documentation/new-platform/MARKETPLACE_GUARDRAILS.md` — authoritative reference for the four marketplace guardrails (no-competitor-recs, salon-owns-client, no-commission, salon-controlled visibility) with code references and a compliance checklist for new surfaces.

### Tests
- **22 new tests** in `discoveryService.test.ts`: cursor round-trip + malformed-input handling (3), `getFeedPage` (6 — ordering, pagination, anti-theft tenantContext, unpublished filtered, limit≤0, malformed cursor), `searchProfiles` (6 — city, serviceTag case-insensitive, styleTag, text query, hidden/opted-out exclusion, own-salon exclusion in booking funnel), `assembleProfileView` (3 — own-tenant filter + ordering, postLimit, unpublished filtered), `buildBookThisLookDeepLink` (2 — basic + service pre-fill).
- **16 new tests** in `guardrailsService.test.ts`: `assertNoCompetitorRecommendations` (4), `filterToContextTenant` (2), `attributeAcquisition` (5), `findCommissionTokens` (5), `assertNoCommissionMessaging` (2).
- Marketplace domain: 27 → **65** tests (+38).
- Full root suite: **1,544 / 1,544 passing** (↑ +38 vs W16's 1,506).
- `npx tsc --noEmit`: 0 errors.

### Security
- No Firestore rules changes. All new surface is pure-logic in the service layer; the existing repository-level visibility filters (`filterVisibleProfiles`, `getVisibleProfiles`) and rules from W12 hardening cover the data plane.

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Rolled forward to W18 (Stripe backend pass):** W13-DEBT-1, W13-DEBT-4, W14-DEBT-1, W14-DEBT-2, W15-DEBT-2 — bundled rationale intact; user redirected W17 to spec-canonical Marketplace.
- **New W17 debt:**
  - W17-DEBT-1: feed/search/profile services are pure-logic; consumer-facing screens + Firestore-backed `collectionGroup` feed query not yet wired (Phase 2 — W21).
  - W17-DEBT-2: `MarketplaceAttribution` is built but not yet persisted by the booking pipeline (Phase 2 — W22).
  - W17-DEBT-3: `assertNoCommissionMessaging` is callable but not yet wired as a CMS write-time lint (Phase 3 — W33 admin UI).

### Index — Changed Files
- `src/domains/marketplace/model.ts` — extended (3 new error codes; `MarketplaceAttribution`, `BookingFlowContext`, `RecommendedSalon` types)
- `src/domains/marketplace/discoveryService.ts` — new (W17.1)
- `src/domains/marketplace/guardrailsService.ts` — new (W17.2)
- `src/domains/marketplace/index.ts` — re-exports new services
- `src/domains/marketplace/__tests__/discoveryService.test.ts` — new (22 tests)
- `src/domains/marketplace/__tests__/guardrailsService.test.ts` — new (16 tests)
- `documentation/new-platform/MARKETPLACE_GUARDRAILS.md` — new
- `documentation/new-platform/WEEK17_CLOSE_REPORT.md` — new
- `documentation/new-platform/DEBT_REGISTER.md` — updated (5 Stripe debts moved to W18; W17 section + 3 new debt items)

### Next-Week Prerequisites (Week 18 — Stripe backend pass, rolled forward)
- W13-DEBT-1: `stripeWebhookHandler` Cloud Function with signature verification.
- W13-DEBT-4: end-to-end `cancelAtPeriodEnd=true` validation.
- W14-DEBT-1: `stripeTaxCalculate` Cloud Function (Stripe Tax API + TTL).
- W14-DEBT-2: Cloud Scheduler invoking `tickExpiry` hourly.
- W15-DEBT-2: `OnboardingAdminService.trialExtender` production wiring.


## Week 18 — Stripe Backend Pass

**Window:** Week 18 (single execution day)
**Status:** ✅ COMPLETE — GO for Week 19
**Close report:** [WEEK18_CLOSE_REPORT.md](WEEK18_CLOSE_REPORT.md)

### Scope
Five Stripe-related debts rolled forward from W17. Closed 4 / 5 this week (W13-DEBT-1, W13-DEBT-4, W14-DEBT-2, W15-DEBT-2). W14-DEBT-1 deferred and renamed → W18-DEBT-1; reason in [WEEK18_CLOSE_REPORT.md](WEEK18_CLOSE_REPORT.md) §5.

### Features Delivered
- **W15-DEBT-2 — Production trialExtender wiring.** `src/domains/trial/trialService.ts` extended with pure helper `applyExtension(trial, daysAdded, now)` (anchors `endsAt` to `Math.max(endsAt.seconds, now.seconds)` so a granted extension always produces forward runway, even when recovering from `expired`; clears `expiredAt` on recovery; throws `INVALID_TRANSITION` for non-positive/non-integer daysAdded, `not_started`, `upgraded`, or when the extension fails to clear `now`) and service method `extendTrial(tenantId, daysAdded)`. New file `src/domains/trial/trialExtender.ts` exports `createTrialExtender(service)` — the adapter consumed by `OnboardingAdminService.extendTrial`. Domains stay loosely coupled: the trial domain restates its own `TrialExtender` type alias structurally rather than importing from onboarding.
- **W13-DEBT-1 — Stripe webhook Cloud Function.** New `functions/src/stripeWebhookHandler.ts` (`onRequest`) chains: HMAC-SHA256 signature verification with 300s replay window → JSON parse → `parseStripeEvent` with injected `TenantResolver` (precedence: metadata.tenantId → subscription lookup → customer lookup → account lookup) → idempotency check on `(tenantId, eventId)` → dispatch via pure billing/connect dispatchers → atomic write of subscription/account doc + idempotency marker. Pure modules introduced: `functions/src/stripe/parseEvent.ts` (raw → discriminated envelope), `functions/src/stripe/verifySignature.ts` (HMAC verifier with multi-v1 acceptance for key rotation), `functions/src/stripe/billingDispatcher.ts` (state machine), `functions/src/stripe/connectDispatcher.ts` (account state derivation), `functions/src/stripe/adminRepositories.ts` (admin-SDK adapters mirroring domain repository contracts).
- **W13-DEBT-4 — cancelAtPeriodEnd e2e.** Parser preserves Stripe's `cancel_at_period_end` verbatim; dispatcher writes through to the persisted Subscription record. Covered by a dedicated dispatcher unit test plus an integration test that signs a real payload and asserts `cancelAtPeriodEnd === true` on the persisted document at the end of the full pipeline.
- **W14-DEBT-2 — Trial expiry hourly scheduler.** New `functions/src/trialExpiryScheduler.ts` exports `trialExpiryHourly` (`onSchedule({ schedule: "0 * * * *", timeZone: "UTC" })`). Pure handler `runTrialExpiryScan(now, repo)` returns `{ scanned, transitioned, skippedAlreadyRun, errors }`. RunId is the ISO hour bucket (`YYYY-MM-DDTHH`). The admin-SDK adapter uses `collectionGroup('trial')` filtered to status `in ['active', 'expiring_soon']` and a transaction to atomically guard the `trialJobRuns/{runId}` marker against double-apply.
- **Function exports.** `functions/src/index.ts` exports `stripeWebhookHandler` and `trialExpiryHourly`.

### Tests
- **Trial domain (root jest):** 42 → **54** (+12 tests covering `applyExtension`, `TrialService.extendTrial`, `createTrialExtender`).
- **functions/ vitest:** 75 → **150** (+75 tests across parser, signature verifier, billing dispatcher, connect dispatcher, webhook handler integration, trial expiry scheduler).
- Full root suite: **1,553 / 1,553 passing** (↑ +9 vs W17's 1,544 — net +9 because 3 baseline trial tests rolled into the new describe block).
- Full functions/ suite: **150 / 150 passing**, 11 files.
- `npx tsc --noEmit` (root): 0 errors.
- `npx tsc --noEmit` (functions/): 0 errors.

### Security
- No Firestore rules changes. Webhook idempotency markers (`tenants/{tid}/{billing|connect}WebhookIdempotency/{eventId}`) and trial run markers (`tenants/{tid}/trialJobRuns/{runId}`) are already covered by W12 rules — admin-SDK only writes. `STRIPE_WEBHOOK_SECRET` is declared via `defineSecret` and must be populated in production via `firebase functions:secrets:set` before invocation.

### Architectural Notes
- **SDK split.** `functions/tsconfig.json` scopes compilation to `functions/src` only — Cloud Functions cannot reach `src/domains/*/repository.ts` (which uses the firebase web SDK). Admin-SDK adapters in `functions/src/stripe/adminRepositories.ts` mirror the domain repository contracts structurally; pure dispatchers duplicate the minimum state-machine rules from `src/domains/billing/model.ts` and `src/domains/connect/connectService.ts`. Domain tests in `src/` remain the source-of-truth and the duplicated rules are exhaustively re-tested at the functions/ layer.
- **Local timestamp shape.** All new functions/ types use plain `{ seconds, nanoseconds }` rather than the Firestore `Timestamp` class so the modules stay framework-free and trivially testable.

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Closed (4):** W13-DEBT-1, W13-DEBT-4, W14-DEBT-2, W15-DEBT-2.
- **Renamed forward:** W14-DEBT-1 → **W18-DEBT-1** (`stripeTaxCalculate` Cloud Function — Stripe Tax API + TTL semantics matching `createLocalTaxProvider`). Target: W19, or first available slot in Phase 2.
- **No net-new W18 debt** beyond the rename above.

### Index — Changed Files
- `src/domains/trial/trialService.ts` — extended (`applyExtension` + `extendTrial`)
- `src/domains/trial/trialExtender.ts` — new
- `src/domains/trial/index.ts` — re-export update
- `src/domains/trial/__tests__/trialService.test.ts` — +12 tests
- `functions/src/index.ts` — exports `stripeWebhookHandler` + `trialExpiryHourly`
- `functions/src/stripeWebhookHandler.ts` — new
- `functions/src/trialExpiryScheduler.ts` — new
- `functions/src/stripe/parseEvent.ts` — new
- `functions/src/stripe/verifySignature.ts` — new
- `functions/src/stripe/billingDispatcher.ts` — new
- `functions/src/stripe/connectDispatcher.ts` — new
- `functions/src/stripe/adminRepositories.ts` — new
- `functions/test/stripe/parseEvent.test.ts` — new (20 tests)
- `functions/test/stripe/verifySignature.test.ts` — new (13 tests)
- `functions/test/stripe/billingDispatcher.test.ts` — new (16 tests)
- `functions/test/stripe/connectDispatcher.test.ts` — new (7 tests)
- `functions/test/stripeWebhookHandler.test.ts` — new (8 tests)
- `functions/test/trialExpiryScheduler.test.ts` — new (11 tests)
- `documentation/new-platform/WEEK18_CLOSE_REPORT.md` — new
- `documentation/new-platform/DEBT_REGISTER.md` — updated (4 closed, 1 renamed forward, W18 section added)

### Next-Week Prerequisites (Week 19)
- W19 prompt-pack scope per [MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md) §19.
- W18-DEBT-1: `stripeTaxCalculate` Cloud Function (small enough to slot alongside W19 spec scope; otherwise rolls into Phase 2 W21).



## Week 19 - AI Assistance v1

**Window:** Week 19 (single execution day)
**Status:** Complete with documented forward debt - GO for Week 20
**Close report:** [WEEK19_CLOSE_REPORT.md](WEEK19_CLOSE_REPORT.md)

### Scope
W19 prompt pack lists six AI tasks (19.1 chat, 19.2 assistants triad, 19.3 service recommendations, 19.4 marketing orchestrator, 19.5 retention insights, 19.6 scheduling optimization). Delivered three (19.1, 19.3, 19.5) end-to-end with full mandatory cost-guard checklist; deferred three (19.2, 19.4, 19.6) as W19-DEBT-1/2/3 with W22-W24 targets. Plus W19-DEBT-4 (retention metrics analytics job) and W19-DEBT-5 (chat-assistance feature-key promotion, telemetry-driven). W18-DEBT-1 carried forward to W20.

### Features Delivered
- **Task 19.1 - AI Chat Assistance.** `createChatAssistantService` (`src/domains/ai/chatAssistantService.ts`). Surfaces: client / admin / staff. Feature-keyed under `support-triage` (chat + support share a cost bucket; documented in AI_CHAT_POLICY.md with W19-DEBT-5 split-when-telemetry-justifies). Full guard pipeline: usage snapshot, `evaluateAiBudgetGuard`, low-cost downshift in protection, deterministic escalation in exhausted, telemetry + alert ports. Beyond cost guard: tenant-isolation assertion on `ChatContext.tenantId`, injected `applySafetyFilter` port, configurable confidence threshold, discriminated `ChatEscalationReason`.
- **Task 19.3 - AI Service Recommendations Engine.** `createServiceRecommendationsService` (`src/domains/ai/serviceRecommendationsService.ts`). Feature key `service-recommendations`. Deterministic engine `buildDeterministicRecommendations` always available (`repeat-affinity` / `category-affinity` / `popular-in-tenant` reason codes); used as fallback when guard exhausted, when model output is empty after policy filtering, or when model throws. `filterCatalogForClient` enforces availability, max-price, and disallowed-category/tag policies on both candidate generation and post-model filtering.
- **Task 19.5 - AI Retention Insights Copilot.** `createRetentionInsightsService` (`src/domains/ai/retentionInsightsService.ts`). Feature key `retention-insights`. Pure helpers `computeBaselineRetentionScore`, `pickActionsForScore`, `estimateChurnHorizonDays` (clamped to [7, 180] days). Exhausted state degrades to **metrics-only** mode (deterministic scores, reason codes, queued actions with `narrative = null`). Per-client narrative errors degrade only that client. **Approval-queue invariant verified:** every action emitted with `status: "needs-review"`; the service never auto-sends.

### Tests
- `src/domains/ai/__tests__/chatAssistantService.test.ts` - new (11 tests)
- `src/domains/ai/__tests__/serviceRecommendationsService.test.ts` - new (12 tests)
- `src/domains/ai/__tests__/retentionInsightsService.test.ts` - new (16 tests)
- Full root suite: **1,592 / 1,592 passing** (was 1,553; +39 new tests)
- Full functions/ suite: **150 / 150 passing** (unchanged)
- `npx tsc --noEmit` (root): 0 errors. `npx tsc --noEmit` (functions/): 0 errors.

### Security
- No Firestore rules changes. All three services are pure-logic; data access is via injected ports. Tenant isolation is asserted explicitly in chat (context-id check) and is structurally enforced in retention (caller passes pre-scoped metrics).

### Architectural Notes
- Reused W17 cost-guard infrastructure verbatim. `evaluateAiBudgetGuard` + `buildAiCostTelemetryEvent` are the single source of truth - no shared/ai changes were needed for W19.
- Three new domain services follow the canonical `supportTriageService` template 1:1 (factory, dependency-injected ports, optional `budgetConfig` override, `logGuardDecision` / `logTelemetryEvent` / `logAlert` instrumentation).
- `src/domains/ai/index.ts` updated to re-export all new services + types + helpers.

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Closed (0).**
- **Carried forward:** W18-DEBT-1 (`stripeTaxCalculate`) - target updated W19 -> W20.
- **New W19 debts (5):**
  - W19-DEBT-1 - Task 19.2 assistants triad (target W22)
  - W19-DEBT-2 - Task 19.4 marketing orchestrator (target W23)
  - W19-DEBT-3 - Task 19.6 scheduling optimization engine (target W24)
  - W19-DEBT-4 - `ClientRetentionMetrics` upstream analytics job (target W22)
  - W19-DEBT-5 - promote `chat-assistance` to its own `aiFeatureKeys` entry (target post-launch, telemetry-driven)

### Index - Changed Files
- `src/domains/ai/chatAssistantService.ts` - new
- `src/domains/ai/serviceRecommendationsService.ts` - new
- `src/domains/ai/retentionInsightsService.ts` - new
- `src/domains/ai/__tests__/chatAssistantService.test.ts` - new (11 tests)
- `src/domains/ai/__tests__/serviceRecommendationsService.test.ts` - new (12 tests)
- `src/domains/ai/__tests__/retentionInsightsService.test.ts` - new (16 tests)
- `src/domains/ai/index.ts` - re-export update
- `documentation/new-platform/AI_CHAT_POLICY.md` - new
- `documentation/new-platform/AI_RETENTION_INSIGHTS.md` - new
- `documentation/new-platform/WEEK19_CLOSE_REPORT.md` - new
- `documentation/new-platform/DEBT_REGISTER.md` - W18-DEBT-1 retargeted, W19 section + 5 entries added
- `documentation/new-platform/WEEKLY_LOG.md` - this entry
- `documentation/new-platform/PROGRAM_TRACKING_BOARD.md` - D-083..D-087 appended

### Same-Week Amendment (W19 re-close)

After user pushback ("why didn't you move to the other 3 tasks?"), the agent reversed the scope cut and delivered Tasks 19.2 (scheduling assistant + content assistant), 19.4 (marketing automation orchestrator), and 19.6 (scheduling optimization engine) the same week. **All 6 W19 tasks now delivered.**

- **New services (4):**
  - `src/domains/ai/schedulingAssistantService.ts` (Task 19.2 — scheduling slice). Pure `enumerateConstraintSafeSlots` + `rankSlotsHeuristically`; AI augmentation with defence-in-depth (model picks re-validated against safe set). Feature key `scheduling-optimization`.
  - `src/domains/ai/contentAssistantService.ts` (Task 19.2 — content slice). Tone-aware `buildTemplateDraft` (friendly/formal/playful/concise); enforces `approvalMode: "human-approval"`; drafts always `status: "needs-review"`; template-fallback on cap-exhausted, model-error, OR safety-filter rejection. Feature key `content-creation`.
  - `src/domains/ai/marketingOrchestratorService.ts` (Task 19.4). Pure `evaluateRulesEngine` (trigger / consent / quiet-hours with wrap-midnight / per-campaign frequency cap / in-batch dedupe / auto-send opt-in) runs first; AI personalisation layer enhances ONLY rule-passed dispatches. Feature key `marketing-orchestration`.
  - `src/domains/ai/schedulingOptimizationService.ts` (Task 19.6). `analyzeDayPlan` (utilization, low/high-load, tight-buffer flags, scaled buffer recommendation) + `buildHeuristicRescheduleSuggestions` (same-staff-first, min start-deviation). Reuses `enumerateConstraintSafeSlots` from 19.2 to guarantee no double-bookings. `DEFAULT_OPTIMIZATION_LATENCY_TARGET_MS = 1500` exported per spec. Feature key `scheduling-optimization` (shared bucket with 19.2 assistant).
- **New tests (+42):** schedulingAssistantService 9, contentAssistantService 9, marketingOrchestratorService 14, schedulingOptimizationService 10.
- **Gates after re-close:**
  - `npx tsc --noEmit` (root): 0 errors.
  - `npx jest` (root): **1,634 / 1,634 passing across 98 suites** (was 1,592 / 94; +42 new).
  - functions/ unchanged at 150/150 (no functions/ changes).
- **Debt register changes:**
  - W19-DEBT-1, W19-DEBT-2, W19-DEBT-3 → **closed (W19)** — closed in same week as opened.
  - W19-DEBT-4 (`ClientRetentionMetrics` analytics job) and W19-DEBT-5 (`chat-assistance` feature-key promotion) remain open as planned.
  - W18-DEBT-1 still carries forward to W20.
- **Updated files:** `src/domains/ai/index.ts` (re-exports the 4 new services + types/helpers); `WEEK19_CLOSE_REPORT.md` revised to reflect 6-of-6 delivery; `DEBT_REGISTER.md` updated with the three closures; `PROGRAM_TRACKING_BOARD.md` D-088..D-091 appended.
- **Lesson recorded:** when the platform pattern is established and the work fits the same template, ship it; don't pre-emptively defer.

### Next-Week Prerequisites (Week 20)
- W20 prompt-pack scope per `MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md` Section 20.
- W18-DEBT-1: `stripeTaxCalculate` Cloud Function (high severity, oldest open debt).


## Week 20 - AI Risk Models and Personalization

**Window:** Week 20 (single execution day)
**Status:** Complete - both tasks delivered - GO for Week 21
**Close report:** [WEEK20_CLOSE_REPORT.md](WEEK20_CLOSE_REPORT.md)

### Scope
W20 prompt pack lists two AI tasks (20.1 No-Show / Fraud Prediction; 20.2 Marketplace Personalization Engine). Both delivered end-to-end with the full mandatory cost-guard checklist. W18-DEBT-1 (`stripeTaxCalculate`) carried forward unchanged - it is a Phase-2 backend-pass slot, out of scope for this AI-pass week.

### Features Delivered
- **Task 20.1 - No-Show / Fraud Risk Scoring.** `createNoShowFraudService` (`src/domains/ai/noShowFraudService.ts`) under feature key `no-show-fraud`. Consent-safe `RiskInputSignals` is the exhaustive input surface (no PII, no demographics, no cross-tenant data); pure helpers `computeHeuristicRiskScore` and `resolveRecommendedAction` are independently exported and tested; `filterReasonCodesToAllowList` drops any code the model invents. Hard invariants: `requiresHumanReview` is forced TRUE for `manual-review`/`block` actions and for every rules-only fallback; the service never auto-denies. Drift port: `logRiskAssessment`. Policy: [AI_RISK_MODEL_POLICY.md](AI_RISK_MODEL_POLICY.md).
- **Task 20.2 - Marketplace Personalization Engine.** `createMarketplacePersonalizationService` (`src/domains/ai/marketplacePersonalizationService.ts`) under feature key `marketplace-personalization`. Anti-client-theft `enforceCompetitorSuppression` re-filters competitor-tenant posts even when callers already do so (defence in depth); `buildDeterministicRanking` is the always-on baseline and the cold-start path; `hasUserSignals` is the cold-start gate that skips the AI call entirely. Hard constraints: allow-list of postIds (model can rerank but not introduce); score clamp to `[0,1]`; filter-bubble guard (model can re-order but not remove). Observability: stable `impressionToken` per item + `logRanking` per call for CTR / conversion-lift attribution. Policy: [MARKETPLACE_PERSONALIZATION.md](MARKETPLACE_PERSONALIZATION.md).

### Tests
- `src/domains/ai/__tests__/noShowFraudService.test.ts` - new (17 tests)
- `src/domains/ai/__tests__/marketplacePersonalizationService.test.ts` - new (16 tests)
- Full root suite: **1,667 / 1,667 passing across 100 suites** (was 1,634 / 98; +33)
- Full functions/ suite: **150 / 150 passing** (unchanged)
- `npx tsc --noEmit` (root): 0 errors. `npx tsc --noEmit` (functions/): 0 errors.

### Security
- No Firestore rules changes. Both new services are pure-logic; data access is via injected ports. Anti-client-theft is enforced inside the personalization service as defence in depth.
- No payment-flow changes. No admin callables added.
- AI safety: consent-safe input pinned at the type level for risk; reason-code allow-list enforced; `requiresHumanReview` invariant tested; service never auto-denies. Personalization: postId allow-list, score clamp, filter-bubble guard, impressionToken attribution.

### Architectural Notes
- Reused W17 cost-guard infrastructure verbatim. `evaluateAiBudgetGuard` + `buildAiCostTelemetryEvent` are the single source of truth - no `src/shared/ai` changes were needed for W20.
- Both new domain services follow the canonical `supportTriageService` template 1:1 (factory, dependency-injected ports, optional `budgetConfig` override, `logGuardDecision` / `logTelemetryEvent` / `logAlert` instrumentation).
- Feature keys `no-show-fraud` ($110/mo) and `marketplace-personalization` ($90/mo) were already pre-defined in `aiFeatureKeys`; no `src/shared/ai/budgetGuard.ts` changes were needed.
- `src/domains/ai/index.ts` updated to re-export both new services + types + helpers.

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Closed (0).**
- **Carried forward (still open):** W18-DEBT-1, W19-DEBT-4, W19-DEBT-5.
- **New W20 debts (4):**
  - W20-DEBT-1 - tenant-policy persistence for `RiskPolicy` (target W22)
  - W20-DEBT-2 - drift dashboard wiring `logRiskAssessment` (target post-launch)
  - W20-DEBT-3 - wire `logRanking` into analytics pipeline (target post-launch)
  - W20-DEBT-4 - per-tenant cold-start popularity index (target W22)

### Index - Changed Files
- `src/domains/ai/noShowFraudService.ts` - new
- `src/domains/ai/marketplacePersonalizationService.ts` - new
- `src/domains/ai/__tests__/noShowFraudService.test.ts` - new (17 tests)
- `src/domains/ai/__tests__/marketplacePersonalizationService.test.ts` - new (16 tests)
- `src/domains/ai/index.ts` - re-export update
- `documentation/new-platform/AI_RISK_MODEL_POLICY.md` - new
- `documentation/new-platform/MARKETPLACE_PERSONALIZATION.md` - new
- `documentation/new-platform/WEEK20_CLOSE_REPORT.md` - new
- `documentation/new-platform/DEBT_REGISTER.md` - W20 section + 4 entries added
- `documentation/new-platform/WEEKLY_LOG.md` - this entry
- `documentation/PROGRAM_TRACKING_BOARD.md` - D-092..D-095 appended

### Next-Week Prerequisites (Week 21)
- W21 prompt-pack scope per `PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md`.
- W18-DEBT-1: `stripeTaxCalculate` Cloud Function (high severity, oldest open debt).
- W19-DEBT-4: `ClientRetentionMetrics` analytics job.
- W19-DEBT-5: chat-assistance feature-key promotion (telemetry-driven).
- W20-DEBT-1..-4 as above.




## Week 20.5 - Pre-W21 Backend Debt Pass

**Window:** Single-day debt-clearance pass between W20 close and W21 start.
**Status:** Complete - 6 debts shipped + tested - GO for Week 21.
**Close report:** [WEEK20_5_CLOSE_REPORT.md](WEEK20_5_CLOSE_REPORT.md)

### Scope
User-selected `backend-only` bundle from the W20.5 triage. Six items closed: W18-DEBT-1 (Stripe Tax onCall callable), W14-DEBT-5 (EU VAT format pre-flight), W17-DEBT-3 (marketplace post commission lint), W17-DEBT-2 (marketplace acquisitions repo), W20-DEBT-1 (risk-policy admin), W16-DEBT-1 (onboarding session persistence).

### Features Delivered
- **W18-DEBT-1.** `functions/src/stripe/taxAdapter.ts` (pure mappers + `StripeTaxApiClient` port + native-fetch adapter pinned to Stripe-Version 2024-06-20) and `functions/src/stripeTaxCalculate.ts` (onCall handler; admin-SDK cache repo at `tenants/{tid}/taxCalculations/{quoteId}` or `platform/__platform__/...`; TTL 900s; tenant_admin scoped via `auth.token.tenantId`, platform_admin cross-tenant). Domain types duplicated locally so functions/ keeps zero client-SDK deps.
- **W14-DEBT-5.** `src/domains/tax/vatValidation.ts` - `validateEuVatIdFormat` + `normaliseEuVatId`; 27 EU member-state regex map (Greece = `EL`).
- **W17-DEBT-3.** `src/domains/marketplace/marketplacePostsService.ts` - thin wrapper that runs `assertNoCommissionMessaging` over title + description on createPost / updatePost.
- **W17-DEBT-2.** `src/domains/marketplace/marketplaceAcquisitionsRepository.ts` - `saveAcquisition` / `getAcquisition` / `listAcquisitions` / `persistMarketplaceAcquisition`; doc id = bookingId for idempotency.
- **W20-DEBT-1.** Read side: `src/domains/ai/riskPolicyRepository.ts` (`validateRiskPolicy` enforces deposit < prepayment < manualReview < block in [0,1]; `mergeRiskPolicy`; `createRiskPolicyRepository`). Write side: `functions/src/riskPolicyAdmin.ts` (`getRiskPolicyAdmin` + `updateRiskPolicyAdmin` onCall; tenant_admin custom-claim scoped). Path: `tenants/{tid}/riskPolicy/current`.
- **W16-DEBT-1.** `clientOnboardingOrchestrator` factory now takes optional `OnboardingPersistencePort` (sync mutation API preserved - fire-and-forget save). New async `restoreSession` hydrates from store and bumps the id counter to avoid collisions. New `createFirestoreOnboardingPersistence(db)` adapter writing to `userOnboardingDrafts/{sessionId}` with defensive deserialisation.

### Tests
- Root jest: 1,667 -> **1,741** passing across 100 -> **106** suites (+74 tests, +6 suites).
- Functions vitest: 150 -> **187** passing across 12 -> **14** suites (+37 tests, +2 suites).
- `npx tsc --noEmit` (root): 0 errors. `cd functions; npx tsc --noEmit`: 0 errors.
- Firestore rules tests not run - require emulator (KI-003 still tracks the CI gap).

### Security
- No Firestore rules changes.
- Three new admin callables (`getRiskPolicyAdmin`, `updateRiskPolicyAdmin`, `stripeTaxCalculate`) all enforce role + tenant scope at function entry: tenant_admin bound to `auth.token.tenantId`, cross-tenant access platform_admin only. Risk-policy validator rejects any payload that violates the threshold invariant.
- No PII added to logs. Stripe API key flows via secrets pipeline; no key value logged.
- Marketplace post wrapper closes the path where a CMS submission could bypass the in-product commission-lint UI.

### Architectural Notes
- All six debts followed the canonical pattern: pure helpers + DI ports + factory functions; tests mock ports with in-memory fakes.
- `functions/` continues to ship without a `stripe` SDK dep; `stripeTaxCalculate` uses native `fetch` + `URLSearchParams`, mirroring the W18 webhook handler.
- Domain types crossing the root <-> functions boundary are duplicated, never imported (mirrors trial-expiry scheduler). This keeps functions/ decoupled from any client-SDK transitive deps.
- `clientOnboardingOrchestrator` kept its sync mutation surface intact - W21 consumer-UI work can adopt persistence without rewriting any flows.

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Closed (6):** W14-DEBT-5, W16-DEBT-1, W17-DEBT-2, W17-DEBT-3, W18-DEBT-1, W20-DEBT-1.
- **No new debts opened.**

### Index - Changed Files
- New (production): `src/domains/tax/vatValidation.ts`, `src/domains/marketplace/marketplacePostsService.ts`, `src/domains/marketplace/marketplaceAcquisitionsRepository.ts`, `src/domains/ai/riskPolicyRepository.ts`, `src/app/onboarding/clientOnboardingFirestorePersistence.ts`, `functions/src/stripe/taxAdapter.ts`, `functions/src/stripeTaxCalculate.ts`, `functions/src/riskPolicyAdmin.ts`.
- New (tests): one `__tests__` file per debt under the corresponding domain folder, plus `functions/test/stripe/taxAdapter.test.ts` and `functions/test/stripeTaxCalculate.test.ts`, `functions/test/riskPolicyAdmin.test.ts`.
- Modified: `src/app/onboarding/clientOnboardingOrchestrator.ts` (optional persistence DI; `restoreSession`); index re-export updates in `src/domains/tax/index.ts`, `src/domains/marketplace/index.ts`, `src/domains/ai/index.ts`, `functions/src/index.ts`; `DEBT_REGISTER.md` (six rows flipped + operational view); this entry; `PROGRAM_TRACKING_BOARD.md`.

### Next-Week Prerequisites (Week 21)
W21 enters the Phase 2 consumer-UI plan with a persistent onboarding wizard backend, locked-down marketplace post path, working acquisition sink, production Stripe Tax callable, tenant-policy plumbing for risk thresholds, and a low-friction VAT pre-flight for admin onboarding UX. No backend prerequisites remain blocking W21.
