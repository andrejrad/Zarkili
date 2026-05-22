/**
 * W40 — AdminWalkInQueueScreen: admin walk-in queue management (N.5).
 *
 * Admin variant of the staff walk-in queue. Shows all entries with
 * staff assignment column. Drag-to-reassign is a W43 enhancement.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { WalkInQueueEntry, WalkInStatus } from "./locationAdminService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function waitDuration(isoSince: string): string {
  const ms = Date.now() - new Date(isoSince).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function statusColor(status: WalkInStatus): string {
  switch (status) {
    case "waiting": return "#FF9800";
    case "seated": return "#22C55E";
    case "no_show": return "#F44336";
    case "cancelled": return "#9CA3AF";
    default: return "#9CA3AF";
  }
}

function statusLabel(status: WalkInStatus): string {
  switch (status) {
    case "waiting": return "Waiting";
    case "seated": return "Seated";
    case "no_show": return "No-show";
    case "cancelled": return "Cancelled";
    default: return status;
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdminWalkInQueueScreenProps = {
  loading: boolean;
  error: string | null;
  locationName: string;
  queue: WalkInQueueEntry[];
  onAddWalkIn: () => void;
  onMarkSeated: (entryId: string) => void;
  onMarkNoShow: (entryId: string) => void;
  onRetry: () => void;
  onBack: () => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminWalkInQueueScreen({
  loading,
  error,
  locationName,
  queue,
  onAddWalkIn,
  onMarkSeated,
  onMarkNoShow,
  onRetry,
  onBack,
}: AdminWalkInQueueScreenProps) {
  const active = queue.filter((e) => e.status === "waiting" || e.status === "seated");
  const finished = queue.filter((e) => e.status === "no_show" || e.status === "cancelled");

  return (
    <ScrollView contentContainerStyle={styles.root} testID="admin-walk-in-queue-screen">
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ {locationName}</Text>
      </Pressable>
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Walk-in queue</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onAddWalkIn}
          style={styles.addBtn}
          testID="add-walk-in-btn"
        >
          <Text style={styles.addBtnLabel}>+ Add walk-in</Text>
        </Pressable>
      </View>

      {/* Queue count summary */}
      {!loading && active.length > 0 ? (
        <View style={styles.summaryBadge} testID="queue-count-badge">
          <Text style={styles.summaryText}>
            {active.filter((e) => e.status === "waiting").length} waiting
            {active.filter((e) => e.status === "seated").length > 0
              ? ` · ${active.filter((e) => e.status === "seated").length} seated`
              : ""}
          </Text>
        </View>
      ) : null}

      {loading ? <AdminLoadingState label="Loading queue…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && active.length === 0 && !error ? (
        <AdminEmptyState
          title="Queue is empty"
          body="No walk-ins waiting. Tap '+ Add walk-in' to add a party."
          cta="Add walk-in"
          onCta={onAddWalkIn}
        />
      ) : null}

      {!loading && active.length > 0 ? (
        <View style={styles.queueList}>
          {active.map((entry, idx) => (
            <View
              key={entry.entryId}
              style={[styles.entryRow, idx === active.length - 1 && styles.entryRowLast]}
              testID={`queue-entry-${entry.entryId}`}
            >
              <View
                style={[styles.statusBar, { backgroundColor: statusColor(entry.status) }]}
              />
              <View style={styles.entryContent}>
                <View style={styles.entryHeader}>
                  <Text style={styles.clientName}>{entry.clientName}</Text>
                  <Text style={styles.partySize}>Party of {entry.partySize}</Text>
                </View>
                <View style={styles.entryMeta}>
                  {entry.requestedServiceName ? (
                    <Text style={styles.metaText}>{entry.requestedServiceName}</Text>
                  ) : null}
                  {entry.requestedStaffName ? (
                    <Text style={styles.metaText}>→ {entry.requestedStaffName}</Text>
                  ) : null}
                  <Text style={styles.waitTime}>Waiting {waitDuration(entry.waitSinceIso)}</Text>
                </View>
                {entry.assignedStaffName ? (
                  <Text style={styles.assignedStaff}>Assigned: {entry.assignedStaffName}</Text>
                ) : null}
              </View>
              {entry.status === "waiting" ? (
                <View style={styles.actionBtns}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onMarkSeated(entry.entryId)}
                    style={styles.seatBtn}
                    testID={`seat-btn-${entry.entryId}`}
                  >
                    <Text style={styles.seatBtnLabel}>Seat</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => onMarkNoShow(entry.entryId)}
                    style={styles.noShowBtn}
                    testID={`no-show-btn-${entry.entryId}`}
                  >
                    <Text style={styles.noShowBtnLabel}>No-show</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={[styles.statusPill, { backgroundColor: `${statusColor(entry.status)}20` }]}>
                  <Text style={[styles.statusPillText, { color: statusColor(entry.status) }]}>
                    {statusLabel(entry.status)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ) : null}

      {finished.length > 0 ? (
        <>
          <Text style={styles.groupLabel}>Completed ({finished.length})</Text>
          <View style={styles.queueList}>
            {finished.map((entry, idx) => (
              <View
                key={entry.entryId}
                style={[styles.entryRow, styles.finishedRow, idx === finished.length - 1 && styles.entryRowLast]}
                testID={`queue-entry-${entry.entryId}`}
              >
                <Text style={styles.finishedName}>{entry.clientName}</Text>
                <View style={[styles.statusPill, { backgroundColor: `${statusColor(entry.status)}20` }]}>
                  <Text style={[styles.statusPillText, { color: statusColor(entry.status) }]}>
                    {statusLabel(entry.status)}
                  </Text>
                </View>
              </View>
            ))}
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
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { fontSize: 24, lineHeight: 32, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  addBtn: { backgroundColor: "#1A1A1A", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 9999 },
  addBtnLabel: { fontSize: 13, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  summaryBadge: { alignSelf: "flex-start", backgroundColor: "#FFF3E0", borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: "#FF9800" },
  summaryText: { fontSize: 13, fontFamily: brandTypography.semibold, color: "#92400E" },
  queueList: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", overflow: "hidden" },
  entryRow: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F0EDE6" },
  entryRowLast: { borderBottomWidth: 0 },
  finishedRow: { paddingVertical: 10, paddingHorizontal: 16 },
  statusBar: { width: 4, alignSelf: "stretch" },
  entryContent: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, gap: 3 },
  entryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clientName: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  partySize: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  entryMeta: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  metaText: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  waitTime: { fontSize: 12, fontFamily: brandTypography.medium, color: "#FF9800" },
  assignedStaff: { fontSize: 12, fontFamily: brandTypography.medium, color: "#22C55E" },
  actionBtns: { flexDirection: "row", gap: 8, paddingRight: 12 },
  seatBtn: { backgroundColor: "#22C55E", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9999 },
  seatBtnLabel: { fontSize: 12, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  noShowBtn: { backgroundColor: "#FEF2F2", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 9999, borderWidth: 1, borderColor: "#EF4444" },
  noShowBtnLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#EF4444" },
  statusPill: { marginRight: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  statusPillText: { fontSize: 11, fontFamily: brandTypography.semibold },
  groupLabel: { fontSize: 12, fontFamily: brandTypography.semibold, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4, marginTop: 12 },
  finishedName: { flex: 1, fontSize: 13, fontFamily: brandTypography.regular, color: "#9CA3AF" },
});
