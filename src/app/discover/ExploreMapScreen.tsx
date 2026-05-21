/**
 * ExploreMapScreen.tsx — Phase 6 Map view.
 *
 * One pin per unique locationId, labelled "from £N".
 * Tapping a pin opens a compact bottom sheet with the top service at that
 * location and a "View all services" link.
 * "Switch to list" is always visible as a floating button.
 *
 * Platform guards:
 *   - Native iOS/Android: real MapView + Marker
 *   - Web: "Map view not available on web" notice
 *
 * Requires EAS dev build + EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for live tiles.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, type MapStyleElement } from "react-native-maps";
import Svg, { Line } from "react-native-svg";
import * as Location from "expo-location";

import type { ServiceTypeCard } from "../../domains/discovery";
import { colors, radius, spacing, textStyles } from "../../shared/ui";

// ---------------------------------------------------------------------------
// Fix 5: Map style — suppress Google POI icons/labels, slight desaturation
// ---------------------------------------------------------------------------
const ZARKILI_MAP_STYLE = [
  { featureType: "poi", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "poi", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  // Fix 3: hide tube/rail/bus icons — transit is separate from poi
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "all", elementType: "geometry", stylers: [{ saturation: -25 }] },
] as const;

/** Simple 3-line list icon — matches Tabler ti-list stroke style. */
function ListLineIcon({ color = "#993556", size = 16 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="4" y1="6" x2="20" y2="6" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="4" y1="12" x2="20" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1="4" y1="18" x2="20" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LocationGroup = {
  locationId: string;
  locationDisplayName: string;
  lat: number;
  lng: number;
  lowestPriceFrom: number; // dollars
  /** True when multiple services exist at this location (or the top service has variants). */
  hasMultiplePrices: boolean;
  topService: ServiceTypeCard;
  allServices: ServiceTypeCard[];
};

export type ExploreMapScreenProps = {
  services: ServiceTypeCard[];
  onSwitchToList?: () => void;
  onPressService?: (card: ServiceTypeCard) => void;
  onViewAllAtLocation?: (locationId: string) => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fix 1: compact price label — no "from" prefix. Uses "+" for multi-variant locations. */
function formatPrice(price: number, hasMultiple: boolean): string {
  return hasMultiple ? `£${Math.floor(price)}+` : `£${Math.floor(price)}`;
}

function groupByLocation(services: ServiceTypeCard[]): LocationGroup[] {
  const map = new Map<string, LocationGroup>();
  for (const s of services) {
    // Skip services with no real coordinates (repo defaults to 0 when missing)
    if (s.locationLat === 0 && s.locationLng === 0) continue;
    const existing = map.get(s.locationId);
    if (existing) {
      existing.allServices.push(s);
      existing.hasMultiplePrices = true; // multiple services = price range
      if (s.priceFrom < existing.lowestPriceFrom) {
        existing.lowestPriceFrom = s.priceFrom;
        existing.topService = s;
      }
    } else {
      map.set(s.locationId, {
        locationId: s.locationId,
        locationDisplayName: s.locationDisplayName,
        lat: s.locationLat,
        lng: s.locationLng,
        lowestPriceFrom: s.priceFrom,
        hasMultiplePrices: s.variantCount > 1,
        topService: s,
        allServices: [s],
      });
    }
  }
  return Array.from(map.values());
}

/** Fix 4: default delta ~5km. Fallback centres on central London. */
const DEFAULT_DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

const FALLBACK_REGION = {
  latitude: 51.5074,
  longitude: -0.1278,
  ...DEFAULT_DELTA,
};

// ---------------------------------------------------------------------------
// PriceBubble — custom marker view (native only)
// ---------------------------------------------------------------------------

function PriceBubble({
  pence,
  hasMultiple,
  selected,
  serviceCount,
  onReady,
}: {
  pence: number;
  hasMultiple: boolean;
  selected: boolean;
  serviceCount: number;
  onReady?: () => void;
}) {
  const price = Math.floor(pence);
  // \u00a0 = non-breaking space: prevents textBreakStrategy="simple" on Android
  // from treating the space as a line-break opportunity, which combined with
  // numberOfLines={1} would clip everything after "from" (£N never shown).
  const label = `from\u00a0£${price}`;
  return (
    <View collapsable={false} style={styles.priceBubbleOuter} onLayout={onReady}>
      <View collapsable={false} style={[styles.priceBubble, selected && styles.priceBubbleSelected]}>
        <Text
          numberOfLines={1}
          allowFontScaling={false}
          textBreakStrategy="simple"
          style={[styles.priceBubbleText, selected && styles.priceBubbleTextSelected]}
        >
          {label}
        </Text>
        {serviceCount > 1 && (
          <View collapsable={false} style={[styles.priceBubbleBadge, selected && styles.priceBubbleBadgeSelected]}>
            <Text allowFontScaling={false} style={[styles.priceBubbleBadgeText, selected && styles.priceBubbleBadgeTextSelected]}>
              {serviceCount}
            </Text>
          </View>
        )}
      </View>
      <View collapsable={false} style={[styles.priceBubbleTail, selected && styles.priceBubbleTailSelected]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// CompactServiceSheet — slides up when a pin is tapped
// ---------------------------------------------------------------------------

function CompactServiceSheet({
  group,
  onClose,
  onPressService,
  onViewAll,
  testID,
}: {
  group: LocationGroup;
  onClose: () => void;
  onPressService?: (card: ServiceTypeCard) => void;
  onViewAll?: (locationId: string) => void;
  testID?: string;
}) {
  const { topService, locationDisplayName, locationId, allServices } = group;
  return (
    <View style={styles.sheet} testID={testID}>
      {/* Drag handle */}
      <View style={styles.sheetHandle} />

      <View style={styles.sheetContent}>
        <Text style={styles.sheetLocation} numberOfLines={1}>
          {locationDisplayName}
        </Text>
        <Text style={styles.sheetServiceName} numberOfLines={2}>
          {topService.serviceName}
        </Text>
        <Text style={styles.sheetMeta}>
          {formatPrice(group.lowestPriceFrom, group.hasMultiplePrices)}
        </Text>

        <Pressable
          style={styles.sheetCta}
          onPress={() => onPressService?.(topService)}
          accessibilityRole="button"
          accessibilityLabel={`View ${topService.serviceName}`}
          testID={testID ? `${testID}-book` : undefined}
        >
          <Text style={styles.sheetCtaText}>View service</Text>
        </Pressable>

        {allServices.length > 1 ? (
          <Pressable
            style={styles.sheetViewAll}
            onPress={() => onViewAll?.(locationId)}
            accessibilityRole="link"
            accessibilityLabel={`View all services at ${locationDisplayName}`}
            testID={testID ? `${testID}-view-all` : undefined}
          >
            <Text style={styles.sheetViewAllText}>
              View all {allServices.length} services →
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        style={styles.sheetClose}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
        testID={testID ? `${testID}-close` : undefined}
      >
        <Text style={styles.sheetCloseText}>✕</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ExploreMapScreen({
  services,
  onSwitchToList,
  onPressService,
  onViewAllAtLocation,
  testID,
}: ExploreMapScreenProps) {
  const mapRef = useRef<MapView>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  // iOS + PROVIDER_GOOGLE: MapView.onPress fires after Marker.onPress in the
  // same event loop, immediately clearing the selection. Guard against it.
  const markerJustPressedRef = useRef(false);

  // Fix 3: gate showsUserLocation on permission being granted.
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);
  useEffect(() => {
    if (Platform.OS === "web") return;
    void Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === "granted") setLocationPermissionGranted(true);
    });
  }, []);

  // Per-marker readiness: tracksViewChanges starts true; we flip it false only
  // after onLayout fires on that marker's view, guaranteeing the bitmap is
  // captured after flex layout has fully committed on Android.
  //
  // Android-specific delay: onLayout fires after the layout pass but before
  // the custom font (Manrope-Medium) has finished painting its glyphs into the
  // bitmap. Waiting 400 ms on Android gives the GPU time to render the full
  // "from £N" text before we freeze tracksViewChanges.
  const [readyLocations, setReadyLocations] = useState<Set<string>>(new Set());
  const handleMarkerReady = useCallback((locationId: string) => {
    const apply = () => {
      setReadyLocations((prev) => {
        if (prev.has(locationId)) return prev;
        const next = new Set(prev);
        next.add(locationId);
        return next;
      });
    };
    if (Platform.OS === "android") {
      setTimeout(apply, 400);
    } else {
      apply();
    }
  }, []);

  const locationGroups = groupByLocation(services);

  // Fix 1: auto-fit map to show all pins after layout completes.
  useEffect(() => {
    if (Platform.OS === "web" || locationGroups.length === 0) return;
    const coordinates = locationGroups.map((g) => ({ latitude: g.lat, longitude: g.lng }));
    const timer = setTimeout(() => {
      if (!mapRef.current) return;
      if (locationGroups.length === 1) {
        mapRef.current.animateToRegion({
          latitude: locationGroups[0].lat,
          longitude: locationGroups[0].lng,
          latitudeDelta: 0.045,
          longitudeDelta: 0.045,
        }, 300);
      } else {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 60, bottom: 120, left: 60 },
          animated: true,
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [services]);

  const initialRegion =
    locationGroups.length > 0
      ? {
          latitude: locationGroups[0].lat,
          longitude: locationGroups[0].lng,
          ...DEFAULT_DELTA,
        }
      : FALLBACK_REGION;

  const selectedGroup = selectedLocationId
    ? (locationGroups.find((g) => g.locationId === selectedLocationId) ?? null)
    : null;

  const totalCount = services.length;

  return (
    <View style={styles.container} testID={testID}>
      {Platform.OS === "web" ? (
        <View
          style={styles.webFallback}
          testID={testID ? `${testID}-web-stub` : undefined}
        >
          <Text style={styles.webFallbackTitle}>Map view</Text>
          <Text style={styles.webFallbackBody}>
            Map view is available in the iOS or Android app.
          </Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          customMapStyle={ZARKILI_MAP_STYLE as unknown as MapStyleElement[]}
          initialRegion={initialRegion}
          showsUserLocation={locationPermissionGranted}
          showsMyLocationButton={false}
          onPress={() => {
            if (markerJustPressedRef.current) return;
            setSelectedLocationId(null);
          }}
          testID={testID ? `${testID}-mapview` : undefined}
        >
          {locationGroups.map((group) => (
            <Marker
              key={group.locationId}
              coordinate={{ latitude: group.lat, longitude: group.lng }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges={!readyLocations.has(group.locationId) || selectedLocationId === group.locationId}
              zIndex={1}
              onPress={() => {
                markerJustPressedRef.current = true;
                setTimeout(() => { markerJustPressedRef.current = false; }, 100);
                setSelectedLocationId((prev) =>
                  prev === group.locationId ? null : group.locationId
                );
              }}
              accessibilityLabel={`${group.locationDisplayName}, ${formatPrice(group.lowestPriceFrom, group.hasMultiplePrices)}`}
              testID={testID ? `${testID}-pin-${group.locationId}` : undefined}
            >
              <PriceBubble
                pence={group.lowestPriceFrom}
                hasMultiple={group.hasMultiplePrices}
                selected={selectedLocationId === group.locationId}
                serviceCount={group.allServices.length}
                onReady={() => handleMarkerReady(group.locationId)}
              />
            </Marker>
          ))}
        </MapView>
      )}

      {/* Summary bar */}
      <View
        style={styles.summaryBar}
        testID={testID ? `${testID}-summary` : undefined}
      >
        <Text style={styles.summaryText}>
          {totalCount === 1
            ? "1 service nearby"
            : `${totalCount} services nearby`}
        </Text>
      </View>

      {/* Switch to list — floating pill */}
      <Pressable
        onPress={onSwitchToList}
        style={styles.switchBtn}
        accessibilityRole="button"
        accessibilityLabel="Switch to list view"
        testID={testID ? `${testID}-switch-to-list` : undefined}
      >
        <ListLineIcon />
        <Text style={styles.switchText}>List view</Text>
      </Pressable>

      {/* Compact bottom sheet when a pin is selected */}
      {selectedGroup ? (
        <CompactServiceSheet
          group={selectedGroup}
          onClose={() => setSelectedLocationId(null)}
          onPressService={onPressService}
          onViewAll={onViewAllAtLocation}
          testID={testID ? `${testID}-sheet` : undefined}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  map: { flex: 1 },

  webFallback: {
    flex: 1,
    margin: spacing.pageHorizontal,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.s2,
    padding: spacing.s6,
  },
  webFallbackTitle: { ...textStyles.heading2, color: colors.foreground },
  webFallbackBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },

  // Price bubble (custom marker)
  // collapsable={false} on all Views prevents Android from merging views
  // during native measurement, which corrupts the marker bitmap dimensions.
  priceBubbleOuter: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  priceBubble: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  priceBubbleSelected: {
    backgroundColor: colors.primary,
  },
  priceBubbleText: {
    ...textStyles.labelSmall,
    // On Android, Manrope-Medium loads asynchronously relative to the marker
    // bitmap capture. Using the system font on Android avoids the race where
    // the bitmap is frozen before custom-font glyphs are painted.
    fontFamily: Platform.OS === "android" ? undefined : "Manrope-Medium",
    color: colors.primary,
    fontWeight: "700",
    letterSpacing: 0,
  },
  priceBubbleTextSelected: { color: colors.white },
  priceBubbleBadge: {
    backgroundColor: "#FBEAF0",
    borderRadius: 8,
    minWidth: 16,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignItems: "center",
    marginLeft: 4,
  },
  priceBubbleBadgeSelected: { backgroundColor: "rgba(255,255,255,0.25)" },
  priceBubbleBadgeText: { color: "#993556", fontSize: 9, fontWeight: "700" },
  priceBubbleBadgeTextSelected: { color: "#FFFFFF" },
  priceBubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.primary,
    alignSelf: "center",
  },
  priceBubbleTailSelected: { borderTopColor: colors.primary },

  // Summary bar
  summaryBar: {
    position: "absolute",
    top: spacing.s3,
    left: spacing.pageHorizontal,
    right: spacing.pageHorizontal,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  summaryText: { ...textStyles.bodySmall, color: colors.foreground, fontWeight: "500" },

  // Switch to list button — Fix 3: white + brand color (not black)
  switchBtn: {
    position: "absolute",
    bottom: spacing.s6,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s5,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  switchText: { ...textStyles.label, color: "#993556" },

  // Compact sheet
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingBottom: spacing.s6,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginVertical: spacing.s3,
  },
  sheetContent: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: spacing.s2,
  },
  sheetLocation: { ...textStyles.bodySmall, color: colors.textMuted },
  sheetServiceName: { ...textStyles.heading3, color: colors.foreground },
  sheetMeta: { ...textStyles.body, color: colors.primary },
  sheetCta: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.s3,
    alignItems: "center",
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    marginTop: spacing.s2,
  },
  sheetCtaText: { ...textStyles.label, color: colors.white },
  sheetViewAll: {
    alignItems: "center",
    paddingVertical: spacing.s2,
  },
  sheetViewAllText: { ...textStyles.body, color: colors.primary },
  sheetClose: {
    position: "absolute",
    top: spacing.s3,
    right: spacing.pageHorizontal,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCloseText: { fontSize: 14, color: colors.textMuted },
});



