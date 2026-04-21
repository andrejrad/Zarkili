# Validation Cycle: Slice 1 Onboarding (Mock Data)
**Date:** April 20, 2026  
**Scope:** Onboarding journey only (Steps 1-4 validation)  
**Status:** Mock data — demonstrates full prompt integration  

This document shows what happens when real Step 1/2/3 outputs feed into the updated Step 4 Figma prompt.

---

## STEP 1 OUTPUT: GPT UX Direction (Onboarding Slice Only)
*Simulated output from GPT-5.3-Codex prompt, Task 1-5 subset*

### 6 UX Principles for Zarkili
1. **Trust-at-first-tap** — Every action a user takes should feel deliberate and safe, never rushed or tricky. Gen-Z users distrust dark patterns; we reward clarity.
   - Do: Show exactly what will happen next before asking for permission.
   - Don't: Use urgency language ("Only 2 slots left today!") to force decisions.

2. **Progressive transparency** — Reveal complexity only when the user needs it; start simple. Navigation should feel lightweight until expertise is required.
   - Do: One preference choice per screen, not a form that asks 7 things at once.
   - Don't: Onboarding forms that ask for phone, email, service preferences, and payment in one view.

3. **Authentic visual personality** — The app should feel human and intentional, not generic tech. Gen-Z can smell inauthenticity and will leave.
   - Do: Use specific language from salon culture ("I love gel" not "services preference").
   - Don't: Use stock photography of smiling people in generic spas.

4. **Control continuity** — Users should always know how to undo, go back, or change their mind. Friction should come from decision, not navigation.
   - Do: Always show a "back" option and confirm destructive actions.
   - Don't: Hide settings or make onboarded users re-enter basic info each session.

5. **Speed as respect** — Loading states and feedback should be instant or feel instant. Poor feedback makes apps feel broken.
   - Do: Show skeleton loaders that match real content shape; use 150-250ms animations.
   - Don't: Keep spinners spinning for more than 3 seconds without messaging.

6. **Accessibility-first, not bolted-on** — Accessible design is faster and clearer for everyone. It should be baked in from frame 1.
   - Do: 44pt minimum touch targets, WCAG AA contrast, labels on icons.
   - Don't: Assume color alone conveys meaning; always use text + icon + color.

### Onboarding Journey Spec (Happy Path + Edge Cases)

**Goal:** A new client opens Zarkili for the first time and completes their first booking within the same session.

**Happy Path (8 steps):**
1. User opens app → Welcome screen with logo, tagline, and two CTAs (Sign In / Sign Up)
2. User taps Sign Up → enters phone number → receives SMS OTP
3. OTP verified → Location permission request screen with "Find salons near you" value statement
4. Location granted → Service preference chip selection (Nails / Hair / Skin / Makeup / Waxing)
5. Service selected → Home screen showing nearby salons filtered to selected service
6. User taps salon card → Service detail screen (service name, price, duration, staff, availability)
7. User taps "Book" → Date/Time calendar picker
8. Time slot selected → Booking confirmation screen with "Add to Calendar" CTA

**Edge Case 1: User denies location permission**
- Show "Location permission declined" empty state on Home
- Provide manual salon search via postcode entry
- Allow user to enable location anytime via settings

**Edge Case 2: No salons match user's service preference**
- Show empty state: "No salons nearby offer [service]. Try another?" with chip toggle back
- Suggest nearest salons even if service not exact match

**Edge Case 3: User signs in instead of signing up**
- If returning user with prior bookings, skip to Home immediately
- If new account flag, prompt with onboarding screens (location, service preference)

**Friction risks & mitigation:**
- Risk: Users abandon after OTP entry if SMS is slow. Mitigation: Show "Sent! Check your phone" and allow resend after 30s.
- Risk: Permission request feels pushy. Mitigation: Lead with value ("Find salons in your area") not the permission ask itself.

### Component Inventory (Onboarding Slice)

