# Week 24 Close Report — Batch D: Payments, Tipping, Receipts (Consumer UI)

**Window:** Week 24 (Phase 2 consumer-UI fourth sprint).
**Status:** ✅ Complete — all 6 screens (D.1–D.6), 4 new shared-UI primitives, 2 helper modules, and Stripe SDK integration delivered + tested — GO for Week 25.
**Predecessor:** [WEEK23_CLOSE_REPORT.md](WEEK23_CLOSE_REPORT.md).

## 1. Scope

Per [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md) Batch D, W24 ships the consumer payments / tipping / receipts surface area: saved-card management, add-card flow with Stripe `CardField`, tip selection, transactional receipts, booking history with filters, and refund-status read screen — plus the Stripe SDK install required to make D.2 compile.

W24 was split into two focused sub-sessions at the user's request:

1. **Stripe install session** (separate, prior) — `@stripe/stripe-react-native` installed + Expo plugin registered + jest mock added; gates green at 1,904 unchanged before any W24 build began.
2. **W24 build session** (this report) — primitives, screens, helpers, routes, `StripeProvider` wiring, tests, and close docs.

Batch D Figma artifacts were **not** locked into `design-handoff/` for this sprint — screens were built code-first against the [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md) Batch D prompt brief. Promotion to `design-handoff/specs/*` is recorded as **W24-DEBT-1** below and slated for the next round of designer pickups.

## 2. Features Delivered

### 2.1 Stripe SDK integration

- `@stripe/stripe-react-native` installed via `npx expo install` (Expo SDK 54 compatible version, +12 / -5 packages).
- Expo config plugin registered in [app.config.ts](../../app.config.ts) with `merchantIdentifier: "merchant.com.zarkili"` and `enableGooglePay: false` (US-first launch — Apple Pay only).
- [App.tsx](../../App.tsx) now wraps the safe-area shell in `<StripeProvider publishableKey={Constants.expoConfig?.extra?.stripePublishableKey ?? ""} merchantIdentifier="merchant.com.zarkili">`. Publishable-key wiring through `expo-constants` `extra` is defensive — empty-string fallback prevents bootstrap crashes during local dev when the env-derived `extra` is missing.
- Jest mock for the SDK lives in [jest.setup.ts](../../jest.setup.ts) covering `StripeProvider`, `CardField`, `ApplePayButton`, `GooglePayButton`, `AddToWalletButton`, `useStripe()`, `useApplePay()`, `useConfirmPayment()`, `initStripe`, `isApplePaySupported`. Re-running the W23 baseline post-install showed no regressions (1,904 / 1,904 unchanged).

### 2.2 Foundation — `src/shared/ui/` (4 new primitives)

| Primitive | Surface |
|-----------|---------|
| `PaymentMethodRow` | 64h row with brand-glyph fallback (text-only; no raster shipped), brand + last4 title, expiry / Expired error subtitle, optional mint-fresh "Default" pill, optional kebab `⋮` action button. `accessibilityState` exposes `selected` and `disabled` (expired). |
| `CurrencyInput` | Leading "$" label-large + decimal-pad `TextInput` right-aligned at 24/32. Internal `sanitize()` strips non-digit/dot characters, allows a single `.`, and clamps to 2 decimal places. Emits both `onChangeText(string)` and `onChangeValue(number)`. |
| `TipPresetChipGroup` | `accessibilityRole="radiogroup"` row of `accessibilityRole="radio"` chips; selected chip uses `colors.primary` (coral-blossom) bg + white text; `destructive` chip variant uses dashed `colors.error` outline. Each chip is min 44pt high to satisfy WCAG 2.1 AA. |
| `ReceiptLineItem` | 3-col line: description + optional second-line modifier subtitle, optional `× qty` (hidden when `quantity === 1`), right-aligned formatted amount. |

All four reuse W21 design tokens (`src/shared/ui/tokens.ts`) unchanged. All are props-driven and have no business knowledge.

### 2.3 Pure helpers — `src/app/payments/`

#### `paymentsHelpers.ts`
Zero React imports. Exports:

