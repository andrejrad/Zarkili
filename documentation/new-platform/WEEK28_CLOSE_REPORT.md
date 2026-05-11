# Week 28 Close Report — Batch H: Marketplace Consumer Extensions (Consumer UI)

**Window:** Week 28 (Phase 2 consumer-UI eighth sprint).
**Status:** ✅ Complete — all 4 screens (H.1–H.4), 3 shared-UI primitives, and 1 test suite delivered — GO for Week 29.
**Predecessor:** [WEEK27_CLOSE_REPORT.md](WEEK27_CLOSE_REPORT.md).

## 1. Scope

W28 delivers the marketplace consumer extension layer: a post detail deep-dive, a saved-posts collection, a share sheet, and a "Book This Look" booking-context handoff — plus 3 new shared-UI primitives (`PostCard`, `SaveToggle`/`SavedToast`, `ShareTargetRow`) that anchor the social-commerce interaction model.

W28 is entirely `code-only`. Batch H screens follow card/sheet/social patterns; no Figma design-handoff pass was required.

All screens are props-driven with no Firestore I/O. The navigator layer wires live data when Phase 3 backend services ship.

## 2. Features Delivered

### 2.1 Foundation — `src/shared/ui/` (3 new primitives)

| Primitive | Surface |
|-----------|---------|
| `PostCard` | Marketplace post card. Hero image (aspect-ratio 4:3) with gradient scrim overlay (uses `rgba(0,0,0,0.40)` View in place of `LinearGradient` — see W28-DEBT-1). `title`, `tags` chip row (up to 3 visible), `salonName` + optional `salonVerified` badge, `likeCount`, `saveCount`. `SaveToggle` wired at top-right. `onPress`, `onSave`, `onShare` callbacks. `testID` forwarded to root View. |
| `SaveToggle` / `SavedToast` | Dual export from `SaveToggle.tsx`. `SaveToggle`: animated heart icon (filled primary vs outline muted); `isSaved`, `onToggle`, `testID` props. `SavedToast`: ephemeral bottom toast banner (`"Saved to collection"` / `"Removed from collection"`); `visible`, `saved` props; auto-dismissed by caller after 2 s. |
| `ShareTargetRow` | Horizontal scrollable row of share-target avatar chips. Each chip: 40 px circle with `initials` + deterministic `djb2AvatarColor` tint, `selected` ring in coral-blossom, `onPress`. `testID` forwarded to root View. |

All primitives reuse W21 design tokens (`src/shared/ui/tokens.ts`) unchanged and are fully props-driven.

### 2.2 Screens — `src/app/marketplace/` (4 new screens)

| # | Screen | File | Composition |
|---|--------|------|-------------|
| H.1 | **Marketplace Post Detail** | `MarketplacePostDetailScreen.tsx` | Full-screen image hero + `SaveToggle` overlay. Tags chip row. Salon mini-card with `verified` badge + "Book" CTA. Description body. Related-posts horizontal strip. Share FAB → opens `ShareSheetScreen` in `ModalSheet`. States: `default \| loading \| error`. |
| H.2 | **Saved Posts** | `SavedPostsScreen.tsx` | Collection view of saved posts as `PostCard` tiles. `SegmentedControl` filter: All / Hair / Nails / Skin / Other. Empty-collection state with illustration copy. `SaveToggle` on each card unsaves inline. States: `default \| loading \| error`. |
| H.3 | **Share Sheet** | `ShareSheetScreen.tsx` | Bottom sheet content (parent renders in `ModalSheet`). Header "Share post". `ShareTargetRow` for app contacts. System apps icon row (Messages, Instagram, WhatsApp, More). Action row: Copy Link · Save Image · Report Post. Optional message note `TextInput`. States: `default \| link-copied \| sending \| error`. |
| H.4 | **Book This Look** | `BookThisLookScreen.tsx` | Deep-link handoff flow from marketplace post to booking. Post mini-card context at top. Matched-services list (service name + price + availability chip). Staff selector strip. `StickyCtaBar` "Book This Look" CTA. States: `default \| loading \| error \| no-match`. |

