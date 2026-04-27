# Phase 3.5 — Release Readiness (Weeks 45–49)

> **Filename note:** the document filename retains `WEEKS_45_TO_48` for stable links across the program. The phase is **5 weeks** (W45–W49). A new W48 (support skeleton, no AI) was inserted so that customer-facing in-app support and the platform-owner support dashboard are live at commercial GA. Compliance/BI/GA moved from W48 to W49.

## Why This Plan Exists
Phases 1–3 deliver a feature-complete, governed, multi-tenant platform with consumer and operator UI. They do not, by themselves, make the product safely shippable for commercial release.

This phase adds the gates that separate "feature-complete" from "commercially launched":
1. Production observability and SLOs.
2. External security validation and disaster-recovery drill.
3. AI quality evaluation harness.
4. **Customer-facing in-app support surface and platform-owner support dashboard (human-handled at GA, AI router added in Phase 4).**
5. Go-to-market surfaces (marketing site, self-serve checkout, BI export, compliance documentation).

Phase 3.5 is intentionally short and surgical. No new product surfaces are added; existing surfaces are made operationally trustworthy.

## Entry Conditions (must be true before Week 45 starts)
1. Phase 3 close report signed off; operator-ready release candidate produced in Week 44.
2. No P0/P1 defects open against booking, payments, or admin write paths.
3. Stripe Billing and Connect verified live in production with at least one real tenant.
4. Pentest vendor selected and contracted (procurement done before Week 45 to avoid blocking).
5. Marketing site copy direction approved (so Week 47 implementation does not stall on content).

## Exit Conditions (Definition of Done for Phase 3.5)
1. Production observability stack live (error reporting, APM, logs, uptime checks, alerting).
2. Three published SLOs with error-budget policy.
3. Disaster-recovery drill executed end-to-end with documented RTO and RPO.
4. External pentest report received; all High and Critical findings remediated.
5. AI evaluation harness running for top three AI features with baseline scores recorded.
6. **In-app `SupportChatScreen` live for end clients and salon admins/owners (human-handled, no AI router yet).**
7. **`AdminSupportQueueScreen` live for platform owner with full ticket context, reply composer, status transitions, macros, and KB seed.**
8. Marketing site live with pricing, comparison, and self-serve plan checkout.
9. BigQuery / data warehouse export pipeline live for tenant-scoped data export.
10. Compliance pack assembled: DPA template, sub-processor list, security whitepaper, GDPR Article 30 record.
11. **Commercial-launch-ready release**.

## Week-by-Week Plan

### Week 45 — Observability, SLOs, Performance Gates
- Wire production error reporting (Sentry or Crashlytics + Sentry web).
- APM for Cloud Functions, Hosting, Firestore call latency, AI calls.
- Log aggregation with retention and basic dashboards.
- Synthetic uptime checks for: web hosting, auth, booking-create, payment-create, AI callable.
- Alert routing with on-call rotation (PagerDuty / Opsgenie or equivalent).
- Define and publish 3 SLOs: web availability, booking-create success, payment-create success.
- Error-budget policy with automated alerting at 50% and 100% burn.
- CI bundle-size threshold gate and Lighthouse threshold gate.
- Add load-test harness (k6 or Artillery) with one synthetic profile covering the booking + AI hot path.

### Week 46 — Pentest, Disaster Recovery, Security Hardening
- External pentest in flight (vendor, contracted in entry conditions).
- Triage and remediate High and Critical findings as they arrive (do not wait for the final report).
- Execute disaster-recovery drill against staging: Firestore restore from backup, function rollback, hosting rollback. Record actual RTO and RPO; update [BACKUP_RESTORE.md](new-platform/runbooks/BACKUP_RESTORE.md) and [ROLLBACK_STRATEGY.md](new-platform/runbooks/ROLLBACK_STRATEGY.md).
- Security review of the impersonation flow shipped in Week 44 with adversarial test cases.
- Re-run Firestore rules tests against the final ruleset; freeze the rules for launch.
- Add tenant-scoped rate limits to public callables (login, register, booking-create) if not already in place.
- Penetration-test final report received; fixes verified; sign-off recorded.

