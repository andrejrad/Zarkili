# Onboarding Route Scaffold (Week 2.6)

## Purpose
This scaffold adds stable route groups and onboarding state contracts so future onboarding UI can be implemented without route churn.

## Route groups
All onboarding routes are authenticated-only.

### SalonOnboarding
Base path: `/onboarding/salon`

Steps scaffolded:
- `account`
- `business-profile`
- `payment-setup`
- `services`
- `staff`
- `policies`
- `availability`
- `marketplace`
- `verification`

### ClientOnboarding
Base path: `/onboarding/client`

Steps scaffolded:
- `account-guest`
- `phone-verify`
- `profile`
- `payment-method`
- `preferences`
- `notifications`
- `loyalty`

## State machine contracts
Implemented in `src/app/navigation/onboarding/contracts.ts`.

Core contract types:
- `OnboardingFlow`
- `OnboardingStep`
- `OnboardingState`
- `OnboardingProgressPersistence`

Key functions:
- `createInitialOnboardingState(tenantId, userId, flow)`
- `isValidOnboardingStep(flow, step)`
- `getNextOnboardingStep(flow, currentStep)`
- `moveOnboardingToStep(state, step)`
- `completeCurrentOnboardingStep(state)`

## Progress persistence interface
`OnboardingProgressPersistence` defines navigation-level persistence contract only:
- `saveDraft(input)`
- `resumeDraft(input)`

Adapter implementation is now available in `src/app/navigation/onboarding/persistence.ts` and maps navigation contracts to `OnboardingDraftService`.

Concrete Firebase wiring is available via `createFirestoreOnboardingProgressPersistence()` in `src/app/navigation/onboarding/createPersistence.ts`.

Current mapping note:
- client step `account-guest` is normalized to backend step `account` for draft persistence and mapped back on resume.

Tenant guard note:
- onboarding start requires explicit tenant context (no implicit fallback tenant id).
- tenant context is now resolved from active auth memberships (`listUserTenantMemberships`) and selected from those memberships when multiple tenants are available.

## Placeholder screens and navigation
`AppNavigatorShell` now includes:
- entry actions for salon/client onboarding from protected app shell
- placeholder step screen rendering based on route path
- step progression via `Next step` action
- draft resume on onboarding entry (per flow)
- draft save on each `Next step` transition
- onboarding start guard when tenant context is missing
- safe exit back to `AppShell`

## Tests
- `src/app/navigation/__tests__/routes.test.ts`
- `src/app/navigation/__tests__/onboardingContracts.test.ts`
- `src/app/navigation/__tests__/onboardingPersistence.test.ts`
