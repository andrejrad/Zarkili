# Week 46 Close Report — Reviews / Reputation / Inbox / Waitlist Admin

**Date closed:** 2026-05-10
**Jest baseline at start of week:** 3245 tests / 169 suites (W45 close — all passing)
**Jest at close:** 3309 tests / 170 suites — all passing
**TypeScript:** `tsc --noEmit` clean

---

## 1. Scope

W46 delivered the **Reviews, Reputation, Messaging Inbox, and Waitlist** admin cluster (Phase 3 Batch T), per [PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md](../PHASE3_ADMIN_UI_PLAN_WEEKS_38_TO_49.md) §Week 46.

It also retired four carry-in adapter debts (W41-DEBT-3, W43-DEBT-1, W44-DEBT-1, W45-DEBT-1) by shipping real Firestore implementations alongside the new screens.

The program goal was:
- **Review queue** — list with filter chips (all / pending / replied / flagged / hidden), bulk hide/flag, row navigation
- **Owner reply composer** — canned-reply template picker, text input, publish flow with error/success states
- **Review flag / dispute / hide** — action chips, reason input, confirm submit
- **Review automation** — rule create form (label, rating filter, op, template), toggle active, delete
- **Reputation dashboard** — avg rating, total reviews, reply rate, pending count, rating breakdown
- **Inbox triage** — thread list with status filter, unread badge, assign/resolve/archive quick actions
- **Thread assign** — staff picker, submit with error/success states
- **Canned replies** — list, create form (title + body), delete
- **Auto-reply config** — enabled toggle, day-of-week picker, hours, custom message, save
- **Message archive** — search input + date pickers, thread result list
- **Waitlist admin list** — filter by status (all/waiting/notified/booked/expired/cancelled), notify/convert/cancel quick actions
- **Waitlist convert to booking** — staff ID, date, start time, duration, notes, submit
- **Waitlist policies** — numeric policy inputs, boolean toggles, save

All UI surfaces are in place. The three new service factories ship with no Firestore repository injections (same pattern as W43–W45); real adapters are tracked as **W46-DEBT-1**, **W46-DEBT-2**, **W46-DEBT-3**.

---

## 2. What Was Built

### 2.1 Domain model — `src/domains/reviews/reviewAdminModel.ts`

| Type | Description |
|------|-------------|
| `ReviewAdminResult<T>` | `{ ok: true; data: T } \| { ok: false; message: string }` |
| `ReviewSource` | `"google" \| "facebook" \| "yelp" \| "platform"` |
| `ReviewStatus` | `"pending" \| "replied" \| "flagged" \| "hidden" \| "disputed"` |
| `ReviewEntry` | reviewId, tenantId, clientId, clientName, source, rating, body, status, staffId, replyText, repliedAt, flagReason, hiddenAt, disputeReason, createdAt |
| `ReviewQueueFilter` | `"all" \| "pending" \| "replied" \| "flagged" \| "hidden"` |
| `ReviewBulkAction` | type (`"hide" \| "flag"`), reviewIds, reason, actorId |
| `ReviewReplyInput` | reviewId, tenantId, replyText, authorId |
| `ReviewFlagAction` | `"flag" \| "dispute" \| "hide"` |
| `ReviewFlagInput` | reviewId, tenantId, reason, action, requestedBy |
| `ReviewDisputeInput` | reviewId, tenantId, reasoning, requestedBy |
| `ReviewHideInput` | reviewId, tenantId, hiddenBy |
| `ReviewAutomationRule` | ruleId, tenantId, label, ratingOp, ratingValue, replyTemplate, active |
| `ReviewAutomationRuleInput` | label, ratingOp, ratingValue, replyTemplate, tenantId, createdBy |
| `ReputationStats` | tenantId, avgRating, totalReviews, replyRate, pendingCount, ratingBreakdown (1–5 counts) |

### 2.2 Domain model — `src/domains/messaging/messagingAdminModel.ts`

