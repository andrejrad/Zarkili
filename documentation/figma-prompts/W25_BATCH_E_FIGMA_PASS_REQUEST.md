# W25 — Batch E Figma Pass Request (Loyalty, Activities, Reviews)

> **Mode:** `figma-then-code` one-pass per [`FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md`](../FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md) — Steps 1–4.
> **Consumed by:** Week 25 engineering build.
> **Source of truth:** [`BATCH_E_LOYALTY_ACTIVITIES_REVIEWS.md`](BATCH_E_LOYALTY_ACTIVITIES_REVIEWS.md) (full prompt sheet — 9 screens, 5 components).
> **Scope of this Figma pass (one-pass rule):** **5 new components in all states** + **1 representative screen** (E.1 Loyalty Landing — composes 3 of the 5 new components in context). The remaining 8 screens (E.2–E.9) are built `code-only` against the BATCH_E prompts as build specs.
>
> This file mirrors how [Batch C — Booking flow](BATCH_C_BOOKING_FLOW.md) was packaged for W23 (calendar-grid + time-slot-chip components + 1 representative date-picker screen). Promotion outputs were the JSONs under [`design-handoff/components/`](../../design-handoff/components/) and [`design-handoff/specs/`](../../design-handoff/specs/).

---

## Step 1 — Novel patterns to lock (final list)

| # | Component | Why novel | Used by |
|---|---|---|---|
| 1 | `progress-ring` | First circular SVG progress in the system. Sizes 64 / 96 / 128. | E.1 Loyalty Landing, E.4 Activity List (inline 64) |
| 2 | `tier-badge` | First tier-coloured pill; must pair colour with label (WCAG). | E.1, E.3 |
| 3 | `reward-card` | First locked/unlocked overlay pattern + 16:10 image card. | E.2 Reward Catalog, E.3 |
| 4 | `rating-selector` | First `accessibilityRole="adjustable"` star input. | E.7 Review Prompt, E.8 Review Detail |
| 5 | `photo-upload-tile` | First in-row image upload primitive. | E.7 Review Prompt |

Locked components reused (do **not** redesign): `badge`, `bottom-tab-item`, `category-pill`, `chip`, `filter-button`, `search-bar`, `service-card`, `calendar-grid`, `time-slot-chip`.

---

## Step 2 — Prompts to paste into the Figma AI tool

Always paste the **Global Design System Anchor** (next section) immediately above each component / screen prompt. Do not deviate from those tokens.

### Global Design System Anchor (paste above every prompt)

