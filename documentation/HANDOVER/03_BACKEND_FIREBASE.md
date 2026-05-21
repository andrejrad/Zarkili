# 03 — Backend / Firebase Architecture

**Scope:** Firestore, Auth, Cloud Functions, Storage, Hosting, security rules, indexes.
**Authoritative files:**
- [firestore.rules](../../firestore.rules) — security rules (~950 lines, 79 `match` blocks)
- [firestore.indexes.json](../../firestore.indexes.json) — composite + collection-group indexes
- [storage.rules](../../storage.rules) — Storage rules
- [firebase.json](../../firebase.json) — project config (functions, rules, hosting, emulators)
- [functions/src/](../../functions/src/) — Cloud Functions (Node 20)
- [SECURITY_RULES_FINAL.md](../new-platform/SECURITY_RULES_FINAL.md) — coverage matrix + property guarantees

---

## 1. Project topology

| Concern | Provider | Notes |
|---------|----------|-------|
| Auth | Firebase Auth | Email/password, anonymous, Apple, Google. Custom claim `role` for platform admins. |
| Database | Cloud Firestore | Single multi-tenant DB with strict `tenantId`-scoping at rules layer |
| Functions | Cloud Functions for Firebase v2 | Region default `us-central1`; Node 20; max instances 10 (`setGlobalOptions`) |
| Storage | Cloud Storage for Firebase | Tenant + client uploads (service photos, avatars, message attachments) |
| Hosting | Firebase Hosting | Serves the web build from `dist/` with SPA rewrite + `/privacy`, `/support` static routes |
| Emulators | local | Auth: 9099, Firestore: 8080, Storage: 9199, Functions: 5001, Hosting: 5000, UI: 4000 |

Two Firebase projects:
- `zarkili-dev` (deploy: `npm run firebase:deploy:dev`)
- `zarkili-production` (deploy: `npm run firebase:deploy:prod`)

EAS build profiles in `eas.json`; Expo runtime config in `app.config.ts` reads `.env.development` / `.env.production` via `dotenv-cli`.

---

## 2. Auth model

### 2.1 Identity

- Firebase Auth `uid` is the canonical user identity.
- `userProfiles/{uid}` carries app-level profile (first/last name, email, locale, avatar). Self-write only.
- Anonymous (guest) sessions: `signInAnonymously` issues a transient `uid`; promoted to permanent on sign-up via Firebase Auth account linking.

### 2.2 Custom claims

| Claim | Meaning |
|-------|---------|
| `role: "platform_admin"` | Carries `isPlatformAdmin()` in rules and bypasses tenant scoping (audit-logged in `platformAuditLog`). Granted via the admin SDK — never set client-side. |

### 2.3 Tenant membership

Driven entirely by the document `tenantUsers/{tenantId}_{uid}`:

```ts
{
  tenantId: string,           // partition key
  userId: string,             // Firebase uid
  role: "tenant_owner" | "tenant_admin" | "location_manager" | "technician" | "client",
  status: "active" | "inactive"
}
```

The composite doc id ensures **one membership per (tenant, user)**. Multi-tenant users also get `userTenantAccess/{uid}_{tenantId}` to drive the tenant-switcher UI.

### 2.4 Rules helpers (top of `firestore.rules`)

```firestore
isSignedIn()                   request.auth != null
isPlatformAdmin()              isSignedIn() && request.auth.token.role == 'platform_admin'
isTenantMember(tid)            exists(tenantUsers/{tid}_{request.auth.uid})
tenantRole(tid)                get(tenantUsers/{tid}_{request.auth.uid}).data.role
hasTenantRole(tid, roles)      isTenantMember(tid) && (tenantRole(tid) in roles)
isTenantAdmin(tid)             hasTenantRole(tid, ['tenant_owner','tenant_admin','location_manager'])
isTenantOwnerOrAdmin(tid)      hasTenantRole(tid, ['tenant_owner','tenant_admin'])
```

These are the **only** trusted authorities client-side checks may rely on. Every domain service factory also runs `actorRole` checks at the service layer (defense-in-depth).

---

## 3. Firestore collection map

