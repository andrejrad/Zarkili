/**
 * LocationChangeSheetScreen — Phase 5.7
 *
 * Two options: Use my current location (GPS) or Enter city/postcode.
 * GPS denied → "Allow location access" → Linking.openSettings().
 * Never re-triggers native permission prompt.
 *
 * Selection takes effect immediately; sheet dismisses.
 */

import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Linking, Platform } from "react-native";

import { colors, radius, spacing, textStyles } from "../../shared/ui";

export type LocationChangeResult =
  | { type: "gps" }
  | { type: "manual"; query: string };

export type LocationChangeSheetScreenProps = {
  visible: boolean;
  gpsGranted: boolean;
  gpsPermissionDenied: boolean;
  currentLocationLabel?: string;
  onSelectLocation: (result: LocationChangeResult) => void;
  onClose: () => void;
  testID?: string;
};

export function LocationChangeSheetScreen({
  visible,
  gpsGranted,
  gpsPermissionDenied,
  currentLocationLabel,
  onSelectLocation,
  onClose,
  testID,
}: LocationChangeSheetScreenProps) {
  function handleGpsPress() {
    if (gpsPermissionDenied) {
      // Never re-trigger native prompt — open settings instead
      void Linking.openSettings();
      return;
    }
    onSelectLocation({ type: "gps" });
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityLabel="Close location picker"
          accessibilityRole="button"
          testID={testID ? `${testID}-scrim` : undefined}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Change location</Text>

          {currentLocationLabel ? (
            <Text style={styles.currentLabel} numberOfLines={1}>
              Currently: {currentLocationLabel}
            </Text>
          ) : null}

          {/* GPS option */}
          <Pressable
            style={styles.optionRow}
            onPress={handleGpsPress}
            accessibilityRole="button"
            accessibilityLabel={
              gpsPermissionDenied
                ? "Allow location access"
                : "Use my current location"
            }
            testID={testID ? `${testID}-gps` : undefined}
          >
            <Text style={styles.optionIcon}>📍</Text>
            <View style={styles.optionTextBlock}>
              <Text style={styles.optionLabel}>
                {gpsPermissionDenied
                  ? "Allow location access"
                  : "Use my current location"}
              </Text>
              {gpsGranted && !gpsPermissionDenied ? (
                <Text style={styles.optionSublabel}>GPS</Text>
              ) : gpsPermissionDenied ? (
                <Text style={styles.optionSublabelWarn}>
                  Opens {Platform.OS === "ios" ? "iPhone" : "Android"} settings
                </Text>
              ) : null}
            </View>
          </Pressable>

          <View style={styles.divider} />

          {/* Manual entry */}
          <ManualEntry
            onSubmit={(query) => {
              if (query.trim().length > 0) {
                onSelectLocation({ type: "manual", query: query.trim() });
                onClose();
              }
            }}
            testID={testID ? `${testID}-manual` : undefined}
          />

          <View style={styles.bottomPad} />
        </View>
      </View>
    </Modal>
  );
}

function ManualEntry({
  onSubmit,
  testID,
}: {
  onSubmit: (query: string) => void;
  testID?: string;
}) {
  const [value, setValue] = useState("");

  return (
    <View style={styles.manualRow}>
      <Text style={styles.optionIcon}>🔍</Text>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={setValue}
        placeholder="City or postcode…"
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        onSubmitEditing={() => onSubmit(value)}
        accessibilityLabel="Enter a city or postcode"
        testID={testID ? `${testID}-input` : undefined}
      />
      {value.trim().length > 0 ? (
        <Pressable
          onPress={() => onSubmit(value)}
          style={styles.searchBtn}
          accessibilityRole="button"
          accessibilityLabel="Search"
          testID={testID ? `${testID}-submit` : undefined}
        >
          <Text style={styles.searchBtnText}>Go</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black50,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.pageHorizontal,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: "center",
    marginTop: spacing.s2,
    marginBottom: spacing.s4,
  },
  title: {
    ...textStyles.heading3,
    color: colors.foreground,
    marginBottom: spacing.s1,
  },
  currentLabel: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginBottom: spacing.s4,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    paddingVertical: spacing.s4,
    minHeight: spacing.touchTarget,
  },
  optionIcon: {
    fontSize: 20,
    width: 28,
    textAlign: "center",
  },
  optionTextBlock: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...textStyles.bodyLarge,
    color: colors.foreground,
  },
  optionSublabel: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  optionSublabelWarn: {
    ...textStyles.bodySmall,
    color: colors.warning,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  manualRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    paddingVertical: spacing.s3,
  },
  textInput: {
    flex: 1,
    ...textStyles.bodyLarge,
    color: colors.foreground,
    paddingVertical: spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
  },
  searchBtnText: {
    ...textStyles.label,
    color: colors.white,
  },
  bottomPad: {
    height: spacing.s8,
  },
});
