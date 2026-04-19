# AI-First Gen-Z Design Playbook (No Designer Required)

## Why this document exists
You want a modern Gen-Z redesign for Zarkili while reusing ZaraNails functionality, and you do not have a dedicated designer.
This playbook gives you:
- A practical execution model
- A week-by-week draft plan
- A specific AI tool stack
- Detailed prompts for each tool
- Handoff guidance for developers

---

## Core Strategy: Foundation First, Then Parallel
Do not wait for all backend/frontend work to finish.
Do not attempt full design up front either.

Use this model:
1. Week 1: Design foundation sprint (brand + UX principles + tokens + top 3 flows)
2. Week 2+: Parallel delivery by feature slices (design one sprint ahead, build current sprint)

This avoids random visual drift and avoids blocking engineering.

---

## Team Operating Model (No Designer)
You act as Prompt Engineer + Design QA owner.

Working rhythm:
1. Monday: define feature slice and success metrics
2. Tuesday: generate alternatives with AI tools
3. Wednesday: pick direction and finalize component specs
4. Thursday: developer handoff + implementation
5. Friday: quick usability testing + iteration

Definition of done per slice:
- User flow mapped
- High-fidelity screens approved
- Component states defined (default/loading/empty/error)
- Copy and micro-interactions defined
- Accessibility check passed
- Dev-ready tokens and specs delivered

---

## 4-Week Draft Execution Board

## Week 1 - Visual System + UX Foundation
Goals:
- Lock visual direction for Gen-Z target
- Define design tokens and component baseline
- Redesign key journeys only

Deliverables:
- One approved visual direction board
- Token set (color/type/spacing/radius/shadows/motion)
- Core UX principles document
- High-fidelity screens for:
  - Onboarding
  - Booking flow
  - Home/dashboard

## Week 2 - Build Slice 1 + Design Slice 2
Build now:
- Onboarding and auth experience
- Home/dashboard shell

Design in parallel:
- Service discovery/listing
- Booking detail and confirmation

## Week 3 - Build Slice 2 + Design Slice 3
Build now:
- Discovery + booking flow

Design in parallel:
- Loyalty/rewards
- Profile/account
- Empty states and no-access states

## Week 4 - Polish, Validate, and Stabilize
Build now:
- Remaining high-impact screens

Finalize:
- Motion polish
- Accessibility pass
- Copy tone consistency
- Metrics dashboard for conversion drop-offs

---

## Recommended AI Tool Stack
Use minimum stack first; add optional tools only if needed.

### Required (minimum)
1. GPT-5.3-Codex (strategy, UX logic, prompt refinement, design QA)
2. Figma + Figma AI (wireframes, UI alternatives, design system)
3. GitHub Copilot Chat in VS Code (implementation from specs)
4. Perplexity or ChatGPT web browsing mode (trend/reference research)

### Strongly Recommended
1. Midjourney or Ideogram (visual style exploration boards)
2. Maze or Lyssna (quick concept usability tests)
3. Notion AI (decision log and design rationale)

### Optional
1. Framer AI (landing/marketing page experiments)
2. Runway (short promo/motion concept previews)

---

## Tool-by-Tool Prompt Packs
All prompts are pre-filled for Zarkili. Copy and paste directly.

## 1) GPT-5.3-Codex — Product and UX Direction Prompt
Goal: produce an implementation-ready UX blueprint for the entire app.
Tool: ChatGPT (GPT-4o or GPT-4.5), Claude Opus 4, or similar.
When to run: once at the start of Week 1, before any screens are produced.

Prompt — copy everything between the lines:
---
You are a senior mobile product designer and UX strategist specializing in Gen-Z consumer apps.

Context:
- Product name: Zarkili
- Product type: mobile beauty booking platform (similar to Fresha or Treatwell)
- Primary target users: Gen-Z clients aged 16-28 booking nail, hair, skin, and beauty services
- Secondary users: salon staff and salon owners managing appointments
- Platform: iOS and Android (React Native / Expo)
- Business model: multi-tenant SaaS — each salon is a separate tenant
- Existing logic being reused from a prior app called ZaraNails:
  authentication, user profile, tenant context resolution, bookings, payments, loyalty points
- The UI is being fully redesigned; all backend logic stays the same
- Constraints: no dedicated designer on the team, only a prompt engineer and developers
  so all outputs must be implementation-ready, not conceptual

Your tasks:
1. Define exactly 6 UX principles tailored to Zarkili's Gen-Z audience
   Each principle must include: name, one-sentence definition, and one concrete do/don't example
