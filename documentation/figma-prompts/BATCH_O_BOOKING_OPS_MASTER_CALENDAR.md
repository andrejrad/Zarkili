# Batch O — Booking Operations + Master Calendar

> Consumed by **Week 40**. Critical path. Highest-complexity admin batch. iPad-first.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Topics: Master calendar (day/week/month, all staff, all rooms) · Drag-to-reschedule · Booking detail admin (timeline + audit + customer history) · Manual booking creation · Block time / hold slot · Override / force-book · No-show marking · Cancellation handling with fee enforcement · Rebook/reschedule on behalf · Recurring booking management · Slot-engine conflict resolution.

New components: `master-calendar-grid` (multi-resource), `drag-shadow + drop-target states`, `conflict-resolution-modal`, `force-book-reason-form`, `audit-timeline-row`.

Deliverables: 11 screens + 5 components + new booking-status and calendar color tokens + strings keys.

---

## NEW COLOR TOKENS (define these before drawing any screens)

```text
Booking status — used on appointment blocks, status pills, and audit timeline dots:
  booking.confirmed         #4CAF50   bg tint: #E8F5E9
  booking.pending           #FF9800   bg tint: #FFF3E0
  booking.cancelled         #9CA3AF   bg tint: #F5F5F5
  booking.noShow            #F44336   bg tint: #FFEBEE
  booking.completed         #A5C4D4   bg tint: #EAF4F8
  booking.rescheduled       #D4A5C9   bg tint: #F5EEF8
  booking.reschedulePending #FF9800   bg tint: #FFF3E0
  booking.blockedTime       border #9CA3AF  bg #F7F4EC  (hatched pattern)

Calendar grid:
  calendar.nowLine          #E3A9A0   (coral-blossom, 1px, leading 8px dot)
  calendar.gridLine         #E5E0D1
  calendar.headerBg         #F7F4EC
  calendar.timeColumnBg     #FFFFFF
  calendar.timeColumnText   #6B6B6B
  calendar.dropValid        mint-fresh #BBEDDA at 20% + 1px mint-fresh border
  calendar.dropInvalid      error #F44336 at 10% + 1px error border + X icon 16px
  calendar.conflictHatch    error #F44336 at 15% + 2px error border + diagonal hatch

Month heat scale (appointment load per cell):
  0 bookings  → #F7F4EC (cream, empty)
  1–4         → #BBEDDA (mint-fresh, light)
  5–8         → #D4CCA5 (warm-oat, medium)
  9–12        → #E3A9A0 (coral-blossom, busy)
  13+         → #CF8B80 (coral-pressed, fully booked)

Audit timeline:
  audit.dot         matches booking.[status] color
  audit.connector   #E5E0D1
  audit.actorText   #6B6B6B
  audit.timestamp   #9CA3AF  (mono)
```

---

## SCREEN — O.1 Master Calendar (Day / Week / Month)

