# Zarkili — Home Tab Feature Specification

**Version:** 1.0  
**Last updated:** May 2026  
**Scope:** Home tab — logged-in user and guest user  
**Platform:** iOS + Android (React Native / Expo)  
**Audience:** Gen-Z clients aged 16–28

---

## Overview

The Home tab is the first screen a user sees on every session. It serves two completely different purposes depending on authentication state:

- **Logged-in user:** A personalised dashboard that answers "what's happening with my bookings and rewards?" and drives repeat bookings with minimum friction.
- **Guest user:** A discovery-first experience that shows value before asking for anything, converting through intent rather than obligation.

---

## 1. Logged-In User Home

### 1.1 Layout — element order (top to bottom)

| # | Element | Data scope | Priority |
|---|---------|-----------|----------|
| 1 | Greeting + notification bell | Global | Critical |
| 2 | Next appointment card | Cross-salon | Critical |
| 3 | Quick Rebook strip | Active salon | High |
| 4 | Loyalty nudge banner | Active salon | High |
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
- Notification bell icon (top-right) with a badge dot when actionable unread notifications exist

**Interaction**

- Tapping the notification bell opens the notifications tray
- Badge dot only appears for actionable notifications: appointment reminders, points added, new messages
- Badge dot is never shown for marketing or promotional notifications

**Rules**

- Use first name only — never surname. First name is collected at onboarding step 6.
- If first name was not provided (user skipped), show greeting without name: `"Good evening"` — never `"Good evening, User"` or leave blank.
- Never show the Zarkili logo in this header — the greeting IS the header.
- Never show a points balance or tier status here — that belongs in the Rewards tab.

**Edge cases**

- `firstName` is null or empty → render `"Good evening"` with no name
- Device timezone unavailable → default to UTC for time-of-day logic

---

### 1.3 Element 2 — Next Appointment Card

**What it shows**

The single next upcoming appointment sorted chronologically **across all salons** (not scoped to active salon).

Card contents:
- Salon name (large, prominent — most important field)
- Service name + stylist name: `"Gel manicure · with Maria"`
- Date + time (human-readable): `"Sat 17 May · 2:00 PM"`
- Cancellation window pill: `"Free cancel until Fri 5:00 PM"`
- Two quick-action buttons: **Add to Calendar** and **Message salon**

**Interaction**

- Tapping the card opens the booking detail screen and sets that salon as the active context (`activeSalonId`)
- "Add to Calendar" triggers the native system calendar sheet
- "Message salon" navigates to the conversation screen for that salon
- "Message salon" is hidden if the salon has messaging disabled

**Why cross-salon (not active salon)**

This card is a safety net. The user's next appointment may be at a salon that is not their currently active context. Scoping this card to the active salon risks showing "no upcoming appointments" when the user actually has one at a different salon. Missing an appointment is an unrecoverable trust failure.

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
| Multiple appointments same day | Show next one. Add `"2 appointments today"` badge. Tapping badge opens CrossSalonAppointmentModal. |
| Appointment within 2 hours | Change date display to `"Today · in 1h 45m"`. Add pink border to card to signal urgency. |
| Appointment at non-active salon | Show salon name prominently. Tapping card switches `activeSalonId` to that salon. |

---

### 1.4 Element 3 — Quick Rebook Strip

**What it shows**

Horizontal scroll of 2–3 mini-cards showing the last services booked at the **active salon**.

Section header: `"Quick rebook"` with `"At [salonName]"` label on the right.

Each mini-card:
- Service name
- Price (last paid price)
- Duration
- `"Rebook"` CTA button

**Interaction — target: booking confirmed in 2 taps from here**

1. User taps `"Rebook"` on a mini-card
2. Bottom sheet slides up with:
   - Slot picker pre-filtered to soonest available within 7 days
   - Last-used stylist pre-selected (user can change)
   - Saved payment method ready
3. User selects a time slot → taps `"Confirm booking"` → booking confirmed

Total taps from Home screen to confirmed booking: **2 taps**.

**Rules**

