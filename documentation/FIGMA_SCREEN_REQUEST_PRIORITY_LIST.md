# Figma Screen Request — Priority List for Phase 2

> **Companion**: copy-pasteable AI prompts for every batch below live in [`figma-prompts/README.md`](figma-prompts/README.md). Each batch (A–S) has its own prompt-pack file that reuses existing `design-handoff/` tokens and components and bakes in US-primary defaults.

## Purpose
This is the prioritized list of screens, components, and assets the design team must deliver to unblock the Phase 2 consumer UI build (Weeks 21–28). Use it together with [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md) to request packages.

## What Already Exists (do not re-request)
Already delivered in `design-handoff/`:
- Tokens (color, typography, spacing, radius, shadow)
- Components: badge, bottom-tab-item, category-pill, chip, filter-button, search-bar, service-card
- Screens: Welcome, Home, Explore
- Accessibility guide, asset manifest, font delivery spec

## Delivery Cadence
- Each batch must arrive at least **two sprints** before the engineering week that consumes it.
- One ZIP per batch following the strict contract in [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md) Phase 5.
- Partial deliveries are accepted only if the missing items are not on the consuming week's critical path.

## Design Mode Per Batch

Since the design system is locked in [`design-handoff/`](../design-handoff/HANDOFF_MANIFEST.md) (tokens, components, reference screens, accessibility, interactions), most remaining screens are **compositions of an existing system**, not net-new design. Each batch is therefore tagged with a design mode:

- **`code-only`** — Build directly in code from tokens + existing components. No Figma pass. Use the matching [`figma-prompts/`](figma-prompts/README.md) batch as the build spec.
- **`figma-then-code`** — One Figma pass to lock new patterns/components for the batch, then build the rest in code.
- **`figma`** — Full Figma deliverable required (brand surfaces, complex novel patterns).

Triggers and rules for choosing a mode are defined in [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md) → "When Figma is required".

| Batch | Scope | Design mode | Rationale |
|---|---|---|---|
| A | Auth & onboarding | `code-only` | Pure form/flow composition over existing components. |
| B | Discover / explore / profile | `code-only` | Extends locked Home/Explore reference screens. |
| C | Booking flow | `figma-then-code` | Calendar grid + time-slot picker are new patterns. Lock them once, then code. |
| D | Payments / tipping / receipts | `code-only` | Form + list composition. |
| E | Loyalty / activities / reviews | `figma-then-code` | Progress ring, tier badge, reward card are new visual patterns. |
| F | Messaging / notifications / waitlist | `code-only` | Standard list/thread/inbox patterns. |
| G | Staff app + AI | `figma-then-code` | AI chat panel, suggestion patterns, budget banners are novel. |
| H | Marketplace consumer | `figma-then-code` | Post detail and "Book this look" deep-link surface need a layout pass. |
| I | Legal / lifecycle / settings / auth edges | `code-only` | Mostly text + form variants. |
| J | Booking / payments / discovery edges | `code-only` | Edge variants of existing flows. |
| K | AI / messaging / loyalty / marketplace / staff extras | `code-only` | Variants of patterns already locked in C, E, G, H. |
| L | Cross-cutting / i18n / store readiness | `figma` | Marketing site, store assets, App Clip, widgets — brand surfaces. |
| M | Owner home / billing / Connect | `figma-then-code` | First admin density pass; sets pattern for N–S. |
| N | Locations / staff / services admin | `code-only` | Reuses density patterns locked in M. |
| O | Booking ops / master calendar | `figma` | Multi-resource scheduler is a genuinely novel component. |
| P | CRM / loyalty / campaigns admin | `figma-then-code` | Segment builder + campaign template editor are new patterns. |
| Q | Reviews / messaging / waitlist admin | `code-only` | Reuses M and P patterns. |
| R | Analytics / AI / marketplace admin | `figma-then-code` | Chart and report-builder patterns need a design pass. |
| S | Platform super-admin | `code-only` | Reuses all admin density patterns established in M, P, R. |

**Default**: when in doubt, prefer `code-only` and trigger a Figma pass only if the per-batch human review (checklist at the bottom of each `figma-prompts/` file) flags drift.

## Figma Wave Schedule

Figma work is grouped into **4 waves**, each pinned to a phase gate. Between waves, Figma is closed. After Wave 4, Figma is done — everything remaining is `code-only`.

The rule: **start each wave at the phase gate *before* the engineering wave that consumes it — never the same week.**

