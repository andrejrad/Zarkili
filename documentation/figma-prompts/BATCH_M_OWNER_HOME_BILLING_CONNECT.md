# Batch M — Owner Console Foundation: KPI, Tenant Settings, Billing & Connect

> Consumed by **Weeks 38–39**. iPad-first (768×1024 primary), iPhone fallback.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).
> Admin density — higher information density than consumer UI. All screens render at tablet/desktop breakpoints. figma-then-code mode.

Topics: Owner KPI dashboard · Operator notification center · Tenant settings shell · Business profile · Brand settings · Tax settings · Legal documents (upload) · Domain settings · Owner notification preferences · Admin first-run coach-mark tour · Subscription plan selection · Invoice history · Admin payment method management · Cancel/pause subscription · Stripe Connect onboarding · Connect health status · Payout history + schedule · Refund/dispute admin · PDF/print layout spec.

New components: `data-table-v1` (sortable, selectable, bulk-action), `kpi-tile` (value + trend + delta + sparkline), `sectioned-settings-layout` (master-detail sidebar nav), `document-upload-tile` (status-aware upload), `status-pill` (6 variants: active/restricted/pending/error/disabled/info), `plan-card` (pricing + features + CTA), `invoice-row`, `alert-notification-row` (severity-coded left border), `role-denied-empty-state`, `print-page-layout` (@react-pdf context), `admin-coach-mark` (multi-step overlay popover).

---

## SCREEN — M.1 Owner Home / KPI Dashboard

```text
SCREEN: Owner Home    DEVICE: iPad 768×1024 (primary), iPhone 14 fallback
LAYOUT
- Header bar: tenant switcher pill + location switcher pill + date-range picker (US format MM/DD/YYYY).
- KPI grid (4 columns on iPad, 2×2 on iPhone): Revenue (USD), Bookings, New clients, AI Savings — each as kpi-tile (value heading-1, delta chip mint-fresh/error, inline sparkline).
- Trend chart card: line chart 30 days, date x-axis, revenue y-axis, tooltip on hover.
- "Today's appointments" preview list: time 12h · staff name · service · status pill.
- alert-notification-row stack (top 5, newest first).
STATES: default, no-data (first-week salon — empty KPI with onboarding CTA), low-data (< 7 days), error, loading skeleton.
```

## SCREEN — M.2 Operator Notification Center

```text
SCREEN: Operator Notifications    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Tabs: All · Bookings · Payments · Payouts · AI · System (match alert categories).
- Filter bar: severity chips (info / warning / error), date range picker (US MM/DD/YYYY).
- alert-notification-row list: severity icon 24 + heading body + timestamp 12h + optional action chip + dismiss 44×44.
- Unread badge count on each tab.
STATES: default (unread highlighted), empty per tab (empty state illustration), all-read, error, loading.
```

## SCREEN — M.3 Tenant Settings Shell

```text
SCREEN: Settings Shell    DEVICE: iPad 768×1024 + iPhone
LAYOUT (sectioned-settings-layout)
- Left sidebar 280px (iPad) / collapsible group list (iPhone):
  sections: Business Profile · Brand · Tax · Currency · Legal Documents · Domain · Notifications.
- Active section highlighted with coral-blossom left border.
- Right content pane fills remainder.
- Search field in sidebar header for subsection discovery.
STATES: default, search-results (highlighted matches), role-denied subsection (lock icon + role badge), loading skeleton.
```

## SCREEN — M.4 Business Profile Settings

```text
SCREEN: Business Profile    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Form: Business name, EIN / Tax ID (masked), Business type picker (Sole Proprietorship / LLC / Corporation / Partnership), Industry, Founded date (US MM/DD/YYYY), Support email, Support phone (US format).
- Save / Discard footer bar (sticky on iPad when content overflows).
STATES: default (read mode), editing (highlight changed fields), saving (spinner on button), saved (toast), error, role-denied.
```

## SCREEN — M.5 Brand Settings

```text
SCREEN: Brand Settings    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Logo upload: document-upload-tile (PNG/SVG, min 512×512, crop to 1:1 square).
- Accent color picker: constrained to 6 brand palette swatches (coral-blossom, warm-oat, cream-silk, mint-fresh, admin-surface, foreground) — no custom hex.
- About copy textarea (max 280 chars, character counter).
- Live preview card showing logo + accent on a mock booking widget.
STATES: default, uploading, saved, error.
```

## SCREEN — M.6 Tax Settings

