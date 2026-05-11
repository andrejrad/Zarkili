# Week 39 Close Report — Phase 3: Billing & Payouts Admin

**Date closed:** 2026-05-11  
**Week:** W39  
**Phase:** Phase 3 — Admin Console  
**Jest baseline entered:** 2,686 tests  
**Jest baseline closed:** 2,717 tests (+31)  
**TypeScript:** `tsc --noEmit` — 0 errors  

---

## 1. Objectives

W39 delivered the full Billing & Payouts admin console cluster: all screens needed for subscription management, invoice access, payment methods, Stripe Connect onboarding, payout visibility, and refund/dispute review. Also closed five carry-in debt items from W14 and W38.

---

## 2. New Files Created

### Domain layer

| File | Purpose |
|------|---------|
| `src/domains/billing/invoiceService.ts` | `Invoice` type + `InvoiceService` interface + `createInvoiceService()` factory |
| `src/domains/billing/payoutService.ts` | `Payout`, `PayoutSchedule`, `PendingBalance` types + `PayoutService` + factory |
| `src/domains/billing/index.ts` | Updated: adds `export * from "./invoiceService"` and `export * from "./payoutService"` |

### App layer — services

| File | Purpose |
|------|---------|
| `src/app/admin/billingAdminService.ts` | `BillingAdminService` interface + `PLAN_CATALOGUE` + `createBillingAdminService()` factory wrapping all four domain services |

### App layer — screens (10 screens)

| Screen | Route | Description |
|--------|-------|-------------|
| `BillingHubScreen.tsx` | `BillingHub` | Subscription summary, Connect health dot, pending balance card, nav rows to all billing sub-screens. **W14-DEBT-3: SuspensionBanner** (red for suspended, amber for past_due with upgrade CTA) |
| `SubscriptionPlanSelectionScreen.tsx` | `SubscriptionPlan` | Plan cards (starter/professional/enterprise), monthly/annual interval toggle, confirm-plan-change flow |
| `InvoiceHistoryScreen.tsx` | `InvoiceHistory` | Invoice list with status pills + PDF download button |
| `AdminPaymentMethodScreen.tsx` | `AdminPaymentMethod` | Card list, default badge, set-default, 2-step remove confirm |
| `CancelSubscriptionScreen.tsx` | `CancelSubscription` | 6-reason cancellation flow, period-end vs immediate timing, pause subscription alternative |
| `StripeConnectOnboardingScreen.tsx` | `StripeConnectOnboarding` | Country/tax-form selection (W-9 / W-8BEN), 4-step what-happens-next guide, active state |
| `ConnectHealthStatusScreen.tsx` | `ConnectHealth` | Status banner, capability pills, restriction reason list, payout failure history, 1099-K eligibility |
| `PayoutHistoryScreen.tsx` | `PayoutHistory` | Available/pending balance card, editable payout schedule, payout list with status pills |
| `RefundDisputeAdminScreen.tsx` | `RefundDisputeAdmin` | Tab bar (Refunds/Disputes), urgent dispute highlighting, initiate-refund action |
| `PrintPdfLayoutComponent.tsx` | `PrintPdfLayout` | Invoice, payout statement, refund receipt PDF layouts. **W14-DEBT-4: InvoiceTaxBreakdown** renders per-jurisdiction tax lines |

---

## 3. Files Updated

### Existing screens (debt closures)

| File | Change |
|------|--------|
| `src/app/admin/OwnerNotificationPreferencesScreen.tsx` | **W38-DEBT-8 closed:** `handleSave` now calls Firestore `setDoc(tenants/{tenantId}/ownerNotificationPrefs/prefs, {...prefs, updatedAt: serverTimestamp()}, {merge: true})`; saving/error state added |
| `src/app/admin/LegalDocumentsScreen.tsx` | **W38-DEBT-9 closed:** Upload `onPress` now calls `updateDoc(tenants/{tenantId}/legalDocuments/{docId}, {status: 'on_file', ...})`; `statusOverrides` local state for optimistic update; `uploadingId` spinner; TODO for `expo-document-picker` (Phase 3.5) |
| `src/app/admin/TenantSettingsShellScreen.tsx` | Added `TenantSettingsSection` keys: `billing`, `plan`, `invoices`, `payment-method`, `cancel-subscription`, `connect`, `connect-health`, `payouts`, `refunds-disputes`; added "Billing & subscription" and "Payouts & Stripe Connect" groups with 9 new `AdminSectionRow` entries |

