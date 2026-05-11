# Week 26 Close Report — Batch F: Messaging, Notifications, Waitlist (Consumer UI)

**Window:** Week 26 (Phase 2 consumer-UI sixth sprint).
**Status:** ✅ Complete — all 7 screens (F.1–F.7), 5 new shared-UI primitives, 1 helper module (messagingHelpers.ts), all test gates delivered, and TCPA + CAN-SPAM compliance embedded — GO for Week 27.
**Predecessor:** [WEEK25_CLOSE_REPORT.md](WEEK25_CLOSE_REPORT.md).

## 1. Scope

Per batch scope, W26 ships the consumer messaging, notification, and waitlist surface area: a direct-message inbox with thread view and compose, a notification center with preference management (TCPA / CAN-SPAM compliant), and a waitlist join + position tracking flow — plus 5 shared-UI primitives, the complete `messagingHelpers.ts` pure-logic module, 5 test suites, and 7 new routes.

W26 is entirely `code-only` — standard list/thread/inbox patterns per `FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md`; no Figma design-handoff pass was required.

All screens are props-driven with no Firestore I/O — the navigator layer wires live data once the three backend services ship (W26-DEBT-1/2/3).

### Legal compliance embedded this week

| ID | Regulation | Surface |
|----|-----------|---------|
| W26-LEG-006 | TCPA | `isInQuietHours()` helper; SMS marketing default OFF; `QUIET_HOURS_START_DEFAULT = "21:00"`, `QUIET_HOURS_END_DEFAULT = "08:00"` (handles midnight-spanning windows); `WaitlistJoinSheet` SMS-notify toggle defaults `false` |
| W26-LEG-007 | CAN-SPAM | Email marketing default OFF in `DEFAULT_NOTIFICATION_PREFERENCES`; `CAN_SPAM_UNSUBSCRIBE_COPY` + `CAN_SPAM_SENDER_COPY` constants exported from `messagingHelpers.ts` |

## 2. Features Delivered

### 2.1 Foundation — `src/shared/ui/` (5 new primitives)

| Primitive | Surface |
|-----------|---------|
| `ChatBubble` | Directional message bubble with `direction` ("incoming" / "outgoing"), `message` text, `formattedTime`, and optional `status` ("sent" / "delivered" / "read"). Incoming: `warmOat` background, `borderBottomLeftRadius: 4`. Outgoing: `surface` background with `coralBlossom` border, `borderBottomRightRadius: 4`. Status glyphs: ✓ sent / ✓✓ delivered / ✓✓ read (coral-blossom). `testID` forwarded to root View. |
| `AttachmentTile` | Dual-variant tile. Image variant: 64×64 thumbnail with optional `altText`. File variant: 56 h row with filename, formatted size, and download Pressable. `testID` forwarded to root View. |
| `QuickReplyChip` | Outline chip with coral-blossom border and text color. Pressable with `label`, `onPress`, and `testID`. |
| `NotificationRow` | 32 px toned-icon container + `title` / `preview` text block + `formattedTime` + optional unread dot. Category → icon name + background tint mapping: `booking` (🗓 cobalt), `promo` (🎁 coral), `reminder` (⏰ amber), `system` (ℹ️ slate), `loyalty` (⭐ gold). `testID` forwarded to root View. |
| `PreferenceToggleRow` | Label row with React Native `Switch`. `trackColor` uses design tokens: false → `colors.surface`, true → `colors.coralBlossom`. `accessibilityRole="switch"`. `testID` forwarded to root View. |

All five reuse W21 design tokens (`src/shared/ui/tokens.ts`) unchanged. All are props-driven with no business knowledge.

### 2.2 Pure helper — `src/app/messaging/messagingHelpers.ts`

Zero React imports. 39+ exported symbols across six logical sections:

#### Thread / inbox
- **Types / constants:** `MessageStatus` union ("sent" / "delivered" / "read" / "failed"), `MessageSender` ("consumer" / "salon"), `ConsumerMessage` (id, senderId, senderType, body, attachmentUrl, status, sentAt), `InboxTab` union ("all" / "unread"), `INBOX_TABS`, `ThreadSummary` (id, salonId, salonName, lastMessage, lastMessageAt, unreadCount).
- **Functions:** `filterThreadsByTab(threads, tab)` ("unread" filters to `unreadCount > 0`; "all" is passthrough), `countUnreadThreads(threads)`.

