# Batch S — Platform Super-Admin & Cross-Cutting Admin

> Consumed by **Week 44**. Internal Zarkili staff surface (super-admin). iPad / desktop primary.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Topics: Tenant directory + detail · Suspend/reactivate tenant · Impersonation flow with audit + duration cap · Cross-tenant analytics · Platform health dashboard · Pricing/plan management · Feature flag console · Platform-wide audit log · Cross-tenant marketplace moderation · Cross-tenant AI budget overrides · Migration runner UI · Backup/restore status · Support inbox/ticketing · General audit log · Security events dashboard · Data-export-request dashboard · Consent + policy version log · Incident response status · Admin sign-in + 2FA enforcement · Admin device management · Role-denied / permission-required states · Bulk-action confirmation pattern · Destructive-action confirmation with reason · Command palette · "View as client" preview mode.

New components: `impersonation-banner`, `feature-flag-toggle-row`, `migration-runner-step-view`, `command-palette-overlay`, `role-denied-empty-state` (reuse from M), `destructive-confirm-with-reason`.

---

## SCREEN — S.1 Tenant Directory + Detail

```text
SCREEN: Tenants    DEVICE: Desktop 1280+ / iPad
- data-table-v1: tenant · plan · status pill · MRR USD · created MM/DD/YYYY · actions.
- Filters: plan, status, region.
- Detail drawer: KPIs + plan + Connect health + recent issues + impersonate CTA.
STATES: default, suspended, churned, error.
```

## SCREEN — S.2 Suspend / Reactivate Tenant

```text
SCREEN: Suspend Tenant    DEVICE: modal-sheet
- destructive-confirm-with-reason: reason picker + body required + duration (Indefinite / 7 / 30 days).
- Notify owner toggle.
States: suspended, reactivated, error.
```

## SCREEN — S.3 Impersonation Flow

```text
SCREEN: Impersonate    DEVICE: modal + global banner
- Pre-confirm modal: select tenant + duration cap (15 / 30 / 60 min) + reason required + audit acknowledgement.
- impersonation-banner sticky at top of every page during session: "Impersonating <tenant> — XX:XX remaining" + End now CTA.
States: requesting, active, ending, ended.
```

## SCREEN — S.4 Cross-Tenant Analytics

```text
SCREEN: Cross-Tenant    DEVICE: Desktop / iPad
- chart-card line MRR, ARR, churn %.
- Top tenants table.
- Cohort retention.
States: default, error.
```

## SCREEN — S.5 Platform Health Dashboard

```text
SCREEN: Platform Health    DEVICE: Desktop / iPad
- Service status grid (API, DB, Stripe webhook, Auth, Storage) — status pill + uptime %.
- Latency chart.
- Active incident banner.
States: green, degraded, outage.
```

## SCREEN — S.6 Pricing / Plan Management

```text
SCREEN: Plans Admin    DEVICE: Desktop / iPad
- Plan list with editor: name, price USD, included features, limits.
- Trial config + grandfathering rules.
States: draft, published, archived.
```

## SCREEN — S.7 Feature Flag Console

```text
SCREEN: Flags    DEVICE: Desktop / iPad
- feature-flag-toggle-row list: flag key · description · % rollout slider · per-tenant overrides count.
- Search + filter.
States: enabled, disabled, partial.
```

## SCREEN — S.8 Platform-Wide Audit Log

```text
Variant of R.8 cross-tenant; tenant column added.
States: default, error.
```

## SCREEN — S.9 Cross-Tenant Marketplace Moderation

```text
SCREEN: Marketplace Moderation    DEVICE: Desktop / iPad
- Queue of flagged posts/comments with thumbnails + reasons.
- Actions: Approve · Remove · Ban author · Escalate.
States: pending, processed, error.
```

## SCREEN — S.10 Cross-Tenant AI Budget Overrides

```text
SCREEN: AI Budget Overrides    DEVICE: Desktop / iPad
- Per-tenant override table; bulk-action bar to apply policy.
States: default, override-applied.
```

## SCREEN — S.11 Migration Runner UI

```text
SCREEN: Migration Runner    DEVICE: Desktop
- migration-runner-step-view: list of pending migrations with status (pending/running/done/failed) + per-step logs panel.
- Run button + dry-run toggle.
States: idle, running, completed, failed.
```

## SCREEN — S.12 Backup / Restore Status

