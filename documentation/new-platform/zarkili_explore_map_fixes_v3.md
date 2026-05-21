# Zarkili — Explore Map View Fix Spec v3

**Version:** 3.0 — rewritten after second screenshot review
**Fixes from v1 already working:** price text (£35/£45/£55/£75), list view button styling
**Zoom:** correct — do not change
**New fix added:** pins must be per location, not per service

---

## Bug inventory

| # | Bug | Severity |
|---|-----|----------|
| 1 | One pin per service (13 pins) instead of one pin per location (5 pins) | Critical |
| 2 | Map toggle button shows hamburger ≡ — wrong semantic | High |
| 3 | No user location blue dot | High |
| 4 | Pin bubble floating above disconnected diamond — anchor wrong | High |
| 5 | Google POI icons competing with service pins | Medium |

---

## Fix 1 — One pin per location, not per service ← most important

### Problem

The map is rendering one `<Marker>` per service type, producing 13 pins for
13 services. There are only 5 salons/locations. The correct behaviour is
**one pin per location**. Tapping a location pin opens a compact bottom sheet
listing all services available at that location.

### Why this matters

A user browsing the map is asking "where can I go?" not "which individual
service type is closest?" Multiple overlapping pins for the same address
is visually confusing and functionally redundant. The location is the
navigational unit. The services are discovered once the user taps the pin.

### Data transformation

Before rendering markers, group the flat services array by `locationId`:

```ts
// utils/groupServicesByLocation.ts

interface LocationPin {
  locationId:      string
  locationLat:     number
  locationLng:     number
  locationName:    string    // e.g. "Glam Studio · Shoreditch"
  brandId:         string
  services:        ServiceCardObject[]
  lowestPrice:     number    // MIN(services.priceFrom) — shown on the bubble
  serviceCount:    number    // total services at this location
}

export const groupServicesByLocation = (
  services: ServiceCardObject[]
): LocationPin[] => {
  const map = new Map<string, LocationPin>()

  for (const service of services) {
    const existing = map.get(service.locationId)

    if (existing) {
      existing.services.push(service)
      existing.serviceCount += 1
      // Keep the lowest price across all services at this location
      if (service.priceFrom < existing.lowestPrice) {
        existing.lowestPrice = service.priceFrom
      }
    } else {
      map.set(service.locationId, {
        locationId:   service.locationId,
        locationLat:  service.locationLat,
        locationLng:  service.locationLng,
        locationName: service.locationDisplayName,
        brandId:      service.brandId,
        services:     [service],
        lowestPrice:  service.priceFrom,
        serviceCount: 1,
      })
    }
  }

  return Array.from(map.values())
}
```

### Rendering — 5 pins not 13

```jsx
// ExploreMapView.tsx
import { groupServicesByLocation } from '@/utils/groupServicesByLocation'

const ExploreMapView = ({ services, onPinPress }) => {
  const locationPins = groupServicesByLocation(services)
  // services.length === 13  →  locationPins.length === 5  ✓

  return (
    <MapView ...>
      {locationPins.map(pin => (
        <Marker
          key={pin.locationId}
          coordinate={{ latitude: pin.locationLat, longitude: pin.locationLng }}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}
          onPress={() => onPinPress(pin)}
        >
          <MapLocationBubble
            lowestPrice={pin.lowestPrice}
            serviceCount={pin.serviceCount}
          />
        </Marker>
      ))}
    </MapView>
  )
}
```

### Updated bubble — MapLocationBubble

The bubble now shows the location's lowest price with a "from" prefix
(always applicable since a location has multiple services at different prices)
plus an optional service count badge.