| Component | Variants | Required States |
| --- | --- | --- |
| PrimaryButton | Large (52px), Small (44px) | default, pressed, disabled, loading |
| SecondaryButton | Outline, Ghost | default, pressed, disabled |
| Chip | Selected/unselected, large/small | selected, unselected, disabled, loading |
| TextInput | Phone, OTP, Postcode | default, focused, error, disabled, loading |
| EmptyState | No results, No location, No history | (N/A: single state) |
| LoadingSkeleton | Avatar, Card, Text line | animated shimmer |
| Toast | Success, Error, Info | auto-dismiss after 3s |
| PermissionPrompt | Location, SMS notification | with explanation and CTA |

### Open Decisions (Flagged for Product Owner)
- Should onboarding ask for preferred stylist/barber, or only on second booking?
- What's the max number of service preference chips shown? (5, 7, 10?)
- Should we show sign-up vs sign-in option, or auto-detect returning users?

---

## STEP 2 OUTPUT: Perplexity Research
*Simulated output from Perplexity Gen-Z Design Intelligence Research, Onboarding-focused*

### 12 Gen-Z Onboarding Patterns (Evidence-Based)

1. **Verification for trust, not friction**
   - Pattern: OTP via SMS/email seen as safety measure, not annoying gate
   - Why Gen-Z likes it: "Proves it's really me, not some bot stealing my account"
   - Example: Revolut app uses instant OTP push for onboarding
   - Risk: If SMS is slow (>5s), perceived as app being broken

2. **Value-first permissions**
   - Pattern: Explain *why* you need location/contacts before asking
   - Why Gen-Z likes it: "They're being honest about what they need from me"
   - Example: Lemon8 shows "Discover creators near you" before location ask
   - Risk: Too much text = abandonment; keep to one sentence

3. **Preference chips over forms**
   - Pattern: Tap to select, visual feedback, max 6 options per screen
   - Why Gen-Z likes it: "I can see all my choices at once and feel in control"
   - Example: BeReal onboarding uses chip selection for interests
   - Risk: Too many chips (>8) causes choice paralysis; use "See more" if needed

4. **Empty state as continuation, not failure**
   - Pattern: "No results" screens are part of the flow, not errors
   - Why Gen-Z likes it: "It's honest; they're not hiding that there's nothing here"
   - Example: Depop app shows "No items match your search" with helpful alternatives
   - Risk: Don't make empty state feel like the app is broken

5. **Skeleton loading state matching real content**
   - Pattern: Gray placeholder shapes exactly match the layout of real content
   - Why Gen-Z likes it: "I can already see what's coming; feels fast even if it's slow"
   - Example: Instagram Stories use skeleton cards while loading
   - Risk: If skeleton and real content don't match layout, feels janky

6. **Progressive onboarding (spread across sessions)**
   - Pattern: Core preferences this session, additional personalization after first action
   - Why Gen-Z likes it: "I can use the app immediately without answering a survey"
   - Example: Spotify onboarding: pick 3 genres session 1, refined after listening
   - Risk: Users might assume app features don't exist if not shown in onboarding

7. **Visible "go back" option always available**
   - Pattern: Back arrow/button visible from screen 2 onward; never trap users
   - Why Gen-Z likes it: "If I mess up, I'm not stuck. Control is mine."
   - Example: All modern apps show back option; deviation is jarring
   - Risk: None if implemented consistently

8. **Celebration micro-interactions after each step**
   - Pattern: Subtle bounce, color shift, or progress ring increment when user completes a step
   - Why Gen-Z likes it: "The app is acknowledging I did something right"
   - Example: Duolingo screen transitions have celebratory animations
   - Risk: Over-animation feels childish (use 150-250ms animations, not 500ms+)

9. **Real images of real salons, not stock photos**
   - Pattern: Use actual salon photos from the salon's social media or UGC
   - Why Gen-Z likes it: "I can tell if this place is legit or a scam immediately"
   - Example: Airbnb uses actual host photos, not generic travel photos
   - Risk: Poor-quality or outdated photos hurt trust more than no photo

