# Phase 3 — Admin and Operator UI Build (Weeks 38–49)

## Why This Plan Exists
Phase 1 (Weeks 1–12) delivered the multi-tenant backend and pilot hardening. Phase 2 (Weeks 21–32) delivers the consumer and staff-shell client UI. Neither phase covers the full set of admin and operator screens that real salons and the platform owner need to run the business day-to-day.

This document closes that gap. It defines a 12-week Phase 3 that turns existing services and audit infrastructure into a complete operator console for owners, location managers, salon staff, and platform super-admins.

## Scope Boundary
- **Phase 2** delivers what clients and front-line staff use to take and complete bookings.
- **Phase 3** delivers what owners, managers, marketers, and platform support use to configure, monitor, govern, and grow the business.
- Phase 3 does **not** rebuild backend domains. It exposes existing services through production UI and adds only the minimum endpoints required by an admin workflow that has no current API.

## Assumptions
- Phase 3 starts the week after Phase 2 closes.
- Weekly sprint cadence and governance match Phase 1 and Phase 2.
- Design team supplies admin Figma batches (M–S) per [FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md](FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md), two sprints ahead of consumption.
- Admin UI uses the same theme tokens as the client app. Admin-specific patterns (data tables, bulk actions, command palette) are introduced as new components and added to the design system.
- All admin work assumes RBAC (owner, location_manager, salon_staff, platform_owner) is enforced at the service layer; UI surfaces only what the role allows and degrades gracefully for denied actions.

## Entry Conditions (must be true before Week 38 starts)
1. Phase 2.3 close report signed off; all consumer domains connected to real Firebase; Phase 2 exit condition #1 satisfied.
2. Figma packages for Weeks 38–39 priority screens accepted via the handoff playbook.
3. Admin design system additions (data table, bulk action bar, command palette, destructive confirm) accepted.
4. No P0/P1 defects open against the booking/payments path.
5. Platform super-admin role and impersonation token model defined and reviewed by security.

## Exit Conditions (Definition of Done for Phase 3)
1. Every domain in "Domain Coverage" has a complete operator UI wired to real services with role-aware behavior. Verified against the per-week **Service Integration Map** below — every Phase 1 service listed for a week is consumed by at least one screen shipped that week.
2. Web parity is release-critical. Native parity is required for mobile-relevant admin flows (today view, queue, manual booking on the floor); the rest can be web-primary.
3. Accessibility audit passed for admin screens.
4. Audit-log coverage validated for every admin action that mutates state.
5. RBAC enforcement tests pass for all role boundaries (deny, allow, escalation).
6. **Operator End-to-End QA pack** (see Operator E2E QA Gate section) executed against the integrated admin console with zero P0 and zero P1 findings open.
7. Phase 3 close report and public **operator-ready release**.

## Domain Coverage
1. Owner / tenant configuration (profile, brand, legal, tax, domains)
2. Subscription, billing, Stripe Connect, payouts
3. Location management and resources
4. Staff administration (invite, roles, schedules, qualifications, commission)
5. Service catalog depth (categories, packages, rules, media, visibility)
6. Booking operations (master calendar, manual book, blocks, force-book, no-show, recurring)
7. Client / CRM (list, detail, merge, block, segments, GDPR export, delete)
8. Loyalty program admin
9. Activities and challenges admin
10. Campaigns and marketing admin (including AI approval queue)
11. Reviews and reputation admin
12. Messaging admin (assign, canned replies, archive, search)
13. Waitlist admin
14. Analytics and reporting (dashboards + custom report builder + exports)
15. AI admin (toggles, suggestion review, audit, safety incidents)
16. Marketplace admin (tenant-side post composer, performance, anti-theft compliance)
17. Salon onboarding admin (verification, approval, trial extension)
18. Operations and compliance (audit log explorer, security events, consent log, incident surface)
19. Platform super-admin (tenant directory, impersonation, plans, feature flags, migration runner, support)
20. Cross-cutting admin (admin sign-in, 2FA, role-denied, bulk action, destructive confirm, command palette, "view as client")