```text
SCREEN: Tax Settings    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Stripe Tax registration list: data-table-v1 columns State · Registration # · Status pill · Effective date (US) · Actions.
- "Add registration" primary CTA → modal form: state picker (US 50-state), registration number, effective date.
- Nexus warning banner if registered states < active locations.
STATES: default (list populated), empty (no registrations, onboarding prompt), nexus-warning, adding, error.
```

## SCREEN — M.7 Legal Documents Settings

```text
SCREEN: Legal Documents    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Document list with document-upload-tile per type:
  W-9 · Articles of Incorporation · ADA Compliance Attestation · Terms of Service · Privacy Policy.
- Each tile shows file name, upload date, file size, status pill (uploaded / missing / expired), remove icon.
- "Missing required documents" warning banner if any mandatory docs absent.
STATES: default, uploading (progress on tile), uploaded, missing, error, role-denied.
```

## SCREEN — M.8 Domain Settings

```text
SCREEN: Domain Settings    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Custom domain text input with inline validation.
- DNS verification status card:
  Record type · Name / Host · Value / Target · Verified badge or error chip.
- "Verify now" secondary CTA (re-triggers DNS check).
- SSL certificate status badge.
STATES: not-configured, configuring, pending-verification, verified, verification-failed, error.
```

## SCREEN — M.9 Owner Notification Preferences

```text
SCREEN: Owner Notification Prefs    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Section groupings: Bookings · Payments · Payouts · Connect Issues · AI Alerts · Reviews.
- Per-notification row: label + body-small description + toggle (push / email / SMS) per channel.
- Global mute banner (Do Not Disturb schedule: start time, end time, timezone).
STATES: default, editing, saved, DND-active (banner), error.
```

## SCREEN — M.10 Admin First-Run Tour

```text
SCREEN: Admin Coach-Mark Tour    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- admin-coach-mark multi-step overlay sequence:
  Step 1 of 5 — anchored to tenant switcher pill (top bar).
  Step 2 of 5 — anchored to KPI grid (Owner Home).
  Step 3 of 5 — anchored to calendar nav (primary nav bar).
  Step 4 of 5 — anchored to AI suggestion slot.
  Step 5 of 5 — anchored to Settings sidebar icon.
- Each popover: popoverBg #3D3530, corner radius 12, title heading-4 white, body-small white 80%, step indicator dots, Back / Next / Skip.
- Semi-transparent overlay rgba(26,20,17,0.55) covers non-highlighted area.
STATES: step-1 through step-5, skipped (instant dismiss), completed (confetti micro-animation).
```

## SCREEN — M.11 Subscription Plan Selection

```text
SCREEN: Plan Selection    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Annual / Monthly billing toggle (Annual shows "Save 20%" badge).
- Three plan-card columns (Starter / Growth / Pro):
  - Tier name heading-3, price USD/mo heading-1, billing cadence body-small.
  - Feature list with check icons (accent-fg).
  - Current plan: "Current Plan" disabled button + highlighted border coral-blossom.
  - Other plans: "Choose" primary CTA.
- Proration explainer modal: appears on plan change confirmation.
STATES: default, upgrading (spinner on CTA), downgrading (warning chip about feature loss), error, loading.
```

## SCREEN — M.12 Invoice History

```text
SCREEN: Invoice History    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Filter bar: date range (US MM/DD/YYYY), status filter chips (paid / open / void / draft).
- data-table-v1: Date (MM/DD/YYYY) · Invoice # (monospace) · Amount (USD, right-aligned) · Status pill · Download icon (44×44 tap target).
- Total outstanding chip in sub-header.
STATES: default (populated), empty (no invoices), error, downloading (progress on row).
```

## SCREEN — M.13 Admin Payment Method Management

```text
SCREEN: Admin Payment Methods    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Saved cards list (reuse D.1 card-list pattern) + default toggle.
- ACH / Bank account section: account type (Checking / Savings) + last 4 digits + bank name + default toggle + remove CTA.
- "Add payment method" primary CTA → Stripe Elements embed sheet.
STATES: default, adding, default-changed, removing (confirm destructive), error.
```

## SCREEN — M.14 Cancel / Pause Subscription

```text
SCREEN: Cancel / Pause    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Two card options: "Pause" (secondary) and "Cancel" (destructive).
- Pause card: duration picker segmented control (1 month / 3 months / 6 months), body explainer, "Pause Plan" CTA.
- Cancel card: reason picker (dropdown, required), win-back offer banner (50% off 3 months), typed-confirm input ("CANCEL"), destructive "Cancel Plan" button.
STATES: default, paused (pause active banner + resume CTA), cancelling, cancelled (downgrade confirmation + data-export CTA), error.
```

