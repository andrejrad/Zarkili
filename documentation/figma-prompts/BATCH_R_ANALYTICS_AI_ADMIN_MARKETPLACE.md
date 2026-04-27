# Batch R — Analytics, Reporting, Exports, AI Admin, Marketplace Tenant Tools

> Consumed by **Weeks 42–43**. iPad-first.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Topics: Revenue dashboard · Booking funnel + staff productivity + service performance · Client retention/cohort · Marketplace attribution · Custom report builder · Scheduled report email · Export with RBAC · Operator-scoped audit log explorer (tenant) · AI feature toggles per tenant · Role-aware AI budget config · AI suggestion review queue · Approve/reject AI campaign queue · AI usage analytics + safety incident log · Broader AI audit log · Marketplace post composer (tenant) · Per-post performance · Anti-client-theft compliance dashboard · PDF/print specs (daily close, scheduled reports, GDPR export packages).

New components: `chart-card` (line/bar/funnel/cohort), `date-range-picker`, `report-builder-canvas`, `ai-suggestion-review-row`, `post-composer`, `audit-log-filter-bar`, `audit-log-row`, `print-report-layout`.

---

## SCREEN — R.1 Revenue Dashboard

```text
SCREEN: Revenue    DEVICE: iPad + iPhone
- Header: date-range-picker (US format) + comparison toggle (vs prior period).
- KPI tiles: gross USD, net (after fees), refunds, ARPU, AOV.
- chart-card line: revenue trend.
- chart-card bar: revenue by service category.
- Top services table.
STATES: default, no-data, error, loading.
```

## SCREEN — R.2 Funnel + Staff + Service Performance

```text
R.2.1 Booking funnel chart-card (funnel: search → view → start booking → completed → paid → reviewed) with drop-off %.
R.2.2 Staff productivity table + sparklines.
R.2.3 Service performance table (bookings, revenue $, rating avg).
States: default, error.
```

## SCREEN — R.3 Client Retention / Cohort

```text
SCREEN: Cohort    DEVICE: iPad
- chart-card cohort grid (rows: month-acquired, cols: month-N retention %).
- Color heatmap warm-oat → coral-blossom.
States: default, no-data, error.
```

## SCREEN — R.4 Marketplace Attribution

```text
SCREEN: Marketplace Attribution    DEVICE: iPad + iPhone
- KPI: posts → views → bookings → revenue.
- Per-post conversion table.
States: default, no-data, error.
```

## SCREEN — R.5 Custom Report Builder

```text
SCREEN: Report Builder    DEVICE: iPad primary
- report-builder-canvas: drag chart components onto grid; left panel data sources + dimensions + measures.
- Save as report.
States: empty canvas, building, saved, error.
```

## SCREEN — R.6 Scheduled Report Email

```text
SCREEN: Schedule Report    DEVICE: modal-sheet
- Recipients (email list) + frequency (Daily/Weekly/Monthly) + day/time (US) + format (PDF/CSV).
States: scheduled, paused, error.
```

## SCREEN — R.7 Export with RBAC

```text
SCREEN: Export    DEVICE: modal-sheet
- Categories with RBAC-aware checkbox list (greyed if unauthorized + "Request access" tertiary).
- Format picker.
- Compliance disclosure body for sensitive fields.
States: building, ready, denied, error.
```

## SCREEN — R.8 Operator-Scoped Audit Log Explorer (Tenant)

```text
SCREEN: Audit Log (Tenant)    DEVICE: iPad + iPhone
- audit-log-filter-bar: date range, actor, action type, resource, severity.
- audit-log-row list: timestamp · actor · action · resource · diff link.
- Detail drawer with before/after JSON pretty-printed.
States: default, no-results, loading, error.
```

## SCREEN — R.9 AI Feature Toggles per Tenant

```text
SCREEN: AI Toggles    DEVICE: iPad + iPhone
- preference-toggle-row list of AI features (Suggestions, Auto-replies, Content gen, Smart scheduling, Predictive retention).
- Per-feature daily budget USD input.
States: enabled/disabled, saving.
```

