# Locations Domain (Week 2.3)

## Purpose
Locations domain stores physical salon locations under a tenant, including address and operating hours.

## Model summary
Current model is defined in `src/domains/locations/model.ts`.

Core fields:
- `locationId`
- `tenantId`
- `name`
- `code`
- `status` (`active | inactive`)
- `timezone`
- `address`
- `operatingHours`
- `createdAt`
- `updatedAt`

## Repository API
Implemented in `src/domains/locations/repository.ts`.

- `createLocation(locationId, input)`
  - Validates required shape.
  - Fails if location already exists.
- `getLocationById(locationId)`
  - Returns location or `null`.
- `listTenantLocations(tenantId)`
  - Returns active locations for tenant.
- `updateLocation(locationId, tenantId, input)`
  - Validates patch payload.
  - Enforces same-tenant update guard.
- `deactivateLocation(locationId, tenantId)`
  - Enforces same-tenant guard and sets status to inactive.

## Tenant safety notes
- Every write path requires tenant context.
- Cross-tenant mutation attempts are rejected by repository guard checks.
- Firestore rules must still enforce tenant boundary server-side.

## Tests
- `src/domains/locations/__tests__/repository.test.ts`
  - tenant-scoped retrieval
  - create/update/deactivate paths
  - cross-tenant mutation denial
  - input validation paths

## Known limitations and follow-up
- Operating-hours overlap and timezone conversions are not validated yet.
- Holiday calendars and temporary closures are out of current scope.
- Geo-search indexing strategy will be added when discovery backend moves beyond mock data.
