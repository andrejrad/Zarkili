# Zarkili — Home Tab Inline Brand Switcher (Option B)

**Version:** 2.0 — Updated for Brand / Location hierarchy (data model v3)
**Replaces:** `zarkili_home_spec_diff.md` v1.0
**Applies to:** `zarkili_home_tab_spec_v2.md` — updates Elements 3 and 4

---

## What changed from v1.0

The concept and UX behaviour are identical. Only the naming changes:

| v1.0 | v2.0 |
|------|------|
| "salon switcher" | "brand switcher" |
| `SalonContextChip` | `BrandContextChip` |
| `SalonSwitcherSheet` | `BrandSwitcherSheet` |
| `activeSalonId` | `activeBrandId` |
| `salonId` (API params) | `brandId` (API params) |
| "multi-salon user" | "multi-brand user" |
| "single-salon user" | "single-brand user" |

The chip still shows the brand name (e.g. `"Glam Studio ▾"`). No visible
change to the user. The underlying state variable changes from `activeSalonId`
to `activeBrandId`.

---

## 3 changes to `zarkili_home_tab_spec_v2.md`

---

### Change 1 of 3

**Section:** `1.4 Element 3 — Quick Rebook Strip` — under the `**Rules**` heading

**Replace:**

```markdown
- Always labelled `"At [salonName]"` — never show this strip without the salon context label
```

**With:**

```markdown
- The section header right side shows a `BrandContextChip` component — not a plain text label.
  - **Multi-brand user** (`registeredBrands.length > 1`): renders as a tappable chip —
    `"Glam Studio ▾"` — with a caret. Tapping opens `BrandSwitcherSheet`.
  - **Single-brand user** (`registeredBrands.length === 1`): renders as a plain
    non-interactive label — `"At Glam Studio"` — with no caret and no tap affordance.
- On first launch for a new multi-brand user: chip plays a single 400ms scale pulse
  to signal it is interactive. Never repeats after the first session.
```

---

### Change 2 of 3

**Section:** `1.5 Element 4 — Loyalty Nudge Banner` — under the `**Content rules**` heading

**Replace:**

```markdown
- Always include brand name in the copy. Never just `"340 pts"` — always `"340 pts · Glam Studio"`.
```

**With:**

```markdown
- The banner header row shows the points balance on the left and a `BrandContextChip` on the right.
  - **Multi-brand user**: chip renders as `"Glam Studio ▾"` (tappable, opens `BrandSwitcherSheet`).
    Points balance shows without brand name since the chip provides context: `"340 pts"`.
  - **Single-brand user**: no chip. Points balance includes the brand name inline:
    `"340 pts · Glam Studio"`. No caret, no tap affordance.
- Never show just `"340 pts"` with no brand attribution on a single-brand setup —
  the brand name must always be visible somewhere on the banner.
```

---

### Change 3 of 3

**Section:** `6. API Endpoints Required`

**Replace:**

```markdown
GET /home/quick-rebook?userId={id}&salonId={activeSalonId}
  Response: { services: ServiceObject[], maxResults: 3 }

GET /home/loyalty-summary?userId={id}&salonId={activeSalonId}
  Response: { points: number, tier: string, nextMilestone: { name: string, pointsRequired: number } }
```

**With:**

```markdown
GET /home/quick-rebook?userId={id}&brandId={activeBrandId}
  Response: { services: ServiceObject[], maxResults: 3 }

GET /home/loyalty-summary?userId={id}&brandId={activeBrandId}
  Response: { points: number, tier: string, nextMilestone: { name: string, pointsRequired: number } }
```

**Add note below those two endpoints:**

```markdown
> **On brand switch:** Both endpoints fire simultaneously when `activeBrandId` changes.
> Neither endpoint is called for the next appointment card, trending, or recommended
> sections — those are unaffected by brand switching on Home.
```

---

## No other changes needed

The following are confirmed **unchanged** by this update:

| Element | Status |
|---------|--------|
| Element 1 — Greeting + header | No change — global, no brand context |
| Element 2 — Next appointment card | No change — always cross-brand / location |
| Element 5 — Trending near you | No change — always global |
| Element 6 — Recommended for you | No change — always global |
| Section 2 — Guest user Home | No change — guests have no brand context |
| Section 3 — Tab bar guest state | No change |
| Section 4 — Accessibility | No change — accessibilityLabels use display names, not field names |
| Section 5 — Performance targets | No change |
| Section 7 — Open decisions | No change |

---

## Shared state — how it works

Both chips (`BrandContextChip` in the Quick Rebook header and inside the Loyalty
banner) read from and write to the same `activeBrandId` in global app state.
They are two entry points to one value — not two independent controls. Switching
either chip updates both instantly.

The same `activeBrandId` is shared across Home, Bookings, and Rewards tabs.
Switching brand context on Home carries over when the user navigates to those tabs.

### BrandSwitcherSheet — behaviour spec

| Property | Value |
|----------|-------|
| Opens from | Tapping either `BrandContextChip` (Quick Rebook header or Loyalty banner) |
| Content per row | Brand initials avatar, brand name, points balance + tier, upcoming appointment count. Active brand has a checkmark. |
| On selection | Sheet dismisses. `activeBrandId` updates. Quick Rebook strip and Loyalty banner re-render with new brand's data. 150ms skeleton flash during load. |
| What does NOT change | Greeting, next appointment card, trending feed, recommended feed — all remain unchanged. |
| Single-brand user | `BrandContextChip` renders as a plain read-only label. Sheet never opens. |
| Persistence | Selection persists across sessions via `AsyncStorage`. |
| Discoverability | On first load for a new multi-brand user: chip does a single 400ms scale pulse. One time only — never repeats. |

---

## Firestore reads on brand switch

When `activeBrandId` changes, two Firestore reads fire in parallel:

```js
const [rebookSnap, loyaltySnap] = await Promise.all([
  // Quick Rebook strip data
  getDocs(
    query(
      collection(db, 'bookings'),
      where('userId',  '==', userId),
      where('brandId', '==', activeBrandId),
      where('status',  'in', ['confirmed', 'completed']),
      orderBy('createdAt', 'desc'),
      limit(3)
    )
  ),
  // Loyalty banner data
  getDoc(doc(db, 'user_brand_loyalty', `${userId}_${activeBrandId}`))
])
```

Neither the next appointment card nor the trending / recommended sections
re-fetch on brand switch — they are brand-agnostic.

---

*End of spec — Zarkili Home Tab Inline Brand Switcher v2.0*
*Replaces: `zarkili_home_spec_diff.md` v1.0*
*Applies to: `zarkili_home_tab_spec_v2.md`*
