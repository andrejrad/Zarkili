# Batch L — Cross-Cutting Platform, i18n, Store Readiness

> Consumed by **Week 32**.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Topics: Force-update gate · Maintenance mode · Offline state + offline-aware patterns · Server-error fallback · Feature-flag-disabled · Deep-link cold-start + universal-link mismatch · Permission denied recovery (camera/photo/contacts/calendar/notification/location) · First-run tutorial / what's new / rate-the-app / invite friends · Language & locale picker · RTL examples · Web responsive breakpoints · iOS Live Activities / Android widgets / App Clip · Store assets & marketing copy.

New components: `full-screen-gate-template`, `permission-recovery-card`, `locale-picker`, `coach-mark-popover`, `store-screenshot-frame`.

---

## SCREEN — L.1 Force-Update Gate

```text
SCREEN: Update Required    DEVICE: iPhone 14 (full-screen blocking)
LAYOUT (full-screen-gate-template)
- Hero illustration.
- Heading-2 "Update required".
- Body "Please update to continue using Zarkili."
- Primary CTA "Open App Store" (or Play Store).
- No dismiss.
STATES: default, downloading hint.
```

## SCREEN — L.2 Maintenance Mode

```text
SCREEN: Maintenance    DEVICE: iPhone 14
- Heading "We'll be right back".
- Body with ETA timestamp (US format).
- Status link to status page.
STATES: default, with ETA, indefinite.
```

## SCREEN — L.3 Offline State + Patterns

```text
SCREEN: Offline    DEVICE: iPhone 14
- Top sticky banner "You're offline".
- Cached content shown with overlay "Last updated MM/DD/YYYY h:mm AM/PM".
- List/detail patterns: greyed actions that require network with tooltip "Connect to use".
STATES: offline, reconnecting, restored toast.
```

## SCREEN — L.4 Server-Error Fallback

```text
SCREEN: 500 / Generic Error    DEVICE: iPhone 14
- Illustration + heading "Something went wrong".
- Tertiary "Retry" + secondary "Report".
- Reference ID label-small for support.
STATES: 500, 503, network.
```

## SCREEN — L.5 Feature-Flag-Disabled State

```text
SCREEN: Feature Disabled    DEVICE: iPhone 14
- Inline empty state replacing flagged area.
- Body "This feature isn't available yet."
- Tertiary "Notify me" or "Learn more".
STATES: disabled, beta-waitlist.
```

## SCREEN — L.6 Deep-Link / Universal-Link

```text
SCREENS: Deep-Link Cold Start + Mismatch    DEVICE: iPhone 14
- Cold-start splash with progress and routing target.
- Universal-link mismatch fallback "We couldn't find that page" + Home CTA.
States: routing, found, mismatch.
```

## SCREEN — L.7 Permission Denied Recovery (6 frames)

```text
permission-recovery-card per permission: Camera, Photo Library, Contacts, Calendar, Notifications, Location.
LAYOUT: icon 48 + title + body explaining purpose + "Enable in Settings" deep-link CTA + tertiary "Not now".
States: denied, granted-after-redirect.
```

## SCREEN — L.8 First-Run Tutorial / What's New / Rate-the-App / Invite Friends

```text
L.8.1 First-run coach marks — coach-mark-popover anchored to UI elements with arrow + "Got it" CTA + step indicator.
L.8.2 What's new — modal-sheet with version + release notes list.
L.8.3 Rate-the-app prompt — bottom sheet with "Enjoying Zarkili?" → 5 stars → if 4+ stars → App Store review; else → feedback form.
L.8.4 Invite friends — same as E.9 referral.
```

## SCREEN — L.9 Language & Locale Picker

```text
SCREEN: Language    DEVICE: iPhone 14
- locale-picker list: English (US) (default) · English (UK) · Spanish (US) · Croatian (HR — secondary) · …
- Format examples card showing date/time/currency/number per selection.
- Save changes prompts app reload.
STATES: default, changed (reload prompt), error.
```

## SCREEN — L.10 RTL Layout Examples (if approved)

```text
Render Home + Profile in RTL with mirrored chevrons, padding flipped.
Document chip alignment, swipe direction inversion.
```

## SCREEN — L.11 Web Responsive Breakpoints

```text
Render Home, Explore, Profile at:
- Mobile 390 (baseline)
- Tablet 768
- Desktop 1280
Show grid columns and component reflow rules.
```

## SCREEN — L.12 iOS Live Activities, Android Widgets, App Clip

```text
- Live Activity for active booking (Dynamic Island + Lock Screen variants), countdown to appointment.
- Android home-screen widget (4×2): next booking + quick rebook.
- App Clip card "Book your nails in seconds" with Apple Pay flow.
States: pre-appointment, in-progress, completed.
```

## SCREEN — L.13 Store Assets

```text
store-screenshot-frame templates for App Store + Play Store:
- iPhone 6.7" (1290×2796) — 5 screenshots: Discover, Booking, Loyalty, Marketplace, AI assistant.
- iPad 12.9" (2048×2732) — 3 screenshots.
- Preview video storyboard frames (15s and 30s).
- Marketing copy spec: title, subtitle, keywords, descriptions (US English first).
```

---

## COMPONENTS

```text
full-screen-gate-template — centered illustration 160 + heading-2 + body + primary CTA + optional tertiary.

permission-recovery-card — radius 2xl 24, surface white, padding 24, icon 48 mint-fresh tinted, body, dual CTA.

locale-picker — list rows: language flag 24 + name body + native-name body-small muted + check trailing.

coach-mark-popover — 280-wide tooltip with arrow pointer; title heading-3 + body + step pip + Skip + Next CTA. Backdrop scrim 50% black except spotlight cutout.

store-screenshot-frame — device-bezel-accurate frame template per device; safe areas marked.
```

---

## Human Review Checklist

- [ ] All 13 groups + 5 components delivered.
- [ ] US English (en-US) is default in locale picker.
- [ ] Live Activity, widget, App Clip frames validated.
- [ ] Store screenshots include AI feature highlight.
- [ ] All required states delivered.
- [ ] Frames named `L-<screen>-<state>`.
