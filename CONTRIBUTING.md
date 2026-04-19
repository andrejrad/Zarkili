# Contributing

## Local pre-PR checklist
Run these commands before opening a pull request:

1. Install dependencies:
   - `npm ci`
2. Run full quality checks:
   - `npm run check`
3. If Firestore rules changed, run emulator rule tests:
   - `npm run test:rules`

## Branch and scope guidance
- Keep one feature/task per branch when possible.
- Keep changes modular by domain (`auth`, `tenants`, `locations`, `staff`, `services`, `bookings`).
- Avoid unrelated refactors in the same PR.

## Definition of done
- Lint, typecheck, and tests pass locally.
- Firestore rules/indexes updated when data access changed.
- Documentation updated for completed task scope.

## Cross-platform definition of done (web + native)
- Any user-facing feature must declare platform support in PR scope: `web`, `ios`, `android`, or `native-only` with reason.
- For routes/navigation/auth changes, run and pass both smoke suites:
   - `npm run test:smoke:web`
   - `npm run test:smoke:native`
- If a feature is intentionally platform-limited, add an explicit capability guard and document fallback behavior.