- The section header right side shows a `SalonContextChip` component — not a plain text label.
  - **Multi-salon user** (`registeredSalons.length > 1`): renders as a tappable chip — `"Glam Studio ▾"` — with a caret. Tapping opens `SalonSwitcherSheet`.
  - **Single-salon user** (`registeredSalons.length === 1`): renders as a plain non-interactive label — `"At Glam Studio"` — with no caret and no tap affordance.
- On first launch for a new multi-salon user: chip plays a single 400ms scale pulse to signal it is interactive. Never repeats after the first session.
- Pre-select last used stylist. User can change before confirming.
- Show the price the user last paid. If price has changed since, flag it: `"Was £35, now £38"` in amber — never silently update the price.
- Maximum 3 cards in the strip. Never show more — the strip should feel curated, not like a history log.
- Never show services from other salons here. This strip is intentionally salon-scoped.

**Edge cases**

| Scenario | Behaviour |
|----------|-----------|
| New user / no booking history | Replace strip with `"Start your first booking"` card + Explore CTA. Never show an empty strip. |
| Service discontinued | Card shows `"No longer available"` state + `"Find similar"` CTA → Explore filtered to that category. |
| `activeSalonId` is null | Show `"Find a salon to get started"` prompt instead of the strip. |
| Price has increased | Show `"Was £35, now £38"` in amber on the mini-card. Require secondary confirm tap before booking. |
| Preferred stylist unavailable | Slot picker bottom sheet shows `"Your usual stylist is unavailable — choose another or pick a later date"`. Never silently assign a different stylist. |

---

### 1.5 Element 4 — Loyalty Nudge Banner

**What it shows**

A compact banner scoped to the **active salon's** loyalty programme:

- Points balance + salon name: `"340 pts · Glam Studio"`
- Tier badge: `"Silver tier"`
- Visual progress bar (fills toward next milestone)
- Milestone label: `"60 pts until free gel topcoat →"`

Tapping anywhere on the banner navigates to the Rewards tab (already in active salon context).

**Why on Home (not just Rewards tab)**

Loyalty programmes that live only in a Rewards tab are loyalty programmes that don't exist for most users. Visibility at the moment the user is thinking about booking is worth 10× more than the same information buried in a separate tab.

**Progress bar animation**

- On first render: bar fills from 0% to current progress with a 600ms ease-in animation
- Subsequent renders (same session): no animation — static bar

**Banner variants by state**

| State | Background | Border | Copy pattern | Condition |
|-------|-----------|--------|-------------|-----------|
| Default | `#E6F1FB` (blue-light) | `#B5D4F4` | `"X pts until [reward]"` | Normal |
| Expiry warning | `#FAEEDA` (amber-light) | `#FAC775` | `"150 pts expire on 30 Apr — redeem now?"` | Points expiring within 30 days |
| Reward ready | `#E1F5EE` (teal-light) | `#9FE1CB` | `"You have a free reward ready!"` + `"Redeem and book"` CTA | User has a redeemable reward |

**Rules**

- The banner header row shows the points balance on the left and a `SalonContextChip` on the right.
  - **Multi-salon user**: chip renders as `"Glam Studio ▾"` (tappable, opens `SalonSwitcherSheet`). Points balance shows without salon name since the chip provides the context: `"340 pts"`.
  - **Single-salon user**: no chip. Points balance includes the salon name inline: `"340 pts · Glam Studio"`. No caret, no tap affordance.
- Never show just `"340 pts"` with no salon attribution on a single-salon setup — the salon name must always be visible somewhere on the banner.
- Frame as distance to next reward: `"60 pts until free gel"` — never just the raw balance.
- Never show combined points across salons. Always a single salon's balance.
- If no loyalty programme exists at the active salon: hide this banner entirely. Never show a zero-point or empty state.

**Edge cases**

| Scenario | Behaviour |
|----------|-----------|
| No loyalty account at active salon | Hide banner. Extend Quick Rebook strip to fill the space. |
| User has multiple salons with points | Show most recently visited salon's data. |
| Reward redeemable right now | Switch to teal variant with `"Redeem and book"` CTA. |
| Points expiring | Switch to amber variant with exact expiry date. |

---

### 1.6 Element 5 — Trending Near You

**What it shows**

Horizontal scroll of 5–6 service cards from any salon in the user's area, ranked by booking volume in the past 7 days.

