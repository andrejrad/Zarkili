# Spec Audit Inventory
**Generated:** 2026-05-24  
**Branch:** audit/spec-inventory  
**Purpose:** Canonical list of every spec in this codebase, with priority order for the 3-week audit.

> **STATUS: PAUSED 2026-05-24** — Audit paused for 2-week customer development phase. Founder is interviewing 20 Pacific NW salon owners to validate v1 scope. Likely changes to come: consumer marketplace cut from v1, specialization to specific salon segment, possible feature scope reduction. Re-evaluate inventory priorities once customer development complete.

---

## 1. Full Documentation Catalog

### 1.1 SPEC — describes how something SHOULD work

#### Consumer-facing

| ID | File | Lines | Last Modified | Version | Audience | Complexity | Notes |
|----|------|-------|---------------|---------|----------|-----------|-------|
| S01 | `new-platform/zarkili_booking_flow_spec_v2.md` | 738 | 2026-05-21 | v1.1 | Consumer | **L** | End-to-end 6-step booking; all entry points; skip/pre-fill logic |
| S02 | `new-platform/zarkili_explore_tab_spec_v2.md` | 769 | 2026-05-22 | v2.0 | Consumer | **L** | Service-browser: search/filter, category chips, map view, guest vs auth |
| S03 | `new-platform/zarkili_home_tab_spec_v2.md` | 557 | 2026-05-21 | v2.0 | Consumer | **M** | Home dashboard: next appt, quick rebook, loyalty nudge, guest discovery |
| S04 | `new-platform/zarkili_rewards_tab_spec.md` | 763 | 2026-05-21 | v1.0 | Consumer | **L** | Rewards/loyalty UX: tiers, redeem, earn-more, history; lists 9 known bugs |
| S05 | `new-platform/zarkili_home_empty_states_spec_v2.md` | 377 | 2026-05-21 | v2 | Consumer | **S** | Empty state variants for all home-tab conditions |
| S06 | `new-platform/zarkili_explore_map_fixes_v3.md` | 546 | 2026-05-21 | v3 | Consumer | **M** | Map view sub-feature within Explore tab; supplement to S02 |
| S07 | `new-platform/DISCOVERY_SCAFFOLD.md` | 50 | 2026-04-27 | — | Consumer | **S** | Discovery route/scaffold reference |
| S08 | `new-platform/ONBOARDING_ROUTE_SCAFFOLD.md` | 80 | 2026-04-19 | — | Consumer | **S** | Onboarding route wiring reference |
| S09 | `new-platform/MARKETPLACE_PERSONALIZATION.md` | 68 | 2026-04-27 | v1 (W20) | Consumer | **S** | AI feed re-ranking: signals, cold-start, cost-guard degradation |

#### Admin-facing (salon owner/manager/staff)

| ID | File | Lines | Last Modified | Version | Audience | Complexity | Notes |
|----|------|-------|---------------|---------|----------|-----------|-------|
| S10 | `SALON_ONBOARDING_SPECS.md` | 369 | 2026-04-17 | — | Admin | **M** | Full 9-step salon onboarding wizard: profile → Stripe → services → staff → policies → availability → marketplace → verify |
| S11 | `new-platform/CLIENT_ONBOARDING_MODULES.md` | 140 | 2026-04-27 | — | Admin | **S** | Per-module onboarding checklist (supplement to S10) |
| S12 | `new-platform/SALON_ONBOARDING_OPERATIONS.md` | 171 | 2026-04-27 | — | Admin | **S** | Operational runbook for onboarding new salons |
| S13 | `CLIENT_ONBOARDING.md` | 310 | 2026-04-17 | — | Admin | **S** | Client (consumer) onboarding UX from admin perspective |
| S14 | `FREE_TRIAL_SPECS.md` | 257 | 2026-04-17 | — | Admin | **S** | Free-trial lifecycle: states, durations, upgrade flow |
| S15 | `new-platform/SERVICES.md` | 62 | 2026-04-19 | W3.1 | Admin | **S** | Service domain layer: model, repo API, validation |
| S16 | `new-platform/STAFF.md` | 56 | 2026-04-19 | — | Admin | **S** | Staff domain: model, repo API |
| S17 | `new-platform/STAFF_SCHEDULES.md` | 60 | 2026-04-19 | — | Admin | **S** | Staff schedule domain: model, repo API |
| S18 | `new-platform/TENANTS.md` | 57 | 2026-04-19 | — | Admin | **S** | Tenant domain: model, repo API |
| S19 | `new-platform/TENANT_USERS.md` | 96 | 2026-04-19 | — | Admin | **S** | Tenant user roles/permissions model |
| S20 | `new-platform/LOCATIONS.md` | 52 | 2026-04-19 | W2.3 | Admin | **S** | Location domain: model, repo API, known gaps |
| S21 | `new-platform/ANALYTICS_QUERIES.md` | 158 | 2026-04-27 | W11 | Admin | **S** | Tenant analytics: retention rate, rebooking rate, staff performance formulas |
| S22 | `new-platform/SEGMENTS.md` | 92 | 2026-04-27 | — | Admin | **S** | Customer cohort engine: 4 baseline segments, marketing-consent enforcement |

