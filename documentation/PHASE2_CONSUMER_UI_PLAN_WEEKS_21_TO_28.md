# Phase 2 — Consumer UI Build (Weeks 21–32)

## Why This Plan Exists
Weeks 1–12 delivered the multi-tenant backend and pilot hardening. Weeks 13–20 add monetization, onboarding orchestration, marketplace v1, and AI assistance. None of those windows include a dedicated build-out of the full consumer (client) UI from Figma to wired-up screens.

This document closes that gap. It defines a 12-week Phase 2 that turns the existing services, repositories, and scaffolds into a complete, production-quality client and salon-staff application.

Phase 2 is split into two sub-phases:
- **Phase 2.0 — Core UI build (Weeks 21–28)**: every primary user flow shipped end-to-end.
- **Phase 2.1 — Completeness, edge cases, and platform polish (Weeks 29–32)**: legal/lifecycle, booking and payments edge cases, AI/messaging/notification extras, cross-cutting platform behavior, internationalization, store-readiness.

## Assumptions
- Phase 2 starts the week after Week 20 closes (target start: 2026-09-07; re-baseline at sprint review).
- Weekly sprint cadence, same governance as Phase 1.
- Design team supplies missing Figma screens on the priority schedule defined in [FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md](FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md).
- Stack remains React Native + Expo + Firebase; no architecture changes.
- All Phase 2 work uses existing domain services. New backend endpoints or fields are introduced only when a UX flow exposes a missing API and they are tracked as Phase 2 backend deltas.
- Internationalization scope, dark-mode scope, and tablet/web breakpoints are decided no later than Week 22 sprint review.

## Entry Conditions (must be true before Week 21 starts)
1. Week 20 close report signed off; pilot in steady state.
2. Figma packages for Weeks 21–22 priority screens accepted via [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md) Phase 3 checklist.
3. Theme layer integrated from existing tokens in `design-handoff/tokens/`.
4. No P0/P1 defects open against Phase 1 backend domains.

## Exit Conditions (Definition of Done for Phase 2)
1. Every domain listed in Section "Domain Coverage" has a complete client-facing UI wired to real services.
2. Web and native parity validated via `npm run test:smoke:web` and `npm run test:smoke:native`.
3. Accessibility checks pass per [design-handoff/ACCESSIBILITY_GUIDE.md](../design-handoff/ACCESSIBILITY_GUIDE.md).
4. Visual QA signed off against the corresponding Figma frame for each screen.
5. Test coverage for new UI: render tests, interaction tests, and at least one happy-path E2E per major flow.
6. No regressions in Phase 1 test suite (1226+ tests, 0 failures).

## Domain Coverage
The following domains are in scope for Phase 2. Every item must end the phase with production UI, not scaffold.

1. Authentication and account (incl. MFA, device management, re-auth)
2. Client onboarding (post-Week 16 surfaces)
3. Discover and Explore (consumer feed, search, map, near-me)
4. Salon profile and service detail (incl. hours, directions, share, report)
5. Booking flow with edge cases (slot conflict, group, recurring, deposit, no-show, fees)
6. Payments and checkout (Stripe, 3DS, Apple/Google Pay, promo, gift cards, refunds)
7. Loyalty, rewards, activities, referrals
8. Reviews and ratings (write, read, sort, helpful, salon reply)
9. Messaging (incl. block, mute, archive, search, delivery retry)
10. Notifications (channel prefs, quiet hours, in-app banner, denial recovery)
11. Waitlist
12. AI assistant client and staff surfaces (incl. consent, feedback, explainability)
13. Salon-staff app shell (today, calendar, queue, client lookup, time-off, earnings)
14. Settings, profile, preferences (email/phone change, password, calendar sync, accessibility)
15. Legal and lifecycle (ToS, privacy, GDPR export, account deletion, consent)
16. Marketplace consumer surfaces beyond Week 17 v1 (post detail, save, share, follow, hashtag, comments)
17. Cross-cutting platform (offline, force-update, maintenance, deep links, permissions, error fallbacks)
18. Internationalization (language picker, locale formats, RTL decision)
19. Store readiness (store listing, screenshots, what's new, rate-the-app, release notes)

## Week-by-Week Plan

### Week 21 — Auth, Onboarding, Account Foundations
Build the front door of the app.
- Welcome, sign in, sign up, social sign in surfaces.
- Forgot password, email verification, phone verification flows.
- Client onboarding screens wired to the orchestration layer from Week 16.
- Profile setup, preferences, notification consent.
- **US-primary (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)):** COPPA age affirmation at registration; if a service recipient is under 13, require parental-consent affirmation by the booking adult; do not create separate child accounts.
- Settings shell with placeholder sections wired to existing settings services.

