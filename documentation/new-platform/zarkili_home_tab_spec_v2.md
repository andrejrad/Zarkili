# Zarkili — Home Tab Feature Specification

**Version:** 2.0 — Updated for Brand / Location hierarchy (data model v3)
**Last updated:** May 2026
**Scope:** Home tab — logged-in user and guest user
**Platform:** iOS + Android (React Native / Expo)
**Audience:** Gen-Z clients aged 16–28
**Data model:** `zarkili_service_data_model_v3.md`

---

## What changed from v1.0

| Element | Change |
|---------|--------|
| Element 2 — Next appointment card | "cross-salon" → "cross-brand / location". `activeSalonId` → `activeBrandId`. |
| Element 3 — Quick Rebook strip | Scoped to active **brand**. Mini-card now shows location branch name. `SalonContextChip` → `BrandContextChip`. |
| Element 4 — Loyalty nudge banner | Scoped to active **brand**. Loyalty is brand-level so points are correct regardless of which location was visited. Field references updated. |
| Section 6 — API endpoints | `salonId` → `brandId` on loyalty and rebook endpoints. |
| Guest Element 5 / 6 — Popular + Reviews | "salon name" → "location display name". |
| All other elements | Unchanged. |

---

## Overview

The Home tab is the first screen a user sees on every session. It serves two
completely different purposes depending on authentication state:

- **Logged-in user:** A personalised dashboard that answers "what's happening
  with my bookings and rewards?" and drives repeat bookings with minimum friction.
- **Guest user:** A discovery-first experience that shows value before asking
  for anything, converting through intent rather than obligation.

---

## 1. Logged-In User Home

### 1.1 Layout — element order (top to bottom)

| # | Element | Data scope | Priority |
|---|---------|-----------|----------|
| 1 | Greeting + notification bell | Global | Critical |
| 2 | Next appointment card | Cross-brand / location | Critical |
| 3 | Quick Rebook strip | Active brand | High |
| 4 | Loyalty nudge banner | Active brand | High |
| 5 | Trending near you | Global | Medium |
| 6 | Recommended for you | Global (personalised) | Medium |

---

### 1.2 Element 1 — Greeting + Header

**What it shows**

- Time-aware greeting: `"Good morning / afternoon / evening, [firstName]"`
  - Morning: before 12:00
  - Afternoon: 12:00–17:00
  - Evening: 17:00+
- Current date below: `"Wednesday, 14 May"`
- Notification bell icon (top-right) with a badge dot when actionable unread
  notifications exist

**Interaction**

- Tapping the notification bell opens the notifications tray
- Badge dot only appears for actionable notifications: appointment reminders,
  points added, new messages
- Badge dot is never shown for marketing or promotional notifications

**Rules**

- Use first name only — never surname. First name is collected at onboarding step 6.
- If first name was not provided (user skipped), show greeting without name:
  `"Good evening"` — never `"Good evening, User"` or leave blank.
- Never show the Zarkili logo in this header — the greeting IS the header.
- Never show a points balance or tier status here — that belongs in the Rewards tab.

**Edge cases**

- `firstName` is null or empty → render `"Good evening"` with no name
- Device timezone unavailable → default to UTC for time-of-day logic

---

### 1.3 Element 2 — Next Appointment Card

**What it shows**

The single next upcoming appointment sorted chronologically **across all brands
and locations** (not scoped to the active brand).

Card contents:
- Brand + location name (large, prominent): e.g. `"Glam Studio · Shoreditch"`
  Single-location brands show brand name only: `"Luna Studio"`
- Service name + stylist name: `"Gel manicure · with Maria"`
- Date + time (human-readable): `"Sat 17 May · 2:00 PM"`
- Cancellation window pill: `"Free cancel until Fri 5:00 PM"`
- Two quick-action buttons: **Add to Calendar** and **Message salon**

**Interaction**

- Tapping the card opens the booking detail screen and sets that brand as
  the active context (`activeBrandId`)
- "Add to Calendar" triggers the native system calendar sheet
- "Message salon" navigates to the conversation screen for that location
- "Message salon" is hidden if the location has messaging disabled

**Why cross-brand (not active brand)**