## Service Integration Map (per week)
Unlike Phase 2 (where presentation, navigation, and Firebase wiring were split across 2.1 / 2.2 / 2.3), Phase 3 wires each admin screen to its real Phase 1 / W13–W20 service in the same week the screen is built. This table makes that contract explicit so each week's close report can verify "wired to real services" without ambiguity.

| Week | Primary services consumed (existing) | New admin-only endpoints (if any) | Real-data acceptance check |
|------|--------------------------------------|-----------------------------------|----------------------------|
| W38 | `tenantService`, `brandingService`, `taxService` (Stripe Tax W14), `currencyService`, `notificationService` | Owner notification preferences write | Owner KPI dashboard renders today's revenue and bookings from live Firestore for a seeded tenant |
| W39 | `subscriptionService` (W13), `stripeConnectService` (W14), `payoutService`, `invoiceService`, `pdfRenderService` | Plan-change / cancel-pause flows | Plan change updates Stripe and Firestore; payout history pulls from real Connect account |
| W40 | `locationService`, `resourceService`, `walkinQueueService`, `cashCloseService`, `holidayCalendarService` | Daily-close report write | Per-location dashboard reflects live walk-ins and same-day bookings |
| W41 | `staffService`, `inviteService`, `scheduleService`, `commissionService`, `auditService` | Staff invite + role-change writes | Invited staff appears in pending state; role change emits audit entry |
| W42 | `serviceCatalogService`, `mediaService`, `bookingRulesService`, `csvImportService` | Bulk import / export | CSV round-trip preserves catalog; visibility toggle reflects on consumer marketplace |
| W43 | `bookingService`, `slotEngine` (W7), `recurringBookingService`, `auditService`, `cancellationPolicyService` | Force-book + override writes (audit-required) | Drag-to-reschedule respects slot-engine conflicts against live Firestore; force-book writes audit |
| W44 | `clientService` (W10), `segmentService`, `gdprExportService`, `messagingService` | Client merge + delete writes | Segment builder returns real client counts; GDPR export package downloads valid bundle |
| W45 | `loyaltyService`, `activityService`, `campaignService`, `aiContentService` (W19), `transactionalTemplateService`, `promotionService` | Manual point adjust, campaign send, promo code | Sending a campaign to a real test segment delivers via push/email/SMS to test users |
| W46 | `reviewService`, `messagingService` (real-time listeners), `waitlistService`, `cannedReplyService` | Review reply, waitlist→booking convert | Inbox subscribes to live message threads; waitlist→booking writes through `bookingService` |
| W47 | `analyticsService` (W11), `reportBuilderService`, `pdfRenderService`, `exportService`, `auditService` | Scheduled report config write | Revenue dashboard matches a hand-computed reconciliation against W11 fixtures within tolerance |
| W48 | `aiService` (W19), `aiSafetyService`, `marketplaceService` (W18.1/18.2), `featureFlagService` | AI toggle writes, marketplace post writes | AI suggestion approve/reject mutates downstream surfaces; marketplace post visible on consumer side |
| W49 | `platformService`, `impersonationService`, `migrationRunner` (W12), `featureFlagService`, `securityEventsService` | Platform-wide writes (audit-required) | Impersonation session works end-to-end with banner, audit, and duration cap |

At each week's close report, the team confirms each row's real-data acceptance check passed against the dev Firestore project (not the emulator alone). Any row that cannot be verified blocks the week-N close.

## Week-by-Week Plan

### Week 38 — Owner Home, Tenant Settings, Brand and Legal Config
- Owner home / KPI dashboard (revenue today/week, bookings, occupancy, top staff, alerts).
- **Operator notification center** (booking failures, payment failures, payout issues, AI safety events). Surfaces alerts the system already emits.
- Tenant settings shell with sectioned navigation.
- Business profile (legal name, address, contact, business hours global defaults).
- Brand settings (logo, colors, marketing assets, public profile preview).
- Tax / VAT settings, tax IDs. **US-primary (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)):** Stripe Tax handles US state sales tax + EU VAT in one product (wired in W14); admin surfaces tax-jurisdiction summary per location. Most US states do not tax personal services; states that do (e.g., CT, HI, NM, SD, WV, NYC surcharge) are handled automatically by Stripe Tax based on salon address.
- **Multi-currency settings (Group B = YES, per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)):** tenant default currency (USD primary, EUR secondary at launch); per-location currency override; FX-disclosure preferences for receipts. Cross-currency settlement handled by Stripe Connect.
- Legal documents on file (business license, contracts).
- Domain / custom URL settings (decision-gated).
- Owner notification preferences (operational alerts, daily/weekly digests).
- **Admin pattern landings (apply across all subsequent weeks)**: empty state, loading state, error state, role-denied state, embedded help anchor / runbook deep link.
- **First-run admin console tour** (light-touch coach marks for owners landing in the console for the first time).