#### Both consumer and admin

| ID | File | Lines | Last Modified | Version | Audience | Complexity | Notes |
|----|------|-------|---------------|---------|----------|-----------|-------|
| S23 | `PAYMENT_FEATURE_SPECS.md` | 374 | 2026-04-17 | — | Both | **M** | Product-level payment flows: deposit, full, CoF, cancel fees, refunds, receipts |
| S24 | `new-platform/zarkili-stripe-payments.md` | 734 | 2026-05-21 | — | Both | **M** | Stripe implementation: tenant subscriptions, client payments, schema, CoF |
| S25 | `LOYALTY_FUNCTIONAL_SPEC_V1.md` | 185 | 2026-04-17 | v1.0 | Both | **S** | Full loyalty functional spec: enrollment, tiers, earning, redemption, referrals, admin UI |
| S26 | `new-platform/LOYALTY_RULES.md` | 145 | 2026-04-27 | — | Both | **S** | Loyalty domain layer: ledger, config model, earning rules engine |
| S27 | `new-platform/MESSAGING.md` | 95 | 2026-04-27 | W7 | Both | **S** | Messaging: consumer-to-salon threads, unread count, admin console, bulk send |
| S28 | `new-platform/REVIEWS_AND_RATINGS.md` | 134 | 2026-04-27 | — | Both | **S** | Reviews: consumer submission, admin moderation queue lifecycle, aggregated ratings |
| S29 | `MARKETPLACE_SPECS.md` | 370 | 2026-04-17 | — | Both | **M** | Product-level marketplace: feed, salon profiles, posts/"book this look", anti-commission |
| S30 | `new-platform/MARKETPLACE_DOMAIN.md` | 116 | 2026-04-27 | — | Both | **S** | Marketplace data model: SalonPublicProfile, MarketplacePost, visibility modes |
| S31 | `new-platform/MARKETPLACE_GUARDRAILS.md` | 131 | 2026-04-27 | W17 | Both | **S** | 4 guardrails: no competitor recs, salon owns client, no commission messaging, visibility control |
| S32 | `US_PRIMARY_MARKET_ADDENDUM.md` | 118 | 2026-05-11 | — | Both | **S** | US market constraints: currency, phone format, timezone, address validation |
| S33 | `new-platform/NAVIGATION_PUBLIC_PROTECTED.md` | 40 | 2026-04-19 | — | Both | **S** | Public vs protected route rules |

#### Internal / backend domain specs

