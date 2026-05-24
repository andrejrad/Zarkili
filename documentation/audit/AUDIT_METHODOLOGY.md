# Audit Methodology
**Version:** 1.1  
**Updated:** 2026-05-24 (strategic review; two-phase structure, tie-breaker policy, FLAG handling added)  
**Applies to:** All flow audits during Phase A and Phase B.

---

## 0. Two-Phase Audit Structure

The full spec inventory contains 41 auditable specs. Auditing all 41 before pilot launch is not feasible in the available window. Scope is split into two phases aligned to launch gates:

| Phase | Window | Gate | Rationale |
|-------|--------|------|-----------|
| **Phase A** | 21 working days (2026-05-25 → 2026-06-22) | Must complete before pilot launch | Covers every flow a pilot user can trigger: booking, payments, explore, home, auth, onboarding |
| **Phase B** | ~14 working days, runs concurrent with pilot | Must complete before public GA launch | Covers supporting flows and internal domain specs; pilot feedback may influence findings |

Gaps found in Phase A block pilot launch (CRITICAL) or must be resolved before pilot ends (PRE-LAUNCH).  
Gaps found in Phase B block public GA (CRITICAL/PRE-LAUNCH) or become v1.1 items (DEFER).

---

## 1. Phase A Scope

The following specs are in scope for Phase A. No others.

### 1a. Mini-specs to write before auditing

Three flows lack a spec. Each requires a half-day pre-work session before its audit can begin.

| Pre-work | Method | Anchor | Scheduled |
|----------|--------|--------|-----------|
| Auth flow spec | **Option A** — reverse-engineer from code | Read implementation; document de-facto behavior as spec | Day 1 |
| Cancellation/reschedule spec | **Option C** — sketch from existing refs | Booking spec v1.1 §cancellation policy rules are the anchor | Day 1 |
| Push notification UX spec | **Option C** — sketch from existing contract | `NOTIFICATION_EVENTS.md` defines 6 event types; sketch consumer preferences + display behavior | Day 1 |

These mini-specs are committed to `documentation/audit/mini-specs/` before the corresponding audit begins. They are not full product specs — they document sufficient behavior to audit against.

### 1b. Spec audits

| # | Spec ID(s) | Flow | Complexity | Days |
|---|-----------|------|-----------|------|
| 1 | S01 | Booking flow v1.1 | L | 3 |
| 2 | AUTH | Auth flow (from mini-spec) | M | 1.5 |
| 3 | CANCEL | Cancellation/reschedule (from mini-spec) | S | 0.5 |
| 4 | S02 + S06 | Explore tab v2 + map view | L + M | 4 |
| 5 | S03 + S05 | Home tab v2 + empty states | M + S | 2 |
| 6 | S04 | Rewards tab v1.0 | L | 3 |
| 7 | S23 + S24 | Payments: product spec + Stripe implementation | M + M | 2.5 |
| 8 | PUSH | Push notification UX (from mini-spec) | S | 0.5 |
| 9 | S10 + S11 + S12 | Salon onboarding (3-doc batch) | M + S + S | 2 |
| — | Buffer + consolidation | Debt register, final reports, PR | — | 2 |
| | | **Phase A total** | | **21 days** |

Specs S13, S14, S15–S22, S25–S43 are **not in Phase A**. Do not begin auditing them until Phase A is complete.

---

## 2. Phase B Scope

Phase B begins after the pilot launch decision is confirmed. All items must complete before public GA launch.

| # | Spec ID(s) | Flow | Complexity | Est. Days |
|---|-----------|------|-----------|-----------|
| 1 | S34 | Service data model v3 (1283 lines) | L | 2.5 |
| 2 | S29 + S30 + S31 + S09 | Marketplace: product + domain + guardrails + personalization | M + S + S + S | 2.5 |
| 3 | S25 + S26 | Loyalty: functional spec + rules engine | S + S | 1.0 |
| 4 | S27 | Messaging | S | 0.5 |
| 5 | S28 | Reviews & ratings | S | 0.5 |
| 6 | S14 | Free trial lifecycle | S | 0.5 |
| 7 | S15 + S16 + S17 | Services / Staff / Schedules domain batch | S + S + S | 1.0 |
| 8 | S18 + S19 + S20 | Tenants / TenantUsers / Locations domain batch | S + S + S | 1.0 |
| 9 | S21 + S22 | Analytics + Segments | S + S | 0.5 |
| 10 | S35 + S36 | Slot engine + Notification events | S + S | 0.5 |
| 11 | S37 + S38 + S39 + S40 + S41 | AI policies batch (5 docs) | S×5 | 1.5 |
| 12 | S32 + S33 + S13 | US addendum + Navigation + Client onboarding | S×3 | 0.5 |
| — | Buffer + consolidation | Debt register, final reports | — | 1.5 |
| | | **Phase B total** | | **~14 days** |

