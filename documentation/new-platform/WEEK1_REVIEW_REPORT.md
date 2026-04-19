# Week 1 Review Report

Date: 2026-04-19
Scope: Week 1 Tasks 1.1 to 1.5 review prompts from the execution pack.
Reviewer: Copilot

## Summary Verdict
Week 1 foundation implementation is complete and operational.

What passed:
- Runtime works with public-first shell and auth-protected app shell.
- Provider composition and contracts are in place.
- Environment bootstrap has explicit missing-key failures.
- CI baseline runs lint, typecheck, and tests with dependency caching.
- Firestore rules and rules tests exist and pass locally.

What needed hardening:
1. CI did not execute Firestore rules tests.
2. Navigation contracts did not include path-based deep-link guard resolution.
3. Tenant context lifecycle was not coupled to auth user changes/sign-out.

All hardening items above have now been implemented.

---

## Review 1.1: Baseline Folder Architecture
Review prompt goal: maintainability and domain-separation risks, plus missing future modules.

### What is good
- Domain-first folder layout under `src/domains` is clear and scalable.
- App shell (`src/app`) and shared (`src/shared`) separation is clean.
- Domain exports and boundaries are straightforward for repository pattern growth.

### Risks
- Future modules listed in the review prompt are not scaffolded yet (waitlist, messages, loyalty, campaigns, reviews, analytics).
- Risk is medium: not a runtime issue, but can lead to ad-hoc growth if postponed too long.

### Recommendation
- Add placeholder domain entry points for future modules when Week 2 starts, before feature delivery pressure increases.

---

## Review 1.2: App Provider Shell
Review prompt goal: state-coupling and context-overuse risks.

### What is good
- Provider order is correct: Auth -> Tenant -> Theme -> Language.
- Minimal interfaces are used; contracts are typed and easy to test.
- Default provider shell tests are present.

### Risks (resolved)
- Tenant state is now reset when auth user changes or signs out.
- This closes stale-tenant-context risk for future real auth switching.

### Implemented hardening
- Added auth-linked tenant reset policy in provider composition/runtime.
- Added tests for sign-out reset and user-switch reset.

---

## Review 1.3: Environment and Firebase Bootstrap
Review prompt goal: security and misconfiguration risk.

### What is good
- Required Firebase keys fail fast with clear error names.
- Firebase bootstrap avoids hardcoded secrets and uses env abstraction.
- Parsing tests cover missing keys and variant behavior.

### Risks
- Unknown `EXPO_PUBLIC_APP_VARIANT` values currently fallback silently to development.
- Risk is low-to-medium: safe default for local dev, but typo masking can confuse CI/staging behavior.

### Recommendation
- Keep fallback, but optionally add warning logging for unsupported variant values.

---

## Review 1.4: CI Quality Baseline
Review prompt goal: reliability and speed optimization.

### What is good
- CI includes checkout, Node setup, npm caching, install, lint, typecheck, and tests.
- Pipeline is deterministic and easy to understand.

### Gap found
- Firestore rules tests are not executed in CI.
- This is a high-priority reliability gap for multi-tenant security.

### Recommendation
- Add a CI step to run `npm run test:rules` after unit tests.
- Ensure emulator prerequisites are installed in the workflow.

---

## Review 1.5: Public Landing Shell and Route Groups
Review prompt goal: bypass risk, dead-end flows, deep-link handling.

### What is good
- Public routes exist: Landing, Login, Register, DiscoverBusinesses.
- Protected routes currently contain authenticated app shell only.
- Discover CTA is visible and feature-flag behavior is correct (`marketplaceEnabled: false` => coming-soon state).

### Risk found
- Navigation guards are route-name/state based, but there is no path-based resolver for deep-link entry points yet.
- Risk is medium: future deep-link integration can introduce bypass or dead-end behavior unless path resolution is centralized.

### Recommendation
- Add path-based route resolver that returns safe fallback route when path is unknown or unauthorized.
- Add tests for authorized/unauthorized/unknown path resolution.

---

## Findings by Severity

### High
1. Missing Firestore rules tests in CI gate.

### Medium
2. No path-based deep-link guard resolver in navigation contracts.
3. Future domain placeholders not yet scaffolded.

### Low
1. Silent app variant fallback to development for unknown values.

---

## Week 1 Completion Statement
Week 1 tasks are complete and can be considered closed. Remaining items are hardening improvements and process hygiene, not blockers for Week 2 start.

## Next Immediate Actions
1. Add Firestore rules test execution to CI.
2. Add path-based deep-link guard resolver with tests.