| ID | File | Lines | Last Modified | Version | Audience | Complexity | Notes |
|----|------|-------|---------------|---------|----------|-----------|-------|
| S34 | `new-platform/zarkili_service_data_model_v3 (2).md` | 1283 | 2026-05-21 | v3 | Internal | **L** | Full service/variant/addon/photo data model; largest spec in the codebase |
| S35 | `new-platform/SLOT_ENGINE.md` | 136 | 2026-04-27 | — | Internal | **S** | Slot generation algorithm: schedule template + bookings → available slots |
| S36 | `new-platform/NOTIFICATION_EVENTS.md` | 178 | 2026-04-27 | W6.1 | Internal | **S** | Notification event contract: 6 event types, payload envelope, recipient model |
| S37 | `new-platform/AI_CHAT_POLICY.md` | 42 | 2026-04-27 | W19 | Internal | **S** | AI chat cost-guard: budget-state degradation, tenant isolation, safety filters |
| S38 | `new-platform/AI_DATA_CONTRACTS.md` | 187 | 2026-04-27 | — | Internal | **S** | AI feature data contracts: input/output shapes, versioning |
| S39 | `new-platform/AI_RISK_MODEL_POLICY.md` | 91 | 2026-04-27 | — | Internal | **S** | AI risk model: confidence thresholds, escalation paths |
| S40 | `new-platform/AI_RUNTIME_AND_COST_POLICY.md` | 200 | 2026-04-19 | — | Internal | **S** | AI runtime: cost budgets, degradation levels, tenant isolation |
| S41 | `new-platform/AI_RETENTION_INSIGHTS.md` | 47 | 2026-04-27 | — | Internal | **S** | Retention AI: at-risk signals, reactivation trigger logic |

#### Deferred (Phase 4 / post-GA)

| ID | File | Lines | Last Modified | Version | Audience | Complexity | Notes |
|----|------|-------|---------------|---------|----------|-----------|-------|
| S42 | `AI_FEATURES_SPECS.md` | 385 | 2026-04-19 | — | Both | **M** | 9 AI product categories; Phase 4 scope |
| S43 | `AI_SUPPORT_SYSTEM_ARCHITECTURE.md` | 733 | 2026-04-17 | — | Both | **M** | AI Support Router architecture; explicitly Phase 4 post-GA |

---

### 1.2 DEBT / ROADMAP — tracks gaps or future work

| File | Notes |
|------|-------|
| `new-platform/DEBT_REGISTER.md` | Canonical debt tracker; active |
| `PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md` | Phase 2 roadmap; completed |
| `PHASE2_2_NAVIGATION_WIRING_WEEKS_33_TO_34.md` | Phase 2 sub-plan; completed |
| `PHASE2_3_CONSUMER_FIREBASE_INTEGRATION_WEEKS_35_TO_37.md` | Phase 2 sub-plan; completed |
| `PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md` | Phase 3 roadmap; completed |
| `PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_50_TO_54.md` | Current release-readiness plan |
| `PHASE4_AI_SUPPORT_SYSTEM_PLAN_WEEKS_55_TO_57.md` | Post-GA AI roadmap |
| `new-platform/PILOT_GO_LIVE.md` | Pilot launch checklist/plan |
| `PROGRAM_TRACKING_BOARD.md` | Program-level status board |
| `PROJECT_GANTT_AGILE_PLAN.md` | Full project Gantt |
| `new-platform/SECURITY_COMPLIANCE_REVIEW_PLAN.md` | Security/compliance audit plan |
| `new-platform/WEEK49_5_QA_SPRINT_PLAN.md` | W49.5 QA sprint plan |
| `new-platform/zarkili_explore_implementation_plan.md` | Explore feature implementation plan (716 lines) |
| `MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md` | Early-phase multitenant strategy |

### 1.3 HANDOVER — historical context from prior phases

| File | Notes |
|------|-------|
| `HANDOVER/00_README.md` through `08_DESIGN_HANDOFF.md` | Active handover reference docs |
| `HANDOVER/CLAUDE*.md` | Harness-level CLAUDE.md references |
| `new-platform/PHASE1_COMPLETION_REPORT.md` | Phase 1 close |
| `new-platform/PHASE3_COMPLETION_REPORT.md` | Phase 3 close |
| `new-platform/WEEK1_REVIEW_REPORT.md` | W1 review |
| `new-platform/WEEK*_CLOSE_REPORT.md` (W12–W49) | Per-week close reports (38 files) |
| `new-platform/WEEKLY_LOG.md` | Cumulative weekly log |
| `new-platform/WEEK4_VALIDATION.md` | W4 validation |
| `new-platform/WEEK35_QA_MOCK_FINDINGS.md` | W35 QA findings |
| `new-platform/WEEK35_QA_TEST_CASES.md` | W35 QA test cases |
| `MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md` | Early multitenant integration summary |
| `MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md` | Execution blueprint (early phase) |
| `MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md` | Template doc |
| `MULTITENANT_MASTER_INDEX.md` | Early multitenant index |
| `MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md` | Early AI copilot prompts |
| `MULTITENANT_WEEKS_5_TO_8_COPILOT_PROMPTS.md` | |
| `MULTITENANT_WEEKS_9_TO_12_COPILOT_PROMPTS.md` | |
| `MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md` | |
| `new-platform/WEEK2_TASK24_ADMIN_SCREENS_EXECUTION_PACK.md` | W2 execution pack |
| `new-platform/WEEK2_TASK25_DISCOVERY_SCAFFOLD_EXECUTION_PACK.md` | W2 execution pack |
| `new-platform/WEEK3_TASK34_ADMIN_SCREENS_EXECUTION_PACK.md` | W3 execution pack |
| `W36_FIREBASE_SERVICE_GAP_REPORT.md` | W36 gap report |
| `W36_FIRESTORE_RULES_PRE_REVIEW.md` | W36 pre-review |
| `W36A_WIRE_UP_CHECKLIST.md` | W36 wire-up checklist |