**Explicitly deferred (not in Phase A or B):**
- S42 `AI_FEATURES_SPECS.md` — Phase 4, post-GA
- S43 `AI_SUPPORT_SYSTEM_ARCHITECTURE.md` — Phase 4, post-GA
- Staff app, admin booking calendar, waitlist — no spec exists; logged as debt items FLAG-10 through FLAG-12 in AUDIT_INVENTORY.md

---

## 3. Spec Authority Tie-Breaker Policy

When two spec documents cover the same feature and conflict, apply these rules in order:

**Rule 1 — Explicit version label wins, regardless of date.**  
A document marked "v2" supersedes one marked "v1" even if v1 has a newer file date. Applies to: home tab, explore tab, home empty states, loyalty functional spec.

**Rule 2 — When no explicit version, the more recently committed file wins for the topics it addresses.**  
The rationale: a spec is updated because something changed. The newer commit reflects more current intent. Applies to: Stripe payments spec (May 21) over payment feature spec (Apr 17); marketplace domain/guardrails (Apr 27) over marketplace product spec (Apr 17).

**Rule 3 — When two docs describe different abstraction layers, both are authoritative for their own domain. No conflict, no tiebreaker needed.**  
Product UX spec is authoritative for user-visible behavior rules. Technical implementation spec is authoritative for data model, schema, and algorithm. Auditing against both is correct — a gap found against either layer is still a gap.  
Applies to: payment pair (S23 product + S24 Stripe), loyalty pair (S25 product + S26 domain), marketplace cluster, services pair (S15 domain API + S34 data model).

**Rule 4 — When Rules 1–3 don't resolve the conflict, the code is the tiebreaker.**  
Document what the code does. Log the spec contradiction as a FLAG in the audit report (not a gap — gaps are code-vs-spec; FLAGs are spec-vs-spec). The FLAG becomes a product decision item, resolved outside the audit phase.

---

## 4. FLAG Handling — Spec-vs-Spec Contradictions

A **FLAG** is a structural concern about the spec itself: a contradiction between two specs, an ambiguous requirement, or a spec that appears stale relative to another. FLAGs are distinct from gaps.

| Type | Code-vs-spec? | Severity label | Goes in DEBT_REGISTER? |
|------|---------------|---------------|------------------------|
| Gap | Yes — code diverges from spec | CRITICAL / PRE-LAUNCH / DEFER | Yes (CRITICAL and PRE-LAUNCH) |
| FLAG | No — two specs disagree, or spec is ambiguous | FLAG-NNN | No — logged in audit report §Flags section only |

FLAGs are not gaps. Do not classify them with CRITICAL/PRE-LAUNCH/DEFER. Do not add them to DEBT_REGISTER.md. Do record them in the `## Flags` section of the per-flow audit report. FLAGs are reviewed together at the end of each phase and resolved as a batch product decision.

---

## 5. How to Conduct an Audit

Work sequentially through one spec document at a time. For each spec section:

```
Step 1 — READ the spec section.
          Identify every behaviour, rule, or UI state described.

Step 2 — FIND the corresponding code.
          Use grep/glob to locate the screen, hook, service, or function.
          Read only what's needed — do not load full files unnecessarily.

Step 3 — COMPARE behaviour.
          Does the code implement what the spec requires?
          Note exact file:line for evidence.

Step 4 — DOCUMENT the gap (if any).
          One gap = one row in the flow audit report (see §8).
          Do NOT fix it inline.

Step 5 — NEXT SECTION.
          Move to the next spec section and repeat.
```

One flow audit = one complete pass through one spec document (or a logical group of related docs). The output is a per-flow audit report filed in `documentation/audit/flows/`.

---

## 6. Gap Classification

Every gap found during an audit must be assigned exactly one of these labels:

| Class | Meaning |
|-------|---------|
| **CRITICAL** | Launch-blocking. Directly blocks a user from completing the primary action in the flow (booking, payment, onboarding). Data-loss or security risk also qualifies. Must be fixed before any pilot launch. |
| **PRE-LAUNCH** | Must be fixed before general availability, but does not block a complete happy-path run in the current state. Examples: missing edge-case handling, incorrect validation, wrong copy, incomplete empty states. |
| **DEFER** | Acceptable to launch without; represents incomplete but non-critical behaviour. Becomes a v1.1 item. Examples: missing "nice to have" states, minor spec deviations that don't affect usability. |

When uncertain between CRITICAL and PRE-LAUNCH, default to CRITICAL. It is easier to downgrade than to miss a launch blocker.

---

## 7. Evidence Requirements

