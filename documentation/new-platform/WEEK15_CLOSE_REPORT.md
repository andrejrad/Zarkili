# Week 15 Close Report — Salon Onboarding Wizard v1 + Admin Controls

**Window:** Week 15 (single execution day)
**Status:** ✅ COMPLETE — GO for Week 16
**Tasks:** 15.1 (Salon Onboarding Wizard v1) + 15.2 (Salon Onboarding Admin Controls) + KI-001 closure

---

## 1. Scope decision

Week 15's prompt covers two functional tasks (15.1 wizard v1, 15.2 admin controls). The freshly-created [DEBT_REGISTER.md](DEBT_REGISTER.md) listed six items targeted at W15:

| ID | Decision |
|----|----------|
| **KI-001** (`staffSchedules` RBAC) | **Verified + closed in W15.** Audit showed `firestore.rules` already includes `location_manager` in `isTenantAdmin` (line 29) and grants reads via `isTenantMember`. Repository has no extra service-layer check. Already permissive — no code change required. |
| **KI-003** (rules emulator wiring) | **Rolled to W16.** W15 added 5 new emulator-style tests for the new collections; the actual emulator wiring stays a separate workstream. |
| **W13-DEBT-1** (Cloud Function `stripeWebhookHandler`) | **Rolled to W16.** Backend / Cloud Function work; W15 scope is the onboarding domain + admin. |
| **W13-DEBT-4** (`cancelAtPeriodEnd` end-to-end) | **Rolled to W16** (paired with W13-DEBT-1). |
| **W14-DEBT-1** (Cloud Function `stripeTaxCalculate`) | **Rolled to W16** (backend pass). |
| **W14-DEBT-2** (Cloud Scheduler `tickExpiry`) | **Rolled to W16** (backend pass). |

Rationale: W15 is a domain + admin services iteration. Bundling four Cloud Function workstreams plus emulator wiring would dilute the iteration and break the "one focused theme per week" cadence. W16 is already planned as a backend-heavy week and is the natural home.

---

## 2. Task 15.1 — Salon Onboarding Wizard v1

### What shipped
- **Versioned per-step drafts** persisted at `tenants/{tenantId}/onboardingDrafts/{step}` with `WIZARD_SCHEMA_VERSION = 1` and a forward-only schema-version check at the rules layer.
- **Per-step required-field validation** via `STEP_REQUIRED_FIELDS` and pure helper `validateStepPayload(step, payload)` — flags `undefined`, `null`, empty/whitespace strings, and empty arrays as missing; treats `boolean false` as present.
- **Step-specific guidance** via `STEP_GUIDANCE` (one sentence per step, English copy ready for translation by the consumer).
- **`WizardService`** with `validate` / `guidanceFor` / `saveDraft` / `submitStep` / `resume`. `submitStep` runs validation → throws `WizardValidationError` on failure → persists draft → advances state. `resume` returns the current state plus all per-step drafts.
- **Smoke tests** for both required flows: happy path (start → submit each step → can go live) and resumed path (save partial drafts → resume → finish remaining → can go live).

### Files
- `src/domains/onboarding/model.ts` — extended with `WIZARD_SCHEMA_VERSION`, `WizardStepDraft`, `STEP_GUIDANCE`, `STEP_REQUIRED_FIELDS`, `validateStepPayload`, `OnboardingTimelineEvent`, `OnboardingAdminAction`.
- `src/domains/onboarding/repository.ts` — extended with `saveDraft` / `getDraft` / `listDrafts` / `appendTimelineEvent` / `listTimeline`.
- `src/domains/onboarding/wizardService.ts` — new.
- `src/domains/onboarding/__tests__/model.test.ts` — new (9 tests).
- `src/domains/onboarding/__tests__/wizardService.test.ts` — new (11 tests, including the 2 smoke tests).
- `src/domains/onboarding/__tests__/repository.test.ts` — extended (added 10 tests for drafts + timeline; mock factory now exposes `collection/where/orderBy/query/getDocs`).

---

## 3. Task 15.2 — Salon Onboarding Admin Controls

