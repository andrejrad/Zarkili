# Zarkili — Rewards Tab Feature Specification

**Version:** 1.0
**Platform:** iOS + Android (React Native / Expo)
**Scope:** Rewards tab — logged-in user and guest user
**Data model:** `zarkili_service_data_model_v3.md`
**Dependencies:** `zarkili_home_tab_spec_v2.md`, `zarkili_home_empty_states_spec_v2.md`

---

## 1. Overview

### 1.1 Core principle

The Rewards tab is the loyalty programme surface. It is fundamentally different
from Home and Explore in one key way: a guest user has nothing to show here — the
entire tab is a value proposition and sign-up prompt. A logged-in member gets a
personalised, data-driven experience. There is no meaningful overlap in components
between the two states.

### 1.2 Brand-level loyalty

Points are earned and tracked at **brand level**, not location level. A booking at
"Glam Studio Shoreditch" and a booking at "Glam Studio Canary Wharf" both
contribute to the same "Glam Studio" balance. The Rewards tab always shows data
for the **active brand** (`activeBrandId`). The `BrandContextChip` in the header
allows switching between brands. Source collection: `user_brand_loyalty/{userId}_{brandId}`.

### 1.3 Immediate fixes required from current screen

| Priority | Issue | Fix |
|----------|-------|-----|
| Critical | `"tenant-aqua-salon"` raw Firestore ID in brand chip | Replace with `brand.name` from brand document |
| Critical | `"reward_redemption"` raw event type in history | Map to human-readable string via `EVENT_TYPE_LABELS` (see §5.5) |
| Critical | Date renders as `"05/02/202 / 6"` (line-break bug) | Use short date format `"2 May"` or `"2 May 2026"` |
| High | Progress shown as `"75%"` ring with no milestone context | Replace with linear bar + `"250 pts until Gold"` label |
| High | `"+50 pts"` hardcoded earn rate | Replace with dynamic rate from `brand.earnRatePerPound` |
| High | Guest CTA `"Explore salons"` | Replace with `"Create your account"` |
| Medium | No inline reward cards — rewards hidden behind a separate tap | Add `RedeemSection` component inline |
| Medium | Guest empty state shows Zarkili logo | Replace with contextual `ti-star` icon |
| Low | No multi-brand summary link | Add `"View all my brands →"` for multi-brand members |
| Low | No points expiry warning | Add amber `ExpiryWarningBanner` when points expire within 30 days |

---

## 2. Screen structure — logged-in user

### 2.1 Element order (top to bottom)

| # | Element | Condition | Brand-scoped |
|---|---------|-----------|-------------|
| 1 | Header — title + `BrandContextChip` | Always | Yes |
| 2 | `ExpiryWarningBanner` | Only when points expire within 30 days | Yes |
| 3 | Hero card — points, tier, progress | Always | Yes |
| 4 | Redeem section | Always (aspirational mode when 0 pts) | Yes |
| 5 | Earn more section | Always | Yes |
| 6 | Recent activity | Always | Yes |
| 7 | `"View all my brands →"` link | Multi-brand members only | No |

---

## 3. Element specifications — logged-in user

### 3.1 Header

**Contents:**
- Left: screen title `"Rewards"` — 22px, weight 500
- Right: `BrandContextChip` — brand display name + caret (`"Glam Studio ▾"`)

**`BrandContextChip` behaviour:**
- **Multi-brand member** (`userBrandLoyaltyDocs.length > 1`): tappable chip,
  opens `BrandSwitcherSheet`. Same chip, same sheet, same `activeBrandId` state
  as the Home tab (see `zarkili_home_spec_diff_v2.md`).
- **Single-brand member**: plain non-interactive label — `"Glam Studio"`. No
  caret, no tap affordance.

**On brand switch:**
All content below (hero card, redeem section, earn rates, history) re-fetches and
re-renders for the newly selected brand. 150ms skeleton flash during load.

