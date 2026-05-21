# Zarkili — Home tab empty state spec
# Quick Rebook strip and Loyalty banner — all user states

**Version:** 1.1  
**Applies to:** `zarkili_home_tab_spec.md` — extends Elements 3 and 4  
**Platform:** iOS + Android (React Native / Expo)

---

## Overview

Elements 3 (Quick Rebook) and 4 (Loyalty banner) each have multiple user states beyond the
normal "has data" case. This spec defines the exact behaviour, copy, and component logic for
every state. Implement these before shipping the Home tab — a new user's first session will
always hit one of the empty states below.

---

## User state matrix

| State | Has bookings | Has loyalty account | Has pts > 0 | Quick Rebook | Loyalty banner |
|-------|-------------|--------------------|----|---|---|
| 1. Brand new | No | No | No | Discovery card | Hidden |
| 2. Has bookings, no loyalty | Yes | No (salon has no programme) | No | Normal | Hidden |
| 3. Has loyalty, 0 pts | Yes | Yes | No | Normal | Aspirational mode |
| 4. Normal (already specced) | Yes | Yes | Yes | Normal | Normal |

---

## State 1 — Brand new user (no bookings, no loyalty)

### Quick Rebook — replace with discovery card

Do not show an empty strip. Do not hide the section. Render a `HomeDiscoveryCard` component
in the same space at the same height as the normal rebook strip.

**Component:** `HomeDiscoveryCard`

```
┌─────────────────────────────────────┐
│  Book your first service            │
│  Your recent bookings appear here   │
│                                     │
│         [ Explore services ]        │
└─────────────────────────────────────┘
```

**Props / content:**

| Field | Value |
|-------|-------|
| Title | `"Book your first service"` |
| Subtitle | `"Your recent bookings will appear here"` |
| CTA label | `"Explore services"` |
| CTA action | Navigate to Explore tab |
| Height | Must match the normal `QuickRebookStrip` height — no layout shift when real data arrives |
| Border style | `0.5px dashed` using `--color-border-secondary` |
| Background | `--color-background-primary` |

**Rules:**

- Single CTA only. No secondary link.
- Never show "No bookings yet" as the title — this communicates absence. Always communicate opportunity instead.
- The section header row (`"Quick rebook"` label + salon chip area) is hidden entirely in this state — there is no active salon context yet.
- When the user completes their first booking, this card transitions to the normal `QuickRebookStrip` on the next Home load. No animation required for this transition.

**Conditional logic:**

```js
if (!activeSalonId) {
  return <HomeDiscoveryCard />
}
if (recentBookings.length === 0) {
  return <HomeDiscoveryCard />
}
return <QuickRebookStrip bookings={recentBookings} salonId={activeSalonId} />
```

---

### Loyalty banner — hide completely

Do not render the loyalty banner. Do not render a placeholder. The vertical space it would
occupy is absorbed by the discovery content below (Trending near you / Popular near you moves
up naturally).

**Rules:**

- No "Join a loyalty programme" marketing copy. It is premature and reads as an ad.
- No empty banner frame or skeleton.
- The banner appears automatically after the user's first completed booking triggers loyalty
  account creation at that salon. No user action required.
- Do not add a `loyaltyBannerVisible` toggle in settings — visibility is derived entirely from
  data state.

**Conditional logic:**

```js
if (!loyaltyAccount || !loyaltyAccount.salonId) {
  return null
}
```

---

## State 2 — Has bookings, salon has no loyalty programme

### Quick Rebook — normal

Show the `QuickRebookStrip` exactly as specced in the main document. This state has no
impact on the rebook strip.

### Loyalty banner — hide completely and silently

The active salon has not enabled a loyalty programme. Do not render the banner. Do not
explain the absence to the user — no "This salon doesn't have a loyalty programme yet."
Copy like this makes the salon look bad and reflects poorly on the platform.

**Rules:**

- Absence is silent. The section simply does not exist on screen.
- If the user switches salon context (via the chip in Quick Rebook) to a salon that does
  have a loyalty programme, the banner appears immediately for that salon.
- If the salon later enables a loyalty programme, the banner appears automatically on the
  user's next Home load. No cache invalidation needed beyond the normal API refresh.

**Conditional logic:**

