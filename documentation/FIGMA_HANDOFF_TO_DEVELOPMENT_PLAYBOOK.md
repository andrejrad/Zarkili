# Figma to Development Handoff Playbook

## Purpose
This playbook captures the full process from asking Figma AI for a development-ready handoff package through final implementation ingestion and completion.

Use this when you want a repeatable, low-friction process with clear acceptance gates.

## When Figma is required

The design system is already locked in [`design-handoff/`](../design-handoff/HANDOFF_MANIFEST.md) (tokens, component library, reference screens for Welcome / Home / Explore, accessibility rules, interaction specs). Most remaining screens are **compositions of that system**, not net-new design. Treat Figma as a thin layer used only when one of the three triggers below fires.

**Trigger 1 — Genuinely new component or pattern.** A screen needs a visual primitive that does not exist in [`design-handoff/components/`](../design-handoff/components/) (e.g., calendar grid, time-slot picker, progress ring, multi-resource master calendar, AI chat panel, segment builder, campaign template editor, charts).

**Trigger 2 — Brand surface, not product surface.** Marketing site, App Store / Play Store screenshots, App Clip, widgets, Live Activities, investor-facing previews. These are not driven by the in-app component library and need brand-quality output.

**Trigger 3 — New density or information-architecture context.** A surface that introduces a layout density not yet established (e.g., the first admin dashboard pass in Phase 3, or the first analytics/report-builder layout). One Figma pass per *category*, not per screen — once the density pattern is locked, subsequent screens in the same category go `code-only`.

**If none of the three fire → `code-only`.** Build directly from `design-handoff/tokens/` and the shared React Native component library, using the matching [`figma-prompts/`](../documentation/figma-prompts/README.md) batch as the build spec, and validate with the human-review checklist at the bottom of that batch file.

Design-mode tags per batch are tracked in [FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md](FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md) → "Design Mode Per Batch".

**Drift safeguard.** Whether a screen is built `code-only` or via Figma, every PR that introduces a new screen must pass the visual review checklist (contrast, spacing tokens, type tokens, motion duration/easing, accessibility labels, touch targets ≥ 44pt, dynamic-type, reduce-motion). If the checklist fails twice in the same batch, escalate that batch to `figma-then-code` for the remainder.

## The one-pass Figma workflow (`figma-then-code` batches)

A "one-pass" means **Figma is involved exactly once per batch, only to lock the new pattern(s) introduced by that batch**. Every remaining screen in that batch — and every future batch that reuses the locked patterns — is then built directly in code. Total wall-clock time is typically **2–4 working days per batch**, not weeks.

The pass has five mandatory steps. Step 4 (promotion into the design system) is non-negotiable: skip it and the next batch will re-design the same patterns and the system will drift.

### Step 1 — Identify the novel patterns (≤ 30 min)

Before opening Figma, list only what does **not** already exist in [`design-handoff/components/`](../design-handoff/components/) for this batch.

Example for Batch C (Booking flow):
- Calendar grid
- Time-slot picker chip group
- Sticky booking summary footer

Everything else (buttons, inputs, chips, cards, headers, badges, search bars) is already locked. **Do not redesign locked components.** If the list has zero items, skip Figma entirely — the batch is `code-only`.

Output of this step: a written list of novel patterns to lock, kept in the PR description or weekly log.

### Step 2 — Generate the pass with the matching prompt-pack file (~½ day)

Open the batch's prompt-pack file under [`figma-prompts/`](../documentation/figma-prompts/README.md) (e.g. [`BATCH_C_BOOKING_FLOW.md`](../documentation/figma-prompts/BATCH_C_BOOKING_FLOW.md)). It already contains:

- The global Design System Anchor (forces reuse of `design-handoff/` tokens and components)
- Per-screen prompts
- Per-component prompts for new patterns
- A human-review checklist

Paste only:

1. The **new-component prompts** for every item from Step 1, asking Figma AI to design each in isolation in **all states**: default / pressed / selected / disabled / loading / empty / error.
2. **One representative screen prompt** that uses those new components together (e.g., for Batch C: the "Time-slot picker screen") so you can see the components composed in context.

