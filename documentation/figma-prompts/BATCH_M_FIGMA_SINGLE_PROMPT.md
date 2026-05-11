---
COPY THIS ENTIRE FILE AND PASTE INTO YOUR AI TOOL (Claude, ChatGPT, Gemini, or Figma Make in code/spec mode).
OUTPUT REQUIRED: JSON files only — one JSON object per screen, one per component.
Do not produce visual frames, images, or code. Produce only JSON spec files.
The user will paste each JSON block back into their project at the path labelled above each block.
---

## PERSONA

You are a senior design systems engineer at Zarkili. Your job is to produce machine-readable JSON design spec files that engineering uses as the implementation source of truth. You know the Zarkili v1.0.0 design system token namespace perfectly. You follow the exact JSON schema defined below — no extra keys, no omitted required keys. You reason through each screen's layout zones, component composition, dynamic data bindings, states, and accessibility roles before writing the JSON. Your output is precise and directly writable to disk without modification.

---

## DESIGN SYSTEM TOKEN NAMESPACE — Zarkili v1.0.0

Use only these token names in the `tokens` fields of every spec. Never use raw hex values inside JSON — always reference the token name.

```
BASE TOKENS
  text.primary          #1A1A1A
  text.muted            #6B6B6B
  surface               #FFFFFF
  surface.background    #F2EDDD
  border                #E5E0D1
  accent                #E3A9A0   (coral-blossom — CTAs, selected)
  accent.secondary      #D1BFB3   (warm-oat)
  accent.fresh          #BBEDDA   (mint-fresh — success/positive)
  accent.fg             #2D4A42   (dark green — icon/text on mint)
  success               #4CAF50
  warning               #FF9800
  error                 #F44336
  info                  #2196F3
  disabled.fg           #B0B0B0
  disabled.bg           #F5F5F5
  overlay.scrim         rgba(0,0,0,0.5)

ADMIN OVERRIDE TOKENS (admin screens only)
  admin.surface         #FAFAF8
  admin.border          #E5E0D1
  admin.text.muted      #6B6B6B
  admin.danger          #C62828
  admin.warning         #F57F17
  admin.success         #2E7D32

KPI TILE TOKENS
  kpiTile.background    #FFFFFF
  kpiTile.trendUp       #2E7D32
  kpiTile.trendDown     #C62828
  kpiTile.trendFlat     #6B6B6B

STATUS PILL TOKENS
  pill.active.bg        #BBEDDA    pill.active.text      #2E7D32
  pill.restricted.bg    #E3A9A0    pill.restricted.text  #C62828
  pill.pending.bg       #D1BFB3    pill.pending.text     #6B6B6B
  pill.error.bg         #FFCDD2    pill.error.text       #C62828
  pill.disabled.bg      #EEEEEE    pill.disabled.text    #6B6B6B
  pill.info.bg          #BBDEFB    pill.info.text        #1565C0

COACH MARK TOKENS
  coach.overlay         rgba(26,20,17,0.55)
  coach.popoverBg       #3D3530

TYPOGRAPHY (Manrope — reference by semantic name only)
  heading-1  32/40 w600 | heading-2 24/32 w600 | heading-3 20/28 w600
  heading-4  18/24 w500 | body 14/20 w400 | body-small 12/16 w400
  label 14/20 w500 | label-small 12/16 w500

SPACING (4pt grid — only these values allowed)
  0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96

RADII
  small=8  medium=12  large=16  2xl=24  full=9999

MIN TOUCH TARGET  44x44
```

---

## YOUR TASK

**Batch M — Owner Console Foundation: KPI, Tenant Settings, Billing & Connect**
**Engineering weeks 38–39. figma-then-code mode. Admin density (higher info density than consumer UI).**

Produce **30 JSON files** in the schemas below:
- **19 screen spec files** → `design-handoff/batch-m/specs/<ScreenName>.json`
- **11 component spec files** → `design-handoff/batch-m/components/<component-id>.json`

Label each output block with the destination path on the line immediately before the opening fence:

```
// design-handoff/batch-m/specs/OwnerHomeKpiDashboardScreen.json
{
  ...
}
```

One block = one file. Do not merge multiple files.

---

## JSON SCHEMA — Screen Spec

All fields are required.

```json
{
  "schemaVersion": "1.0.0",
  "screenId": "M.X",
  "screenName": "PascalCaseScreenName",
  "route": "admin/kebab-case-route",
  "designSystem": "Zarkili v1.0.0",
  "device": "iPad 768x1024",
  "engineeringStatus": "designed",
  "description": "One sentence: what the screen does and who uses it.",
  "layout": {
    "type": "scrollable-column | master-detail | form | stepper | tab-view | print-canvas",
    "padding": { "top": 24, "right": 32, "bottom": 40, "left": 32 },
    "maxContentWidth": 960,
    "gap": 24
  },
  "sections": [
    {
      "id": "section-id",
      "type": "page-header | kpi-tile-grid | data-table | list-section | form-section | nav-section-list | tab-bar | filter-bar | status-banner | upload-list | plan-card-grid | coach-mark-overlay | print-template",
      "title": "Optional heading string",
      "component": "component-id if applicable"
    }
  ],
  "stateNames": ["default", "loading", "error"],
  "accessibility": {
    "screenReaderLabel": "Human readable screen name"
  }
}
```