10. **One primary action per screen, always clear**
    - Pattern: One obvious CTA button, secondary actions smaller or in bottom sheet
    - Why Gen-Z likes it: "I know what I'm supposed to do next"
    - Example: Stripe onboarding has one large blue button per screen
    - Risk: Ambiguous CTAs cause users to leave

11. **Copy that sounds human, not corporate**
    - Pattern: Casual language, culturally aware phrasing, no buzzwords
    - Why Gen-Z likes it: "This app gets me; it's not trying too hard"
    - Example: Duolingo's copy is cheeky (cf. generic "Please verify your account")
    - Risk: Trying too hard to be cool backfires (avoid slang that will be dated in 6 months)

12. **Feedback loops that explain what happens next**
    - Pattern: After user does something, show toast/modal explaining result
    - Why Gen-Z likes it: "No ambiguity. I know if it worked or what went wrong."
    - Example: "Booking confirmed! Check your email for details" not just ✓
    - Risk: Too many notifications feel spammy; limit to critical info

### Trends to Avoid for Gen-Z in 2026

1. **Dark pattern urgency banners** ("Only 2 slots left! Book now!") — feels manipulative
2. **Cluttered onboarding forms** (asking 7 fields at once) — abandonment spike
3. **Excessive push notifications during onboarding** — installs get deleted immediately
4. **Fake social proof** ("5,000+ bookings this week") — Gen-Z verifies; lies get called out
5. **Difficult undo or "go back"** — trust destroyed if user can't change their mind
6. **Stock photos of generic "beauty"** — screams inauthentic/scammy
7. **Loading screens >3s without messaging** — app feels broken
8. **Required account creation before app preview** — users bounce immediately

### Do/Don't Comparison Table (Onboarding-Specific)

| Area | Do This | Don't Do This | Why |
| --- | --- | --- | --- |
| Permission ask | "Find salons near you — we need your location" | "Enable location" button with no context | Context makes it feel like a choice, not a demand |
| OTP entry | Show "Sent! Check your phone" + resend button after 30s | Silent spinner | Transparency reduces anxiety |
| Service selection | Show chip grid; "See more" if >6 options | Dropdown menu | Chips feel faster and more visual to Gen-Z |
| Loading state | Gray skeleton cards matching real card layout | Generic spinner | Skeleton makes app feel fast; spinner makes it feel broken |
| Next step CTA | Large button with clear label "Find Salons Near Me" | Small gray button labeled "Continue" | Specificity reduces cognitive load |
| Empty state | "No salons offer [service]. Try another?" with chip toggle | "0 results" | Offers a path forward, not a dead end |
| Copy tone | "Looks like that time's booked. Try 5pm?" | "Time slot unavailable. Please select another time." | Casual, not corporate |
| Back option | Visible back arrow on all screens after welcome | Hidden back in left edge or non-existent | Visible back = user feels in control |
| Error message | "SMS didn't arrive. Want to try email instead?" | "Error 401: OTP verification failed" | First helps user solve it; second is useless |
| Success feedback | Toast: "Preferences saved!" + progress step highlight | Silent success; no visible confirmation | Users need proof their action worked |

---

## STEP 3 OUTPUT: Route Selection & Decision

**Route Selected:** Route A — Elevated Soft Minimal

**Decision Log:**
- Selected route: Route A — Elevated Soft Minimal
- Runner-up route: Route C — Warm Neo-Brutalist Soft (tied on Brand Distinctiveness)
- Why selected:
  - Highest Gen-Z resonance (4.5/5): feels spa-like, premium, not childish
  - Booking clarity perfect (5/5): mocha brown CTA buttons dominate every screen
  - Strong distinctiveness (4/5): warm palette stands out vs. typical blue booking apps
- Risks accepted: Requires consistent use of custom terracotta/dusty rose palette across salons (not negotiable)
- Token implications: Base palette frozen (no custom salon-specific colors until Phase 2)
- Effective date: Weeks 1-4 locked to Route A + frozen tokens