### Week 47 — AI Quality Evaluation, Marketing Site, Self-Serve Signup
- AI evaluation harness:
  - Build offline eval runner (no live cost) over a curated eval set per feature.
  - Seed eval sets for: AI chat, AI scheduling suggestion, AI content generation. 50 examples each minimum, with rubric.
  - Record baseline scores; commit to a regression threshold.
  - Wire eval to CI for any prompt or model-tier change.
  - Add human-in-the-loop sample review process for weekly QA.
- Marketing / public site (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md), **US-first**):
  - Public landing page (already scaffolded in Week 1.5).
  - **US-first messaging and copy**; named competitor comparison: Vagaro, Square Appointments, Booksy.
  - Pricing page: **USD primary, EUR on EU-locale path**.
  - Feature pages for owners (booking, marketplace, AI, loyalty, payments).
  - Comparison page (legally reviewed).
  - SEO basics: sitemap, robots, meta tags, canonical.
  - Self-serve plan checkout that hands off to the salon onboarding wizard from Week 15.
  - Trial signup lands the tenant in onboarding wizard with `trial.activeAt` stamped.
  - Public legal pages link from footer (uses Phase 2.1 W29 content; includes ADA + WCAG 2.1 AA accessibility statement).
  - Domain strategy: `.com` primary; EU TLD secondary.
- **SOC 2 Type 1 vendor selection** (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)): pick auditor and scope; kickoff scheduled for Phase 5 (W53+).

### Week 48 — Support Skeleton at Launch (no AI yet)
Implements the support surfaces from [AI_SUPPORT_SYSTEM_ARCHITECTURE.md](AI_SUPPORT_SYSTEM_ARCHITECTURE.md) without the AI router so launch ships with usable in-app support and a platform-owner dashboard from day one.
- Firestore collections per architecture spec §5: `tenants/{tenantId}/supportTickets`, `tenants/{tenantId}/supportTickets/{ticketId}/messages`, platform-level `escalationQueue`, extended `platform/config` for support settings.
- Firestore rules: tenant isolation on `supportTickets`, platform-owner-only on `escalationQueue`. Added to rules test suite.
- `SupportChatScreen` (protected route) for end clients and salon admins/owners — opens or resumes a ticket, posts user messages, renders admin replies. Role- and tenant-aware context captured at ticket creation.
- `AdminSupportQueueScreen` (platform-owner-only protected route) — cross-tenant queue, full message thread, ticket context (recent bookings, account age, locale), reply composer, status transitions (open / resolved / escalated / closed).
- Knowledge-base authoring UI (platform-owner-only) — edits the system prompt that the W50 AI router will consume; persists to `platform/aiSupportKb/{versionId}` with version history. KB seeded from the W48 customer support runbook.
- Macros / canned responses authoring UI for the platform owner.
- All flows are functional **without** AI: tickets created → routed straight to escalation queue → platform owner replies. Proves surfaces, rules, and queue ergonomics before the AI router lands in W50.
- Begin compliance pack work in parallel (continues into W49).
- AI budget guard: register a new `aiSupport` feature key with default Healthy thresholds, ready for W50 to consume.

### Week 49 — Compliance Pack, BI Export, Launch Polish, GA
- Compliance pack (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)):
  - Data Processing Agreement template (legal-reviewed).
  - Sub-processor list page (Stripe, Firebase, AI provider, email/SMS provider, support tooling).
  - Security whitepaper (architecture, encryption-in-transit and at-rest, access control, audit, incident response). Confirms HIPAA non-applicability (no PHI handled).
  - GDPR Article 30 record of processing activities.
  - **US privacy disclosures**: CCPA / CPRA notice, "Do Not Sell or Share" mechanism, GPC opt-out signal handling; VCDPA (VA), CPA (CO), CTDPA (CT), UCPA (UT) state-privacy disclosures.
  - **Accessibility statement**: ADA + WCAG 2.1 AA compliance statement covering consumer app, admin, and support surfaces.
  - Privacy nutrition labels and Play data-safety form finalized for store submission.
