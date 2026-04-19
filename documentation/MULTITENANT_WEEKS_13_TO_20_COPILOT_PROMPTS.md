# Multi-Tenant Build Prompts for Weeks 13-20

## How to Use This Document
- Run one build prompt at a time in Copilot Chat.
- Run the paired review prompt after each task.
- Keep each task in a separate branch/PR.
- Treat payments, onboarding integrity, and AI safety as release-critical.

Assumptions:
- Copilot is implementation developer
- You are prompt engineer and final reviewer
- Stack is React Native + Expo + Firebase + Stripe

## Mandatory Cross-Platform Gates
Apply these gates to every implementation and review prompt in this document.

Required checks before completing a task:
1. Run web smoke checks: npm run test:smoke:web
2. Run native smoke checks: npm run test:smoke:native
3. Run full quality checks: npm run check

Required documentation and scope rules:
1. Declare platform scope in each task summary: web, ios, android, or platform-limited.
2. If platform-limited behavior is introduced, document capability guard and fallback in documentation/new-platform/CROSS_PLATFORM_CAPABILITY_MATRIX.md.
3. For route/auth/tenant-sensitive tasks and launch-critical flows, treat web and native parity as release-critical.

---

## Week 13 - Stripe Integration Foundation

## Task 13.1 - Stripe Billing Domain (SaaS Subscriptions)
Prompt:
Implement Stripe Billing integration for tenant SaaS subscriptions.
Requirements:
1. Add billing customer lifecycle and plan mapping (monthly/annual).
2. Add subscription statuses and webhooks: trialing, active, past_due, suspended, cancelled.
3. Persist normalized subscription record in `subscriptions` collection.
4. Add idempotency handling for duplicate webhook delivery.
5. Add tests for create/renew/cancel/past_due transitions.
Return:
- files changed
- webhook mapping summary
- state-transition test summary

Review prompt:
Review Stripe Billing integration for idempotency holes, status drift, and billing-state race conditions.

## Task 13.2 - Stripe Connect Domain (Salon Payouts)
Prompt:
Implement Stripe Connect onboarding and account-state handling for salon payouts.
Requirements:
1. Add connected account creation/linking flow for tenant owners.
2. Persist connect status: not_started, pending_verification, active, restricted.
3. Add webhook handlers for account.updated and payout failure events.
4. Add admin visibility for connect health.
5. Add tests for onboarding success/fail/restricted paths.
Return:
- files changed
- connect-state model
- test summary

Review prompt:
Review Connect implementation for payout-blocking regressions and missing verification recovery flows.

---

## Week 14 - Free Trial and Gating

## Task 14.1 - Free Trial Lifecycle Engine
Prompt:
Implement configurable free trial engine for tenant accounts.
Requirements:
1. Default trial: 14 days, configurable override.
2. Trial states: not_started, active, expiring_soon, expired, upgraded.
3. Trial activation trigger: onboarding complete AND launch activation trigger.
4. Expiry job must be idempotent and retry-safe.
5. Add tests for activation, expiring_soon, expiry, and upgrade-before-expiry.
Return:
- files changed
- lifecycle state machine
- job idempotency strategy

Review prompt:
Review trial engine for timer drift, duplicate-expiry behavior, and incorrect activation triggers.

## Task 14.2 - Subscription and Trial Feature Gating
Prompt:
Implement feature-gating middleware using subscription and trial status.
Requirements:
1. Guard feature groups: booking creation, marketplace visibility, outbound campaigns, advanced analytics, AI automations.
2. Respect grace period behavior for past_due tenants.
3. Add suspension banner and upgrade CTA in admin shell.
4. Add audit logs for gate denials.
5. Add tests for all gate states.
Return:
- files changed
- gate matrix
- denial audit model

Review prompt:
Review gating rules for bypass risk, inconsistent enforcement between UI and backend, and missing audit trails.

---

## Week 15 - Salon Onboarding Wizard v1

## Task 15.1 - End-to-End Salon Onboarding Wizard
Prompt:
Implement complete salon onboarding wizard with resumable progress.
Requirements:
1. Steps: Account, Business Profile, Payment Setup, Services, Staff, Policies, Availability, Marketplace Visibility, Verification.
2. Add `saveDraft`/`resumeDraft` support with versioned schema.
3. Add completion score and launch blockers.
4. Validate required fields and show step-specific guidance.
5. Add smoke tests for happy path and resumed path.
Return:
- files changed
- wizard state contract
- validation summary