This card is a safety net. The user's next appointment may be at a brand or
location that is not their currently active context. Scoping this card to the
active brand risks showing "no upcoming appointments" when the user actually
has one elsewhere. Missing an appointment is an unrecoverable trust failure.

**Cancellation window pill styling**

| State | Background | Text | Condition |
|-------|-----------|------|-----------|
| Default | `#FAEEDA` (amber-light) | `#633806` | More than 48h before cutoff |
| Warning | `#F7C1C1` (red-light) | `#791F1F` | Within 48h of free cancellation cutoff |
| Expired | `#F1EFE8` (gray-light) | `#5F5E5A` | Free cancellation window has passed |

**Edge cases**

| Scenario | Behaviour |
|----------|-----------|
| No upcoming appointments | Replace card with: `"Nothing booked yet. Ready to treat yourself?"` + Explore CTA. Keep same card height so layout does not shift. |
| Multiple appointments same day | Show next one. Add `"2 appointments today"` badge. Tapping badge opens CrossBrandAppointmentModal. |
| Appointment within 2 hours | Change date display to `"Today · in 1h 45m"`. Add pink border to card to signal urgency. |
| Appointment at non-active brand | Show brand + location name prominently. Tapping card switches `activeBrandId` to that brand. |

---

### 1.4 Element 3 — Quick Rebook Strip

**What it shows**

Horizontal scroll of 2–3 mini-cards showing the last services booked at the
**active brand**.

Section header: `"Quick rebook"` with a `BrandContextChip` on the right
(see `zarkili_home_spec_diff_v2.md` for chip behaviour — single-brand shows
a plain label, multi-brand shows a tappable chip).

Each mini-card:
- Service name
- Location branch name (e.g. `"Shoreditch"`) — the client needs to know which
  physical location they are rebooking at
- Price (last paid price)
- Duration
- `"Rebook"` CTA button

**Interaction — target: booking confirmed in 2 taps from here**

1. User taps `"Rebook"` on a mini-card
2. Bottom sheet slides up with:
   - Slot picker pre-filtered to soonest available within 7 days at that location
   - Last-used stylist pre-selected (user can change)
   - Saved payment method ready
3. User selects a time slot → taps `"Confirm booking"` → booking confirmed

Total taps from Home screen to confirmed booking: **2 taps**.

**Rules**

- The section header right side shows a `BrandContextChip` component:
  - **Multi-brand user** (`registeredBrands.length > 1`): tappable chip —
    `"Glam Studio ▾"`. Tapping opens `BrandSwitcherSheet`.
  - **Single-brand user** (`registeredBrands.length === 1`): plain label —
    `"At Glam Studio"`. No caret, no tap affordance.
- On first launch for a new multi-brand user: chip plays a single 400ms scale
  pulse to signal it is interactive. Never repeats after the first session.
- Each mini-card shows the location branch name so the user knows where to go.
- Show the price the user last paid. If price has changed, flag it:
  `"Was £35, now £38"` in amber — never silently update.
- Maximum 3 cards in the strip.
- Never show services from other brands here. This strip is brand-scoped.

**Edge cases**

| Scenario | Behaviour |
|----------|-----------|
| New user / no booking history | Replace strip with `"Start your first booking"` card + Explore CTA. Never show an empty strip. |
| Service discontinued | Card shows `"No longer available"` + `"Find similar"` CTA → Explore filtered to that category. |
| `activeBrandId` is null | Show `"Find a salon to get started"` prompt instead of the strip. |
| Price has increased | Show `"Was £35, now £38"` in amber. Require secondary confirm tap before booking. |
| Preferred stylist unavailable | Bottom sheet shows `"Your usual stylist is unavailable — choose another or pick a later date"`. Never silently assign a different stylist. |

---

### 1.5 Element 4 — Loyalty Nudge Banner

**What it shows**

A compact banner scoped to the **active brand's** loyalty programme:

- Points balance + brand name: `"340 pts · Glam Studio"`
- Tier badge: `"Silver tier"`
- Visual progress bar (fills toward next milestone)
- Milestone label: `"60 pts until free gel topcoat →"`

Tapping anywhere on the banner navigates to the Rewards tab (already in active
brand context).

**Why on Home (not just Rewards tab)**

