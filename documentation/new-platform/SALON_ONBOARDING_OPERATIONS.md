# Salon Onboarding — Operations Guide

**Owner:** Platform Operations  
**Audience:** Platform admins, tenant owners, support engineers  
**Last updated:** Week 15 (W15.1 + W15.2)

This guide documents the salon onboarding wizard, the admin operations available
for unblocking salons in trouble, and the audit trail backing every override.

---

## 1. Wizard overview (W15.1)

The wizard is modelled in `src/domains/onboarding`:

| File | Responsibility |
|------|----------------|
| `model.ts` | Steps, statuses, validation, guidance, schema version |
| `repository.ts` | Firestore I/O for state, drafts, and timeline |
| `wizardService.ts` | Orchestration: validate → save draft → advance step |
| `adminService.ts` | Audited admin overrides (W15.2) |

### 1.1 Steps

The wizard has **9 steps**, defined in `ONBOARDING_STEPS`:

`ACCOUNT → BUSINESS_PROFILE → PAYMENT_SETUP → SERVICES → STAFF → POLICIES →
AVAILABILITY → MARKETPLACE_VISIBILITY → VERIFICATION`

A salon may **go live** once all steps in `GO_LIVE_REQUIRED_STEPS`
(`BUSINESS_PROFILE`, `SERVICES`, `AVAILABILITY`) are `completed`. Other steps
are recommended but not blocking.

### 1.2 Drafts and resume

Every step accepts a free-form `payload` saved as a versioned draft at
`tenants/{tenantId}/onboardingDrafts/{step}`. The schema version is
`WIZARD_SCHEMA_VERSION` (currently `1`); bump it when introducing breaking
changes to a step's required fields.

The wizard supports two flows:

- **Happy path** — start → submit each step → wizard auto-advances → can go live
- **Resumed path** — start → save partial drafts → close UI → call
  `WizardService.resume(tenantId)` to retrieve the current state plus all
  per-step drafts and rehydrate the UI

### 1.3 Validation

`validateStepPayload(step, payload)` checks each step against
`STEP_REQUIRED_FIELDS`. A field is "missing" when it is `undefined`, `null`,
an empty/whitespace string, or an empty array. `boolean false` is treated as a
present value.

`WizardService.submitStep` runs validation before persisting; on failure it
throws `WizardValidationError` carrying the failing step name and the list of
missing fields.

### 1.4 Guidance

`STEP_GUIDANCE[step]` returns the short helper text shown next to each step in
the wizard UI. Translation is the consumer's responsibility — these strings are
the canonical English copy.

---

## 2. Admin operations (W15.2)

`OnboardingAdminService` exposes three audited operations. All three:

1. Reject any actor whose role is not `platform_admin` or `tenant_owner`
2. Require a non-empty `reason` string
3. Append a single event to `tenants/{tenantId}/onboardingTimeline/{eventId}`

Each operation accepts a caller-provided `eventId` to keep writes idempotent —
the repository rejects duplicates.

### 2.1 Operations matrix

| Operation | Allowed roles | Side effects | Audit `action` |
|-----------|---------------|--------------|----------------|
| `extendTrial(actor, tenantId, daysAdded, reason, eventId)` | `platform_admin`, `tenant_owner` | Calls injected `trialExtender` (if provided), then appends timeline event | `extend_trial` |
| `resetStep(actor, tenantId, step, reason, eventId)` | `platform_admin`, `tenant_owner` | Sets `stepStatuses[step] = "pending"`, recomputes blockers and `canGoLive`, appends timeline event | `reset_step` |
| `applyVerificationOverride(actor, tenantId, reason, eventId)` | `platform_admin`, `tenant_owner` | Sets `stepStatuses.VERIFICATION = "completed"`, appends timeline event | `verification_override` |
| `listTimeline(tenantId)` | _read-only_ | Returns events newest-first | _none_ |

### 2.2 Permission errors

Unauthorized callers get `OnboardingPermissionError`. Validation failures
(missing reason, non-positive `daysAdded`) throw plain `Error` with a message
referencing the offending field.

### 2.3 Trial extension wiring

`OnboardingAdminService` accepts an optional
`trialExtender: (tenantId, daysAdded) => Promise<void>` dependency. When
provided, it is invoked **before** the timeline event is recorded, so a failed
trial extension never leaves a misleading audit row. When omitted (e.g. in
tests or audit-only contexts) the timeline event is recorded with no side
effect on the trial domain.

---

## 3. Firestore rules

### 3.1 `tenants/{tenantId}/onboardingDrafts/{step}`

- **Read:** `platformAdmin || tenantAdmin(tenantId)`
- **Create / update:** same as read, plus the document must include
  matching `tenantId`, matching `step`, and a positive integer
  `schemaVersion` ≥ the current value
- **Delete:** `platformAdmin || tenantOwnerOrAdmin(tenantId)`

### 3.2 `tenants/{tenantId}/onboardingTimeline/{eventId}`

- **Read:** `platformAdmin || tenantAdmin(tenantId)`
- **Create:** `platformAdmin || tenant_owner` only; required fields must
  match (`tenantId`, `eventId`, `action ∈ {extend_trial, reset_step,
  verification_override, manual_advance}`, `actorRole ∈ {platform_admin,
  tenant_owner}`, non-empty `reason`)
- **Update / delete:** **forbidden** — the timeline is append-only

---

## 4. Operational runbooks

### 4.1 Salon stuck on a step

1. Locate the salon's `tenantId`.
2. Inspect the wizard state at `tenants/{tenantId}/onboarding/wizard`.
3. If the issue is bad data on a single step, call
   `OnboardingAdminService.resetStep(actor, tenantId, step, reason, eventId)`
   with a freshly minted `eventId` (e.g. `crypto.randomUUID()`). The salon can
   then re-enter the step through the wizard UI.
4. Confirm the audit row in
   `tenants/{tenantId}/onboardingTimeline` shows the action.

### 4.2 Trial expired before salon could go live

1. Confirm the underlying reason with the customer.
2. Call
   `OnboardingAdminService.extendTrial(actor, tenantId, daysAdded, reason, eventId)`.
   Provide a `trialExtender` wired to the trial domain in production.
3. Verify the trial document's `trialEndsAt` shifted by the expected number of
   days and that a timeline row is present.

### 4.3 Verification override

Use only when verification documents have been validated **out-of-band** (e.g.
manual review by compliance). The override marks the `VERIFICATION` step
completed but leaves a permanent audit row recording who approved and why.

---

## 5. Smoke tests

Both wizard flows are covered in
`src/domains/onboarding/__tests__/wizardService.test.ts`:

- `WizardService — resume (smoke tests) › happy path`
- `WizardService — resume (smoke tests) › resumed path`

Admin operations and permission checks are covered in
`src/domains/onboarding/__tests__/adminService.test.ts`.

---

## 6. Open questions / debt

See `documentation/new-platform/DEBT_REGISTER.md` for any outstanding
onboarding-related items.
