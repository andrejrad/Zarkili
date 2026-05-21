# Zarkili — Developer Handover Pack

**Pack date:** 2026-05-20
**Codebase snapshot:** post-W50 booking flow audit closure
**Maintainer convention:** all detail still lives in the primary docs under [documentation/new-platform/](../new-platform/). This pack is a developer-facing **index + synthesis** — it does not duplicate spec content, it points at it.

---

## What this pack covers

| # | File | Purpose |
|---|------|---------|
| 0 | [00_README.md](00_README.md) | This index + quick-orientation map |
| 1 | [01_CURRENT_STATUS.md](01_CURRENT_STATUS.md) | Where the build stands today: phases, KPIs, test counts, release-readiness |
| 2 | [02_ARCHITECTURE.md](02_ARCHITECTURE.md) | Frontend architecture: layers, providers, navigation, domain modules, runtime composition |
| 3 | [03_BACKEND_FIREBASE.md](03_BACKEND_FIREBASE.md) | Firebase architecture: Firestore collections, security rules, Cloud Functions, indexes, Storage, Auth |
| 4 | [04_DEBT_BUGS_GAPS.md](04_DEBT_BUGS_GAPS.md) | Every open debt, bug, and gap with severity, owner, and entry-point notes |
| 5 | [05_SPECS_AND_SCOPE.md](05_SPECS_AND_SCOPE.md) | Feature scope, in/out of v1, spec index, decisions still open |
| 6 | [06_DEV_GUIDE.md](06_DEV_GUIDE.md) | Local setup, commands, conventions, test strategy, deploy |
| 7 | [07_ROADMAP_NEXT_STEPS.md](07_ROADMAP_NEXT_STEPS.md) | Prioritised "what to pick up next" with concrete entry points |
| 8 | [08_DESIGN_HANDOFF.md](08_DESIGN_HANDOFF.md) | Design tokens, icons, component specs, screen specs, accessibility |

### Claude Code files (deploy before starting AI-assisted work)

| File | Deploy to | Purpose |
|------|-----------|---------|
| [CLAUDE.md](CLAUDE.md) | `/CLAUDE.md` (repo root) | Primary anchor: quality gate, architecture rules, reading order, session hygiene |
| [CLAUDE_src_app.md](CLAUDE_src_app.md) | `src/app/CLAUDE.md` | Navigation shell rules, route addition, tenant context (incl. failure example) |
| [CLAUDE_functions.md](CLAUDE_functions.md) | `functions/CLAUDE.md` | All 23 functions, trigger patterns, Vitest setup, deploy commands |
| [CLAUDE_tests.md](CLAUDE_tests.md) | `__tests__/CLAUDE.md` | Rules test environment (emulator-bound, different from src/app tests) |
| [CLAUDE_commands_preflight.md](CLAUDE_commands_preflight.md) | `.claude/commands/preflight.md` | `/preflight` — full quality gate + debt register + diary |
| [CLAUDE_commands_close_week.md](CLAUDE_commands_close_week.md) | `.claude/commands/close-week.md` | `/close-week` — generate `WEEKnn_CLOSE_REPORT.md` + update WEEKLY_LOG + DEBT_REGISTER |
| [CLAUDE_commands_triage_debt.md](CLAUDE_commands_triage_debt.md) | `.claude/commands/triage-debt.md` | `/triage-debt` — log a new debt entry with ID, severity, entry-point |

---

## 30-second orientation

Zarkili is a **multi-tenant SaaS for salons + a consumer marketplace** built on **Expo / React Native** (iOS + Android + Web) backed by **Firebase** (Firestore, Auth, Cloud Functions, Storage, Hosting). The product has three customer-facing surfaces, all served by the same `App.tsx` and the same navigation shell:

- **Consumer app** — discover salons + services, book, pay, loyalty, reviews.
- **Tenant admin** — every operational tool a salon needs (catalogue, schedules, billing, marketing, AI).
- **Platform super-admin** — multi-tenant governance, compliance, infra (the "ops portal").

All three are gated by a single `AppNavigatorShell` plus route-level guards (`none` / `authenticated` / `platform-admin`).

The data model is **brand → location → service_type → variants/addons/photos** (see `documentation/new-platform/zarkili_service_data_model_v3 (2).md`).