### Week 22 — Discover, Explore, Salon Profile
Make the app feel like an app.
- Home/landing surface for authenticated and guest users.
- Discover feed with category pills (assets exist) and featured salons (backend exists).
- Explore search with filters: location, service, price, rating, availability.
- Salon profile screen: gallery, services, staff, reviews summary, booking CTA.
- Service detail screen with pricing, duration, staff qualified to perform it.

### Week 23 — Booking Flow End-to-End
The most important consumer path.
- Service selection → staff selection → date/time selection (slot engine wired).
- Booking review screen with summary, policies, cancellation rules.
- Payment step using Stripe SDK (Week 13 backend in place).
- Confirmation screen with calendar add and share booking.
- Manage booking: reschedule, cancel, contact salon.
- Guest booking variant + post-booking upgrade prompt (Week 16 orchestration).

### Week 24 — Payments, Tipping, Receipts
- Saved payment methods management.
- Tipping screen with presets and custom amount.
- Receipt and booking history.
- Refund and dispute display surfaces (read-only, admin-driven).
- Past bookings list with filters and rebook CTA.

### Week 25 — Loyalty, Activities, Reviews
- Loyalty program landing, point balance, tier, redemption catalog.
- Activity/challenge surfaces (Week 8 backend) — list, detail, claim.
- Post-booking review prompt with rating, photo, written review.
- Read review feeds on salon profile.
- Referral surfaces.

### Week 26 — Messaging, Notifications, Waitlist
- Threaded messaging inbox (client ↔ salon).
- Per-thread message view with attachments and quick replies.
- Notification center with read/unread, deep links, preference controls.
- Waitlist join, position display, accept/decline surfaces.
- Push notification handlers for booking, message, loyalty, marketing.
- **US-primary (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)):**
  - **TCPA (US SMS)**: explicit prior consent capture before SMS reminders; STOP / HELP keyword handling and end-to-end opt-out; quiet-hours enforced per US time zone.
  - **CAN-SPAM (US email)**: sender identity, physical address in footer, one-click unsubscribe verified across SES/SendGrid templates.
  - EU equivalence covered by GDPR consent (W29).

### Week 27 — Salon-Staff App Shell + AI Surfaces
Staff-facing client UI that operators run their day from.
- Today view: queue, upcoming, walk-ins, messages.
- Calendar with drag/reschedule (respects schedule templates).
- Client lookup with history, notes, loyalty status.
- Staff messaging surfaces.
- AI assistant surfaces in client and staff app: chat panel, suggested actions, retention insights, content generator. All with budget guard banners (Week 19 policy).

### Week 28 — Phase 2.0 Polish, Performance, Visual QA
Close-out of the core build. No new flows; refinement only.
- Animations, transitions, and micro-interactions per [design-handoff/specs/interactions.json](../design-handoff/specs/interactions.json).
- Empty/loading/error states across every screen built in Weeks 21–27.
- Skeleton loaders and optimistic updates for booking, messaging, loyalty.
- Performance pass: list virtualization, image caching, bundle size, cold-start budget.
- Visual QA pass against Figma for every screen produced in Weeks 21–27.
- Accessibility audit (WCAG AA) and remediation for Phase 2.0 screens.
- Phase 2.0 close report and entry-gate review for Phase 2.1.

---

## Phase 2.1 — Completeness, Edge Cases, Platform Polish (Weeks 29–32)
Goal: take the app from "feature-complete v1" to "store-shippable, edge-case safe, internationalized." Every screen below has been called out as a known gap during Phase 2.0 review and is in scope for Phase 2.1.

### Week 29 — Legal, Lifecycle, Account Hygiene, Settings Depth
Non-deferrable for store submission and GDPR.
- Legal screens: Terms of Service, Privacy Policy, Cookie consent, Open-source licenses, About (version/build/attribution).
- Marketing consent management (granular per channel and topic).
- GDPR data export request, status, and download.
- Account deletion flow (request, cooldown, confirmation, audit).
- Age gate / region gate (decision: in or out; if in, implement).
- **US-primary (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)):**
  - **CCPA / CPRA (California)**: "Do Not Sell or Share My Personal Information" toggle, right-to-know, right-to-delete, opt-out preference signal (GPC) handling.
  - **VCDPA (Virginia), CPA (Colorado), CTDPA (Connecticut), UCPA (Utah)**: privacy notices and reuse of CCPA right-to-delete plumbing.
  - **ADA + WCAG 2.1 AA**: accessibility statement explicitly cites both; covers `SupportChatScreen` (Phase 3.5 W48) and `AdminSupportQueueScreen`.
