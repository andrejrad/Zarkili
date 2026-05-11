/**
 * W45 — ActivityCatalogScreen
 *
 * List of loyalty activities / challenges with status and quick actions.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { ActivityAdminEntry } from "../../domains/loyalty/loyaltyAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ActivityCatalogScreenProps = {
  loading: boolean;
  error: string | null;
  activities: ActivityAdminEntry[];
  onViewAnalytics: (activityId: string) => void;
  onToggleStatus: (activityId: string, currentStatus: ActivityAdminEntry["status"]) => void;
  onCreateActivity: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const STATUS_COLORS: Record<ActivityAdminEntry["status"], string> = {
  draft: "#6b7280",
  active: "#16a34a",
  inactive: "#f59e0b",
  expired: "#ef4444",
};

const STATUS_BG: Record<ActivityAdminEntry["status"], string> = {
  draft: "#f3f4f6",
  active: "#dcfce7",
  inactive: "#fef3c7",
  expired: "#fee2e2",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ActivityCatalogScreen({
  loading,
  error,
  activities,
  onViewAnalytics,
  onToggleStatus,
  onCreateActivity,
  onRetry,
  onBack,
  testID = "activity-catalog-screen",
}: ActivityCatalogScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Activities</Text>
        <Pressable onPress={onCreateActivity} accessibilityRole="button" testID="create-activity-btn" style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ New</Text>
        </Pressable>
      </View>

      {loading && <AdminLoadingState label="Loading activities…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && activities.length === 0 && (
        <AdminEmptyState
          title="No activities"
          body="Create your first loyalty activity or challenge."
          cta="Create activity"
          onCta={onCreateActivity}
        />
      )}
      {!loading && !error && activities.length > 0 && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {activities.map((a) => (
            <View key={a.activityId} style={styles.card} testID={`activity-item-${a.activityId}`}>
              <View style={styles.cardTop}>
                <Text style={styles.activityName}>{a.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[a.status] }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[a.status] }]}>
                    {a.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.metaText}>
                {a.type.replace("_", " ")} · {a.participantCount} participants · {a.completionCount} completions
              </Text>
              <Text style={styles.dateText}>
                {a.startDate} → {a.endDate}
              </Text>
              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => onViewAnalytics(a.activityId)}
                  accessibilityRole="button"
                  testID={`view-analytics-${a.activityId}`}
                >
                  <Text style={styles.linkText}>Analytics</Text>
                </Pressable>
                <Pressable
                  onPress={() => onToggleStatus(a.activityId, a.status)}
                  accessibilityRole="button"
                  testID={`toggle-status-${a.activityId}`}
                >
                  <Text style={styles.linkText}>
                    {a.status === "active" ? "Deactivate" : "Activate"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  backBtn: { paddingRight: 8 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6b7280" },
  title: { flex: 1, fontFamily: brandTypography.semibold, fontSize: 18, color: "#111827" },
  addBtn: { paddingLeft: 8 },
  addBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#4f46e5" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  activityName: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#111827", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontFamily: brandTypography.semibold, fontSize: 11 },
  metaText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6b7280" },
  dateText: { fontFamily: brandTypography.regular, fontSize: 11, color: "#9ca3af" },
  actionRow: { flexDirection: "row", gap: 16, marginTop: 4 },
  linkText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#4f46e5" },
});
