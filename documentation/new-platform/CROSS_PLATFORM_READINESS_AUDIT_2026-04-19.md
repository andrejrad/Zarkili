# Cross-Platform Readiness Audit (iOS + Android + Web)

Date: 2026-04-19  
Scope: Runtime architecture, app shell/navigation, domain layering, and delivery readiness for one codebase targeting native and web.

## Executive Summary
- Current state is mobile-first with solid domain layering and route contracts.
- Core architecture is portable enough for iOS, Android, and web at the data/contract level.
- Web runtime behavior is not yet fully first-class; URL/state sync and browser navigation behavior required hardening.

## What Is Already Cross-Platform Friendly
1. Domain and repository boundaries are UI-agnostic and reusable across platforms.
2. Provider composition keeps auth/tenant context separated from screen implementation details.
3. Route contracts include path-based resolution and guard semantics.
4. Firestore rules and tenant boundary constraints are server-side, independent of client platform.

## Findings (Ordered by Severity)

### High
1. Browser URL and shell route state were not intentionally synchronized.
- Risk: deep links, refresh behavior, and browser back/forward could diverge from route state.
- Status: addressed by shell refactor in this pass.

### Medium
2. No explicit platform capability matrix documented (native-only vs web-supported features).
- Risk: accidental feature implementation that works on one platform only.
- Status: documented architecture rules in this pass.

3. Navigation documentation described guard behavior but did not define web runtime URL ownership.
- Risk: inconsistent behavior as web routes expand.
- Status: documented web URL contract in this pass.

### Medium
4. UI shell remains visually mobile-centric.
- Risk: acceptable functionally, but web ergonomics (layout density, pointer/keyboard polish) are still limited.
- Status: partially improved via shell layout constraints; additional UX pass remains.

### Low
5. No explicit platform-specific testing matrix yet (native smoke + web smoke).
- Risk: regressions can ship on one target unnoticed.
- Status: pending; add targeted platform checks in CI later.

## Gap-to-Action Plan
1. Keep route contracts as source of truth and make shell own URL sync on web.
2. Maintain business logic in domains/services; prevent UI components from coupling to platform-specific data access.
3. Define capability flags for native-only integrations before adding camera/location/push-heavy features.
4. Add web-specific smoke tests for URL routing, browser history navigation, and protected-route redirect behavior.
5. Add responsive layout tokens and pointer/keyboard interaction checks in Week 2.4+ UI work.

## Immediate Changes Applied
1. App shell now resolves initial route from browser pathname on web.
2. App shell listens to browser popstate and resolves authorized route fallback.
3. App shell updates browser history path when route changes in shell state.
4. Architecture and navigation docs now include explicit web runtime constraints.

## Residual Risks
1. Full web UX polish is still pending (focus outlines, keyboard traversal depth, wider-screen composition).
2. SEO/public-route metadata strategy is not defined yet.
3. Platform test matrix is not yet formalized in CI.

## Recommended Next Steps
1. Add web routing smoke tests for path resolve, redirect, and popstate behavior.
2. Introduce a cross-platform capability matrix document (camera, push, notifications, payments, deep links).
3. Start Week 2.4 UI with responsive tokens and platform interaction acceptance checks.
