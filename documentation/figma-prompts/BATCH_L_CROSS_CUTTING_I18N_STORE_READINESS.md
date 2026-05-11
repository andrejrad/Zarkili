# Batch L — Cross-Cutting Platform, i18n, Store Readiness & Marketing

> Wave 4. Design starts **W45**, full delivery by **W47**, consumed by **Phase 3.5 (W47–W51)**.
> Design mode: **`figma`** — brand surfaces, novel extension patterns, store assets. Full Figma pass required.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Topics: Force-update gate · Maintenance mode · Offline state + offline-aware list/detail patterns · Server-error fallbacks (500 / 503 / network) · Feature-flag-disabled inline state · Deep-link cold-start + universal-link mismatch · Permission-denied recovery (6 permissions) · First-run coach-mark tour · What's new sheet · Rate-the-app prompt · Language & locale picker · RTL layout examples · Web responsive breakpoints (390 / 768 / 1280) · iOS Live Activities (Dynamic Island + Lock Screen) · Android home-screen widget · App Clip card · App Store + Play Store screenshot frames · Marketing copy spec.

New components: `full-screen-gate-template`, `permission-recovery-card`, `locale-picker`, `coach-mark-popover`, `store-screenshot-frame`.

> **After Batch L, Figma is closed for the program.** All remaining Phase 4 surfaces build `code-only` from the locked design system.

---

## SCREEN — L.1 Force-Update Gate

```text
SCREEN: Update Required    DEVICE: iPhone 14 390×844 (full-screen blocking, no nav bar, no tab bar)
LAYOUT (full-screen-gate-template)
  Background: Cream Silk #F2EDDD.
  Hero illustration: centered, 200 × 200, app-icon-derived graphic (lock + chevron-up motif).
  Heading-2: "Update Required" — centered, weight 600, #1A1A1A.
  Body: "A new version of Zarkili is available. Please update to continue." — centered, muted #6B6B6B, max-width 280.
  Primary CTA: "Open App Store" (or "Open Google Play" — duplicate frame) — full-width minus 32px margin, radius medium 12, Coral Blossom #E3A9A0, label weight 600.
  No dismiss path. No back gesture.
  Padding top: safe-area-inset + 80. Padding bottom: safe-area-inset + 32. Gap between elements: 24.
STATES
  default — as above.
  downloading-hint — subtitle under CTA: "Downloading… 12.4 MB" with inline progress bar (thin, 4px, Coral Blossom on #E5E0D1 track, width 240, indeterminate pulse).
```

## SCREEN — L.2 Maintenance Mode

```text
SCREEN: Maintenance    DEVICE: iPhone 14 (full-screen blocking, no tab bar)
LAYOUT (full-screen-gate-template)
  Background: Cream Silk #F2EDDD.
  Hero illustration: wrench + clock motif, 180 × 180.
  Heading-2: "We'll be right back" — centered, weight 600.
  Body (with-ETA state): "Zarkili is undergoing scheduled maintenance. We'll be back on [Day], [Month DD] at [HH:MM AM/PM TZ]." (US date/time format). Max-width 300.
  Body (indefinite state): "Zarkili is undergoing maintenance. We'll be back shortly."
  Status page link: "Check status.zarkili.com" — label-small, Coral Blossom, underline, tap opens in-app browser.
  Retry CTA: tertiary text button "Try again" — weight 500, #6B6B6B.
  Gap: 24 between each element. Padding top: safe-area + 80.
STATES
  default — heading + body-indefinite + retry.
  with-ETA — heading + body-with-ETA + status link + retry.
  indefinite — same as default, no ETA line.
```

## SCREEN — L.3 Offline State + Patterns

