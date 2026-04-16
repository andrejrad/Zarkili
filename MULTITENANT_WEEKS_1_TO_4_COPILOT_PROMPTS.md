# Multi-Tenant Build Prompts for Weeks 1-4

## How to Use This Document
- Copy one prompt block at a time into Copilot Chat in VS Code.
- Run prompts in order.
- Do not combine multiple implementation prompts in one run.
- After each build prompt, run the matching review prompt.

Prompting assumptions:
- Copilot is implementation developer
- You are prompt engineer and reviewer
- Target stack is React Native + Expo + Firebase

---

## Global Guardrails Prompt (Run Once First)
Use this before Week 1 Task 1.

Prompt:
You are implementing a multi-tenant salon platform in this repository. Follow these rules in every change:
1. Every domain document must include tenantId unless explicitly global.
2. No cross-tenant reads or writes are allowed.
3. Firestore rules must enforce tenant and role scoping.
4. Every data-layer change must include test coverage and index updates where needed.
5. Keep changes modular by domain: auth, tenants, locations, staff, services, bookings.
6. Update documentation after each completed task.
7. Do not modify unrelated files.
Return:
- exact files changed
- what was implemented
- tests added
- commands to verify locally

---

## Week 1 - Foundation and Repo Setup

## Task 1.1 - Baseline Folder Architecture
Prompt:
Create baseline architecture for a new multi-tenant app in this repository.
Requirements:
1. Add folder structure under src for app providers, navigation, shared, and domains.
2. Add placeholder index files for each domain: auth, tenants, locations, staff, services, bookings.
3. Add shared utils and shared config placeholders.
4. Do not break current app runtime.
5. Add a short architecture note in Documentation/new-platform/ARCHITECTURE_OVERVIEW.md.
Return:
- created folders/files
- rationale for the structure
- next recommended task

Review prompt:
Review only the newly created architecture scaffolding for maintainability and domain separation risks. Identify missing folders for future modules like waitlist, messages, loyalty, campaigns, reviews, and analytics.

## Task 1.2 - App Provider Shell
Prompt:
Implement provider shell for the new multi-tenant runtime.
Requirements:
1. Add providers for Auth, Tenant, Theme, and Language in src/app/providers.
2. Provider composition order should be Auth -> Tenant -> Theme -> Language.
3. Expose minimal typed interfaces for each provider value.
4. Keep provider state isolated and testable.
5. Add unit tests for default provider behavior.
Return:
- files created/updated
- provider contracts
- test results

Review prompt:
Review provider composition and identify state-coupling or context-overuse risks. Suggest improvements without changing public contracts.

## Task 1.3 - Environment and Firebase Bootstrap
Prompt:
Set up multi-tenant Firebase bootstrap for dev and prod with safe defaults.
Requirements:
1. Add config abstraction for Firebase env selection.
2. Ensure no hardcoded secrets are committed.
3. Add startup validation that reports missing env values clearly.
4. Add docs for local setup in Documentation/new-platform/ENV_SETUP.md.
5. Add tests for config parsing behavior.
Return:
- config files
- env keys expected
- verification steps

Review prompt:
Review Firebase bootstrap for security and misconfiguration risk. Check that failure modes are explicit and developer-friendly.

## Task 1.4 - CI Quality Baseline
Prompt:
Create CI quality baseline for lint, test, and type checks.
Requirements:
1. Add scripts for lint, test, and check.
2. Add GitHub workflow to run checks on pull requests.
3. Add failure-fast behavior and cache dependencies.
4. Add contributing note for local pre-PR checks.
Return:
- workflow file and scripts
- how to run checks locally

Review prompt:
Review CI pipeline for gaps in reliability and speed. Suggest practical optimizations for dependency caching and test partitioning.

## Task 1.5 - Public Landing Shell and Route Groups
Prompt:
Implement a public-first app shell that starts at a landing page before authentication.
Requirements:
1. Add route groups: Public routes and Protected routes.
2. Public routes must include: Landing, Login, Register.
3. Protected routes must include the authenticated app shell only.
4. Landing screen must include clear CTA buttons: "Login", "Create Account", and "Discover Businesses" (placeholder target for future marketplace).
5. Add feature flag `marketplaceEnabled` (default false). Keep Discover CTA visible but route to placeholder screen when false.
6. Do not implement marketplace data yet; only scaffold entry points and navigation contracts.
7. Add a short note in Documentation/new-platform/NAVIGATION_PUBLIC_PROTECTED.md describing guard behavior.
Return:
- files changed
- route map (Public vs Protected)
- guard logic summary

Review prompt:
Review public/protected routing and auth-guard behavior for bypass risk, dead-end flows, and poor deep-link handling.

---

## Week 2 - Tenant and Location Core