---

## JSON SCHEMA — Component Spec

All fields are required.

```json
{
  "schemaVersion": "1.0.0",
  "componentId": "MC.X",
  "componentName": "PascalCaseName",
  "exportedAs": "PascalCaseName",
  "category": "admin-data-display | admin-navigation | admin-form | admin-feedback | admin-overlay | admin-print",
  "description": "One sentence: what the component does and where it is used.",
  "props": {
    "propName": {
      "type": "TypeScript type string",
      "required": true,
      "default": "value if optional",
      "description": "What this prop controls"
    }
  },
  "tokens": {
    "semanticRoleName": "token.name"
  },
  "anatomy": ["element-name (description)"],
  "sizes": [{ "name": "default", "width": "description", "height": 56 }],
  "stateNames": ["default", "loading", "error"],
  "accessibility": {
    "role": "ARIA role",
    "ariaLabel": "template string with {{variable}}"
  }
}
```

---

## SCREENS TO GENERATE — 19 files

Use `"engineeringStatus": "delivered"` for M.1–M.9. Use `"designed"` for M.10–M.19.

### M.1 — OwnerHomeKpiDashboardScreen.json
```
route: admin/owner-home
layout: scrollable-column, maxContentWidth 960, gap 24
sections:
  page-header — greeting "Good morning, {{ownerFirstName}}" heading-1 + "{{tenantName}} · {{todayDate}}" muted + quick-nav-row (Settings / Staff / Services / Bookings)
  kpi-tile-grid — 4 cols iPad / 2×2 iPhone, gap 16, tiles:
    Revenue today (USD, trend, nullLabel "Pending setup")
    Bookings today (integer, trend)
    New clients this week (integer, trend)
    AI Savings (USD, trend, nullLabel "Pending setup")
  kpi-tile-grid — 3 cols iPad / 1 iPhone, tiles:
    Occupancy today (%, no trend, nullLabel "Coming W40")
    Open slots today (integer, nullLabel "Coming W40")
    New clients (integer, trend, nullLabel "Coming W40")
  list-section "Top staff today" — cols: staffName / bookingsToday / revenueToday (nullable "—"), emptyState "No bookings yet today."
  list-section "Alerts requiring action" — rowComponent alert-notification-row, emptyState "No alerts. Everything looks good."
stateNames: loading | loaded | error | revenueNullPending
accessibility: screenReaderLabel "Owner dashboard", kpiTilesRole "region", alertsRole "list"
```

### M.2 — OperatorNotificationCenterScreen.json
```
route: admin/notifications
layout: tab-view
sections:
  tab-bar — tabs: [All, Bookings, Payments, Payouts, AI, System], each with unreadCount badge
  filter-bar — severity chips [info, warning, error] + date-range-picker (US MM/DD/YYYY)
  list-section — rowComponent alert-notification-row, sorted newest-first, emptyState per tab
stateNames: default | empty-per-tab | all-read | error | loading
accessibility: screenReaderLabel "Operator notifications", tabRole "tablist"
```

### M.3 — TenantSettingsShellScreen.json
```
route: admin/settings
layout: master-detail, sidebar.width 280, sidebar.background admin.surface, sidebar.border admin.border
sections:
  sidebar-header — heading "Settings", subtext "{{tenantName}}"
  nav-section-list — component sectioned-settings-layout, items:
    { key: business-profile, icon: building,        label: "Business profile",             badge: null }
    { key: brand,            icon: palette,          label: "Brand & appearance",           badge: null }
    { key: tax,              icon: receipt,          label: "Tax settings",                 badge: null }
    { key: currency,         icon: currency-dollar,  label: "Currency",                     badge: null }
    { key: legal-docs,       icon: document,         label: "Legal documents",              badge: "requiredDocsCount > 0 ? requiredDocsCount : null" }
    { key: domain,           icon: globe,            label: "Domain",                       badge: null }
    { key: notifications,    icon: bell,             label: "Notification preferences",     badge: null }
stateNames: default | legalDocsRequired
accessibility: screenReaderLabel "Tenant settings", navRole "navigation"
```

