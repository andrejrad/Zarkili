/**
 * W47 — BookingFunnelScreen
 *
 * Visualises the booking conversion funnel:
 * Inquiries → Confirmed → Completed → No-Show / Cancelled
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { BookingFunnelData } from "./analyticsTypes";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type BookingFunnelScreenProps = {
  loading: boolean;
  error: string | null;
  funnel: BookingFunnelData | null;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function BookingFunnelScreen({
  loading,
  error,
  funnel,
  onRetry,
  onBack,
  testID = "booking-funnel-screen",
}: BookingFunnelScreenProps) {
  const maxCount = funnel
    ? Math.max(...funnel.stages.map((s) => s.count), 1)
    : 1;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">Booking Funnel</Text>
      </View>

      {loading && <AdminLoadingState label="Loading funnel data…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && funnel && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.dateLabel} testID="date-range-label">
            {funnel.dateRangeLabel}
          </Text>

          {/* Funnel bars */}
          <View style={styles.funnelContainer} testID="funnel-bars">
            {funnel.stages.map((stage, idx) => {
              const barWidth =
                maxCount > 0 ? Math.max((stage.count / maxCount) * 100, 2) : 2;
              return (
                <View key={stage.label} style={styles.stageRow}>
                  <Text style={styles.stageLabel}>{stage.label}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[styles.barFill, { width: `${barWidth}%` }]}
                      accessibilityLabel={`${stage.label}: ${stage.count}`}
                    />
                  </View>
                  <Text style={styles.stageCount}>{stage.count}</Text>
                  {idx > 0 && stage.dropOffRate != null && (
                    <Text style={styles.dropOff}>
                      ↓ {(stage.dropOffRate * 100).toFixed(1)}%
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {/* Summary table */}
          <Text style={styles.sectionLabel}>Stage Summary</Text>
          <View style={styles.card} testID="stage-summary">
            {funnel.stages.map((stage) => (
              <View key={stage.label} style={styles.tableRow}>
                <Text style={styles.tableCell}>{stage.label}</Text>
                <Text style={styles.tableCellRight}>{stage.count.toLocaleString()}</Text>
                {stage.dropOffRate != null && (
                  <Text style={styles.dropOffCell}>
                    {(stage.dropOffRate * 100).toFixed(1)}% drop
                  </Text>
                )}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  backBtn: { padding: 4 },
  backText: { ...brandTypography.labelMd, color: "#6366F1" },
  title: { ...brandTypography.headingMd, color: "#111827", flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 48 },
  dateLabel: { ...brandTypography.labelSm, color: "#6B7280", marginBottom: 20 },
  sectionLabel: {
    ...brandTypography.labelSm,
    color: "#6B7280",
    marginTop: 24,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  funnelContainer: { gap: 12 },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  stageLabel: { ...brandTypography.labelSm, color: "#374151", width: 96 },
  barTrack: {
    flex: 1,
    height: 28,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: "#6366F1", borderRadius: 4 },
  stageCount: { ...brandTypography.labelMd, color: "#111827", minWidth: 40, textAlign: "right" },
  dropOff: { ...brandTypography.labelSm, color: "#EF4444", minWidth: 56, textAlign: "right" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  tableCell: { flex: 1, ...brandTypography.bodyMd, color: "#111827" },
  tableCellRight: { ...brandTypography.labelMd, color: "#374151", minWidth: 56, textAlign: "right" },
  dropOffCell: { ...brandTypography.labelSm, color: "#EF4444", minWidth: 72, textAlign: "right" },
});
