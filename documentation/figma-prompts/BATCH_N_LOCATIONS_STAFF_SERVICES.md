# Batch N — Locations, Staff, Service Catalog Depth

> Consumed by **Weeks 35–37**. Critical path. iPad-first.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Topics: Per-location dashboard + multi-location overview · Location settings (hours, holidays, contact, photos) · Per-location service overrides · Resource management (rooms, chairs, equipment) · Walk-in/queue admin · Daily close/cash report · Staff invite + role + deactivate · Schedule editor (templates, exceptions, time-off approvals) · Qualification matrix · Commission/payout config · Per-staff performance · Service categories/tags + bulk import/export + price lists · Add-ons + packages + seasonal availability · Service media manager + booking rules + visibility toggles · Bulk-action bar v1.

New components: `schedule-grid-editor`, `time-off-approval-row`, `qualification-matrix`, `bulk-import-wizard`, `package-builder`, `photo-grid-manager`, `multi-select-checkbox-row`, `bulk-action-bar`.

---

## SCREEN — N.1 Per-Location Dashboard + Multi-Location Overview

```text
SCREEN: Per-Location + Multi-Location    DEVICE: iPad + iPhone
N.1.1 Multi-location overview — table of locations: name · address (US format) · today's bookings · revenue $ · status pill.
N.1.2 Per-location dashboard — KPI tile grid filtered to that location + appointments today.
STATES: default, single-location-only (skip switcher), error, loading.
```

## SCREEN — N.2 Location Settings

```text
SCREEN: Location Settings    DEVICE: iPad + iPhone
LAYOUT (sectioned-settings-layout sub-section)
- Address (US: Street/Apt/City/State 2-letter/ZIP).
- Contact phone US format + email.
- Hours editor: 7-day grid with open/close (12h AM/PM) + closed toggle + custom break.
- Holidays: list of US holidays + custom dates.
- Photos: photo-grid-manager (drag reorder, alt text required).
- ADA accessibility flags (Wheelchair / Accessible parking / Service animal welcome).
STATES: default, saving, validation error, error.
```

## SCREEN — N.3 Per-Location Service Overrides

```text
SCREEN: Service Overrides    DEVICE: iPad + iPhone
- Table of services with override toggle per location: price USD / duration / availability.
- Diff highlighting (warm-oat tint when override active).
STATES: default, override-active, conflict warning, error.
```

## SCREEN — N.4 Resource Management

```text
SCREEN: Resources    DEVICE: iPad + iPhone
- Tabs: Rooms · Chairs · Equipment.
- data-table-v1: name · capacity · location · status pill · maintenance schedule.
- Add resource modal-sheet.
STATES: default, empty per tab, in-maintenance banner.
```

## SCREEN — N.5 Walk-in / Queue (Admin Variant)

```text
Reuse G.3 with multi-staff column view + drag-to-reassign.
STATES: per staff queue; cross-staff move modal.
```

## SCREEN — N.6 Daily Close / Cash Report

```text
SCREEN: Daily Close    DEVICE: iPad + iPhone
- Checklist (cash drawer, products, tips reconciled).
- Cash count grid (denomination × qty = total).
- Tips by staff list.
- Variance display ($ over/short).
- Submit + email summary.
STATES: default, in-progress, submitted (locked), error.
```

## SCREEN — N.7 Staff Invite + Role + Deactivate

```text
SCREEN: Staff Management    DEVICE: iPad + iPhone
- data-table-v1: name · role · location(s) · status · actions.
- Invite modal: email + role picker (Owner / Manager / Stylist / Front desk) + locations + send.
- Deactivate destructive confirm.
STATES: default, invite-sent, invite-failed, deactivated.
```

## SCREEN — N.8 Schedule Editor

```text
SCREEN: Schedule Editor    DEVICE: iPad primary
- schedule-grid-editor: 7-day × time grid per staff. Drag to set availability, recurring templates picker.
- Exceptions overlay (e.g., training, holiday).
- time-off-approval-row queue at side: staff request rows with Approve / Deny / Request changes.
STATES: default, draft (unsaved badge), saving, conflict warning, error.
```

