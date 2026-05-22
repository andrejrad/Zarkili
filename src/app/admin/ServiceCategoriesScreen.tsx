/**
 * W42 — ServiceCategoriesScreen
 *
 * Manages service categories (create, list, delete, reorder) for a tenant.
 * Each service is tagged to a category; this screen is the admin editor.
 */
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { TenantServiceCategory } from "../../domains/services/serviceCatalogModel";

import {
  AdminDataTable,
  AdminDataTableColumn,
  AdminEmptyState,
  AdminErrorState,
  AdminLoadingState,
  BulkActionBar,
  BulkConfirmModal,
} from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceCategoriesScreenProps = {
  loading: boolean;
  error: string | null;
  categories: TenantServiceCategory[];
  newCategoryName: string;
  submitting: boolean;
  formError: string | null;
  onNewCategoryNameChange: (v: string) => void;
  onCreateCategory: () => void;
  onDeleteCategory: (categoryId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const COLUMNS: AdminDataTableColumn<TenantServiceCategory>[] = [
  { header: "Category", flex: 3, render: (c) => c.name },
  { header: "Order", flex: 1, render: (c) => String(c.sortOrder) },
];

export function ServiceCategoriesScreen({
  loading,
  error,
  categories,
  newCategoryName,
  submitting,
  formError,
  onNewCategoryNameChange,
  onCreateCategory,
  onDeleteCategory,
  onRetry,
  onBack,
  testID = "service-categories-screen",
}: ServiceCategoriesScreenProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (loading) return <AdminLoadingState label="Loading categories…" />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;

  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>‹ Service Categories</Text>
      </Pressable>

      <Text style={styles.title}>Service Categories</Text>

      {/* Create form */}
      <View style={styles.card}>
        <Text style={styles.label}>New category name</Text>
        <TextInput
          style={styles.input}
          value={newCategoryName}
          onChangeText={onNewCategoryNameChange}
          placeholder="e.g. Hair"
          testID={`${testID}-new-name-input`}
        />
        {formError ? <Text style={styles.error} testID={`${testID}-form-error`}>{formError}</Text> : null}
        <Pressable
          style={[styles.btn, submitting && styles.btnDisabled]}
          disabled={submitting}
          onPress={onCreateCategory}
          accessibilityRole="button"
          testID={`${testID}-create-btn`}
        >
          <Text style={styles.btnLabel}>{submitting ? "Creating…" : "Create category"}</Text>
        </Pressable>
      </View>

      {/* Bulk bar */}
      <BulkActionBar
        selectedCount={selected.size}
        onClearSelection={() => setSelected(new Set())}
        actions={[{ label: "Delete", onPress: () => setConfirmDelete(true), destructive: true }]}
        testID={`${testID}-bulk-bar`}
      />

      {/* Table */}
      {categories.length === 0 ? (
        <AdminEmptyState title="No categories yet" body="Create your first category above." />
      ) : (
        <AdminDataTable
          rows={categories}
          columns={COLUMNS}
          keyExtractor={(c) => c.categoryId}
          selectable
          selectedKeys={selected}
          onSelectionChange={setSelected}
          testID={`${testID}-table`}
        />
      )}

      {/* Bulk delete confirm */}
      <BulkConfirmModal
        visible={confirmDelete}
        title={`Delete ${selected.size} categor${selected.size === 1 ? "y" : "ies"}?`}
        body="Services in these categories will not be reassigned automatically."
        confirmLabel="Delete"
        onConfirm={() => {
          selected.forEach((id) => onDeleteCategory(id));
          setSelected(new Set());
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
        testID={`${testID}-delete-modal`}
      />

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
  backBtn: {
    marginTop: 6, borderRadius: 9999, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: "center",
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E0D1",
  },
  backBtnLabel: { color: "#6B6B6B", fontSize: 14, fontFamily: brandTypography.medium },
});