Conventions:
- **PII / tenant-private** collections sit under `tenants/{tenantId}/...`
- **Public consumer surfaces** (discovery, search, slot availability) live at the top level with `tenantId` field-scoped rules
- **Brand hierarchy** (v3 data model — `zarkili_service_data_model_v3 (2).md`) sits under `brands/{brandId}/locations/{locationId}/...` where `brandId == tenantId`

Severity legend below: 🔓 public-read, 🔒 tenant-scoped, ⛔ admin-only, 👤 user-self.

### 3.1 Identity, tenancy, RBAC

| Collection | Rule | Notes |
|------------|------|-------|
| `tenants/{tid}` | 🔓 read; tenant_owner/platform_admin write | Public consumer profiles (marketplace) |
| `tenantUsers/{tid_uid}` | tenant_owner/admin self-read + admin-write; tenant_owner-only owner-role grants | RBAC pivot; doc id enforces composite key |
| `userProfiles/{uid}` | 👤 self-read/write only | App-level user profile |
| `userTenantAccess/{uid_tid}` | self + tenant_owner/admin | Drives tenant switcher |

### 3.2 Locations, staff, schedules (legacy + v3 paths in parallel)

| Collection | Rule | Notes |
|------------|------|-------|
| `locations/{lid}` | 🔓 read if `status==active`; tenant admin write | **Legacy top-level path** — still active; B3 migration to brand hierarchy is open |
| `staff/{sid}` | 🔓 read if `status==active`; tenant admin write | Marketplace surfaces (display name, specialties, rating) |
| `staffSchedules/{tid_staffId_locId}` | 🔓 read; tenant admin write | Business-hours only — no PII |
| `brands/{tid}/locations/{lid}/technicians/{techId}` | 🔓 read; tenant admin write | Service-detail "Our team" |

### 3.3 Service catalogue (v3 brand hierarchy)

Canonical path (post NEW-DEBT-B B2a–e):

```
brands/{brandId}                                                — brand profile
brands/{brandId}/locations/{locationId}                        — location
brands/{brandId}/locations/{locationId}/service_types/{stId}   — one Explore card
                                          .../variants/{vid}   — variant picker (chip row)
                                          .../addons/{aid}     — add-on chips
                                          .../photos/{pid}     — gallery
```

- **All reads** for catalogue use `collectionGroup("service_types")` filtered by `tenantId`+`active` (path helpers in [src/domains/services/paths.ts](../../src/domains/services/paths.ts)).
- **All writes** go through `src/app/admin/serviceCatalogAdapters.ts#createServiceSetupRepository`.
- **Legacy `services/{sid}` path** retained read-only for migration window — writes locked to `platform_admin` only.
- **Tenant-admin operational subcollections** under `tenants/{tid}/services/{sid}/seasonalRules|bookingRules|visibility|priceOverrides|media` are a separate namespace (B2 not applied — by design).

| Collection | Rule | Notes |
|------------|------|-------|
| `brands/{tid}` | 🔓 read; tenant admin write | brandId == tenantId |
| `brands/{tid}/locations/{lid}` | 🔓 read; tenant admin write | |
| `brands/{tid}/locations/{lid}/service_types/{stId}` | 🔓 read; tenant admin write (with `brandId` + `locationId` field check on create) | One service per location per category |
| `.../variants/{vid}` | 🔓 read; tenant admin write | |
| `.../addons/{aid}` | 🔓 read; tenant admin write | |
| `.../photos/{pid}` | 🔓 read; tenant admin write | Storage URL refs only |
| `service_categories/{categoryId}` | 🔓 read; platform admin write | Platform-managed category taxonomy |
| `services/{sid}` (legacy) | 🔓 read; ⛔ platform_admin write only | Migration window only |
| `tenants/{tid}/services/{sid}/seasonalRules|bookingRules|visibility|priceOverrides|media` | tenant admin | Operational subcollections (distinct from catalogue) |

### 3.4 Discovery & marketplace

