# Multi-Tenant Build Prompts for Weeks 9-12

## How to Use This Document
- Run one build prompt at a time in Copilot Chat.
- Run the paired review prompt after each task.
- Keep each task in a separate branch/PR.
- Treat security and isolation as non-negotiable acceptance criteria.

Assumptions:
- Copilot is implementation developer
- You are prompt engineer and final reviewer
- Stack is React Native + Expo + Firebase

### Important Note: Subscription-Aware Features (New in v1.1)
These weeks (9-12) build advanced features that will later be gated by subscription tier in Week 13+. At this point:
- **Do NOT enforce subscription gating** (that comes in Week 14)
- **Do build subscription context awareness** into these features so Week 14 gating is trivial:
  - Week 10 (Campaigns): Add `subscriptionTierRequired` field to campaigns (e.g., only "professional" tier can create bulk campaigns)
  - Week 11 (Analytics/Reports): Add current subscription tier in report context (so later we can show/hide reports per tier)
  - Track which features are used per subscription tier for future upsell recommendations
- This forward compatibility saves major refactoring later

---

## Week 9 - Reviews Module

## Task 9.1 - Reviews Data Model and Repository
Prompt:
Implement reviews domain v1 for multi-tenant architecture.
Requirements:
1. Review fields: tenantId, locationId, staffId, bookingId, customerId, rating (1-5), comment, status, createdAt.
2. Repository methods: createReview, getBookingReview, listStaffReviews, listLocationReviews, moderateReview.
3. Enforce rule: review can only be created by customer tied to completed booking.
4. Add status enum: pending_moderation, published, hidden, rejected.
5. Add unit tests for eligibility and moderation permissions.
Return:
- files changed
- repository API summary
- tests added

Review prompt:
Review review-domain implementation for impersonation risk, duplicate-review loopholes, and moderation abuse vectors.

## Task 9.2 - Review Submission Flow (Client)
Prompt:
Implement client review submission flow after completed appointment.
Requirements:
1. Show CTA only for eligible completed bookings.
2. Prevent multiple submissions for same booking.
3. Add rating + optional comment form with validation.
4. Show clear success/failure feedback.
5. Add smoke tests for submit and duplicate-block behavior.
Return:
- files changed
- eligibility logic summary

Review prompt:
Review client review flow for eligibility edge cases and confusing UX states.

## Task 9.3 - Review Moderation Console (Admin)
Prompt:
Implement admin review moderation screen.
Requirements:
1. Tabs: pending_moderation, published, hidden/rejected.
2. Actions: publish, hide, reject with reason.
3. Add filtering by location and staff.
4. Capture moderation actor and timestamp in audit fields.
5. Add smoke tests for moderation actions.
Return:
- files changed
- moderation workflow summary

Review prompt:
Review moderation console for accidental destructive actions and missing audit traceability.

## Task 9.4 - Rating Aggregation and Display
Prompt:
Implement rating aggregation for staff and location profiles.
Requirements:
1. Calculate average rating and count from published reviews only.
2. Cache/update aggregate fields safely (trigger or scheduled sync).
3. Add fallback behavior when no reviews exist.
4. Add tests for aggregation math and status filtering.
5. Document in Documentation/new-platform/REVIEWS_AND_RATINGS.md.
Return:
- files changed
- aggregation strategy

Review prompt:
Review aggregation implementation for stale-cache and double-count risks.

---

## Week 10 - Campaigns, Segments, Activities, Challenges

## Task 10.1 - Customer Segmentation Engine v1
Prompt:
Implement segmentation engine for marketing audiences.
Requirements:
1. Support baseline segments: at_risk_30d, inactive_60d, new_customers_30d, high_value.
2. Segment inputs must be tenant-scoped and consent-aware.
3. Add query service returning customer IDs and counts.
4. Add unit tests for segment logic using fixtures.
5. Add docs in Documentation/new-platform/SEGMENTS.md.
Return:
- files changed
- segment definitions implemented

Review prompt:
Review segmentation logic for incorrect cohort boundaries and consent handling gaps.

## Task 10.2 - Campaign Domain and Scheduler
Prompt:
Implement campaign domain v1 with scheduled execution and subscription tier awareness.
Requirements:
1. Campaign fields: tenantId, name, channel, segmentId, templateId, status, scheduledAt, metrics, createdBy.
2. **NEW (for subscription gating in Week 14)**: Add field `requiredSubscriptionTier` (starter|professional|enterprise).
   - This field will determine if a tenant can create/run this campaign type during Week 14 gating
   - For now, allow all tenants to create campaigns; just store the tier requirement