- **Types:** `CardBrand`, `SavedPaymentMethod`, `OrderTotalLines`, `TipPreset`, `TipPresetKind`.
- **Card brand:** `normalizeCardBrand(raw)` — Stripe-string → `CardBrand` union with `"unknown"` fallback; `formatBrandLabel`, `formatLast4`, `formatCardLabel` ("Visa •••• 4242"), `formatCardExpiry` ("MM/YY"), `isCardExpired(expMonth, expYear, ref)` — handles invalid month → expired.
- **Currency:** `roundCents` (Math.round-based, NaN-safe → 0), `parseCurrencyInput` (strips `$`/`,`, returns `NaN` on garbage, truncates to 2 decimals), `formatUsd` ("$1,234.50" with thousands separator, leading minus for negatives).
- **Tipping:** `DEFAULT_TIP_PRESETS` (15 / 18 / 20 / 25 / Custom / None — ids `p15` / `p18` / `p20` / `p25` / `custom` / `none`); `tipAmountFromPreset({ preset, subtotal, customAmount })` clamped at ≥ 0.
- **Order totals:** `computeOrderTotal({ subtotal, taxRate?, tip? })` → `OrderTotalLines` with subtotal / tax / tip / grand-total all rounded to cents.
- **Tax labels:** `formatTaxLabel({ jurisdictionCode, ratePercent })` → "WA Sales Tax 10.25%"; `formatPercent` (drops trailing zero on integer rates).

#### `receiptsHelpers.ts`
Zero React imports. Exports:

- **Types:** `ReceiptLineItem`, `ReceiptTaxLine`, `ReceiptTotals`, `BookingHistoryRecord`, `BookingHistoryStatus`, `BookingHistoryTab`, `BookingHistoryFilters`, `RefundStatus`, `RefundTimelineStep`.
- **Receipt math:** `lineItemSubtotal` (qty clamped ≥ 0), `computeReceiptTotals({ items, taxLines, tip })` (tax-line amounts clamped ≥ 0; everything rounded to cents).
- **Display:** `formatPaymentMethodLine({ brand, last4 })`, `APPLE_PAY_PAYMENT_LINE`, `formatRefundAmountLabel(amount)` ("$45.00 refunded", clamped ≥ 0).
- **Booking history:** `BOOKING_HISTORY_TABS` (`upcoming` / `past` / `cancelled`), `BOOKING_HISTORY_TAB_LABELS`; `filterBookingHistory(records, tab, filters, now)` partitions by tab (upcoming = future + active; past = completed; cancelled = cancelled OR no-show) then applies salon / status / date / price filters; `countActiveBookingFilters` for filter-button badge.
- **Refund timeline:** `REFUND_STATUS_LABELS`, `buildRefundTimeline({ requestedAtIso, approvedAtIso?, issuedAtIso?, deniedAtIso? })` — emits a 3-step success path (Requested → Approved → Issued), 2-step denial branch, or partial-completion `current` marker.

### 2.4 Screens — `src/app/payments/` (6 screens)

| Screen | File | Composition |
|--------|------|-------------|
| **D.1 Saved Payment Methods** | `SavedPaymentMethodsScreen.tsx` | Apple-Pay top row (when supported) + `PaymentMethodRow` list (kebab → `ModalSheet` action menu: Set as default / Remove) + remove-confirm `ModalSheet` + dashed "Add payment method" tile + empty + loading + error states. |
| **D.2 Add Payment Method** | `AddPaymentMethodScreen.tsx` | Stripe `CardField` (PCI-out-of-scope — full PAN never reaches our layer) + cardholder-name `InputField` + 5-digit ZIP `InputField` (clamped) + Set-as-default `Switch` + declined-error banner + 3DS-in-progress placeholder banner + sticky footer Add card. CTA disabled until `cardComplete` + name + 5-digit ZIP. |
| **D.3 Tipping** | `TippingScreen.tsx` | `TipPresetChipGroup` (defaults + `customAmountInput`) + conditional `CurrencyInput` for the Custom preset + live total card + body-small "100% of tips go to your stylist" disclaimer + sticky footer Confirm with `totalLabel` / `totalValue` rendering. |
| **D.4 Receipt** | `ReceiptScreen.tsx` | Salon-name + address block, US date (MM/DD/YYYY) · 12h time, `ReceiptLineItem` list, totals (subtotal + per-jurisdiction tax lines via `formatTaxLabel` + tip + grand total), payment-method line (Apple Pay or "Visa •••• 4242"), action row Email / Download / Share + tertiary "Report a problem". |
| **D.5 Booking History** | `BookingHistoryScreen.tsx` | Search `TextInput` + filter button with active-count badge + `SegmentedControl` (Upcoming / Past / Cancelled) + booking-row list (status pill tone, formatted total) + `FilterSheet` placeholder for caller-supplied filters + load-more + per-tab empty states with "Find a salon" CTA on Upcoming. |
| **D.6 Refund Status** | `RefundStatusScreen.tsx` | Status `Banner` (info / success / error tone) + vertical timeline rendered from `buildRefundTimeline` (dot + connector with reached / pending / current states) + booking summary card + refund-amount block (USD) + denial-reason card (when denied) + "5–10 business days" disclaimer + tertiary Contact support footer. |

