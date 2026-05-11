/**
 * W38 — Admin pattern components.
 *
 * Reusable empty, loading, error, role-denied, help-anchor, section-row,
 * KPI-tile, toggle-row, data-table, bulk-action-bar, and bulk-confirm-modal
 * components used across all Phase 3 admin screens.  Designed to the
 * ADMIN_UI_INTERPRETATION_GUIDELINES token set.
 *
 * W41 additions: AdminDataTable, BulkActionBar, BulkConfirmModal.
 */
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

// ---------------------------------------------------------------------------
// AdminEmptyState
// ---------------------------------------------------------------------------

type AdminEmptyStateProps = {
  title: string;
  body: string;
  cta?: string;
  onCta?: () => void;
};

export function AdminEmptyState({ title, body, cta, onCta }: AdminEmptyStateProps) {
  return (
    <View style={styles.centeredContainer}>
      <View style={styles.artwork} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {cta && onCta ? (
        <Pressable accessibilityRole="button" onPress={onCta} style={styles.ctaButton}>
          <Text style={styles.ctaLabel}>{cta}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// AdminLoadingState
// ---------------------------------------------------------------------------

type AdminLoadingStateProps = { label?: string };

export function AdminLoadingState({ label = "Loading…" }: AdminLoadingStateProps) {
  return (
    <View style={styles.centeredContainer}>
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// AdminErrorState
// ---------------------------------------------------------------------------

type AdminErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function AdminErrorState({ message, onRetry }: AdminErrorStateProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorBody}>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={styles.ctaButton}>
          <Text style={styles.ctaLabel}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// AdminRoleDeniedState
// ---------------------------------------------------------------------------

type AdminRoleDeniedStateProps = {
  requiredRole?: string;
  onBack: () => void;
};

export function AdminRoleDeniedState({ requiredRole, onBack }: AdminRoleDeniedStateProps) {
  return (
    <View style={styles.centeredContainer}>
      <View style={[styles.artwork, styles.deniedArtwork]} />
      <Text style={styles.emptyTitle}>Access denied</Text>
      <Text style={styles.emptyBody}>
        {requiredRole
          ? `You need the "${requiredRole}" role to view this section.`
          : "You do not have permission to access this section."}
      </Text>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.secondaryButton}>
        <Text style={styles.secondaryLabel}>Go back</Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// AdminHelpAnchor
// ---------------------------------------------------------------------------

type AdminHelpAnchorProps = {
  label?: string;
  onPress: () => void;
};

export function AdminHelpAnchor({ label = "Need help?", onPress }: AdminHelpAnchorProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.helpAnchor}>
      <Text style={styles.helpLabel}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// AdminSectionRow — nav row with trailing chevron
// ---------------------------------------------------------------------------

type AdminSectionRowProps = {
  label: string;
  sublabel?: string;
  onPress?: () => void;
  testID?: string;
};

export function AdminSectionRow({ label, sublabel, onPress, testID }: AdminSectionRowProps) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.sectionRow} testID={testID}>
      <View style={styles.sectionRowText}>
        <Text style={styles.sectionRowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.sectionRowSublabel}>{sublabel}</Text> : null}
      </View>
      <Text style={styles.chevron} accessibilityLabel="">›</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// AdminKpiTile — single KPI metric cell
// ---------------------------------------------------------------------------

type AdminKpiTileProps = {
  label: string;
  value: string;
  sublabel?: string;
  nullLabel?: string;
  testID?: string;
};

export function AdminKpiTile({ label, value, sublabel, nullLabel, testID }: AdminKpiTileProps) {
  return (
    <View style={styles.kpiTile} testID={testID}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {nullLabel && value === "—" ? <Text style={styles.kpiSublabel}>{nullLabel}</Text> : null}
      {sublabel && value !== "—" ? <Text style={styles.kpiSublabel}>{sublabel}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// AdminToggleRow — labelled toggle / switch row
// ---------------------------------------------------------------------------

type AdminToggleRowProps = {
  label: string;
  sublabel?: string;
  value: boolean;
  onToggle: (next: boolean) => void;
};

export function AdminToggleRow({ label, sublabel, value, onToggle }: AdminToggleRowProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onToggle(!value)}
      style={styles.toggleRow}
    >
      <View style={styles.toggleRowText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {sublabel ? <Text style={styles.toggleSublabel}>{sublabel}</Text> : null}
      </View>
      <View style={[styles.toggleTrack, value ? styles.toggleTrackOn : styles.toggleTrackOff]}>
        <View style={[styles.toggleThumb, value ? styles.toggleThumbOn : styles.toggleThumbOff]} />
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// AdminDataTable — generic multi-select data table
// ---------------------------------------------------------------------------

export type AdminDataTableColumn<T> = {
  /** Column header label */
  header: string;
  /** Render cell content for a row item */
  render: (item: T) => string | React.ReactNode;
  /** Flex weight (default 1) */
  flex?: number;
};

export type AdminDataTableProps<T> = {
  /** Column definitions */
  columns: AdminDataTableColumn<T>[];
  /** Row data */
  rows: T[];
  /** Unique key extractor */
  keyExtractor: (item: T) => string;
  /** Whether to show a leading select checkbox column */
  selectable?: boolean;
  /** Currently selected keys */
  selectedKeys?: Set<string>;
  /** Called when selection changes */
  onSelectionChange?: (keys: Set<string>) => void;
  /** Called when a row is pressed (non-select area) */
  onRowPress?: (item: T) => void;
  /** Shown when rows is empty */
  emptyLabel?: string;
  testID?: string;
};

// React.ReactNode return requires React in scope — import it via JSX transform (no explicit import needed).
export function AdminDataTable<T>({
  columns,
  rows,
  keyExtractor,
  selectable = false,
  selectedKeys = new Set(),
  onSelectionChange,
  onRowPress,
  emptyLabel = "No items",
  testID,
}: AdminDataTableProps<T>) {
  function toggleAll() {
    if (!onSelectionChange) return;
    if (selectedKeys.size === rows.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(rows.map(keyExtractor)));
    }
  }

  function toggleRow(key: string) {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onSelectionChange(next);
  }

  const allSelected = rows.length > 0 && selectedKeys.size === rows.length;
  const someSelected = selectedKeys.size > 0 && !allSelected;

  return (
    <View style={styles.tableWrapper} testID={testID}>
      {/* Header */}
      <View style={styles.tableHeaderRow} testID={testID ? `${testID}-header` : undefined}>
        {selectable ? (
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: allSelected || (someSelected ? "mixed" : false) }}
            onPress={toggleAll}
            style={styles.tableCellSelect}
            testID={testID ? `${testID}-select-all` : undefined}
          >
            <View style={[styles.checkbox, (allSelected || someSelected) && styles.checkboxChecked]}>
              {allSelected ? <Text style={styles.checkmark}>✓</Text> : null}
              {someSelected ? <Text style={styles.checkmark}>−</Text> : null}
            </View>
          </Pressable>
        ) : null}
        {columns.map((col, i) => (
          <Text
            key={i}
            style={[styles.tableHeaderCell, col.flex !== undefined ? { flex: col.flex } : undefined]}
          >
            {col.header}
          </Text>
        ))}
      </View>

      {/* Rows */}
      {rows.length === 0 ? (
        <View style={styles.tableEmptyRow} testID={testID ? `${testID}-empty` : undefined}>
          <Text style={styles.tableEmptyLabel}>{emptyLabel}</Text>
        </View>
      ) : (
        rows.map((item, rowIdx) => {
          const key = keyExtractor(item);
          const isSelected = selectedKeys.has(key);
          const isLast = rowIdx === rows.length - 1;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              onPress={() => onRowPress?.(item)}
              style={[
                styles.tableRow,
                isSelected && styles.tableRowSelected,
                isLast && styles.tableRowLast,
              ]}
              testID={testID ? `${testID}-row-${key}` : undefined}
            >
              {selectable ? (
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => toggleRow(key)}
                  style={styles.tableCellSelect}
                  testID={testID ? `${testID}-check-${key}` : undefined}
                >
                  <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                    {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                </Pressable>
              ) : null}
              {columns.map((col, colIdx) => {
                const content = col.render(item);
                return typeof content === "string" ? (
                  <Text
                    key={colIdx}
                    style={[styles.tableCell, col.flex !== undefined ? { flex: col.flex } : undefined]}
                    numberOfLines={1}
                  >
                    {content}
                  </Text>
                ) : (
                  <View
                    key={colIdx}
                    style={col.flex !== undefined ? { flex: col.flex } : { flex: 1 }}
                  >
                    {content}
                  </View>
                );
              })}
            </Pressable>
          );
        })
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// BulkActionBar — sticky bottom bar shown when items are selected
// ---------------------------------------------------------------------------

export type BulkAction = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  testID?: string;
};

export type BulkActionBarProps = {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
  testID?: string;
};

export function BulkActionBar({
  selectedCount,
  actions,
  onClearSelection,
  testID,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;
  return (
    <View style={styles.bulkBar} testID={testID ?? "bulk-action-bar"}>
      <Pressable
        accessibilityRole="button"
        onPress={onClearSelection}
        testID={testID ? `${testID}-clear` : "bulk-action-bar-clear"}
      >
        <Text style={styles.bulkBarCount}>
          {selectedCount} selected ×
        </Text>
      </Pressable>
      {actions.map((action, i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          onPress={action.onPress}
          style={[
            styles.bulkBarAction,
            action.destructive && styles.bulkBarActionDestructive,
          ]}
          testID={action.testID}
        >
          <Text
            style={[
              styles.bulkBarActionLabel,
              action.destructive && styles.bulkBarActionLabelDestructive,
            ]}
          >
            {action.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// BulkConfirmModal — confirmation sheet before destructive bulk actions
// ---------------------------------------------------------------------------

export type BulkConfirmModalProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
};

export function BulkConfirmModal({
  visible,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
  testID,
}: BulkConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      testID={testID}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard} testID={testID ? `${testID}-card` : undefined}>
          <Text style={styles.modalTitle} testID={testID ? `${testID}-title` : undefined}>
            {title}
          </Text>
          <Text style={styles.modalBody} testID={testID ? `${testID}-body` : undefined}>
            {body}
          </Text>
          <View style={styles.modalActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={styles.modalCancel}
              testID={testID ? `${testID}-cancel` : undefined}
            >
              <Text style={styles.modalCancelLabel}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={[styles.modalConfirm, destructive && styles.modalConfirmDestructive]}
              testID={testID ? `${testID}-confirm` : undefined}
            >
              <Text style={styles.modalConfirmLabel}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  centeredContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  artwork: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E5E0D1",
    marginBottom: 8,
  },
  deniedArtwork: {
    backgroundColor: "#F4C7C2",
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
    textAlign: "center",
    maxWidth: 280,
  },
  loadingLabel: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    padding: 16,
    gap: 8,
  },
  errorTitle: {
    fontSize: 15,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
  },
  errorBody: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  ctaButton: {
    marginTop: 8,
    backgroundColor: "#E3A9A0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    alignItems: "center",
  },
  ctaLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
  secondaryButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    alignItems: "center",
  },
  secondaryLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#1A1A1A",
  },
  helpAnchor: {
    paddingVertical: 8,
    alignItems: "center",
  },
  helpLabel: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#8B5CF6",
    textDecorationLine: "underline",
  },
  // Section row
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 56,
  },
  sectionRowText: {
    flex: 1,
    gap: 2,
  },
  sectionRowLabel: {
    fontSize: 15,
    fontFamily: brandTypography.medium,
    color: "#1A1A1A",
  },
  sectionRowSublabel: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  chevron: {
    fontSize: 22,
    lineHeight: 26,
    color: "#9CA3AF",
  },
  // KPI tile
  kpiTile: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    padding: 14,
    gap: 4,
    minWidth: 120,
  },
  kpiLabel: {
    fontSize: 11,
    fontFamily: brandTypography.semibold,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 28,
    lineHeight: 34,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
  },
  kpiSublabel: {
    fontSize: 11,
    fontFamily: brandTypography.regular,
    color: "#9CA3AF",
  },
  // Toggle row
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  toggleRowText: {
    flex: 1,
    gap: 2,
  },
  toggleLabel: {
    fontSize: 15,
    fontFamily: brandTypography.medium,
    color: "#1A1A1A",
  },
  toggleSublabel: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  toggleTrack: {
    width: 44,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  toggleTrackOn: {
    backgroundColor: "#E3A9A0",
  },
  toggleTrackOff: {
    backgroundColor: "#E5E0D1",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbOn: {
    alignSelf: "flex-end",
  },
  toggleThumbOff: {
    alignSelf: "flex-start",
  },
  // Data table
  tableWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#F7F3EC",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E0D1",
  },
  tableHeaderCell: {
    flex: 1,
    fontSize: 11,
    fontFamily: brandTypography.semibold,
    color: "#6B6B6B",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  tableHeaderCellSelect: {
    width: 40,
    flexShrink: 0,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE1",
    minHeight: 52,
  },
  tableRowSelected: {
    backgroundColor: "#FEF9F0",
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCell: {
    flex: 1,
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
  },
  tableCellSelect: {
    width: 40,
    flexShrink: 0,
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#C8C0B0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  checkboxChecked: {
    borderColor: "#E3A9A0",
    backgroundColor: "#E3A9A0",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    lineHeight: 14,
    fontFamily: brandTypography.semibold,
  },
  tableEmptyRow: {
    alignItems: "center",
    paddingVertical: 32,
  },
  tableEmptyLabel: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#9CA3AF",
  },
  // Bulk action bar
  bulkBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    marginVertical: 8,
  },
  bulkBarCount: {
    flex: 1,
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
  bulkBarAction: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
  },
  bulkBarActionLabel: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
  bulkBarActionDestructive: {
    borderColor: "#F4C7C2",
  },
  bulkBarActionLabelDestructive: {
    color: "#F4C7C2",
  },
  // Bulk confirm modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
  },
  modalBody: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    alignItems: "center",
  },
  modalCancelLabel: {
    fontSize: 15,
    fontFamily: brandTypography.medium,
    color: "#1A1A1A",
  },
  modalConfirm: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: "center",
    backgroundColor: "#E3A9A0",
  },
  modalConfirmDestructive: {
    backgroundColor: "#D9534F",
  },
  modalConfirmLabel: {
    fontSize: 15,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
});
