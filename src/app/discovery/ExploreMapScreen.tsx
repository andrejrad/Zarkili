/**
 * ExploreMapScreen.tsx — W22/W34 Stream B.
 *
 * Map-based salon discovery using react-native-maps (W22-DEBT-1 closed).
 * On native iOS/Android: renders a real MapView with a Marker for each salon
 * that has coordinates. On web: shows a "Map not available on web" notice.
 * The pin list is always visible below the map so users can tap without coords.
 *
 * Google Maps API key: configure EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in your
 * .env file and run an EAS dev build to activate native map tiles.
 */

import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MapView, { Marker } from "react-native-maps";

import { Button, colors, radius, spacing } from "../../shared/ui";

import type { FeaturedSalon } from "./discoveryHelpers";

export type ExploreMapScreenProps = {
  results: FeaturedSalon[];
  selectedSalonId: string | null;
  onSelectSalon: (salonId: string) => void;
  onPressBack: () => void;
  testID?: string;
};

/** Fallback region (central Croatia) when no coordinates are available. */
const FALLBACK_REGION = {
  latitude: 45.1,
  longitude: 15.2,
  latitudeDelta: 3.5,
  longitudeDelta: 3.5,
};

export function ExploreMapScreen({
  results,
  selectedSalonId,
  onSelectSalon,
  onPressBack,
  testID,
}: ExploreMapScreenProps) {
  const coordSalons = results.filter((s) => s.latitude != null && s.longitude != null);

  const initialRegion =
    coordSalons.length > 0
      ? {
          latitude: coordSalons[0].latitude!,
          longitude: coordSalons[0].longitude!,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }
      : FALLBACK_REGION;

  return (
    <View style={styles.container} testID={testID ?? "explore-map"}>
      <View style={styles.header}>
        <Button
          variant="secondary"
          size="small"
          label="Back"
          onPress={onPressBack}
          testID="explore-map-back"
        />
        <Text style={styles.heading}>Map</Text>
      </View>

      {Platform.OS === "web" ? (
        <View style={styles.webFallback} testID="explore-map-web-stub">
          <Text style={styles.webFallbackText}>Map view is available in the iOS or Android app.</Text>
        </View>
      ) : (
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          testID="explore-map-mapview"
        >
          {coordSalons.map((salon) => (
            <Marker
              key={salon.id}
              coordinate={{ latitude: salon.latitude!, longitude: salon.longitude! }}
              title={salon.name}
              description={salon.city}
              pinColor={salon.id === selectedSalonId ? colors.foreground : colors.accent}
              onPress={() => onSelectSalon(salon.id)}
              testID={`explore-map-marker-${salon.id}`}
            />
          ))}
        </MapView>
      )}

      <ScrollView style={styles.pinList} contentContainerStyle={styles.pinListContent}>
        {results.map((salon) => {
          const isSelected = salon.id === selectedSalonId;
          return (
            <Pressable
              key={salon.id}
              onPress={() => onSelectSalon(salon.id)}
              style={[styles.pinRow, isSelected && styles.pinRowSelected]}
              accessibilityRole="button"
              accessibilityLabel={`Pin: ${salon.name}`}
              accessibilityState={{ selected: isSelected }}
              testID={`explore-map-pin-${salon.id}`}
            >
              <Text style={styles.pinName}>📍 {salon.name}</Text>
              <Text style={styles.pinMeta}>
                {salon.city}
                {salon.distanceMiles != null ? ` • ${salon.distanceMiles.toFixed(1)} mi` : ""}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    padding: spacing.pageVertical,
  },
  heading: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  map: {
    height: 280,
    marginHorizontal: spacing.pageVertical,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  webFallback: {
    height: 280,
    marginHorizontal: spacing.pageVertical,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.s4,
  },
  webFallbackText: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  pinList: { flex: 1, marginTop: spacing.s3 },
  pinListContent: { paddingHorizontal: spacing.pageVertical, gap: spacing.s2, paddingBottom: spacing.s4 },
  pinRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s3,
  },
  pinRowSelected: { borderColor: colors.foreground },
  pinName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  pinMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