| Wave | Start week | Batches in this wave | Reason for timing |
|---|---|---|---|
| **Wave 1** | W19 | C (one-pass), E (one-pass) | C is critical-path for W23 engineering; E unlocks W25. Both are consumer-side, design them before Phase 2 starts. |
| **Wave 2** | W25 | G (one-pass), H (one-pass), M (one-pass) | G/H needed by W27–28. M is the most important one-pass in the program — it locks admin density for all Phase 3 batches (N, P, Q, R, S). Must be promoted into `design-handoff/` before W33. |
| **Wave 3** | W30 | P (one-pass), R (one-pass), O (full-Figma — start here) | P locks segment/campaign patterns needed by W39. R locks analytics/chart patterns by W42. O is the longest Figma task (~1.5-week generation alone) — start by W32 at the absolute latest so engineering begins W38 on time. |
| **Wave 4** | W43 | L (full-Figma) | L must be complete before Phase 3.5 release readiness locks at W45. Starting W43 gives ~2 weeks of generation + review + promotion, landing at W45. Marketing-site sub-track parallelizes with Phase 3 engineering. |

**After Wave 4, Figma is closed for the program.** All surfaces introduced in Phase 4 (AI support router, Phase 3.5 release hardening screens) are built `code-only` from patterns already in `design-handoff/`.

Full workflow details for one-pass and full-Figma batches are in [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md).

## Priority Batches

### Batch A — Auth & Onboarding (Required by Week 19, consumed Week 21)
Critical path. Without these, Phase 2 cannot start.
1. Sign in
2. Sign up (email + phone)
3. Social sign in selector
4. Forgot password and reset
5. Email verification
6. Phone verification (OTP)
7. Client onboarding step screens (profile, preferences, notification consent, location, payment optional)
8. Account-merge/upgrade screen (guest → full account)
9. Error and empty states for all of the above
Components needed: input field (text, email, phone, password, OTP), primary/secondary/tertiary buttons, form-row, segmented control, stepper/progress indicator, banner.

### Batch B — Discover, Explore, Profile (Required by Week 20, consumed Week 22)
1. Authenticated home/landing
2. Discover feed (extends existing screen-home)
3. Explore search results
4. Filter sheet (location, service, price, rating, availability)
5. Salon profile (hero, services, staff, reviews summary, gallery, policies, book CTA)
6. Service detail
7. Staff member detail
8. Map view (optional, can defer to Week 28 if not ready)
Components needed: filter sheet, range slider, rating star group, gallery carousel, salon hero card, staff avatar list, sticky CTA bar.

### Batch C — Booking Flow (Required by Week 19 — Wave 1 start, consumed Week 23)
Highest-value batch. Booking is the core monetized path.
1. Service selection
2. Staff selection (Any/Specific)
3. Date picker
4. Time-slot picker
5. Booking review/summary
6. Policies and cancellation acknowledgement
7. Payment selection in-flow
8. Booking confirmation
9. Manage booking (reschedule, cancel, contact)
10. Guest booking variant
11. Post-booking upgrade prompt
Components needed: calendar grid, time-slot chip, summary row, sticky footer CTA, modal sheets.

### Batch D — Payments, Tipping, Receipts (Required by Week 22, consumed Week 24)
1. Saved payment methods list
2. Add payment method
3. Tipping screen (presets + custom)
4. Receipt screen
5. Booking history list and filters
6. Refund/dispute read-only view
Components needed: payment-method row, currency input, tip preset chip group, receipt line item.

### Batch E — Loyalty, Activities, Reviews (Required by Week 19 — Wave 1 start, consumed Week 25)
1. Loyalty landing (balance, tier, history)
2. Reward catalog and redemption flow
3. Activity/challenge list and detail
4. Claim activity reward
5. Review prompt (rating + photo + text)
6. Review detail
7. Referral landing
Components needed: progress ring, tier badge, reward card, rating selector, photo upload tile.

### Batch F — Messaging, Notifications, Waitlist (Required by Week 24, consumed Week 26)
1. Inbox list
2. Thread view (with attachments, quick replies)
3. Compose/new message
4. Notification center
5. Notification preferences
6. Waitlist join sheet
7. Waitlist position screen
Components needed: chat bubble, attachment tile, quick-reply chip, notification row, preference toggle row.

### Batch G — Salon-Staff App Shell + AI (Required by Week 25 — Wave 2 start, consumed Week 27)
1. Staff today view
2. Staff calendar (day/week)
3. Walk-in / queue management
4. Client lookup and detail
5. Client notes and history
6. AI chat panel (client and staff)
7. AI suggestion card patterns (scheduling, retention, content)
8. AI budget warning/protection/exhausted banners
Components needed: calendar grid (staff variant), queue card, client header, AI suggestion card, AI chat composer.