Review prompt:
Review wizard for abandonment risk, poor error recovery, and blocker loopholes.

## Task 15.2 - Salon Onboarding Admin Controls
Prompt:
Implement admin controls for onboarding oversight and support.
Requirements:
1. Add onboarding status dashboard for platform owner.
2. Add actions: extend trial, reset step, mark verification override (audited).
3. Add history timeline of onboarding events.
4. Add tests for permission checks.
5. Document in Documentation/new-platform/SALON_ONBOARDING_OPERATIONS.md.
Return:
- files changed
- admin operations summary

Review prompt:
Review onboarding admin controls for privilege abuse, weak auditing, and unsafe manual overrides.

---

## Week 16 - Client Onboarding Integration v1

## Task 16.1 - Unified Client Onboarding Orchestration
Prompt:
Implement unified client onboarding orchestration across booking and discovery entry points.
Requirements:
1. Preserve guest booking (email + phone) and full-account path (email/password/social).
2. Single orchestration layer for all entry points: booking, save post, like, message, loyalty join.
3. Add post-booking guest-upgrade flow to full account.
4. Ensure booking/payment context continuity during upgrade.
5. Add tests for account merge and continuity.
Return:
- files changed
- orchestration flow
- merge test summary

Review prompt:
Review client onboarding orchestration for account duplication, conversion drop-offs, and booking context loss.

## Task 16.2 - Client Preference and Notification Setup
Prompt:
Implement optional client setup modules and persistence.
Requirements:
1. Add optional modules: profile, payment method, preferences, notification permissions, loyalty enrollment.
2. Enforce consent-safe defaults for notifications and promotions.
3. Add progressive prompting (do not block booking completion).
4. Add tests for skip/resume behavior.
5. Document in Documentation/new-platform/CLIENT_ONBOARDING_MODULES.md.
Return:
- files changed
- module persistence summary

Review prompt:
Review client setup modules for excessive friction, consent mistakes, and poor default behavior.

---

## Week 17 - Marketplace Launch v1

## Task 17.1 - Marketplace Feed, Search, and Profile UX
Prompt:
Implement production marketplace UX v1.
Requirements:
1. Feed mode with infinite scroll and style/service tags.
2. Search mode with location, service, price, rating, availability filters.
3. Salon profile view with gallery, services, policies, and booking CTA.
4. Post view with "Book this look" deep-link behavior.
5. Add tests for filter behavior and deep-link routing.
Return:
- files changed
- UX flow summary

Review prompt:
Review marketplace UX for discoverability, performance bottlenecks, and deep-link breakage.

## Task 17.2 - Anti-Client-Theft Enforcement
Prompt:
Implement explicit anti-client-theft constraints in booking and profile flows.
Requirements:
1. Suppress competitor recommendations in active salon booking flows.
2. Ensure marketplace attribution links client acquisition to originating salon.
3. Add policy checks for no-commission model messaging.
4. Add tests proving no competitor injection in booking context.
5. Add docs in Documentation/new-platform/MARKETPLACE_GUARDRAILS.md.
Return:
- files changed
- guardrail summary

Review prompt:
Review anti-client-theft constraints for hidden cross-promotion paths and attribution errors.

---

## Week 18 - Marketplace Analytics and Moderation

## Task 18.1 - Marketplace Attribution and Revenue Analytics
Prompt:
Implement marketplace analytics for salons and platform admins.
Requirements:
1. Track profile views, post engagement, booking clicks, booking conversion, marketplace-sourced revenue.
2. Add per-post performance and tag effectiveness metrics.
3. Add tenant-level dashboard widgets.
4. Add tests for attribution correctness.
5. Document metrics definitions.
Return:
- files changed
- attribution model summary

Review prompt:
Review attribution logic for double counting, broken source tracking, and delayed-event inconsistencies.

## Task 18.2 - Marketplace Moderation and Abuse Controls
Prompt:
Implement moderation controls for marketplace content.
Requirements:
1. Add post moderation statuses and review queue.
2. Add reporting/flagging flow for problematic content.
3. Add reversible moderation actions with audit trail.
4. Add tests for role-based moderation permissions.
5. Document in Documentation/new-platform/MARKETPLACE_MODERATION.md.
Return:
- files changed
- moderation workflow summary

Review prompt:
Review moderation controls for abuse vectors, missing auditability, and over-aggressive false positives.

---

