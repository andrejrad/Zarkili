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
- W21 prompt-pack scope per `PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md`.
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


## Week 21 - Batch A: Auth & Onboarding (Consumer UI)

**Window:** Week 21 (Phase 2 Consumer-UI kickoff).
**Status:** Complete - all 9 screen groups (A.1-A.9) and all 6 new components delivered + tested - GO for Week 22.
**Close report:** [WEEK21_CLOSE_REPORT.md](WEEK21_CLOSE_REPORT.md)

### Scope
First Phase-2 consumer-UI build. `code-only` per `FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md` - the BATCH_A prompt-pack is the build spec, no Figma dependency. Foundation primitives ship first (tokens + 6 components), then 9 screen groups compose them. Auth screens wire to the existing `AuthProvider`; onboarding step screens compose the persistable `clientOnboardingOrchestrator` (W16-DEBT-1 closed in W20.5).

### Features Delivered
- **Foundation - `src/shared/ui/`.** `tokens.ts` (typed re-exports of design-handoff JSON tokens), `Button.tsx` (primary/secondary/tertiary/destructive/icon-only x large/medium/small), `InputField.tsx` (text/email/phone/password/otp-cell with full state matrix + auto-formatting), `FormRow.tsx`, `SegmentedControl.tsx`, `Stepper.tsx`, `Banner.tsx`, `formatters.ts` (US-primary phone/email/zip/password validators).
- **Auth screens - `src/app/auth/`.** A.1 SignInScreen, A.2 SignUpScreen, A.3 SocialSignInSelectorScreen (Apple-first iOS), A.4 ForgotPassword + ResetPassword, A.5 EmailVerificationScreen (resend cooldown + change-email), A.6 OtpVerificationScreen (6-cell with auto-advance + paste), A.8 AccountMergeScreen (preserve_existing | prefer_session). All screens consume `useAuth()`; failures funnel through `Banner` with `toUserFacingAuthError` formatting.
- **Onboarding screens - `src/app/onboarding/`.** A.7.1 ProfileScreen, A.7.2 PreferencesScreen (multi-select, min-1 validation), A.7.3 NotificationsScreen (TCPA/CAN-SPAM safe defaults; all toggles default OFF), A.7.4 LocationScreen (use-my-location + 5-digit ZIP fallback), A.7.5 PaymentScreen (optional, `Skip for now` tertiary CTA).
- **Routes.** Eight new public `guard: ""none""` route entries: SignIn, SignUp, SocialSignIn, ForgotPassword, ResetPassword, EmailVerification, OtpVerification, AccountMerge.
- A.9 (Error & Empty Variants) is covered through the `Banner` component states embedded across A.1-A.8 (network offline, rate-limited, server 5xx, account suspended).

### Tests
- Root jest: 1,741 -> **1,808** passing across 106 -> **117** suites (+67 tests, +11 suites).
- Functions vitest: **187** passing across 14 suites (unchanged - Batch A is consumer-UI only).
- `npx tsc --noEmit` (root): 0 errors. `cd functions; npx tsc --noEmit`: 0 errors.

### Security
- All forms validate at the boundary before invoking `authRepository`; firebase-error codes translated via `toUserFacingAuthError` before reaching the user.
- Marketing / promotion toggles default OFF (TCPA / CAN-SPAM safe defaults).
- Touch targets >= 44x44 (WCAG 2.1 AA). OTP cells expose per-cell `accessibilityLabel`; error banners on A.5/A.6 have `accessibilityRole=""alert""`.
- US-primary defaults: `(XXX) XXX-XXXX` phone, 5-digit ZIP, no IBAN/VAT in consumer flow. Apple Sign-In is the first social provider on iOS per HIG.

### Architectural Notes
- `AuthProvider` and `clientOnboardingOrchestrator` reused unchanged. Screens are pure React components with no direct firebase imports - all auth I/O routes through the `AuthRepository` port and is mockable in tests.
- `tokens.ts` re-exports from the JSON design-handoff spec rather than redefining values - future token bumps land in one place.
- Primitives are props-driven and have zero auth/onboarding business knowledge - reusable as-is for Batch B onward.

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Closed (0).**
- **No new debts opened.** All A.7 screens use the persistable orchestrator (W16-DEBT-1 closed in W20.5), so onboarding state survives device-kill out of the box.

### Index - Changed Files
- New (production): `src/shared/ui/{tokens,Button,InputField,FormRow,SegmentedControl,Stepper,Banner,formatters,index}.ts(x)`; `src/app/auth/{SignInScreen,SignUpScreen,SocialSignInSelectorScreen,ForgotPasswordScreen,ResetPasswordScreen,EmailVerificationScreen,OtpVerificationScreen,AccountMergeScreen,index}.tsx`; `src/app/onboarding/{ClientOnboardingProfileScreen,ClientOnboardingPreferencesScreen,ClientOnboardingNotificationsScreen,ClientOnboardingLocationScreen,ClientOnboardingPaymentScreen}.tsx`.
- New (tests): four `src/shared/ui/__tests__/` suites; six `src/app/auth/__tests__/` suites; one `src/app/onboarding/__tests__/ClientOnboardingScreens.steps.test.tsx`.
- Modified: `src/app/navigation/routes.ts` (+8 public auth routes); `src/app/navigation/__tests__/routes.test.ts` (anonymous-route snapshot updated); `WEEKLY_LOG.md`; `PROGRAM_TRACKING_BOARD.md`.

### Next-Week Prerequisites (Week 22)
W22 (Batch B - Discovery & Browse) inherits the locked design-system primitives (Button, InputField, FormRow, SegmentedControl, Stepper, Banner, tokens). Discovery already has a backend scaffold (`DISCOVERY_SCAFFOLD.md`); W22 composes home / search / filters / category / tenant-profile screens from these primitives plus the existing service-card / chip / category-pill / filter-button / search-bar JSON specs.


## Week 22 - Batch B: Discover, Explore, Profile (Consumer UI)

**Window:** Week 22 (Phase 2 consumer-UI second sprint).
**Status:** Complete - all 8 screens (B.1-B.8) and all 7 new shared-UI primitives delivered + tested - GO for Week 23.
**Close report:** [WEEK22_CLOSE_REPORT.md](WEEK22_CLOSE_REPORT.md)

### Scope
Second Phase-2 consumer-UI sprint. `code-only` per FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md line 86 - the BATCH_B_DISCOVER_EXPLORE_PROFILE prompt-pack is the build spec, no Figma blocker. Backend ports already exist (createDiscoveryService from W17 + Phase-2 scaffold); W22 composes 8 screens against the existing ppDiscoveryService runtime singleton plus a new pure helper module (discoveryFilters.ts) for filter + sort logic.

### Features Delivered
- **Foundation - 7 new shared-UI primitives in src/shared/ui/.** RatingStars (read-only / adjustable, half-star, sizes 16/20/32), RangeSlider (single + dual variant, Pressable +/- buttons - no gesture lib, accessibilityRole=adjustable), FilterSheet (modal bottom sheet wrapper - drag handle + scrollable body + sticky footer + reset/apply/scrim handlers), GalleryCarousel (paged FlatList with page dots + alt-text per item), SalonHeroCard (16:9 hero + scrim + name + RatingStars + meta + favorite toggle), StaffAvatarList (horizontal scroll + 2px coral ring on selected), StickyCtaBar (primary fullWidth Button + optional secondary inline Button + bottom safe-area approximation). All reuse W21 tokens unchanged.
- **Pure helpers - src/app/discover/discoveryFilters.ts.** DiscoveryFilters type (query / category / priceRange [lo,hi] / minRating / availability / memberOnly / sort), DEFAULT_FILTERS, pplyDiscoveryFilters, sortDiscoveryResults (recommended members-first / rating-desc / price-asc / price-desc), pplyDiscoveryFiltersAndSort, hasActiveFilters, countActiveFilterDimensions. Zero React imports - fully testable without renderer. AvailabilityWindow covers any / today / tomorrow / this-week.
- **Screens - src/app/discover/ (8).** B.1 HomeScreen (greeting + search entry + category pills + featured row + recent bookings), B.2 DiscoverFeedScreen (vertical mixed-card feed with FTC `Sponsored` badges + editorial cards), B.3 ExploreSearchResultsScreen (search header + Filters/Map toolbar + result count + list, filtering via applyDiscoveryFiltersAndSort, empty state), B.4 FilterSheetScreen (composes FilterSheet + RangeSlider + RatingStars + category/availability/sort pills + members-only Switch with live result count), B.5 SalonProfileScreen (SalonHeroCard + ADA-accessible badge + 5-tab strip Services/Staff/Reviews/Gallery/About + sticky StickyCtaBar with Book now + optional Message), B.6 ServiceDetailScreen (hero + duration + price + StaffAvatarList + add-on multi-select + sticky Choose time), B.7 StaffMemberDetailScreen (bio + rating + years exp + GalleryCarousel portfolio + sticky Book with {firstName}), B.8 ExploreMapScreen (deferred-stub with `Map view coming Week 28` notice + Switch to list CTA - native maps deferred to W28).
- **Routes.** Eight new public guard:none routes: DiscoverHome, DiscoverFeed, ExploreResults, ExploreMap, DiscoverFilters, SalonProfile, ServiceDetail, StaffDetail.

