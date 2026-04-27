# Zarkili Documentation Command Center

> **This is the single master document for the entire Zarkili project.**
> If you only open one file, open this one. Every other document is linked here, grouped by purpose, with a one-line description and clear "use when…" guidance.

Date of last full sync: **2026-04-25** · Total docs catalogued: **80+** across `documentation/`, `documentation/figma-prompts/`, `documentation/new-platform/`, `documentation/new-platform/runbooks/`, `documentation/diary/`, and `design-handoff/`.

---

## How to use this document

1. Pick the **fast-start path** below that matches today's intent.
2. Open only the docs the path lists. Do not open the whole tree.
3. If you add a new top-level doc, append it to the right group here AND to [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md) if it is part of the multi-tenant program.

### Fast-start paths

| Path | Use when… | Open in this order |
|---|---|---|
| **A. New session kickoff** | First time opening the project today | this doc → [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md) → [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md) |
| **B. Coding today** | You know which week you're in | [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md) → relevant Copilot prompt pack (W1-4 / W5-8 / W9-12 / W13-20) → relevant execution pack in [new-platform/](new-platform/) |
| **C. Designing today** | You're producing or reviewing screens | [AI_FIRST_GENZ_DESIGN_PLAYBOOK.md](AI_FIRST_GENZ_DESIGN_PLAYBOOK.md) → [FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md](FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md) → relevant batch in [figma-prompts/](figma-prompts/README.md) → [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md) |
| **D. Product clarification** | Stakeholder asks "how does X work" | feature spec (Group 4) → [MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md](MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md) → [MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md](MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md) |
| **E. Long-range planning** | You need to know weeks 21–52 | [PROJECT_GANTT_AGILE_PLAN.md](PROJECT_GANTT_AGILE_PLAN.md) → Phase 2/3/3.5/4 plan docs (Group 3) → [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md) |
| **F. Production / pilot ops** | Live incident, deploy, restore, on-call | [new-platform/PILOT_GO_LIVE.md](new-platform/PILOT_GO_LIVE.md) → relevant runbook in [new-platform/runbooks/](new-platform/runbooks/) |
| **G. Daily diary close** | End of work day | [DIARY_90_SECOND_CHECKLIST.md](DIARY_90_SECOND_CHECKLIST.md) → write to [diary/](diary/) using [DAILY_WORK_DIARY_TEMPLATE.md](DAILY_WORK_DIARY_TEMPLATE.md) |

### Status legend

- 🟢 **ACTIVE** — used in the current or near-term execution
- 🔵 **REFERENCE** — stable background context, open on demand
- 🟡 **TEMPLATE** — fill-in scaffold, not a live record
- ⚪ **ARCHIVE** — historical record, do not use for planning

---

## Group 1 — Master indexes & program control 🟢

The doc you are reading sits at the top of this layer.

| Doc | Status | Purpose |
|---|---|---|
| [DOCUMENTATION_COMMAND_CENTER.md](DOCUMENTATION_COMMAND_CENTER.md) (this file) | 🟢 | Single master index across the entire project. Start every session here. |
| [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md) | 🟢 | Focused index for the 52-week multi-tenant program (strategy + week packs + phase plans). |
| [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md) | 🟢 | Kanban-style backlog/in-progress/blocked/done across all weeks. The day-to-day source of "what's next". |
| [PROJECT_GANTT_AGILE_PLAN.md](PROJECT_GANTT_AGILE_PLAN.md) | 🟢 | 52-week Gantt + parallel work streams + dependencies. Use for sprint planning and re-baselining. |

**Use when**: orienting yourself, picking the next task, replanning, or onboarding a collaborator.

---

## Group 2 — Strategy & architecture 🔵

| Doc | Status | Purpose |
|---|---|---|
| [MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md](MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md) | 🟢 | Source-of-truth for product scope and architectural direction (multi-salon, subscriptions, billing model). |
| [MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md](MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md) | 🟢 | Firestore schema, 20-week roadmap, migration map. The implementation backbone. |
| [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md) | 🟢 | All program changes implied by US-primary positioning (Stripe Tax, Connect Express, CCPA/CPRA, TCPA/CAN-SPAM, COPPA, ADA + WCAG 2.1 AA, en-US defaults, US holidays, multi-currency YES, US-first marketing, SOC 2 to Phase 5). |
| [AI_SUPPORT_SYSTEM_ARCHITECTURE.md](AI_SUPPORT_SYSTEM_ARCHITECTURE.md) | 🔵 | Architecture and integration boundaries for the AI support router. Implemented in Phase 4. |
| [new-platform/ARCHITECTURE_OVERVIEW.md](new-platform/ARCHITECTURE_OVERVIEW.md) | 🔵 | Source-tree and module-boundary baseline for the current codebase. |