```text
SCREEN: Offline    DEVICE: iPhone 14 + iPad 768×1024 (2 frames)
LAYOUT — three sub-frames:
  L.3.1 — Sticky offline banner (component extraction)
    Height 44, background #1A1A1A, icon wifi-off 16 white, label body-small "You're offline" white, trailing chip "Reconnecting…" if reconnecting state.
    Position: stacks immediately below status bar / Dynamic Island; pushes content down.
  L.3.2 — Cached list view (iPhone, Home screen with banner applied)
    Banner at top.
    Content renders normally but with staleness overlay: semi-transparent warm oat #D1BFB3 30% overlay over each card that requires live data.
    Timestamp below banner: label-small muted "Last updated MM/DD/YYYY h:mm AM/PM" + refresh icon.
    Network-required actions (e.g., "Book" CTA): disabled, opacity 40%, tooltip on long-press "Connect to use this feature".
  L.3.3 — Restored toast
    Snackbar bottom of screen: "Back online" + wifi-on icon + "Sync now" tertiary CTA. Background #1A1A1A white text. Radius full 9999.
STATES
  offline — L.3.1 banner + L.3.2 cached content.
  reconnecting — banner label becomes "Reconnecting…" with spinner.
  restored — L.3.3 snackbar appears, banner dismisses.
```

## SCREEN — L.4 Server-Error Fallback

```text
SCREEN: Error Fallback    DEVICE: iPhone 14
LAYOUT (full-screen-gate-template, also usable as inline empty-state card variant)
  Hero illustration: broken-link or cloud-x motif, 160 × 160.
  Heading-3: varies by state (see below).
  Body: muted #6B6B6B, max-width 280, centered.
  Reference ID: label-small muted mono font "Ref: XXXXXXXX" — for support lookup.
  CTA row: primary "Retry" (Coral Blossom) + tertiary "Report this" gap 12.
  Safe-area padding. Gap 24.
STATES
  500 — heading "Something went wrong", body "Our servers hit an unexpected error. This has been logged."
  503 — heading "Service Unavailable", body "We're temporarily over capacity. Please try again."
  network — heading "Can't reach Zarkili", body "Check your connection and try again." (no reference ID, no Report CTA).
```

## SCREEN — L.5 Feature-Flag-Disabled State

```text
SCREEN: Feature Disabled    DEVICE: iPhone 14
LAYOUT — two variants (both are inline states, not full-screen):
  L.5.1 — Full area replacement (e.g., entire tab content)
    Illustration 120 × 120 (lock + sparkle).
    Heading-3: "Coming soon" — centered, #1A1A1A.
    Body: "This feature is still in development." — muted, max-width 260.
    CTA row: tertiary "Notify me when it's ready" — Coral Blossom, weight 500.
  L.5.2 — Beta waitlist variant
    Pill badge at top: "BETA" background Mint Fresh #BBEDDA foreground Accent fg #2D4A42, label-small weight 600.
    Heading-3: "You're on the waitlist".
    Body: "We'll notify you when access opens."
    No CTA.
STATES
  disabled — L.5.1.
  beta-waitlist — L.5.2.
```

## SCREEN — L.6 Deep-Link Cold-Start + Universal-Link Mismatch

```text
SCREENS: L.6.1 Deep-Link Cold Start + L.6.2 Universal-Link Mismatch    DEVICE: iPhone 14
L.6.1 — Deep-Link Cold Start
  Full-screen splash. Background Cream Silk.
  Zarkili wordmark centered, 48 height.
  Below: body "Taking you to [destination label]…" — muted.
  Indeterminate progress bar: thin 4px, Coral Blossom on #E5E0D1, width 200, centered, pulsing.
  Safe-area padding top/bottom.
  STATES: routing (spinner), found (auto-dismisses to destination).

L.6.2 — Universal-Link Mismatch
  full-screen-gate-template.
  Illustration: compass-lost motif, 160 × 160.
  Heading-3: "We couldn't find that page".
  Body: "The link may be expired or the content was removed."
  Primary CTA: "Go to Home" — full-width minus 32 margin.
  Tertiary: "Go Back".
  STATES: mismatch (as above).
```

## SCREEN — L.7 Permission Denied Recovery (6 frames)

