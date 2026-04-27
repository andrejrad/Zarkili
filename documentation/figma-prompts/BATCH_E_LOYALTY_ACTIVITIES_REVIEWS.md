# Batch E — Loyalty, Activities, Reviews

> Consumed by **Week 25**.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Screens: Loyalty landing · Reward catalog · Reward redemption · Activity/challenge list · Activity detail · Claim activity reward · Review prompt · Review detail · Referral landing.

New components: `progress-ring`, `tier-badge`, `reward-card`, `rating-selector`, `photo-upload-tile`.

---

## SCREEN — E.1 Loyalty Landing

```text
SCREEN: Loyalty Landing    DEVICE: iPhone 14 390×844
LAYOUT
- Hero card (radius 2xl 24, mint-fresh accent gradient): tier-badge + balance heading-1 ("1,240 pts") + body-small "Silver — 260 pts to Gold".
- progress-ring 96 with current tier progress.
- Section "Earn more": list of next-best actions ("Book a service +50 pts", "Refer a friend +200 pts", "Leave a review +25 pts").
- Section "History" — list of point transactions with date MM/DD/YYYY and ± amount.
- Sticky footer "Browse rewards" → E.2.
STATES: default (with points), zero-balance ("Earn your first points" CTA), tier-up celebration overlay (animation; reduce-motion fallback to static), error, loading.
```

---

## SCREEN — E.2 Reward Catalog

```text
SCREEN: Reward Catalog    DEVICE: iPhone 14 390×844
LAYOUT
- Header back, title "Rewards", points balance pill top-right.
- Filter chips: All · Free · Discount · Experience · Partner.
- Grid (2-col) of reward-card.
- Sticky bottom: "Sort: Lowest points" tertiary.
STATES: default, locked rewards (greyed with required points label), empty (no rewards), error, loading skeleton grid.
```

---

## SCREEN — E.3 Reward Redemption

```text
SCREEN: Reward Redemption    DEVICE: iPhone 14 390×844
LAYOUT
- Hero image of reward.
- Title heading-2 + value (USD).
- Cost in points; current balance.
- Terms (collapsible).
- Sticky CTA "Redeem for 500 pts".
- After redeem: success modal-sheet with QR code (200×200), expiry date, "Add to wallet" CTA.
STATES: default, insufficient-points (CTA disabled + "Earn more" link), redeeming loader, redeemed (QR), expired, error.
```

---

## SCREEN — E.4 Activity / Challenge List

```text
SCREEN: Activities    DEVICE: iPhone 14 390×844
LAYOUT
- Header tabs: Active · Completed · All.
- Cards (radius large): icon, title heading-3, progress bar (e.g., "2 of 3 bookings"), reward chip ("+100 pts").
- Section "New this month".
STATES: default, empty per tab, expired-banner inside card, loading, error.
```

---

## SCREEN — E.5 Activity Detail

```text
SCREEN: Activity Detail    DEVICE: iPhone 14 390×844
LAYOUT
- Hero (mint-fresh).
- Heading-2 + body description.
- Steps list (numbered) with completion checkmarks.
- Reward block (points + bonus rewards).
- Expiry date label-small (US format).
- Sticky CTA "Start" or "Continue" or "Claim reward" (state-driven).
STATES: not-started, in-progress, ready-to-claim, completed, expired, error.
```

---

## SCREEN — E.6 Claim Activity Reward

```text
SCREEN: Claim Reward    DEVICE: bottom modal-sheet
LAYOUT
- Animation success burst (reduce-motion: static check icon).
- Heading-2 "Reward earned".
- Reward summary card.
- Primary "Add to my rewards" → E.2.
- Tertiary "Done".
STATES: default, claiming loader, claimed, already-claimed banner, error.
```

---

## SCREEN — E.7 Review Prompt

```text
SCREEN: Review Prompt    DEVICE: iPhone 14 390×844
PERSONA: Just-completed-booking consumer.
USER JOB: Leave star rating + photo + text in ≤ 60 seconds.

LAYOUT
- Header back, title "How was it?".
- Salon mini-card.
- rating-selector 5 stars 32 with label below ("Loved it!").
- Aspect rating chips: Service · Cleanliness · Value · Atmosphere (each 1–5 mini selector).
- photo-upload-tile grid (max 5).
- Multi-line text input "Share your experience" (placeholder, 500 char counter).
- Toggle "Post anonymously" (off by default).
- Sticky footer "Submit review" CTA.
STATES: default (empty), rating-only (CTA enabled at 1+ star), uploading photos, profanity-warning banner, submitted success → toast → home, error.
ACCESSIBILITY: stars accessibilityValue "3 of 5 stars selected".
```

---

## SCREEN — E.8 Review Detail

```text
SCREEN: Review Detail    DEVICE: iPhone 14 390×844
LAYOUT
- Author header (avatar 40, name, posted date MM/DD/YYYY).
- Star rating + aspect ratings as chips.
- Body text.
- Photo gallery (gallery-carousel).
- Salon response card (if any) with "Owner response" label.
- Helpful counter + Report kebab.
STATES: default, with-response, reported (greyed), removed-by-moderation, error.
```

---

## SCREEN — E.9 Referral Landing

```text
SCREEN: Referral    DEVICE: iPhone 14 390×844
LAYOUT
- Hero illustration.
- Heading-2 "Give $10, get $10".
- Body explaining offer (US legal-safe wording).
- Personal referral code box (large, copyable, monospace? Use label-large, 4-letter dashes).
- Share button (system share sheet).
- Stats row: invited, joined, earned.
- FAQ collapsible.
STATES: default, copied (toast), share dispatched (system), error.
```

---

## COMPONENTS

```text
progress-ring — circular SVG, stroke 8, track #E5E0D1, progress coral-blossom (or mint-fresh for tier). Center label heading-3 + body-small muted. Sizes 64, 96, 128. accessibilityValue percent.

tier-badge — pill, height 24, label-small uppercase. Variants: Bronze (#C77A50), Silver (#B0B0B0 → use #9AA3A8 for AA), Gold (#D4A24C), Platinum (#5E6B6E). Always pair label with color (no color-only meaning).

reward-card — 16:10 image top, body padding 12, title heading-3, points cost label-small, "Locked" overlay with lock icon when unaffordable. Tap → E.3.

rating-selector — row of 5 stars 32×32 (or 24 compact). Tap to select; tap again to clear. Hover/focus shows preview. accessibilityRole = "adjustable", accessibilityValue exposes current.

photo-upload-tile — 80×80 tile with + icon when empty; with image when filled (X to remove top-right 24×24). Loading state shows 24 spinner overlay.
```

---

## Human Review Checklist

- [ ] Tokens exact match.
- [ ] 9 screens + 5 components delivered.
- [ ] Tier color always paired with label (color-only is not WCAG-safe).
- [ ] Review submission has profanity guardrail UI.
- [ ] Anonymous review toggle defaults OFF.
- [ ] Referral copy reviewed by US legal stub (no money-transmitter trigger).
- [ ] Reduce-motion fallbacks for celebration animations.
- [ ] Touch targets ≥44×44 (stars use 44 hit slop even at 32 visual).
- [ ] Frames named `E-<screen>-<state>`.