```text
SCREEN: Master Calendar    DEVICE: iPad 1024×768 (primary), iPhone 14 condensed
LAYOUT
- Header bar (56px, surface bg, bottom border 1px calendar.gridLine):
    Left: chevron-left (44×44) + date label bodyLarge bold (Mon May 9 / Week of May 5 / May 2026) + chevron-right (44×44) + "Today" secondary button small.
    Center: segmented control Day / Week / Month.
    Right: segmented control Staff / Rooms + filter icon button (44×44).
- Filter strip (44px, calendar.headerBg): Location dropdown chip + Staff multi-select chip + Resource multi-select chip + Reset link. Hidden when no filter active.
- Fully-booked-day banner (36px sticky below header, warning 15% bg, 1px warning bottom border): "All staff are fully booked — tap to see waitlist". Only visible when all resources 100% occupied.
- master-calendar-grid fills remaining height (see component spec).
- Side detail pane (320px, surface bg, 1px left border): hidden when no block selected; shown by tap/click on appointment block. Content: status pill + client name bodyLarge + service + staff + date/time US + price USD + actions (Full Detail / Reschedule / Cancel).
- FAB group bottom-right 24px offset: primary + "New Booking" → O.4; secondary block-icon "Block Time" → O.5.

DAY VIEW (default)
- Time column 56px wide sticky left, mono caption, label every 30 min (8:00 AM / 8:30 AM…), range 5:00 AM – 10:00 PM.
- Resource columns: one per staff member (or room when Rooms toggle selected). Min width 120px, scrollable horizontally.
- Resource header 56px sticky top: avatar 28px + name label-small + role caption muted.
- Cell height 64px per 30-min block (= 32px per 15-min snap unit).
- Appointment block: left 3px border booking.[status]; bg booking.[status] bg tint; border-radius 4px; padding 6×4; label "H:MM AM · Service name · Client name" truncated 1 line; overflow: scrollable within block.
- Blocked-time cell: bg booking.blockedTimeBg; border 1px dashed #9CA3AF; diagonal hatch pattern; label "Lunch" / reason caption muted center.
- Conflict cell: 2px solid error border + calendar.conflictHatch bg.
- Now-line: 1px calendar.nowLine, spans full width across all resource columns, leading 8px dot on time column edge.

WEEK VIEW
- 7 date columns. Column header 48px: day-abbrev label-small + date MM/DD; today column header gets primary pill bg.
- Condensed appointment blocks min 20px tall: left 2px status border + service name 1 line truncated + start time caption muted.
- Overflow stacking: when > 3 blocks overlap, show "+N more" chip at bottom of cell.

MONTH VIEW
- Month grid. Cell min-height 80px. Header: date number; today date gets primary circle bg.
- Up to 3 appointment titles shown per cell (body-small truncated 1 line); "+N more" chip if overflow.
- Cell bg tinted by heat scale (see NEW COLOR TOKENS above).
- Tap on cell → navigate to Day view for that date.

STATES: default, fully-booked-day banner, conflict-highlighted (conflict cells visible), loading skeleton (grey shimmer blocks), error (retry banner).
ACCESSIBILITY: each appointment block accessibilityLabel "{weekday} {date} {startTime}, {duration} min, {serviceName}, {clientName}, {staffName}". Empty cell accessibilityHint "Double-tap to create a booking at this time."
```

## SCREEN — O.2 Drag-to-Reschedule Spec

```text
SCREEN: Drag Interaction Spec    DEVICE: iPad (interaction annotation layer on top of O.1)
This is a Figma spec frame documenting all drag states — not a separate navigable route.

STATE: idle
  Normal calendar day view. No overlay.

STATE: long-press-charging (0–200ms hold)
  Small arc progress ring (1px primary stroke, 16px radius) at top-right corner of block.
  Haptic: medium impact on completion.

STATE: dragging
  drag-shadow: clone of appointment block at 50% opacity, follows pointer/finger.
  Snaps to 15-min grid increments (32px vertical steps).
  Origin cell: dashed 1px mint-fresh border, bg calendar.dropValid.
  Auto-scroll: calendar scrolls when drag is within 40px of top/bottom viewport edge.

STATE: valid-drop-target
  Hovered empty cell: bg calendar.dropValid; border 1px calendar.dropValidBorder.

STATE: invalid-drop-target
  Hovered occupied (non-own) cell: bg calendar.dropInvalid; border 1px error; X icon 16px centered.

STATE: conflict-drop-target
  Hovered cell where dropping would create a conflict: calendar.conflictHatch bg + 2px error border.
  On release: opens confirmation that resolving via O.11 is required.

STATE: confirm-modal (on drop in valid cell)
  Modal sheet 390px wide: title "Reschedule to {time}?"; body "{weekday} {date MM/DD} at {H:MM AM}"; notify-client SMS toggle (default ON); Cancel secondary + Reschedule primary.

STATE: snap-back-animation
  On invalid drop or cancel: spring animation 200ms back to origin cell.

REDUCE-MOTION FALLBACK (prefers-reduced-motion = reduce)
  - No opacity shadow trail.
  - Instant position snap instead of spring.
  - No charging arc animation.
  - Confirmation modal still shown.
  - Haptic unchanged.

ALTERNATIVE INTERACTION (screen reader / no drag)
  Long-press on block → context menu "Reschedule" → time picker modal (no drag required).

STATES: idle, long-press-charging, dragging, valid-drop, invalid-drop, conflict-drop, confirm-modal, snap-back.
```

## SCREEN — O.3 Booking Detail Admin View

