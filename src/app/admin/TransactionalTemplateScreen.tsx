/**
 * W45 — TransactionalTemplateScreen
 *
 * Six template type tabs (booking_confirmation, booking_reminder, no_show,
 * cancellation, receipt, password_reset) with channel chips, default preview,
 * and override editor (save / reset to default).
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
  TransactionalTemplateChannel,
  TransactionalTemplateDefault,
  TransactionalTemplateOverride,
  TransactionalTemplateType,
} from "../../domains/campaigns/campaignAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type TransactionalTemplateScreenProps = {
  loading: boolean;
  error: string | null;
  defaults: TransactionalTemplateDefault[];
  overrides: TransactionalTemplateOverride[];
  activeType: TransactionalTemplateType;
  activeChannel: TransactionalTemplateChannel;
  overrideBody: string;
  overrideSubject: string;
  saving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
  onTypeChange: (t: TransactionalTemplateType) => void;
  onChannelChange: (c: TransactionalTemplateChannel) => void;
  onOverrideBodyChange: (v: string) => void;
  onOverrideSubjectChange: (v: string) => void;
  onSaveOverride: () => void;
  onResetOverride: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const TEMPLATE_TYPES: TransactionalTemplateType[] = [
  "booking_confirmation",
  "booking_reminder",
  "no_show",
  "cancellation",
  "receipt",
  "password_reset",
];

const TYPE_LABELS: Record<TransactionalTemplateType, string> = {
  booking_confirmation: "Confirmation",
  booking_reminder: "Reminder",
  no_show: "No-show",
  cancellation: "Cancellation",
  receipt: "Receipt",
  password_reset: "Password reset",
};

const CHANNELS: TransactionalTemplateChannel[] = ["email", "sms", "push"];

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function TransactionalTemplateScreen({
  loading,
  error,
  defaults,
  overrides,
  activeType,
  activeChannel,
  overrideBody,
  overrideSubject,
  saving,
  saveError,
  saveSuccess,
  onTypeChange,
  onChannelChange,
  onOverrideBodyChange,
  onOverrideSubjectChange,
  onSaveOverride,
  onResetOverride,
  onRetry,
  onBack,
  testID = "transactional-template-screen",
}: TransactionalTemplateScreenProps) {
  const currentDefault = defaults.find(
    (d) => d.templateType === activeType && d.channel === activeChannel,
  );
  const currentOverride = overrides.find(
    (o) => o.templateType === activeType && o.channel === activeChannel,
  );

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Transactional Templates</Text>
      </View>

      {loading && <AdminLoadingState label="Loading templates…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Type tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
            {TEMPLATE_TYPES.map((t) => (
              <Pressable
                key={t}
                onPress={() => onTypeChange(t)}
                style={[styles.tab, activeType === t && styles.tabActive]}
                testID={`type-tab-${t}`}
              >
                <Text style={[styles.tabText, activeType === t && styles.tabTextActive]}>
                  {TYPE_LABELS[t]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Channel chips */}
          <View style={styles.chipRow} testID="channel-chips">
            {CHANNELS.map((c) => (
              <Pressable
                key={c}
                onPress={() => onChannelChange(c)}
                style={[styles.chip, activeChannel === c && styles.chipActive]}
                testID={`channel-chip-${c}`}
              >
                <Text style={[styles.chipText, activeChannel === c && styles.chipTextActive]}>
                  {c.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Default preview */}
          {currentDefault && (
            <View style={styles.defaultCard} testID="default-preview">
              <Text style={styles.cardTitle}>System default</Text>
              {currentDefault.subject && (
                <Text style={styles.defaultField}>Subject: {currentDefault.subject}</Text>
              )}
              <Text style={styles.defaultBody}>{currentDefault.body}</Text>
              <Text style={styles.variablesText}>
                Variables: {currentDefault.variables.join(", ")}
              </Text>
            </View>
          )}

          {/* Override editor */}
          <Text style={styles.sectionLabel}>
            {currentOverride ? "Your override" : "Add override"}
          </Text>
          {activeChannel === "email" && (
            <>
              <Text style={styles.fieldLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                value={overrideSubject}
                onChangeText={onOverrideSubjectChange}
                placeholder="Override subject…"
                testID="override-subject-input"
              />
            </>
          )}
          <Text style={styles.fieldLabel}>Body</Text>
          <TextInput
            style={[styles.input, styles.bodyInput]}
            value={overrideBody}
            onChangeText={onOverrideBodyChange}
            multiline
            placeholder="Override body…"
            testID="override-body-input"
          />

          {saveError && <Text style={styles.errorText}>{saveError}</Text>}
          {saveSuccess && <Text style={styles.successText}>Override saved.</Text>}

          <View style={styles.actionRow}>
            {currentOverride && (
              <Pressable
                onPress={onResetOverride}
                accessibilityRole="button"
                testID="reset-override-btn"
                style={styles.resetBtn}
              >
                <Text style={styles.resetBtnText}>Reset to default</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onSaveOverride}
              disabled={saving}
              accessibilityRole="button"
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              testID="save-override-btn"
            >
              <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save override"}</Text>
            </Pressable>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  backBtn: { paddingRight: 8 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6b7280" },
  title: { fontFamily: brandTypography.semibold, fontSize: 18, color: "#111827" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  tabs: { maxHeight: 44 },
  tabsContent: { gap: 6 },
  tab: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  tabActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  tabText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#374151" },
  tabTextActive: { color: "#fff" },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#374151" },
  chipTextActive: { color: "#fff" },
  defaultCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    gap: 4,
  },
  cardTitle: { fontFamily: brandTypography.semibold, fontSize: 12, color: "#16a34a" },
  defaultField: { fontFamily: brandTypography.regular, fontSize: 12, color: "#374151" },
  defaultBody: { fontFamily: brandTypography.regular, fontSize: 13, color: "#111827" },
  variablesText: { fontFamily: brandTypography.regular, fontSize: 11, color: "#6b7280" },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#374151" },
  fieldLabel: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6b7280" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  bodyInput: { minHeight: 100, textAlignVertical: "top" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#ef4444" },
  successText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#16a34a" },
  actionRow: { flexDirection: "row", gap: 12, justifyContent: "flex-end" },
  resetBtn: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  resetBtnText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#374151" },
  saveBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#fff" },
});
