# Multi-Tenant Build Prompts for Weeks 5-8

## How to Use This Document
- Copy one prompt block at a time into Copilot Chat in VS Code.
- Execute tasks in sequence.
- Run the review prompt after each build prompt.
- Keep PR scope small (one task per PR is ideal).

Assumptions:
- Copilot is implementation developer
- You are prompt engineer + reviewer
- Stack is React Native + Expo + Firebase

---

## Week 5 - Booking Lifecycle v1

## Task 5.1 - Booking Domain State Machine
Prompt:
Implement booking lifecycle state machine in the new multi-tenant architecture.
Requirements:
1. Add status enum: pending, confirmed, completed, cancelled, rejected, no_show, reschedule_pending, reschedule_rejected, rescheduled.
2. Add transition guard utility with explicit allowed transitions.
3. Include actor-based authorization checks (client, tenant_admin, location_manager, technician).
4. Reject invalid transitions with structured error codes.
5. Add unit tests for positive and negative transitions.
Return:
- files changed
- transition matrix implemented
- tests added

Review prompt:
Review booking state machine for invalid transition gaps, role bypass risks, and missing edge cases.

## Task 5.2 - Booking Repository and Write Operations
Prompt:
Implement booking repository write methods with tenant/location/staff/customer scoping.
Requirements:
1. Add methods: createBooking, confirmBooking, rejectBooking, cancelBooking, markCompleted, markNoShow.
2. Enforce tenantId, locationId, staffId, customerId on persisted documents.
3. Add optimistic locking or version strategy to avoid stale writes.
4. Add audit trail fields in lifecycle metadata.
5. Add tests for scope validation and unauthorized writes.
Return:
- files changed
- repository API
- test summary

Review prompt:
Review booking repository for data integrity, stale-write handling, and audit completeness.

## Task 5.3 - Client Booking UI v1
Prompt:
Implement client booking flow UI for multi-tenant context.
Requirements:
1. Client chooses location, service, technician, date, time in this order.
2. Show slot list from Week 4 engine.
3. Handle slot unavailability gracefully with retry option.
4. Persist booking with status pending by default unless admin-booked policy says otherwise.
5. Add smoke tests for core interaction flow.
Return:
- files changed
- navigation and state flow
- test output

Review prompt:
Review booking UI for failure-state UX and mismatch risk with backend constraints.

## Task 5.4 - Admin Booking Queue UI
Prompt:
Implement admin booking queue for pending and reschedule requests.
Requirements:
1. Separate tabs for pending, reschedule_pending, and unresolved exceptions.
2. Actions: confirm/reject/cancel with reason capture.
3. Show location/staff/customer context in each card.
4. Add filtering by location and date.
5. Add smoke tests for action buttons and status updates.
Return:
- files changed
- queue behavior summary

Review prompt:
Review admin queue implementation for operational usability and accidental action risks.

---

## Week 5.5 - Multi-Salon Home Dashboard and Context Switcher (NEW)

## Task 5.5.1 - Multi-Salon Dashboard Screen

Prompt:
Implement user home dashboard screen showing all subscribed salons with unread message badges.
Requirements:
1. After login, users land on dashboard (if subscribed to 1+ salons) instead of direct app entry.
2. Display salon cards with: logo, name, next upcoming appointment date/time, unread message count badge, quick action buttons.
3. Unread count aggregates from userTenantAccess.unreadMessageCount for each salon.
4. Quick action buttons: "Book", "Messages", "Loyalty", "Profile" → each deep-links into that salon context.
5. Empty state: if user has no salon subscriptions, show marketplace discovery CTA.
6. Error state: if unread count query fails, show "?" badge with retry.
7. Add tests for badge aggregation and nav deep-links.
Return:
- files changed
- dashboard UI structure
- nav deep-link tests

Review prompt:
Review multi-salon dashboard for UI clarity, badge accuracy, and deep-link reliability. Identify any tenant context leakage.

