# Tenants Domain (Week 2.1)

## Purpose
Tenant domain stores the salon-organization root record used by all tenant-scoped modules.

## Model summary
Current model is defined in `src/domains/tenants/model.ts`.

Core fields:
- `tenantId`
- `name`
- `slug`
- `status` (`active | suspended | inactive`)
- `ownerUserId`
- `plan` (`free_trial | starter | professional | enterprise`)
- `country`
- `defaultLanguage` (`en | hr | es`)
- `timezone`
- `branding`
- `settings`
- `createdAt`
- `updatedAt`

## Repository API
Implemented in `src/domains/tenants/repository.ts`.

- `createTenant(tenantId, input)`
  - Validates required input fields.
  - Auto-seeds `defaultLanguage` from market/region (`country`, then `timezone`) when missing.
  - Falls back to English (`en`) when no market/region mapping matches.
  - Fails if tenant document already exists.
- `getTenantById(tenantId)`
  - Returns tenant or `null`.
- `getTenantBySlug(slug)`
  - Returns tenant or `null`.
- `updateTenant(tenantId, input)`
  - Validates patch payload.
  - Fails if tenant does not exist.
- `listActiveTenants()`
  - Returns tenants with `status == active`.

## Validation and safety notes
- Create/update input is validated before persistence.
- Repository surface is deterministic and test-covered with mocked Firestore.
- Tenant-level access control still depends on Firestore rules and caller-level role checks.
- Market/region language seeding currently maps Croatia -> `hr`, Spanish-speaking markets -> `es`, and unknown markets -> `en`.

## Tests
- `src/domains/tenants/__tests__/repository.test.ts`
  - create, get, update, list flows
  - input validation paths
  - duplicate/not-found handling

## Next extension points
- Tenant feature flags and configuration versioning.
- Soft-delete and archival lifecycle metadata.
- Audit metadata (`updatedBy`, `updatedFrom`) once auth identity wiring is finalized.
