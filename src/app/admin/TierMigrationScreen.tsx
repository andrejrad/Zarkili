/**
 * W45 — TierMigrationScreen
 *
 * Preview the impact of re-running tier assignments,
 * enter an audit reason, and execute the migration.
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

import { brandTypography } from "../../shared/ui/brandTypography";
import type { TierMigrationPreview } from "../../domains/loyalty/loyaltyAdminModel";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type TierMigrationScreenProps = {
  previewLoading: boolean;
  previewError: string | null;
  preview: TierMigrationPreview | null;
  reason: string;
  running: boolean;
  runError: string | null;
  runSuccess: boolean;
  onReasonChange: (v: string) => void;
  onRunMigration: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function TierMigrationScreen({
  previewLoading,
  previewError,
  preview,
  reason,
  running,
  runError,
  runSuccess,
  onReasonChange,
  onRunMigration,
  onRetry,
  onBack,
  testID = "tier-migration-screen",
}: TierMigrationScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Tier Migration</Text>
      </View>

      {previewLoading && <AdminLoadingState label="Calculating preview…" />}
      {!previewLoading && previewError && (
        <AdminErrorState message={previewError} onRetry={onRetry} />
      )}
      {!previewLoading && !previewError && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Preview */}
          {preview && (
            <View style={styles.card} testID="migration-preview">
              <Text style={styles.cardTitle}>Impact preview</Text>
              <View style={styles.statRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{preview.customersAffected}</Text>
                  <Text style={styles.statLabel}>Affected</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, styles.upgradeText]}>{preview.upgrades}</Text>
                  <Text style={styles.statLabel}>Upgrades</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={[styles.statValue, styles.downgradeText]}>{preview.downgrades}</Text>
                  <Text style={styles.statLabel}>Downgrades</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{preview.unchanged}</Text>
                  <Text style={styles.statLabel}>Unchanged</Text>
                </View>
              </View>
            </View>
          )}

          {/* Reason */}
          <Text style={styles.sectionLabel}>Migration reason (required for audit)</Text>
          <TextInput
            style={[styles.input, styles.noteInput]}
            value={reason}
            onChangeText={onReasonChange}
            multiline
            placeholder="Explain why tiers are being recomputed…"
            testID="migration-reason-input"
          />

          {runError && <Text style={styles.errorText}>{runError}</Text>}
          {runSuccess && <Text style={styles.successText}>Migration completed successfully.</Text>}

          <Pressable
            onPress={onRunMigration}
            disabled={running || !preview}
            accessibilityRole="button"
            style={[styles.runBtn, (running || !preview) && styles.runBtnDisabled]}
            testID="run-migration-btn"
          >
            <Text style={styles.runBtnText}>{running ? "Running…" : "Run tier migration"}</Text>
          </Pressable>
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTitle: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#374151", marginBottom: 12 },
  statRow: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center", gap: 4 },
  statValue: { fontFamily: brandTypography.semibold, fontSize: 24, color: "#111827" },
  statLabel: { fontFamily: brandTypography.regular, fontSize: 11, color: "#6b7280" },
  upgradeText: { color: "#16a34a" },
  downgradeText: { color: "#ef4444" },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#374151", marginTop: 4 },
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
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#ef4444" },
  successText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#16a34a" },
  runBtn: {
    backgroundColor: "#dc2626",
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 8,
  },
  runBtnDisabled: { opacity: 0.5 },
  runBtnText: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#fff" },
});
