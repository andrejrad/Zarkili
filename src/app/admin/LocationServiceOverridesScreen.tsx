/**
 * W40 — LocationServiceOverridesScreen: per-location service price/duration/
 * availability overrides (N.3).
 *
 * Shows all tenant services with a diff-highlighted row when an override is
 * active.  Tapping an override row opens an edit sheet (handled by caller).
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { LocationServiceOverride } from "./locationAdminService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number | null, currency: string): string {
  if (cents === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDuration(min: number | null): string {
  if (min === null) return "—";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LocationServiceOverridesScreenProps = {
  loading: boolean;
  error: string | null;
  locationName: string;
  overrides: LocationServiceOverride[];
  onEditOverride: (serviceId: string) => void;
  onRetry: () => void;
  onBack: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LocationServiceOverridesScreen({
  loading,
  error,
  locationName,
  overrides,
  onEditOverride,
  onRetry,
  onBack,
}: LocationServiceOverridesScreenProps) {
  const activeOverrides = overrides.filter(
    (o) => o.overridePriceCents !== null || o.overrideDurationMin !== null || !o.isAvailable
  );
  const noOverride = overrides.filter(
    (o) => o.overridePriceCents === null && o.overrideDurationMin === null && o.isAvailable
  );

  return (
    <ScrollView contentContainerStyle={styles.root} testID="location-overrides-screen">
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ {locationName}</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Service overrides</Text>
      <Text style={styles.subtitle}>
        Customize prices, durations, or availability for this location.
      </Text>

      {loading ? <AdminLoadingState label="Loading overrides…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && overrides.length === 0 && !error ? (
        <AdminEmptyState
          title="No services configured"
          body="Services will appear here once your catalog has at least one service."
        />
      ) : null}

      {!loading && overrides.length > 0 ? (
        <>
          {activeOverrides.length > 0 ? (
            <>
              <Text style={styles.groupLabel}>Active overrides ({activeOverrides.length})</Text>
              <View style={styles.table}>
                {activeOverrides.map((o) => (
                  <Pressable
                    key={o.serviceId}
                    accessibilityRole="button"
                    onPress={() => onEditOverride(o.serviceId)}
                    style={[styles.row, styles.overrideRow]}
                    testID={`override-row-${o.serviceId}`}
                  >
                    <View style={styles.colService}>
                      <Text style={styles.serviceName} numberOfLines={1}>{o.serviceName}</Text>
                      {!o.isAvailable ? (
                        <View style={styles.unavailablePill}>
                          <Text style={styles.unavailableText}>Hidden at this location</Text>
                        </View>
                      ) : null}
                    </View>
                    <View style={styles.colValues}>
                      <View style={styles.valueBlock}>
                        <Text style={styles.baseVal}>{formatCents(o.basePriceCents, o.currency)}</Text>
                        {o.overridePriceCents !== null ? (
                          <Text style={styles.overrideVal}>
                            {formatCents(o.overridePriceCents, o.currency)}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.valueBlock}>
                        <Text style={styles.baseVal}>{formatDuration(o.baseDurationMin)}</Text>
                        {o.overrideDurationMin !== null ? (
                          <Text style={styles.overrideVal}>{formatDuration(o.overrideDurationMin)}</Text>
                        ) : null}
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          {noOverride.length > 0 ? (
            <>
              <Text style={styles.groupLabel}>Using catalog defaults ({noOverride.length})</Text>
              <View style={styles.table}>
                {noOverride.map((o) => (
                  <Pressable
                    key={o.serviceId}
                    accessibilityRole="button"
                    onPress={() => onEditOverride(o.serviceId)}
                    style={styles.row}
                    testID={`override-row-${o.serviceId}`}
                  >
                    <Text style={[styles.colService, styles.serviceName]} numberOfLines={1}>{o.serviceName}</Text>
                    <View style={styles.colValues}>
                      <Text style={styles.baseVal}>{formatCents(o.basePriceCents, o.currency)}</Text>
                      <Text style={styles.baseVal}>{formatDuration(o.baseDurationMin)}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}
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
  pageTitle: { fontSize: 24, lineHeight: 32, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  subtitle: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  groupLabel: { fontSize: 12, fontFamily: brandTypography.semibold, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4, marginTop: 12 },
  table: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F0EDE6" },
  overrideRow: { backgroundColor: "#FEFAF0" },
  colService: { flex: 2, gap: 4 },
  colValues: { flexDirection: "row", gap: 12, alignItems: "center" },
  valueBlock: { alignItems: "flex-end", gap: 2 },
  serviceName: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  unavailablePill: { alignSelf: "flex-start", backgroundColor: "#FEF2F2", borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 2 },
  unavailableText: { fontSize: 10, fontFamily: brandTypography.medium, color: "#EF4444" },
  baseVal: { fontSize: 12, fontFamily: brandTypography.regular, color: "#9CA3AF", textDecorationLine: "line-through" },
  overrideVal: { fontSize: 13, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
});
