# Phase 3 — Admin and Operator UI Build (Weeks 33–44)

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

## Entry Conditions (must be true before Week 33 starts)
1. Phase 2 close report signed off; release candidate from Week 32 in the field.
2. Figma packages for Weeks 33–34 priority screens accepted via the handoff playbook.
3. Admin design system additions (data table, bulk action bar, command palette, destructive confirm) accepted.
4. No P0/P1 defects open against the booking/payments path.
5. Platform super-admin role and impersonation token model defined and reviewed by security.

## Exit Conditions (Definition of Done for Phase 3)
1. Every domain in "Domain Coverage" has a complete operator UI wired to real services with role-aware behavior.
2. Web parity is release-critical. Native parity is required for mobile-relevant admin flows (today view, queue, manual booking on the floor); the rest can be web-primary.
3. Accessibility audit passed for admin screens.
4. Audit-log coverage validated for every admin action that mutates state.
5. RBAC enforcement tests pass for all role boundaries (deny, allow, escalation).
6. Phase 3 close report and public **operator-ready release**.

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

## Week-by-Week Plan

### Week 33 — Owner Home, Tenant Settings, Brand and Legal Config
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

### Week 34 — Subscription, Billing, Connect, Payouts
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

### Week 35 — Location Dashboard, Settings, Resources
- Per-location dashboard (today's bookings, revenue, occupancy, walk-ins).
- Multi-location switcher and overview.
- Location settings (hours, holidays, contact, address, photos). **US-primary (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)):** US federal holidays seed available for booking blackout, with state-optional holiday toggles per location. EU locations seed by country.
- Service catalog overrides per location.
- Resource management (rooms, chairs, equipment, capacity rules).
- Walk-in / queue management at location level (admin variant of staff app).
- Daily close / cash report.

### Week 36 — Staff Administration
- Staff invite flow with email/SMS and pending state.
- Role assignment with audit trail.
- Schedule editor (templates, exceptions, time-off approvals workflow).
- Qualification / service-mapping editor.
- Commission and payout configuration.
- Per-staff performance metrics (sourced from Week 11 analytics).
- Deactivate / reactivate with reason and audit.
- **Bulk-action pattern v1 lands here** (multi-select, bulk-action bar, confirmation modal). Pattern is reused by every subsequent admin list (services, bookings, clients, reviews, messages).

### Week 37 — Service Catalog Depth
- Category and tag management.
- Bulk import / export (CSV).
- Price list management.
- Add-ons and packages.
- Seasonal availability rules.
- Photos and media manager.
- Booking rules per service (deposit, cancellation window, buffer time, lead time).
- Visibility toggles (online, marketplace, internal-only).

### Week 38 — Booking Operations
The operator's daily-driver screen.
- Master calendar (all staff, all rooms, day/week/month).
- Drag-to-reschedule with slot-engine validation.
- Booking detail (admin view) with full timeline, audit, and customer history.
- Manual booking creation (phone-in / walk-in).
- Block time / hold slot.
- Override / force-book with required reason and audit.
- No-show marking with policy enforcement.
- Cancellation handling with fee enforcement.
- Rebook / reschedule on behalf of client.
- Recurring booking management (if Phase 2 decision-gate approved).
- Slot-engine conflict resolution UI.

### Week 39 — Client / CRM
- Client list with filters, search, saved views.
- Client detail (history, preferences, loyalty, notes, allergies, photo gallery, consents).
- Merge duplicate clients with conflict resolution.
- Block / report client.
- Client segmentation builder (UI for Week 10 backend).
- Targeted message / campaign send to a segment (links into Week 40).
- GDPR data export per client.
- Delete client per request (with audit).

### Week 40 — Loyalty, Activities, Campaigns Admin
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

### Week 41 — Reviews, Messaging, Waitlist Admin
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

### Week 42 — Analytics, Reporting, Exports
Backend exists; this week brings the surfaces.
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

### Week 43 — AI Admin and Marketplace Tenant Tools
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

### Week 44 — Platform Super-Admin, Compliance, Polish, RC
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

## Decision Gates
| Gate | Decide by | Default if undecided |
|------|-----------|----------------------|
| Custom domains per tenant in scope? | End of Week 33 | No (post-launch) |
| Web-primary admin vs full mobile parity? | End of Week 33 | Web-primary; native parity only for floor-operator flows (calendar, queue, manual booking) |
| Recurring booking admin in scope? | End of Week 37 | Mirrors Phase 2 decision |
| Custom report builder vs pre-built reports only? | End of Week 41 | Pre-built reports + CSV export only; custom builder post-launch |
| Support ticketing built-in vs vendor (Zendesk/Intercom) embed? | End of Week 43 | Vendor embed |
| Impersonation duration cap | End of Week 43 | 30 minutes, owner consent prompt required |
| Cross-tenant marketplace moderation in scope this phase? | End of Week 43 | Yes (read + flag); takedown post-launch |

## Decision Gates Addendum (Group B — Scope Expansions)
The following items are real product surfaces that some salon-management competitors include. None are in the current Phase 3 scope. Each must receive an explicit yes/no answer by its decide-by date. A "yes" expands Phase 3 by approximately the number of weeks shown; a "no" defers the item to a Phase 4 backlog.

| Gate | Decide by | If "yes" — added scope | Default if undecided |
|------|-----------|------------------------|----------------------|
| Inventory / retail products and stock | End of Week 35 | +1 week (insert as W37.5 or extend W42 by 5 days): product catalog, stock levels, low-stock alerts, retail receipts, retail at booking checkout (Phase 2 client-side change too) | No |
| Accounting / bookkeeping export (QuickBooks, Xero) | End of Week 41 | +0.5 week absorbed into W42: connector setup, export schedule, mapping table | No |
| Gift cards as an admin product (issuance, balance, sale) | End of Week 38 | +0.5 week absorbed into W40: gift card create/issue, balance lookup, redemption admin, refund/void; client-side already covered in Phase 2.1 redemption | No |
| Service intake / consult / consent forms (per service) | End of Week 36 | +1 week (insert as W37.5): form builder, per-service attachment, signature capture, retention rules, audit | No |
| Multi-currency operations | End of Week 33 | RESOLVED YES (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)): per-location currency, FX disclosure, multi-currency reporting absorbed across W33/W34/W42 | Yes |
| NPS / post-booking survey configuration | End of Week 40 | +0.5 week absorbed into W41: survey config, channel + cadence, response dashboard | No |
| Vendor / supplier management | End of Week 35 | +1 week: vendor directory, purchase orders, invoice intake | No (out of typical SMB scope) |
| Configurable messaging SLAs (response-time targets, alerts) | End of Week 40 | +0.5 week absorbed into W41: SLA config, breach alerts | No |

If two or more Group B gates resolve to "yes", re-baseline Phase 3 end date accordingly; do not silently absorb scope into the existing 12 weeks.

## Parallel Streams (run alongside Weeks 33–44)
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
| Operator confusion from too many surfaces | Medium | High | Information architecture review at Week 33 entry; consistent navigation; command palette by Week 44 |
| Reporting accuracy regressions | High | Medium | Snapshot tests against Week 11 analytics fixtures; reconciliation report weekly |

## Trello Code Convention
Phase 3 cards extend the prefix scheme:
- `[W33-ADM-001]` Owner KPI dashboard
- `[W38-ADM-014]` Master calendar drag-to-reschedule
- `[W44-PLT-007]` Platform impersonation flow

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
- Phase 2 plan (prerequisite): [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md)
- Design supply: [FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md](FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md)
- Admin UI interim rules: [new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md](new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md)
