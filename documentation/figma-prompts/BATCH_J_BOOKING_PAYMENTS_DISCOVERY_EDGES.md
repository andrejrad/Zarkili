# Batch J — Booking, Payments, Discovery, Reviews Edge Cases

> Consumed by **Weeks 30–31**.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Topics: Slot conflict mid-flow · Multi-service / recurring / on-behalf booking · Deposits + fee disclosures · 3DS / payment failure / retry · Apple Pay / Google Pay sheets · Pre-auth / split / gift card / promo / wallet top-up · Refund + dispute display · Search recents/saved/suggestions/no-results/sort · Near-me / map / cluster / pin detail · Hours/holidays/directions/share/report/block salon · Reviews filters/sort/helpful/reply/edit-delete/lightbox/guidelines.

New components: `3ds-overlay`, `payment-method-row` variants (gift card, wallet), `conflict-recovery-modal`, `map-cluster`, `search-suggestion-row`, `helpful-unhelpful-chip`.

---

## SCREEN — J.1 Slot Conflict Mid-Flow

```text
SCREEN: Slot Conflict    DEVICE: bottom modal-sheet (iPhone 14)
LAYOUT
- Warning illustration (small).
- Heading-3 "That time was just taken".
- Body suggesting nearest 3 alternatives (time-slot-chip).
- Tertiary "See more times" → C.4.
- Primary "Pick this time" enabled when alt selected.
STATES: default, no-alternatives ("Try another day" CTA), error.
```

## SCREEN — J.2 Multi-Service / Recurring / On-Behalf

```text
J.2.1 Multi-service booking — variant of C.1 with multi-select plus duration totalizer; sticky banner "1h 30m total".
J.2.2 Recurring booking — modal-sheet asking frequency (Weekly/Biweekly/Monthly), # occurrences, end date.
J.2.3 Book on behalf of another — toggle in C.5 "Booking for someone else" → name + phone fields.
States per: default, max-services-reached, recurring-conflict warning, on-behalf-required-fields error.
```

## SCREEN — J.3 Deposits + Fee Disclosures

```text
SCREEN: Fee Disclosure Sheets    DEVICE: bottom modal-sheet
- Deposit required: amount $, refund policy.
- Cancellation fee: cutoff time + amount.
- Reschedule fee: amount.
- No-show fee: amount + ack required.
- Acknowledge checkbox + primary "Continue".
States: default, acknowledged, declined → exit.
```

## SCREEN — J.4 3DS / Payment Failed / Retry

```text
SCREEN: 3DS Challenge Overlay    DEVICE: full-screen modal
- Stripe-managed iframe placeholder centered (with bank logo).
- Cancel button top-right.
States: pending, approved, declined banner, timeout.

SCREEN: Payment Failed
- Heading-2 "Payment didn't go through".
- Reason body (e.g., "Card declined by issuer").
- Actions: Retry · Use another method · Contact support.
States: declined, insufficient-funds, network, error.
```

## SCREEN — J.5 Apple Pay / Google Pay Sheets

```text
Render placeholders illustrating:
- Apple Pay sheet (per Apple HIG).
- Google Pay sheet (per Google brand).
- Local-method sheet (US: ACH bank debit if approved).
States: ready, pending, completed, cancelled.
```

## SCREEN — J.6 Pre-Auth / Split / Gift Card / Promo / Wallet Top-Up

```text
J.6.1 Pre-auth disclosure — body small "We'll authorize $X. The final amount will be charged after your visit."
J.6.2 Split payment — modal showing two payment-method-row entries with $ allocated.
J.6.3 Gift card — input gift-card code + balance reveal + apply CTA.
J.6.4 Promo code — input + apply + discount line in summary.
J.6.5 Wallet top-up — currency-input ($, USD), preset chips $25/$50/$100, primary "Top up".
States per: default, valid, invalid, applied, removed, error.
```

## SCREEN — J.7 Refund + Dispute Display

```text
Re-uses D.6 Refund Status pattern. Add dispute view:
- Status pill: Disputed.
- Body explaining dispute window (US Reg E / Visa rules).
- Read-only timeline + supporting evidence list.
States: open, resolved (won/lost), error.
```

## SCREEN — J.8 Search Recents / Saved / Suggestions / No-Results / Sort

```text
SCREEN: Search Helpers    DEVICE: iPhone 14
- Recents list (clear all CTA).
- Saved searches list (rename, delete).
- Suggestion rows during typing (search-suggestion-row).
- No-results state with "Expand search" suggestions.
- Sort menu modal-sheet: Recommended, Distance, Rating, Price low-high.
```

## SCREEN — J.9 Near-Me / Map / Cluster / Pin Detail

```text
SCREEN: Map Variants    DEVICE: iPhone 14
- map-cluster: numbered bubble pins (mint-fresh).
- Pin detail bottom-sheet peek.
- Permission denied overlay → "Enter ZIP" fallback.
States: granted, denied, no-results-in-view, error.
```

## SCREEN — J.10 Salon Actions

```text
SCREEN: Salon Action Sheet    DEVICE: bottom modal-sheet
- Hours & holidays (US holidays list).
- Directions (open in Apple/Google Maps).
- Share salon.
- Report salon (form).
- Block salon (destructive confirm).
States: default, reporting, reported toast, blocked, error.
```

## SCREEN — J.11 Reviews Edge Cases

```text
SCREEN: Review Helpers
- Filters & sort modal-sheet (rating, date, with photos).
- helpful-unhelpful-chip on each review row.
- Salon reply form (owner side teased; consumer sees reply only).
- Edit / delete my review with destructive confirm.
- Photo lightbox (pinch zoom + swipe).
- Review guidelines page (legal-page-layout).
States: filtered, sorted, helpful-voted, edited, deleted, lightbox open, error.
```

---

## COMPONENTS

```text
3ds-overlay — full-screen scrim with white centered card 320×420 (radius 2xl) holding bank iframe placeholder + cancel.

conflict-recovery-modal — modal-sheet with warning header + 3 alternatives + see-more link.

map-cluster — circular pin coral-blossom for single, mint-fresh with white count for cluster (sizes 32 / 40 / 48).

search-suggestion-row — leading icon (recent / saved / suggested 24) + label body + trailing arrow / remove icon. Highlight matched substring in coral-blossom.

helpful-unhelpful-chip — 2 chips (👍 N · 👎 N) with tappable count; pressed state filled.
```

---

## Human Review Checklist

- [ ] All 11 screen groups + 6 components delivered.
- [ ] All US fee disclosures use $.
- [ ] 3DS overlay matches Stripe-hosted spec.
- [ ] ApplePay/GooglePay buttons follow platform HIG.
- [ ] CCPA "Do Not Sell" continues to apply on report/share screens for CA users.
- [ ] All required states delivered.
- [ ] Frames named `J-<screen>-<state>`.