## Task 2.1 - Tenant Domain Models and Repositories
Prompt:
Implement tenant domain v1 with repository pattern.
Requirements:
1. Create tenant model with fields: name, slug, status, ownerUserId, plan, timezone, branding, settings, createdAt, updatedAt.
2. Add tenant repository methods: createTenant, getTenantById, getTenantBySlug, updateTenant, listActiveTenants.
3. All methods must validate tenant payload shape.
4. Add tests for repository methods with mocked Firestore.
5. Add docs in Documentation/new-platform/TENANTS.md.
Return:
- files changed
- repository API summary
- test coverage summary

Review prompt:
Review tenant model and repository methods for future extensibility and migration safety.

## Task 2.2 - Tenant User Role Mapping
Prompt:
Implement tenantUsers collection access layer.
Requirements:
1. Add model for tenantUsers with role and permissions.
2. Add repository methods: assignUserToTenant, updateTenantUserRole, listTenantUsers, getUserTenantRoles.
3. Include role enum: tenant_owner, tenant_admin, location_manager, technician, client.
4. Add guards that prevent invalid role transitions.
5. Add unit tests for role transition rules.
Return:
- files changed
- role transition matrix used

Review prompt:
Review role mapping logic for privilege escalation risks and missing invariants.

## Task 2.3 - Location Domain
Prompt:
Implement locations domain with tenant scoping.
Requirements:
1. Create location model including operatingHours and address.
2. Add repository methods: createLocation, updateLocation, listTenantLocations, deactivateLocation.
3. Every location read/write must require tenantId.
4. Add tests for tenant-scoped query behavior.
5. Add docs in Documentation/new-platform/LOCATIONS.md.
Return:
- files changed
- location API summary

Review prompt:
Review location domain for timezone handling risk and poor assumptions around operating hours.

## Task 2.4 - Tenant and Location Admin Screens (Basic)
Prompt:
Create basic admin screens for tenants and locations using placeholder UI.
Requirements:
1. Add list and create forms for locations under current tenant.
2. Add tenant profile screen for branding/settings display only (edit later).
3. Use simple components with clear empty/error/loading states.
4. Wire to repositories from Week 2 tasks.
5. Add smoke tests for screen rendering and submit actions.
Return:
- files changed
- navigation updates
- test summary

Review prompt:
Review new admin screens for UX clarity and validation coverage. Identify missing edge states.

## Task 2.5 - Discover Directory Scaffold (Marketplace-Ready Entry)
Prompt:
Create a marketplace-ready discovery scaffold reachable from the public landing page.
Requirements:
1. Add `DiscoverBusinessesScreen` with search input, filter chips (category, city), and empty/loading/error states.
2. Use mocked repository data for now (no production marketplace backend yet).
3. Add tenant-card UI fields: businessName, category, city, rating, heroImageUrl, bookingEnabled.
4. Add navigation from Landing -> DiscoverBusinessesScreen.
5. Add "Book" button behavior:
	- if bookingEnabled true: navigate to tenant public profile placeholder
	- if bookingEnabled false: show "Coming soon" state
6. Keep implementation isolated under a `discovery` domain so it can evolve into full marketplace later.
7. Add docs in Documentation/new-platform/DISCOVERY_SCAFFOLD.md with extension plan for real marketplace integration.
Return:
- files changed
- discovery domain structure
- mocked data contract

Review prompt:
Review discovery scaffold for future extensibility, performance risk in list rendering, and migration readiness from mocked data to Firestore/API.

---

## Week 3 - Service and Staff Modules

## Task 3.1 - Services Domain v1
Prompt:
Implement services domain with tenant and optional location scoping.
Requirements:
1. Service model fields: tenantId, locationIds, name, category, durationMinutes, bufferMinutes, price, currency, active, sortOrder.
2. Repository methods: createService, updateService, listServicesByTenant, listServicesByLocation, archiveService.
3. Add validation for price and duration boundaries.
4. Add tests for location-filtered service retrieval.
5. Add docs in Documentation/new-platform/SERVICES.md.
Return:
- files changed
- repository contract

Review prompt:
Review service design for pricing flexibility and future support for packages/add-ons.

## Task 3.2 - Staff Domain v1
Prompt:
Implement staff domain and tenant/location mapping.
Requirements:
1. Staff model fields: tenantId, locationIds, userId, displayName, role, status, skills, serviceIds, constraints.
2. Repository methods: createStaff, updateStaff, listLocationStaff, listServiceQualifiedStaff, deactivateStaff.
3. Add tests for service qualification filtering.
4. Add docs in Documentation/new-platform/STAFF.md.
Return:
- files changed
- API summary

Review prompt:
Review staff domain for scheduling readiness and data normalization gaps.