**Rules:**
- The chip must display `brand.name` — never the Firestore document ID.
- No notification bell on Rewards. Bell is Home-only.

---

### 3.2 ExpiryWarningBanner

**Condition:** Shown only when the user has points at the active brand with an
`expiresAt` timestamp within the next 30 days. Hidden otherwise.

**Position:** Between the header and the hero card.

**Content:**
```
"150 pts expire on 30 Apr 2026 — redeem now?"   [Redeem →]
```

The `"Redeem →"` link scrolls the page to the Redeem section. It does not open
a new screen.

**Styling:**
```
background: #FAEEDA   (amber-light)
border:     0.5px solid #FAC775
color:      #633806   (amber-dark)
border-radius: var(--border-radius-md)
padding: 10px 14px
```

**Dismissible:** An `×` button dismisses the banner for the session. It
reappears on the next app session if points are still expiring.

**Rules:**
- Never show when there is no real expiry timestamp.
- Never fabricate urgency. This banner is strictly conditional on `expiresAt`.
- Never show more than one expiry banner even if multiple point batches are
  expiring — summarise the nearest: `"Your earliest 150 pts expire on 30 Apr"`.

---

### 3.3 Hero card — points, tier, progress

**What it shows:**
- Tier badge pill (top-left): `"SILVER"` — all-caps badge treatment only
- Points balance (large): `"1,250 pts"` — `toLocaleString()` for thousands separator
- Brand name (small, below balance): `"Glam Studio"`
- Linear progress bar — fills left to right, 600ms ease-in animation on first render
- Progress label below bar: `"250 pts until Gold · 1,500"`
- Decorative circular ring (right side) — visual decoration only, not the data carrier

**Progress label format:**
```
"[distance] pts until [nextTierName] · [nextTierThreshold]"
e.g. "250 pts until Gold · 1,500"
```

When the user is at the highest tier:
```
"You've reached our highest tier 🏆"
```

**Tier badge colours:**

| Tier | Background | Text |
|------|-----------|------|
| Bronze | `#FAEEDA` | `#633806` |
| Silver | `#E1F5EE` | `#085041` |
| Gold | `#FAEEDA` | `#412402` (use a gold hex in brand config if available) |

**Hero card tap action:** Opens a tier detail screen showing all tier names,
thresholds, and benefits for this brand's programme.

**Animation:**
- Progress bar: fills from 0% to current fill with 600ms ease-in on first render
- Ring: rotates simultaneously with bar
- Neither animation repeats within the same session

**Rules:**
- Frame as distance to next milestone: `"250 pts until Gold"` — never just
  `"75%"` or `"1,250 pts"` alone.
- Progress percentage is never shown as text. The bar position communicates
  percentage visually; the label communicates it meaningfully.
- If `nextMilestone` is null (highest tier reached), replace bar with a
  completion message.

---

### 3.4 Redeem section

**This is the most important addition missing from the current screen.** Users
should see what they can redeem right now without a separate "Browse rewards" tap.

#### 3.4.1 Section header

`"Redeem"` when at least one reward is available.
`"Earn toward a reward"` when no rewards are currently redeemable.

#### 3.4.2 Redeemable reward card (shown when `userPoints >= reward.pointsRequired`)

```
┌──────────────────────────────────────┐
│ [client or brand photo]              │
│ [Ready now] badge — top left         │
├──────────────────────────────────────┤
│ Free gel topcoat                     │
│ 400 pts          [Redeem and book]   │
└──────────────────────────────────────┘
```

**`"Redeem and book"` CTA:**

1. Tapping opens `RedemptionBottomSheet`
2. Sheet shows: reward photo, reward name, points cost, expiry date (if set),
   and two CTAs:
   - **`"Redeem and book"`** — applies the reward and opens the booking flow
     with the reward pre-attached. After booking confirmation: confetti burst
     at 50% intensity + medium haptic.
   - **`"Get a voucher code"`** — generates a one-time code for in-person use.
     Displays the code in a copyable pill. Code expires at the same time as the
     reward.