## Task 5.5.2 - Unread Message Aggregation Service

Prompt:
Implement service to aggregate unread message counts across all user's tenant subscriptions.
Requirements:
1. Query userTenantAccess WHERE userId = currentUser AND subscriptionStatus = 'active', SELECT unreadMessageCount, tenantId.
2. Create aggregation utility that sums across tenants and returns by-tenant breakdown.
3. Add real-time listener that updates dashboard when unread counts change in any tenant.
4. Ensure counts stay in sync: every message write in messages collection must update userTenantAccess.unreadMessageCount.
5. Add integration tests with multiple tenant scenarios.
Return:
- files changed
- aggregation service API
- sync test coverage

Review prompt:
Review unread aggregation for accuracy, real-time responsiveness, and sync reliability between messages and userTenantAccess.

## Task 5.5.3 - Context Switcher and Navigation Logic

Prompt:
Implement context switching between salon contexts from dashboard.
Requirements:
1. Tapping a salon card → sets selectedTenantId in app context, updates all queries to filter by that tenant.
2. Single login session persists across multiple tenant contexts (no re-authentication on switch).
3. Deep-link support: URL like /salon/{tenantId}/messages should auto-select that tenant and navigate there.
4. Add back-nav to return to dashboard from within any salon context (accessible from header/tab bar).
5. Verify no data leakage: confirm customer sees ONLY their salon's data when in that context.
6. Add tests for context isolation and deep-link routing.
Return:
- files changed
- context-switch flow summary
- isolation test results

Review prompt:
Review context switching for auth/session integrity, tenant data isolation, and navigation edge cases (deep links, back nav, etc.).

---

## Week 6 - Backend Automations and Notification Pipeline

## Task 6.1 - Notification Event Contract
Prompt:
Design and implement notification event contract for booking and messaging lifecycle.
Requirements:
1. Define event payload schema for booking_created, booking_confirmed, booking_rejected, booking_cancelled, booking_rescheduled, reminder_due.
2. Include tenantId, locationId, recipient IDs, and localization context.
3. Add schema validator before event dispatch.
4. Document event catalog in Documentation/new-platform/NOTIFICATION_EVENTS.md.
5. Add tests for payload validation.
Return:
- files changed
- event schema summary

Review prompt:
Review event contract for missing context, tenant leakage risk, and localization gaps.

## Task 6.2 - Cloud Function Triggers for Booking Updates
Prompt:
Implement Cloud Functions trigger handlers for booking lifecycle events.
Requirements:
1. On booking update, emit notifications based on status transition.
2. Ensure idempotency using event keys and processed markers.
3. Add retry-safe behavior and structured logging.
4. Keep all notifications tenant-branded via tenant settings.
5. Add integration tests with mock event payloads.
Return:
- files changed
- idempotency strategy
- test summary

Review prompt:
Review trigger handlers for duplicate sends, race behavior, and error recovery gaps.

## Task 6.3 - Scheduled Reminder Service
Prompt:
Implement scheduled reminder service for upcoming appointments.
Requirements:
1. Daily job scans confirmed bookings in reminder window.
2. Respect tenant timezone and user opt-in preferences.
3. Support multiple channels: in_app, email, push.
4. Store send logs with tenant scope and status.
5. Add tests for timezone windows and opt-out behavior.
Return:
- files changed
- scheduling logic summary

Review prompt:
Review reminder service for timezone correctness, delivery duplication, and scalability risks.

## Task 6.4 - Notification Preferences and Templates
Prompt:
Implement tenant-level and customer-level notification preferences + templates.
Requirements:
1. Add tenant template defaults by event type.
2. Add customer channel preferences and language selection.
3. Runtime template rendering should include safe fallback values.
4. Add template preview endpoint/tool for admin QA.
5. Add unit tests for rendering and fallback behavior.
Return:
- files changed
- preference model summary

Review prompt:
Review template rendering and preference resolution logic for missing fallback or unsafe interpolation.

---