### 2.5 Routes

Six new public `guard: "none"` routes appended to [src/app/navigation/routes.ts](../../src/app/navigation/routes.ts):

`SavedPaymentMethods` `/payments/methods`, `AddPaymentMethod` `/payments/add`, `Tipping` `/payments/tip`, `Receipt` `/payments/receipt`, `BookingHistory` `/bookings/history`, `RefundStatus` `/payments/refund`.

Anonymous-route ordering snapshot in [src/app/navigation/\_\_tests\_\_/routes.test.ts](../../src/app/navigation/__tests__/routes.test.ts) extended with the 6 new entries after `PostBookingUpgrade`.

## 3. Tests

- **Root jest:** 1,904 → **1,953** passing across 124 → **128** suites (+49 tests, +4 suites).
- **Functions vitest:** **187** passing across 14 suites (unchanged — Batch D is consumer-UI + payments-shell only).
- **`npx tsc --noEmit`** (root): 0 errors. **`cd functions; npx tsc --noEmit`**: 0 errors.

New suites:

- [src/app/payments/\_\_tests\_\_/paymentsHelpers.test.ts](../../src/app/payments/__tests__/paymentsHelpers.test.ts) — 14 cases covering brand normalization, card-label formatting, expiry detection (incl. invalid month → expired), `roundCents`, `parseCurrencyInput`, `formatUsd` (including thousands separator + negative leading minus), `tipAmountFromPreset` (none / percent / fixed / clamp), `computeOrderTotal` (rounding + clamps), `formatTaxLabel`, `formatPercent`.
- [src/app/payments/\_\_tests\_\_/receiptsHelpers.test.ts](../../src/app/payments/__tests__/receiptsHelpers.test.ts) — covers `lineItemSubtotal` (qty clamps), `computeReceiptTotals` (aggregate + negative-tax clamp), `formatPaymentMethodLine`, `formatRefundAmountLabel`, `filterBookingHistory` partitioning all three tabs against a 4-record fixture (`now = 2026-04-27T12:00:00Z`), `countActiveBookingFilters`, and `buildRefundTimeline` (success / denial / partial branches).
- [src/shared/ui/\_\_tests\_\_/payments-primitives.test.tsx](../../src/shared/ui/__tests__/payments-primitives.test.tsx) — covers all 4 W24 primitives: `PaymentMethodRow` brand+last4 render, default badge, kebab callback, expired error label, row press; `CurrencyInput` non-numeric strip, 2-decimal clamp, multiple-dot rejection, error helper render; `TipPresetChipGroup` chip rendering + onSelect callback; `ReceiptLineItem` qty hide-when-1 / show-when->1 / modifier subtitle.
- [src/app/payments/\_\_tests\_\_/paymentsScreens.test.tsx](../../src/app/payments/__tests__/paymentsScreens.test.tsx) — smoke renders for all 6 D.* screens with key state branches (empty / populated lists, denied refund with reason, etc.).

## 4. Security