## SCREEN — M.15 Stripe Connect Onboarding

```text
SCREEN: Connect Onboarding    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Progress stepper: Business Info (step 1) · Owner Identity (step 2) · Bank Account (step 3) · Verification (step 4).
- Step 1: legal business name, EIN, business address (US), business type.
- Step 2: owner legal name, DOB (US MM/DD/YYYY), SSN last 4, address.
- Step 3: bank routing # + account # + account type — document-upload-tile for voided check.
- Step 4: document-upload-tile for Government ID + EIN letter. Progress bar to "Active".
- "Handled by Stripe" trust badge on each step.
STATES: in-progress (step 1–4), awaiting-Stripe-review, action-required (top banner with Stripe deep link), active, error per step.
```

## SCREEN — M.16 Connect Health Status

```text
SCREEN: Connect Health    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Status hero banner: active (mint-fresh) / pending (warning) / restricted (error) / disabled (neutral-muted).
- Capability grid: Charges · Payouts — each with status pill + capability badge.
- Required actions list: each item with description + Stripe-link CTA (action-required state only).
- Last verified timestamp 12h US.
STATES: active, pending, action-required, restricted (payouts paused banner + recovery steps), disabled, error.
```

## SCREEN — M.17 Payout History + Schedule

```text
SCREEN: Payout History    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- Balance summary card: Pending balance $ · Available balance $ · On-the-way $.
- Schedule controls: segmented control Daily / Weekly (weekday picker) / Monthly (day-of-month picker).
- data-table-v1 history: Arrival date (US MM/DD/YYYY) · Amount (USD) · Method (bank last 4) · Status pill · Receipt link.
STATES: default, no-balance (empty state + "Connect bank account" CTA), on-hold (banner + reason), schedule-saved (toast), error.
```

## SCREEN — M.18 Refund / Dispute Admin View

```text
SCREEN: Disputes Admin    DEVICE: iPad 768×1024 + iPhone
LAYOUT
- data-table-v1: Client name · Booking date (US) · Amount · Reason · Response deadline · Status pill.
- Tap row → detail drawer (right panel on iPad, bottom sheet on iPhone):
  Evidence upload: document-upload-tile (multiple files).
  Response composer: textarea + character counter.
  "Submit to Stripe" primary CTA.
STATES: open (countdown timer), evidence-needed (warning banner), submitted (read-only), won, lost (refund confirmed badge), error.
```

## SCREEN — M.19 Print / PDF Layout Spec

```text
SCREEN: Print / PDF Spec    DEVICE: US Letter 8.5×11 (portrait) — @react-pdf context
LAYOUT (print-page-layout × 3 templates)
Template A — Invoice:
  Header: tenant logo (left) + "Invoice" heading (right) + Invoice # + Issue date (US MM/DD/YYYY) + Due date.
  Bill-to block: client name, address.
  Line items table: service · qty · unit price · total (right-aligned).
  Subtotal / Tax / Total block.
  Footer: tenant legal name + Stripe-Connect merchant ID + "Page n of m".
Template B — Payout Statement:
  Header: tenant logo + "Payout Statement" + period (US date range).
  Summary: gross / fees / net payout.
  Transaction list: date · description · amount.
  Footer: identical to Template A.
Template C — Refund Receipt:
  Header: tenant logo + "Refund Confirmation" + date + original invoice #.
  Amount refunded (large heading-1).
  Reason line.
  Footer: identical to Template A.
Render at 100% scale with 0.5-inch margins.
STATES: preview (on-screen render), downloading-pdf (spinner), downloaded.
```

---

## COMPONENTS