**Color Palette (Hex Values):**
- Warm off-white: #FAF7F4
- Deep mocha (primary): #2C1810
- Dusty rose (accent): #D4A5A0
- Champagne gold (highlights): #D4A96A
- System text: #1A1208

**Typography:**
- Display: Playfair Display, 600-700 weight (headings)
- Body: Inter, 400-500 weight, 15pt base

**Mood:** Calm confidence, spa-like but modern; female-forward luxury without pretension

---

## PRE-FIGMA CHECKLIST (COMPLETED WITH MOCK DATA)

### ✅ Step 1 Outputs Gathered
- [x] **6 UX Principles**: Trust-at-first-tap, Progressive transparency, Authentic visual personality, Control continuity, Speed as respect, Accessibility-first
- [x] **IA Map**: Onboarding path (Welcome → Permission → Preference → Home)
- [x] **Journey Specs**: Happy path 8 steps + 3 edge cases + 2 friction mitigations, full component inventory
- [x] **Component Inventory**: PrimaryButton, Chip, TextInput, EmptyState, LoadingSkeleton, Toast, PermissionPrompt
- [x] **Open Decisions**: Stylist pref timing, chip grid size, sign-up/sign-in auto-detect

### ✅ Step 2 Outputs Gathered
- [x] **12 Patterns**: Value-first permissions, Preference chips, Progressive onboarding, Celebration animations, Real images, Feedback loops, etc.
- [x] **8 Trends to Avoid**: Dark patterns, Cluttered forms, Fake social proof, Stock photos, Silent loaders
- [x] **Interaction Pattern Recommendations** (Onboarding): Max 5 taps per step, clear primary action, visible back option, SMS feedback loop
- [x] **Do/Don't Table**: 10 rows covering Permission asks, OTP entry, Service selection, Loading, Empty states, Copy tone, Error messages, Success feedback

### ✅ Step 3 Outputs Gathered
- [x] **Selected Route**: Route A — Elevated Soft Minimal
- [x] **Color Palette**: Off-white #FAF7F4, Mocha #2C1810, Dusty Rose #D4A5A0, Gold #D4A96A, Text #1A1208
- [x] **Typography**: Playfair Display (headings, 600-700), Inter (body, 400-500, 15pt)
- [x] **Mood**: Calm confidence, spa-like modern, female-forward luxury

---

## STEP 4: FIGMA PROMPT (FILLED-IN, READY TO PASTE)

**This is what you paste into Figma AI "Make Designs" feature after completing Pre-Figma Checklist:**

