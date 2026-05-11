/**
 * W46 — WaitlistPoliciesScreen
 *
 * View and edit waitlist policy settings for the salon.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { WaitlistPolicy } from "../../domains/waitlist/waitlistAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type WaitlistPoliciesScreenProps = {
  loading: boolean;
  error: string | null;
  policy: WaitlistPolicy | null;
  form: WaitlistPolicy;
  saving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  onFormChange: <K extends keyof WaitlistPolicy>(field: K, value: WaitlistPolicy[K]) => void;
  onSave: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function WaitlistPoliciesScreen({
  loading,
  error,
  form,
  saving,
  saveError,
  saveSuccess,
  onFormChange,
  onSave,
  onRetry,
  onBack,
  testID = "waitlist-policies-screen",
}: WaitlistPoliciesScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Waitlist Policies</Text>
      </View>

      {loading ? <AdminLoadingState label="Loading policy…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && !error ? (
        <View style={styles.card}>
          {/* Numeric fields */}
          <NumberField
            label="Max Wait Days"
            value={form.maxWaitDays}
            onChange={(v) => onFormChange("maxWaitDays", v)}
            testID="max-wait-days-input"
          />
          <NumberField
            label="Auto-Cancel After Days"
            value={form.autoCancelAfterDays}
            onChange={(v) => onFormChange("autoCancelAfterDays", v)}
            testID="auto-cancel-days-input"
          />
          <NumberField
            label="Notify Lead Hours"
            value={form.notifyLeadHours}
            onChange={(v) => onFormChange("notifyLeadHours", v)}
            testID="notify-lead-hours-input"
          />
          <NumberField
            label="Max Entries Per Client"
            value={form.maxEntriesPerClient}
            onChange={(v) => onFormChange("maxEntriesPerClient", v)}
            testID="max-entries-input"
          />

          {/* Toggle fields */}
          <ToggleRow
            label="Notify on Open Slot"
            value={form.notifyOnOpenSlot}
            onChange={(v) => onFormChange("notifyOnOpenSlot", v)}
            testID="notify-on-open-switch"
          />
          <ToggleRow
            label="Require Confirmation"
            value={form.requireConfirmation}
            onChange={(v) => onFormChange("requireConfirmation", v)}
            testID="require-confirmation-switch"
          />
          <ToggleRow
            label="Allow Multiple Entries"
            value={form.allowMultipleEntries}
            onChange={(v) => onFormChange("allowMultipleEntries", v)}
            testID="allow-multiple-switch"
          />

          {saveError ? (
            <Text style={styles.errorText} testID="save-error">{saveError}</Text>
          ) : null}
          {saveSuccess ? (
            <Text style={styles.successText} testID="save-success">Policy saved.</Text>
          ) : null}

          <Pressable
            onPress={onSave}
            disabled={saving}
            accessibilityRole="button"
            testID="save-btn"
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Policy"}</Text>
          </Pressable>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NumberField({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  testID: string;
}) {
  return (
    <View style={subStyles.field}>
      <Text style={subStyles.label}>{label}</Text>
      <TextInput
        value={String(value)}
        onChangeText={(v) => onChange(parseInt(v, 10) || 0)}
        keyboardType="number-pad"
        style={subStyles.input}
        testID={testID}
        accessibilityLabel={label}
      />
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
  testID,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testID: string;
}) {
  return (
    <View style={subStyles.toggleRow}>
      <Text style={subStyles.toggleLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} testID={testID} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 16, backgroundColor: "#F2EDDD" },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { paddingVertical: 4 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6B6B6B" },
  title: { fontFamily: brandTypography.semibold, fontSize: 20, color: "#1A1A1A" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 16, gap: 16 },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#DC2626" },
  successText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#16A34A" },
  saveBtn: { backgroundColor: "#1A1A1A", borderRadius: 10, paddingVertical: 14, alignItems: "center" },
  saveBtnDisabled: { backgroundColor: "#D1D5DB" },
  saveBtnText: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#FFFFFF" },
});

const subStyles = StyleSheet.create({
  field: { gap: 6 },
  label: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#6B6B6B" },
  input: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 10,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    color: "#1A1A1A",
    textAlign: "center",
  },
  toggleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLabel: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#1A1A1A" },
});
