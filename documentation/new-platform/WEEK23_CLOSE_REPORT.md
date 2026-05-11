# Week 23 Close Report — Batch C: Booking Flow (Consumer UI)

**Window:** Week 23 (Phase 2 consumer-UI third sprint).
**Status:** ✅ Complete — all 11 screens (C.1–C.11) and all 6 new shared-UI primitives delivered + tested — GO for Week 24.
**Predecessor:** [WEEK22_CLOSE_REPORT.md](WEEK22_CLOSE_REPORT.md).

## 1. Scope

Per [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md) and the Batch-C build spec (Figma artifacts now locked under [../../design-handoff/](../../design-handoff/)), W23 ships the consumer booking funnel from service selection through confirmation, plus the manage-booking and guest-checkout / post-booking-upgrade adjuncts.

W23 was unblocked by Batch C Figma-artifact handoff at the start of the sprint:

- [components/calendar-grid.json](../../design-handoff/components/calendar-grid.json) (Prompt A)
- [components/time-slot-chip.json](../../design-handoff/components/time-slot-chip.json) (Prompt B)
- [specs/screen-booking-date-picker.json](../../design-handoff/specs/screen-booking-date-picker.json) (Prompt C — C.3)
- [specs/screen-booking-time-picker.json](../../design-handoff/specs/screen-booking-time-picker.json) (Prompt D — C.4)

Each artifact carries a `source` block tracking `batch="C"`, the originating Figma frame(s), the `promotedFrom` path, and `lockedAt="2026-04-27"`.

## 2. Features Delivered

### 2.1 Foundation — `src/shared/ui/` (6 new primitives)