2. Propose the full information architecture:
   - Tab bar items (max 5, label and icon suggestion each)
   - Key subflows accessible from each tab
   - Modal and bottom sheet flows vs full-screen flows
3. Write detailed user journey specs for these 5 flows:
   a. New client onboarding (first install to first completed booking)
   b. Returning client booking a service
   c. Service and salon discovery
   d. Loyalty points earning and redemption
   e. Profile and account management
   For each flow provide:
   - user goal in one sentence
   - numbered happy path steps (action by action)
   - at least 3 edge cases with recommended fallback behavior
   - top 2 friction risks and how to reduce them
4. Write a complete component inventory for the design system:
   List each component, its variants, and its required states (default, hover, loading, disabled, error, empty)
   Group into: inputs, buttons, navigation, data display, feedback, layout
5. List the top 10 open product decisions that need owner input before design can be finalized

Output format:
- Use numbered sections and subsections
- Use tables where comparisons exist
- No vague advice — every recommendation must be actionable
- Accessibility notes must be included in each journey spec
- End with a confidence score 1-10 and top 3 assumptions you made
---

---

## 2) Perplexity — Gen-Z Design Intelligence Research Prompt
Goal: gather evidence-based patterns before committing to any visual direction.
Tool: Perplexity.ai (Pro mode with web access) or ChatGPT web browsing mode.
When to run: Day 1, before generating any visuals. Save the output as a reference doc.

Prompt — copy everything between the lines:
---
Research the most effective mobile UX and visual design patterns used in Gen-Z consumer apps between 2024 and 2026.
Focus on: beauty booking, personal services, lifestyle, and social commerce apps.
Examples of relevant apps: Fresha, NAILS.INC booking, Treatwell, BeReal, Depop, Lemon8, Notion mobile, Duolingo, Spotify.

Deliver the following, with source links where possible:

1. 12 pattern findings structured as:
   - Pattern name
   - What it is (one sentence)
   - Why it resonates with Gen-Z (one sentence)
   - Example app that uses it well
   - Risk of misuse

2. Trends to actively avoid in 2026 for this audience:
   List at least 8 patterns that feel dated, patronizing, or off-brand for Gen-Z
   (examples: dark-pattern urgency banners, cluttered dashboards, excessive pop-ups, fake social proof)

3. Recommended interaction patterns specifically for:
   a. First-run onboarding (progressive permissions, value-first, social proof)
   b. Search and service discovery (filter UX, card layouts, speed)
   c. Booking confirmation (micro-celebrations, trust signals, next steps)
   d. Loyalty and rewards engagement (streaks, visual progress, redemption moments)

4. A structured do/don't comparison table with at least 16 rows tailored to Zarkili:
   Columns: area | do this | don't do this | reason

5. Summarize the 5 most important takeaways for a Gen-Z beauty app launching in 2026

Constraints:
- Mobile-first patterns only, no desktop assumptions
- Focus on behavior, flow, and interaction — not just aesthetics
- Be specific about tap counts, gesture types, screen counts, and timing where relevant
---

---

## 3) Midjourney / Ideogram — Visual Direction Boards (3 Separate Prompts)
Goal: generate 3 distinct competing visual directions so you can choose one.
Tool: Ideogram.ai (recommended — supports text in images) or Midjourney v6.
When to run: Week 1 Day 2. Generate all 3 and pick the one that feels right for Zarkili.

How to choose: Show the outputs to 3-5 people in your target age group and ask which feels most like
an app they would use. Pick the winner and proceed with that style route only.

---
Route A — Elevated Soft Minimal
Paste this into Ideogram or Midjourney:

Mobile app UI moodboard for a beauty booking app called Zarkili, style: elevated soft minimal.
Color palette: warm off-white base, deep mocha brown, dusty rose, champagne gold accents.
Typography feel: clean geometric sans-serif headings, light weight body text, generous spacing.
UI elements: large rounded cards, floating action buttons, subtle drop shadows, 8px radius everywhere.
Illustration style: thin-line minimalist beauty icons, no gradients, no heavy textures.
Mood: calm confidence, spa-like premium feeling, quiet luxury, female-coded softness.
Do not use: purple, dark mode, harsh contrast, busy backgrounds, generic tech blue.
Output as 6 representative UI tiles showing: home screen card, booking button, bottom sheet header, tab bar, color swatches, type sample.
--ar 9:16 --style raw

---
Route B — Bold Playful Editorial
Paste this into Ideogram or Midjourney:

