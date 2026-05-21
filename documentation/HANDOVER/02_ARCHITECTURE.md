# 02 — Project Architecture

**Scope:** the **frontend** (Expo / React Native / web) architecture. Backend (Firebase) is documented in [03_BACKEND_FIREBASE.md](03_BACKEND_FIREBASE.md).

Authoritative source for cross-platform constraints:
[documentation/new-platform/ARCHITECTURE_OVERVIEW.md](../new-platform/ARCHITECTURE_OVERVIEW.md).

---

## 1. Tech stack

| Layer | Tech | Pinned versions (`package.json`) |
|-------|------|----------------------------------|
| Runtime | Expo SDK 54 + React 19.1 + React Native 0.81 | `expo ^54.0.0`, `react 19.1.0`, `react-native 0.81.5` |
| Web target | `react-native-web ^0.21` + Metro bundler | — |
| Native modules | `react-native-screens`, `react-native-safe-area-context`, `react-native-maps`, `react-native-svg` | as in `package.json` |
| Auth providers | Firebase Auth + `expo-apple-authentication` + `expo-auth-session` (Google), anonymous, guest | — |
| Payments | `@stripe/stripe-react-native` (native), `@stripe/stripe-js` + `@stripe/react-stripe-js` (web) | — |
| Backend | Firebase 11.2 SDK (`firebase`) + Cloud Functions v2 (Node 20) | — |
| Type system | TypeScript 5.9 (strict) | — |
| Test | Jest 29 + `jest-expo` + `@testing-library/react-native` | — |
| Lint | ESLint 9 flat config (`eslint.config.mjs`) + Prettier | — |
| i18n | Bespoke runtime — `en`, `hr`, `es` with tenant default + per-user-per-tenant override | — |

---

## 2. Top-level layout

```
.
├── App.tsx                       # Root component — error boundary, fonts, providers, shell
├── app.config.ts                 # Expo manifest (build-time env via app.config.ts)
├── eas.json                      # EAS build profiles (dev/staging/production)
├── firebase.json                 # Firebase project config (functions, rules, hosting, emulators)
├── firestore.rules               # Firestore security rules (single file, ~950 lines)
├── firestore.indexes.json        # Firestore composite + collection-group indexes
├── storage.rules                 # Firebase Storage security rules
├── metro.config.js               # Metro bundler config (web fixups)
├── babel.config.js               # Babel preset for Expo + jest-expo
├── jest.config.js                # Jest config — primary unit/component suite
├── jest.rules.config.js          # Jest config — Firestore emulator rules tests
├── jest.setup.ts                 # Global test setup (mocks, polyfills)
├── tsconfig.json                 # TypeScript strict config
├── eslint.config.mjs             # ESLint flat config
├── public-static/                # Hosting assets (privacy.html, support.html, favicon)
├── functions/                    # Cloud Functions (separate npm package)
├── __tests__/                    # Top-level cross-module / wXX rollup tests
├── design-handoff/               # Figma → dev export bundles (assets, tokens, specs)
├── documentation/                # All docs (this pack lives under HANDOVER/)
├── scripts/                      # Build / seed / migration scripts (Node ESM)
└── src/                          # Application source
    ├── app/                      # Application layer (UI, navigation, providers, runtime wiring)
    ├── domains/                  # Business domain modules (models, repos, services)
    └── shared/                   # Cross-cutting utilities, UI primitives, theming, config
```

---

## 3. Architectural rules

From [ARCHITECTURE_OVERVIEW.md](../new-platform/ARCHITECTURE_OVERVIEW.md):

1. **Route contracts, provider state, and domain repositories are platform-neutral.**
2. **Platform-specific behavior** (camera, biometrics, push, geolocation, native deeplinks) lives in **`src/app/*` adapters**, never in `src/domains/*`.
3. **Browser URL is treated as input/output of route state** on web — must round-trip through route guards.
4. **Native and web rely on identical guard semantics** — `none` / `authenticated` / `platform-admin` + tenant role checks.
5. **Tenant isolation is server-side** (`firestore.rules`); client checks are defense-in-depth only.
6. **Language fallback is English** — tenant defaults + per-tenant-user overrides resolve deterministically.

---

## 4. The three layers (`src/`)

### 4.1 `src/shared/` — cross-cutting utilities

