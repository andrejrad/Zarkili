# Cross-Platform Capability Matrix (Web + iOS + Android)

Date: 2026-04-19
Owner: Platform architecture
Status: Active baseline (update when new capabilities are introduced)

## Purpose
This matrix defines which capabilities are supported on web and native, plus required fallback behavior and acceptance checks.

## Capability Matrix

| Capability | Web | iOS | Android | Current Status | Required Guard/Fallback | Minimum Acceptance Check |
| --- | --- | --- | --- | --- | --- | --- |
| Route guards and protected routes | Yes | Yes | Yes | Implemented | Unauthorized paths must resolve to safe preferred route | Web smoke (`AppNavigatorShell.webRouting`) + native shell smoke |
| Browser history and pathname sync | Yes | N/A | N/A | Implemented | Use `resolveRouteFromPath` and safe redirects on unauthorized/unknown paths | Web smoke popstate + deep-link fallback test |
| Auth session and tenant context | Yes | Yes | Yes | Implemented | Clear tenant context on auth user change/sign-out | Provider tests for auth/tenant reset |
| Onboarding draft save/resume | Yes | Yes | Yes | Implemented | Missing tenant context must block onboarding and fall back safely | App shell onboarding tests |
| Localization (tenant default + user override) | Yes | Yes | Yes | Baseline implemented | English fallback required, per-tenant user override must not leak across tenants | Provider tests for fallback/default/override |
| Camera/media capture | Limited | Yes | Yes | Not implemented | If unsupported, show disabled state with clear reason | Platform-guard unit test before rollout |
| Push notifications | Limited | Yes | Yes | Not implemented | Graceful no-op on unsupported platform | Capability guard + no-crash smoke check |
| Biometrics | No | Yes | Yes | Not implemented | Fallback to password/OTP flow | Feature-level guard test |
| Deep links / universal links | Partial | Yes | Yes | Partial | Unknown or unauthorized deep links must redirect safely | Route resolver tests per path |
| Payments checkout | Partial | Yes | Yes | Not implemented | Platform-specific provider adapter with shared domain contract | Contract tests + per-platform smoke test |
| File upload/storage | Yes | Yes | Yes | Baseline only | Validate size/type client-side and server-side rules | Repository/rules tests |

## Required implementation rules
1. Domain and repository code remains platform-neutral.
2. Platform-specific behavior is isolated behind app-shell or adapter layers.
3. Any `native-only` capability must provide explicit web fallback behavior.
4. No feature is considered done without platform support declaration and tests.

## PR checklist (required)
1. Capability classification added: `cross-platform` or `platform-limited`.
2. Fallback behavior documented for unsupported platforms.
3. Cross-platform smoke checks executed when touching navigation/auth/guards:
   - `npm run test:smoke:web`
   - `npm run test:smoke:native`
4. Related docs updated when matrix status changes.

## Immediate follow-up targets
1. Add capability guards before implementing camera/push/biometric features.
2. Extend smoke coverage for keyboard/focus behavior on web.
3. Add CI branch protection rule requiring smoke checks to pass.
