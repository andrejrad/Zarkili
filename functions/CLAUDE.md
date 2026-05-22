# CLAUDE.md — functions/

Cloud Functions for Firebase v2, Node 20. All 23 functions are exported from `functions/src/index.ts`.

## Quality gate

```bash
npm --prefix functions run build   # tsc — must be 0 errors
```

Functions have their own tsconfig and package.json. Run their build separately from the root `npm run typecheck`.

Tests in `functions/src/__tests__/` and `functions/test/` use **Vitest** (not Jest). Do not mix test runners.

```bash
# Run functions tests only
cd functions && npx vitest run
```

## Local development

Port: **5001**. Start with:

```bash
npm run firebase:emulators          # from repo root — starts all emulators incl. functions
npm run functions:serve             # functions emulator only
```

**Never call production Firebase from local code.** All functions read `process.env.FIREBASE_CONFIG` at runtime — the emulator sets this automatically. If you see a real project ID during local testing, stop immediately.

## The 23 functions — quick reference

| Export | File | Trigger type |
|--------|------|-------------|
| `getAiBudgetConfigAdmin` | `aiBudgetAdmin.ts` | Callable |
| `listAiBudgetAuditLogsAdmin` | `aiBudgetAdmin.ts` | Callable |
| `updateAiBudgetConfigAdmin` | `aiBudgetAdmin.ts` | Callable |
| `onBookingWritten` | `bookingTriggers.ts` | Firestore trigger (`onDocumentWritten`) |
| `updateAvailabilitySummary` | `availabilitySummaryTrigger.ts` | Firestore trigger |
| `dailyBookingReminders` | `scheduledReminders.ts` | Scheduled (`onSchedule`) |
| `purgeExpiredSlotTokens` | `purgeSlotTokens.ts` | Scheduled |
| `previewNotificationTemplate` | `notificationTemplates.ts` | Callable |
| `stripeWebhookHandler` | `stripeWebhookHandler.ts` | HTTP (`onRequest`) — Stripe signed webhook |
| `trialExpiryHourly` | `trialExpiryScheduler.ts` | Scheduled |
| `getRiskPolicyAdmin` | `riskPolicyAdmin.ts` | Callable |
| `updateRiskPolicyAdmin` | `riskPolicyAdmin.ts` | Callable |
| `stripeTaxCalculate` | `stripeTaxCalculate.ts` | Callable |
| `paymentsAttachMethod` | `appointmentPaymentsCallable.ts` | Callable |
| `paymentsDetachMethod` | `appointmentPaymentsCallable.ts` | Callable |
| `processBookingPayment` | `payments.ts` | Callable |
| `processBookingRefund` | `receipts.ts` | Callable |
| `getStripeConnectStatus` | `stripeConnectCallable.ts` | Callable |
| `onboardStripeConnect` | `stripeConnectCallable.ts` | Callable |
| `updatePopularityIndex` | `popularityIndex.ts` | Firestore trigger |
| `reauthorizeExpiredHolds` | `reauthorizeExpiredHolds.ts` | Scheduled |
| `updateServiceDerivedFields` | `updateServiceDerivedFields.ts` | Firestore trigger |
| `check1099KThreshold` | `tax1099K.ts` | Scheduled |

## Trigger patterns

**Callable** — called from client via Firebase SDK `httpsCallable()`. Always verify `request.auth` at the top.

```typescript
export const myCallable = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  // ...
});
```

**Firestore trigger** — fires on document writes. Extract before/after from `event.data`.

```typescript
export const onMyDocWritten = onDocumentWritten('collection/{docId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  // ...
});
```

**Scheduled** — cron-like. Always implement idempotency (check a `lastRunId` or deduplicate writes).

```typescript
export const myScheduled = onSchedule('every 1 hours', async () => {
  // idempotency: check if already ran for this window
});
```

**HTTP (webhook)** — Stripe webhook. **Always verify the signature** before processing.

```typescript
export const stripeWebhookHandler = onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  // ...
});
```

## Deploy

```bash
# Deploy a single function (preferred — avoids cold-starting all 23)
firebase deploy --only functions:functionName --project zarkili-dev

# Deploy all functions
firebase deploy --only functions --project zarkili-dev

# Deploy to production
firebase deploy --only functions:functionName --project zarkili-production
```

## Adding a new function

1. Create `functions/src/{name}.ts` — export the function.
2. Re-export from `functions/src/index.ts`.
3. Document in `documentation/HANDOVER/03_BACKEND_FIREBASE.md §5`.
4. Add a Vitest test in `functions/src/__tests__/{name}.test.ts` or `functions/test/{name}.test.ts`.
5. Pattern: extract pure logic into a `run*` helper; test the helper, not the CF wrapper. See `notificationTemplates.ts` / `notificationTemplates.test.ts`.

## Test pattern (Vitest — functions only)

```typescript
// functions/src/__tests__/myFunction.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin at module level
vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => firestoreMock,
  FieldValue: { serverTimestamp: () => 'SERVER_TIMESTAMP' },
}));

// Use vi.fn() not jest.fn()
const firestoreMock = { doc: vi.fn(), /* ... */ };

beforeEach(() => { vi.clearAllMocks(); });
```

Note: functions tests use `vitest`; root `src/` tests use `jest`. **Never use `jest.fn()` in a functions test.**