## SCREEN — R.10 Role-Aware AI Budget Config

```text
SCREEN: AI Budgets    DEVICE: iPad + iPhone
- Table: role · daily budget USD · monthly cap USD · alert threshold %.
- Add/edit modal.
States: configured, alert-triggered.
```

## SCREEN — R.11 AI Suggestion Review Queue

```text
SCREEN: AI Suggestion Reviews    DEVICE: iPad + iPhone
- ai-suggestion-review-row list with suggestion preview + Accept/Reject/Modify + reviewer note.
States: pending, accepted, rejected, modified.
```

## SCREEN — R.12 Approve / Reject AI Campaign Queue

```text
Variant of R.11 for campaign-scoped AI: previews multi-channel render + compliance check status.
States: pending, approved, rejected.
```

## SCREEN — R.13 AI Usage Analytics + Safety Incident Log

```text
SCREEN: AI Usage    DEVICE: iPad + iPhone
- KPI tiles: calls, cost USD, savings USD, incidents.
- chart-card line: cost over time.
- Safety incident table.
States: default, error.
```

## SCREEN — R.14 Broader AI Audit Log Explorer

```text
Variant of R.8 scoped to AI: includes prompt (truncated), model, tokens, cost USD, response excerpt.
States: default, error.
```

## SCREEN — R.15 Marketplace Post Composer (Tenant)

```text
SCREEN: Post Composer    DEVICE: iPad + iPhone
- post-composer: image upload + crop, title, body, hashtag chip-row, link to service (auto-attach), schedule controls.
- Visibility per location.
- AI assist toggle (writes draft body) + explainability link.
States: draft, scheduled, published, error.
```

## SCREEN — R.16 Per-Post Performance

```text
SCREEN: Post Performance    DEVICE: iPad + iPhone
- Hero post preview.
- KPI tiles: views, saves, shares, bookings, revenue $.
- chart-card line over time.
States: default, no-data.
```

## SCREEN — R.17 Anti-Client-Theft Compliance Dashboard

```text
SCREEN: Anti-Theft Dashboard    DEVICE: iPad + iPhone
- Risk score per staff (badge).
- Flag list: suspicious off-platform redirect attempts in messages.
- Action: investigate, dismiss, escalate.
States: default, no-flags, error.
```

## SCREEN — R.18 PDF / Print Specs

```text
print-report-layout templates (US Letter):
- Daily close report.
- Scheduled report (any chart-card export to PDF).
- GDPR/CCPA export package cover sheet + index.
States: rendered.
```

---

## COMPONENTS

```text
chart-card — radius large 16, padding 16, header (title heading-3 + range label-small muted + kebab). Variants: line, bar, funnel, cohort. Color rotation from brand palette only.

date-range-picker — input opens calendar popover with presets (Today, Yesterday, Last 7d, Last 30d, This month, Last month, Custom). US format.

report-builder-canvas — left panel data tree, center grid canvas, right panel selected component config.

ai-suggestion-review-row — preview body + suggestion type chip + Accept/Reject/Modify + reviewer + timestamp.

post-composer — image area + content fields + hashtag chips + service link + visibility chips + schedule controls + AI assist toggle.

audit-log-filter-bar — chip-row of active filters + filter button to open sheet + date-range-picker.

audit-log-row — timestamp · actor avatar+name · action label · resource link · severity pill · expand for diff.

print-report-layout — US Letter, header (logo + title + date), body grid, footer (page n/m + tenant info + ADA-compliant alt text for charts).
```

---

## Human Review Checklist

- [ ] All 18 screens + 8 components delivered.
- [ ] Charts use only brand palette; pair color with text/legend.
- [ ] All currency USD; dates US format.
- [ ] AI sections include explainability links.
- [ ] Audit log shows before/after diff with actor.
- [ ] Print templates US Letter + ADA alt-text for charts.
- [ ] Frames named `R-<screen>-<state>`.