| Subpath | Purpose |
|---------|---------|
| `shared/ai/` | `aiBudgetGuard.ts` + 4-state cap enforcement (Healthy/Warning/Protection/Exhausted) |
| `shared/config/` | Firebase init, env (`env.ts`), build-time config |
| `shared/ui/` | Cross-platform primitives — buttons, chips, modals, charts, `CalendarGrid`, `TimeSlotChip`, `SegmentedControl`, `money.ts` formatter |
| `shared/theme/` | Design tokens (colour, spacing, typography) — see also `design-handoff/tokens/` |
| `shared/utils/` | Pure utility functions; no React, no Firebase imports |

**Rule:** nothing under `shared/` may import from `domains/` or `app/`. Anything under `shared/` is safe to use from any layer.

### 4.2 `src/domains/` — business logic

Each domain follows the same template:

```
src/domains/<domain>/
├── model.ts            # TypeScript types + invariants
├── repository.ts       # Firestore CRUD adapters (no React)
├── service.ts          # Pure business logic operating on repos via DI port
├── index.ts            # Public exports
└── __tests__/
```

Ports are interfaces; production adapters are wired only at `src/app/<area>/runtime.ts` boundary. This pattern keeps domain tests Firestore-free (in-memory fakes) while real Firestore is only touched in adapter tests.

Current domain modules:

| Domain | Highlights |
|--------|-----------|
| `auth/` | Email/password, social, anonymous, onboarding draft repository (v2 schema with v1→v2 migration) |
| `tenants/` | Tenant + tenantUsers + RBAC (5 roles: `tenant_owner`/`tenant_admin`/`location_manager`/`technician`/`client`) |
| `locations/` | Multi-location model, operating hours, timezone, geohash via Cloud Function |
| `staff/` | Staff profiles, schedules, hours |
| `services/` | Service catalogue — **canonical path** is `brands/{tid}/locations/{lid}/service_types/{sid}` (post NEW-DEBT-B B2). Path helpers in `services/paths.ts`. |
| `bookings/` | Slot engine + state machine (`confirmed → completed / cancelled / no_show`), atomic create via `bookingSlotTokens` mutex |
| `discovery/` | Marketplace feed, search, salon profile aggregator, geo fan-out via `geohash` collection-group queries |
| `marketplace/` | Posts, sponsored listings, anti-theft compliance signals |
| `loyalty/` | Brand-level points (`user_brand_loyalty`), tiers, tx with idempotency keys |
| `campaigns/` | Lifecycle (draft → scheduled → sent → completed), send-logs, metrics, `markSendLogConverted` |
| `activities/` | Time-boxed challenges (`visit_streak`, `spend_threshold`) |
| `segments/` | Customer segmentation for campaigns |
| `messages/` + `messaging/` | In-app threads + unread aggregation |
| `notifications/` | Notification events, channel routing, per-user prefs |
| `payments/` | Stripe payment intents, refunds, customer profile per-tenant, payment-method management |
| `connect/` | Stripe Connect onboarding + payouts |
| `billing/` | Subscription, invoice history, taxation lines |
| `tax/` | EU VAT validation, jurisdiction breakdown for receipts/invoices |
| `trial/` | Free-trial state machine + hourly expiry tick |
| `gating/` | Plan gating, suspension, gate denials log |
| `ai/` | AI feature contracts (Scheduling/Retention/NoShowRisk/MarketplacePersonalization), budget admin |
| `analytics/` | Metrics (retention, rebooking, at-risk), AI contracts, campaign metrics, repository with 2-year lookback cap |
| `reviews/` | Submission, moderation, aggregates |
| `waitlist/` | Per-booking waitlist with notification hooks |
| `referrals/` | Referral tracking |
| `templates/` | Notification template editor model |
| `onboarding/` | Client + salon multi-step onboarding orchestrators with Firestore persistence port |

### 4.3 `src/app/` — application layer

This is where domains are composed into screens and the navigator. Each sub-area follows the same template:

```
src/app/<area>/
├── runtime.ts           # The single place where domain ports get real Firestore adapters
├── <Area>Screen.tsx     # Screens (presentational + small handlers)
├── <area>Service.ts     # Higher-level orchestration if needed
└── __tests__/
```