**Use when**: scope alignment, architectural decisions, before structural refactors, or before any cross-cutting feature.

---

## Group 3 — Phase plans (52-week build) 🟢

These are the dated long-form plans that own each calendar window. Total length: 52 weeks. US is launch market.

| Doc | Window | Status | Purpose |
|---|---|---|---|
| [MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md](MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md) | W1–W20 | 🟢 | Phase 1 (foundation, monetization, marketplace v1, AI v1) embedded in the blueprint. |
| [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md) | W21–W32 | 🟢 | Phase 2.0 consumer UI build (W21–28) + Phase 2.1 completeness, edge cases, i18n, store readiness (W29–32). |
| [PHASE3_ADMIN_UI_PLAN_WEEKS_33_TO_44.md](PHASE3_ADMIN_UI_PLAN_WEEKS_33_TO_44.md) | W33–W44 | 🟢 | Owner, location-manager, marketing, and platform super-admin console build. |
| [PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_45_TO_48.md](PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_45_TO_48.md) | W45–W49 | 🟢 | Observability, SLOs, pentest, DR drill, AI eval, marketing site, self-serve checkout, in-app support surfaces (W48), commercial GA at end of W49. *(Filename retains `45_TO_48`; window is 45–49.)* |
| [PHASE4_AI_SUPPORT_SYSTEM_PLAN_WEEKS_49_TO_52.md](PHASE4_AI_SUPPORT_SYSTEM_PLAN_WEEKS_49_TO_52.md) | W50–W52 | 🟢 | AI router on top of W48 support surfaces: confidence-scored auto-respond/escalate (W50), eval/CSAT/tagging (W51), threshold tuning (W52). *(Filename retains `49_TO_52`; window is 50–52.)* |

**Use when**: weekly planning, sprint kickoff, scope check, or re-estimating a phase.

---

## Group 4 — Product specifications (business behavior) 🟢

Each spec is the source of truth for one feature area. Implementation prompts (Group 5) cite these.

| Doc | Status | Purpose |
|---|---|---|
| [SALON_ONBOARDING_SPECS.md](SALON_ONBOARDING_SPECS.md) | 🟢 | Salon-side onboarding: business profile, hours, services, payouts, KYC. |
| [CLIENT_ONBOARDING.md](CLIENT_ONBOARDING.md) | 🟢 | Consumer-side onboarding: auth, preferences, location, payment-optional. |
| [MARKETPLACE_SPECS.md](MARKETPLACE_SPECS.md) | 🟢 | Marketplace feed, posts, "Book this look", attribution. |
| [FREE_TRIAL_SPECS.md](FREE_TRIAL_SPECS.md) | 🟢 | Trial lifecycle and entitlement rules per tenant. |
| [PAYMENT_FEATURE_SPECS.md](PAYMENT_FEATURE_SPECS.md) | 🟢 | Stripe payments, deposits, refunds, payouts, dispute handling. |
| [LOYALTY_FUNCTIONAL_SPEC_V1.md](LOYALTY_FUNCTIONAL_SPEC_V1.md) | 🟢 | Loyalty: earn rules, tiers, rewards, expiration. |
| [AI_FEATURES_SPECS.md](AI_FEATURES_SPECS.md) | 🟢 | Catalog of AI features, scope, expected outcomes. |
| [MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md](MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md) | 🟢 | Cross-link doc tying monetization to multi-salon access model. |

**Use when**: implementing a feature, validating QA, or answering "what is the expected behavior of X?".

---

## Group 5 — Build prompt packs (Copilot, executable) 🟢

These are scripts, not specs. Each weekly pack contains numbered Copilot prompts you paste into VS Code in order.

