# Phase 4 — AI Support Router and Tuning (Weeks 50–52)

> **Filename note:** the document filename retains `WEEKS_49_TO_52` for stable links across the program. The phase is **3 weeks** (W50–W52). The W49 ticket-plumbing/KB-authoring/admin-queue scope (originally in Phase 4) was promoted into **Phase 3.5 Week 48** so that customer-facing in-app support and the platform-owner support dashboard ship at commercial GA. Phase 4 now adds the AI router, eval, analytics, CSAT, tagging, and tuning on top of those live surfaces.

## Why This Plan Exists
The platform launches commercially at the end of Phase 3.5 (Week 49) with **in-app support and the platform-owner dashboard live but human-handled** (Phase 3.5 Week 48 ships the surfaces, rules, KB authoring UI, and macros from [AI_SUPPORT_SYSTEM_ARCHITECTURE.md](AI_SUPPORT_SYSTEM_ARCHITECTURE.md) without the AI router).

Phase 4 adds the **AI first-response layer** on top of those live surfaces, using the first ~4 weeks of post-launch ticket data as input to the knowledge base and as a baseline for the AI eval set.

This phase runs **after** commercial GA. It does not block launch.

## Entry Conditions (must be true before Week 50 starts)
1. Commercial GA achieved at end of Week 49; platform serving real tenants with in-app support live.
2. Minimum 4 weeks of post-launch human-handled ticket data available (≥ 50 tickets across tenant admins + end clients) to seed the knowledge base and the AI eval set.
3. Customer support runbook from W49 is the source of truth for canonical answers; KB seeded in W48.
4. AI evaluation harness from W47 is operational; Phase 4 extends it with a `support` eval set.
5. AI budget guard `aiSupport` feature key registered in W48; consumed in W50.
6. Support surfaces from Phase 3.5 W48 (`SupportChatScreen`, `AdminSupportQueueScreen`, KB authoring UI, escalation queue, macros) are live in production.

## Exit Conditions (Definition of Done for Phase 4)
1. `aiSupportRouter` Cloud Function live with confidence-scored auto-respond vs escalate decision.
2. Tenant-context injection (role, recent bookings, account age, locale) verified safe — no cross-tenant leakage.
3. Escalation pipeline live: email to platform owner with draft reply + in-app queue entry + SLA timer.
4. Ticket tagging (auto-suggested by AI, editable by admin) and CSAT after-resolution survey available.
5. Support analytics dashboard: deflection rate, first-response time, resolution time, escalation rate, AI confidence histogram, CSAT.
6. AI eval set for support has ≥ 100 examples with a published rubric and a regression threshold wired to CI.
7. Per-tenant routing flag: tickets from a tenant can route to that tenant's owner first if configured, with platform owner as fallback.
8. v1 of AI Support System operating in production with measurable deflection rate and the platform-owner queue functioning as designed.

## Week-by-Week Plan

### Week 50 — AI Router, Context Injection, Escalation Pipeline
- `aiSupportRouter` Cloud Function:
  - Loads tenant context safely (role, recent bookings, account age, locale, last booking status).
  - Builds prompt from `platform/aiSupportKb/{current}` (seeded in W48) + per-tenant overlays + safety guardrails.
  - Calls AI provider with structured output: `{reply: string, confidence: number, reason: string, suggestedTags: string[]}`.
  - Decides auto-respond vs escalate based on confidence threshold (configurable).
  - Writes AI message + updates ticket status; if escalating, mirrors to `escalationQueue` with draft reply.
- Tenant-context injection security review: write adversarial tests that try to read other-tenant data via prompt injection or context misuse.
- Escalation delivery: email to platform owner with draft reply + deep link to `AdminSupportQueueScreen`. Email template and SES/SendGrid (or chosen provider) wired.
- AI budget guard integration: route uses `aiSupport` feature key registered in W48; respects Healthy/Warning/Protection/Exhausted state thresholds. In Protection or Exhausted, all tickets escalate immediately to human (no AI call).
- Per-tenant routing flag: optional tenant config to route to tenant owner first; platform owner remains fallback after SLA breach.
- Tenant comms: announce AI assistance in support chat once router is live (in-app banner + email).

### Week 51 — Eval, Analytics, CSAT, Tagging
- Extend the W47 AI evaluation harness with a `support` eval set, ≥ 100 examples drawn from real W45–W50 tickets, with rubric (correctness, tone, escalation appropriateness, no-leakage). Record baseline. Wire to CI for any prompt or model-tier change.
- Ticket tagging (auto-suggested by AI, editable by admin).
- CSAT survey after `resolved`/`closed` — 1-tap rating + optional comment, stored on ticket.
- Support analytics dashboard:
  - AI deflection rate (auto-resolved without escalation).
  - First-response time (AI and human breakouts).
  - Resolution time.
  - Escalation rate.
  - AI confidence histogram.
  - CSAT by tenant and overall.
  - Top tags / topics.
- Add weekly human-in-the-loop review process: sample 10 AI replies per week, score against rubric, feed corrections back into KB.

