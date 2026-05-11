# Week 22 Close Report — Batch B: Discover, Explore, Profile (Consumer UI)

**Window:** Week 22 (Phase 2 consumer-UI second sprint).
**Status:** ✅ Complete — all 8 screens (B.1–B.8) and all 7 new shared-UI primitives delivered + tested — GO for Week 23.
**Predecessor:** [WEEK21_CLOSE_REPORT.md](WEEK21_CLOSE_REPORT.md).

## 1. Scope

Per [PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md](PHASE2_CONSUMER_UI_PLAN_WEEKS_21_TO_32.md) and the Batch-B build spec at [../figma-prompts/BATCH_B_DISCOVER_EXPLORE_PROFILE.md](../figma-prompts/BATCH_B_DISCOVER_EXPLORE_PROFILE.md), W22 ships the consumer Discover, Explore (search + results + filters + map), and Salon / Service / Staff profile surfaces.

Per [FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md](FIGMA_SCREEN_REQUEST_PRIORITY_LIST.md) line 86, Batch B is `code-only` — no Figma blocker. Backend ports already exist (`createDiscoveryService` from W17 + Phase-2 scaffold); W22 composes screens against the live `appDiscoveryService` runtime singleton.

W22 also includes a thin pure-logic helper module `discoveryFilters.ts` so filter + sort behaviour is unit-testable without a renderer.

## 2. Features Delivered

### 2.1 Foundation — `src/shared/ui/` (7 new primitives)

| Primitive | Surface |
|-----------|---------|
| `RatingStars` | Read-only or interactive (`adjustable` role) star rating, half-star support, sizes 16 / 20 / 32 |
| `RangeSlider` | Single-thumb (`value`) or dual-thumb (`range: [lo, hi]`) variant, Pressable +/- buttons (no gesture-lib dep), `accessibilityRole="adjustable"`, `formatValue` hook |
| `FilterSheet` | Modal bottom-sheet wrapper (drag handle + scrollable body + sticky footer), reset / apply / scrim handlers, composable children |
| `GalleryCarousel` | Horizontal paged FlatList with page dots, alt-text per item, `onPressItem(item, index)` |
| `SalonHeroCard` | 16:9 hero image + bottom scrim + name + `RatingStars` + meta + hours + favorite toggle (♥ / ♡) at top-right |
| `StaffAvatarList` | Horizontal scroll of avatar + name + specialty rows; selected variant draws a 2px coral-blossom ring |
| `StickyCtaBar` | Surface-white container, top border, bottom safe-area approximation; primary `Button` (fullWidth) + optional secondary inline `Button` |

All primitives reuse W21 design tokens unchanged (`src/shared/ui/tokens.ts`). All are props-driven, have no business knowledge, and are reusable for Batch C onward.

### 2.2 Pure helpers — `src/app/discover/discoveryFilters.ts`

Domain-typed filter + sort module operating on `DiscoverySalonCard[]`. Exports:

- `DiscoveryFilters` (query / category / `priceRange [lo,hi]` / minRating / availability / memberOnly / sort)
- `DEFAULT_FILTERS` constant
- `applyDiscoveryFilters` — boolean-AND of all filter dimensions
- `sortDiscoveryResults` — `recommended` (members → rating → review count) | `rating-desc` | `price-asc` | `price-desc`
- `applyDiscoveryFiltersAndSort` — convenience pipeline
- `hasActiveFilters` / `countActiveFilterDimensions` — chip-row + reset affordances

Zero React imports — fully testable without a renderer. `AvailabilityWindow` covers `any` / `today` / `tomorrow` / `this-week` and matches both label substrings and weekday tokens.

### 2.3 Screens — `src/app/discover/` (8 screens)