3. After a successful redemption, the user's points balance decreases with a
   500ms animated counter. Prevents "did it work?" anxiety.

**`"Ready now"` badge:**
```
background: #D4537E
color:      #FBEAF0
font-size:  10px, weight 500
position:   absolute, top-left of photo
```

#### 3.4.3 Next locked reward (always shown, at 60% opacity)

Shown immediately below the redeemable card. If no reward is currently
redeemable, this becomes the primary card at full opacity.

```
┌──────────────────────────────────────┐
│ Nail art add-on                      │
│ 600 pts                              │
│ Need 150 more pts                    │
└──────────────────────────────────────┘
```

Content:
- Reward name
- Points cost
- `"Need [n] more pts"` sub-label in `--color-text-secondary`
- No CTA — tapping does nothing (or shows a tooltip: "Keep booking to earn this")

Opacity: 60%. Signals availability without being a dead end.

#### 3.4.4 "See all rewards →" text link

Small text link below the reward cards. Opens a full-screen reward catalogue
for this brand. This replaces the current full-width `"Browse rewards"` button.

**Rules:**
- Never show `"Browse rewards"` as a full-width CTA button. Inline cards replace
  it entirely.
- Never pre-select add-ons in the redemption flow. The user must explicitly
  choose what they want.
- CTA copy is always `"Redeem and book"` — never `"Use points"` or `"Claim"`.

**Empty state (no rewards configured by brand):**
```
"[BrandName] hasn't set up their rewards catalogue yet.
Check back after your next visit."
```
Section is collapsed (0 height) — not shown as an error state.

---

### 3.5 Earn more section

Three earn action rows. Always shown in this order.

#### Row 1 — Book a service

```
[ti-calendar icon]  Book a service        [+ pts]
                    1 pt per £1 spent
```

- Points earned: dynamic from `brand.earnRatePerPound`. Display as
  `"[n] pt per £1 spent"` — never a hardcoded `"+50 pts"`.
- Right side label: `"+ pts"` (generic, since the amount varies per booking value).
- Tapping navigates to Explore tab filtered to this brand's location(s).

#### Row 2 — Refer a friend

```
[ti-users icon]     Refer a friend        [+200 pts]
                    When they complete their first booking
```

- Points value: fixed bonus configured in brand document (`referralBonusPoints`).
- Tapping opens referral bottom sheet with a shareable deep-link and a copy
  button for the referral code.
- If user has reached the monthly referral cap: grey out row, sub-label:
  `"Max referrals reached this month"`. Never silently leave an uncappable
  action in the list.

#### Row 3 — Leave a review

```
[ti-star icon]      Leave a review        [+25 pts]
                    +bonus pts for a photo
```

- Base points: `reviewBonusPoints` from brand config.
- Photo bonus: `reviewPhotoBonusPoints` from brand config.
- Sub-label shows both: `"+25 pts · +bonus for a photo"`.
- Tapping: if the user has an unreviewed completed appointment at this brand,
  deep-link to that review screen. If no unreviewed appointment: show a prompt
  `"You'll be able to leave a review after your next appointment"`.

**Rules for all earn rows:**
- All point values must come from brand config, never hardcoded in the component.
- Icons use Tabler outline only: `ti-calendar`, `ti-users`, `ti-star`.
- Icon container: 28×28px rounded square, background colour matches the row theme.

---

### 3.6 Recent activity (history)

#### 3.6.1 What it shows

Last 3–5 point transactions at the active brand, most recent first.

Each row:
- Left: human-readable event name + short date
- Right: points delta, colour-coded

#### 3.6.2 Event type label map

```js
const EVENT_TYPE_LABELS = {
  booking_completed:      (data) => `${data.serviceName} — ${data.locationName}`,
  reward_redemption:      (data) => `${data.rewardName} redeemed`,
  referral_bonus:         ()     => 'Friend referral bonus',
  review_bonus:           ()     => 'Review bonus',
  review_photo_bonus:     ()     => 'Photo review bonus',
  welcome_bonus:          ()     => 'Welcome bonus',
  manual_adjustment:      (data) => data.note ?? 'Points adjustment',
}
```

