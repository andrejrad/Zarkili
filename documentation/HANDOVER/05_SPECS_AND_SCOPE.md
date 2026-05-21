# 05 — Specs and Scope

**Purpose:** map every product surface to its authoritative spec, and call out v1 in/out of scope.

All specs live under `documentation/new-platform/` and `documentation/`. Phase rollups in PHASE1/PHASE3 completion reports.

---

## 1. Product positioning (one line)

> Zarkili is a **multi-tenant SaaS** for salons + a **consumer marketplace** that browses **services**, not salons. Each Explore card is one bookable service at one location.

Business hierarchy:

```
Brand        e.g. "Glam Studio"
  Location   e.g. "Glam Studio · Shoreditch"
    Service  e.g. "Gel manicure" — one Explore card
    Type     (variants: Short / Medium / Long are NOT separate cards)
```

A single-location brand with 6 services = 6 cards. A 3-location brand with 6 services = 18 cards.

---

## 2. Authoritative spec index

### 2.1 Core product specs (v2 series — current)

| Spec | Covers |
|------|--------|
| [zarkili_service_data_model_v3 (2).md](../new-platform/zarkili_service_data_model_v3%20%282%29.md) | **Canonical** Firestore schema for brands, locations, service_types, variants, addons, photos, technicians, reviews, user_brand_loyalty |
| [zarkili_booking_flow_spec_v2.md](../new-platform/zarkili_booking_flow_spec_v2.md) | 6-step booking wizard contract (Service → Staff → Date → Review → Policies → Payment → Confirmation). **Fully audited & closed in W50.** |
| [zarkili_explore_tab_spec_v2.md](../new-platform/zarkili_explore_tab_spec_v2.md) | Explore Tab v2 (service browser). Spec is authored; build pending — current next workstream |
| [zarkili_explore_implementation_plan.md](../new-platform/zarkili_explore_implementation_plan.md) | Phased delivery plan for Explore v2 |
| [zarkili_explore_map_fixes_v3.md](../new-platform/zarkili_explore_map_fixes_v3.md) | Map view fixes from v3 review |
| [zarkili_home_tab_spec_v2.md](../new-platform/zarkili_home_tab_spec_v2.md) | Home tab v2 (Quick Rebook, Trending, sponsored strip) |
| [zarkili_home_empty_states_spec_v2.md](../new-platform/zarkili_home_empty_states_spec_v2.md) | Empty states for all home surfaces |
| [zarkili_home_spec_diff_v2.md](../new-platform/zarkili_home_spec_diff_v2.md) | Home v1→v2 deltas |
| [zarkili_rewards_tab_spec.md](../new-platform/zarkili_rewards_tab_spec.md) | Rewards tab |
| [zarkili-stripe-payments.md](../new-platform/zarkili-stripe-payments.md) | Stripe payments end-to-end (consumer + tenant) |

### 2.2 Domain specs (Phase 1)

| Spec | Covers |
|------|--------|
| [TENANTS.md](../new-platform/TENANTS.md) | Tenant model, plan tiers |
| [TENANT_USERS.md](../new-platform/TENANT_USERS.md) | RBAC + tenantUsers |
| [USER_TENANT_ACCESS.md](../new-platform/USER_TENANT_ACCESS.md) | Multi-tenant user access |
| [LOCATIONS.md](../new-platform/LOCATIONS.md) | Locations model |
| [STAFF.md](../new-platform/STAFF.md), [STAFF_SCHEDULES.md](../new-platform/STAFF_SCHEDULES.md) | Staff + schedules |
| [SERVICES.md](../new-platform/SERVICES.md) | Service catalogue (legacy view; v3 supersedes for Explore) |
| [SLOT_ENGINE.md](../new-platform/SLOT_ENGINE.md) | Slot computation + `bookingSlotTokens` atomic mutex |
| [LOYALTY_RULES.md](../new-platform/LOYALTY_RULES.md), [LOYALTY_FUNCTIONAL_SPEC_V1.md](../LOYALTY_FUNCTIONAL_SPEC_V1.md) | Loyalty (brand-level v3 paths) |
| [REVIEWS_AND_RATINGS.md](../new-platform/REVIEWS_AND_RATINGS.md) | Reviews submission, moderation, aggregates |
| [MARKETPLACE_DOMAIN.md](../new-platform/MARKETPLACE_DOMAIN.md), [MARKETPLACE_GUARDRAILS.md](../new-platform/MARKETPLACE_GUARDRAILS.md), [MARKETPLACE_PERSONALIZATION.md](../new-platform/MARKETPLACE_PERSONALIZATION.md), [MARKETPLACE_SPECS.md](../MARKETPLACE_SPECS.md) | Marketplace (incl. anti-commission language CMS lint) |
| [MESSAGING.md](../new-platform/MESSAGING.md) | In-app messaging, unread aggregation |
| [NOTIFICATION_EVENTS.md](../new-platform/NOTIFICATION_EVENTS.md) | Notification event model |
| [SEGMENTS.md](../new-platform/SEGMENTS.md) | Customer segmentation |
| [DISCOVERY_SCAFFOLD.md](../new-platform/DISCOVERY_SCAFFOLD.md) | Discovery scaffold + featured-salons seed |
| [SALON_ONBOARDING_OPERATIONS.md](../new-platform/SALON_ONBOARDING_OPERATIONS.md), [SALON_ONBOARDING_SPECS.md](../SALON_ONBOARDING_SPECS.md) | Salon onboarding wizard |
| [CLIENT_ONBOARDING_MODULES.md](../new-platform/CLIENT_ONBOARDING_MODULES.md), [CLIENT_ONBOARDING.md](../CLIENT_ONBOARDING.md) | Client onboarding |
| [FREE_TRIAL_SPECS.md](../FREE_TRIAL_SPECS.md) | Free-trial gating, expiry tick CF |
| [PAYMENT_FEATURE_SPECS.md](../PAYMENT_FEATURE_SPECS.md) | Payment requirements |

