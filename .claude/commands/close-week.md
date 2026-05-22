# /close-week

Generate the weekly close report and update the project log. Run this at the end of each work week.

## Steps

### 1. Preflight
Run `/preflight` first. Do not produce the close report if `npm run check` is red.

### 2. Gather data for the report

Collect the following from this session's work:

- **Week number** — ask the user: "Which week number is this? (e.g. W51)"
- **Features completed** — list every task finished this week, one row per task. Include the deliverable file paths.
- **Tests added** — diff the test count: "Tests this week started at X, ended at Y. Added: Y-X."
- **Debt opened** — any new entries added to `DEBT_REGISTER.md` this week (IDs + one-line descriptions).
- **Debt closed** — any entries marked CLOSED this week (IDs + brief evidence).
- **Scope decisions** — any explicit "will not build" decisions made this week.

### 3. Create the close report

Create `documentation/new-platform/WEEKnn_CLOSE_REPORT.md` using this structure:

```markdown
# Week nn Close Report

**Closed:** YYYY-MM-DD
**Test count at close:** XXXX
**TS errors:** 0
**Open P0/P1 bugs:** 0

## Features Completed

| Task | Deliverable |
|------|------------|
| nn.x | description — `path/to/file.ts` |

## Tests and Quality

- Tests added this week: +N (XXXX → YYYY total)
- Suites: N | Failures: 0 | TS errors: 0
- Coverage areas: list briefly

## Debt Register Changes

### Opened
| ID | Description | Severity | Target |
|----|-------------|----------|--------|
| ... | ... | ... | Wnn |

### Closed
| ID | Evidence |
|----|----------|
| ... | file:line or test ID |

## Scope Decisions
- List any explicit descoping decisions made this week

## Blockers / Carry-over
- List anything not completed that was planned; note why
```

### 4. Update WEEKLY_LOG.md

Append a new entry to `documentation/new-platform/WEEKLY_LOG.md`. Do NOT edit prior entries.

```markdown
## Week nn — [One-line theme]
**Closed:** YYYY-MM-DD | **Test count:** XXXX | **TS errors:** 0

### Features Completed
[same table as close report]

### Tests and Quality Outcomes
[same summary]
```

### 5. Update DEBT_REGISTER.md Open Items table

Locate the `## Open Items by Target Week (operational view)` table in `documentation/new-platform/DEBT_REGISTER.md` and:
- Mark any items closed this week as `**closed (Wnn)**`
- Add any new items opened this week

### 6. Confirm

Report back:
> ✅ WEEKnn_CLOSE_REPORT.md created  
> ✅ WEEKLY_LOG.md updated  
> ✅ DEBT_REGISTER.md open items table updated  
> ✅ Test count at close: XXXX / XXXX