Do not paste the rest of the batch's screen prompts. The point of a one-pass is precisely to avoid regenerating screens the locked system already covers.

### Step 3 — Human review against the checklist (~½ day)

Use the human-review checklist at the bottom of the batch's prompt-pack file. Specifically validate:

- Tokens reused — no new colors, no new type sizes, no new spacing values, no new radii, no new shadows.
- States complete for every new component (default / pressed / selected / disabled / loading / empty / error).
- Touch targets ≥ 44pt; hit slop documented for sub-44pt visual elements.
- Contrast ≥ 4.5:1 (text and meaningful non-text).
- Motion durations and easings match [`design-handoff/specs/interactions.json`](../design-handoff/specs/interactions.json).
- Accessibility labels on every icon-only control.
- Dynamic-type behavior and reduce-motion fallback specified.

Iterate in Figma until the checklist passes. **Reject anything that introduces a new token.** That is the entire purpose of this gate.

### Step 4 — Promote the new components into the design system (~½ day) — MANDATORY

This is the step most teams skip and then regret. New patterns must be committed into the locked system so they are reusable for the rest of the batch and all future batches.

For each new component:

1. Add a JSON spec next to the existing ones in [`design-handoff/components/`](../design-handoff/components/), modeled on the existing files (see [`service-card.json`](../design-handoff/components/service-card.json), [`chip.json`](../design-handoff/components/chip.json) for shape and style). Each spec must capture:
   - **Anatomy** — named parts.
   - **Variants** — size, emphasis.
   - **States** — default / pressed / selected / disabled / loading / empty / error.
   - **Token references** — only token names from `design-handoff/tokens/`. No hex, no raw px values.
   - **Behavior** — touch target, hit slop, accessibility role and label rules, focus order.
2. Update [`design-handoff/ASSET_MANIFEST.json`](../design-handoff/ASSET_MANIFEST.json) and [`design-handoff/HANDOFF_MANIFEST.md`](../design-handoff/HANDOFF_MANIFEST.md) so the new components are discoverable.

For the representative screen produced in Step 2, hand-author one screen spec under [`design-handoff/specs/`](../design-handoff/specs/) (modeled on `screen-home.json` / `screen-explore.json`) so engineers have a worked example showing the new components in context.

After this step the new components are part of the locked system. The Figma file becomes a reference, not a source of truth — the JSON specs are.

### Step 5 — Build the rest of the batch in code (`code-only` for remaining screens)

Engineers now implement the work:

1. Each new component as a React Native primitive in the shared component library, citing its JSON spec from Step 4.
2. The remaining screens of the batch by composing locked + newly-added components, using the **screen-level prompts** from the same `figma-prompts/` batch file as **build specs** (not as design specs).
3. Tests: unit/snapshot tests for new components in all states; one screen-level visual test per representative screen.

Every PR runs the same human-review checklist from Step 3. If a PR introduces a new token or new pattern not present in the locked specs, it is rejected — the screen either uses an existing pattern or triggers a second Figma pass for that batch (which is the drift-safeguard rule above).

### Worked example — Batch C (Booking flow), 11 screens

| Step | Output | Time |
|---|---|---|
| 1. Identify | Calendar grid, time-slot picker, sticky footer (3 new patterns) | 30 min |
| 2. Figma pass | 3 component frames in all states + 1 representative screen (time-slot picker) | ~½ day |
| 3. Review | Checklist passed; tokens locked; no new colors/type/spacing | ~½ day |
| 4. Promote | 3 new component JSONs in `design-handoff/components/` + 1 screen JSON in `design-handoff/specs/` + manifest updates | ~½ day |
| 5. Code-only | All 11 booking screens built in code using new + existing components | rest of the engineering week |

Figma touches the project for ~1.5 days. Engineering owns the other ~3.5 days. No Figma file becomes the source of truth — the JSON specs do.

### Two rules that make this work

