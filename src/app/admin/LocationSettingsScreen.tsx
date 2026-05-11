/**
 * W40 — LocationSettingsScreen: location address, hours, holidays, photos,
 * and ADA accessibility flags (N.2).
 *
 * US-primary: hours shown in 12h AM/PM format. US federal + state holidays
 * seed available for booking blackout with per-location toggles.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminErrorState, AdminLoadingState, AdminSectionRow, AdminToggleRow } from "./AdminPatterns";
import type { Location, LocationAccessibilityFlags, HolidayEntry, UpdateLocationInput } from "./locationAdminService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LocationSettingsScreenProps = {
  loading: boolean;
  error: string | null;
  location: Location | null;
  accessibilityFlags: LocationAccessibilityFlags | null;
  holidays: HolidayEntry[];
  onUpdateLocation: (input: UpdateLocationInput) => Promise<void>;
  onUpdateAccessibility: (flags: LocationAccessibilityFlags) => Promise<void>;
  onToggleHoliday: (holidayId: string, enabled: boolean) => Promise<void>;
  onRetry: () => void;
  onBack: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DAYS = [
  { key: "mon" as const, label: "Mon" },
  { key: "tue" as const, label: "Tue" },
  { key: "wed" as const, label: "Wed" },
  { key: "thu" as const, label: "Thu" },
  { key: "fri" as const, label: "Fri" },
  { key: "sat" as const, label: "Sat" },
  { key: "sun" as const, label: "Sun" },
];

function formatHoursBlock(blocks: { start: string; end: string }[] | undefined): string {
  if (!blocks || blocks.length === 0) return "Closed";
  return blocks.map((b) => `${b.start} – ${b.end}`).join(", ");
}

export function LocationSettingsScreen({
  loading,
  error,
  location,
  accessibilityFlags,
  holidays,
  onUpdateLocation,
  onUpdateAccessibility,
  onToggleHoliday,
  onRetry,
  onBack,
}: LocationSettingsScreenProps) {
  const [localFlags, setLocalFlags] = useState<LocationAccessibilityFlags | null>(null);

  const flags = localFlags ?? accessibilityFlags;

  async function handleToggleFlag(key: keyof LocationAccessibilityFlags, value: boolean) {
    const next: LocationAccessibilityFlags = {
      ...(flags ?? { wheelchairAccessible: false, accessibleParking: false, serviceAnimalWelcome: false }),
      [key]: value,
    };
    setLocalFlags(next);
    await onUpdateAccessibility(next);
  }

  const federalHolidays = holidays.filter((h) => h.isFederal);
  const customHolidays = holidays.filter((h) => !h.isFederal);

  return (
    <ScrollView contentContainerStyle={styles.root} testID="location-settings-screen">
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Location</Text>
      </Pressable>
      <Text style={styles.pageTitle}>
        {location ? location.name : "Location settings"}
      </Text>

      {loading ? <AdminLoadingState label="Loading settings…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {location && !loading ? (
        <>
          {/* Address */}
          <Text style={styles.groupLabel}>Address</Text>
          <View style={styles.group}>
            <AdminSectionRow
              label={location.address.line1 || "—"}
              sublabel={[location.address.city, location.address.country, location.address.postalCode].filter(Boolean).join(", ")}
              onPress={() => onUpdateLocation({})}
              testID="edit-address-row"
            />
          </View>

          {/* Contact */}
          <Text style={styles.groupLabel}>Contact</Text>
          <View style={styles.group}>
            <AdminSectionRow
              label={location.phone ?? "Add phone"}
              sublabel="Phone number"
              onPress={() => onUpdateLocation({})}
              testID="edit-phone-row"
            />
            <AdminSectionRow
              label={location.email ?? "Add email"}
              sublabel="Email address"
              onPress={() => onUpdateLocation({})}
              testID="edit-email-row"
            />
          </View>

          {/* Operating hours */}
          <Text style={styles.groupLabel}>Operating hours</Text>
          <View style={styles.group} testID="operating-hours-section">
            {DAYS.map(({ key, label }) => (
              <View key={key} style={styles.hoursRow}>
                <Text style={styles.dayLabel}>{label}</Text>
                <Text style={styles.hoursValue}>
                  {formatHoursBlock(location.operatingHours[key])}
                </Text>
              </View>
            ))}
          </View>

          {/* Holidays */}
          {federalHolidays.length > 0 ? (
            <>
              <Text style={styles.groupLabel}>US Federal holidays</Text>
              <View style={styles.group} testID="federal-holidays-section">
                {federalHolidays.map((h) => (
                  <AdminToggleRow
                    key={h.holidayId}
                    label={h.name}
                    sublabel={h.dateIso}
                    value={h.isEnabled}
                    onToggle={(v) => void onToggleHoliday(h.holidayId, v)}
                  />
                ))}
              </View>
            </>
          ) : null}

          {customHolidays.length > 0 ? (
            <>
              <Text style={styles.groupLabel}>Custom closures</Text>
              <View style={styles.group} testID="custom-holidays-section">
                {customHolidays.map((h) => (
                  <AdminToggleRow
                    key={h.holidayId}
                    label={h.name}
                    sublabel={h.dateIso}
                    value={h.isEnabled}
                    onToggle={(v) => void onToggleHoliday(h.holidayId, v)}
                  />
                ))}
              </View>
            </>
          ) : null}

          {/* ADA accessibility */}
          <Text style={styles.groupLabel}>Accessibility</Text>
          <View style={styles.group} testID="accessibility-section">
            <AdminToggleRow
              label="Wheelchair accessible"
              value={flags?.wheelchairAccessible ?? false}
              onToggle={(v) => void handleToggleFlag("wheelchairAccessible", v)}
            />
            <AdminToggleRow
              label="Accessible parking"
              value={flags?.accessibleParking ?? false}
              onToggle={(v) => void handleToggleFlag("accessibleParking", v)}
            />
            <AdminToggleRow
              label="Service animals welcome"
              value={flags?.serviceAnimalWelcome ?? false}
              onToggle={(v) => void handleToggleFlag("serviceAnimalWelcome", v)}
            />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingBottom: 32, gap: 8 },
  backRow: { paddingBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  pageTitle: { fontSize: 24, lineHeight: 32, fontFamily: brandTypography.semibold, color: "#1A1A1A", marginBottom: 4 },
  groupLabel: { fontSize: 12, fontFamily: brandTypography.semibold, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4, marginTop: 12 },
  group: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", overflow: "hidden" },
  hoursRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F0EDE6" },
  dayLabel: { fontSize: 13, fontFamily: brandTypography.medium, color: "#1A1A1A", width: 40 },
  hoursValue: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B", flex: 1, textAlign: "right" },
});
