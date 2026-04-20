# Program Tracking Board

## Purpose
Single execution board for tracking implementation across all strategy, spec, and prompt-pack documents.

Use this board as your Trello-style source of truth for:
- Backlog
- Ready
- In Progress
- Blocked
- Review and QA
- Done

---

## How to Use This Board
1. Keep each card in exactly one lane.
2. Move cards by cut and paste between lanes.
3. Update the date and owner when status changes.
4. Split large cards into smaller cards as soon as execution starts.
5. Only move to Done after acceptance criteria and checks pass.

Card format:
- [ ] CARD-ID | Short title | Owner | Source doc | Target week | Updated YYYY-MM-DD

---

## Backlog
- [ ] B-001 | Marketplace phase 2 hardening | TBD | [MARKETPLACE_SPECS.md](MARKETPLACE_SPECS.md) | Week 14-16 | Updated 2026-04-17
- [ ] B-002 | AI copilot phase 2 expansions | TBD | [AI_FEATURES_SPECS.md](AI_FEATURES_SPECS.md) | Week 18-20 | Updated 2026-04-17
- [ ] B-003 | Advanced loyalty campaigns and multipliers | TBD | [LOYALTY_FUNCTIONAL_SPEC_V1.md](LOYALTY_FUNCTIONAL_SPEC_V1.md) | Post Week 8 | Updated 2026-04-17
- [ ] B-004 | AI service recommendations engine v1 | TBD | [MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md) | Week 19 | Updated 2026-04-19
- [ ] B-005 | AI marketing automation orchestrator v1 | TBD | [MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md) | Week 19 | Updated 2026-04-19
- [ ] B-006 | AI retention and insights copilot v1 | TBD | [MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md) | Week 19 | Updated 2026-04-19
- [ ] B-007 | AI scheduling optimization engine v1 | TBD | [MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md) | Week 19 | Updated 2026-04-19

## Ready
- [ ] R-004 | Salon onboarding flow v1 | TBD | [SALON_ONBOARDING_SPECS.md](SALON_ONBOARDING_SPECS.md) | Week 6-8 | Updated 2026-04-17
- [ ] R-005 | Client onboarding flow v1 | TBD | [CLIENT_ONBOARDING.md](CLIENT_ONBOARDING.md) | Week 6-8 | Updated 2026-04-17
- [ ] R-006 | Free trial gating flow | TBD | [FREE_TRIAL_SPECS.md](FREE_TRIAL_SPECS.md) | Week 13 | Updated 2026-04-17
- [ ] R-007 | Stripe billing integration v1 | TBD | [PAYMENT_FEATURE_SPECS.md](PAYMENT_FEATURE_SPECS.md) | Week 14 | Updated 2026-04-17
- [ ] R-008 | Loyalty implementation v1 | TBD | [LOYALTY_FUNCTIONAL_SPEC_V1.md](LOYALTY_FUNCTIONAL_SPEC_V1.md) | Week 8 | Updated 2026-04-17

## In Progress
- [ ] P-001 | No active card yet | TBD | [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md) | Current | Updated 2026-04-19

## Blocked
- [ ] X-001 | No blocked card yet | TBD | [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md) | Current | Updated 2026-04-17

## Review and QA
- [ ] Q-001 | No review card yet | TBD | [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md) | Current | Updated 2026-04-17

