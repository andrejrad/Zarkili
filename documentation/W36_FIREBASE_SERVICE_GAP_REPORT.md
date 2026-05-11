# W36 Firebase Integration — Service Gap Report

> Generated as part of the W35 → W36 transition. Compares the W36 plan in
> `documentation/PHASE2_3_CONSUMER_FIREBASE_INTEGRATION_WEEKS_35_TO_37.md`
> against the actual Phase 1 service surface in `src/domains/`.
>
> Legend: ✅ exists as planned · ⚠️ exists with different signature/name · ❌ missing

## 1. Architectural note

The W36 plan documents services as `src/services/firebaseAuthService`,
`src/services/discoverService`, etc. The actual Phase 1 codebase uses a
**factory pattern under `src/domains/<domain>/`**:

- `createAuthRepository(auth, db)` → returns a typed object with all auth methods
- `createBookingsRepository(db)` → returns a typed object with all booking methods
- `createDiscoveryService(repository)` → returns `{ getHomeFeed, getExploreFeed }`
- …etc.

**W36 implementation note:** rather than scaffolding new `firebaseAuthService.ts` /
`discoverService.ts` files, W36 should **wire UI screens to the existing
domain factories** (or thin app-layer adapter services) — and only scaffold
new code where a method is genuinely missing (mainly **payments**).

---

## 2. Auth domain — `src/domains/auth/repository.ts`

Factory: `createAuthRepository(auth: Auth, db: Firestore): AuthRepository`

| W36 plan method | Status | Phase 1 equivalent |
|---|---|---|
| `firebaseAuthService.signInWithEmailAndPassword(email, password)` | ⚠️ | `signIn(input: SignInInput)` |
| `firebaseAuthService.createUserWithEmailAndPassword(email, password)` | ⚠️ | `createAccount(input: CreateAccountInput)` (also writes profile) |
| `firebaseAuthService.signInWithProvider(provider)` (Google/Apple/Facebook) | ❌ | — Not implemented |
| `firebaseAuthService.sendEmailVerification()` | ❌ | — Not implemented |
| `firebaseAuthService.onAuthStateChanged(callback)` | ❌ | `getCurrentSession()` (one-shot, not subscription) |
| `firebaseAuthService.sendPasswordResetEmail(email)` | ⚠️ | `sendPasswordReset(input: PasswordResetInput)` |
| `userProfileService.createProfile(uid, profileData)` | ⚠️ | Bundled into `createAccount`; also `updateProfile(userId, input)` |
| `userProfileService.updateEmail(uid, newEmail)` | ⚠️ | `updateEmailAddress(userId, input)` |
| — | ✅ extra | `signOutCurrentUser()` |
| — | ✅ extra | `listUserTenantMemberships(userId)` |
| — | ✅ extra | `readUserProfile(userId)` |

**W36 actions for auth:**
1. Add `signInWithProvider` (Google/Apple/Facebook) — currently `SocialSignInSelectorScreen` calls a mock.
2. Add `sendEmailVerification()` — currently `EmailVerificationScreen` has no real wiring.
3. Add an `onAuthStateChanged`-based subscription helper for `AuthProvider` (today the provider hydrates once via `getCurrentSession`).

---

## 3. Discovery domain

Two services exist, each covering a different concern:

### 3a. `src/domains/discovery/service.ts` (consumer home/explore)
Factory: `createDiscoveryService(repository): DiscoveryService`

| W36 plan method | Status | Phase 1 equivalent |
|---|---|---|
| `discoverService.getFeaturedSalons(tenantId)` | ⚠️ | `getHomeFeed()` returns `{ categories, featuredSalons, recentBookings }` |
| `discoverService.getFeedPosts(clientId, cursor)` | ⚠️ partial | `getExploreFeed()` (no cursor; returns full list) |
| `discoverService.search(query, filters)` | ❌ | — Not implemented (see marketplace below) |

Repository methods (`createDiscoveryRepository`): `listCategories()`,
`listFeaturedSalons()`, `listRecentBookings()`.

### 3b. `src/domains/marketplace/discoveryService.ts` (cursor-based feed + search)
Pure functions: `getFeedPage(input)`, `searchProfiles(input)`,
`assembleProfileView(input)`, `buildBookThisLookDeepLink(input)`,
`encodeFeedCursor`, `decodeFeedCursor`.