```text
DESIGN SYSTEM: Zarkili v1.0.0 (do not deviate)

BRAND COLORS
- Primary       Coral Blossom    #E3A9A0   (CTAs, selected, brand accents)
- Secondary     Warm Oat         #D1BFB3   (secondary surfaces, dividers warm)
- Background    Cream Silk       #F2EDDD   (app background)
- Accent        Mint Fresh       #BBEDDA   (success/positive highlights, badges)

SEMANTIC
- Surface       #FFFFFF
- Foreground    #1A1A1A
- Text muted    #6B6B6B
- Border        #E5E0D1
- Accent fg     #2D4A42
- Success       #4CAF50
- Warning       #FF9800
- Error         #F44336
- Info          #2196F3

INTERACTION STATES
- Primary hover    #D99A90
- Primary pressed  #CF8B80
- Selected         #E3A9A0
- Disabled fg      #B0B0B0
- Disabled bg      #F5F5F5
- Overlay scrim    rgba(0,0,0,0.5)

TYPOGRAPHY (Manrope, weights 300/400/500/600)
- heading-1   32 / 40   weight 600
- heading-2   24 / 32   weight 600
- heading-3   20 / 28   weight 600
- heading-4   18 / 24   weight 500
- body        14 / 20   weight 400
- body-small  12 / 16   weight 400
- label       14 / 20   weight 500
- label-small 12 / 16   weight 500

SPACING (4pt grid)
- Allowed: 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96
- Page horizontal padding: 16
- Page vertical padding:   24
- Section gap:             24
- Element gap inside group: 12
- Min touch target:        44 × 44

RADII
- small  8   (chips, tag pills)
- medium 12  (buttons, inputs)
- large  16  (cards)
- 2xl    24  (prominent / hero cards)
- full   9999 (avatars, fully rounded pills)

EXISTING REUSABLE COMPONENTS — reuse, don't redraw
- badge, bottom-tab-item, category-pill, chip, filter-button, search-bar, service-card,
  calendar-grid, time-slot-chip
- Reference screens already shipped: welcome, home, explore, booking-date-picker,
  booking-time-picker

ACCESSIBILITY (WCAG 2.1 AA + ADA)
- Text contrast ≥ 4.5:1 on Cream Silk; large text ≥ 3:1.
- Every interactive element ≥ 44×44 with 8px hit slop.
- Icons paired with accessibilityLabel; decorative icons accessibilityElementsHidden.
- Respect prefers-reduced-motion: replace slide/fade > 200ms with instant or 100ms cross-fade.
- Dynamic type: layouts must not clip when body grows from 14 → 20.
- Color is never the sole carrier of meaning (pair with label/icon).

US-PRIMARY DEFAULTS
- Locale en-US · Currency USD ($) 2dp · Date MM/DD/YYYY · Time 12-hour AM/PM
- Phone (XXX) XXX-XXXX · Address Street/Apt/City/State(2)/ZIP(5 or 5+4)

REQUIRED STATES (every component must show)
default · pressed · selected · disabled · loading · empty · error
```

---

### Component prompt 1 of 5 — `progress-ring`

```text
COMPONENT: progress-ring     SIZES: 64, 96, 128

ANATOMY
- Outer circular SVG, stroke 8, square line-cap.
- Track stroke color #E5E0D1.
- Progress stroke color: variant "loyalty-tier" #BBEDDA (mint-fresh), variant "primary" #E3A9A0.
- Center stack: heading-3 label (e.g., "78%") + body-small muted sublabel (e.g., "260 to Gold").
- Sublabel optional.
- 360° = 1.0 progress; 0° anchor at top (12 o'clock); fills clockwise.

VARIANTS
- size: 64 | 96 | 128
- color: loyalty-tier (default) | primary
- withSublabel: true | false

STATES
- default        (progress 0–1)
- loading        (indeterminate: rotating 270° arc, 1.4s linear loop; reduce-motion → static 50% arc)
- empty          (progress = 0; track only; center label "0%")
- error          (progress arc color #F44336, center icon "alert-circle" 24)
- disabled       (track #F5F5F5, progress #D1BFB3, label #B0B0B0)

ACCESSIBILITY
- accessibilityRole "progressbar"
- accessibilityValue { min: 0, max: 100, now: <percent>, text: "<percent> percent, <sublabel>" }
- Reduce-motion: indeterminate → static.

DELIVER FRAMES (named exactly):
- E-component-progress-ring-default-64
- E-component-progress-ring-default-96
- E-component-progress-ring-default-128
- E-component-progress-ring-loading
- E-component-progress-ring-empty
- E-component-progress-ring-error
- E-component-progress-ring-disabled
```

---

### Component prompt 2 of 5 — `tier-badge`