### 2.3 Cross-cutting specs

| Spec | Covers |
|------|--------|
| [ARCHITECTURE_OVERVIEW.md](../new-platform/ARCHITECTURE_OVERVIEW.md) | Layered architecture + cross-platform rules |
| [NAVIGATION_PUBLIC_PROTECTED.md](../new-platform/NAVIGATION_PUBLIC_PROTECTED.md) | Guard semantics, deep links |
| [SECURITY_RULES_FINAL.md](../new-platform/SECURITY_RULES_FINAL.md) | Per-collection rule guarantees + coverage matrix |
| [SECURITY_COMPLIANCE_REVIEW_PLAN.md](../new-platform/SECURITY_COMPLIANCE_REVIEW_PLAN.md) | Compliance review plan |
| [CROSS_PLATFORM_CAPABILITY_MATRIX.md](../new-platform/CROSS_PLATFORM_CAPABILITY_MATRIX.md) | Per-platform feature parity matrix |
| [ANALYTICS_QUERIES.md](../new-platform/ANALYTICS_QUERIES.md), [MARKETING_ANALYTICS.md](../new-platform/MARKETING_ANALYTICS.md) | Analytics queries + KPIs |
| [AI_DATA_CONTRACTS.md](../new-platform/AI_DATA_CONTRACTS.md), [AI_FEATURES_SPECS.md](../AI_FEATURES_SPECS.md), [AI_CHAT_POLICY.md](../new-platform/AI_CHAT_POLICY.md), [AI_RUNTIME_AND_COST_POLICY.md](../new-platform/AI_RUNTIME_AND_COST_POLICY.md), [AI_RISK_MODEL_POLICY.md](../new-platform/AI_RISK_MODEL_POLICY.md), [AI_RETENTION_INSIGHTS.md](../new-platform/AI_RETENTION_INSIGHTS.md), [AI_FEATURES_IMPLEMENTATION_COVERAGE_MATRIX.md](../new-platform/AI_FEATURES_IMPLEMENTATION_COVERAGE_MATRIX.md), [AI_SUPPORT_SYSTEM_ARCHITECTURE.md](../AI_SUPPORT_SYSTEM_ARCHITECTURE.md), [AI_FIRST_GENZ_DESIGN_PLAYBOOK.md](../AI_FIRST_GENZ_DESIGN_PLAYBOOK.md) | AI surface — contracts, runtime, risk, design |
| [MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md](../MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md), [MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md](../MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md), [MULTITENANT_MASTER_INDEX.md](../MULTITENANT_MASTER_INDEX.md) | Multi-tenant strategy |
| [MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md](../MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md) | Monetization + multi-salon |
| [US_PRIMARY_MARKET_ADDENDUM.md](../US_PRIMARY_MARKET_ADDENDUM.md) | US market addendum |

### 2.4 Operational + release docs

| Doc | Covers |
|-----|--------|
| [PILOT_GO_LIVE.md](../new-platform/PILOT_GO_LIVE.md) | 28-item pre-launch checklist + signoff + 14-day monitoring |
| [PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_50_TO_54.md](../PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_50_TO_54.md) | RC plan |
| [PHASE4_AI_SUPPORT_SYSTEM_PLAN_WEEKS_55_TO_57.md](../PHASE4_AI_SUPPORT_SYSTEM_PLAN_WEEKS_55_TO_57.md) | Phase 4 — AI support system |
| [DOCUMENTATION_COMMAND_CENTER.md](../DOCUMENTATION_COMMAND_CENTER.md) | Index of all docs (older) |
| [PROJECT_GANTT_AGILE_PLAN.md](../PROJECT_GANTT_AGILE_PLAN.md), [PROGRAM_TRACKING_BOARD.md](../PROGRAM_TRACKING_BOARD.md) | Programme tracking |
| [WEEKLY_LOG.md](../new-platform/WEEKLY_LOG.md) | Running week-by-week log |

### 2.5 QA & validation

