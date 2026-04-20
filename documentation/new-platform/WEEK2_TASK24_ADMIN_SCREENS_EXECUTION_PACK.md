# Week 2.4 Execution Pack: Tenant and Location Admin Screens

## Purpose
This document captures the full execution plan for Week 2 Task 2.4, including:
- activity breakdown
- implementation steps
- copy-paste prompts for implementation and review

This task is intentionally paused until visual design is provided.

## Current Status
- Status: pending design input
- Reason: Task 2.4 includes screen UX behavior and presentation decisions that should align with final visual direction to avoid rework.

## Task 2.4 Scope (From Week Plan)
1. Add list and create forms for locations under current tenant.
2. Add tenant profile screen for branding/settings display only.
3. Use simple components with clear empty/error/loading states.
4. Wire to repositories from Week 2 tasks.
5. Add smoke tests for screen rendering and submit actions.

## Activity Breakdown

### Activity A: Design Intake
1. Confirm visual patterns for form layout and list rows.
2. Confirm typography, spacing, and state component patterns.
3. Confirm validation message style and placement.
4. Confirm mobile and web responsiveness expectations.

Deliverable:
- frozen input for 2.4 build pass

### Activity B: Route and Navigation Contracts
1. Add route entries for:
- TenantProfile
- TenantLocations
- CreateLocation
2. Keep route guards aligned with authenticated access rules.
3. Preserve existing route resolution behavior for unauthorized/not-found paths.

Deliverable:
- route skeleton and in-app reachability

### Activity C: Screen-Facing Logic Adapters
1. Add app-layer adapters/hooks for:
- tenant profile read (display-only)
- location list read (tenant-scoped)
- location create submit
2. Normalize repository errors into UI-safe messages.
3. Keep adapters injectable/testable.

Deliverable:
- isolated UI logic layer, independent from final visuals

### Activity D: Placeholder Screen Implementation
1. TenantProfileScreen
- read-only branding + settings summary
- loading and error states
2. TenantLocationsScreen
- locations list for active tenant
- empty, loading, error states
- entry point to create form
3. CreateLocationScreen
- minimal create form
- client-side required-field checks
- submit/loading/success/error behavior

Deliverable:
- functionally complete placeholder screens, style-light

### Activity E: Testing and Gates
1. Add or extend tests for:
- route presence and access behavior
- hook/adapter success and error paths
- create submit payload and outcome behavior
2. Run required gates:
- npm run test:smoke:web
- npm run test:smoke:native
- npm run check

Deliverable:
- green verification with explicit evidence

### Activity F: Tracking and Documentation Closure
1. Update tracking board after all gates pass.
2. Record platform scope and any platform-limited behavior.
3. Capture deferred items to design pass.

Deliverable:
- auditable completion trail

## Step-by-Step Execution Sequence
1. Update route skeleton and guard contracts.
2. Wire temporary entry points in app shell navigation.
3. Add tenant profile hook/adapter.
4. Add location list hook/adapter.
5. Add create location hook/adapter.
6. Implement TenantProfileScreen (display-only).
7. Implement TenantLocationsScreen (list/empty/error/loading).
8. Implement CreateLocationScreen (form/submit/errors).
9. Add tests for routing, hooks, and create flow.
10. Run smoke web, smoke native, and full check.
11. Update tracking documentation.

## Definition of Done for 2.4
1. Tenant profile is visible and display-only.
2. Locations list/create works under current tenant context.
3. Loading, empty, and error states are implemented and test-covered.
4. Required smoke and quality gates are green.
5. Tracking docs reflect completion with verification evidence.

## Deferred to Design Pass
1. Final visual styling and token alignment.
2. Detailed interaction microcopy tuning.
3. Layout polish and responsive refinements.
4. Animation and motion polish.

## Copy-Paste Prompt: Implementation (Pass 1)
You are implementing Week 2 Task 2.4 pass 1 in this repository.

Scope for this pass:
1) Route skeleton plus navigation contracts
2) Screen-facing adapters/hooks only
3) Placeholder screens with functional states
4) No final visual styling

Requirements:
A) Route skeleton
- Update src/app/navigation/routes.ts
- Add authenticated routes for TenantProfile, TenantLocations, CreateLocation
- Keep existing guard behavior unchanged for authenticated routes

B) App shell wiring
- Update src/app/navigation/AppNavigatorShell.tsx
- Add temporary entry points so routes are reachable in-app
- Do not regress Owner AI budget behavior

C) Screen-facing adapters/hooks
- Add app-layer hooks/services for:
  1. Tenant profile read (branding/settings display data)
  2. Location list for current tenant
  3. Location create submit
- Reuse domain repositories from:
  - src/domains/tenants/repository.ts
  - src/domains/locations/repository.ts
- Normalize domain errors to UI-safe messages in hooks

D) Placeholder screens
- Add TenantProfileScreen, TenantLocationsScreen, CreateLocationScreen
- Include loading/empty/error states where relevant
- Keep UI intentionally plain for now

E) Tests
- Add behavior tests for:
  1. Route presence/access
  2. Adapter/hook success path
  3. Adapter/hook error path
  4. Create submit payload behavior

F) Verification commands
1. npm run test:smoke:web
2. npm run test:smoke:native
3. npm run check

Output format:
1. exact files changed
2. what was implemented by section A-F
3. test results
4. explicit deferred items labeled "Deferred to design pass"

## Copy-Paste Prompt: Full Review
Review Week 2 Task 2.4 pass 1 implementation in this repository with code-review mindset.

Review scope:
1) Route skeleton and navigation contracts
2) App shell wiring
3) Screen-facing adapters/hooks
4) Placeholder screens
5) Tests and verification gates

Primary objective:
Find bugs, regressions, and missing coverage. Do not focus on visual polish.

Checklist:
A) Routing and guard correctness
- Confirm routes for TenantProfile, TenantLocations, CreateLocation
- Verify authenticated guard behavior
- Validate deep-link unauthorized/not-found handling

B) App shell integration safety
- Ensure new entry points are reachable
- Ensure Owner AI budget behavior is not broken

C) Adapter/hook correctness
- Verify repository usage is correct and tenant-scoped
- Verify error normalization does not leak low-level exceptions
- Check for loading/race/unhandled rejection issues

D) Placeholder screen behavior
- Confirm loading/empty/error states
- Confirm create submit validates and handles success/failure

E) Tenant isolation and authorization
- Check no cross-tenant assumptions are introduced

F) Test quality and gaps
- Confirm route, hook success/error, and create submit tests exist
- Identify missing high-risk behavior tests

G) Quality gates
- Confirm outcomes for:
  1. npm run test:smoke:web
  2. npm run test:smoke:native
  3. npm run check

Output format:
1. findings ordered by severity
2. requirement coverage matrix (Complete/Partial/Missing)
3. residual risks
4. go/no-go recommendation

## Copy-Paste Prompt: Fast Daily Review
Review only the latest Week 2.4 change set.

Focus:
1. regression risk in routes and guards
2. tenant-scoping correctness
3. create-location submit and error behavior
4. test gap callouts

Return:
1. critical/high findings first
2. 3-item risk summary
3. exact missing tests to add next

## Verification Command Pack
Run in order:
1. npm run test:smoke:web
2. npm run test:smoke:native
3. npm run check

## Owner Notes
When visual design is ready, run implementation prompt first, then full review prompt.
Use fast daily review prompt during iterative commits.
