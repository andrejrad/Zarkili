# Architecture Overview (Baseline)

This baseline scaffolding establishes a modular multi-tenant app structure under `src` with explicit separation of app shell, shared utilities, and business domains.

## Structure Summary
- `src/app/providers`: application-level context providers and composition.
- `src/app/navigation`: route-group scaffolding for public/protected flow composition.
- `src/shared/config`: shared environment and Firebase configuration exports.
- `src/shared/utils`: framework-agnostic utility functions.
- `src/domains`: bounded domain modules (`auth`, `tenants`, `locations`, `staff`, `services`, `bookings`).

## Design Intent
- Keep platform-wide concerns in `app` and `shared`.
- Keep business logic and persistence contracts in domain modules.
- Make each domain independently testable and easy to evolve.
- Preserve runtime stability by adding non-invasive placeholders only.

## Cross-Platform Architecture Rules (iOS + Android + Web)
1. Route contracts, provider state, and domain repositories are platform-neutral and must remain the source of truth.
2. Platform-specific behavior belongs in app-shell adapters, not in domain modules.
3. Browser URL is treated as an input/output of route state on web and must resolve through route guards.
4. Native and web clients must both rely on the same auth/tenant guard semantics.
5. New features with platform-only capabilities (camera, biometrics, push) require explicit capability guards before integration.

## Constraints
- UI primitives may be shared via React Native, but interaction parity (touch vs pointer/keyboard) must be validated per platform.
- Public/protected route behavior must remain deterministic for deep links, refresh, and browser back/forward on web.
- Tenant isolation is enforced server-side via Firestore rules; client checks are defense-in-depth only.
- Language fallback is English; tenant-level defaults with per-user tenant overrides must resolve deterministically.

## Current State
- `auth`, `tenants`, and `locations` domains contain initial model/repository implementations.
- `staff`, `services`, and `bookings` currently provide placeholder `index.ts` entry points for phased implementation.
- `app/navigation` now includes route guard contracts (`none`, `authenticated`) with a baseline access helper.
- `App.tsx` is wired to a navigation shell that derives accessible routes from auth provider state (`userId`).
- `auth` domain now includes onboarding draft-save/resume/discard/list repository methods with tenant-safe Firestore contracts.
- `auth` domain now includes onboarding draft contracts and service layer with step validation and schema-versioned migration behavior.
- Current onboarding draft schema version is `v2`, with explicit `v1 -> v2` step payload migration transforms for `business-profile` and `profile`.
- `app/navigation` shell supports path-based route resolution and now includes web pathname synchronization (`location.pathname` + `history` + `popstate`).
- `app/providers` now includes multilingual runtime foundation (`en`, `hr`, `es`) with tenant-default language resolution and per-tenant user override persistence.