| Type | Description |
|------|-------------|
| `MessagingAdminResult<T>` | `{ ok: true; data: T } \| { ok: false; message: string }` |
| `AdminThreadStatus` | `"open" \| "assigned" \| "resolved" \| "archived"` |
| `AdminThread` | threadId, tenantId, clientId, clientName, status, assignedStaffId, lastMessageAt, lastMessageSnippet, unreadCount, createdAt |
| `AdminInboxFilter` | `"all" \| "open" \| "assigned" \| "resolved" \| "archived"` |
| `ThreadAssignInput` | threadId, tenantId, staffId, assignedBy |
| `ThreadResolveInput` | threadId, tenantId, resolvedBy |
| `ThreadArchiveInput` | threadId, tenantId, archivedBy |
| `CannedReply` | cannedId, tenantId, title, body, createdBy, createdAt |
| `CannedReplyInput` | tenantId, title, body, createdBy |
| `AutoReplyConfig` | tenantId, enabled, activeDays (Mon-Sun), openHour, closeHour, customMessageEnabled, customMessage |
| `MessageArchiveFilter` | tenantId, query?, dateFrom?, dateTo? |
| `BlockFromInboxInput` | threadId, tenantId, clientId, blockedBy |
| `ReportFromInboxInput` | threadId, tenantId, clientId, reportedBy, reason |

### 2.3 Domain model — `src/domains/waitlist/waitlistAdminModel.ts`

| Type | Description |
|------|-------------|
| `WaitlistAdminResult<T>` | `{ ok: true; data: T } \| { ok: false; message: string }` |
| `WaitlistAdminStatus` | `"waiting" \| "notified" \| "booked" \| "expired" \| "cancelled"` |
| `WaitlistAdminFilter` | `"all" \| "waiting" \| "notified" \| "booked" \| "expired" \| "cancelled"` |
| `WaitlistAdminEntry` | waitlistId, tenantId, clientId, clientName, serviceId, serviceName, locationId, preferredDate, notes, status, position, notifiedAt, addedAt, expiresAt |
| `ConvertToBookingInput` | waitlistId, tenantId, staffId, date, startTime, durationMinutes, notes, convertedBy |
| `ConvertToBookingResult` | bookingId, waitlistId, message |
| `WaitlistPolicy` | tenantId, maxWaitDays, autoCancelDays, notifyLeadHours, maxEntriesPerService, notifyOnOpen, requireConfirmation, allowMultipleEntries |

### 2.4 Service factory — `src/app/admin/reviewAdminService.ts`

Factory: `createReviewAdminService(queueRepo?, writeRepo?)`

| Method | Validation / Behaviour |
|--------|----------------------|
| `listReviews(tenantId, filter)` | No repo → not configured |
| `bulkAction(tenantId, action)` | No repo → not configured |
| `getReview(reviewId, tenantId)` | No repo → not configured |
| `replyToReview(input)` | No repo → not configured |
| `flagReview(input)` | No repo → not configured |
| `disputeReview(input)` | No repo → not configured |
| `hideReview(input)` | No repo → not configured |
| `listAutomationRules(tenantId)` | No repo → not configured |
| `saveAutomationRule(ruleId\|null, tenantId, input)` | No repo → not configured |
| `deleteAutomationRule(ruleId, tenantId)` | No repo → not configured |
| `toggleAutomationRule(ruleId, tenantId, active)` | No repo → not configured |
| `loadReputationStats(tenantId)` | No repo → not configured |

Export: `ReviewAdminService = ReturnType<typeof createReviewAdminService>`

### 2.5 Service factory — `src/app/admin/messagingAdminService.ts`

Factory: `createMessagingAdminService(threadRepo?, cannedRepo?)`

| Method | Validation / Behaviour |
|--------|----------------------|
| `listThreads(tenantId, filter)` | No repo → not configured |
| `getThread(threadId, tenantId)` | No repo → not configured |
| `assignThread(input)` | No repo → not configured |
| `resolveThread(input)` | No repo → not configured |
| `archiveThread(input)` | No repo → not configured |
| `blockFromInbox(input)` | No repo → not configured |
| `reportFromInbox(input)` | No repo → not configured |
| `searchThreads(filter)` | No repo → not configured |
| `listCannedReplies(tenantId)` | No repo → not configured |
| `createCannedReply(input)` | No repo → not configured |
| `deleteCannedReply(cannedId, tenantId)` | No repo → not configured |
| `loadAutoReplyConfig(tenantId)` | No repo → not configured |
| `saveAutoReplyConfig(config)` | No repo → not configured |