### Batch H — Marketplace Consumer Extensions (Required by Week 25 — Wave 2 start, consumed Week 28)
Beyond Week 17 v1.
1. Marketplace post detail
2. Save / collection screens
3. Share sheet variants
4. "Book this look" deep-link landing
Components needed: post card, save toggle, share-target row.

### Batch I — Legal, Lifecycle, Settings Depth, Auth Edge Cases (Required by Week 27, consumed Week 29)
1. Terms of Service, Privacy Policy, Cookie consent, About, Open-source licenses
2. Marketing consent management
3. GDPR data export request, status, download
4. Account deletion (request, cooldown, confirmation)
5. Age / region gate (if in scope)
6. Edit profile (avatar, display name, bio)
7. Change email, change phone, change password (each with verification)
8. Connected accounts and calendar sync (Google, Apple, Outlook)
9. Accessibility settings (text size, reduce motion), theme picker
10. Help / FAQ / contact support
11. Auth edge cases: account locked, MFA setup, MFA challenge, recovery codes, device management, sign out from all devices, re-auth prompt, magic link landing, SSO conflict
Components needed: legal-page layout, consent toggle list, deletion-confirmation modal, OTP input variants, device row.

### Batch J — Booking, Payments, Discovery, Reviews Edge Cases (Required by Week 28, consumed Week 30)
1. Slot conflict / taken mid-flow
2. Multi-service booking, recurring booking (if approved), booking on behalf of another
3. Deposit / partial payment, cancellation fee disclosure, reschedule fee disclosure, no-show acknowledgement
4. 3DS challenge, payment failed, retry / alternative method
5. Apple Pay and Google Pay sheets, local-method variants (if approved)
6. Pre-auth disclosure, split payment, gift card, promo code, wallet top-up (if approved)
7. Refund and dispute display
8. Recent searches, saved searches, search suggestions / autocomplete, no-results, sort menu
9. Near-me / location permission, map view, cluster, pin detail
10. Salon hours and holidays, directions, share salon, report salon, block salon
11. Reviews: filters, sort, helpful/unhelpful, salon reply, edit/delete my review, photo lightbox, review guidelines
Components needed: 3DS overlay, payment-method-row variants, conflict-recovery modal, map cluster, search-suggestion row, helpful/unhelpful chip.

### Batch K — AI, Messaging, Notifications, Loyalty, Marketplace, Staff Extras (Required by Week 29, consumed Week 31)
1. AI consent / first-run explainer, feedback thumbs up/down, explainability sheet, AI history, AI degraded state, AI opt-out
2. Messaging: block user, report message, mute thread, archive thread, search within messages, read receipts, typing indicator, delivery-failure retry, group threads (if approved)
3. Notifications: per-channel prefs (push, email, SMS), quiet hours, permission-denied recovery, in-app banner pattern
4. Loyalty: tier-up celebration, reward-redemption confirmation, points-expiry warning, loyalty terms
5. Marketplace: follow/unfollow, hashtag landing, trending feed, block author, report post, comments (if approved)
6. Staff app: location switcher, time-off request, availability override, payout / earnings, walk-in capture, daily close report, staff onboarding
Components needed: AI feedback bar, explainability sheet, channel-preference matrix, tier-up celebration screen, follow toggle, walk-in form.

### Batch L — Cross-Cutting Platform, i18n, Store Readiness (Required by Week 43 — Wave 4 start, delivered by Week 45, consumed Phase 3.5)
1. App update required / force-update gate
2. Maintenance mode
3. Offline state and offline-aware list/detail patterns
4. Server-error fallback
5. Feature-flag-disabled state
6. Deep link cold-start landing, universal-link mismatch fallback
7. Permissions denied recovery (camera, photo, contacts, calendar, notification, location)
8. First-run tutorial / coach marks, what's new / release notes, rate-the-app prompt, invite friends share sheet
9. Language and locale picker, locale-formatted number/date/currency examples, translated legal screen variants
10. RTL layout examples (if approved)
11. Web responsive breakpoints (desktop, tablet) decisions illustrated
12. iOS Live Activities, Android widgets, App Clip / Instant App (if any approved)
13. Store assets: App Store and Play Store screenshots, preview video storyboards, marketing copy spec
Components needed: full-screen gate templates (force-update, maintenance, offline, error), permission recovery card, locale picker, RTL audit notes, store-screenshot frames.

## Phase 3 — Admin and Operator Batches
These batches feed Phase 3 (Weeks 33–44). They introduce admin-specific patterns: data tables, bulk action bars, master calendar, command palette, destructive-confirm modals, role-denied states.