### Tests
- Root jest: 1,808 -> **1,844** passing across 117 -> **121** suites (+36 tests, +4 suites).
- Functions vitest: **187** passing across 14 suites (unchanged - Batch B is consumer-UI only).
- `npx tsc --noEmit` (root): 0 errors. `cd functions; npx tsc --noEmit`: 0 errors.

### Security
- No Firestore rules changes. All screens are read-only consumers of the existing ppDiscoveryService; visibility filters live in the W17 marketplace repository layer.
- FTC labelling: sponsored cards render an explicit `Sponsored - {sponsorName}` badge per FTC endorsement guidelines.
- Anti-client-theft: W17 ssertNoCompetitorRecommendations is preserved for any booking-funnel context surfaced via these screens.
- WCAG 2.1 AA preserved: every interactive >= 44x44, RatingStars uses accessibilityRole=image (read-only) or adjustable (interactive), gallery items require alt text, ADA-accessible badge surfaces on salon profile when applicable.
- US-primary defaults retained: $ price labels, miles, MM/DD/YYYY where dates appear.

### Architectural Notes
- All screens are props-driven and accept their data as inputs. The ppDiscoveryService singleton stays wired at the navigator layer rather than inside screens, so screen tests render without provider scaffolding.
- discoveryFilters.ts has zero React / I/O coupling so the same filter + sort logic can later be hoisted to the repository layer for server-side filtering without screen rewrites.
- RangeSlider deliberately uses Pressable +/- buttons rather than gesture-handler - keeps W22 free of native deps and gives free a11y semantics.
- ExploreMapScreen is intentionally a stub. Pulling react-native-maps would require Expo prebuild + native dev-client rebuild, out of scope for the consumer-UI sprint. Stub still has meaningful copy + Switch-to-list escape hatch.

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Closed (0).**
- **New W22 debts (3):**
  - W22-DEBT-1 - ExploreMapScreen is a placeholder; wire react-native-maps + salon-pin layer (target W28).
  - W22-DEBT-2 - SalonProfileScreen accepts services / staff / reviews / gallery as inputs but no getSalonProfile(salonId) port exists yet (target W23 alongside booking-funnel handoff).
  - W22-DEBT-3 - DiscoverFeed editorial + sponsored cards have no backing repository surface yet (editorial target W23, sponsored target W34 with paid-marketplace flow).
- **Carried forward:** W19-DEBT-4, W19-DEBT-5, W20-DEBT-2, W20-DEBT-3, W20-DEBT-4.

### Index - Changed Files
- New (production): src/shared/ui/{RatingStars,RangeSlider,FilterSheet,GalleryCarousel,SalonHeroCard,StaffAvatarList,StickyCtaBar}.tsx; src/app/discover/{HomeScreen,DiscoverFeedScreen,ExploreSearchResultsScreen,FilterSheetScreen,SalonProfileScreen,ServiceDetailScreen,StaffMemberDetailScreen,ExploreMapScreen}.tsx; src/app/discover/discoveryFilters.ts.
- New (tests): src/shared/ui/__tests__/{discovery-primitives,FilterSheet}.test.tsx; src/app/discover/__tests__/{discoveryFilters.test.ts,discoverScreens.test.tsx}.
- Modified: src/shared/ui/index.ts (W22 exports + types); src/app/navigation/routes.ts (+8 public B.* routes); src/app/navigation/__tests__/routes.test.ts (anonymous-route snapshot updated); WEEKLY_LOG.md; PROGRAM_TRACKING_BOARD.md.

### Next-Week Prerequisites (Week 23)
W23 (Batch C - Booking Flow) inherits W21 + W22 primitives unchanged plus the new discoveryFilters helper for any list-screen reuse. W22-DEBT-2 (getSalonProfile(salonId) port) is the lead-in dependency for the salon-detail -> booking funnel handoff. Editorial / sponsored feed adapters (W22-DEBT-3) can land alongside W23 admin-feed seeding or defer to W34 without blocking the booking funnel.


## Week 23 - Batch C: Booking Flow (Consumer UI)

**Window:** Week 23 (Phase 2 consumer-UI third sprint).
**Status:** Complete - all 11 screens (C.1-C.11) and all 6 new shared-UI primitives delivered + tested - GO for Week 24.
**Close report:** [WEEK23_CLOSE_REPORT.md](WEEK23_CLOSE_REPORT.md)

### Scope
Third Phase-2 consumer-UI sprint. Unblocked at sprint start by the Batch C Figma artifact handoff: calendar-grid + time-slot-chip components and screen-booking-date-picker (C.3) + screen-booking-time-picker (C.4) screen specs - each carrying a source provenance block (batch=C, figmaFrame, promotedFrom, lockedAt=2026-04-27). The other 9 screens are code-only per the Phase 2 plan.

### Features Delivered
- **Foundation - 6 new shared-UI primitives in src/shared/ui/.** CalendarGrid (7x6 month grid Sun-start, today/selected/disabled/holiday/availability states, ISO-keyed availability map; holiday dot rendered 4x4 vs spec's 2x2 for visibility), TimeSlotChip (80x44 chip with 4 states; height bumped from spec's 40 to 44 to satisfy WCAG 44pt min touch target), SummaryRow (label/value/subValue/trailing/onPress with optional chevron + bottom divider), StickyFooterCta (primary 48h CTA + optional total-amount row above; distinct from W22 StickyCtaBar which renders a secondary inline button), ModalSheet (generic bottom-sheet shell with drag handle + close X + scroll body + optional sticky footer; distinct from W22 FilterSheet which is filter-specific), PolicyAcknowledgement (checkbox row with required-state error message). All reuse W21 tokens unchanged.
- **Pure helpers - src/app/booking/bookingHelpers.ts.** BookingStep + BOOKING_STEPS (8-step flow), BookingService/BookingAddOn/BookingStaffOption/BookingPriceBreakdown/BookingStatus types, TimeSegment + TIME_SEGMENT_LABELS + BOOKING_STATUS_LABELS, formatLongDateLabel/formatShortDateLabel/formatUsDate (US MM/DD/YYYY), formatTimeOfDay/parseTimeOfDay (12h h:mm AM/PM), categorizeTimeSlot (morning < 12 PM <= afternoon < 5 PM <= evening), groupTimeSlotsBySegment, generateTimeSlots, computeBookingTotal (cents-rounded), formatUsd (,234.50 with thousands), formatPhoneUs ((555) 123-4567 pass-through if not 10 digits), computeCancellationRefund (refund + fee both clamped at 0). Zero React imports - fully testable without a renderer.
- **Screens - src/app/booking/ (11).** C.1 ServiceSelectionScreen (grouped service cards + inline add-on chip rows + max-reached banner + sticky footer with count + total), C.2 StaffSelectionScreen (Any-available anchor card + named staff cards with RatingStars + specialties + on-leave badge + 3-slot inline preview when selected), C.3 BookingDatePickerScreen (locked spec, quick-pick chips + month switcher + CalendarGrid + selected-date info + holiday banner + skeleton loading + error retry), C.4 BookingTimePickerScreen (locked spec, date label + SegmentedControl Morning/Afternoon/Evening + TimeSlotChip 3-col grid + timezone note + empty-state with Try-another-day CTA), C.5 BookingReviewScreen (salon mini-card + SummaryRow stack with editable chevrons + notes input + promo chip + price breakdown + sticky footer), C.6 BookingPoliciesScreen (ModalSheet with policy sections + required PolicyAcknowledgement + Agree-and-continue), C.7 BookingPaymentScreen (Apple Pay button + saved-card radio rows + dashed Add-payment tile + total breakdown + Confirm-and-pay), C.8 BookingConfirmationScreen (mint-fresh success circle + summary card + action row Calendar/Directions/Message + Manage/Done footer), C.9 ManageBookingScreen (status banner + summary + action list + cancel ModalSheet preview using computeCancellationRefund), C.10 GuestContactScreen (contact form + auto-format phone via formatPhoneUs + SMS-reminders consent OFF-by-default per TCPA), C.11 PostBookingUpgradeScreen (ModalSheet with benefits list + Create-account + Not-now).
- **Routes.** Eleven new public guard:none routes: BookingService /book/service, BookingStaff /book/staff, BookingDate /book/date, BookingTime /book/time, BookingReview /book/review, BookingPolicies /book/policies, BookingPayment /book/payment, BookingConfirmation /book/confirmation, ManageBooking /book/manage, GuestContact /book/guest, PostBookingUpgrade /book/upgrade.