Never render raw event type strings in the UI. Always pass through this map.
If an event type is not in the map, render `"Points update"` as a safe fallback.

#### 3.6.3 Date format

```js
const formatActivityDate = (timestamp) => {
  const date = new Date(timestamp)
  const now  = new Date()
  const diffDays = Math.floor((now - date) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)  return `${diffDays} days ago`

  // Older entries: "14 May" or "14 May 2025" if different year
  const sameYear = date.getFullYear() === now.getFullYear()
  return date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
    ...(sameYear ? {} : { year: 'numeric' })
  })
}
```

Never use MM/DD/YYYY format. Never allow date text to wrap across lines —
use short format to prevent this.

#### 3.6.4 Points delta styling

| Type | Colour | Prefix |
|------|--------|--------|
| Earn | `#0F6E56` (teal-dark) | `+` |
| Redeem | `#A32D2D` (red-dark) | `−` (minus sign U+2212, not hyphen) |

#### 3.6.5 "See full history →" link

Text link below the last row. Opens a full-screen history view with:
- Filter chips: `All · Earned · Redeemed`
- All transactions for this brand, paginated (20 per page)
- Each row shows the same format as the inline history

#### 3.6.6 Empty state

```
"Your earning and redemption history will appear here."
```
One line, no illustration. The earn actions above provide context.

---

### 3.7 "View all my brands →" link

**Condition:** Only rendered when `userBrandLoyaltyDocs.length > 1`.
Hidden entirely for single-brand members.

**Position:** Below the Recent activity section, before the tab bar.

**Tap action:** Opens `BrandSummarySheet` — a bottom sheet listing all brands
the user is a member of.

**`BrandSummarySheet` row contents:**
- Brand initials avatar (deterministic colour from brand name)
- Brand name
- Points balance + tier: `"340 pts · Silver"`
- Upcoming appointment count: `"1 upcoming"` or `"0 upcoming"`
- Active brand has a `✓` checkmark

**On row tap:** Switches `activeBrandId` to that brand, dismisses sheet. Rewards
tab refreshes with the newly selected brand's data.

**Footer note inside sheet:**
```
"Points are separate per brand and cannot be combined or transferred."
```

---

## 4. Screen structure — guest user

### 4.1 Philosophy

A guest user has no loyalty account, no points, and no booking history. Showing
a locked or greyed version of the logged-in Rewards tab is frustrating, not
enticing. Instead: show the value proposition with concrete examples, then ask
for sign-up.

### 4.2 Element order

| # | Element |
|---|---------|
| 1 | Header — title only (no brand chip) |
| 2 | Value proposition card |
| 3 | Example reward chips |
| 4 | Primary CTA — `"Create your account"` |
| 5 | Secondary link — `"Already have an account? Log in"` |

---

## 5. Element specifications — guest user

### 5.1 Header

Screen title `"Rewards"` only. No `BrandContextChip` — guests have no brand
context. No notification bell.

### 5.2 Value proposition section

**Icon:**
`ti-star` at 48px, centred, in a 64×64px circle with background `#FBEAF0`,
icon colour `#D4537E`. Never use the Zarkili logo in empty states — the logo
is for brand identity (splash screen, onboarding). Empty states need a
contextually relevant icon.

**Headline:**
```
"Earn rewards with every visit"
```
18px, weight 500. Communicates the benefit, not the mechanism.
Current screen: `"Join a salon's loyalty programme to earn points"` describes
what the user must do. Recommended copy describes what they get.

**Body:**
```
"Book services and collect points toward free treatments and exclusive discounts."
```
14px, `--color-text-secondary`, line-height 1.6, max-width 280px, centred.

### 5.3 Example reward chips

Four chips in a 2×2 grid showing real-looking reward types from partner brands.
These are indicative examples, not actual rewards from a specific brand.

