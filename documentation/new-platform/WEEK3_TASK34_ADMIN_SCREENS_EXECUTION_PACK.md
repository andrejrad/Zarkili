# Week 3.4 Execution Pack: Staff and Services Admin Screens

## Purpose
This document captures the full execution plan for Week 3 Task 3.4, including:
- activity breakdown
- implementation steps
- copy-paste prompts for implementation and review

This task is intentionally paused until visual design and interaction direction are provided.

## Current Status
- Status: pending design input
- Reason: Task 3.4 is screen-heavy and includes UX decisions for forms, validation messaging, and interaction states that should match final visual direction.

## Task 3.4 Scope (From Week Plan)
1. Staff list/create/edit with location and service assignment.
2. Service list/create/edit with pricing and duration.
3. Add clear validation messages and disabled submit states.
4. Add smoke tests for create/edit flows.

## Activity Breakdown

### Activity A: Design and UX Intake
1. Confirm list density and card/row layout patterns.
2. Confirm create/edit form structure and field grouping.
3. Confirm validation message placement and tone.
4. Confirm disabled submit behavior and loading indicators.
5. Confirm responsive behavior on web/mobile.

Deliverable:
- frozen design and interaction spec for pass 1 implementation

### Activity B: Route and Screen Contracts
1. Add route contracts for:
- Staff list
- Staff create/edit
- Service list
- Service create/edit
2. Keep route guards aligned with authenticated tenant admin paths.
3. Keep deep-link handling safe for missing/invalid entity IDs.

Deliverable:
- stable navigation contracts and route reachability

### Activity C: Screen-Facing Adapters
1. Add app-layer adapters/hooks for staff CRUD interactions.
2. Add app-layer adapters/hooks for service CRUD interactions.
3. Normalize repository errors into UI-safe field/general errors.
4. Isolate screen logic from repository construction details.

Deliverable:
- testable adapters/hooks for all create/edit/list flows

### Activity D: Staff Admin Screens
1. Staff list screen with assignment summaries.
2. Staff create screen with:
- location assignment
- service assignment
- validation feedback
- disabled submit behavior
3. Staff edit screen with update/deactivate actions.

Deliverable:
- functional staff CRUD screens with required state behavior

### Activity E: Services Admin Screens
1. Services list screen.
2. Service create screen with pricing and duration controls.
3. Service edit screen with archive action.
4. Validation and disabled submit behavior on all forms.

Deliverable:
- functional services CRUD screens with required state behavior

### Activity F: Smoke and Quality Gates
1. Add smoke tests for create/edit staff and service flows.
2. Run required commands:
- npm run test:smoke:web
- npm run test:smoke:native
- npm run check

Deliverable:
- verification evidence for all required gates

### Activity G: Tracking and Documentation Closure
1. Update tracking board after gates pass.
2. Document platform scope and any platform-limited fallback.
3. Capture deferred visual polish items.

Deliverable:
- auditable completion and residual-risk notes

## Step-by-Step Execution Sequence
1. Add route contracts for 3.4 screens.
2. Add staff screen adapters/hooks.
3. Add service screen adapters/hooks.
4. Implement staff list/create/edit screens.
5. Implement service list/create/edit screens.
6. Add validation state and disabled submit behavior.
7. Add smoke tests for create/edit flows.
8. Run smoke web, smoke native, and full check.
9. Update tracking board and scope notes.

## Definition of Done for 3.4
1. Staff list/create/edit works with location and service assignments.
2. Service list/create/edit works with pricing and duration fields.
3. Validation messages and disabled submit states are visible and test-covered.
4. Smoke tests exist for create/edit flows.
5. Required verification gates are green.

## Deferred to Design Pass
1. Final visual hierarchy and spacing polish.
2. Microcopy refinement for field and error text.
3. Responsive layout and keyboard interaction polish.
4. Motion and transition polish.

## Copy-Paste Prompt: Implementation (Pass 1)
You are implementing Week 3 Task 3.4 pass 1 in this repository.

Scope for this pass:
1) Route contracts and screen wiring
2) Staff and service CRUD screens
3) Validation messages and disabled submit states
4) Smoke tests for create/edit flows
5) No final visual styling beyond functional clarity

Requirements:
A) Route and navigation contracts
- Add routes for staff list/create/edit and service list/create/edit
- Keep existing auth and tenant guard behavior intact

B) Staff screens
- Implement staff list/create/edit screens
- Create/edit must support location and service assignment
- Add validation messages and disabled submit behavior

C) Service screens
- Implement service list/create/edit screens
- Create/edit must include pricing and duration fields
- Add validation messages and disabled submit behavior

D) Screen-facing logic
- Use app-layer adapters/hooks for repository interaction
- Normalize errors into user-facing validation/general messages

E) Smoke tests
- Add smoke tests for create/edit staff flow
- Add smoke tests for create/edit service flow

F) Verification commands
1. npm run test:smoke:web
2. npm run test:smoke:native
3. npm run check

Output format:
1. exact files changed
2. what was implemented by section A-F
3. test results
4. deferred items explicitly labeled "Deferred to design pass"

## Copy-Paste Prompt: Full Review
Review Week 3 Task 3.4 pass 1 implementation with a strict code-review mindset.

Review scope:
1) route contracts and guards
2) staff screens create/edit/list behavior
3) service screens create/edit/list behavior
4) validation and disabled-submit behavior
5) smoke tests and quality gates

Primary objective:
Identify bugs, regressions, and missing coverage. Do not focus on visual polish.

Checklist:
A) Route and guard safety
- verify route access and deep-link safety
- verify no auth/tenant guard regressions

B) Staff CRUD behavior
- verify assignment inputs and update/deactivate logic
- verify validation and disabled submit state behavior

C) Service CRUD behavior
- verify pricing/duration validation paths
- verify archive/update behavior and state updates

D) Form resilience
- verify duplicate submit prevention
- verify stale loading/error state handling

E) Test quality
- verify smoke tests cover create/edit flows for both staff and services
- identify missing high-risk tests

F) Gates
- confirm outcomes for:
  1. npm run test:smoke:web
  2. npm run test:smoke:native
  3. npm run check

Output format:
1. findings ordered by severity
2. requirement coverage matrix (Complete/Partial/Missing)
3. residual risks
4. go/no-go recommendation

## Copy-Paste Prompt: Fast Daily Review
Review only the latest Week 3.4 change set.

Focus:
1. form validation correctness
2. disabled-submit and loading behavior
3. route and guard regression risk
4. missing tests

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
When design is ready, run implementation prompt first, then full review prompt.
Use fast daily review prompt during iterative commits.