Loyalty programmes that live only in a Rewards tab are loyalty programmes that
don't exist for most users. Visibility at the moment the user is thinking about
booking is worth 10× more than the same information buried in a separate tab.

**Why brand-level (not location-level)**

Points are earned at brand level — a booking at Glam Studio Shoreditch and a
booking at Glam Studio Canary Wharf both contribute to the same balance.
The banner correctly shows the brand name. The specific location visited is
irrelevant to the points balance.

**Progress bar animation**

- On first render: bar fills from 0% to current progress with a 600ms ease-in
  animation
- Subsequent renders (same session): no animation — static bar

**Banner variants by state**

| State | Background | Border | Copy pattern | Condition |
|-------|-----------|--------|-------------|-----------|
| Default | `#E6F1FB` (blue-light) | `#B5D4F4` | `"X pts until [reward]"` | Normal |
| Expiry warning | `#FAEEDA` (amber-light) | `#FAC775` | `"150 pts expire on 30 Apr — redeem now?"` | Points expiring within 30 days |
| Reward ready | `#E1F5EE` (teal-light) | `#9FE1CB` | `"You have a free reward ready!"` + `"Redeem and book"` CTA | User has a redeemable reward |

**Content rules**

- The banner header row shows the points balance on the left and a
  `BrandContextChip` on the right:
  - **Multi-brand user**: chip renders as `"Glam Studio ▾"` (tappable, opens
    `BrandSwitcherSheet`). Points balance shows without brand name since the
    chip provides context: `"340 pts"`.
  - **Single-brand user**: no chip. Points balance includes brand name inline:
    `"340 pts · Glam Studio"`. No caret, no tap affordance.
- Never show just `"340 pts"` with no brand attribution on a single-brand
  setup — the brand name must always be visible somewhere on the banner.
- Frame as distance to next reward: `"60 pts until free gel"` — never just
  the raw balance.
- Never show combined points across brands. Always a single brand's balance.
- If no loyalty programme exists at the active brand: hide this banner entirely.

**Edge cases**

| Scenario | Behaviour |
|----------|-----------|
| No loyalty account at active brand | Hide banner. Extend Quick Rebook strip to fill the space. |
| User has multiple brands with points | Show most recently visited brand's data. |
| Reward redeemable right now | Switch to teal variant with `"Redeem and book"` CTA. |
| Points expiring within 30 days | Switch to amber variant with exact expiry date. |

---

### 1.6 Element 5 — Trending Near You

**What it shows**

Horizontal scroll of 5–6 service cards from any location in the user's area,
ranked by `popularityScore` (booking volume + rating + recency).

Each card:
- Client result photo (primary — not salon interior shot)
- Service name
- Location display name: `"at Glam Studio · Shoreditch"` or `"at Luna Studio"`
- Service-level star rating + review count: `"4.9 ★ (128)"`
- Full price (never `"from"` for single-variant services)
- Next available time: `"Today 4:30 PM"` or `"Tomorrow 11:00 AM"`

**Rules**

- Client result photos first — never salon interior shots.
- Show real next-available times. Never fake urgency.
- Full price on single-variant services. `"from £X"` only for multi-variant
  services (e.g. nail length options).
- Limit to 5–6 cards. Never an infinite scroll in this section.
- Label paid placements clearly: `"Promoted"`. Never blend with organic results.
- Minimum 5 real client reviews before a service can appear here.

---

### 1.7 Element 6 — Recommended for You

**What it shows**

3–4 service cards personalised based on:
- Aesthetic tags (set at onboarding, editable in Profile)
- Booking history (categories previously booked)
- Saved brands / locations
- Location proximity

Section header: `"Based on your taste"` — makes personalisation transparent.

**"Member" badge on recommendation cards**

If a recommended service is at a brand where the user is already registered
(`user_brand_loyalty` record exists for this `brandId`), show a `"Member · 340 pts"`
badge. Points are brand-level — the badge appears on **all** location cards
of that brand, including locations the user has not yet visited.

**Rules**

- Label is always `"Based on your taste"`.
- New user with no booking history: show `"Popular in [city]"` instead.
- Never recommend based on inferred demographic data.
- Do not recommend brands the user has flagged or blocked.

