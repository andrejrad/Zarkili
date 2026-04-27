# Discovery Scaffold (Week 2.5)

## Scope
- Route: `DiscoverBusinesses` (`/discover`)
- Route: `TenantPublicProfile` (`/discover/tenant-profile`) placeholder
- UI states: loading, error, empty-results
- Directory interactions:
  - Search by salon name, city, or featured service
  - Filter by category chips
  - Filter by city chips
  - `Book` CTA branch by `bookingEnabled`

## Current Data Contract
Discovery cards use the domain model from `src/domains/discovery/model.ts`:
- `id`, `tenantId`, `name`, `city`
- `categories[]`, `rating`, `reviewCount`
- `priceFrom`, `currency`, `nextAvailableLabel`, `featuredService`
- `member`, `bookingEnabled`, `messageEnabled`

## Current Runtime Source
Discovery feeds are loaded through the injected `DiscoveryService` in `AppNavigatorShell`.
- Home feed: `getHomeFeed()`
- Explore feed: `getExploreFeed()`

This scaffold currently works with the existing repository-backed service and supports mocked service injection in tests.

## Booking CTA Behavior
- If `bookingEnabled === true`: navigate to `TenantPublicProfile` placeholder and preserve selected tenant ID in shell state.
- If `bookingEnabled === false`: stay on discover route and show a local coming-soon notice.

## Placeholder Route Contract
`TenantPublicProfile` is a temporary route used for handoff completion and navigation proof.
- Shows selected tenant ID from discover card tap.
- Includes a return action back to discover.

## Migration Plan (Firestore/API)
1. Replace shell-local selected tenant state with route params or deep-link payload once router supports parameterized paths.
2. Replace placeholder profile screen with real tenant public profile feature module.
3. Keep `DiscoveryService` as integration boundary and switch implementation details behind it:
   - Firestore read model now
   - API read model later (no UI contract change)
4. Preserve tests for `bookingEnabled` true/false behavior while swapping backend implementation.

## Verification Checklist
- Discover route renders cards from service feed.
- Search and chips narrow visible results.
- No-match query shows empty-results message.
- Feed failure shows retry panel and error copy.
- Enabled booking navigates to placeholder route.
- Disabled booking shows coming-soon notice in-place.
