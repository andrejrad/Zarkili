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

## Route Selection Scorecard (A vs B vs C)
Use this right after generating outputs for all three routes.

### How to run (10 minutes)
1. Generate 3-5 images per route.
2. Pick the top 2 images from each route.
3. Score each route against the criteria below (1 to 5 per criterion).
4. Multiply score by weight.
5. Select highest weighted total.
6. If top two routes are within 5 points, run one tie-breaker round with 3 target users.

### Scoring rubric
| Criterion | Weight | What "1" means | What "5" means |
| --- | --- | --- | --- |
| Gen-Z resonance | 30 | Feels generic or dated | Feels current, expressive, and native to Gen-Z taste |
| Booking clarity | 25 | Visual style reduces CTA clarity | Primary action is obvious in under 1 second |
| Brand distinctiveness | 20 | Looks like any booking app | Instantly recognizable and ownable visual identity |
| Accessibility readiness | 15 | Contrast and readability likely to fail | High readability and contrast across core screens |
| Implementation feasibility | 10 | Requires heavy custom effort and risky UI | Easy to implement with reusable components/tokens |

### Weighted score sheet (copy/paste)
| Route | Gen-Z resonance (x30) | Booking clarity (x25) | Distinctiveness (x20) | Accessibility (x15) | Feasibility (x10) | Total |
| --- | --- | --- | --- | --- | --- | --- |
| Route A |  |  |  |  |  |  |
| Route B |  |  |  |  |  |  |
| Route C |  |  |  |  |  |  |

### Hard fail gates (route is disqualified if any are true)
1. Primary CTA is not visually dominant on sample screen compositions.
2. Text contrast appears likely below WCAG AA for body text.
3. Style depends on effects difficult to reproduce consistently in React Native.
4. Team cannot define a stable token system from the route in one session.

### Tie-breaker mini test (if needed)
Show two top routes to 3 target users and ask:
1. Which one would you trust to book and pay in right now?
2. Which one feels more modern without feeling confusing?
3. Which one is easier to scan quickly?

Pick the route winning at least 2 of 3 questions in at least 2 of 3 participants.

### Decision log template
- Selected route:
- Runner-up route:
- Why selected (3 bullets):
- Risks accepted:
- Token implications:
- Effective date:

---

## Pre-Figma Prep Checklist (Do This Before Running Step 4)
Before you paste the Figma prompt, gather all outputs from Steps 1-3.