```tsx
// components/MapLocationBubble.tsx
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface MapLocationBubbleProps {
  lowestPrice:  number    // pence — lowest priceFrom across all services here
  serviceCount: number    // total services at this location
  isSelected?:  boolean
}

export const MapLocationBubble = ({
  lowestPrice,
  serviceCount,
  isSelected = false,
}: MapLocationBubbleProps) => {
  const pounds = Math.floor(lowestPrice / 100)
  const label  = `from £${pounds}`

  return (
    <View style={styles.container}>
      <View style={[styles.bubble, isSelected && styles.bubbleSelected]}>
        <Text
          style={[styles.label, isSelected && styles.labelSelected]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {serviceCount > 1 && (
          <View style={[styles.countBadge, isSelected && styles.countBadgeSelected]}>
            <Text style={[styles.countText, isSelected && styles.countTextSelected]}>
              {serviceCount}
            </Text>
          </View>
        )}
      </View>
      {/* Downward caret — tip touches the map coordinate */}
      <View style={[styles.caret, isSelected && styles.caretSelected]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F4C0D1',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  bubbleSelected: {
    backgroundColor: '#D4537E',
    borderColor: '#993556',
  },
  label: {
    color: '#993556',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  countBadge: {
    backgroundColor: '#FBEAF0',
    borderRadius: 8,
    minWidth: 16,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: 'center',
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  countText: {
    color: '#993556',
    fontSize: 9,
    fontWeight: '700',
  },
  countTextSelected: {
    color: '#FFFFFF',
  },
  // CSS triangle caret — tip is the bottom of this container
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F4C0D1',
  },
  caretSelected: {
    borderTopColor: '#993556',
  },
})
```

**What the bubble shows:**

| Location | Services | Bubble |
|----------|---------|--------|
| Glam Studio · Shoreditch | 4 services, cheapest £35 | `from £35  4` |
| Luna Studio | 1 service, £48 | `from £48` (no count badge for single service) |

### Pin tap → compact location card

Tapping a pin opens a bottom sheet for that **location** — not a single service.
The sheet shows all services available at that location.

```jsx
// MapLocationCard.tsx — compact bottom sheet opened on pin tap
const MapLocationCard = ({ pin, onClose, onBook }) => (
  <BottomSheet onClose={onClose} snapPoint="40%">
    <Text style={styles.locationName}>{pin.locationName}</Text>
    <Text style={styles.serviceCount}>{pin.serviceCount} services available</Text>

    {/* Show first 2 services inline */}
    {pin.services.slice(0, 2).map(service => (
      <ServiceRow
        key={service.id}
        name={service.serviceName}
        price={service.priceFrom}
        variantCount={service.variantCount}
        nextAvailable={service.nextAvailableAt}
        onBook={() => onBook(service)}
      />
    ))}

    {/* If more than 2 services, show a link */}
    {pin.serviceCount > 2 && (
      <TouchableOpacity onPress={() => navigateToLocationProfile(pin.locationId)}>
        <Text style={styles.viewAll}>
          View all {pin.serviceCount} services at {pin.locationName} →
        </Text>
      </TouchableOpacity>
    )}
  </BottomSheet>
)
```

---

## Fix 2 — Map toggle icon: hamburger → correct icon

### Problem
The `≡` hamburger icon universally means "open navigation menu". Users will
expect it to open a settings drawer, not toggle to list view. It must change.

### Fix

```jsx
// ExploreHeader.tsx
import { Feather } from '@expo/vector-icons'

const MapToggleButton = ({ isMapView, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    style={styles.toggleBtn}
    accessibilityRole="button"
    accessibilityLabel={isMapView ? 'Switch to list view' : 'Switch to map view'}
  >
    {isMapView
      ? <Feather name="list"    size={18} color="#993556" />
      : <Feather name="map-pin" size={18} color="#993556" />
    }
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  toggleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E2E0DA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
})
```

| State | Icon | `accessibilityLabel` |
|-------|------|---------------------|
| Currently in map view | `feather:list` | "Switch to list view" |
| Currently in list view | `feather:map-pin` | "Switch to map view" |

---

## Fix 3 — User location blue dot

### Problem
`showsUserLocation={true}` is set but the dot is not visible. This is a
permissions sequencing issue — the prop is silently ignored when
`requestForegroundPermissionsAsync()` has not been awaited before the
`MapView` renders.

### Fix

```ts
// hooks/useUserLocation.ts
import * as Location from 'expo-location'
import { useState, useEffect } from 'react'

export const useUserLocation = () => {
  const [coords, setCoords]               = useState<{lat: number, lng: number} | null>(null)
  const [permissionGranted, setGranted]   = useState(false)

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return

      setGranted(true)
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude })
    })()
  }, [])

  return { coords, permissionGranted }
}
```

```jsx
// In ExploreMapView
const { coords, permissionGranted } = useUserLocation()

<MapView
  showsUserLocation={permissionGranted}    // only true once permission confirmed
  showsMyLocationButton={false}
  ...
>
```