```text
data-table-v1 — header row label-small uppercase, sortable caret icons, sticky first column on iPhone. Row height 56. Zebra stripe optional. Bulk-select column 32px wide. Sticky bulk-action bar slides in when rows selected. Admin surface #FAFAF8 header row background.

kpi-tile — background #FFFFFF, radius 16, padding 16. Row 1: label-small muted text. Row 2: heading-1 value (black). Row 3 left: delta chip (mint-fresh bg #BBEDDA + accent-fg text for positive; error bg #FFCDD2 + red text for negative) with ▲/▼ arrow. Row 3 right: inline sparkline 80×24.

sectioned-settings-layout — iPad: 280px fixed sidebar + resizable content pane, admin.border #E5E0D1 divider. iPhone: collapsible group rows with chevrons. Active item: coral-blossom left border 3px + bg tint. Sidebar header: search field full width.

document-upload-tile — 1px dashed border #E5E0D1, radius 12, drag-drop zone, cloud-upload icon 32 muted, "Drag & drop or Browse" body-small. Uploaded: file preview row (file icon 24, name body truncated, size label-small muted, remove icon 44×44). Uploading: progress bar replaces file row.

status-pill — height 24, horizontal padding 8, radius 12, label-small uppercase weight 500.
  active      bg #BBEDDA  text #2E7D32
  restricted  bg #E3A9A0  text #C62828
  pending     bg #D1BFB3  text #6B6B6B
  error       bg #FFCDD2  text #C62828
  disabled    bg #EEEEEE  text #6B6B6B
  info        bg #BBDEFB  text #1565C0

plan-card — radius 24, padding 24, surface #FFFFFF, shadow-sm. Header: tier name heading-3, price heading-1 + "/mo" body-small. Feature list: check icon 16 accent-fg + label per row. CTA: primary "Choose" or disabled "Current Plan". Current plan card has 2px solid border coral-blossom.

invoice-row — lives inside data-table-v1 rows. Date label / Invoice # monospace body-small / Amount right-aligned body / status-pill / download icon 44×44 tap target.

alert-notification-row — min height 56. Left: severity icon 24 (info blue / warning orange / error red). Middle: body 400 + timestamp label-small muted 12h US. Right: action chip (optional) + dismiss icon 44×44. Left border 3px severity color. Hover: background admin.surface.

role-denied-empty-state — centered in content pane. Lock icon 64 muted #B0B0B0. Heading-3 "You don't have permission to view this." Body-small muted "Contact your admin to request access." Tertiary button "Request Access" below.

print-page-layout — US Letter portrait 8.5×11in. Margins 0.5in all sides. Header zone 88pt: logo left 120×40 + document title heading-2 right. Footer zone 40pt: tenant legal name body-small left + "Page n of m" body-small right + hairline rule above. All text #1A1A1A on #FFFFFF, no transparency. Manrope 400/600 only.

admin-coach-mark — full-screen overlay rgba(26,20,17,0.55) with cut-out revealing anchored element. Popover: bg #3D3530, radius 12, padding 16, drop shadow. Title heading-4 white, body body-small white 80%. Bottom row: step dots (filled = current, hollow = upcoming) + Back tertiary (white) / Next primary (coral-blossom) / "Skip tour" link-button body-small.
```

---

## Admin Token Delta

```text
admin.surface        #FAFAF8   (table headers, sidebar background)
admin.border         #E5E0D1   (reuse global border token)
admin.text.muted     #6B6B6B   (reuse global text-muted token)
admin.danger         #C62828   (destructive actions, error text)
admin.warning        #F57F17   (warning text, nexus banners)
admin.success        #2E7D32   (success text, payout settled)
kpi.trend.up         #2E7D32
kpi.trend.down       #C62828
coach.overlay        rgba(26,20,17,0.55)
coach.popoverBg      #3D3530
```

---

## Figma File Structure

```text
Figma page: "Batch M — Owner Console"
Frame naming: M-<nn>-<ScreenName>-<state>
Examples:
  M-01-OwnerHome-default
  M-01-OwnerHome-no-data
  M-03-SettingsShell-search
  M-10-AdminTour-step3
  M-19-PrintSpec-invoice

Component page: "Batch M — Components"
  Each of the 11 new components as a separate Figma component set with all variants/states.

Deliverable: export all frames PNG @2x. Attach Figma link to design-handoff/batch-m/HANDOFF_MANIFEST.md.
```

---

## Human Review Checklist

- [ ] Tokens exact match — no invented colors, spacings, or radii outside design system.
- [ ] All 19 screens (M.1–M.19) delivered with all documented states.
- [ ] All 11 new components delivered as component sets in Figma.
- [ ] iPad 768×1024 primary layout validated for every screen.
- [ ] iPhone fallback layout validated for every screen marked "iPad + iPhone".
- [ ] Admin density respected — tables, sidebars, and compact rows used throughout.
- [ ] US formats enforced: dates MM/DD/YYYY, times 12h with AM/PM + timezone, currency USD with $ prefix.
- [ ] Stripe Connect flow (M.15–M.18) shows correct state progression.
- [ ] Print templates (M.19) render with 0.5-inch margins and correct footer.
- [ ] Frame names follow `M-<nn>-<ScreenName>-<state>` convention.
