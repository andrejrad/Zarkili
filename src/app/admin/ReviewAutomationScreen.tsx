/**
 * W46 — ReviewAutomationScreen
 *
 * Manage review automation rules: list, create, toggle active state, delete.
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
  ReviewAutomationRule,
  ReviewAutomationRuleInput,
  ReviewRatingOp,
} from "../../domains/reviews/reviewAdminModel";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ReviewAutomationScreenProps = {
  loading: boolean;
  error: string | null;
  rules: ReviewAutomationRule[];
  showCreateForm: boolean;
  form: ReviewAutomationRuleInput;
  saving: boolean;
  saveError: string | null;
  onFormChange: <K extends keyof ReviewAutomationRuleInput>(
    field: K,
    value: ReviewAutomationRuleInput[K],
  ) => void;
  onToggleForm: () => void;
  onSaveRule: () => void;
  onToggleActive: (ruleId: string, active: boolean) => void;
  onDeleteRule: (ruleId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const OP_LABELS: Record<ReviewRatingOp, string> = {
  eq: "exactly",
  gte: "≥",
  lte: "≤",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ReviewAutomationScreen({
  loading,
  error,
  rules,
  showCreateForm,
  form,
  saving,
  saveError,
  onFormChange,
  onToggleForm,
  onSaveRule,
  onToggleActive,
  onDeleteRule,
  onRetry,
  onBack,
  testID = "review-automation-screen",
}: ReviewAutomationScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Automation Rules</Text>
        <Pressable onPress={onToggleForm} accessibilityRole="button" testID="toggle-create-btn" style={styles.addBtn}>
          <Text style={styles.addBtnText}>{showCreateForm ? "Cancel" : "+ Rule"}</Text>
        </Pressable>
      </View>

      {showCreateForm ? (
        <View style={styles.form} testID="create-form">
          <Text style={styles.sectionLabel}>Rule Label</Text>
          <TextInput
            value={form.label}
            onChangeText={(v) => onFormChange("label", v)}
            placeholder="e.g. Auto-thank 5-star reviews"
            style={styles.input}
            testID="label-input"
            accessibilityLabel="Rule label"
          />
          <Text style={styles.sectionLabel}>Trigger Rating</Text>
          <View style={styles.ratingRow}>
            {([1, 2, 3, 4, 5] as number[]).map((n) => (
              <Pressable
                key={n}
                onPress={() => onFormChange("triggerRating", n)}
                testID={`rating-${n}`}
                style={[styles.ratingBtn, form.triggerRating === n && styles.ratingBtnActive]}
              >
                <Text style={[styles.ratingBtnText, form.triggerRating === n && styles.ratingBtnTextActive]}>
                  {n}★
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sectionLabel}>Operator</Text>
          <View style={styles.opRow}>
            {(["eq", "gte", "lte"] as ReviewRatingOp[]).map((op) => (
              <Pressable
                key={op}
                onPress={() => onFormChange("triggerRatingOp", op)}
                testID={`op-${op}`}
                style={[styles.opBtn, form.triggerRatingOp === op && styles.opBtnActive]}
              >
                <Text style={[styles.opBtnText, form.triggerRatingOp === op && styles.opBtnTextActive]}>
                  {OP_LABELS[op]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sectionLabel}>Reply Template</Text>
          <TextInput
            value={form.replyTemplate}
            onChangeText={(v) => onFormChange("replyTemplate", v)}
            multiline
            numberOfLines={4}
            placeholder="Thank you for your feedback…"
            style={[styles.input, styles.textArea]}
            testID="template-input"
            accessibilityLabel="Reply template"
          />
          {saveError ? <Text style={styles.errorText} testID="save-error">{saveError}</Text> : null}
          <Pressable
            onPress={onSaveRule}
            disabled={saving || !form.label.trim() || !form.replyTemplate.trim()}
            accessibilityRole="button"
            testID="save-rule-btn"
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Rule"}</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? <AdminLoadingState label="Loading rules…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}
      {!loading && !error && rules.length === 0 ? (
        <AdminEmptyState title="No Rules" body="No automation rules have been created yet." />
      ) : null}

      {rules.map((rule) => (
        <View key={rule.ruleId} style={styles.ruleCard} testID={`rule-${rule.ruleId}`}>
          <View style={styles.ruleTop}>
            <Text style={styles.ruleLabel}>{rule.label}</Text>
            <Switch
              value={rule.active}
              onValueChange={(v) => onToggleActive(rule.ruleId, v)}
              testID={`toggle-${rule.ruleId}`}
            />
          </View>
          <Text style={styles.ruleSummary}>
            Triggers when rating {OP_LABELS[rule.triggerRatingOp]} {rule.triggerRating}★
          </Text>
          <Text style={styles.ruleTemplate} numberOfLines={2}>{rule.replyTemplate}</Text>
          <Pressable
            onPress={() => onDeleteRule(rule.ruleId)}
            accessibilityRole="button"
            testID={`delete-${rule.ruleId}`}
            style={styles.deleteBtn}
          >
            <Text style={styles.deleteBtnText}>Delete</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, backgroundColor: "#F2EDDD" },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { paddingVertical: 4 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6B6B6B" },
  title: { fontFamily: brandTypography.semibold, fontSize: 20, color: "#1A1A1A", flex: 1 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#1A1A1A", borderRadius: 8 },
  addBtnText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#FFFFFF" },
  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#6B6B6B" },
  input: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 10,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    color: "#1A1A1A",
  },
  textArea: { minHeight: 90, textAlignVertical: "top" },
  ratingRow: { flexDirection: "row", gap: 8 },
  ratingBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E5E0D1",
  },
  ratingBtnActive: { backgroundColor: "#F59E0B" },
  ratingBtnText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#1A1A1A" },
  ratingBtnTextActive: { fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  opRow: { flexDirection: "row", gap: 8 },
  opBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#E5E0D1",
  },
  opBtnActive: { backgroundColor: "#1A1A1A" },
  opBtnText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#1A1A1A" },
  opBtnTextActive: { color: "#FFFFFF" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#DC2626" },
  saveBtn: { backgroundColor: "#1A1A1A", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  saveBtnDisabled: { backgroundColor: "#D1D5DB" },
  saveBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#FFFFFF" },
  ruleCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  ruleTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ruleLabel: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#1A1A1A", flex: 1 },
  ruleSummary: { fontFamily: brandTypography.regular, fontSize: 13, color: "#4B4B4B" },
  ruleTemplate: { fontFamily: brandTypography.regular, fontSize: 12, color: "#9CA3AF", fontStyle: "italic" },
  deleteBtn: { alignSelf: "flex-end", paddingHorizontal: 10, paddingVertical: 4 },
  deleteBtnText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#DC2626" },
});
