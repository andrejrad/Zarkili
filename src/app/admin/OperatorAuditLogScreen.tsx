/**
 * W47 — OperatorAuditLogScreen
 *
 * Displays a filtered, paginated view of admin audit log entries for a tenant.
 * Filters: by action type and by actor user ID.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type {
  AdminAuditAction,
  AdminAuditLogEntry,
  AdminAuditLogFilter,
} from "./auditLogRepository";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type OperatorAuditLogScreenProps = {
  loading: boolean;
  error: string | null;
  entries: AdminAuditLogEntry[];
  filters: AdminAuditLogFilter;
  onChangeFilters: (filters: AdminAuditLogFilter) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Friendly labels for know action groups shown as filter quick-picks */
const FILTER_CHIPS: { label: string; action: AdminAuditAction }[] = [
  { label: "Bookings", action: "booking.created" },
  { label: "Force Book", action: "booking.force_created" },
  { label: "Staff", action: "staff.invited" },
  { label: "Clients", action: "client.merged" },
  { label: "Plan", action: "subscription.plan_changed" },
  { label: "Reviews", action: "review.reply_sent" },
];

/** Map an action prefix to a color scheme */
function actionColors(action: string): { bg: string; text: string } {
  if (action.startsWith("booking.")) return { bg: "#DBEAFE", text: "#1E40AF" };
  if (action.startsWith("staff.")) return { bg: "#EDE9FE", text: "#5B21B6" };
  if (action.startsWith("client.")) return { bg: "#FCE7F3", text: "#9D174D" };
  if (action.startsWith("review.")) return { bg: "#FEF3C7", text: "#92400E" };
  if (action.startsWith("subscription.")) return { bg: "#D1FAE5", text: "#065F46" };
  if (action.startsWith("catalog.")) return { bg: "#FFF7ED", text: "#92400E" };
  if (action.startsWith("waitlist.")) return { bg: "#E0F2FE", text: "#0369A1" };
  if (action.startsWith("campaign.")) return { bg: "#FDF4FF", text: "#7E22CE" };
  return { bg: "#F3F4F6", text: "#374151" };
}

function actionLabel(action: string): string {
  return action.replace(/\./g, " › ").replace(/_/g, " ");
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) +
      " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function OperatorAuditLogScreen({
  loading,
  error,
  entries,
  filters,
  onChangeFilters,
  onRetry,
  onBack,
  testID = "operator-audit-log-screen",
}: OperatorAuditLogScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">Audit Log</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterBar} testID="filter-bar">
        <TextInput
          style={styles.filterInput}
          value={filters.actorUserId ?? ""}
          onChangeText={(v) =>
            onChangeFilters({ ...filters, actorUserId: v.trim() || undefined })
          }
          placeholder="Filter by actor ID…"
          accessibilityLabel="Filter by actor user ID"
          testID="filter-actor"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.actionChips}
          contentContainerStyle={styles.actionChipsContent}
        >
          <Pressable
            onPress={() => onChangeFilters({ ...filters, action: undefined })}
            style={[styles.chip, !filters.action && styles.chipActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: !filters.action }}
          >
            <Text style={[styles.chipText, !filters.action && styles.chipTextActive]}>All</Text>
          </Pressable>
          {FILTER_CHIPS.map(({ label, action }) => (
            <Pressable
              key={action}
              onPress={() =>
                onChangeFilters({ ...filters, action: filters.action === action ? undefined : action })
              }
              style={[styles.chip, filters.action === action && styles.chipActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: filters.action === action }}
            >
              <Text style={[styles.chipText, filters.action === action && styles.chipTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading && <AdminLoadingState label="Loading audit log…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}

      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {entries.length === 0 && (
            <View style={styles.emptyState} testID="empty-state">
              <Text style={styles.emptyText}>No audit entries match the current filters.</Text>
            </View>
          )}

          {entries.length > 0 && (
            <View style={styles.logList} testID="audit-entries">
              {entries.map((entry) => {
                const colors = actionColors(entry.action);
                return (
                  <View key={entry.id} style={styles.entryRow}>
                    <View
                      style={[styles.actionBadge, { backgroundColor: colors.bg }]}
                    >
                      <Text style={[styles.actionBadgeText, { color: colors.text }]}>
                        {actionLabel(entry.action)}
                      </Text>
                    </View>
                    <View style={styles.entryBody}>
                      <Text style={styles.entrySummary} numberOfLines={2}>
                        {entry.summary}
                      </Text>
                      <Text style={styles.entryMeta}>
                        {entry.actorRole} · {entry.actorUserId} · {formatTimestamp(entry.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <Text style={styles.footerNote}>
            Showing last {entries.length} entr{entries.length !== 1 ? "ies" : "y"} (max 100).
          </Text>
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

  filterBar: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 10,
  },
  filterInput: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...brandTypography.bodyMd,
    color: "#111827",
  },
  actionChips: { flexGrow: 0 },
  actionChipsContent: { gap: 8, paddingRight: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: "#FFFFFF",
  },
  chipActive: { borderColor: "#6366F1", backgroundColor: "#EEF2FF" },
  chipText: { ...brandTypography.labelSm, color: "#374151" },
  chipTextActive: { color: "#6366F1" },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 48 },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: { ...brandTypography.bodyMd, color: "#9CA3AF", textAlign: "center" },

  logList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  actionBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    minWidth: 80,
    alignItems: "center",
  },
  actionBadgeText: { ...brandTypography.labelSm, fontWeight: "600" },
  entryBody: { flex: 1, gap: 4 },
  entrySummary: { ...brandTypography.bodyMd, color: "#111827" },
  entryMeta: { ...brandTypography.labelSm, color: "#9CA3AF" },

  footerNote: {
    ...brandTypography.labelSm,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 16,
  },
});
