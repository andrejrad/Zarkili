# Zarkili — Booking Flow Feature Specification

**Version:** 1.1 — All open decisions resolved
**Platform:** iOS + Android (React Native / Expo)
**Scope:** Full booking flow — all entry points, 6 steps, screen changes required
**Data model:** `zarkili_service_data_model_v3.md`
**Dependencies:** `zarkili_explore_tab_spec_v2.md`, `zarkili_home_tab_spec_v2.md`
**Add-ons:** v1 supports add-ons to a single service. Multi-service booking is v2.

---

## Resolved decisions (v1.0 → v1.1)

| # | Decision | Resolution |
|---|----------|-----------|
| 1 | Deposit configuration | Per **brand** — configured on the brand document, not per service type |
| 2 | Policies re-acknowledgement | Re-show Step 5 if `policyVersion` on the location document has changed since the user's last acknowledgement |
| 3 | Rating prompt on confirmation screen | Not shown — deferred to post-appointment review request 2 hours after appointment end |
| 4 | User changes assigned stylist after "Any available" resolves | Not allowed. User must start the booking over if they want a different stylist |
| 5 | Maximum add-ons per booking | Open-ended — no maximum |

---

## 1. Core principle — contextually adaptive flow

Every entry point carries forward what the user has already decided during
discovery. The 6 booking steps are always in the same fixed order, but steps
that are already answered by the user's pre-selection are **pre-filled and
skipped**, shown only as a confirmed summary chip at the top of the active step.

The user can always change a pre-filled selection by tapping the "Change" link
on any confirmed chip, without resetting subsequent steps.

---

## 2. Entry points and pre-selection state

| Entry point | Service pre-selected | Staff pre-selected | Flow starts at |
|-------------|--------------------|--------------------|----------------|
| Explore service card → "Book" | ✓ | ✗ | Step 2 — Staff |
| Location profile → service row → tap | ✓ | ✗ | Step 2 — Staff |
| Location profile → staff card → "Book with this stylist" | ✗ | ✓ | Step 1 — Service |
| Service detail screen → "Book this service" | ✓ | ✗ | Step 2 — Staff |
| Service detail screen → staff card → "Book [service] with [stylist]" | ✓ | ✓ | Step 3 — Date/time |
| Staff detail screen → service row → "Book →" → mini-sheet CTA | ✓ | ✓ | Step 3 — Date/time |
| Home → Quick Rebook → "Rebook" | ✓ | ✓ (last used) | Step 3 — Date/time |

### Step visibility matrix

| Entry | Step 1 (service) | Step 2 (staff) | Step 3 (date/time) | Steps 4–6 |
|-------|-----------------|---------------|-------------------|-----------|
| Service only | pre-filled ✓ | **active** | — | — |
| Staff only | **active** | pre-filled ✓ | — | — |
| Both pre-selected | pre-filled ✓ | pre-filled ✓ | **active** | — |

Steps 4 (review), 5 (policies), and 6 (payment) are always shown regardless of
pre-selection — they cannot be skipped.

---

## 3. Screen changes required before booking flow

Three existing screens need changes before the booking flow can work correctly.

### 3.1 Location profile page — changes

**Remove:** The generic "Book now" CTA button near the top of the page.
The user has not selected a service yet. A "Book now" with no service in context
is meaningless and leads to an undefined state.

**Replace with:** Nothing at the top. The service rows themselves are the CTAs.

**Add to each service row:**
- Next available time displayed inline: `"Today 4:30 PM"` in a small teal label
- The row is fully tappable — tapping anywhere on it initiates the booking flow
  with that service pre-selected (starts at step 2: Staff)

**Add to each staff card:**
- The card is tappable — navigates to the staff detail screen (no change here)
- Staff specialty sub-label stays as-is

**Service row updated layout:**
```
┌─────────────────────────────────────────────┐
│ Balayage highlights              from £115  │
│ 150 min · Anya, Sara         Today 4:30 PM  │
└─────────────────────────────────────────────┘
```