1. **Never paste a screen-level prompt into Figma during a one-pass.** Only component prompts and one representative screen. Otherwise you regenerate work the system already covers and re-open settled decisions.
2. **A one-pass is "complete" only after Step 4.** If the new patterns are not promoted into `design-handoff/`, the batch effectively converts back to a full-Figma batch on the next iteration. Step 4 is the gate that keeps `code-only` viable for downstream batches.

### One-pass acceptance gate

A `figma-then-code` batch may move to Step 5 only when **all** of the following are true:

- [ ] Step 1 list of novel patterns is written down and matches the components produced in Step 2.
- [ ] Step 3 checklist passed with zero new tokens introduced.
- [ ] Step 4 JSON component specs exist under `design-handoff/components/` for every novel pattern.
- [ ] Step 4 representative screen spec exists under `design-handoff/specs/`.
- [ ] [`design-handoff/HANDOFF_MANIFEST.md`](../design-handoff/HANDOFF_MANIFEST.md) and [`design-handoff/ASSET_MANIFEST.json`](../design-handoff/ASSET_MANIFEST.json) are updated.
- [ ] No screen-level Figma frames exist for screens beyond the one representative screen.

If any item is unchecked, the batch is not yet one-pass complete — finish the missing step before engineering composes the remaining screens.

## The full-Figma workflow (`figma` batches)

A full-Figma batch means **every screen and every component in the batch is designed in Figma first**, reviewed, packaged, and only then handed to engineering. There is no `code-only` portion. This applies to exactly two batches in the program:

- **Batch L — Cross-cutting / i18n / store readiness** ([`figma-prompts/BATCH_L_CROSS_CUTTING_I18N_STORE_READINESS.md`](../documentation/figma-prompts/BATCH_L_CROSS_CUTTING_I18N_STORE_READINESS.md)) — marketing site, App Store/Play Store screenshots, App Clip, widgets, Live Activities, force-update, maintenance, offline, server-error, flag-disabled, deep-link landings, locale switching, RTL, web breakpoints, first-run.
- **Batch O — Booking ops / master calendar** ([`figma-prompts/BATCH_O_BOOKING_OPS_MASTER_CALENDAR.md`](../documentation/figma-prompts/BATCH_O_BOOKING_OPS_MASTER_CALENDAR.md)) — multi-resource master calendar, drag-to-reschedule, force-book, conflict resolution, manual booking, block time, no-show, cancel-with-fee, recurring bookings.

Both fail the one-pass test for opposite reasons. **L is brand surface** (not driven by the in-app component library) — the bar is brand quality, not just system consistency. **O is one giant novel interaction surface** — the master calendar *is* the batch; there are no "remaining screens" to build separately, so splitting it into one-pass + code adds ceremony without saving time.

Total wall-clock time per full-Figma batch is **3–4 weeks** elapsed, with Figma + engineering overlapping at the seams.

The process below is the canonical 5-phase Figma flow used historically (see Phase 1–5 sections later in this document for the request prompts and per-phase mechanics). The bullets here lock how that flow applies to L and O specifically.

### Phase 1 — Scope lock (½ day)

Before requesting Figma:

1. Confirm the batch is genuinely full-Figma. Document why a one-pass would not work in the PR/weekly log.
2. List every screen and every new component the batch must deliver. Use the matching prompt-pack file as the canonical scope:
   - For **L**: marketing pages, store-asset templates, App Clip card, widget sizes, Live Activity, force-update, maintenance, offline, server-error, flag-disabled, deep-link landings, locale switch, RTL audit, web breakpoint references, first-run, store screenshots and metadata.
   - For **O**: master calendar (day / week / multi-resource by staff / multi-resource by chair), drag-to-reschedule, booking detail (admin), manual booking, block time, force-book, no-show, cancel-with-fee, recurring bookings, conflict resolution.