```text
COMPONENT: tier-badge     PILL, height 24

ANATOMY
- Pill, height 24, paddingHorizontal 8, radius full.
- Leading icon 12 (optional, tier-specific glyph).
- Label: label-small uppercase, letter-spacing 0.5.
- Color paired with label (color is never the sole signal).

VARIANTS (background / foreground)
- bronze    #C77A50 / #FFFFFF      label "BRONZE"
- silver    #9AA3A8 / #FFFFFF      label "SILVER"   (note: AA-safe replacement for #B0B0B0)
- gold      #D4A24C / #1A1A1A      label "GOLD"
- platinum  #5E6B6E / #FFFFFF      label "PLATINUM"
- locked    #F5F5F5 / #6B6B6B      label "LOCKED"   icon "lock" 12

STATES
- default
- selected     (1px focus ring #1A1A1A, offset 2)
- pressed      (background -8% lightness)
- disabled     (use locked variant)

ACCESSIBILITY
- accessibilityRole "text"
- accessibilityLabel "<Tier> tier"
- Contrast verified ≥ 4.5:1 for each variant pair.

DELIVER FRAMES:
- E-component-tier-badge-bronze
- E-component-tier-badge-silver
- E-component-tier-badge-gold
- E-component-tier-badge-platinum
- E-component-tier-badge-locked
- E-component-tier-badge-selected
- E-component-tier-badge-pressed
```

---

### Component prompt 3 of 5 — `reward-card`

```text
COMPONENT: reward-card     CARD, radius large 16

ANATOMY
- Image top, aspect 16:10, radius top 16, image fit cover.
- Body padding 12, gap 4.
- Title heading-3, max 2 lines, ellipsis.
- Subtitle body-small muted, max 1 line.
- Footer row: points cost label-small with "PTS" suffix, right-aligned chip "Locked" (only when unaffordable).
- Whole card tappable; min height 220.

VARIANTS
- size:  default | compact (image aspect 4:3, title heading-4)
- state: unlocked | locked | redeemed | expired

STATES
- default      (unlocked, affordable)
- pressed      (scale 0.98, shadow soft)
- locked       (greyscale image filter, lock overlay 24 centered, label "Need <delta> more pts" body-small)
- redeemed     (mint-fresh corner ribbon "Redeemed")
- expired      (60% opacity, label "Expired" replaces points)
- loading      (image and text skeleton blocks)
- empty        (n/a — list-level empty state)
- error        (image fallback icon, label "Couldn't load")

ACCESSIBILITY
- accessibilityRole "button"
- accessibilityLabel "<title>, <points> points, <state>"
- accessibilityHint "Opens reward details"
- Hit area = full card; 44×44 minimum guaranteed.

DELIVER FRAMES:
- E-component-reward-card-default
- E-component-reward-card-pressed
- E-component-reward-card-locked
- E-component-reward-card-redeemed
- E-component-reward-card-expired
- E-component-reward-card-loading
- E-component-reward-card-error
- E-component-reward-card-compact
```

---

### Component prompt 4 of 5 — `rating-selector`

```text
COMPONENT: rating-selector     ROW of 5 stars

ANATOMY
- Row of 5 stars, gap 8, alignment center.
- Star sizes: full 32 (default), compact 24.
- Touch target 44×44 each (hit slop on 32-visual).
- Active fill #E3A9A0 (coral-blossom). Inactive stroke #6B6B6B with no fill.
- Below row (optional): label body-small reflecting selection ("Loved it!", "Great", "OK", "Meh", "Not for me").

VARIANTS
- size: default (32) | compact (24)
- showLabel: true | false
- readOnly: true | false (when true, suppresses pressed/focus state)

STATES
- default      (no selection)
- hovered/focused (preview: stars to the left of cursor pre-fill at 50% opacity)
- selected     (1–5 stars filled, label updates)
- pressed      (current star scale 1.1 for 80ms; reduce-motion → no scale)
- disabled     (inactive stroke #B0B0B0; no interaction)
- error        (helper-text "Please rate your visit" body-small color #F44336 below)

ACCESSIBILITY
- accessibilityRole "adjustable"
- accessibilityValue { min: 0, max: 5, now: <stars>, text: "<n> of 5 stars" }
- accessibilityActions [{ name: "increment" }, { name: "decrement" }]
- Tap-again on the same star clears to 0.

DELIVER FRAMES:
- E-component-rating-selector-default-32
- E-component-rating-selector-default-24
- E-component-rating-selector-hovered
- E-component-rating-selector-selected-3
- E-component-rating-selector-selected-5
- E-component-rating-selector-pressed
- E-component-rating-selector-disabled
- E-component-rating-selector-error
- E-component-rating-selector-readonly
```