The secondary line shows which staff can perform this service (first names,
comma-separated, max 3 names + "and X more" if > 3) and the next available slot.

---

### 3.2 Service detail screen — major expansion

**Current state:** Service name, duration, price, "Book this service" CTA.
Screen is ~80% empty. This is the primary conversion screen between discovery
and booking intent — it must be rebuilt.

**Full content spec (top to bottom):**

```
[← Back]            Luna Studio
─────────────────────────────────────────────
[Photo gallery — horizontal scroll]
  Client result photos first, then salon photos.
  If no photos: branded placeholder tile with initials.
─────────────────────────────────────────────
Balayage highlights
at Luna Studio · Shoreditch    (tappable → location profile)
4.9 ★  (74 reviews)
─────────────────────────────────────────────
[Description — if provided by salon]
  "Senior colour technique for natural, lived-in highlights."
─────────────────────────────────────────────
[Variant section — only if variantCount > 1]
  Section label: variantLabel (e.g. "Coverage") or "Options"
  Chip row: [Partial · £115]  [Full head · £160]
  Default chip: is_default variant pre-selected
─────────────────────────────────────────────
[Add-ons section — only if add-ons exist for this service]
  Section label: "Add-ons (optional)"
  Each chip: "Toner +£15"  "Gloss treatment +£25"
  Multi-select. None pre-selected.
  Price and duration update in sticky footer as add-ons are toggled.
─────────────────────────────────────────────
[Our team for this service]
  Section label: "Our team"
  Shows ONLY staff who have this serviceTypeId in their serviceTypeIds array.
  For each stylist:
    Photo · Name · Specialty tags · Rating
    Next available slot for this service: "Today 2:00 PM"
    "Book with [name] →" link
  If "Book with [name] →" tapped:
    → Opens StaffMiniSheet (see §4.1) pre-filled with this service
    → NOT a full page navigation
─────────────────────────────────────────────
[Reviews section]
  Overall star breakdown
  Recent reviews — full text, no truncation
  If review has technicianComment: show in teal callout "About [stylist]:"
─────────────────────────────────────────────
[Sticky footer — always visible]
  "150 min  ·  £115"          [Book this service →]
  Updates live as variant / add-ons are changed.
```

**"Book this service" CTA behaviour:**
- Starts booking flow at Step 2 (Staff) with this service + selected variant +
  selected add-ons pre-filled.
- If a variant exists but none is selected: show validation inline, do not proceed.

---

### 3.3 Staff detail screen — minor changes

**Current state:** Good. Photo, name, rating, tags, bio, "Book with this stylist"
CTA, services list. Keep all of this.

**Add "Book →" link to each service row:**

```
┌──────────────────────────────────────────┐
│ Balayage highlights        from £115  Book→ │
│ 150 min                                  │
└──────────────────────────────────────────┘
```

Tapping "Book →" on a service row **opens a ServiceMiniSheet** (see §4.1) —
it does NOT navigate to the full service detail screen. The user chose this
stylist already; they don't need to re-evaluate the service from scratch.

**"Book with this stylist" CTA behaviour:**
- Starts booking flow at Step 1 (Service) with this staff member pre-filled.
- Step 1 shows ONLY services this stylist can perform (filtered by
  `technician.serviceTypeIds`). Never shows the full location service menu.

---

## 4. Mini-sheet components (new)

Mini-sheets are lightweight bottom sheets. They are NOT full-screen navigation.
They appear on top of the current screen (service detail or staff detail) and
are dismissed with a swipe-down or × tap.

### 4.1 ServiceMiniSheet

Opens when: user taps "Book →" on a service row from within the **staff detail screen**.

**Pre-filled state when opening:**
- Staff: the stylist whose page the user is on ✓
- Service: the service row they tapped ✓

