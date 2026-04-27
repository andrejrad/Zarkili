# Batch C — Booking Flow

> Consumed by **Week 23**. Critical path. Highest-value batch — booking is the core monetized path.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Screens: Service selection · Staff selection · Date picker · Time-slot picker · Booking review · Policies & cancellation acknowledgement · In-flow payment selection · Booking confirmation · Manage booking · Guest booking variant · Post-booking upgrade prompt.

New components: `calendar-grid`, `time-slot-chip`, `summary-row`, `sticky-footer-cta`, `modal-sheet`, `policy-acknowledgement`.

---

## SCREEN — C.1 Service Selection

```text
SCREEN: Service Selection    DEVICE: iPhone 14 390×844
PERSONA: Consumer with chosen salon.
USER JOB: Pick one or more services + add-ons.

LAYOUT
- Header: back, title "Choose services", step indicator 1/5.
- Body: list of service-card grouped by category with collapsible section headers.
  Each card: title, duration, price (USD), checkbox right (or stepper for quantity).
- Add-on chips inside selected card (multi-select, +$ shown).
- Sticky footer (sticky-footer-cta): selected count + total ($ USD) + "Continue" primary button.
STATES: default, none-selected (CTA disabled), max-reached banner (if duration > salon limit), error, loading.
```

---

## SCREEN — C.2 Staff Selection

```text
SCREEN: Staff Selection    DEVICE: iPhone 14 390×844
USER JOB: Pick "Any available" or specific staff member.

LAYOUT
- Header: back, "Choose staff", step 2/5.
- Top card "Any available" (radius large, mint-fresh accent border when selected).
- Body: vertical list of staff cards (avatar 56, name, rating, specialties chip-row, next available slot label-small).
  Tap card → expand inline showing earliest 3 slots (time-slot-chip preview).
- Sticky footer "Continue".
STATES: default, all-staff-unavailable (banner + "Try a different date"), loading, error, staff-on-leave (badge "Back Mar 12").
```

---

## SCREEN — C.3 Date Picker

```text
SCREEN: Date Picker      DEVICE: iPhone 14 390×844
USER JOB: Pick a date within the salon's bookable window.

LAYOUT
- Header: back, "Pick a date", step 3/5.
- calendar-grid (month view, MM/YYYY format, US week starting Sunday).
- Month switcher (left/right chevrons + month label heading-3).
- Quick-pick chip row above grid: Today · Tomorrow · This weekend.
- Selected date pill below grid + body small "<staff name> has 6 slots".
- Sticky footer "Continue".
STATES: default, fully-booked-day (cells disabled grey), holiday-banner (US holidays — Thanksgiving, Christmas, etc.), loading, error.
ACCESSIBILITY: each cell accessibilityLabel "Wednesday March 12, 6 slots available" or "Sunday March 16, fully booked".
```

---

## SCREEN — C.4 Time-Slot Picker

```text
SCREEN: Time Slot Picker    DEVICE: iPhone 14 390×844
USER JOB: Pick start time.

LAYOUT
- Header: back, "Pick a time", date label heading-3 (e.g., "Wed, Mar 12"), step 4/5.
- Tabs / segmented-control: Morning / Afternoon / Evening.
- Grid of time-slot-chip (3 columns, 12-hour format "9:00 AM"). Disabled chips show strike or grey.
- Below grid: small note "Times shown in <salon's tz, e.g., PT>".
- Sticky footer "Continue".
STATES: default, no-slots ("Try another day" CTA), partially-available (some chips disabled), loading, error.
```

---

## SCREEN — C.5 Booking Review / Summary

```text
SCREEN: Booking Review    DEVICE: iPhone 14 390×844
USER JOB: Confirm all details before paying.

LAYOUT
- Header: back, "Review", step 5/5.
- Salon mini-card (logo + name + address US format).
- Section "Details" — list of summary-row:
  - Service(s) with price
  - Add-ons
  - Staff
  - Date (MM/DD/YYYY) + Time (12h)
  - Duration (e.g., "60 min")
- Section "Notes" — multi-line input (optional, e.g., allergies).
- Section "Promo" — chip "Apply promo code" → opens bottom sheet.
- Section "Price" — line items: subtotal, taxes (US sales tax — Stripe Tax), tip placeholder, total.
- Sticky footer: "Continue to payment" primary CTA.
STATES: default, applying-promo loader, promo-error banner, price-changed banner ("Salon updated price — review again"), loading, error.
```

---

## SCREEN — C.6 Policies & Cancellation Acknowledgement

```text
SCREEN: Policies Acknowledgement    DEVICE: bottom modal-sheet
USER JOB: Read and acknowledge before paying.

LAYOUT
- Drag handle, title "Before you book".
- Scrollable body with sections:
  - Cancellation policy (with cutoff time)
  - No-show fee (US $)
  - Late arrival policy
  - Deposit policy if any
  - ADA accommodation request link
- policy-acknowledgement component: required checkbox "I have read and agree".
- Sticky footer: primary "Agree and continue" disabled until checked.
STATES: default, scrolled-to-bottom (CTA enabled), agreed.
ACCESSIBILITY: full text reachable; checkbox label tappable.
```

---

## SCREEN — C.7 In-Flow Payment Selection