```text
DEVICE: iPhone 14 (bottom-sheet or inline card — produce both variants)
One permission-recovery-card frame per permission type:
  L.7.1 Camera       — icon: camera-alt Mint Fresh tinted
  L.7.2 Photo Library — icon: photo-library Mint Fresh tinted
  L.7.3 Contacts     — icon: contacts Mint Fresh tinted
  L.7.4 Calendar     — icon: event Mint Fresh tinted
  L.7.5 Notifications — icon: notifications Mint Fresh tinted
  L.7.6 Location      — icon: location-on Mint Fresh tinted

Each card:
  Radius 2xl 24. Background Surface #FFFFFF. Padding 24. Shadow large.
  Icon 48 × 48 in circle background Mint Fresh 20% #BBEDDA33.
  Heading-4: "[Permission Name] Access Needed" — weight 600.
  Body: one-sentence explanation of why the feature requires this permission.
  CTA primary: "Enable in Settings" — Coral Blossom, full-width, radius medium 12.
  CTA tertiary: "Not now" — label weight 500, muted, centered.
  Touch target each CTA ≥ 44 × 44.

STATES per card:
  denied — as above.
  granted-after-redirect — card dismissed; replaced with brief success toast "Camera enabled" with checkmark icon.
```

## SCREEN — L.8 First-Run Tour, What's New, Rate-the-App

```text
L.8.1 — First-Run Coach-Mark Tour    DEVICE: iPhone 14
  5 steps total. Each step is a coach-mark-popover anchored to a different UI element.
  Step 1: anchors to bottom search bar → "Discover salons near you".
  Step 2: anchors to Explore tab → "Browse styles from your city".
  Step 3: anchors to Booking CTA → "Book in under 60 seconds".
  Step 4: anchors to Loyalty tab → "Earn points with every visit".
  Step 5: anchors to Profile tab → "Manage your bookings and preferences".
  Backdrop: scrim rgba(0,0,0,0.5) with circular spotlight cutout (radius 32) around anchor, animated pulse ring.
  Produce: step1 through step5 frames + skip-at-any-step overlay.

L.8.2 — What's New Sheet    DEVICE: iPhone 14 (bottom-sheet, grabber, max-height 70vh)
  Header: "What's New in {version}" heading-3 weight 600 + version pill label-small Mint Fresh.
  Scrollable release notes list: each item = icon 24 (feature icon) + heading-4 feature name + body one-liner.
  Primary CTA: "Got it" fixed at bottom, full-width, Coral Blossom.
  STATES: default, scrolled (sticky header visible), acknowledged (sheet dismisses).

L.8.3 — Rate-the-App Prompt    DEVICE: iPhone 14 (bottom-sheet)
  Step 1 — sentiment: heading-3 "Enjoying Zarkili?", two large outline buttons stacked: "❤️ Yes, I love it" + "Not really".
  Step 2a (positive) — star rating row 5 stars 36×36, auto-advances to system review dialog on 4+ stars.
  Step 2b (negative) — feedback form: text area "What can we improve?" + Send button (tertiary primary) + skip link.
  Grabber handle. Padding 24. Gap 16. Radius top 2xl 24.
  STATES: sentiment, positive-rating, negative-feedback, submitted (toast "Thanks for your feedback!").
```

## SCREEN — L.9 Language & Locale Picker

```text
SCREEN: Language & Region    DEVICE: iPhone 14 + iPad
LAYOUT
  Navigation bar: back chevron + title "Language & Region".
  locale-picker list (grouped):
    Section "Supported":
      English (US) — default, check-trailing if selected.
      English (UK).
      Spanish (US / es-US).
      Croatian (HR — secondary market).
    Section "Coming soon" (disabled rows, opacity 50%):
      French (CA), German (DE), Italian (IT).
  Divider between sections.
  Format examples card (radius large 16, padding 16, Surface white):
    Preview row: label-small "Date" + body "May 9, 2026" (US) / "9 May 2026" (UK) / "9 de mayo de 2026" (ES).
    Preview row: label-small "Time" + "3:45 PM" / "15:45" / "3:45 p. m.".
    Preview row: label-small "Currency" + "$12.50" / "£12.50" / "$12.50".
    Preview row: label-small "Number" + "1,234.56" / "1,234.56" / "1.234,56".
  Reload prompt (shown after changed): bottom-sheet with body "Restart Zarkili to apply this language." + primary "Restart now" + tertiary "Later".
STATES
  default — English (US) selected, format card reflects US.
  changed — non-default selected, format card updates, reload prompt triggers.
  error — inline banner below nav bar "Could not save language. Try again."
```

