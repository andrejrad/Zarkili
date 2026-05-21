# 04 — Open Debt, Bugs & Gaps

**As of 2026-05-20.** Single source of truth: [DEBT_REGISTER.md](../new-platform/DEBT_REGISTER.md). This file is a **handover-time snapshot** of *currently open* items, grouped by audience.

> 🟢 **There are zero release-blocking open items.** Every entry below is either explicitly Post-launch / Future, or a Low-severity tracking note. The product is RC-ready.

---

## 1. Open items at a glance

| Severity | Count | Notes |
|----------|-------|-------|
| High | 1 | NEW-DEBT-B B3 — `locations/` top-level → `brands/{id}/locations/{id}` migration (cross-cuts every booking) |
| Medium | 5 | Apple/Google Pay UI gate, retention metrics job, cold-start popularity index, iOS device QA pass, AI suggestion daily counters |
| Low | 7 | GAP-2, GAP-5, W19-DEBT-4/5, W20-DEBT-2/3, W43-DEBT-2 (descoped), W47-DEBT-1/2/3, W48-DEBT-1/2 |

---

## 2. High-severity open

### NEW-DEBT-B B3 — Locations top-level → brand hierarchy

| | |
|---|---|
| **What** | The data model v3 nests locations under `brands/{brandId}/locations/{locationId}`. The codebase has migrated all **service catalogue** reads, all **Cloud Functions**, all **loyalty** writes (B1/B2a–e closed). The `locations/{locationId}` top-level collection is still in active use by the booking, discovery, and admin flows. |
| **Why it matters** | Schema convergence; eliminates the "two places to read a location from" footgun. |
| **Why it's deferred** | Cross-cuts every booking write site, the geohash trigger, and admin location editor — needs a dedicated sprint. Not blocking release. |
| **Entry points** | Migration plan would follow the same template as B2a–e: introduce a `locationDocSegments(brandId, locationId)` path helper, migrate read sites (booking, discovery), then admin write sites, then `firestore.rules`, then CF triggers. |
| **Status** | open — target: post-launch sprint |

---

## 3. Medium-severity open

### NEW-DEBT-E — Apple Pay / Google Pay hardcoded off

| | |
|---|---|
| **What** | `applePayAvailable={false}` literal in `AppNavigatorShell.tsx` BookingPayment render block. Wallet path not exercised. |
| **Why** | Enabling the UI without a real Stripe wallet handler would mislead users. |
| **Target** | Future — Stripe milestone (post-W37 work continues) |
| **Entry point** | Implement `stripeWalletHandler` callable in `functions/src/`; wire `applePayAvailable` via a `useCapability` hook driven by feature flag + Stripe Connect status. |

### W19-DEBT-4 — Retention metrics job

| | |
|---|---|
| **What** | Retention computation is done live on read. A scheduled aggregator would let the dashboard be O(1). |
| **Target** | Post-launch — telemetry-driven |
| **Entry point** | New scheduled CF; write to `tenants/{tid}/analyticsAggregates/{period}`. |

### W20-DEBT-4 — Cold-start popularity index

| | |
|---|---|
| **What** | New tenants have no `popularityScore` until the first daily run of `computePopularityIndex`. Result: blank Recommended sort on day 1. |
| **Target** | Phase 2 W25+ (still open) |
| **Entry point** | Seed `popularityScore` from `service_types.priceFrom` + `serviceReviewCount` at creation time in `serviceCatalogAdapters.ts#createServiceDraft`. |

### W37-DEBT-4 — iOS device QA pass

| | |
|---|---|
| **What** | Full iOS device acceptance pass on Stripe native sheet, Apple Sign In, push, biometrics. |
| **Why deferred** | Device required. |
| **Target** | Pre-submission to App Store. |

### W48-DEBT-1 — AI suggestion daily counters stub

| | |
|---|---|
| **What** | Daily counters on AI suggestion approval/reject are a stub. Requires Firestore aggregation strategy. |
| **Target** | Post-launch — data pipeline |

---

## 4. Low-severity open