---

### Component prompt 5 of 5 — `photo-upload-tile`

```text
COMPONENT: photo-upload-tile     TILE 80×80

ANATOMY
- Square 80×80, radius medium 12.
- Empty: dashed border 1, color #E5E0D1, plus icon 24 centered, label-small "Add photo" below at small grid sizes (optional).
- Filled: image cover, X-remove circular button 24×24 top-right offset (8,8) with #FFFFFF bg + #1A1A1A glyph + shadow soft.
- Used in a 5-tile grid (Review Prompt). Last tile remains "add" until max (5) reached.

VARIANTS
- state: empty | filled | uploading | error | disabled

STATES
- empty         (dashed border + plus 24)
- pressed       (background #F5F5F5)
- filled        (image visible, X-remove visible)
- uploading     (image at 50% opacity, centered spinner 24, no X)
- error         (red 1px border #F44336, retry icon 24 centered, accessibilityLabel "Upload failed, tap to retry")
- disabled      (border #F5F5F5, plus #B0B0B0)
- max-reached   (greyed plus + label "Max 5 photos")

ACCESSIBILITY
- Empty: accessibilityRole "button", accessibilityLabel "Add photo"
- Filled: accessibilityRole "image", accessibilityLabel "<n> of <total>"; X-remove is a separate accessibilityRole "button" "Remove photo <n>"
- Long-press preview optional, not required.

DELIVER FRAMES:
- E-component-photo-upload-tile-empty
- E-component-photo-upload-tile-pressed
- E-component-photo-upload-tile-filled
- E-component-photo-upload-tile-uploading
- E-component-photo-upload-tile-error
- E-component-photo-upload-tile-disabled
- E-component-photo-upload-tile-max
```

---

### Representative screen — E.1 Loyalty Landing

This is the only screen-level prompt to paste in this one-pass. It composes `progress-ring`, `tier-badge`, and `reward-card` inline previews together so designers and reviewers can verify the new components in context.

```text
SCREEN: Loyalty Landing     DEVICE: iPhone 14 390×844
PERSONA: Authenticated consumer with prior bookings.
USER JOB: See points balance + tier progress + next-best earning actions, then jump to rewards.

LAYOUT (top → bottom)
1. Header (height 56, paddingH 16): back chevron 44, title heading-3 "Rewards", right kebab 44.
2. Hero card (radius 2xl 24, gradient mint-fresh #BBEDDA → #F2EDDD, padding 24, marginH 16, marginTop 16):
   - Top row: tier-badge (variant gold) + body-small muted "Member since 03/2025" right-aligned.
   - Heading-1 "1,240 pts".
   - body "260 pts to Platinum".
   - progress-ring 96 inline at right (anchored top-right of card), variant loyalty-tier, sublabel "78%".
3. Section header label uppercase letter-spacing 0.5 "EARN MORE" (paddingH 16, marginTop 24).
4. Earn list (cards radius large 16, surface #FFFFFF, padding 16, marginH 16, gap 12):
   - Row icon 24 + title heading-4 + body-small muted helper + right pill "+50 pts" coral.
     • "Book a service" / "Earn 50 points per booking"
     • "Refer a friend" / "Earn 200 points when they book"
     • "Leave a review" / "Earn 25 points per review"
5. Section header "HISTORY" (marginTop 24).
6. Transactions list (surface #FFFFFF radius large 16 marginH 16 padding 0, divider #E5E0D1 between rows):
   - Row paddingH 16 paddingV 12: leading icon 24, title body, date body-small muted "MM/DD/YYYY", right amount label (+ green / − muted).
   - 5 sample rows minimum.
7. Sticky footer (height 80, surface with top border, paddingH 16): primary button "Browse rewards" full-width, height 48, radius medium, accessibilityLabel "Browse rewards catalog".

STATES (deliver one frame each)
- default                (1,240 pts, gold tier, 5 history rows)
- zero-balance           (0 pts, hero replaces ring with illustration 96, primary CTA "Earn your first points")
- tier-up celebration    (overlay sheet: confetti illustration + heading-2 "Welcome to Platinum" + body-small + CTA "See benefits"; reduce-motion fallback: static check icon, no confetti)
- loading                (header + skeleton hero (rectangle radius 2xl) + 3 skeleton earn cards + 3 skeleton history rows)
- error                  (banner top "We couldn't load your rewards" + retry button; rest of page hidden)

ACCESSIBILITY
- progress-ring exposes accessibilityValue { now: 78, text: "78 percent to Platinum, 260 points remaining" }.
- Hero is a single accessibility group titled "Rewards summary".
- Earn rows accessibilityRole "button", accessibilityHint "Open earning details".
- History list virtualized; per-row accessibilityLabel "<title>, <amount> points, <date>".
- Reduce-motion respected for tier-up overlay.

US-PRIMARY
- Dates MM/DD/YYYY · Numbers locale-formatted "1,240" · No currency on this screen.

DELIVER FRAMES (named exactly):
- E-1-loyalty-landing-default
- E-1-loyalty-landing-zero-balance
- E-1-loyalty-landing-tier-up
- E-1-loyalty-landing-loading
- E-1-loyalty-landing-error
```