```text
SCREEN: Booking Detail (Admin)    DEVICE: iPad + iPhone
LAYOUT
- Header: back chevron + "Calendar" label; center: status pill (booking.[status] bg tint + booking.[status] text + status label); right: booking # mono caption + kebab (Print / Copy booking ID).
- Tab bar: Overview · Timeline · Customer · Notes.

TAB — Overview
- Client mini-row: avatar 48px + name bodyLarge + phone (US format XXX-XXX-XXXX) caption.
- Info grid 2-column: Salon · Service · Staff · Date (MM/DD/YYYY) · Time (H:MM AM) · Duration · Price $ · Payment status badge.
- Payment card (surface bg, 1px border, radius 16): method + last 4 digits + amount + Paid/Unpaid/Partially Paid badge.

TAB — Timeline
- Vertical scroll. Each event = one audit-timeline-row (see component spec).
- Events in order: pending → confirmed → reminder-sent (system) → checked-in → completed → tip-added → review-left.
- Cancelled / no-show / rescheduled events inserted at correct chronological position.
- System events: actor label "System", dot grey, italic.

TAB — Customer
- Lifetime stats: 4 KPI chips in a row — Visits · Total Spend · Avg Rating · Last Visit.
- Visit history list: last 5 rows, each: date MM/DD/YYYY + service + amount $ + status pill.

TAB — Notes
- Chronological list of notes: author avatar 24px + name label-small + timestamp caption + note body.
- Add note: inline TextArea at bottom (placeholder "Add a note…") + Save button.

ACTION ROW (fixed bottom, 64px, surface bg, 1px top border)
- Reschedule (secondary, disabled when status completed/cancelled/no_show)
- Cancel (secondary destructive, disabled when status completed/cancelled/no_show)
- Mark No-Show (secondary destructive, enabled only when status confirmed/rescheduled)
- Refund (secondary, enabled only when payment exists)
- Message (secondary)
- Rebook (primary)

STATES: confirmed, completed, cancelled, no-show, refunded, error.
```

## SCREEN — O.4 Manual Booking Creation (Phone-in / Walk-in)

```text
SCREEN: New Manual Booking    DEVICE: iPad + iPhone
LAYOUT
- Header: X close left; title "New Booking" center.
- Two-column on iPad: left 340px step form (scrollable); right: live booking summary card (sticky, updates as steps complete).
- Single column on iPhone: step form full-width; summary collapses to compact bar pinned above footer CTA.

STEP INDICATOR (horizontal pills 1–6): Client · Service · Staff · Date & Time · Payment · Notes.

STEP 1 — Client
- Search input (placeholder "Search by name or phone…", debounce 300ms).
- Results list: avatar 36px + name + phone US + last visit caption.
- Client-not-found state: "No results. Create new client?" link → expands inline form: Phone (primary, format (XXX) XXX-XXXX, required) · First name · Last name · Email (optional).

STEP 2 — Service
- Service card list: name bodyMedium + category pill + duration caption + price $ right-aligned. Selectable (primary border when selected).

STEP 3 — Staff
- Staff card list: avatar 40px + name + role caption + availability indicator (green dot = available for selected time, grey = unavailable). Selectable.

STEP 4 — Date & Time
- Inline month calendar (same style as consumer C.3). Dates with availability shown in coral; unavailable greyed.
- Time slot chip grid below calendar. Unavailable slots greyed + "Full" caption.

STEP 5 — Payment
- Three radio options with description body-small:
    Skip payment — collect at appointment.
    Charge now — charge card on file immediately.
    Mark as charge-later — flag for checkout collection.

STEP 6 — Notes
- TextArea "Internal notes" maxLength 500.

RIGHT SUMMARY CARD (iPad only)
- Shows: selected client name · service · staff · date MM/DD/YYYY · time H:MM AM · price $. Empty fields highlighted amber.
- Conflict warning inline if slot has conflict.

FOOTER CTA: "Create Booking" primary (disabled until Steps 1–4 complete).
STATES: default, client-not-found, validation-error (field-level inline), conflict (conflict banner + resolve prompt), submitting (spinner on CTA), success → navigate to O.3, error.
```

## SCREEN — O.5 Block Time / Hold Slot

