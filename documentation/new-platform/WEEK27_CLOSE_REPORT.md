# Week 27 Close Report — Batch G: Staff App Shell + AI Surfaces (Consumer UI)

**Window:** Week 27 (Phase 2 consumer-UI seventh sprint).
**Status:** ✅ Complete — all 7 screens (G.1–G.6/7/8), 2 shared-UI primitives, 1 shared types module, 1 domain helper, and 1 test suite delivered — GO for Week 28.
**Predecessor:** [WEEK26_CLOSE_REPORT.md](WEEK26_CLOSE_REPORT.md).

## 1. Scope

W27 delivers the staff-facing mobile app shell: a daily dashboard, a shift calendar, a walk-in queue, a client lookup + detail + notes-history surface, and an AI stylist-chat panel — plus 2 shared-UI primitives (`QueueCard`, `AISuggestionCard`), the `src/shared/staffTypes.ts` foundation module, and the `staffHelpers.ts` domain utility layer.

W27 is entirely `code-only` — Batch G screens follow standard list/card/chat patterns per `FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md`; no Figma design-handoff pass was required.

All screens are props-driven with no Firestore I/O. The navigator layer wires live data when Phase 3 backend services ship.

## 2. Features Delivered

### 2.1 Foundation — `src/shared/staffTypes.ts` (shared primitive types)

Zero React imports. Primitive types safe for import from both `src/shared/ui/` and `src/app/staff/`:

| Export | Description |
|--------|-------------|
| `StaffQueueStatus` | `"waiting" \| "in-progress" \| "done" \| "no-show"` |
| `STAFF_QUEUE_STATUS_LABELS` | Display label map per status |
| `AISuggestionType` | `"upsell" \| "rebooking" \| "review-request" \| "general"` |
| `AISuggestion` | `{ id, type, headline, body, primaryLabel?, secondaryLabel? }` |
| `AIBudgetState` | `"ok" \| "degraded" \| "paused"` |
| `AVATAR_PALETTE` | 8-color palette for deterministic avatar tinting |
| `djb2AvatarColor(name)` | Hash `name` → `AVATAR_PALETTE` index |
| `formatWaitTime(minutes)` | Human-readable wait label (e.g. `"15 min"`) |

### 2.2 Foundation — `src/shared/ui/` (2 new primitives)

| Primitive | Surface |
|-----------|---------|
| `QueueCard` | Appointment row card. `clientName` + `initials` + deterministic avatar tint via `djb2AvatarColor`. `service`, `startTime`, `durationMinutes`. Optional queue `position` badge. `StaffQueueStatus` chip (waiting = amber, in-progress = cobalt, done = green, no-show = muted). Optional `stylistName`. Three action callbacks: `onPress`, `onStartAppointment`, `onNotifyClient`. `testID` forwarded to root View. |
| `AISuggestionCard` | AI suggestion surface. `AISuggestionType` icon tint. `headline` + `body` text block. Optional `primaryLabel` + `secondaryLabel` action buttons. `AIBudgetState`-aware: `"degraded"` renders amber degraded-service banner; `"paused"` renders full `paused` overlay instead of card content. `onPrimaryAction`, `onSecondaryAction`, `onDismiss`, `onWhy` callbacks. `testID` forwarded to root View. |

Both primitives reuse W21 design tokens (`src/shared/ui/tokens.ts`) unchanged and are fully props-driven.

### 2.3 Pure helper — `src/app/staff/staffHelpers.ts`

Zero React imports. Extends `src/shared/staffTypes` with app-level types and utilities:

- **Re-exports** all primitives from `src/shared/staffTypes`.
- **`StaffAppointment`** — full appointment model: clientId, clientName, initials, service, startTime, durationMinutes, position?, status, stylist?
- **`ClientRow`** — lookup-list model: id, name, initials, tier (bronze/silver/gold/platinum/locked), isVIP, lastVisit, totalVisits, ltv.
- **`ClientDetail`** — detail model: extends `ClientRow` + phone, email, preferredStylist, allergies, notes, upcomingBookings, loyaltyPoints, loyaltyTier.
- **`ClientNoteEntry`** — notes model: id, clientId, authorName, body, createdAt, isPrivate.
- **`AIChatMessage`** — chat model: id, role (`"user" | "assistant"`), body, sentAt, isThinking?
- **`deriveInitials(name)`** — first initial of each word, max 2 chars, uppercase.
- **`formatLtv(cents)`** — formats lifetime value in cents to `"$X,XXX"` US dollar string.
- **`resolveAIBudgetState(budget)`** — maps budget usage ratio to `AIBudgetState`.

### 2.4 Screens — `src/app/staff/` (7 screen files)