### 1.4 DIARY — session notes

| File | Notes |
|------|-------|
| `DIARY_2026-05-21.md` | Active diary |
| `DIARY_2026-05-22.md` | Active diary |
| `DIARY_2026-05-23.md` | Active diary |
| `diary/2026-04-16-*.md` through `diary/2026-05-09-*.md` | Older diary entries (13 files) |

### 1.5 OTHER — templates, design artifacts, audit reports

| File | Notes |
|------|-------|
| `figma-prompts/` (22 files) | Figma prompt templates for each batch — design artifacts, not specs |
| `AI_FIRST_GENZ_DESIGN_PLAYBOOK.md` | Design playbook |
| `FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md` | Design-to-dev process |
| `FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md` | Figma priority list |
| `DAILY_WORK_DIARY_TEMPLATE.md` | Template |
| `DIARY_90_SECOND_CHECKLIST.md` | Checklist template |
| `DAY1_DEVELOPMENT_CHECKLIST.md` | Checklist template |
| `DOCUMENTATION_COMMAND_CENTER.md` | Doc index |
| `new-platform/ARCHITECTURE_OVERVIEW.md` | Architecture reference |
| `new-platform/ENV_SETUP.md` | Environment setup |
| `new-platform/SECURITY_RULES_FINAL.md` | Firestore security rules |
| `new-platform/CROSS_PLATFORM_CAPABILITY_MATRIX.md` | Platform capability matrix |
| `new-platform/CROSS_PLATFORM_READINESS_AUDIT_2026-04-19.md` | Readiness audit |
| `new-platform/USER_TENANT_ACCESS.md` | Access control reference |
| `new-platform/AI_FEATURES_IMPLEMENTATION_COVERAGE_MATRIX.md` | AI coverage matrix |
| `new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md` | Admin UI conventions |
| `AUTH_A11Y_AUDIT_2026-04-29.md` | Auth accessibility audit |
| `LINT_DEBT_TRIAGE_2026-04-29.md` | Lint debt triage |
| `MOCK_DATA_AUDIT_2026-04-29.md` | Mock data audit |
| `VALIDATION_CYCLE_SLICE1_MOCK.md` | Validation cycle mock |
| `new-platform/MARKETING_ANALYTICS.md` | Marketing analytics reference |
| `new-platform/MARKET_PERSONALIZATION.md` | Marketing personalization reference |

---

## 2. Prioritized Audit Order

### Rationale

Priority is assigned by: (1) whether the flow directly blocks a consumer transaction (revenue), (2) whether the flow blocks salon supply (onboarding), (3) whether the flow has known bugs already documented in the spec itself, (4) recency of last spec update (newer = more likely to reflect intent).

**Explicitly deferred:** Specs S42–S43 (Phase 4 AI features) are out of scope for this audit per `CLAUDE.md §Out-of-scope`. Only audit if explicitly instructed.

---

### Week 1 — Critical consumer transaction path

| # | Spec IDs | Flow | Est. Days | Why First |
|---|----------|------|-----------|-----------|
| 1 | S01 | Booking flow (v1.1, 738L) | 2.5 | The primary revenue action. Every other feature leads into or follows from a booking. If booking has gaps, nothing else matters. |
| 2 | S23 + S24 | Payments: product spec + Stripe implementation (374+734L) | 2.5 | Booking without payment is incomplete. Auditing both together catches gaps between product intent and implementation layer. |
| 3 | S03 + S05 | Home tab v2 + empty states (557+377L) | 1.5 | Returning-user experience; rebooking and personalization live here. Second in expected traffic after Explore. |