This **does** implement search and cursor pagination, but it operates over
in-memory `SalonPublicProfile[]` / `MarketplacePost[]` lists rather than
running a Firestore query.

**W36 actions for discovery:**
1. Decide which service is canonical for the consumer Discover/Explore tab
   (recommend: keep `domains/discovery/service.ts` as the screen-facing API,
   add a `search(query, filters)` method that delegates to a Firestore query
   under the hood).
2. Wire `domains/discovery/repository` Firebase implementation to actually
   read from Firestore (currently the `firestore.ts` impl exists; need to
   verify it's used and that indexes are present).
3. Add cursor-based pagination to `getExploreFeed`.

---

## 4. Salon / Service catalog / Staff (consumer-read)

The W36 plan calls for `salonService.getSalon(salonId)`,
`serviceCatalogService.getServicesForSalon(salonId)`,
`staffService.getStaffForSalon(salonId)`. These are **read-only consumer
projections** of admin-focused Phase 1 repositories.

### `src/domains/locations/repository.ts` (closest to "salonService")
| W36 plan method | Status | Phase 1 equivalent |
|---|---|---|
| `salonService.getSalon(salonId)` | ⚠️ | `getLocationById(locationId)` (note: salon = tenant + location) |
| — | ✅ admin | `createLocation`, `updateLocation`, `listTenantLocations`, `deactivateLocation` |

### `src/domains/services/repository.ts`
| W36 plan method | Status | Phase 1 equivalent |
|---|---|---|
| `serviceCatalogService.getServicesForSalon(salonId)` | ⚠️ | `listServicesByLocation(tenantId, locationId)` |
| — | ✅ admin | `createService`, `updateService`, `listServicesByTenant`, `archiveService` |

### `src/domains/staff/repository.ts`
| W36 plan method | Status | Phase 1 equivalent |
|---|---|---|
| `staffService.getStaffForSalon(salonId)` | ⚠️ | `listLocationStaff(tenantId, locationId)` |
| — | ✅ extra | `listServiceQualifiedStaff` (filters by which services a staff member can perform) |
| — | ✅ admin | `createStaff`, `updateStaff`, `deactivateStaff` |

**W36 actions:**
1. Add a thin **consumer-facing read service** layer (e.g.
   `src/app/discover/consumerSalonReadService.ts`) that adapts these
   admin repositories to the salon-detail / service-picker / staff-picker
   screens. No new Firestore code needed — just adapters.
2. Update `salonService.getSalon` callers to take `(tenantId, locationId)`
   not a single `salonId`, OR introduce a salonId → (tenantId, locationId)
   resolver.

---

## 5. Booking domain

### `src/domains/bookings/repository.ts`
Factory: `createBookingsRepository(db): BookingsRepository`

| W36 plan method | Status | Phase 1 equivalent |
|---|---|---|
| `bookingService.createBooking(input)` | ✅ | `createBookingAtomically(input)` (transactional, conflict-checked) |
| `bookingService.getBooking(bookingId)` | ✅ | `getBookingById(bookingId, tenantId)` |
| `bookingService.getBookingsForClient(clientId)` | ✅ | `listBookingsByCustomer(tenantId, customerId, options)` |
| `bookingService.cancelBooking(bookingId, reason)` | ✅ | `cancelBooking(bookingId, tenantId, reason)` |
| `bookingService.rescheduleBooking(bookingId, newSlot)` | ❌ | — Not implemented |
| — | ✅ extra | `confirmBooking`, `rejectBooking`, `markCompleted`, `markNoShow`, `updateBookingStatus`, `listBookingsByStaffAndDate`, `listBookingsByLocationAndDate`, `listBookingsByStatus` |

### `src/domains/bookings/slotEngine.ts`
| W36 plan method | Status | Phase 1 equivalent |
|---|---|---|
| `slotEngineService.getAvailableSlots(salonId, staffId, serviceIds, date)` | ⚠️ | `generateSlots(input: GenerateSlotsInput)` (pure function, no orchestration) |

**W36 actions for booking:**
1. Add `rescheduleBooking(bookingId, newStartTime)` to the bookings repo.
   Should be transactional like `createBookingAtomically`.
2. Add an orchestration layer
   `slotEngineService.getAvailableSlots(input)` that combines:
   - staff schedule lookup (`staffSchedulesRepository`)
   - existing bookings for the day (`listBookingsByStaffAndDate`)
   - service durations (`servicesRepository`)
   - then calls `generateSlots`.
   This is what `BookingTimePickerScreen` will need.

---

## 6. Payments domain — ❌ MOSTLY MISSING

This is the **biggest W36 gap.** The only payments-related code is:

- `src/domains/billing/` — **B2B subscription** billing (Stripe webhooks for
  tenant subscriptions, idempotency tracking). Not consumer payments.
- `src/domains/billing/repository.ts` exposes `getSubscription`,
  `saveSubscriptionWithIdempotency`, `hasProcessedEvent`,
  `recordProcessedEvent`. None of these are consumer payment methods.

| W36 plan method | Status |
|---|---|
| `paymentService.getSavedPaymentMethods(clientId)` | ❌ |
| `paymentService.attachPaymentMethod(clientId, paymentMethodId)` | ❌ |
| `paymentService.detachPaymentMethod(clientId, paymentMethodId)` | ❌ |
| `paymentService.chargeBooking(bookingId, amount, paymentMethodId)` | ❌ |
| `paymentService.applyLoyaltyDiscount(bookingId, points)` | ❌ |

**W36 actions for payments (full scaffolding needed):**
1. Create `src/domains/payments/` with:
   - `model.ts` — `PaymentMethod`, `Charge`, `LoyaltyDiscount` types
   - `repository.ts` — `createPaymentsRepository(db, stripe)` factory with
     the five methods above
   - `__tests__/repository.test.ts` — Firestore-mocked unit tests
2. Stripe SDK integration:
   - Client side: `@stripe/stripe-react-native` for SetupIntent / PaymentSheet
   - Server side: Cloud Function in `functions/src/payments/` to create
     SetupIntents and PaymentIntents, attach/detach methods on the
     server-managed Stripe customer
3. Loyalty integration: `applyLoyaltyDiscount` should call into
   `src/domains/loyalty/repository.ts`'s `debitPoints(userId, tenantId, amount)`
   transactionally with the charge.
4. Firestore schema: `clients/{clientId}/paymentMethods/{methodId}` with the
   Stripe `pm_xxx` ID (never store full PAN).

---

## 7. Recommended W36 sequencing

Given the gaps above, suggest splitting W36 into three sub-batches:

### W36-A: Wire existing services (no new code needed)
- Auth: `SignInScreen` / `SignUpScreen` / `ForgotPasswordScreen` /
  `ResetPasswordScreen` → `AuthProvider` already calls `createAuthRepository`.
- Discover: `DiscoverHomeScreen` → existing `DiscoveryService.getHomeFeed()`.
- Booking flow: `ServiceSelectionScreen` etc. wire to existing repos.
- Booking history: `BookingHistoryScreen` → `listBookingsByCustomer`.

### W36-B: Add small missing methods
- `signInWithProvider` (Google/Apple)
- `sendEmailVerification`
- `onAuthStateChanged` subscription helper
- `discoverService.search(query, filters)`
- `bookingsRepository.rescheduleBooking`
- `slotEngineService.getAvailableSlots` orchestrator

### W36-C: Scaffold payments domain
- New `src/domains/payments/` (per section 6 above)
- New Cloud Function: `functions/src/payments/`
- Wire `BookingPaymentScreen` / `SavedPaymentMethodsScreen` /
  `AddPaymentMethodScreen` / `TippingScreen` to the new service

---

## 8. Out-of-scope / extra Phase 1 surface to be aware of

These exist and W36 should not duplicate them:

- `src/domains/loyalty/repository.ts` — `creditPoints`, `debitPoints`,
  `getBalance`, `listTransactions`, `getCustomerLoyaltyState`,
  `applyPointsDelta`. **W36 payments must reuse `debitPoints`** for
  the loyalty discount path.
- `src/domains/marketplace/repository.ts` — `upsertProfile`, `getProfile`,
  `getVisibleProfiles`, `createPost`, `getPublishedPosts`, etc.
- `src/domains/marketplace/marketplaceAcquisitionsRepository.ts` —
  attribution tracking. May feed the discover-feed cursor logic.