```text
SCREEN: Block Time    DEVICE: iPad right panel 640×768 / iPhone modal-sheet
LAYOUT
- Header: X close; title "Block Time".
- Form scrollable:
    Location — dropdown (required).
    Staff — multi-select picker (required; selecting multiple creates one block per member).
    Resource — multi-select picker optional (e.g. Room A, Chair 2).
    Date — DateRangePicker. Single day default; range allowed.
    Time — two time pickers side-by-side: Start / End (12h format, 15-min increments).
    Reason — dropdown: Lunch break · Training · Sick / Personal · Maintenance · Other (required).
    Recurrence — radio: One time · Daily · Weekly.
      If Daily or Weekly: "Until" date picker shown below.
      If Weekly: day-of-week checkboxes shown (Mon–Sun).

- Conflict banner (warning 15% bg, 4px left warning border): "{N} existing bookings overlap this block. Tap to see affected." Only visible when conflict detected.

FOOTER: "Block Time" primary full-width.

STATES: default, conflict-warning (banner + "See affected bookings" link), confirmed (success toast + dismiss), error.
```

## SCREEN — O.6 Override / Force-Book Confirmation

```text
SCREEN: Force-Book Confirm    DEVICE: modal-sheet (390×auto, border-radius 20 top)
LAYOUT
- Handle bar 36×4px centered, margin-top 12.
- Header: warning icon ⚠ 24px error color + title "Override Policy" bodyLarge bold.
- Booking summary card (surface bg, 1px warning border, radius 12): the slot being forced — date MM/DD/YYYY + time H:MM AM + staff name + service.
- force-book-reason-form embedded (see component spec):
    Warning banner: error 10% bg, 4px left error border, icon + "This booking violates your capacity or availability policy. A reason is required and will be logged."
    Reason dropdown (required): VIP / priority client · Emergency · Owner override · System error correction · Other.
    Notes textarea (required, min 20 chars): helper text "Minimum 20 characters". Character counter shown.
    Acknowledge checkbox bold: "I take responsibility for this override and understand it will be audited."
- Footer: Cancel secondary + "Force Book" primary destructive (disabled until reason + notes ≥ 20 chars + checkbox checked).
STATES: default, submitting (spinner on Force Book, all fields locked), error (inline banner).
```

## SCREEN — O.7 No-Show Marking

```text
SCREEN: Mark No-Show    DEVICE: modal-sheet (390×auto, border-radius 20 top)
LAYOUT
- Handle bar 36×4px.
- Header: title "Mark as No-Show".
- Booking row (compact 1-line): client name bold + service + time H:MM AM — this appointment only, no card.
- Policy card (surface bg, 1px cardBorder, radius 12): "Your no-show policy allows a fee of ${feeAmount}. This amount will be charged to the card on file."
- "Charge no-show fee" toggle (default ON when tenant no-show fee policy active AND payment method on file; default OFF and disabled otherwise). Toggle label: "Charge ${feeAmount} to card on file."
- "Notify client" toggle (default ON): sends automated no-show notification via SMS/email.
- Charge-failed banner (error 10% bg, 4px left error border): "Card charge failed. Booking will be marked no-show without fee collection." Only shown in charge-failed state.
- Footer: Cancel secondary + "Mark as No-Show" primary destructive.
STATES: default, charging (spinner on CTA + fields locked), charged (success toast — fee collected), charge-failed (banner shown, CTA re-enabled to mark without fee), error.
```

## SCREEN — O.8 Cancellation Handling + Fee Enforcement

```text
SCREEN: Cancel Booking (Admin)    DEVICE: modal-sheet (390×auto, border-radius 20 top)
LAYOUT
- Handle bar 36×4px.
- Header: title "Cancel Booking".
- Refund preview card (surface bg, 1px cardBorder, radius 12):
    Row: "Total paid"          $X.XX
    Row: "Cancellation fee"    $Y.YY  (error color)
    Divider.
    Row: "Amount to refund"    $Z.ZZ  (success color, bold)
  Fee-waived variant: "Cancellation fee" row shows "$0.00 (Waived)" with "Waived" success badge; Amount to refund = Total paid.
- Manager override: "Waive cancellation fee" toggle. Role-gated: lock icon + tooltip "Requires Location Manager or Owner role" when insufficient. Visible to all but only interactive with correct role.
- Reason picker dropdown (required): Client request · Client no-show · Staff unavailable · Emergency · Other.
- "Notify client" toggle (default ON).
- Footer: "Keep Booking" secondary + "Cancel Booking" primary destructive.
- Refund-issued state: success toast "Refund issued — typically 3–5 business days", modal dismisses.
STATES: default, fee-waived (override toggle active, card updates), submitting, refund-issued (toast), error (inline banner).
```

