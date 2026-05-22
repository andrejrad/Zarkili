# 07 — Roadmap & Next Steps

**Purpose:** prioritized work plan from handover forward, with concrete entry points so a new developer can start immediately.

State at handover: 3,667 / 3,667 tests passing · 182 suites · 0 TS errors · 0 P0/P1 bugs · 0 release blockers · W50 audit closed.

---

## 1. Next workstream (recommended starting point)

### 🎯 Explore Tab v2 build

The spec is complete; the code is not yet started. This is the largest **product** delta on the table right now.

- **Spec:** [zarkili_explore_tab_spec_v2.md](../new-platform/zarkili_explore_tab_spec_v2.md)
- **Implementation plan:** [zarkili_explore_implementation_plan.md](../new-platform/zarkili_explore_implementation_plan.md)
- **Map fixes:** [zarkili_explore_map_fixes_v3.md](../new-platform/zarkili_explore_map_fixes_v3.md)

**Code entry points:**

- `src/app/navigation/HandoffScreens.tsx` — `ExploreRouteScreen` (current Explore v1 route handler)
- `src/domains/discovery/` — discovery ports (canonical) — note legacy `src/domains/discover/` exists; see [02_ARCHITECTURE.md §10](02_ARCHITECTURE.md)
- `src/app/explore/` — Explore-area runtime composition
- A new `ServiceTypeCard` component is needed (current cards are salon-level; v2 is service-level — one bookable service per card)

**Walk order — §10 of the spec (Critical → Medium):**

| Pri | Item | Rough effort |
|-----|------|--------------|
| 🔴 Crit | Remove salon-level subtitle ("Salon · 1.2km") from cards; cards represent services | S |
| 🔴 Crit | Render `priceFrom` on each card (service-level minimum, not salon range) | S |
| 🔴 Crit | Geo-detect currency on first load + cache (replace Stripe USD literal in display layer) | M |
| ✅ Done | Remove notification bell from Explore screen header (closed pre-W51 — bell replaced with Map icon) | XS |
| 🟠 High | Make "near [city]" tappable → opens city/region picker | S |
| 🟠 High | Show client photos before stock photos when both exist | S |
| 🟠 High | Surface service duration on the card | XS |
| 🟠 High | Service-level rating (not salon rating) on the card | M |
| 🟡 Med | Save / bookmark icon on each card | S |
| 🟡 Med | Member badge with loyalty points preview | M |
| 🟡 Med | Branded photo fallback when no photos exist | S |

**Open product decisions blocking some items:** see [05_SPECS_AND_SCOPE.md §5](05_SPECS_AND_SCOPE.md) (member badge tap, distance defaults, popularity weighting, variantLabel inference, min-review thresholds).

**Recommended sequencing:** ship Critical cluster as one PR (visual + price), then High in slices.

---

## 2. Open debt (work in parallel)

Full register: [DEBT_REGISTER.md](../new-platform/DEBT_REGISTER.md). Snapshot in [04_DEBT_BUGS_GAPS.md](04_DEBT_BUGS_GAPS.md).

### 2.1 High severity (1 item)

- **NEW-DEBT-B B3** — migrate top-level `locations/` to the brand-hierarchy canonical path `brands/{brandId}/locations/{locationId}`. Most code already uses the hierarchy; B3 is the residual sweep + rules cleanup.
  - **Entry points:** any callsite still reading `locations/{id}` top-level; grep `collection(.*['"\`]locations['"\`])`.
  - **Approach:** write a dual-read adapter, migrate writes, retire legacy path.

### 2.2 Medium severity (5 items)

| ID | Title | Notes |
|----|-------|-------|
| NEW-DEBT-E | Apple/Google Pay wallet handler | Spec section in [zarkili-stripe-payments.md](../new-platform/zarkili-stripe-payments.md). Currently gated off |
| W19-DEBT-4 | Retention metrics scheduled job | Spec: [AI_RETENTION_INSIGHTS.md](../new-platform/AI_RETENTION_INSIGHTS.md) |
| W20-DEBT-4 | Cold-start popularity score backfill | Discovery scaffold |
| W37-DEBT-4 | iOS device QA pass | Required before App Store submission |
| W48-DEBT-1 | AI counters fully wired (currently stub) | Hooks exist; producers TBD |

### 2.3 Low (7 items)