```
┌─────────────────┐  ┌─────────────────┐
│ ✦  Free gel topcoat │  │ ✂  £5 off blowout  │
└─────────────────┘  └─────────────────┘
┌─────────────────┐  ┌─────────────────┐
│ 👁  Free lash tint  │  │ ♡  Priority booking │
└─────────────────┘  └─────────────────┘
```

**Small label below chips:**
```
"Examples of rewards at partner salons"
```
11px, `--color-text-secondary`, centred. This label is mandatory — it clarifies
that these are examples, not a commitment from a specific brand.

**Chip styling:**
```
background: var(--color-background-primary)
border:     0.5px solid var(--color-border-tertiary)
border-radius: var(--border-radius-md)
padding: 6px 12px
font-size: 12px
```

**Icons inside chips:** Tabler outline icons at 14px:
`ti-sparkles`, `ti-scissors`, `ti-eye`, `ti-heart`

**Rules:**
- Always show exactly 4 chips. Never 3, never 5.
- Never label these as rewards from a specific brand.
- The label "Examples of rewards at partner salons" is mandatory.

### 5.4 Primary CTA

```
"Create your account"
```

Full-width rounded button. Background `#D4537E`, text `#FBEAF0`. 48px height.
Tapping opens the sign-up flow.

**This is not `"Explore salons"`.** A guest who taps the Rewards tab is already
intent on understanding loyalty value — they do not need to be sent back to
discovery. The correct action is account creation.

### 5.5 Secondary link

```
"Already have an account? Log in"
```

13px, `--color-text-secondary`. `"Log in"` part is tappable in `#993556`.
One tap opens the authentication screen.

---

## 6. `BrandSwitcherSheet` — shared with Home tab

The `BrandSwitcherSheet` component is shared between the Home tab chips and
the Rewards tab chip. It is the same sheet, same state, same `activeBrandId`.

Switching brand context on Rewards carries over if the user navigates to Home
(and vice versa). Full spec in `zarkili_home_spec_diff_v2.md`.

---

## 7. Data sources

### 7.1 Firestore reads on Rewards tab load

```js
// All reads fire in parallel on tab focus
const [loyaltySnap, rewardsSnap, historySnap, brandSnap] = await Promise.all([

  // 1. User's loyalty record for active brand
  getDoc(doc(db, 'user_brand_loyalty', `${userId}_${activeBrandId}`)),

  // 2. Brand's reward catalogue (first 5, ordered by pointsRequired asc)
  getDocs(query(
    collection(db, `brands/${activeBrandId}/rewards`),
    where('isActive', '==', true),
    orderBy('pointsRequired', 'asc'),
    limit(5)
  )),

  // 3. Point transaction history (last 5)
  getDocs(query(
    collection(db, 'point_transactions'),
    where('userId',  '==', userId),
    where('brandId', '==', activeBrandId),
    orderBy('createdAt', 'desc'),
    limit(5)
  )),

  // 4. Brand config (earn rates, tier thresholds)
  getDoc(doc(db, 'brands', activeBrandId)),
])
```

### 7.2 Firestore reads on brand switch

Same 4 parallel reads above, with the new `activeBrandId`. The previous brand's
data is replaced entirely — no merging.

### 7.3 `user_brand_loyalty` document fields used

```ts
interface UserBrandLoyalty {
  userId:         string
  brandId:        string
  brandName:      string    // display name — never show brandId in UI
  pointsBalance:  number
  tier:           string    // "Bronze" | "Silver" | "Gold" | brand-custom
  joinedAt:       string    // ISO timestamp
  lastActivityAt: string    // ISO timestamp
}
```

### 7.4 `brands/{brandId}` fields used on Rewards tab