Mobile app UI moodboard for a beauty booking app called Zarkili, style: bold playful editorial.
Color palette: near-black background, electric coral or fuchsia primary, warm cream text, bright yellow chip highlights.
Typography feel: high-contrast display font for hero text, compact readable sans for body, editorial magazine energy.
UI elements: oversized typography-first cards, pill-shaped tags, full-bleed service photos with text overlay, bold dividers.
Illustration style: flat bold shapes, high saturation chips, no gradients, punchy hover states.
Mood: expressive, energetic, cool and current, like a mix of Depop and a beauty editorial magazine.
Do not use: corporate light mode, generic icons, pastel washes, default iOS form styling.
Output as 6 representative UI tiles showing: home hero card, service chip row, bottom navigation, modal header, color palette swatches, type sample.
--ar 9:16 --style raw

---
Route C — Warm Neo-Brutalist Soft
Paste this into Ideogram or Midjourney:

Mobile app UI moodboard for a beauty booking app called Zarkili, style: warm neo-brutalist soft.
Color palette: warm sand base, terracotta, dark forest green, cream white, no neutrals above 90% brightness.
Typography feel: slightly quirky bold sans-serif, not too formal, a little personality in the letterforms.
UI elements: visible but soft borders (2px), slightly offset card shadows, flat buttons with strong borders, raw texture overlays at low opacity.
Illustration style: simple chunky outline icons, hand-crafted feel without looking amateurish, zine aesthetic warmed up.
Mood: authentic, unpretentious, wabi-sabi premium, feels handmade but is high quality.
Do not use: sterile clean tech, dark brutalism, heavy drop shadows, neon colors, generic beauty pinks.
Output as 6 representative UI tiles showing: home card layout, booking CTA button, bottom sheet, search chip row, color palette swatches, type sample.
--ar 9:16 --style raw

---

## 4) Figma AI — Screen Generation Prompt
Goal: generate first-pass high-fidelity screens inside Figma using your chosen style route.
Tool: Figma (with Figma AI / Make Designs feature, or via a plugin like Magician or Relume mobile).
Alternative if you don't have Figma AI: use this prompt in ChatGPT with "describe each screen in detail"
then build manually or use a Figma community template as a starting scaffold.
When to run: Week 1 Day 3-4, after you have selected one visual route from Step 3.

--- OPTION A: Figma AI Make Designs prompt ---
Paste this into the Figma AI "Make Designs" or similar prompt input:

Create a complete mobile app flow for Zarkili, a Gen-Z beauty booking app.
Visual style: [INSERT YOUR CHOSEN ROUTE: Route A — Elevated Soft Minimal / Route B — Bold Playful Editorial / Route C — Warm Neo-Brutalist Soft]
Platform: iOS mobile, 390x844 frame size.

Create these screens in one Figma page called v1-flow:
1. Welcome screen — app logo, tagline, sign in and sign up CTAs
2. Onboarding step 1 — location permission request with value explanation
3. Onboarding step 2 — style/service preference selection (chip grid)
4. Home — personalized greeting, featured salon cards, upcoming booking card, loyalty points widget
5. Service discovery — search bar, filter chips, vertical card list
6. Service detail — service photo, name, duration, price, book button, staff photos
7. Date and time selection — calendar picker, time slot grid, continue button
8. Booking confirmation — summary card, add to calendar button, home CTA
9. Loyalty/rewards — points balance, progress ring, redemption offers grid
10. Profile — avatar, booking history list, account settings rows

For each screen include:
- Exactly one primary CTA button
- Secondary actions visually de-emphasized
- One loading skeleton state frame per screen
- One empty state frame for discovery and history screens
- One error state for the booking confirmation screen

Design system rules:
- Spacing: 4pt base grid, common values 8 / 12 / 16 / 24 / 32
- Border radius: 12px cards, 100px pills, 8px inputs
- Touch targets: minimum 44x44pt for all interactive elements
- Contrast: minimum WCAG AA on all text
- Create a Components page with these base components:
  PrimaryButton, SecondaryButton, InputField, ServiceCard, BookingCard, Chip,
  BottomSheetHeader, TabBarItem, Toast, AvatarBadge
- All components must have: default, pressed/active, disabled, and loading variants

--- OPTION B: ChatGPT detailed screen specification prompt ---
Use this if you are building screens manually in Figma from text specs:

You are a senior mobile UI designer.
Write a pixel-level screen specification for each of the 10 Zarkili screens listed below.
Visual direction: [INSERT YOUR CHOSEN ROUTE]