### Gather Step 1 Outputs (GPT UX Direction Prompt)
From your GPT output document, extract and have ready:
- [ ] **6 UX Principles** (copy names, definitions, and do/don't examples)
- [ ] **IA Map** (tab bar items with labels and subflows)
- [ ] **5 Journey Specs** (numbered happy paths + edge cases)
- [ ] **Component Inventory** (components, variants, required states)
- [ ] **Open Decisions** (unresolved product questions)

### Gather Step 2 Outputs (Perplexity Research Prompt)
From your research document, extract and have ready:
- [ ] **12 Gen-Z Design Patterns** (pattern name + why it resonates)
- [ ] **8+ Trends to Avoid** (specific anti-patterns)
- [ ] **Interaction Recommendations** for onboarding, discovery, booking, loyalty
- [ ] **Do/Don't Comparison Table** (minimum 16 rows)

### Gather Step 3 Outputs (Route Selection)
From your Route Selection Scorecard and route outputs, extract and have ready:
- [ ] **Selected Route** (A, B, or C)
- [ ] **Exact Color Palette** (hex or RGB values)
- [ ] **Typography Style** (font families and weight ranges)
- [ ] **Corner/Radius Direction** (soft/hard/mixed)
- [ ] **Illustration Style** (line/chunky/minimal)
- [ ] **Mood Sentence** (one-line visual vibe)

### File Organization
- Create a scratch doc with all Step 1/2/3 outputs in one place.
- Label sections: "UX Principles," "Research Findings," "Route Selection Decision."

---

## 4) Figma AI — Screen Generation Prompt (Integrates Steps 1-3)
Goal: generate first-pass high-fidelity screens in Figma using your selected route and all constraints from Steps 1-3.

Tool: Figma AI (Make Designs) or ChatGPT (manual spec fallback).

When to run: Week 1 Day 3-4, after Pre-Figma Checklist is complete.

### Pre-Flight Rules
- Do NOT leave any [INSERT ...] placeholder blank.
- Copy exact outputs from Steps 1-3.
- Keep one source of truth for this slice.

### OPTION A: Figma AI Make Designs Prompt (Recommended)
Paste this into Figma AI:

```text
Create a complete mobile app flow for Zarkili, a Gen-Z beauty booking app.

=== VISUAL DIRECTION (from Step 3) ===
Selected route: [INSERT ROUTE NAME: Route A / Route B / Route C]
Color palette:
[INSERT EXACT COLOR PALETTE VALUES]
Typography approach:
[INSERT TYPOGRAPHY STYLE/FONTS]
Mood and visual feel:
[INSERT MOOD SENTENCE]
Illustration style:
[INSERT ILLUSTRATION STYLE]
Do NOT use:
[INSERT ROUTE DO-NOT-USE LIST]

=== UX PRINCIPLES (from Step 1) ===
[INSERT ALL 6 UX PRINCIPLES WITH DEFINITIONS]

=== INFORMATION ARCHITECTURE (from Step 1) ===
[INSERT IA MAP: TABS + SUBFLOWS + MODAL VS FULL-SCREEN]

=== INTERACTION PATTERNS (from Step 2) ===
Onboarding:
[INSERT ONBOARDING PATTERNS]
Target: <= 5 taps to first meaningful completion

Discovery:
[INSERT DISCOVERY PATTERNS]
Target: <= 3 interactions for filter-to-result refinement

Booking:
[INSERT BOOKING PATTERNS]
Target: <= 6 taps from detail to confirmation

Loyalty:
[INSERT LOYALTY PATTERNS]

=== DO/DON'T RULES (from Step 2) ===
[INSERT FULL DO/DON'T TABLE]

=== COMPONENT INVENTORY (from Step 1) ===
[INSERT FULL COMPONENT LIST WITH VARIANTS + STATES]

=== SCREENS TO BUILD (Baseline, Not a Hard Limit) ===
Create baseline frames in one page named v1-flow (390x844):
1. Welcome
2. Onboarding step 1
3. Onboarding step 2
4. Home
5. Service discovery
6. Service detail
7. Date/time selection
8. Booking confirmation
9. Loyalty/rewards
10. Profile

=== USER JOURNEYS TO COVER END-TO-END (Required) ===
Use Step 1 journey specs and ensure these journeys are fully represented:
1. New client onboarding (first open to first completed booking)
2. Returning client booking a service
3. Service and salon discovery
4. Loyalty points earning and redemption
5. Profile and account management

If the baseline 10 screens are not enough to cover all required happy paths and edge cases,
add supporting screens in a second page named v1-flow-extended.

For each journey include:
- happy path sequence
- at least one edge-case frame
- friction-reduction cues from Step 2 patterns

=== REQUIRED STATES ===
For each relevant screen include:
- Default
- Loading skeleton
- Empty
- Error
- No-access / permission-denied

=== DESIGN RULES ===
- 4pt spacing grid (8, 12, 16, 24, 32, 40, 48)
- Touch targets >= 44x44pt
- WCAG AA contrast minimum
- One clear primary CTA per screen
- Secondary actions de-emphasized
- Token-only styling

=== OPEN DECISIONS ===
[INSERT OPEN DECISIONS FROM STEP 1]
Mark each as: AWAITING PRODUCT REVIEW

=== INITIAL PASS PLACEHOLDER COVERAGE (Required) ===
In the same initial run, add placeholder frames for these non-core features:
- Waitlist
- Messages
- Social Share
- Referral
- Language Switcher
- Booking Image Attachments
- Staff Operations
- Owner/Admin Dashboard
- Multi-Tenant Platform Admin

Requirements for each placeholder frame:
- include route/entry point
- include primary CTA label
- include one-line expected outcome
- include role visibility note (client/staff/owner-admin/platform-admin)
- include note linking to expansion prompt section:
   - 4B Prompt A-F for client expansion features
   - 4C Prompt A-C for staff/admin features

Place these placeholders in page: v1-flow-placeholders
```

### Initial Pass Placeholder Coverage Matrix (Required)
Use this in the same initial Figma run so no critical feature is forgotten.

Rule:
1. Core journeys must be high-fidelity and state-complete.
2. Expansion journeys must appear as placeholder frames (low-to-mid fidelity) with clear entry points, intended CTA, and status notes.
3. Each placeholder must include a note linking to the later prompt pack section (`4B` for client expansions, `4C` for staff/admin).

| Feature/Flow | Initial Pass Requirement | Fidelity in Initial Pass | Expand In |
| --- | --- | --- | --- |
| Onboarding | Full journey + all required states | High | Section 4 (core) |
| Discovery/Booking | Full journey + all required states | High | Section 4 (core) |
| Loyalty/Profile | Full journey + all required states | High | Section 4 (core) |
| Waitlist | Placeholder entry + one key state frame | Low-Mid | Section 4B Prompt A |
| Messages | Placeholder inbox + thread entry frame | Low-Mid | Section 4B Prompt B |
| Social Share | Placeholder share entry from confirmation | Low-Mid | Section 4B Prompt C |
| Referral | Placeholder referral hub entry frame | Low-Mid | Section 4B Prompt D |
| Language Switcher | Placeholder settings entry + switch modal | Low-Mid | Section 4B Prompt E |
| Booking Attachments | Placeholder upload entry in booking detail | Low-Mid | Section 4B Prompt F |
| Staff Operations | Placeholder staff home + agenda entry | Low-Mid | Section 4C Prompt A |
| Owner/Admin Dashboard | Placeholder KPI dashboard shell | Low-Mid | Section 4C Prompt B |
| Multi-Tenant Platform Admin | Placeholder tenant directory shell | Low-Mid | Section 4C Prompt C |

Minimum placeholder spec (for each non-core feature):
1. Screen name and route/entry point.
2. Primary CTA label.
3. One-line expected user outcome.
4. Role visibility note (`client`, `staff`, `owner/admin`, `platform admin`).
5. Link/note to exact expansion prompt section.

### OPTION B: ChatGPT Detailed Screen Specification (Fallback)
Use this if Figma AI is unavailable or low quality:

```text
You are a senior mobile UI designer specializing in Gen-Z consumer apps.

Write a pixel-level screen specification for Zarkili using inputs from Steps 1-3.

Context:
Visual direction: [INSERT ROUTE]
UX principles: [INSERT 6 PRINCIPLES]
Interaction patterns: [INSERT RESEARCH PATTERNS]
Do/Don't table: [INSERT TABLE]

For each screen provide:
1. Purpose
2. Layout (header/body/footer)
3. Element inventory (component, label, position, size, token, behavior)
4. Spacing values
5. Typography values
6. Loading skeleton
7. Empty/error/no-access behavior

Screens:
1. Welcome
2. Onboarding preference selector
3. Home
4. Service discovery
5. Service detail
6. Date/time picker
7. Booking confirmation
8. Loyalty/rewards
9. Booking history
10. Profile/settings

Output as numbered sections and tables.
```

---

## 4B) Feature Expansion Prompt Pack (Post-Core Skeleton)
Goal: extend the core flow into advanced features using separate Figma AI runs.

When to run:
1. After core onboarding, discovery, booking, loyalty, and profile flows pass QA.
2. One feature slice at a time (do not batch all features in one prompt).

How to use:
1. Keep the same token system and chosen visual route from Step 3.
2. Paste one prompt below into Figma AI.
3. Run QA (Section 5) before moving to the next feature.

### Global constraints for every feature slice
- Platform: iOS mobile, 390x844.
- Keep one primary CTA per screen.
- Include loading, empty, error, and no-access states where relevant.
- Keep touch targets >= 44x44pt and WCAG AA contrast.
- Reuse existing components first; only add new primitives when required.

### Prompt A: Waiting List (Full Capacity Booking)
Copy/paste into Figma AI:

```text
Extend the Zarkili mobile flow with a waiting list feature for fully booked services.

Context:
- Reuse existing Zarkili design system, tokens, typography, and selected visual route.
- Keep business logic assumptions minimal and UI-focused.

Create these screens and states:
1. Service detail (full capacity variant)
   - Primary CTA: "Join Waiting List"
   - Secondary: "Pick another time"
2. Waiting list form bottom sheet
   - Inputs: preferred date range, time range, staff preference (optional), notes (optional)
   - Primary CTA: "Confirm Waiting List"
3. Waiting list confirmation screen
   - Summary card + expected notification behavior
   - Primary CTA: "Done"
4. My bookings tab - waiting list section
   - Status chips: active, matched, expired, cancelled
5. Slot matched notification modal
   - Countdown hold timer + primary CTA "Book Now"

Required states:
- Loading: joining waiting list
- Empty: no active waiting list requests
- Error: submission failed / network fail
- No-access: user not signed in

Output:
- Frames for all screens above
- Component variants for waiting list status chip and hold timer banner
- Notes on where push notifications appear in flow
```

### Prompt B: Messaging (Client <-> Salon)
Copy/paste into Figma AI:

```text
Extend the Zarkili mobile flow with in-app messaging between client and salon.

Context:
- Keep existing tokens and visual route unchanged.
- Messaging should support pre-booking questions and post-booking updates.

Create these screens and states:
1. Messages inbox screen
   - Thread list with unread indicators and last message preview
   - Primary CTA: "New Message" (if allowed)
2. Conversation thread screen
   - Message bubbles, timestamps, read indicators
   - Composer with text input and send button
3. Booking-linked chat entry point
   - Booking card with "Message Salon" CTA
4. Quick reply templates bottom sheet
   - Suggested replies for common booking questions
5. Message notification settings screen
   - Toggles: push, email, mute thread

Required states:
- Loading: inbox sync and thread load
- Empty: no conversations
- Error: message failed to send with retry
- No-access: messaging disabled for this tenant

Output:
- Frames for all screens above
- Component variants for message bubble (sent/received/error) and unread badge
- Accessibility labels for send, attach, and retry actions
```

### Prompt C: Social Share (Post-Booking and Results)
Copy/paste into Figma AI:

```text
Extend the Zarkili mobile flow with social sharing moments.

Context:
- Keep UI consistent with current Zarkili route and component system.
- Sharing should feel optional and non-intrusive.

Create these screens and states:
1. Booking confirmation (share-enabled variant)
   - Secondary CTA: "Share booking"
2. Share composer bottom sheet
   - Preview card, caption field, channel options
3. Share destination picker
   - Instagram Story, WhatsApp, Copy Link, More
4. Share success toast/modal
   - Confirmation + optional referral tie-in
5. Privacy controls panel
   - Toggle what data is included in share card

Required states:
- Loading: generating share preview
- Empty: no preview image available
- Error: share intent failed / channel unavailable
- No-access: user denied photo/media permission

Output:
- Frames for all screens above
- Share card component variants (minimal, detailed)
- Clear privacy copy and default-safe settings
```

### Prompt D: Referral Program
Copy/paste into Figma AI:

```text
Extend the Zarkili mobile flow with a referral program feature.

Context:
- Reuse loyalty visual language and token system.
- Keep rewards understandable in under 2 seconds scan time.

Create these screens and states:
1. Referral hub screen
   - Personal referral code, invite CTA, progress summary
2. Invite friends bottom sheet
   - Channel picker + invite message preview
3. Referral status list
   - Pending, joined, completed reward statuses
4. Reward unlock screen
   - Celebration + reward details + redemption CTA
5. Referral terms and eligibility screen
   - Clear rules and exclusions

Required states:
- Loading: referral status fetch
- Empty: no referrals yet
- Error: code invalid or fetch failed
- No-access: referrals disabled for tenant/region

Output:
- Frames for all screens above
- Component variants for referral status row and reward badge
- Conversion-oriented hierarchy with one primary CTA per screen
```

### Prompt E: Language Switcher and Localization UX
Copy/paste into Figma AI:

```text
Extend the Zarkili mobile flow with language switching and localization UX.

Context:
- Support multilingual users without changing core navigation patterns.
- Maintain visual consistency and readability for longer translated strings.

Create these screens and states:
1. Language settings screen
   - Current language, list of available languages, search input
2. In-flow quick language switcher
   - Lightweight selector from profile/settings
3. Language confirmation modal
   - "Apply now" and "Cancel" actions
4. Localized booking summary screen variant
   - Date/time/currency format example
5. Missing translation fallback state
   - Safe fallback to default language with notice

Required states:
- Loading: language pack switch in progress
- Empty: no additional language packs
- Error: language update failed
- No-access: language locked by tenant policy

Output:
- Frames for all screens above
- UI notes for long text handling, truncation, and multiline behavior
- RTL readiness notes (if RTL languages are planned)
```

### Prompt F: Booking Image Attachments
Copy/paste into Figma AI:

```text
Extend the Zarkili booking flow with image attachments for booking requests.

Context:
- Users can attach inspiration/reference images during booking.
- Keep privacy messaging clear and friction low.

Create these screens and states:
1. Booking detail screen (attachment-enabled variant)
   - Section: "Add reference images" with add button
2. Image source picker bottom sheet
   - Camera, Photo Library, Files
3. Attachment preview grid
   - Thumbnail cards with remove/replace actions
4. Permission prompt state
   - Camera/photo access rationale and CTA
5. Upload progress and completion state
   - Per-image progress + success/failure indicators

Required states:
- Loading: upload in progress
- Empty: no attachments yet
- Error: upload failed / file too large / unsupported format
- No-access: permission denied

Output:
- Frames for all screens above
- Component variants for attachment tile, upload progress, and error badge
- Guardrails copy for accepted file types and max size
```

### Sequencing recommendation (after core skeleton)
1. Waiting List + Booking Image Attachments (booking-critical)
2. Messaging (support-critical)
3. Referral + Social Share (growth-critical)
4. Language Switcher (scale-critical)

---

## 4C) Staff/Admin Figma Prompt Pack (Operations + Back Office)
Goal: design non-client journeys for salon operations, owner workflows, and multi-tenant controls.

When to run:
1. After Section 4 core client flow is approved.
2. In parallel with client feature expansion (Section 4B), but as a separate track.

How to use:
1. Reuse the same design tokens and route selected in Section 3.
2. Keep role boundaries explicit (staff vs owner/admin vs platform admin).
3. Run Section 5 QA after each staff/admin slice.

### Global constraints for staff/admin prompts
- Platform primary: iOS mobile for staff app, responsive web/tablet for owner/admin dashboard.
- All role-restricted actions must show permission-based states.
- Every critical action requires clear success/failure feedback.
- Include loading, empty, error, and no-access states for each major screen.
- Prioritize scan speed and task completion over decorative density.
- Treat each salon location as an explicit operating unit with independent hours, capacity, and staff assignment.

### Prompt A: Salon Staff App (Daily Operations)
Copy/paste into Figma AI:

```text
Create a salon staff operations flow for Zarkili.

Role context:
- User role: salon staff member (technician/stylist/front desk)
- Primary goal: manage daily appointments quickly and reduce no-shows

Create these screens:
1. Staff home / today's agenda
   - upcoming appointments timeline, late/cancel alerts, quick actions
2. Appointment detail (staff view)
   - service, client notes, attachment previews, status actions
3. Check-in / check-out flow
   - mark arrived, in-service, completed, no-show
4. Waitlist management panel
   - available slot suggestions, one-tap match, confirm booking
5. In-app client message screen
   - templates for delay, confirmation, pre-service instructions

Required states:
- loading (agenda sync)
- empty (no appointments today)
- error (update failed)
- no-access (insufficient permission)

Output:
- full screen frames + key components
- status color/token map for appointment state badges
- interaction notes for time-critical actions
```

### Prompt B: Salon Owner/Admin Dashboard (Business Control)
Copy/paste into Figma AI:

```text
Create a salon owner/admin dashboard flow for Zarkili.

Role context:
- User role: salon owner/manager
- Primary goal: control bookings, staff schedules, services, pricing, and business performance
- Multi-location context: owner can manage one or more locations, each with location-specific settings

Create these screens:
1. Dashboard overview
   - KPIs: bookings today, occupancy, revenue, no-show rate
2. Calendar and capacity management
   - day/week views, slot blocking, overbooking controls
   - location selector (single location or all locations view)
3. Staff schedule editor
   - shift assignment, breaks, leave blocks
   - staff assigned to one or multiple locations with conflict warnings
4. Service catalog + pricing management
   - service list, duration, price, availability rules
   - location-level overrides for price/duration/availability
5. Promotions/referrals control
   - campaign status, referral reward toggles, eligibility rules
6. Message templates + automations
   - confirmation/reminder/cancellation templates

Required states:
- loading (analytics fetch)
- empty (no historical data)
- error (save failure)
- no-access (manager-level permission required)

Output:
- responsive frames (desktop + tablet)
- component set for KPI card, schedule row, service form, policy toggle
- validation notes for destructive actions (confirm dialogs)
```

### Prompt C: Multi-Tenant Admin Controls (Platform Operations)
Copy/paste into Figma AI:

```text
Create a platform admin flow for multi-tenant operations in Zarkili.

Role context:
- User role: platform-level admin (not salon staff)
- Primary goal: manage tenants, plans, feature flags, compliance, and support escalations

Create these screens:
1. Tenant directory
   - search/filter by status, plan, region
2. Tenant detail
   - subscription status, active users, integration health, issue log
   - location count, location health summary, and staffing capacity overview
3. Feature flag + entitlement controls
   - per-tenant toggles (messaging, referrals, waitlist, attachments, localization)
4. Billing and plan management view
   - plan assignment, trial status, payment health indicators
5. Access and role policy editor
   - role matrix for staff/manager/admin with granular permissions
   - location-scoped permissions (which staff can access which location)
6. Audit log and incident response panel
   - timeline of admin actions, export, rollback checkpoints

Required states:
- loading (tenant data fetch)
- empty (no matching tenants)
- error (policy update failed)
- no-access (super-admin only)

Output:
- responsive admin frames with dense but scannable data tables
- components for permission matrix, feature toggle row, audit event item
- safety UX notes (confirmations, rollback, irreversible action warnings)
- explicit notes for cross-location transfers and staffing conflict handling
```

### Suggested execution order (staff/admin)
1. Staff app daily operations (highest operational impact)
2. Owner/admin dashboard controls
3. Platform multi-tenant controls

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

## 6B) Copilot Implementation Prompt Pack (Matches Feature Expansion)
Goal: implement each advanced feature slice after its Figma version passes QA.

How to use:
1. Pick one feature slice from Section 4B.
2. Ensure Figma QA is PASS or PASS WITH FIXES (and fixes are done).
3. Paste the matching prompt below into Copilot Chat.
4. Implement one slice at a time and run tests before moving on.

### Global constraints for all prompts below
- Preserve all existing business logic and Firebase contracts.
- Reuse providers/hooks already present in the app.
- Use token-only styling (no hardcoded color/spacing values).
- Add loading, empty, error, and no-access states when relevant.
- Add accessibility labels and keep touch targets >= 44pt.
- Add/extend tests for new UI primitives and screens.

### Prompt A: Waiting List (Code Implementation)
```text
Implement the approved Waiting List UI slice for Zarkili in React Native Expo + TypeScript.

Scope:
- Fully booked service detail variant with primary CTA "Join Waiting List"
- Waiting list form bottom sheet (date range, time range, optional staff, optional notes)
- Waiting list confirmation screen/state
- Waiting list section in bookings with status chips (active, matched, expired, cancelled)
- Slot matched modal with hold timer and CTA "Book Now"

Technical requirements:
- Reuse existing booking-related hooks/providers.
- Do not introduce new Firebase calls unless they already exist in current logic layers.
- Build reusable UI primitives if missing:
   - WaitingListStatusChip
   - HoldTimerBanner
   - WaitingListFormSheet
- Add states:
   - loading (submission/join)
   - empty (no waiting list items)
   - error (submit failed/network)
   - no-access (not signed in)

Output:
- Modified file list
- New component list
- Test coverage summary
- Open TODOs for backend/product decisions
```

### Prompt B: Messaging (Code Implementation)
```text
Implement the approved Messaging UI slice for Zarkili in React Native Expo + TypeScript.

Scope:
- Messages inbox (thread list, unread badge, last message preview)
- Conversation thread (sent/received bubbles, timestamps, retry on failed send)
- Booking-linked "Message Salon" entry point
- Quick reply templates bottom sheet
- Message notification preferences screen (push/email/mute)

Technical requirements:
- Reuse existing auth/tenant context for thread scoping.
- Keep implementation UI-layer focused; no protocol redesign.
- Build reusable UI primitives if missing:
   - MessageBubble
   - UnreadBadge
   - ThreadListItem
   - QuickReplySheet
- Add states:
   - loading (thread/inbox)
   - empty (no conversations)
   - error (send failed with retry)
   - no-access (messaging disabled by tenant)

Output:
- Modified file list
- New component list
- Test coverage summary
- Known integration assumptions
```

### Prompt C: Social Share (Code Implementation)
```text
Implement the approved Social Share UI slice for Zarkili in React Native Expo + TypeScript.

Scope:
- Share-enabled booking confirmation variant
- Share composer bottom sheet with preview + caption
- Share destination picker (Instagram Story, WhatsApp, Copy Link, More)
- Share success toast/modal
- Share privacy controls panel

Technical requirements:
- Reuse existing booking confirmation UI and data models.
- Keep share UX optional and non-blocking.
- Build reusable UI primitives if missing:
   - SharePreviewCard
   - ShareDestinationRow
   - PrivacyToggleRow
- Add states:
   - loading (preview generation)
   - empty (no preview available)
   - error (share intent failed)
   - no-access (media permission denied)

Output:
- Modified file list
- New component list
- Test coverage summary
- Any platform-specific TODOs (iOS/Android share differences)
```

### Prompt D: Referral Program (Code Implementation)
```text
Implement the approved Referral Program UI slice for Zarkili in React Native Expo + TypeScript.

Scope:
- Referral hub screen (code, invite CTA, progress)
- Invite friends sheet with message preview
- Referral status list (pending/joined/completed)
- Reward unlock screen
- Referral terms and eligibility screen

Technical requirements:
- Reuse existing loyalty/rewards context where possible.
- Keep scan clarity high (users should understand referral status quickly).
- Build reusable UI primitives if missing:
   - ReferralStatusRow
   - RewardBadge
   - InviteSheet
- Add states:
   - loading (status fetch)
   - empty (no referrals)
   - error (invalid code/fetch fail)
   - no-access (feature disabled by tenant/region)

Output:
- Modified file list
- New component list
- Test coverage summary
- Product-rule TODOs requiring owner confirmation
```

### Prompt E: Language Switcher (Code Implementation)
```text
Implement the approved Language Switcher and Localization UI slice for Zarkili in React Native Expo + TypeScript.

Scope:
- Language settings screen (current language + list/search)
- Quick language switch entry from settings/profile
- Apply language confirmation modal
- Localized booking summary variant (date/time/currency formatting)
- Missing translation fallback notice/state

Technical requirements:
- Reuse existing LanguageProvider and localization setup.
- Preserve layout quality for long translated strings.
- Build reusable UI primitives if missing:
   - LanguageOptionRow
   - LanguageApplyModal
   - TranslationFallbackBanner
- Add states:
   - loading (language change in progress)
   - empty (no additional packs)
   - error (switch failed)
   - no-access (language locked by tenant policy)

Output:
- Modified file list
- New component list
- Test coverage summary
- Localization edge-case notes (long text and RTL readiness)
```

### Prompt F: Booking Image Attachments (Code Implementation)
```text
Implement the approved Booking Image Attachments UI slice for Zarkili in React Native Expo + TypeScript.

Scope:
- Booking detail variant with "Add reference images"
- Image source picker (camera/library/files)
- Attachment preview grid with remove/replace
- Permission prompt state
- Upload progress and completion states

Technical requirements:
- Reuse existing booking flow and form state patterns.
- Keep privacy copy visible and clear.
- Build reusable UI primitives if missing:
   - AttachmentTile
   - UploadProgressRow
   - FileValidationMessage
- Add states:
   - loading (upload in progress)
   - empty (no attachments)
   - error (size/type/upload failure)
   - no-access (permission denied)

Output:
- Modified file list
- New component list
- Test coverage summary
- Validation rules summary (file types/sizes) and any unresolved backend assumptions
```

### Recommended implementation order
1. Waiting List + Booking Image Attachments
2. Messaging
3. Referral + Social Share
4. Language Switcher

---

## 6C) Copilot Implementation Prompt Pack (Staff/Admin + Multi-Tenant)
Goal: implement non-client operations UX slices after Section 4C Figma flows pass QA.

How to use:
1. Start from approved staff/admin Figma frames in Section 4C.
2. Paste one prompt at a time into Copilot Chat.
3. Implement role-by-role (staff first, then owner/admin, then platform admin).
4. Run tests and acceptance checks before moving to next role.

### Global constraints for staff/admin implementation
- Reuse existing providers and role context; do not change core auth model.
- Preserve existing business logic and Firebase contracts.
- Use token-only styling and existing shared UI primitives where possible.
- Add explicit permission handling for restricted actions.
- Include loading, empty, error, and no-access states for each screen.
- Add accessibility labels and keep interactive targets >= 44pt.
- Enforce location scoping for all staff and schedule operations.

### Prompt A: Staff App Operations (Code Implementation)
```text
Implement the approved Staff Operations UI slice for Zarkili in React Native Expo + TypeScript.

Scope:
- Staff home agenda (today timeline, alerts, quick actions)
- Appointment detail (staff view with notes, attachments, status actions)
- Check-in/check-out status flow (arrived, in-service, completed, no-show)
- Waitlist management panel and one-tap match UI
- Staff-to-client message screen with quick templates

Technical requirements:
- Reuse existing booking and user context providers.
- Enforce role permissions for staff actions (front desk vs stylist if applicable).
- Build reusable UI primitives if missing:
   - AppointmentStatusBadge
   - AgendaTimelineItem
   - QuickActionBar
   - WaitlistMatchCard
- Add states:
   - loading (agenda sync)
   - empty (no appointments)
   - error (update failed)
   - no-access (permission denied)

Output:
- Modified file list
- New components introduced
- Test coverage summary
- Role-assumption TODO list
```

### Prompt B: Salon Owner/Admin Dashboard (Code Implementation)
```text
Implement the approved Salon Owner/Admin Dashboard UI slice for Zarkili in React Native/web-compatible TypeScript views.

Scope:
- KPI overview cards (bookings, occupancy, revenue, no-show)
- Calendar/capacity management screens
- Staff schedule editor
- Service catalog + pricing management
- Promotion/referral controls
- Message template and automation settings
- Multi-location selector and location-specific operational settings

Technical requirements:
- Reuse existing tenant and auth context for owner-level scope.
- Do not add new backend endpoints in this pass; consume existing contracts only.
- Respect per-location rules for hours, capacity, and service availability.
- Build reusable UI primitives if missing:
   - KpiCard
   - CapacityRuleRow
   - ScheduleEditorRow
   - ServicePolicyForm
   - AutomationTemplateCard
   - LocationSwitcher
   - StaffLocationAssignmentRow
- Add states:
   - loading (dashboard data)
   - empty (no historical data)
   - error (save/fetch failure)
   - no-access (requires owner/manager role)

Output:
- Modified file list
- New components introduced
- Test coverage summary
- Open product/backoffice rule TODOs
```

### Prompt C: Platform Multi-Tenant Admin (Code Implementation)
```text
Implement the approved Platform Multi-Tenant Admin UI slice for Zarkili in TypeScript admin views.

Scope:
- Tenant directory and tenant detail views
- Feature flag/entitlement controls per tenant
- Billing/plan status management screens
- Role policy matrix editor
- Audit log and incident response timeline
- Tenant-level location management overview (locations, staffing, capacity signals)

Technical requirements:
- Keep platform admin permissions strict and explicit.
- Preserve all tenancy boundaries and do not bypass tenant scoping rules.
- Implement location-scoped permission views for users with access to subsets of locations.
- Build reusable UI primitives if missing:
   - TenantStatusPill
   - FeatureFlagRow
   - PermissionMatrixTable
   - AuditEventRow
   - IncidentActionPanel
   - LocationHealthBadge
   - TenantLocationSummaryCard
- Add states:
   - loading (tenant query)
   - empty (no matching tenants)
   - error (policy update failed)
   - no-access (super-admin only)

Output:
- Modified file list
- New components introduced
- Test coverage summary
- Security/permission assumptions and unresolved TODOs
```

### Recommended role implementation order
1. Staff operations
2. Owner/admin dashboard
3. Platform multi-tenant admin controls

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