## SCREEN — O.9 Rebook / Reschedule on Behalf

```text
SCREEN: Rebook    DEVICE: iPad 720×768 panel / iPhone full-screen
LAYOUT
- Header: back / close; title "Reschedule on Behalf".
- Original appointment summary card (surface bg, 1px cardBorder, radius 12): "Original appointment" label-small muted uppercase + date MM/DD/YYYY + time H:MM AM + service + staff.
- "Change staff member" link (if staff change allowed by policy).
- Date picker: inline month calendar (same style as O.4 Step 4 / consumer C.3). Original date pre-highlighted with muted ring.
- Time slot chip grid: loads slots for selected staff + date. Unavailable greyed.
- Conflict banner (warning 15% bg): "This slot is unavailable. Choose a different time."
- "Notify client via SMS" toggle (default ON).
- Payment note caption: "Payment defaults to original method on file."
- Footer: "Confirm Rebook" primary.
STATES: default, conflict (banner), submitting, success (success toast + navigate to O.3), error.
```

## SCREEN — O.10 Recurring Booking Management

```text
SCREEN: Recurring Series    DEVICE: iPad + iPhone
LAYOUT
- Header: title "Recurring Booking"; status badge right — Active (#4CAF50 bg tint) / Paused (#FF9800 bg tint) / Ended (#9CA3AF bg tint).
- Series controls (header right, kebab or inline): "Pause series" / "Resume series" / "End series" (destructive). Confirm modal for each destructive action.
- Series summary card (surface bg, 1px border, radius 16): service + staff + frequency label (e.g. "Every Monday at 9:00 AM") + Start date MM/DD/YYYY + end date MM/DD/YYYY or "Ongoing".
- Occurrence list (FlatList): rows 56px. Each row: date MM/DD/YYYY + time H:MM AM + status pill (booking.[status] bg tint + text) + "Edit" link right.
- Tap "Edit" on any occurrence → Edit-scope modal-sheet:
    Title "Edit which appointments?" + two radio options:
      "This appointment only" — description "Only this occurrence will be changed."
      "This and all future" — description "All upcoming occurrences will be updated."
    Conflict variant (when edit-all causes conflicts): warning banner "{N} future appointments have conflicts. Resolve conflicts before applying." + "Resolve conflicts" link → O.11.
    Footer: Cancel secondary + Continue primary.
STATES: active, paused, ended, conflict-on-edit-all (banner in modal), error.
```

## SCREEN — O.11 Slot-Engine Conflict Resolution

```text
SCREEN: Conflict Resolver    DEVICE: modal-sheet iPad 640×768 centered / iPhone full-screen 390×auto
LAYOUT
- Handle bar 36×4px.
- Header: title "Booking Conflicts"; subtitle "{N} conflicts to resolve" caption muted.
- Scrollable conflict list. Each conflict row (card, surface bg, 1px cardBorder, radius 12, margin-bottom 12):
    "Appointment A" label-small muted: time + service + client + staff.
    "Appointment B" label-small muted: time + service + client + staff.
    Fix chips (horizontal scroll row, 4 chips):
      "Move −15 min" (secondary chip)
      "Move +15 min" (secondary chip)
      "Reassign staff" (secondary chip → opens staff picker sheet)
      "Cancel this booking" (destructive chip)
    Selected chip: primary border 1px + checkmark icon 12px left.
- Progress line (44px sticky bottom of list area): "{X} of {N} resolved" caption.
- Footer (fixed): "Apply All Resolutions" primary full-width (disabled until all rows have a selection) + "Dismiss" secondary link.
- Applying state: spinner on Apply All, all chips locked.
- Applied state: success toast "All conflicts resolved", modal dismisses.
STATES: open, applying (spinner), applied (toast + dismiss), error (inline error banner on failed row).
```

---

## COMPONENTS

