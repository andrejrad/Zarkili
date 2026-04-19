# Navigation Public and Protected (Week 1)

## Route groups
- Public routes:
  - `Landing` (`/`)
  - `Login` (`/login`)
  - `Register` (`/register`)
  - `DiscoverBusinesses` (`/discover`)
- Protected routes:
  - `AppShell` (`/app`)

## Guard policy
- `none`: always accessible.
- `authenticated`: requires `userId` in auth context.

Only `AppShell` is protected in this Week 1 vertical slice.

## Preferred route behavior
- Anonymous user resolves to `Landing`.
- Authenticated user resolves to `AppShell`.

## Feature flag behavior
- `marketplaceEnabled` is defined in shared config and defaults to `false`.
- `DiscoverBusinesses` route still exists in public navigation, but UI shows a "Coming soon" placeholder when disabled.

## Runtime notes
- Runtime shell uses route contracts in `src/app/navigation/routes.ts`.
- When auth state changes and current route becomes inaccessible, shell redirects to preferred route.
- Route contracts now include path-based helpers for deep-link-safe resolution:
  - `getRouteByPath(path)`
  - `canAccessPath(path, context)`
  - `resolveRouteFromPath(path, context)`
- Unknown or unauthorized paths are resolved to the preferred safe route (`Landing` for anonymous, `AppShell` for authenticated users).

## Web Runtime Contract
- On web, browser pathname is treated as a first-class route input.
- Shell resolves initial route from `location.pathname` through `resolveRouteFromPath(...)`.
- Shell pushes history path updates when route state changes internally.
- Shell listens to `popstate` and re-resolves guarded route state for back/forward navigation.
- Unauthorized or unknown browser paths are redirected to safe preferred routes using the same guard semantics as native runtime.