| Screen | File | Composition |
|--------|------|-------------|
| **B.1 Home** | `HomeScreen.tsx` | Greeting + search entry + category-pill scroll + featured-salons row + recent-bookings row. Consumes `DiscoveryHomeFeed`. |
| **B.2 Discover Feed** | `DiscoverFeedScreen.tsx` | Vertical mixed-card feed: salon cards, sponsored cards (with FTC `Sponsored · {name}` badge), editorial cards. |
| **B.3 Explore Search Results** | `ExploreSearchResultsScreen.tsx` | Search-bar header + `Filters · N` toolbar + `Map` toggle + result count + list. Filtering routed through `applyDiscoveryFiltersAndSort`. Empty-state when no matches. |
| **B.4 Filter Sheet** | `FilterSheetScreen.tsx` | Composes `FilterSheet` + `RangeSlider` + `RatingStars` + category / availability / sort pills + members-only `Switch`. Live result count in apply button via `applyDiscoveryFilters`. |
| **B.5 Salon Profile** | `SalonProfileScreen.tsx` | `SalonHeroCard` + ADA-accessible badge + 5-tab strip (Services / Staff / Reviews / Gallery / About) + sticky `StickyCtaBar` (`Book now` primary, `Message` secondary when enabled). |
| **B.6 Service Detail** | `ServiceDetailScreen.tsx` | Hero + duration + price + description + `StaffAvatarList` + add-on multi-select rows + sticky `Choose time`. |
| **B.7 Staff Member Detail** | `StaffMemberDetailScreen.tsx` | Bio + rating + years-of-experience + `GalleryCarousel` portfolio + sticky `Book with {firstName}`. |
| **B.8 Explore Map** | `ExploreMapScreen.tsx` | **Deferred-stub.** Placeholder card with `Switch to list` CTA + visible "Map view coming Week 28" notice. Native map integration deferred to W28 to keep W22 free of `react-native-maps` + native config. |

### 2.4 Routes

Eight new public `guard: "none"` routes appended to `src/app/navigation/routes.ts`:

```
DiscoverHome      /discover/home
DiscoverFeed      /discover/feed
ExploreResults    /discover/explore
ExploreMap        /discover/explore/map
DiscoverFilters   /discover/filters
SalonProfile      /discover/salon
ServiceDetail     /discover/service
StaffDetail       /discover/staff
```

`__tests__/routes.test.ts` anonymous-route snapshot updated.

## 3. Tests

| Gate | Before | After | Delta |
|------|--------|-------|-------|
| Root jest | 1,808 / 117 suites | **1,844 / 121 suites** | +36 tests, +4 suites |
| Functions vitest | 187 / 14 suites | **187 / 14 suites** | unchanged (Batch B is consumer-UI only) |
| `npx tsc --noEmit` (root) | 0 errors | 0 errors | — |
| `cd functions; npx tsc --noEmit` | 0 errors | 0 errors | — |

New suites:
- `src/shared/ui/__tests__/discovery-primitives.test.tsx` — RatingStars, RangeSlider single + dual, GalleryCarousel, SalonHeroCard, StaffAvatarList, StickyCtaBar
- `src/shared/ui/__tests__/FilterSheet.test.tsx` — visibility / reset / apply handlers
- `src/app/discover/__tests__/discoveryFilters.test.ts` — every filter dimension + every sort + helper counters
- `src/app/discover/__tests__/discoverScreens.test.tsx` — smoke tests for all 8 W22 screens

## 4. Security

- No Firestore rules changes. Discovery screens are read-only consumers of `appDiscoveryService`; visibility filters live in the existing repository layer (W17 marketplace guardrails).
- **FTC labelling.** Sponsored cards render a clear `Sponsored · {sponsorName}` badge per FTC endorsement guidelines.
- **Anti-client-theft.** Discovery feeds and the W22 surfaces never bypass the W17 `assertNoCompetitorRecommendations` rule — recommendations would still be subject to the booking-funnel context check at the booking layer.
- **Accessibility.** WCAG 2.1 AA preserved: every interactive element ≥ 44×44 hit target, RatingStars rendered with `accessibilityRole="image"` (read-only) or `"adjustable"` (interactive), star rows include `accessibilityLabel` with rating + review count, ADA-accessible badge surfaces on salon profile when applicable, alt text required on every gallery item.
- **US-primary defaults.** $ for all price labels, miles for distance, MM/DD/YYYY for any explicit dates, 5-digit ZIP elsewhere — none of those are in the W22 critical path (price + city only) but the convention is preserved.