```text
master-calendar-grid — multi-resource grid: staff columns or rooms columns (toggled by header control).
  Structure: time column 56px sticky left (mono caption, 30-min labels) + resource header row 56px sticky top (avatar 28px + name label-small) + scrollable cell body.
  Cell dimensions: 32px per 15-min subdivision (64px per 30 min, 128px per 60 min).
  Appointment block: left 3px border booking.[status]; bg booking.[status] tint; radius 4; padding 6h × 4v; label "{H:MM AM} · {service} · {client}" mono start-time + regular service+client truncated.
  Blocked-time cell: booking.blockedTimeBg fill; 1px dashed #9CA3AF border; diagonal hatch at 45° 4px spacing; reason label center caption muted.
  Conflict cell: 2px solid error border; calendar.conflictHatch fill.
  Now-line: 1px solid calendar.nowLine spanning all resource columns; 8px filled dot on left edge at time column.
  Empty cell press: opens O.4 pre-filled with tapped date and time.
  Horizontal scroll for many resources; vertical scroll for time range.
  Loading skeleton: grey shimmer rectangles at realistic appointment positions.

drag-shadow / drop-target — embedded within master-calendar-grid.
  Trigger: long-press 200ms (progress arc ring 1px primary, 16px radius at block corner).
  Active drag: clone block at 50% opacity follows pointer; snaps to 15-min grid (32px vertical).
  Origin cell: 1px dashed mint-fresh border + calendar.dropValid bg.
  Valid target cell: 1px solid mint-fresh border + calendar.dropValid bg (20% mint).
  Invalid target cell: 1px solid error + calendar.dropInvalid bg + X icon 16px error centered.
  Conflict target cell: 2px solid error + calendar.conflictHatch bg.
  On valid release: confirmation modal (new time + notify toggle ON + Cancel/Reschedule).
  On invalid release: spring snap-back 200ms ease-out.
  Reduce-motion: no shadow trail; immediate snap; no arc animation; modal still required.
  Accessibility alternative: long-press → context menu "Reschedule" → time picker (no drag).

conflict-resolution-modal — scrollable list of conflict-pair rows.
  Each row: card surface bg + 1px border + radius 12 + padding 16. Top section shows both clashing appointments (label-small muted "Appointment A / B" + time + service + client + staff). Fix chips horizontal scrollable row (4 chips: Move −15 min, Move +15 min, Reassign staff, Cancel one). Selected chip: 1px primary border + leading check icon 12px.
  Footer: progress caption "{X} of {N} resolved" + "Apply All" primary (disabled until all resolved) + "Dismiss" secondary link.
  Reassign staff chip: opens nested bottom-sheet staff picker; selection updates chip label.

force-book-reason-form — embedded form for modal O.6.
  Warning banner: error 10% bg + 4px left solid error border + warning icon 20px + body text. Locked; user cannot dismiss.
  Reason dropdown: required; options VIP · Emergency · Owner override · System error correction · Other.
  Notes textarea: required; min 20 chars; max 500 chars; real-time character counter (e.g. "47 / 500"); helper text "Minimum 20 characters" in error color until met.
  Acknowledge checkbox: large 24px checkbox; bold label "I take responsibility for this override and understand it will be audited." Checkbox border error color when unchecked and form is invalid.
  Submit gate: CTA disabled until all three valid (reason selected + notes ≥ 20 chars + checkbox checked).

audit-timeline-row — single event entry in a vertical timeline (used in O.3 Timeline tab).
  Layout two-column:
    Left column 24px: 10px filled circle dot (color = booking.[status] of event); 2px connector line top+bottom (audit.connector color; suppressed for first/last row respectively).
    Right column padding-left 12: action label bodyMedium (audit.timelineText) + actor line label-small muted "{role} · {name}" (audit.actorText) + timestamp mono label-small (audit.timestamp) "h:mm A MM/DD/YYYY".
    Optional note below timestamp: caption muted italic, margin-top 2.
  System event variant: dot #9CA3AF grey; actor label "System" italic.
  Error event variant: dot error red; label error color.
```

---

## STRINGS (key reference for all copy in this batch)

