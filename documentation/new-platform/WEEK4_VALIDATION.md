# Week 4 Validation — Scheduling Engine v1

## Status: COMPLETE ✓

All 4 tasks implemented and validated. Test suite: **310 tests, 39 suites, 0 failures**.

---

## Test Checklist

### Task 4.1 — Slot Generation Utility

| Test | File | Result |
|------|------|--------|
| `timeToMinutes` converts HH:mm correctly | `slotEngine.test.ts` | ✓ |
| `minutesToTime` formats with zero-padding | `slotEngine.test.ts` | ✓ |
| `dateToWeekday` maps Monday correctly | `slotEngine.test.ts` | ✓ |
| `dateToWeekday` maps Sunday and Saturday | `slotEngine.test.ts` | ✓ |
| Returns `[]` when `serviceDurationMinutes` is 0 | `slotEngine.test.ts` | ✓ |
| Returns `[]` when no week template for weekday | `slotEngine.test.ts` | ✓ |
| Returns `[]` when exception marks date as closed | `slotEngine.test.ts` | ✓ |
| Returns correct slots for full 9–17 block | `slotEngine.test.ts` | ✓ |
| Excludes slots conflicting with existing bookings | `slotEngine.test.ts` | ✓ |
| Uses exception blocks when date override present | `slotEngine.test.ts` | ✓ |
| Handles multiple blocks in one day | `slotEngine.test.ts` | ✓ |
| Last slot included when it fits exactly | `slotEngine.test.ts` | ✓ |
| Slot excluded when it would exceed block end | `slotEngine.test.ts` | ✓ |

### Task 4.2 — Conflict Detection and Atomic Booking Guard

| Test | File | Result |
|------|------|--------|
| No conflict when proposed is before booking | `conflictChecker.test.ts` | ✓ |
| No conflict when proposed is after booking + buffer | `conflictChecker.test.ts` | ✓ |
| Conflict when proposed overlaps booking start | `conflictChecker.test.ts` | ✓ |
| Conflict when proposed overlaps booking end | `conflictChecker.test.ts` | ✓ |
| Conflict when proposed is inside booking | `conflictChecker.test.ts` | ✓ |
| Conflict when proposed contains booking | `conflictChecker.test.ts` | ✓ |
| No conflict for empty booked list | `conflictChecker.test.ts` | ✓ |
| Conflict when proposed starts during buffer gap | `conflictChecker.test.ts` | ✓ |
| No conflict when proposed starts exactly at effectiveEnd | `conflictChecker.test.ts` | ✓ |
| Creates booking + slot token atomically | `repository.test.ts` | ✓ |
| Throws `SLOT_UNAVAILABLE` when token exists | `repository.test.ts` | ✓ |
| Does not write booking when slot unavailable | `repository.test.ts` | ✓ |
| Cross-tenant access guard on `getBookingById` | `repository.test.ts` | ✓ |
| `listBookingsByStaffAndDate` excludes cancelled | `repository.test.ts` | ✓ |
| Status transition pending → confirmed | `repository.test.ts` | ✓ |
| Throws `INVALID_STATUS_TRANSITION` on invalid move | `repository.test.ts` | ✓ |
| Throws `BOOKING_NOT_FOUND` for unknown booking | `repository.test.ts` | ✓ |
| Cancelling deletes slot token | `repository.test.ts` | ✓ |

### Task 4.3 — Calendar UI v1

| Test | File | Result |
|------|------|--------|
| `AdminCalendarScreen` renders location name and date | `CalendarScreens.test.tsx` | ✓ |
| Loading state shown | `CalendarScreens.test.tsx` | ✓ |
| Error state with Retry button fires `onRetry` | `CalendarScreens.test.tsx` | ✓ |
| Staff names rendered with "No bookings" placeholder | `CalendarScreens.test.tsx` | ✓ |
| Booking card shows time range and status chip | `CalendarScreens.test.tsx` | ✓ |
| Prev/next day arrows fire callbacks | `CalendarScreens.test.tsx` | ✓ |
| Back button fires `onBack` | `CalendarScreens.test.tsx` | ✓ |
| `ClientBookingScreen` renders title and service list | `CalendarScreens.test.tsx` | ✓ |
| Pressing service calls `onSelectService` | `CalendarScreens.test.tsx` | ✓ |
| Staff picker hidden until service selected | `CalendarScreens.test.tsx` | ✓ |
| Staff picker shown after service selected | `CalendarScreens.test.tsx` | ✓ |
| Pressing staff pill calls `onSelectStaff` | `CalendarScreens.test.tsx` | ✓ |
| Date nav + slot section shown after staff selected | `CalendarScreens.test.tsx` | ✓ |
| Empty state when no slots | `CalendarScreens.test.tsx` | ✓ |
| Slot pills rendered for available slots | `CalendarScreens.test.tsx` | ✓ |
| Pressing slot calls `onSelectAndConfirmSlot` | `CalendarScreens.test.tsx` | ✓ |
| Loading slots state | `CalendarScreens.test.tsx` | ✓ |
| Slots error state | `CalendarScreens.test.tsx` | ✓ |
| Submit error state | `CalendarScreens.test.tsx` | ✓ |
| Submitting state | `CalendarScreens.test.tsx` | ✓ |
| Back button on client screen | `CalendarScreens.test.tsx` | ✓ |

