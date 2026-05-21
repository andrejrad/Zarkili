# 06 — Developer Guide

**Purpose:** everything a new engineer needs to clone, run, test, and deploy.

Companion docs: [ENV_SETUP.md](../new-platform/ENV_SETUP.md), [CONTRIBUTING.md](../../CONTRIBUTING.md), [DAILY_WORK_DIARY_TEMPLATE.md](../DAILY_WORK_DIARY_TEMPLATE.md), [PILOT_GO_LIVE.md](../new-platform/PILOT_GO_LIVE.md).

---

## 1. Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node | **>=20** | Enforced via `engines.node` |
| npm | bundled with Node 20 | Lockfile is npm |
| Expo CLI | via `npx expo` | No global install needed |
| Firebase CLI | latest | `npm i -g firebase-tools` |
| Java JDK | 17+ | For Android builds |
| Xcode | 15+ | iOS builds only — macOS required |
| EAS CLI | optional | For native cloud builds: `npm i -g eas-cli` |
| Stripe CLI | optional | For webhook testing |

---

## 2. First-time setup

```powershell
git clone <repo>
cd Zarkili
npm install
npm --prefix functions install
```

Environment files (not in repo — request from team):

- `.env.development` → points at `zarkili-dev` Firebase project
- `.env.production` → points at `zarkili-production`

