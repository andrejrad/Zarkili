# User Tenant Access Index (Week 2.2.5)

## Purpose
`userTenantAccess` is a denormalized collection for fast multi-salon access queries.

Primary goals:
- fast "list all tenants for user" query
- fast "list tenant users" query
- lightweight badge/read counters for dashboard indicators

## Collection and document key
- Collection: `userTenantAccess`
- Document id: `userId_tenantId`

## Fields
- `userId`
- `tenantId`
- `accessLevel`
- `subscriptionStatus`
- `subscribedAt`
- `unreadMessageCount`
- `lastMessageAt`
- `lastAccessedAt`
- `status`
- `updatedAt`

## Repository API
Implemented in `src/domains/tenants/userTenantAccessRepository.ts`.

- `createUserTenantAccess(input)`
- `updateUnreadMessageCount(userId, tenantId, unreadMessageCount, lastMessageAt)`
- `getUserTenants(userId)`
- `getTenantUsers(tenantId)`
- `deactivateUserTenantAccess(userId, tenantId)`

## Sync requirements (critical)
`userTenantAccess` must stay in sync with `tenantUsers` for these events:

1. Tenant membership created:
- create corresponding `userTenantAccess` document
- map role -> accessLevel
- mirror current subscription status and start date

2. Membership deactivated:
- set `userTenantAccess.status` to `inactive`

3. Subscription status change:
- mirror latest status into `userTenantAccess.subscriptionStatus`

4. Role change that affects privilege label:
- update `accessLevel` according to mapped role

## Current sync service
- `src/domains/tenants/tenantAccessSyncService.ts`
- Current operation implemented:
  - `assignUserAndCreateAccess`

## Tests
- `src/domains/tenants/__tests__/userTenantAccessRepository.test.ts`
- `src/domains/tenants/__tests__/tenantAccessSyncService.test.ts`

## Follow-up
- Add transactional/batch synchronization for updates (role/subscription/deactivation).
- Add consistency audit job for mismatch detection between `tenantUsers` and `userTenantAccess`.
