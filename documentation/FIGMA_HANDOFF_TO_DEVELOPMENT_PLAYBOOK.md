# Figma to Development Handoff Playbook

## Purpose
This playbook captures the full process from asking Figma AI for a development-ready handoff package through final implementation ingestion and completion.

Use this when you want a repeatable, low-friction process with clear acceptance gates.

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

## Notes
- Markdown summaries are useful, but cannot replace asset/tokens/spec exports.
- Keep source-of-truth in package files, not in chat messages.
- Reuse this playbook each sprint to reduce back-and-forth and handoff drift.
