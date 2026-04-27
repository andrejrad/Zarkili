# Batch P — CRM, Loyalty, Activities, Campaigns Admin

> Consumed by **Weeks 39–40**. iPad-first.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Topics: Client list + saved views · Client detail (history/preferences/loyalty/notes/allergies/gallery/consents) · Merge duplicate clients · Block/report client · Segmentation builder · Targeted send · GDPR/CCPA per-client export + delete · Loyalty config (earn rules/tiers/expiration/multipliers) · Reward catalog editor · Manual point adjustment + audit · Loyalty dashboard + tier migration · Activity/challenge catalog editor + analytics · Campaign list + create + schedule + audience picker · Multi-channel template editor · A/B variant + send-time · AI content approval · Pre-send compliance checklist · Campaign performance · Transactional template editor · Promotions/discount codes admin.

New components: `filter-segment-builder`, `merge-conflict-resolver`, `multi-channel-template-editor`, `ab-variant-card`, `approval-queue-row`, `channel-preview-tile`, `transactional-template-variable-picker`, `discount-code-rule-editor`.

---

## SCREEN — P.1 Client List + Saved Views

```text
SCREEN: Clients    DEVICE: iPad + iPhone
- data-table-v1: name · last visit · LTV USD · tier · tags · status pill.
- Filter bar + saved views chip-row (Top spenders, At-risk, New this month).
- Bulk-action bar.
STATES: default, empty, error, loading.
```

## SCREEN — P.2 Client Detail

```text
SCREEN: Client Detail (Admin)    DEVICE: iPad + iPhone
- client-header (G.4 reuse).
- Tabs: Overview · History · Preferences · Loyalty · Notes · Allergies · Gallery · Consents.
- Consents tab shows TCPA/CAN-SPAM/CCPA records with timestamps + source.
STATES: default, no-data per tab, error.
```

## SCREEN — P.3 Merge Duplicate Clients

```text
SCREEN: Merge Clients    DEVICE: iPad + iPhone
- Left-right column compare (name, phone US, email, addresses, history counts).
- merge-conflict-resolver: per field pick which value wins.
- Preview merged record + destructive primary "Merge".
STATES: default, conflict-resolved, merging, merged, error.
```

## SCREEN — P.4 Block / Report Client

```text
- Block client: destructive confirm with reason + scope (this location / all).
- Report client: form to platform team (reason + evidence upload).
States: default, blocked, reported.
```

## SCREEN — P.5 Segmentation Builder

```text
SCREEN: Segments    DEVICE: iPad primary
- filter-segment-builder: AND/OR rule groups (e.g., "Last visit < 60 days AND Service includes Hair AND LTV > $500").
- Live preview count.
- Save segment + name.
STATES: default, saved, building (loader), error.
```

## SCREEN — P.6 Targeted Send to Segment

```text
SCREEN: Send    DEVICE: iPad + iPhone
- Wizard: Audience (segment picker) → Channel (push/email/SMS) → Template → Schedule → Compliance check → Confirm.
STATES: each step + sent.
```

## SCREEN — P.7 GDPR / CCPA per-Client Export + Delete

```text
SCREEN: Per-Client Privacy Actions    DEVICE: iPad + iPhone
- Export: build & download client data ZIP.
- Delete: destructive confirm with cooldown + audit log.
States: requested, building, ready, deleted, error.
```

## SCREEN — P.8 Loyalty Program Config

```text
SCREEN: Loyalty Config    DEVICE: iPad primary
- Sections: Earn rules (per service/category $→pts), Tiers (name + threshold + benefits), Expiration (none/months), Multipliers (events).
STATES: draft, published, error.
```

## SCREEN — P.9 Reward Catalog Editor

```text
SCREEN: Reward Editor    DEVICE: iPad + iPhone
- List + create modal: title, image, points cost, terms (rich text), validity dates (US), inventory cap.
States: draft, published, archived, error.
```

## SCREEN — P.10 Manual Point Adjustment

```text
SCREEN: Adjust Points    DEVICE: modal-sheet
- Search client + amount (signed) + reason picker + required note + audit log preview.
States: default, applied, error.
```

## SCREEN — P.11 Loyalty Dashboard + Tier Migration

```text
SCREEN: Loyalty Dashboard    DEVICE: iPad + iPhone
- KPI tiles: enrolled, active, points outstanding, redemption rate.
- Tier distribution chart.
- Tier migration tool: bulk move clients with audit.
States: default, migrating, error.
```