| Collection | Rule | Notes |
|------------|------|-------|
| `platformEditorial/{cardId}` | 🔓 read; platform admin write | Hand-curated cards |
| `sponsoredListings/{listingId}` | 🔓 read; tenant admin write | DiscoverFeed sponsored slots |
| `platform/config` | 🔓 read; platform admin write | Singleton platform config |
| `tenants/{tid}/marketplaceAcquisitions/{bookingId}` | tenant-scoped (via repository) | Per-booking attribution (W17-DEBT-2 closure) |

### 3.5 Bookings & availability

| Collection | Rule | Notes |
|------------|------|-------|
| `bookings/{bookingId}` | 🔓 read (slot availability is public); create: tenant admin OR client booking own; update/delete: tenant admin | `customerUserId == request.auth.uid` for client creates |
| `bookingSlotTokens/{tokenId}` | 🔓 read; create: tenant member; update: ⛔ false (immutable); delete: tenant member | Atomic-create mutex with bookings |
| `tenants/{tid}/bookings/{bookingId}` | tenant admin / client own | Tenant-scoped mirror (W23-DEBT-1 closure) |
| `tenants/{tid}/ratingAggregates/{aggId}` | 🔓 read; CF write | Maintained by `updateServiceDerivedFields` |
| `tenants/{tid}/appointmentPayments/{bookingId}` | tenant admin / payments CF | Payment intent state |

### 3.6 Loyalty (v3 brand-level)

Canonical path is `user_brand_loyalty/{uid_brandId}` (NEW-DEBT-B B1 closure). Legacy `tenants/{tid}/loyaltyStates/{uid}` is locked read-only to platform admins; new writes go to both via a temporary bridge field strategy (`brandId`, `pointsBalance` plus old field names).

| Collection | Rule |
|------------|------|
| `user_brand_loyalty/{uid_brandId}` | member read self; tenant admin via `resource.data.brandId` |
| `tenants/{tid}/loyaltyConfig/{cid}` | 🔓 member read; tenant admin write |
| `tenants/{tid}/loyaltyStates/{uid}` (legacy) | owner self-read; admin all read; CF only write |
| `tenants/{tid}/loyaltyTransactions/{txId}` | admin write; client read own |
| `tenants/{tid}/loyaltyIdempotency/{key}` | CF write only |

### 3.7 Campaigns, activities, segments, messaging, waitlist

| Collection | Rule |
|------------|------|
| `tenants/{tid}/campaigns/{cid}` | tenant admin |
| `tenants/{tid}/campaignSendLogs/{lid}` | CF + tenant admin |
| `tenants/{tid}/activities/{aid}` | tenant admin |
| `tenants/{tid}/activityParticipations/{pid}` | tenant admin + client own |
| `segments/{sid}` | tenant admin (scoped by `tenantId` field) |
| `messages/{mid}` | tenant admin + client own (scoped by `tenantId` + `userId`) |
| `waitlist/{eid}` | tenant admin + client own |
| `threads/{thid}` | participants only (`participants` array on doc) |
| `threads/{thid}/messages/{mid}` | thread participants |

### 3.8 Reviews

| Collection | Rule |
|------------|------|
| `reviews/{rid}` | 🔓 read if `isPublished == true`; create by signed-in client whose `customerUserId == auth.uid`; admin moderate |
| `tenants/{tid}/reviews/{rid}` | tenant admin moderation queue |

### 3.9 Payments, billing, Stripe Connect

All Stripe state is mirrored into tenant-scoped Firestore collections; webhooks are idempotent via dedicated `*WebhookIdempotency` collections.

| Collection | Rule |
|------------|------|
| `tenants/{tid}/billing/{docId}` | tenant admin |
| `tenants/{tid}/billingWebhookIdempotency/{eventId}` | CF only |
| `tenants/{tid}/connect/{docId}` | tenant admin |
| `tenants/{tid}/connectWebhookIdempotency/{eventId}` | CF only |
| `tenants/{tid}/charges/{cid}` | tenant admin |
| `tenants/{tid}/refunds/{rid}` | tenant admin + CF |
| `tenants/{tid}/paymentsIdempotency/{key}` | CF only |
| `tenants/{tid}/paymentsWebhookIdempotency/{eventId}` | CF only |
| `tenants/{tid}/paymentSettings/{docId}` | tenant admin |
| `tenants/{tid}/appointmentPayments/{bookingId}` | CF + admin |
| `clients/{uid}` | self |
| `clients/{uid}/paymentMethods/{mid}` | self only |
| `clients/{uid}/paymentsWebhookIdempotency/{eventId}` | CF only |
| `clients/{uid}/tenantPaymentProfiles/{tid}` | self |
| `tenants/{tid}/taxCalculations/{quoteId}` | tenant admin + CF |
| `platform/{platformId}/taxCalculations/{quoteId}` | platform admin + CF |

