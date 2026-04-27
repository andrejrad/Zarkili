# Batch G — Staff App Shell + AI

> Consumed by **Week 27**. Same design system; staff app uses same tokens.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Screens: Staff today view · Staff calendar (day/week) · Walk-in / queue · Client lookup + detail · Client notes/history · AI chat panel · AI suggestion card patterns · AI budget warning/protection/exhausted banners.

New components: `staff-calendar-grid`, `queue-card`, `client-header`, `ai-suggestion-card`, `ai-chat-composer`.

---

## SCREEN — G.1 Staff Today

```text
SCREEN: Staff Today    DEVICE: iPhone 14 390×844 + iPad 768×1024
LAYOUT
- Header: avatar + greeting, today's date (MM/DD/YYYY), location switcher pill.
- KPI row: appointments, revenue (USD), tips (USD), no-shows.
- Next-up card with countdown to next client.
- Vertical list of today's appointments (queue-card style with time 12h, client, service, status pill).
- AI suggestion-card slot at top ("Fill 2 empty slots — try a 10% promo").
- FAB "+ Walk-in" bottom-right.
STATES: default, light-day (encouragement message), no-day (off-day banner), error, loading.
```

## SCREEN — G.2 Staff Calendar (Day/Week)

```text
SCREEN: Staff Calendar    DEVICE: iPad 768×1024 (primary) + iPhone fallback
LAYOUT
- Header date navigator + view toggle (Day · Week).
- staff-calendar-grid: time column (5am–10pm at 30-min rows) + appointment blocks colored by service category.
- Right peek pane: tap-block shows mini detail.
- Bottom toolbar: today, jump-to-date, +new appointment.
STATES: default, empty day (encouragement), conflict (overlapping blocks with red outline), loading skeleton, error.
ACCESSIBILITY: each block accessibilityLabel "9:00 AM, 1 hour, Nail service for Jane Doe".
```

## SCREEN — G.3 Walk-in / Queue

```text
SCREEN: Queue    DEVICE: iPhone 14 390×844 + iPad
LAYOUT
- Tabs: Waiting · In service · Completed today.
- queue-card list: position #, client name, service, est. wait, started time.
- Drag handles to reorder (long-press).
- Footer "+ Add walk-in" primary CTA.
STATES: default, empty queue, fully booked banner, error, loading.
```

## SCREEN — G.4 Client Lookup + Detail

```text
SCREENS: Client Lookup + Client Detail    DEVICE: iPhone 14 + iPad
G.4.1 Lookup
- search-bar with filters chip-row.
- List rows: avatar 40, name, last visit date, lifetime value (USD), tier-badge.
- Pull-to-refresh.

G.4.2 Detail
- client-header: avatar 80, name, contact actions row (Call · Text · Email).
- Stats row: visits, lifetime value, last visit, no-shows.
- Tabs: Overview · History · Notes · Loyalty · Photos · Consents.
- Sticky CTA "Book for client".
STATES: default, no-results, no-history empty per tab, error, loading.
```

## SCREEN — G.5 Client Notes & History

```text
SCREEN: Notes & History    DEVICE: iPhone 14 + iPad
LAYOUT
- Notes section: pinned notes (warm-oat tinted), regular notes; +Note CTA.
- Note editor (modal-sheet): rich text basic, allergies checkbox-row, photo attachments, visibility (Staff-only / All staff / Owner only).
- History timeline: vertical list of past appointments with service, staff, total $, rating left.
STATES: default, empty notes, empty history, editing, saving, error.
```

## SCREEN — G.6 AI Chat Panel

```text
SCREEN: AI Chat (Staff variant)    DEVICE: iPhone 14 + iPad side panel
LAYOUT
- Header: "AI assistant", model name label-small, budget pill ("$2.40 / $5 today").
- Message list: same chat-bubble pattern; AI messages have small "AI" tag.
- Each AI message footer: thumbs up/down icons + "Why?" (opens explainability sheet).
- Quick prompt chips: "Suggest a promo" · "Reschedule no-shows" · "Draft thank-you".
- ai-chat-composer at bottom.
STATES: default, generating (typing dots + cancel button), budget-warning banner, budget-exhausted banner ("Topped out — basic only"), opt-out reminder, error.
ACCESSIBILITY: AI tag readable; thumbs labeled "Helpful" / "Not helpful".
```

## SCREEN — G.7 AI Suggestion Card Patterns

```text
SCREEN: AI Suggestion Patterns    DEVICE: iPhone 14
Deliver as a single page with side-by-side variants:
- Scheduling suggestion: "Move 2pm appointment to 4pm to fit a walk-in" — Accept / Modify / Dismiss.
- Retention suggestion: "Reach out to Jane (last visit 90 days ago)" — Send template / Edit / Dismiss.
- Content suggestion: "Draft post about your new service" — Use draft / Edit / Dismiss.
Each card: AI tag, body, action row, "Why?" explainability.
STATES: default, accepted (chip), dismissed (collapsed with undo), error.
```

## SCREEN — G.8 AI Budget Banners

```text
SCREEN: AI Budget States    DEVICE: iPhone 14
Three frames:
- Warning (80% used) — warning banner with "View usage" CTA.
- Protection (95% — restricted to read-only) — info banner.
- Exhausted (100%) — error banner blocking generation, fallback "Use a template instead" CTA.
Apply consistent across G.6 / G.7 / R.x.
```

---

## COMPONENTS

```text
staff-calendar-grid — left fixed time column 56 wide, hour rows 64 tall (30-min subdivisions). Now-line: 1px coral-blossom across grid. Appointment block: radius medium, category-tinted bg, fg foreground, edges 4px touch padding. Drag handle on top/bottom edges for resize.

queue-card — surface white, radius large 16, padding 16. Top row: position chip + client name (heading-3) + status pill. Body: service + est wait (label-small). Footer: action row (Start · Notify · Remove).

client-header — avatar 80 + name heading-2 + tier-badge + contact row of icon-buttons (44×44). Quick-stat strip below.

ai-suggestion-card — radius large, mint-fresh tinted top bar with "AI" tag, body text 14/20, action row (primary + secondary + tertiary "Dismiss"). Bottom row: tertiary "Why?" + thumbs up/down.

ai-chat-composer — same layout as F.2 composer + leading "AI" badge + token-counter label-small ("~120 tokens, $0.02"). When budget exhausted, send button disabled and helper text shows "Budget exhausted".
```

---

## Human Review Checklist

- [ ] All 8 screen groups + 5 components delivered.
- [ ] AI tag visible on every AI-generated message and card.
- [ ] Budget pill always visible in AI chat.
- [ ] Explainability "Why?" present on every AI suggestion.
- [ ] Reduce-motion fallback for typing dots.
- [ ] Tablet layout (iPad) covered for G.1, G.2, G.3, G.4, G.6.
- [ ] All required states delivered.
- [ ] Frames named `G-<screen>-<state>`.