## SCREEN — P.12 Activity / Challenge Catalog + Analytics

```text
SCREEN: Activities Admin    DEVICE: iPad + iPhone
- List + editor (rules, points, validity dates, max participants).
- Per-activity analytics card (started, completed, conversion %).
States: draft, live, ended, error.
```

## SCREEN — P.13 Campaign List + Create + Schedule + Audience

```text
SCREEN: Campaigns    DEVICE: iPad + iPhone
- data-table-v1: campaign · channel · audience · scheduled · status · CTR · revenue.
- Create wizard (similar to P.6).
States: draft, scheduled, sending, sent, paused, error.
```

## SCREEN — P.14 Multi-Channel Template Editor

```text
SCREEN: Template Editor    DEVICE: iPad primary
- multi-channel-template-editor: tabs Push/Email/SMS/In-app.
- WYSIWYG body + variable inserter (transactional-template-variable-picker).
- channel-preview-tile per channel renders the message.
- TCPA/CAN-SPAM disclaimers required for SMS/Email.
States: editing, saved, error.
```

## SCREEN — P.15 A/B Variant + Send-Time

```text
SCREEN: A/B Setup    DEVICE: iPad + iPhone
- Two ab-variant-card columns (Variant A / B), traffic split slider.
- Winner-rule picker (CTR / revenue).
- Send-time controls (immediate / scheduled US datetime / time-zone smart-send).
States: configured, running, complete.
```

## SCREEN — P.16 AI-Generated Content Approval Workflow

```text
SCREEN: AI Approvals    DEVICE: iPad + iPhone
- Queue list of approval-queue-row: AI-generated content preview + reviewer + actions (Approve · Reject · Edit).
- Side panel shows full preview with explainability link.
States: pending, approved, rejected, edited.
```

## SCREEN — P.17 Pre-Send Compliance Checklist

```text
SCREEN: Compliance Check    DEVICE: modal-sheet
- Checklist: TCPA opt-in present, unsubscribe link, sender ID set, profanity scan passed, accessibility scan passed (alt text on images).
- Block send if any unchecked. Override requires Manager+ role + reason.
States: passing, failing, overridden.
```

## SCREEN — P.18 Campaign Performance

```text
SCREEN: Performance    DEVICE: iPad + iPhone
- KPI tiles + funnel chart (sent → opened → clicked → booked → revenue $).
- Per-variant breakdown when A/B.
States: default, no-data, error.
```

## SCREEN — P.19 Transactional Template Editor

```text
Reuse P.14 with limited variables for booking-confirmation, reminder, no-show, cancellation, receipt, password-reset.
States: editing, saved, restored-defaults.
```

## SCREEN — P.20 Promotions / Discount Codes Admin

```text
SCREEN: Discount Codes    DEVICE: iPad + iPhone
- data-table-v1 list.
- discount-code-rule-editor: code, type (% / $ / free-add-on), min spend, applicable services, valid dates (US), usage cap, per-customer cap, stackable toggle.
- Redemption tracker per code.
States: draft, active, expired, error.
```

---

## COMPONENTS

```text
filter-segment-builder — nested AND/OR group cards with field/operator/value rows. Live preview count chip.

merge-conflict-resolver — two-column compare table with radio per row to pick winner.

multi-channel-template-editor — tab bar Push/Email/SMS/In-app + content area per tab + variable picker drawer.

ab-variant-card — radius large 16, padding 16, label "Variant A", traffic % chip, content preview.

approval-queue-row — preview card thumbnail + body excerpt + actions Approve/Reject/Edit + reviewer avatar.

channel-preview-tile — device-frame mini render per channel (push notification, inbox preview, SMS bubble, in-app banner).

transactional-template-variable-picker — searchable list of merge tags `{{client.firstName}}` etc., insert on tap.

discount-code-rule-editor — form with type segmented control, value input ($ or %), date range, caps, applicability filters.
```

---

## Human Review Checklist

- [ ] All 20 screens + 8 components delivered.
- [ ] TCPA/CAN-SPAM/CCPA disclosures enforced in P.6, P.14, P.17.
- [ ] AI approval queue includes explainability link.
- [ ] All dates US format MM/DD/YYYY; times 12h with timezone.
- [ ] Pre-send compliance check blocks send on failure.
- [ ] Frames named `P-<screen>-<state>`.