```
Create a complete mobile app flow for Zarkili, a Gen-Z beauty booking app.

=== VISUAL DIRECTION (from Step 3: Route Selection) ===
Selected visual route: Route A — Elevated Soft Minimal
Color palette and hex values:
- Warm off-white base: #FAF7F4
- Deep mocha (primary CTA): #2C1810
- Dusty rose (accent): #D4A5A0
- Champagne gold (highlights): #D4A96A
- System text: #1A1208

Typography approach:
- Display headings: Playfair Display, weights 600-700
- Body text: Inter, weights 400-500, base 15pt

Visual mood and feel:
Calm confidence, spa-like but modern; female-forward luxury without pretension. Every screen should feel intentional and premium, never rushed.

Illustration style:
Thin-line minimalist beauty icons (salon tools, services), no gradients, no heavy textures. Icons should feel refined and simple.

Do NOT use (from Route Selection avoid list):
- Purple colors or dark mode
- Harsh contrast or busy backgrounds
- Generic tech blue or corporate styling
- Heavy drop shadows or complex textures

=== UX PRINCIPLES TO ENFORCE (from Step 1: GPT UX Direction) ===
Every screen must adhere to these 6 Gen-Z UX principles. Validate visual hierarchy against each.

1. **Trust-at-first-tap** — Every action should feel deliberate and safe, never rushed or tricky. Show exactly what will happen next before asking for permission. Don't use urgency language.

2. **Progressive transparency** — Reveal complexity only when the user needs it; start simple. Use one preference choice per screen, not forms asking 7 things at once.

3. **Authentic visual personality** — The app should feel human and intentional, not generic tech. Use specific language and real imagery, not stock photography.

4. **Control continuity** — Users should always know how to undo, go back, or change their mind. Always show back option and confirm destructive actions.

5. **Speed as respect** — Loading states should be instant or feel instant. Show skeleton loaders matching real content shape; use 150-250ms animations.

6. **Accessibility-first, not bolted-on** — 44pt minimum touch targets, WCAG AA contrast, labels on icons. Never use color alone to convey meaning.

=== INFORMATION ARCHITECTURE (from Step 1: GPT Output) ===
Navigation structure for Onboarding Slice:
- Welcome screen: Logo, tagline, Sign In and Sign Up CTAs
- Onboarding screen 1: Location permission request with "Find salons near you" value statement
- Onboarding screen 2: Service preference chip selection (Nails / Hair / Skin / Makeup / Waxing)
- Home screen: Personalized greeting, nearby salons filtered to service preference, upcoming booking card

=== INTERACTION PATTERNS (from Step 2: Perplexity Research) ===
Apply these evidence-based patterns to the corresponding flows:

Onboarding pattern rules (from Step 2 research):
- Use OTP verification for trust, not friction; show "Sent! Check your phone" + resend button after 30s (proven Gen-Z pattern)
- Ask for location by value first: "Find salons near you — we need your location" (not "Enable location button")
- Service selection via chip grid (max 6 visible); use "See more" if additional options needed. Never use dropdown.
- After each step, show celebration micro-interaction: subtle bounce or progress ring increment (duration 150-250ms, no more)
- Always make back option visible. Progressive onboarding: core preferences this session, additional personalization after first booking.
- Use real salon images from their social media, not stock photos. Copy tone: casual and human, not corporate.

Target: First meaningful completion in <= 5 taps

=== DO THIS / DON'T DO THIS (from Step 2: Research Comparison Table) ===
Design guide — reference this constantly:

| Area | Do This | Don't Do This | Why |
| --- | --- | --- | --- |
| Permission ask | "Find salons near you — we need your location" | "Enable location" button with no context | Context makes it feel like a choice |
| OTP entry | Show "Sent! Check your phone" + resend after 30s | Silent spinner | Transparency reduces anxiety |
| Service selection | Show chip grid; "See more" if >6 options | Dropdown menu | Chips feel faster and more visual |
| Loading state | Gray skeleton cards matching real card layout | Generic spinner | Skeleton makes app feel fast |
| Next step CTA | Large button "Find Salons Near Me" | Small gray button "Continue" | Specificity reduces cognitive load |
| Empty state | "No salons offer [service]. Try another?" | "0 results" | Offers a path forward |
| Copy tone | "Looks like that time's booked. Try 5pm?" | "Error 401: OTP verification failed" | Casual, not corporate |
| Back option | Visible back arrow on all screens after welcome | Hidden back in left edge | Visible back = user feels in control |
| Error message | "SMS didn't arrive. Want to try email instead?" | "Error 401: OTP verification failed" | Helps user solve it |
| Success feedback | Toast: "Preferences saved!" + progress highlight | Silent success; no confirmation | Users need proof |

=== COMPONENT INVENTORY REQUIRED (from Step 1: Component List) ===
Build these components on a dedicated Components page with all variants:
- PrimaryButton: Large (52px) and Small (44px); states: default, pressed, disabled, loading
- SecondaryButton: Outline and Ghost variants; states: default, pressed, disabled
- Chip: Selected/unselected, large/small; states: selected, unselected, disabled, loading
- TextInput: Phone, OTP, Postcode variants; states: default, focused, error, disabled, loading
- EmptyState: No results, No location, No history; single state
- LoadingSkeleton: Avatar, Card, Text line variants; animated shimmer effect
- Toast: Success, Error, Info types; auto-dismiss after 3s
- PermissionPrompt: Location, SMS notification types; with explanation and CTA

=== SCREENS TO BUILD (from Step 1: Journey Specs) ===
Create these screens in one Figma page called "v1-flow" (390x844 frame size):

1. Welcome screen — App logo, tagline "Book beauty services fast", two CTAs: "Sign In" (secondary) and "Sign Up" (primary mocha button)

2. Sign Up / Phone entry — TextInput for phone number with label "Your phone number", helper text "We'll send you a verification code", PrimaryButton "Send Code"

3. OTP entry — TextInput labeled "Enter code", helper text "Check your SMS", Toast message "Sent! Resend available in 30s", PrimaryButton "Verify"

4. Location permission request — PermissionPrompt with "Find salons near you" headline, explanation "We use your location to show available salons", mocha PrimaryButton "Allow Location", secondary "Skip for now"

5. Service preference selection — Headline "What services are you interested in?", horizontally scrolling Chip grid (Nails / Hair / Skin / Makeup / Waxing / See more button), PrimaryButton "Next" (disabled until one selected)

6. Home screen — Personalized greeting "Hi, [name]!", featured salon cards (image, name, distance, rating), bottom sheet tab bar (Home / Search / Bookings / Profile)

=== STATE COVERAGE (Required for each screen) ===
For each screen, generate:
- Default state (happy path)
- Loading skeleton state (OTP entry, Permission request, Home cards loading)
- Empty state (no salons match service preference)
- Error state (OTP entry failed; SMS not received)
- No-access state (location permission denied; show manual search fallback)

=== DESIGN SYSTEM RULES (Non-negotiable) ===
- Spacing: 4pt base grid; use 8, 12, 16, 24, 32, 40, 48
- Border radius: 12px cards, 100px pills, 8px inputs
- Touch targets: minimum 44x44pt for all interactive elements
- Contrast: minimum WCAG AA on all text (no exceptions)
- Colors: use exact hex values from selected palette; no custom colors
- Typography: use Playfair Display (headings) and Inter (body) from selected route
- One primary CTA button per screen (mocha #2C1810), visually dominant, 52px height
- Secondary actions de-emphasized (smaller, outline style, or placed in bottom sheet)
- All components must have: default, pressed/active, disabled, and loading variants
- All icon-only buttons must have accompanying labels (for accessibility)

=== OPEN DECISIONS (Flagged, Not Finalized) ===
Do not finalize these until product owner signs off. Mark these in Figma comments as "AWAITING PRODUCT REVIEW":
- Should onboarding ask for preferred stylist/barber, or only on second booking?
- What's the max number of service preference chips shown? (5, 7, 10?)
- Should we show sign-up vs sign-in option, or auto-detect returning users?

Platform: iOS mobile, 390x844 frame.
Generate all frames with the constraints above. Output must be implementation-ready, token-based, and reusable.
```

---

## Key Integration Points Validated

✅ **Step 1 → Step 4:** All 6 UX principles now appear as design constraints in the Figma prompt  
✅ **Step 2 → Step 4:** Research patterns (chips, skeletons, progressive, celebrations, real images) now embedded as specific interaction rules  
✅ **Step 3 → Step 4:** Exact color hex values and typography from selected route now substitute into token constraints  
✅ **Component inventory:** Mapped from Step 1 component list to Figma components page  
✅ **Journey mapping:** Onboarding happy path (8 steps, ≤5 taps) becomes exact screen sequence in Figma  
✅ **Do/Don't table:** Now serves as visual checklist during Figma generation (e.g., "Permission ask: use value-first copy")  
✅ **Open decisions:** Flagged in Figma as "[AWAITING PRODUCT REVIEW]" comments, not baked into screens  

---

## Ready for Next Step
This completed prompt is now ready to paste into Figma AI and generate the first 6 onboarding screens with all UX constraints enforced.

Estimated time: 30-60 minutes for Figma AI to generate initial screens.