## SCREEN — L.10 RTL Layout Examples

```text
DEVICE: iPhone 14 (produce side-by-side LTR + RTL frames for each)
Frames to mirror:
  L.10.1 Home screen (tab bar, search, featured card horizontal scroll).
  L.10.2 Explore screen (filter chips, service card grid).
  L.10.3 Booking flow confirmation screen.
RTL rules to annotate in frame notes:
  - Chevrons / arrows flip horizontally.
  - Horizontal padding: start/end swap.
  - Tab bar icon order reverses.
  - Horizontal scroll direction reverses.
  - Leading elements become trailing and vice versa.
  - Star rating row renders right-to-left.
  Text strings used: Arabic placeholder (ar-SA) — use lorem ipsum in Arabic script.
```

## SCREEN — L.11 Web Responsive Breakpoints

```text
DEVICE: Three breakpoints per screen:
  Mobile  390px  (1-column, 16px page padding)
  Tablet  768px  (2-column, 24px page padding)
  Desktop 1280px (3-column max 1200 content-width, 32px page padding)
Screens to render at all three breakpoints:
  L.11.1 — Home (hero + category chips + featured cards horizontal scroll → grid on tablet+).
  L.11.2 — Explore (search bar + filters + service card grid).
  L.11.3 — Booking flow (single-column → left-panel calendar / right-panel slots on 768+).
Annotate in frames:
  Column count, gutter width, number of cards per row at each breakpoint.
  Component reflow rules: what stacks vs. what goes side-by-side.
  Nav: bottom tabs on mobile → side rail (64px) on tablet → top nav + side rail on desktop.
```

## SCREEN — L.12 iOS Live Activities, Android Widget, App Clip

```text
L.12.1 — iOS Live Activities    DEVICE: iPhone 14 Pro (Dynamic Island)
  Dynamic Island compact: Zarkili coral dot + countdown timer (monospace) + staff avatar 20×20.
  Dynamic Island expanded (long-press):
    Service name heading-4. Staff name body-small. Countdown timer large heading-2 center. CTA "I'm here" Coral Blossom pill.
  Lock Screen widget (ActivityKit):
    Leading: service icon 32 + name body. Center: countdown heading-3. Trailing: staff avatar 40.
  STATES: pre-appointment (>15 min), imminent (<15 min — amber pulse ring on avatar), in-progress (timer counts up, label "In progress"), completed (label "Done! ⭐ Rate your visit").

L.12.2 — Android Home-Screen Widget    DEVICE: Pixel 7 (4-column × 2-row widget canvas)
  Background: Cream Silk #F2EDDD, radius large 16, shadow.
  Left: Zarkili logomark 32 + "Next booking" label-small muted.
  Center: service name body weight 600 + staff name body-small + date/time label-small (US format).
  Right: "Rebook" pill CTA Coral Blossom 80×32.
  Empty state: "No upcoming bookings" body-small muted + "Book now" CTA.
  STATES: has-booking, no-booking.

L.12.3 — App Clip Card    DEVICE: iPhone 14 (App Clip system card)
  App Clip header: Zarkili app icon 60 + name heading-4 + "App Clip" label-small muted.
  Body: "Book your nails in seconds — no account needed."
  Service preview card: service image 80×80 rounded + name + price + "Available today".
  Primary CTA: "Book with Apple Pay" — Apple Pay button style (black background, white Apple Pay logo).
  Tertiary: "Get full app" underline link.
  Footer: privacy note label-small muted "No personal data stored after session."
  STATES: default (service pre-filled), loading (CTA shows spinner), success (booking confirmed inline).
```

## SCREEN — L.13 Store Assets & Marketing Site