---

## Step 3 — Human review checklist (gate before promotion)

Reject the pass and send back if any item fails:

- [ ] Tokens exact match — no new color, type size, spacing, radius, or shadow introduced.
- [ ] Every component has all required states present (default / pressed / selected / disabled / loading / empty / error where applicable).
- [ ] Tier color is **always** paired with a label or icon (color-only is rejected).
- [ ] Touch targets ≥ 44×44 (32-visual stars must show 44 hit slop in the spec).
- [ ] Reduce-motion fallback explicitly drawn for `progress-ring` indeterminate state and the E.1 tier-up overlay.
- [ ] Text contrast ≥ 4.5:1 for every variant; tier-badge silver uses #9AA3A8 not #B0B0B0.
- [ ] All accessibility roles / labels / values from the prompts are written into Figma frame notes.
- [ ] Frame names match exactly the lists in each prompt (`E-component-…` / `E-1-…`).
- [ ] No screen-level frames generated for E.2–E.9 in this pass (one-pass discipline).

---

## Step 4 — Required Figma → repo handoff (the desired output)

This is what must land in the repository before W25 engineering starts. Owner: design lead, with engineering reviewer.

### 4a. Frames (in the Figma file, exported references)

| # | Frame group | Count | Frame name pattern |
|---|---|---|---|
| 1 | progress-ring | 7 | `E-component-progress-ring-*` |
| 2 | tier-badge | 7 | `E-component-tier-badge-*` |
| 3 | reward-card | 8 | `E-component-reward-card-*` |
| 4 | rating-selector | 9 | `E-component-rating-selector-*` |
| 5 | photo-upload-tile | 7 | `E-component-photo-upload-tile-*` |
| 6 | E.1 Loyalty Landing | 5 | `E-1-loyalty-landing-*` |
| **Total** | | **43 frames** | |

Export as PNG @2x for review attachments and as Figma share link in the W25 PR description.

### 4b. JSON specs committed to `design-handoff/` (the source of truth)

Modeled exactly on existing files (compare against [`time-slot-chip.json`](../../design-handoff/components/time-slot-chip.json), [`calendar-grid.json`](../../design-handoff/components/calendar-grid.json), [`screen-booking-date-picker.json`](../../design-handoff/specs/screen-booking-date-picker.json)). Each must include `source.batch = "E"`, `source.promotedFrom`, `source.figmaFrames` array, and `source.lockedAt` ISO date.