## Task 3.3 - Staff Schedule Templates
Prompt:
Implement staffSchedules model and repository.
Requirements:
1. Model fields: tenantId, staffId, locationId, weekTemplate, exceptions, updatedAt.
2. Repository methods: upsertScheduleTemplate, getScheduleTemplate, addException, removeException.
3. Validate time block overlap and malformed ranges.
4. Add tests for overlap detection.
5. Add docs in Documentation/new-platform/STAFF_SCHEDULES.md.
Return:
- files changed
- overlap algorithm summary

Review prompt:
Review schedule template implementation for edge cases around midnight spans and timezone assumptions.

## Task 3.4 - Staff and Services Admin Screens
Prompt:
Create staff and service admin management screens with CRUD actions.
Requirements:
1. Staff list/create/edit with location and service assignment.
2. Service list/create/edit with pricing and duration.
3. Add clear validation messages and disabled submit states.
4. Add smoke tests for create/edit flows.
Return:
- files changed
- key UI interactions

Review prompt:
Review admin screens for usability risks and missing guardrails for invalid assignments.

---

## Week 4 - Scheduling Engine v1

## Task 4.1 - Slot Generation Utility
Prompt:
Implement slot generation utility for technician scheduling.
Requirements:
1. Inputs: staff schedule template, date, existing bookings, service duration, buffer.
2. Output: available slots with startTime/endTime.
3. Respect operating hours, schedule blocks, exceptions, and existing bookings.
4. Add deterministic tests covering normal and edge scenarios.
5. Add docs in Documentation/new-platform/SLOT_ENGINE.md.
Return:
- files changed
- slot generation algorithm overview
- test cases implemented

Review prompt:
Review slot algorithm for race conditions and hidden assumptions. Highlight complexity hotspots.

## Task 4.2 - Conflict Detection and Atomic Booking Guard
Prompt:
Implement conflict detection service with atomic write strategy.
Requirements:
1. Add booking conflict checker based on overlap windows.
2. Add server-side atomic create strategy (transaction or equivalent).
3. Return clear error codes for slot unavailable and invalid state.
4. Add tests simulating concurrent booking attempts.
Return:
- files changed
- concurrency strategy used
- test evidence

Review prompt:
Review atomic booking implementation for concurrency safety and retry behavior.

## Task 4.3 - Schedule Calendar UI v1
Prompt:
Implement schedule calendar v1 for admin and client booking flow.
Requirements:
1. Admin view: day/week with occupancy indicators.
2. Client view: date and staff selection, then available slots.
3. Keep UI simple but production-safe.
4. Handle loading, empty, and failure states.
5. Add smoke tests for rendering and slot selection.
Return:
- files changed
- navigation or state flow updates

Review prompt:
Review schedule UI for interaction risks and mismatch with slot engine constraints.

## Task 4.4 - End-to-End Week 4 Hardening
Prompt:
Harden Week 4 deliverables with integration tests and docs.
Requirements:
1. Add integration test for full flow: pick location -> pick staff -> pick service -> get slots -> reserve slot.
2. Add integration test for race collision path.
3. Update Documentation/new-platform/WEEK4_VALIDATION.md with test checklist.
4. Report unresolved technical debt explicitly.
Return:
- files changed
- integration tests added
- known gaps list

Review prompt:
Perform code review mindset on Week 4 implementation. Prioritize data correctness and race-condition risks with severity labels.

---

## Security Prompt Pack (Run at End of Each Week)
Prompt:
Audit all changes from this week for tenant isolation and role authorization bugs.
Check:
1. Missing tenantId on any persisted domain document
2. Tenant filters missing in read queries
3. Role checks missing on write operations
4. Firestore rules not matching repository behavior
5. Sensitive operations without audit logs
Return findings ordered by severity with exact file paths and remediation suggestions.

---

## Documentation Prompt Pack (Run at End of Each Week)
Prompt:
Update Documentation/new-platform with weekly summary.
Include:
1. Features completed
2. Files/modules added
3. Open issues and known limitations
4. Next week prerequisites
5. Validation checklist and test outcomes
Do not rewrite previous weeks. Append only current week details.

---

## Weekly Acceptance Checklist
Use this at end of each week.

Week close prompt:
Produce a week-close report from current repository state.
Include:
1. Completed tasks vs planned tasks
2. Tests passing/failing and why
3. Security rule changes made
4. Indexes added/changed
5. Documentation updated
6. Blockers for next week
Return concise actionable summary only.

---

## Suggested Working Rhythm in VS Code
- Day start: run current task prompt
- Mid-day: run review prompt for that task
- Day end: run security prompt pack on day diff
- Week end: run documentation prompt pack + week close prompt

This cadence keeps Copilot output controlled, reviewable, and production-oriented.
