# Week 17 — Close Report

**Theme:** Marketplace Launch v1
**Status:** ✅ COMPLETE — GO for Week 18 (Stripe backend pass, rolled forward)
**Source spec:** [MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md) §17 (Tasks 17.1, 17.2)

---

## 1. Scope decision (recorded at week-start)

The W16 close report had pre-committed W17 to a dedicated Stripe backend
pass bundling W13/W14/W15 debts. The W17 prompt-pack spec instead defines
W17 as **Marketplace Launch v1** — Tasks 17.1 (Feed/Search/Profile +
"Book this look" deep-link) and 17.2 (Anti-Client-Theft Enforcement +
`MARKETPLACE_GUARDRAILS.md`).

User explicitly chose the **prompt-pack scope** when the divergence was
surfaced. The five Stripe debts roll forward to **Week 18** with their
bundled rationale fully intact.

| In-scope this week                                                 | Rationale                                                  |
| ------------------------------------------------------------------ | ---------------------------------------------------------- |
| W17.1 — Marketplace discovery surface (feed / search / profile)    | Prompt-pack spec; pure-logic services first                |
| W17.1 — "Book this look" deep-link helper                          | Anchors attribution into the booking flow                  |
| W17.2 — Anti-client-theft enforcement service                      | Prompt-pack spec; encodes platform posture in code         |
| W17.2 — `documentation/new-platform/MARKETPLACE_GUARDRAILS.md`     | Required by spec                                           |

| Rolled forward to W18 (dedicated Stripe backend pass) | Rationale                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------- |
| W13-DEBT-1, W13-DEBT-4, W14-DEBT-1, W14-DEBT-2, W15-DEBT-2 | Bundled rationale unchanged; user redirected W17 to spec — Stripe pass moves to W18 |

---

## 2. What shipped

### 2.1 Marketplace discovery surface (W17.1)

`src/domains/marketplace/discoveryService.ts` (new)

- **Cursor encoding** — `encodeFeedCursor(createdAtMillis, postId)` and
  `decodeFeedCursor(cursor)` round-trip an opaque `"<millis>:<postId>"`
  string. Decoder returns `null` for malformed input (callers treat null
  as "start from the top"). Postids containing colons are preserved by
  splitting on the first separator only.
- **`getFeedPage({ candidates, cursor?, limit, tenantContext })`** —
  returns `{ items, nextCursor }` ordered `createdAt DESC, postId DESC`
  (stable tiebreak). Honors anti-client-theft inside an active booking
  funnel: when `tenantContext` is non-null, only same-tenant posts are
  visible. Anonymous browsing (`tenantContext === null`) sees everyone.
  Unpublished posts are filtered as a safety net even if the caller did
  not pre-filter.
- **`searchProfiles({ candidates, filters, tenantContext })`** — filters
  by `city`, `serviceTag`, `styleTag`, and free-text query against
  `name + tagline + bio`. All matching is case-insensitive. Visibility
  is enforced via `filterVisibleProfiles` (hidden-mode and opted-out
  tenants suppressed; the customer's own salon suppressed when
  `tenantContext` is set).
- **`assembleProfileView({ profile, posts, postLimit? })`** — composes
  a public profile view from already-fetched primitives. Posts are
  filtered to `isPublished` and to `post.tenantId === profile.tenantId`,
  sorted createdAt DESC, capped at `postLimit` (default 12).
- **`buildBookThisLookDeepLink(post)`** — returns
  `{ path: "/book", params: { salon, sourcePostId, service? } }`.
  `sourcePostId` is **always** present so attribution can be captured at
  booking time; `service` is included only when the post declared a
  `bookThisLookServiceId`.

### 2.2 Anti-client-theft enforcement (W17.2)

`src/domains/marketplace/guardrailsService.ts` (new)

- **`assertNoCompetitorRecommendations(context, recs)`** — throws
  `MarketplaceError("COMPETITOR_RECOMMENDATION_BLOCKED")` if any
  `rec.tenantId !== context.tenantId`. Empty input lists pass silently.
  Empty/whitespace `context.tenantId` throws `INVALID_ATTRIBUTION`.
- **`filterToContextTenant(context, recs)`** — non-throwing companion
  for surfaces that prefer graceful degradation.
- **`attributeAcquisition(input)`** — builds a `MarketplaceAttribution`
  value object. Defaults `sourceTenantId` to `tenantId` (the common
  case) and `capturedAt` to `Date.now()`. Throws `INVALID_ATTRIBUTION`
  on missing `tenantId` or `customerUserId`.
- **`assertNoCommissionMessaging(text)`** — scans for forbidden
  vocabulary (case-insensitive). Forbidden tokens:
  `commission`, `per-booking fee`, `per booking fee`, `marketplace fee`,
  `booking fee`, `platform fee`, `new client fee`,
  `percentage of revenue`. Throws
  `MarketplaceError("COMMISSION_MESSAGING_FORBIDDEN")` listing the
  offenders.
- **`findCommissionTokens(text)`** — non-throwing companion that
  returns the offending tokens (empty array means clean).

### 2.3 Model layer extension

`src/domains/marketplace/model.ts` (extended)

- `MarketplaceErrorCode` extended with `COMPETITOR_RECOMMENDATION_BLOCKED`,
  `COMMISSION_MESSAGING_FORBIDDEN`, `INVALID_ATTRIBUTION`.
- New types:
  - `MarketplaceAttribution { tenantId, customerUserId, sourcePostId?, sourceTenantId, capturedAt }` — booking-attribution value object. Salon owns the client; the platform never inserts itself.
  - `BookingFlowContext { tenantId, sourcePostId? }` — input to the guardrail service.
  - `RecommendedSalon { tenantId, reason? }` — minimal recommendation shape.

