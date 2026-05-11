/**
 * ExploreMapScreen.tsx — B.8 Explore Map.
 *
 * Real map rendering via react-native-maps (W22-DEBT-1 closed).
 * On native iOS/Android: renders a MapView with a Marker for each salon that
 * has coordinates, plus a floating "Switch to list" button.
 * On web: renders a "Map not available on web" notice.
 * The summary count and salon list are always shown below the map.
 *
 * Google Maps API key: configure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY and run
 * an EAS dev build to activate native map tiles.
 */

import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import type { DiscoverySalonCard } from "../../domains/discovery";
import { colors, radius, spacing, textStyles } from "../../shared/ui";

export type ExploreMapScreenProps = {
  salons: DiscoverySalonCard[];
  onSwitchToList?: () => void;
  onPressSalon?: (salon: DiscoverySalonCard) => void;
  testID?: string;
};

/** Fallback region (central Croatia) when no salon coordinates are available. */
const FALLBACK_REGION = {
  latitude: 45.1,
  longitude: 15.2,
  latitudeDelta: 3.5,
  longitudeDelta: 3.5,
};

export function ExploreMapScreen({
  salons,
  onSwitchToList,
  onPressSalon,
  testID,
}: ExploreMapScreenProps) {
  const coordSalons = salons.filter((s) => s.locationLat != null && s.locationLng != null);

  const initialRegion =
    coordSalons.length > 0
      ? {
          latitude: coordSalons[0].locationLat!,
          longitude: coordSalons[0].locationLng!,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }
      : FALLBACK_REGION;

  return (
    <View style={styles.container} testID={testID}>
      {Platform.OS === "web" ? (
        <View style={styles.webFallback} testID={testID ? `${testID}-web-stub` : undefined}>
          <Text style={styles.webFallbackTitle}>Map view</Text>
          <Text style={styles.webFallbackBody}>
            Map view is available in the iOS or Android app.
          </Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          testID={testID ? `${testID}-mapview` : undefined}
        >
          {coordSalons.map((s) => (
            <Marker
              key={s.id}
              coordinate={{ latitude: s.locationLat!, longitude: s.locationLng! }}
              title={s.name}
              description={s.city}
              onPress={() => onPressSalon?.(s)}
              testID={testID ? `${testID}-marker-${s.id}` : undefined}
            />
          ))}
        </MapView>
      )}

      <Pressable
        onPress={onSwitchToList}
        style={styles.switchBtn}
        accessibilityRole="button"
        accessibilityLabel="Switch to list view"
        testID={testID ? `${testID}-switch-to-list` : undefined}
      >
        <Text style={styles.switchText}>Switch to list view</Text>
      </Pressable>

      <View style={styles.summary} testID={testID ? `${testID}-summary` : undefined}>
        <Text style={styles.summaryText}>
          {salons.length === 1 ? "1 salon nearby" : `${salons.length} salons nearby`}
        </Text>
      </View>

      <ScrollView style={styles.list}>
        {salons.slice(0, 5).map((s) => (
          <Pressable
            key={s.id}
            onPress={() => onPressSalon?.(s)}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={`${s.name} in ${s.city}`}
            testID={testID ? `${testID}-salon-${s.id}` : undefined}
          >
            <Text style={styles.rowName}>{s.name}</Text>
            <Text style={styles.rowMeta}>
              {s.city} · From ${s.priceFrom}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  map: {
    height: 280,
    marginHorizontal: spacing.pageHorizontal,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  webFallback: {
    margin: spacing.pageHorizontal,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPaddingLarge,
    alignItems: "center",
    gap: spacing.s2,
  },
  webFallbackTitle: { ...textStyles.heading2, color: colors.foreground },
  webFallbackBody: { ...textStyles.body, color: colors.textMuted, textAlign: "center" },
  switchBtn: {
    alignSelf: "center",
    marginTop: spacing.s3,
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s5,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchText: { ...textStyles.label, color: colors.foreground },
  summary: { paddingHorizontal: spacing.pageHorizontal, paddingTop: spacing.s2, paddingBottom: spacing.s2 },
  summaryText: { ...textStyles.bodySmall, color: colors.textMuted },
  list: { paddingHorizontal: spacing.pageHorizontal },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.cardPadding,
    minHeight: spacing.touchTarget,
    marginBottom: spacing.s2,
  },
  rowName: { ...textStyles.heading4, color: colors.foreground },
  rowMeta: { ...textStyles.bodySmall, color: colors.textMuted },
});
