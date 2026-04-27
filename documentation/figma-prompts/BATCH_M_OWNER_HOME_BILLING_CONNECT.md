# Batch M — Owner Home, Tenant Settings, Billing, Connect, Payouts

> Consumed by **Weeks 33–34**. Critical path for Admin (Phase 3 start). Tablet-first.
> Always prepend the Global Design System Anchor from [`README.md`](README.md). Same tokens; admin uses higher information density.

Topics: Owner KPI dashboard · Operator notification center · Tenant settings shell · Business profile/brand/tax/legal/domain · Owner notification preferences · Admin coach-marks · Subscription plan + change-plan · Invoice history · Admin payment methods · Cancel/pause subscription · Stripe Connect onboarding · Connect health + restricted recovery · Payouts (history, balance, schedule) · Refund/dispute admin · PDF/print specs · Admin empty/loading/error/role-denied patterns.

New components: `data-table-v1`, `kpi-tile`, `sectioned-settings-layout`, `document-upload-tile`, `status-pill-variants`, `plan-card`, `invoice-row`, `alert-notification-row`, `coach-mark-popover` (already in L), `role-denied-empty-state`, `print-page-layout`.

---

## SCREEN — M.1 Owner KPI Dashboard

```text
SCREEN: Owner Home    DEVICE: iPad 1024×768 (primary), iPhone 14 fallback
LAYOUT
- Header: tenant switcher pill + location switcher pill + date-range picker (US format MM/DD/YYYY).
- KPI grid (4 columns on iPad, 2 on iPhone): Revenue, Bookings, New clients, AI savings (each as kpi-tile with sparkline + delta % vs prior period).
- Trend chart card (line, 30 days).
- "Today's appointments" preview list.
- alert-notification-row stack (top 5).
STATES: default, no-data (first-week salon), low-data, error, loading skeleton.
```

## SCREEN — M.2 Operator Notification Center

```text
SCREEN: Operator Notifications    DEVICE: iPad + iPhone
LAYOUT
- Tabs: All · Bookings · Payments · Payouts · AI · System.
- Filter bar: severity (info/warning/error), date range.
- alert-notification-row list (timestamp 12h, body, severity icon, action chip).
STATES: default, empty per tab, error, loading.
```

## SCREEN — M.3 Tenant Settings Shell

```text
SCREEN: Settings Shell    DEVICE: iPad + iPhone
LAYOUT (sectioned-settings-layout)
- Left sidebar (iPad) / collapsible groups (iPhone): Business · Locations · Staff · Services · Booking · Payments · Loyalty · Marketing · Integrations · Legal · Team & Permissions · Plan & Billing.
- Right pane: section content.
STATES: default, search-results, role-denied subsection.
```

## SCREEN — M.4 Business Profile / Brand / Tax / Legal / Domain (5 sub-sections)

```text
M.4.1 Business profile — name, EIN/Tax ID, business type (LLC/Sole prop), industry.
M.4.2 Brand — logo, accent color (constrained to brand palette), about copy.
M.4.3 Tax — Stripe Tax registration list with state codes (US sales tax), nexus warning banner if missing states.
M.4.4 Legal documents — document-upload-tile for W-9, articles of incorporation, ADA compliance attestation.
M.4.5 Domain — custom domain input + DNS verification status.
STATES: default, validating, error, role-denied.
```

## SCREEN — M.5 Owner Notification Preferences

```text
Same as F.5 but admin scope: New booking, Payment received, Payout settled, Connect issue, AI alert, Negative review.
States: default, saved.
```

## SCREEN — M.6 Admin First-Run Coach Marks

```text
Coach-mark-popover sequence anchored to: tenant switcher, KPI grid, calendar nav, AI suggestion slot, settings sidebar.
States: step 1..5, skipped, completed.
```

## SCREEN — M.7 Subscription Plan + Change

```text
SCREEN: Plans    DEVICE: iPad + iPhone
LAYOUT
- Three plan-card columns (Starter / Growth / Pro) — price USD/mo, features list, current-plan badge.
- Annual/Monthly toggle.
- Change CTA opens confirmation modal with proration body.
STATES: default, current, upgrading, downgrading (warning about feature loss), error.
```

## SCREEN — M.8 Invoice History

```text
SCREEN: Invoices    DEVICE: iPad + iPhone
LAYOUT
- data-table-v1: Date · Invoice # · Amount · Status pill · Download.
- Filters bar (date range, status).
STATES: default, empty, error, downloading.
```

