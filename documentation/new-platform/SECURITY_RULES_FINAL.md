# Security Rules Final — Week 12

**Status**: ✅ Production-ready  
**Last reviewed**: Week 12 (Task 12.2)  
**Reviewed by**: Zarkili Engineering (via Week 12 security audit)

---

## 1. Coverage Matrix

All Firestore collections now have explicit `match` rules. The catch-all `match /{document=**} { allow read, write: if false; }` at the end provides a final deny for anything not covered.

| Collection | Read | Create | Update | Delete |
|---|---|---|---|---|
| `tenants/{id}` | platform_admin, tenant member | platform_admin | platform_admin, tenant_owner | platform_admin, tenant_owner |
| `tenantUsers/{id}` | platform_admin, self, tenant admin | platform_admin, tenant owner/admin | platform_admin, tenant owner/admin | platform_admin, tenant owner/admin |
| `userProfiles/{userId}` | platform_admin, self | self | self | platform_admin, self |
| `locations/{id}` | tenant member | tenant admin | tenant admin | tenant admin |
| `staff/{id}` | tenant member | tenant admin | tenant admin | tenant admin |
| `services/{id}` | tenant member | tenant admin | tenant admin | tenant admin |
| `bookings/{id}` | tenant member | tenant admin or own client booking | tenant admin | tenant admin |
| `onboardingDrafts/{id}` | self or tenant admin | self | self or tenant admin | tenant admin |
| `staffSchedules/{id}` | tenant admin | tenant admin | tenant admin | tenant admin |
| `userTenantAccess/{id}` | self | self after invite | self or tenant admin | tenant admin |
| `bookingSlotTokens/{id}` | self | client for own booking | tenant admin | tenant admin |
| `discoveryFeaturedSalons/{id}` | any authenticated | platform_admin | platform_admin | platform_admin |
| `platform/config` | any authenticated | — | platform_admin | platform_admin |
| `reviews/{id}` | tenant member | own client (pending_moderation) | tenant admin (moderation only) | platform_admin |
| `tenants/{id}/ratingAggregates/{id}` | tenant member | tenant admin/server | tenant admin/server | tenant admin |
| `tenants/{id}/loyaltyConfig/{id}` | tenant member | tenant admin | tenant admin | tenant admin |
| `tenants/{id}/loyaltyStates/{userId}` | self or tenant admin | tenant admin/server | tenant admin/server | tenant admin |
| `tenants/{id}/loyaltyTransactions/{id}` | self (own txs) or tenant admin | tenant admin/server | tenant admin/server | tenant admin |
| `tenants/{id}/loyaltyIdempotency/{key}` | tenant admin/server | tenant admin/server | tenant admin/server | tenant admin |
| `tenants/{id}/campaigns/{id}` | tenant admin | tenant owner/admin | tenant owner/admin | tenant owner/admin |
| `tenants/{id}/campaignSendLogs/{id}` | tenant admin | server only | server only | tenant admin |
| `tenants/{id}/activities/{id}` | tenant member | tenant owner/admin | tenant owner/admin | tenant owner/admin |
| `tenants/{id}/activityParticipations/{id}` | self or tenant admin | server only | server only | tenant admin |
| `segments/{id}` | platform_admin or owning tenant admin | owning tenant owner/admin | owning tenant owner/admin | owning tenant owner/admin |
| `messages/{id}` | platform_admin, sender, or recipient | server only | server only | platform_admin |
| `waitlist/{id}` | self, tenant admin | own client | tenant admin | self or tenant admin |

---

## 2. Helper Functions