3. Status enum: draft, scheduled, sending, completed, paused, cancelled.
4. Add scheduler to execute due campaigns.
5. Add send logs per recipient for traceability.
6. Add integration tests for schedule-to-send pipeline.
Return:
- files changed
- scheduler strategy
- tier field implementation

Review prompt:
Review campaign scheduler for retry loops, idempotency, partial-failure handling, and verify requiredSubscriptionTier field is persisted correctly.

## Task 10.3 - Template System and Variable Rendering
Prompt:
Implement campaign template system with safe variables.
Requirements:
1. Add template repository (tenant defaults + custom templates).
2. Support variable placeholders like customerFirstName, locationName, bookingLink.
3. Escape/sanitize rendered output to prevent malformed content.
4. Add preview endpoint/tool for admin.
5. Add tests for missing variables and fallback values.
Return:
- files changed
- variable rendering behavior

Review prompt:
Review template rendering for unsafe interpolation and broken fallback behavior.

## Task 10.4 - Activities and Challenges Module v1
Prompt:
Implement activities/challenges MVP for engagement.
Requirements:
1. Activities fields: tenantId, type, name, status, startDate, endDate, rules, reward.
2. Customer participation tracking collection.
3. Reward trigger logic for challenge completion.
4. Admin screens to create/activate/deactivate challenges.
5. Add tests for completion and reward awarding.
Return:
- files changed
- rules engine summary

Review prompt:
Review challenge module for reward abuse and duplicate-completion vulnerabilities.

## Task 10.5 - Marketplace Domain Foundation (Profiles, Posts, Visibility)
Prompt:
Implement marketplace data/domain foundation aligned with anti-client-theft product rules.
Requirements:
1. Add marketplace entities: salonPublicProfile, marketplacePost, marketplaceSettings.
2. Include settings for opt-in modes: full_profile, posts_only, hidden_search_direct_link.
3. Add post fields for service tags, style tags, optional "book this look" reference.
4. Enforce rule in booking context: no competitor recommendation payloads when tenant context is active.
5. Add tests for visibility modes and booking-context recommendation suppression.
6. Add docs in Documentation/new-platform/MARKETPLACE_DOMAIN.md.
Return:
- files changed
- schema summary
- anti-client-theft guard summary

Review prompt:
Review marketplace foundation for visibility leakage, weak moderation assumptions, and any competitor-injection path during booking.

---

## Week 11 - Analytics and Reporting

## Task 11.1 - Analytics Query Layer
Prompt:
Implement analytics query layer for tenant reporting with subscription tier context.
Requirements:
1. Build metrics services for retention, rebooking, at-risk, avg visit interval.
2. Add location-level and staff-level drilldowns.
3. **NEW (for subscription gating in Week 14)**: Include current tenant subscription tier in all report context.
   - Add method: getTenantAnalyticsContext() returning {tenantId, subscriptionTier, accessibleReports: [...]}
   - This allows Week 14 to easily filter which reports are visible per tier
4. Ensure all calculations use tenant-scoped, status-filtered data.
5. Add test fixtures and expected metric snapshots.
6. Add docs in Documentation/new-platform/ANALYTICS_QUERIES.md.
Return:
- files changed
- metric formulas implemented
- subscription tier context integration

Review prompt:
Review analytics layer for formula drift, wrong status filters, expensive query patterns, and subscription tier context correctness.

## Task 11.2 - Reporting Screens v1
Prompt:
Implement reporting screens for admin users.
Requirements:
1. KPI cards: retention, rebooking, at-risk, avg days between.
2. Service and staff performance summaries.
3. Client attention list with risk level and quick actions.
4. Location and date filters.
5. Add smoke tests for rendering/filter behavior.
Return:
- files changed
- UI flow summary

Review prompt:
Review reporting UI for interpretation risk and missing explanatory context for KPIs.

## Task 11.3 - Campaign and Engagement Metrics
Prompt:
Implement campaign and challenge analytics views.
Requirements:
1. Campaign KPIs: sent, delivered, opened, clicked, converted.
2. Challenge KPIs: participants, completion rate, rewards awarded.
3. Add export-ready data adapters.
4. Add tests for KPI aggregation correctness.
5. Add docs in Documentation/new-platform/MARKETING_ANALYTICS.md.
Return:
- files changed
- KPI definitions

Review prompt:
Review campaign/challenge analytics for attribution ambiguity and double-count risk.