#### Time / date formatting
- `formatMessageTime(date)` — 12 h AM/PM from local Date ("9:07 AM").
- `formatThreadDate(date)` — relative label: "Today", "Yesterday", day-of-week (within 7 days), or MM/DD/YYYY beyond 7 days.
- `formatUsDate(date)` — US MM/DD/YYYY.

#### Notifications
- **Types / constants:** `NotificationItem` (id, title, preview, category, receivedAt, isRead), `NotificationTab` union ("all" / "unread"), `NOTIFICATION_TABS`, `NotificationDateGroup` (group: string, items: NotificationItem[]).
- **Functions:** `filterNotificationsByTab(items, tab)`, `groupNotificationsByDate(items)` → array of `NotificationDateGroup` with group labels "Today" / "Yesterday" / weekday name / MM/DD/YYYY, `categorizeNotificationDate(date)`.

#### Notification preferences
- **Types / constants:** `NotificationChannel` union ("push" / "email" / "sms"), `NotificationPreferenceKey` union (6 keys: "bookingConfirmations" / "bookingReminders" / "staffUpdates" / "promotions" / "loyaltyUpdates" / "systemAlerts"), `NOTIFICATION_PREFERENCE_LABELS` (display name per key), `NotificationPreferences` record (channel × key → boolean), `DEFAULT_NOTIFICATION_PREFERENCES` (all `promotions` push/email/sms = **false** per CAN-SPAM/TCPA; all other keys default true).

#### TCPA quiet-hours
- **Constants:** `QUIET_HOURS_START_DEFAULT = "21:00"`, `QUIET_HOURS_END_DEFAULT = "08:00"`.
- **Types / constants:** `QuietDay` union ("Sun" / "Mon" / "Tue" / "Wed" / "Thu" / "Fri" / "Sat"), `QUIET_DAYS_ALL` (all 7 values).
- **Function:** `isInQuietHours(now, startTime, endTime)` — parses HH:MM strings, handles midnight-spanning windows (e.g., 21:00–08:00 the next day), returns `boolean`.

#### CAN-SPAM
- **Constants:** `CAN_SPAM_UNSUBSCRIBE_COPY` (standard "To unsubscribe…" footer text), `CAN_SPAM_SENDER_COPY` (sender identification block).

#### Waitlist
- **Types / constants:** `WaitlistTimePreference` union ("morning" / "afternoon" / "evening" / "any"), `WaitlistStaffPreference` union ("any" / "specific"), `WaitlistJoinRequest` (serviceId, staffPreference, timePreference, dateRangeStart/End, notifySms), `WaitlistSlotOffer` (id, proposedDate, proposedTime, serviceId, expiresAt), `WaitlistPositionData` (id, position, estimatedWait, serviceId, salonId, slotOffer?).
- **Functions:** `formatPositionLabel(position)` — "#1" / "#2" etc., `formatWaitlistCountdown(expiresAt)` — "Xh Ym" remaining string (floor minutes and hours from millisecond delta; "Expired" when past).

### 2.3 Screens — `src/app/messaging/`, `src/app/notifications/`, `src/app/waitlist/` (7 screens)

