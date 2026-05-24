# Audit Timeline
**Phase A start:** 2026-05-25 (Monday)  
**Phase A end:** 2026-06-22 (Monday) — 21 working days  
**Phase B start:** After pilot launch decision (date TBD)  
**Phase B end:** ~14 working days after Phase B start  
**Gate:** Phase A must complete before pilot launch. Phase B must complete before public GA.

---

## Phase A: Day-by-Day Schedule

### Week 1 (May 25–29) — Pre-work + Booking flow

| Day | Date | Task | Deliverable |
|-----|------|------|-------------|
| 1 | Mon May 25 | **Mini-spec writing day.** Write all 3 mini-specs: (1) Auth de-facto spec via Option A — read implementation, document behavior; (2) Cancellation/reschedule sketch via Option C — anchor to booking spec v1.1 cancellation policy references; (3) Push notification UX sketch via Option C — anchor to `NOTIFICATION_EVENTS.md` 6 event types. | `documentation/audit/mini-specs/auth_spec.md`, `cancel_reschedule_spec.md`, `push_notification_ux_spec.md` |
| 2 | Tue May 26 | **S01 Booking flow — session 1.** Spec §steps 1–3: service selection, staff selection, date/time selection. Entry-point variants (from service card, from location profile, from quick-rebook). | Running gap list |
| 3 | Wed May 27 | **S01 Booking flow — session 2.** Spec §steps 4–6: review screen, policies/consent, payment step. Pre-fill and skip logic. | Running gap list |
| 4 | Thu May 28 | **S01 Booking flow — session 3.** Edge cases: guest vs. authenticated, no-availability state, confirmation screen, post-booking actions. Gap review and report writing. | `flows/S01_booking_flow_audit.md` (DRAFT) |
| 5 | Fri May 29 | **Auth flow audit — Part 1.** Audit against mini-spec: login screen, signup screen, forgot password. Social auth paths (if any). | Running gap list |

---

### Week 2 (Jun 1–5) — Auth + Explore tab

| Day | Date | Task | Deliverable |
|-----|------|------|-------------|
| 6 | Mon Jun 1 | **Auth flow audit — Part 2.** Token refresh, deep-link return, session persistence. Cancellation/reschedule audit (half day): audit cancel flow + reschedule flow against mini-spec. Write auth report. | `flows/AUTH_auth_flow_audit.md`, `flows/CANCEL_cancel_reschedule_audit.md` |
| 7 | Tue Jun 2 | **S02 Explore tab — session 1.** Spec §search and filter: keyword search, category chips, filter panel, sort options. | Running gap list |
| 8 | Wed Jun 3 | **S02 Explore tab — session 2.** Spec §service cards, map view, guest vs authenticated states. | Running gap list |
| 9 | Thu Jun 4 | **S02 Explore tab — session 3.** Edge cases: no results, location permission denied, empty city. Gap review, report writing. Start S06 Explore map session 1: map clustering, pin behavior, map/list toggle. | `flows/S02_explore_tab_audit.md` (DRAFT), running gap list for S06 |
| 10 | Fri Jun 5 | **S06 Explore map — session 2.** Map state management, service detail panel from map, edge cases (offline, no services in viewport). Write S06 report. | `flows/S06_explore_map_audit.md` |

---

### Week 3 (Jun 8–12) — Home tab + Rewards tab

| Day | Date | Task | Deliverable |
|-----|------|------|-------------|
| 11 | Mon Jun 8 | **S03 Home tab + S05 Empty states — session 1.** Spec §authenticated home: next appointment card, quick rebook, loyalty nudge, recent salons. Guest discovery-first state. | Running gap list |
| 12 | Tue Jun 9 | **S03 + S05 — session 2.** Empty state variants: new user, no upcoming appointments, no nearby salons. Spec diff absorbed check (verify `zarkili_home_spec_diff_v2.md` changes are in the v2 spec). Write report. | `flows/S03_S05_home_tab_audit.md` |
| 13 | Wed Jun 10 | **S04 Rewards tab — session 1.** Spec §loyalty points display: brand-level points, tier progress bar, tier label. Multi-brand switching behavior. | Running gap list |
| 14 | Thu Jun 11 | **S04 Rewards tab — session 2.** Spec §redeem section, earn-more section, transaction history, expiry warnings. Guest upsell state. | Running gap list |
| 15 | Fri Jun 12 | **S04 Rewards tab — session 3.** The 9 known bugs listed in the spec: verify each against code (some may already be fixed; document status). Gap review, write report. | `flows/S04_rewards_tab_audit.md` |

---

### Week 4 (Jun 15–19) — Payments + Salon onboarding