**Content:**
```
[handle]
Service name                                [×]
Duration · from £price · Location name

"Short description of the service."

[Variant chips — only if variantCount > 1]
  [Partial · £115 ●]  [Full head · £160]

[Add-on chips — only if add-ons exist]
  [Toner +£15]  [Gloss treatment +£25]

[Availability callout]
  [Stylist name] is available today at 2:00 PM   ← teal background

[Book [service] with [stylist] →]               ← primary CTA, full width
[See full service details →]                    ← secondary text link
```

**CTA behaviour:**
- Tapping "Book [service] with [stylist] →" starts booking at **Step 3 (Date/time)**
  with both service + staff pre-filled.
- Tapping "See full service details →" dismisses the sheet and navigates to the
  full service detail screen.

---

### 4.2 StaffMiniSheet

Opens when: user taps "Book with [name] →" from within the **service detail screen**.

**Pre-filled state when opening:**
- Service: the service whose detail screen the user is on ✓
- Staff: the stylist card they tapped ✓

**Content:**
```
[handle]
[Photo]  Stylist name                       [×]
         Specialty · Location · ★ rating

"Bio summary (first sentence only)."

[Specialty tags]

[Availability callout]
  Next available for [service]: Today at 2:00 PM   ← teal background

[Book [service] with [name] →]              ← primary CTA, full width
```

**CTA behaviour:**
- Tapping "Book [service] with [name] →" starts booking at **Step 3 (Date/time)**
  with both service + staff pre-filled.

---

## 5. The 6-step booking flow

### 5.1 Navigation and progress indicator

Every step screen has:
- `← Back` (or swipe-back) navigates to the previous step, preserving all
  selections on the step being left.
- A step progress indicator at the top showing only the steps the user will
  actually see (pre-filled steps appear as ✓ dots before the active step number).
- A **selection summary strip** below the progress indicator showing confirmed
  selections as chips: `[Balayage]  [Anya B.]`. Each chip is tappable — tapping
  navigates back to that step without resetting later steps.

**Step indicator examples:**

```
Entry: service only pre-selected
  ✓  [2]  ○  ○  ○  ○
  Svc Stf Dt Rev Pol Pay

Entry: both pre-selected
  ✓   ✓  [3]  ○  ○  ○
  Svc Stf  Dt Rev Pol Pay
```

---

### 5.2 Step 1 — Service selection

**Shown when:** No service is pre-selected (entry: "Book with this stylist").

**Important constraint:** When staff is pre-selected, show ONLY the services
that stylist can perform. Never show the full location service menu when a
specific stylist has been chosen — do not offer services they cannot provide.

```jsx
// Filter services when staff is pre-selected
const displayedServices = staffPreSelected
  ? allLocationServices.filter(s =>
      selectedTechnician.serviceTypeIds.includes(s.id)
    )
  : allLocationServices
```

**Screen content:**
- Section header: `"What would you like?"` (or `"What would you like Anya to do?"`)
- Service list: name, duration, price (same format as location profile rows)
- Tapping a service selects it — the row highlights, a ✓ appears, and add-ons
  slide in below the selected service inline (see §5.2.1)
- CTA in sticky footer: `"Continue →"` — enabled only once a service is selected

**Sticky footer:**
```
[service name]  [duration]  [total price]   [Continue →]
Updates live as add-ons are toggled.
```

#### 5.2.1 Add-ons — v1 scope

Add-ons are shown inline, immediately below the selected service row, after
selection. They slide in with a 200ms expand animation.

```
✓ Balayage highlights  150 min  £115
  ┌─────────────────────────────────────────┐
  │ Add-ons (optional)                      │
  │ [Toner +£15]  [Gloss treatment +£25]   │
  │ [Scalp treatment +£10]                  │
  └─────────────────────────────────────────┘
```

**Add-on chip behaviour:**
- Tapping an add-on chip toggles it selected/unselected.
- Multiple add-ons can be selected simultaneously.
- Selected add-on chip: pink fill (`#FBEAF0`), pink border (`#F4C0D1`).
- Each add-on shows its incremental price only (`+£15`), never the total.
- The sticky footer total and duration update in real time as add-ons are toggled.