- **PCI scope avoided:** `AddPaymentMethodScreen` uses Stripe `CardField`; the full PAN, CVC, and expiry never reach our application layer — they are tokenized inside the Stripe SDK and only an opaque `paymentMethod.id` returns. `BookingPaymentScreen` (W23) and `SavedPaymentMethodsScreen` (W24) operate exclusively on tokenized references.
- **Apple Pay only on iOS for v1:** `enableGooglePay: false` in the Expo plugin to avoid shipping a half-configured Google Pay surface ahead of merchant onboarding. Adding Google Pay is a deliberate later step; not a debt — a strategy choice.
- **No new Firestore rules surface:** W24 screens are props-driven and own no Firestore I/O; persistence (PaymentMethods document model + Stripe Customer linking) is **W24-DEBT-2** below.
- **TCPA / consent surface unchanged** from W23. No new SMS / email triggers in W24.
- **WCAG 2.1 AA preserved:** every interactive ≥ 44×44 (tip chips min-height `spacing.touchTarget`, `PaymentMethodRow` row 64h with 44h kebab), `TipPresetChipGroup` exposes `radiogroup` / `radio` / `selected` state, `PaymentMethodRow` exposes `selected` + `disabled` accessibility state, `CurrencyInput` exposes `accessibilityValue` with formatted USD.
- **US-primary defaults:** `$1,234.50` thousands separator (`formatUsd`), MM/DD/YYYY (`formatUsDate`), 12h "h:mm AM/PM" (`formatTimeOfDay`), 5-digit ZIP, jurisdictional tax labels ("WA Sales Tax 10.25%").

## 5. Architectural Notes

- **Pure-helper pattern preserved.** Both `paymentsHelpers.ts` and `receiptsHelpers.ts` have zero React imports, so the same brand-normalization / receipt-math / refund-timeline logic can be reused server-side (functions package — receipt PDF rendering, refund-status webhook handlers) without rewrites.
- **Screens remain props-driven.** `useStripe().createPaymentMethod`, Apple Pay merchant validation, Stripe Customer methods listing, and PaymentSheet presentation are all caller-wired by the navigator layer rather than embedded in screens. This keeps screen tests render-without-provider and mirrors the W22 + W23 pattern.
- **`PaymentMethodRow` ships dependency-free.** Brand glyphs are text-only ("VISA" / "MC" / "AMEX" / "CARD") rather than shipping a network-card-icon raster set; callers can pass a `leadingIcon: ReactNode` if/when designers ship raster assets — no breaking change.
- **`CurrencyInput` owns light formatting only.** It does not enforce min/max — that's caller responsibility — but it does accept `errorText` to render the validation surface uniformly across D.3 / future P2P-tip flows.
- **`computeOrderTotal` and `computeReceiptTotals` are deliberately separate.** The first composes a fresh order pre-tax-line breakdown (rate-based); the second composes a finalized receipt with already-resolved tax lines (Stripe Tax line-items). Conflating would force receipts through a rate-only path the moment Stripe Tax goes live.
- **`buildRefundTimeline` returns an explicit step list.** Rendering iterates and chooses dot styling per `step.status` (`reached` / `current` / `pending`) rather than the screen branching on `RefundStatus` directly — adding a new step (e.g. "Refund disputed") becomes a helper change, not a screen rewrite.
- **`SegmentedControl` API.** Confirmed during build that the W21 primitive uses `value` (not `selectedValue`) + `onChange<T extends string>`. `BookingHistoryScreen` consumes the generic with `onChange={(v: BookingHistoryTab) => …}` to keep type narrowing.
- **`FilterSheet` requires `applyLabel`.** W22 primitive contract — caught during type-check and supplied as `"Apply"` to keep the sheet idiomatic across booking-history filter usage.

## 6. Debt Register (per [DEBT_REGISTER.md](DEBT_REGISTER.md))

