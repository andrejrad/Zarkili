/**
 * W45 — CampaignBuilderScreen
 *
 * Build and schedule a marketing campaign: segment, channel, body,
 * A/B toggle, compliance checklist, and create button.
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

import { brandTypography } from "../../shared/ui/brandTypography";
import type {
  CampaignBuilderInput,
  ComplianceCheckItem,
} from "../../domains/campaigns/campaignAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type CampaignBuilderScreenProps = {
  form: CampaignBuilderInput;
  complianceItems: ComplianceCheckItem[];
  creating: boolean;
  createError: string | null;
  createSuccess: boolean;
  onFormChange: (field: keyof CampaignBuilderInput, value: string | boolean) => void;
  onCreate: () => void;
  onRunCompliance: () => void;
  onBack: () => void;
  testID?: string;
};

const CHANNELS = ["email", "sms", "push"] as const;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function CampaignBuilderScreen({
  form,
  complianceItems,
  creating,
  createError,
  createSuccess,
  onFormChange,
  onCreate,
  onRunCompliance,
  onBack,
  testID = "campaign-builder-screen",
}: CampaignBuilderScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>New Campaign</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Name */}
        <Text style={styles.label}>Campaign name</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => onFormChange("name", v)}
          placeholder="e.g. Summer re-engagement"
          testID="campaign-name-input"
        />

        {/* Channel */}
        <Text style={styles.label}>Channel</Text>
        <View style={styles.chipRow} testID="channel-selector">
          {CHANNELS.map((c) => (
            <Pressable
              key={c}
              onPress={() => onFormChange("channel", c)}
              style={[styles.chip, form.channel === c && styles.chipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: form.channel === c }}
              testID={`channel-${c}`}
            >
              <Text style={[styles.chipText, form.channel === c && styles.chipTextActive]}>
                {c.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Segment */}
        <Text style={styles.label}>Segment</Text>
        <TextInput
          style={styles.input}
          value={form.segmentName}
          onChangeText={(v) => onFormChange("segmentName", v)}
          placeholder="Segment name / id"
          testID="segment-input"
        />

        {/* Subject (email only) */}
        {form.channel === "email" && (
          <>
            <Text style={styles.label}>Subject</Text>
            <TextInput
              style={styles.input}
              value={form.subject ?? ""}
              onChangeText={(v) => onFormChange("subject", v)}
              placeholder="Email subject line"
              testID="subject-input"
            />
          </>
        )}

        {/* Body */}
        <Text style={styles.label}>Message body</Text>
        <TextInput
          style={[styles.input, styles.bodyInput]}
          value={form.body}
          onChangeText={(v) => onFormChange("body", v)}
          multiline
          placeholder="Write your message here…"
          testID="body-input"
        />

        {/* A/B toggle */}
        <View style={styles.switchRow}>
          <Text style={styles.label}>A/B test</Text>
          <Switch
            value={form.abEnabled}
            onValueChange={(v) => onFormChange("abEnabled", v)}
            testID="ab-switch"
          />
        </View>
        {form.abEnabled && (
          <>
            <Text style={styles.label}>Variant B body</Text>
            <TextInput
              style={[styles.input, styles.bodyInput]}
              value={form.abVariantB ?? ""}
              onChangeText={(v) => onFormChange("abVariantB", v)}
              multiline
              placeholder="Variant B message…"
              testID="ab-variant-input"
            />
          </>
        )}

        {/* Scheduled at */}
        <Text style={styles.label}>Schedule (ISO-8601)</Text>
        <TextInput
          style={styles.input}
          value={form.scheduledAt}
          onChangeText={(v) => onFormChange("scheduledAt", v)}
          placeholder="2025-09-01T10:00:00Z"
          testID="schedule-input"
        />

        {/* Compliance */}
        <View style={styles.complianceHeader}>
          <Text style={styles.label}>Compliance</Text>
          <Pressable onPress={onRunCompliance} accessibilityRole="button" testID="run-compliance-btn">
            <Text style={styles.runComplianceText}>Check</Text>
          </Pressable>
        </View>
        {complianceItems.length > 0 && (
          <View style={styles.complianceCard} testID="compliance-checklist">
            {complianceItems.map((item) => (
              <View key={item.itemId} style={styles.complianceRow} testID={`compliance-${item.itemId}`}>
                <Text style={item.passed ? styles.checkPass : styles.checkFail}>
                  {item.passed ? "✓" : "✗"}
                </Text>
                <View style={styles.complianceInfo}>
                  <Text style={styles.complianceLabel}>{item.label}</Text>
                  {item.detail && <Text style={styles.complianceDetail}>{item.detail}</Text>}
                </View>
              </View>
            ))}
          </View>
        )}

        {createError && <Text style={styles.errorText}>{createError}</Text>}
        {createSuccess && <Text style={styles.successText}>Campaign created successfully.</Text>}

        <Pressable
          onPress={onCreate}
          disabled={creating}
          accessibilityRole="button"
          style={[styles.createBtn, creating && styles.createBtnDisabled]}
          testID="create-campaign-submit-btn"
        >
          <Text style={styles.createBtnText}>{creating ? "Creating…" : "Create campaign"}</Text>
        </Pressable>
      </ScrollView>
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
  scrollContent: { padding: 16, gap: 10 },
  label: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#374151" },
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
  chipRow: { flexDirection: "row", gap: 8 },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  chipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  chipText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#374151" },
  chipTextActive: { color: "#fff" },
  switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  complianceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  runComplianceText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#4f46e5" },
  complianceCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  complianceRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  checkPass: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#16a34a", width: 16 },
  checkFail: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#ef4444", width: 16 },
  complianceInfo: { flex: 1, gap: 2 },
  complianceLabel: { fontFamily: brandTypography.regular, fontSize: 13, color: "#374151" },
  complianceDetail: { fontFamily: brandTypography.regular, fontSize: 11, color: "#ef4444" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#ef4444" },
  successText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#16a34a" },
  createBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 8,
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#fff" },
});