```text
L.13.1 — App Store Screenshot Frames (iPhone 6.7" 1290×2796)
  5 screenshots using store-screenshot-frame template:
    #1 "Discover your next look" — Home screen with salon cards + gradient overlay + headline.
    #2 "Book in under 60 seconds" — Booking confirmation with checkmark animation frame.
    #3 "Earn rewards with every visit" — Loyalty screen with progress ring + tier badge.
    #4 "Style inspo from your city" — Marketplace feed with posts.
    #5 "AI-powered scheduling" — Staff app AI suggestion panel + staff calendar.
  Each: device bezel accurate, status bar clean (9:41 AM, full signal, full battery), gradient headline band at top 120px.
  Brand gradient: diagonal top-left → bottom-right, Coral Blossom #E3A9A0 → Warm Oat #D1BFB3.

L.13.2 — iPad Screenshot Frames (12.9" 2048×2732)
  3 screenshots:
    #1 Home — Explore in 2-column tablet layout.
    #2 Staff app master calendar (multi-column).
    #3 Analytics dashboard.
  Same bezel + gradient headline band treatment.

L.13.3 — Play Store Screenshot Frames (Pixel 7 1080×2340)
  5 screenshots — same story as App Store 1–5, re-framed for Android bezel.

L.13.4 — Preview Video Storyboard Frames (15s + 30s)
  Produce 6 keyframes for 15s edit:
    0s: Zarkili wordmark on Cream Silk.
    2s: Discover screen — location search.
    5s: Booking flow — time slot selected.
    8s: Booking confirmed animation.
    11s: Loyalty tier upgrade.
    13s: Staff app with AI suggestion.
  Produce 12 keyframes for 30s edit (2× the above + marketplace + widget + app clip finale).
  Each frame: same device bezel + safe area annotations for video editor.

L.13.5 — Marketing Copy Spec (table in frame notes)
  App Store:   Title (30 char max) · Subtitle (30 char max) · Description (4000 char) · Keywords (100 char).
  Play Store:  Short description (80 char) · Full description (4000 char).
  All copy: US English primary. CAN-SPAM compliant. No competitor names. No superlatives without substantiation.
  Provide Croatian (HR) variants for all App Store / Play Store copy fields.
```

---

## COMPONENTS

