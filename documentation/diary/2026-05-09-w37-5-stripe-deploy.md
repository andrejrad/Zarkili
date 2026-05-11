# Diary — 2026-05-09 | W37.5: Stripe Functions Deployment to Dev

## Summary

Completed the entire W37.5 debt sprint. Both high-priority gates are now closed: the `paymentsApplyLoyaltyDiscount` Cloud Function was implemented and all 17 Stripe/backend functions were successfully deployed and smoke-tested against the live `zarkili-dev-a1b1c` Firebase project.

---

## W37.5-DEBT-1 — `paymentsApplyLoyaltyDiscount` Cloud Function

**Status: closed**

### What was built
- `handleApplyLoyaltyDiscount` pure handler exported from `functions/src/payments.ts`
- `paymentsApplyLoyaltyDiscount` onCall function exported from `functions/src/index.ts`
- Logic: (1) auth guard — caller uid must equal input userId; (2) reads `tenants/{tenantId}/loyaltyConfig/config` — throws if missing or disabled; (3) idempotency check via `tenants/{tenantId}/loyaltyIdempotency/{key}`; (4) Firestore transaction debits balance in `loyaltyStates`, writes `loyaltyTransactions` record and idempotency marker; (5) returns `{ pointsDebited, discountMinor, loyaltyTransactionId }`
- Conversion rate: 1 point = 1 minor currency unit (1 cent); earning rate controlled separately by tenant `pointsPerCurrencyUnit`
- `functions/src/__tests__/paymentsApplyLoyaltyDiscount.test.ts` — 11 vitest tests covering: auth guard, config missing, config disabled, insufficient balance, no state doc, happy path (balance debit, transaction doc, idempotency marker), idempotency replay, exact-balance edge case

### Test results
- functions tsc: clean
- functions vitest: 198/198
- root tsc: clean
- root Jest: 2686/2686

---

## W37.5-DEBT-2 — Stripe Functions Deployment to Dev

**Status: closed**

### Pre-deploy work
- `firebase.json` was missing a `functions` section entirely (first deploy ever). Added it with `source: "functions"`, `codebase: "default"`, and `predeploy: npm --prefix functions run build`.
- Created GCP Secret Manager secrets:
  - `STRIPE_API_KEY` (v1 placeholder → v2 real `sk_test_51TVH5...`)
  - `STRIPE_WEBHOOK_SECRET` (v1 placeholder → v2 real `whsec_a5sjl3...`)
- IAM granted: `45441297139-compute@developer.gserviceaccount.com` → `roles/secretmanager.secretAccessor` on both secrets

### Deploy outcome
- First-time Gen2 deploy required enabling 7 GCP APIs: `cloudbuild`, `artifactregistry`, `run`, `eventarc`, `pubsub`, `storage`, `secretmanager`, `cloudscheduler`
- 16/17 functions succeeded on initial deploy
- `onBookingWritten` failed with Eventarc IAM propagation race (standard first-time Gen2 issue); redeployed individually 5–10 min later — succeeded
- All 17 functions live at `us-central1` in `zarkili-dev-a1b1c`

### Deployed functions
`getAiBudgetConfigAdmin`, `listAiBudgetAuditLogsAdmin`, `updateAiBudgetConfigAdmin`, `onBookingWritten`, `dailyBookingReminders`, `purgeExpiredSlotTokens`, `previewNotificationTemplate`, `stripeWebhookHandler`, `trialExpiryHourly`, `getRiskPolicyAdmin`, `updateRiskPolicyAdmin`, `stripeTaxCalculate`, `paymentsAttachMethod`, `paymentsDetachMethod`, `paymentsChargeBooking`, `paymentsApplyLoyaltyDiscount`, `health`

### Key URLs
- `stripeWebhookHandler`: `https://us-central1-zarkili-dev-a1b1c.cloudfunctions.net/stripeWebhookHandler`
- `health`: `https://us-central1-zarkili-dev-a1b1c.cloudfunctions.net/health`

### Secret rotation workflow used
Firebase CLI auto-detected stale secret versions on both `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET`, prompted for redeploy, and destroyed the old placeholder versions atomically. Both now at v2 (real keys).

### Smoke tests (PowerShell against live dev)
All three tests run using Firebase Auth REST API sign-in (user: `andrej@mobendo.com`, project `zarkili-dev-a1b1c`):

| Test | Result |
|------|--------|
| `GET /health` | ✅ `{ ok: true, message: "zarkili-functions-ready" }` |
| `paymentsAttachMethod` (pm_card_visa) | ✅ PM `pm_1TVIylBEl5mvmJMqxseFnn2v` created in Stripe; Firestore doc written at `clients/UoBgDsnPoChGhDMItsuDhRmcRd53/paymentMethods/` |
| `paymentsDetachMethod` | ✅ `{ detached: true }` |

`paymentsChargeBooking` deferred — requires a real booking doc in Firestore; tracked as future manual QA task before W38.

---

## New debt registered

**W37.5-DEBT-3** — Node.js runtime upgrade (Node 20 → Node 22). Node 20 deprecated 2026-04-30, decommission 2026-10-30. Requires changing `engines.node` in `functions/package.json` and redeploying. Target: any sprint before 2026-10-30.

---

## Notes / lessons learned

1. **`firebase.json` must have a `functions` section** before `firebase deploy --only functions` works — the CLI does not auto-create it.
2. **Eventarc IAM propagation** takes 5–10 min on first Gen2 deploy. Don't retry immediately — wait, then redeploy only the failed function.
3. **Firebase CLI secret set prompt**: when updating a secret that's already referenced by deployed functions, the CLI will offer to redeploy + destroy the stale version in one step — always say yes to avoid running two deploys.
4. **Gen2 first deploy time**: ~15–20 min for 17 functions due to Cloud Run container builds. Subsequent deploys (updates) are ~2–3 min per function.