### 3.10 Trial, gating

| Collection | Rule |
|------------|------|
| `tenants/{tid}/trial/{docId}` | tenant owner read; CF write |
| `tenants/{tid}/trialJobRuns/{runId}` | platform admin + CF |
| `tenants/{tid}/gateDenials/{docId}` | tenant admin + CF |

### 3.11 User-scoped (saved services, notifications)

| Collection | Rule |
|------------|------|
| `clients/{uid}/notifications/{nid}` | 👤 self |
| `clients/{uid}/notificationPrefs/{docId}` | 👤 self |
| `users/{uid}/savedServices/{sid}` | 👤 self |

### 3.12 Onboarding

| Collection | Rule |
|------------|------|
| `onboardingDrafts/{draftId}` | self-read/write + tenant admin; `flowType in ['salon','client']`; `schemaVersion` monotonic |
| `tenants/{tid}/onboardingDrafts/{step}` | per-step persistence for salon wizard |
| `tenants/{tid}/onboardingTimeline/{eid}` | audit timeline (admin read) |
| `userOnboardingDrafts/{sessionId}` | client wizard sessions (W20.5 persistence port) |

### 3.13 Platform super-admin (W49)

| Collection | Rule |
|------------|------|
| `featureFlags/{flagKey}` | 🔓 read (lazy fetch by client); platform admin write — platform-scoped flags |
| `featureFlags/{tenantId}__{flagKey}` | 🔓 read; platform admin write — tenant-scoped overrides |
| `platformAuditLog/{eid}` | platform admin read/append-only (no update / delete) |
| `securityEvents/{eid}` | platform admin |
| `dataExportRequests/{eid}` | platform admin |
| `consentPolicyEntries/{eid}` | platform admin |
| `incidents/{eid}` | platform admin |
| `migrationJobs/{eid}` | platform admin |
| `backupJobs/{eid}` | platform admin |
| `pricingPlans/{eid}` | 🔓 read; platform admin write |
| `impersonationSessions/{eid}` | platform admin (30-min auto-expiry enforced in service layer) |

### 3.14 AI

| Collection | Rule |
|------------|------|
| `tenants/{tid}/aiBudget/{key}` | tenant admin + CF |
| `tenants/{tid}/aiSuggestions/{sid}` | tenant admin + CF |
| `tenants/{tid}/aiAuditLog/{eid}` | tenant admin + CF |
| `tenants/{tid}/aiToggles/{key}` | tenant admin |
| `aiBudgetOverrides/{tid}` | platform admin (CrossTenantAiBudgetScreen) |
| `aiRiskPolicies/{tid}` | platform admin |

---

## 4. Indexes

Definition: [firestore.indexes.json](../../firestore.indexes.json). Highlights:

| Collection group | Fields | Purpose |
|------------------|--------|---------|
| `bookings` | `(tenantId, locationId, date, startTime)` | Slot lookups, scheduler |
| `bookings` | `(tenantId, customerUserId, status, date DESC)` | Customer booking history |
| `service_types` (COLLECTION_GROUP) | `(tenantId, active)` | Salon profile service list, Explore filters |
| `service_types` (COLLECTION_GROUP) | `(active, geohash)` | Explore geo fan-out |
| `service_types` (COLLECTION_GROUP) | `(active, name)` | Search-suggestions prefix query |
| `variants` | `(active, sortOrder)` | Variant picker chip row |
| `reviews` | `(serviceId, createdAt DESC)` | Reviews block on service detail |
| `services` (legacy) | `(tenantId, active, sortOrder)` | Read-only fallback |
| `refunds` | `(bookingId, userId)` | Receipt + refund lookups |
| `appointmentPayments` (COLLECTION_GROUP) | `(status, paymentMode, authorizedAt)` | Reauthorize-expired-holds CF |