For each screen provide:
1. Screen purpose (one sentence)
2. Layout structure (header / body / footer breakdown)
3. Every UI element with: component type, label text, position, size, color token, interaction behavior
4. Spacing values between all major sections
5. Typography: font weight, size, color token for each text element
6. Loading skeleton layout
7. Empty or error state behavior

Screens to specify:
1. Welcome
2. Onboarding preference selector
3. Home
4. Service discovery
5. Service detail
6. Date and time picker
7. Booking confirmation
8. Loyalty/rewards
9. Booking history
10. Profile/settings

Output as numbered sections. Use tables for element lists wherever possible.

---

## 5) GPT — Design QA Before Handoff Prompt
Goal: catch UX and consistency issues before developers start building.
Tool: ChatGPT or Claude.
When to run: after each Figma flow is ready, before handing to developers.
How to use: export your Figma screens as images or write brief descriptions of each screen
then paste them plus this prompt into the chat.

Prompt — copy everything between the lines:
---
You are a mobile UX quality assurance expert and accessibility specialist.
Perform a strict design QA review on the following Zarkili mobile app screens.

App context:
- Product: Zarkili — Gen-Z beauty booking app
- Platform: React Native mobile (iOS primary)
- Target audience: Gen-Z clients aged 16-28
- Design system: token-based (colors, spacing, radius, type defined in tokens)

[PASTE SCREEN LIST OR IMAGE DESCRIPTIONS HERE]

Evaluate every screen against these criteria:

1. Visual consistency
   - Spacing adherence to 4pt grid
   - Radius consistency across components
   - Color token usage (no hardcoded values)
   - Typography scale consistency

2. Hierarchy and scannability
   - Is the primary CTA obvious within 1 second?
   - Is there one clear focus per screen?
   - Are secondary actions visually de-emphasized?

3. Conversion friction
   - Count total tap steps for booking happy path (target: under 6 taps)
   - Identify any unnecessary confirmation dialogs
   - Flag any form fields that could be auto-filled or skipped

4. Accessibility
   - Text contrast ratio (flag anything below AA)
   - Touch target sizes (minimum 44x44pt)
   - Labels on all icon-only buttons
   - No color-only information encoding

5. State coverage — for each screen, confirm or flag missing:
   - Loading skeleton
   - Empty state
   - Error state
   - No-access / permission-denied state

6. Component reusability
   - Flag any elements that should be shared components but appear custom
   - Suggest merges where two components do the same job visually

Output format:
- A severity-ranked issue table: screen | issue | severity (critical/high/medium) | fix
- A state coverage matrix: screen × state (tick/flag)
- A friction score for the booking happy path (tap count)
- Overall ship-readiness score out of 10 with a one-paragraph summary
- Top 3 must-fix items before developer handoff
---

---

## 6) GitHub Copilot Chat - Implementation Prompt (React Native)
Goal: convert approved design into implementation-ready tasks and code.

Prompt:
Implement the approved Zarkili UI slice in React Native Expo while reusing all existing business logic.

Project context:
- React Native + Expo, TypeScript
- Existing providers: AuthProvider, TenantProvider, LanguageProvider, ThemeProvider
- Existing app structure under src/ and app/ (Expo Router)
- All business logic, Firebase calls, and data contracts must be preserved unchanged
- Only the UI layer is being redesigned

Design system tokens to create at src/shared/design/tokens.ts:
- Colors:
  background: '#FAF7F4' (warm off-white)
  surface: '#FFFFFF'
  primary: '#2C1810' (deep mocha)
  primaryMuted: '#6B4226'
  accent: '#D4A96A' (champagne gold)
  accentSoft: '#F5E6D0'
  textPrimary: '#1A1208'
  textSecondary: '#7A6555'
  textDisabled: '#BBA99A'
  success: '#3D8B5E'
  error: '#C0392B'
  warning: '#E67E22'
  border: '#EAE0D8'
  overlay: 'rgba(44,24,16,0.4)'
- Typography: font families Inter (body) and Playfair Display (display headings)
  Scale: xs 11, sm 13, md 15, lg 17, xl 20, 2xl 26, 3xl 34
  Weights: regular 400, medium 500, semibold 600, bold 700
- Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- Radius: sm 6, md 12, lg 20, xl 28, full 100
- Elevation: 0, 1 (subtle), 2 (card), 3 (modal)
- Motion: duration fast 150ms, normal 250ms, slow 400ms, easing standard ease-out

