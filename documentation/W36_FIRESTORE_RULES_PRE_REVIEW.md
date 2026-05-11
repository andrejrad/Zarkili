# Firestore Rules Pre-Review for W36

> Reviews [firestore.rules](firestore.rules) against the consumer-write paths
> introduced in W36 (per
> [W36_FIREBASE_SERVICE_GAP_REPORT.md](W36_FIREBASE_SERVICE_GAP_REPORT.md) and
> [W36A_WIRE_UP_CHECKLIST.md](W36A_WIRE_UP_CHECKLIST.md)). Findings are
> ordered by severity. **No rule changes have been made** — this is an
> advisory report.

Generated: 2026-04-30 (W35→W36 transition)

---

## Summary

| Severity | Count | Examples |
|---|---|---|
| 🔴 Blocker | 4 | First-time consumer booking blocked; consumer cancel blocked; payments collections missing; marketplace feed blocked |
| 🟠 Major | 3 | Customer-owned booking read; reviews require pre-existing membership; profile creation requires firstName/lastName |
| 🟡 Minor | 2 | `discoveryFeaturedSalons` is world-readable (intentional?); `bookingSlotTokens.update: false` blocks future TTL extension |

The single dominant theme: **`isTenantMember(tenantId)` requires a
`tenantUsers/{tenantId}_{userId}` doc to exist**, but a consumer who books
at a salon for the first time does **not** have that doc. The current
rules effectively assume every customer has been pre-provisioned by the
tenant — true for B2B onboarding, false for the consumer marketplace.

The cheapest fix is **server-side membership auto-provisioning**: a Cloud
Function trigger that creates a `client`-role `tenantUsers` doc the first
time a customer interacts with a tenant. The alternative — relaxing the
rules to allow any signed-in user to write `customerUserId == auth.uid`
documents — is also viable but spreads the trust boundary across every
collection.

---

## 🔴 Blocker 1 — Consumer-initiated booking is blocked on first interaction