---

## 2. Guest User Home

### 2.1 Layout — element order (top to bottom)

| # | Element | Purpose |
|---|---------|---------|
| 1 | Minimal brand header + Log in link | Context without commitment |
| 2 | Hero value section | Communicate value, drive to discovery |
| 3 | Social proof stats strip | Build instant trust |
| 4 | Category browse grid | Immediate exploration, no account needed |
| 5 | Popular near you | High-intent content, converts to sign-up |
| 6 | Client reviews strip | Peer validation — final trust signal |
| 7 | Soft sign-up prompt | Ask after delivering value |

---

### 2.2 Core philosophy — value first, sign-up second

> The worst thing a consumer app can do to Gen-Z is demand commitment before
> delivering value.

The primary CTA takes the user to **Explore** — not to sign-up. Sign-up only
fires when the guest taps "Book" on a service they actually want.

---

### 2.3 Element 1 — Minimal Brand Header

- App name `"Zarkili"` — small, left-aligned, 13px weight 500
- `"Log in"` text link — top-right, never a button
- No tagline, no sign-up CTA, no logo banner

**Rules**

- Never show `"Sign up"` in the header.
- Never disable or hide any tab bar item. Bookings and Rewards show friendly
  empty states, not locked states.

---

### 2.4 Element 2 — Hero Value Section

```
[tag: "Beauty near you"]

Find your next appointment

Nails, hair, lash, skin — browse and book in seconds.

[Primary CTA: "Explore services"]   → Explore tab
[Secondary link: "Already have an account? Log in"]
```

**Rules**

- Primary CTA always goes to Explore — never to sign-up.
- Hero must be compact — content below should be visible without scrolling.
- Never use stock or AI-generated imagery.

---

### 2.5 Element 3 — Social Proof Stats

Three metric tiles in a row:

| Metric | Example | Answers |
|--------|---------|---------|
| Average rating | `4.9 ★` | "Is this legit?" |
| Total bookings | `50k+` | "Do people use it?" |
| Partner locations | `200+` | "Will I find something near me?" |

**Rules**

- Real numbers only. Never inflate.
- Omit entirely if platform is too new for compelling numbers.
- Round with `+` suffix: `"50k+"` not `"52,847"`.

---

### 2.6 Element 4 — Category Browse Grid

3×2 grid — all tappable, no sign-up required:

| Category | Icon |
|----------|------|
| Nails | `ti-sparkles` |
| Hair | `ti-scissors` |
| Lash | `ti-eye` |
| Skin | `ti-plant` |
| Brows | `ti-sun` |
| Massage | `ti-heart` |

- Never show a category with zero results in the user's area.
- Tabler outline icons only — never filled variants.

---

### 2.7 Element 5 — Popular Near You

2–3 service cards, most-booked in area in the last 7 days.

Each card:
- Client result photo
- Service name
- Location display name: `"at Glam Studio · Shoreditch"` or `"at Luna Studio"`
- Service-level rating + review count
- Full price (never `"from"` for single-variant services)
- Next available time if today or tomorrow

Tapping a card → service detail. **No sign-up until "Book" is tapped.**

**Sign-up trigger at "Book":**
1. Sign-up / login screen
2. Pre-fill: `"You're booking Gel manicure at Luna Studio"` at top
3. After auth → return to booking flow, never drop to Home

**Rules**

- Never show locations with fewer than 5 reviews to guests.
- Client result photos primary. If none: initials tile. Never blank grey box.

---

### 2.8 Element 6 — Client Reviews Strip

2–3 real quotes:

```
"Booked my lash lift in 30 seconds. Maria was amazing."
— Aisha K. · Lash lift · Luna Studio
```

**Rules**

- Real reviews only. Maximum age: 6 months. Minimum length: 20 characters.
- First name + last initial only.
- Never fabricate or paraphrase. Quote exactly.
- Show service + location name on every quote.

---

### 2.9 Element 7 — Soft Sign-Up Prompt

```
Save favourites and earn rewards
Track every booking in one place
[Create your account]
```

- Single CTA. No dismiss button — user scrolls past if not ready.
- Never show more than once per session.
- Never use a pop-up or modal for this prompt.

---