### Batch M — Owner Home, Tenant Settings, Billing, Connect, Payouts (Required by Week 25 — Wave 2 start, delivered by Week 32, consumed Weeks 33–34)
1. Owner home / KPI dashboard
2. Operator notification center (booking/payment/payout/AI alerts)
3. Tenant settings shell (sectioned navigation)
4. Business profile, brand, tax, legal documents, domain settings
5. Owner notification preferences
6. Admin first-run / coach-mark patterns for the console
7. Subscription plan selection and change-plan flow
8. Invoice history with download
9. Admin payment method management
10. Cancel and pause subscription
11. Stripe Connect onboarding (admin)
12. Connect health, document submission, restricted-state recovery
13. Payout history, pending balance, schedule controls
14. Refund / dispute admin view
15. PDF/print layout specs for invoices, payout statements, refund receipts
16. Admin empty / loading / error / role-denied state patterns (used across all admin screens from W33 onward)
Components needed: data table v1, KPI tile, sectioned-settings layout, document upload tile, status-pill variants, plan card, invoice row, alert/notification row, coach-mark popover, role-denied empty state, print-page layout.

### Batch N — Locations, Staff, Service Catalog Depth (Required by Week 32, consumed Weeks 35–37)
1. Per-location dashboard, multi-location switcher and overview
2. Location settings (hours, holidays, contact, photos)
3. Per-location service overrides
4. Resource management (rooms, chairs, equipment)
5. Location walk-in / queue management (admin variant)
6. Daily close / cash report
7. Staff invite, role assignment, deactivate/reactivate
8. Schedule editor (templates, exceptions, time-off approvals)
9. Qualification / service-mapping editor
10. Commission and payout configuration
11. Per-staff performance metrics
12. Service category and tag management, bulk import/export, price lists
13. Add-ons and packages, seasonal availability rules
14. Service media manager, booking rules per service, visibility toggles
15. Bulk-action bar pattern v1 (multi-select, bulk action bar, confirmation modal)
Components needed: schedule grid editor, time-off approval row, qualification matrix, bulk import wizard, package builder, photo grid manager, multi-select checkbox row, bulk-action bar.

### Batch O — Booking Operations and Master Calendar (Required by Week 30 — Wave 3 start, delivered by Week 37, consumed Week 38)
Highest-complexity admin batch.
1. Master calendar (day/week/month, all staff, all rooms)
2. Drag-to-reschedule interaction spec
3. Booking detail admin view (timeline, audit, customer history)
4. Manual booking creation (phone-in / walk-in)
5. Block time / hold slot
6. Override / force-book confirmation with reason
7. No-show marking and policy enforcement
8. Cancellation handling with fee enforcement
9. Rebook / reschedule on behalf of client
10. Recurring booking management (if Phase 2 gate approved)
11. Slot-engine conflict resolution UI
Components needed: master calendar grid (multi-resource), drag-shadow + drop-target states, conflict resolution modal, force-book reason form, audit timeline row.

### Batch P — Client / CRM, Loyalty, Activities, Campaigns Admin (Required by Week 30 — Wave 3 start, delivered by Week 38, consumed Weeks 39–40)
1. Client list with filters and saved views
2. Client detail (history, preferences, loyalty, notes, allergies, gallery, consents)
3. Merge duplicate clients
4. Block / report client
5. Segmentation builder
6. Targeted send to segment
7. GDPR export per client and delete-per-request
8. Loyalty program config (earn rules, tiers, expiration, multipliers)
9. Reward catalog editor with media
10. Manual point adjustment with audit
11. Loyalty performance dashboard, tier migration tools
12. Activity / challenge catalog and rules editor, participation analytics
13. Campaign list, create, schedule, audience picker
14. Multi-channel template editor (push, email, SMS, in-app)
15. A/B variant configuration, send-time controls
16. AI-generated content approval workflow
17. Pre-send compliance checklist
18. Campaign performance dashboard
19. Transactional message template editor (booking confirmation, reminder, no-show, cancellation, receipt, password reset)
20. Promotions / discount codes admin (create, rules, redemption tracking)
Components needed: filter/segment builder, merge-conflict resolver, multi-channel template editor, A/B variant card, approval-queue row, channel preview tile, transactional-template variable picker, discount code rule editor.

### Batch Q — Reviews, Messaging, Waitlist Admin (Required by Week 35, consumed Week 41)
1. Review queue with bulk actions
2. Owner reply composer with templates
3. Flag / dispute / hide with audit
4. Review request automation rules
5. Reputation summary dashboard
6. Inbox triage view across staff
7. Thread assignment
8. Canned replies / templates
9. Operating-hours auto-reply configuration
10. Block / report client from inbox
11. Message archive and search
12. Waitlist list with priority
13. Convert waitlist to booking
14. Waitlist policies
Components needed: bulk-action bar, assignment picker, canned-reply editor, auto-reply schedule editor, waitlist priority drag list.