- BI / data export:
  - Firestore-to-BigQuery extension or scheduled export per tenant.
  - Tenant data export download in admin (CSV bundle for top entities) — extends Week 42 export with bulk full-data option.
  - Documented schema reference for exported data.
- Launch polish:
  - Final visual QA pass across consumer + admin + super-admin + **support surfaces from W48**.
  - Final accessibility re-audit (includes `SupportChatScreen` and `AdminSupportQueueScreen`).
  - Launch readiness checklist (uses [PILOT_GO_LIVE.md](new-platform/PILOT_GO_LIVE.md) as base, expanded for commercial scale, includes support-tab smoke tests).
  - Status page (statuspage.io or equivalent) wired to the SLOs from Week 45.
  - Customer support runbook live; first-line responses templated; KB seed validated against runbook.
  - On-call rotation staffed for launch week (engineering + support tier-1).
- **Commercial GA release — includes in-app support tab and platform-owner support dashboard.**

## Decision Gates
| Gate | Decide by | Default if undecided |
|------|-----------|----------------------|
| Pentest vendor selected | Before W45 | BLOCKER — must be answered or W46 slips |
| SLO numeric targets (web availability, booking-create, payment-create) | End of Week 45 | Web 99.9%, booking-create 99.5% (excl. user error), payment-create 99.0% |
| Status page vendor (statuspage.io vs hosted self) | End of Week 45 | statuspage.io |
| Self-serve checkout in scope this phase, or sales-assisted only? | End of Week 46 | Self-serve in scope (Week 47 plan assumes yes) |
| BI export: BigQuery extension vs scheduled export | End of Week 47 | Firestore-to-BigQuery extension |
| Public comparison page legal review owner | End of Week 46 | External legal counsel review required |
| Support skeleton scope: ship at GA without AI router | Decided | YES — W48 ships support surfaces human-handled; AI router added in Phase 4 W50 |
| KB storage location | End of Week 47 | Dedicated `platform/aiSupportKb/{versionId}` collection with `current` pointer (used by W48 KB authoring UI and W50 AI router) |
| Per-tenant routing default for support tickets | End of Week 48 | Platform-owner first; tenants opt in to "tenant-owner first" later |
| End-client ticket access (every authenticated client vs only those with a booking) | End of Week 48 | Every authenticated client; rate-limited per user |
| SOC 2 Type 1 kickoff during or after launch | End of Week 47 | RESOLVED: kickoff in **Phase 5 (W53+)** with auditor selected during W47 (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)) |
| Primary target market | Decided | RESOLVED: **US primary, EU secondary** (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)) |

## Parallel Streams (run alongside Weeks 45–49)
- **Sales / GTM**: pricing finalization, partner outreach, launch announcement plan (out of engineering scope but blocks marketing site copy).
- **Customer success**: support tooling tenant configured, runbook authored, first-line training material; runbook content seeds the W48 KB authoring UI.
- **Engineering on-call rotation**: roster confirmed for launch week and the two weeks following.

## Acceptance Gate Per Week
1. Week-N close report under `documentation/new-platform/PHASE3_5_WEEKN_CLOSE_REPORT.md`.
2. Test deltas: SLO synthetic checks live (W45), pentest fixes verified (W46), AI eval baseline recorded (W47), support rules + queue tests (W48), launch checklist signed off (W49).
3. No regressions in Phase 1–3 test suite.
4. Tracking board updated.

