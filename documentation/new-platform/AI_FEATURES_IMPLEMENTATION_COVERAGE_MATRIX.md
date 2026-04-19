# AI Features Implementation Coverage Matrix

Date: 2026-04-19
Source Spec: `documentation/AI_FEATURES_SPECS.md`
Purpose: Map AI spec requirements to implementation weeks/prompts and identify delivery gaps.

## Coverage Legend
- Covered: Explicit implementation prompt exists.
- Partial: Related prompts exist but do not fully satisfy the spec scope.
- Gap: No explicit implementation prompt currently exists.

## Category Coverage

| AI Spec Category | Coverage | Planned Weeks | Existing Prompt Coverage | Gap Summary | Bridge Action |
| --- | --- | --- | --- | --- | --- |
| AI Scheduling Optimization | Partial | Week 19 | Week 19.2 includes scheduling suggestions and constraints | Missing explicit client booking-time ranking + salon calendar gap-fill + smart rescheduling campaign linkage | Add Week 19.6 scheduling optimization task |
| AI Marketing Automation | Partial | Weeks 10, 19 | Week 10 campaign engine, Week 19.2 content assistant | Missing explicit AI trigger orchestration by behavior/time/event with send windows and anti-spam controls | Add Week 19.4 AI marketing automation orchestrator |
| AI Client Retention Predictions | Partial | Weeks 11, 19 | Week 11 analytics foundation, Week 19.2 retention suggestions | Missing explicit churn score outputs + retention action queue + explainability contract UI | Add Week 19.5 AI insights and retention scoring task |
| AI Service Recommendations | Gap | Week 19 | No explicit dedicated service recommendation task | Missing recommendation model/service and booking-surface integration contract | Add Week 19.3 AI service recommendations task |
| AI Content Creation | Covered | Week 19 | Week 19.2 includes marketing/content generation assistant | No blocking gap | Keep as-is and validate safety/approval behavior in review |
| AI Chat Assistance | Covered | Week 19 | Week 19.1 dedicated chat assistant task | No blocking gap | Keep as-is |
| AI Insights and Analytics | Partial | Weeks 11, 19 | Week 11 analytics + Week 19 AI assistants | Missing explicit AI insight recommendation panel and actionability outputs | Add Week 19.5 AI insights task |
| AI No-Show and Fraud Prediction | Covered | Week 20 | Week 20.1 dedicated no-show/fraud task | No blocking gap | Keep as-is |
| AI Marketplace Personalization | Covered | Week 20 | Week 20.2 dedicated personalization task | No blocking gap | Keep as-is |

## Cross-Cutting Edge Cases Coverage

| Requirement Type | Coverage | Notes | Bridge Action |
| --- | --- | --- | --- |
| Explainability (`reasonCodes`, confidence, source signals) | Partial | Present in Week 11.4 and Week 20.1, but not explicitly required in all AI assistant outputs | Add explicit requirement in Week 19.3-19.6 prompts |
| Human override and approval controls | Partial | Present for outbound AI campaigns in Week 19.2 only | Extend Week 19.4 with approval/hold controls |
| Consent and opt-out safety | Partial | Present in data contracts, not consistently repeated in assistant tasks | Add explicit consent gate checks in Week 19.3-19.6 prompts |
| Anti-predatory and anti-competitor safeguards | Partial | Present in marketplace personalization and prior guardrails | Reiterate in recommendation and automation tasks |
| Latency target and operational SLOs | Gap | No explicit SLO validation task | Add non-functional SLO requirement in Week 19.6 |

## Bridge Plan (Prompt Updates Required)
1. Add new Week 19 tasks to `documentation/MULTITENANT_WEEKS_13_TO_20_COPILOT_PROMPTS.md`:
   - Week 19.3 AI Service Recommendations Engine v1
   - Week 19.4 AI Marketing Automation Orchestrator v1
   - Week 19.5 AI Retention and Insights Copilot v1
   - Week 19.6 AI Scheduling Optimization Engine v1
2. Ensure each new task includes:
   - explainability outputs
   - consent and opt-out handling
   - human override paths
   - tests for edge-case safeguards
3. Keep Week 20 focused on high-risk models and personalization hardening.

## Acceptance Criteria for “AI Spec Aligned” Status
1. Every AI category in `AI_FEATURES_SPECS.md` has at least one explicit implementation prompt.
2. Every prompt includes tenant safety, explainability, and override rules.
3. AI-related prompts include tests for unsafe output and policy fallback behavior.
4. Program board contains explicit cards for remaining AI gap tasks.
