import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import type { AntiTheftSignal, AntiTheftKpi } from "./marketplaceAdminTypes";

export type AntiTheftComplianceDashboardScreenProps = {
  loading: boolean;
  error: string | null;
  kpi: AntiTheftKpi | null;
  signals: AntiTheftSignal[];
  onInvestigate: (signalId: string, userId: string) => void;
  onEscalate: (signalId: string) => void;
  onDismiss: (signalId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const ANOMALY_LABELS: Record<string, string> = {
  no_show_fraud: "No-show fraud",
  refund_cluster: "Refund cluster",
  discount_abuse: "Discount abuse",
  after_hours_payment: "After-hours payment",
  invoice_tampering: "Invoice tampering",
  other: "Other",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  suspicious: { bg: "#fef9c3", text: "#92400e" },
  confirmed: { bg: "#fee2e2", text: "#b91c1c" },
  dismissed: { bg: "#f3f4f6", text: "#6b7280" },
  clean: { bg: "#d1fae5", text: "#065f46" },
};

function riskColor(score: number): string {
  if (score >= 75) return "#ef4444";
  if (score >= 50) return "#f59e0b";
  return "#10b981";
}

export function AntiTheftComplianceDashboardScreen({
  loading,
  error,
  kpi,
  signals,
  onInvestigate,
  onEscalate,
  onDismiss,
  onRetry,
  onBack,
  testID = "anti-theft-compliance-screen",
}: AntiTheftComplianceDashboardScreenProps) {
  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backLabel}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Anti-Theft & Compliance</Text>
      </View>

      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRetry} style={styles.retryBtn} testID="retry-btn">
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* KPI row */}
          {kpi && (
            <View style={styles.kpiRow} testID="kpi-row">
              <View style={[styles.kpiTile, { backgroundColor: "#fff" }]}>
                <Text style={styles.kpiValue}>{kpi.signalCount}</Text>
                <Text style={styles.kpiLabel}>Signals</Text>
              </View>
              <View style={[styles.kpiTile, { backgroundColor: kpi.confirmedCount > 0 ? "#fee2e2" : "#fff" }]}>
                <Text style={[styles.kpiValue, kpi.confirmedCount > 0 && styles.kpiValueDanger]}>
                  {kpi.confirmedCount}
                </Text>
                <Text style={styles.kpiLabel}>Confirmed</Text>
              </View>
              <View style={[styles.kpiTile, { backgroundColor: kpi.atRiskStaffCount > 0 ? "#fff7ed" : "#fff" }]}>
                <Text style={[styles.kpiValue, kpi.atRiskStaffCount > 0 && styles.kpiValueWarn]}>
                  {kpi.atRiskStaffCount}
                </Text>
                <Text style={styles.kpiLabel}>At-Risk Staff</Text>
              </View>
            </View>
          )}

          {/* Signals table */}
          <View style={styles.tableCard} testID="signals-table">
            <Text style={styles.sectionTitle}>
              {signals.length > 0 ? `${signals.length} Signal${signals.length !== 1 ? "s" : ""}` : "Signals"}
            </Text>
            {signals.length === 0 ? (
              <View style={styles.emptyState} testID="empty-state">
                <Text style={styles.emptyText}>No signals detected — system looks clean</Text>
              </View>
            ) : (
              signals.map((sig) => (
                <View key={sig.signalId} style={styles.signalRow} testID={`signal-row-${sig.signalId}`}>
                  {/* Top row: anomaly + risk score */}
                  <View style={styles.signalTopRow}>
                    <Text style={styles.anomalyLabel}>{ANOMALY_LABELS[sig.anomalyType] ?? sig.anomalyType}</Text>
                    <View style={styles.riskBadge}>
                      <Text style={[styles.riskScore, { color: riskColor(sig.riskScore) }]}>
                        Risk {sig.riskScore}
                      </Text>
                    </View>
                  </View>
                  {/* Staff + client */}
                  <Text style={styles.signalStaff} numberOfLines={1}>
                    Staff: <Text style={styles.signalStaffName}>{sig.staffName}</Text>
                    {sig.clientName ? `  ·  Client: ${sig.clientName}` : ""}
                  </Text>
                  {/* Amount + detected */}
                  <View style={styles.signalMidRow}>
                    <Text style={styles.signalMeta}>${sig.amountUsd.toFixed(2)}</Text>
                    <Text style={styles.signalMeta}>{sig.detectedAt.slice(0, 10)}</Text>
                    <View style={[styles.statusChip, { backgroundColor: STATUS_COLORS[sig.status]?.bg ?? "#f3f4f6" }]}>
                      <Text style={[styles.statusChipText, { color: STATUS_COLORS[sig.status]?.text ?? "#333" }]}>
                        {sig.status}
                      </Text>
                    </View>
                  </View>
                  {/* Actions */}
                  {sig.status !== "dismissed" && sig.status !== "clean" && (
                    <View style={styles.actionsRow}>
                      {sig.status === "suspicious" && (
                        <TouchableOpacity
                          onPress={() => onInvestigate(sig.signalId, sig.staffId)}
                          style={[styles.actionBtn, styles.actionBtnInvestigate]}
                          testID={`investigate-${sig.signalId}`}
                        >
                          <Text style={styles.actionBtnText}>Investigate</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        onPress={() => onEscalate(sig.signalId)}
                        style={[styles.actionBtn, styles.actionBtnEscalate]}
                        testID={`escalate-${sig.signalId}`}
                      >
                        <Text style={[styles.actionBtnText, { color: "#b91c1c" }]}>Escalate</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onDismiss(sig.signalId)}
                        style={[styles.actionBtn, styles.actionBtnDismiss]}
                        testID={`dismiss-${sig.signalId}`}
                      >
                        <Text style={[styles.actionBtnText, { color: "#6b7280" }]}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {sig.investigatedBy && (
                    <Text style={styles.signalInvestigated}>
                      Investigated by {sig.investigatedBy} on {sig.investigatedAt?.slice(0, 10)}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  backLabel: { fontSize: 16, color: "#007AFF", marginRight: 4 },
  title: { flex: 1, fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  errorText: { fontSize: 14, color: "#ef4444", textAlign: "center", paddingHorizontal: 24 },
  retryBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryBtnText: { color: "#fff", fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 14 },
  kpiRow: {
    flexDirection: "row",
    gap: 10,
  },
  kpiTile: {
    flex: 1,
    borderRadius: 10,
    padding: 14,
    alignItems: "center",
  },
  kpiValue: { fontSize: 24, fontWeight: "800", color: "#1a1a1a" },
  kpiValueDanger: { color: "#ef4444" },
  kpiValueWarn: { color: "#f59e0b" },
  kpiLabel: { fontSize: 12, color: "#888", marginTop: 4, textAlign: "center" },
  tableCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  emptyState: { paddingVertical: 32, alignItems: "center" },
  emptyText: { fontSize: 14, color: "#aaa" },
  signalRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    gap: 4,
  },
  signalTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  anomalyLabel: { fontSize: 14, fontWeight: "700", color: "#1a1a1a" },
  riskBadge: {},
  riskScore: { fontSize: 13, fontWeight: "700" },
  signalStaff: { fontSize: 13, color: "#555" },
  signalStaffName: { fontWeight: "600", color: "#1a1a1a" },
  signalMidRow: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 2 },
  signalMeta: { fontSize: 12, color: "#888" },
  statusChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusChipText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  actionsRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  actionBtn: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionBtnInvestigate: { backgroundColor: "#eff6ff" },
  actionBtnEscalate: { backgroundColor: "#fee2e2" },
  actionBtnDismiss: { backgroundColor: "#f3f4f6" },
  actionBtnText: { fontSize: 12, fontWeight: "600", color: "#007AFF" },
  signalInvestigated: { fontSize: 11, color: "#aaa", marginTop: 4 },
});