```ts
interface BrandLoyaltyConfig {
  name:                  string   // display name for brand chip
  loyaltyEnabled:        boolean
  earnRatePerPound:      number   // pts earned per £1 spent — drives "Earn more" row
  referralBonusPoints:   number   // fixed bonus for successful referral
  reviewBonusPoints:     number   // base points for leaving a review
  reviewPhotoBonusPoints:number   // additional points for photo review
  tiers: Array<{
    name:       string    // "Bronze" | "Silver" | "Gold"
    minPoints:  number    // threshold for this tier
  }>
}
```

### 7.5 `point_transactions` collection

```ts
interface PointTransaction {
  id:          string
  userId:      string
  brandId:     string
  locationId:  string
  eventType:   string    // key into EVENT_TYPE_LABELS map
  eventData:   object    // { serviceName, locationName, rewardName, note, ... }
  pointsDelta: number    // positive = earn, negative = redeem
  balanceAfter:number    // running balance snapshot
  createdAt:   string    // ISO timestamp
}
```

---

## 8. API endpoints

```
GET /rewards/summary?userId={id}&brandId={activeBrandId}
  Response: {
    loyalty:   UserBrandLoyaltyObject,
    brand:     BrandLoyaltyConfigObject,
    nextTier:  { name, pointsRequired } | null
  }

GET /rewards/catalogue?brandId={id}&userId={id}&limit=5
  Response: {
    redeemable: RewardObject[],
    locked:     RewardObject[]    // sorted by pointsRequired asc
  }

GET /rewards/history?userId={id}&brandId={id}&limit=5&cursor={cursor}
  Response: {
    transactions: PointTransactionObject[],
    nextCursor: string | null
  }

GET /rewards/all-brands?userId={id}
  Response: {
    brands: Array<{
      brandId:       string,
      brandName:     string,
      pointsBalance: number,
      tier:          string,
      upcomingCount: number
    }>
  }

POST /rewards/redeem
  Body: { userId, brandId, rewardId, redemptionType: "book" | "voucher" }
  Response: {
    success: boolean,
    newBalance: number,
    voucherCode: string | null,    // only when redemptionType === "voucher"
    bookingFlowDeepLink: string | null
  }
```

---

## 9. RewardObject shape

```ts
interface RewardObject {
  id:             string
  brandId:        string
  name:           string          // "Free gel topcoat"
  description:    string | null
  pointsRequired: number
  photoUrl:       string | null   // reward or service photo
  isActive:       boolean
  expiresAt:      string | null   // ISO timestamp | null for no expiry
  // Client-computed at render time:
  isRedeemable:   boolean         // pointsRequired <= userPoints
  pointsNeeded:   number          // max(0, pointsRequired - userPoints)
}
```

---

## 10. Component map

| Component | Renders in | Notes |
|-----------|-----------|-------|
| `RewardsScreen` | Root | Switches between `LoggedInRewards` and `GuestRewards` based on auth state |
| `BrandContextChip` | Header | Shared with Home tab. Same `activeBrandId` state. |
| `BrandSwitcherSheet` | Modal | Opens from chip. Shared with Home tab. |
| `ExpiryWarningBanner` | Below header | Conditional — only when points expiring within 30 days |
| `LoyaltyHeroCard` | Section 1 | Tier badge, balance, progress bar, ring decoration |
| `RedeemSection` | Section 2 | `RewardCard` (redeemable) + `LockedRewardCard` + see-all link |
| `RedemptionBottomSheet` | Modal | Opens from "Redeem and book" CTA |
| `EarnMoreSection` | Section 3 | Three `EarnActionRow` components |
| `RecentActivitySection` | Section 4 | 3–5 `ActivityRow` components + see-full-history link |
| `BrandSummarySheet` | Modal | Multi-brand summary. Opens from "View all my brands →" |
| `GuestRewardsScreen` | Guest root | Value prop + example chips + sign-up CTA |

---

## 11. Accessibility