### Navigation

| File | Change |
|------|--------|
| `src/app/navigation/AppNavigatorShell.tsx` | Added imports for all 10 new screens + `BillingAdminService` + billing domain types; added `billingAdminService?: BillingAdminService \| null` prop; added 9 billing state variables (subscription, invoices, methods, payouts, balance, schedule, connect, refunds, disputes); added 6 async loader callbacks; updated `useEffect` to trigger loaders on route; updated `TenantSettingsSection` route map with 9 new entries; added 10 `if (activeRoute.name === "...")` route blocks; added 10 entries to `NO_TAB_ROUTES` |

---

## 4. Debt Items Closed

| ID | Description | Resolution |
|----|-------------|------------|
| W14-DEBT-3 | Admin suspension banner + upgrade CTA | `BillingHubScreen.tsx` `SuspensionBanner` renders red/amber banner with navigation CTA |
| W14-DEBT-4 | Tax breakdown on admin invoices | `PrintPdfLayoutComponent.tsx` `InvoiceTaxBreakdown` renders per-jurisdiction lines |
| W38-DEBT-8 | OwnerNotificationPreferences Firestore write | `setDoc` wired to `tenants/{tenantId}/ownerNotificationPrefs/prefs` |
| W38-DEBT-9 | LegalDocumentsScreen upload stub | `updateDoc` wired to `tenants/{tenantId}/legalDocuments/{docId}`; file-picker TODO for W40 |
| W13-DEBT-2 | Admin billing UI (tracked as open billing hub) | Fully delivered: `billingAdminService`, `BillingHubScreen`, 8 sub-screens, navigation wiring |

---

## 5. Tests

File: `__tests__/w39BillingAdmin.test.tsx`  
**31 test cases** across 10 describe blocks:

| Suite | Cases | Coverage |
|-------|-------|---------|
| SubscriptionPlanSelectionScreen | 3 | Plan cards render, interval toggle, changePlan called on confirm |
| InvoiceHistoryScreen | 3 | Invoice rows, download button, empty state |
| AdminPaymentMethodScreen | 2 | Card + default badge, confirm-remove step |
| CancelSubscriptionScreen | 3 | Reason options, proceed button, confirm cancel button |
| StripeConnectOnboardingScreen | 4 | Country selection, tax form options, launch enabled, active state |
| ConnectHealthStatusScreen | 2 | Active account (no empty state), restricted shows resolve button |
| PayoutHistoryScreen | 3 | Balance tiles, payout rows, edit schedule button |
| RefundDisputeAdminScreen | 3 | Refunds tab, tab switch to disputes, urgent dispute renders |
| BillingHubScreen (W14-DEBT-3) | 4 | Active subscription (no banner), suspended banner + CTA, past-due banner + CTA, CTA navigation |
| PrintPdfLayoutComponent (W14-DEBT-4) | 4 | Invoice layout, per-jurisdiction tax breakdown, payout statement, refund receipt |

---

## 6. Architecture Decisions

- **`billingAdminService` as single injection point:** All 8 billing sub-screens accept the same `BillingAdminService` prop (not individual domain services), keeping AppNavigatorShell prop count manageable.
- **Print layout is preview-only on native:** `PrintPdfLayoutComponent` renders as a `ScrollView` for in-app preview. Actual PDF file generation is delegated to a Cloud Function (same `type+data` payload, server-side `pdfkit`/`puppeteer` — Phase 3.5 scope).
- **`statusOverrides` for legal documents:** Firestore write completes but no read-back is wired. The local override map provides instant feedback after upload, consistent with the "optimistic update" pattern used elsewhere.

---

## 7. Remaining Open Items (carry to W40)

| ID | Description |
|----|-------------|
| W38-DEBT-10 | Admin console first-run coach marks overlay |
| W38-DEBT-2 | SalonProfileScreen getSalonById backend (Phase 2 scope) |
| — | `expo-document-picker` file-bytes upload for LegalDocuments (LegalDocumentsScreen has Firestore status wired; pixel Transport is Phase 3.5) |
| — | `billingAdminService` real Stripe/Cloud Function integration (currently stub factory) |
| — | W40: Admin Reporting & Analytics screens |

---

## 8. Test Suite Status

```
Test Suites: 163 passed, 163 total
Tests:       2717 passed, 2717 total
Snapshots:   0 total
TypeScript:  0 errors (tsc --noEmit clean)
```