3. Identify which existing locked tokens/components from [`design-handoff/`](../design-handoff/HANDOFF_MANIFEST.md) the batch must reuse. For **L** this is the brand color/typography tokens. For **O** this is the admin density patterns from Batch M (see [`figma-prompts/BATCH_M_OWNER_HOME_BILLING_CONNECT.md`](../documentation/figma-prompts/BATCH_M_OWNER_HOME_BILLING_CONNECT.md)) — every chip, button, input, badge, table row already used in the admin shell.

Output: a written scope sheet with exactly the items Figma will produce, plus the reuse map.

### Phase 2 — Generate the full package (~1–2 weeks)

Open the batch's prompt-pack file and paste **all prompts** — every screen prompt and every component prompt — into Figma AI. Unlike a one-pass, do not pick "one representative screen"; generate them all.

Two enforcement rules:

- The **Design System Anchor** at the top of the prompt-pack file must remain in every prompt; it forces reuse of `design-handoff/` tokens. New tokens are forbidden unless the batch's stated triggers explicitly justify them (e.g., L marketing surfaces may introduce hero-only typography in a `marketing.*` namespace; those are still token-bound).
- States are mandatory for every screen and component: default / pressed / selected / disabled / loading / empty / error.

Batch-specific Phase 2 sequencing:

- **Batch O — calendar first.** The master calendar is the spine. Design it first, in all viewport sizes (web wide, web compact, tablet) and all density modes (1-day / 1-week / multi-resource by staff / multi-resource by chair), before any modal/sheet flows on top of it. Every other O screen depends on it.
- **Batch L — three sub-tracks.** Split the work into independent sub-tracks, each with its own acceptance bar:
  1. **Marketing site** — full responsive layouts (desktop, tablet, mobile), hero, sections, footer, legal pages, blog template, pricing, contact.
  2. **Store assets** — App Store and Play Store screenshots in required sizes, plus all marketing-copy frames.
  3. **Cross-cutting in-app surfaces** — force-update, maintenance, offline, server-error, flag-disabled, deep-link landings, first-run, locale switch, RTL audit notes, web breakpoint references.

### Phase 3 — Strict review (2–3 days)

Use the human-review checklist at the bottom of the batch's prompt-pack file plus the bar in the Phase 3 section later in this document. Hard gates:

- Tokens reused from `design-handoff/tokens/`. Any new token requires explicit approval and **must** be added to the token files in Phase 4 — not left only in Figma.
- Every state present for every screen and component.
- Touch targets ≥ 44pt; for **O**, every drag handle, slot tile, and chip must be ≥ 44pt or have hit slop documented.
- Contrast ≥ 4.5:1; for **L** marketing surfaces, also validate at common preview thumbnail sizes for store listings.
- Motion durations and easings match [`design-handoff/specs/interactions.json`](../design-handoff/specs/interactions.json).
- Accessibility labels for every icon-only control. For **O**, also keyboard semantics: every drag interaction has an equivalent keyboard path (move / copy / cancel).
- For **L**, locale fitness: every marketing surface and every cross-cutting screen shows en-US first, then the longest expected translated string (typically German / Spanish) without overflow.
- For **L**, ADA + WCAG 2.1 AA compliance for the marketing site is non-optional ([`US_PRIMARY_MARKET_ADDENDUM.md`](US_PRIMARY_MARKET_ADDENDUM.md)).
- For **O**, conflict resolution must show every error path (overlap, double-book, off-shift, off-hours, resource down).

Iterate in Figma until every item passes. Reject silently introduced tokens.

### Phase 4 — Promote into the design system (2–3 days) — MANDATORY

Even though every screen comes from Figma, the components and tokens still get committed into `design-handoff/` so they are reusable and auditable. Same Step 4 rule as one-pass, scaled up.

For **Batch O**:

