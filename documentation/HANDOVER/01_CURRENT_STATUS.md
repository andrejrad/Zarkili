# 01 — Current Project Status

**As of 2026-05-20** (post W50 booking-flow audit closure)
**Build phase:** end of Phase 3 → Release-Candidate window
**Working area at handover:** Explore Tab v2 build is the next active workstream.

---

## 1. Phase status

| Phase | Scope | Weeks | Status | Authoritative report |
|-------|-------|-------|--------|----------------------|
| Phase 1 | Domain model, RBAC, booking engine, analytics, pilot readiness | W1 – W12 | ✅ complete | [PHASE1_COMPLETION_REPORT.md](../new-platform/PHASE1_COMPLETION_REPORT.md) |
| Phase 2 | Consumer UI (client flows), onboarding, permissions, i18n | W21 – W34 | ✅ complete | [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md](../PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md), [PHASE2_2_NAVIGATION_WIRING_WEEKS_33_TO_34.md](../PHASE2_2_NAVIGATION_WIRING_WEEKS_33_TO_34.md), [PHASE2_3_CONSUMER_FIREBASE_INTEGRATION_WEEKS_35_TO_37.md](../PHASE2_3_CONSUMER_FIREBASE_INTEGRATION_WEEKS_35_TO_37.md) |
| Phase 3 | Admin UI + Platform super-admin, compliance, release readiness | W36 – W49 | ✅ complete | [PHASE3_COMPLETION_REPORT.md](../new-platform/PHASE3_COMPLETION_REPORT.md) |
| W50 | Full booking-flow spec audit + 18-item remediation | W50 | ✅ closed | DEBT_REGISTER §W50 (all 18 items closed) |
| RC + post-launch | App Store / Play submission, monitoring, post-launch debt | W51+ | 🟡 next |

---

## 2. Quality baseline

| Metric | Value | Source |
|--------|-------|--------|
| Total tests | **3 667** | `npx jest --no-coverage` |
| Test suites | **182** | same |
| Failing tests | 0 | same |
| TypeScript errors | 0 | `npm run typecheck` |
| Open P0 / P1 security issues | 0 | [PHASE3_COMPLETION_REPORT.md](../new-platform/PHASE3_COMPLETION_REPORT.md) §5 |
| Critical defects | 0 | — |
| Open **release-blocking** debt | 0 | [DEBT_REGISTER.md](../new-platform/DEBT_REGISTER.md) (all remaining open items are Low/Medium and tagged Post-launch or Future) |

Approx. ~3 000 tests are unit/component tests against in-memory or mocked Firestore; emulator-bound rules tests live in `__tests__/firestore.rules.test.ts` and run via `npm run test:rules`.

---

## 3. Surface delivered (high-level)

### 3.1 Consumer surface (Phase 2)

| Cluster | Screens / capabilities |
|---------|------------------------|
| Auth & onboarding | Email/password, social (Apple/Google), guest path, draft-resumable client + salon onboarding wizards |
| Discovery | Home (Quick Rebook, Trending strip, sponsored), Explore (v1 — being rewritten to v2), SalonProfile, ServiceDetail, StaffMemberDetail, ExploreSearchResults, ExploreMap |
| Booking flow | 6-step wizard: Service → Staff → Date/Time → Review → Policies → Payment → Confirmation. Spec v2 fully audited & closed in W50 |
| Loyalty | Brand-level (`user_brand_loyalty`) points + tier + redemption preview in payment step |
| Marketplace | Discoverable feed, sponsored posts, marketplace acquisitions persisted on booking |
| Messaging | In-app threads (`threads/{id}/messages`), unread aggregation |
| Notifications | In-app notification feed + per-user notification prefs |
| Reviews | Submission (pending_moderation), aggregate rendering on profile + service detail |
| Payments | Stripe payment intents on booking, refunds, payment-method management (`clients/{uid}/paymentMethods`), Apple/Google Pay path (currently disabled — see NEW-DEBT-E) |
| Waitlist | Per-booking waitlist with notification hooks |

### 3.2 Tenant admin surface (Phase 3 clusters A–F)

| Cluster | Anchor screens |
|---------|----------------|
| A — Tenant core (W36–W38) | TenantDashboard, TenantSettings, TeamManagement, ServiceCatalogAdmin, BookingRules, Subscription |
| B — Location & schedule (W39–W41) | LocationList/Detail, ResourceManagement, StaffSchedule, WalkInQueue, DailyClose |
| C — Billing & revenue (W42–W43) | BillingDashboard, InvoiceHistory, PaymentMethods, PayoutHistory, ConnectOnboarding, RefundManagement |
| D — Analytics & insights (W44–W45) | RevenueAnalytics, StaffPerformance, ClientRetention, BookingFunnel, MarketplacePerformance |
| E — Loyalty / notifications / staff admin (W46–W47) | LoyaltyProgramAdmin, LoyaltyCampaignAdmin, NotificationTemplate / Schedule, StaffHoursAdmin, StaffIncentives |
| F — AI admin & marketplace tools (W48) | AiToggles, AiBudgetConfig, AiSuggestionQueue, AiUsageAnalytics, AiAuditLog, MarketplacePostComposer, PerPostPerformance, AntiTheftComplianceDashboard |

