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
  targetTenantId: string;
  targetTenantName: string;
  submitting: boolean;
  error: string | null;
  activeSession: ImpersonationSession | null;
  onStartImpersonation: (targetUserId: string, targetUserEmail: string, reason: string) => void;
  onEndImpersonation: () => void;
  onCancel: () => void;
  testID?: string;
};

export function ImpersonationScreen({
  targetTenantId,
  targetTenantName,
  submitting,
  error,
  activeSession,
  onStartImpersonation,
  onEndImpersonation,
  onCancel,
  testID = "impersonation-screen",
}: ImpersonationScreenProps) {
  const [targetUserId, setTargetUserId] = useState("");
  const [targetUserEmail, setTargetUserEmail] = useState("");
  const [reason, setReason] = useState("");

  const isValid = targetUserId.trim().length > 0 && targetUserEmail.includes("@") && reason.trim().length >= 10;

  if (activeSession) {
    const expires = new Date(activeSession.expiresAt);
    return (
      <ScrollView style={styles.root} testID={testID}>
        <View style={styles.banner} testID="active-session-banner">
          <Text style={styles.bannerTitle}>⚡ Impersonation Active</Text>
          <Text style={styles.bannerDetail}>Viewing as: {activeSession.targetUserEmail}</Text>
          <Text style={styles.bannerDetail}>Tenant: {targetTenantName}</Text>
          <Text style={styles.bannerDetail}>
            Expires: {expires.toLocaleTimeString()} (30-min cap)
          </Text>
          <Text style={styles.bannerDetail}>Reason: {activeSession.reason}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.endBtn}
            onPress={onEndImpersonation}
            disabled={submitting}
            testID="end-impersonation-btn"
          >
            <Text style={styles.endBtnText}>
              {submitting ? "Ending…" : "End Impersonation Session"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} testID="cancel-btn">
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Impersonate User</Text>
      </View>

      <View style={styles.warningBanner}>
        <Text style={styles.warningIcon}>🔐</Text>
        <Text style={styles.warningText}>
          Impersonation sessions are capped at <Text style={styles.bold}>30 minutes</Text> and are fully
          audited. Owner consent is required. An on-screen banner will be shown during the session.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Tenant</Text>
        <Text style={styles.value} testID="target-tenant">{targetTenantName}</Text>
        <Text style={styles.subValue}>{targetTenantId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Target User ID *</Text>
        <TextInput
          style={styles.input}
          value={targetUserId}
          onChangeText={setTargetUserId}
          placeholder="uid-xxxx"
          autoCapitalize="none"
          testID="user-id-input"
        />
        <Text style={styles.label}>Target User Email *</Text>
        <TextInput
          style={styles.input}
          value={targetUserEmail}
          onChangeText={setTargetUserEmail}
          placeholder="user@salon.com"
          keyboardType="email-address"
          autoCapitalize="none"
          testID="user-email-input"
        />
        <Text style={styles.label}>Reason (min. 10 chars) *</Text>
        <TextInput
          style={styles.reasonInput}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={4}
          placeholder="Reason for impersonation…"
          testID="reason-input"
        />
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText} testID="error-message">{error}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.startBtn, (!isValid || submitting) && styles.btnDisabled]}
          onPress={() => isValid && onStartImpersonation(targetUserId.trim(), targetUserEmail.trim(), reason.trim())}
          disabled={!isValid || submitting}
          testID="start-impersonation-btn"
        >
          <Text style={styles.startBtnText}>
            {submitting ? "Starting…" : "Start Impersonation"}
          </Text>
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
  warningBanner: { backgroundColor: "#fffbeb", borderLeftWidth: 4, borderLeftColor: "#d97706", padding: 16, margin: 16, borderRadius: 8, flexDirection: "row", gap: 12 },
  warningIcon: { fontSize: 20 },
  warningText: { flex: 1, fontSize: 13, color: "#78350f", lineHeight: 20 },
  bold: { fontWeight: "700" },
  banner: { backgroundColor: "#fef2f2", borderWidth: 2, borderColor: "#f87171", margin: 16, padding: 16, borderRadius: 8 },
  bannerTitle: { fontSize: 16, fontWeight: "700", color: "#dc2626", marginBottom: 8 },
  bannerDetail: { fontSize: 13, color: "#7f1d1d", marginBottom: 4 },
  section: { backgroundColor: "#ffffff", marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 8 },
  label: { fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", marginBottom: 6, marginTop: 8 },
  value: { fontSize: 15, fontWeight: "600", color: "#111827" },
  subValue: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, fontSize: 14 },
  reasonInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, fontSize: 14, minHeight: 80, textAlignVertical: "top" },
  errorBanner: { backgroundColor: "#fef2f2", margin: 16, padding: 12, borderRadius: 8 },
  errorText: { color: "#dc2626", fontSize: 14 },
  actions: { padding: 16 },
  startBtn: { backgroundColor: "#7c3aed", padding: 16, borderRadius: 8, alignItems: "center" },
  startBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  endBtn: { backgroundColor: "#ef4444", padding: 16, borderRadius: 8, alignItems: "center" },
  endBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  btnDisabled: { opacity: 0.4 },
});