- Add JSON component specs under [`design-handoff/components/`](../design-handoff/components/) for: master calendar shell, resource column header, slot tile (states), drag handle, drop indicator, conflict banner, recurring-rule editor, block-time tile.
- Add screen specs under [`design-handoff/specs/`](../design-handoff/specs/) for: master calendar (day / week / multi-resource), booking detail admin, manual booking, conflict resolution.
- Update [`design-handoff/specs/interactions.json`](../design-handoff/specs/interactions.json) with drag-to-reschedule choreography, drop-target feedback, and keyboard equivalents.
- Update [`design-handoff/ACCESSIBILITY_GUIDE.md`](../design-handoff/ACCESSIBILITY_GUIDE.md) with the keyboard scheme for the calendar.

For **Batch L**:

- If hero-only typography is needed, add a `marketing.*` token namespace to [`design-handoff/tokens/`](../design-handoff/tokens/). Do not pollute the in-app product tokens.
- Add screen specs for every cross-cutting in-app surface (force-update, maintenance, offline, server-error, flag-disabled, first-run, locale switch) under [`design-handoff/specs/`](../design-handoff/specs/) — these are reused in production.
- For marketing site and store assets, store the source files and exports under a new `design-handoff/marketing/` folder with its own manifest. They sit beside the product handoff but are versioned separately.
- Update [`design-handoff/HANDOFF_MANIFEST.md`](../design-handoff/HANDOFF_MANIFEST.md) and [`design-handoff/ASSET_MANIFEST.json`](../design-handoff/ASSET_MANIFEST.json).

After Phase 4 the system has absorbed the batch's outputs. Future batches that touch the same surfaces (e.g., Q reusing O's calendar primitives, or R reusing L's analytics chart shells) go `code-only` because the patterns are now in the locked system.

### Phase 5 — Engineering ingestion and build (~1–2 weeks)

Engineering builds:

1. New components from Phase 4 JSON specs as React Native primitives (or React + DOM for the marketing site).
2. Every screen in the batch from the corresponding screen JSON.
3. **For O**: integration with [`new-platform/SLOT_ENGINE.md`](new-platform/SLOT_ENGINE.md), [`new-platform/STAFF_SCHEDULES.md`](new-platform/STAFF_SCHEDULES.md), [`new-platform/SERVICES.md`](new-platform/SERVICES.md). Conflict resolution must round-trip through the slot engine.
4. **For L**: marketing site is a separate deployable; store assets are versioned with the release; cross-cutting in-app surfaces are wired into existing routing and feature-flag infrastructure.
5. Tests:
   - **O**: visual snapshot of master calendar in all density modes; integration tests for drag-to-reschedule, force-book, conflict resolution; keyboard-path tests.
   - **L**: marketing site — Lighthouse perf and a11y budgets; cross-cutting surfaces — snapshot per state; locale snapshots in en-US + longest string.

Every PR runs the same human-review checklist from Phase 3. New tokens or new patterns not in the locked specs are rejected.

### Worked timeline — Batch O (master calendar)

| Phase | Output | Time |
|---|---|---|
| 1. Scope lock | Screen + component list, reuse map vs Batch M admin patterns | ½ day |
| 2. Generate | Master calendar in all density modes, drag interactions, all related modal/sheet flows | ~1.5 weeks |
| 3. Review | Checklist passed (drag, keyboard, conflict states, accessibility) | 2–3 days |
| 4. Promote | 8 component JSONs + 4 screen JSONs + interactions.json updates + a11y guide updates | 2–3 days |
| 5. Build | Calendar primitives, drag system, all O screens, slot-engine round-trip, tests | ~1.5 weeks |

Total: roughly **3–4 weeks elapsed**.

### Worked timeline — Batch L (cross-cutting / store readiness)

| Phase | Output | Time |
|---|---|---|
| 1. Scope lock | Three sub-tracks scoped: marketing site, store assets, cross-cutting in-app | ½ day |
| 2. Generate | Marketing site full responsive layouts, store screenshot frames, all cross-cutting in-app surfaces in en-US + longest string | ~2 weeks |
| 3. Review | Brand quality, Lighthouse-equivalent contrast/perf preview, locale fitness, ADA/WCAG 2.1 AA | 2–3 days |
| 4. Promote | `marketing.*` token namespace (if needed), `design-handoff/marketing/` folder with manifest, screen specs for cross-cutting surfaces | 2–3 days |
| 5. Build | Marketing site deploy, store-asset export pipeline, in-app cross-cutting surfaces wired into routing + feature flags, locale snapshots | ~1.5–2 weeks |

