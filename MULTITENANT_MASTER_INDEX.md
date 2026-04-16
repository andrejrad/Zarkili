# Multi-Tenant Master Index

## Purpose
This is the single starting point for your multi-tenant program.
It links all generated strategy and execution documents and gives an exact run order for Day 1.

---

## Document Set

1. Strategic feature and architecture audit
- [MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md](MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md)

2. Companion blueprint (schema + roadmap + migration map)
- [MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md](MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md)

3. Copilot prompts for Weeks 1-4
- [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md)

4. Copilot prompts for Weeks 5-8
- [MULTITENANT_WEEKS_5_TO_8_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_5_TO_8_COPILOT_PROMPTS.md)

5. Copilot prompts for Weeks 9-12
- [MULTITENANT_WEEKS_9_TO_12_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_9_TO_12_COPILOT_PROMPTS.md)

---

## Recommended Reading Order (First Session)

1. Read: [MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md](MULTITENANT_STRATEGY_AND_FEATURE_AUDIT.md)
- Goal: align on product scope and technical direction.

2. Read: [MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md](MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md)
- Goal: lock schema, roadmap, and migration strategy.

3. Execute: [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md)
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

2. Authorization
- Role checks for all privileged actions.

3. Data integrity
- State transitions validated.
- Race-sensitive flows protected.

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
