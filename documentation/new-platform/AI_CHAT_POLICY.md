# AI Chat Policy (Week 19)

## Scope

This policy governs the AI Chat Assistance surface delivered as part of Week 19 (Task 19.1). It applies to client-facing, admin-facing, and staff-facing chat experiences powered by `createChatAssistantService` (`src/domains/ai/chatAssistantService.ts`).

## Cost-guard alignment

- **Feature key:** `support-triage`. Chat assistance and support triage share a single cost bucket because both are conversational text-routing surfaces with substantially overlapping prompt and model costs. This keeps starter caps simple and predictable in W19; if telemetry shows the surfaces drift apart in cost shape, a dedicated `chat-assistance` key can be added to `aiFeatureKeys` in `src/shared/ai/budgetGuard.ts` without changing this service's contract.
- **Per-feature monthly cap:** Inherited from `defaultAiBudgetGuardConfig.featureCaps["support-triage"]` (currently $120/month per tenant).
- **Budget states honoured:**
  - `healthy` → premium model tier (`high`).
  - `warning` → premium tier still allowed; telemetry alert emitted.
  - `protection` → automatic downshift to `low-cost` tier.
  - `exhausted` → provider call bypassed; deterministic escalation to humans (`CHAT_ASSISTANT_FALLBACK_MESSAGE`).
- **Telemetry:** Every call emits a `buildAiCostTelemetryEvent` event via `logTelemetryEvent`. Non-`none` alert levels also fire `logAlert`.

## Tenant isolation

- Context retrieval is delegated to an injected `retrieveContext` port. The service asserts the returned `ChatContext.tenantId` matches the request `tenantId`. A mismatch escalates with `escalationReason = "context-isolation-violation"` and the model is **not** called.

## Safety + escalation

- All model output passes through an injected `applySafetyFilter` port. Unsafe output escalates with `escalationReason = "unsafe-output"`.
- A confidence threshold (`DEFAULT_CHAT_CONFIDENCE_THRESHOLD = 0.6`, overridable via `deps.confidenceThreshold`) guards against low-confidence responses. Below the threshold the response escalates with `escalationReason = "low-confidence"`.
- Provider exceptions (context retrieval or model call) escalate with `escalationReason = "model-error"`.

## Operator surfaces

- Telemetry events are written through the standard `logTelemetryEvent` port and surfaced in the AI Cost Operations dashboard delivered in W17.
- Guard decisions are observable per call via `logGuardDecision` for audit + replay during rollout.

## Documentation cross-references

- `documentation/AI_RUNTIME_AND_COST_POLICY.md` — global policy + thresholds + decision tree (single source of truth).
- `documentation/AI_FEATURES_SPECS.md` — product surface descriptions.
- `src/shared/ai/budgetGuard.ts` — guard implementation + feature cap registry.
- `src/domains/ai/chatAssistantService.ts` — service implementation.

## Open follow-ups

- Decide whether to promote chat-assistance to its own feature key once 2-3 months of telemetry are available; doing so requires (1) extending `aiFeatureKeys`, (2) seeding `defaultAiBudgetGuardConfig.featureCaps`, and (3) updating this policy. Until then, chat is intentionally cost-bucketed with support-triage.