Every gap entry must include:

1. **Spec reference** — the section and line number(s) in the spec that define the expected behaviour.
2. **Code reference** — the file:line in the codebase where the gap exists (or where the code is absent).
3. **Observed behaviour** — one sentence describing what the code does (or does not do) today.
4. **Expected behaviour** — one sentence drawn directly from the spec language.

If no code can be found for a spec requirement, the gap type is `MISSING_IMPL` and severity is CRITICAL by default (override only with explicit justification).

---

## 8. Per-Flow Audit Report Template

Every completed flow audit must produce a file at:

```
documentation/audit/flows/{flow-id}_{slug}_audit.md
```

Example: `documentation/audit/flows/S01_booking_flow_audit.md`

Use this exact template:

```markdown
# Flow Audit: {Flow Name}
**Spec:** `{spec file path}`  
**Spec version:** {version marker or "unversioned"}  
**Audited:** {YYYY-MM-DD}  
**Status:** DRAFT | REVIEW | COMPLETE

---

## Summary
{2-4 sentences: what was audited, overall finding, highest-severity gap count.}

| Severity | Count |
|----------|-------|
| CRITICAL | N |
| PRE-LAUNCH | N |
| DEFER | N |
| FLAG | N |

---

## Gaps

### GAP-{flow-id}-{nn}: {One-line title}
- **Severity:** CRITICAL | PRE-LAUNCH | DEFER
- **Spec reference:** §{section} — "{exact spec quote}"
- **Code reference:** `{file}:{line}`
- **Observed:** {what the code does today}
- **Expected:** {what the spec requires}
- **Notes:** {optional: conditions, workarounds, related gaps}

---

## Flags
{Spec-vs-spec contradictions or ambiguous requirements found during this audit.
Each FLAG gets a one-line title, the two conflicting sources, and the observed discrepancy.
Do NOT assign CRITICAL/PRE-LAUNCH/DEFER to flags. Do NOT add to DEBT_REGISTER.}

### FLAG-{NNN}: {One-line title}
- **Source A:** `{spec file A}` §{section}
- **Source B:** `{spec file B or code reference}` §{section}
- **Discrepancy:** {what the two sources say differently}

---

## Deferred Items
{Any spec sections explicitly skipped and why (e.g., Phase 4 item, known out-of-scope feature).
This section prevents future confusion about what was and was not audited.}
```

---

## 9. What Does NOT Belong in an Audit

| Do NOT do this | Why |
|----------------|-----|
| Fix gaps inline while auditing | Breaks audit focus; introduces unreviewed changes mid-audit |
| Debate whether the spec is correct | The spec wins during audit; spec changes require a separate decision |
| Propose architecture changes | Audit scope is gap identification, not redesign |
| Change any code | This is a read-only phase |
| Expand scope mid-audit ("while I'm here...") | Each audit covers one spec; side-trips are forbidden |
| Log a gap without evidence | Every gap needs spec ref + code ref |
| Classify a spec contradiction as a gap | Spec-vs-spec is a FLAG; gap is always code-vs-spec |
| Audit Phase B specs during Phase A | Phase boundary exists for a reason |
| Audit Phase 4 specs (S42, S43) at all | Post-GA; explicitly out of scope |

**Exception — immediate stop and fix:** If during an audit you discover a security vulnerability or data-loss bug (e.g., a write path that exposes another tenant's data, a payment that charges without recording), stop the audit, log a `CRITICAL` gap, and flag for immediate fix before resuming. These are the only in-audit code changes permitted.

---

## 10. Debt Register Entries

Every CRITICAL and PRE-LAUNCH gap found during an audit must also be logged in `documentation/new-platform/DEBT_REGISTER.md`:

```
| AUDIT-{flow-id}-{nn} | {one-line description} | {high/med/low} | post-audit sprint | {file:line} |
```

DEFER gaps are logged in the flow audit report only; they are reviewed at end of each phase and triaged as a batch. FLAGs are never added to the debt register.

---

## 11. Audit Completion Criteria

A flow audit is **COMPLETE** when:
1. Every section of the spec has been read and compared to code.
2. All gaps are logged with evidence (spec ref + code ref + observed + expected).
3. All CRITICAL and PRE-LAUNCH gaps are in DEBT_REGISTER.md.
4. The flow audit report is committed to `documentation/audit/flows/`.
5. The inventory row in `AUDIT_INVENTORY.md` is updated with its completion date.

---

## 12. Session Boundaries

- One audit session = one spec (or one logical group of batched S-tier specs).
- Start each session with a fresh context (`/clear`).
- Do not carry context from one flow audit into another.
- Do not interleave audits — complete one flow before starting the next.
- Mini-spec writing sessions are separate from audit sessions; do not combine them.