## 3. Tab Bar — Guest User State

| Tab | Guest behaviour |
|-----|----------------|
| Home | Full discovery experience as described above |
| Explore | Full access — same as logged-in minus "Member" badges |
| Bookings | Empty state: `"Sign up to track your bookings"` + CTA |
| Rewards | Empty state: `"Join a loyalty programme to earn points"` + Explore CTA |
| Profile | Sign-in / sign-up screen |

---

## 4. Accessibility Requirements

| Element | Requirement |
|---------|------------|
| Greeting | `accessibilityLabel="Good evening, Layla. Wednesday 14 May"` |
| Notification bell | `accessibilityRole="button"` + `accessibilityLabel="Notifications, 2 unread"` |
| Next appointment card | Single tappable region. `accessibilityLabel="Next appointment: Gel manicure with Maria at Glam Studio Shoreditch, Saturday 17 May at 2pm"` |
| Quick Rebook cards | `accessibilityLabel="Rebook Gel manicure at Glam Studio Shoreditch, £35, 60 minutes"` |
| Loyalty progress bar | `accessibilityRole="progressbar"` + `accessibilityValue={{ min: 0, max: 400, now: 340 }}` + `accessibilityLabel="340 of 400 points toward free gel topcoat at Glam Studio"` |
| Cancellation pill | Colour change always paired with text — never colour alone |
| Category grid cells | `accessibilityRole="button"` + `accessibilityLabel="Browse Nails services"` |
| All images | `accessibilityLabel` describing the service shown |
| Social proof stats | `accessibilityLabel="Average rating 4.9 stars, over 50,000 bookings, 200 partner locations"` |
| Animations | All must respect `prefers-reduced-motion` |

---

## 5. Performance Targets

| Metric | Target |
|--------|--------|
| Time to interactive (Home tab) | < 1.5s on 4G |
| Next appointment card data load | < 800ms |
| Quick Rebook strip data load | < 800ms |
| Loyalty banner data load | < 800ms |
| Trending feed first card render | < 200ms (skeleton first, then content) |
| Skeleton loaders | Always render immediately on tab tap — never blank screen |

---

## 6. API Endpoints Required

```
GET /home/next-appointment?userId={id}
  Response: { booking: BookingObject | null }

GET /home/quick-rebook?userId={id}&brandId={activeBrandId}
  Response: { services: ServiceObject[], maxResults: 3 }

GET /home/loyalty-summary?userId={id}&brandId={activeBrandId}
  Response: { points: number, tier: string, nextMilestone: { name: string, pointsRequired: number } }

GET /home/trending?lat={lat}&lng={lng}&limit=6
  Response: { services: ServiceCardObject[] }

GET /home/recommended?userId={id}&lat={lat}&lng={lng}&limit=4
  Response: { services: ServiceCardObject[] }

GET /home/guest-popular?lat={lat}&lng={lng}&limit=3
  Response: { services: ServiceCardObject[] }

GET /home/guest-reviews?lat={lat}&lng={lng}&limit=3
  Response: { reviews: ReviewQuoteObject[] }
```

> **On brand switch:** `quick-rebook` and `loyalty-summary` fire simultaneously
> when `activeBrandId` changes. The next appointment card, trending, and
> recommended endpoints are unaffected by brand switching on Home.

---

## 7. Open Decisions

| # | Decision | Impact | Owner |
|---|----------|--------|-------|
| 1 | What is the default city when location is denied or unavailable for guest users? | Guest popular + trending sections | Product |
| 2 | Threshold for showing `"X bookings this month"` on trending cards? (Suggested: 10) | Trending section | Product |
| 3 | Should the guest Home screen infer city from IP, or prompt for location before rendering? | All location-aware sections | Product + Legal |
| 4 | Maximum age of reviews in the guest reviews strip? (Suggested: 6 months) | Guest reviews strip | Product |
| 5 | Should the next appointment card show a map preview thumbnail of the location address? | Next appointment card | Design |

---

*End of specification — Zarkili Home Tab v2.0*
*Data model: `zarkili_service_data_model_v3.md`*
*Related: `zarkili_home_empty_states_spec_v2.md`, `zarkili_home_spec_diff_v2.md`*