### M.4 — BusinessProfileSettingsScreen.json
```
route: admin/settings/business-profile
layout: form, padding {top:24,right:32,bottom:40,left:32}, gap 24
sections:
  form-section — fields:
    businessName     text-input required
    einTaxId         text-input masked placeholder "XX-XXXXXXX"
    businessType     picker options [Sole Proprietorship, LLC, Corporation, Partnership]
    industry         text-input
    foundedDate      date-picker format MM/DD/YYYY
    supportEmail     email-input
    supportPhone     phone-input format US
  sticky-footer — buttons: [{ label: "Save", variant: primary }, { label: "Discard", variant: tertiary }]
stateNames: default | editing | saving | saved | error | role-denied
accessibility: screenReaderLabel "Business profile settings"
```

### M.5 — BrandSettingsScreen.json
```
route: admin/settings/brand
layout: form, gap 24
sections:
  upload-section — component document-upload-tile, label "Brand logo", accept "image/png,image/svg+xml", minSize "512x512"
  color-picker-section — label "Accent color", swatches [accent, accent.secondary, surface.background, accent.fresh, admin.surface, text.primary], noCustomHex true
  form-section — fields: [{ id: aboutCopy, type: textarea, label: "About", maxChars: 280, showCounter: true }]
  preview-card — renders logo + selected accent on mock booking widget
stateNames: default | uploading | saved | error
accessibility: screenReaderLabel "Brand settings"
```

### M.6 — TaxSettingsScreen.json
```
route: admin/settings/tax
layout: scrollable-column, gap 24
sections:
  status-banner — id nexus-warning, shown when registeredStateCount < activeLocationCount, text "You may have nexus in states where you are not registered.", variant warning
  data-table — component data-table-v1, columns:
    state          text
    registrationNumber  text
    status         status-pill
    effectiveDate  date US MM/DD/YYYY
    actions        button row
  add-cta — label "Add registration", opens modal with fields: state picker (US 50), registrationNumber text, effectiveDate date-picker
stateNames: default | empty | nexus-warning | adding | error
accessibility: screenReaderLabel "Tax settings"
```

### M.7 — LegalDocumentsSettingsScreen.json
```
route: admin/settings/legal-docs
layout: scrollable-column, gap 16
sections:
  status-banner — id missing-docs-warning, shown when any required doc is absent, variant warning, text "Required documents missing."
  upload-list — one document-upload-tile per type:
    W-9 (required)
    Articles of Incorporation (required)
    ADA Compliance Attestation (required)
    Terms of Service (required)
    Privacy Policy (required)
    each tile exposes: fileName, uploadDate, fileSize, status-pill (uploaded|missing|expired), removeIcon
stateNames: default | uploading | uploaded | missing | error | role-denied
accessibility: screenReaderLabel "Legal documents"
```

### M.8 — DomainSettingsScreen.json
```
route: admin/settings/domain
layout: form, gap 24
sections:
  form-section — fields: [{ id: customDomain, label: "Custom domain", type: text-input, validation: domain-format }]
  dns-status-card — rows: [{ recordType: CNAME, name: "_zarkili", target: "verify.zarkili.com", verifiedBadge or errorChip }]
  secondary-cta — label "Verify now", action re-triggers DNS check
  ssl-badge — status chip variants: active | pending | error
stateNames: not-configured | configuring | pending-verification | verified | verification-failed | error
accessibility: screenReaderLabel "Domain settings"
```

### M.9 — OwnerNotificationPreferencesScreen.json
```
route: admin/settings/notifications
layout: scrollable-column, gap 24
sections:
  dnd-banner — shown when DND active, text "Do Not Disturb active until {{dndEndTime}}.", dismissible false
  form-section "Do Not Disturb" — fields: [dndStart time-picker 12h, dndEnd time-picker 12h, dndTimezone timezone-picker]
  list-section "Bookings" — rows: [New booking, Cancellation, Reschedule] each with per-channel toggles [push, email, sms]
  list-section "Payments" — rows: [Payment received, Refund issued]
  list-section "Payouts" — rows: [Payout settled, Payout failed, On-hold]
  list-section "Connect Issues" — rows: [Connect action required, Connect restricted]
  list-section "AI Alerts" — rows: [AI suggestion available, AI anomaly detected]
  list-section "Reviews" — rows: [New review, Negative review flagged]
stateNames: default | editing | saved | DND-active | error
accessibility: screenReaderLabel "Notification preferences"
```

### M.10 — AdminFirstRunTourScreen.json
```
route: null (overlay — rendered over M.1)
layout: coach-mark-overlay
sections:
  coach-mark-overlay — component admin-coach-mark, totalSteps 5, steps:
    { step: 1, anchorId: "tenant-switcher-pill",  title: "Switch tenants",         body: "Manage multiple salon locations from one account." }
    { step: 2, anchorId: "kpi-grid",              title: "Your KPIs at a glance",  body: "Revenue, bookings, and AI savings update in real time." }
    { step: 3, anchorId: "calendar-nav",          title: "Calendar",               body: "View and manage all appointments." }
    { step: 4, anchorId: "ai-suggestion-slot",    title: "AI insights",            body: "Zarkili AI surfaces revenue and scheduling opportunities here." }
    { step: 5, anchorId: "settings-nav-icon",     title: "Settings",               body: "Configure your business profile, billing, and integrations." }
  overlay — token coach.overlay, cutoutRadius 4
stateNames: step-1 | step-2 | step-3 | step-4 | step-5 | skipped | completed
accessibility: screenReaderLabel "Admin onboarding tour", role "dialog", ariaModal true
```

