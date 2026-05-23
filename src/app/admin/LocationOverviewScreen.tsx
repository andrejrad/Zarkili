/**
 * W40 — LocationOverviewScreen: multi-location overview table (N.1.1).
 *
 * Shows all tenant locations with today's KPIs. Tapping a row navigates to
 * the per-location dashboard.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { Location } from "../../domains/locations/model";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { LocationKpi } from "./locationAdminService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatAddress(location: Location): string {
  const { address } = location;
  const parts: string[] = [];
  if (address.line1) parts.push(address.line1);
  if (address.city) parts.push(address.city);
  return parts.join(", ");
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LocationOverviewScreenProps = {
  loading: boolean;
  error: string | null;
  locations: Location[];
  kpis: LocationKpi[];
  onSelectLocation: (locationId: string) => void;
  onAddLocation: () => void;
  onRetry: () => void;
  onBack: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LocationOverviewScreen({
  loading,
  error,
  locations,
  kpis,
  onSelectLocation,
  onAddLocation,
  onRetry,
  onBack,
}: LocationOverviewScreenProps) {
  const kpiMap = new Map(kpis.map((k) => [k.locationId, k]));

  return (
    <ScrollView contentContainerStyle={styles.root} testID="location-overview-screen">
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Dashboard</Text>
      </Pressable>
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Locations</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onAddLocation}
          style={styles.addBtn}
          testID="add-location-btn"
        >
          <Text style={styles.addBtnLabel}>+ Add</Text>
        </Pressable>
      </View>

      {loading ? <AdminLoadingState label="Loading locations…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && !error && locations.length === 0 ? (
        <AdminEmptyState
          title="No locations yet"
          body="Add your first location to start managing bookings."
          cta="Add location"
          onCta={onAddLocation}
        />
      ) : null}

      {!loading && locations.length > 0 ? (
        <View style={styles.table}>
          {/* Header row */}
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.colName, styles.headerCell]}>Location</Text>
            <Text style={[styles.colBookings, styles.headerCell]}>Bookings</Text>
            <Text style={[styles.colRevenue, styles.headerCell]}>Revenue</Text>
            <Text style={[styles.colStatus, styles.headerCell]}>Status</Text>
          </View>

          {locations.map((loc) => {
            const kpi = kpiMap.get(loc.locationId);
            return (
              <Pressable
                key={loc.locationId}
                accessibilityRole="button"
                onPress={() => onSelectLocation(loc.locationId)}
                style={styles.tableRow}
                testID={`location-row-${loc.locationId}`}
              >
                <View style={styles.colName}>
                  <Text style={styles.locName} numberOfLines={1}>{loc.name}</Text>
                  <Text style={styles.locAddress} numberOfLines={1}>{formatAddress(loc)}</Text>
                </View>
                <Text style={[styles.colBookings, styles.cellText]}>
                  {kpi?.bookingsToday ?? "—"}
                </Text>
                <Text style={[styles.colRevenue, styles.cellText]}>
                  {kpi
                    ? formatCents(kpi.revenueToday, kpi.currency)
                    : "—"}
                </Text>
                <View style={styles.colStatus}>
                  <View
                    style={[
                      styles.statusPill,
                      loc.status === "active" ? styles.pillActive : styles.pillInactive,
                    ]}
                    testID={`location-status-${loc.locationId}`}
                  >
                    <Text style={styles.statusPillText}>
                      {loc.status === "active" ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
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
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { fontSize: 26, lineHeight: 34, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  addBtn: { backgroundColor: "#1A1A1A", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 9999 },
  addBtnLabel: { fontSize: 13, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  table: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", overflow: "hidden" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E5E0D1" },
  tableHeader: { backgroundColor: "#F7F4EC" },
  headerCell: { fontSize: 11, fontFamily: brandTypography.semibold, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.4 },
  colName: { flex: 3, gap: 2 },
  colBookings: { flex: 1, textAlign: "center" },
  colRevenue: { flex: 2, textAlign: "right" },
  colStatus: { flex: 1.5, alignItems: "flex-end" },
  locName: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  locAddress: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  cellText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  pillActive: { backgroundColor: "#EBFBF1" },
  pillInactive: { backgroundColor: "#F5F5F5" },
  statusPillText: { fontSize: 11, fontFamily: brandTypography.medium, color: "#1A1A1A" },
});
