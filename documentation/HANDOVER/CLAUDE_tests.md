> **Deploy to:** `__tests__/CLAUDE.md`

---

# CLAUDE.md — `__tests__/` (root)

This folder contains **Firestore security rules tests only** (`firestore.rules.test.ts`). The setup is completely different from `src/app/__tests__/` — do not copy patterns from there.

## Key difference

| `src/app/__tests__/` | `__tests__/` (this folder) |
|---|---|
| Jest + `jest-expo` | Jest + `@firebase/rules-unit-testing` |
| In-memory fakes | **Live Firestore emulator** required |
| No emulator | Port 8080 must be running |
| `jest.config.js` | `jest.rules.config.js` |

## Running rules tests

```bash
# Emulator MUST be running first
npm run firebase:emulators

# Then in a second terminal
npm run test:rules
```

Or as a single command (starts emulator, runs tests, shuts down):

```bash
npm run test:rules
# This calls: firebase emulators:exec --only firestore "jest --config jest.rules.config.js ..."
```

## Test structure

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

// One testEnv for the whole file — clean up after each test
let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'zarkili-dev',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterEach(async () => { await testEnv.clearFirestore(); });
afterAll(async () => { await testEnv.cleanup(); });
```

## Every rules test needs both allow and deny cases

```typescript
describe('bookings — tenant member can read own booking', () => {
  it('allows tenant_admin to read', async () => {
    const db = testEnv.authenticatedContext('user1', { role: 'tenant_admin', tenantId: 'salon1' }).firestore();
    await assertSucceeds(getDoc(doc(db, 'bookings/b1')));
  });

  it('denies unauthenticated user', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, 'bookings/b1')));
  });
});
```

One `assertSucceeds` + one `assertFails` per permission boundary is the minimum. Never write only the happy path.

## When to add a rules test

Whenever you modify `firestore.rules` — add matching tests in `firestore.rules.test.ts` before the PR. The test runner will fail if the emulator is not running; that is expected in CI — the emulator must be started as a pre-step.