### M.11 — SubscriptionPlanSelectionScreen.json
```
route: admin/billing/plan
layout: scrollable-column, gap 24
sections:
  billing-toggle — options [Monthly, Annual], annualBadge "Save 20%"
  plan-card-grid — component plan-card, 3 cols iPad / 1 col iPhone, plans:
    { tier: Starter, monthlyPrice: 49,  annualPrice: 39,  currency: USD,
      features: ["Up to 3 staff", "Basic booking", "Email notifications"] }
    { tier: Growth,  monthlyPrice: 99,  annualPrice: 79,  currency: USD,
      features: ["Up to 10 staff", "SMS notifications", "Basic analytics", "Loyalty program"] }
    { tier: Pro,     monthlyPrice: 199, annualPrice: 159, currency: USD,
      features: ["Unlimited staff", "AI insights", "Advanced analytics", "API access", "Priority support"] }
    currentTierKey: "{{currentPlanTier}}"
  proration-modal — shown on plan change CTA, body "Your plan changes immediately. You will be charged/credited {{prorationAmount}} for the remainder of the billing period."
stateNames: default | upgrading | downgrading | error | loading
accessibility: screenReaderLabel "Subscription plans"
```

### M.12 — InvoiceHistoryScreen.json
```
route: admin/billing/invoices
layout: scrollable-column, gap 16
sections:
  filter-bar — date-range-picker (US MM/DD/YYYY) + status chips [paid, open, void, draft]
  subheader-chip — label "Outstanding: {{outstandingTotal}}", shown when outstandingTotal > 0
  data-table — component data-table-v1, columns:
    date           date US MM/DD/YYYY
    invoiceNumber  text monospace
    amount         currency USD right-aligned
    status         status-pill
    download       icon-button 44x44
stateNames: default | empty | error | downloading
accessibility: screenReaderLabel "Invoice history"
```

### M.13 — AdminPaymentMethodScreen.json
```
route: admin/billing/payment-methods
layout: scrollable-column, gap 24
sections:
  list-section "Saved cards" — rowComponent card-list-row (last4, brand, expiry, defaultToggle, removeButton)
  list-section "Bank accounts (ACH)" — rowComponent bank-account-row (accountType Checking|Savings, last4, bankName, defaultToggle, removeButton)
  primary-cta — label "Add payment method", opens Stripe Elements sheet
stateNames: default | adding | default-changed | removing | error
accessibility: screenReaderLabel "Payment methods"
```

### M.14 — CancelSubscriptionScreen.json
```
route: admin/billing/cancel
layout: scrollable-column, gap 24
sections:
  card "pause-card" — heading "Pause subscription", body "Put your account on hold without losing data.",
    controls: [segmented-control duration (1 month | 3 months | 6 months)],
    cta: { label: "Pause Plan", variant: secondary }
  card "cancel-card" — heading "Cancel subscription", body "Your account will be downgraded at period end.",
    controls:
      reason-picker required options [Too expensive, Missing features, Closing business, Switching tools, Other]
      winback-banner "Get 3 months at 50% off — stay?" (dismissible)
      typed-confirm { placeholder: "Type CANCEL to confirm", requiredValue: "CANCEL" }
    cta: { label: "Cancel Plan", variant: destructive }
stateNames: default | paused | cancelling | cancelled | error
accessibility: screenReaderLabel "Cancel or pause subscription", cancelCtaAriaLabel "Cancel subscription — requires typed confirmation"
```

### M.15 — StripeConnectOnboardingScreen.json
```
route: admin/connect/onboarding
layout: stepper, totalSteps 4
sections:
  step-1 "Business Info" — fields: [legalName text, ein text masked, businessAddress address US, businessType picker [Sole Proprietorship, LLC, Corporation]]
  step-2 "Owner Identity" — fields: [ownerName text, dob date-picker MM/DD/YYYY, ssnLast4 text maxLength 4 masked, address address US]
  step-3 "Bank Account" — fields: [routingNumber text maxLength 9, accountNumber text masked, accountType picker [Checking, Savings]],
    upload: { component: document-upload-tile, label: "Voided check (optional)" }
  step-4 "Verification" — uploads:
    { component: document-upload-tile, label: "Government-issued ID", required: true }
    { component: document-upload-tile, label: "EIN letter", required: true }
    progressBar: { label: "Verification progress", target: "Active" }
  trust-badge — text "Payment infrastructure handled by Stripe", shown on every step
  action-required-banner — shown in action-required state, text "Stripe requires additional information.", ctaLabel "Complete in Stripe", ctaLink "{{stripeConnectOnboardingUrl}}"
stateNames: step-1 | step-2 | step-3 | step-4 | awaiting-stripe-review | action-required | active | error-step-1 | error-step-2 | error-step-3 | error-step-4
accessibility: screenReaderLabel "Stripe Connect onboarding"
```