## SCREEN — M.9 Admin Payment Methods

```text
Reuse D.1/D.2 with admin scope. Add ACH/bank account section + default toggle.
States: default, error.
```

## SCREEN — M.10 Cancel + Pause Subscription

```text
SCREEN: Cancel/Pause    DEVICE: iPad + iPhone
- Pause: duration picker (1 / 3 / 6 months) with body explainer.
- Cancel: reason picker + offer (50% off 3 months) + destructive confirm with typed "CANCEL".
States: default, paused, cancelling, cancelled.
```

## SCREEN — M.11 Stripe Connect Onboarding

```text
SCREEN: Connect Onboarding    DEVICE: iPad + iPhone
- Stepper: Business info · Owner identity · Bank account · Verification.
- document-upload-tile for ID, EIN letter.
- Progress bar to "Active".
STATES: in-progress, awaiting-Stripe, action-required (banner with link to Stripe), active, error.
```

## SCREEN — M.12 Connect Health + Restricted Recovery

```text
SCREEN: Connect Health    DEVICE: iPad + iPhone
- Status banner per state: active / pending / restricted / disabled.
- Required actions list with Stripe deep-link CTAs.
- Capability badges (charges, payouts).
STATES: each Connect state.
```

## SCREEN — M.13 Payouts (History, Balance, Schedule)

```text
SCREEN: Payouts    DEVICE: iPad + iPhone
- Balance card: pending $, available $, on-the-way $.
- Schedule controls: Daily / Weekly (day picker) / Monthly.
- data-table-v1 history: Date · Amount · Method · Status · Receipt.
STATES: default, no-balance, on-hold banner, error.
```

## SCREEN — M.14 Refund / Dispute Admin

```text
SCREEN: Disputes Admin    DEVICE: iPad + iPhone
- data-table-v1: client · booking · amount · reason · deadline · status pill.
- Detail drawer with evidence-upload area, response composer.
STATES: open, evidence-needed, submitted, won, lost, error.
```

## SCREEN — M.15 PDF/Print Specs

```text
print-page-layout templates (US Letter 8.5×11):
- Invoice template (header, line items, totals, footer with Stripe-Connect tenant info).
- Payout statement.
- Refund receipt.
Render at 100% with safe margins.
```

## SCREEN — M.16 Admin Empty / Loading / Error / Role-Denied Patterns

```text
Reusable pattern set (deliver as 4-frame component spec):
- Empty state: illustration + body + primary CTA.
- Loading: skeleton table rows.
- Error: heading + retry CTA + reference id.
- Role-denied (role-denied-empty-state): lock icon + "You don't have permission to view this" + "Request access" tertiary.
```

---

## COMPONENTS

```text
data-table-v1 — header row label-small uppercase, sortable carets, sticky first column on iPhone. Row 56 height. Zebra-stripe optional. Bulk-select column 32 wide. Sticky bulk-action bar appears on selection.

kpi-tile — surface white radius large 16 padding 16. Top: label-small muted; mid: heading-1 value; bottom: delta chip (mint-fresh + or error -); right inline sparkline.

sectioned-settings-layout — iPad: 280 sidebar + content pane. iPhone: collapsible groups with chevrons.

document-upload-tile — 1px dashed border #E5E0D1 radius medium 12, drag-drop zone, "Browse" tertiary, file row preview when uploaded with size + remove icon.

status-pill-variants — pill height 24, label-small uppercase. Variants: success (mint-fresh + accent-fg), warning (warning bg 10% + warning fg), error, info, neutral. Pair color with text always.

plan-card — radius 2xl 24, padding 24. Header tier name + price/mo USD. Feature list with check icons. CTA primary "Choose" or "Current" disabled.

invoice-row — date label / number monospace / amount right / status pill / download icon (44×44).

alert-notification-row — severity icon 24 + body + timestamp + dismiss icon.

role-denied-empty-state — lock icon 64 muted + heading-3 + body small + tertiary "Request access".

print-page-layout — US Letter portrait, 0.5" margins, header logo + tenant info, footer page n of m + tenant legal line.
```

---

## Human Review Checklist

- [ ] Tokens exact match.
- [ ] All 16 screens + 10 components delivered.
- [ ] iPad-first layouts validated.
- [ ] US tax registrations and EIN flows present.
- [ ] Stripe Connect Express flow renders all 4 states.
- [ ] Print templates use US Letter.
- [ ] Role-denied state present everywhere RBAC matters.
- [ ] Frames named `M-<screen>-<state>`.
