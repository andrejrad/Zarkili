> **Deploy to:** repo root as `/CLAUDE.md`

---

# CLAUDE.md — Zarkili

## What this project is

Multi-tenant SaaS for salons + consumer marketplace. Bookable unit is a **service** at a **location**, not a salon. One service card = one bookable service at one location. Primary market: US.

## Quality gate — non-negotiable

```bash
npm run check          # lint + typecheck + 3,667 tests — must stay green
npm run test:rules     # Firestore rules — run if you touch firestore.rules
```

**Before any change:** `npm run typecheck` (current baseline: 0 errors — keep it 0).  
**After any change:** `npm run check` and report the results verbatim.

## Architecture — three rules

1. `src/shared/` and `src/domains/` MUST NOT import from `src/app/`. UI talks to domains via injected services.
2. **Never import `firebase/*` from a screen.** Go through the area's `runtime.ts` adapter.
3. `AppNavigatorShell.tsx` is ~12,900 lines. **Do not restructure it.** Only add render cases inside the existing dispatch pattern. Splitting attempts re-introduced effect ordering bugs — this is intentional.

## Where to find things

| Question | Read |
|---|---|
| Current project status + test baseline | `documentation/HANDOVER/01_CURRENT_STATUS.md` |
| Architecture + layers + navigation | `documentation/HANDOVER/02_ARCHITECTURE.md` |
| Firebase backend (all 79 collections, 23 CFs) | `documentation/HANDOVER/03_BACKEND_FIREBASE.md` |
| Open debt + bugs (13 items, 0 P0/P1) | `documentation/HANDOVER/04_DEBT_BUGS_GAPS.md` |
| Feature scope, in/out of v1, spec index | `documentation/HANDOVER/05_SPECS_AND_SCOPE.md` |
| All npm commands, conventions, test strategy | `documentation/HANDOVER/06_DEV_GUIDE.md` |
| What to build next (Explore v2 walk order) | `documentation/HANDOVER/07_ROADMAP_NEXT_STEPS.md` |
| Design tokens, component specs, screen specs | `documentation/HANDOVER/08_DESIGN_HANDOFF.md` |

## Token budget — reading order

**Step 1 — always loaded:** this file (`/CLAUDE.md`).

**Step 2 — load the area CLAUDE.md if it exists:**
- Working in `src/app/` → read `src/app/CLAUDE.md`
- Working in `functions/` → read `functions/CLAUDE.md`
- Working in `__tests__/` (rules) → read `__tests__/CLAUDE.md`

**Step 3 — load ONE relevant spec:**  `documentation/new-platform/zarkili_{feature}_spec_v2.md` for the surface you're changing.

**Step 4 — load ONE reference test** if writing tests: pick the closest example from §Test pattern below.

**Step 5 — load the specific files being modified.** Prefer targeted reads (`startLine`/`endLine`) over full-file reads.

**Never load in steps 1–5:**  `documentation/HANDOVER/` (00–08), `DEBT_REGISTER.md` (full file), any `PHASE*_COMPLETION_REPORT`, `ARCHITECTURE_OVERVIEW.md`, `AppNavigatorShell.tsx` (full file). Use targeted section reads only.

## Session hygiene

- Use `/clear` when switching to an unrelated task (new feature, different domain).
- Use `/compact` mid-session if context exceeds ~50% of the window.
- Start a new session per workstream day — do not carry booking-flow context into a functions debugging session.

## Canonical data path

```
brands/{brandId}/locations/{locationId}/service_types/{stId}
  └── variants/{vId}
  └── addons/{aId}
  └── photos/{pId}
```

`brandId == tenantId`. The legacy top-level `locations/{id}` path is open debt (NEW-DEBT-B B3) — do not create new reads against it.

## Test pattern

Two patterns in use — match the area you're working in:

**Domain service test** (pure, no Firestore): mock the repo interface with a `makeRepo()` factory that returns an in-memory `Map`-backed fake.  
Reference: `src/domains/billing/__tests__/subscriptionService.test.ts`

**Domain repository test** (Firestore): mock `firebase/firestore` at module level using a `makeFirestoreMock()` factory; reset in `beforeEach`.  
Reference: `src/domains/connect/__tests__/repository.test.ts`

**Hook / component test** (UI): inject a typed service stub via props or provider; use `@testing-library/react-native`.  
Reference: `src/app/settings/__tests__/useAiBudgetAdminSettings.test.tsx`

Never call real Firebase from a test. The `jest-expo` preset isolates the runtime.

## Before completing any task

1. `npm run check` passes (green).
2. If you deferred anything, append to `documentation/new-platform/DEBT_REGISTER.md` with: ID, one-line description, severity (high/med/low), target week, entry-point file:line.
3. If you changed behaviour that diverges from a spec, note it — the spec wins for future work.

## Out-of-scope (do not implement without explicit instruction)

- Multi-service cart (`MultiServiceBookingScreen.tsx` placeholder — intentional stub)
- Apple/Google Pay wallet handler (NEW-DEBT-E, gated off)
- Drag-to-reschedule in admin calendar (W43-DEBT-2, descoped 2026-05-10)
- Voice search, AR try-on, service comparison, group booking
- Refactoring `AppNavigatorShell.tsx` structure