Total: roughly **3–4 weeks elapsed**, parallelizable with other Phase 2/3 work because the marketing site lives in a separate deployable.

### Full-Figma acceptance gate

A full-Figma batch is "done" only when **all** of the following are true:

- [ ] Every screen and component from the batch's prompt-pack file exists in Figma in all states.
- [ ] Phase 3 checklist passed with no silently introduced tokens.
- [ ] Every novel component has a JSON spec under `design-handoff/components/`.
- [ ] Every screen has a JSON spec under `design-handoff/specs/` (or `design-handoff/marketing/` for L marketing surfaces).
- [ ] [`design-handoff/HANDOFF_MANIFEST.md`](../design-handoff/HANDOFF_MANIFEST.md) and [`design-handoff/ASSET_MANIFEST.json`](../design-handoff/ASSET_MANIFEST.json) are updated.
- [ ] Engineering has built every screen, all tests pass, and the visual review checklist passes for every PR.
- [ ] **For L**: Lighthouse a11y ≥ 95 on the marketing site; ADA / WCAG 2.1 AA conformance documented.
- [ ] **For O**: drag, keyboard, and conflict resolution paths all verified end-to-end against the slot engine.

If any item is unchecked, the batch is not yet full-Figma complete.

## Phase 1: Ask Figma for a Development Handoff Package
Use this exact prompt in Figma AI.

```text
Please prepare a development handoff package for a React Native Expo app.
Output must be production-ready and consistent.

1. Icons (category pills)
- Create a full icon set for: nails, hair, skin, lashes, brows, massage, makeup, barber, waxing, spa, injectables, wellness.
- Provide each icon in 24px and 20px.
- Style: outline, rounded, consistent stroke weight.
- Export: SVG + PNG @1x @2x @3x with transparent background.
- Naming format: icon-category-nails-outline-24.svg, etc.
- Include active and inactive color versions.

2. Design tokens
- Export color tokens, typography tokens, spacing, radius, shadows.
- Include semantic tokens (primary, surface, text-muted, success, warning, error).
- Include dark-mode tokens if available.
- Provide values in a machine-readable format (JSON preferred).

3. Components and variants
- Create reusable components for:
  category pill, search bar, service card, filter button, bottom tab icon+label, chips, badges.
- Include all states:
  default, pressed, selected, disabled, loading, error.
- Define variant properties clearly (size, state, emphasis).

4. Screen specs
- Provide final specs for Explore screen and related service listing screens.
- Include spacing/redline measurements, safe-area behavior, and responsive rules.
- Define scroll behavior, sticky elements, and empty/loading/error states.

5. Interaction specs
- Document transitions and micro-interactions:
  pill selection, filter apply/clear, card press, tab change.
- Include duration, easing, and trigger conditions.

6. Content and localization
- Provide all text strings used on these screens in a string table.
- Mark truncation rules and max lengths for titles/subtitles.

7. Accessibility
- Define minimum touch targets, contrast compliance, icon legibility at 20px/24px.
- Provide accessibility labels for icon-only controls.

8. Handoff organization
- Organize files in folders: assets/icons, assets/images, tokens, components, specs, strings.
- Use consistent naming and include a manifest listing all exported files.

Important:
- Do not generate markdown-only deliverables as the main output.
- Prioritize exported assets, tokens, and component specs suitable for direct engineering use.
```

## Phase 2: Request Final Export Package
When Figma confirms readiness, send this:

```text
Please export one ZIP package containing assets/icons, assets/images, tokens, components, specs, strings, and a root-level manifest that maps each asset/component to screen usage.
Also confirm icon stroke consistency and padding-box consistency across all category icons.
```

## Phase 3: Run 2-3 Minute Acceptance Checklist (Pass/Fail)
Mark each item pass or fail.