Each card:
- Client result photo (primary — not salon interior shot)
- Service name
- Salon name
- Star rating + review count: `"4.9 ★ (128)"`
- Full price (never `"from"`)
- Next available time: `"Today 4:30 PM"` or `"Tomorrow 11:00 AM"`

**What makes it "trending"**

Ranking is based on actual recent booking count — not editorial curation, not ad spend. If booking count is available and above a threshold, display it: `"87 bookings this month"`. Real numbers are trusted; editorial badges are not.

**Rules**

- Client result photos first — never salon interior shots. The question being answered is "what will I get?" not "what does the salon look like?"
- Show real next-available times. `"Today 4:30 PM"` is genuine urgency. Never show a fake countdown or manufactured scarcity.
- Full price on every card. Never `"from"`. Full transparency at point of discovery.
- Limit to 5–6 cards. Never an infinite scroll in this section.
- If a salon has paid for placement, label it clearly: `"Promoted"`. Never blend paid and organic results silently.
- Minimum 5 real client reviews before a service can appear in this section.

---

### 1.7 Element 6 — Recommended for You

**What it shows**

3–4 service/salon cards personalised based on:
- Aesthetic tags selected by the user at onboarding (editable in Profile)
- Booking history (categories previously booked)
- Saved salons
- Location proximity

Section header: `"Based on your taste"` — makes the personalisation mechanism transparent.

**"Member" badge on recommendation cards**

If a recommended salon is one the user is already registered with, show a `"Member"` badge on the card. Consider adding: `"Member · 340 pts"` as a micro-label to reinforce loyalty visibility.

**Rules**

- Label is always `"Based on your taste"` — gives the user agency and signals that changing their aesthetic tags will change these results.
- New user with no booking history: show `"Popular in [city]"` instead — never show a `"No recommendations yet"` empty state.
- Never recommend based on inferred demographic data. Only use explicitly provided tags and voluntary history.
- Do not recommend salons the user has previously flagged or blocked.

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

> The worst thing a consumer app can do to Gen-Z is demand commitment before delivering value.

The primary CTA on the guest Home screen takes the user to **Explore** — not to sign-up. Sign-up only fires when the guest taps "Book" on a service they actually want.

The guest's sign-up motivation must be: `"I want to book THIS specific service"` — not `"because the app told me to."` That specific motivation is worth 10× a generic sign-up prompt.

---

### 2.3 Element 1 — Minimal Brand Header

**What it shows**

- App name `"Zarkili"` — small, left-aligned (13px, weight 500)
- `"Log in"` text link — top-right, 13px, no button styling
- No tagline. No sign-up CTA. No logo banner.

**Rules**

- `"Log in"` is a text link, never a button. Buttons carry weight and urgency not appropriate here.
- Never show `"Sign up"` in the header. The sign-up prompt lives at the bottom and fires contextually at booking.
- Never disable or hide tab bar items. Bookings and Rewards tabs show friendly `"Create an account to access this"` empty states — they are never greyed out or hidden.

---

### 2.4 Element 2 — Hero Value Section

**What it shows**

```
[category tag: "Beauty near you"]

Find your next appointment

Nails, hair, lash, skin — browse and book in seconds.

[Primary CTA: "Explore services"]
[Secondary text link: "Already have an account? Log in"]
```

**Critical design decision**

`"Explore services"` navigates to the **Explore tab** — not to a sign-up screen.

**Rules**

- Headline communicates the user's goal, not the brand's goal: `"Find your next appointment"` vs `"Join Zarkili today"`
- Primary CTA always goes to Explore (discovery). Never to sign-up. Always.
- Hero section must be compact — the user should see content below it without scrolling.
- `"Log in"` secondary link is smaller (11px) and clearly secondary. One tap → authentication screen.
- Never use stock imagery or AI-generated visuals here. If images are used, use real client photos.

---

### 2.5 Element 3 — Social Proof Stats

**What it shows**

Three compact metric tiles in a row:

| Metric | Example | What it answers |
|--------|---------|----------------|
| Average rating | `4.9 ★` | "Is this legit?" |
| Total bookings | `50k+` | "Do people actually use it?" |
| Partner salons | `200+` | "Will I find something near me?" |

**Rules**

