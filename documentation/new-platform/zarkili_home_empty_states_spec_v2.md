# Zarkili — Home Tab Empty State Spec

**Version:** 2.0 — Updated for Brand / Location hierarchy (data model v3)
**Replaces:** `zarkili_home_empty_states_spec.md` v1.1
**Applies to:** `zarkili_home_tab_spec_v2.md` — extends Elements 3 and 4
**Platform:** iOS + Android (React Native / Expo)

---

## What changed from v1.1

| Location | Change |
|----------|--------|
| State matrix table | "salon has no programme" → "brand has no programme" |
| State 1 — conditional logic | `activeSalonId` → `activeBrandId`. `salonId` → `brandId` in component props. |
| State 2 — text + logic | "active salon" → "active brand". `activeSalonId` → `activeBrandId`. |
| State 3 — component props, copy strings, API | `salonName` / `salonId` props → `brandName` / `brandId`. API param `salonId` → `brandId`. Copy string `{salonName}` → `{brandName}`. |
| Decision tree code block | `activeSalonId` → `activeBrandId` throughout. |
| All UX logic, component heights, layout rules | Unchanged. |

---

## Overview

Elements 3 (Quick Rebook) and 4 (Loyalty banner) each have multiple user states
beyond the normal "has data" case. This spec defines the exact behaviour, copy,
and component logic for every state. Implement these before shipping the Home tab
— a new user's first session will always hit one of the empty states below.

---

## User state matrix

| State | Has bookings | Has loyalty account | Has pts > 0 | Quick Rebook | Loyalty banner |
|-------|-------------|--------------------|----|---|---|
| 1. Brand new | No | No | No | Discovery card | Hidden |
| 2. Has bookings, no loyalty | Yes | No (brand has no programme) | No | Normal | Hidden |
| 3. Has loyalty, 0 pts | Yes | Yes | No | Normal | Aspirational mode |
| 4. Normal (already specced) | Yes | Yes | Yes | Normal | Normal |

---

## State 1 — Brand new user (no bookings, no loyalty)

### Quick Rebook — replace with discovery card

Do not show an empty strip. Do not hide the section. Render a `HomeDiscoveryCard`
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
- Never show "No bookings yet" as the title — communicate opportunity, not absence.
- The section header row (label + brand chip area) is hidden entirely in this
  state — there is no active brand context yet.
- When the user completes their first booking, this card transitions to the
  normal `QuickRebookStrip` on the next Home load. No animation required.

**Conditional logic:**

```js
if (!activeBrandId) {
  return <HomeDiscoveryCard />
}
if (recentBookings.length === 0) {
  return <HomeDiscoveryCard />
}
return <QuickRebookStrip bookings={recentBookings} brandId={activeBrandId} />
```

---

### Loyalty banner — hide completely

Do not render the loyalty banner. Do not render a placeholder. The vertical
space is absorbed by the discovery content below moving up naturally.

**Rules:**

- No "Join a loyalty programme" marketing copy. Premature and reads as an ad.
- No empty banner frame or skeleton.
- The banner appears automatically after the user's first completed booking
  triggers loyalty account creation at that brand. No user action required.
- Do not add a `loyaltyBannerVisible` toggle in settings — visibility is
  derived entirely from data state.

**Conditional logic:**

```js
if (!loyaltyAccount || !loyaltyAccount.brandId) {
  return null
}
```

---

## State 2 — Has bookings, brand has no loyalty programme

### Quick Rebook — normal

Show the `QuickRebookStrip` exactly as specced in the main document. This state
has no impact on the rebook strip.

### Loyalty banner — hide completely and silently

The active brand has not enabled a loyalty programme. Do not render the banner.
Do not explain the absence to the user — no "This brand doesn't have a loyalty
programme yet." This makes the brand look bad and reflects poorly on the platform.

**Rules:**

- Absence is silent. The section simply does not exist on screen.
- If the user switches brand context (via the chip in Quick Rebook) to a brand
  that does have a loyalty programme, the banner appears immediately for that brand.
- If the brand later enables a loyalty programme, the banner appears automatically
  on the user's next Home load.

**Conditional logic:**

```js
const loyaltyAccount = getLoyaltyAccount(userId, activeBrandId)

if (!loyaltyAccount || !loyaltyAccount.programmeEnabled) {
  return null
}
```

---

## State 3 — Has loyalty account, 0 points balance

This is the most important empty state to get right. It applies in two scenarios:

- User joined the brand's loyalty programme but has not yet completed a booking
  that earns points
- User had points and redeemed all of them down to zero

### Quick Rebook — normal

Show `QuickRebookStrip` normally. Points balance is irrelevant to the rebook strip.

### Loyalty banner — aspirational mode

Do not hide. Do not show `"0 pts"`. Show the banner in aspirational mode: flip
the framing from *"here is your progress"* to *"here is what you can earn."*

**Component:** `LoyaltyBannerAspirational` (variant of `LoyaltyBanner`)

```
┌──────────────────────────────────────────────┐
│  Start earning at Glam Studio  [Glam Studio▾] │
│  Book any service to earn your first points   │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  ← empty bar track, always visible
│  400 pts = free gel topcoat · Book to start → │
└──────────────────────────────────────────────┘
```

**Props / content:**