## Week 19 - AI Assistance v1

### Mandatory Runtime Cost and Guard Checklist (Applies to all Week 19 and Week 20 AI tasks)

Every AI task below must implement and prove all checklist items:
1. Add feature-tagged AI request logging (feature key, tenantId, model tier, token usage, cost estimate, latency).
2. Enforce per-feature monthly cap checks and global monthly cap check before model call.
3. Enforce state thresholds: Healthy (<70%), Warning (70-90%), Protection (>90%), Exhausted (>=100%).
4. In Protection state, disable premium escalation model paths for that feature.
5. In Exhausted state, bypass model call and return deterministic fallback path.
6. Keep core booking and operational user actions available even when AI is degraded.
7. Add tests for cap-hit behavior, fallback path correctness, and no-blocking UX behavior.
8. Document implementation decisions in `documentation/new-platform/AI_RUNTIME_AND_COST_POLICY.md` alignment notes.

Return addendum required for every Week 19/20 AI task:
- budget guard implementation summary
- fallback behavior summary on cap-hit and provider-error paths
- test evidence for warning/protection/exhausted states

## Task 19.1 - AI Chat Assistance
Prompt:
Implement AI chat assistance for FAQ, service info, and booking guidance.
Requirements:
1. Add tenant-scoped context retrieval for AI responses.
2. Add confidence and escalation policy for uncertain outputs.
3. Add safety filters and logging.
4. Add tests for fallback and escalation behavior.
5. Document AI response policy.
6. Apply runtime budget guards and cap-state behavior from the mandatory checklist.
Return:
- files changed
- escalation policy summary

Review prompt:
Review AI chat for hallucination risk, unsafe responses, and tenant context leakage.

## Task 19.2 - AI Scheduling, Retention, and Content Assistants
Prompt:
Implement first AI assistant set for operational value.
Requirements:
1. Scheduling suggestions that respect business/staff constraints.
2. Retention risk suggestions with explainability fields.
3. Marketing/content generation assistant with tone controls.
4. Human approval mode for outbound AI-generated campaigns.
5. Add tests for rule compliance and explainability output.
6. Apply runtime budget guards and per-assistant feature-cap enforcement.
Return:
- files changed
- assistant capability summary

Review prompt:
Review AI assistants for policy violations, weak explainability, and unauthorized auto-send behavior.

## Task 19.3 - AI Service Recommendations Engine v1
Prompt:
Implement AI service recommendation engine for booking, salon profile, and marketplace surfaces.
Requirements:
1. Add recommendation service using tenant-safe signals: booking history, service affinity, style tags, and saved interactions.
2. Return explainable outputs per recommendation: `reasonCodes`, `confidence`, `sourceSignals`.
3. Add client-side integration points for booking flow and salon profile upsell/add-on suggestions.
4. Add salon-side recommendation insights for upsell/package suggestions.
5. Enforce safeguards: no unavailable services, no out-of-price-policy suggestions, no inappropriate category output.
6. Add tests for relevance fallback, unavailable-service filtering, and safeguard policy enforcement.
7. Apply runtime budget guards and deterministic fallback recommender when feature cap is exhausted.
Return:
- files changed
- recommendation contract summary
- explainability output example

Review prompt:
Review service recommendation engine for unsafe suggestions, weak explainability, and cross-tenant context leakage.

## Task 19.4 - AI Marketing Automation Orchestrator v1
Prompt:
Implement AI-driven marketing orchestration for retention and rebooking automation.
Requirements:
1. Add trigger orchestration for time-based, behavior-based, booking-based, no-show-based, and loyalty-based triggers.
2. Add channel orchestration for push/email/sms/in-app with send-window constraints and anti-spam frequency caps.
3. Support tone/profile controls and human approval mode with optional auto-send configuration per campaign type.
4. Enforce consent and opt-out checks before every dispatch attempt.
5. Add suppression rules for quiet hours and duplicate-trigger dedupe/idempotency behavior.
6. Add tests for trigger eligibility, opt-out safety, quiet-hour suppression, and approval-mode enforcement.
7. Apply runtime budget guards and degrade to rules-only campaign eligibility logic on cap exhaustion.
Return:
- files changed
- orchestration flow summary
- policy safeguards implemented

Review prompt:
Review marketing automation for spam risk, consent bypass, policy-unsafe sends, and missing human-override controls.