```text
SCREEN: In-Flow Payment Selection    DEVICE: iPhone 14 390×844
USER JOB: Pick saved card or add new (Stripe + Apple Pay + Google Pay).

LAYOUT
- Header back, title "Payment".
- Apple Pay button (top, height 48, official spec).
- Saved cards list (each row: brand icon 32, last4, exp MM/YY, default radio).
- "Add new card" tertiary tile.
- Promo summary row.
- Tip preset chip-row inline preview (linked to D.3).
- Total breakdown summary-row block.
- Sticky footer: "Pay $XX.XX" primary CTA.
STATES: default, no-saved-cards (only Apple Pay + add new), declined banner, processing (spinner + button disabled), 3DS sheet placeholder, success → C.8.
ACCESSIBILITY: Apple Pay button per Apple HIG; CTA includes amount in accessibilityLabel.
```

---

## SCREEN — C.8 Booking Confirmation

```text
SCREEN: Booking Confirmation    DEVICE: iPhone 14 390×844
USER JOB: Reassurance + next-step actions.

LAYOUT
- Hero: success illustration (96, mint-fresh).
- Heading-2 "You're booked".
- Confirmation # label small muted.
- Summary card: salon, date (MM/DD/YYYY), time (12h AM/PM), service, staff, total $.
- Action row: "Add to calendar" (iCal/Google), "Get directions", "Message salon".
- Tertiary "Manage booking" → C.9.
- "Done" sticky CTA → home.
STATES: confirmed (default), pending (deposit awaiting), waitlisted (banner "You're #2 on waitlist").
```

---

## SCREEN — C.9 Manage Booking

```text
SCREEN: Manage Booking     DEVICE: iPhone 14 390×844
LAYOUT
- Header back, title "Booking".
- Status banner (confirmed / pending / cancelled / completed).
- Booking summary card.
- Actions list: Reschedule · Cancel · Contact salon · Add to calendar · Share.
- Cancellation policy snippet with link.
- Footer: secondary "Cancel booking" (destructive variant).

Sub-flows:
- Reschedule → reuses C.3 + C.4.
- Cancel → confirm modal-sheet showing refund amount per policy ("You'll be refunded $X. A $Y fee applies.") + "Yes, cancel" destructive CTA.
STATES: confirmed, cancelled, completed (review CTA), no-show, error, refund-processing.
```

---

## SCREEN — C.10 Guest Booking Variant

```text
SCREEN: Guest Booking     DEVICE: iPhone 14 390×844
USER JOB: Book without creating account.

LAYOUT
- Same flow C.1–C.7 but with "Continue as guest" entry point.
- Guest contact step (between C.5 and C.6): first name, last name, email, US phone, "Send updates by SMS" toggle (off by default — TCPA).
- Confirmation C.8 includes prominent CTA "Save your booking — Create account" → A.8 merge.
STATES: same as authenticated; plus guest-already-exists banner.
```

---

## SCREEN — C.11 Post-Booking Upgrade Prompt

```text
SCREEN: Post-Booking Upgrade Prompt    DEVICE: bottom modal-sheet
PERSONA: Just-booked guest or free user.
USER JOB: Decide whether to create account / start free trial.

LAYOUT
- Illustration (mint-fresh, 80×80).
- Heading-3 "Save 10% on your next visit".
- Bullet list (3 benefits, body 14/20).
- Primary CTA "Create account" → A.2 prefilled.
- Tertiary "Maybe later" dismisses sheet.
STATES: default, creating-account loader, error, success → toast.
```

---

## COMPONENTS

```text
calendar-grid — month grid 7 cols × 6 rows. Header row Sun..Sat (US start). Cell 44×44, label-small. Today: 1px coral-blossom ring. Selected: filled coral-blossom + white text. Disabled: 30% opacity. Holiday: small dot mint-fresh below number.

time-slot-chip — height 40, radius small 8, padding H 12. Default: surface white border #E5E0D1, fg foreground. Selected: bg coral-blossom fg white. Disabled: bg #F5F5F5 fg #B0B0B0 strike-through. accessibilityLabel includes time + AM/PM + availability.

summary-row — left label muted body-small / right value foreground body. Optional trailing chevron for editable rows. Divider 1px border #E5E0D1.

sticky-footer-cta — surface white, top border 1px, padding 16 + safe-area, primary button full-width 48 height. Optional total amount label-large left of CTA.

modal-sheet — bottom sheet 90% / 50% snap. Drag handle 36×4, header row with title + close ✕ 44×44 right. Scroll body. Optional sticky footer.

policy-acknowledgement — full-width tappable row: checkbox 24 + label body 14/20 wrapping. Required state with label-small error if unchecked at submit.
```

---

## Human Review Checklist

- [ ] Tokens exact match.
- [ ] All 11 screens + 6 new components delivered.
- [ ] Date format MM/DD/YYYY throughout; time 12h AM/PM with timezone label.
- [ ] Stripe Tax line shown explicitly (US sales tax).
- [ ] Apple Pay / Google Pay buttons per platform HIG.
- [ ] TCPA-safe: SMS toggle for guests defaults OFF.
- [ ] Cancellation refund amounts shown before confirming.
- [ ] All required states delivered.
- [ ] Touch targets ≥44×44 (calendar cells included).
- [ ] Frames named `C-<screen>-<state>`.
