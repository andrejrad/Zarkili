/**
 * W42 — ServiceSeasonalRulesScreen
 *
 * Define date-range rules that modify or block a service.
 * e.g. "Holiday closure 2026-12-24 to 2026-12-26" or
 *      "Summer extended hours — custom duration 90 min"
 */
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { ServiceSeasonalRule } from "../../domains/services/serviceCatalogModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceSeasonalRulesScreenProps = {
  serviceName: string;
  loading: boolean;
  error: string | null;
  rules: ServiceSeasonalRule[];
  newLabel: string;
  newStart: string;
  newEnd: string;
  submitting: boolean;
  formError: string | null;
  onNewLabelChange: (v: string) => void;
  onNewStartChange: (v: string) => void;
  onNewEndChange: (v: string) => void;
  onCreate: () => void;
  onDeleteRule: (ruleId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceSeasonalRulesScreen({
  serviceName,
  loading,
  error,
  rules,
  newLabel,
  newStart,
  newEnd,
  submitting,
  formError,
  onNewLabelChange,
  onNewStartChange,
  onNewEndChange,
  onCreate,
  onDeleteRule,
  onRetry,
  onBack,
  testID = "service-seasonal-rules-screen",
}: ServiceSeasonalRulesScreenProps) {
  if (loading) return <AdminLoadingState label="Loading seasonal rules…" />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;

  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>‹ {serviceName}</Text>
      </Pressable>

      <Text style={styles.title}>Seasonal Availability Rules</Text>
      <Text style={styles.subtitle}>Define date ranges where this service is modified or blocked.</Text>

      {/* Create form */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>New rule</Text>

        <Text style={styles.label}>Label</Text>
        <TextInput
          style={styles.input}
          value={newLabel}
          onChangeText={onNewLabelChange}
          placeholder="e.g. Holiday closure"
          testID={`${testID}-new-label-input`}
        />

        <Text style={styles.label}>Start date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={newStart}
          onChangeText={onNewStartChange}
          placeholder="2026-12-24"
          autoCapitalize="none"
          testID={`${testID}-new-start-input`}
        />

        <Text style={styles.label}>End date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          value={newEnd}
          onChangeText={onNewEndChange}
          placeholder="2026-12-26"
          autoCapitalize="none"
          testID={`${testID}-new-end-input`}
        />

        {formError ? <Text style={styles.error} testID={`${testID}-form-error`}>{formError}</Text> : null}

        <Pressable
          style={[styles.btn, submitting && styles.btnDisabled]}
          disabled={submitting}
          onPress={onCreate}
          accessibilityRole="button"
          testID={`${testID}-create-btn`}
        >
          <Text style={styles.btnLabel}>{submitting ? "Creating…" : "Create rule"}</Text>
        </Pressable>
      </View>

      {/* Rules list */}
      <Text style={styles.sectionLabel}>Active rules</Text>
      {rules.length === 0 ? (
        <AdminEmptyState title="No rules" body="This service follows its default schedule year-round." />
      ) : (
        rules.map((rule) => (
          <View key={rule.ruleId} style={styles.ruleRow} testID={`${testID}-rule-${rule.ruleId}`}>
            <View style={styles.ruleInfo}>
              <Text style={styles.ruleName}>{rule.label}</Text>
              <Text style={styles.ruleDates}>{rule.startDate} → {rule.endDate}</Text>
              {rule.blockedCompletely ? (
                <Text style={styles.ruleBlocked}>Blocked completely</Text>
              ) : null}
            </View>
            <Pressable
              onPress={() => onDeleteRule(rule.ruleId)}
              accessibilityRole="button"
              testID={`${testID}-delete-rule-${rule.ruleId}`}
            >
              <Text style={styles.deleteLabel}>Remove</Text>
            </Pressable>
          </View>
        ))
      )}

      <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button">
        <Text style={styles.backBtnLabel}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { gap: 12, paddingBottom: 24 },
  back: { fontSize: 14, color: "#6B6B6B", fontFamily: brandTypography.regular, marginBottom: 4 },
  title: { fontSize: 20, lineHeight: 28, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  subtitle: { fontSize: 14, lineHeight: 20, color: "#6B6B6B", fontFamily: brandTypography.regular },
  sectionLabel: { fontSize: 13, fontFamily: brandTypography.medium, color: "#1A1A1A", marginTop: 4 },
  card: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 16,
    padding: 16, gap: 8, backgroundColor: "#FFFFFF",
  },
  label: { fontSize: 12, lineHeight: 16, color: "#1A1A1A", fontFamily: brandTypography.medium },
  input: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: "#FFFFFF", fontFamily: brandTypography.regular, color: "#1A1A1A",
  },
  error: { fontSize: 13, lineHeight: 18, color: "#F44336", fontFamily: brandTypography.regular },
  btn: {
    marginTop: 4, borderRadius: 9999, paddingVertical: 14,
    paddingHorizontal: 16, alignItems: "center", backgroundColor: "#E3A9A0",
  },
  btnDisabled: { opacity: 0.6 },
  btnLabel: { color: "#FFFFFF", fontSize: 14, fontFamily: brandTypography.medium },
  ruleRow: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 12,
    padding: 12, backgroundColor: "#FFFFFF",
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
  },
  ruleInfo: { gap: 2, flex: 1 },
  ruleName: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  ruleDates: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  ruleBlocked: { fontSize: 12, fontFamily: brandTypography.medium, color: "#F44336" },
  deleteLabel: { fontSize: 13, color: "#F44336", fontFamily: brandTypography.medium },
  backBtn: {
    marginTop: 4, borderRadius: 9999, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: "center",
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E0D1",
  },
  backBtnLabel: { color: "#6B6B6B", fontSize: 14, fontFamily: brandTypography.medium },
});