## Task 19.5 - AI Retention and Insights Copilot v1
Prompt:
Implement AI retention scoring and action-oriented insight generation.
Requirements:
1. Add retention risk scoring outputs: at-risk probability, likely churn horizon, and suggested intervention actions.
2. Add explainable insight cards for salon admins with `reasonCodes`, `confidence`, and recommended next actions.
3. Add automated action queue generation (review/approve/send) rather than direct forced sends.
4. Add fairness safeguards: no sensitive-attribute inference, no protected-group targeting logic.
5. Add tests for explainability presence, fallback behavior when signals are weak, and policy-safe action generation.
6. Document in `documentation/new-platform/AI_RETENTION_INSIGHTS.md`.
7. Apply runtime budget guards and degrade to metrics-only insights when narrative generation is capped.
Return:
- files changed
- scoring and insights contract
- action queue summary

Review prompt:
Review retention and insights copilot for black-box behavior, policy violations, and non-actionable recommendations.

## Task 19.6 - AI Scheduling Optimization Engine v1
Prompt:
Implement scheduling optimization engine for client suggestions and salon-side operational optimization.
Requirements:
1. Add client-side slot ranking that optimizes for calendar gaps, staff utilization, and client preference history.
2. Add salon-side optimization suggestions for staff assignment, buffer management, and overbooking prevention flags.
3. Add smart rescheduling recommendations on cancellation events with replacement-slot and candidate outreach hooks.
4. Enforce hard constraints: business hours, staff availability, service duration rules, and no double-booking.
5. Add non-functional targets and instrumentation: recommendation latency target, fallback behavior, and observability counters.
6. Add tests for constraint safety, double-book prevention, and rescheduling recommendation validity.
7. Apply runtime budget guards and degrade to slot-engine heuristic ranking when AI budget is constrained.
Return:
- files changed
- optimization strategy summary
- latency/fallback instrumentation notes

Review prompt:
Review scheduling optimization for rule-override risk, unsafe slot recommendations, and poor fallback under sparse data.

---

## Week 20 - AI Risk Models and Personalization

## Task 20.1 - No-Show/Fraud Prediction
Prompt:
Implement no-show and fraud risk scoring with explainable outputs.
Requirements:
1. Add risk scoring pipeline using consent-safe inputs only.
2. Output risk score + reason codes + recommended action.
3. Add thresholds configurable by tenant policy.
4. Add monitoring for model drift and false positives.
5. Add tests for threshold actions and fallback behavior.
6. Apply runtime budget guards and degrade to rules-only risk flags with mandatory human review.
Return:
- files changed
- risk model contract

Review prompt:
Review risk scoring for discriminatory signals, overblocking behavior, and missing override paths.

## Task 20.2 - Marketplace Personalization Engine
Prompt:
Implement AI-based marketplace personalization v1.
Requirements:
1. Personalize feed ranking by user preferences, interactions, and booking history.
2. Respect hard constraints: no competitor suggestions inside active salon booking context.
3. Add fallback ranking for cold-start users.
4. Add observability metrics for click-through and booking conversion lift.
5. Document in Documentation/new-platform/MARKETPLACE_PERSONALIZATION.md.
6. Apply runtime budget guards and degrade to deterministic ranking without generated rationale when capped.
Return:
- files changed
- ranking strategy

Review prompt:
Review personalization engine for leakage of restricted recommendations, filter bubbles, and weak cold-start behavior.

---

## End-of-Week Security Prompt Pack (Run Weekly)
Prompt:
Audit all changes from this week for tenant isolation, authorization vulnerabilities, payment safety, and AI policy compliance.
Check:
1. Any write path missing tenantId
2. Any query missing tenant filter
3. Any payment flow missing idempotency or signature verification
4. Any onboarding/admin action without role check
5. Any AI flow without safety fallback and audit logs
Return findings ordered by severity with exact file paths and remediation steps.

---

## End-of-Week Documentation Prompt Pack (Run Weekly)
Prompt:
Update Documentation/new-platform with this week's delivery summary.
Include:
1. Completed tasks
2. Files/modules changed
3. Test outcomes and coverage notes
4. Known issues and deferred items
5. Next week's prerequisites
Do not rewrite older summaries. Append only.

---

## Week-Close Acceptance Prompt
Prompt:
Generate a week-close report from repository state.
Include:
1. Planned vs delivered
2. Passing/failing tests and causes
3. Security and index changes
4. Outstanding technical debt
5. Go/No-go recommendation for next week
Return concise decision-oriented summary.