- Settings depth: edit profile (avatar, display name, bio), change email, change phone, change password (each with verification), connected accounts, calendar sync (Google/Apple/Outlook), accessibility settings (text size, reduce motion), theme picker (if dark mode in scope), help/FAQ, contact support.
- Auth edge cases: account locked, MFA setup/challenge/recovery codes, device management, sign out from all devices, re-authentication prompt, magic link landing, SSO conflict.

### Week 30 — Booking, Payments, and Discovery Edge Cases
Focus on revenue-path resilience.
- Booking edge cases: slot taken mid-flow, conflict resolution, multi-service in one booking, recurring bookings (decision gate), booking on behalf of another person, deposit / partial payment, no-show acknowledgement, cancellation fee disclosure, reschedule fee disclosure.
- Payments edge cases: 3DS challenge, payment failed and retry, Apple Pay and Google Pay sheets, SEPA / local-method variants (decision gate), pre-authorization / hold disclosure, split payment, gift card and promo code entry and redemption, wallet top-up (if in scope), refund and dispute display.
- Discovery and salon profile depth: recent and saved searches, search suggestions / autocomplete, no-results state, sort menu, near-me / location permission flow, map view with cluster and pin detail, salon hours and holiday view, directions, share salon, report salon, block salon.
- Reviews depth: filters and sort, helpful/unhelpful voting, salon owner reply display, edit/delete my review, review guidelines, photo lightbox.

### Week 31 — AI, Messaging, Notifications, Loyalty, Marketplace Extras
- AI surfaces: AI consent / first-run explainer, feedback thumbs up/down, "Why did I get this?" explainability sheet, AI history / past conversations, AI degraded-state empty view, opt-out from AI features.
- Messaging extras: block user, report message, mute thread, archive thread, search within messages, read-receipt toggle, typing indicator, delivery-failure retry, group/multi-party threads (decision gate).
- Notifications extras: per-channel preferences (push, email, SMS), quiet hours, permission-denied recovery, in-app banner pattern.
- Loyalty extras: tier-up celebration, reward-redemption confirmation, points-expiry warning, loyalty terms and rules.
- Marketplace extras: follow / unfollow salon, hashtag / tag landing, trending feed, block author, report post, comments (decision gate).
- Staff app extras: location switcher, time-off request, availability override, payout / earnings view, walk-in capture, daily close report, staff onboarding screens.

### Week 32 — Cross-Cutting Platform, i18n, Store Readiness, Release
Last week before launch. No new product surface; readiness only.
- Cross-cutting: app update required / force-update gate, maintenance mode, offline state with offline-aware caches, server-error fallback, feature-flag-disabled state, deep link landing (cold start), universal-link mismatch fallback, permissions denied recovery for camera/photo/contacts/calendar/notification/location.
- First-run tutorial / coach marks, what's new / release notes, rate-the-app prompt, invite friends / referral share sheet.
- Internationalization: language and locale picker, language-switch mid-session behavior, localized currency/date/time formats, translated legal screens, RTL layout (decision: in or out; if in, implement).
- **US-primary defaults (per [US_PRIMARY_MARKET_ADDENDUM.md](US_PRIMARY_MARKET_ADDENDUM.md)):** default locale **en-US** with currency USD, dates `MM/DD/YYYY`, time 12-hour AM/PM. Secondary locales (en-GB, de-DE, hr-HR) ship with EUR and `DD/MM/YYYY` 24-hour. DST-transition tests for all 4 contiguous US time zones plus AK and HI in the booking engine.
- Platform-specific decisions executed: web responsive breakpoints (desktop, tablet), iOS Live Activities (decision gate), Android widgets (decision gate), App Clip / Instant App (decision gate).
- Store readiness: store listings (App Store, Play Store), screenshots, preview videos, marketing copy, privacy nutrition labels, data-safety form, age rating questionnaire.
- Final accessibility audit across Phase 2.1 screens.
- Phase 2.1 close report. **Public release candidate**.

