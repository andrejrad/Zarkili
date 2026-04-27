# Batch F — Messaging, Notifications, Waitlist

> Consumed by **Week 26**.
> Always prepend the Global Design System Anchor from [`README.md`](README.md).

Screens: Inbox list · Thread view · Compose/new message · Notification center · Notification preferences · Waitlist join sheet · Waitlist position.

New components: `chat-bubble`, `attachment-tile`, `quick-reply-chip`, `notification-row`, `preference-toggle-row`.

---

## SCREEN — F.1 Inbox List

```text
SCREEN: Inbox    DEVICE: iPhone 14 390×844
LAYOUT
- Header: title "Messages" heading-2, right "+" icon-button → F.3.
- search-bar (existing).
- Tabs: All · Unread · Salons.
- Thread rows: avatar 48, salon name + body-small last-message preview, right column: time (12h or "2d"), unread badge (mint-fresh dot or count chip).
- Swipe actions: archive, mute, mark unread.
STATES: default, empty ("No messages yet"), unread-grouped, loading skeleton, error.
```

## SCREEN — F.2 Thread View

```text
SCREEN: Thread    DEVICE: iPhone 14 390×844
LAYOUT
- Header: avatar + salon name + presence dot, kebab right (mute/archive/block).
- Date separator label-small muted center.
- chat-bubble stack (incoming left warm-oat, outgoing right coral-blossom-on-white). Read receipt label-small under outgoing.
- Typing indicator (3 dots animated; reduce-motion: static "typing…").
- attachment-tile inline for images/files.
- quick-reply-chip horizontal scroll above composer (suggested replies).
- Composer: input (multiline, max 6 lines), + attach 24, send 32 coral-blossom (disabled until text).
STATES: default, no-messages-yet, attachment-uploading, send-failed (retry tap), blocked-banner, error.
ACCESSIBILITY: composer accessibilityLabel "Type a message"; send accessibilityLabel "Send message".
```

## SCREEN — F.3 Compose / New Message

```text
SCREEN: New Message    DEVICE: iPhone 14 390×844
LAYOUT
- Header back, "To:" input row with chip-tokens for recipients.
- Salon search list below.
- Subject (optional) input.
- Composer same as F.2.
STATES: default, no-recipients (CTA disabled), recipient-not-found, sending, sent (close → F.2), error.
```

## SCREEN — F.4 Notification Center

```text
SCREEN: Notifications    DEVICE: iPhone 14 390×844
LAYOUT
- Header "Notifications" + tertiary "Mark all read" right.
- Tabs: All · Bookings · Loyalty · Promos · System.
- Sectioned by date (Today / Yesterday / This week / Earlier — US date format).
- notification-row items.
STATES: default, empty per tab, permission-disabled banner top with "Enable in Settings" CTA, loading, error.
```

## SCREEN — F.5 Notification Preferences

```text
SCREEN: Notification Preferences    DEVICE: iPhone 14 390×844
LAYOUT
- Header back, title "Notifications".
- Channel matrix sections: Push · Email · SMS — each with preference-toggle-row list:
  - Booking reminders (default ON for Push)
  - Booking changes (default ON for Push + Email)
  - Promotions (default OFF for SMS — TCPA; OFF for Email — CAN-SPAM)
  - New salons near you (OFF default)
  - Loyalty updates (Push ON)
  - Reviews requests (Push ON)
- Quiet hours section: time range pickers (12h AM/PM) + days-of-week chip selector.
- Tertiary "Reset to defaults".
STATES: default, system-permission-denied banner, saving (subtle inline), error.
```

## SCREEN — F.6 Waitlist Join Sheet

```text
SCREEN: Waitlist Join    DEVICE: bottom modal-sheet
LAYOUT
- Title "Join waitlist for <Service>".
- Date range picker (US format).
- Time-of-day chips: Morning · Afternoon · Evening · Anytime.
- Staff preference (Any / Specific).
- Notify-by toggles (Push / SMS — SMS off by default).
- Body small policy disclosure.
- Sticky CTA "Join waitlist".
STATES: default, joining loader, joined success → F.7, error, already-on-waitlist banner.
```

## SCREEN — F.7 Waitlist Position

```text
SCREEN: Waitlist Position    DEVICE: iPhone 14 390×844
LAYOUT
- Hero: position number heading-1 ("#3"), label-large "in line for Hair Cut".
- Salon mini-card.
- Estimated wait body ("Typically 2–5 days").
- Actions: Update preferences · Leave waitlist (destructive).
STATES: default, slot-offered (banner mint-fresh "A slot is available — Book now" with countdown), expired-offer, error.
```

---

## COMPONENTS

```text
chat-bubble — max width 75%. Incoming: warm-oat bg, foreground text, radius large with bottom-left 4. Outgoing: surface white bg with 1px coral-blossom border (or coral-blossom bg + white text), radius large with bottom-right 4. Padding 12. Body 14/20. Below: time label-small muted + status icon (sent/delivered/read).

attachment-tile — image: thumbnail 64×64 radius medium with cover fit. File: 56 height row with file icon + filename + size label-small + download icon.

quick-reply-chip — chip variant; tap inserts text into composer + dismisses suggestion row.

notification-row — leading icon 32 (status-tinted), title body 14/20, body-small muted preview, right time label-small muted + unread dot 8 mint-fresh. Swipe-to-dismiss state.

preference-toggle-row — left icon 24 + label body, right toggle (44×26 track, 20 thumb). Optional helper body-small muted below label.
```

---

## Human Review Checklist

- [ ] All 7 screens + 5 components delivered.
- [ ] SMS marketing toggles default OFF (TCPA).
- [ ] Email marketing toggles default OFF (CAN-SPAM).
- [ ] Times shown in 12h AM/PM with timezone where relevant.
- [ ] Reduce-motion fallback for typing indicator.
- [ ] Touch targets ≥44×44 (toggles include 8px hit slop).
- [ ] All required states delivered.
- [ ] Frames named `F-<screen>-<state>`.