### M.16 — ConnectHealthStatusScreen.json
```
route: admin/connect/health
layout: scrollable-column, gap 24
sections:
  status-banner — variants:
    { state: active,          tokenBg: accent.fresh,    label: "Payouts active" }
    { state: pending,         tokenBg: admin.warning,   label: "Verification pending" }
    { state: action-required, tokenBg: error,           label: "Action required" }
    { state: restricted,      tokenBg: admin.danger,    label: "Payouts restricted" }
    { state: disabled,        tokenBg: disabled.bg,     label: "Connect disabled" }
  capability-grid — 2 cols, items: [{ key: charges, label: "Charges" }, { key: payouts, label: "Payouts" }] each with status-pill + badge
  required-actions-list — shown when state is action-required or restricted, each item:
    { description: string, ctaLabel: "Fix in Stripe", ctaLink: "{{stripeActionUrl}}" }
  verified-timestamp — label "Last verified {{verifiedAt}} {{timezone}}", format 12h US
stateNames: active | pending | action-required | restricted | disabled | error
accessibility: screenReaderLabel "Connect health status"
```

### M.17 — PayoutHistoryScreen.json
```
route: admin/connect/payouts
layout: scrollable-column, gap 24
sections:
  balance-card — bg surface, radius large, padding 24, rows:
    { label: "Pending",    key: pendingBalance,   format: currency }
    { label: "Available",  key: availableBalance,  format: currency }
    { label: "On the way", key: inTransitBalance,  format: currency }
  schedule-controls — segmented-control [Daily, Weekly, Monthly],
    conditional: { Weekly: weekday-picker, Monthly: day-of-month-picker 1-28 },
    saveCTA: { label: "Save schedule", variant: primary }
  on-hold-banner — shown when onHold true, text "Payouts on hold: {{holdReason}}.", variant admin.warning
  data-table — component data-table-v1, columns:
    arrivalDate   date US MM/DD/YYYY
    amount        currency USD right-aligned
    method        text "···· {{last4}}"
    status        status-pill
    receipt       link-button
stateNames: default | no-balance | on-hold | schedule-saved | error
accessibility: screenReaderLabel "Payout history and schedule"
```

### M.18 — RefundDisputeAdminScreen.json
```
route: admin/connect/disputes
layout: master-detail (table left, detail-panel right 320px on iPad; bottom-sheet on iPhone)
sections:
  data-table — component data-table-v1, columns:
    clientName      text
    bookingDate     date US MM/DD/YYYY
    amount          currency USD
    reason          text
    responseDeadline date US + countdown-timer chip
    status          status-pill
  detail-panel — sections:
    evidence-upload: { component: document-upload-tile, multiple: true, label: "Upload evidence" }
    response-composer: { type: textarea, maxChars: 1500, showCounter: true, label: "Your response to Stripe" }
    submit-cta: { label: "Submit to Stripe", variant: primary }
  evidence-needed-banner — shown when state is evidence-needed, text "Response required by {{responseDeadline}}.", variant admin.warning
stateNames: open | evidence-needed | submitted | won | lost | error
accessibility: screenReaderLabel "Disputes and refunds", detailPanelRole "complementary"
```

### M.19 — PrintPdfLayoutSpec.json
```
route: null (print context — @react-pdf)
device: "US Letter 8.5x11 portrait"
layout: print-canvas, margins { top: 48, right: 48, bottom: 48, left: 48 } (px at 96dpi = 0.5in)
sections:
  print-template "invoice" — Template A Invoice:
    header: logoSlot { width: 120, height: 40, align: left }, docTitle "Invoice" heading-2 right,
            invoiceNumber label-small right, issueDate label-small right (US MM/DD/YYYY), dueDate label-small right
    bill-to: { label: "Bill to" label-small muted, clientName: body, clientAddress: body-small }
    line-items-table: cols [description(text flex), qty(integer right 60px), unitPrice(currency right 100px), total(currency right 100px)],
                      totals-block [subtotal, tax, total heading-4]
    footer: { tenantLegalName: body-small left, merchantId: body-small center, pagination: "Page {{n}} of {{m}}" body-small right, hairlineRuleAbove: true }
  print-template "payout-statement" — Template B:
    header: same structure, docTitle "Payout Statement", period "{{startDate}}–{{endDate}}"
    summary-block: rows [grossPayout currency, stripeFees currency, netPayout heading-4 currency]
    transaction-table: cols [date US, description flex, amount currency right]
    footer: identical to Template A
  print-template "refund-receipt" — Template C:
    header: same structure, docTitle "Refund Confirmation" + originalInvoiceRef label-small
    hero-amount: heading-1 center "{{refundAmount}} refunded"
    reason: body "Reason: {{refundReason}}"
    footer: identical to Template A
stateNames: preview | downloading-pdf | downloaded
accessibility: role "document", ariaLabel "Printable {{documentTitle}}"
```