## Week 7 - Messaging and Waitlist

## Task 7.1 - Messaging Domain v1
Prompt:
Implement tenant-scoped messaging domain with attachments and unread aggregation support for multi-salon dashboard.
Requirements:
1. Add message repository with methods: sendMessage, listThreadMessages, markRead, listUnreadCounts.
2. Enforce sender/receiver tenant match.
3. Add attachment metadata model (name, size, type, url).
4. **CRITICAL for Dashboard (Week 5.5)**: On every message write, update userTenantAccess.unreadMessageCount for the receiver's tenant.
   - When new message sent to user in this tenant: increment userTenantAccess[userId_tenantId].unreadMessageCount
   - When user reads message in this tenant: decrement userTenantAccess[userId_tenantId].unreadMessageCount
   - Provide method: updateTenantUnreadCount(userId, tenantId, delta) for easy aggregation updates
5. Add tests for access control, unread counters, and userTenantAccess sync accuracy.
6. Add docs in Documentation/new-platform/MESSAGING.md.
Return:
- files changed
- API summary
- userTenantAccess sync test coverage

Review prompt:
Review messaging domain for thread consistency, attachment safety, read-state accuracy, and userTenantAccess synchronization. Identify any message writes that don't update unread badges.

## Task 7.2 - Admin Messaging Console v1
Prompt:
Implement admin messaging console with bulk messaging support.
Requirements:
1. Add client search/filter by location and activity status.
2. Add one-to-one messaging and bulk send to selected customer IDs.
3. Add attachment upload support with size/type validation.
4. Add send preview and confirmation for bulk operations.
5. Add smoke tests for send flows.
Return:
- files changed
- major UI interactions

Review prompt:
Review admin messaging console for accidental bulk-send risks and missing confirmation safeguards.

## Task 7.3 - Waitlist Domain v1
Prompt:
Implement waitlist domain with matching logic.
Requirements:
1. Waitlist fields: tenantId, locationId, customerId, serviceIds, optional staffId, date range, status.
2. Add methods: joinWaitlist, leaveWaitlist, listWaitlistByLocation, findMatchingWaitlistEntries.
3. Add matching algorithm for newly opened slots.
4. Auto-deactivate waitlist entry when customer books matching slot.
5. Add tests for matching and auto-deactivation.
Return:
- files changed
- matching rules summary

Review prompt:
Review waitlist logic for fairness and over-notification risks.

## Task 7.4 - Waitlist Notification Automation
Prompt:
Implement waitlist automation triggered on slot-open events.
Requirements:
1. Trigger matching when booking is cancelled/rescheduled or new availability block appears.
2. Notify all matching customers with first-come-first-served messaging.
3. Include throttling to prevent spam for repeated slot changes.
4. Record waitlist notification logs.
5. Add integration tests for open-slot -> notify pipeline.
Return:
- files changed
- throttling strategy

Review prompt:
Review waitlist automation for duplicate notification and missed-match scenarios.

---

## Week 8 - Loyalty and Referrals

## Task 8.1 - Loyalty Config and Ledger
Prompt:
Implement tenant-scoped loyalty config and transaction ledger.
Requirements:
1. Add tenant loyalty settings model: tiers, point rules, redemption options.
2. Add customer loyalty state fields and transaction collection.
3. Add methods: creditPoints, debitPoints, getBalance, listTransactions.
4. Ensure all entries contain tenantId and actor metadata.
5. Add tests for balance consistency.
Return:
- files changed
- ledger invariants

Review prompt:
Review loyalty ledger for accounting consistency and rollback safety.

## Task 8.2 - Loyalty Earning Rules Engine
Prompt:
Implement rules engine for loyalty earning events.
Requirements:
1. Rules: completed appointment, within-window rebook bonus, referral reward, social-share reward limit.
2. Add idempotency keys per reward event to prevent double crediting.
3. Support tenant custom point rule values.
4. Add tests for edge cases and duplicate events.
5. Document in Documentation/new-platform/LOYALTY_RULES.md.
Return:
- files changed
- rule evaluation flow