| Sub-area | Notes |
|----------|-------|
| `app/providers/` | `AppProviders` composes `AuthProvider`, `TenantProvider`, `I18nProvider`, `FeatureFlagProvider`, `AiBudgetProvider`, `ToastProvider` |
| `app/navigation/` | **`AppNavigatorShell.tsx`** — the central router + route render dispatcher (see §5). `routes.ts` enumerates every route with guard + group |
| `app/auth/` | Sign-in / sign-up / reset / social provider screens; `runtime.ts` builds `appAuthRepository`, `appSocialAuthService` |
| `app/onboarding/` | Salon + client wizards, step screens, draft persistence |
| `app/admin/` | All Phase 3 tenant-admin **and** platform-admin screens + service factories |
| `app/booking/` | Booking step screens (Service / Staff / DateTime / Review / Policies / Payment / Confirmation), CalendarGrid, TimeSlotChip |
| `app/bookings/` | Receipts, refunds, booking history (note plural — distinct from `booking/`) |
| `app/discovery/` | `DiscoverFeedScreen`, `ServiceDetailScreen`, `SalonProfileScreen`, `StaffMemberDetailScreen`, `ExploreSearchResultsScreen` (v1 Explore lives in `app/navigation/HandoffScreens.tsx#ExploreRouteScreen`) |
| `app/discover/` | **Legacy** screens still imported for `ExploreServiceDetail` route — NEW-DEBT-G clarified these are not duplicates; consolidation is deferred to the Explore v2 rewrite |
| `app/loyalty/` | Consumer + admin loyalty screens, `consumerLoyaltyRuntime.ts` |
| `app/marketplace/` | Marketplace consumer screens + admin tools |
| `app/messaging/` | Consumer + admin messaging surfaces, `consumerMessagingRuntime.ts` |
| `app/notifications/` | Notification feed + prefs, `consumerNotificationRuntime.ts` |
| `app/payments/` | Stripe surfaces, `runtime.ts` for `appPaymentsRepository` |
| `app/analytics/` | Reporting + campaign analytics screens |
| `app/ai/` | AI consumer-edge screens (suggestions, smart scheduling) |
| `app/profile/`, `app/settings/`, `app/support/`, `app/dashboard/`, `app/staff/`, `app/platform/`, `app/activities/`, `app/legal/`, `app/reviews/`, `app/waitlist/` | Their respective surfaces |
| `app/migration/` | `zaraMigration.ts` — idempotent 5-step pilot bootstrap |

---

## 5. Navigation architecture

### 5.1 The Shell

[src/app/navigation/AppNavigatorShell.tsx](../../src/app/navigation/AppNavigatorShell.tsx) is a **single React function component** (~12 900 lines). It:

1. Holds all global navigation state (`activeRoute`, deep-link parser, web URL sync).
2. Holds **all** route-level state (booking flow, onboarding wizard, admin screen states, debug meta, batch-C tenant batch, etc.).
3. Dispatches `useEffect` activators per route (data-loaders gated on `activeRoute.name === "X"`).
4. Contains one `if (activeRoute.name === "X") return <XScreen .../>` block per route.

**Acknowledged debt:** the file is large and hard to navigate. Splitting is intentionally deferred — every attempt at extraction loses state-locality and re-introduces effect ordering bugs. The W50 booking flow audit deliberately consolidated rather than split it. See [04_DEBT_BUGS_GAPS.md §2](04_DEBT_BUGS_GAPS.md) for the trade-off rationale.

### 5.2 Routes

[src/app/navigation/routes.ts](../../src/app/navigation/routes.ts) is the **single source of truth** for routes. Each entry declares:

- `name` — string ID consumed by the shell's `activeRoute.name` switch.
- `path` — the canonical web URL pattern (parameters via `:` syntax).
- `guard` — `"none"` / `"authenticated"` / `"platform-admin"`.
- `group` — UX bucket (`consumer`, `salon_admin`, `platform_admin`, …).
- Public consumer flows (Home, Explore, ServiceDetail, BookingService etc.) use `guard: "none"` — anonymous users browse fully.

### 5.3 Guard semantics

| Guard | Rule |
|-------|------|
| `none` | Anyone (including unauthenticated) may enter; per-action prompts handle sign-up |
| `authenticated` | Must be signed in (any user) — gated via `AuthProvider.userId` |
| `platform-admin` | Must have `request.auth.token.role == "platform_admin"` — enforced server-side in rules + service factories via `assertPlatformAdmin()` |

Tenant role checks (`tenant_owner` / `tenant_admin` / `location_manager` / `technician` / `client`) happen **server-side in Firestore rules** and at the **service-factory boundary** (`actorRole` parameter on every analytics + admin method). The navigator surfaces a "RoleDenied" experience client-side; the security boundary is in rules.

### 5.4 Deep links + web URL

The shell synchronises `activeRoute` with `location.pathname` + `history` + `popstate` on web. Each route's `path` template is parsed back into route params on hydration so:

- Refresh keeps the user on the same route.
- Browser back/forward work.
- Deep links from outside (push notifications, marketing emails, sharing) round-trip through the same guard layer.

### 5.5 Tenant context