Export: `MessagingAdminService = ReturnType<typeof createMessagingAdminService>`

### 2.6 Service factory — `src/app/admin/waitlistAdminService.ts`

Factory: `createWaitlistAdminService(waitlistRepo?, bookingRepo?, policyRepo?)`

| Method | Validation / Behaviour |
|--------|----------------------|
| `listEntries(tenantId, filter)` | No repo → not configured |
| `getEntry(waitlistId, tenantId)` | No repo → not configured |
| `notifyEntry(waitlistId, tenantId)` | No repo → not configured |
| `cancelEntry(waitlistId, tenantId, cancelledBy)` | No repo → not configured |
| `convertToBooking(input)` | No repo → not configured |
| `loadPolicy(tenantId)` | No repo → not configured |
| `savePolicy(policy)` | No repo → not configured |

Export: `WaitlistAdminService = ReturnType<typeof createWaitlistAdminService>`

### 2.7 Admin screens (13 total)

| Screen file | testID | Primary function |
|-------------|--------|-----------------|
| `ReviewQueueScreen.tsx` | `review-queue-screen` | Review list, filter chips, bulk hide/flag bar |
| `ReviewReplyScreen.tsx` | `review-reply-screen` | Owner reply composer with canned template picker |
| `ReviewFlagScreen.tsx` | `review-flag-screen` | Flag / dispute / hide action chips + reason input |
| `ReviewAutomationScreen.tsx` | `review-automation-screen` | Automation rule create form + rule rows |
| `ReputationDashboardScreen.tsx` | `reputation-dashboard-screen` | Stats tiles: avg rating, reply rate, pending count, breakdown |
| `InboxTriageScreen.tsx` | `inbox-triage-screen` | Thread list with status filter, quick-action buttons |
| `ThreadAssignScreen.tsx` | `thread-assign-screen` | Staff picker for thread assignment |
| `CannedRepliesScreen.tsx` | `canned-replies-screen` | Canned reply list + create form |
| `AutoReplyConfigScreen.tsx` | `auto-reply-config-screen` | Day-of-week + hour inputs + custom message toggle |
| `MessageArchiveScreen.tsx` | `message-archive-screen` | Search + date pickers + thread result list |
| `WaitlistAdminListScreen.tsx` | `waitlist-admin-list-screen` | Waitlist entries with status filter + notify/convert/cancel |
| `WaitlistConvertScreen.tsx` | `waitlist-convert-screen` | Convert waitlist entry to booking form |
| `WaitlistPoliciesScreen.tsx` | `waitlist-policies-screen` | Waitlist policy numeric + boolean inputs |

### 2.8 Carry-in adapter deliveries

#### `src/app/admin/bookingOpsAdapters.ts` (closes W43-DEBT-1)

Five real Firestore factory functions injected into `createBookingOpsService()`:

| Factory | Firestore paths |
|---------|----------------|
| `createBookingOpsCalendarRepository` | `tenants/{tenantId}/bookings` (date-range query) |
| `createBlockedSlotRepository` | `tenants/{tenantId}/blockedSlots` (getDocs, setDoc, deleteDoc) |
| `createManualBookingRepository` | `tenants/{tenantId}/bookings` (setDoc with generated ID) |
| `createBookingDetailRepository` | `tenants/{tenantId}/bookings/{bookingId}` (getDoc) |
| `createBookingWriteRepository` | `tenants/{tenantId}/bookings/{bookingId}` (updateDoc for noShow, cancel, reschedule) |

TSC errors fixed: `customerName` cast via `Record<string, unknown>`, `feeCents` (was `feeAmountCents`), `rescheduleReason` (was `reason`), removed invalid `newStaffId` access.

#### `src/app/admin/clientCrmAdapters.ts` (closes W44-DEBT-1)