## 5. Architectural Notes

- All screens are props-driven, accept their data as inputs (the `appDiscoveryService` singleton is wired at the navigator level — not imported from inside screens), so unit tests render without provider scaffolding.
- `discoveryFilters.ts` is intentionally pure (no React, no I/O) so the same filter / sort logic could later be hoisted into the repository layer for server-side filtering without rewriting the screens.
- `RangeSlider` deliberately uses Pressable +/- buttons rather than the gesture handler library — keeps W22 free of native dependencies and gives free `accessibilityRole="adjustable"` semantics.
- `ExploreMapScreen` is intentionally a stub. Pulling `react-native-maps` would require Expo prebuild + a native dev-client rebuild, which is out of scope for this consumer-UI sprint. The stub still surfaces meaningful copy and a `Switch to list` escape hatch so UX is non-blocking.

## 6. Debt Register

- **Closed (0).** No carry-over debts from Phase 1 / Phase 2 backend pass closed this week.
- **New W22 debts:**
  - **W22-DEBT-1** — `ExploreMapScreen` is a placeholder. Wire `react-native-maps` (or Expo's `expo-maps`) and the salon-pin layer in W28 per Phase 2 plan.
  - **W22-DEBT-2** — `SalonProfileScreen` accepts `services` / `staff` / `reviews` / `gallery` arrays as inputs but the discovery service does not yet expose those collections. Need a `getSalonProfile(salonId)` port + Firestore-backed adapter. Target: W23 along with the booking-funnel handoff.
  - **W22-DEBT-3** — `DiscoverFeedItem` accepts editorial + sponsored cards but neither has a backing repository surface yet. Target: W23 (editorial feed authored from admin), Phase 3 W34 for sponsored placements (paid-marketplace flow).
- **Carried forward:** W19-DEBT-4 (analytics job), W19-DEBT-5 (chat-assistance feature key promotion, telemetry-driven), W20-DEBT-2, W20-DEBT-3, W20-DEBT-4.

## 7. Index — Changed Files

**New (production):**
- `src/shared/ui/{RatingStars,RangeSlider,FilterSheet,GalleryCarousel,SalonHeroCard,StaffAvatarList,StickyCtaBar}.tsx`
- `src/app/discover/{HomeScreen,DiscoverFeedScreen,ExploreSearchResultsScreen,FilterSheetScreen,SalonProfileScreen,ServiceDetailScreen,StaffMemberDetailScreen,ExploreMapScreen}.tsx`
- `src/app/discover/discoveryFilters.ts`

**New (tests):**
- `src/shared/ui/__tests__/discovery-primitives.test.tsx`
- `src/shared/ui/__tests__/FilterSheet.test.tsx`
- `src/app/discover/__tests__/discoveryFilters.test.ts`
- `src/app/discover/__tests__/discoverScreens.test.tsx`

**Modified:**
- `src/shared/ui/index.ts` — appended W22 primitive exports + types
- `src/app/navigation/routes.ts` — +8 public B.* routes
- `src/app/navigation/__tests__/routes.test.ts` — anonymous-route snapshot updated
- `documentation/new-platform/WEEKLY_LOG.md` — this entry
- `documentation/PROGRAM_TRACKING_BOARD.md` — D-098 appended

## 8. Next-Week Prerequisites (Week 23)

W23 (Batch C — Booking Flow) inherits W21 + W22 primitives unchanged plus the new pure `discoveryFilters` helper for any list-screen reuse. The W22-DEBT-2 `getSalonProfile(salonId)` port is the lead-in dependency for the salon-detail → booking funnel handoff. Editorial / sponsored feed adapters (W22-DEBT-3) can land alongside W23 admin-feed seeding or be deferred to W34 without blocking the booking funnel.