- Only show real numbers. Never inflate.
- If the platform is new and numbers are not compelling, omit this section entirely. Better nothing than `"12 bookings"` or `"3 salons"`.
- Round meaningfully: `"50k+"` not `"52,847"`. The `+` implies growth and is more credible than a precise static number.
- Numbers must be kept current — stale stats are worse than no stats.

---

### 2.6 Element 4 — Category Browse Grid

**What it shows**

A 3×2 grid of service categories:

| Category | Icon (Tabler outline) |
|----------|----------------------|
| Nails | `ti-sparkles` |
| Hair | `ti-scissors` |
| Lash | `ti-eye` |
| Skin | `ti-plant` |
| Brows | `ti-sun` |
| More | `ti-dots` |

Tapping any category navigates to Explore tab pre-filtered to that category. **No sign-up required.**

**Rules**

- All categories must work without sign-in. Never gate category browsing.
- Never show a category that returns zero results in the user's area. Replace with one that does.
- Icons must be Tabler outline only — never filled variants. Keep style uniform across all cells.

---

### 2.7 Element 5 — Popular Near You

**What it shows**

2–3 service cards showing most-booked services in the user's area in the last 7 days.

Each card:
- Client result photo (never a blank placeholder or interior shot)
- Service name
- Salon name
- Star rating + review count: `"4.9 ★ (128)"`
- Full price — never `"from"`
- Next available time if available today or tomorrow

Tapping a card goes to service detail. **No sign-up required until "Book" is tapped.**

**This section converts guests**

A guest who sees a real service (gel manicure, Luna Studio, 4.9 stars, £35, available today at 4:30 PM) and taps it has demonstrated clear intent. When they tap "Book" on the detail screen, they are motivated to create an account for a specific reason. That motivation is the most effective conversion trigger in the app.

**Rules**

- Full price always. Never `"from"`. A guest seeing a price for the first time must see the real number.
- Location-aware: infer city from IP, or prompt for location. If location unavailable, show citywide popular services labelled `"Popular in London"`.
- Never show salons with fewer than 5 reviews to a guest. First impressions require social proof.
- Client result photos as primary image. If none exist: initials tile with salon name. Never a blank grey box.

**Sign-up trigger at "Book"**

When a guest taps "Book" on any service:

1. Show sign-up / login screen
2. Pre-fill intent: `"You're booking Gel manicure at Luna Studio"` shown at top of sign-up screen
3. After authentication, return user to the booking flow — never drop them at Home

---

### 2.8 Element 6 — Client Reviews Strip

**What it shows**

2–3 short real client review quotes:

```
"Booked my lash lift in 30 seconds. Maria was amazing."
— Aisha K. · Lash lift · Studio Nico
```

Each quote:
- Review text (max 2 lines, real text — never paraphrased)
- Reviewer: first name + last initial only (e.g. `"Aisha K."`)
- Service booked + salon name

**Why here (not above the fold)**

Placed after discovery content, this strip catches the user when they're starting to consider booking and delivers the final social validation they need. Peer validation at this point has higher conversion impact than the same content placed above the fold.

**Rules**

- Real, recent reviews only. Maximum age: 6 months.
- First name + last initial only. Never full name, never anonymous.
- Never fabricate or paraphrase. Quote exactly.
- Show service name and salon on every quote. Context makes reviews credible.
- Minimum review length: 20 characters. One-word reviews are not shown here.

---

### 2.9 Element 7 — Soft Sign-Up Prompt

**What it shows**

A compact, non-blocking card at the bottom of the scroll:

```
Save favourites and earn rewards

Track every booking in one place

[CTA: "Create your account"]
```

**Rules**

- Single CTA only: `"Create your account"`. No secondary CTA, no `"Maybe later"` dismiss button.
- The user scrolls past if not ready — no pop-up, no interstitial, no friction.
- Copy focuses on user benefit: `"Save favourites and earn rewards"` — not `"Join Zarkili"` or `"Be part of the community"`.
- Never show a pop-up or modal for sign-up on the guest Home screen. Pop-ups on first visit are an exit trigger for Gen-Z.
- Never show this prompt more than once per session. If scrolled past, do not re-surface until next session.

---

## 3. Tab Bar — Guest User State

All 5 tabs remain visible and tappable for guest users. Never grey out or hide tabs.