### 2.3 Index

`src/shared/ui/index.ts` updated with W28 Batch H exports:
```typescript
// W28 Batch H primitives — Marketplace Consumer
export { PostCard } from "./PostCard";
export type { PostCardProps } from "./PostCard";
export { SaveToggle, SavedToast } from "./SaveToggle";
export type { SaveToggleProps, SavedToastProps } from "./SaveToggle";
export { ShareTargetRow } from "./ShareTargetRow";
export type { ShareTargetRowProps } from "./ShareTargetRow";
```

## 3. Tests

- **Root jest:** 2,194 → **2,236** passing across 139 → **140** suites (+42 tests, +1 suite).
- **`npx tsc --noEmit`** (root): 0 errors.

| Suite | Path | Coverage |
|-------|------|---------|
| `marketplaceScreens` | `src/app/marketplace/__tests__/marketplaceScreens.test.tsx` | Primitive smoke tests: `PostCard` (default render, tags truncation, onSave/onShare callbacks), `SaveToggle` (saved/unsaved states, toggle callback), `SavedToast` (visible/hidden, saved/removed copy), `ShareTargetRow` (chip renders, selected ring, onPress callback). Screen smoke tests: `MarketplacePostDetailScreen` (default, loading, error), `SavedPostsScreen` (items, empty-collection, unsave inline), `ShareSheetScreen` (link-copied toast, report action, note input), `BookThisLookScreen` (services list, no-match state, Book CTA). |

## 4. Security

- **No Firestore I/O from screens.** All screens are props-driven. No new security rules added or needed.
- **Marketplace guardrails enforced at data layer.** `BookThisLookScreen` accepts a `matchedServices` prop pre-filtered by the Phase-2 `discoveryService` / `guardrailsService` (W17); no cross-tenant or competitor-recommendation data can reach this prop in production wiring.
- **No user-generated content stored from screen layer.** Share note `TextInput` value is passed via `onPressSend` callback; the screen does not write directly to any storage.
- **WCAG 2.1 AA.** All interactive targets ≥ 44×44. `SaveToggle` has `accessibilityLabel` reflecting saved state. `ShareTargetRow` chips have accessible labels from `name`.

## 5. Debt Register

| ID | Description | Target |
|----|-------------|--------|
| **W28-DEBT-1** | **`PostCard` gradient scrim** — production should use `expo-linear-gradient` `<LinearGradient>` instead of the current `rgba(0,0,0,0.40)` View overlay. Deferred because adding `expo-linear-gradient` to the dependency tree was out of scope for a code-only week. | W30 polish pass or Phase 3 |
| **W28-DEBT-2** | **Marketplace backend persistence** — `savedPosts` Firestore collection + `savePost` / `unsavePost` Cloud Functions; `getSharedPost` read port for deep-link resolution. | Phase 3 backend pass |

Previously carried debts: W19-DEBT-4, W19-DEBT-5, W20-DEBT-2 through W20-DEBT-4, W22-DEBT-1, W22-DEBT-3, W23-DEBT-1, W23-DEBT-3, W24-DEBT-1 through W24-DEBT-3, W25-DEBT-1 through W25-DEBT-3, W26-DEBT-1 through W26-DEBT-3, W27-DEBT-1, W27-DEBT-2.

## 6. Index — Changed Files

### New (production)

**Primitives — `src/shared/ui/`:**
- `PostCard.tsx`
- `SaveToggle.tsx`
- `ShareTargetRow.tsx`

**Screens:**
- `src/app/marketplace/MarketplacePostDetailScreen.tsx`
- `src/app/marketplace/SavedPostsScreen.tsx`
- `src/app/marketplace/ShareSheetScreen.tsx`
- `src/app/marketplace/BookThisLookScreen.tsx`

### Updated (production)

- `src/shared/ui/index.ts` — W28 Batch H exports appended.

### New (test)

- `src/app/marketplace/__tests__/marketplaceScreens.test.tsx`

## 7. Blockers for Week 29

None. All W28 screens are complete and green. W29 (Batch I — Legal, Lifecycle, Settings, Auth Edges) is unblocked.