| # | Screen | File | Composition |
|---|--------|------|-------------|
| F.1 | **Inbox** | `src/app/messaging/InboxScreen.tsx` | `Banner` + `SegmentedControl` ("All" / "Unread") tabs + `TextInput` search bar + `FlatList` of `ThreadSummary` rows. Loading state keyed `{testID}-loading`; empty state keyed `{testID}-empty`; error-retry keyed `{testID}-retry`; compose FAB keyed `{testID}-compose`. |
| F.2 | **Thread** | `src/app/messaging/ThreadScreen.tsx` | Inverted `FlatList` rendering `ChatBubble` + `AttachmentTile` per message. Typing indicator. Horizontal `QuickReplyChip` row. Multiline composer with send Pressable. Blocked `Banner` overlay. testIDs: `{testID}-back`, `{testID}-blocked-banner`, `{testID}-send`, `{testID}-loading`, `{testID}-retry`. |
| F.3 | **Compose** | `src/app/messaging/ComposeScreen.tsx` | Salon search `TextInput` → recipient chip → subject `TextInput` + multiline body → `StickyCtaBar`. testIDs: `{testID}-back`, `{testID}-recipient-search`, `{testID}-send`. |
| F.4 | **Notification Center** | `src/app/notifications/NotificationCenterScreen.tsx` | `SegmentedControl` ("All" / "Unread") + `FlatList` with date-group sticky headers via `groupNotificationsByDate`. Permission-denied `Banner`. testIDs: `{testID}-loading`, `{testID}-empty`, `{testID}-permission-banner`, `{testID}-mark-all-read`. |
| F.5 | **Notification Preferences** | `src/app/notifications/NotificationPreferencesScreen.tsx` | 3-channel (`push` / `email` / `sms`) × 6-preference key matrix rendered as `PreferenceToggleRow` rows with `NOTIFICATION_PREFERENCE_LABELS` display names. Quiet-hours `TextInput` pair (start / end times) + day-of-week `QuickReplyChip` grid. Reset-to-defaults CTA. TCPA / CAN-SPAM helpers wired: `isInQuietHours()`, `CAN_SPAM_UNSUBSCRIBE_COPY`. testIDs: `{testID}-permission-denied-banner`, `{testID}-pref-{key}-{channel}`, `{testID}-reset-defaults`. |
| F.6 | **Waitlist Join** | `src/app/waitlist/WaitlistJoinSheet.tsx` | `ModalSheet` with service + salon header. Date-range inputs. `WaitlistTimePreference` chip row. `WaitlistStaffPreference` chip row. TCPA SMS-notify `PreferenceToggleRow` defaulting `false`. `StickyCtaBar`. Already-on-waitlist `Banner`. testIDs: `{testID}-join-cta`, `{testID}-notify-sms-toggle`, `{testID}-already-banner`. |
| F.7 | **Waitlist Position** | `src/app/waitlist/WaitlistPositionScreen.tsx` | Hero position number via `formatPositionLabel` + service name + salon mini-card + estimated-wait text. Slot-offer `Banner` (variant `"success"`) with countdown via `formatWaitlistCountdown` + Accept CTA when `slotOffer` present. Leave waitlist + update-preferences CTAs. testIDs: `{testID}-position`, `{testID}-slot-offer`, `{testID}-leave`. |

### 2.4 Routes

Seven new public `guard: "none"` routes appended to [src/app/navigation/routes.ts](../../src/app/navigation/routes.ts):

`Inbox` `/messages`, `Thread` `/messages/thread`, `Compose` `/messages/compose`, `NotificationCenter` `/notifications`, `NotificationPreferences` `/notifications/preferences`, `WaitlistJoin` `/waitlist/join`, `WaitlistPosition` `/waitlist/position`.

Anonymous-route ordering snapshot in [src/app/navigation/\_\_tests\_\_/routes.test.ts](../../src/app/navigation/__tests__/routes.test.ts) extended with all 7 new entries after `Referral`.

## 3. Tests

- **Root jest:** 2,045 → **2,138** passing across 133 → **138** suites (+93 tests, +5 suites).
- **Functions vitest:** **187** passing across 14 suites (unchanged — Batch F is consumer-UI only).
- **`npx tsc --noEmit`** (root): 0 errors.

New suites:

