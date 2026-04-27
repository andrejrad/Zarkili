# Admin UI Interpretation Guidelines (From Core Figma Handoff)

## Purpose
Use these rules to implement admin-oriented screens (tenant/location/staff/services) consistently using the delivered core design handoff.

This document unblocks implementation when admin-specific pixel-perfect frames are not yet provided.

## Source of Truth
1. Visual language and tokens: `design-handoff/tokens/*`
2. Core component specs: `design-handoff/components/*`
3. Core screen conventions: `design-handoff/specs/screen-home.json` and `design-handoff/specs/screen-explore.json`
4. Accessibility requirements: `design-handoff/ACCESSIBILITY_GUIDE.md`

## Layout Rules
1. Page background: use semantic background token (`#F2EDDD`).
2. Top screen section: title + short helper text + optional primary action.
3. Admin content uses card sections on white surface with border token.
4. Section spacing:
   - page horizontal padding: 16
   - section vertical gap: 24
   - element gap inside card: 12
5. Empty/loading/error states must always be explicit and visible.

## Form Rules
1. Input height: 48.
2. Form labels use medium weight body-small.
3. Required fields are validated before submit.
4. Submit button is disabled while invalid or submitting.
5. Validation messages use error color token and concise copy.

## List and Row Rules
1. List rows should use card surface with border and radius 12-16.
2. Each row should show primary title, secondary metadata, and trailing action(s).
3. Use chips for status and role labels.
4. Ensure row actions meet minimum touch target 44x44.

## Role and Status Rendering
1. Roles and status values must be shown as normalized labels (not raw enum text where possible).
2. Destructive actions require explicit confirmation state.
3. Disabled or unavailable actions must include a visible reason when possible.

## Accessibility and Motion
1. Follow WCAG AA guidance from the handoff package.
2. All icon-only actions require accessibility labels.
3. Respect reduced motion settings.
4. Preserve focus order: title -> primary action -> filters -> list/form content.

## Platform Parity
1. Week 2 onward, changes are release-critical for web and native parity.
2. Run required checks before task closure:
   - `npm run test:smoke:web`
   - `npm run test:smoke:native`
   - `npm run check`

## Scope Note
These rules provide implementation consistency until admin-specific Figma frames are supplied.
When dedicated admin frames arrive, update this document and migrate screens incrementally.
