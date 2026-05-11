import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { TenantRecord } from "./platformAdminTypes";

export type TenantDetailScreenProps = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  tenant: TenantRecord | null;
  onSaveSupportNotes: (notes: string) => void;
  onSuspend: () => void;
  onReactivate: () => void;
  onViewAuditLog: () => void;
  onImpersonate: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

export function TenantDetailScreen({
  loading,
  saving,
  error,
  tenant,
  onSaveSupportNotes,
  onSuspend,
  onReactivate,
  onViewAuditLog,
  onImpersonate,
  onRetry,
  onBack,
  testID = "tenant-detail-screen",
}: TenantDetailScreenProps) {
  const [notes, setNotes] = useState(tenant?.supportNotes ?? "");

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

  if (!tenant) {
    return (
      <View style={styles.center} testID={testID}>
        <Text style={styles.errorText}>Tenant not found.</Text>
        <TouchableOpacity onPress={onBack} testID="back-btn" style={styles.retryBtn}>
          <Text style={styles.retryText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSuspended = tenant.status === "suspended";

  return (
    <ScrollView style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{tenant.displayName}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Tenant ID</Text>
          <Text style={styles.infoVal} testID="tenant-id">{tenant.tenantId}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Owner</Text>
          <Text style={styles.infoVal} testID="owner-email">{tenant.ownerEmail}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Plan</Text>
          <Text style={styles.infoVal} testID="plan">{tenant.plan}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Status</Text>
          <Text style={styles.infoVal} testID="status">{tenant.status}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Locations</Text>
          <Text style={styles.infoVal}>{tenant.locationCount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Staff</Text>
          <Text style={styles.infoVal}>{tenant.staffCount}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Health Score</Text>
          <Text style={styles.infoVal}>{tenant.healthScore} / 100</Text>
        </View>
        {tenant.lastActivityAt && (
          <View style={styles.infoRow}>
            <Text style={styles.infoKey}>Last Activity</Text>
            <Text style={styles.infoVal}>{tenant.lastActivityAt.slice(0, 10)}</Text>
          </View>
        )}
      </View>

      {isSuspended && tenant.suspendReason && (
        <View style={styles.suspendBanner}>
          <Text style={styles.suspendBannerText}>Suspended: {tenant.suspendReason}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Support Notes</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholder="Add internal support notes…"
          testID="support-notes-input"
        />
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => onSaveSupportNotes(notes)}
          disabled={saving}
          testID="save-notes-btn"
        >
          <Text style={styles.btnSecondaryText}>{saving ? "Saving…" : "Save Notes"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={onImpersonate} testID="impersonate-btn">
          <Text style={styles.btnText}>Impersonate</Text>
        </TouchableOpacity>
        {isSuspended ? (
          <TouchableOpacity style={[styles.btn, styles.btnSuccess]} onPress={onReactivate} testID="reactivate-btn">
            <Text style={styles.btnText}>Reactivate Tenant</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={onSuspend} testID="suspend-btn">
            <Text style={styles.btnText}>Suspend Tenant</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onViewAuditLog} testID="audit-log-btn">
          <Text style={styles.btnSecondaryText}>View Audit Log</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  backText: { color: "#6b7280", marginRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827", flex: 1 },
  section: { backgroundColor: "#ffffff", marginTop: 12, padding: 16, marginHorizontal: 12, borderRadius: 8 },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", marginBottom: 12 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  infoKey: { fontSize: 13, color: "#6b7280" },
  infoVal: { fontSize: 13, color: "#111827", fontWeight: "500" },
  suspendBanner: { backgroundColor: "#fef2f2", borderLeftWidth: 4, borderLeftColor: "#ef4444", padding: 12, marginHorizontal: 12, marginTop: 12, borderRadius: 4 },
  suspendBannerText: { color: "#dc2626", fontSize: 13 },
  notesInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 8, fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  actions: { padding: 16, gap: 10 },
  btn: { backgroundColor: "#1d4ed8", padding: 14, borderRadius: 8, alignItems: "center" },
  btnText: { color: "#ffffff", fontWeight: "700" },
  btnSecondary: { backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#d1d5db" },
  btnSecondaryText: { color: "#374151", fontWeight: "600" },
  btnDanger: { backgroundColor: "#ef4444" },
  btnSuccess: { backgroundColor: "#10b981" },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