| Tab | Guest behaviour |
|-----|----------------|
| Home | Full discovery experience as described above |
| Explore | Full access — same as logged-in user minus "Member" badges |
| Bookings | Friendly empty state: `"Sign up to track your bookings"` + single CTA |
| Rewards | Friendly empty state: `"Join a salon's loyalty programme to earn points"` + Explore CTA |
| Profile | Sign-in / sign-up screen |

---

## 4. Accessibility Requirements

| Element | Requirement |
|---------|------------|
| Greeting | `accessibilityLabel="Good evening, Layla. Wednesday 14 May"` |
| Notification bell | `accessibilityRole="button"` + `accessibilityLabel="Notifications, 2 unread"` |
| Next appointment card | Entire card is a single tappable region. `accessibilityLabel="Next appointment: Gel manicure with Maria at Glam Studio, Saturday 17 May at 2pm"` |
| Quick Rebook cards | `accessibilityLabel="Rebook Gel manicure at Glam Studio, £35, 60 minutes"` |
| Loyalty progress bar | `accessibilityRole="progressbar"` + `accessibilityValue={{ min: 0, max: 400, now: 340 }}` + `accessibilityLabel="340 of 400 points toward free gel topcoat at Glam Studio"` |
| Cancellation pill | Colour change must be paired with text — never colour alone |
| Category grid cells | `accessibilityRole="button"` + `accessibilityLabel="Browse Nails services"` |
| All images | `accessibilityLabel` describing the service shown (e.g. `"Client photo: gel nail art, almond shape"`) |
| Social proof stats | `accessibilityLabel="Average rating 4.9 stars, over 50,000 bookings, 200 partner salons"` |
| Animations | All animations must respect `prefers-reduced-motion`. Progress bar: skip animation. Confetti: show static illustration instead. |

---

## 5. Performance Targets

| Metric | Target |
|--------|--------|
| Time to interactive (Home tab) | < 1.5s on 4G |
| Next appointment card data load | < 800ms |
| Quick Rebook strip data load | < 800ms |
| Loyalty banner data load | < 800ms |
| Trending feed first card render | < 200ms (skeleton first, then content) |
| Skeleton loaders | Always render immediately on tab tap — never a blank screen while loading |

---

## 6. API Endpoints Required

```
GET /home/next-appointment?userId={id}
  Response: { booking: BookingObject | null }

GET /home/quick-rebook?userId={id}&salonId={activeSalonId}
  Response: { services: ServiceObject[], maxResults: 3 }

GET /home/loyalty-summary?userId={id}&salonId={activeSalonId}
  Response: { points: number, tier: string, nextMilestone: { name: string, pointsRequired: number } }

> **On salon switch:** Both endpoints fire simultaneously when `activeSalonId` changes.
> Neither endpoint is called for the next appointment card, trending, or recommended
> sections — those are unaffected by salon switching on Home.

GET /home/trending?lat={lat}&lng={lng}&limit=6
  Response: { services: ServiceCardObject[] }

GET /home/recommended?userId={id}&lat={lat}&lng={lng}&limit=4
  Response: { services: ServiceCardObject[] }

GET /home/guest-popular?lat={lat}&lng={lng}&limit=3
  Response: { services: ServiceCardObject[] }

GET /home/guest-reviews?lat={lat}&lng={lng}&limit=3
  Response: { reviews: ReviewQuoteObject[] }
```

---

## 7. Open Decisions

| # | Decision | Impact | Owner |
|---|----------|--------|-------|
| 1 | What is the default city when location is denied or unavailable for guest users? | Guest popular section and trending section | Product |
| 2 | What is the threshold for showing `"X bookings this month"` on trending cards? (Suggested: minimum 10 bookings before the count is shown) | Trending section | Product |
| 3 | Should the guest Home screen show a location prompt before rendering any content, or infer city from IP and prompt later? | All location-aware sections | Product + Legal |
| 4 | What is the maximum age of reviews shown in the guest reviews strip? (Suggested: 6 months) | Guest reviews strip | Product |
| 5 | Should the next appointment card show a map preview thumbnail of the salon address? | Next appointment card | Design |

---

*End of specification — Zarkili Home Tab v1.0*
