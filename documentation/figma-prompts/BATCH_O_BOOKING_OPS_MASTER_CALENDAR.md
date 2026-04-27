# Batch O — Booking Operations + Master Calendar

> Consumed by **Week 38**. Critical path. Highest-complexity admin batch. iPad-first.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Topics: Master calendar (day/week/month, all staff, all rooms) · Drag-to-reschedule · Booking detail admin (timeline + audit + customer history) · Manual booking creation · Block time / hold slot · Override / force-book · No-show marking · Cancellation handling with fee enforcement · Rebook/reschedule on behalf · Recurring booking management · Slot-engine conflict resolution.

New components: `master-calendar-grid` (multi-resource), `drag-shadow + drop-target states`, `conflict-resolution-modal`, `force-book-reason-form`, `audit-timeline-row`.

---

## SCREEN — O.1 Master Calendar (Day / Week / Month)

```text
SCREEN: Master Calendar    DEVICE: iPad 1024×768 (primary), iPhone 14 condensed
LAYOUT
- Header: date navigator + view toggle (Day/Week/Month) + filter bar (Location, Staff multi-select, Resource multi-select).
- master-calendar-grid:
  - Day view: rows time (5am–10pm 30-min), columns staff (or rooms toggle). Now-line coral-blossom.
  - Week view: 7 columns dates, condensed appointment blocks.
  - Month view: month grid with appointment counts per cell + heat color (mint→coral by load).
- Side detail pane: tap block → mini detail.
- FAB: + manual booking (O.4) and + block time (O.5).
STATES: default, fully-booked-day banner, conflict highlighting, loading skeleton, error.
ACCESSIBILITY: each block accessibilityLabel "Wed Mar 12 9:00 AM, 1 hour, Hair color, Jane Doe, Stylist Mia".
```

## SCREEN — O.2 Drag-to-Reschedule Spec

```text
SCREEN: Drag Interaction Spec    DEVICE: iPad
- Long-press 200ms → drag-shadow appears (semi-transparent block).
- Drop targets: empty cells highlight mint-fresh; occupied cells highlight error red.
- Snap to 15-min increments.
- On drop: confirmation modal with new time + notify-client toggle (default ON).
- Reduce-motion: instant snap, no shadow trail.
STATES: idle, dragging, valid drop, invalid drop (snap back animation), conflict (modal).
```

## SCREEN — O.3 Booking Detail Admin View

```text
SCREEN: Booking Detail (Admin)    DEVICE: iPad + iPhone
LAYOUT
- Top: status pill + booking #.
- Tabs: Overview · Timeline · Customer · Notes.
- Overview: client mini, salon, service, staff, date/time (US format), price USD, payment status.
- Timeline: vertical audit-timeline-row (booked → confirmed → reminded → checked-in → completed → tipped → reviewed) with timestamps.
- Customer: lifetime stats + last 5 visits.
- Action row: Reschedule · Cancel · Mark no-show · Refund · Message · Rebook.
STATES: confirmed, completed, cancelled, no-show, refunded, error.
```

## SCREEN — O.4 Manual Booking Creation (Phone-in / Walk-in)

```text
SCREEN: New Manual Booking    DEVICE: iPad + iPhone
LAYOUT
- Form steps: Client (search existing or create new with phone-first US format), Service, Staff, Date/Time, Payment (skip / take now / charge later), Notes.
- Sticky CTA "Create booking".
STATES: default, client-not-found (create variant), validation errors, conflict, success → O.3, error.
```

## SCREEN — O.5 Block Time / Hold Slot

```text
SCREEN: Block Time    DEVICE: iPad + iPhone
- Form: location, staff (multi), resource (optional), date range, time range (12h), reason picker (Lunch / Training / Sick / Maintenance / Other).
- Recurrence picker (Daily / Weekly / Until date).
- Sticky CTA "Block time".
STATES: default, conflicts banner ("3 bookings would be affected"), confirmed, error.
```

## SCREEN — O.6 Override / Force-Book Confirmation

```text
SCREEN: Force-Book Confirm    DEVICE: modal-sheet
- Warning banner explaining policy override.
- force-book-reason-form: reason picker + required notes textarea.
- Acknowledge checkbox "I take responsibility for this override".
- Destructive primary "Force book".
STATES: default, submitting, error.
```

## SCREEN — O.7 No-Show Marking

```text
SCREEN: Mark No-Show    DEVICE: modal-sheet
- Body summarizing no-show fee policy + amount $.
- Toggle "Charge no-show fee now" (default ON if policy allows).
- Notify client toggle.
- Destructive primary "Mark as no-show".
STATES: default, charging, charged, charge-failed banner, error.
```

## SCREEN — O.8 Cancellation Handling + Fee Enforcement

```text
SCREEN: Cancel Booking (Admin)    DEVICE: modal-sheet
- Refund preview with policy breakdown ($X refunded, $Y fee retained).
- Reason picker.
- Notify-client toggle.
- Destructive primary "Cancel booking".
STATES: default, fee-waived (manager override toggle), refund-issued toast, error.
```

## SCREEN — O.9 Rebook / Reschedule on Behalf

```text
SCREEN: Rebook    DEVICE: iPad + iPhone
- Reuses C.3/C.4 picker UI prefilled with original booking; payment defaults to original method.
- Notify client toggle.
STATES: default, conflict, success.
```

## SCREEN — O.10 Recurring Booking Management

```text
SCREEN: Recurring Series    DEVICE: iPad + iPhone
- List of occurrences with status pills.
- Edit-this-only vs Edit-all-future modal-sheet.
- Pause / Resume / End series controls.
STATES: active, paused, ended, conflict on edit-all, error.
```

## SCREEN — O.11 Slot-Engine Conflict Resolution

```text
SCREEN: Conflict Resolver    DEVICE: modal-sheet
- conflict-resolution-modal: list of conflicts with each row showing 3 fix options (Move ±15 min · Reassign staff · Cancel one).
- Bulk apply.
STATES: open, applying, applied, error.
```

---

## COMPONENTS

```text
master-calendar-grid — multi-resource (staff or rooms swap). Resource header sticky top. Time column 56 wide sticky left. Cells 32×64 (15-min subdivision). Now-line 1px coral-blossom. Conflict overlay 2px error border + hatched background.

drag-shadow / drop-target — drag-shadow at 50% opacity following pointer. Valid drop: cell bg primary-10. Invalid drop: cell bg error-tinted with X icon.

conflict-resolution-modal — list rows showing conflict pair + 3 fix-option chips + apply per row + bulk apply.

force-book-reason-form — picker + multi-line textarea (min 20 chars) + acknowledgement checkbox.

audit-timeline-row — left dot + connector line, right body (action label + actor name + timestamp 12h MM/DD/YYYY).
```

---

## Human Review Checklist

- [ ] All 11 screens + 5 components delivered.
- [ ] iPad master calendar performs at all 3 view modes.
- [ ] Drag interaction has reduce-motion fallback.
- [ ] Force-book and no-show flows enforce policy + audit.
- [ ] Refund preview shown before any cancel/no-show charge.
- [ ] All US date/time formatting.
- [ ] Frames named `O-<screen>-<state>`.