- **Closed (1):** **W23-DEBT-2** (Stripe in-flow payment surface) — replaced by the W24 install + `CardField`-based `AddPaymentMethodScreen` + `useStripe()` mock contract for tests. Actual server-side `setupIntent` + 3DS confirmation is now part of W24-DEBT-2 below (clearer ownership boundary).
- **New W24 debts (3):**
  - **W24-DEBT-1** — Promote Batch D Figma artifacts to `design-handoff/specs/*` (`screen-saved-payment-methods.json`, `screen-add-payment-method.json`, `screen-tipping.json`, `screen-receipt.json`, `screen-booking-history.json`, `screen-refund-status.json`) and components (`payment-method-row.json`, `currency-input.json`, `tip-preset-chip-group.json`, `receipt-line-item.json`). Coordinate with designers — code is locked code-first for now and screens reference the playbook prompt rather than a JSON spec.
  - **W24-DEBT-2** — Stripe server-side payment infrastructure: `createPaymentIntent` / `confirmPaymentIntent` / `createSetupIntent` Cloud Functions; `paymentMethods/{id}` Firestore document model with Stripe Customer linking; webhook handler extension for `payment_method.attached` / `.detached` / `payment_intent.succeeded` / `.payment_failed`. The W24 SDK install + screen surface is the consumer side only.
  - **W24-DEBT-3** — Receipt PDF rendering pipeline (Cloud Function emitting a PDF to a Storage path keyed by `bookings/{id}/receipt.pdf` + signed-URL handoff). `ReceiptScreen.onPressDownload` / `onPressEmail` are caller wiring placeholders today.
- **Carried forward:** W19-DEBT-4, W19-DEBT-5, W20-DEBT-2, W20-DEBT-3, W20-DEBT-4, W22-DEBT-1 (react-native-maps W28), W22-DEBT-3 (editorial / sponsored feed repository), W23-DEBT-1 (booking persistence + cloud-function flow), W23-DEBT-3 (cancel / reschedule mutation backend + audit trail).

## 7. Index — Changed Files

- **New (production):** `src/shared/ui/{PaymentMethodRow,CurrencyInput,TipPresetChipGroup,ReceiptLineItem}.tsx`; `src/app/payments/{paymentsHelpers,receiptsHelpers}.ts`; `src/app/payments/{SavedPaymentMethodsScreen,AddPaymentMethodScreen,TippingScreen,ReceiptScreen,BookingHistoryScreen,RefundStatusScreen}.tsx`.
- **New (tests):** `src/app/payments/__tests__/{paymentsHelpers,receiptsHelpers}.test.ts`; `src/shared/ui/__tests__/payments-primitives.test.tsx`; `src/app/payments/__tests__/paymentsScreens.test.tsx`.
- **Modified:** `App.tsx` (StripeProvider wiring + `expo-constants` import); `app.config.ts` (Stripe Expo plugin); `jest.setup.ts` (Stripe SDK mock); `package.json` / `package-lock.json` (Stripe dep); `src/shared/ui/index.ts` (W24 primitive exports under `// W24 Batch D primitives`); `src/app/navigation/routes.ts` (+6 public `/payments/*` + `/bookings/history` routes); `src/app/navigation/__tests__/routes.test.ts` (anonymous-route snapshot extended); `documentation/new-platform/WEEKLY_LOG.md`; `documentation/PROGRAM_TRACKING_BOARD.md`.

## 8. Next-Week Prerequisites (Week 25)

W25 inherits W21 + W22 + W23 + W24 primitives unchanged. Prerequisites:

- W24-DEBT-2 server-side payment infrastructure (`createPaymentIntent` / `setupIntent` Cloud Functions + PaymentMethods Firestore model + Stripe Customer linking) gates real-money flows on D.1 / D.2 / D.7-link-from-C.7. Without it, the navigator wires mock data + a no-op `onSubmit` on the add-card screen.
- W23-DEBT-1 read ports (`getBookingsForUser`, plus W22 salon-profile / availability ports) gate `BookingHistoryScreen` against live data. Without them, `records` is mock-fixture-driven from the navigator.
- W24-DEBT-3 receipt PDF pipeline is required for the Email / Download / Share row in `ReceiptScreen` to wire to actual artifacts. Until then the buttons surface caller-supplied toasts only.
- The Stripe publishable key is read from `Constants.expoConfig?.extra?.stripePublishableKey` — wire this through Expo `app.config.ts` `extra` from the appropriate per-environment env file before W25 sandbox runs.