### Week 39 — Subscription, Billing, Connect, Payouts
- Plan selection and change-plan flow (uses Week 13–14 backend).
- Invoice history with download.
- Payment method on file (admin-side card management).
- Cancel and pause subscription flows.
- Stripe Connect onboarding flow (admin-side, full not just status).
- Connect health, document submission status, recovery from `restricted` state.
- Payout history and pending balance.
- Payout schedule controls.
- Refund / dispute admin view (read + initiate where allowed).
- **Print / PDF rendering** for invoices, payout statements, refund receipts (server-side render service).

### Week 40 — Location Dashboard, Settings, Resources
- Per-location dashboard (today's bookings, revenue, occupancy, walk-ins).
- Multi-location switcher and overview.
- Location settings (hours, holidays, contact, address, photos). **US-primary (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)):** US federal holidays seed available for booking blackout, with state-optional holiday toggles per location. EU locations seed by country.
- Service catalog overrides per location.
- Resource management (rooms, chairs, equipment, capacity rules).
- Walk-in / queue management at location level (admin variant of staff app).
- Daily close / cash report.

### Week 41 — Staff Administration
- Staff invite flow with email/SMS and pending state.
- Role assignment with audit trail.
- Schedule editor (templates, exceptions, time-off approvals workflow).
- Qualification / service-mapping editor.
- Commission and payout configuration.
- Per-staff performance metrics (sourced from Week 11 analytics).
- Deactivate / reactivate with reason and audit.
- **Bulk-action pattern v1 lands here** (multi-select, bulk-action bar, confirmation modal). Pattern is reused by every subsequent admin list (services, bookings, clients, reviews, messages).

### Week 42 — Service Catalog Depth
- Category and tag management.
- Bulk import / export (CSV).
- Price list management.
- Add-ons and packages.
- Seasonal availability rules.
- Photos and media manager.
- Booking rules per service (deposit, cancellation window, buffer time, lead time).
- Visibility toggles (online, marketplace, internal-only).

### Week 43 — Booking Operations
The operator's daily-driver screen.
- **Mock-first prototype gate (Mon–Tue of W43):** Master calendar interactions (drag-to-reschedule, conflict resolution, force-book) are first prototyped against a deterministic in-memory dataset (extends W35 mock harness) so slot-engine UX edge cases surface before real Firestore writes are introduced. Wiring to live `bookingService` + `slotEngine` happens Wed–Fri of W43. Rationale: this is the highest-complexity admin surface in the program and the most expensive to debug against live data.
- Master calendar (all staff, all rooms, day/week/month).
- Drag-to-reschedule with slot-engine validation.
- Booking detail (admin view) with full timeline, audit, and customer history.
- Manual booking creation (phone-in / walk-in).
- Block time / hold slot.
- Override / force-book with required reason and audit.
- No-show marking with policy enforcement.
- Cancellation handling with fee enforcement.
- Rebook / reschedule on behalf of client.
- Recurring booking management — **descoped to post-launch** per Phase 2 Decision Gate Outcomes (consumer recurring backend deferred); W43 ships only one-time admin booking management.
- Slot-engine conflict resolution UI.

### Week 44 — Client / CRM
- Client list with filters, search, saved views.
- Client detail (history, preferences, loyalty, notes, allergies, photo gallery, consents).
- Merge duplicate clients with conflict resolution.
- Block / report client.
- Client segmentation builder (UI for Week 10 backend).
- Targeted message / campaign send to a segment (links into Week 40).
- GDPR data export per client.
- Delete client per request (with audit).