```text
SCREEN: Backups    DEVICE: Desktop / iPad
- Schedule editor.
- Last backup card with size + duration + status.
- Restore wizard (destructive confirm, reason required).
States: healthy, late, restoring, failed.
```

## SCREEN — S.13 Support Inbox / Ticketing

```text
SCREEN: Support Inbox    DEVICE: Desktop / iPad
- 3-pane (queue / thread / customer info).
- SLA timer chip per ticket.
- Vendor embed placeholder area.
States: default, sla-breach, resolved, error.
```

## SCREEN — S.14 General Audit Log

```text
Reuse R.8/S.8 pattern with platform scope.
States: default.
```

## SCREEN — S.15 Security Events Dashboard

```text
SCREEN: Security Events    DEVICE: Desktop / iPad
- KPI tiles: failed logins, MFA challenges, suspicious sessions, blocked IPs.
- Map of activity (US heat).
- Recent events table.
States: default, alert.
```

## SCREEN — S.16 Data-Export-Request Dashboard

```text
SCREEN: Data Requests    DEVICE: Desktop / iPad
- Queue of CCPA/GDPR requests with SLA countdown.
- Status pill + actions.
States: pending, processing, completed, expired.
```

## SCREEN — S.17 Consent + Policy Version Log

```text
SCREEN: Policy Versions    DEVICE: Desktop / iPad
- List of policies with version + effective date (US) + acceptance count.
- Diff viewer between versions.
States: published, draft, error.
```

## SCREEN — S.18 Incident Response Status

```text
SCREEN: Incident    DEVICE: Desktop / iPad
- Severity pill, status, ETA.
- Communication log.
- Customer comms templates.
States: investigating, identified, monitoring, resolved.
```

## SCREEN — S.19 Admin Sign-In + 2FA Enforcement

```text
Reuse A.1 + I.11.2/3 with stricter copy and mandatory 2FA gate before access.
States: default, mfa-required.
```

## SCREEN — S.20 Admin Device Management

```text
Reuse I.11.5 with stricter audit per device.
States: default.
```

## SCREEN — S.21 Role-Denied / Permission-Required States

```text
Render role-denied-empty-state across critical surfaces with "Request access" CTA opening request form (target role, justification).
States: denied, requested, approved.
```

## SCREEN — S.22 Bulk-Action Confirmation Pattern

```text
Variant of bulk-action-bar confirm: shows selected count, action description, undo policy, primary "Apply" + secondary cancel.
States: default, applying, applied with undo toast (10s).
```

## SCREEN — S.23 Destructive-Action Confirmation with Reason

```text
destructive-confirm-with-reason: typed value match + reason picker + required note + acknowledgement checkbox + destructive primary.
States: default, validating, submitted, error.
```

## SCREEN — S.24 Command Palette

```text
SCREEN: Command Palette    DEVICE: Desktop / iPad
- command-palette-overlay (Cmd/Ctrl-K) modal centered 720 wide. Search input top, sectioned results (Navigate, Actions, Recent), keyboard hints.
- Per-result icon + label + shortcut chip.
States: open, searching, no-results, executing, error.
```

## SCREEN — S.25 "View as Client" Preview Mode

```text
SCREEN: View as Client    DEVICE: Desktop / iPad
- Persistent banner top (similar to impersonation-banner) "Viewing as <client> (read-only)" + Exit CTA.
- All actions disabled and visibly muted.
States: active, exited.
```

---

## COMPONENTS

```text
impersonation-banner — sticky top, error-toned bg with countdown timer + tenant name + End-now CTA. Z-index above all content.

feature-flag-toggle-row — flag key (monospace) · description · rollout % slider · tenant overrides count chip · environment chip (dev/stg/prod).

migration-runner-step-view — vertical step list with status icons + expandable log pane per step.

command-palette-overlay — modal 720 wide centered, scrim 50% black, search input label-large, sectioned results with section labels and keyboard shortcut chips.

destructive-confirm-with-reason — typed value field ("Type DELETE to confirm") + reason picker + note textarea + acknowledgement + destructive primary disabled until valid.
```

---

## Human Review Checklist

- [ ] All 25 screens + 5 components delivered.
- [ ] Impersonation banner is unmissable and shows countdown.
- [ ] Destructive actions require typed confirmation + reason.
- [ ] Command palette keyboard shortcut Cmd/Ctrl-K announced.
- [ ] Role-denied state present with actionable "Request access".
- [ ] All currency USD; dates US format.
- [ ] Frames named `S-<screen>-<state>`.
