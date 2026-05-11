/**
 * W44 — SegmentBuilderScreen
 *
 * Visual filter canvas for building client segments. Name input, filter canvas
 * with add/remove rows per attribute (field / operator / value), estimated
 * count badge, preview button, save button.
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
  SegmentFilter,
  SegmentFilterField,
  SegmentFilterOperator,
  SegmentPreview,
} from "../../domains/clients/clientCrmModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SegmentBuilderScreenProps = {
  segmentName: string;
  filters: SegmentFilter[];
  preview: SegmentPreview | null;
  previewing: boolean;
  saving: boolean;
  error: string | null;
  onNameChange: (name: string) => void;
  onAddFilter: () => void;
  onRemoveFilter: (filterId: string) => void;
  onUpdateFilter: (filterId: string, patch: Partial<SegmentFilter>) => void;
  onPreview: () => void;
  onSave: () => void;
  onBack: () => void;
  testID?: string;
};

const FIELD_LABELS: Record<SegmentFilterField, string> = {
  location: "Location",
  lastVisitDays: "Last visit (days ago)",
  totalSpendCents: "Total spend",
  minBookingCount: "Min. bookings",
  baselineSegment: "Baseline segment",
  hasNoShow: "Has no-show",
  tier: "Tier",
  isVip: "Is VIP",
};

const OPERATOR_LABELS: Record<SegmentFilterOperator, string> = {
  equals: "=",
  not_equals: "≠",
  greater_than: ">",
  less_than: "<",
  in: "in",
  not_in: "not in",
};

const ALL_FIELDS = Object.keys(FIELD_LABELS) as SegmentFilterField[];
const SIMPLE_OPERATORS: SegmentFilterOperator[] = [
  "equals",
  "not_equals",
  "greater_than",
  "less_than",
];

// ---------------------------------------------------------------------------
// Filter row sub-component
// ---------------------------------------------------------------------------

function FilterRow({
  filter,
  onRemove,
  onUpdate,
}: {
  filter: SegmentFilter;
  onRemove: () => void;
  onUpdate: (patch: Partial<SegmentFilter>) => void;
}) {
  return (
    <View style={styles.filterRow}>
      {/* Field */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fieldScroll}>
        {ALL_FIELDS.map((f) => (
          <Pressable
            key={f}
            onPress={() => onUpdate({ field: f })}
            style={[styles.fieldChip, filter.field === f && styles.fieldChipActive]}
            accessibilityRole="button"
          >
            <Text style={[styles.fieldChipText, filter.field === f && styles.fieldChipTextActive]}>
              {FIELD_LABELS[f]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Operator */}
      <View style={styles.operatorRow}>
        {SIMPLE_OPERATORS.map((op) => (
          <Pressable
            key={op}
            onPress={() => onUpdate({ operator: op })}
            style={[styles.opChip, filter.operator === op && styles.opChipActive]}
            accessibilityRole="button"
          >
            <Text style={[styles.opChipText, filter.operator === op && styles.opChipTextActive]}>
              {OPERATOR_LABELS[op]}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Value */}
      <TextInput
        style={styles.valueInput}
        value={String(filter.value)}
        onChangeText={(text) => onUpdate({ value: text })}
        placeholder="Value"
        placeholderTextColor="#999"
        accessibilityLabel="Filter value"
      />

      <Pressable onPress={onRemove} style={styles.removeBtn} accessibilityRole="button">
        <Text style={styles.removeBtnText}>✕</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function SegmentBuilderScreen({
  segmentName,
  filters,
  preview,
  previewing,
  saving,
  error,
  onNameChange,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  onPreview,
  onSave,
  onBack,
  testID = "segment-builder-screen",
}: SegmentBuilderScreenProps) {
  if (previewing) return <AdminLoadingState label="Estimating segment size…" />;

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Segment Builder</Text>
        {preview && (
          <View style={styles.countBadge} testID="estimated-count">
            <Text style={styles.countBadgeText}>{preview.estimatedCount}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Name */}
        <Text style={styles.label}>Segment name *</Text>
        <TextInput
          style={styles.nameInput}
          value={segmentName}
          onChangeText={onNameChange}
          placeholder="e.g. High-value churned clients"
          placeholderTextColor="#999"
          testID="segment-name-input"
          accessibilityLabel="Segment name"
        />

        {/* Filter canvas */}
        <View style={styles.filterCanvas} testID="filter-canvas">
          {filters.length === 0 ? (
            <Text style={styles.emptyText}>No filters yet. Add one to narrow down clients.</Text>
          ) : (
            filters.map((f) => (
              <FilterRow
                key={f.filterId}
                filter={f}
                onRemove={() => onRemoveFilter(f.filterId)}
                onUpdate={(patch) => onUpdateFilter(f.filterId, patch)}
              />
            ))
          )}
        </View>

        <Pressable
          onPress={onAddFilter}
          style={styles.addFilterBtn}
          accessibilityRole="button"
          testID="add-filter-btn"
        >
          <Text style={styles.addFilterBtnText}>+ Add filter</Text>
        </Pressable>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {preview && (
          <View style={styles.previewPanel}>
            <Text style={styles.previewTitle}>Preview result</Text>
            <Text style={styles.previewCount}>
              ~{preview.estimatedCount} clients match these filters
            </Text>
          </View>
        )}

        <View style={styles.footerRow}>
          <Pressable
            onPress={onPreview}
            style={styles.previewBtn}
            accessibilityRole="button"
            testID="preview-btn"
          >
            <Text style={styles.previewBtnText}>Preview</Text>
          </Pressable>
          <Pressable
            onPress={onSave}
            disabled={saving || !segmentName.trim()}
            style={[styles.saveBtn, (saving || !segmentName.trim()) && styles.saveBtnDisabled]}
            accessibilityRole="button"
            testID="save-btn"
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Segment"}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backBtn: { marginRight: 12 },
  backText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6B4EFF" },
  title: { fontFamily: brandTypography.semibold, fontSize: 22, flex: 1 },
  countBadge: {
    backgroundColor: "#6B4EFF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: { color: "#FFFFFF", fontWeight: "700", fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  label: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888", marginBottom: 6 },
  nameInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    fontFamily: brandTypography.regular, fontSize: 14,
    marginBottom: 16,
  },
  filterCanvas: {
    gap: 10,
    marginBottom: 12,
  },
  filterRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  fieldScroll: { marginBottom: 8 },
  fieldChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CCC",
    marginRight: 6,
    backgroundColor: "#F9F9F9",
  },
  fieldChipActive: { backgroundColor: "#6B4EFF", borderColor: "#6B4EFF" },
  fieldChipText: { fontSize: 11, color: "#555" },
  fieldChipTextActive: { color: "#FFFFFF" },
  operatorRow: { flexDirection: "row", gap: 6, marginBottom: 8 },
  opChip: {
    width: 36,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#CCC",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9F9F9",
  },
  opChipActive: { backgroundColor: "#6B4EFF", borderColor: "#6B4EFF" },
  opChipText: { fontSize: 12, color: "#555" },
  opChipTextActive: { color: "#FFFFFF" },
  valueInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#DDD",
    fontFamily: brandTypography.regular, fontSize: 14,
    marginBottom: 4,
  },
  removeBtn: { alignSelf: "flex-end", padding: 4 },
  removeBtnText: { color: "#CC0000", fontSize: 14 },
  emptyText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#888", textAlign: "center", paddingVertical: 24 },
  addFilterBtn: {
    borderWidth: 1.5,
    borderColor: "#6B4EFF",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  addFilterBtnText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6B4EFF", fontWeight: "700" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#CC0000", marginBottom: 12 },
  previewPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#6B4EFF",
  },
  previewTitle: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888", marginBottom: 4 },
  previewCount: { fontFamily: brandTypography.semibold, fontSize: 22, color: "#6B4EFF" },
  footerRow: { flexDirection: "row", gap: 12 },
  previewBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#6B4EFF",
    alignItems: "center",
  },
  previewBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#6B4EFF" },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#6B4EFF",
    alignItems: "center",
  },
  saveBtnDisabled: { backgroundColor: "#CCCCCC" },
  saveBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#FFFFFF" },
});
