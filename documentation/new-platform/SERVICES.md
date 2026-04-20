# Services Domain (Week 3.1)

## Purpose
Services domain stores tenant services with optional location scoping so booking and staff modules can query an active catalog.

## Model summary
Current model is defined in `src/domains/services/model.ts`.

Core fields:
- `serviceId`
- `tenantId`
- `locationIds`
- `name`
- `category`
- `durationMinutes`
- `bufferMinutes`
- `price`
- `currency`
- `active`
- `sortOrder`
- `createdAt`
- `updatedAt`

## Repository API
Implemented in `src/domains/services/repository.ts`.

- `createService(serviceId, input)`
  - validates shape and boundaries
  - fails if service already exists
- `updateService(serviceId, tenantId, input)`
  - validates patch payload and boundaries
  - enforces same-tenant update guard
- `listServicesByTenant(tenantId)`
  - returns active services for tenant
- `listServicesByLocation(tenantId, locationId)`
  - returns active services for tenant filtered by location mapping
- `archiveService(serviceId, tenantId)`
  - enforces same-tenant guard
  - sets `active` to `false`

## Validation boundaries
- `durationMinutes`: integer between 5 and 480
- `bufferMinutes`: integer between 0 and 120
- `price`: numeric between 0 and 10000
- `sortOrder`: non-negative integer

## Tenant safety notes
- All write methods require tenant context.
- Cross-tenant update/archive attempts are rejected by repository guard checks.
- Firestore rules still enforce tenant boundaries server-side.

## Tests
- `src/domains/services/__tests__/repository.test.ts`
  - create/update/list/archive flows
  - price and duration boundary validation
  - location-filtered retrieval
  - cross-tenant mutation denial

## Known limitations and follow-up
- Currency code normalization and localization formatting are out of current scope.
- Service package/add-on modeling will be added in later iterations.
- Advanced pricing rules (tiered pricing, member pricing) are out of current scope.