| Field | Value |
|-------|-------|
| Title | `"Start earning at [brandName]"` |
| Subtitle | `"Book any service to earn your first points"` |
| Progress bar | Rendered but empty (`width: 0%`) — bar track always visible |
| Milestone label | First reward in the brand's catalogue: `"[earnRate] pts = [rewardName]"` |
| CTA label | `"Book to start earning →"` |
| CTA action | Opens `QuickRebookSheet` bottom sheet |
| Brand chip | Rendered identically to the normal banner chip — same switcher behaviour |
| Background | `--color-background-info` (`#E6F1FB`) |
| Border | `0.5px solid --color-border-info` (`#B5D4F4`) |

**Rules:**

- The progress bar track must always be visible even at 0% fill.
- The milestone label is mandatory when `points === 0`.
- The milestone shown must be the first (lowest threshold) reward in the brand's
  catalogue. Fetch from `GET /loyalty/catalogue?brandId={id}&limit=1&sort=points_asc`.
- If the brand's catalogue is empty (no rewards configured yet), fall back to
  hiding the banner entirely (same as State 2).
- The CTA `"Book to start earning →"` opens the rebook bottom sheet. Do not
  navigate to the Rewards tab — the user needs to book, not browse rewards
  they cannot yet redeem.
- This same aspirational state applies when a user redeems all points to zero.
  The banner resets to aspirational mode — communicates "fresh start," not "empty."

**Conditional logic:**

```js
const loyaltyAccount = getLoyaltyAccount(userId, activeBrandId)
const firstReward    = getCatalogueFirstReward(activeBrandId)

if (!loyaltyAccount || !loyaltyAccount.programmeEnabled) {
  return null
}

if (loyaltyAccount.points === 0) {
  if (!firstReward) return null  // no catalogue — hide
  return (
    <LoyaltyBannerAspirational
      brandName={activeBrandName}
      brandId={activeBrandId}
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
    brandName={activeBrandName}
    brandId={activeBrandId}
    nextMilestone={loyaltyAccount.nextMilestone}
  />
)
```

---

## State 4 — Normal (has points > 0)

Both components render as specced in `zarkili_home_tab_spec_v2.md` Elements 3
and 4. No changes. Included here for completeness only.

---

## Decision tree — full logic

```
activeBrandId exists?
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
  LOYALTY_ASPIRE_TITLE:     "Start earning at {brandName}",
  LOYALTY_ASPIRE_SUBTITLE:  "Book any service to earn your first points",
  LOYALTY_ASPIRE_MILESTONE: "{points} pts = {rewardName}",
  LOYALTY_ASPIRE_CTA:       "Book to start earning →",
}
```

---

## API requirements

### Existing endpoints — parameter change only

```
GET /home/quick-rebook?userId={id}&brandId={activeBrandId}
  Returns empty array [] when no booking history → renders HomeDiscoveryCard

GET /home/loyalty-summary?userId={id}&brandId={activeBrandId}
  Returns null when no loyalty account, or { points: 0, ... } for zero balance
```

### New endpoint required

```
GET /loyalty/catalogue?brandId={id}&limit=1&sort=points_asc
  Response: { rewards: [{ id, name, pointsRequired, description }] }
  Returns [] when brand has no rewards configured
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
accessibilityLabel="0 of {pointsRequired} points earned toward {rewardName} at {brandName}"

// CTA
accessibilityRole="button"
accessibilityLabel="Book to start earning points at {brandName}"
```

### Silent hidden states

When `LoyaltyBanner` returns `null`, no accessibility announcement is needed.
Do not use `aria-hidden` on a component that simply does not render.

---

## Layout stability requirement

The vertical space between the Next Appointment card and the Trending /
Recommended sections must remain constant regardless of which state is active.

| State | Quick Rebook height | Loyalty banner height |
|-------|--------------------|-----------------------|
| State 1 | `HomeDiscoveryCard` — same height as `QuickRebookStrip` | 0 (hidden) |
| State 2 | `QuickRebookStrip` — normal | 0 (hidden) |
| State 3 | `QuickRebookStrip` — normal | `LoyaltyBannerAspirational` — same height as `LoyaltyBanner` |
| State 4 | `QuickRebookStrip` — normal | `LoyaltyBanner` — normal |

Both `HomeDiscoveryCard` and `LoyaltyBannerAspirational` must match the fixed
height of their normal-state counterparts. Use `minHeight` if content varies.

---

## Open decisions

| # | Decision | Affects | Owner |
|---|----------|---------|-------|
| 1 | What is the minimum number of rewards a brand must configure before the aspirational banner is shown? Suggested: 1. | State 3 loyalty banner | Product |
| 2 | Should `HomeDiscoveryCard` show a curated service card (e.g. top-rated nearby service) instead of just the CTA? | State 1 rebook area | Design + Product |
| 3 | When a user redeems all points to zero, should the aspirational banner animate in to signal the reset, or appear statically on next load? | State 3 transition | Design |

---

*End of spec — Zarkili Home Tab Empty States v2.0*
*Replaces: `zarkili_home_empty_states_spec.md` v1.1*
*Extends: `zarkili_home_tab_spec_v2.md`*
*Related: `zarkili_home_spec_diff_v2.md`*