| ID | Description | Notes |
|----|-------------|-------|
| GAP-2 | Skip path writes `user_policy_acknowledgements` with `locations/{id}.policyVersion`, but v3 nests location under `brands/{brandId}/locations/{id}`. Move with NEW-DEBT-B B3. | tracked with B3 |
| GAP-5 | StaffSelectionScreen supports `nextAvailableLabel` / `previewSlots` per-staff but Shell sets them to null (N-query cost). Plan: CF pre-aggregate or limit to top 5. | UI already supports the field |
| W19-DEBT-5 | Cohort-based attention list | Post-launch — telemetry driven |
| W20-DEBT-2 | Engagement weighting tuning | Post-launch — telemetry driven |
| W20-DEBT-3 | Booking-source A/B test infrastructure | Post-launch |
| W43-DEBT-2 | Drag-to-reschedule | **Descoped 2026-05-10** — UX research disfavoured the gesture |
| W47-DEBT-1 | Marketplace booking source tracking | Data pipeline — post-launch |
| W47-DEBT-2 | Multi-currency revenue breakdown | Data pipeline — post-launch |
| W47-DEBT-3 | BookingFunnel incomplete stages | Analytics pipeline — post-launch |
| W48-DEBT-2 | Per-post analytics pipeline | CF work — post-launch |
| KI-003 | (pre-W11) Firestore emulator rules tests for loyalty/campaigns | **Closed post-W49** but listed for traceability — emulator wiring still tagged in `package.json#test:rules` |

---

## 5. Things that are **not** bugs — declared scope decisions

These show up as "missing" to a new developer but are intentional:

| Item | Reason |
|------|--------|
| Multi-service cart in booking flow | v1 is single-service; the orphan `MultiServiceBookingScreen.tsx` is a v2 placeholder (NEW-DEBT-F — closed by clarifying header comment) |
| Two `ServiceDetailScreen.tsx` files (`app/discover/` and `app/discovery/`) | Different routes (`ExploreServiceDetail` vs `ServiceDetail`); not duplicates (NEW-DEBT-G — closed) |
| `addOnCatalog` reads from `tenants/{tid}/services/{sid}/addons` is **wrong path** comment in old code | Replaced — current code uses `brands/{tid}/locations/{lid}/service_types/{sid}/addons` (NEW-DEBT-B B2a) |
| Variant picker not in Step 1 ServiceSelection | Spec §4.1 places it on the detail screen by design (NEW-DEBT-C — closed) |
| Currency mismatch in some Stripe paths (`usd` literal) | Stripe API + AI cost-of-goods (`globalMonthlyCapUsd`) deliberately untouched in NEW-DEBT-A; everything user-visible is on `formatMoney(minor, currency)` |

---

## 6. Architectural debt (not in DEBT_REGISTER, but a developer should know)

| Item | Status |
|------|--------|
| `AppNavigatorShell.tsx` is ~12 900 lines | Acknowledged; splitting attempts re-introduced effect ordering bugs and state-locality loss. Stays until a redesign with a real navigator library. |
| All Phase 3 admin screens share a single `AppNavigatorShell` switch block | Same as above. |
| `src/app/discover/` (legacy) coexists with `src/app/discovery/` (active) | Not a duplicate — different routes — but will collapse during Explore Tab v2 build. |
| `tsc-errors.txt` and `test_output.txt` checked into repo root | Working scratch files from CI passes. Safe to gitignore; leaving for historical traceability. |

---

## 7. How to triage a new debt item

1. Identify whether it has an existing ID by searching [DEBT_REGISTER.md](../new-platform/DEBT_REGISTER.md).
2. If new, append a row to the appropriate week section with `WXX-DEBT-N` naming.
3. Update the **Open Items by Target Week** table at the top of the register.
4. If it surfaces only in tests, add a fixing acceptance test.
5. Reference the new ID from the close report that triggered the addition.

The full protocol lives in DEBT_REGISTER.md §Protocol.

---

## 8. Bugs known at handover

**None at P0 or P1 severity.** Every confirmed defect uncovered during W50 was closed within the audit (BUG-A through BUG-D, all GAP-1/3/4/6/7/8, W50-DEBT-9/10/11). The two remaining low-severity GAPs (2 and 5) are tracked above.

The full booking flow audit is documented as part of [DEBT_REGISTER.md §Week 50](../new-platform/DEBT_REGISTER.md) and was closed with `3 667 / 3 667` tests passing across `182` suites.