**Duration update:**
```js
const totalMinutes = selectedVariant.durationMinutes +
  selectedAddons.reduce((sum, a) => sum + a.durationMinutes, 0)
```

**Price update:**
```js
const totalPrice = selectedVariant.price +
  selectedAddons.reduce((sum, a) => sum + a.price, 0)
```

**Rules:**
- If a service has no add-ons configured: do not render the add-ons section at all.
- Never pre-select any add-on.
- Add-ons are open-ended — there is no maximum number of add-ons a user can
  select. All active add-ons for the service type are always shown and any
  combination can be selected.
- Add-ons shown here are fetched from the `addons` subcollection of the selected
  service type document.

---

### 5.3 Step 2 — Staff selection

**Shown when:** No staff is pre-selected.

**Screen content:**
- Section header: `"Choose your stylist"`
- First option: `"Any available"` row (always first, always shown)
  - Sub-label: `"We'll assign the first available stylist"`
  - Next available slot shown: `"Today 2:00 PM"`
- Stylist cards: photo, name, specialty tags, rating + review count, next
  available slot for the selected service
- Ordered by `averageRating DESC`
- Fully booked stylists: shown at the bottom with `"No availability this week"`
  label instead of a slot, greyed out, not tappable

**"Any available" selection behaviour:**
- Selecting "Any available" does not assign a specific stylist until a time slot
  is chosen in step 3. The slot picker in step 3 shows all available slots across
  all stylists who can do the service.
- At booking confirmation, the assigned stylist is shown on the confirmation screen.

**Stylist card:**
```
[photo]  Anya B.                    ★ 4.9 (74)
         Balayage · Glossing · Brow Styling
         Today 2:00 PM available
```

Tapping a stylist card selects them and auto-advances to Step 3.

---

### 5.4 Step 3 — Date and time

**Screen content:**
- Month calendar view with available dates highlighted in brand pink.
  Unavailable dates: greyed out, not tappable.
- Quick chips above calendar: `"Today"` · `"This week"` — tap to jump to
  the nearest available slot in that window.
- Tapping an available date expands a time slot grid below the calendar.
- Time slot grid: slots in 15-minute increments, only showing slots where
  the selected stylist (or any stylist if "Any available") has a gap >=
  `totalDuration` minutes.
- Selected slot: pink fill, white text.
- CTA in sticky footer: `"Continue →"` — enabled only once a date and time
  are selected.

**When staff is "Any available":**
- Show all available slots across all qualifying stylists.
- When a slot is tapped, the assigned stylist for that slot is shown immediately
  below the slot picker: `"Anya B. will be your stylist"`.

**Slot duration:**
Slots shown must be wide enough to accommodate:
```js
const requiredMinutes = selectedVariant.durationMinutes +
  selectedAddons.reduce((sum, a) => sum + a.durationMinutes, 0)
```

---

### 5.5 Step 4 — Review

Full summary of all selections. The last screen where the user can edit anything
before seeing policies.

**Content:**
```
[Salon name · Location]

Service:     Balayage highlights (Partial)          [Change]
Add-ons:     Toner                                  [Change]
Stylist:     Anya B.                                [Change]
Date/time:   Saturday, 17 May · 2:00 PM             [Change]

Duration:    165 min (150 + 15 for toner)
Total:       £130 (£115 + £15 toner)

Free cancellation until Friday, 16 May at 2:00 PM
```

Each `[Change]` link navigates back to that specific step. Returning from a
Change flow lands back on the Review screen, not the intermediate step.

**CTA:** `"Continue to policies →"` — full width, pink.

**Loyalty preview (if user is a member at this brand):**
Below the total, show a small teal callout:
```
"You'll earn 130 pts at Glam Studio for this booking"
```

---

### 5.6 Step 5 — Policies