### Week 52 — Hardening, Tuning, Phase 4 Close
- Tune confidence threshold based on Week 51 deflection vs CSAT data.
- KB iteration pass — rewrite weak system-prompt sections based on flagged tickets.
- Load behavior: confirm Cloud Function concurrency and provider rate-limits hold under simulated burst (use the W45 load harness).
- Accessibility re-audit on `SupportChatScreen` and `AdminSupportQueueScreen`.
- Localization: confirm `SupportChatScreen` works in supported locales (uses i18n from W32).
- Documentation:
  - Update [AI_SUPPORT_SYSTEM_ARCHITECTURE.md](AI_SUPPORT_SYSTEM_ARCHITECTURE.md) with as-built deltas (resolves entries in its Open Decisions Register).
  - Operator runbook: how to update KB, change confidence threshold, handle a stuck escalation.
  - Tenant-facing help: how end clients open a support ticket, expected response time.
- Phase 4 close report; AI Support System v1 declared operational.

## Decision Gates
| Gate | Decide by | Default if undecided |
|------|-----------|----------------------|
| AI provider for support (reuse W19 provider vs separate) | Before W50 | Reuse W19 / Phase 1 provider; same SDK, separate feature key |
| Confidence threshold initial value | End of W50 | 0.75 (re-tune in W52 from real data) |
| SLA for human reply after escalation | Carried over from W48 | 24 business hours v1; tighten post-launch |
| CSAT scale (1–5 vs thumbs up/down) | End of W51 | Thumbs up/down + optional comment for v1 |
| Out-of-scope topics policy (refuse vs escalate) | End of W50 | Escalate with low confidence; never refuse silently |

## Parallel Streams (run alongside Weeks 50–52)
- **Customer success / human-tier-2**: continues handling escalations through Week 52; their feedback is the primary KB tuning input.
- **Tenant comms**: announce AI assistance in support chat in Week 50 once router is live.
- **Engineering on-call**: continues from Phase 3.5; no rotation change required.

## Acceptance Gate Per Week
1. Week-N close report under `documentation/new-platform/PHASE4_WEEKN_CLOSE_REPORT.md`.
2. Test deltas: router unit + integration tests with adversarial cases (W50), eval baseline recorded (W51), tuned thresholds documented (W52).
3. No regressions in Phase 1–3.5 test suite.
4. Tracking board updated.

## Risk Register
| Risk | Severity | Probability | Mitigation |
|------|----------|-------------|------------|
| AI replies hallucinate tenant-specific facts | Critical | Medium | Strict context injection only from verified sources; rubric explicitly penalizes hallucination; eval gate on every prompt change |
| Cross-tenant data leakage via prompt injection | Critical | Low | Adversarial test suite in W50; never include other-tenant data in context; KB is platform-wide only |
| AI deflection too low → human queue floods | High | Medium | Tune threshold in W52; add macros to speed human replies; KB iteration cycle |
| AI deflection too high → CSAT drops (wrong answers shipped) | High | Medium | CSAT survey gates the threshold; protection mode forces escalation if CSAT < target |
| Platform-owner queue grows unbounded if launch bigger than expected | High | Medium | SLA-aware auto-escalate to backup responder; per-tenant routing offloads tenant-specific tickets |
| KB drift from product reality | Medium | High | Weekly human review; KB version history with rollback; product-launch checklist requires KB review |
| AI provider rate-limit during incident spike | Medium | Medium | Budget guard auto-escalates to human in Protection/Exhausted state; cached canned responses available |
| Localized support quality varies | Medium | High | Eval set includes per-locale subset; per-locale CSAT tracked; weak locales fall back to human |

## Trello Code Convention
Phase 4 cards extend the prefix scheme using the `SUP` code introduced in Phase 3.5 W48:
- `[W50-AI-010]` aiSupportRouter Cloud Function
- `[W50-SEC-008]` Cross-tenant adversarial tests for support context
- `[W50-SUP-005]` AI router escalation email + SLA timer
- `[W51-RPT-006]` Support analytics dashboard
- `[W51-SUP-006]` CSAT survey + ticket tagging
- `[W52-AI-011]` Confidence threshold tuning + KB iteration

## What This Phase Does Not Cover
Explicitly out of scope and tracked as Phase 4+ backlog:
- Multi-channel support (email-in, WhatsApp-in, SMS-in) — in-app chat only for v1.
- Voice support / IVR.
- Public help center / docs site (separate marketing effort).
- Embedded LLM in mobile app — backend service only, per architecture doc.
- Cross-tenant ticket routing or shared KB across tenants beyond the platform-wide system prompt.
- Full RAG retrieval from a vector DB — system-prompt KB is sufficient at v1 volumes; revisit when monthly tickets > 1000.
- Tenant-customizable support branding beyond name/locale (defer to a later monetized tier).

## Cross-References
- Architecture spec: [AI_SUPPORT_SYSTEM_ARCHITECTURE.md](AI_SUPPORT_SYSTEM_ARCHITECTURE.md)
- Master index: [MULTITENANT_MASTER_INDEX.md](MULTITENANT_MASTER_INDEX.md)
- Gantt: [PROJECT_GANTT_AGILE_PLAN.md](PROJECT_GANTT_AGILE_PLAN.md)
- Tracking board: [PROGRAM_TRACKING_BOARD.md](PROGRAM_TRACKING_BOARD.md)
- Phase 3.5 (precedes this): [PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_45_TO_48.md](PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_45_TO_48.md)
- AI eval harness origin: W47 in [PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_45_TO_48.md](PHASE3_5_RELEASE_READINESS_PLAN_WEEKS_45_TO_48.md)
- AI budget guard: Phase 1 (delivered)
