# Batch D — Payments, Tipping, Receipts

> Consumed by **Week 24**. Critical path. Stripe Connect Express + Stripe Tax (US).
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Screens: Saved payment methods · Add payment method · Tipping · Receipt · Booking history · Refund/dispute read-only.

New components: `payment-method-row`, `currency-input`, `tip-preset-chip-group`, `receipt-line-item`.

---

## SCREEN — D.1 Saved Payment Methods

```text
SCREEN: Saved Payment Methods    DEVICE: iPhone 14 390×844
LAYOUT
- Header back, title "Payment methods".
- Apple Pay row at top (always present, system-managed).
- List of payment-method-row (card brand icon, •••• last4, exp MM/YY, "Default" badge if set).
  Trailing kebab menu → Edit / Set default / Remove.
- "Add payment method" tertiary tile with + icon.
STATES: default, empty (illustration + "Add your first card"), removing-confirm modal-sheet, error.
```

---

## SCREEN — D.2 Add Payment Method

```text
SCREEN: Add Payment Method    DEVICE: iPhone 14 390×844
LAYOUT
- Header back, title "Add card".
- Stripe Elements card form: card number, exp MM/YY, CVC, ZIP (5-digit US).
- Cardholder name input.
- Toggle "Set as default".
- Body-small disclosure "Card secured by Stripe. We never see full card numbers."
- Sticky footer "Add card" primary CTA.
STATES: default, validating, declined banner ("Card declined — try another"), 3DS step (placeholder), success → back to D.1.
ACCESSIBILITY: each input labeled; CVC has accessibilityHint "3 or 4 digits on back of card".
```

---

## SCREEN — D.3 Tipping

```text
SCREEN: Tipping    DEVICE: iPhone 14 390×844 (or modal in C.7)
USER JOB: Pick or enter a tip in USD.

LAYOUT
- Heading-3 "Add a tip".
- tip-preset-chip-group: 15% · 18% · 20% · 25% · Custom · No tip.
- currency-input visible only when "Custom" selected (USD).
- Total updates live below.
- Body-small note: "100% of tips go to your stylist".
- Sticky footer "Confirm".
STATES: preset-selected, custom, no-tip (label still visible), error (custom < 0), loading.
ACCESSIBILITY: chips accessibilityLabel "20 percent tip, $4.50".
```

---

## SCREEN — D.4 Receipt

```text
SCREEN: Receipt    DEVICE: iPhone 14 390×844
LAYOUT
- Header back, title "Receipt".
- Salon name + address (US format).
- Date MM/DD/YYYY · time 12h.
- Service block: receipt-line-item rows (description, qty, price USD).
- Totals block: subtotal, sales tax (Stripe Tax — show jurisdiction "WA Sales Tax 10.25%"), tip, total.
- Payment method line (•••• 4242).
- Action row: Email receipt · Download PDF · Share.
- Tertiary "Report a problem" → opens dispute form (out of scope here).
STATES: default, emailing loader, emailed toast, error.
```

---

## SCREEN — D.5 Booking History (List + Filters)

```text
SCREEN: Booking History    DEVICE: iPhone 14 390×844
LAYOUT
- Header search-bar + filter-button.
- Tabs: Upcoming · Past · Cancelled.
- List of booking-card (compact): salon, service, date, time, status badge.
- Filters bottom-sheet: salon, date range (US date picker), status, price range.
- Pull to refresh; pagination at bottom.
STATES: default per tab, empty per tab ("No upcoming bookings — Find a salon" CTA → B.3), loading skeletons, error.
```

---

## SCREEN — D.6 Refund / Dispute Read-only

```text
SCREEN: Refund Status    DEVICE: iPhone 14 390×844
LAYOUT
- Header back, title "Refund details".
- Status banner: Pending / Issued / Denied.
- Timeline (vertical): Requested → Approved → Issued (each step with date MM/DD/YYYY).
- Booking summary (mini).
- Refund amount block (USD).
- Body text: "Refunds typically appear in 5–10 business days."
- Footer tertiary "Contact support".
STATES: pending, issued, denied (with reason), error.
```

---

## COMPONENTS

```text
payment-method-row — height 64, padding 16. Left: brand icon 32×20. Center: label "Visa •••• 4242", body-small muted "Expires 12/28". Right: default badge (mint-fresh) + kebab 24×24. Disabled state for expired card with error label.

currency-input — fixed leading "$" at left in label-large. Numeric keyboard. 2-decimal mask. Right-aligned amount. Min/max validation with helper text.

tip-preset-chip-group — chip variants based on existing chip component. Selected coral-blossom; "No tip" treated as opt-in destructive-tone outline.

receipt-line-item — 3-col layout: description (body 14/20, wraps), qty (label-small), amount (body 14/20 right). Optional second line for modifier description (body-small muted).
```

---

## Human Review Checklist

- [ ] Tokens exact match.
- [ ] All 6 screens + 4 components delivered.
- [ ] Stripe-managed card form rendered (do NOT design custom card-number capture; use Stripe Elements visual).
- [ ] Apple Pay row always present in D.1 even when zero cards saved.
- [ ] Sales tax line shows jurisdiction label (US Stripe Tax).
- [ ] Currency formatting: `$1,234.50` (US locale).
- [ ] Refund timeline reflects "5–10 business days" expectation.
- [ ] All required states delivered.
- [ ] Touch targets ≥44×44.
- [ ] Frames named `D-<screen>-<state>`.