GAP-2, GAP-5, W19-DEBT-5, W20-DEBT-2/3, W47-DEBT-1/2/3, W48-DEBT-2, KI-003. All have explicit "not urgent" annotation. Pick up opportunistically.

---

## 3. Release Candidate (RC) phase — pre-pilot

Per [PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_50_TO_54.md](../PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_50_TO_54.md):

- W50 ✅ booking flow audit closed
- W51–W54 expected workstreams:
  - QA sprint per [WEEK49_5_QA_SPRINT_PLAN.md](../new-platform/WEEK49_5_QA_SPRINT_PLAN.md)
  - iOS device QA (W37-DEBT-4)
  - Stripe live-mode dress rehearsal
  - 28-item [PILOT_GO_LIVE.md](../new-platform/PILOT_GO_LIVE.md) walk-through
  - Final compliance review per [SECURITY_COMPLIANCE_REVIEW_PLAN.md](../new-platform/SECURITY_COMPLIANCE_REVIEW_PLAN.md)

---

## 4. Post-launch (monitoring + Phase 4)

### 4.1 14-day monitoring

Per [HEALTH_CHECKS.md](../new-platform/runbooks/HEALTH_CHECKS.md):

- Crash-free rate
- Cloud Functions error rate (especially `processBookingPayment`, `processBookingRefund`)
- Stripe webhook ingestion latency
- Firestore p95 read/write latency
- Auth signup funnel
- Rules denials anomaly check

### 4.2 Phase 4 — AI Support System (W55–W57)

Plan: [PHASE4_AI_SUPPORT_SYSTEM_PLAN_WEEKS_55_TO_57.md](../PHASE4_AI_SUPPORT_SYSTEM_PLAN_WEEKS_55_TO_57.md). Architecture: [AI_SUPPORT_SYSTEM_ARCHITECTURE.md](../AI_SUPPORT_SYSTEM_ARCHITECTURE.md).

### 4.3 Deferred analytics work

- W47-DEBT-1/2/3 — analytics pipeline polish
- W19-DEBT-4 — retention metrics scheduled job
- Marketing analytics dashboards per [MARKETING_ANALYTICS.md](../new-platform/MARKETING_ANALYTICS.md)

---

## 5. Future / out-of-scope-for-now

These are deliberately deferred and **should not be picked up without a product decision**:

- Multi-service cart booking (placeholder `MultiServiceBookingScreen.tsx`)
- Voice search / AR try-on / service comparison / group booking
- Brand-level cross-location browsing
- Drag-to-reschedule in admin calendar (W43-DEBT-2 descoped)

---

## 6. First two weeks for a new engineer

| Day | Action |
|-----|--------|
| 1 | Read [00_README.md](00_README.md), [01_CURRENT_STATUS.md](01_CURRENT_STATUS.md), [02_ARCHITECTURE.md](02_ARCHITECTURE.md). Clone + `npm install` + `npm run check`. |
| 2 | Read [03_BACKEND_FIREBASE.md](03_BACKEND_FIREBASE.md). Start emulators + run `npm run test:rules`. Seed dev data. |
| 3 | Read [04_DEBT_BUGS_GAPS.md](04_DEBT_BUGS_GAPS.md) + [05_SPECS_AND_SCOPE.md](05_SPECS_AND_SCOPE.md). Click through the app on web + native. |
| 4 | Read [06_DEV_GUIDE.md](06_DEV_GUIDE.md). Walk a feature end-to-end (e.g. booking flow) to feel the DI pattern. |
| 5 | Read this file. Pick **one Critical item** from §1 Explore Tab v2 list. Write a failing test, ship a PR. |
| Week 2 | Continue Critical/High Explore v2 cluster. Surface any open-decision blockers to product. |

By end of week 2, a new engineer should have one PR merged and have touched every layer (`shared` / `domains` / `app` / `functions` / `firestore.rules` / tests).

---

## 7. Health of the codebase — keep it that way

| Metric | Current | Target |
|--------|---------|--------|
| Tests passing | 3,667 / 3,667 | 100% |
| Test suites | 182 / 182 | 100% |
| TypeScript errors | 0 | 0 |
| P0/P1 bugs | 0 | 0 |
| Release blockers | 0 | 0 |
| ESLint errors | 0 | 0 |

The bar is **green or you don't merge**. `npm run check` before every PR.