`TenantProvider` ([src/app/providers/TenantProvider.tsx](../../src/app/providers/TenantProvider.tsx)) exposes `{ tenantId, setTenantId, tenantUsers, currentTenantUser, currentRole }`. Membership lookups are driven by `tenantUsers/{tenantId_userId}` docs. Multi-tenant accounts (one user, many tenants) are supported via `userTenantAccess/{userId_tenantId}` records (W37+).

**Known timing pitfall** documented in NEW-DEBT-I closure: tenant context commits can land in a separate React render batch from local navigation state. The pattern in `AppNavigatorShell.tsx#selectSalonContext` uses a `salonContextPendingNav` deferred-navigation state to guarantee data loaders read the committed `tenantId`.

---

## 6. Runtime composition (where Firestore is plugged in)

Every domain takes adapters via **dependency injection**. The wiring lives in a small number of files at the boundary:

| Runtime file | Wires |
|--------------|-------|
| [App.tsx](../../App.tsx) | Top-level — `AppProviders`, `AppNavigatorShell` props |
| [src/app/auth/runtime.ts](../../src/app/auth/runtime.ts) | `appAuthRepository`, `appSocialAuthService` |
| [src/app/admin/runtime.ts](../../src/app/admin/runtime.ts) | All tenant-admin services (`tenantLocationAdminService`, `staffAdminService`, `serviceAdminService`, `ownerKpiService`) |
| [src/app/settings/runtime.ts](../../src/app/settings/runtime.ts) | `appAiBudgetAdminService`, `resolvePlatformAdminFromAuthClaims` |
| [src/app/bookings/runtime.ts](../../src/app/bookings/runtime.ts) | `appClientBookingFlow` |
| [src/app/payments/runtime.ts](../../src/app/payments/runtime.ts) | `appPaymentsRepository` |
| [src/app/navigation/runtime.ts](../../src/app/navigation/runtime.ts) | `appDiscoveryService` |
| [src/app/loyalty/consumerLoyaltyRuntime.ts](../../src/app/loyalty/consumerLoyaltyRuntime.ts) | `consumerLoyaltyService` |
| [src/app/messaging/consumerMessagingRuntime.ts](../../src/app/messaging/consumerMessagingRuntime.ts) | `consumerMessagingService` |
| [src/app/notifications/consumerNotificationRuntime.ts](../../src/app/notifications/consumerNotificationRuntime.ts) | `consumerNotificationService` |
| [src/app/onboarding/salonOnboardingRuntime.ts](../../src/app/onboarding/salonOnboardingRuntime.ts) | `appWizardService`, `appWaitlistRepository` |

Tests substitute fakes at the same boundary. This is how the suite stays Firestore-free except for the dedicated rules tests.

---

## 7. Cross-platform notes

| Platform | Status |
|----------|--------|
| iOS (Expo Go / EAS dev-client) | First-class — Stripe native sheet, push, biometrics, deep links |
| Android (Expo Go / EAS dev-client) | First-class — Stripe native sheet, push, biometrics, deep links |
| Web (Metro `react-native-web`) | First-class for consumer + admin surfaces; uses `@stripe/react-stripe-js`. Native modules are skipped when `Constants.expoConfig.extra.stripePublishableKey` is empty (Expo Go, web) so the app boots without Stripe native |

`CROSS_PLATFORM_CAPABILITY_MATRIX.md` and `CROSS_PLATFORM_READINESS_AUDIT_2026-04-19.md` (both under `documentation/new-platform/`) carry the per-feature parity matrix.

---

## 8. Things that violate the "ideal" architecture (declared exceptions)

| Violation | Why it stands | Tracking |
|-----------|---------------|----------|
| `AppNavigatorShell.tsx` ~12 900 lines | Splitting loses state co-location and re-introduces effect ordering bugs; W50 deliberately consolidated. Stays until a redesign with a real navigator library | Architectural debt — not in DEBT_REGISTER |
| Two `ServiceDetailScreen` files (`discover/` and `discovery/`) | Different navigation entry points, not duplicates | NEW-DEBT-G — closed (re-audit) |
| `services/{id}` legacy Firestore path read-only retained | Legacy migration window for old clients during NEW-DEBT-B rollout | NEW-DEBT-B (still open at B3) |
| Top-level `locations/{id}` collection still used alongside `brands/{tid}/locations/{lid}` | B3 of NEW-DEBT-B not yet started — cross-cuts every booking | NEW-DEBT-B B3 — open |
| `addOnCatalog` Firestore path uses `tenants/{tid}/services/{sid}/addons` divergent from v3 hierarchy | NEW-DEBT-B B2a already migrated this to hierarchical path | Closed |
