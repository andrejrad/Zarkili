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

## Ready
- [ ] R-001 | Week 1 vertical slice kickoff | TBD | [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md) | Week 1 | Updated 2026-04-17
- [ ] R-002 | Auth plus tenant context implementation | TBD | [DAY1_DEVELOPMENT_CHECKLIST.md](DAY1_DEVELOPMENT_CHECKLIST.md) | Week 1 | Updated 2026-04-17
- [ ] R-003 | Firestore rules tenant isolation pass v1 | TBD | [MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md](MULTITENANT_COMPANION_EXECUTION_BLUEPRINT.md) | Week 1 | Updated 2026-04-17
- [ ] R-004 | Salon onboarding flow v1 | TBD | [SALON_ONBOARDING_SPECS.md](SALON_ONBOARDING_SPECS.md) | Week 6-8 | Updated 2026-04-17
- [ ] R-005 | Client onboarding flow v1 | TBD | [CLIENT_ONBOARDING.md](CLIENT_ONBOARDING.md) | Week 6-8 | Updated 2026-04-17
- [ ] R-006 | Free trial gating flow | TBD | [FREE_TRIAL_SPECS.md](FREE_TRIAL_SPECS.md) | Week 13 | Updated 2026-04-17
- [ ] R-007 | Stripe billing integration v1 | TBD | [PAYMENT_FEATURE_SPECS.md](PAYMENT_FEATURE_SPECS.md) | Week 14 | Updated 2026-04-17
- [ ] R-008 | Loyalty implementation v1 | TBD | [LOYALTY_FUNCTIONAL_SPEC_V1.md](LOYALTY_FUNCTIONAL_SPEC_V1.md) | Week 8 | Updated 2026-04-17

## In Progress
- [ ] P-001 | No active card yet | TBD | [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md) | Current | Updated 2026-04-17

## Blocked
- [ ] X-001 | No blocked card yet | TBD | [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md) | Current | Updated 2026-04-17

## Review and QA
- [ ] Q-001 | No review card yet | TBD | [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md) | Current | Updated 2026-04-17

## Done
- [x] D-001 | Day 0 project bootstrap complete | Copilot plus Andre | [DAY1_DEVELOPMENT_CHECKLIST.md](DAY1_DEVELOPMENT_CHECKLIST.md) | Completed | Updated 2026-04-16
- [x] D-002 | Development and production Firebase environments configured | Copilot plus Andre | [MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md](MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md) | Completed | Updated 2026-04-16
- [x] D-003 | Expo SDK upgraded to 54 and startup scripts stabilized | Copilot plus Andre | [MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md](MULTITENANT_DAY1_EXECUTION_LOG_TEMPLATE.md) | Completed | Updated 2026-04-17

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
1. Move R-001 to In Progress when coding starts.
2. Split R-001 into sub-cards after first implementation pass.
3. Keep no more than 2 cards in In Progress at once.