```js
const loyaltyAccount = getLoyaltyAccount(userId, activeSalonId)

if (!loyaltyAccount || !loyaltyAccount.programmeEnabled) {
  return null
}
```

---

## State 3 — Has loyalty account, 0 points balance

This is the most important empty state to get right. It applies in two scenarios:

- User joined the salon's loyalty programme but has not yet completed a booking that earns points
- User had points and redeemed all of them down to zero

### Quick Rebook — normal

Show `QuickRebookStrip` normally. Points balance is irrelevant to the rebook strip.

### Loyalty banner — aspirational mode

Do not hide. Do not show `"0 pts"`. Show the banner in aspirational mode: flip the framing
from *"here is your progress"* to *"here is what you can earn."*

**Component:** `LoyaltyBannerAspirational` (variant of `LoyaltyBanner`)

```
┌─────────────────────────────────────────────┐
│  Start earning at Glam Studio  [Glam Studio▾]│
│  Book any service to earn your first points  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← empty bar
│  400 pts = free gel topcoat · Book to start →│
└─────────────────────────────────────────────┘
```

**Props / content:**

| Field | Value |
|-------|-------|
| Title | `"Start earning at [salonName]"` |
| Subtitle | `"Book any service to earn your first points"` |
| Progress bar | Rendered but empty (`width: 0%`) — bar track always visible |
| Milestone label | First reward in the salon's catalogue: `"[earnRate] pts = [rewardName]"` |
| CTA label | `"Book to start earning →"` |
| CTA action | Opens `QuickRebookSheet` bottom sheet (same as tapping Rebook on a strip card) |
| Salon chip | Rendered identically to the normal banner chip — same switcher behaviour |
| Background | `--color-background-info` (`#E6F1FB`) |
| Border | `0.5px solid --color-border-info` (`#B5D4F4`) |

**Rules:**

- The progress bar track must always be visible even at 0% fill. An invisible empty bar communicates nothing. The track shows the user there is something to fill.
- The milestone label is mandatory when `points === 0`. It is the entire value of this state — without it, the banner is an empty frame.
- The milestone shown must be the first (lowest points threshold) reward in the salon's catalogue. Fetch from `GET /loyalty/catalogue?salonId={id}&limit=1&sort=points_asc`.
- If the salon's catalogue is empty (no rewards configured yet), fall back to hiding the banner entirely (same as State 2). Do not show aspirational copy pointing at a reward that does not exist.
- The CTA `"Book to start earning →"` opens the rebook bottom sheet. Do not navigate to the Rewards tab — the user needs to book, not browse rewards they cannot yet redeem.
- This same aspirational state applies when a user redeems all points to zero. The banner resets to aspirational mode — it communicates "fresh start" not "you have nothing."

**Conditional logic:**

```js
const loyaltyAccount = getLoyaltyAccount(userId, activeSalonId)
const firstReward = getCatalogueFirstReward(activeSalonId)

if (!loyaltyAccount || !loyaltyAccount.programmeEnabled) {
  return null
}

if (loyaltyAccount.points === 0) {
  if (!firstReward) return null  // no catalogue — hide
  return (
    <LoyaltyBannerAspirational
      salonName={activeSalonName}
      salonId={activeSalonId}
      firstRewardName={firstReward.name}
      pointsRequired={firstReward.pointsRequired}
      onCtaPress={() => openQuickRebookSheet()}
    />
  )
}

return (
  <LoyaltyBanner
    points={loyaltyAccount.points}
    tier={loyaltyAccount.tier}
    salonName={activeSalonName}
    salonId={activeSalonId}
    nextMilestone={loyaltyAccount.nextMilestone}
  />
)
```

---

## State 4 — Normal (has points > 0)

Both components render as already specced in `zarkili_home_tab_spec.md` Elements 3 and 4.
No changes. Included here for completeness only.

---

## Decision tree — full logic

```
activeSalonId exists?
├── No  →  QuickRebook: HomeDiscoveryCard
│          LoyaltyBanner: null
│
└── Yes →  recentBookings.length > 0?
           ├── No  →  QuickRebook: HomeDiscoveryCard
           └── Yes →  QuickRebook: QuickRebookStrip (normal)
           
           loyaltyAccount exists AND programmeEnabled?
           ├── No  →  LoyaltyBanner: null (silent)
           └── Yes →  loyaltyAccount.points > 0?
                      ├── Yes →  LoyaltyBanner: normal mode
                      └── No  →  firstReward exists in catalogue?
                                 ├── Yes →  LoyaltyBanner: aspirational mode
                                 └── No  →  LoyaltyBanner: null
```