| Suite | Path | Coverage |
|-------|------|---------|
| `messaging-primitives` | `src/shared/ui/__tests__/messaging-primitives.test.tsx` | `ChatBubble` (incoming/outgoing render, status glyphs, testID forwarding), `AttachmentTile` (image and file variants), `QuickReplyChip` (render, onPress callback), `NotificationRow` (title/preview/unread-dot render, testID forwarding), `PreferenceToggleRow` (label render, toggle callback, accessibilityRole) |
| `messagingHelpers` | `src/app/messaging/__tests__/messagingHelpers.test.ts` | All 6 sections: filterThreadsByTab (all/unread), countUnreadThreads, formatMessageTime (12 h local Date), formatThreadDate (relative labels: Today/Yesterday/weekday/date), formatUsDate (MM/DD/YYYY), filterNotificationsByTab, groupNotificationsByDate (group label output), DEFAULT_NOTIFICATION_PREFERENCES (promotions channels default false), isInQuietHours (within window, outside window, midnight-spanning), CAN_SPAM_UNSUBSCRIBE_COPY/CAN_SPAM_SENDER_COPY non-empty, formatPositionLabel, formatWaitlistCountdown (hours+minutes, expired) |
| `messagingScreens` | `src/app/messaging/__tests__/messagingScreens.test.tsx` | Smoke renders for `InboxScreen`, `ThreadScreen`, `ComposeScreen` with loading/empty/error/block state branches |
| `notificationsScreens` | `src/app/notifications/__tests__/notificationsScreens.test.tsx` | Smoke renders for `NotificationCenterScreen` (all tabs, permission banner, mark-all-read), `NotificationPreferencesScreen` (pref toggle matrix, quiet-hours inputs, reset defaults) |
| `waitlistScreens` | `src/app/waitlist/__tests__/waitlistScreens.test.tsx` | Smoke renders for `WaitlistJoinSheet` (join CTA, SMS-toggle default state, already-on-waitlist banner), `WaitlistPositionScreen` (position display, slot-offer banner, leave CTA) |

### Test-fix pass summary

| Root cause | Fix applied |
|-----------|-------------|
| `MessageStatus` includes `"failed"` but `ChatBubbleStatus` accepted only sent/delivered/read — ThreadScreen TS error | Added conditional: `item.status === "failed" ? undefined : item.status` at the call site |
| `colors.surfaceAlt` does not exist in design tokens | Changed to `colors.surface` in NotificationCenterScreen |
| `formatMessageTime` tests used UTC ISO strings; function uses local `Date` | Rewrote test Date objects using `setHours()` to build local-time values |
| `getByText("Booking reminders")` found multiple matches — label appears once per channel section | Changed assertion to `getAllByText(...).length > 0` |
| `NotificationDateGroup` field name was `group.label` — actual field is `group.group` | Corrected all call sites |
| `n.tone → n.category` field mismatch on `NotificationItem` | Changed to `n.category` throughout |
| `n.formattedTime` does not exist on `NotificationItem` | Changed to `formatMessageTime(n.receivedAt)` |
| `n.isUnread → !n.isRead` field mismatch | Changed to `!n.isRead` throughout |
| `PREF_KEYS` in screen was a plain `string[]`, not `NotificationPreferenceKey[]` | Typed as `NotificationPreferenceKey[]` with an `as const` cast |
| `QuietDay` capitalization — tests used lower-case `"sun"/"mon"` | Corrected to capitalized forms `"Sun"/"Mon"` etc. matching the type |
| `WaitlistPositionData.estimatedWaitMinutes` field name | Changed to `estimatedWait: string` per the type definition |

## 4. Security

- **No Firestore I/O from screens.** All screens are props-driven. No new Firestore rules needed. Backend ports are deferred to W26-DEBT-1/2/3.
- **TCPA.** SMS marketing and waitlist SMS-notify toggles default to `false`. `isInQuietHours()` handles midnight-spanning windows correctly (tested). Promotional SMS defaults `false` in `DEFAULT_NOTIFICATION_PREFERENCES`.
- **CAN-SPAM.** Email marketing default `false`. `CAN_SPAM_UNSUBSCRIBE_COPY` and `CAN_SPAM_SENDER_COPY` constants are exported for use in any outbound email render; `NotificationPreferencesScreen` surfaces these in the email-channel section.
- **No PII logged.** Thread bodies and notification previews are display-only UI strings; no network calls or clipboard writes in the component layer. File download in `AttachmentTile` is a caller-wired handler.
- **WCAG 2.1 AA preserved.** All interactives ≥ 44×44. `PreferenceToggleRow` has `accessibilityRole="switch"`. `QuickReplyChip` is a `Pressable` with accessible label. `NotificationRow` unread indicator has `accessibilityLabel`.

## 5. Debt Register

Three backend services remain unbuilt. All W26 screen props have the correct types; the navigator layer supplies mock data until the debts ship.

