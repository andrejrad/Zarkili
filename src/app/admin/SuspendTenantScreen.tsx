import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";

export type SuspendTenantScreenProps = {
  tenantId: string;
  tenantName: string;
  loading?: boolean;
  submitting?: boolean; // legacy alias
  error: string | null;
  onConfirmSuspend: (reason: string) => void;
  onCancel: () => void;
  testID?: string;
};

export function SuspendTenantScreen({
  tenantId,
  tenantName,
  loading,
  submitting,
  error,
  onConfirmSuspend,
  onCancel,
  testID = "suspend-tenant-screen",
}: SuspendTenantScreenProps) {
  const [reason, setReason] = useState("");
  const isValid = reason.trim().length >= 10;
  const busy = loading ?? submitting ?? false;

  return (
    <ScrollView style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} testID="cancel-btn">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Suspend Tenant</Text>
      </View>

      <View style={styles.warningBanner}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningText}>
          Suspending this tenant will immediately block all users from accessing the platform.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tenant</Text>
        <Text style={styles.value} testID="tenant-name">{tenantName}</Text>
        <Text style={styles.subValue} testID="tenant-id">{tenantId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Reason for Suspension *</Text>
        <TextInput
          style={styles.reasonInput}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={5}
          placeholder="Enter a reason (min. 10 characters)…"
          testID={`${testID}-reason`}
        />
        {reason.trim().length > 0 && reason.trim().length < 10 && (
          <Text style={styles.validationError}>Reason must be at least 10 characters.</Text>
        )}
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText} testID="error-message">{error}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.confirmBtn, (!isValid || busy) && styles.btnDisabled]}
          onPress={() => isValid && onConfirmSuspend(reason.trim())}
          disabled={!isValid || busy}
          testID={`${testID}-confirm`}
        >
          <Text style={styles.confirmBtnText}>
            {busy ? "Suspending…" : "Confirm Suspension"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtnLarge} onPress={onCancel} testID={`${testID}-cancel`}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  cancelText: { color: "#6b7280", marginRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  warningBanner: { backgroundColor: "#fff7ed", borderLeftWidth: 4, borderLeftColor: "#f59e0b", padding: 16, margin: 16, borderRadius: 8, flexDirection: "row", gap: 12 },
  warningIcon: { fontSize: 20 },
  warningText: { flex: 1, fontSize: 14, color: "#92400e", lineHeight: 20 },
  bold: { fontWeight: "700" },
  section: { backgroundColor: "#ffffff", marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 8 },
  label: { fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", marginBottom: 8 },
  value: { fontSize: 16, fontWeight: "600", color: "#111827" },
  subValue: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  reasonInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, fontSize: 14, minHeight: 100, textAlignVertical: "top" },
  validationError: { color: "#ef4444", fontSize: 12, marginTop: 4 },
  errorBanner: { backgroundColor: "#fef2f2", margin: 16, padding: 12, borderRadius: 8 },
  errorText: { color: "#dc2626", fontSize: 14 },
  actions: { padding: 16, gap: 10 },
  confirmBtn: { backgroundColor: "#ef4444", padding: 16, borderRadius: 8, alignItems: "center" },
  btnDisabled: { opacity: 0.4 },
  confirmBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  cancelBtnLarge: { backgroundColor: "#f3f4f6", padding: 16, borderRadius: 8, alignItems: "center", borderWidth: 1, borderColor: "#d1d5db" },
  cancelBtnText: { color: "#374151", fontWeight: "600" },
});