### Task 4.4 — End-to-End Hardening

| Test | File | Result |
|------|------|--------|
| Full flow: generate slots → reserve → slots update | `bookingIntegration.test.ts` | ✓ |
| Race collision: second booking for same slot throws `SLOT_UNAVAILABLE` | `bookingIntegration.test.ts` | ✓ |
| Cancel releases slot token → slot can be re-booked | `bookingIntegration.test.ts` | ✓ |
| `getAvailableSlots` returns `[]` when no schedule | `bookingService.test.ts` | ✓ |
| `getAvailableSlots` returns 7 slots for full Monday | `bookingService.test.ts` | ✓ |
| Existing bookings reduce available slots | `bookingService.test.ts` | ✓ |
| `getAvailableSlots` passes correct IDs to schedule repo | `bookingService.test.ts` | ✓ |
| `reserveSlot` delegates to `createBookingAtomically` | `bookingService.test.ts` | ✓ |
| `listStaffBookingsForDate` calls repository correctly | `bookingService.test.ts` | ✓ |
| `cancelBooking` calls `updateBookingStatus` with cancelled | `bookingService.test.ts` | ✓ |

---

## Files Added / Modified

| File | Type | Task |
|------|------|------|
| `src/domains/bookings/model.ts` | New | 4.1 |
| `src/domains/bookings/conflictChecker.ts` | New | 4.1 / 4.2 |
| `src/domains/bookings/slotEngine.ts` | New | 4.1 |
| `src/domains/bookings/repository.ts` | New | 4.2 |
| `src/domains/bookings/index.ts` | Modified (replaced placeholder) | 4.2 |
| `firestore.rules` | Modified (added `bookingSlotTokens` rule) | 4.2 |
| `src/app/bookings/bookingService.ts` | New | 4.3 |
| `src/app/bookings/CalendarScreens.tsx` | New | 4.3 |
| `src/domains/bookings/__tests__/conflictChecker.test.ts` | New | 4.4 |
| `src/domains/bookings/__tests__/slotEngine.test.ts` | New | 4.4 |
| `src/domains/bookings/__tests__/repository.test.ts` | New | 4.4 |
| `src/domains/bookings/__tests__/bookingIntegration.test.ts` | New | 4.4 |
| `src/app/bookings/__tests__/bookingService.test.ts` | New | 4.4 |
| `src/app/bookings/__tests__/CalendarScreens.test.tsx` | New | 4.3 |
| `documentation/new-platform/SLOT_ENGINE.md` | New | 4.1 |
| `documentation/new-platform/WEEK4_VALIDATION.md` | New | 4.4 |

---

## Concurrency Strategy

The atomic booking guard uses a **slot-token document mutex** in Firestore:

- Token ID: `{tenantId}_{staffId}_{date}_{startMinutes}`
- Creation uses `runTransaction`: reads token → if present throws `SLOT_UNAVAILABLE` → else writes token + booking atomically
- Two concurrent callers racing for the same slot trigger Firestore's optimistic locking; only the first commit succeeds
- Cancellation deletes the token so the slot can be re-booked

---

## Known Gaps and Technical Debt

| Item | Severity | Notes |
|------|----------|-------|
| No navigation wiring for `AdminCalendarScreen` / `ClientBookingScreen` | Medium | Screens are presentational; wiring into app navigator is a Week 5 task |
| `AdminCalendarScreen` shows `serviceId` raw string instead of service name | Low | Requires a service lookup; acceptable for v1 |
| `ClientBookingScreen` has no confirmation dialog after slot press | Low | `onSelectAndConfirmSlot` is a single-step async handler; a modal confirm step can be added in Week 5 |
| No Firestore index defined for `bookings` compound queries | Medium | `listBookingsByStaffAndDate` and `listBookingsByLocationAndDate` require composite indexes on `(tenantId, staffId, date)` and `(tenantId, locationId, date)` — add to `firestore.indexes.json` before deploying |
| Slot engine does not handle overlapping schedule blocks | Low | If a `weekTemplate` has two blocks that overlap, duplicate slots could be generated. Blocks are authored by admins and assumed non-overlapping for v1 |
| No retry logic on `runTransaction` failure | Low | Firestore SDK retries automatically; explicit retry not needed for normal contention levels |

---

## Week 5 Prerequisites

- Navigate to `AdminCalendarScreen` from the location admin screen
- Navigate to `ClientBookingScreen` from the discovery / service detail screen
- Add composite Firestore indexes for booking queries
- Inject real `BookingService` via context or dependency injection at the screen level