| Function | Purpose |
|---|---|
| `isSignedIn()` | `request.auth != null` |
| `isPlatformAdmin()` | Token `role == 'platform_admin'` |
| `isTenantMember(tenantId)` | User has a doc in `tenantUsers/{tenantId}_{uid}` |
| `tenantRole(tenantId)` | Returns `role` field from the tenantUser doc |
| `hasTenantRole(tenantId, roles)` | Member check + role in allowed set |
| `isTenantAdmin(tenantId)` | Roles: tenant_owner, tenant_admin, location_manager |
| `isTenantOwnerOrAdmin(tenantId)` | Roles: tenant_owner, tenant_admin |
| `tenantScopedReadFromResource()` | `resource.data.tenantId` cross-check + member check |
| `tenantScopedCreateWrite()` | `request.resource.data.tenantId` cross-check + member check |
| `tenantScopedUpdateWrite()` | `tenantId` immutability + member cross-check |

---

## 3. Security Properties Guaranteed

### Tenant Isolation
- No rule allows reading data from a tenant the actor does not belong to.
- `tenantId` is immutable on update for all subcollection documents (enforced by `tenantScopedUpdateWrite`).
- Cross-tenant data leaks are prevented at the rules layer, not only at the app layer.

### Role Escalation Prevention
- `role` field changes to `tenant_owner` can only be made by an existing `tenant_owner`.
- `technician` and `client` roles cannot create/update other members (enforced in `tenantUsers` rules).

### Client Data Isolation
- Clients (`client` role) can:
  - Create their own bookings, reviews (pending_moderation), waitlist entries.
  - Read their own loyalty state and transactions.
  - Read activities/challenges visible to all tenant members.
- Clients cannot:
  - Access analytics, exports, campaigns, staff schedules, or other tenants' data.

### Server-Only Collections
- `loyaltyIdempotency`, `campaignSendLogs`, `messages`, and `activityParticipations` writes are restricted to `platform_admin` or `tenant_admin` (Cloud Functions run with admin SDK, bypassing these rules; server-side only via Admin SDK).

### No Dev Backdoors
- No `allow read, write: if true` rules exist in this ruleset.
- No development-only exceptions that rely on environment flags (which Firestore rules cannot check).

---

## 4. W12-HARDENING Changes

### W12-HARDENING-1 (App Layer)
- **Files**: `src/app/analytics/reportingService.ts`, `src/app/analytics/campaignAnalyticsService.ts`
- **Fix**: Added `actorRole: TenantUserRole` parameter to all 7 reporting methods and 2 campaign analytics methods.
- **Guard**: Returns `{ ok: false, code: "FORBIDDEN" }` for `technician` and `client` roles before any Firestore reads.
- **Tests**: 25 tests covering FORBIDDEN paths added to `reportingService.test.ts` and `campaignAnalyticsService.test.ts`.

### W12-HARDENING-2 (Firestore Rules)
- **File**: `firestore.rules`
- **Added explicit rules** for 11 previously uncovered collections:
  - `tenants/{id}/loyaltyConfig`
  - `tenants/{id}/loyaltyStates`
  - `tenants/{id}/loyaltyTransactions`
  - `tenants/{id}/loyaltyIdempotency`
  - `tenants/{id}/campaigns`
  - `tenants/{id}/campaignSendLogs`
  - `tenants/{id}/activities`
  - `tenants/{id}/activityParticipations`
  - `segments` (top-level)
  - `messages` (top-level)
  - `waitlist` (top-level)
- All rely on existing helper functions — no new logic is introduced.

---

## 5. Known Limitations / Future Work

| Item | Description | Priority |
|---|---|---|
| `staffSchedules` admin-only | Location managers are blocked from reading their own schedules (covered in Week 14 RBAC review) | Low |
| `bookingSlotTokens` expiry | Token expiry is currently app-enforced, not rules-enforced | Low |
| Cloud Functions bypass | All Admin SDK operations bypass these rules; CF authorization is enforced via service-layer role checks | By design |
| Rules simulation tests | Firestore emulator rule tests for loyalty/campaigns to be added in Week 14 | Medium |

---

## 6. Deployment

Rules are in `firestore.rules`. Deploy with:

```bash
firebase deploy --only firestore:rules
```

Verify active rules in Firebase Console → Firestore → Rules.