## Risk Register
| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| Pentest finds Critical issue late in W46 | Critical | Medium | Triage and patch in flight; do not wait for final report; budget W47 for residual remediation if needed |
| DR drill reveals RPO worse than documented | High | Medium | Adjust backup cadence before launch; document realistic RPO publicly |
| AI eval reveals quality below product bar | High | Medium | Reduce AI surfaces or downgrade to "human review required" mode for the affected feature until quality bar met |
| Self-serve checkout edge cases break onboarding wizard | High | Medium | Manual fallback: support team can manually provision tenant from a Stripe payment |
| Marketing site delays launch | Medium | High | Marketing site is parallelizable; if it slips, soft-launch to a controlled tenant list while the site catches up |
| Status page misreports incidents | Low | Medium | Manual override; runbook for status updates |
| On-call coverage gap during launch | Critical | Low | Confirm rotation 4 weeks before launch; cross-train at least two engineers per domain |
| Support ticket volume at launch overwhelms platform-owner queue | High | Medium | Macros from W48; per-tenant routing flag (W48); tier-1 human responder staffed (W49 on-call); AI router lands W50 |
| Cross-tenant data leakage in support context (pre-AI) | Critical | Low | Tenant-isolation rules + adversarial rules tests in W48; context snapshot only includes the requester's tenant data |

## Trello Code Convention
Phase 3.5 cards extend the prefix scheme:
- `[W45-OPS-001]` Sentry production wiring
- `[W46-SEC-005]` Pentest remediation: SSRF in webhook handler
- `[W47-AI-009]` AI chat eval harness baseline
- `[W48-SUP-001]` Support tickets schema + rules
- `[W48-SUP-002]` SupportChatScreen v1 (no AI)
- `[W48-ADM-016]` AdminSupportQueueScreen v1
- `[W49-GA-012]` Status page wired to SLOs

New / reused codes: `OPS` (Observability and operations), `SEC` (Security), `GA` (Launch readiness), `MKT` (Marketing site), `SUP` (AI Support System surfaces; AI router is added in Phase 4).

## What This Phase Does Not Cover
Explicitly out of scope and tracked as Phase 4 / post-launch:
- AI router for support (Phase 4 W50) — launch ships human-handled support.
- AI confidence-scored auto-respond, escalation pipeline, eval, analytics, CSAT (Phase 4 W50–W52).
- SOC 2 Type 1 / Type 2 audit (separate ~3-month workstream).
- ISO 27001 certification.
- Enterprise / franchise tier (multi-brand, white-label, advanced finance integrations).
- AI-leadership features (real-time voice booking, video try-on, agentic ops copilot).
- Tax automation deep integration (Stripe Tax / VAT MOSS) beyond Stripe defaults.
- Accounting integrations (deferred via Group B decision gate in Phase 3).
- Inventory / retail (deferred via Group B decision gate in Phase 3 unless approved).

## Cross-References
- Master index: [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md)
- Gantt: [PROJECT_GANTT_AGILE_PLAN.md](PROJECT_GANTT_AGILE_PLAN.md)
- Tracking board: [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md)
- Phase 2 plan: [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md)
- Phase 3 plan: [PHASE3_ADMIN_UI_PLAN_WEEKS_33_TO_44.md](PHASE3_ADMIN_UI_PLAN_WEEKS_33_TO_44.md)
- Phase 4 plan (continues from this phase): [PHASE4_AI_SUPPORT_SYSTEM_PLAN_WEEKS_49_TO_52.md](PHASE4_AI_SUPPORT_SYSTEM_PLAN_WEEKS_49_TO_52.md)
- Support architecture spec (consumed by W48 + Phase 4): [AI_SUPPORT_SYSTEM_ARCHITECTURE.md](AI_SUPPORT_SYSTEM_ARCHITECTURE.md)
- Pilot go-live baseline: [new-platform/PILOT_GO_LIVE.md](new-platform/PILOT_GO_LIVE.md)
- Backup/restore runbook: [new-platform/runbooks/BACKUP_RESTORE.md](new-platform/runbooks/BACKUP_RESTORE.md)