| Day | Date | Task | Deliverable |
|-----|------|------|-------------|
| 16 | Mon Jun 15 | **S23 + S24 Payments — session 1.** S23 product-level rules: deposit flow, full-payment flow, card-on-file. Cancellation fee logic. Apply Rule 3 (two-layer authority): audit product behavior rules from S23. | Running gap list |
| 17 | Tue Jun 16 | **S23 + S24 Payments — session 2.** S24 Stripe implementation: schema (`tenant_payment_settings`, `client_payment_profiles`, `appointment_payments`), Stripe Connect setup, payment capture flow. Apply Rule 2 (S24 is newer, wins for implementation questions). | Running gap list |
| 18 | Wed Jun 17 | **S23 + S24 Payments — session 3.** Cross-layer gap check: product rules from S23 that are absent from S24 implementation and vice versa. Refund, partial-pay, receipt edge cases. Push notification UX audit (half day): audit consumer notification preferences + display against mini-spec. Write both reports. | `flows/S23_S24_payments_audit.md`, `flows/PUSH_notifications_audit.md` |
| 19 | Thu Jun 18 | **S10 + S11 + S12 Salon onboarding — session 1.** Steps 1–5: account creation, business profile, Stripe Connect onboarding, services setup, staff setup. Note: S10 is Apr 17 (FLAG-8 staleness); document any discrepancies against current code as potential staleness flags. | Running gap list |
| 20 | Fri Jun 19 | **S10 + S11 + S12 Salon onboarding — session 2.** Steps 6–9: policies/availability, marketplace setup, verification, launch. `CLIENT_ONBOARDING_MODULES.md` cross-check. Write report. | `flows/S10_S11_S12_onboarding_audit.md` |

---

### Day 21 (Jun 22) — Phase A consolidation

| Day | Date | Task | Deliverable |
|-----|------|------|-------------|
| 21 | Mon Jun 22 | **Phase A close.** (1) Review all 9 audit reports; finalize DRAFT → COMPLETE status. (2) Consolidate all CRITICAL and PRE-LAUNCH gaps into DEBT_REGISTER.md. (3) Batch-review all FLAGs collected across Phase A — prepare a single FLAG resolution list for product decision. (4) Update AUDIT_INVENTORY.md completion dates. (5) Create Phase A close PR. | All reports COMPLETE, DEBT_REGISTER updated, Phase A PR |

---

## Phase A Summary

| Week | Flows audited | Reports produced |
|------|--------------|-----------------|
| W1 | Mini-specs (3), Booking flow | 1 audit report |
| W2 | Auth, Cancellation/reschedule, Explore tab, Explore map | 4 audit reports |
| W3 | Home tab + empty states, Rewards tab | 2 audit reports |
| W4 | Payments (combined), Push notification UX, Salon onboarding | 3 audit reports |
| Day 21 | Consolidation | All finalized |

**Total Phase A: 9 flow audit reports + 3 mini-spec documents**

---

## Phase B: Schedule (post-pilot launch, ~14 days)

Phase B begins after the pilot launch decision is confirmed. Exact dates TBD. The priority order below is fixed — adjust start date only.

| Week | # | Spec ID(s) | Flow | Days |
|------|---|-----------|------|------|
| B-W1 | 1 | S34 | Service data model v3 (1283 lines) | 2.5 |
| B-W1 | 2 | S29+S30+S31+S09 | Marketplace batch (product + domain + guardrails + personalization) | 2.5 |
| B-W2 | 3 | S25+S26 | Loyalty batch (functional spec + rules engine) | 1.0 |
| B-W2 | 4 | S27 | Messaging | 0.5 |
| B-W2 | 5 | S28 | Reviews & ratings | 0.5 |
| B-W2 | 6 | S14 | Free trial lifecycle | 0.5 |
| B-W2 | 7 | S15+S16+S17 | Services / Staff / Schedules domain batch | 1.0 |
| B-W3 | 8 | S18+S19+S20 | Tenants / TenantUsers / Locations domain batch | 1.0 |
| B-W3 | 9 | S21+S22 | Analytics + Segments | 0.5 |
| B-W3 | 10 | S35+S36 | Slot engine + Notification events | 0.5 |
| B-W3 | 11 | S37–S41 | AI policies batch (5 docs) | 1.5 |
| B-W3 | 12 | S32+S33+S13 | US addendum + Navigation + Client onboarding | 0.5 |
| B-close | — | Consolidation | Debt register, final reports, Phase B PR | 1.5 |
| | | **Phase B total** | | **~14 days** |

### Phase B rationale (priority order)

1. **Service data model first** — the v3 data model underpins all booking and admin operations. Finding a schema gap early in Phase B gives the most time to fix before GA.
2. **Marketplace second** — four docs covering the same domain; highest FLAG risk. Resolve contradictions early.
3. **Loyalty + Messaging + Reviews** — consumer differentiators; soft-launch tolerant but must be correct at GA.
4. **Free trial** — sales motion; needed for conversion funnel before GA.
5. **Domain batch (Services, Staff, Locations, Tenants)** — foundational correctness; low gap risk since these are stable, but worth confirming before GA.
6. **Analytics + Segments + Slot engine + Notifications** — admin reporting and booking engine contracts.
7. **AI policies batch** — Phase 3.5 AI surfaces; needed at GA but low consumer visibility.
8. **Addendum + Navigation + Client onboarding** — cross-cutting references; batch on a single day.

---

## Phase B Gap Severity Interpretation

In Phase B, gap severity maps to the same labels but the launch gate shifts:

| Severity | Phase B meaning |
|----------|----------------|
| CRITICAL | Blocks public GA launch |
| PRE-LAUNCH | Must fix before GA (not before pilot) |
| DEFER | v1.1 or post-GA item |
