import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { SecurityEvent, SecurityEventFilter, SecurityEventKind, SecurityEventSeverity } from "./platformAdminTypes";

export type SecurityEventsDashboardScreenProps = {
  loading: boolean;
  error: string | null;
  events: SecurityEvent[];
  filter: SecurityEventFilter;
  onChangeFilter: (f: SecurityEventFilter) => void;
  onResolveEvent: (eventId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const SEVERITY_COLORS: Record<SecurityEventSeverity, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  critical: "#ef4444",
};

export function SecurityEventsDashboardScreen({
  loading,
  error,
  events,
  filter,
  onChangeFilter,
  onResolveEvent,
  onRetry,
  onBack,
  testID = "security-events-dashboard-screen",
}: SecurityEventsDashboardScreenProps) {
  if (loading) {
    return (
      <View style={styles.center} testID={testID}>
        <ActivityIndicator testID="loading-indicator" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center} testID={testID}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRetry} testID="retry-btn" style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const unresolvedCount = events.filter((e) => !e.resolved).length;

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Security Events</Text>
      </View>

      {unresolvedCount > 0 && (
        <View style={styles.alertBanner} testID="unresolved-banner">
          <Text style={styles.alertText}>{unresolvedCount} unresolved event{unresolvedCount !== 1 ? "s" : ""}</Text>
        </View>
      )}

      <View style={styles.filterRow}>
        {(["low", "medium", "high", "critical"] as SecurityEventSeverity[]).map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.chip, filter.severity === s && { backgroundColor: SEVERITY_COLORS[s] }]}
            onPress={() => onChangeFilter({ ...filter, severity: filter.severity === s ? undefined : s })}
            testID={`severity-filter-${s}`}
          >
            <Text style={[styles.chipText, filter.severity === s && styles.chipTextActive]}>{s}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.chip, filter.resolved === false && styles.chipActive]}
          onPress={() => onChangeFilter({ ...filter, resolved: filter.resolved === false ? undefined : false })}
          testID="filter-unresolved"
        >
          <Text style={[styles.chipText, filter.resolved === false && styles.chipTextActive]}>Unresolved</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} testID="events-list">
        {events.length === 0 && (
          <Text style={styles.emptyText}>No security events found.</Text>
        )}
        {events.map((e) => (
          <View key={e.eventId} style={[styles.eventRow, e.resolved && styles.eventResolved]} testID={`event-${e.eventId}`}>
            <View style={styles.eventLeft}>
              <View style={styles.eventTitleRow}>
                <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLORS[e.severity] }]} />
                <Text style={styles.eventKind}>{e.kind.replace(/_/g, " ")}</Text>
              </View>
              <Text style={styles.eventDetail}>{e.detail}</Text>
              {e.actorEmail && <Text style={styles.eventMeta}>{e.actorEmail}</Text>}
              <Text style={styles.eventDate}>{e.occurredAt?.slice?.(0, 16).replace("T", " ")}</Text>
            </View>
            <View style={styles.eventRight}>
              {e.resolved ? (
                <Text style={styles.resolvedText}>✓ Resolved</Text>
              ) : (
                <TouchableOpacity
                  style={styles.resolveBtn}
                  onPress={() => onResolveEvent(e.eventId)}
                  testID={`resolve-btn-${e.eventId}`}
                >
                  <Text style={styles.resolveBtnText}>Resolve</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  backText: { color: "#6b7280", marginRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  alertBanner: { backgroundColor: "#fef2f2", padding: 10, alignItems: "center" },
  alertText: { color: "#dc2626", fontWeight: "700" },
  filterRow: { flexDirection: "row", padding: 12, backgroundColor: "#ffffff", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  chipActive: { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" },
  chipText: { fontSize: 11, color: "#374151" },
  chipTextActive: { color: "#ffffff" },
  scroll: { flex: 1 },
  eventRow: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 6, padding: 14, borderRadius: 8, flexDirection: "row" },
  eventResolved: { opacity: 0.6 },
  eventLeft: { flex: 1 },
  eventTitleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  eventKind: { fontSize: 13, fontWeight: "700", color: "#111827", textTransform: "capitalize" },
  eventDetail: { fontSize: 12, color: "#374151", marginBottom: 2 },
  eventMeta: { fontSize: 11, color: "#9ca3af" },
  eventDate: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  eventRight: { justifyContent: "center", marginLeft: 8 },
  resolvedText: { fontSize: 11, color: "#10b981", fontWeight: "600" },
  resolveBtn: { backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#d1d5db", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  resolveBtnText: { fontSize: 12, color: "#374151", fontWeight: "600" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