---

## COMPONENTS TO GENERATE — 11 files

### MC.1 — data-table-v1.json
```
category: admin-data-display
description: Sortable, selectable, bulk-actionable admin table used across M.6, M.12, M.17, M.18.
props:
  columns         ColDef[]  required  "Column definitions with key, label, width, align, renderer"
  rows            object[]  required  "Data rows, each with a unique id field"
  sortKey         string|null  default null
  sortDirection   'asc'|'desc'  default 'asc'
  selectedIds     string[]  default []
  onSelectRow     function
  onBulkAction    function
  loading         boolean  default false
  emptyState      ReactNode
  stickyFirstColumn  boolean  default false
  zebraStripe     boolean  default true
tokens:
  headerBg        admin.surface
  headerText      text.muted
  rowBorder       admin.border
  selectedRowBg   accent  (8% opacity tint)
  bulkBarBg       coach.popoverBg
  bulkBarText     surface
anatomy:
  header-row (label-small uppercase, sortable carets)
  data-row (height 56)
  bulk-select-checkbox (col width 32, leftmost, sticky)
  sticky-bulk-action-bar (slides up on row selection)
  loading-skeleton-rows
  empty-state-slot
sizes: [{ name: default, rowHeight: 56 }, { name: compact, rowHeight: 40, note: "omits bulk-select" }]
stateNames: default | loading | empty | error | bulk-selected
accessibility: role "table", columnHeaderRole "columnheader", rowRole "row"
```

### MC.2 — kpi-tile.json
```
category: admin-data-display
description: Single KPI metric card with value, trend delta chip, and optional sparkline. Null-safe with configurable placeholder.
props:
  label         string   required
  value         number|null  required
  format        'integer'|'currency'|'percent'  default 'integer'
  currencyCode  string  default 'USD'
  nullLabel     string|null  default null  "Shown when value is null; null shows dash"
  trend         'up'|'down'|'flat'|null  default null
  deltaLabel    string|null  default null  "e.g. '+12%' or '+3 vs yesterday'"
  sparklineData number[]|null  default null  "7-point array for micro-chart"
  loading       boolean  default false
  onPress       function|null  default null  "Makes tile tappable; shows chevron"
  testID        string
tokens:
  background      kpiTile.background
  valueLarge      text.primary
  label           admin.text.muted
  trendUp         kpiTile.trendUp
  trendDown       kpiTile.trendDown
  trendFlat       kpiTile.trendFlat
  deltaChipPosBg  accent.fresh
  deltaChipNegBg  pill.error.bg
  nullLabel       admin.text.muted
anatomy:
  tile-container (radius large 16, padding 16, shadow-sm)
  label-text (label-small muted, row 1)
  value-text (heading-1, row 2)
  null-label-text (body-small muted italic, shown when value null)
  trend-row (delta-chip left + sparkline 80x24 right, row 3)
  touch-ripple (shown when onPress provided)
sizes: [{ name: default, height: 120 }, { name: compact, height: 96, note: "omits sparkline row" }]
stateNames: loading | valuePresent | valueNull | interactive
accessibility: role "region", ariaLabel "{{label}}: {{formattedValue}}", trendAriaLabel "Trend: {{trend}}, {{deltaLabel}}"
```

### MC.3 — sectioned-settings-layout.json
```
category: admin-navigation
description: Master-detail settings shell. 280px persistent sidebar on iPad; collapsible list-then-detail on iPhone.
props:
  sections         NavSection[]  required  "Array of { key, icon, label, badge }"
  activeSectionKey string|null
  onSectionPress   function
  searchQuery      string  default ''
  onSearchChange   function
  children         ReactNode  "Right pane content"
tokens:
  sidebarBg        admin.surface
  sidebarBorder    admin.border
  activeItemBorder accent
  activeItemBg     accent  (8% opacity)
  itemText         text.primary
  mutedText        admin.text.muted
anatomy:
  sidebar (width 280 fixed iPad, full-width collapsed iPhone)
  search-input (sidebar header, radius medium)
  nav-item-row (height 44, label body w500, active-indicator 3px left border coral-blossom)
  role-denied-badge (lock icon inline on restricted items)
  right-content-pane (flex 1)
sizes: [{ name: default, sidebarWidth: 280, itemHeight: 44 }]
stateNames: default | search-active | section-selected | role-denied-section
accessibility: sidebarRole "navigation", itemRole "menuitem", activeAriaSelected true
```