Three `service_types` collection-group indexes were added in NEW-DEBT-B B2a.

---

## 5. Cloud Functions

Code in [functions/src/](../../functions/src/). Region default `us-central1`. `setGlobalOptions({ maxInstances: 10 })` in [functions/src/index.ts](../../functions/src/index.ts).

### 5.1 Callable (HTTPS)

| Export | Purpose |
|--------|---------|
| `getAiBudgetConfigAdmin` / `updateAiBudgetConfigAdmin` / `listAiBudgetAuditLogsAdmin` | AI budget admin CRUD (W48) |
| `getRiskPolicyAdmin` / `updateRiskPolicyAdmin` | AI risk policy admin |
| `previewNotificationTemplate` | Render a template against sample data |
| `stripeConnectOnboard` / `stripeConnectDashboardLink` | Stripe Connect tenant onboarding |
| `getPaymentSettings` / `updatePaymentSettings` / `getPaymentSummary` | Tenant admin payment settings |
| `createBookingPaymentIntent` / `captureBookingPayment` / `cancelBookingPayment` | Booking-scoped payment lifecycle |
| `paymentsAttachMethod` / `paymentsDetachMethod` / `paymentsChargeBooking` / `paymentsApplyLoyaltyDiscount` / `paymentsRefundBooking` / `updateLoyaltyOnBookingComplete` | Payment + loyalty operations (`functions/src/payments.ts`) |
| `receiptsGeneratePdf` | Generate receipt PDF (W24) |
| `health` | Basic 200 OK liveness probe (`GET /health`) |

### 5.2 Webhook handlers (HTTPS)

| Export | Purpose |
|--------|---------|
| `stripeWebhookHandler` | Stripe customer/sub/invoice/connect events. Idempotent via `*WebhookIdempotency` collections (W13-DEBT-1 closure) |
| `stripeTaxCalculate` | Calls Stripe Tax API and persists quote (W14-DEBT-1 / W18) |

### 5.3 Firestore triggers

| Export | Trigger | Purpose |
|--------|---------|---------|
| `onBookingWritten` | `bookings/{id}` onWrite | Slot-token reconciliation, marketplace attribution, transition emails (`bookingTriggers.ts`) |
| `updateAvailabilitySummary` | bookings onWrite | Maintains location availability summary |
| `updateServiceAvailability` | bookings onWrite | Maintains `service_types.nextAvailableAt` + `isFullyBooked` (`serviceAvailabilityTrigger.ts`) |
| `updateServiceDerivedFields` | reviews onWrite | Maintains `serviceAverageRating`, `serviceReviewCount`, `locationAverageRating` via collectionGroup lookup |
| `syncLocationGeohash` | locations onWrite | Maintains `geohash` field |

### 5.4 Scheduled

| Export | Schedule | Purpose |
|--------|----------|---------|
| `dailyBookingReminders` | 09:00 daily | Outbound day-of reminders (`scheduledReminders.ts`) |
| `purgeExpiredSlotTokens` | 02:30 daily | Deletes `bookingSlotTokens` older than 1 day in 400-doc batches (KI-002 closure) |
| `trialExpiryHourly` | Hourly | Per-tenant `tickExpiry(tenantId, runId)` (W14-DEBT-2 closure) |
| `reauthorizeExpiredHolds` | Hourly | Re-authorises Stripe holds within the 7-day expiry window |
| `check1099KThreshold` | Monthly 1st @ 03:00 UTC | Flips `tenants/{tid}.eligible1099K` based on calendar-year gross/tx counts (W13-DEBT-3 closure) |
| `computePopularityIndex` | Daily | Maintains `service_types.popularityScore` for Explore Recommended sort |

### 5.5 Cloud Function ↔ Firestore path map (v3 hierarchy)

All CFs that read/write service-catalog data use the v3 hierarchical path (NEW-DEBT-B B2d closure):