### Tests
- Root jest: 1,844 -> **1,904** passing across 121 -> **124** suites (+60 tests, +3 suites).
- Functions vitest: **187** passing across 14 suites (unchanged - Batch C is consumer-UI only).
- `npx tsc --noEmit` (root): 0 errors. `cd functions; npx tsc --noEmit`: 0 errors.

### Security
- No Firestore rules changes. All screens are props-driven and own no Firestore I/O; persistence is W23-DEBT-1 (next sprint).
- TCPA: GuestContactScreen SMS-reminders toggle defaults to OFF and renders Standard-rates / STOP-to-opt-out copy inline. Consent state is a dedicated boolean.
- No PCI scope: BookingPaymentScreen is a pure picker over caller-supplied saved cards. Stripe in-flow integration is W23-DEBT-2 - card data will only flow through Stripe Elements / PaymentSheet, never our screens.
- WCAG 2.1 AA preserved: every interactive >= 44x44 (TimeSlotChip bumped from spec's 40 to 44), PolicyAcknowledgement uses accessibilityRole=checkbox, CalendarGrid cells expose date + selected + disabled state in their accessibility label, ModalSheet close + scrim are both labelled Close.
- US-primary defaults retained: $ price labels via formatUsd, MM/DD/YYYY where dates appear, 12h h:mm AM/PM via formatTimeOfDay, (XXX) XXX-XXXX via formatPhoneUs.

### Architectural Notes
- All screens are props-driven and accept their data as inputs. No screen reads from a singleton or Firestore directly - caller (navigator layer) wires data + dispatch handlers in. Screen tests render without provider scaffolding.
- bookingHelpers.ts has zero React / I/O coupling so the same pricing / formatting / categorisation logic can later be reused server-side or in admin-app review screens.
- StickyFooterCta authored as a distinct primitive from W22's StickyCtaBar rather than enhancing the W22 primitive - StickyFooterCta is total-amount + primary CTA, StickyCtaBar is primary + secondary inline. Composing them into one would have widened the W22 contract for callers that don't need totals.
- ModalSheet is a generic bottom-sheet shell deliberately kept separate from W22's FilterSheet (which has filter-specific reset/apply semantics). C.6 / C.9 / C.11 each use ModalSheet with a custom footer slot.
- CalendarGrid builds its 7x6 grid via width 100/7 flex children rather than a flex-grid library - keeps W23 dependency-free and gives free a11y semantics.

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Closed (1):** W22-DEBT-2 (getSalonProfile(salonId) port) - superseded; W23 screens accept salon / services / staff / pricing as inputs from the navigator layer. Repository surface rolls into W23-DEBT-1 below.
- **New W23 debts (3):**
  - W23-DEBT-1 - Booking persistence + cloud-function flow (createBookingDraft, confirmBooking, cancelBooking, rescheduleBooking, getBookingsForUser) and salon-profile / services / staff / availability read ports needed to feed C.1-C.4 and C.9 from real data. Target W24+.
  - W23-DEBT-2 - Stripe in-flow payment (PaymentSheet / Apple Pay merchant validation / saved-card management + 3DS / SCA). Target W24 Batch D.
  - W23-DEBT-3 - Cancel / reschedule mutation backend + audit trail and refund processor wiring. ManageBookingScreen already shows the refund preview via computeCancellationRefund; the actual side-effect is deferred. Target alongside W23-DEBT-1.
- **Carried forward:** W19-DEBT-4, W19-DEBT-5, W20-DEBT-2, W20-DEBT-3, W20-DEBT-4, W22-DEBT-1 (react-native-maps W28), W22-DEBT-3 (editorial / sponsored feed repository).

### Index - Changed Files
- New (production): src/shared/ui/{CalendarGrid,TimeSlotChip,SummaryRow,StickyFooterCta,ModalSheet,PolicyAcknowledgement}.tsx; src/app/booking/{ServiceSelectionScreen,StaffSelectionScreen,BookingDatePickerScreen,BookingTimePickerScreen,BookingReviewScreen,BookingPoliciesScreen,BookingPaymentScreen,BookingConfirmationScreen,ManageBookingScreen,GuestContactScreen,PostBookingUpgradeScreen}.tsx; src/app/booking/bookingHelpers.ts.
- New (tests): src/shared/ui/__tests__/booking-primitives.test.tsx; src/app/booking/__tests__/{bookingHelpers.test.ts,bookingScreens.test.tsx}.
- New (design-handoff): design-handoff/components/{calendar-grid,time-slot-chip}.json; design-handoff/specs/{screen-booking-date-picker,screen-booking-time-picker}.json.
- Modified: src/shared/ui/index.ts (W23 exports + types); src/app/navigation/routes.ts (+11 public /book/* routes); src/app/navigation/__tests__/routes.test.ts (anonymous-route snapshot updated); design-handoff/HANDOFF_MANIFEST.md; WEEKLY_LOG.md; PROGRAM_TRACKING_BOARD.md.

### Next-Week Prerequisites (Week 24)
W24 (Batch D - Booking Backend + Stripe) inherits W21 + W22 + W23 primitives unchanged plus the new bookingHelpers module. W23-DEBT-1 read ports gate live data on C.1-C.4. W23-DEBT-1 write ports gate end-to-end submission C.5-C.8. W23-DEBT-2 (Stripe PaymentSheet + Apple Pay) gates real payment capture in C.7. W23-DEBT-3 (cancel + reschedule mutations) gates C.9 actions. Phase 2 consumer-UI core flow (auth -> discover -> booking) is now feature-complete on the screen layer; W24+ shifts emphasis to the data + payment layer.


## Week 23 - Batch C: Booking Flow (Consumer UI)

**Window:** Week 23 (Phase 2 consumer-UI third sprint).
**Status:** Complete - all 11 screens (C.1-C.11) and all 6 new shared-UI primitives delivered + tested - GO for Week 24.
**Close report:** [WEEK23_CLOSE_REPORT.md](WEEK23_CLOSE_REPORT.md)

### Scope
Third Phase-2 consumer-UI sprint. Unblocked at sprint start by the Batch C Figma artifact handoff: calendar-grid + time-slot-chip components and screen-booking-date-picker (C.3) + screen-booking-time-picker (C.4) screen specs - each carrying a source provenance block (batch=C, figmaFrame, promotedFrom, lockedAt=2026-04-27). The other 9 screens are code-only per the Phase 2 plan.

### Features Delivered
- **Foundation - 6 new shared-UI primitives in `src/shared/ui/`.** CalendarGrid (7x6 month grid Sun-start, today/selected/disabled/holiday/availability states, ISO-keyed availability map; holiday dot rendered 4x4 vs spec's 2x2 for visibility), TimeSlotChip (80x44 chip with 4 states; height bumped from spec's 40 to 44 to satisfy WCAG 44pt min touch target), SummaryRow (label/value/subValue/trailing/onPress with optional chevron + bottom divider), StickyFooterCta (primary 48h CTA + optional total-amount row above; distinct from W22 StickyCtaBar which renders a secondary inline button), ModalSheet (generic bottom-sheet shell with drag handle + close X + scroll body + optional sticky footer; distinct from W22 FilterSheet which is filter-specific), PolicyAcknowledgement (checkbox row with required-state error message). All reuse W21 tokens unchanged.
- **Pure helpers - `src/app/booking/bookingHelpers.ts`.** BookingStep + BOOKING_STEPS (8-step flow), BookingService/BookingAddOn/BookingStaffOption/BookingPriceBreakdown/BookingStatus types, TimeSegment + TIME_SEGMENT_LABELS + BOOKING_STATUS_LABELS, formatLongDateLabel/formatShortDateLabel/formatUsDate (US MM/DD/YYYY), formatTimeOfDay/parseTimeOfDay (12h h:mm AM/PM), categorizeTimeSlot (morning < 12 PM <= afternoon < 5 PM <= evening), groupTimeSlotsBySegment, generateTimeSlots, computeBookingTotal (cents-rounded), formatUsd ($1,234.50 with thousands), formatPhoneUs ((555) 123-4567 pass-through if not 10 digits), computeCancellationRefund (refund + fee both clamped at 0). Zero React imports - fully testable without a renderer.
- **Screens - `src/app/booking/` (11).** C.1 ServiceSelectionScreen (grouped service cards + inline add-on chip rows + max-reached banner + sticky footer with count + total), C.2 StaffSelectionScreen (Any-available anchor card + named staff cards with RatingStars + specialties + on-leave badge + 3-slot inline preview when selected), C.3 BookingDatePickerScreen (locked spec, quick-pick chips + month switcher + CalendarGrid + selected-date info + holiday banner + skeleton loading + error retry), C.4 BookingTimePickerScreen (locked spec, date label + SegmentedControl Morning/Afternoon/Evening + TimeSlotChip 3-col grid + timezone note + empty-state with Try-another-day CTA), C.5 BookingReviewScreen (salon mini-card + SummaryRow stack with editable chevrons + notes input + promo chip + price breakdown + sticky footer), C.6 BookingPoliciesScreen (ModalSheet with policy sections + required PolicyAcknowledgement + Agree-and-continue), C.7 BookingPaymentScreen (Apple Pay button + saved-card radio rows + dashed Add-payment tile + total breakdown + Confirm-and-pay), C.8 BookingConfirmationScreen (mint-fresh success circle + summary card + action row Calendar/Directions/Message + Manage/Done footer), C.9 ManageBookingScreen (status banner + summary + action list + cancel ModalSheet preview using computeCancellationRefund), C.10 GuestContactScreen (contact form + auto-format phone via formatPhoneUs + SMS-reminders consent OFF-by-default per TCPA), C.11 PostBookingUpgradeScreen (ModalSheet with benefits list + Create-account + Not-now).
- **Routes.** Eleven new public guard:none routes: BookingService /book/service, BookingStaff /book/staff, BookingDate /book/date, BookingTime /book/time, BookingReview /book/review, BookingPolicies /book/policies, BookingPayment /book/payment, BookingConfirmation /book/confirmation, ManageBooking /book/manage, GuestContact /book/guest, PostBookingUpgrade /book/upgrade.

### Tests
- Root jest: 1,844 -> **1,904** passing across 121 -> **124** suites (+60 tests, +3 suites).
- Functions vitest: **187** passing across 14 suites (unchanged - Batch C is consumer-UI only).
- `npx tsc --noEmit` (root): 0 errors. `cd functions; npx tsc --noEmit`: 0 errors.

### Security
- No Firestore rules changes. All screens are props-driven and own no Firestore I/O; persistence is W23-DEBT-1 (next sprint).
- TCPA: GuestContactScreen SMS-reminders toggle defaults to OFF and renders Standard-rates / STOP-to-opt-out copy inline. Consent state is a dedicated boolean.
- No PCI scope: BookingPaymentScreen is a pure picker over caller-supplied saved cards. Stripe in-flow integration is W23-DEBT-2 - card data will only flow through Stripe Elements / PaymentSheet, never our screens.
- WCAG 2.1 AA preserved: every interactive >= 44x44 (TimeSlotChip bumped from spec's 40 to 44), PolicyAcknowledgement uses accessibilityRole=checkbox, CalendarGrid cells expose date + selected + disabled state in their accessibility label, ModalSheet close + scrim are both labelled Close.
- US-primary defaults retained: $ price labels via formatUsd, MM/DD/YYYY where dates appear, 12h h:mm AM/PM via formatTimeOfDay, (XXX) XXX-XXXX via formatPhoneUs.

### Architectural Notes
- All screens are props-driven and accept their data as inputs. No screen reads from a singleton or Firestore directly - caller (navigator layer) wires data + dispatch handlers in. Screen tests render without provider scaffolding.
- bookingHelpers.ts has zero React / I/O coupling so the same pricing / formatting / categorisation logic can later be reused server-side or in admin-app review screens.
- StickyFooterCta authored as a distinct primitive from W22's StickyCtaBar rather than enhancing the W22 primitive - StickyFooterCta is total-amount + primary CTA, StickyCtaBar is primary + secondary inline. Composing them into one would have widened the W22 contract for callers that don't need totals.
- ModalSheet is a generic bottom-sheet shell deliberately kept separate from W22's FilterSheet (which has filter-specific reset/apply semantics). C.6 / C.9 / C.11 each use ModalSheet with a custom footer slot.
- CalendarGrid builds its 7x6 grid via width 100/7 flex children rather than a flex-grid library - keeps W23 dependency-free and gives free a11y semantics.

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Closed (1):** W22-DEBT-2 (getSalonProfile(salonId) port) - superseded; W23 screens accept salon / services / staff / pricing as inputs from the navigator layer. Repository surface rolls into W23-DEBT-1 below.
- **New W23 debts (3):**
  - W23-DEBT-1 - Booking persistence + cloud-function flow (createBookingDraft, confirmBooking, cancelBooking, rescheduleBooking, getBookingsForUser) and salon-profile / services / staff / availability read ports needed to feed C.1-C.4 and C.9 from real data. Target W24+.
  - W23-DEBT-2 - Stripe in-flow payment (PaymentSheet / Apple Pay merchant validation / saved-card management + 3DS / SCA). Target W24 Batch D.
  - W23-DEBT-3 - Cancel / reschedule mutation backend + audit trail and refund processor wiring. ManageBookingScreen already shows the refund preview via computeCancellationRefund; the actual side-effect is deferred. Target alongside W23-DEBT-1.
- **Carried forward:** W19-DEBT-4, W19-DEBT-5, W20-DEBT-2, W20-DEBT-3, W20-DEBT-4, W22-DEBT-1 (react-native-maps W28), W22-DEBT-3 (editorial / sponsored feed repository).

### Index - Changed Files
- New (production): src/shared/ui/{CalendarGrid,TimeSlotChip,SummaryRow,StickyFooterCta,ModalSheet,PolicyAcknowledgement}.tsx; src/app/booking/{ServiceSelectionScreen,StaffSelectionScreen,BookingDatePickerScreen,BookingTimePickerScreen,BookingReviewScreen,BookingPoliciesScreen,BookingPaymentScreen,BookingConfirmationScreen,ManageBookingScreen,GuestContactScreen,PostBookingUpgradeScreen}.tsx; src/app/booking/bookingHelpers.ts.
- New (tests): src/shared/ui/__tests__/booking-primitives.test.tsx; src/app/booking/__tests__/{bookingHelpers.test.ts,bookingScreens.test.tsx}.
- New (design-handoff): design-handoff/components/{calendar-grid,time-slot-chip}.json; design-handoff/specs/{screen-booking-date-picker,screen-booking-time-picker}.json.
- Modified: src/shared/ui/index.ts (W23 exports + types); src/app/navigation/routes.ts (+11 public /book/* routes); src/app/navigation/__tests__/routes.test.ts (anonymous-route snapshot updated); design-handoff/HANDOFF_MANIFEST.md; WEEKLY_LOG.md; PROGRAM_TRACKING_BOARD.md.

### Next-Week Prerequisites (Week 24)
W24 (Batch D - Booking Backend + Stripe) inherits W21 + W22 + W23 primitives unchanged plus the new bookingHelpers module. W23-DEBT-1 read ports gate live data on C.1-C.4. W23-DEBT-1 write ports gate end-to-end submission C.5-C.8. W23-DEBT-2 (Stripe PaymentSheet + Apple Pay) gates real payment capture in C.7. W23-DEBT-3 (cancel + reschedule mutations) gates C.9 actions. Phase 2 consumer-UI core flow (auth -> discover -> booking) is now feature-complete on the screen layer; W24+ shifts emphasis to the data + payment layer.


## Week 24 - Batch D: Payments, Tipping, Receipts (Consumer UI)

**Window:** Week 24 (Phase 2 consumer-UI fourth sprint).
**Status:** Complete - all 6 screens (D.1-D.6), 4 new shared-UI primitives, 2 helper modules, and Stripe SDK integration delivered + tested - GO for Week 25.
**Close report:** [WEEK24_CLOSE_REPORT.md](WEEK24_CLOSE_REPORT.md)

### Scope
Fourth Phase-2 consumer-UI sprint, split into two focused sub-sessions at the user request: (1) Stripe SDK install (separate, prior - SDK + Expo plugin + jest mock with gates green at 1,904 unchanged), then (2) the W24 build (this entry). Batch D Figma artifacts were not locked into design-handoff for this sprint - screens were built code-first against the FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK Batch D prompt brief; promotion to design-handoff/specs is recorded as W24-DEBT-1.

### Features Delivered
- **Stripe SDK integration.** @stripe/stripe-react-native installed via npx expo install (Expo SDK 54 compatible, +12 / -5 packages). Expo config plugin registered in app.config.ts with merchantIdentifier "merchant.com.zarkili" and enableGooglePay false (US-first, Apple Pay only for v1). App.tsx wraps the safe-area shell in StripeProvider sourced from Constants.expoConfig.extra.stripePublishableKey. Jest mock added in jest.setup.ts covering StripeProvider, CardField, ApplePayButton, GooglePayButton, AddToWalletButton, useStripe, useApplePay, useConfirmPayment, initStripe, isApplePaySupported.
- **Foundation - 4 new shared-UI primitives in src/shared/ui/.** PaymentMethodRow (64h row, brand-glyph text fallback, brand+last4 + expiry/Expired error subtitle, optional mint-fresh Default pill, optional kebab; accessibilityState exposes selected + disabled), CurrencyInput (leading dollar + decimal-pad TextInput right-aligned 24/32, internal sanitize strips non-digit/dot, allows single dot, clamps to 2 decimals; emits onChangeText + onChangeValue), TipPresetChipGroup (radiogroup of radio chips, coral-blossom selected + white text, dashed error outline for destructive variant; min 44pt high), ReceiptLineItem (3-col line: description + optional modifier subtitle, optional qty hidden when qty===1, right-aligned amount). All four reuse W21 tokens unchanged.
- **Pure helpers - src/app/payments/paymentsHelpers.ts.** CardBrand union + normalizeCardBrand (Stripe-string -> CardBrand, unknown fallback), formatBrandLabel/formatLast4/formatCardLabel ("Visa  4242"), formatCardExpiry (MM/YY), isCardExpired (handles invalid month -> expired), roundCents (NaN-safe -> 0), parseCurrencyInput (strips dollar/comma, NaN on garbage, truncates to 2 decimals), formatUsd ($1,234.50 with thousands + leading minus on negatives), DEFAULT_TIP_PRESETS (15/18/20/25/Custom/None - ids p15/p18/p20/p25/custom/none), tipAmountFromPreset (clamped >= 0), computeOrderTotal (subtotal+tax+tip rounded to cents), formatTaxLabel ("WA Sales Tax 10.25%"), formatPercent. Zero React imports.
- **Pure helpers - src/app/payments/receiptsHelpers.ts.** ReceiptLineItem/ReceiptTaxLine/ReceiptTotals types, lineItemSubtotal (qty clamped >= 0), computeReceiptTotals (tax-line amounts clamped >= 0; cents-rounded), formatPaymentMethodLine + APPLE_PAY_PAYMENT_LINE, formatRefundAmountLabel ("$45.00 refunded", clamped >= 0), BookingHistoryRecord/Status/Tab/Filters types, BOOKING_HISTORY_TABS + LABELS, filterBookingHistory (upcoming = future+active; past = completed; cancelled = cancelled OR no-show; then salon/status/date/price filters), countActiveBookingFilters (filter-button badge), RefundStatus + REFUND_STATUS_LABELS, buildRefundTimeline (3-step success / 2-step denial / partial-completion current marker). Zero React imports.
- **Screens - src/app/payments/ (6).** D.1 SavedPaymentMethodsScreen (Apple Pay top row + PaymentMethodRow list with kebab ModalSheet menu Set-default/Remove + remove-confirm sheet + Add-payment dashed tile + empty/loading/error), D.2 AddPaymentMethodScreen (Stripe CardField PCI-out-of-scope + cardholder name InputField + 5-digit ZIP InputField clamped + Set-as-default Switch + declined banner + 3DS-in-progress placeholder + sticky footer Add card; CTA disabled until cardComplete + name + 5-digit ZIP), D.3 TippingScreen (TipPresetChipGroup + conditional CurrencyInput on Custom + live total card + body-small "100% of tips go to your stylist" + sticky footer Confirm with totalLabel/totalValue), D.4 ReceiptScreen (salon block + US date MM/DD/YYYY + 12h time + ReceiptLineItem list + totals (per-jurisdiction tax + tip + grand) + payment-method line + Email/Download/Share row + tertiary Report a problem), D.5 BookingHistoryScreen (search TextInput + filter button with active-count badge + SegmentedControl Upcoming/Past/Cancelled + booking rows with status pills + FilterSheet placeholder + load-more + per-tab empty states with Find-a-salon CTA on Upcoming), D.6 RefundStatusScreen (status Banner info/success/error + vertical timeline from buildRefundTimeline with reached/pending/current dot states + booking summary + refund amount + denial-reason card + 5-10 business days disclaimer + Contact support tertiary).
- **Routes.** Six new public guard:none routes: SavedPaymentMethods /payments/methods, AddPaymentMethod /payments/add, Tipping /payments/tip, Receipt /payments/receipt, BookingHistory /bookings/history, RefundStatus /payments/refund.

### Tests
- Root jest: 1,904 -> **1,953** passing across 124 -> **128** suites (+49 tests, +4 suites).
- Functions vitest: **187** passing across 14 suites (unchanged - Batch D is consumer-UI + payments-shell only).
- ``npx tsc --noEmit`` (root): 0 errors. ``cd functions; npx tsc --noEmit``: 0 errors.

### Security
- PCI scope avoided: AddPaymentMethodScreen uses Stripe CardField; full PAN, CVC, and expiry never reach our application layer - tokenized inside the Stripe SDK, only an opaque paymentMethod.id returns. SavedPaymentMethodsScreen and the W23 BookingPaymentScreen operate exclusively on tokenized references.
- Apple Pay only on iOS for v1: enableGooglePay false in the Expo plugin to avoid shipping a half-configured Google Pay surface ahead of merchant onboarding. Adding Google Pay is a deliberate later step.
- No new Firestore rules surface: W24 screens are props-driven and own no Firestore I/O; persistence (PaymentMethods document model + Stripe Customer linking) is W24-DEBT-2.
- TCPA / consent surface unchanged from W23. No new SMS / email triggers in W24.
- WCAG 2.1 AA preserved: every interactive >= 44x44 (tip chips min-height spacing.touchTarget, PaymentMethodRow row 64h with 44h kebab), TipPresetChipGroup exposes radiogroup/radio/selected state, PaymentMethodRow exposes selected + disabled accessibility state, CurrencyInput exposes accessibilityValue with formatted USD.
- US-primary defaults: $1,234.50 thousands separator, MM/DD/YYYY, 12h h:mm AM/PM, 5-digit ZIP, jurisdictional tax labels.

### Architectural Notes
- Pure-helper pattern preserved. Both paymentsHelpers.ts and receiptsHelpers.ts have zero React imports - same brand-normalization / receipt-math / refund-timeline logic can be reused server-side (functions package) without rewrites.
- Screens remain props-driven. useStripe.createPaymentMethod, Apple Pay merchant validation, Stripe Customer methods listing, and PaymentSheet presentation are all caller-wired by the navigator layer rather than embedded in screens. Mirrors the W22+W23 pattern.
- PaymentMethodRow ships dependency-free. Brand glyphs are text-only ("VISA"/"MC"/"AMEX"/"CARD") rather than shipping a network-card-icon raster set; callers can pass a leadingIcon ReactNode if/when designers ship raster assets - no breaking change.
- CurrencyInput owns light formatting only. Does not enforce min/max - that is caller responsibility - but accepts errorText to render the validation surface uniformly across D.3 + future P2P-tip flows.
- computeOrderTotal vs computeReceiptTotals deliberately separate. The first composes a fresh order pre-tax-line breakdown (rate-based); the second composes a finalized receipt with already-resolved tax lines (Stripe Tax line-items). Conflating would force receipts through a rate-only path the moment Stripe Tax goes live.
- buildRefundTimeline returns an explicit step list. Rendering iterates and chooses dot styling per step.status (reached/current/pending) rather than the screen branching on RefundStatus directly - adding a new step (e.g. "Refund disputed") becomes a helper change, not a screen rewrite.
- SegmentedControl API: confirmed during build the W21 primitive uses value (not selectedValue) + onChange<T extends string>. BookingHistoryScreen consumes the generic for type narrowing.
- FilterSheet requires applyLabel - W22 primitive contract; supplied as "Apply".

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **Closed (1):** W23-DEBT-2 (Stripe in-flow payment surface) - replaced by the W24 install + CardField-based AddPaymentMethodScreen + useStripe mock contract for tests. Server-side setupIntent + 3DS confirmation now part of W24-DEBT-2 below for clearer ownership.
- **New W24 debts (3):**
  - W24-DEBT-1 - Promote Batch D Figma artifacts to design-handoff/specs (screen-saved-payment-methods, screen-add-payment-method, screen-tipping, screen-receipt, screen-booking-history, screen-refund-status) and components (payment-method-row, currency-input, tip-preset-chip-group, receipt-line-item).
  - W24-DEBT-2 - Stripe server-side payment infrastructure: createPaymentIntent / confirmPaymentIntent / createSetupIntent Cloud Functions; paymentMethods/{id} Firestore document model with Stripe Customer linking; webhook handler extension for payment_method.attached/.detached + payment_intent.succeeded/.payment_failed.
  - W24-DEBT-3 - Receipt PDF rendering pipeline (Cloud Function emitting a PDF to bookings/{id}/receipt.pdf + signed-URL handoff). ReceiptScreen.onPressDownload/onPressEmail are caller wiring placeholders today.
- **Carried forward:** W19-DEBT-4, W19-DEBT-5, W20-DEBT-2, W20-DEBT-3, W20-DEBT-4, W22-DEBT-1, W22-DEBT-3, W23-DEBT-1, W23-DEBT-3.

### Index - Changed Files
- New (production): src/shared/ui/{PaymentMethodRow,CurrencyInput,TipPresetChipGroup,ReceiptLineItem}.tsx; src/app/payments/{paymentsHelpers,receiptsHelpers}.ts; src/app/payments/{SavedPaymentMethodsScreen,AddPaymentMethodScreen,TippingScreen,ReceiptScreen,BookingHistoryScreen,RefundStatusScreen}.tsx.
- New (tests): src/app/payments/__tests__/{paymentsHelpers,receiptsHelpers}.test.ts; src/shared/ui/__tests__/payments-primitives.test.tsx; src/app/payments/__tests__/paymentsScreens.test.tsx.
- Modified: App.tsx (StripeProvider wiring + expo-constants import); app.config.ts (Stripe Expo plugin); jest.setup.ts (Stripe SDK mock); package.json/package-lock.json (Stripe dep); src/shared/ui/index.ts (W24 exports); src/app/navigation/routes.ts (+6 public /payments/* + /bookings/history routes); src/app/navigation/__tests__/routes.test.ts (anonymous-route snapshot extended); WEEKLY_LOG.md; PROGRAM_TRACKING_BOARD.md.

### Next-Week Prerequisites (Week 25)
W25 inherits W21+W22+W23+W24 primitives unchanged. W24-DEBT-2 server-side payment infrastructure (createPaymentIntent/setupIntent Cloud Functions + PaymentMethods Firestore model + Stripe Customer linking) gates real-money flows on D.1/D.2 and the C.7 link from W23. Without it the navigator wires mock data + a no-op onSubmit. W23-DEBT-1 read ports (getBookingsForUser plus W22 salon-profile/availability ports) gate BookingHistoryScreen against live data. W24-DEBT-3 receipt PDF pipeline is required for ReceiptScreen Email/Download/Share to wire to actual artifacts. The Stripe publishable key is read from Constants.expoConfig.extra.stripePublishableKey - wire this through Expo app.config.ts extra from the appropriate per-environment env file before W25 sandbox runs.

## Week 25 - Batch E: Loyalty, Activities, Reviews (Consumer UI)

**Window:** Week 25 (Phase 2 consumer-UI fifth sprint).
**Status:** Complete - all 9 screens (E.1-E.9), 5 new shared-UI primitives, loyaltyHelpers.ts helper module, and all test gates delivered + test-fix pass completed - GO for Week 26.
**Close report:** [WEEK25_CLOSE_REPORT.md](WEEK25_CLOSE_REPORT.md)

### Scope
Fifth Phase-2 consumer-UI sprint. Batch E ships the consumer loyalty / activities / reviews surface area. W25 was split into two sub-sessions: (1) design-handoff session (prior - Batch E artifacts locked into design-handoff/specs + design-handoff/components; primitive specs reviewed), then (2) this engineering session. All screens are props-driven with no Firestore I/O; live data wired by the navigator layer once backend loyalty service ships.

### Features Delivered
- **Foundation - 5 new shared-UI primitives in src/shared/ui/.** ProgressRing (SVG circular ring, progress 0-1, centerLabel/centerSubLabel text, state idle/loading/error, {testID}-loading and {testID}-error marker Views, accessibilityRole="progressbar" + accessibilityValue.now), TierBadge (capsule, non-interactive=accessibilityRole="text" / interactive=accessibilityRole="button"; textTransform:"uppercase" in style - text content stays original casing for RNTL queryability), RewardCard (Pressable, title + pointCost + type chip + optional image, {testID}-locked-overlay View when isLocked, {testID}-redeemed-badge View when isRedeemed, accessibilityState.disabled when locked/redeemed), RatingSelector (star Pressables testID="rs-star-{n}", no accessibilityElementsHidden so RNTL can reach all stars, outer View testID carries accessibilityRole="adjustable" + accessibilityState.disabled), PhotoUploadTile (add-photo pressable vs disabled placeholder, disabled branch has no accessibilityElementsHidden so "Max 5 photos" text is RNTL-visible). All five reuse W21 tokens unchanged.
- **Pure helper - src/app/loyalty/loyaltyHelpers.ts.** 39 exported symbols. Tier: LoyaltyTier union + LOYALTY_TIERS + TIER_THRESHOLDS + TIER_PROGRESS_LABEL + deriveTier + nextTier + pointsToNextTier + computeTierProgress (1.0 at Platinum). Points: formatPoints ("1,234 pts") + formatPointsDelta ("+50 pts"). Earn/history: EarnAction type + DEFAULT_EARN_ACTIONS (5 entries) + HistoryEntry type + formatHistoryDate. Rewards: RewardFilterTab union (All/Free/Discount/Experience/Partner) + REWARD_FILTER_TABS + RewardSortOption + Reward type + filterRewards + sortRewards. Activities: ActivityStatus (5 values) + ActivityTab (active/completed/all) + ACTIVITY_TABS + ACTIVITY_TAB_LABELS + ActivityStep + Activity types + filterActivitiesByTab + computeActivityProgressLabel + deriveActivityCtaLabel (exhaustive). Reviews/referrals: ReviewAspect union (strings, not objects) + REVIEW_ASPECTS + AspectRating + ReviewDraft (overallRating/aspectRatings/text/photos) + EMPTY_REVIEW_DRAFT + MAX_REVIEW_PHOTOS (5) + MAX_REVIEW_TEXT_LENGTH (500) + isReviewSubmittable + ReferralStats + formatReferralCode. Zero React imports.
- **Screens - 9 screens across src/app/loyalty/, src/app/activities/, src/app/reviews/.** E.1 LoyaltyLandingScreen (ProgressRing hero + TierBadge + points balance + EarnActionRow list + history feed + loading skeleton {testID}-loading + StickyFooterCta with primaryTestID). E.2 RewardCatalogScreen (RewardFilterTab row + sort ModalSheet + RewardCard grid + loading/error/empty-per-tab). E.3 RewardRedemptionScreen (RewardCard hero + point cost/balance comparison + lock/insufficient/expired banners + earn-more hint in scroll body when insufficient + StickyCtaBar with proper primaryLabel/onPrimaryPress/primaryTestID/primaryDisabled props). E.4 ActivitiesScreen (SegmentedControl tabs + ActivityCard rows + filterActivitiesByTab). E.5 ActivityDetailScreen (activity header + step checklist + ProgressRing step progress + StickyCtaBar proper props). E.6 ClaimActivityRewardScreen (ModalSheet without title prop - avoids duplicate heading + "Reward earned!" heading + point award summary + StickyCtaBar Done). E.7 ReviewPromptScreen (overall RatingSelector size=32 + per-aspect RatingSelector size=24 + AspectChip row rendering {aspect} string + TextInput 500-char + PhotoUploadTile row + StickyCtaBar Submit with primaryDisabled=!submittable). E.8 ReviewDetailScreen (read-only display: author/date/stars/aspect pills/text/gallery/reply + loading/error; retry Pressable keyed {testID}-retry). E.9 ReferralScreen (formatReferralCode code block + copy + share + stats card + how-it-works).
- **Routes.** Nine new public guard:none routes: LoyaltyLanding /loyalty, RewardCatalog /loyalty/rewards, RewardRedemption /loyalty/rewards/redeem, Activities /loyalty/activities, ActivityDetail /loyalty/activities/detail, ClaimActivityReward /loyalty/activities/claim, ReviewPrompt /reviews/prompt, ReviewDetail /reviews/detail, Referral /loyalty/referral.

### Tests
- Root jest: 1,953 -> **2,045** passing across 128 -> **133** suites (+92 tests, +5 suites).
- Functions vitest: **187** passing across 14 suites (unchanged - Batch E is consumer-UI only).
- ``npx tsc --noEmit`` (root): 0 errors.

### Security
- No PCI surface. W25 screens handle loyalty points, reviews, and referral codes only.
- No new Firestore rules: all screens are props-driven with no Firestore I/O.
- Referral code is display-only (formatted from a caller-provided prop; no client-side generation).
- Review photos accepted as URI strings only; no file I/O or network upload in the component layer.
- WCAG 2.1 AA preserved: all interactives >=44x44; ProgressRing exposes accessibilityRole="progressbar" + accessibilityValue.now; RatingSelector exposes accessibilityRole="adjustable" + accessibilityState.disabled; RewardCard exposes accessibilityState.disabled when locked/redeemed.

### Architectural Notes
- Pure-helper pattern preserved. loyaltyHelpers.ts has zero React imports - tier thresholds / reward filtering / activity status derivation / referral formatting reusable in Cloud Functions without rewrites.
- StickyCtaBar contract: does NOT render children - requires primaryLabel + onPrimaryPress; optional primaryTestID / primaryDisabled. Three screens incorrectly used it as a children container and were corrected.
- StickyFooterCta vs StickyCtaBar: LoyaltyLandingScreen uses StickyFooterCta (total display + CTA with primaryTestID forwarded to inner Button). Activity/Review/Redemption screens use StickyCtaBar.
- TierBadge uses textTransform:"uppercase" in style - text content stays capitalized for RNTL queryability.
- RatingSelector stars have no accessibilityElementsHidden so getByTestId("rs-star-{n}") works in RNTL while the outer View carries the consolidated accessibility role.
- computeTierProgress returns 1.0 at Platinum; filterRewards("All") is a passthrough preserving order.
- ReviewAspect is a string union ("Service" / "Cleanliness" / "Value" / "Atmosphere") - not an object.

### Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))
- **No prior debts closed in W25.**
- **New W25 debts (3):**
  - W25-DEBT-1 - Backend loyalty service: points ledger Firestore write + Cloud Function trigger on booking-confirmed + getPointsBalance/getPointsHistory read ports.
  - W25-DEBT-2 - Reward redemption write path: redeemReward Cloud Function with idempotency + point deduction + reward-issuance document.
  - W25-DEBT-3 - Activity completion + claim write path: logActivityStep + claimActivityReward Cloud Functions.
- **Carried forward:** W19-DEBT-4, W19-DEBT-5, W20-DEBT-2, W20-DEBT-3, W20-DEBT-4, W22-DEBT-1, W22-DEBT-3, W23-DEBT-1, W23-DEBT-3, W24-DEBT-1, W24-DEBT-2, W24-DEBT-3.

### Index - Changed Files
- New (production): src/shared/ui/{ProgressRing,TierBadge,RewardCard,RatingSelector,PhotoUploadTile}.tsx; src/app/loyalty/loyaltyHelpers.ts; src/app/loyalty/{LoyaltyLandingScreen,RewardCatalogScreen,RewardRedemptionScreen,ReferralScreen}.tsx; src/app/activities/{ActivitiesScreen,ActivityDetailScreen,ClaimActivityRewardScreen}.tsx; src/app/reviews/{ReviewPromptScreen,ReviewDetailScreen}.tsx.
- New (tests): src/shared/ui/__tests__/loyalty-primitives.test.tsx; src/app/loyalty/__tests__/{loyaltyHelpers,loyaltyScreens}.test.ts(x); src/app/activities/__tests__/activitiesScreens.test.tsx; src/app/reviews/__tests__/reviewScreens.test.tsx.
- Modified: src/shared/ui/index.ts (W25 exports); src/app/navigation/routes.ts (+9 public /loyalty/* + /reviews/* routes); src/app/navigation/__tests__/routes.test.ts (snapshot extended); WEEKLY_LOG.md; PROGRAM_TRACKING_BOARD.md.

### Next-Week Prerequisites (Week 26)
W26 inherits W21+W22+W23+W24+W25 primitives unchanged. The Phase 2 consumer-UI surface area (auth + discover + booking + payments + loyalty/activities/reviews) is now feature-complete on the screen layer. W26 shifts to backend wiring: W25-DEBT-1/2/3 (loyalty backend, reward redemption, activity claims), W23-DEBT-1 (booking persistence Cloud Functions + read ports), W24-DEBT-2 (Stripe server-side payment infrastructure), W22-DEBT-1 (react-native-maps W28 target). Review submit path (submitReview Cloud Function) and referral claim path also required to fully activate E.7/E.9.

---

## Week 26 - Batch F: Messaging, Notifications, Waitlist (Consumer UI)

**Closed:** 2026-05-02 | **Test count:** 2045→2138 | **TS errors:** 0
**Window:** Week 26 (Phase 2 consumer-UI sixth sprint).
**Status:** ✅ Complete — all 7 screens (F.1–F.7), 5 new shared-UI primitives, 1 helper module (messagingHelpers.ts), TCPA + CAN-SPAM compliance embedded, all test gates delivered — GO for Week 27.
**Close report:** [WEEK26_CLOSE_REPORT.md](WEEK26_CLOSE_REPORT.md)

### Features Completed

| Task | Deliverable |
|------|------------|
| F primitives | `ChatBubble` — directional bubble (incoming warmOat bg / outgoing surface+coralBlossom border), status glyphs ✓/✓✓/coral ✓✓, `borderBottomLeftRadius 4` (incoming) / `borderBottomRightRadius 4` (outgoing) |
| F primitives | `AttachmentTile` — image (64×64 thumbnail) / file (56 h row with filename+size+download) variants |
| F primitives | `QuickReplyChip` — coral-blossom outline chip; Pressable with `label` + `onPress` + `testID` |
| F primitives | `NotificationRow` — 32 px toned icon + title/preview + time + unread dot; category→icon+bg map (booking/promo/reminder/system/loyalty) |
| F primitives | `PreferenceToggleRow` — RN `Switch` with `trackColor` design tokens; `accessibilityRole="switch"` |
| F helper | `messagingHelpers.ts` — 39+ exports: thread types + `filterThreadsByTab` + `countUnreadThreads`; `formatMessageTime` (12 h local) + `formatThreadDate` (relative) + `formatUsDate` (MM/DD/YYYY); notification types + `filterNotificationsByTab` + `groupNotificationsByDate` + `categorizeNotificationDate`; `NotificationPreferences` record + `DEFAULT_NOTIFICATION_PREFERENCES` (promotions all false); TCPA `isInQuietHours()` handles midnight-spanning windows; CAN-SPAM `CAN_SPAM_UNSUBSCRIBE_COPY` + `CAN_SPAM_SENDER_COPY`; waitlist types + `formatPositionLabel` + `formatWaitlistCountdown` |
| F.1 | `InboxScreen` — Banner + SegmentedControl tabs + search TextInput + FlatList threads; loading/empty/retry/compose testIDs |
| F.2 | `ThreadScreen` — inverted FlatList ChatBubble + AttachmentTile; typing indicator; QuickReplyChip row; multiline composer; blocked Banner; back/blocked-banner/send/loading/retry testIDs |
| F.3 | `ComposeScreen` — salon search → recipient chip → subject + composer; StickyCtaBar; back/recipient-search/send testIDs |
| F.4 | `NotificationCenterScreen` — SegmentedControl tabs + FlatList with date-group headers via `groupNotificationsByDate`; permission Banner; loading/empty/permission-banner/mark-all-read testIDs |
| F.5 | `NotificationPreferencesScreen` — 3-channel × 6-pref matrix PreferenceToggleRow; quiet-hours inputs + day chips; Reset to defaults; permission-denied-banner/pref-{key}-{channel}/reset-defaults testIDs |
| F.6 | `WaitlistJoinSheet` — ModalSheet with date range + time/staff prefs + TCPA SMS toggle (default false); StickyCtaBar; join-cta/notify-sms-toggle/already-banner testIDs |
| F.7 | `WaitlistPositionScreen` — hero position # + service name + salon card + estimated wait + slot-offer Banner (success) + leave/update CTAs; position/slot-offer/leave testIDs |
| Routes | 7 new public routes: Inbox `/messages`, Thread `/messages/thread`, Compose `/messages/compose`, NotificationCenter `/notifications`, NotificationPreferences `/notifications/preferences`, WaitlistJoin `/waitlist/join`, WaitlistPosition `/waitlist/position` |

### Tests and Quality Outcomes

- **New tests added this week:** +93 (2045 → 2138 total)
- Test suites: 138 | Failures: 0 | TS errors: 0
- New suites: `messaging-primitives`, `messagingHelpers`, `messagingScreens`, `notificationsScreens`, `waitlistScreens`
- Root-cause fixes: `MessageStatus "failed"` conditional at ChatBubble call site; `colors.surfaceAlt` → `colors.surface`; `formatMessageTime` tests rebuilt with `setHours()` for local Date correctness; `getAllByText` for multi-match preference labels; `group.group` field name; `n.category` / `!n.isRead` / `formatMessageTime(n.receivedAt)` field corrections; `NotificationPreferenceKey[]` typing; `QuietDay` capitalization; `estimatedWait: string` type

### Security

| Severity | Finding | Resolution |
|----------|---------|------------|
| **NONE** | No new Firestore rules surface — all screens are props-driven with no Firestore I/O | n/a |
| **LEGAL** | TCPA — SMS marketing and waitlist SMS-notify must default OFF | `DEFAULT_NOTIFICATION_PREFERENCES` promotions sms = false; `WaitlistJoinSheet` notifySms default false; `isInQuietHours()` helper exported; `QUIET_HOURS_START_DEFAULT = "21:00"` / `QUIET_HOURS_END_DEFAULT = "08:00"` |
| **LEGAL** | CAN-SPAM — Email marketing must default OFF; required sender identification on outbound email | promotions email = false in defaults; `CAN_SPAM_UNSUBSCRIBE_COPY` + `CAN_SPAM_SENDER_COPY` constants exported and surfaced in NotificationPreferencesScreen |

### Open Defects and Technical Debt

1. **[W26-DEBT-1]** Backend messaging service — Firestore `threads` + `messages` collections, `sendMessage` Cloud Function, `getThreadsForUser` / `getMessagesForThread` read ports. Target: W27 or Phase 3 backend pass.
2. **[W26-DEBT-2]** Push notification delivery infrastructure — FCM token registration, `sendPushNotification` Cloud Function, `createNotification` Firestore write path. Target: W27 or Phase 3 backend pass.
3. **[W26-DEBT-3]** Waitlist backend service — `waitlist` Firestore collection, `joinWaitlist` / `leaveWaitlist` / `notifyWaitlistSlot` Cloud Functions. Target: W27 or Phase 3 backend pass.
4. Carried: W19-DEBT-4, W19-DEBT-5, W20-DEBT-2/3/4, W22-DEBT-1/3, W23-DEBT-1/3, W24-DEBT-1/2/3, W25-DEBT-1/2/3.

### Index — Changed Files

- New: `src/shared/ui/{ChatBubble,AttachmentTile,QuickReplyChip,NotificationRow,PreferenceToggleRow}.tsx`
- New: `src/app/messaging/messagingHelpers.ts`
- New: `src/app/messaging/{InboxScreen,ThreadScreen,ComposeScreen}.tsx`
- New: `src/app/notifications/{NotificationCenterScreen,NotificationPreferencesScreen}.tsx`
- New: `src/app/waitlist/{WaitlistJoinSheet,WaitlistPositionScreen}.tsx`
- New (tests): `src/shared/ui/__tests__/messaging-primitives.test.tsx`; `src/app/messaging/__tests__/{messagingHelpers,messagingScreens}.test.ts(x)`; `src/app/notifications/__tests__/notificationsScreens.test.tsx`; `src/app/waitlist/__tests__/waitlistScreens.test.tsx`
- Modified: `src/shared/ui/index.ts` (+5 W26 primitive exports + types); `src/app/navigation/routes.ts` (+7 routes); `src/app/navigation/__tests__/routes.test.ts` (snapshot extended)

### Next-Week Prerequisites (Week 27)

Phase 2 consumer-UI is now complete across all six batches (A–F). W27 options:
- **Backend wiring sprint:** close W26-DEBT-1/2/3 + W23-DEBT-1 + W24-DEBT-2 + W25-DEBT-1/2/3 (highest priority — gates live data end-to-end).
- **Phase 2 extension:** remaining Phase 2 W28 items (react-native-maps W22-DEBT-1, editorial-feed W22-DEBT-3).

