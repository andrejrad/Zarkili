import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { ModerationQueueItem, ModerationItemStatus } from "./platformAdminTypes";

export type MarketplaceModerationQueueScreenProps = {
  loading: boolean;
  error: string | null;
  items: ModerationQueueItem[];
  statusFilter: ModerationItemStatus | undefined;
  onChangeStatusFilter: (s: ModerationItemStatus | undefined) => void;
  onFlagItem: (itemId: string) => void;
  onClearItem: (itemId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const STATUS_COLORS: Record<ModerationItemStatus, string> = {
  pending: "#f59e0b",
  flagged: "#ef4444",
  cleared: "#10b981",
  removed: "#6b7280",
};

export function MarketplaceModerationQueueScreen({
  loading,
  error,
  items,
  statusFilter,
  onChangeStatusFilter,
  onFlagItem,
  onClearItem,
  onRetry,
  onBack,
  testID = "marketplace-moderation-queue-screen",
}: MarketplaceModerationQueueScreenProps) {
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

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Moderation Queue</Text>
      </View>

      <View style={styles.filterRow}>
        {([undefined, "pending", "flagged", "cleared"] as (ModerationItemStatus | undefined)[]).map((s) => (
          <TouchableOpacity
            key={s ?? "all"}
            style={[styles.chip, statusFilter === s && styles.chipActive]}
            onPress={() => onChangeStatusFilter(s)}
            testID={`filter-${s ?? "all"}`}
          >
            <Text style={[styles.chipText, statusFilter === s && styles.chipTextActive]}>
              {s ?? "All"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.scroll} testID="moderation-list">
        {items.length === 0 && (
          <Text style={styles.emptyText}>Queue is empty.</Text>
        )}
        {items.map((item) => (
          <View key={item.itemId} style={styles.itemCard} testID={`item-${item.itemId}`}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemTitle}>{item.postTitle}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.itemTenant}>{item.tenantName}</Text>
            <Text style={styles.itemDesc} numberOfLines={2}>{item.postDescription}</Text>
            <Text style={styles.itemPrice}>${item.priceUsd.toFixed(2)}</Text>
            {item.flagReason && (
              <Text style={styles.flagReason}>Flag reason: {item.flagReason}</Text>
            )}
            {item.status === "pending" && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.flagBtn}
                  onPress={() => onFlagItem(item.itemId)}
                  testID={`flag-btn-${item.itemId}`}
                >
                  <Text style={styles.flagBtnText}>Flag</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => onClearItem(item.itemId)}
                  testID={`clear-btn-${item.itemId}`}
                >
                  <Text style={styles.clearBtnText}>Clear</Text>
                </TouchableOpacity>
              </View>
            )}
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
  filterRow: { flexDirection: "row", padding: 12, backgroundColor: "#ffffff", gap: 8 },
  chip: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  chipActive: { backgroundColor: "#1d4ed8", borderColor: "#1d4ed8" },
  chipText: { fontSize: 12, color: "#374151" },
  chipTextActive: { color: "#ffffff" },
  scroll: { flex: 1 },
  itemCard: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 8, padding: 16, borderRadius: 8 },
  itemHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  itemTitle: { fontSize: 14, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { color: "#ffffff", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  itemTenant: { fontSize: 12, color: "#6b7280", marginBottom: 4 },
  itemDesc: { fontSize: 13, color: "#374151", marginBottom: 4 },
  itemPrice: { fontSize: 13, fontWeight: "600", color: "#111827", marginBottom: 4 },
  flagReason: { fontSize: 12, color: "#ef4444", marginBottom: 8 },
  actionRow: { flexDirection: "row", gap: 8 },
  flagBtn: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#ef4444", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  flagBtnText: { color: "#dc2626", fontWeight: "600", fontSize: 13 },
  clearBtn: { backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#10b981", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  clearBtnText: { color: "#059669", fontWeight: "600", fontSize: 13 },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
