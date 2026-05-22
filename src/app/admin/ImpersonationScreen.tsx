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

import type { ImpersonationSession } from "./platformAdminTypes";

export type ImpersonationScreenProps = {
  defaultTenantId?: string;
  loading: boolean;
  error: string | null;
  activeSession: ImpersonationSession | null;
  onStartImpersonation: (tenantId: string, userId: string, reason: string) => void;
  onEndImpersonation: () => void;
  onRetry?: () => void;
  onBack?: () => void;
  testID?: string;
};

export function ImpersonationScreen({
  defaultTenantId,
  loading,
  error,
  activeSession,
  onStartImpersonation,
  onEndImpersonation,
  onRetry,
  onBack,
  testID = "impersonation-screen",
}: ImpersonationScreenProps) {
  const [tenantId, setTenantId] = useState(defaultTenantId ?? "");
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  if (loading) {
    return (
      <View style={styles.center} testID={`${testID}-loading`}>
        <ActivityIndicator />
      </View>
    );
  }

  if (activeSession) {
    return (
      <ScrollView style={styles.root} testID={testID}>
        <View style={styles.banner} testID={`${testID}-active-banner`}>
          <Text style={styles.bannerTitle}>⚡ Impersonation Active</Text>
          <Text style={styles.bannerDetail}>Target tenant: {activeSession.targetTenantId}</Text>
          <Text style={styles.bannerDetail}>Target user: {activeSession.targetUserId}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.endBtn}
            onPress={onEndImpersonation}
            testID={`${testID}-end-session`}
          >
            <Text style={styles.endBtnText}>End Impersonation Session</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const isValid =
    tenantId.trim().length > 0 &&
    userId.trim().length > 0 &&
    reason.trim().length >= 10 &&
    acknowledged;

  return (
    <ScrollView style={styles.root} testID={testID}>
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} testID={`${testID}-back`}>
            <Text style={styles.cancelText}>← Back</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Impersonate User</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tenant ID *</Text>
        <TextInput
          style={styles.input}
          value={tenantId}
          onChangeText={setTenantId}
          placeholder="tenant-id"
          autoCapitalize="none"
          testID={`${testID}-tenant-id-input`}
        />
        <Text style={styles.label}>User ID *</Text>
        <TextInput
          style={styles.input}
          value={userId}
          onChangeText={setUserId}
          placeholder="user-id"
          autoCapitalize="none"
          testID={`${testID}-user-id-input`}
        />
        <Text style={styles.label}>Reason for Access *</Text>
        <TextInput
          style={styles.reasonInput}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          placeholder="Describe why you need access (min. 10 characters)…"
          testID={`${testID}-reason-input`}
        />
        {reason.trim().length > 0 && reason.trim().length < 10 && (
          <Text style={styles.validationError} testID={`${testID}-reason-error`}>
            Reason must be at least 10 characters.
          </Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.acknowledgeRow}
        onPress={() => setAcknowledged((v) => !v)}
        testID={`${testID}-acknowledge`}
        accessibilityRole="checkbox"
        accessibilityLabel="I acknowledge this action will be logged and audited"
        accessibilityState={{ checked: acknowledged }}
      >
        <View style={[styles.checkbox, acknowledged && styles.checkboxChecked]}>
          {acknowledged && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.acknowledgeText}>
          I acknowledge this action will be logged and audited
        </Text>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText} testID={`${testID}-error`}>{error}</Text>
          {onRetry && (
            <TouchableOpacity onPress={onRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.startBtn, !isValid && styles.btnDisabled]}
          onPress={() => isValid && onStartImpersonation(tenantId.trim(), userId.trim(), reason.trim())}
          disabled={!isValid}
          testID={`${testID}-start-btn`}
        >
          <Text style={styles.startBtnText}>Start Impersonation</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  cancelText: { color: "#6b7280", marginRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  banner: { backgroundColor: "#fef2f2", borderWidth: 2, borderColor: "#f87171", margin: 16, padding: 16, borderRadius: 8 },
  bannerTitle: { fontSize: 16, fontWeight: "700", color: "#dc2626", marginBottom: 8 },
  bannerDetail: { fontSize: 13, color: "#7f1d1d", marginBottom: 4 },
  section: { backgroundColor: "#ffffff", marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 8 },
  label: { fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, fontSize: 14 },
  reasonInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, fontSize: 14, minHeight: 90, textAlignVertical: "top", marginTop: 2 },
  validationError: { color: "#ef4444", fontSize: 12, marginTop: 4 },
  acknowledgeRow: { flexDirection: "row", alignItems: "flex-start", marginHorizontal: 16, marginBottom: 12, gap: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: "#7c3aed", borderRadius: 4, alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxChecked: { backgroundColor: "#7c3aed" },
  checkmark: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  acknowledgeText: { flex: 1, fontSize: 13, color: "#374151", lineHeight: 20 },
  errorBanner: { backgroundColor: "#fef2f2", margin: 16, padding: 12, borderRadius: 8 },
  errorText: { color: "#dc2626", fontSize: 14 },
  retryText: { color: "#2563eb", fontSize: 13, marginTop: 6 },
  actions: { padding: 16 },
  startBtn: { backgroundColor: "#7c3aed", padding: 16, borderRadius: 8, alignItems: "center" },
  startBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  endBtn: { backgroundColor: "#ef4444", padding: 16, borderRadius: 8, alignItems: "center" },
  endBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  btnDisabled: { opacity: 0.4 },
});