**Content:**
- Cancellation policy in plain English: `"Free cancellation until [date + time].
  After that, [X]% of the service fee applies."`
- No-show policy: `"If you don't show up, 100% of the service fee will be charged."`
- Deposit note if the brand has a deposit configured:
  ```
  "A £[amount] deposit is required to secure this booking.
   It will be deducted from your total on the day."
  ```
  Deposit amount and whether a deposit is required are configured at **brand level**
  on the `brands/{brandId}` document — not per service type. All services at a
  brand either require a deposit or none do.

**Acknowledgement:**
The user must explicitly acknowledge the policies before proceeding:
```
[  ] I understand and agree to the cancellation and no-show policies.
```
A checkbox that the user must tap. The "Continue to payment →" CTA is disabled
until the checkbox is ticked.

**Skip logic — when Step 5 is bypassed:**
Step 5 is skipped for repeat bookings at the same location **only when both
conditions are true**:
1. A `user_policy_acknowledgements` document exists for this user + location.
2. The `policyVersion` recorded in that document matches the current
   `policyVersion` on the location document.

If the salon has updated their policies since the user's last acknowledgement
(`policyVersion` differs), Step 5 is shown again in full regardless of how
many times the user has booked there before.

```js
// Firestore check — run before rendering Step 5
const ackRef  = doc(db, 'user_policy_acknowledgements', `${userId}_${locationId}`)
const ackSnap = await getDoc(ackRef)

const locationSnap    = await getDoc(doc(db, `brands/${brandId}/locations/${locationId}`))
const currentVersion  = locationSnap.data().policyVersion   // e.g. "2026-05-01"

const skipPolicies = ackSnap.exists() &&
  ackSnap.data().policyVersion === currentVersion

// If skipPolicies: show one-line summary on Review screen, proceed directly to payment
// If !skipPolicies: show full Step 5
```

When Step 5 is skipped, the Review screen (Step 4) shows a compact one-line
policy summary instead:
```
Cancellation: free until 24h before · No-show fee: 100%
```

**On acknowledgement:** Write/update the `user_policy_acknowledgements` document
with the current `policyVersion`. This document is also used to determine whether
to skip Step 5 on the next booking at this location.

---

### 5.7 Step 6 — Payment

**Content:**
- Booking summary (compact, read-only): service, stylist, date, total.
- Payment method section:
  - Apple Pay / Google Pay as the **primary** option (single-tap payment)
  - Saved card if exists (pre-selected if no Apple/Google Pay available)
  - "Add a new card" option
- Deposit display — if `brand.depositEnabled === true`:
  ```
  Due now (deposit):    £[brand.depositAmount]
  Due on the day:       £[totalPrice - brand.depositAmount]
  Total:                £[totalPrice]
  ```
  Deposit amount is read from `brands/{brandId}.depositAmount` (pence).
  If `brand.depositEnabled === false`: charge the full amount upfront.
- **CTA:** `"Confirm booking · £[totalPrice]"` — full total in the button.
  If deposit enabled: `"Confirm and pay deposit · £[brand.depositAmount]"`.
  Never a generic "Confirm" with no amount — always show what is being charged now.

**Rules:**
- Never store full card numbers client-side. Use Stripe/payment provider tokenisation.
- CTA is disabled until a payment method is selected.
- Loading state on CTA tap: spinner replaces text. Disable the button immediately
  on tap to prevent double-submit.

---

## 6. Booking confirmation screen

Shown after successful payment. This is the highest-trust, highest-emotion
moment in the app. It must feel like something.

**Content and timing:**

| Element | Behaviour | Timing |
|---------|-----------|--------|
| Confetti burst | Full-screen particle animation in brand colours | Fires on booking confirmed API response |
| Haptic | Medium-weight impact haptic | 0ms after confetti fires |
| Success checkmark | 48pt circle with ✓, strokes in with 300ms animation | 200ms after haptic |
| Booking reference | Large, copyable reference number | Renders immediately |
| Service summary | Compact: service, stylist, date, location | Renders immediately |
| Cancellation pill | Free cancellation until [date]. Amber if within 48h. | Renders immediately |
| Points toast | `"You've earned 130 pts at [Brand]!"` slides up | 800ms after screen renders |