### Week 45 — Loyalty, Activities, Campaigns Admin
- Loyalty program configuration (earn rules, tiers, expirations, multipliers).
- Reward catalog editor with media.
- Manual point adjustment with audit.
- Loyalty performance dashboard.
- Tier migration tools.
- Activity / challenge catalog and rules editor.
- Participation analytics.
- Campaign list, create, schedule.
- Audience picker (segments).
- Multi-channel template editor (push, email, SMS, in-app).
- A/B variant configuration and send-time optimization controls.
- AI-generated content approval workflow (per Week 19 policy).
- Pre-send compliance checklist (consent, throttle, quiet hours).
- Campaign performance dashboard.
- **Transactional message template editor** (booking confirmation, booking reminder, no-show, cancellation, receipt, password reset). Per-tenant overrides on top of platform defaults.
- **Promotions / discount codes admin** (create code, apply rules: services, dates, max uses, per-client cap; track redemption).

### Week 46 — Reviews, Messaging, Waitlist Admin
- Review queue with filters and bulk actions.
- Owner reply composer with templates.
- Flag, dispute, hide review with audit.
- Review request automation rules.
- Reputation summary dashboard.
- Inbox triage view across staff.
- Assign thread to staff.
- Canned replies / templates.
- Operating-hours auto-reply configuration.
- Block / report client from inbox.
- Message archive and search.
- Waitlist list with priority.
- Convert waitlist to booking.
- Waitlist policies and configuration.

### Week 47 — Analytics, Reporting, Exports
Backend exists; this week brings the surfaces.
- **Mock-first prototype gate (Mon of W47):** Dashboard layouts, drill-down interactions, and chart components are first prototyped against fixed analytics fixtures (sourced from W11 test fixtures) so visualization correctness is validated independently of aggregation timing. Wiring to live `analyticsService` happens Tue–Fri. Rationale: aggregation bugs and visualization bugs are easy to confuse — separate them.
- Revenue dashboard.
- Booking funnel.
- Staff productivity.
- Service performance.
- Client retention / cohort analysis.
- Marketplace attribution (surfacing Week 18.1 metrics).
- Custom report builder.
- Scheduled report email delivery.
- Export with RBAC controls and audit.
- **Multi-currency reporting (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)):** per-currency revenue columns, FX-rate snapshot at transaction time, cross-currency totals using daily ECB rates with disclosure. Reporting groups by tenant default currency for owner-facing summaries.
- **Operator-scoped audit log explorer** (tenant-scoped: who did what, when, on what record). Distinct from platform-wide audit log in Week 44.
- **Print / PDF rendering** for daily close reports, scheduled reports, GDPR export packages.

### Week 48 — AI Admin and Marketplace Tenant Tools
- AI feature toggles per tenant.
- Role-aware AI budget config (extends current owner-only screens).
- AI suggestion review queue (scheduling, retention, content).
- Approve / reject AI-generated outbound campaigns (joins Week 40 flow).
- AI usage analytics.
- AI safety incident log and review.
- Broader AI audit log explorer (extends current budget-only audit).
- Marketplace post composer (tenant-side) with tags and "Book this look" link.
- Per-post performance.
- Visibility settings (marketplace vs profile-only).
- Anti-client-theft compliance dashboard.

### Week 49 — Platform Super-Admin, Compliance, Polish, RC
- Tenant directory (all tenants) with status, plan, health, support notes.
- Tenant detail and intervention surface.
- Suspend / reactivate tenant.
- Impersonation flow with full audit, duration cap, and banner.
- Cross-tenant analytics.
- Platform health dashboard.
- Pricing and plan management.
- Feature flag console (closes Phase 1 KI-004).
- Platform-wide audit log explorer.
- Cross-tenant marketplace moderation queue (extends Week 18.2 to UI).
- Cross-tenant AI budget overrides.
- Migration runner UI (wraps Week 12 script).
- Backup / restore status surface.
- Support inbox / ticketing surface or stub for chosen vendor.
- Operations and compliance: audit log explorer (general), security events dashboard, data-export-request dashboard, consent and policy version log, incident response status surface.
- Cross-cutting admin polish: admin sign-in, admin 2FA enforcement, role-denied states, bulk-action confirmation pattern, destructive-action confirmation with reason, command palette, "View as client" preview mode.
- Phase 3 close report and **operator-ready release candidate**.