```text
masterCalendar.screenTitle, viewDay, viewWeek, viewMonth, viewStaff, viewRooms, today, newBooking, blockTime, fullyBookedBanner, filterLocation, filterStaff, filterResource, filterReset, loadingLabel, errorMessage, noBookingsMessage

dragReschedule.confirmTitle ("{time}"), confirmBody ("{weekday} {date} at {time}"), notifyClient, confirm, cancel, conflictMessage

bookingDetail.screenTitle, back, tabOverview, tabTimeline, tabCustomer, tabNotes, addNotePlaceholder, actionReschedule, actionCancel, actionNoShow, actionRefund, actionMessage, actionRebook, copyId, print

manualBooking.screenTitle, title, stepClient, stepService, stepStaff, stepDateTime, stepPayment, stepNotes, clientSearchPlaceholder, createNewClient, paySkip, paySkipDesc, payNow, payNowDesc, payLater, payLaterDesc, notesLabel, createBooking, conflictBanner, successMessage

blockTime.screenTitle, title, locationLabel, staffLabel, resourceLabel, resourceOptional, dateRangeLabel, timeLabel, reasonLabel, reasonLunch, reasonTraining, reasonSick, reasonMaintenance, reasonOther, recurrenceLabel, recurrenceNone, recurrenceDaily, recurrenceWeekly, recurrenceUntilLabel, conflictBanner ("{N} bookings affected"), submit, successMessage

forceBook.screenTitle, title, warningBanner, reasonLabel, reasonVIP, reasonEmergency, reasonOwnerOverride, reasonSystemError, reasonOther, notesLabel, notesPlaceholder, notesHelper, acknowledgeLabel, cancel, confirmForceBook

noShow.screenTitle, title, policyBody ("${feeAmount}"), chargeFeeLabel, chargeFeeDescription ("${feeAmount}"), notifyClientLabel, chargeFailedBanner, cancel, confirm

cancelAdmin.screenTitle, title, totalPaid, feeRetained, amountRefunded, feeWaivedBadge, waiveFeeToggle, waiveFeeDesc, reasonLabel, reasonClientRequest, reasonNoShow, reasonStaffUnavailable, reasonEmergency, reasonOther, notifyClientLabel, keepBooking, confirmCancel, refundIssuedToast

rebook.screenTitle, title, originalLabel, changeStaff, conflictBanner, notifyClientLabel, paymentNote, confirm

recurringBooking.screenTitle, title, pauseSeries, resumeSeries, endSeries, editScopeTitle, editThisOnly, editThisOnlyDesc, editAllFuture, editAllFutureDesc, editAllConflictBanner ("{N} conflicts"), occurrenceCount ("{N} appointments"), statusActive, statusPaused, statusEnded

conflictResolver.screenTitle, title, subtitle ("{N} conflicts"), resolved ("{X} of {N}"), moveEarlier, moveLater, reassignStaff, cancelOne, applyAll, dismiss, successToast
```

---

## Human Review Checklist

- [ ] All 11 screens + 5 components delivered.
- [ ] iPad master calendar renders correctly at all 3 view modes (Day / Week / Month).
- [ ] Appointment blocks use booking.[status] color tokens — not hardcoded hex.
- [ ] Now-line visible in day and week views; absent in month view.
- [ ] Month heat scale applies correct calendar.monthHeat* tokens by booking count.
- [ ] Drag interaction documents all 8 states (idle, charging, dragging, valid, invalid, conflict, confirm, snap-back).
- [ ] Reduce-motion fallback explicitly shown as a separate annotated state.
- [ ] Alternative no-drag interaction shown for accessibility.
- [ ] Force-book form CTA locked until all three fields valid (reason + notes ≥ 20 + checkbox).
- [ ] No-show charge toggle defaults ON when policy active + card on file; disabled when neither.
- [ ] Cancel modal always shows refund preview before the destructive CTA is reachable.
- [ ] Manager fee-waive toggle has lock icon + tooltip for insufficient roles.
- [ ] Recurring series edit-scope modal shows conflict warning when edit-all conflicts exist.
- [ ] Conflict resolver Apply All disabled until every row has a selected fix.
- [ ] All dates MM/DD/YYYY; all times 12-hour with AM/PM; all currency USD.
- [ ] Frames named O-<screen>-<state> (e.g. O-1-day-default, O-6-submitting, O-8-fee-waived).