| Primitive | Surface |
|-----------|---------|
| `CalendarGrid` | 7×6 month grid, Sunday-start, per-cell `today` / `selected` / `disabled` / `holiday` / availability states; ISO-keyed availability map; `onSelectDate(date)` callback. Holiday dot rendered 4×4 (bumped from spec's 2×2 for visibility — recorded in spec accessibility callout). |
| `TimeSlotChip` | 80×44 chip with `default` / `selected` / `disabled` / `pressed` states and US-12h text. Height bumped from spec's 40 → 44 to satisfy WCAG 2.1 AA 44pt min touch target. |
| `SummaryRow` | Label + value (or `subValue` / `trailing`) + optional chevron + `onPress`; bottom 1px divider toggleable via `noDivider`. |
| `StickyFooterCta` | Surface white, top border, padding 16 + safe-area approximation; full-width 48h primary `Button`; optional total-amount row above the CTA. Distinct from W22 `StickyCtaBar` (which renders a secondary inline button). |
| `ModalSheet` | Generic bottom-sheet shell — drag handle, optional title-row with ✕ close, scrollable body, optional sticky footer slot. Distinct from W22 `FilterSheet` (filter-specific reset/apply). |
| `PolicyAcknowledgement` | Checkbox + wrapping label row with required-state error message. `accessibilityRole="checkbox"`. |

All primitives reuse W21 design tokens unchanged (`src/shared/ui/tokens.ts`). All are props-driven, have no business knowledge, and are reusable for Batch D onward.

### 2.2 Pure helpers — `src/app/booking/bookingHelpers.ts`

Domain-typed booking-flow helpers. Zero React imports — fully testable without a renderer. Exports:

- **Types:** `BookingStep`, `BookingService`, `BookingAddOn`, `BookingStaffOption`, `BookingPriceBreakdown`, `BookingStatus`, `TimeSegment`.
- **Constants:** `BOOKING_STEPS` (8-step ordered flow), `TIME_SEGMENT_LABELS`, `BOOKING_STATUS_LABELS`.
- **Date / time formatters (US-locale, locked):** `formatLongDateLabel` ("Wednesday, March 12"), `formatShortDateLabel` ("Wed, Mar 12"), `formatUsDate` ("03/12/2026"), `formatTimeOfDay` (12h "h:mm AM/PM"), `parseTimeOfDay` (NaN-on-bad-input).
- **Slot logic:** `categorizeTimeSlot` (morning < 12 PM ≤ afternoon < 5 PM ≤ evening), `groupTimeSlotsBySegment`, `generateTimeSlots(start, end, step)`.
- **Pricing:** `computeBookingTotal({ services, addOns, taxRate, tip })` — tax + total rounded to cents.
- **Currency / phone:** `formatUsd` ("$1,234.50"), `formatPhoneUs` ("(555) 123-4567" — pass-through if not 10 digits).
- **Cancellation:** `computeCancellationRefund({ total, fee })` — clamped at 0, fee clamped at 0.

### 2.3 Screens — `src/app/booking/` (11 screens)

| Screen | File | Composition |
|--------|------|-------------|
| **C.1 Service Selection** | `ServiceSelectionScreen.tsx` | Grouped service list with checkbox cards, inline add-on chip row when card selected, error/loading/max-reached banners, sticky footer with selected count + total. |
| **C.2 Staff Selection** | `StaffSelectionScreen.tsx` | "Any available" anchor card on top, then staff cards with `RatingStars` + specialties + next-availability + on-leave badge; tapping a card surfaces 3 preview `TimeSlotChip` slots inline. |
| **C.3 Date Picker** | `BookingDatePickerScreen.tsx` | Locked spec [screen-booking-date-picker.json](../../design-handoff/specs/screen-booking-date-picker.json). Quick-pick chips (Today / Tomorrow / This weekend) + month switcher + `CalendarGrid` + selected-date info + sticky footer. Holiday banner + skeleton loading + error retry. |
| **C.4 Time Picker** | `BookingTimePickerScreen.tsx` | Locked spec [screen-booking-time-picker.json](../../design-handoff/specs/screen-booking-time-picker.json). Date label + `SegmentedControl` (Morning / Afternoon / Evening) + `TimeSlotChip` 3-col grid via `groupTimeSlotsBySegment` + timezone note + sticky footer. Empty-state with "Try another day" CTA. |
| **C.5 Review** | `BookingReviewScreen.tsx` | Salon mini-card + `SummaryRow` stack (services / add-ons / staff / date+time / duration with `editable` chevrons that route back to earlier steps) + notes `TextInput` + promo-code chip + price breakdown + sticky footer. |
| **C.6 Policies** | `BookingPoliciesScreen.tsx` | `ModalSheet` with cancellation / no-show / house policy sections + `PolicyAcknowledgement` required-checkbox + Agree-and-continue CTA. |
| **C.7 Payment** | `BookingPaymentScreen.tsx` | Apple Pay button (when available) + saved-card radio rows + dashed "Add new payment method" tile + total breakdown + sticky Confirm-and-pay CTA. |
| **C.8 Confirmation** | `BookingConfirmationScreen.tsx` | Mint-fresh success circle ✓ + confirmation # + summary card + action row (📅 Calendar / 📍 Directions / 💬 Message) + Manage / Done footer. |
| **C.9 Manage Booking** | `ManageBookingScreen.tsx` | Status banner + booking-id + summary card + action list (Reschedule / Message / Directions / Cancel) + Cancel `ModalSheet` preview using `computeCancellationRefund` to show fee + refund before confirmation. |
| **C.10 Guest Contact** | `GuestContactScreen.tsx` | Guest contact form (firstName / lastName / email / phone with auto-format via `formatPhoneUs`) + SMS-reminders consent toggle defaulting to OFF per TCPA. Optional sign-in banner. |
| **C.11 Post-Booking Upgrade** | `PostBookingUpgradeScreen.tsx` | `ModalSheet` shown after a guest booking finishes — benefits list + Create-account CTA + Not-now dismiss. Caller controls visibility. |

### 2.4 Routes

Eleven new public `guard: "none"` routes appended to `src/app/navigation/routes.ts`:

`BookingService` `/book/service`, `BookingStaff` `/book/staff`, `BookingDate` `/book/date`, `BookingTime` `/book/time`, `BookingReview` `/book/review`, `BookingPolicies` `/book/policies`, `BookingPayment` `/book/payment`, `BookingConfirmation` `/book/confirmation`, `ManageBooking` `/book/manage`, `GuestContact` `/book/guest`, `PostBookingUpgrade` `/book/upgrade`.

Anonymous-route ordering snapshot in `routes.test.ts` updated to include the 11 new entries.

## 3. Tests

- **Root jest:** 1,844 → **1,904** passing across 121 → **124** suites (+60 tests, +3 suites).
- **Functions vitest:** **187** passing across 14 suites (unchanged — Batch C is consumer-UI only).
- **`npx tsc --noEmit`** (root): 0 errors. **`cd functions; npx tsc --noEmit`**: 0 errors.

New suites:

- `src/shared/ui/__tests__/booking-primitives.test.tsx` — 16 cases covering all 6 W23 primitives (states, a11y labels, callbacks).
- `src/app/booking/__tests__/bookingHelpers.test.ts` — 21 cases covering all helper functions including TCPA / refund-clamp / NaN behaviours.
- `src/app/booking/__tests__/bookingScreens.test.tsx` — 23 smoke cases covering all 11 screens (continue-disabled gating, callback wiring, key state branches).

## 4. Security

- No Firestore rules changes. All screens are props-driven and own no Firestore I/O; persistence is W23-DEBT-1 (next sprint).
- TCPA: `GuestContactScreen` SMS-reminders toggle defaults to OFF and renders the Standard-rates / STOP-to-opt-out copy inline. Consent state is a dedicated boolean on `GuestContactValues`.
- No PCI scope: `BookingPaymentScreen` is a pure picker over saved cards + Apple Pay / Add-card placeholders. Stripe in-flow integration is W23-DEBT-2 — when implemented, card data will only ever flow through Stripe Elements / PaymentSheet, never our screens.
- WCAG 2.1 AA preserved: every interactive ≥ 44×44 (TimeSlotChip bumped from spec's 40 → 44), `PolicyAcknowledgement` uses `accessibilityRole="checkbox"`, `CalendarGrid` cells expose date + selected + disabled state in their accessibility label, `ModalSheet` close + scrim are both labelled "Close".
- US-primary defaults retained: $ price labels via `formatUsd`, MM/DD/YYYY where dates appear, 12h "h:mm AM/PM" via `formatTimeOfDay`, `(XXX) XXX-XXXX` via `formatPhoneUs`.

## 5. Architectural Notes

- All screens are props-driven and accept their data as inputs. No screen reads from a singleton or Firestore directly — caller (navigator layer) wires data + dispatch handlers in. This keeps screen tests render-without-provider and mirrors the W22 pattern.
- `bookingHelpers.ts` has zero React / I/O coupling so the same pricing / formatting / categorisation logic can later be reused server-side (cloud-functions price recompute) or in admin-app review screens without rewrites.
- `StickyFooterCta` was authored as a distinct primitive from W22's `StickyCtaBar` rather than enhancing the W22 primitive — `StickyFooterCta` is total-amount + primary CTA, `StickyCtaBar` is primary + secondary inline. Composing them into one would have widened the W22 contract for callers that don't need totals.
- `ModalSheet` is a generic bottom-sheet shell deliberately kept separate from W22's `FilterSheet` (which has filter-specific reset/apply semantics). C.6 / C.9 / C.11 each use `ModalSheet` with a custom `footer` slot.
- `CalendarGrid` builds its 7×6 grid via `width: ${100/7}%` flex children rather than a flex-grid library — keeps W23 dependency-free and gives free a11y semantics.
- Skeleton loading on `BookingDatePickerScreen` and `BookingTimePickerScreen` uses pure View shells — no animation library — to keep shimmer / pulse work for a later debt entry if visual designers ask for it.

## 6. Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))

- **Closed (1):** W22-DEBT-2 (`getSalonProfile(salonId)` port) — superseded; W23 screens accept their salon / services / staff / pricing as inputs from the navigator layer, so there is no longer a screen-level dependency on a `getSalonProfile` adapter. The actual repository surface remains unbuilt and is rolled into the larger W23-DEBT-1 below.
- **New W23 debts (3):**
  - **W23-DEBT-1** — Booking persistence + cloud-function flow (`createBookingDraft`, `confirmBooking`, `cancelBooking`, `rescheduleBooking`, `getBookingsForUser`) and the salon-profile / services / staff / availability read ports needed to feed C.1–C.4 and C.9 from real data. Target W24+.
  - **W23-DEBT-2** — Stripe in-flow payment (PaymentSheet / Apple Pay merchant validation / saved-card management + 3DS / SCA). Today `BookingPaymentScreen` is purely a picker over caller-supplied saved-cards. Target W24 Batch D.
  - **W23-DEBT-3** — Cancel / reschedule mutation backend + audit trail and refund processor wiring. `ManageBookingScreen` already shows the refund preview via `computeCancellationRefund`; the actual side-effect is deferred. Target alongside W23-DEBT-1.
- **Carried forward:** W19-DEBT-4, W19-DEBT-5, W20-DEBT-2, W20-DEBT-3, W20-DEBT-4, W22-DEBT-1 (react-native-maps W28), W22-DEBT-3 (editorial / sponsored feed repository).

## 7. Index — Changed Files

- **New (production):** `src/shared/ui/{CalendarGrid,TimeSlotChip,SummaryRow,StickyFooterCta,ModalSheet,PolicyAcknowledgement}.tsx`; `src/app/booking/{ServiceSelectionScreen,StaffSelectionScreen,BookingDatePickerScreen,BookingTimePickerScreen,BookingReviewScreen,BookingPoliciesScreen,BookingPaymentScreen,BookingConfirmationScreen,ManageBookingScreen,GuestContactScreen,PostBookingUpgradeScreen}.tsx`; `src/app/booking/bookingHelpers.ts`.
- **New (tests):** `src/shared/ui/__tests__/booking-primitives.test.tsx`; `src/app/booking/__tests__/{bookingHelpers.test.ts,bookingScreens.test.tsx}`.
- **New (design-handoff):** `design-handoff/components/{calendar-grid,time-slot-chip}.json`; `design-handoff/specs/{screen-booking-date-picker,screen-booking-time-picker}.json`.
- **Modified:** `src/shared/ui/index.ts` (W23 primitive exports + types under "// W23 Batch C primitives" comment); `src/app/navigation/routes.ts` (+11 public `/book/*` routes); `src/app/navigation/__tests__/routes.test.ts` (anonymous-route snapshot extended); `design-handoff/HANDOFF_MANIFEST.md` (4 rows: 2 component + 2 screen); `documentation/new-platform/WEEKLY_LOG.md`; `documentation/PROGRAM_TRACKING_BOARD.md`.

## 8. Next-Week Prerequisites (Week 24)

W24 (Batch D — Booking Backend + Stripe) inherits W21 + W22 + W23 primitives unchanged plus the new `bookingHelpers` module. Prerequisites:

- W23-DEBT-1 read ports (`getSalonAvailability`, `getServiceCatalog`, `getStaffOptions`) gate live data on C.1–C.4. Without them, the navigator wires mock data.
- W23-DEBT-1 write ports (`createBookingDraft`, `confirmBooking`) gate end-to-end booking submission. C.5 → C.6 → C.7 → C.8 currently chain via prop callbacks only.
- W23-DEBT-2 (Stripe PaymentSheet + Apple Pay merchant validation) gates real payment capture in C.7. Until then, the Confirm-and-pay CTA is a no-op placeholder.
- W23-DEBT-3 (cancel + reschedule mutations) gates C.9 manage actions; the refund preview math is already shipped.

Phase 2 consumer-UI core flow (auth → discover → booking) is now feature-complete on the screen layer. W24+ shifts emphasis to the data + payment layer that backs these screens.

