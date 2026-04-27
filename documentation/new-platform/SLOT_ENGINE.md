# Slot Engine

## Overview

The slot engine generates available booking time slots for a given staff member on a given date, respecting their schedule template, existing bookings, and the requested service duration + buffer.

All functions are **pure** — no I/O, no side-effects. The engine operates entirely on in-memory data supplied by the caller.

---

## Files

| File | Purpose |
|------|---------|
| `src/domains/bookings/slotEngine.ts` | Slot generation, time helpers, weekday resolver |
| `src/domains/bookings/conflictChecker.ts` | Overlap detection with buffer-aware intervals |
| `src/domains/bookings/__tests__/slotEngine.test.ts` | 14 deterministic unit tests |
| `src/domains/bookings/__tests__/conflictChecker.test.ts` | 9 unit tests for conflict logic |

---

## Algorithm

### Inputs (`GenerateSlotsInput`)

| Field | Type | Description |
|-------|------|-------------|
| `schedule` | `StaffScheduleTemplate` | Staff's week template + date exceptions |
| `date` | `string` (YYYY-MM-DD) | Target date |
| `existingBookings` | `BookedInterval[]` | Active (non-cancelled) bookings for this staff on this date |
| `serviceDurationMinutes` | `number` | Duration of the service to book |
| `bufferMinutes` | `number` | Cleanup/travel buffer appended after each slot |

### Step-by-step

1. **Resolve blocks for date** — Check `schedule.exceptions` for an exact date match first.
   - If the exception marks the date as `isClosed: true` → return `[]`.
   - If an exception with custom blocks exists → use those blocks.
   - Otherwise, map the date to a weekday (`mon`–`sun`) and use `schedule.weekTemplate[weekday]`.
   - If no blocks found → return `[]`.

2. **Iterate blocks** — For each `ScheduleTimeBlock { start, end }`:
   - Convert `start`/`end` to integer minutes since midnight using `timeToMinutes`.
   - Start `pos = blockStart`.

3. **Emit slots** — While `pos + serviceDurationMinutes ≤ blockEnd`:
   - Construct `proposed = { startMinutes: pos, endMinutes: pos + serviceDurationMinutes }`.
   - Call `hasConflict(proposed, existingBookings)`.
   - If **no conflict** → emit slot.
   - Advance: `pos += serviceDurationMinutes + bufferMinutes`.

4. **Return** collected `AvailableSlot[]`.

### Time complexity

`O(B × S)` where `B` = number of schedule blocks and `S` = number of existing bookings per slot candidate. In practice both are small (single digits).

---

## Conflict Detection

### `BookedInterval`

```ts
type BookedInterval = {
  startMinutes: number;
  endMinutes: number;   // does NOT include buffer
  bufferMinutes: number;
};
```

### Overlap rule

A proposed slot `[pStart, pEnd)` conflicts with a booked interval when:

```
pStart < (bEnd + bBuffer)  AND  bStart < pEnd
```

The buffer is treated as **occupied time** so that back-to-back bookings cannot be placed within the cleanup window of the previous booking.

---

## Key Design Decisions

### Buffer stored in `BookedInterval`, not `Booking.endMinutes`

`endMinutes` on a `Booking` is always `startMinutes + durationMinutes` (the actual service end). The buffer is carried separately in `BookedInterval.bufferMinutes` so conflict detection can respect it without needing to look up the original service record.

### Slot position advances by `duration + buffer`

Even though the *emitted* slot's `endMinutes` excludes the buffer, the iteration advances by `duration + buffer` to ensure the next generated candidate does not land inside the current slot's buffer gap. This means generated slots are themselves mutually non-conflicting by construction.

### Local date parsing for weekday resolution

`dateToWeekday` uses `new Date(year, month-1, day)` (local constructor) rather than `new Date("YYYY-MM-DD")` (UTC midnight). The UTC form shifts the date by timezone offset on machines west of UTC, causing the wrong weekday to be returned.

---

## Helper Functions

### `timeToMinutes(time: string): number`
Converts `"HH:mm"` to integer minutes since midnight.

### `minutesToTime(minutes: number): string`
Converts integer minutes to zero-padded `"HH:mm"`.

### `dateToWeekday(date: string): ScheduleWeekday`
Returns `"mon" | "tue" | ... | "sun"` for a given `"YYYY-MM-DD"` string using local date components.

---

## Example

```
Schedule: Monday 09:00–17:00
Service duration: 60 min
Buffer: 10 min
Existing bookings: [{ start: 540, end: 600, buffer: 10 }]  // 09:00–10:00

Generated slots:
  09:00 → CONFLICT (booked)
  10:10 → OK  (540 + 60 + 10 = 610)
  11:20 → OK  (610 + 60 + 10 = 680; wait — next is 680, not 680. Let me recalc)

pos=540  → conflict → skip
pos=610  → OK → emit 10:10–11:10
pos=680  → OK → emit 11:20–12:20
pos=750  → OK → emit 12:30–13:30
pos=820  → OK → emit 13:40–14:40
pos=890  → OK → emit 14:50–15:50
pos=960  → OK → emit 16:00–17:00  (960+60=1020≤1020 ✓)
pos=1030 → 1030+60=1090 > 1020   → stop

Result: 6 available slots
```