### app.json — required for expo-location on native

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationWhenInUsePermission":
            "Zarkili needs your location to show services near you."
        }
      ]
    ]
  }
}
```

Run `npx expo prebuild` after adding this.

---

## Fix 4 — Pin anchor: bubble disconnected from coordinate

### Problem
The price bubble floats above a separate Google Maps default diamond pin.
They are two separate visual elements when they should be one.

The cause is `anchor` prop missing or wrong on `<Marker>`, leaving the
default anchor at the top-centre of the component instead of the
bottom-centre where the caret tip is.

### Fix

Set `anchor={{ x: 0.5, y: 1 }}` on every `<Marker>`.

```
anchor={{ x: 0.5, y: 0 }}   top-centre sits on coordinate
anchor={{ x: 0.5, y: 0.5 }} centre sits on coordinate
anchor={{ x: 0.5, y: 1 }}   bottom-centre (caret tip) sits on coordinate ✓
```

```jsx
<Marker
  key={pin.locationId}
  coordinate={{ latitude: pin.locationLat, longitude: pin.locationLng }}
  anchor={{ x: 0.5, y: 1 }}        // ← this is the fix
  tracksViewChanges={false}         // ← always set this — prevents performance drops
  onPress={() => onPinPress(pin)}
>
  <MapLocationBubble ... />
</Marker>
```

The `MapLocationBubble` component in Fix 1 already includes the caret as
part of the component's own `View` tree, so the caret tip is the bottom of
the component and aligns with the coordinate when `anchor={{ x: 0.5, y: 1 }}`.

Also ensure no `<Callout>` component wraps the bubble. `<Callout>` is a
separate react-native-maps overlay that renders independently and was likely
causing the disconnected diamond behaviour.

---

## Fix 5 — Mute Google POI layer

### Problem
Purple museum icons and green park POI icons compete visually with service
pins, especially at the zoom level used for neighbourhood browsing.

### Fix

Pass `customMapStyle` to `MapView`. This requires `provider="google"` on
both platforms.

```ts
// constants/mapStyle.ts
export const ZARKILI_MAP_STYLE = [
  // Hide POI icons (museums, parks, restaurants, landmarks)
  {
    featureType: 'poi',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  // Hide POI text labels
  {
    featureType: 'poi',
    elementType: 'labels.text',
    stylers: [{ visibility: 'off' }],
  },
  // Slightly desaturate base map — service pins pop more
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ saturation: -25 }],
  },
  // Keep transit (tube stations aid orientation — remove if not wanted)
  {
    featureType: 'transit',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'simplified' }],
  },
]
```

```jsx
// ExploreMapView.tsx
import { PROVIDER_GOOGLE } from 'react-native-maps'
import { ZARKILI_MAP_STYLE } from '@/constants/mapStyle'

<MapView
  provider={PROVIDER_GOOGLE}              // required on iOS for customMapStyle
  customMapStyle={ZARKILI_MAP_STYLE}
  showsUserLocation={permissionGranted}
  showsMyLocationButton={false}
  ...
>
```

> Requires a Google Maps API key configured for iOS in `app.json`:
> ```json
> "ios": { "config": { "googleMapsApiKey": "YOUR_IOS_KEY" } }
> ```

---

## Implementation order

```
1. Fix 1 — groupServicesByLocation + MapLocationBubble + MapLocationCard
   Most impactful. 13 pins → 5 pins. Fixes the core data model mismatch.

2. Fix 4 — anchor={{ x: 0.5, y: 1 }} on every <Marker>
   Do this immediately after Fix 1 so new pins render correctly.

3. Fix 3 — useUserLocation hook + app.json permissions
   Blue dot will appear once permissions flow is correct.

4. Fix 5 — customMapStyle
   Reduces visual noise. Do after pins look correct so you can evaluate clearly.

5. Fix 2 — toggle icon swap
   Cosmetic. Any order, takes 5 minutes.
```

---

## What does NOT change

| Element | Status |
|---------|--------|
| Default zoom level | Correct — do not change |
| Price text format (£35, £45…) | Already fixed in v1 |
| List view button styling | Already fixed in v1 |
| "13 services nearby" count pill | Keep as-is — shows total services, not pins |
| Map library (react-native-maps) | No change needed |

> **Note on the result count pill:** "13 services nearby" is correct.
> It counts available services, not location pins. A user wants to know
> how many services they can book — not how many buildings have salons.
> Keep the service count in the pill, not the location count.

---

*End of fix spec v3 — Zarkili Explore Map View*
*Parent spec: `zarkili_explore_tab_spec_v2.md` §3.8*