Six real Firestore factory functions injected into `createClientCrmService()`:

| Factory | Firestore paths |
|---------|----------------|
| `createClientListRepository` | `tenants/{tenantId}/clients` (query with filters) |
| `createClientDetailRepository` | `tenants/{tenantId}/clients/{clientId}` (getDoc) |
| `createClientWriteRepository` | `tenants/{tenantId}/clients/{clientId}` (updateDoc merge, deleteDoc) |
| `createGdprRepository` | `tenants/{tenantId}/gdprExports` (setDoc, getDoc) |
| `createSegmentBuilderRepository` | `tenants/{tenantId}/segments` (getDocs, setDoc, deleteDoc) |
| `createCampaignSendRepository` | `tenants/{tenantId}/messageSends` (setDoc) |

TSC errors fixed: `duplicateClientId` (was `secondaryClientId`), `performedBy` (was `unblockedBy`), `exportType`, removed invalid `"status"` filter field, `sampleClientIds` (was `sampleClientNames`), removed `estimatedCount` from input, `sentBy` (was `createdBy`), `messageId: sendId`.

#### `src/app/admin/loyaltyAdminAdapters.ts` + `campaignAdminAdapters.ts` (closes W45-DEBT-1)

Eight real Firestore factory functions across two files:

| Factory | Firestore paths |
|---------|----------------|
| `createLoyaltyConfigAdminRepository` | `tenants/{tenantId}/loyaltyConfig` |
| `createRewardCatalogRepository` | `tenants/{tenantId}/rewardCatalog` |
| `createManualAdjustmentRepository` | `tenants/{tenantId}/pointAdjustments` |
| `createActivityAdminRepository` | `tenants/{tenantId}/activities` |
| `createCampaignListAdminRepository` | `tenants/{tenantId}/campaigns` |
| `createCampaignWriteRepository` | `tenants/{tenantId}/campaigns` |
| `createTransactionalTemplateRepository` | `tenants/{tenantId}/transactionalTemplates` |
| `createPromoCodeRepository` | `tenants/{tenantId}/promoCodes` |

TSC errors fixed: `completedCount` (was `claimCount`), `TierMigrationPreview` fields (`customersAffected`, `upgrades`, `downgrades`, `unchanged`), `LoyaltyProgramStats` default fields (`totalEnrolled`, `activeThisMonth`, `tierDistribution`).

#### `src/app/admin/staffMetricsService.ts` (closes W41-DEBT-3)

Factory: `createStaffMetricsService(metricsRepo?, bookingHistoryRepo?)`

Primary path: reads materialized `staffMetrics/{tenantId}/staff/{staffId}` doc.
Fallback path: on-demand count queries against `tenants/{tenantId}/bookings` filtered by staffId + status.
Wired into `StaffPerformanceScreen` in AppNavigatorShell.

### 2.9 AppNavigatorShell.tsx fixes (TSC clean)

| Fix | Detail |
|-----|--------|
| `bulkAction` arity | `reviewAdminService.bulkAction(tenantId, { type, reviewIds, reason, actorId })` (was 1-arg call) |
| `authorId` field | `replyToReview({ …, authorId: userId ?? "" })` (was `repliedBy`) |
| `reasoning` field | `disputeReview({ …, reasoning: reviewFlagReason })` (was `disputeReason`) |
| Removed `setAutoReplyConfig(r.data)` | `saveAutoReplyConfig` returns `Result<void>`; `r.data` is `void` |
| Removed `setWaitlistPolicy(r.data)` | `savePolicy` returns `Result<void>`; `r.data` is `void` |

### 2.10 Routes

All 13 W46 screens added to `src/app/navigation/routes.ts`:
`ReviewQueue`, `ReviewReply`, `ReviewFlag`, `ReviewAutomation`, `ReputationDashboard`, `InboxTriage`, `ThreadAssign`, `CannedReplies`, `AutoReplyConfig`, `MessageArchive`, `WaitlistAdminList`, `WaitlistConvert`, `WaitlistPolicies`.

---

## 3. Test Coverage

