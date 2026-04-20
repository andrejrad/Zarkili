# Week 2.5 Execution Pack: Discover Directory Scaffold

## Purpose
This document captures the full execution plan for Week 2 Task 2.5, including:
- activity breakdown
- implementation steps
- copy-paste prompts for implementation and review

This task is intentionally paused until visual design and discovery UX direction are provided.

## Current Status
- Status: pending design input
- Reason: Task 2.5 includes marketplace-facing list, card, and booking CTA behavior that should align with final visual and interaction design to avoid churn.

## Task 2.5 Scope (From Week Plan)
1. Add DiscoverBusinessesScreen with search input, filter chips (category, city), and empty/loading/error states.
2. Use mocked repository data for now (no production marketplace backend yet).
3. Add tenant-card UI fields: businessName, category, city, rating, heroImageUrl, bookingEnabled.
4. Add navigation from Landing to DiscoverBusinessesScreen.
5. Add Book button behavior:
- if bookingEnabled true: navigate to tenant public profile placeholder
- if bookingEnabled false: show Coming soon state
6. Keep implementation isolated under a discovery domain so it can evolve into full marketplace later.
7. Add docs in documentation/new-platform/DISCOVERY_SCAFFOLD.md with extension plan for real marketplace integration.

## Activity Breakdown

### Activity A: Design and Interaction Intake
1. Confirm discovery visual direction for search, chips, and card hierarchy.
2. Confirm card density and media behavior for mobile and web.
3. Confirm Book CTA states and disabled/coming-soon language.
4. Confirm target route behavior for tenant public profile placeholder.

Deliverable:
- frozen visual and interaction input for 2.5 build pass

### Activity B: Discovery Domain Contracts
1. Create isolated discovery domain module.
2. Define mocked entity contract for business cards.
3. Add mocked repository methods for:
- list businesses
- filter by query/category/city
4. Keep repository interface ready for later Firestore/API swap.

Deliverable:
- discovery domain with mocked data contract and adapter-ready interface

### Activity C: Discover Screen Scaffold
1. Build DiscoverBusinessesScreen with:
- search input
- category chips
- city chips
- loading state
- empty state
- error state
2. Render tenant cards using required fields:
- businessName
- category
- city
- rating
- heroImageUrl
- bookingEnabled

Deliverable:
- functional Discover screen with mocked data and required states

### Activity D: Navigation and Booking CTA
1. Ensure Landing navigates to DiscoverBusinessesScreen.
2. Add Book button behavior per card:
- bookingEnabled true -> navigate to tenant public profile placeholder route
- bookingEnabled false -> show coming-soon state/message
3. Keep behavior deterministic and testable.

Deliverable:
- complete 2.5 interaction loop from landing into discovery and booking CTA handling

### Activity E: Test and Gate Coverage
1. Add tests for:
- screen rendering
- search and chip filter behavior
- empty/loading/error states
- bookingEnabled true/false button behavior
- landing to discover navigation path
2. Run required gates:
- npm run test:smoke:web
- npm run test:smoke:native
- npm run check

Deliverable:
- green verification evidence for 2.5 scaffold

### Activity F: Documentation and Tracking Closure
1. Create documentation/new-platform/DISCOVERY_SCAFFOLD.md.
2. Document mocked contract and migration plan to Firestore/API.
3. Update tracking board after all checks pass.

Deliverable:
- auditable closure trail with extension plan

## Step-by-Step Execution Sequence
1. Add discovery domain folder and types.
2. Add mocked discovery repository and fixture data.
3. Add discovery app-layer hook/adapter for screen consumption.
4. Add DiscoverBusinessesScreen with search/chips/list states.
5. Add tenant public profile placeholder route and screen stub.
6. Wire Landing to DiscoverBusinessesScreen.
7. Wire Book button behavior for bookingEnabled true/false.
8. Add tests for states, filters, and CTA behavior.
9. Run smoke web, smoke native, and full check.
10. Add DISCOVERY_SCAFFOLD.md.
11. Update tracking board with completion evidence.

## Definition of Done for 2.5
1. Discover screen has search and category/city filter chips.
2. Required card fields are rendered from mocked data contract.
3. Empty/loading/error states are present and tested.
4. Book CTA behavior matches bookingEnabled true/false requirements.
5. Discovery implementation is isolated under discovery domain.
6. DISCOVERY_SCAFFOLD.md exists with migration plan.
7. Required gates pass and are recorded.

