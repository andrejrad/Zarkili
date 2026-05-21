> **Deploy to:** `.claude/commands/preflight.md`

---

# /preflight

Run the full quality gate and report every result.

## Steps

1. Run `npm run check` (lint + typecheck + full test suite). Report exact output — do not paraphrase.
2. If any step fails, fix all failures before marking work complete. Do not move to the next task with a red gate.
3. If `firestore.rules` was changed in this session, also run `npm run test:rules`.
4. Report the final summary line:
   - Tests: X passed / X total
   - Suites: X passed / X total
   - TypeScript errors: 0
   - ESLint errors: 0
5. If any new technical debt was introduced during this session, append entries to `documentation/new-platform/DEBT_REGISTER.md` now, before closing. Format:
   ```
   **ID:** NEW-DEBT-X
   **Title:** one-line description
   **Severity:** high | medium | low
   **Opened:** YYYY-MM-DD
   **Target week:** Wnn
   **Entry point:** path/to/file.ts#Lnn
   **Notes:** why it was deferred
   ```
6. Confirm the diary entry for today has been updated in `documentation/` (filename: `DIARY_YYYY-MM-DD.md`). If no diary file exists for today, create one from the template at `documentation/DAILY_WORK_DIARY_TEMPLATE.md`. The entry must cover **all work from this session**, not just the most recent task.

## Expected outcome

After `/preflight` you should be able to say:
> ✅ npm run check: 3667/3667 tests passing, 0 TS errors, 0 lint errors  
> ✅ Debt register updated (or: no new debt)  
> ✅ Diary updated