| Doc | Window | Status | Purpose |
|---|---|---|---|
| [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md) | W1–W4 | 🟢 | Foundation: scaffolding, providers, env, CI, public landing. |
| [MULTITENANT_WEEKS_5_TO_8_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_5_TO_8_COPILOT_PROMPTS.md) | W5–W8 | 🟢 | Booking, messaging, loyalty core. |
| [MULTITENANT_WEEKS_9_TO_12_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_9_TO_12_COPILOT_PROMPTS.md) | W9–W12 | 🟢 | Growth, pilot hardening. |
| [MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md) | W13–W20 | 🟢 | Monetization, marketplace, AI, payments. |

**Use when**: actively coding. Always pair with the matching review prompt at the end of each task in the pack.

---

## Group 6 — Design system & handoff 🟢

These two layers cooperate: **playbook** explains the process, **handoff package** is the asset library, **figma-prompts/** is the per-screen prompt source for AI design tools, **handoff playbook** is the strict intake contract.

### 6a. Process & playbooks

| Doc | Status | Purpose |
|---|---|---|
| [AI_FIRST_GENZ_DESIGN_PLAYBOOK.md](AI_FIRST_GENZ_DESIGN_PLAYBOOK.md) | 🟢 | End-to-end playbook for AI-assisted design generation, voice, principles, brand. |
| [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md) | 🟢 | Strict 5-phase process, intake contract, and acceptance checks for Figma → engineering handoff. |
| [VALIDATION_CYCLE_SLICE1_MOCK.md](VALIDATION_CYCLE_SLICE1_MOCK.md) | 🔵 | Worked example showing what a complete handoff package looks like. |

### 6b. Design-handoff package v1.0.0 (the asset library) 🔵

Located in [`design-handoff/`](../design-handoff/) at repo root (not under `documentation/`).

| File | Purpose |
|---|---|
| [`design-handoff/HANDOFF_MANIFEST.md`](../design-handoff/HANDOFF_MANIFEST.md) | Full manifest of the package: tokens, components, screens, fonts, accessibility, test devices. |
| [`design-handoff/README.md`](../design-handoff/README.md) | Quick start for engineers consuming the package. |
| [`design-handoff/ACCESSIBILITY_GUIDE.md`](../design-handoff/ACCESSIBILITY_GUIDE.md) | WCAG 2.1 AA + ADA targets, contrast rules, dynamic-type, reduce-motion. |
| [`design-handoff/ASSET_MANIFEST.json`](../design-handoff/ASSET_MANIFEST.json) | Machine-readable asset inventory. |
| [`design-handoff/tokens/`](../design-handoff/tokens/) | `colors.json`, `typography.json`, `spacing.json` — the only allowed token sources. |
| [`design-handoff/components/`](../design-handoff/components/) | Per-component JSON specs: badge, bottom-tab-item, category-pill, chip, filter-button, search-bar, service-card. |
| [`design-handoff/specs/`](../design-handoff/specs/) | Per-screen JSON specs: welcome, home, explore, plus `interactions.json`. |
| [`design-handoff/fonts/FONT_DELIVERY_SPEC.md`](../design-handoff/fonts/FONT_DELIVERY_SPEC.md) | Manrope delivery specification. |
| [`design-handoff/strings/`](../design-handoff/strings/) | `en-US.json` and locale strings. |

### 6c. Figma prompt pack (copy-pasteable AI prompts for batches A–S) 🟢

Located in [`figma-prompts/`](figma-prompts/README.md). Reuses the `design-handoff/` package — never invents new tokens.

| File | Consumed by | Purpose |
|---|---|---|
| [figma-prompts/README.md](figma-prompts/README.md) | — | Index + global Design System Anchor block + batch table. |
| [figma-prompts/_TEMPLATE.md](figma-prompts/_TEMPLATE.md) | — | Reusable per-screen / per-component prompt scaffold + human-review checklist. |
| [BATCH_A_AUTH_ONBOARDING.md](figma-prompts/BATCH_A_AUTH_ONBOARDING.md) | W21 | Auth, sign-in/up, OTP, onboarding, account merge. |
| [BATCH_B_DISCOVER_EXPLORE_PROFILE.md](figma-prompts/BATCH_B_DISCOVER_EXPLORE_PROFILE.md) | W22 | Authenticated home, discover, explore results, filter sheet, salon profile, service detail, staff detail, map. |
| [BATCH_C_BOOKING_FLOW.md](figma-prompts/BATCH_C_BOOKING_FLOW.md) | W23 | Service / staff / date / time pickers, review, policies, payment, confirmation, manage, guest, post-book. |
| [BATCH_D_PAYMENTS_TIPPING_RECEIPTS.md](figma-prompts/BATCH_D_PAYMENTS_TIPPING_RECEIPTS.md) | W24 | Saved methods, add card, tipping, receipt, history, refund/dispute. |
| [BATCH_E_LOYALTY_ACTIVITIES_REVIEWS.md](figma-prompts/BATCH_E_LOYALTY_ACTIVITIES_REVIEWS.md) | W25 | Loyalty landing, rewards, activities, claim, review prompt/detail, referral. |
| [BATCH_F_MESSAGING_NOTIFICATIONS_WAITLIST.md](figma-prompts/BATCH_F_MESSAGING_NOTIFICATIONS_WAITLIST.md) | W26 | Inbox, thread, compose, notifications, prefs, waitlist. |
| [BATCH_G_STAFF_APP_AI.md](figma-prompts/BATCH_G_STAFF_APP_AI.md) | W27 | Staff today, calendar, queue, client lookup/detail/notes, AI chat panel + suggestion patterns + budget banners. |
| [BATCH_H_MARKETPLACE_CONSUMER.md](figma-prompts/BATCH_H_MARKETPLACE_CONSUMER.md) | W28 | Post detail, save/collections, share, "Book this look" deep link. |
| [BATCH_I_LEGAL_LIFECYCLE_SETTINGS_AUTH_EDGES.md](figma-prompts/BATCH_I_LEGAL_LIFECYCLE_SETTINGS_AUTH_EDGES.md) | W29–30 | Legal pages, consents, GDPR/CCPA exports, deletion, age gate, edit profile, change email/phone/password, devices/MFA. |
| [BATCH_J_BOOKING_PAYMENTS_DISCOVERY_EDGES.md](figma-prompts/BATCH_J_BOOKING_PAYMENTS_DISCOVERY_EDGES.md) | W30–31 | Slot conflicts, multi/recurring/on-behalf, deposits/fees, 3DS/decline, ApplePay/GooglePay, search edges, map/cluster, salon actions, review edges. |
| [BATCH_K_AI_MESSAGING_LOYALTY_MARKETPLACE_STAFF_EXTRAS.md](figma-prompts/BATCH_K_AI_MESSAGING_LOYALTY_MARKETPLACE_STAFF_EXTRAS.md) | W31–32 | AI consent/feedback/explainability/opt-out, messaging extras, notification extras, loyalty extras, marketplace extras, staff extras. |
| [BATCH_L_CROSS_CUTTING_I18N_STORE_READINESS.md](figma-prompts/BATCH_L_CROSS_CUTTING_I18N_STORE_READINESS.md) | W32 | Force-update, maintenance, offline, server-error, flag-disabled, deep-links, permission recovery, first-run, locale, RTL, web breakpoints, Live Activities/widgets/App Clip, store assets. |
| [BATCH_M_OWNER_HOME_BILLING_CONNECT.md](figma-prompts/BATCH_M_OWNER_HOME_BILLING_CONNECT.md) | W33–34 | Owner KPI dashboard, settings shell, business/brand/tax/legal/domain, plans, invoices, Connect onboarding/health, payouts, refund admin, print. |
| [BATCH_N_LOCATIONS_STAFF_SERVICES.md](figma-prompts/BATCH_N_LOCATIONS_STAFF_SERVICES.md) | W35–37 | Multi-location, location settings, service overrides, resources, walk-in admin, daily close, staff invite/roles, schedule editor, qualifications, commission, performance, catalog/import/packages/media, bulk-action bar v1. |
| [BATCH_O_BOOKING_OPS_MASTER_CALENDAR.md](figma-prompts/BATCH_O_BOOKING_OPS_MASTER_CALENDAR.md) | W38 | Master calendar (multi-resource), drag-to-reschedule, booking detail admin, manual booking, block time, force-book, no-show, cancel-with-fee, recurring, conflict resolution. |
| [BATCH_P_CRM_LOYALTY_CAMPAIGNS_ADMIN.md](figma-prompts/BATCH_P_CRM_LOYALTY_CAMPAIGNS_ADMIN.md) | W39–40 | Client list/detail, merge, segments, GDPR/CCPA per-client, loyalty config + reward editor + manual adjust, activities admin, campaigns + multi-channel templates + A/B + AI approvals + compliance check, transactional templates, discount codes. |
| [BATCH_Q_REVIEWS_MESSAGING_WAITLIST_ADMIN.md](figma-prompts/BATCH_Q_REVIEWS_MESSAGING_WAITLIST_ADMIN.md) | W41 | Review queue + reply composer + flag/dispute + automation + reputation, inbox triage + assignment + canned replies + auto-reply + block, archive search, waitlist admin + convert + policies. |
| [BATCH_R_ANALYTICS_AI_ADMIN_MARKETPLACE.md](figma-prompts/BATCH_R_ANALYTICS_AI_ADMIN_MARKETPLACE.md) | W42–43 | Revenue, funnels, retention/cohort, marketplace attribution, custom report builder, scheduled exports, RBAC export, audit log (tenant), AI toggles/budgets/queue/usage/safety/audit, marketplace tenant tools, anti-theft compliance, print specs. |
| [BATCH_S_PLATFORM_SUPER_ADMIN.md](figma-prompts/BATCH_S_PLATFORM_SUPER_ADMIN.md) | W44 | Tenant directory, suspend, impersonation, cross-tenant analytics, platform health, plan management, feature flags, audit logs, marketplace moderation, AI overrides, migrations, backups, support inbox, security events, data requests, policy versions, incidents, admin sign-in/2FA/devices, role-denied, bulk/destructive confirms, command palette, view-as-client. |

| Companion | Purpose |
|---|---|
| [FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md](FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md) | Authoritative list of what each batch must deliver, with consumed-by-week dates. |

**Use when designing**: pick the batch from the priority list, open the matching prompt-pack file, copy a prompt block, paste into your AI design tool, then validate with the human-review checklist at the bottom of the file.

---

## Group 7 — New-platform operational docs 🔵

Located in [`new-platform/`](new-platform/). These mix architecture, domain references, week reports, and runbooks. Subdivided below.

### 7a. Cross-platform & coverage matrices

| Doc | Status | Purpose |
|---|---|---|
| [new-platform/CROSS_PLATFORM_CAPABILITY_MATRIX.md](new-platform/CROSS_PLATFORM_CAPABILITY_MATRIX.md) | 🔵 | Feature parity view across iOS / Android / Web. |
| [new-platform/CROSS_PLATFORM_READINESS_AUDIT_2026-04-19.md](new-platform/CROSS_PLATFORM_READINESS_AUDIT_2026-04-19.md) | ⚪ | Snapshot audit dated 2026-04-19; check against current state before reusing. |
| [new-platform/AI_FEATURES_IMPLEMENTATION_COVERAGE_MATRIX.md](new-platform/AI_FEATURES_IMPLEMENTATION_COVERAGE_MATRIX.md) | 🔵 | AI traceability matrix: spec → status → owning week. |

### 7b. Runtime / policy / setup

| Doc | Status | Purpose |
|---|---|---|
| [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | 🟢 | Budget caps, throttling, model selection, fallback rules. Cited by every AI implementation. |
| [new-platform/AI_DATA_CONTRACTS.md](new-platform/AI_DATA_CONTRACTS.md) | 🟢 | Input/output schemas + redaction rules for AI calls. |
| [new-platform/ENV_SETUP.md](new-platform/ENV_SETUP.md) | 🔵 | Local env setup and consistency rules. Pair with [DAY1_DEVELOPMENT_CHECKLIST.md](DAY1_DEVELOPMENT_CHECKLIST.md). |
| [new-platform/SECURITY_RULES_FINAL.md](new-platform/SECURITY_RULES_FINAL.md) | 🟢 | Final Firestore + Storage security rule contract. Cite before any rule change. |
| [new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md](new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md) | 🔵 | How admin UI mocks must be interpreted at implementation time. |

### 7c. Navigation & routing

| Doc | Status | Purpose |
|---|---|---|
| [new-platform/NAVIGATION_PUBLIC_PROTECTED.md](new-platform/NAVIGATION_PUBLIC_PROTECTED.md) | 🔵 | Public/protected route taxonomy and guards. |
| [new-platform/ONBOARDING_ROUTE_SCAFFOLD.md](new-platform/ONBOARDING_ROUTE_SCAFFOLD.md) | 🔵 | Onboarding routing contract; pairs with [CLIENT_ONBOARDING.md](CLIENT_ONBOARDING.md). |
| [new-platform/DISCOVERY_SCAFFOLD.md](new-platform/DISCOVERY_SCAFFOLD.md) | 🔵 | Scaffold contract for discovery surfaces. |

### 7d. Domain entities (reference these before changing any model)

| Doc | Domain |
|---|---|
| [new-platform/TENANTS.md](new-platform/TENANTS.md) | Tenant entity & lifecycle |
| [new-platform/TENANT_USERS.md](new-platform/TENANT_USERS.md) | Tenant ↔ user membership |
| [new-platform/USER_TENANT_ACCESS.md](new-platform/USER_TENANT_ACCESS.md) | Multi-salon access mapping |
| [new-platform/LOCATIONS.md](new-platform/LOCATIONS.md) | Location entity |
| [new-platform/STAFF.md](new-platform/STAFF.md) | Staff entity |
| [new-platform/STAFF_SCHEDULES.md](new-platform/STAFF_SCHEDULES.md) | Staff availability + schedule rules |
| [new-platform/SERVICES.md](new-platform/SERVICES.md) | Service catalog model |
| [new-platform/SLOT_ENGINE.md](new-platform/SLOT_ENGINE.md) | Booking slot calculation engine |
| [new-platform/MESSAGING.md](new-platform/MESSAGING.md) | Messaging domain (threads, attachments, presence) |
| [new-platform/REVIEWS_AND_RATINGS.md](new-platform/REVIEWS_AND_RATINGS.md) | Reviews + ratings + moderation |
| [new-platform/LOYALTY_RULES.md](new-platform/LOYALTY_RULES.md) | Loyalty point math + tier rules |
| [new-platform/MARKETPLACE_DOMAIN.md](new-platform/MARKETPLACE_DOMAIN.md) | Marketplace post + attribution domain |
| [new-platform/SEGMENTS.md](new-platform/SEGMENTS.md) | Segment builder rules + storage |
| [new-platform/NOTIFICATION_EVENTS.md](new-platform/NOTIFICATION_EVENTS.md) | Notification event taxonomy + payloads |
| [new-platform/MARKETING_ANALYTICS.md](new-platform/MARKETING_ANALYTICS.md) | Marketing & growth analytics events. |
| [new-platform/ANALYTICS_QUERIES.md](new-platform/ANALYTICS_QUERIES.md) | Reusable analytics query catalog. |

### 7e. Week execution packs (in-flight slices)

| Doc | Status | Purpose |
|---|---|---|
| [new-platform/WEEK2_TASK24_ADMIN_SCREENS_EXECUTION_PACK.md](new-platform/WEEK2_TASK24_ADMIN_SCREENS_EXECUTION_PACK.md) | 🔵 | Execution pack for W2 Task 2.4 admin screens. |
| [new-platform/WEEK2_TASK25_DISCOVERY_SCAFFOLD_EXECUTION_PACK.md](new-platform/WEEK2_TASK25_DISCOVERY_SCAFFOLD_EXECUTION_PACK.md) | 🔵 | Execution pack for W2 Task 2.5 discovery scaffold. |
| [new-platform/WEEK3_TASK34_ADMIN_SCREENS_EXECUTION_PACK.md](new-platform/WEEK3_TASK34_ADMIN_SCREENS_EXECUTION_PACK.md) | 🔵 | Execution pack for W3 Task 3.4 staff/services admin. |

### 7f. Week reports (closure & validation)

| Doc | Status | Purpose |
|---|---|---|
| [new-platform/WEEK1_REVIEW_REPORT.md](new-platform/WEEK1_REVIEW_REPORT.md) | ⚪ | Week 1 closure findings. |
| [new-platform/WEEK4_VALIDATION.md](new-platform/WEEK4_VALIDATION.md) | ⚪ | Week 4 validation report. |
| [new-platform/WEEK12_CLOSE_REPORT.md](new-platform/WEEK12_CLOSE_REPORT.md) | ⚪ | Week 12 closure report. |
| [new-platform/WEEKLY_LOG.md](new-platform/WEEKLY_LOG.md) | 🔵 | Running weekly log. Append at end of each week. |
| [new-platform/PHASE1_COMPLETION_REPORT.md](new-platform/PHASE1_COMPLETION_REPORT.md) | ⚪ | Phase 1 closure report. |

### 7g. Pilot & go-live

| Doc | Status | Purpose |
|---|---|---|
| [new-platform/PILOT_GO_LIVE.md](new-platform/PILOT_GO_LIVE.md) | 🟢 | Pilot launch checklist + cutover plan. Required reading before any go-live. |

### 7h. Runbooks (operations on-call) 🟢

| Doc | Status | Purpose |
|---|---|---|
| [new-platform/runbooks/INCIDENT_RESPONSE.md](new-platform/runbooks/INCIDENT_RESPONSE.md) | 🟢 | Incident severity levels, paging, comms, post-mortem template. |
| [new-platform/runbooks/HEALTH_CHECKS.md](new-platform/runbooks/HEALTH_CHECKS.md) | 🟢 | Service health probes and verification scripts. |
| [new-platform/runbooks/BACKUP_RESTORE.md](new-platform/runbooks/BACKUP_RESTORE.md) | 🟢 | Backup schedule + restore procedure (Firestore + Storage). |
| [new-platform/runbooks/ROLLBACK_STRATEGY.md](new-platform/runbooks/ROLLBACK_STRATEGY.md) | 🟢 | Deploy rollback decision matrix and execution steps. |

---

## Group 8 — Templates 🟡

Fill-in scaffolds — not live records.

| Doc | Purpose |
|---|---|
| [DAY1_DEVELOPMENT_CHECKLIST.md](DAY1_DEVELOPMENT_CHECKLIST.md) | Day-1 vertical-slice setup checklist. |
| [MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md](MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md) | Structured execution log for Day-1. |
| [DAILY_WORK_DIARY_TEMPLATE.md](DAILY_WORK_DIARY_TEMPLATE.md) | Daily diary template; copy to `diary/` and fill in. |
| [DIARY_90_SECOND_CHECKLIST.md](DIARY_90_SECOND_CHECKLIST.md) | Fast quality checklist before saving a diary entry. |

---

## Group 9 — Diary & history ⚪

Located in [`diary/`](diary/). Append-only daily logs. Use for audit trail; never use for current planning.

| Most recent entries |
|---|
| [diary/2026-04-20-validation-run-april20.md](diary/2026-04-20-validation-run-april20.md) |
| [diary/2026-04-19-weeks-1-3-design-free-tasks.md](diary/2026-04-19-weeks-1-3-design-free-tasks.md) |
| [diary/2026-04-18-week-1-and-2-activities-consolidated.md](diary/2026-04-18-week-1-and-2-activities-consolidated.md) |
| [diary/2026-04-18-week-1-and-2-activities.md](diary/2026-04-18-week-1-and-2-activities.md) |
| [diary/2026-04-17-zarkili-design-diary.md](diary/2026-04-17-zarkili-design-diary.md) |
| [diary/2026-04-17-project-setup-and-planning.md](diary/2026-04-17-project-setup-and-planning.md) |
| [diary/2026-04-17-chat-structure.md](diary/2026-04-17-chat-structure.md) |
| [diary/2026-04-17.md](diary/2026-04-17.md) |
| [diary/2026-04-16-zarkili-design-diary.md](diary/2026-04-16-zarkili-design-diary.md) |
| [diary/2026-04-16-project-setup-and-planning.md](diary/2026-04-16-project-setup-and-planning.md) |
| [diary/2026-04-16-chat-structure.md](diary/2026-04-16-chat-structure.md) |

Per user preference, daily diary entries should cover the **full day's work** for that chat, not just the latest task.

---

## Cross-reference cheat sheet

If you are working on… you must also keep open…

| Working on | Pair with |
|---|---|
| Phase 2 consumer screens | [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md) + matching [figma-prompts/](figma-prompts/README.md) batch + relevant feature spec (Group 4) + [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md) |
| Phase 3 admin screens | [PHASE3_ADMIN_UI_PLAN_WEEKS_33_TO_44.md](PHASE3_ADMIN_UI_PLAN_WEEKS_33_TO_44.md) + matching [figma-prompts/](figma-prompts/README.md) batch (M–S) + [new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md](new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md) |
| Any Stripe / billing work | [PAYMENT_FEATURE_SPECS.md](PAYMENT_FEATURE_SPECS.md) + [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md) (Stripe Tax, Connect Express, ACH) + [FREE_TRIAL_SPECS.md](FREE_TRIAL_SPECS.md) |
| Any AI feature | [AI_FEATURES_SPECS.md](AI_FEATURES_SPECS.md) + [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) + [new-platform/AI_DATA_CONTRACTS.md](new-platform/AI_DATA_CONTRACTS.md) + [new-platform/AI_FEATURES_IMPLEMENTATION_COVERAGE_MATRIX.md](new-platform/AI_FEATURES_IMPLEMENTATION_COVERAGE_MATRIX.md) |
| Any Firestore rule change | [new-platform/SECURITY_RULES_FINAL.md](new-platform/SECURITY_RULES_FINAL.md) + relevant domain ref (Group 7d) |
| Booking-related code | [new-platform/SLOT_ENGINE.md](new-platform/SLOT_ENGINE.md) + [new-platform/STAFF_SCHEDULES.md](new-platform/STAFF_SCHEDULES.md) + [new-platform/SERVICES.md](new-platform/SERVICES.md) + [PAYMENT_FEATURE_SPECS.md](PAYMENT_FEATURE_SPECS.md) |
| Marketplace work | [MARKETPLACE_SPECS.md](MARKETPLACE_SPECS.md) + [new-platform/MARKETPLACE_DOMAIN.md](new-platform/MARKETPLACE_DOMAIN.md) |
| Loyalty work | [LOYALTY_FUNCTIONAL_SPEC_V1.md](LOYALTY_FUNCTIONAL_SPEC_V1.md) + [new-platform/LOYALTY_RULES.md](new-platform/LOYALTY_RULES.md) |
| Onboarding (consumer) | [CLIENT_ONBOARDING.md](CLIENT_ONBOARDING.md) + [new-platform/ONBOARDING_ROUTE_SCAFFOLD.md](new-platform/ONBOARDING_ROUTE_SCAFFOLD.md) + [BATCH_A](figma-prompts/BATCH_A_AUTH_ONBOARDING.md) |
| Onboarding (salon) | [SALON_ONBOARDING_SPECS.md](SALON_ONBOARDING_SPECS.md) + [new-platform/TENANTS.md](new-platform/TENANTS.md) + [new-platform/USER_TENANT_ACCESS.md](new-platform/USER_TENANT_ACCESS.md) |
| Production incident | [new-platform/runbooks/INCIDENT_RESPONSE.md](new-platform/runbooks/INCIDENT_RESPONSE.md) + [new-platform/runbooks/HEALTH_CHECKS.md](new-platform/runbooks/HEALTH_CHECKS.md) + [new-platform/runbooks/ROLLBACK_STRATEGY.md](new-platform/runbooks/ROLLBACK_STRATEGY.md) |

---

## Quality gates (enforce every week)

1. **Tenant isolation** — every business write includes `tenantId`; every query is tenant-filtered; `userTenantAccess` stays in sync with `tenantUsers`.
2. **Authorization** — role checks on all privileged actions; subscription + trial status validated in guarded flows.
3. **Data integrity** — state transitions validated; race-sensitive flows protected; unread aggregations accurate per tenant.
4. **US-primary defaults** — en-US, USD, MM/DD/YYYY, 12h AM/PM, US phone format, Stripe Tax for US states, TCPA/CAN-SPAM/CCPA/COPPA safe defaults.
5. **Accessibility** — WCAG 2.1 AA contrast (≥4.5:1), 44pt touch targets, dynamic type, reduce-motion, accessibilityLabel on every icon-only control.
6. **Verification** — tests added & passing; rules/indexes updated where needed; docs updated at week close.

---

## Maintenance rules for this document

- **When you add a new top-level doc**, append it to the right group above with status, purpose, and (where useful) a row in the cross-reference cheat sheet.
- **When you remove or rename a doc**, update every link in this file and in [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md). Use the search-and-replace tool, not manual edits.
- **When a doc moves status** (e.g., ACTIVE → ARCHIVE), change only the status emoji here. Do not move the row to a different group unless the purpose itself changed.
- **When a doc becomes obsolete**, mark it ⚪ ARCHIVE here and add a one-line note explaining what replaces it. Do not delete the file.
- **Never duplicate content**: this file links — it does not restate.
