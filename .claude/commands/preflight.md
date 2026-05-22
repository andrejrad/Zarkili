# /preflight

Run the quality gate and report every result. Use this before marking any task complete.

## Steps

### 1. TypeScript check
Run `npm run typecheck`. Must be 0 errors. If any errors exist, fix them before continuing — TypeScript regressions are never acceptable.

### 2. Test suite
Run `npm test -- --watch=false`. Must show:
- Test Suites: 182 passed, 182 total (or higher)
- Tests: 3667 passed, 3667 total (or higher)

Report the exact summary lines — do not paraphrase.

### 3. Lint baseline
Run `npm run lint 2>&1 | Select-String "problems"`.

Current baseline: **880 problems (456 errors / 424 warnings)** — tracked as NEW-DEBT-J.

The count returned MUST be ≤ 880. If higher, your change introduced new lint issues — fix them before completing the task.

### 4. Rules tests (conditional)
If `firestore.rules` was modified in this session, also run `npm run test:rules`. Must pass.

### 5. Report verbatim
Output the final summary in this exact format:

```
✅ TypeScript: 0 errors
✅ Tests: 3667 passed, 3667 total | Suites: 182 passed, 182 total
✅ Lint: <N> problems (<errors> errors / <warnings> warnings) — baseline 880, delta <+/-N>
✅ Rules tests: passed (or: skipped — firestore.rules unchanged)
```

If any step regressed, do NOT mark the task complete. Stop and fix.

### 6. Debt register update
If new technical debt was introduced or deferred this session, append entries to `documentation/new-platform/DEBT_REGISTER.md` using this format:

```markdown
## [ID] — [Short title]

**Opened:** YYYY-MM-DD
**Severity:** high | medium | low
**Target week:** Wnn
**Status:** OPEN

**What:** One-paragraph description.
**Why deferred:** Reason.
**Entry point:** path/to/file.ts#Lnn
**Verification:** What test/output confirms it's closed.
```

### 7. Diary update
Confirm today's diary entry exists at `documentation/DIARY_YYYY-MM-DD.md`. If missing, create from `documentation/DAILY_WORK_DIARY_TEMPLATE.md`. The entry must cover **all work from this session**, not just the latest task.

## Expected outcome
After `/preflight`, you should be able to confirm:
> ✅ TypeScript clean, tests green, lint within baseline
> ✅ Debt register updated (or: no new debt this session)
> ✅ Diary updated