**Assigned stylist display (when "Any available" was selected):**
When the user chose "Any available" in Step 2, the confirmation screen shows
the assigned stylist prominently:
```
Your appointment with Anya B. ★ 4.9
```
The user cannot change the assigned stylist from this screen. If they want a
different stylist they must cancel and start a new booking. This is communicated
clearly with a small note below the stylist name:
```
"To book with a different stylist, cancel this booking and start again."
```

**No rating prompt on this screen.** A review request is sent to the user
2 hours after the appointment ends. The confirmation screen is not the right
moment — the service hasn't happened yet.

**Action buttons (below the celebration):**
1. `"Add to Calendar"` — system calendar sheet (most-tapped action)
2. `"Get directions"` — opens native maps to the location address
3. `"Share booking"` — system share sheet with pre-formatted text
4. `"Book another service at [location]"` — quiet text link, not a button

**Accessibility:** confetti respects `prefers-reduced-motion`. Static
illustration replaces animation if enabled.

---

## 7. Changing a pre-selected step mid-flow

When a user taps `[Change]` on a confirmed chip or on the Review screen:

```
Example: user on Step 3 (date) wants a different stylist

1. User taps [Change] on the "Anya B." chip
2. Navigates back to Step 2 (Staff)
3. Current selection (Anya) shown as highlighted but changeable
4. User selects Sara K.
5. App navigates forward to Step 3 (Date/time)
   — the date/time picker resets (Sara's availability differs from Anya's)
   — any previously selected slot is cleared
6. User picks a new slot
7. Review screen updates to reflect Sara K. + new slot
```

**Rule:** Changing a step only resets the steps that *depend* on it. Changing
the stylist (step 2) resets the date/time (step 3) because availability changes.
Changing the service (step 1) resets both stylist (step 2) — because a different
service may have different qualified staff — and date/time (step 3).
Add-ons are part of step 1 and reset together with service changes.

---

## 8. Component map

| Component | Location | Notes |
|-----------|----------|-------|
| `BookingFlowNavigator` | Root booking flow | Manages step state, pre-selection context, and Change flow |
| `BookingProgressIndicator` | Top of every step | Shows only active steps, ✓ for pre-filled |
| `SelectionSummaryStrip` | Below progress indicator | Chips for each confirmed selection, each tappable |
| `ServiceMiniSheet` | Bottom sheet | Opens from staff detail service rows |
| `StaffMiniSheet` | Bottom sheet | Opens from service detail staff cards |
| `ServiceSelectionStep` | Step 1 | Includes add-on chips inline after service selection |
| `StaffSelectionStep` | Step 2 | "Any available" + sorted stylist cards |
| `DateTimeStep` | Step 3 | Calendar + time slot grid |
| `ReviewStep` | Step 4 | Full summary + Change links + loyalty preview |
| `PoliciesStep` | Step 5 | Plain-language policies + acknowledgement checkbox |
| `PaymentStep` | Step 6 | Apple/Google Pay + card + confirm CTA with amount |
| `BookingConfirmationScreen` | Post-flow | Confetti + summary + actions |

---

## 9. Booking flow state object

```ts
interface BookingFlowState {
  // Location context
  brandId:     string
  locationId:  string

  // Step 1 — service
  serviceTypeId:  string | null
  variantId:      string | null
  addonIds:       string[]

  // Computed from service selections
  totalPrice:     number    // pence — updates live
  totalMinutes:   number    // updates live

  // Step 2 — staff
  technicianId:   string | null   // null = "Any available"

  // Step 3 — date/time
  selectedDate:   string | null   // ISO date "2026-05-17"
  selectedSlot:   string | null   // ISO timestamp "2026-05-17T14:00:00Z"
  assignedTechnicianId: string | null  // resolved from "Any available" on slot selection

  // Metadata
  entryPoint:     'explore' | 'location_profile' | 'service_detail' |
                  'staff_detail' | 'quick_rebook' | 'service_mini_sheet' |
                  'staff_mini_sheet'
  prefilledSteps: ('service' | 'staff')[]
}
```

