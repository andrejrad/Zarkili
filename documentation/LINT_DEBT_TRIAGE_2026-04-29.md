# Lint Debt Triage — 2026-04-29

> Snapshot of `npm run lint` output. Captured during W36-prep parallel work.
>
> Total: **323 problems (233 errors, 90 warnings)**. None of these block compile
> (`tsc` is clean) and none stem from the W35/browse-first navigation work.
>
> The previously documented "npm run check passes" note in repo memory was
> stale — `lint` has been failing for at least one batch (likely since W26+
> when several screens with apostrophes / `any`-typed mocks landed).

## Errors by rule (top buckets)

| Count | Rule | Severity | Auto-fix? | Notes |
|------:|------|----------|-----------|-------|
| 77 | `@typescript-eslint/no-unused-vars` | error | Manual | Remove unused imports/vars |
| 58 | `react/no-unescaped-entities` | error | Mechanical | Escape `'` → `&apos;` and `"` → `&quot;` in JSX text |
| 51 | `@typescript-eslint/no-explicit-any` | error | Manual | Replace `any` with concrete types — non-trivial |
| 41 | `no-undef` | error | Config | Likely missing globals — check `eslint.config.mjs` env settings |
| 4 | `Parsing error: Unexpected token …` | error | Config | Files being parsed by wrong parser (probably non-TS files matched by TS rules) |
| 1 | `no-useless-escape` | error | 1-line fix | |
| 1 | `no-unused-vars` (non-TS) | error | Manual | |

## Warnings (all `import/order`)

90 `import/order` warnings reported as auto-fixable, but `npm run lint -- --fix`
did not actually rewrite any files. The autofix may be disabled in the config
or the rule may need explicit `groups` settings to know how to sort. Worth a
20-minute eslint-config audit before opening individual file edits.

## Hot spots (largest files)

- `src/domains/marketplace/discoveryService.ts` — ~30 `no-explicit-any` errors (lines 142–442). Worth retyping during W36-B Discovery work.
- `src/domains/waitlist/repository.ts` — 4 `no-explicit-any` + 1 unused `_userId`.
- `src/shared/ui/ExplainabilitySheet.tsx`, `LanguagePicker.tsx`, `RewardCard.tsx`, `TierUpCelebration.tsx` — 4 `react/no-unescaped-entities` errors (one per file).
- `src/shared/ui/ConflictRecoveryModal.tsx` — unused `radius` import.

## Recommended cleanup batches (deferred)

These were **not** done in this session because the volume is high and risk
of breaking the green test suite is non-zero. Each batch is independent.

1. **Mechanical fix pass (low risk)**
   - 58 `react/no-unescaped-entities` — find/replace per file.
   - 1 `no-useless-escape`.
   - All `unused vars` that are obviously dead imports.
   - Estimate: tightly scoped, validate by `npm run check`.
2. **`no-undef` config audit**
   - Check `eslint.config.mjs` `env`/`globals` for missing entries (likely
     `__DEV__`, `JSX`, `NodeJS`, browser globals).
3. **`import/order` autofix investigation**
   - Why is `--fix` a no-op? Either the rule lacks `groups` config or
     `fixable` is being suppressed somewhere.
4. **Type the marketplace discovery service** during W36-B Discovery wire-up.
   Replacing the 30 `any`s naturally aligns with the W36 search/cursor work.
5. **Re-run `npm run check`** after batches 1–3 — should drop ~140 errors
   without any behavior change.

## What was NOT changed in this session

No source files were modified. This report is informational only so the user
can decide whether to schedule a dedicated lint-debt batch or fold the
mechanical fixes into the W36 implementation work.