The `Booking` shape is **deliberately unmodified**. Attribution is a
sidecar value object (suggested storage path
`tenants/{tenantId}/marketplaceAcquisitions/{bookingId}`), keeping W17
surgical and W17-DEBT-2 cleanly scoped to the booking-pipeline wiring
later.

### 2.4 Documentation

`documentation/new-platform/MARKETPLACE_GUARDRAILS.md` (new) — authoritative
reference for the four marketplace guardrails (no competitor recs,
salon-owns-client, no commission, salon-controlled visibility) with code
references and a compliance checklist for new marketplace surfaces.

---

## 3. Tests

| Suite                                                              | Before  | After   | Δ    |
| ------------------------------------------------------------------ | ------- | ------- | ---- |
| `marketplace/__tests__/discoveryService.test.ts`                   | 0       | 22      | +22  |
| `marketplace/__tests__/guardrailsService.test.ts`                  | 0       | 16      | +16  |
| `marketplace/__tests__/repository.test.ts` (unchanged)             | 27      | 27      | 0    |
| **Marketplace domain total**                                       | **27**  | **65**  | **+38** |
| **Root jest suite**                                                | **1506**| **1544**| **+38** |

- `npx jest` → **1,544 / 1,544 passing**, 91 suites
- `npx tsc --noEmit` → 0 errors

Test coverage highlights:
- **discoveryService**: cursor round-trip + 6 malformed-input cases; feed ordering, pagination, tenantContext anti-theft suppression, unpublished filter, limit≤0 short-circuit, malformed-cursor tolerance; search across city / serviceTag (case-insensitive) / styleTag / free-text / hidden-and-opted-out exclusion / own-salon exclusion in booking funnel; profile-view tenant + ordering + postLimit + unpublished filter; deep-link basic + service pre-fill.
- **guardrailsService**: empty-list pass, all-same-tenant pass, cross-tenant throw with id listed, empty-context throw; filterToContextTenant filter + empty-context degrade; attribution full + sourceTenantId default + capturedAt default + missing-tenantId throw + missing-customerUserId throw; commission-token detection on clean copy + literal "commission" + multi-word phrase + empty string + every forbidden token sanity-check; assertion pass on clean + throw with offender listed.

---

## 4. Security & rules

No Firestore rules changes required.

- All new W17 surface is pure-logic in the service layer.
- Existing repository-level visibility filters (`filterVisibleProfiles`,
  `getVisibleProfiles`) and W12 rules hardening already cover the data
  plane: `marketplaceProfile`, `marketplacePosts`, `marketplaceSettings`
  collections all have explicit rules from W12.
- `MarketplaceAttribution` storage is not yet wired (W17-DEBT-2); rules
  for `tenants/{tenantId}/marketplaceAcquisitions` will land alongside
  that wiring in Phase 2 W22.

---

## 5. Debt outcome

- **Closed:** none this week (W17 was a pure feature week).
- **Rolled forward to W18 (Stripe backend pass):** W13-DEBT-1, W13-DEBT-4, W14-DEBT-1, W14-DEBT-2, W15-DEBT-2 — bundled rationale intact; redirected because user picked spec-canonical Marketplace for W17.
- **Net-new W17 debt:**
  - W17-DEBT-1 — Feed/search/profile services are pure-logic; consumer screens + Firestore-backed `collectionGroup('marketplacePosts')` feed query not yet wired (Phase 2 — W21).
  - W17-DEBT-2 — `MarketplaceAttribution` is built but not yet persisted by the booking pipeline (Phase 2 — W22).
  - W17-DEBT-3 — `assertNoCommissionMessaging` is callable but not yet wired as a CMS write-time lint (Phase 3 — W33).

See updated [DEBT_REGISTER.md](DEBT_REGISTER.md).

---

## 6. Files changed

```
src/domains/marketplace/model.ts                                      (extended)
src/domains/marketplace/discoveryService.ts                           (new)
src/domains/marketplace/guardrailsService.ts                          (new)
src/domains/marketplace/index.ts                                      (re-export update)
src/domains/marketplace/__tests__/discoveryService.test.ts            (new — 22 tests)
src/domains/marketplace/__tests__/guardrailsService.test.ts           (new — 16 tests)
documentation/new-platform/MARKETPLACE_GUARDRAILS.md                  (new)
documentation/new-platform/WEEK17_CLOSE_REPORT.md                     (new)
documentation/new-platform/DEBT_REGISTER.md                           (updated — 5 Stripe debts → W18; W17 section + 3 new debts)
documentation/new-platform/WEEKLY_LOG.md                              (W17 entry appended)
documentation/PROGRAM_TRACKING_BOARD.md                               (D-072 … D-076 appended)
```

---

## 7. Week 18 — handoff

Theme: **Stripe backend pass** (rolled forward from W17, originally scoped at end of W16).

1. `stripeWebhookHandler` Cloud Function — instantiate `createSubscriptionService` + `createConnectService`, dispatch `applyWebhookEvent` / `applyAccountEvent`, verify Stripe signature.
2. `cancelAtPeriodEnd=true` end-to-end coverage through the webhook path.
3. `stripeTaxCalculate` Cloud Function — Stripe Tax API + TTL semantics matching `createLocalTaxProvider`.
4. Cloud Scheduler invoking `tickExpiry` hourly.
5. Production wiring of `OnboardingAdminService.trialExtender` to the trial domain.

All five items share Stripe SDK setup + signature-verification scaffolding —
that is the (unchanged) rationale for bundling them into one focused week.