---

## Copy strings

All copy strings for localisation. Use these exact strings — do not paraphrase.

```js
const HOME_COPY = {
  // State 1 — discovery card
  REBOOK_EMPTY_TITLE:    "Book your first service",
  REBOOK_EMPTY_SUBTITLE: "Your recent bookings will appear here",
  REBOOK_EMPTY_CTA:      "Explore services",

  // State 3 — aspirational loyalty banner
  LOYALTY_ASPIRE_TITLE:    "Start earning at {salonName}",
  LOYALTY_ASPIRE_SUBTITLE: "Book any service to earn your first points",
  LOYALTY_ASPIRE_MILESTONE: "{points} pts = {rewardName}",
  LOYALTY_ASPIRE_CTA:      "Book to start earning →",
}
```

---

## API requirements

### Existing endpoints — no changes needed

These endpoints already return the data needed to derive all four states:

```
GET /home/quick-rebook?userId={id}&salonId={activeSalonId}
  Returns empty array [] when no booking history → renders HomeDiscoveryCard

GET /home/loyalty-summary?userId={id}&salonId={activeSalonId}
  Returns null when no loyalty account, or { points: 0, ... } for zero balance
```

### New endpoint required

```
GET /loyalty/catalogue?salonId={id}&limit=1&sort=points_asc
  Response: { rewards: [{ id, name, pointsRequired, description }] }
  Returns []  when salon has no rewards configured
  Used by: LoyaltyBannerAspirational to populate the milestone label
```

---

## Accessibility

### HomeDiscoveryCard

```
accessibilityRole="button"
accessibilityLabel="Book your first service. Tap to explore services."
```

### LoyaltyBannerAspirational

```
// Progress bar
accessibilityRole="progressbar"
accessibilityValue={{ min: 0, max: firstReward.pointsRequired, now: 0 }}
accessibilityLabel="0 of {pointsRequired} points earned toward {rewardName} at {salonName}"

// CTA
accessibilityRole="button"
accessibilityLabel="Book to start earning points at {salonName}"
```

### Silent hidden states

When `LoyaltyBanner` returns `null`, no accessibility announcement is needed.
Do not use `aria-hidden` on a component that simply does not render.

---

## Layout stability requirement

The vertical space between the Next Appointment card and the Trending / Recommended sections
must remain constant regardless of which state is active. This prevents layout shift when
states transition (e.g. new user completes first booking).

| State | Quick Rebook height | Loyalty banner height |
|-------|--------------------|-----------------------|
| State 1 | `HomeDiscoveryCard` — same height as `QuickRebookStrip` | 0 (hidden) |
| State 2 | `QuickRebookStrip` — normal | 0 (hidden) |
| State 3 | `QuickRebookStrip` — normal | `LoyaltyBannerAspirational` — same height as `LoyaltyBanner` |
| State 4 | `QuickRebookStrip` — normal | `LoyaltyBanner` — normal |

Both `HomeDiscoveryCard` and `LoyaltyBannerAspirational` must have the same fixed height as
their normal-state counterparts. Use `minHeight` if content varies.

---

## Open decisions

| # | Decision | Affects | Owner |
|---|----------|---------|-------|
| 1 | What is the minimum number of rewards a salon must configure before the aspirational banner is shown? Suggested: 1. | State 3 loyalty banner | Product |
| 2 | Should `HomeDiscoveryCard` show a curated service card (e.g. top-rated nearby service) instead of just the CTA? This would make the card more visually engaging for a new user on their first session. | State 1 rebook area | Design + Product |
| 3 | When a user redeems all points to zero, should the aspirational banner animate in (slide down) to signal the reset, or appear statically on next load? | State 3 transition | Design |

---

*End of spec — Zarkili Home tab empty states v1.1*
*Extends: `zarkili_home_tab_spec.md`*
*Related: `zarkili_home_spec_diff.md` (Option B inline switcher)*