## Done
- [x] D-001 | Day 0 project bootstrap complete | Copilot plus Andre | [DAY1_DEVELOPMENT_CHECKLIST.md](DAY1_DEVELOPMENT_CHECKLIST.md) | Completed | Updated 2026-04-16
- [x] D-002 | Development and production Firebase environments configured | Copilot plus Andre | [MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md](MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md) | Completed | Updated 2026-04-16
- [x] D-003 | Expo SDK upgraded to 54 and startup scripts stabilized | Copilot plus Andre | [MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md](MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md) | Completed | Updated 2026-04-17
- [x] D-004 | Firestore tenant isolation pass v1 (rules + tests + indexes) | Copilot plus Andre | [MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md](MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md) | Completed | Updated 2026-04-18
- [x] D-005 | Tenant and Location domain models and repositories (with tests) | Copilot plus Andre | [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md) | Completed | Updated 2026-04-18
- [x] D-011 | Auth plus tenant context implementation | Copilot plus Andre | [DAY1_DEVELOPMENT_CHECKLIST.md](DAY1_DEVELOPMENT_CHECKLIST.md) | Completed | Updated 2026-04-19
- [x] D-006 | Auth domain v1 plus navigation route guard contracts | Copilot plus Andre | [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md) | Completed | Updated 2026-04-19
- [x] D-007 | Runtime public/protected route composition with tenant-aware guards | Copilot plus Andre | [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md) | Completed | Updated 2026-04-19
- [x] D-008 | Auth onboarding draft-save/resume foundation (rules + index + tests) | Copilot plus Andre | [CLIENT_ONBOARDING.md](CLIENT_ONBOARDING.md) | Completed | Updated 2026-04-19
- [x] D-009 | Onboarding draft contracts + schema-versioned service layer | Copilot plus Andre | [CLIENT_ONBOARDING.md](CLIENT_ONBOARDING.md) | Completed | Updated 2026-04-19
- [x] D-010 | Onboarding draft v1-to-v2 step payload migration strategy | Copilot plus Andre | [CLIENT_ONBOARDING.md](CLIENT_ONBOARDING.md) | Completed | Updated 2026-04-19
- [x] D-012 | Week 1 Task 1.3 complete (ENV setup docs + config parsing tests) | Copilot plus Andre | [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md) | Completed | Updated 2026-04-19
- [x] D-013 | Week 1 Task 1.4 complete (local pre-PR contributor checklist) | Copilot plus Andre | [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md) | Completed | Updated 2026-04-19
- [x] D-014 | Week 1 Task 1.5 complete (public plus protected placeholders and marketplace flag) | Copilot plus Andre | [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md) | Completed | Updated 2026-04-19
- [x] D-015 | Week 1 vertical slice board closure (kickoff and in-progress cleanup) | Copilot plus Andre | [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md) | Completed | Updated 2026-04-19
- [x] D-016 | Week 1 detailed review report documented | Copilot plus Andre | [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md) | Completed | Updated 2026-04-19
- [x] D-017 | Week 1 hardening pass complete (CI rules tests + deep-link route guards + auth-tenant reset) | Copilot plus Andre | [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md) | Completed | Updated 2026-04-19
- [x] D-018 | Shared AI budget guard service scaffold plus state tests | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-19
- [x] D-019 | AI cap-state integration tests plus support triage guard-call skeleton | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-19
- [x] D-020 | AI per-feature telemetry and alert baseline wired into support triage | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-19
- [x] D-021 | AI budget config repository and validated admin override controls | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-19
- [x] D-022 | Owner-only AI budget management service guard layer | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-19
- [x] D-023 | Owner AI budget settings route and screen-level hook contract | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-19
- [x] D-024 | Real auth-claim admin resolver and dedicated owner budget screen wiring | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-19
- [x] D-025 | Backend audited AI budget admin callable path with role enforcement | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20
- [x] D-026 | Functions callable test coverage for admin auth, validation, and audit writes | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20
- [x] D-027 | Firestore composite indexes for platform audit-log admin filtering and recency sort | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20
- [x] D-028 | Callable payload edge-case tests for feature caps, reason length, and threshold ordering | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20
- [x] D-029 | Admin callable for paginated audit-log listing with filter validation and tests | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20
- [x] D-030 | Cursor pagination for admin audit-log callable with nextPageToken validation and tests | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20



- [x] D-034 | Hook-level error-path tests for owner audit-history refresh and load-more failures | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20
- [x] D-035 | Owner settings empty-state regression test for zero audit-history first page | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20
- [x] D-036 | Owner settings refresh regression test for config plus first-page audit reload | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20
- [x] D-037 | Owner settings regression test ensuring refresh clears prior load-more audit error | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20
- [x] D-038 | Hook regression test preventing duplicate pagination calls on rapid load-more taps | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20
- [x] D-039 | Owner settings integration test for cap increment update while retaining loaded audit rows | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20
- [x] D-040 | Hook guard test for missing user/service refresh and load-more resilience path | Copilot plus Andre | [new-platform/AI_RUNTIME_AND_COST_POLICY.md](new-platform/AI_RUNTIME_AND_COST_POLICY.md) | Completed | Updated 2026-04-20

---

## Weekly Cadence
Use this cadence every week:
1. Monday: promote cards from Backlog to Ready.
2. Daily: keep only active work in In Progress.
3. When blocked: move card to Blocked with a short blocker reason in title.
4. Before merge: move to Review and QA.
5. After passing acceptance and checks: move to Done.

---

## Recommended Next Moves
1. Promote one Week 2-ready card into In Progress and assign owner.
2. Keep no more than 2 cards in In Progress at once.
3. Start Week 2.2 role-mapping and Week 2.3 location-admin UI planning after Week 2.1 handoff.

