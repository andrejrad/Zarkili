# Loyalty Functional Spec v1

## Document Metadata
- Version: 1.0
- Date: April 2026
- Status: Implementation-ready for Week 8 scope
- Owner: Product + Engineering

## 1. Purpose
Define the functional behavior of tenant-scoped loyalty and referrals so implementation, QA, and support use one shared source of truth.

## 2. Scope
In scope for v1:
- Loyalty enrollment (optional)
- Customer loyalty state (points, tier, tierName, referralCode)
- Transaction ledger model
- Earning rules
- Redemption and manual adjustments
- Referral reward flow
- Client and admin loyalty UI behavior

Out of scope for v1:
- Global cross-tenant loyalty wallet
- Dynamic campaign-driven loyalty multipliers
- Real-money wallet or payment settlement
- Full gamification/challenges integration

## 3. Core Principles
1. Tenant-scoped always: no cross-tenant points visibility or mutation.
2. Ledger-first accounting: balance changes only through transactions.
3. Deterministic computation: same event must produce same outcome.
4. Idempotent rewards: duplicate event processing must not duplicate credits.
5. Auditable changes: all sensitive mutations include actor metadata.

## 4. Actors and Permissions
- Client:
  - View own points, tier, and transaction history in active tenant context.
  - Enroll in loyalty if enabled.
  - Redeem allowed rewards from own balance.
- Tenant admin/location manager:
  - View tenant loyalty overview.
  - Perform manual adjustments with reason.
  - Process redemption actions.
- Platform owner:
  - No direct day-to-day balance edits expected in v1.
  - Can inspect data for support/debug if needed.

## 5. Enrollment Behavior
- Loyalty enrollment is optional in onboarding.
- If loyalty is enabled for tenant, user can join with one tap.
- If user declines, user can enroll later.
- Retroactive points are tenant-policy controlled (off by default unless explicitly enabled).

## 6. Data Model (Functional)

### 6.1 Customer loyalty state
Stored per customer record under tenant context:
- points: number
- tier: number or enum key
- tierName: string
- referralCode: string (stable)
- updatedAt

### 6.2 Loyalty transactions ledger
Append-only records per customer:
- transactionId
- tenantId
- customerId
- type: credit | debit | adjustment | redemption
- reasonCode: completed_booking | rebook_bonus | referral_reward | social_share_reward | manual_adjustment | redemption
- pointsDelta: signed integer
- balanceBefore
- balanceAfter
- referenceType: booking | referral | share | admin_action | redemption
- referenceId
- idempotencyKey
- actorType: system | admin | client
- actorId
- createdAt
- metadata (optional structured context)

## 7. Balance and Ledger Invariants
1. Current points equals sum of all pointsDelta entries for that customer and tenant.
2. Every balance mutation creates exactly one transaction row.
3. No transaction may omit tenantId, customerId, actorType, actorId.
4. Debits/redemptions must fail if resulting balance would be negative.
5. Ledger entries are immutable after creation (corrections use compensating transactions).

## 8. Earning Rules (v1)

### 8.1 Completed appointment reward
- Trigger: booking transitions to completed.
- Behavior: credit points per tenant rule.
- Timing: points are awarded after completion status is final.

### 8.2 Rebook bonus (within window)
- Trigger: customer creates qualifying rebook in configured time window after prior completed booking.
- Behavior: additional bonus points.
- Guard: apply once per qualifying window/event policy.

### 8.3 Referral reward
- Trigger: referred customer reaches qualifying milestone (default: first completed booking).
- Behavior: reward referrer, and optionally referred customer depending on tenant config.
- Guards:
  - no self-referral
  - no duplicate reward for same referral relationship

### 8.4 Social share reward
- Trigger: eligible share action event.
- Behavior: limited reward credits.
- Guard: enforce monthly cap per customer.

## 9. Idempotency and Duplicate Protection
- Each reward evaluation must carry deterministic idempotencyKey.
- Reprocessing same key must be no-op.
- Recommended key pattern:
  - completed booking: loyalty:booking_completed:{tenantId}:{bookingId}
  - rebook bonus: loyalty:rebook_bonus:{tenantId}:{customerId}:{windowStart}:{windowEnd}
  - referral: loyalty:referral_reward:{tenantId}:{referrerId}:{referredId}:{milestone}
  - social share: loyalty:social_share:{tenantId}:{customerId}:{shareEventId}

## 10. Redemption and Manual Adjustments
- Redemption creates debit transaction with reasonCode=redemption.
- Manual adjustments require:
  - admin role authorization
  - non-empty reason
  - actor metadata capture
- Any rollback is done by compensating transaction, never hard edit/delete.

## 11. Tiering Behavior
- Tier is derived from configurable thresholds over current points or rule-set policy.
- Tier updates happen after any balance mutation that crosses threshold boundary.
- Client UI must show:
  - current tier
  - current points
  - progress to next tier (if available)

## 12. UI Functional Expectations

### 12.1 Client loyalty view
- Show current points and tier badge.
- Show transaction history ordered by createdAt desc.
- Show locked/unlocked rewards clearly.
- Handle loading, empty, and error states.

### 12.2 Admin loyalty view
- Tenant-level overview metrics.
- Per-customer adjustment and redemption actions.
- Confirmation steps for destructive actions (debit/adjust).
- Audit-friendly display of who changed what and when.

## 13. Error Handling (User-facing)
- Insufficient balance: redemption blocked with clear message.
- Duplicate event ignored: no user error, log internally.
- Missing qualification for reward: no credit, return reason code.
- Unauthorized admin adjustment: reject and audit.

## 14. Security and Isolation Requirements
- Every query and write is filtered by tenantId.
- Role checks mandatory for admin actions.
- Referral lookup and rewards cannot cross tenants.
- No loyalty data shown outside active tenant context.

## 15. QA Acceptance Criteria (Minimum)
1. Completed booking credits exactly once.
2. Reprocessing same reward event does not alter balance.
3. Manual admin adjustment logs actor and reason.
4. Redemption cannot produce negative points.
5. Referral flow blocks self-referral and duplicate credit.
6. Client sees accurate transaction history and tier progress.
7. Tenant A cannot read or mutate Tenant B loyalty data.

## 16. Observability
- Log reward evaluations with idempotency key, outcome, and reason.
- Log failed/blocked operations with error code and tenantId.
- Dashboard counters recommended:
  - credits by reasonCode
  - debits/redemptions
  - duplicate-event drops
  - failed authorization attempts

## 17. Rollout Notes
- Planned implementation window: Week 8.
- Migration requirement: backfill existing loyalty balances and transaction history when onboarding legacy tenant data.
- Support playbook note: points are awarded after appointment completion is confirmed.
