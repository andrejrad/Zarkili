/**
 * W45 — PromotionAdminScreen
 *
 * Promo code list with status filter and create-code form.
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

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type {
  PromoCode,
  PromoCodeCreateInput,
  PromoCodeStatus,
  PromoCodeType,
} from "../../domains/campaigns/campaignAdminModel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type PromotionAdminScreenProps = {
  loading: boolean;
  error: string | null;
  codes: PromoCode[];
  statusFilter: PromoCodeStatus | null;
  showCreateForm: boolean;
  form: PromoCodeCreateInput;
  creating: boolean;
  createError: string | null;
  onStatusFilter: (s: PromoCodeStatus | null) => void;
  onToggleCreateForm: () => void;
  onFormChange: (field: keyof PromoCodeCreateInput, value: string | null) => void;
  onCreateCode: () => void;
  onUpdateStatus: (codeId: string, status: PromoCodeStatus) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const STATUS_OPTIONS: PromoCodeStatus[] = ["active", "paused", "expired", "depleted"];
const TYPE_LABELS: Record<PromoCodeType, string> = {
  percent: "% off",
  fixed: "Fixed off",
  free_service: "Free service",
};

const STATUS_BG: Record<PromoCodeStatus, string> = {
  active: "#dcfce7",
  paused: "#fef3c7",
  expired: "#fee2e2",
  depleted: "#f3f4f6",
};

const STATUS_COLOR: Record<PromoCodeStatus, string> = {
  active: "#16a34a",
  paused: "#f59e0b",
  expired: "#ef4444",
  depleted: "#6b7280",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function PromotionAdminScreen({
  loading,
  error,
  codes,
  statusFilter,
  showCreateForm,
  form,
  creating,
  createError,
  onStatusFilter,
  onToggleCreateForm,
  onFormChange,
  onCreateCode,
  onUpdateStatus,
  onRetry,
  onBack,
  testID = "promotion-admin-screen",
}: PromotionAdminScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Promotions</Text>
        <Pressable onPress={onToggleCreateForm} accessibilityRole="button" testID="toggle-create-btn" style={styles.addBtn}>
          <Text style={styles.addBtnText}>{showCreateForm ? "Cancel" : "+ New"}</Text>
        </Pressable>
      </View>

      {/* Status filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
        <Pressable
          onPress={() => onStatusFilter(null)}
          style={[styles.filterChip, statusFilter === null && styles.filterChipActive]}
          testID="filter-all"
        >
          <Text style={[styles.filterChipText, statusFilter === null && styles.filterChipTextActive]}>All</Text>
        </Pressable>
        {STATUS_OPTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => onStatusFilter(s)}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            testID={`filter-${s}`}
          >
            <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading && <AdminLoadingState label="Loading promo codes…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Create form */}
          {showCreateForm && (
            <View style={[styles.card, styles.formCard]} testID="create-promo-form">
              <Text style={styles.formTitle}>New promo code</Text>
              <TextInput
                style={styles.input}
                value={form.code}
                onChangeText={(v) => onFormChange("code", v)}
                placeholder="Code (e.g. SUMMER25)"
                autoCapitalize="characters"
                testID="code-input"
              />
              <TextInput
                style={styles.input}
                value={String(form.value)}
                onChangeText={(v) => onFormChange("value", v)}
                placeholder="Value (e.g. 25)"
                keyboardType="numeric"
                testID="value-input"
              />
              <TextInput
                style={styles.input}
                value={form.description}
                onChangeText={(v) => onFormChange("description", v)}
                placeholder="Description"
                testID="description-input"
              />
              <TextInput
                style={styles.input}
                value={form.validFrom}
                onChangeText={(v) => onFormChange("validFrom", v)}
                placeholder="Valid from (ISO-8601)"
                testID="valid-from-input"
              />
              <TextInput
                style={styles.input}
                value={form.validUntil ?? ""}
                onChangeText={(v) => onFormChange("validUntil", v || null)}
                placeholder="Valid until (blank = no expiry)"
                testID="valid-until-input"
              />
              {createError && <Text style={styles.errorText}>{createError}</Text>}
              <Pressable
                onPress={onCreateCode}
                disabled={creating}
                accessibilityRole="button"
                style={[styles.createBtn, creating && styles.createBtnDisabled]}
                testID="create-code-btn"
              >
                <Text style={styles.createBtnText}>{creating ? "Creating…" : "Create code"}</Text>
              </Pressable>
            </View>
          )}

          {/* Code list */}
          {codes.length === 0 && !showCreateForm && (
            <AdminEmptyState
              title="No promo codes"
              body="Create your first promotional discount code."
              cta="New code"
              onCta={onToggleCreateForm}
            />
          )}
          {codes.map((c) => (
            <View key={c.codeId} style={styles.card} testID={`promo-item-${c.codeId}`}>
              <View style={styles.cardTop}>
                <Text style={styles.codeText}>{c.code}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[c.status] }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[c.status] }]}>
                    {c.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.metaText}>
                {TYPE_LABELS[c.type]} · {c.type === "percent" ? `${c.value}%` : `${c.value}`}
              </Text>
              <Text style={styles.metaText}>{c.description}</Text>
              <Text style={styles.usesText}>
                Uses: {c.usesCount}{c.maxUses != null ? ` / ${c.maxUses}` : ""}
              </Text>
              <View style={styles.actionRow}>
                {c.status === "active" && (
                  <Pressable
                    onPress={() => onUpdateStatus(c.codeId, "paused")}
                    accessibilityRole="button"
                    testID={`pause-${c.codeId}`}
                  >
                    <Text style={styles.actionText}>Pause</Text>
                  </Pressable>
                )}
                {c.status === "paused" && (
                  <Pressable
                    onPress={() => onUpdateStatus(c.codeId, "active")}
                    accessibilityRole="button"
                    testID={`activate-${c.codeId}`}
                  >
                    <Text style={styles.actionText}>Activate</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
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
  filterBar: { maxHeight: 52, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  filterBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  filterChipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  filterChipText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#374151" },
  filterChipTextActive: { color: "#fff" },
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
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  codeText: { fontFamily: brandTypography.semibold, fontSize: 16, color: "#111827", letterSpacing: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontFamily: brandTypography.semibold, fontSize: 11 },
  metaText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6b7280" },
  usesText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#374151" },
  actionRow: { flexDirection: "row", gap: 16, marginTop: 4 },
  actionText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#4f46e5" },
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
  createBtn: {
    backgroundColor: "#4f46e5",
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#fff" },
});