### MC.4 — document-upload-tile.json
```
category: admin-form
description: Status-aware drag-and-drop file upload tile. Used for legal docs, Connect verification, and brand logo.
props:
  label       string   required
  accept      string   "MIME types, e.g. 'image/png,image/svg+xml'"
  multiple    boolean  default false
  maxSizeMb   number   default 10
  value       UploadedFile[]|null
  onUpload    function
  onRemove    function
  required    boolean  default false
  loading     boolean  default false
  error       string|null
tokens:
  borderColor   admin.border
  bg            surface
  uploadIcon    text.muted
  progressFill  accent
  errorColor    admin.danger
anatomy:
  container (1px dashed border radius medium 12, padding 20)
  idle-zone (cloud-upload icon 32 + label body-small + browse-button tertiary)
  progress-bar (full width, accent fill)
  uploaded-row (file-icon 24 + name truncated + size label-small muted + check-chip + remove-icon 44x44)
  error-chip (admin.danger label-small)
sizes: [{ name: default, minHeight: 80 }]
stateNames: idle | uploading | uploaded | error
accessibility: role "button" (idle), ariaLive "polite" (uploading), uploadedAriaLabel "{{fileName}} uploaded"
```

### MC.5 — status-pill.json
```
category: admin-feedback
description: Semantic status indicator pill with 6 variants covering all entity states in Batch M admin screens.
props:
  variant  'active'|'restricted'|'pending'|'error'|'disabled'|'info'  required
  label    string|null  default null  "Auto-uses variant name if null"
  size     'default'|'sm'  default 'default'
tokens:
  active.bg       pill.active.bg        active.text   pill.active.text
  restricted.bg   pill.restricted.bg    restricted.text  pill.restricted.text
  pending.bg      pill.pending.bg       pending.text  pill.pending.text
  error.bg        pill.error.bg         error.text    pill.error.text
  disabled.bg     pill.disabled.bg      disabled.text pill.disabled.text
  info.bg         pill.info.bg          info.text     pill.info.text
anatomy:
  pill-container (height 24, horizontal-padding 8, radius full)
  label-text (label-small uppercase weight 500)
sizes: [{ name: default, height: 24 }, { name: sm, height: 18 }]
stateNames: active | restricted | pending | error | disabled | info
accessibility: role "status", ariaLabel "Status: {{label}}"
```

### MC.6 — plan-card.json
```
category: admin-feedback
description: Pricing plan card with tier name, price, feature list, and choose/current CTA.
props:
  tier          string   required
  monthlyPrice  number   required
  annualPrice   number   required
  currency      string   default 'USD'
  features      string[] required
  isCurrent     boolean  default false
  billingCycle  'monthly'|'annual'  required
  onChoose      function
tokens:
  bg              surface
  borderDefault   border
  borderCurrent   accent
  featureIcon     accent.fg
  ctaBg           accent
  ctaDisabledBg   disabled.bg
  ctaDisabledText disabled.fg
anatomy:
  container (radius 2xl 24, padding 24, shadow-sm, current: 2px solid accent border)
  tier-name (heading-3)
  price-row (heading-1 amount + body-small "/mo")
  billing-cadence (body-small muted)
  feature-list (check-icon 16 accent.fg + label, gap 8)
  cta-button (full-width primary or disabled "Current Plan")
sizes: [{ name: default, minWidth: 240 }]
stateNames: default | current | loading
accessibility: role "article", ariaLabel "{{tier}} plan, {{formattedPrice}} per month"
```

### MC.7 — invoice-row.json
```
category: admin-data-display
description: A single data row inside data-table-v1 representing one invoice. Used in M.12.
props:
  date           string  required  "US MM/DD/YYYY"
  invoiceNumber  string  required
  amount         number  required
  currency       string  default 'USD'
  status         'paid'|'open'|'void'|'draft'  required
  onDownload     function
tokens:
  dateText        text.primary
  numberText      text.muted
  amountText      text.primary
  downloadIcon    admin.text.muted
anatomy:
  date-cell (body-small)
  invoice-number-cell (monospace body-small)
  amount-cell (body right-aligned)
  status-pill-cell (component status-pill)
  download-button (icon-button 44x44)
sizes: [{ name: default, height: 56 }]
stateNames: paid | open | void | draft | downloading
accessibility: rowRole "row", downloadAriaLabel "Download invoice {{invoiceNumber}}"
```