### Batch R — Analytics, Reporting, Exports, AI Admin, Marketplace Tenant Tools (Required by Week 30 — Wave 3 start, delivered by Week 41, consumed Weeks 42–43)
1. Revenue dashboard
2. Booking funnel, staff productivity, service performance
3. Client retention / cohort analysis
4. Marketplace attribution dashboard
5. Custom report builder (decision-gated)
6. Scheduled report email
7. Export with RBAC controls
8. Operator-scoped audit log explorer (tenant-scoped, distinct from platform-wide audit)
9. AI feature toggles per tenant
10. Role-aware AI budget config
11. AI suggestion review queue
12. Approve / reject AI campaign queue
13. AI usage analytics, safety incident log
14. Broader AI audit log explorer
15. Marketplace post composer (tenant)
16. Per-post performance
17. Anti-client-theft compliance dashboard
18. PDF/print specs for daily close, scheduled reports, GDPR export packages
Components needed: chart cards (line, bar, funnel, cohort), date-range picker, report builder canvas, AI suggestion-review row, post composer, audit-log filter bar, audit-log row, print-report layout.

### Batch S — Platform Super-Admin and Cross-Cutting Admin (Required by Week 37, consumed Week 44)
1. Tenant directory and detail
2. Suspend / reactivate tenant
3. Impersonation flow with audit and duration cap
4. Cross-tenant analytics
5. Platform health dashboard
6. Pricing and plan management
7. Feature flag console
8. Platform-wide audit log explorer
9. Cross-tenant marketplace moderation
10. Cross-tenant AI budget overrides
11. Migration runner UI
12. Backup / restore status
13. Support inbox / ticketing surface (vendor embed if gated)
14. Audit log explorer (general)
15. Security events dashboard
16. Data-export-request dashboard
17. Consent and policy version log
18. Incident response status surface
19. Admin sign-in and 2FA enforcement
20. Admin device management
21. Role-denied / permission-required states
22. Bulk-action confirmation pattern
23. Destructive-action confirmation with reason
24. Command palette
25. "View as client" preview mode
Components needed: impersonation banner, feature-flag toggle row, migration-runner step view, command palette overlay, role-denied empty state, destructive confirm with reason field.

## Missing Cross-Cutting Items (apply to all batches)
Request these once, applied everywhere:
1. Empty, loading, and error states for every screen (per the playbook).
2. Skeleton loader patterns for list, detail, and form layouts.
3. Snackbar/toast component with success/info/warning/error variants.
4. Modal and bottom-sheet presentation rules.
5. Tab bar with notification badges.
6. Header patterns: large title, compact, modal-close.
7. Pull-to-refresh and infinite-scroll patterns.
8. Permission-prompt patterns (camera, photo, notification, location).
9. Dark mode coverage decision (in scope or deferred).
10. Tablet/web breakpoint behavior decision.

## How to Request a Batch
Use this exact message format in Figma AI:

```text
Please prepare Phase 2 Batch [LETTER] handoff package for Zarkili React Native Expo app.
Scope: [list screens 1..N from this document, copy verbatim].
Reuse existing tokens and components from prior Zarkili handoff. Do not duplicate.
Deliverable structure and quality bar: follow the strict contract in our Design-to-Dev Handoff Contract.
Output: one ZIP with assets, tokens (only deltas), components (only deltas), specs, strings, manifest.
Acceptance checklist: 17-point checklist from FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md Phase 3.
```

## Acceptance Workflow
For every batch:
1. Run the 17-point checklist from [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md) Phase 3.
2. PASS → proceed to ingestion (Phase 6 in the playbook).
3. CONDITIONAL PASS → ingest while design fixes minor polish in parallel.
4. FAIL → request regeneration using Phase 4 message; do not start engineering on failed items.

## Tracking
Each batch is tracked as a card in [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md) with prefix `[DESIGN-BATCH-A]` … `[DESIGN-BATCH-S]`. Move through Backlog → Ready → In Progress (with design team) → Review and QA (acceptance checklist) → Done.

## Cross-References
- Phase 2 plan: [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_28.md)
- Phase 3 plan: [PHASE3_ADMIN_UI_PLAN_WEEKS_33_TO_44.md](PHASE3_ADMIN_UI_PLAN_WEEKS_33_TO_44.md)
- Handoff playbook: [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md)
- Tokens and existing components: `design-handoff/`
- Admin UI interim rules: [new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md](new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md)