```text
full-screen-gate-template
  Layout: full-screen SafeAreaView, Cream Silk background, vertical-center flex column.
  Padding horizontal: 32. Gap between slots: 24.
  Slot 1 — illustration area: 200×200, centered.
  Slot 2 — heading-2, centered, weight 600, #1A1A1A.
  Slot 3 — body, centered, muted #6B6B6B, max-width 280.
  Slot 4 — primary CTA: full-width minus 64 horizontal margin, radius medium 12, min-height 52, Coral Blossom, label weight 600.
  Slot 5 — tertiary CTA (optional): text-only, centered, muted, weight 500, min-height 44.
  Variants: with-tertiary, without-tertiary, with-progress (adds 4px indeterminate bar between body and CTA).

permission-recovery-card
  Display: bottom-sheet (radius top 2xl 24) OR inline card (radius 2xl 24). Produce both.
  Background: Surface #FFFFFF. Padding: 24. Shadow: large elevation.
  Icon container: 80×80 circle, background Mint Fresh 20% (#BBEDDA33), centering icon 48×48 color Mint Fresh #BBEDDA.
  Heading-4: "[Permission] Access Needed", weight 600, #1A1A1A, margin-top 16.
  Body: weight 400, muted #6B6B6B, max-width 280, margin-top 8.
  CTA primary: "Enable in Settings", Coral Blossom, full-width, radius medium 12, height 52, weight 600, margin-top 20.
  CTA tertiary: "Not now", centered, muted, weight 500, height 44, margin-top 8.
  6 icon variants as named variants: camera, photo-library, contacts, calendar, notifications, location.

locale-picker
  List row height: 56. Padding horizontal: 16. Separator: 1px #E5E0D1.
  Leading: flag emoji or SVG 24×24, trailing margin 12.
  Content: name body weight 500 #1A1A1A + native-name body-small muted #6B6B6B (e.g., "Croatian / Hrvatski").
  Trailing: check icon 20×20 Coral Blossom, visible only on selected row.
  Disabled row: opacity 50%, no check, "Coming soon" label-small muted trailing.
  Section header: label-small weight 600 muted uppercase, padding 16h 8v, no separator above.

coach-mark-popover
  Width: 280. Padding: 16. Radius: large 16. Background: Surface #FFFFFF. Shadow: large elevation.
  Arrow pointer: 12×8 triangle, same background #FFFFFF, positioned at variable edge (top/bottom/left/right).
  Heading-3: "Step title here", weight 600, #1A1A1A.
  Body: weight 400, muted #6B6B6B, margin-top 8.
  Step indicator: pip row centered, active pip Coral Blossom 8px circle, inactive #E5E0D1 6px circle, gap 6.
  CTA row gap 12: "Skip" tertiary left, "Next" / "Got it" primary right (radius medium 12, Coral Blossom, min-height 44, min-width 80).
  Backdrop: rgba(0,0,0,0.5) scrim. Spotlight cutout: 32-radius rect clipped from scrim around anchor, animated pulse ring (Coral Blossom 40% → transparent, 1.5s loop).

store-screenshot-frame
  Variants: iPhone 6.7" (1290×2796), iPhone 5.5" (1242×2208), iPad 12.9" (2048×2732), Android Pixel (1080×2340).
  Layers (bottom to top):
    1. Device bezel — pixel-accurate per variant, no brand colors on bezel.
    2. Safe area guides — annotated, non-printing layer.
    3. Status bar — clean (9:41 AM / time, full signal, full battery, correct OS indicators per platform).
    4. Screen content area — empty slot for embedding screen frame.
    5. Headline band — 120px top gradient overlay, Coral Blossom → Warm Oat diagonal.
    6. Headline text — heading-1 weight 600 white, max 24 chars, centered in band.
    7. Sub-headline — heading-4 weight 400 white 80% opacity, max 40 chars.
  Export: each frame as PNG @1 + @2 + @3, and as Figma component with content slot.
```

---

## Human Review Checklist

- [ ] All 13 screen groups + 5 components delivered.
- [ ] L.1 + L.2 have no dismiss path (full-screen gate pattern enforced).
- [ ] L.3 offline patterns cover both list and network-required-action disabled states.
- [ ] L.4 has reference ID on 500/503 states; omitted on network state.
- [ ] L.7 produces all 6 permission variants in both bottom-sheet and inline-card form.
- [ ] L.8.3 rate-the-app two-step flow (sentiment → rating or feedback) complete.
- [ ] L.9 locale picker shows format preview card updating per selection; reload prompt shown.
- [ ] L.10 RTL frames annotated with flip rules; Arabic placeholder text used.
- [ ] L.11 all three breakpoints rendered for Home, Explore, and Booking flow.
- [ ] L.12 iOS Live Activity has Dynamic Island compact + expanded + Lock Screen.
- [ ] L.12 Android widget has has-booking + no-booking states.
- [ ] L.12 App Clip has Apple Pay button (platform-compliant style).
- [ ] L.13 screenshot frames pixel-accurate bezels; status bar shows 9:41 AM.
- [ ] L.13 5 iPhone + 3 iPad + 5 Android Play screenshots produced.
- [ ] L.13 storyboard keyframes: 6 for 15s, 12 for 30s.
- [ ] Marketing copy table complete for US English and Croatian (HR).
- [ ] US English en-US is default in locale picker; en-GB, es-US, hr-HR are present.
- [ ] All dates US format MM/DD/YYYY; times 12h with AM/PM and timezone.
- [ ] All CTAs ≥ 44×44 touch targets.
- [ ] No new tokens invented — all colors from [`design-handoff/tokens/colors.json`](../../design-handoff/tokens/colors.json).
- [ ] Frames named `L-<screen>-<state>` (e.g., `L-1-default`, `L-7-camera-denied`, `L-13-iphone-screenshot-1`).
- [ ] After sign-off, promote to `design-handoff/batch-l/`. Figma is then closed for the program.
