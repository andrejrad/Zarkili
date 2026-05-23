/**
 * NearMeSalonMapScreen.tsx — J.9 Near-Me / Map / Cluster / Pin Detail
 * (W30 Batch J).
 *
 * Renders a map placeholder containing MapCluster pins (single + cluster),
 * a bottom-sheet peek for pin detail, and a location-permission-denied overlay
 * that offers "Enter ZIP" as fallback.
 *
 * States: granted | denied | no-results-in-view | error
 *
 * Extends (but does not replace) ExploreMapScreen.tsx — this screen focuses on
 * the cluster + permission-denied + pin-detail edge cases from the spec.
 */

import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  Button,
  MapCluster,
  ModalSheet,
  Banner,
  colors,
  radius,
  spacing,
} from "../../shared/ui";

export type MapLocationState = "granted" | "denied" | "no-results-in-view" | "error";

export type MapSalonPin = {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  distanceMiles?: number;
  priceTier?: 1 | 2 | 3;
  /** When defined, the pin represents a cluster of multiple salons. */
  clusterCount?: number;
};

export type NearMeSalonMapScreenProps = {
  locationState?: MapLocationState;
  pins?: MapSalonPin[];
  errorMessage?: string;
  onSelectPin: (pin: MapSalonPin) => void;
  onRequestLocation: () => void;
  onEnterZip: (zip: string) => void;
  onPressBack?: () => void;
  testID?: string;
};

export function NearMeSalonMapScreen({
  locationState = "granted",
  pins = [],
  errorMessage,
  onSelectPin,
  onRequestLocation,
  onEnterZip,
  onPressBack: _onPressBack,
  testID,
}: NearMeSalonMapScreenProps) {
  const [selectedPin, setSelectedPin] = useState<MapSalonPin | null>(null);
  const [zipValue, setZipValue] = useState("");
  const [detailVisible, setDetailVisible] = useState(false);

  const handlePinPress = (pin: MapSalonPin) => {
    setSelectedPin(pin);
    setDetailVisible(true);
    onSelectPin(pin);
  };

  return (
    <View style={styles.root} testID={testID}>
      {/* Map area placeholder */}
      <View
        style={styles.mapArea}
        testID={testID ? `${testID}-map` : undefined}
      >
        <Text style={styles.mapPlaceholder}>Map view</Text>

        {/* Render pins */}
        {locationState === "granted" &&
          pins.map((pin, i) => (
            <Pressable
              key={pin.id}
              style={[styles.pinWrapper, { top: 80 + i * 40, left: 60 + i * 50 }]}
              onPress={() => handlePinPress(pin)}
              accessibilityRole="button"
              accessibilityLabel={
                pin.clusterCount
                  ? `${pin.clusterCount} salons in this area`
                  : pin.name
              }
              testID={testID ? `${testID}-pin-${pin.id}` : undefined}
            >
              <MapCluster
                count={pin.clusterCount}
                testID={testID ? `${testID}-cluster-${pin.id}` : undefined}
              />
            </Pressable>
          ))}
      </View>

      {/* No-results banner */}
      {locationState === "no-results-in-view" && (
        <View style={styles.noResultsOverlay} testID={testID ? `${testID}-no-results` : undefined}>
          <Banner
            variant="info"
            message="No salons found in this area. Try zooming out or moving the map."
          />
        </View>
      )}

      {/* Error banner */}
      {locationState === "error" && errorMessage && (
        <View style={styles.noResultsOverlay}>
          <Banner variant="error" message={errorMessage} />
        </View>
      )}

      {/* Location denied overlay */}
      {locationState === "denied" && (
        <View style={styles.deniedOverlay} testID={testID ? `${testID}-denied` : undefined}>
          <View style={styles.deniedCard}>
            <Text style={styles.deniedTitle}>Location access needed</Text>
            <Text style={styles.deniedBody}>
              Allow location access to see salons near you, or enter your ZIP
              code to search manually.
            </Text>
            <Button
              label="Allow location"
              variant="primary"
              onPress={onRequestLocation}
              testID={testID ? `${testID}-allow-location` : undefined}
            />
            <View style={styles.zipRow}>
              <TextInput
                style={styles.zipInput}
                value={zipValue}
                onChangeText={setZipValue}
                placeholder="Enter ZIP code"
                keyboardType="number-pad"
                maxLength={5}
                accessibilityLabel="ZIP code"
                testID={testID ? `${testID}-zip-input` : undefined}
              />
              <Button
                label="Search"
                variant="secondary"
                disabled={zipValue.length !== 5}
                onPress={() => onEnterZip(zipValue)}
                testID={testID ? `${testID}-zip-search` : undefined}
              />
            </View>
          </View>
        </View>
      )}

      {/* Pin detail bottom sheet */}
      <ModalSheet
        visible={detailVisible}
        onClose={() => setDetailVisible(false)}
        title={selectedPin?.name ?? ""}
        testID={testID ? `${testID}-detail-sheet` : undefined}
        footer={
          <View style={styles.detailFooter}>
            <Button
              label="View salon"
              variant="primary"
              onPress={() => {
                setDetailVisible(false);
                if (selectedPin) onSelectPin(selectedPin);
              }}
              testID={testID ? `${testID}-view-salon` : undefined}
            />
          </View>
        }
      >
        {selectedPin && (
          <View style={styles.detailBody} testID={testID ? `${testID}-detail-body` : undefined}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Rating</Text>
              <Text style={styles.detailValue}>
                ⭐ {selectedPin.rating.toFixed(1)}{" "}
                <Text style={styles.detailMuted}>({selectedPin.reviewCount})</Text>
              </Text>
            </View>
            {selectedPin.distanceMiles !== undefined && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Distance</Text>
                <Text style={styles.detailValue}>
                  {selectedPin.distanceMiles.toFixed(1)} mi
                </Text>
              </View>
            )}
            {selectedPin.priceTier && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailValue}>
                  {"$".repeat(selectedPin.priceTier)}
                </Text>
              </View>
            )}
          </View>
        )}
      </ModalSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapArea: {
    flex: 1,
    backgroundColor: "#D4E8C2",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholder: {
    fontSize: 18,
    color: colors.textMuted,
    opacity: 0.5,
  },
  pinWrapper: {
    position: "absolute",
  },
  noResultsOverlay: {
    position: "absolute",
    bottom: spacing.s8,
    left: spacing.pageHorizontal,
    right: spacing.pageHorizontal,
  },
  deniedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black50,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
  },
  deniedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s6,
    width: "100%",
    gap: spacing.s4,
  },
  deniedTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.foreground,
    textAlign: "center",
  },
  deniedBody: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  zipRow: {
    flexDirection: "row",
    gap: spacing.s2,
    alignItems: "center",
  },
  zipInput: {
    flex: 1,
    height: spacing.touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.s3,
    fontSize: 16,
    color: colors.foreground,
    backgroundColor: colors.surface,
  },
  detailBody: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s4,
    gap: spacing.s3,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.s2,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  detailMuted: {
    color: colors.textMuted,
    fontWeight: "400",
  },
  detailFooter: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
  },
});