1. Package exists: one ZIP containing assets/icons, assets/images, tokens, components, specs, strings, and manifest.
2. Icon coverage complete: nails, hair, skin, lashes, brows, massage, makeup, barber, waxing, spa, injectables, wellness.
3. Icon sizes complete: each icon has 20px and 24px.
4. Format complete: each icon has SVG and PNG @1x @2x @3x with transparent background.
5. Naming consistent: one strict naming pattern for all files.
6. Style consistency: stroke weight, corner style, and visual weight are consistent.
7. Padding consistency: icon centering and bounding box consistency in pill containers.
8. State assets available: active/inactive variants or tokenized mapping for both.
9. Token file usable: machine-readable token file (JSON), not image-only documentation.
10. Semantic tokens present: primary, surface, text-muted, success, warning, error.
11. Component variants complete: category pill, search bar, service card, filter button, bottom tab item, chips, badges with states.
12. Specs are measurable: redlines include spacing, sizes, safe area, responsive behavior.
13. Interactions defined: duration, easing, trigger conditions.
14. Strings extracted: text table includes max length and truncation guidance.
15. Accessibility covered: touch targets, contrast, labels for icon-only controls.
16. Manifest maps usage: every exported item mapped to screen usage.
17. Not markdown-only: real assets/spec/tokens delivered, markdown optional only.

Pass rules:
- PASS: all 17 checks pass.
- CONDITIONAL PASS: only minor visual polish issues remain.
- FAIL: missing required assets, token JSON, component states, or manifest mapping.

## Phase 4: If Failed, Send Regeneration Request
Use this exact message:

```text
Please regenerate handoff with missing items fixed: [paste failed checklist numbers].
Keep the same folder structure and naming format; include updated manifest and token JSON in the ZIP.
```

## Phase 5: Design to Dev Handoff Contract (Strict Team Template)
Use this block if you need strict process enforcement.

```text
Design-to-Dev Handoff Contract

Please deliver the UI handoff package using this exact structure and quality bar.

1. Delivery format
- One ZIP file only
- Top-level folders required: assets/icons, assets/images, tokens, components, specs, strings
- Root-level manifest listing every exported asset/component and where it is used

2. Icon requirements
- Categories: nails, hair, skin, lashes, brows, massage, makeup, barber, waxing, spa, injectables, wellness
- Sizes: 20 and 24
- Formats: SVG + PNG 1x/2x/3x
- Transparent background only
- Consistent stroke style, optical weight, and padding alignment
- Active and inactive states (or token mapping for both)

3. Token requirements
- Machine-readable token file (JSON)
- Include color, typography, spacing, radius, shadow
- Semantic roles required: primary, surface, text, text-muted, success, warning, error
- Include dark mode if in scope

4. Component requirements
- category pill, search bar, filter button, service card, bottom tab item, chips, badges
- States where applicable: default, pressed, selected, disabled, loading, error
- Variant properties must be explicit

5. Screen and behavior requirements
- Redlines and spacing measurements included
- Safe area and responsive behavior included
- Scroll and sticky behavior included
- Empty/loading/error states included
- Motion spec includes duration, easing, trigger

6. Content and accessibility
- String table for all visible text
- Max lengths and truncation rules
- Touch target guidance
- Contrast compliance guidance
- Accessibility labels for icon-only controls

7. Naming standard
- One naming convention across all exports
- No ad hoc naming exceptions
- No duplicate assets under different names

8. Acceptance gate
- Accepted only when all required categories, sizes, formats, token JSON, component states, and usage manifest are present
- If anything is missing, regenerate and resend full package
```

## Phase 6: Development Ingestion (What the Developer Agent Does)
This is the implementation sequence used after handoff acceptance.