- `popularityIndex.ts` — `brands/{tid}/locations/{lid}/service_types/{sid}` via service→location map.
- `bookingTriggers.ts` — `lookupServiceName(tenantId, locationId, serviceId)` uses direct hierarchical path.
- `receipts.ts` — same.
- `serviceAvailabilityTrigger.ts` — writes `nextAvailableAt` / `isFullyBooked` hierarchically.
- `updateServiceDerivedFields.ts` — collectionGroup lookup by `(brandId, locationId)` then direct write.

---

## 6. Storage layout

Defined in [storage.rules](../../storage.rules). Standard buckets:

| Path prefix | Owner | Use |
|-------------|-------|-----|
| `tenants/{tid}/service-photos/...` | tenant admin write; 🔓 read | Salon-uploaded portfolio photos |
| `clients/{uid}/result-photos/...` | client write; 🔓 read | "My result" client-submitted photos for reviews + Explore card cover |
| `clients/{uid}/avatars/...` | client write; 🔓 read | Profile avatar |
| `threads/{thid}/attachments/...` | thread participants | Message attachments |
| `tenants/{tid}/branding/...` | tenant admin | Logos, banner images |
| `platform/...` | platform admin | Platform-managed assets (category icons etc.) |

---

## 7. Hosting + web build

`firebase.json` hosting config:

```
public: "dist"
rewrites:
  /privacy → /privacy.html
  /support → /support.html
  **      → /index.html
```

The web build pipeline is:

```
npm run build:web:dev    # dotenv -e .env.development -- npx expo export --platform web --clear
npm run copy:static      # copies privacy.html, support.html, favicon from public-static/ to dist/
firebase deploy --only hosting --project zarkili-dev
```

Same flow with `:prod` for production. EAS handles native builds — see `eas.json`.

---

## 8. Operational runbooks

All under `documentation/new-platform/runbooks/`:

| Runbook | Covers |
|---------|--------|
| [INCIDENT_RESPONSE.md](../new-platform/runbooks/INCIDENT_RESPONSE.md) | P0/P1/P2 playbooks, communication templates, escalation matrix |
| [BACKUP_RESTORE.md](../new-platform/runbooks/BACKUP_RESTORE.md) | PITR setup, daily GCS exports, collection-level purge, migration rollback |
| [ROLLBACK_STRATEGY.md](../new-platform/runbooks/ROLLBACK_STRATEGY.md) | Code / data / rules rollback decision tree |
| [HEALTH_CHECKS.md](../new-platform/runbooks/HEALTH_CHECKS.md) | Post-deploy smokes, daily dashboard, 14-day KPI thresholds |

---

## 9. Security posture

From [PHASE3_COMPLETION_REPORT.md §5](../new-platform/PHASE3_COMPLETION_REPORT.md):

- Every admin **service factory** uses `assert*(actorRole)` guards at the service layer — non-authorised roles receive `"FORBIDDEN: <role> required"` **before any Firestore read**.
- Impersonation sessions: 30-minute hard cap (contract-level); past-expiry sessions auto-nullified on read; every event double-written to `platformAuditLog` + `securityEvents` for non-repudiation.
- All platform-admin **writes** produce a `platformAuditLog` entry (actor uid, action, timestamp, target).
- `AdminSignInScreen` delegates to Firebase Auth — credentials never traverse the React component tree.
- OWASP Top 10 verified across Phase 3 service layer.

---

## 10. Emulator suite & rule tests

`npm run test:rules` runs `firebase emulators:exec --only firestore "jest --config jest.rules.config.js --runInBand --runTestsByPath __tests__/firestore.rules.test.ts"`.

The rules test file covers ~80 + assertions including: `service_types (v3 path)`, `services (legacy lockdown)`, `user_brand_loyalty (v3)`, `loyaltyStates (legacy)`, `loyaltyConfig`, `loyaltyTransactions`, `campaigns`, `messages`, `bookings`, `userTenantAccess`, and the platform-admin only collections.

For local development:
```
firebase emulators:start --project zarkili-dev   # starts auth/firestore/storage/functions/hosting + UI
```