## Operator End-to-End QA Gate (W49)
Mirrors the Phase 2.3 W35 manual QA pack but for the admin / operator surface. The pack is a scripted operator journey rather than per-screen visual QA, and it is executed against the fully integrated admin console (real Firestore, real Stripe Connect dev account, seeded tenant data). Goal: catch integration drift between admin domains that per-week visual QA cannot see.

**Pack structure (target ~50 scripted test cases across 8 sections):**
1. **Tenant lifecycle** — owner sign-up → tenant config → brand → tax → multi-currency → notification prefs.
2. **Subscription & payouts** — plan choice → Connect onboarding → first invoice → payout schedule.
3. **Locations & resources** — create location → hours/holidays → resources → walk-in queue.
4. **Staff** — invite → accept → role assign → schedule → commission → deactivate.
5. **Catalog** — categories → bulk import → packages → booking rules → visibility.
6. **Daily operations** — manual booking → reschedule → force-book (audit check) → no-show → daily close.
7. **Client & marketing** — segment build → campaign send → review reply → waitlist convert.
8. **Reporting & platform** — revenue dashboard reconciliation → scheduled report → impersonation session (audit + banner check) → feature flag toggle.

**Execution rules:**
- Run against dev Firestore + Stripe dev mode, not emulator alone.
- Two operators execute independently (one web, one tablet/mobile where parity required).
- P0 findings block phase exit; P1 must close before operator-ready release; P2 deferred to Phase 3.5.
- Findings logged in `documentation/new-platform/PHASE3_W49_OPERATOR_QA_FINDINGS.md`.
- Pack becomes a rolling regression suite: re-executed at start of Phase 3.5 (W50) and pre-GA (W54) before commercial release.

## Decision Gates
| Gate | Decide by | Default if undecided |
|------|-----------|----------------------|
| Custom domains per tenant in scope? | End of Week 37 | No (post-launch) |
| Web-primary admin vs full mobile parity? | End of Week 37 | Web-primary; native parity only for floor-operator flows (calendar, queue, manual booking) |
| Recurring booking admin in scope? | End of Week 42 | Mirrors Phase 2 decision |
| Custom report builder vs pre-built reports only? | End of Week 46 | Pre-built reports + CSV export only; custom builder post-launch |
| Support ticketing built-in vs vendor (Zendesk/Intercom) embed? | End of Week 48 | Vendor embed |
| Impersonation duration cap | End of Week 48 | 30 minutes, owner consent prompt required |
| Cross-tenant marketplace moderation in scope this phase? | End of Week 48 | Yes (read + flag); takedown post-launch |

## Decision Gates Addendum (Group B — Scope Expansions)
The following items are real product surfaces that some salon-management competitors include. None are in the current Phase 3 scope. Each must receive an explicit yes/no answer by its decide-by date. A "yes" expands Phase 3 by approximately the number of weeks shown; a "no" defers the item to a Phase 4 backlog.

| Gate | Decide by | If "yes" — added scope | Default if undecided |
|------|-----------|------------------------|----------------------|
| Inventory / retail products and stock | End of Week 40 | +1 week (insert as W42.5 or extend W47 by 5 days): product catalog, stock levels, low-stock alerts, retail receipts, retail at booking checkout (Phase 2 client-side change too) | No |
| Accounting / bookkeeping export (QuickBooks, Xero) | End of Week 46 | +0.5 week absorbed into W47: connector setup, export schedule, mapping table | No |
| Gift cards as an admin product (issuance, balance, sale) | End of Week 43 | +0.5 week absorbed into W45: gift card create/issue, balance lookup, redemption admin, refund/void; client-side already covered in Phase 2.1 redemption | No |
| Service intake / consult / consent forms (per service) | End of Week 41 | +1 week (insert as W42.5): form builder, per-service attachment, signature capture, retention rules, audit | No |
| Multi-currency operations | RESOLVED (pre-Phase 3) | RESOLVED YES (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)): per-location currency, FX disclosure, multi-currency reporting absorbed across W38/W39/W47 | Yes |
| NPS / post-booking survey configuration | End of Week 45 | +0.5 week absorbed into W46: survey config, channel + cadence, response dashboard | No |
| Vendor / supplier management | End of Week 40 | +1 week: vendor directory, purchase orders, invoice intake | No (out of typical SMB scope) |
| Configurable messaging SLAs (response-time targets, alerts) | End of Week 45 | +0.5 week absorbed into W46: SLA config, breach alerts | No |