**Test file:** `__tests__/w46ReviewsMessagingWaitlistExtras.test.tsx`

| Describe block | Tests | Notes |
|---------------|-------|-------|
| `ReviewQueueScreen` | 5 | root testID, loading, error+retry, empty state, filter chip dispatch |
| `ReviewReplyScreen` | 5 | root testID, loading, error, submit (replyText required), back |
| `ReviewFlagScreen` | 5 | root testID, loading, action chips, onActionChange, submit (reason required) |
| `ReviewAutomationScreen` | 5 | root testID, loading, error+retry, empty state, toggle-create-btn |
| `ReputationDashboardScreen` | 5 | root testID, loading, error, avg-rating tile, total-reviews tile |
| `InboxTriageScreen` | 5 | root testID, loading, error+retry, empty state, status filter chip |
| `ThreadAssignScreen` | 5 | root testID, loading, error, submit (selectedStaffId required), back |
| `CannedRepliesScreen` | 5 | root testID, loading, error+retry, empty state, toggle-form-btn |
| `AutoReplyConfigScreen` | 5 | root testID, loading, save-btn fires onSave, enabled-switch, back |
| `MessageArchiveScreen` | 5 | root testID, loading ("Searching archive…"), empty state, search-btn, back |
| `WaitlistAdminListScreen` | 5 | root testID, loading, error+retry, empty state, filter chip |
| `WaitlistConvertScreen` | 5 | root testID, loading, error, submit (staffId+date+startTime required), back |
| `WaitlistPoliciesScreen` | 5 | root testID, loading, error, save, back |
| **Total** | **64** | |

**Delta:** +64 tests, +1 suite (169 → 170 suites, 3245 → 3309 tests).

---

## 4. Debt Register Changes

### Closed this week

| ID | Description | Closed by |
|----|-------------|-----------|
| W41-DEBT-3 | Staff performance metrics service | `staffMetricsService.ts` factory + materialized-doc + fallback query path |
| W43-DEBT-1 | Booking-ops Firestore adapters (all 5) | `bookingOpsAdapters.ts` — real Firestore implementations |
| W44-DEBT-1 | CRM Firestore adapters (all 6) | `clientCrmAdapters.ts` — real Firestore implementations |
| W45-DEBT-1 | Loyalty/Campaign/Activity adapters (all 8) | `loyaltyAdminAdapters.ts` + `campaignAdminAdapters.ts` — real Firestore implementations |

### New debts opened this week

| ID | Description | Severity | Target |
|----|-------------|----------|--------|
| W46-DEBT-1 | Review admin Firestore adapters (ReviewQueueRepository, ReviewWriteRepository) | High | W47 |
| W46-DEBT-2 | Messaging admin Firestore adapters (ThreadRepository, CannedReplyRepository, AutoReplyConfig persistence) | High | W47 |
| W46-DEBT-3 | Waitlist admin Firestore adapters (WaitlistRepository, BookingRepository, WaitlistPolicyRepository) | High | W47 |

### Retargeted

| ID | Old target | New target | Reason |
|----|-----------|-----------|--------|
| W43-DEBT-2 | W46 | W47 | Screen-based reschedule flow sufficient for iOS beta; gesture drag is enhancement not blocker |

### Overdue (no progress, no plan this week)

| IDs | Original target | Overdue since |
|-----|----------------|---------------|
| W41-DEBT-1, W41-DEBT-2, W41-DEBT-4, W41-DEBT-5, W41-DEBT-6 | W43 | W44 |
| W42-DEBT-1, W42-DEBT-2, W42-DEBT-3 | W43 | W44 |

These 8 items (staff invite backend, commission service, role-change audit, schedule editor write UI, qualification editor, catalog adapters, photo upload, CSV export) remain open with no assigned week. They should be explicitly scheduled before W48 (iOS beta readiness gate).

---

## 5. Quality Gates

| Gate | Result |
|------|--------|
| `tsc --noEmit` | ✅ clean |
| Jest — W46 suite | ✅ 64 / 64 |
| Jest — full suite | ✅ 3309 / 3309 (170 suites) |
| No new ESLint errors introduced | ✅ |
