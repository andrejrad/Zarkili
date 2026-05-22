# CLAUDE.md — src/app/

This directory is the **application layer**: screens, navigation shell, providers, and runtime composition. No business logic lives here — all domain work is in `src/domains/`.

## AppNavigatorShell.tsx — hard rules

This file is ~12,900 lines. **It must not be restructured.** Previous attempts to split it re-introduced effect ordering bugs.

Permitted operations:
- Add a new render case in the route dispatch block
- Add a new route reference to the local state that drives the dispatch
- Wrap in a new provider that doesn't change the component tree order

Forbidden:
- Splitting into sub-navigators or child components that own state
- Moving the auth/tenant guard logic out of the shell
- Changing the order of `useEffect` calls

When you add a new screen, find an existing case for a nearby screen and model on it exactly.

## Adding a route (step by step)

1. Add the route to `src/app/navigation/routes.ts`:
   ```typescript
   { name: 'MyNewScreen', guard: 'authenticated', webPath: '/my-new-screen' }
   ```
   Guard values: `'none'` (public), `'authenticated'`, `'platform-admin'`.

2. In `AppNavigatorShell.tsx`, locate the dispatch block for the correct guard tier and add:
   ```typescript
   case 'MyNewScreen':
     return <MyNewScreen {...routeParams} />;
   ```

3. Create `src/app/{area}/MyNewScreen.tsx`. Inject services via the area's `useRuntime()` hook — never import from `firebase/*` directly.

4. Add a test in `src/app/{area}/__tests__/MyNewScreen.test.tsx` using a stubbed service.

## Tenant context pattern

When a booking or admin action requires switching tenant context mid-navigation, use the `salonContextPendingNav` pattern:

```typescript
// ✅ CORRECT — set pending nav first, then switch tenant
dispatch({ type: 'SET_PENDING_NAV', payload: { route: 'BookingFlow', params } });
setTenantId(targetTenantId);
// Shell detects the pending nav after the Firestore listener is ready and navigates then.
```

**Common mistake — will silently drop the navigation:**

```typescript
// ❌ WRONG — do not do this
setTenantId(targetTenantId);
navigate('BookingFlow', params); // listener not ready yet, nav is ignored
```

The Firestore listener for the new tenant is async. If you navigate synchronously after `setTenantId()`, the shell hasn't finished switching context and the route render will either show stale data or silently no-op.

Do not navigate directly. The shell guards against navigation before the tenant Firestore listener is ready.

## Runtime composition

Each area exposes a `runtime.ts` that wires Firebase adapters and returns a `useRuntime()` hook. In tests, replace the runtime with stubs — do not mock `firebase/*` at the module level from a screen test.

Area runtimes:
- `src/app/auth/runtime.ts`
- `src/app/booking/runtime.ts`
- `src/app/dashboard/runtime.ts`
- `src/app/loyalty/runtime.ts`
- `src/app/marketplace/runtime.ts`
- `src/app/messaging/runtime.ts`
- `src/app/notifications/runtime.ts`
- `src/app/payments/runtime.ts`
- `src/app/settings/runtime.ts` (AI budget admin)
- `src/app/analytics/runtime.ts`
- `src/app/platform-admin/runtime.ts`

## Test pattern (hook / component)

```typescript
// src/app/{area}/__tests__/useMyHook.test.tsx

import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';
import type { MyService } from '../myTypes';
import { useMyHook } from '../useMyHook';

// 1. Minimal Probe component — exposes hook output to the test
function Probe({ service }: { service: MyService }) {
  const { data, refresh } = useMyHook(service);
  return (
    <>
      <Text testID="data">{data ?? 'empty'}</Text>
      <TouchableOpacity onPress={refresh}><Text>refresh</Text></TouchableOpacity>
    </>
  );
}

// 2. Stub factory — implement only the methods the hook calls
function makeService(overrides: Partial<MyService> = {}): MyService {
  return {
    loadData: jest.fn().mockResolvedValue('result'),
    ...overrides,
  } as MyService;
}

// 3. Tests — one describe per behaviour boundary
describe('useMyHook', () => {
  it('loads data on mount', async () => {
    render(<Probe service={makeService()} />);
    await waitFor(() => expect(screen.getByTestId('data').props.children).toBe('result'));
  });

  it('shows empty when service returns null', async () => {
    render(<Probe service={makeService({ loadData: jest.fn().mockResolvedValue(null) })} />);
    await waitFor(() => expect(screen.getByTestId('data').props.children).toBe('empty'));
  });
});
```

## Deep links + web URL sync

Web URLs are derived from the `webPath` field in `routes.ts`. The shell syncs the browser URL on every navigation. Do not manipulate `window.history` directly — route through the shell's navigation dispatch.

## Accessibility required on all interactive elements

```typescript
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Book now"
  hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }} // if visual < 44pt
>
```

Minimum touch target: 44×44 pt. Use `hitSlop` when the visual element is smaller.