---

## Decision Gates
Phase 2 contains explicit decision gates that must be answered before the relevant week starts. Defaults shown in brackets if no decision is recorded by the gate date.

| Gate | Decide by | Default if undecided |
|------|-----------|----------------------|
| Dark mode in scope? | End of Week 22 | No |
| Tablet/web breakpoints in scope? | End of Week 22 | Web responsive only, no tablet-specific layouts |
| Map view in Discover? | End of Week 22 | Yes (basic map + list toggle) |
| Recurring bookings? | End of Week 29 | No (post-launch) |
| Group / multi-service bookings? | End of Week 29 | No (post-launch) |
| Comments on marketplace posts? | End of Week 30 | No (post-launch) |
| Group messaging threads? | End of Week 30 | No (post-launch) |
| RTL languages? | End of Week 31 | No (post-launch) |
| iOS Live Activities? | End of Week 31 | No |
| Android widgets? | End of Week 31 | No |
| App Clip / Instant App? | End of Week 31 | No |
| Tenant owner mobile dashboard? | End of Week 22 | Web-only owner dashboard, mobile read-only |

## Parallel Streams (run alongside Weeks 21–32)
- **Design supply**: design team works two weeks ahead per the Figma priority list.
- **Continuous QA**: visual regression baseline grown weekly.
- **Docs**: per-screen implementation notes appended to `documentation/new-platform/` per existing convention.
- **Security**: rules deltas for any new client-readable surfaces.
- **Performance**: weekly bundle size and cold-start budget check.
- **Localization**: translation pipeline established by Week 22; strings extracted weekly.

## Acceptance Gate Per Week
Each weekly close must produce:
1. A Week-N close report under `documentation/new-platform/PHASE2_WEEKN_CLOSE_REPORT.md`.
2. Test deltas: total count, suites added, smoke gates green on web and native.
3. Visual QA evidence (screenshots) attached for every new screen.
4. Updated tracking board (cards moved to Done with date and owner).
5. Updated [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md) and any affected new-platform docs.

## Risk Register
| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| Figma screens deliver late or partial | High | High | Two-week buffer in design supply; fall back to [ADMIN_UI_INTERPRETATION_GUIDELINES.md](new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md) pattern for non-blocking screens |
| Booking flow scope creep (Week 23) | High | Medium | Lock scope at sprint start; defer non-essential variants to Week 30 edge-case window |
| Accessibility debt accumulates | Medium | High | Per-screen a11y check before "done"; reject screens that skip it; final audit Week 32 |
| Native vs web parity drift | Medium | Medium | Smoke gates required to merge; weekly parity audit |
| Test suite slowdown from UI tests | Low | High | Use shallow render for atoms; reserve E2E for happy paths |
| Localization pipeline not ready by Week 32 | High | Medium | Stand up translation pipeline in Week 22; extract strings weekly; do not back-load |
| Store submission rejection (privacy, data safety, payment policy) | High | Medium | Compile privacy/data-safety inputs continuously from Week 29; pre-submit dry run mid-Week 32 |
| Decision gates left unresolved | Medium | Medium | Owner must answer each gate by its decide-by date; defaults apply automatically otherwise |

## Trello Code Convention
Phase 2 cards extend the existing prefix scheme:
- `[W21-UI-001]` Welcome screen implementation
- `[W23-UI-014]` Booking review screen wiring
- `[W27-UI-031]` Staff today view
- `[W29-LEG-002]` Account deletion flow
- `[W32-I18N-004]` Language picker

New category codes: `UI` (Frontend UI build), `LEG` (Legal/lifecycle), `I18N` (Internationalization), `DSGN` (Design supply / Figma batch).

## Re-Baseline Triggers
Re-baseline the plan if any of these occur:
1. Week 20 slips by more than one sprint.
2. Three or more priority Figma packages miss their delivery date.
3. A booking-flow blocker appears in pilot data that changes scope.
4. Stakeholder requests a major scope addition (e.g. white-label, second tenant vertical).

## Cross-References
- Master Index: [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md)
- Gantt: [PROJECT_GANTT_AGILE_PLAN.md](PROJECT_GANTT_AGILE_PLAN.md)
- Tracking board: [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md)
- Design supply: [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md)
- Screen request list: [FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md](FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md)
- Admin UI fallback rules: [new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md](new-platform/ADMIN_UI_INTERPRETATION_GUIDELINES.md)
