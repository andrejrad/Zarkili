# Prompt Template

Use this scaffold for any **screen** or **component** prompt added to a batch file. Always prepend the **Global Design System Anchor** from [`README.md`](README.md) when your AI tool needs explicit context (Figma Make, Galileo, Builder.io Visual Copilot, Magician, Uizard).

---

## Per-screen prompt scaffold

```text
SCREEN: <name>            DEVICE: <iPhone 14 390×844 | iPad 768×1024 | …>
PERSONA: <who is using this and why>
USER JOB: <one-sentence outcome the user must achieve>

LAYOUT
- Header: <type, height, content>
- Body: <sections in vertical order, each with anchor token & component>
- Footer / sticky CTA: <if any>

REUSE (do not redraw)
- Components: <pick from existing: badge, bottom-tab-item, category-pill, chip,
  filter-button, search-bar, service-card; plus any defined in earlier batches>
- Screen pattern reference: <welcome | home | explore>

TOKENS
- Background: cream-silk (#F2EDDD)
- Surface: #FFFFFF, radius large (16) for cards
- Primary CTA: coral-blossom, label-large 14/20 weight 500, radius medium (12), height 48
- Body text: foreground (#1A1A1A); muted (#6B6B6B) for secondary
- Spacing: page H 16, page V 24, section gap 24, element gap 12

CONTENT (US-primary, en-US, USD, MM/DD/YYYY, 12h AM/PM)
- <realistic strings, prices, dates, names>

STATES (deliver as separate frames)
1. Default
2. Loading (skeletons)
3. Empty
4. Error (with retry)
5. <permission-denied | success | success-toast> if applicable

INTERACTIONS
- <tap, swipe, long-press behaviors and the navigation target>
- Reduce-motion: replace any transition >200ms with 100ms cross-fade

ACCESSIBILITY
- All touch targets ≥44×44
- Contrast ≥4.5:1
- accessibilityLabel for every icon-only control
- Dynamic type: layout valid at body 14 → 20

OUT OF SCOPE
- <what NOT to draw, e.g., admin-only data, EU-only fields>
```

---

## Per-component prompt scaffold

```text
COMPONENT: <name>          VARIANTS: <list>
USED IN: <batch + screens>

ANATOMY
- <part 1 — token>
- <part 2 — token>

STATES (deliver each as a variant)
- default, hover, pressed, focused, selected, disabled, loading, error

TOKENS
- Background, foreground, border, radius, padding, gap (4pt grid only)
- Typography style from the 8 defined styles

ACCESSIBILITY
- Min target 44×44
- Focus ring: 2px coral-blossom outline, 2px offset
- accessibilityRole and accessibilityLabel pattern

INTERACTIONS
- Tap → <effect>
- Long-press → <effect, if any>

API SHAPE (for engineering handoff)
- props: <name: type — required?>
```

---

## Human Review Checklist (every batch file ends with this)

- [ ] Tokens match `design-handoff/tokens/*` exactly (no new colors, no off-grid spacing, no extra weights).
- [ ] Existing components reused; new components only where the batch defines them.
- [ ] All required states present (default / loading / empty / error / + role / + success).
- [ ] WCAG 2.1 AA contrast verified with Stark or contrast-ratio tool.
- [ ] All touch targets ≥44×44.
- [ ] US-primary defaults applied (en-US, USD, MM/DD/YYYY, 12h, US phone format).
- [ ] Dynamic-type behavior validated at body 14 and body 20.
- [ ] Reduce-motion variant captured for any transition > 200ms.
- [ ] Frames named: `<batch>-<screen>-<state>` (e.g., `C-booking-review-error`).
- [ ] Asset manifest updated (icons, images) per `design-handoff/ASSET_MANIFEST.json`.
- [ ] Package follows `FIGMA_HANDOFF_TO_DEVELOPMENT_PLAYBOOK.md` Phase 5 contract.