Review prompt:
Review earning rules for duplicate-credit risk and ambiguous precedence ordering.

## Task 8.3 - Referral Flow v1
Prompt:
Implement referral flow with tenant-scoped codes.
Requirements:
1. Generate stable referral codes per customer.
2. Support registration with referral code.
3. Credit reward when referral condition is met (e.g., first completed booking).
4. Prevent self-referral and repeated referral credits.
5. Add tests for abuse scenarios.
Return:
- files changed
- anti-abuse checks

Review prompt:
Review referral implementation for fraud vectors and race conditions.

## Task 8.4 - Admin + Client Loyalty UI v1
Prompt:
Implement loyalty UI v1 for admins and clients.
Requirements:
1. Client view: current tier, points, progress, transaction history.
2. Admin view: loyalty overview, per-client adjustments, redemption actions.
3. Add clear indicators for locked/unlocked rewards.
4. Add loading/empty/error states.
5. Add smoke tests for key screens.
Return:
- files changed
- screen-level behavior summary

Review prompt:
Review loyalty UI for transparency, trust signals, and admin misuse prevention.

## Task 8.5 - Salon Onboarding Wizard v1 (Implementation Start)
Prompt:
Implement salon onboarding wizard v1 with resumable step progression.
Requirements:
1. Build wizard steps: Account, Business Profile, Payment Setup (Connect status), Services, Staff, Policies, Availability, Marketplace Visibility, Verification.
2. Persist draft state per tenant and support resume across devices.
3. Add completion score and launch blockers list.
4. Enforce blockers for go-live: business profile, at least one service, availability configured.
5. Add smoke tests for step progression, skip/resume behavior, and blocker enforcement.
Return:
- files changed
- state model summary
- blocker rules summary

Review prompt:
Review salon onboarding wizard for abandonment risk, poor validation UX, and invalid launch-state paths.

## Task 8.6 - Client Onboarding Integration v1 (Guest + Full)
Prompt:
Implement integrated client onboarding entry from booking/discovery actions.
Requirements:
1. Preserve guest booking path (email + phone) and full account path (email/password or social).
2. Implement post-booking guest-upgrade flow to full account without losing booking/payment context.
3. Add optional onboarding modules: profile, payment method, preferences, notifications, loyalty enrollment.
4. Ensure all onboarding entry points route into one shared orchestration layer.
5. Add tests for guest-to-full conversion and data continuity.
Return:
- files changed
- orchestration flow summary
- conversion test results

Review prompt:
Review client onboarding integration for friction points, account-merge edge cases, and booking flow regressions.

---

## End-of-Week Security Prompt Pack (Run Weekly)
Prompt:
Audit all changes from this week for tenant isolation and authorization vulnerabilities.
Check:
1. Any write path missing tenantId
2. Any query missing tenant filter
3. Any admin operation without role check
4. Any cloud function missing caller validation
5. Any event payload missing tenant context
Return findings ordered by severity with exact file paths and remediation steps.

---

## End-of-Week Documentation Prompt Pack (Run Weekly)
Prompt:
Update Documentation/new-platform with this week's delivery summary.
Include:
1. Completed tasks
2. Files/modules changed
3. Test outcomes and coverage notes
4. Known issues and deferred items
5. Next week's prerequisites
Do not rewrite older summaries. Append only.

---

## Week-Close Acceptance Prompt
Prompt:
Generate a week-close report from repository state.
Include:
1. Planned vs delivered
2. Passing/failing tests and causes
3. Security and index changes
4. Outstanding technical debt
5. Go/No-go recommendation for next week
Return concise decision-oriented summary.

---

## Suggested Daily Rhythm
- Start day with one build prompt.
- Midday run matching review prompt.
- End day run security prompt on current diff.
- End week run documentation + week-close prompts.

This keeps Copilot output controlled and production-focused.