| ID | Description | Target |
|----|-------------|--------|
| **W26-DEBT-1** | **Backend messaging service** — Firestore `threads` + `messages` collections with security rules; `sendMessage` Cloud Function (creates/updates thread doc + writes message subdoc); `getThreadsForUser` + `getMessagesForThread` read ports. | W27 or Phase 3 backend pass |
| **W26-DEBT-2** | **Push notification delivery infrastructure** — FCM token registration (`userDeviceTokens/{uid}/tokens/{tokenId}` Firestore model); `sendPushNotification` Cloud Function (Firestore → FCM dispatch); `createNotification` Firestore write path to surface items in `NotificationCenterScreen`. | W27 or Phase 3 backend pass |
| **W26-DEBT-3** | **Waitlist backend service** — `waitlist` Firestore collection (doc per consumer-service-salon tuple); `joinWaitlist` / `leaveWaitlist` / `notifyWaitlistSlot` Cloud Functions; slot-offer `slotOffer` sub-document to feed `WaitlistPositionScreen`. | W27 or Phase 3 backend pass |

Previously carried debts (not closed this week): W19-DEBT-4, W19-DEBT-5, W20-DEBT-2, W20-DEBT-3, W20-DEBT-4, W22-DEBT-1, W22-DEBT-3, W23-DEBT-1, W23-DEBT-3, W24-DEBT-1, W24-DEBT-2, W24-DEBT-3, W25-DEBT-1, W25-DEBT-2, W25-DEBT-3.

## 6. Index — Changed Files

### New (production)

**Primitives — `src/shared/ui/`:**
- `ChatBubble.tsx`
- `AttachmentTile.tsx`
- `QuickReplyChip.tsx`
- `NotificationRow.tsx`
- `PreferenceToggleRow.tsx`

**Helper:**
- `src/app/messaging/messagingHelpers.ts`

**Screens:**
- `src/app/messaging/InboxScreen.tsx`
- `src/app/messaging/ThreadScreen.tsx`
- `src/app/messaging/ComposeScreen.tsx`
- `src/app/notifications/NotificationCenterScreen.tsx`
- `src/app/notifications/NotificationPreferencesScreen.tsx`
- `src/app/waitlist/WaitlistJoinSheet.tsx`
- `src/app/waitlist/WaitlistPositionScreen.tsx`

### New (tests)

- `src/shared/ui/__tests__/messaging-primitives.test.tsx`
- `src/app/messaging/__tests__/messagingHelpers.test.ts`
- `src/app/messaging/__tests__/messagingScreens.test.tsx`
- `src/app/notifications/__tests__/notificationsScreens.test.tsx`
- `src/app/waitlist/__tests__/waitlistScreens.test.tsx`

### Modified

- `src/shared/ui/index.ts` — W26 section: exports `ChatBubble`, `AttachmentTile`, `QuickReplyChip`, `NotificationRow`, `PreferenceToggleRow` + their prop types
- `src/app/navigation/routes.ts` — 7 new routes appended after `Referral`: Inbox, Thread, Compose, NotificationCenter, NotificationPreferences, WaitlistJoin, WaitlistPosition
- `src/app/navigation/__tests__/routes.test.ts` — snapshot `toEqual` array extended with 7 new route names
- `documentation/new-platform/WEEKLY_LOG.md` — W26 entry appended
- `documentation/PROGRAM_TRACKING_BOARD.md` — D-102 appended

## 7. Next-Week Prerequisites (Week 27)

Phase 2 consumer-UI surface area is now complete across all six batches (A–F). W27 may either:

1. **Backend wiring sprint** — close W26-DEBT-1/2/3 (messaging, notifications, waitlist backends) alongside W23-DEBT-1 (booking persistence Cloud Functions + read ports), W24-DEBT-2 (Stripe server-side payment infrastructure), and W25-DEBT-1/2/3 (loyalty backend). These are the highest-priority debts gating live data end-to-end.
2. **Phase 2 extension** — deliver any remaining screens from the `PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md` plan not yet shipped (W28 W22-DEBT-1 react-native-maps stub, editorial feed W22-DEBT-3).

No consumer-UI screen primitives carried as blocking prerequisites for W27.

