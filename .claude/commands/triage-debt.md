# /triage-debt

Log a new debt item to the register. Run this whenever you discover something that should be deferred — before closing the task.

## Steps

### 1. Gather information

Ask the user (or infer from context):
- What is the problem? (one sentence)
- What severity? `high` (blocks RC or data integrity), `medium` (degrades a feature), `low` (cleanup / nice-to-have)
- What is the earliest target week to fix it?
- What is the exact entry-point file + line where the work starts? (e.g. `src/domains/locations/repository.ts#L42`)

### 2. Assign an ID

Open `documentation/new-platform/DEBT_REGISTER.md`. Find the last `NEW-DEBT-*` entry. Increment the letter: if the last is `NEW-DEBT-I`, the new one is `NEW-DEBT-J`.

If it is a week-specific item (e.g. introduced in W51), use `W51-DEBT-1` (or next sequential number for that week).

### 3. Append the full debt entry

Append to the bottom of the `documentation/new-platform/DEBT_REGISTER.md` file:

```markdown
---

## [ID] — [Short title]

**Opened:** YYYY-MM-DD  
**Severity:** high | medium | low  
**Target week:** Wnn  
**Status:** OPEN

**What:** One-paragraph description of the problem.

**Why deferred:** Why this is acceptable to defer (e.g. scope, complexity, dependency).

**Entry point:** `path/to/file.ts#Lnn` — what to grep / what function to look at first.

**Verification:** What test or output will confirm this is closed.
```

### 4. Add to the Open Items table

Locate `## Open Items by Target Week (operational view)` in `DEBT_REGISTER.md` and append a row:

```markdown
| [ID] | [source week] | [one-line description] | high/medium/low | Wnn | OPEN |
```

### 5. Confirm

Report back:
> ✅ [ID] logged: "[Short title]"  
> Severity: [level] | Target: Wnn  
> Entry point: path/to/file.ts#Lnn