### MC.8 — alert-notification-row.json
```
category: admin-feedback
description: Severity-coded notification row with left border accent, used in Owner Home and Notification Center.
props:
  severity    'info'|'warning'|'error'  required
  body        string  required
  timestamp   string  required  "12h US format"
  actionLabel string|null  default null
  onAction    function|null  default null
  onDismiss   function|null  default null
  isRead      boolean  default false
tokens:
  borderInfo     info
  borderWarning  warning
  borderError    error
  unreadBg       surface  (warm tint — #FFFBF8)
  readBg         surface
  iconInfo       info
  iconWarning    warning
  iconError      error
  bodyText       text.primary
  timestampText  admin.text.muted
anatomy:
  left-border (3px severity token color)
  severity-icon (24px)
  body-column (body 2-line truncate + timestamp label-small muted)
  action-chip (optional, accent color)
  dismiss-button (icon 44x44)
sizes: [{ name: default, minHeight: 56 }]
stateNames: unread | read | dismissed
accessibility: role "listitem", ariaLive "polite", ariaLabel "{{severity}} alert: {{body}}"
```

### MC.9 — role-denied-empty-state.json
```
category: admin-feedback
description: Full-pane empty state shown when RBAC blocks the current user from a section.
props:
  onRequestAccess    function|null
  requestAccessLabel string  default 'Request Access'
tokens:
  iconColor    disabled.fg
  headingColor text.primary
  bodyColor    admin.text.muted
  ctaVariant   tertiary
anatomy:
  container (centered flex-col, gap 16, minHeight 240)
  lock-icon (64px, token disabled.fg)
  heading (heading-3, "You don't have permission to view this.")
  body-text (body-small muted, "Contact your admin to request access.")
  request-access-button (tertiary)
sizes: [{ name: default, minHeight: 240 }]
stateNames: default
accessibility: role "status", ariaLabel "Access denied. You don't have permission to view this section."
```

### MC.10 — print-page-layout.json
```
category: admin-print
description: US Letter portrait print template wrapper for M.19 invoice, payout, and refund PDFs.
props:
  documentTitle   string  required
  tenantLegalName string  required
  merchantId      string  required
  children        ReactNode  "Content between header and footer"
  pageNumber      number  required
  totalPages      number  required
tokens:
  bg          surface
  text        text.primary
  footerText  admin.text.muted
  footerRule  admin.border
anatomy:
  canvas (816x1056px at 96dpi, margins 48px all sides)
  header-zone (88px: logo-slot left 120x40 + docTitle heading-2 right)
  content-zone (flex between header and footer)
  footer-zone (40px: hairline-rule above + tenantLegalName body-small left + "Page n of m" body-small right)
sizes: [{ name: default, width: 816, height: 1056, unit: "px", dpi: 96 }]
stateNames: preview | downloading | downloaded
accessibility: role "document", ariaLabel "Printable {{documentTitle}}"
```

### MC.11 — admin-coach-mark.json
```
category: admin-overlay
description: Multi-step onboarding coach-mark overlay with dark popover anchored to a target element.
props:
  steps        CoachMarkStep[]  required  "Array of { step, anchorId, title, body }"
  currentStep  number  required
  totalSteps   number  required
  onNext       function
  onBack       function
  onSkip       function
  onComplete   function
tokens:
  overlay      coach.overlay
  popoverBg    coach.popoverBg
  titleColor   surface  (#FFFFFF)
  bodyColor    surface  (80% opacity)
  dotActive    accent
  dotInactive  surface  (30% opacity)
  nextCtaBg    accent
  backCtaColor surface
  skipColor    surface
anatomy:
  overlay-mask (full-screen rgba coach.overlay)
  cut-out (8px padding around anchored element, radius small 8)
  popover (radius medium 12, padding 16, shadow-lg, maxWidth 280)
  title (heading-4 white)
  body (body-small white 80%)
  footer-row (step-dots 6x6 radius full + back tertiary + next primary + skip link label-small)
sizes: [{ name: default, popoverMaxWidth: 280 }]
stateNames: step-1 | step-2 | step-3 | step-4 | step-5 | skipped | completed
accessibility: role "dialog", ariaModal true, ariaLabel "Onboarding tour step {{currentStep}} of {{totalSteps}}"
```

---

## VALIDATION RULES — Check before outputting each file

- [ ] `schemaVersion` is `"1.0.0"`.
- [ ] Every token reference uses a name from TOKEN NAMESPACE above — no raw hex values.
- [ ] Screen files include: `screenId`, `screenName`, `route`, `layout`, `sections`, `stateNames`, `accessibility`.
- [ ] Component files include: `componentId`, `componentName`, `props`, `tokens`, `anatomy`, `stateNames`, `accessibility`.
- [ ] `engineeringStatus` is `"delivered"` for M.1–M.9 and `"designed"` for M.10–M.19.
- [ ] Dates use US MM/DD/YYYY. Times use 12h. Currency uses USD $ prefix.
- [ ] `stateNames` always includes at minimum an initial state and `error`.
- [ ] Output is valid JSON — no trailing commas, no comments inside fences.
