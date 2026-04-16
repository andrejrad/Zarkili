# Day 1 Execution Log Template

## Session Metadata
- Date:
- Start time:
- End time:
- Prompt engineer:
- Copilot mode/version:
- Workspace:
- Branch name:
- Goal for this session:

---

## Planned Prompt Sequence
Mark each item before starting and after completion.

- [ ] Global Guardrails Prompt
- [ ] Week 1 Task 1.1 Build Prompt
- [ ] Week 1 Task 1.1 Review Prompt
- [ ] Week 1 Task 1.2 Build Prompt
- [ ] Week 1 Task 1.2 Review Prompt
- [ ] Week 1 Task 1.3 Build Prompt (optional Day 1)
- [ ] Week 1 Task 1.3 Review Prompt (optional Day 1)

Source prompt pack:
- [MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md](MULTITENANT_WEEKS_1_TO_4_COPILOT_PROMPTS.md)

---

## Prompt Run Log
Repeat this block for each prompt you run.

### Run 01
- Prompt ID/Name:
- Start time:
- End time:
- Build or Review:
- Objective:

#### Prompt Input
Paste exact prompt used.

#### Copilot Output Summary
- What was implemented/reviewed:
- Files reported changed:
- Tests reported:
- Commands suggested:

#### Verification Performed
- Commands run:
- Results:
- Did feature work as expected? (Yes/No)

#### Findings (for review prompts)
- Severity High:
- Severity Medium:
- Severity Low:

#### Decision
- Accepted as-is / Needs follow-up / Deferred
- Why:

#### Follow-up Task Created
- Task title:
- Owner:
- Target date:

---

### Run 02
- Prompt ID/Name:
- Start time:
- End time:
- Build or Review:
- Objective:

#### Prompt Input
Paste exact prompt used.

#### Copilot Output Summary
- What was implemented/reviewed:
- Files reported changed:
- Tests reported:
- Commands suggested:

#### Verification Performed
- Commands run:
- Results:
- Did feature work as expected? (Yes/No)

#### Findings (for review prompts)
- Severity High:
- Severity Medium:
- Severity Low:

#### Decision
- Accepted as-is / Needs follow-up / Deferred
- Why:

#### Follow-up Task Created
- Task title:
- Owner:
- Target date:

---

### Run 03
- Prompt ID/Name:
- Start time:
- End time:
- Build or Review:
- Objective:

#### Prompt Input
Paste exact prompt used.

#### Copilot Output Summary
- What was implemented/reviewed:
- Files reported changed:
- Tests reported:
- Commands suggested:

#### Verification Performed
- Commands run:
- Results:
- Did feature work as expected? (Yes/No)

#### Findings (for review prompts)
- Severity High:
- Severity Medium:
- Severity Low:

#### Decision
- Accepted as-is / Needs follow-up / Deferred
- Why:

#### Follow-up Task Created
- Task title:
- Owner:
- Target date:

---

## File Change Audit
Complete after all runs.

- Files created:
- Files modified:
- Files deleted:
- Any unexpected changes observed? (Yes/No)
- If yes, list and investigate:

---

## Quality Gate Checklist (Day 1)

### Architecture and Scope
- [ ] Changes stayed within Week 1 scope
- [ ] Domain boundaries were respected
- [ ] No unrelated refactors introduced

### Tenant Isolation Safety
- [ ] New domain/data files include tenant-aware design
- [ ] No global data assumptions introduced

### Test and Verification
- [ ] Tests added/updated where appropriate
- [ ] Tests executed and results logged
- [ ] Basic runtime smoke check performed

### Documentation
- [ ] Relevant docs updated
- [ ] Decisions and tradeoffs captured

---

## Decisions Made Today
List architecture or implementation decisions that affect later weeks.

1. 
2. 
3. 

---

## Open Risks and Blockers

### Active blockers
1. Blocker:
   - Impact:
   - Proposed fix:
   - Owner:

2. Blocker:
   - Impact:
   - Proposed fix:
   - Owner:

### Risks to monitor
1. Risk:
   - Why it matters:
   - Mitigation plan:

2. Risk:
   - Why it matters:
   - Mitigation plan:

---

## End-of-Day Summary
- What was completed:
- What remains from Day 1 plan:
- Confidence level for Week 1 continuation (Low/Medium/High):
- Recommended first prompt for next session:

---

## Optional Copy/Paste End-of-Day Prompt
Use this with Copilot to auto-summarize today before finishing.

Prompt:
Generate a concise Day 1 summary from this execution log.
Include:
1. Completed tasks
2. Outstanding tasks
3. High-severity findings
4. Decisions made
5. Next best action for next session
