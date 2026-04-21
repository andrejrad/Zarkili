# Multi-Tenant Master Index

## Purpose
This is the single starting point for your multi-tenant program.
It links all generated strategy and execution documents and gives an exact run order for Day 1.

---

## Document Set

0. Documentation command center (start here)
- [DOCUMENTATION_COMMAND_CENTER.md](DOCUMENTATION_COMMAND_CENTER.md)

0. Program tracking board (Kanban)
- [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md)

0.1 Project Gantt plan (Agile + parallel streams)
- [PROJECT_GANTT_AGILE_PLAN.md](PROJECT_GANTT_AGILE_PLAN.md)

1. Strategic feature and architecture audit
- [MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md](MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md)

2. Companion blueprint (schema + roadmap + migration map)
- [MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md](MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md)

3. Marketplace specification
- [MARKETPLACE_SPECS.md](MARKETPLACE_SPECS.md)

4. Salon onboarding specification
- [SALON_ONBOARDING_SPECS.md](SALON_ONBOARDING_SPECS.md)

5. Client onboarding specification
- [CLIENT_ONBOARDING.md](CLIENT_ONBOARDING.md)

6. Free trial specification
- [FREE_TRIAL_SPECS.md](FREE_TRIAL_SPECS.md)

7. Payment specification
- [PAYMENT_FEATURE_SPECS.md](PAYMENT_FEATURE_SPECS.md)

8. AI features specification
- [AI_FEATURES_SPECS.md](AI_FEATURES_SPECS.md)

9. Monetization & multi-salon integration summary
- [MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md](MONETIZATION_AND_MULTISALON_INTEGRATION_SUMMARY.md)
- Reference this for multi-salon user access model and subscription context.

10. Copilot prompts for Weeks 1-4
- [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md)

11. Copilot prompts for Weeks 5-8
- [MULTITENANT_WEEKS_5_TO_8_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_5_TO_8_COPILOT_PROMPTS.md)

12. Copilot prompts for Weeks 9-12
- [MULTITENANT_WEEKS_9_TO_12_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_9_TO_12_COPILOT_PROMPTS.md)

13. Copilot prompts for Weeks 13-20 (new)
- [MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md)

14. AI-first Gen-Z design playbook (new)
- [AI_FIRST_GENZ_DESIGN_PLAYBOOK.md](AI_FIRST_GENZ_DESIGN_PLAYBOOK.md)

15. Cross-platform capability matrix (new)
- [new-platform/CROSS_PLATFORM_CAPABILITY_MATRIX.md](new-platform/CROSS_PLATFORM_CAPABILITY_MATRIX.md)

16. AI implementation coverage matrix (new)
- [new-platform/AI_FEATURES_IMPLEMENTATION_COVERAGE_MATRIX.md](new-platform/AI_FEATURES_IMPLEMENTATION_COVERAGE_MATRIX.md)

17. AI runtime and cost policy (new)
- [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md)

18. Figma-to-development handoff playbook (new)
- [FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md](FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md)

---

## Recommended Reading Order (First Session)

1. Read: [MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md](MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md)
- Goal: align on product scope and technical direction.
  - **NEW**: Includes multi-salon user access and subscription/billing models

2. Read: [MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md](MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md)
- Goal: lock schema, roadmap, and migration strategy.
  - **NEW**: Extended schema for subscriptions, userTenantAccess, and Week 5.5 multi-salon dashboard
  - **NEW**: Extended Weeks 13-20 roadmap for payments, onboarding, marketplace, and AI

3. Read: feature specifications in this order:
- [SALON_ONBOARDING_SPECS.md](SALON_ONBOARDING_SPECS.md)
- [CLIENT_ONBOARDING.md](CLIENT_ONBOARDING.md)
- [MARKETPLACE_SPECS.md](MARKETPLACE_SPECS.md)
- [FREE_TRIAL_SPECS.md](FREE_TRIAL_SPECS.md)
- [PAYMENT_FEATURE_SPECS.md](PAYMENT_FEATURE_SPECS.md)
- [AI_FEATURES_SPECS.md](AI_FEATURES_SPECS.md)
- Goal: lock detailed product behavior before implementation.

4. Execute: [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md)
- Goal: start implementation in correct order.

---

## Day 1 Exact Run Sequence in VS Code

Use prompts from Weeks 1-4 document in this order:

1. Global Guardrails Prompt (run once)
2. Week 1 Task 1.1 - Baseline Folder Architecture
3. Week 1 Task 1.1 Review prompt
4. Week 1 Task 1.2 - App Provider Shell
5. Week 1 Task 1.2 Review prompt
6. Week 1 Task 1.3 - Environment and Firebase Bootstrap
7. Week 1 Task 1.3 Review prompt
8. Week 1 Task 1.4 - CI Quality Baseline
9. Week 1 Task 1.4 Review prompt
10. Week 1 Task 1.5 - Public Landing Shell and Route Groups
11. Week 1 Task 1.5 Review prompt
12. End-of-Week Security Prompt Pack
13. End-of-Week Documentation Prompt Pack
14. Week-Close Acceptance Prompt

---

## Working Model
- Copilot role: implementation developer
- Your role: prompt engineer, acceptance owner, and final reviewer
- Preferred PR size: one task per PR
- Mandatory after each task: run paired review prompt

---

## Quality Gates to Enforce Every Week

1. Tenant isolation
- Every business write includes tenantId.
- Every query includes tenant filter.
- Multi-tenant user access (`userTenantAccess`) stays in sync with `tenantUsers`.

2. Authorization
- Role checks for all privileged actions.
- Subscription and trial status validated in guarded flows.

3. Data integrity
- State transitions validated.
- Race-sensitive flows protected.
- Unread message aggregation accurate per tenant.

4. Verification
- Tests added and passing.
- Rules/indexes updated when needed.
- Docs updated at week close.

---

## Quick Start Tomorrow

If you have only 60-90 minutes:

1. Read Sections "Executive Summary" and "Recommendation" in:
- [MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md](MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md)

2. Read Sections "Firestore Schema v1" and "Week 1" in:
- [MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md](MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md)

3. Run only these prompts from:
- [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md)

Run sequence:
- Global Guardrails
- Task 1.1 Build + Review
- Task 1.2 Build + Review

This gives you a clean, high-confidence kickoff with minimal risk.