If two or more Group B gates resolve to "yes", re-baseline Phase 3 end date accordingly; do not silently absorb scope into the existing 12 weeks.

## Parallel Streams (run alongside Weeks 38–49)
- **Design supply**: admin batches M–S delivered two sprints ahead.
- **Continuous QA**: visual regression and RBAC regression suite grown weekly.
- **Docs**: per-screen operator runbooks appended to `documentation/new-platform/runbooks/`.
- **Security**: every admin write path requires audit-log coverage and RBAC test.
- **Performance**: data-table virtualization budget enforced.

## Acceptance Gate Per Week
1. Week-N close report under `documentation/new-platform/PHASE3_WEEKN_CLOSE_REPORT.md`.
2. Test deltas: total count, suites added, RBAC tests for new role-guarded actions.
3. Audit-log evidence: every state-mutating admin action verified to write an audit entry.
4. Visual QA evidence against Figma for every new screen.
5. Tracking board updated; cards moved to Done with date and owner.

## Risk Register
| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| Admin Figma batches deliver late | High | High | Two-sprint buffer; fall back to [ADMIN_UI_INTERPRETATION_GUIDELINES.md](new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md) only for non-blocking screens |
| Scope creep on Master Calendar (Week 38) | High | High | Lock conflict-resolution and recurring scope to Phase 2 decision gates; defer multi-resource conflict UI to post-launch |
| RBAC drift between UI and service layer | High | Medium | Mandatory RBAC test per role per screen; security review of every PR that introduces a privileged action |
| Audit-log gaps on admin writes | High | Medium | Audit-write checked in PR review; automated test asserting audit emission |
| Impersonation abuse risk | Critical | Low | Hard duration cap; owner consent (or platform-policy-approved override); banner; full audit; quarterly review |
| Data-table performance degrades on large tenants | Medium | High | Virtualization required; server-side pagination and filtering; perf budget per screen |
| Operator confusion from too many surfaces | Medium | High | Information architecture review at Week 35 entry; consistent navigation; command palette by Week 46 |
| Reporting accuracy regressions | High | Medium | Snapshot tests against Week 11 analytics fixtures; reconciliation report weekly |

## Trello Code Convention
Phase 3 cards extend the prefix scheme:
- `[W35-ADM-001]` Owner KPI dashboard
- `[W40-ADM-014]` Master calendar drag-to-reschedule
- `[W46-PLT-007]` Platform impersonation flow

New category codes:
- `ADM`: Admin / operator UI
- `PLT`: Platform super-admin
- `RPT`: Reporting / analytics surfaces
- `CRM`: Client / CRM admin

Existing reused: `UI`, `DSGN`, `SEC`, `QA`, `DOC`.

## Re-Baseline Triggers
1. Phase 2 slips by more than two sprints.
2. Three or more admin Figma batches miss their delivery date.
3. Pilot data reveals a missing operator workflow not in this plan.
4. Stakeholder requests a major scope addition (e.g. franchise / multi-brand layer, finance/accounting integrations).

## Cross-References
- Master index: [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md)
- Gantt: [PROJECT_GANTT_AGILE_PLAN.md](PROJECT_GANTT_AGILE_PLAN.md)
- Tracking board: [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md)
- Phase 2 plan (prerequisite): [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md)
- Design supply: [FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md](FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md)
- Admin UI interim rules: [new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md](new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md)