## Task 11.4 - AI Data Readiness and Feature Store Contracts
Prompt:
Prepare AI-ready data contracts without releasing models yet.
Requirements:
1. Define feature tables/contracts for scheduling, retention, no-show risk, and marketplace personalization.
2. Include explainability fields (`reasonCodes`, `confidence`, `sourceSignals`) in contract design.
3. Add data quality checks for missing/late events.
4. Define opt-out and consent-safe filtering contract for AI messaging use cases.
5. Add docs in Documentation/new-platform/AI_DATA_CONTRACTS.md.
Return:
- files changed
- feature contract summary
- quality/consent safeguards

Review prompt:
Review AI data contracts for privacy violations, explainability gaps, and weak fallback behavior when features are missing.

## Task 11.5 - Data Export Endpoints (CSV/JSON)
Prompt:
Implement secure export endpoints for reports.
Requirements:
1. Export formats: CSV and JSON.
2. Tenant role-based access control enforced.
3. Export includes metadata: generatedAt, filter parameters, tenantId.
4. Add pagination or chunking for large exports.
5. Add tests for access control and format validity.
Return:
- files changed
- endpoint contract

Review prompt:
Review export implementation for data leakage and broken pagination/chunk behavior.

---

## Week 12 - Pilot Launch, Migration, Hardening

## Task 12.1 - Zara Tenant Bootstrap Script
Prompt:
Create bootstrap script to migrate Zara into Tenant 1 on new platform.
Requirements:
1. Create tenant record and primary location.
2. Map users into customer and tenantUsers roles.
3. Backfill bookings with tenantId/locationId and placeholder staff mapping rules.
4. Migrate loyalty balances and transactions.
5. Produce migration summary report with counts and mismatches.
Return:
- files changed
- migration script usage instructions
- validation checks included

Review prompt:
Review migration script for idempotency, rollback feasibility, and data corruption risk.

## Task 12.2 - Production Security and Rules Hardening
Prompt:
Finalize Firestore rules and role policy for production pilot.
Requirements:
1. Re-audit all collections for tenant and role constraints.
2. Remove temporary/dev backdoors.
3. Align rules with repository behavior and tests.
4. Add rule test cases for critical allow/deny paths.
5. Document in Documentation/new-platform/SECURITY_RULES_FINAL.md.
Return:
- files changed
- security test results

Review prompt:
Perform strict security review mindset. Report only findings with severity and exact reproduction paths.

## Task 12.3 - Operational Runbooks
Prompt:
Create runbooks for pilot operations.
Requirements:
1. Incident response runbook (P0/P1/P2).
2. Backup and restore runbook for Firebase data.
3. Rollback strategy for failed deploys.
4. Daily/weekly health checks and KPI thresholds.
5. Place docs under Documentation/new-platform/runbooks/.
Return:
- runbook files created
- operational checklist summary

Review prompt:
Review runbooks for missing steps, unrealistic assumptions, and unclear ownership.

## Task 12.4 - Pilot Go-Live Validation Pack
Prompt:
Create final pilot go-live validation pack.
Requirements:
1. End-to-end test checklist for core flows.
2. Release signoff template.
3. Known issues register and mitigation notes.
4. Post-launch monitoring checklist for first 14 days.
5. Add documentation in Documentation/new-platform/PILOT_GO_LIVE.md.
Return:
- files changed
- launch readiness summary (go/no-go)

Review prompt:
Review go-live pack for missing critical checks and hidden operational risks.

---

## End-of-Week Security Prompt Pack (Run Weekly)
Prompt:
Audit this week’s changes for:
1. Tenant isolation leaks
2. Role authorization bypasses
3. Unbounded queries or data overexposure
4. Missing audit metadata on sensitive actions
5. Inconsistent status transitions
Return findings ordered by severity with file paths and exact fixes.

---

## End-of-Week Documentation Prompt Pack (Run Weekly)
Prompt:
Append current week summary to Documentation/new-platform weekly log.
Include:
1. Features completed
2. Tests and quality outcomes
3. Open defects and technical debt
4. Index/rule changes
5. Next-week prerequisites
No rewriting of prior weeks.

---

## Week-Close Acceptance Prompt
Prompt:
Generate week-close readiness report.
Include:
1. Planned vs delivered
2. Critical defects remaining
3. Security and data integrity posture
4. Release risk score (low/medium/high)
5. Recommendation: proceed, proceed-with-conditions, or hold
Return concise executive summary.

---

## Phase Completion Prompt (After Week 12)
Prompt:
Produce a core-phase completion report (Weeks 1-12) from repository state and docs.
Include:
1. Delivered capabilities by domain
2. Migration readiness for Zara Tenant 1
3. Outstanding gaps for scale to tenant 2+
4. Recommended next 8-week backlog (Weeks 13-20)
Return structured markdown suitable for stakeholder review.
