/**
 * W40 — LocationDashboardScreen: per-location KPI dashboard (N.1.2).
 *
 * Shows today's KPIs (bookings, revenue, occupancy, walk-ins, open slots)
 * and a list of today's appointments for the selected location.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminEmptyState, AdminErrorState, AdminKpiTile, AdminLoadingState } from "./AdminPatterns";
import type { LocationKpi, TodayAppointment } from "./locationAdminService";

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

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return iso;
  }
}

function appointmentStatusColor(status: TodayAppointment["status"]): string {
  switch (status) {
    case "confirmed": return "#4CAF50";
    case "pending": return "#FF9800";
    case "completed": return "#A5C4D4";
    case "cancelled": return "#9CA3AF";
    case "no_show": return "#F44336";
    default: return "#9CA3AF";
  }
}

function appointmentStatusLabel(status: TodayAppointment["status"]): string {
  switch (status) {
    case "confirmed": return "Confirmed";
    case "pending": return "Pending";
    case "completed": return "Completed";
    case "cancelled": return "Cancelled";
    case "no_show": return "No-show";
    default: return status;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type LocationDashboardScreenProps = {
  loading: boolean;
  error: string | null;
  locationName: string;
  kpi: LocationKpi | null;
  appointments: TodayAppointment[];
  onNavigateToSettings: () => void;
  onRetry: () => void;
  onBack: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LocationDashboardScreen({
  loading,
  error,
  locationName,
  kpi,
  appointments,
  onNavigateToSettings,
  onRetry,
  onBack,
}: LocationDashboardScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root} testID="location-dashboard-screen">
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Locations</Text>
      </Pressable>
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle} numberOfLines={2}>{locationName}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onNavigateToSettings}
          style={styles.settingsBtn}
          testID="location-settings-btn"
        >
          <Text style={styles.settingsBtnLabel}>Settings</Text>
        </Pressable>
      </View>

      {loading ? <AdminLoadingState label="Loading dashboard…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {/* KPI tiles */}
      {kpi && !loading ? (
        <View style={styles.kpiGrid} testID="location-kpi-grid">
          <AdminKpiTile
            label="Bookings today"
            value={String(kpi.bookingsToday)}
            testID="kpi-bookings-today"
          />
          <AdminKpiTile
            label="Revenue today"
            value={formatCents(kpi.revenueToday, kpi.currency)}
            testID="kpi-revenue-today"
          />
          {kpi.occupancyPct !== null ? (
            <AdminKpiTile
              label="Occupancy"
              value={`${kpi.occupancyPct}%`}
              testID="kpi-occupancy"
            />
          ) : (
            <AdminKpiTile
              label="Occupancy"
              value="—"
              nullLabel="Coming soon"
              testID="kpi-occupancy"
            />
          )}
          <AdminKpiTile
            label="Walk-ins today"
            value={String(kpi.walkInsToday)}
            testID="kpi-walk-ins"
          />
          {kpi.openSlotsToday !== null ? (
            <AdminKpiTile
              label="Open slots"
              value={String(kpi.openSlotsToday)}
              testID="kpi-open-slots"
            />
          ) : (
            <AdminKpiTile
              label="Open slots"
              value="—"
              nullLabel="Coming soon"
              testID="kpi-open-slots"
            />
          )}
        </View>
      ) : null}

      {/* Today's appointments */}
      {!loading ? (
        <>
          <Text style={styles.sectionLabel}>Today's appointments</Text>
          {appointments.length === 0 ? (
            <AdminEmptyState
              title="No appointments today"
              body="There are no bookings scheduled for this location today."
            />
          ) : (
            <View style={styles.appointmentList}>
              {appointments.map((appt) => (
                <View
                  key={appt.appointmentId}
                  style={styles.appointmentRow}
                  testID={`appointment-row-${appt.appointmentId}`}
                >
                  <View
                    style={[styles.statusBar, { backgroundColor: appointmentStatusColor(appt.status) }]}
                  />
                  <View style={styles.appointmentContent}>
                    <View style={styles.appointmentHeader}>
                      <Text style={styles.apptTime}>{formatTime(appt.startTimeIso)}</Text>
                      <Text style={styles.apptDuration}>{appt.durationMin} min</Text>
                    </View>
                    <Text style={styles.apptService} numberOfLines={1}>{appt.serviceName}</Text>
                    <View style={styles.apptMeta}>
                      <Text style={styles.apptClient} numberOfLines={1}>{appt.clientName}</Text>
                      <Text style={styles.apptSeparator}>·</Text>
                      <Text style={styles.apptStaff} numberOfLines={1}>{appt.staffName}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusPill,
                      { backgroundColor: `${appointmentStatusColor(appt.status)}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        { color: appointmentStatusColor(appt.status) },
                      ]}
                    >
                      {appointmentStatusLabel(appt.status)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
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
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  pageTitle: { flex: 1, fontSize: 24, lineHeight: 32, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  settingsBtn: { backgroundColor: "#F7F4EC", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 9999, borderWidth: 1, borderColor: "#E5E0D1" },
  settingsBtnLabel: { fontSize: 13, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sectionLabel: { fontSize: 12, fontFamily: brandTypography.semibold, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4, marginTop: 8 },
  appointmentList: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", overflow: "hidden" },
  appointmentRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#E5E0D1" },
  statusBar: { width: 4, alignSelf: "stretch" },
  appointmentContent: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, gap: 2 },
  appointmentHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  apptTime: { fontSize: 13, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  apptDuration: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  apptService: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  apptMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  apptClient: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  apptSeparator: { fontSize: 12, color: "#9CA3AF" },
  apptStaff: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  statusPill: { marginHorizontal: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  statusPillText: { fontSize: 11, fontFamily: brandTypography.semibold },
});