**Week 1 total: ~6.5 days**

---

### Week 2 — Discovery + supply

| # | Spec IDs | Flow | Est. Days | Why Second |
|---|----------|------|-----------|-----------|
| 4 | S02 + S06 | Explore tab v2 + map fixes (769+546L) | 3.0 | Primary discovery surface. Users who can't find a service never reach booking. High traffic, high stakes. Map is a distinct sub-feature at 546L — audit separately but same week. |
| 5 | S10 + S11 + S12 | Salon onboarding (369+140+171L) | 2.0 | No salons = no supply. Must work before pilot. Admin-side but equally launch-blocking. Three docs form one logical flow. |

**Week 2 total: ~5.0 days** _(buffer for spillover from Week 1)_

---

### Week 3 — Differentiators + domain fundamentals

| # | Spec IDs | Flow | Est. Days | Why Third |
|---|----------|------|-----------|-----------|
| 6 | S04 | Rewards tab v1.0 (763L) | 2.0 | Key differentiator; spec already documents 9 known bugs — high audit value. |
| 7 | S34 + S15–S17 | Service data model v3 + Services/Staff/Schedules domain (1283+62+56+60L) | 1.5 | Service/staff/schedule domain underpins all booking. Data model v3 is 1283 lines; batch with small domain docs. |
| 8 | S25 + S26 | Loyalty: functional spec + rules (185+145L) | 0.5 | Two loyalty docs covering different layers — batch as one S-tier audit. |
| 9 | S27 | Messaging (95L) | 0.5 | Supporting feature, soft-launch tolerance but needs baseline audit. |
| 10 | S28 | Reviews & ratings (134L) | 0.5 | Same as messaging. |
| 11 | S29 + S30 + S31 | Marketplace: product + domain + guardrails (370+116+131L) | 1.5 | Discovery ecosystem; marketplace guardrails are contractual commitments to salons. |

**Week 3 total: ~6.5 days**

---

### Stretch — If time allows (not scheduled)

| Spec IDs | Flow | Rationale |
|----------|------|-----------|
| S35 | Slot engine | Internal algorithm; audit confirms booking availability logic |
| S36 | Notification events | Contract for 6 event types; drift risk vs Cloud Functions |
| S14 | Free trial | Sales motion; not launch-blocking if trial is gated |
| S21 + S22 | Analytics + Segments | Admin reporting; can ship without full audit |
| S37–S41 | AI policies batch | Phase 3.5 AI surfaces; audit together in one session |

---

## 3. Estimated Total Audit Effort

| Tier | Specs | Complexity | Est. Days |
|------|-------|-----------|-----------|
| Tier 1: Consumer transaction | S01, S23, S24, S03, S05 | 2×L + 2×M + 1×S | 6.5 |
| Tier 2: Discovery + supply | S02, S06, S10, S11, S12 | 2×L + 1×M + 2×S | 5.0 |
| Tier 3: Differentiators + domain | S04, S34, S15–S17, S25–S31 | 1×L + 1×M + 8×S | 6.5 |
| **Scheduled total** | **21 specs** | | **~18 days** |
| Stretch | S35, S36, S14, S21, S22, S37–S41 | 10×S | ~5 days |

> 18 working days across 3 calendar weeks (15 days) is achievable by batching all S-tier specs — treat each S as a half-day item and pair two per day.

---

## 4. Flags and Open Questions

### 4.1 Duplicate / superseded specs — verify before auditing

| Flag | Files | Issue |
|------|-------|-------|
| **FLAG-1** | `zarkili_home_tab_spec.md` vs `zarkili_home_tab_spec_v2.md` | **Identical line count (557 each), same last-modified date (2026-05-21).** May be byte-for-byte identical — if so, v1 is dead weight and should be archived to avoid confusion. Verify before auditing home tab. |
| **FLAG-2** | `zarkili_home_empty_states_spec.md` (359L) vs `_v2.md` (377L) | Near-identical. v1 likely superseded by v2. Confirm and archive v1 if so. |
| **FLAG-3** | `zarkili_home_spec_diff.md` + `zarkili_home_spec_diff_v2.md` | Diff documents (99L + 186L). They exist to document what changed between spec versions. Confirm that all changes described in these diffs are absorbed into the current v2 spec before discarding. |

