# Documentation Command Center

## Why This Exists
This is the single entry point for all project documentation.
Use it to understand what each document is, how documents connect, when to use them, and in what order.

If you only open one file first, open this one.

---

## Fast Start Paths (Choose One)

### Path A: New Session Kickoff (15-25 min)
1. MULTITENANT_MASTER_INDEX.md
2. MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md
3. MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md
4. PROGRAM_TRACKING_BOARD.md

### Path B: Coding Today (Execution-first)
1. PROGRAM_TRACKING_BOARD.md
2. MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md or the week pack in scope
3. DAY1_DEVELOPMENT_CHECKLIST.md (if foundational tasks)
4. new-platform execution pack for blocked/in-progress slice

### Path C: Design to Development Handoff
1. AI_FIRST_GENZ_DESIGN_PLAYBOOK.md
2. FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md
3. VALIDATION_CYCLE_SLICE1_MOCK.md
4. PROGRAM_TRACKING_BOARD.md (create/advance card)

### Path D: Product Feature Clarification
1. Relevant feature spec (onboarding, payment, marketplace, loyalty, AI)
2. MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md
3. MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md
4. Relevant week prompt pack

---

## Document System Map

### Layer 1: Program Control (What are we doing now?)
- PROGRAM_TRACKING_BOARD.md
- PROJECT_GANTT_AGILE_PLAN.md
- MULTITENANT_MASTER_INDEX.md

### Layer 2: Strategy and Architecture (Why and how?)
- MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md
- MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md
- AI_SUPPORT_SYSTEM_ARCHITECTURE.md
- new-platform/ARCHITECTURE_OVERVIEW.md

### Layer 3: Product Specs (What behavior is required?)
- SALON_ONBOARDING_SPECS.md
- CLIENT_ONBOARDING.md
- MARKETPLACE_SPECS.md
- FREE_TRIAL_SPECS.md
- PAYMENT_FEATURE_SPECS.md
- LOYALTY_FUNCTIONAL_SPEC_V1.md
- AI_FEATURES_SPECS.md
- MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md

### Layer 4: Build Prompts and Sequencing (How to implement in order?)
- MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md
- MULTITENANT_WEEKS_5_TO_8_COPILOT_PROMPTS.md
- MULTITENANT_WEEKS_9_TO_12_COPILOT_PROMPTS.md
- MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md

### Layer 5: Design and Handoff (How UI moves into code)
- AI_FIRST_GENZ_DESIGN_PLAYBOOK.md
- FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md
- VALIDATION_CYCLE_SLICE1_MOCK.md

### Layer 6: New Platform Operational Docs (Execution packs and domain docs)
- new-platform/CROSS_PLATFORM_CAPABILITY_MATRIX.md
- new-platform/CROSS_PLATFORM_READINESS_AUDIT_2026-04-19.md
- new-platform/AI_FEATURES_IMPLEMENTATION_COVERAGE_MATRIX.md
- new-platform/AI_RUNTIME_AND_COST_POLICY.md
- new-platform/ENV_SETUP.md
- new-platform/NAVIGATION_PUBLIC_PROTECTED.md
- new-platform/ONBOARDING_ROUTE_SCAFFOLD.md
- new-platform/WEEK2_TASK24_ADMIN_SCREENS_EXECUTION_PACK.md
- new-platform/WEEK2_TASK25_DISCOVERY_SCAFFOLD_EXECUTION_PACK.md
- new-platform/WEEK3_TASK34_ADMIN_SCREENS_EXECUTION_PACK.md
- new-platform/WEEK1_REVIEW_REPORT.md

### Layer 7: Data Domain References (Entity-specific)
- new-platform/TENANTS.md
- new-platform/TENANT_USERS.md
- new-platform/USER_TENANT_ACCESS.md
- new-platform/LOCATIONS.md
- new-platform/STAFF.md
- new-platform/STAFF_SCHEDULES.md
- new-platform/SERVICES.md