| New file | Purpose |
|---|---|
| `design-handoff/components/progress-ring.json` | Anatomy / variants (size, color) / states / token refs / accessibility (role + value schema). |
| `design-handoff/components/tier-badge.json` | All 5 tier variants with verified contrast pairs / states / token refs. |
| `design-handoff/components/reward-card.json` | Anatomy (image, body, footer) / 4 state variants (unlocked, locked, redeemed, expired) / loading + error / interaction. |
| `design-handoff/components/rating-selector.json` | Sizes / readOnly variant / states / `accessibilityRole "adjustable"` value schema and clear-on-retap behavior. |
| `design-handoff/components/photo-upload-tile.json` | Empty / filled / uploading / error / disabled / max-reached / accessibility (separate roles for tile vs X-remove). |
| `design-handoff/specs/screen-loyalty-landing.json` | E.1 in all 5 states; references the 3 new components above by name. |

Schema reminder (mirrors `screen-booking-date-picker.json`): top-level `screen`, `description`, `purpose`, `flow`, `device`, `source`, `hierarchy`, `sections`, plus terminal `states` block. Components mirror `calendar-grid.json`: `component`, `description`, `purpose`, `source`, `variants`, `states`, `anatomy`, behaviour, accessibility.

### 4c. Manifest updates

| File | Update |
|---|---|
| `design-handoff/HANDOFF_MANIFEST.md` | Add the 5 new components + the E.1 screen spec under the "Phase 2 — Batch E (W25)" subsection. Bump `lockedAt` row. |
| `design-handoff/ASSET_MANIFEST.json` | Append entries for the 6 new JSON files with `batch: "E"` and `consumedByWeek: 25`. |
| `design-handoff/ACCESSIBILITY_GUIDE.md` | Add a paragraph on `accessibilityRole "adjustable"` (rating-selector) and tier-color label-pairing rule. |
| `documentation/PROGRAM_TRACKING_BOARD.md` | Flip `DESIGN-BATCH-E` to `[x]` with date. |
| `documentation/figma-prompts/BATCH_E_LOYALTY_ACTIVITIES_REVIEWS.md` | Append a closing note: "Components promoted YYYY-MM-DD — see `design-handoff/components/{progress-ring,tier-badge,reward-card,rating-selector,photo-upload-tile}.json` and `design-handoff/specs/screen-loyalty-landing.json`." |

### 4d. Acceptance gate (all must be true before W25 engineering kicks off)

- [ ] 43 frames exist in Figma with the exact names above.
- [ ] 6 new JSON files exist in `design-handoff/` with the structure above and reference only locked tokens.
- [ ] Manifest + accessibility guide + program board updated as listed in 4c.
- [ ] PR is reviewed by 1 designer + 1 engineer; review checklist in Step 3 attached and ticked.
- [ ] No frames or JSONs exist for E.2–E.9 yet (those are `code-only` in W25).

When the gate passes, engineering proceeds with `code-only` for E.2–E.9 against the prompts already in [`BATCH_E_LOYALTY_ACTIVITIES_REVIEWS.md`](BATCH_E_LOYALTY_ACTIVITIES_REVIEWS.md), composing the 5 newly-locked primitives.

---

## Quick links

- Full Batch E prompt sheet: [`BATCH_E_LOYALTY_ACTIVITIES_REVIEWS.md`](BATCH_E_LOYALTY_ACTIVITIES_REVIEWS.md)
- Workflow rules: [`FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md`](../FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md) (Steps 1–5)
- Priority + design-mode index: [`FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md`](../FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md)
- Worked precedent (Batch C / W23): [`BATCH_C_BOOKING_FLOW.md`](BATCH_C_BOOKING_FLOW.md), [`design-handoff/components/calendar-grid.json`](../../design-handoff/components/calendar-grid.json), [`design-handoff/specs/screen-booking-date-picker.json`](../../design-handoff/specs/screen-booking-date-picker.json)