Build these UI primitive components in src/shared/ui/:
- PrimaryButton — label, onPress, loading, disabled states; height 52px; radius full; touch target 52px
- SecondaryButton — outlined variant, same props
- TextInput — label, value, error, placeholder; height 52px; radius md
- ServiceCard — image, name, price, duration, onPress; radius lg; elevation 2
- BookingCard — service name, date, time, status badge; horizontal layout
- Chip — label, selected boolean, onPress; radius full; two size variants
- SectionHeader — title, optional action label and onPress
- BottomSheetWrapper — children, visible, onClose; animated slide-up
- Toast — message, type (success/error/info), auto-dismiss
- LoadingSkeleton — width, height, radius props; animated shimmer
- EmptyState — illustration placeholder, title, subtitle, optional CTA
- ErrorState — message, retry onPress button

Screens to implement for this slice: [Slice 1 — Week 2]
- screens/auth/WelcomeScreen.tsx
- screens/auth/SignInScreen.tsx
- screens/onboarding/PreferencesScreen.tsx
- screens/home/HomeScreen.tsx

For each screen:
- Wire to existing providers using established hooks only
- Add loading skeleton state while data is fetching
- Add empty state if no content to display
- Add error state with retry if a fetch fails
- All interactive elements must have accessibilityLabel and minimum 44pt touch targets

Constraints:
- No StyleSheet.create with hardcoded color or spacing values — use tokens only
- No business logic changes
- No new Firebase calls — only consume what existing providers already expose
- Keep each component file under 150 lines; extract sub-components if needed
- Add one snapshot or render test per component

Output:
- List of modified files
- Summary of token architecture decisions
- Any open TODOs before next slice can start

---

## 7) Maze or Lyssna - Concept Test Prompt
Goal: validate if the redesign actually improves clarity and speed.

Prompt:
Set up a 5-task unmoderated usability test for a mobile beauty booking prototype.

Target:
- Gen-Z users ages 18-28

Tasks:
1. Find a service and book an appointment tomorrow evening
2. Change selected staff member
3. Apply reward points or loyalty benefit
4. Reschedule an existing booking
5. Locate cancellation policy

Collect:
- task success rate
- misclick heatmaps
- time on task
- confidence rating

Output:
- top 5 usability issues by impact
- concrete fix recommendations

---

## Prompt Engineering Rules That Keep Quality High
1. Always include:
- user type
- platform
- constraints
- output format
- quality bar

2. Force structured output:
- numbered sections
- tables for comparisons
- severity ratings for critique

3. Ban vague outputs:
- explicitly request implementation-ready details

4. Use iterative prompting:
- pass 1: breadth
- pass 2: critique
- pass 3: final production spec

5. Keep one source of truth:
- final accepted spec lives in one documentation file per feature slice

---

## Handoff Package Template (to developers)
For each feature slice, hand off:
1. Screen list and flow chart
2. Token updates
3. Component list with variants and states
4. Interaction notes (animations, transitions, gestures)
5. Accessibility requirements
6. Acceptance checklist
7. Event tracking requirements

---

## Risks and Mitigations (AI-Only Design)
1. Risk: inconsistent style across screens
- Mitigation: lock token system in Week 1 and enforce token-only styling

2. Risk: pretty but unusable flows
- Mitigation: weekly 5-user concept testing

3. Risk: overproduction of design variants
- Mitigation: cap to 3 alternatives per screen, decide fast

4. Risk: implementation drift
- Mitigation: design QA before every dev handoff and after implementation

---

## Blueprint-to-Build Mapping (Use After Task 1)
Use this table immediately after you complete Task 1 (implementation-ready UX blueprint).
It tells you exactly where each blueprint output is used next.