| # | Screen | File | Composition |
|---|--------|------|-------------|
| G.1 | **Staff Today** | `StaffTodayScreen.tsx` | Sticky header "Today, {date}" greeting + availability toggle. KPI row: bookings, revenue, next slot, avg rating. Optional `AISuggestionCard`. `FlatList` of `QueueCard` rows. Walk-in queue strip with "View queue" shortcut. States: `default \| light-day \| no-day \| loading \| error`. |
| G.2 | **Staff Calendar** | `StaffCalendarScreen.tsx` | 7-day week strip with day/date cells; active day highlighted. Day view appointment list of `QueueCard` rows. Empty-day and off-day states. `onSelectDay`, `onPressAppointment` callbacks. |
| G.3 | **Walk-in Queue** | `WalkInQueueScreen.tsx` | Live queue of `QueueCard` rows with position badges. `QueueCard` action callbacks: start, notify client. Empty-queue and error states. |
| G.4.1 | **Client Lookup** | `ClientLookupScreen.tsx` | Search input → filtered `FlatList` of `ClientRow` rows: avatar chip, name, tier badge, last-visit label, VIP indicator. Loading, empty-search, and no-results states. |
| G.4.2 | **Client Detail** | `ClientDetailScreen.tsx` | 96 px avatar with deterministic color. Loyalty tier badge. Contact row (phone/email). Preferences: preferred stylist, allergies. Bio/notes block. Upcoming bookings list. Lifetime value display. Book again CTA. |
| G.5 | **Client Notes History** | `ClientNotesHistoryScreen.tsx` | Chronological note list: date header, author, body, private badge. Add-note compose sheet via `ModalSheet`. Delete-note confirmation via `Banner`. |
| G.6/7/8 | **AI Chat** | `AIChatScreen.tsx` | Three views via `view` prop: `"chat"` (message list + composer), `"suggestions"` (card grid), `"budget-info"` (usage meter + limits). `AIBudgetState`-aware: degraded and paused overlays. Thinking bubble while `isThinking`. |

### 2.5 Index

`src/shared/ui/index.ts` updated with W27 Batch G exports:
```typescript
// W27 Batch G primitives — Staff App + AI
export { QueueCard } from "./QueueCard";
export type { QueueCardProps } from "./QueueCard";
export { AISuggestionCard } from "./AISuggestionCard";
export type { AISuggestionCardProps, AISuggestionState } from "./AISuggestionCard";
```

## 3. Tests

- **Root jest:** 2,138 → **2,194** passing across 138 → **139** suites (+56 tests, +1 suite).
- **`npx tsc --noEmit`** (root): 0 errors.

| Suite | Path | Coverage |
|-------|------|---------|
| `staffScreens` | `src/app/staff/__tests__/staffScreens.test.tsx` | `staffHelpers` utilities: `deriveInitials` (full name, single word), `djb2AvatarColor` (deterministic, palette bounds), `formatWaitTime` (minutes), `formatLtv` (cents), `resolveAIBudgetState` (ok/degraded/paused ratios). Screen smoke tests: `StaffTodayScreen` (default, light-day, no-day, loading, error), `StaffCalendarScreen` (day selection, empty-day), `WalkInQueueScreen` (queue items, empty), `ClientLookupScreen` (search-results, no-results), `ClientDetailScreen` (VIP flag, contact row), `ClientNotesHistoryScreen` (note list, private badge), `AIChatScreen` (chat/suggestions/budget-info views, degraded/paused overlays). |

## 4. Security

- **No Firestore I/O from screens.** All screens are props-driven. No new security rules added or needed.
- **AI budget guard.** `AISuggestionCard` and `AIChatScreen` respect `AIBudgetState`. When `"paused"`, all AI action buttons are suppressed and replaced with paused-overlay copy. This enforces the W13–W14 AI budget guard at the UI layer without bypassing backend policy.
- **No PII stored or logged.** Client names, notes, and contact fields are display-only UI strings passed via props; no clipboard writes or network calls are made in the component layer.
- **WCAG 2.1 AA.** All interactive targets ≥ 44×44. Availability toggle has `accessibilityRole="switch"`. AI action buttons have accessible labels.

## 5. Debt Register

| ID | Description | Target |
|----|-------------|--------|
| **W27-DEBT-1** | **Staff app backend services** — Firestore `staffAppointments`, `clientProfiles`, `clientNotes` collections + security rules; `getStaffToday`, `getWeekSchedule`, `getWalkInQueue`, `lookupClients`, `getClientDetail`, `addClientNote` read/write ports. | Phase 3 backend pass |
| **W27-DEBT-2** | **AI chat backend** — Cloud Function `aiStaffChat` wiring: prompt context injection (booking history, AI budget check), LLM dispatch, streaming/batched response model. | Phase 4 AI pass |

Previously carried debts: W19-DEBT-4, W19-DEBT-5, W20-DEBT-2 through W20-DEBT-4, W22-DEBT-1, W22-DEBT-3, W23-DEBT-1, W23-DEBT-3, W24-DEBT-1 through W24-DEBT-3, W25-DEBT-1 through W25-DEBT-3, W26-DEBT-1 through W26-DEBT-3.

## 6. Index — Changed Files

### New (production)

**Shared types:**
- `src/shared/staffTypes.ts`

**Primitives — `src/shared/ui/`:**
- `QueueCard.tsx`
- `AISuggestionCard.tsx`

**Helper:**
- `src/app/staff/staffHelpers.ts`

**Screens:**
- `src/app/staff/StaffTodayScreen.tsx`
- `src/app/staff/StaffCalendarScreen.tsx`
- `src/app/staff/WalkInQueueScreen.tsx`
- `src/app/staff/ClientLookupScreen.tsx`
- `src/app/staff/ClientDetailScreen.tsx`
- `src/app/staff/ClientNotesHistoryScreen.tsx`
- `src/app/staff/AIChatScreen.tsx`

### Updated (production)

- `src/shared/ui/index.ts` — W27 Batch G exports appended.

### New (test)

- `src/app/staff/__tests__/staffScreens.test.tsx`

## 7. Blockers for Week 28

None. All W27 screens are complete and green. W28 (Batch H — Marketplace Consumer Extensions) is unblocked.