### 4.2 Overlapping specs — risk of drift

| Flag | Files | Issue |
|------|-------|-------|
| **FLAG-4** | `PAYMENT_FEATURE_SPECS.md` (2026-04-17) vs `zarkili-stripe-payments.md` (2026-05-21) | Product spec vs implementation spec, ~35 days apart, no visible cross-reference. Implementation spec is newer; check that product-level rules (cancel fees, partial refunds, CoF) are fully reflected in the Stripe implementation doc. |
| **FLAG-5** | `LOYALTY_FUNCTIONAL_SPEC_V1.md` (2026-04-17) vs `LOYALTY_RULES.md` (2026-04-27) | Two loyalty docs at different abstraction levels. LOYALTY_RULES was updated 10 days later — check earning/redemption rules are consistent. |
| **FLAG-6** | `MARKETPLACE_SPECS.md` (2026-04-17) vs `MARKETPLACE_DOMAIN.md` + `MARKETPLACE_GUARDRAILS.md` + `MARKETPLACE_PERSONALIZATION.md` (2026-04-27) | Four marketplace docs. MARKETPLACE_SPECS is the oldest and highest-level; the three new-platform docs are more recent. Audit for contradictions in visibility rules and the anti-commission vocabulary list. |
| **FLAG-7** | `SERVICES.md` (2026-04-19) vs `zarkili_service_data_model_v3 (2).md` (2026-05-21) | Domain layer vs full data model — 32 days apart. Data model v3 almost certainly supersedes SERVICES.md. Verify SERVICES.md is still consistent with v3 field names and validation boundaries. |

### 4.3 Stale specs — last modified > 30 days before most recent spec batch

| Flag | Files | Issue |
|------|-------|-------|
| **FLAG-8** | `SALON_ONBOARDING_SPECS.md`, `PAYMENT_FEATURE_SPECS.md`, `LOYALTY_FUNCTIONAL_SPEC_V1.md`, `MARKETPLACE_SPECS.md`, `CLIENT_ONBOARDING.md` | All share last-modified 2026-04-17 — likely committed in a single batch, never updated. These are 37+ days old while core consumer specs were refreshed 2026-05-21. High staleness risk. |
| **FLAG-9** | `STAFF.md`, `SERVICES.md`, `LOCATIONS.md`, `TENANTS.md`, `TENANT_USERS.md` | Last modified 2026-04-19; domain layer spec for foundational entities. Any model change since W3 may not be reflected. |

### 4.4 Missing specs — features known to exist in code but lacking a dedicated spec

| Flag | Feature | Evidence |
|------|---------|---------|
| **FLAG-10** | **Auth flow (login / signup / forgot password)** | Figma BATCH_A covers auth screens; no `zarkili_auth_spec*.md` exists. |
| **FLAG-11** | **Cancellation / reschedule flow (consumer-facing)** | Referenced in booking spec as linked flows; no dedicated spec. |
| **FLAG-12** | **Staff app screens** | BATCH_G figma prompt exists; no staff-app spec. |
| **FLAG-13** | **Admin booking calendar / operations** | BATCH_O figma prompt exists; no dedicated spec beyond SLOT_ENGINE.md. |
| **FLAG-14** | **Waitlist feature** | Referenced in BATCH_F; no spec file. |
| **FLAG-15** | **Push notification UX (consumer)** | `NOTIFICATION_EVENTS.md` covers the backend contract; no spec for the consumer notification preferences / display UI. |

### 4.5 Scope boundary — do not audit

- `AI_FEATURES_SPECS.md` (S42) and `AI_SUPPORT_SYSTEM_ARCHITECTURE.md` (S43) are explicitly Phase 4 / post-GA per `CLAUDE.md §Out-of-scope`.
- `figma-prompts/` — design artifacts, not implementation specs.
- `HANDOVER/` — historical context, not auditable specs.
- `WEEK*_CLOSE_REPORT.md` — historical records.