---

## 10. API endpoints required

```
GET /booking/service-addons?serviceTypeId={id}
  Response: { addons: ServiceAddonObject[] }

GET /booking/staff?locationId={id}&serviceTypeId={id}
  Response: { technicians: TechnicianCardObject[], anyAvailableNextSlot: string }
  Note: filtered to staff who have serviceTypeId in their serviceTypeIds array

GET /booking/availability?locationId={id}&serviceTypeId={id}&technicianId={id|any}
              &durationMinutes={n}&startDate={date}&endDate={date}
  Response: { slots: { date: string, times: string[] }[] }
  Note: slots are filtered to gaps >= durationMinutes

POST /bookings
  Body: {
    userId, brandId, locationId, serviceTypeId, variantId,
    addonIds, technicianId, startsAt, priceSnapshot, durationSnapshot,
    variantNameSnapshot, addonsSnapshot, technicianNameSnapshot,
    locationNameSnapshot, serviceNameSnapshot, cancellationPolicySnapshot
  }
  Response: { bookingId, status, assignedTechnicianId, startsAt, endsAt }

POST /user-policy-acknowledgements
  Body: { userId, brandId, locationId, policyVersion }
  Response: { acknowledged: true }

GET /user-policy-acknowledgements?userId={id}&locationId={id}
  Response: { acknowledged: boolean, policyVersion: string | null }
```

**Brand document fields used in booking flow:**
```ts
interface BrandBookingConfig {
  depositEnabled:  boolean   // true = deposit required for all bookings
  depositAmount:   number    // pence — e.g. 3000 = £30. Only used when depositEnabled.
}
```

**Location document fields used in booking flow:**
```ts
interface LocationPolicies {
  policyVersion:        string   // e.g. "2026-05-01" — updated when policies change
  cancellationWindowH:  number   // hours before appointment for free cancellation
  lateFeePct:           number   // percentage charged after cancellation window
  noShowFeePct:         number   // percentage charged for no-show (typically 100)
}
```

---

## 11. Accessibility

| Element | Requirement |
|---------|------------|
| Progress indicator | `accessibilityRole="progressbar"`, `accessibilityValue={{ min: 1, max: 6, now: currentStep }}`, `accessibilityLabel="Step [n] of [total]: [step name]"` |
| Service row (step 1) | `accessibilityRole="radio"` within `role="radiogroup"` |
| Add-on chip | `accessibilityRole="checkbox"`, `accessibilityState={{ checked }}`, `accessibilityLabel="[addon name], +£[price]. [checked/unchecked]"` |
| Staff card (step 2) | `accessibilityRole="radio"` within `role="radiogroup"` |
| Time slot (step 3) | `accessibilityRole="button"`, `accessibilityLabel="[time], [stylist name if known]"` |
| Policies checkbox | `accessibilityRole="checkbox"`, `accessibilityState={{ checked }}` |
| Confirm CTA | `accessibilityLabel="Confirm booking, total £[amount]"` |
| Confetti | `accessibilityElementsHidden={true}` |
| Booking confirmation | `accessibilityLiveRegion="polite"` on the booking reference — announced to screen readers when it renders |

---

---

*End of specification — Zarkili Booking Flow v1.1*
*Data model: `zarkili_service_data_model_v3.md`*
*Related:*
*— `zarkili_explore_tab_spec_v2.md` (Explore entry points)*
*— `zarkili_home_tab_spec_v2.md` (Quick Rebook entry point)*
*— `zarkili_rewards_tab_spec.md` (loyalty points awarded on booking completion)*
