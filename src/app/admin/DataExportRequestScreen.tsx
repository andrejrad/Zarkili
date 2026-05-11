import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { DataExportRequest, DataExportRequestStatus } from "./platformAdminTypes";

export type DataExportRequestScreenProps = {
  loading: boolean;
  error: string | null;
  requests: DataExportRequest[];
  onProcessRequest: (requestId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const STATUS_COLORS: Record<DataExportRequestStatus, string> = {
  pending: "#f59e0b",
  processing: "#3b82f6",
  ready: "#10b981",
  delivered: "#6b7280",
  expired: "#9ca3af",
};

export function DataExportRequestScreen({
  loading,
  error,
  requests,
  onProcessRequest,
  onRetry,
  onBack,
  testID = "data-export-request-screen",
}: DataExportRequestScreenProps) {
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

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Data Export Requests</Text>
      </View>

      {pendingCount > 0 && (
        <View style={styles.pendingBanner} testID="pending-banner">
          <Text style={styles.pendingText}>
            {pendingCount} pending GDPR export request{pendingCount !== 1 ? "s" : ""}
          </Text>
        </View>
      )}

      <ScrollView style={styles.scroll} testID="requests-list">
        {requests.length === 0 && (
          <Text style={styles.emptyText}>No data export requests.</Text>
        )}
        {requests.map((r) => (
          <View key={r.requestId} style={styles.requestRow} testID={`request-${r.requestId}`}>
            <View style={styles.requestLeft}>
              <Text style={styles.userEmail} testID={`email-${r.requestId}`}>{r.requestingUserEmail}</Text>
              <Text style={styles.tenantId}>{r.tenantId}</Text>
              <Text style={styles.date}>Submitted: {r.submittedAt.slice(0, 10)}</Text>
              {r.completedAt && (
                <Text style={styles.date}>Completed: {r.completedAt.slice(0, 10)}</Text>
              )}
              {r.expiresAt && r.status === "ready" && (
                <Text style={styles.expiry}>Download expires: {r.expiresAt.slice(0, 10)}</Text>
              )}
            </View>
            <View style={styles.requestRight}>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[r.status] }]}>
                <Text style={styles.statusText}>{r.status}</Text>
              </View>
              {r.status === "pending" && (
                <TouchableOpacity
                  style={styles.processBtn}
                  onPress={() => onProcessRequest(r.requestId)}
                  testID={`process-btn-${r.requestId}`}
                >
                  <Text style={styles.processBtnText}>Process</Text>
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
  pendingBanner: { backgroundColor: "#fffbeb", padding: 12, alignItems: "center" },
  pendingText: { color: "#92400e", fontWeight: "600" },
  scroll: { flex: 1 },
  requestRow: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 8, padding: 16, borderRadius: 8, flexDirection: "row", justifyContent: "space-between" },
  requestLeft: { flex: 1 },
  userEmail: { fontSize: 14, fontWeight: "600", color: "#111827" },
  tenantId: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  date: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  expiry: { fontSize: 11, color: "#ef4444", marginTop: 2 },
  requestRight: { alignItems: "flex-end", gap: 8 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { color: "#ffffff", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  processBtn: { backgroundColor: "#1d4ed8", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  processBtnText: { color: "#ffffff", fontWeight: "600", fontSize: 12 },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