### What shipped
- **`OnboardingAdminService`** with four operations: `extendTrial`, `resetStep`, `applyVerificationOverride`, `listTimeline`.
- **RBAC:** every admin op rejects callers whose role is not `platform_admin` or `tenant_owner` (`OnboardingPermissionError`).
- **Audit trail:** every admin op appends a single event to `tenants/{tenantId}/onboardingTimeline/{eventId}`. Caller-supplied `eventId` makes writes idempotent — duplicates are rejected.
- **Trial extension wiring point:** optional `trialExtender(tenantId, days)` dependency runs *before* the audit row is recorded so a failed extension never leaves a misleading audit log.

### Files
- `src/domains/onboarding/adminService.ts` — new.
- `src/domains/onboarding/__tests__/adminService.test.ts` — new (11 tests).
- `documentation/new-platform/SALON_ONBOARDING_OPERATIONS.md` — operations guide with operations matrix, rules surface, runbooks.

---

## 4. Firestore rules

Two new explicit match blocks added before the catch-all deny:

| Path | Read | Create / Update | Delete |
|------|------|-----------------|--------|
| `tenants/{tenantId}/onboardingDrafts/{step}` | platform_admin or tenant_admin | same + matching `tenantId`/`step`/positive integer `schemaVersion` ≥ existing | platform_admin or tenant_owner_or_admin |
| `tenants/{tenantId}/onboardingTimeline/{eventId}` | platform_admin or tenant_admin | platform_admin or `tenant_owner` only; required fields enforced (`tenantId`, `eventId`, `action ∈ {extend_trial, reset_step, verification_override, manual_advance}`, `actorRole ∈ {platform_admin, tenant_owner}`, non-empty `reason`) | **forbidden — append-only** |

5 new rules tests added in `__tests__/firestore.rules.test.ts` (gated by KI-003 emulator wiring).

---

## 5. Gates

| Gate | Result |
|------|--------|
| Onboarding domain tests | **64 / 64 passing** across 4 suites (was 27 in 1 suite) |
| Full Jest suite | **1,471 / 1,471 passing** across 89 suites (↑ +41 / +3 suites vs W14) |
| `npx tsc --noEmit` | **0 errors** |
| `npx eslint src/domains/onboarding/**/*.ts` | **0 errors** |
| KI-001 audit | **closed** — already-permissive at rules layer |

Web smoke (6/6) and native smoke (22/22) gates were last verified at W14 close and were not re-run because W15 changed only domain/service/rules code with no UI surface. They will be re-run at W16 close after the backend wiring lands.

---

## 6. Debt Register changes

- **Closed:** KI-001 (already permissive at rules layer; verified by audit).
- **Rolled to W16:** KI-003, W13-DEBT-1, W13-DEBT-4, W14-DEBT-1, W14-DEBT-2 — all backend / Cloud Function work that is the natural focus of W16.
- **New W15 debt:**
  - **W15-DEBT-1** — Onboarding admin UI not yet built (target Phase 3 W33).
  - **W15-DEBT-2** — Production `trialExtender` wiring not done (target W16, paired with W14-DEBT-2).
  - **W15-DEBT-3** — Wizard React Native screens not yet built (target Phase 2 W21).

See [DEBT_REGISTER.md](DEBT_REGISTER.md) for the full table.

---

## 7. Board cards added

`D-064 … D-067` added to [PROGRAM_TRACKING_BOARD.md](../PROGRAM_TRACKING_BOARD.md):
- **D-064** — Task 15.1 Wizard v1
- **D-065** — Task 15.2 Admin Controls
- **D-066** — Rules + KI-001 closure
- **D-067** — Week 15 close

---

## 8. Next-week prerequisites (Week 16 — backend pass)

1. **Cloud Functions:** wire `stripeWebhookHandler` (W13-DEBT-1), `stripeTaxCalculate` provider (W14-DEBT-1).
2. **Cloud Scheduler:** invoke `tickExpiry(tenantId, runId)` hourly per active-trial tenant (W14-DEBT-2).
3. **Trial wiring:** plumb `OnboardingAdminService.trialExtender` to the trial repo (W15-DEBT-2).
4. **Emulator:** stand up Firestore emulator in CI so the rules-tests suite (including the 5 new W15 cases) runs as a gate (KI-003).
5. **`cancelAtPeriodEnd` E2E verification** (W13-DEBT-4) once the webhook is wired.