### Layer 8: Templates and Diary (Operational logging)
- DAILY_WORK_DIARY_TEMPLATE.md
- DIARY_90_SECOND_CHECKLIST.md
- MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md
- documentation/diary/*.md (historical logs)

---

## Detailed Catalog (Purpose, Connection, Timing, Order)

Order key:
- O1 = Start here
- O2 = Read early before implementation
- O3 = Use while implementing
- O4 = Use for design handoff
- O5 = Use for QA/validation
- O6 = Operational log/archive

### Program Control
1. MULTITENANT_MASTER_INDEX.md
- Purpose: top-level index for multi-tenant program docs.
- Connected to: all major strategy/spec/prompt docs.
- When to use: first orientation or when lost in docs.
- Order: O1.

2. PROGRAM_TRACKING_BOARD.md
- Purpose: current execution state (backlog, in progress, blocked, done).
- Connected to: all execution packs and weekly prompts.
- When to use: before and after each coding session.
- Order: O1/O3.

3. PROJECT_GANTT_AGILE_PLAN.md
- Purpose: 20-week roadmap and dependency timing.
- Connected to: weekly prompt packs and tracking board.
- When to use: sprint planning and re-baselining.
- Order: O2.

### Strategy and Architecture
4. MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md
- Purpose: product and architecture direction baseline.
- Connected to: companion blueprint and all feature specs.
- When to use: scope alignment and architectural decisions.
- Order: O2.

5. MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md
- Purpose: schema, roadmap, migration map, implementation backbone.
- Connected to: all week prompt packs and domain docs.
- When to use: before implementing multi-tenant core paths.
- Order: O2.

6. AI_SUPPORT_SYSTEM_ARCHITECTURE.md
- Purpose: AI support architecture and integration boundaries.
- Connected to: AI features spec and AI runtime policy.
- When to use: AI support feature planning and guardrail work.
- Order: O2/O3.

7. new-platform/ARCHITECTURE_OVERVIEW.md
- Purpose: source-tree and module boundary baseline for current codebase.
- Connected to: route, provider, domain, and execution pack docs.
- When to use: before structural refactors or new modules.
- Order: O2.

### Product Specs
8. SALON_ONBOARDING_SPECS.md
- Purpose: salon onboarding behavior and business rules.
- Connected to: week packs for onboarding implementation.
- When to use: implementing or validating salon onboarding.
- Order: O2/O3.

9. CLIENT_ONBOARDING.md
- Purpose: client onboarding flows, states, and constraints.
- Connected to: onboarding route scaffold and week tasks.
- When to use: implementing auth/onboarding flows.
- Order: O2/O3.

10. MARKETPLACE_SPECS.md
- Purpose: marketplace feature behavior and rollout constraints.
- Connected to: weeks 13-20 prompt pack.
- When to use: marketplace implementation planning.
- Order: O2/O3.

11. FREE_TRIAL_SPECS.md
- Purpose: trial lifecycle and entitlement rules.
- Connected to: payment specs and monetization summary.
- When to use: feature gating and trial checks.
- Order: O2/O3.

12. PAYMENT_FEATURE_SPECS.md
- Purpose: payment and billing behavior requirements.
- Connected to: free trial spec, monetization summary, week packs.
- When to use: Stripe/payment implementation and QA.
- Order: O2/O3.

13. LOYALTY_FUNCTIONAL_SPEC_V1.md
- Purpose: loyalty logic and user/staff interactions.
- Connected to: weeks 5-8 prompt pack.
- When to use: loyalty feature implementation.
- Order: O2/O3.

14. AI_FEATURES_SPECS.md
- Purpose: AI feature behavior, scope, and expected outcomes.
- Connected to: AI runtime policy and AI coverage matrix.
- When to use: AI planning and build sequencing.
- Order: O2/O3.

15. MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md
- Purpose: integration layer connecting monetization and multi-salon model.
- Connected to: payment, trial, schema, and user access docs.
- When to use: cross-feature decisions touching billing plus tenancy.
- Order: O2.

### Build Prompt Packs
16. MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md
- Purpose: executable implementation prompts for early foundation.
- Connected to: Day 1 checklist, architecture overview, tracking board.
- When to use: weeks 1-4 coding sessions.
- Order: O3.

17. MULTITENANT_WEEKS_5_TO_8_COPILOT_PROMPTS.md
- Purpose: executable prompts for booking/messaging/loyalty phase.
- Connected to: loyalty and onboarding specs.
- When to use: weeks 5-8 coding sessions.
- Order: O3.

18. MULTITENANT_WEEKS_9_TO_12_COPILOT_PROMPTS.md
- Purpose: executable prompts for growth and pilot hardening phase.
- Connected to: analytics/reviews growth scope docs.
- When to use: weeks 9-12 coding sessions.
- Order: O3.

19. MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md
- Purpose: executable prompts for monetization/marketplace/AI phase.
- Connected to: payment, onboarding, marketplace, AI specs.
- When to use: weeks 13-20 coding sessions.
- Order: O3.

### Design and Handoff
20. AI_FIRST_GENZ_DESIGN_PLAYBOOK.md
- Purpose: end-to-end AI-assisted design generation playbook.
- Connected to: Figma handoff playbook and validation mock.
- When to use: generating and refining screens with AI.
- Order: O4.

21. FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md
- Purpose: strict Figma-to-dev handoff process and acceptance checks.
- Connected to: design playbook and implementation intake workflow.
- When to use: before accepting design assets for coding.
- Order: O4/O5.

22. VALIDATION_CYCLE_SLICE1_MOCK.md
- Purpose: example of full step integration and validation output.
- Connected to: design playbook and handoff standards.
- When to use: validating prompt quality and expected artifacts.
- Order: O5.

### New Platform Operational Docs
23. new-platform/CROSS_PLATFORM_CAPABILITY_MATRIX.md
- Purpose: feature capability parity view (iOS/Android/Web).
- Connected to: readiness audit and architecture decisions.
- When to use: cross-platform prioritization.
- Order: O2/O3.

24. new-platform/CROSS_PLATFORM_READINESS_AUDIT_2026-04-19.md
- Purpose: snapshot audit of platform readiness state.
- Connected to: capability matrix and execution packs.
- When to use: planning based on current platform gaps.
- Order: O2.

25. new-platform/AI_FEATURES_IMPLEMENTATION_COVERAGE_MATRIX.md
- Purpose: traceability matrix of AI feature implementation status.
- Connected to: AI features spec and runtime cost policy.
- When to use: deciding next AI task and gap closure.
- Order: O3/O5.

26. new-platform/AI_RUNTIME_AND_COST_POLICY.md
- Purpose: AI budget, guardrails, runtime limits, and policy.
- Connected to: AI architecture, AI coverage matrix, week tasks.
- When to use: any AI runtime or budget-related implementation.
- Order: O2/O3.

27. new-platform/ENV_SETUP.md
- Purpose: environment setup details and consistency rules.
- Connected to: Day 1 checklist and CI quality baseline.
- When to use: onboarding machine setup and troubleshooting.
- Order: O2/O3.

28. new-platform/NAVIGATION_PUBLIC_PROTECTED.md
- Purpose: route and guard behavior reference for public/protected screens.
- Connected to: architecture overview and onboarding route scaffold.
- When to use: navigation and auth-guard implementation.
- Order: O3.

29. new-platform/ONBOARDING_ROUTE_SCAFFOLD.md
- Purpose: onboarding route scaffolding contract and expectations.
- Connected to: client onboarding spec and navigation doc.
- When to use: onboarding routing implementation/refactor.
- Order: O3.

30. new-platform/WEEK2_TASK24_ADMIN_SCREENS_EXECUTION_PACK.md
- Purpose: execution packet for week 2.4 admin screens.
- Connected to: tracking board blocked card and design handoff.
- When to use: unblocking and implementing admin screens.
- Order: O3.

31. new-platform/WEEK2_TASK25_DISCOVERY_SCAFFOLD_EXECUTION_PACK.md
- Purpose: execution packet for week 2.5 discovery scaffold.
- Connected to: tracking board blocked card and design handoff.
- When to use: unblocking and implementing discovery scaffold.
- Order: O3.

32. new-platform/WEEK3_TASK34_ADMIN_SCREENS_EXECUTION_PACK.md
- Purpose: execution packet for week 3.4 staff/services admin screens.
- Connected to: tracking board blocked card and design handoff.
- When to use: unblocking and implementing week 3.4.
- Order: O3.

33. new-platform/WEEK1_REVIEW_REPORT.md
- Purpose: week 1 closure report and quality findings.
- Connected to: week 1 prompt pack and tracking board done cards.
- When to use: retrospective and baseline quality checks.
- Order: O5.

### Data Domain References
34. new-platform/TENANTS.md
- Purpose: tenant entity/data model reference.
- Connected to: blueprint schema and tenant access models.
- When to use: tenant domain changes.
- Order: O3.

35. new-platform/TENANT_USERS.md
- Purpose: tenant user relationship model reference.
- Connected to: user-tenant access and auth domain.
- When to use: membership and role modeling.
- Order: O3.

36. new-platform/USER_TENANT_ACCESS.md
- Purpose: multi-salon access mapping and constraints.
- Connected to: monetization summary and tenant users doc.
- When to use: cross-tenant access logic and authorization checks.
- Order: O3/O5.

37. new-platform/LOCATIONS.md
- Purpose: location entity and behavior contract.
- Connected to: tenant and scheduling-related modules.
- When to use: location features and data updates.
- Order: O3.

38. new-platform/STAFF.md
- Purpose: staff model and role behavior contract.
- Connected to: schedules and services docs.
- When to use: staff management implementation.
- Order: O3.

39. new-platform/STAFF_SCHEDULES.md
- Purpose: scheduling data and behavior contract for staff availability.
- Connected to: staff and booking logic.
- When to use: scheduling or availability implementation.
- Order: O3.

40. new-platform/SERVICES.md
- Purpose: service catalog model and behavior contract.
- Connected to: booking, discovery, and admin screens.
- When to use: service management or listing work.
- Order: O3.

### Templates and Logs
41. DAY1_DEVELOPMENT_CHECKLIST.md
- Purpose: Day 1 vertical slice checklist.
- Connected to: week 1 prompt pack and execution log template.
- When to use: Day 1 or environment reset sessions.
- Order: O2/O3.

42. MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md
- Purpose: structured execution log for day 1 activities.
- Connected to: Day 1 checklist and tracking board.
- When to use: documenting execution outcomes.
- Order: O6.

43. DAILY_WORK_DIARY_TEMPLATE.md
- Purpose: daily operational log template.
- Connected to: diary folder and 90-second checklist.
- When to use: end-of-day updates.
- Order: O6.

44. DIARY_90_SECOND_CHECKLIST.md
- Purpose: fast daily logging quality checklist.
- Connected to: diary template.
- When to use: before closing daily notes.
- Order: O6.

45. documentation/diary/*.md
- Purpose: historical conversation and execution snapshots.
- Connected to: templates and specific day outputs.
- When to use: audit trail, not primary planning.
- Order: O6.

---

## Practical Rules (So Docs Stay Manageable)
1. Start every coding session with PROGRAM_TRACKING_BOARD.md.
2. Open only one strategy doc plus one execution doc at a time.
3. Treat weekly prompt packs as execution scripts, not product specs.
4. Treat feature specs as source of business truth.
5. Treat diary files as archive only.
6. Update MULTITENANT_MASTER_INDEX.md whenever a new top-level operational doc is added.
7. Update this command center when a new doc changes run order or dependencies.

---

## Current Recommended Default Order (Most Sessions)
1. DOCUMENTATION_COMMAND_CENTER.md
2. PROGRAM_TRACKING_BOARD.md
3. MULTITENANT_MASTER_INDEX.md
4. One relevant spec document
5. One relevant weekly prompt pack
6. One relevant new-platform execution pack (if blocked/active)
7. Validation or review doc at session close
