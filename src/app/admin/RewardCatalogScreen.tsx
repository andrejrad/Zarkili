/**
 * W45 — RewardCatalogScreen
 *
 * List of rewards in the loyalty reward catalog, with add/edit form.
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
import type { RewardCatalogEntry, RewardCatalogInput } from "../../domains/loyalty/loyaltyAdminModel";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type RewardCatalogScreenProps = {
  loading: boolean;
  error: string | null;
  rewards: RewardCatalogEntry[];
  /** null = create mode, non-null = edit mode */
  editingRewardId: string | null;
  form: RewardCatalogInput;
  saving: boolean;
  saveError: string | null;
  onFormChange: (field: keyof RewardCatalogInput, value: string | boolean) => void;
  onEditReward: (rewardId: string) => void;
  onDeleteReward: (rewardId: string) => void;
  onSaveReward: () => void;
  onCancelEdit: () => void;
  onAddNew: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function RewardCatalogScreen({
  loading,
  error,
  rewards,
  editingRewardId,
  form,
  saving,
  saveError,
  onFormChange,
  onEditReward,
  onDeleteReward,
  onSaveReward,
  onCancelEdit,
  onAddNew,
  onRetry,
  onBack,
  testID = "reward-catalog-screen",
}: RewardCatalogScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Reward Catalog</Text>
        <Pressable onPress={onAddNew} accessibilityRole="button" testID="add-reward-btn" style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      </View>

      {loading && <AdminLoadingState label="Loading rewards…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {rewards.length === 0 && (
            <AdminEmptyState
              title="No rewards"
              body="Add rewards to your loyalty catalog."
              cta="Add reward"
              onCta={onAddNew}
            />
          )}
          {rewards.map((r) => (
            <View key={r.rewardId} style={styles.card} testID={`reward-item-${r.rewardId}`}>
              <View style={styles.cardRow}>
                <Text style={styles.rewardName}>{r.name}</Text>
                <Text style={styles.rewardPoints}>{r.pointsCost} pts</Text>
              </View>
              <Text style={styles.rewardDesc}>{r.description}</Text>
              <Text style={[styles.statusBadge, r.active ? styles.statusActive : styles.statusInactive]}>
                {r.active ? "Active" : "Inactive"}
              </Text>
              <View style={styles.actionRow}>
                <Pressable onPress={() => onEditReward(r.rewardId)} accessibilityRole="button" testID={`edit-reward-${r.rewardId}`}>
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => onDeleteReward(r.rewardId)} accessibilityRole="button" testID={`delete-reward-${r.rewardId}`}>
                  <Text style={styles.deleteText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}

          {/* Edit / create form */}
          {editingRewardId !== undefined && (
            <View style={[styles.card, styles.formCard]} testID="reward-form">
              <Text style={styles.formTitle}>{editingRewardId === null ? "New reward" : "Edit reward"}</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={form.name}
                onChangeText={(v) => onFormChange("name", v)}
                testID="reward-name-input"
              />
              <TextInput
                style={styles.input}
                placeholder="Points cost"
                value={String(form.pointsCost)}
                onChangeText={(v) => onFormChange("pointsCost", v)}
                keyboardType="numeric"
                testID="reward-points-input"
              />
              <TextInput
                style={styles.input}
                placeholder="Description"
                value={form.description}
                onChangeText={(v) => onFormChange("description", v)}
                testID="reward-desc-input"
              />
              {saveError && <Text style={styles.errorText}>{saveError}</Text>}
              <View style={styles.actionRow}>
                <Pressable onPress={onCancelEdit} accessibilityRole="button" testID="cancel-reward-btn">
                  <Text style={styles.editText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={onSaveReward}
                  disabled={saving}
                  accessibilityRole="button"
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  testID="save-reward-btn"
                >
                  <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save"}</Text>
                </Pressable>
              </View>
            </View>
          )}
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
  title: { flex: 1, fontFamily: brandTypography.semibold, fontSize: 18, color: "#111827" },
  addBtn: { paddingLeft: 8 },
  addBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#4f46e5" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 6,
  },
  formCard: { borderColor: "#4f46e5", borderWidth: 2 },
  formTitle: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#111827", marginBottom: 4 },
  cardRow: { flexDirection: "row", justifyContent: "space-between" },
  rewardName: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#111827" },
  rewardPoints: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#4f46e5" },
  rewardDesc: { fontFamily: brandTypography.regular, fontSize: 13, color: "#6b7280" },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, fontSize: 11, fontFamily: brandTypography.semibold },
  statusActive: { backgroundColor: "#dcfce7", color: "#16a34a" },
  statusInactive: { backgroundColor: "#f3f4f6", color: "#6b7280" },
  actionRow: { flexDirection: "row", gap: 16, marginTop: 4 },
  editText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#4f46e5" },
  deleteText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#ef4444" },
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
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#ef4444" },
  saveBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#fff" },
});
