# Staff Domain (Week 3.2)

## Purpose
Staff domain stores tenant team members mapped to locations and service qualifications for scheduling and service assignment flows.

## Model summary
Current model is defined in `src/domains/staff/model.ts`.

Core fields:
- `staffId`
- `tenantId`
- `locationIds`
- `userId`
- `displayName`
- `role`
- `status`
- `skills`
- `serviceIds`
- `constraints`
- `createdAt`
- `updatedAt`

## Repository API
Implemented in `src/domains/staff/repository.ts`.

- `createStaff(staffId, input)`
  - validates required shape
  - fails if staff member already exists
- `updateStaff(staffId, tenantId, input)`
  - validates patch payload
  - enforces same-tenant update guard
- `listLocationStaff(tenantId, locationId)`
  - returns active staff mapped to location under tenant
- `listServiceQualifiedStaff(tenantId, locationId, serviceId)`
  - returns active staff mapped to location and qualified for service
- `deactivateStaff(staffId, tenantId)`
  - enforces same-tenant guard and sets status to inactive

## Validation and safety notes
- `locationIds`, `skills`, and `serviceIds` must be string arrays without blank entries.
- `role` must be one of: `owner`, `manager`, `technician`, `assistant`.
- `status` must be one of: `active`, `inactive`.
- `constraints` must be an array of key/value objects.
- Cross-tenant update/deactivation attempts are rejected.

## Tests
- `src/domains/staff/__tests__/repository.test.ts`
  - create/update/list/deactivate behavior
  - service qualification filtering behavior
  - cross-tenant mutation denial
  - input validation paths

## Known limitations and follow-up
- Constraint schema is intentionally generic and will be hardened with scheduling requirements in Week 3.3.
- Skill taxonomy normalization is out of current scope.
- Staff availability templates are implemented in the staff schedules milestone.
