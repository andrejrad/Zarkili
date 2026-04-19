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