**Rule** ([firestore.rules#L150](firestore.rules#L150) approx):

```
match /bookings/{bookingId} {
  allow read: if tenantScopedReadFromResource();
  allow create: if tenantScopedCreateWrite() && (
    isTenantAdmin(...) ||
    (hasTenantRole(request.resource.data.tenantId, ['client'])
     && request.resource.data.customerUserId == request.auth.uid)
  );
  ...
}
```

**Problem.** `hasTenantRole(tenantId, ['client'])` calls `isTenantMember`,
which `exists()`-checks `tenantUsers/{tenantId}_{userId}`. A consumer who
discovers a new salon in the marketplace and tries to book has no such
doc, so `bookingsRepository.createBookingAtomically` will `permission-denied`.

**Affected screens.** All of `BookingConfirmationScreen`,
`MultiServiceBookingScreen`, `GuestContactScreen` (logged-in path).

**Recommended fix.**

Option A (preferred): **Cloud Function `onCustomerFirstBooking`** that
creates the `tenantUsers/{tenantId}_{userId}` doc with `role: 'client'`,
`status: 'active'` if missing, fired by an HTTPS callable wrapping the
booking-creation flow.

Option B: Add a bypass clause to the booking create rule:

```
allow create: if request.resource.data.tenantId is string
  && request.resource.data.customerUserId == request.auth.uid
  && request.resource.data.status == 'pending_confirmation'
  && /* sanity-check denormalised fields */ ...;
```

Option A is preferred because the membership doc also unlocks rules for
loyalty state, reviews, waitlist, etc. — all of which have the same gap
(see Blocker 2 and Major 1 below).

---

## 🔴 Blocker 2 — Consumer cannot cancel their own booking

**Rule** ([firestore.rules#L160](firestore.rules#L160) approx):

```
allow update, delete: if tenantScopedUpdateWrite() && isTenantAdmin(resource.data.tenantId);
```

**Problem.** `bookingsRepository.cancelBooking(bookingId, tenantId, reason)`
performs an update to set `status = 'cancelled'`. Customers are not tenant
admins, so this rule denies them. The Phase 1 method exists and is wired
into `ManageBookingScreen`.

**Recommended fix.** Carve a customer-owned cancel branch:

```
allow update: if tenantScopedUpdateWrite()
  && (
    isTenantAdmin(resource.data.tenantId)
    || (
      isSignedIn()
      && resource.data.customerUserId == request.auth.uid
      && request.resource.data.customerUserId == resource.data.customerUserId
      && request.resource.data.status == 'cancelled'
      // immutability of identity fields
      && request.resource.data.bookingId == resource.data.bookingId
      && request.resource.data.tenantId == resource.data.tenantId
      && request.resource.data.locationId == resource.data.locationId
      && request.resource.data.staffId == resource.data.staffId
      && request.resource.data.startTime == resource.data.startTime
    )
  );
```

Reschedule (W36-B) will need a parallel branch with `status` unchanged
but `startTime`/`endTime` updated. Both branches can be enforced
server-side with the existing transactional helper if you'd rather
keep the rule narrow.

---

## 🔴 Blocker 3 — Payments collections have no rules → fall through to deny-all

W36-C plans:

- `clients/{userId}/paymentMethods/{methodId}` — saved methods
- `tenants/{tenantId}/charges/{chargeId}` — booking charges
- `tenants/{tenantId}/paymentsIdempotency/{key}` — server-only

None of these have rules; they hit the catch-all `match /{document=**}` deny.
For W36-C this is **safe but incomplete**: the Cloud Function will use the
admin SDK (bypasses rules), but the consumer client can't read its own
saved methods or its own charge for the receipt screen.

**Recommended additions** (to add at the same time as W36-C scaffolding —
not now):

```
match /clients/{userId}/paymentMethods/{methodId} {
  allow read: if isPlatformAdmin() || (isSignedIn() && request.auth.uid == userId);
  // Writes only via Cloud Function (admin SDK).
  allow write: if isPlatformAdmin();
}

match /tenants/{tenantId}/charges/{chargeId} {
  allow read: if isPlatformAdmin()
    || isTenantAdmin(tenantId)
    || (isSignedIn() && resource.data.userId == request.auth.uid);
  allow write: if isPlatformAdmin();
}

match /tenants/{tenantId}/paymentsIdempotency/{key} {
  allow read, write: if isPlatformAdmin();
}
```

Also note: the loyalty-discount path needs an idempotent debit. The
existing `loyaltyTransactions` rule already has `allow write: if
isPlatformAdmin() || isTenantAdmin(tenantId)` which is fine for
Cloud-Function-driven writes.

---

## 🔴 Blocker 4 — Marketplace feed has no rules

`tenants/{tenantId}/marketplacePosts/{postId}` and
`tenants/{tenantId}/salonPublicProfiles/{profileId}` are read by
`createMarketplacePostsService` and the discovery feed but have **no**
rules — fall through to the catch-all deny. Discovery feed will be empty
the moment it starts hitting Firestore.

**Recommended additions:**

```
match /tenants/{tenantId}/salonPublicProfiles/{profileId} {
  allow read: if true;                       // public discovery surface
  allow write: if isPlatformAdmin() || isTenantOwnerOrAdmin(tenantId);
}

match /tenants/{tenantId}/marketplacePosts/{postId} {
  // Public reads only when the post is published.
  allow read: if (resource.data.visibility == 'published')
    || isPlatformAdmin()
    || isTenantAdmin(tenantId);
  allow write: if isPlatformAdmin() || isTenantOwnerOrAdmin(tenantId);
}
```

Cross-check field names against `src/domains/marketplace/model.ts`
before merging — this report is recommending the shape, not a final
literal patch.

---

## 🟠 Major 1 — Booking read also blocked for new customers

Same `isTenantMember(tenantId)` gate via `tenantScopedReadFromResource()`.
Even after fixing the create path, `BookingHistoryScreen` and
`ManageBookingScreen` won't be able to read the booking the customer
just created if Blocker 1 is fixed via Option B (rule relaxation
without auto-provisioning a membership doc).

**Recommended fix.** Either Option A from Blocker 1 (auto-provision
membership), or add a customer-owned read branch:

```
allow read: if tenantScopedReadFromResource()
  || (isSignedIn() && resource.data.customerUserId == request.auth.uid);
```

---

## 🟠 Major 2 — Reviews require pre-existing tenant membership

Review create requires `isTenantMember(tenantId)`. Same first-booking
gap. If Blocker 1 is fixed via Option A (membership auto-provisioning),
this resolves automatically. Otherwise needs a customer-owned branch.

---

## 🟠 Major 3 — `userProfiles` requires firstName + lastName as strings

Social sign-in (W36-B `signInWithProvider`) returns a single
`displayName` from Google/Apple/Facebook. The current rule:

```
allow create, update: if (isSignedIn() && request.auth.uid == userId)
  && request.resource.data.userId == userId
  && (request.resource.data.email == null || request.resource.data.email is string)
  && request.resource.data.firstName is string
  && request.resource.data.lastName is string;
```

Will reject a profile created with only `displayName`. Either:

- The auth domain's `createAccount` already splits name parts
  client-side (verify), or
- Relax the rule to allow `firstName == null || firstName is string`
  and require non-null only on the consumer-edit path.

Recommend: confirm `createAuthRepository.createAccount` always provides
both fields (write a test) before changing the rule; otherwise loosen
the rule with the explicit nullable variant above.

---

## 🟡 Minor 1 — `discoveryFeaturedSalons` is fully world-readable

```
match /discoveryFeaturedSalons/{salonId} {
  allow read: if true;
  allow write: if isPlatformAdmin();
}
```

Intentional today (anonymous users can browse before auth). Confirm
this matches the post-W36 product intent — particularly when paid
tiers control which salons appear.

---

## 🟡 Minor 2 — `bookingSlotTokens.update: false`

Slot mutex docs are immutable. The current `createBookingAtomically`
uses delete-on-cancel which is correct, but if a future TTL/refresh
path is added (e.g. holding a slot during multi-service checkout),
it will need updates. Document the intentional immutability.

---

## Suggested sequencing

1. **Before W36-A starts** — add the auto-provision Cloud Function
   (Blocker 1 Option A). Single function unlocks ~5 downstream rules.
2. **Alongside W36-A wire-up** — add the customer-owned booking
   update branch (Blocker 2) and customer-owned booking read branch
   (Major 1 fallback).
3. **Alongside W36-A wire-up** — add the marketplace feed rules
   (Blocker 4) since `DiscoverFeedScreen` is on the W36-A list.
4. **Alongside W36-C** — add payments collection rules (Blocker 3).
5. **W36-B social signin** — verify the firstName/lastName invariant
   (Major 3) before merging.

Each rule change should ship with a `__tests__/firestore.rules.test.ts`
case before the implementation lands.

---

## Out of scope for this report

- Storage rules ([storage.rules](storage.rules)) — separate review needed
  before W36-B social-signin avatar uploads.
- Cloud Function authentication for the new HTTPS callable
  endpoints (`paymentsAttachMethod`, `paymentsChargeBooking`,
  `paymentsApplyLoyaltyDiscount`, `customerAutoProvision`) —
  covered in W36-C scaffolding tasks.
- Index review (`firestore.indexes.json`) — none of the new query
  shapes (saved methods by `userId`, charges by `userId`) require
  a new composite index, but verify when W36-C lands.