## SCREEN — N.9 Qualification / Service-Mapping Editor

```text
SCREEN: Qualifications    DEVICE: iPad primary
- qualification-matrix: rows=staff, cols=services, cells=checkbox + skill level chip.
- Bulk-action bar for assigning a service to many staff.
STATES: default, edited, saving.
```

## SCREEN — N.10 Commission / Payout Config

```text
SCREEN: Commission Config    DEVICE: iPad + iPhone
- Per-staff commission rule list: type (% of service / flat / tiered), value, applies to (services).
- Test calculator card: enter service price → preview commission $.
STATES: default, conflict warning, error.
```

## SCREEN — N.11 Per-Staff Performance

```text
SCREEN: Staff Performance    DEVICE: iPad + iPhone
- Header: staff selector.
- KPI tiles: revenue $, bookings, retention %, rating avg, no-show %.
- Trend chart (line) + leaderboard.
STATES: default, no-data, error.
```

## SCREEN — N.12 Service Catalog (Categories/Tags + Bulk Import)

```text
SCREEN: Catalog    DEVICE: iPad + iPhone
- Tree view: category → service → variants.
- bulk-import-wizard: upload CSV, map columns, preview rows, errors highlighted, confirm import.
- Bulk export → CSV download.
- Price lists: named price tiers (Standard / VIP / Off-peak) — table editor.
STATES: default, importing (progress %), errors, success, error.
```

## SCREEN — N.13 Add-ons + Packages + Seasonal Availability

```text
SCREEN: Packages    DEVICE: iPad + iPhone
- package-builder: drag services into package, set bundle price USD, set effective dates (US format).
- Seasonal availability rules editor (date range + day-of-week chips).
STATES: default, conflict, saved.
```

## SCREEN — N.14 Service Media + Booking Rules + Visibility

```text
SCREEN: Service Detail (Admin)    DEVICE: iPad + iPhone
- photo-grid-manager for service media (alt text required).
- Booking rules: lead time (hrs), cancellation cutoff, max party size, deposit %.
- Visibility toggles: per location, per role, marketplace.
STATES: default, hidden, draft.
```

## SCREEN — N.15 Bulk-Action Bar v1

```text
Component spec:
- Sticky bottom bar appears on multi-select.
- Shows selected count + actions (Edit · Duplicate · Delete · Export).
- Confirmation modal-sheet for destructive bulk actions.
States: hidden, visible, applying, applied toast.
```

---

## COMPONENTS

```text
schedule-grid-editor — 7 columns (US week start Sun) × hour rows. Tap cell to toggle availability. Drag to paint range. Recurring template chip-row above grid.

time-off-approval-row — left avatar + name; mid date range + reason; right Approve/Deny buttons + status pill.

qualification-matrix — sticky first col staff, sticky header services. Cells with checkbox + skill chip (Apprentice/Pro/Expert). Bulk select via column/row selectors.

bulk-import-wizard — 4-step modal: Upload → Map → Validate → Confirm. Each step with progress bar.

package-builder — left panel service picker, right panel package list with drag handles, total $.

photo-grid-manager — 2/3-col grid with drag reorder, alt-text input below each, drag-to-trash zone, max-files indicator.

multi-select-checkbox-row — leading checkbox 24, content area, supports group select all.

bulk-action-bar — sticky bottom surface white shadow up, padding 16, count + action buttons + dismiss ✕.
```

---

## Human Review Checklist

- [ ] All 15 screens + 8 components delivered.
- [ ] iPad-first; iPhone fallback validated.
- [ ] US address format; State 2-letter + ZIP 5/9.
- [ ] ADA accessibility flags exposed in location settings.
- [ ] Bulk-action bar present on every multi-select surface.
- [ ] Photo manager enforces alt-text.
- [ ] Frames named `N-<screen>-<state>`.