Full breakdown: [PHASE3_COMPLETION_REPORT.md §2](../new-platform/PHASE3_COMPLETION_REPORT.md).

### 3.3 Platform super-admin surface (W49 — cluster G)

20 screens delivered in [src/app/admin/](../../src/app/admin/), all guarded by `assertPlatformAdmin(role)`:

- TenantDirectory, TenantDetail, SuspendTenant, Impersonation (30-min cap), CrossTenantAnalytics, PlatformHealthDashboard, PricingPlanManagement, FeatureFlagConsole, PlatformAuditLog, MarketplaceModerationQueue, CrossTenantAiBudget, MigrationRunner, BackupRestoreStatus, SupportInbox, SecurityEventsDashboard, DataExportRequest, ConsentPolicyLog, IncidentResponse, AdminSignIn, RoleDenied.

Three platform-admin service factories: `platformAdminService`, `impersonationService`, `featureFlagAdminService` — all in [src/app/admin/](../../src/app/admin/).

---

## 4. Recent significant closures (last ~3 weeks)

| ID | What | Where to read |
|----|------|---------------|
| W49 cluster G (20 screens) | Platform super-admin shipped | [WEEK49_CLOSE_REPORT.md](../new-platform/WEEK49_CLOSE_REPORT.md) |
| W50 booking-flow audit | 18 items closed (BUG-A, B, C, D, all GAPs except 2 + 5) | [DEBT_REGISTER §W50](../new-platform/DEBT_REGISTER.md) |
| NEW-DEBT-B (Firestore path migration) | B1 (loyalty) + B2a–e (catalogue + CFs + rules) closed; B3 (locations top-level → brands) still open | [DEBT_REGISTER NEW-DEBT-B](../new-platform/DEBT_REGISTER.md) |
| NEW-DEBT-I | 5 sub-items: discoverScreens mocks, AiTogglesScreen testID, AppNavigatorShell tests, AppNavigatorShell.webRouting tests, AppProviders/AuthProvider/SalonOnboardingStepScreens — all closed; full suite 3 667 / 3 667 | [DEBT_REGISTER NEW-DEBT-I](../new-platform/DEBT_REGISTER.md) |
| KI-003 + KI-004 | Both pre-W11 known issues closed (rules emulator tests + tenant feature flags) | DEBT_REGISTER |

---

## 5. What is **not** yet built

These are deliberate scope decisions — *not* defects:

| Area | Status | Rationale |
|------|--------|-----------|
| Apple Pay / Google Pay UI path | UI gated off via `applePayAvailable={false}` literal | Stripe wallet handler not wired — would mislead users (tracked NEW-DEBT-E) |
| Multi-service cart booking | Hard-disabled with dev `console.warn` when `consumerSelectedServiceIds.length > 1` | v1 scope is single-service per booking; cart is v2 (NEW-DEBT-D closed) |
| Explore Tab v2 | v1 currently in production code (HandoffScreens `ExploreRouteScreen`); v2 spec authored | Next major workstream |
| Brand-level (cross-location) catalogue browsing | Out of scope for v1 | Spec §11 explicitly out-of-scope |
| Voice search, AR try-on, party booking | Out of scope for v1 | Spec §11 |
| `firestore.indexes.json` lookback for `locations` top-level → `brands/{id}/locations/{id}` migration | B3 of NEW-DEBT-B still open | Cross-cuts every booking write — deferred to a dedicated sprint |

---

## 6. Risk posture (one-line)

The codebase is **release-candidate-ready** for the Phase 1 pilot tenant (Zara) and ready for Phase 3 admin onboarding. The only remaining blockers to "general availability for new tenants" are the items called out in [04_DEBT_BUGS_GAPS.md](04_DEBT_BUGS_GAPS.md) §3 (post-launch debt) and the operational checklist in [PILOT_GO_LIVE.md](../new-platform/PILOT_GO_LIVE.md).

---

## 7. Headline numbers since W1

| Metric | Value |
|--------|-------|
| Weeks delivered | 50 across 3 phases |
| Admin screens (Phase 3) | 56 + 20 platform-admin |
| Service factories (Phase 3) | 11 + 3 platform-admin |
| Routes wired in `AppNavigatorShell.tsx` | ~190 |
| Cloud Functions in `functions/src/` | 23 callable / scheduled / triggered |
| Firestore top-level + nested collection rules | 79 `match` blocks |
| Lines in `AppNavigatorShell.tsx` | ~12 900 (acknowledged debt — see ARCHITECTURE) |