| Blueprint Output | Used In Figma | Used In Copilot/Code | Acceptance/Test Gate | Evidence to Save |
| --- | --- | --- | --- | --- |
| UX principles (6) | Validate visual direction and hierarchy choices across all frames. | Enforce via tokens, spacing, component behavior decisions. | QA prompt: flag any screen violating principles. | One-page checklist of principle pass/fail per flow. |
| IA map (tabs + subflows) | Create top-level navigation, route groups, and screen sequence. | Map to route files and navigation config (Expo Router). | Navigation smoke test: all primary paths reachable. | IA-to-route mapping sheet. |
| Journey spec: onboarding | Build frame sequence from first open to first successful booking. | Implement onboarding screens, states, and transitions. | Tap-count check + empty/error/no-access states covered. | Journey screenshot strip with state frames. |
| Journey spec: discovery | Create search/filter/list/detail frames and edge-state frames. | Implement discovery list/detail components and filters UI. | Query/loading/empty/error behavior test. | Before/after QA notes for discovery flow. |
| Journey spec: booking | Build date/time, confirmation, and trust-signal screens. | Implement booking UI states using existing booking logic hooks. | Happy path under 6 taps where feasible. | Booking flow test cases and pass status. |
| Journey spec: loyalty | Build rewards balance/progress/redemption frames. | Implement loyalty widgets/cards with reusable components. | State coverage: no data, partial data, unavailable. | Loyalty acceptance checklist. |
| Journey spec: profile/account | Build profile, settings, and account history frames. | Implement profile modules with existing provider data. | Accessibility check: labels, touch targets, contrast. | Profile QA report. |
| Component inventory + states | Build components page with all variants and states. | Create shared UI primitives in src/shared/ui and wire tokens. | Component tests: render/state snapshots. | Component inventory parity list (spec vs code). |
| Open product decisions | Mark unresolved items in Figma notes and handoff doc. | Create TODO list; do not hardcode unresolved behavior. | Product owner sign-off before merge. | Decisions log with owner and due date. |

### Slice Execution Loop (Repeat Weekly)
1. Select one journey row from the table.
2. Build Figma frames and all required states.
3. Run Design QA prompt and fix critical/high issues.
4. Freeze handoff package for that slice.
5. Implement via Copilot prompt using frozen specs only.
6. Run tests and acceptance checklist.
7. Log output and key prompts in diary.

### Definition of Ready (Before Developers Start)
1. Journey has happy path + edge cases documented.
2. Figma includes loading/empty/error/no-access states.
3. Components are mapped to existing or new shared primitives.
4. Open decisions are either resolved or explicitly blocked.
5. Acceptance checklist exists for this slice.

---

## Strict 10-Minute Figma QA Checklist (Per Batch)
Run this immediately after each Figma batch and before developer handoff.

### QA Prompt (Copy/Paste)
```text
Run a strict QA on this Figma flow for Zarkili (Gen-Z beauty booking app).

Review scope:
- Flow under review: [Onboarding / Discovery / Booking / Loyalty / Profile]
- Platform: iOS mobile
- Design system: token-based
- Required states: loading, empty, error, no-access

Return output in this exact format:

1) Critical Failures (must fix before handoff)
- [Screen]
   - Issue:
   - Why critical:
   - Exact fix:

2) High Issues (fix this iteration)
- [Screen]
   - Issue:
   - Exact fix:

3) Medium Improvements (next iteration)
- [Screen]
   - Improvement:
   - Suggested enhancement:

4) Checklist Scorecard (Pass/Fail per item)
A. Visual Consistency
- Uses existing components only
- No new ad-hoc styles
- Spacing follows 4/8 scale
- Radius and elevation consistent
- Typography hierarchy consistent

B. UX Clarity
- One primary CTA per screen
- Secondary actions de-emphasized
- Screen intent understood in < 1 second
- No unnecessary decision points

C. Conversion Friction
- Happy path tap count: [number]
- Any redundant step? [yes/no + where]
- Any avoidable modal/dialog? [yes/no + where]

D. State Coverage
- Loading present
- Empty present
- Error present
- No-access present

E. Accessibility
- Contrast meets WCAG AA
- All touch targets >= 44px
- Icon-only actions have labels
- No color-only meaning

5) Final Decision
- Status: PASS / PASS WITH FIXES / FAIL
- Ship-readiness score: X/10
- Top 3 required actions before developer handoff
```

### Fast Accept Rule
1. `FAIL` if any critical issue exists.
2. `PASS WITH FIXES` if only high/medium issues exist and none block core flow.
3. `PASS` only if all critical/high issues are resolved, all required states exist, accessibility checks are green, and happy-path friction target is met.

### Suggested Targets by Flow
1. Onboarding: first meaningful completion in <= 5 taps.
2. Discovery: filter-to-result refinement in <= 3 interactions.
3. Booking: service detail to confirmation in <= 6 taps.
4. Loyalty: points understanding in <= 2 seconds visual scan.
5. Profile: key action access (history/settings/support) in <= 2 taps.

---

## Next Actions (Start Today)
1. Run the GPT-5.3-Codex Product and UX Direction prompt
2. Run the research prompt and capture references
3. Generate 3 style routes using Midjourney/Ideogram
4. Select one route and generate first Figma flow
5. Run Design QA prompt and produce dev handoff package