## Deferred to Design Pass
1. Final visual card polish and responsive layout tuning.
2. Advanced list performance and image loading strategy.
3. Final marketplace tone and microcopy refinements.
4. A/B-ready ranking and sorting presentation options.

## Copy-Paste Prompt: Implementation (Pass 1)
You are implementing Week 2 Task 2.5 pass 1 in this repository.

Scope for this pass:
1) Discovery domain scaffolding and mocked repository contract
2) DiscoverBusinessesScreen with search/chip/filter and state handling
3) Landing navigation and Book CTA behavior
4) No final visual styling

Requirements:
A) Discovery domain isolation
- Add isolated discovery module under src
- Define business card contract fields:
  - businessName, category, city, rating, heroImageUrl, bookingEnabled
- Add mocked repository data and list/filter methods

B) Discover screen scaffold
- Add DiscoverBusinessesScreen component
- Include search input
- Include filter chips for category and city
- Include loading, empty, and error states
- Render cards using mocked repository data

C) Navigation and CTA behavior
- Ensure Landing route navigates to DiscoverBusinessesScreen
- Add Book button per business card:
  - bookingEnabled true: navigate to tenant public profile placeholder route
  - bookingEnabled false: show coming-soon state/message

D) Placeholder target route
- Add tenant public profile placeholder route/screen for bookingEnabled true path
- Keep it simple and clearly labeled placeholder

E) Tests
- Add behavior tests for:
  1. landing to discover navigation
  2. search and chip filtering behavior
  3. loading/empty/error state rendering
  4. bookingEnabled false shows coming-soon
  5. bookingEnabled true navigates to placeholder route

F) Verification commands
1. npm run test:smoke:web
2. npm run test:smoke:native
3. npm run check

G) Documentation
- Add documentation/new-platform/DISCOVERY_SCAFFOLD.md
- Include mocked contract and migration plan to Firestore/API

Output format:
1. exact files changed
2. what was implemented by section A-G
3. test results
4. explicit deferred items labeled "Deferred to design pass"

## Copy-Paste Prompt: Full Review
Review Week 2 Task 2.5 pass 1 implementation with a strict code-review mindset.

Review scope:
1) discovery domain isolation and mocked repository contract
2) DiscoverBusinessesScreen behavior
3) navigation and Book CTA behavior
4) tests and gate coverage
5) documentation completeness

Primary objective:
Identify bugs, regressions, and missing coverage. Do not focus on visual polish.

Checklist:
A) Domain isolation and contract quality
- Verify discovery code is isolated and not spread across unrelated domains
- Confirm mocked business contract includes all required fields
- Confirm repository abstraction supports later Firestore/API migration

B) Discover screen behavior
- Confirm search and category/city chips work correctly
- Confirm loading/empty/error states exist and are reachable
- Confirm card fields render correctly and safely

C) Navigation and CTA behavior
- Confirm Landing to Discover path works
- Confirm Book CTA:
  - bookingEnabled true navigates to tenant public profile placeholder
  - bookingEnabled false shows coming-soon behavior

D) Regression and safety checks
- Ensure existing public/protected route behavior is not regressed
- Ensure no accidental auth bypass in new placeholder routes

E) Test quality and gaps
- Confirm tests for navigation, filters, states, and CTA behavior
- Identify missing high-risk tests (rapid filter changes, duplicate presses, stale data)

F) Quality gates
- Confirm outcomes for:
  1. npm run test:smoke:web
  2. npm run test:smoke:native
  3. npm run check

G) Documentation quality
- Confirm documentation/new-platform/DISCOVERY_SCAFFOLD.md exists
- Confirm extension plan is actionable for migration to Firestore/API

Output format:
1. findings ordered by severity
2. requirement coverage matrix (Complete/Partial/Missing)
3. residual risks
4. go/no-go recommendation

## Copy-Paste Prompt: Fast Daily Review
Review only the latest Week 2.5 change set.

Focus:
1. search/filter correctness
2. bookingEnabled CTA behavior correctness
3. route safety and regression risk
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
When visual design is ready, run implementation prompt first, then full review prompt.
Use fast daily review prompt during iterative commits.