Both files contain:

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=...
```

Full key list: [ENV_SETUP.md](../new-platform/ENV_SETUP.md).

---

## 3. Daily commands

All from repo root.

### 3.1 Run the app

| Command | What it does |
|---------|--------------|
| `npm start` | Alias for `start:dev` |
| `npm run start:dev` | Expo dev server using `.env.development` |
| `npm run start:prod` | Expo dev server using `.env.production` |
| `npm run android` | Native Android build & run |
| `npm run ios` | Native iOS build & run (macOS) |
| `npm run web` | Web target (react-native-web) |

### 3.2 Quality gates

| Command | What it does |
|---------|--------------|
| `npm run lint` | ESLint over `.ts/.tsx/.js/.jsx` |
| `npm run lint:fix` | ESLint with autofix |
| `npm run typecheck` | `tsc --noEmit` — must be 0 errors |
| `npm test` | Full Jest suite (currently 3,667 tests / 182 suites) |
| `npm run test:watch` | Watch mode |
| `npm run test:smoke:web` | Web routing smoke (`AppNavigatorShell.webRouting.test.tsx`) |
| `npm run test:smoke:native` | Native shell smoke (`AppNavigatorShell.test.tsx`) |
| `npm run test:rules` | Firestore rules tests via emulator (`__tests__/firestore.rules.test.ts`) |
| `npm run check` | **lint + typecheck + tests** — run before every PR |

### 3.3 Emulators & seed data

| Command | What it does |
|---------|--------------|
| `npm run firebase:emulators` | Start Auth/Firestore/Storage/Functions/Hosting emulator suite (dev project) |
| `npm run seed:discovery:dev` | Seed featured-salons / discovery scaffold |
| `npm run seed:qa:dev` | Seed QA dataset; `:dry` and `:clear` variants available |
| `npm run seed:demo:dev` | Seed demo services; `:dry` and `:clear` variants available |

Emulator ports: Auth 9099, Firestore 8080, Storage 9199, Functions 5001, Hosting 5000, UI 4000. Full table in [03_BACKEND_FIREBASE.md](03_BACKEND_FIREBASE.md).

### 3.4 Build & deploy

| Command | What it does |
|---------|--------------|
| `npm run build:web:dev` | Expo export web → `dist/` using dev env |
| `npm run build:web:prod` | Expo export web → `dist/` using prod env |
| `npm run copy:static` | Copy `public-static/*` → `dist/` |
| `npm run deploy:web:dev` | Build + copy + `firebase deploy --only hosting` to **zarkili-dev** |
| `npm run deploy:web:prod` | Build + copy + `firebase deploy --only hosting` to **zarkili-production** |
| `npm run firebase:deploy:dev` | Full Firebase deploy (rules, indexes, functions, hosting) → dev |
| `npm run firebase:deploy:prod` | Full Firebase deploy → prod |
| `npm run functions:build` | `tsc` build inside `functions/` |
| `npm run functions:serve` | Local functions emulator shell |

Native (mobile) cloud builds are handled by **EAS** — see [eas.json](../../eas.json) for profiles. See repository memory `eas-build-policy.md` if available.

---

## 4. Conventions

### 4.1 Layered architecture (enforced socially, not by lint)

```
src/shared/   — utilities, primitives, theme, money/i18n. No domain imports.
src/domains/  — pure business logic. Ports define interfaces; adapters live behind runtime.ts.
src/app/      — UI screens, navigation shell, runtime composition (wires Firebase adapters).
```

Rule: **`src/shared/` and `src/domains/` MUST NOT import from `src/app/`**. UI talks to domains via injected services from `runtime.ts`.

### 4.2 Dependency injection

Each app area exports a `runtime.ts` that constructs Firebase-backed adapters and provides a `useRuntime()` hook. In tests, the runtime is replaced with in-memory fakes. **Never import `firebase/*` from a screen** — go through the area's runtime.

### 4.3 Cross-platform

- Same TSX file for native + web wherever possible.
- Platform-specific only via `.native.tsx` / `.web.tsx` siblings or `Platform.select`.
- Web routing is URL-synced from `AppNavigatorShell.tsx`.
- Sensitive screens (e.g. platform admin) must work on both — see [CROSS_PLATFORM_CAPABILITY_MATRIX.md](../new-platform/CROSS_PLATFORM_CAPABILITY_MATRIX.md).

### 4.4 Adding a screen

1. Add the route to `src/app/navigation/routes.ts` with `guard` and (optional) `webPath`.
2. Add a render case in `AppNavigatorShell.tsx` (yes, the big file — that is the current pattern).
3. If the screen needs Firebase, **inject** services via the relevant `runtime.ts`; don't import `firebase/*` directly.
4. Add a unit test using the area's in-memory fakes.
5. If the route is auth-gated, verify guard semantics in `NAVIGATION_PUBLIC_PROTECTED.md`.

### 4.5 Adding a Firestore collection

1. Update [SECURITY_RULES_FINAL.md](../new-platform/SECURITY_RULES_FINAL.md) — define ownership + role gates.
2. Add a `match` block to [firestore.rules](../../firestore.rules) using existing helpers (`isTenantAdmin`, `tenantRole`, `isOwner`).
3. Add a rules test to `__tests__/firestore.rules.test.ts` (allow + deny cases).
4. If composite queries are needed, add to [firestore.indexes.json](../../firestore.indexes.json).
5. Run `npm run test:rules` against the emulator.

### 4.6 Adding a Cloud Function

1. Add to `functions/src/index.ts` (re-export).
2. Implement in a topic-specific module under `functions/src/`.
3. Cover with a unit test where feasible.
4. Document in [03_BACKEND_FIREBASE.md §5](03_BACKEND_FIREBASE.md).

---

## 5. Test strategy

| Layer | Tooling | Bound to |
|-------|---------|----------|
| Unit / component | Jest + `@testing-library/react-native` + `jest-expo` | In-memory fakes (runtime DI) |
| Rules | Jest + `@firebase/rules-unit-testing` | Firestore emulator (`test:rules`) |
| Smoke (shell) | Jest | `test:smoke:web` / `test:smoke:native` |
| Manual + device | EAS dev/preview builds | Real Firebase dev project |

Baseline at handover: **3,667 / 3,667** passing, 182 suites, 0 TS errors. Keep it green; `npm run check` before every push.

Config files:

- [jest.config.js](../../jest.config.js) — main config
- [jest.rules.config.js](../../jest.rules.config.js) — rules tests only
- [jest.setup.ts](../../jest.setup.ts) — global setup, mocks
- [eslint.config.mjs](../../eslint.config.mjs) — ESLint flat config

---

## 6. Process & cadence

This project runs a **weekly protocol** (week-numbered work batches). See repository memory `week-protocol.md` if available.

### 6.1 Per-task discipline

1. Read the relevant spec under `documentation/new-platform/`.
2. Update the **diary** for the day using [DAILY_WORK_DIARY_TEMPLATE.md](../DAILY_WORK_DIARY_TEMPLATE.md). Diary entries describe **all** work that day, not just the latest item.
3. Write failing tests first when feasible.
4. Implement + run `npm run check`.
5. If you discover any debt, log to [DEBT_REGISTER.md](../new-platform/DEBT_REGISTER.md) with ID, severity, target week, entry-point.
6. If a debt is closed, mark it **CLOSED — <YYYY-MM-DD>** with verification (test IDs, file:line).

### 6.2 Per-week discipline

- Open the week's section in [WEEKLY_LOG.md](../new-platform/WEEKLY_LOG.md).
- At week close, produce `WEEKnn_CLOSE_REPORT.md` (W49 + W50 are examples). Cover surface delivered, tests added, debt opened/closed.
- Update [DOCUMENTATION_COMMAND_CENTER.md](../DOCUMENTATION_COMMAND_CENTER.md) for any new specs.

### 6.3 Definition of done

- ✅ `npm run check` green (lint + typecheck + tests)
- ✅ Rules tests green if rules changed
- ✅ DEBT_REGISTER updated if any deferral
- ✅ Diary updated
- ✅ Spec updated if behaviour diverged
- ✅ No new TypeScript errors (current target: **0**)

---

## 7. Release / Pre-RC checklist

Pre-pilot: 28 items in [PILOT_GO_LIVE.md](../new-platform/PILOT_GO_LIVE.md). Post-launch: 14-day monitoring per [HEALTH_CHECKS.md](../new-platform/runbooks/HEALTH_CHECKS.md).

Phase 3.5 release-readiness plan covering W50–W54: [PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_50_TO_54.md](../PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_50_TO_54.md).

---

## 8. Debugging tips

- **Web emulator + native emulator together** — change ports in [firebase.json](../../firebase.json) if there's a conflict.
- **Stripe Payment Sheet** does not run in web — verify the web fallback (`@stripe/react-stripe-js`).
- **AppNavigatorShell.tsx is large (~12,900 lines)** — use VS Code "Go to Symbol" (Ctrl+Shift+O) and route to a specific route render case.
- **Tenant context switch** — booking flow uses `salonContextPendingNav` deferred-navigation pattern. If a deep link arrives before the tenant has switched, the navigation is queued. See `NAVIGATION_PUBLIC_PROTECTED.md`.
- **Rules failures** — emulator output is in the terminal that runs `firebase:emulators`. Match the `match` block by collection path.

---

## 9. Common pitfalls

1. **Forgetting to inject** — calling `firebase/firestore` from a screen will pass tests (because the screen renders) but breaks DI and makes the screen un-mockable. Always go through `runtime.ts`.
2. **Updating only v1 spec** — current authoritative specs are v2. See [05_SPECS_AND_SCOPE.md §2.1](05_SPECS_AND_SCOPE.md).
3. **Using legacy `services/{id}` paths** — canonical is `brands/{brandId}/locations/{locationId}/service_types/{stId}`. See [zarkili_service_data_model_v3 (2).md](../new-platform/zarkili_service_data_model_v3%20%282%29.md).
4. **Single match block for plural collection** — verify both singular + plural / parent + sub paths in rules.
5. **Missing index** — composite queries fail in dev too; check [firestore.indexes.json](../../firestore.indexes.json).