1. Intake and validate package structure.
2. Run acceptance checklist and fail fast on blockers.
3. Normalize and optimize assets (icons/images).
4. Integrate token JSON into theme layer.
5. Map tokens to semantic app roles.
6. Wire category pills, search, filters, cards, and tabs to tokenized styles.
7. Implement component states (default/pressed/selected/disabled/loading/error).
8. Implement interaction timings and easing from specs.
9. Implement empty/loading/error UI states.
10. Apply accessibility labels and touch-target safeguards.
11. Run lint/type/test checks and perform visual QA.
12. Commit in slices: assets, tokens, UI wiring, interaction polish.
13. Deliver short implementation report with integrated items, adjustments, and blockers.

## Phase 7: Required Inputs Before Ingestion Starts
Provide these four inputs:

1. Figma export ZIP.
2. Scope note (for example: Explore only, or Explore + Bookings).
3. Theme scope (light-only or light+dark).
4. Constraints (existing components/styles that must not be changed).

## Phase 8: Definition of Done
Implementation is done when all of the following are true:

1. Category icons render correctly in category pills.
2. Explore/listing UI matches approved Figma spec.
3. Tokens are centralized and reusable.
4. Component states and interactions are implemented.
5. Accessibility checks are satisfied.
6. App builds cleanly and validations pass without regressions.

## Phase 9: Quick Ops Commands for Product Owner
Use these short commands in chat:

- "Start ingestion" -> start implementing from accepted package.
- "Run handoff acceptance" -> run checklist only and report pass/fail.
- "Generate Figma correction request" -> produce precise resend message for failed items.
- "Scope to Explore only" -> implementation restricted to Explore slice.

## Phase 10: Strict Response Scorecard (Paste After Any Figma Reply)
Use this template to force automatic pass/fail decisioning from each Figma response.

```text
FIGMA HANDOFF SCORECARD
Run: [YYYY-MM-DD HH:mm]
Package version: [vX.Y.Z]
Scope: [Explore only / Explore+Bookings / etc]

1) One ZIP package delivered (not tar.gz): PASS | FAIL
2) Required folders present (assets/icons, assets/images, tokens, components, specs, strings): PASS | FAIL
3) Root-level ASSET_MANIFEST.json present: PASS | FAIL
4) Full icon categories (nails, hair, skin, lashes, brows, massage, makeup, barber, waxing, spa, injectables, wellness): PASS | FAIL
5) Both icon sizes (20 and 24): PASS | FAIL
6) SVG + PNG @1x/@2x/@3x for each icon: PASS | FAIL
7) Active and inactive icon states (or explicit token mapping): PASS | FAIL
8) Naming convention consistent across exports: PASS | FAIL
9) Stroke and padding consistency confirmed: PASS | FAIL
10) Token JSON present and machine-readable: PASS | FAIL
11) Semantic tokens included (primary, surface, text, text-muted, success, warning, error): PASS | FAIL
12) Required components included (category pill, search bar, filter button, service card, bottom tab item, chips, badges): PASS | FAIL
13) Component states covered (default, pressed, selected, disabled, loading, error where applicable): PASS | FAIL
14) Specs include redlines, safe area, responsive rules, sticky/scroll behavior: PASS | FAIL
15) Interaction spec includes duration, easing, triggers: PASS | FAIL
16) Strings table includes max lengths and truncation rules: PASS | FAIL
17) Accessibility includes touch targets, contrast, labels for icon-only controls: PASS | FAIL
18) Manifest maps assets/components/tokens/strings to screen usage: PASS | FAIL

Decision:
- PASS: all checks are PASS.
- CONDITIONAL PASS: no structural failures; only minor polish issues.
- FAIL: any structural requirement fails (format, missing categories/sizes/formats, no token JSON, missing components/states, no manifest mapping).

Failed checks:
- [list check numbers]

Regeneration request to send:
Please regenerate handoff with missing items fixed: [failed check numbers].
Keep the same folder structure and naming format; include updated ASSET_MANIFEST.json and token JSON in one ZIP package.
```

## Notes
- Markdown summaries are useful, but cannot replace asset/tokens/spec exports.
- Keep source-of-truth in package files, not in chat messages.
- Reuse this playbook each sprint to reduce back-and-forth and handoff drift.