| Element | Requirement |
|---------|------------|
| Header brand chip | `accessibilityRole="button"`, `accessibilityLabel="Switch brand, currently Glam Studio"` |
| Hero card | `accessibilityRole="button"`, `accessibilityLabel="Silver tier, 1,250 points at Glam Studio. 250 points until Gold."` |
| Progress bar | `accessibilityRole="progressbar"`, `accessibilityValue={{ min: 0, max: 1500, now: 1250 }}`, `accessibilityLabel="1,250 of 1,500 points toward Gold tier"` |
| Redeemable reward card | `accessibilityLabel="Free gel topcoat. 400 points. Available to redeem now."` |
| Locked reward card | `accessibilityLabel="Nail art add-on. 600 points required. You need 150 more points."` |
| "Redeem and book" CTA | `accessibilityRole="button"` |
| Activity rows | `accessibilityLabel="[event name], [date], [+/−] [n] points"` |
| Expiry banner | `accessibilityLiveRegion="polite"` so screen readers announce it on render |
| Guest reward chips | `accessibilityElementsHidden={true}` — decorative examples, not interactive |
| Guest primary CTA | `accessibilityRole="button"`, `accessibilityLabel="Create your account"` |

---

## 12. Performance targets

| Metric | Target |
|--------|--------|
| Rewards tab initial load | < 1.0s on 4G |
| Brand switch → content refresh | < 600ms (skeleton during load) |
| `BrandSwitcherSheet` open | < 150ms (data already loaded) |
| Redemption bottom sheet open | Instant (data already loaded) |
| Points balance counter animation | 500ms ease-out on redemption |
| Progress bar animation | 600ms ease-in on first render |

---

## 13. Empty and edge states

| State | Component | Content |
|-------|-----------|---------|
| Guest (not logged in) | `GuestRewardsScreen` | Value prop + example chips + sign-up CTA |
| Logged in, no loyalty at active brand | `LoyaltyHeroCard` aspirational mode | "Start earning at [brand]" — see `zarkili_home_empty_states_spec_v2.md` |
| Logged in, loyalty exists, 0 pts | `LoyaltyHeroCard` aspirational mode | Same as above |
| Logged in, no rewards configured | `RedeemSection` hidden | Collapsed to 0 height — not an error state |
| Logged in, no earn actions | `EarnMoreSection` hidden | Only hide if brand config explicitly disables all three actions |
| Logged in, no history | `RecentActivitySection` | One-line text: `"Your earning and redemption history will appear here."` |
| Points expiring within 30 days | `ExpiryWarningBanner` | Amber banner with exact date |
| Brand switched, loading | Skeleton | All sections show skeleton at same height as real content |

---

## 14. Open decisions

| # | Decision | Affects | Owner |
|---|----------|---------|-------|
| 1 | Does each brand configure its own reward catalogue in Firestore, or is catalogue management a platform-level feature? This determines whether `brands/{brandId}/rewards` is the correct path. | `RedeemSection` data source | Product + Backend |
| 2 | Is `point_transactions` a top-level Firestore collection, or nested under `user_brand_loyalty`? | History query path | Backend |
| 3 | Do points expire? If so, is expiry per-point-batch (FIFO) or per-total-balance? | `ExpiryWarningBanner` logic | Product |
| 4 | What is the monthly referral cap, if any? | Earn more — refer a friend row | Product |
| 5 | Should the tier detail screen (tapped from hero card) be a full screen or a bottom sheet? | `LoyaltyHeroCard` tap action | Design |
| 6 | Should "Get a voucher code" persist the code in Firestore so it can be resurfaced, or is it generated fresh on each request? | `RedemptionBottomSheet` — voucher flow | Backend |

---

*End of specification — Zarkili Rewards Tab v1.0*
*Data model: `zarkili_service_data_model_v3.md`*
*Related:*
*— `zarkili_home_tab_spec_v2.md` (BrandContextChip, BrandSwitcherSheet)*
*— `zarkili_home_empty_states_spec_v2.md` (aspirational loyalty state)*
*— `zarkili_home_spec_diff_v2.md` (shared activeBrandId state)*
*— `zarkili_explore_tab_spec_v2.md`*