---

## State at a glance (2026-05-20)

| Dimension | Value |
|-----------|-------|
| Phase 1 (foundations W1–W12) | ✅ complete |
| Phase 2 (consumer UI W21–W34) | ✅ complete |
| Phase 3 (admin UI W36–W49) | ✅ complete |
| Booking flow v2 audit (W50) | ✅ closed |
| Tests passing | **3 667 / 3 667** across **182 suites** |
| TypeScript errors | 0 |
| Open P0 / P1 defects | 0 |
| Open release-blocking debt | 0 |
| Major next milestone | Explore Tab v2 build + Release-Candidate submission |

Detailed counts and phase rollups: [01_CURRENT_STATUS.md](01_CURRENT_STATUS.md).

---

## Where to look first as a new developer

1. **Read** [06_DEV_GUIDE.md](06_DEV_GUIDE.md) — local setup, build, test, deploy.
2. **Skim** [02_ARCHITECTURE.md](02_ARCHITECTURE.md) to internalise the module layout (`src/app/*` vs `src/domains/*` vs `src/shared/*`).
3. **Read** [03_BACKEND_FIREBASE.md](03_BACKEND_FIREBASE.md) — every Firestore collection and rule reasoning is here.
4. **Glance** at [04_DEBT_BUGS_GAPS.md](04_DEBT_BUGS_GAPS.md) so you know which open items are owned-by-design vs accidental.
5. **Open** [07_ROADMAP_NEXT_STEPS.md](07_ROADMAP_NEXT_STEPS.md) — concrete entry points if you want to start coding now.

---

## Primary source-of-truth documents (read these before anything else)

These are the canonical specs and registers in `documentation/new-platform/`. The handover pack quotes / cross-references them rather than re-deriving content.

| Document | Why it matters |
|----------|---------------|
| [ARCHITECTURE_OVERVIEW.md](../new-platform/ARCHITECTURE_OVERVIEW.md) | Module boundaries, cross-platform constraints |
| [DEBT_REGISTER.md](../new-platform/DEBT_REGISTER.md) | **Single source of truth** for every open / closed item |
| [PHASE1_COMPLETION_REPORT.md](../new-platform/PHASE1_COMPLETION_REPORT.md) | W1–W12 delivered surface |
| [PHASE3_COMPLETION_REPORT.md](../new-platform/PHASE3_COMPLETION_REPORT.md) | W36–W49 delivered admin surface |
| [WEEKLY_LOG.md](../new-platform/WEEKLY_LOG.md) | Week-by-week running log |
| [SECURITY_RULES_FINAL.md](../new-platform/SECURITY_RULES_FINAL.md) | Coverage matrix + property guarantees for `firestore.rules` |
| [PILOT_GO_LIVE.md](../new-platform/PILOT_GO_LIVE.md) | 28-item launch checklist, monitoring plan |
| [zarkili_service_data_model_v3 (2).md](../new-platform/zarkili_service_data_model_v3%20%282%29.md) | Canonical brand/location/service_type schema |
| [zarkili_booking_flow_spec_v2.md](../new-platform/zarkili_booking_flow_spec_v2.md) | Booking flow contract |
| [zarkili_explore_tab_spec_v2.md](../new-platform/zarkili_explore_tab_spec_v2.md) | Explore v2 spec (next major feature) |
| [zarkili_home_tab_spec_v2.md](../new-platform/zarkili_home_tab_spec_v2.md) | Home v2 spec |
| [runbooks/](../new-platform/runbooks/) | Incident / backup / rollback / health-check playbooks |

---

## How to keep this pack up to date

This pack is a **synthesis layer**. The protocol is:

- **Do not** duplicate spec text — link to it.
- When a closed week introduces material new structure (new domain, new top-level collection, new Cloud Function), update [02_ARCHITECTURE.md](02_ARCHITECTURE.md) or [03_BACKEND_FIREBASE.md](03_BACKEND_FIREBASE.md) with the **summary** and link back to the close report.
- The DEBT_REGISTER remains the operational truth; [04_DEBT_BUGS_GAPS.md](04_DEBT_BUGS_GAPS.md) only summarises **currently open** items at handover date.