| Doc | Covers |
|-----|--------|
| [WEEK49_5_QA_SPRINT_PLAN.md](../new-platform/WEEK49_5_QA_SPRINT_PLAN.md) | RC QA sprint plan |
| [WEEK35_QA_TEST_CASES.md](../new-platform/WEEK35_QA_TEST_CASES.md), [WEEK35_QA_MOCK_FINDINGS.md](../new-platform/WEEK35_QA_MOCK_FINDINGS.md) | QA mock pass |
| [VALIDATION_CYCLE_SLICE1_MOCK.md](../VALIDATION_CYCLE_SLICE1_MOCK.md), [WEEK4_VALIDATION.md](../new-platform/WEEK4_VALIDATION.md) | Validation cycles |
| [AUTH_A11Y_AUDIT_2026-04-29.md](../AUTH_A11Y_AUDIT_2026-04-29.md), [LINT_DEBT_TRIAGE_2026-04-29.md](../LINT_DEBT_TRIAGE_2026-04-29.md), [MOCK_DATA_AUDIT_2026-04-29.md](../MOCK_DATA_AUDIT_2026-04-29.md) | Audits |
| [CROSS_PLATFORM_READINESS_AUDIT_2026-04-19.md](../new-platform/CROSS_PLATFORM_READINESS_AUDIT_2026-04-19.md) | Cross-platform readiness |

---

## 3. v1 in-scope feature summary

### 3.1 Consumer

- Auth (email/password, social Apple+Google, anonymous, guest with sign-up prompt)
- Onboarding (client wizard, draft-resumable)
- Home (Quick Rebook strip, Trending near you, sponsored, empty states)
- Explore (v1 currently; **v2 in progress** — see §4)
- Salon profile + service detail + technician detail
- Search + filters + map view
- Booking (6-step flow, deferred-nav tenant context switch)
- Loyalty (brand-level points + redemption preview)
- Reviews (submission + moderation downstream + aggregates)
- Payments (Stripe Payment Sheet on native; `@stripe/react-stripe-js` on web)
- Refunds (consumer-initiated within window)
- Marketplace (discoverable feed, sponsored, attribution)
- Messaging (threads + unread aggregation)
- Notifications (in-app feed + prefs)
- Waitlist (per-booking)
- Profile, settings, saved services, payment methods

### 3.2 Tenant admin (full Phase 3 surface)

Per [PHASE3_COMPLETION_REPORT.md §2](../new-platform/PHASE3_COMPLETION_REPORT.md): 56 admin screens across clusters A–F covering tenant core, location/schedule, billing, analytics, loyalty/notifications/staff, AI + marketplace tools.

### 3.3 Platform super-admin (W49 — cluster G)

20 screens; 3 service factories. Full multi-tenant governance, compliance, infrastructure observability — see [03_BACKEND_FIREBASE.md §3.13](03_BACKEND_FIREBASE.md).

---

## 4. v1 out-of-scope (explicit)

From [zarkili_explore_tab_spec_v2.md §11](../new-platform/zarkili_explore_tab_spec_v2.md) + cross-spec decisions:

- Voice search
- AR try-on
- Service comparison across locations
- Group / party booking
- Salon grouping / collapsing in results
- Brand-level (cross-location) catalogue browsing — only per-location service cards in v1
- **Multi-service cart booking** — v1 is single-service; placeholder `MultiServiceBookingScreen.tsx` flagged for v2
- **Apple Pay / Google Pay** — gated off until wallet handler ships (NEW-DEBT-E)
- **Drag-to-reschedule** in admin calendar — descoped 2026-05-10 (W43-DEBT-2)

---

## 5. Open product decisions (not yet locked)

From [zarkili_explore_tab_spec_v2.md §12](../new-platform/zarkili_explore_tab_spec_v2.md):

1. `variantLabel` on service types — salon-set vs platform-inferred
2. Min review thresholds — service-level 5+, technician 3+, location 5+ (to confirm)
3. Distance slider default (5km) and max (25km) — to confirm
4. `popularityScore` weighting — 60/30/10 (booking/rating/recency) — to confirm
5. `isBookableOnline: false` CTA action — phone dialler vs contact form
6. Member badge tap action — link to loyalty programme vs informational only

---

## 6. The "next major feature" — Explore Tab v2

The spec ([zarkili_explore_tab_spec_v2.md](../new-platform/zarkili_explore_tab_spec_v2.md)) is complete. The build is **not yet started**. Concrete entry points and priority list are in [07_ROADMAP_NEXT_STEPS.md](07_ROADMAP_NEXT_STEPS.md).

The §10 "fixes required" priority list (Critical → High → Medium) is the recommended walk order.

---

## 7. How specs evolve

- Specs at v2 are the **current authority** for new development.
- v1 specs are retained for traceability (historical reference, not implementation guide).
- Open decisions (§5 above) are resolved by **Product**, recorded by appending to the relevant spec's "Decisions" section, and surfaced to engineering via the WEEKLY_LOG.
- If a spec and the code disagree, **the spec wins** for new work — re-audit the code and file a DEBT entry.
