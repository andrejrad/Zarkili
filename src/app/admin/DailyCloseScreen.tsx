/**
 * W40 — DailyCloseScreen: end-of-day cash reconciliation and close report (N.6).
 *
 * Checklist + cash denomination count + tips by staff + variance display.
 * Submitting locks the report and sends an email summary to the owner.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { DailyCloseReport, DenominationCount } from "./locationAdminService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCents(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DailyCloseScreenProps = {
  loading: boolean;
  error: string | null;
  report: DailyCloseReport | null;
  submitting: boolean;
  onIncrementDenomination: (label: string) => void;
  onDecrementDenomination: (label: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onBack: () => void;
};

// ---------------------------------------------------------------------------
// DenominationRow sub-component
// ---------------------------------------------------------------------------

function DenominationRow({
  item,
  onIncrement,
  onDecrement,
  disabled,
}: {
  item: DenominationCount;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled: boolean;
}) {
  const total = item.valueCents * item.quantity;
  return (
    <View style={rowStyles.root} testID={`denomination-${item.label}`}>
      <Text style={rowStyles.label}>{item.label}</Text>
      <View style={rowStyles.counter}>
        <Pressable
          accessibilityRole="button"
          onPress={onDecrement}
          disabled={disabled || item.quantity === 0}
          style={[rowStyles.counterBtn, (disabled || item.quantity === 0) && rowStyles.counterBtnDisabled]}
          testID={`decrement-${item.label}`}
        >
          <Text style={rowStyles.counterBtnLabel}>−</Text>
        </Pressable>
        <Text style={rowStyles.qty} testID={`qty-${item.label}`}>{item.quantity}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onIncrement}
          disabled={disabled}
          style={[rowStyles.counterBtn, disabled && rowStyles.counterBtnDisabled]}
          testID={`increment-${item.label}`}
        >
          <Text style={rowStyles.counterBtnLabel}>+</Text>
        </Pressable>
      </View>
      <Text style={rowStyles.total}>
        {total > 0 ? `$${(total / 100).toFixed(2)}` : "—"}
      </Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F0EDE6" },
  label: { flex: 1, fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  counter: { flexDirection: "row", alignItems: "center", gap: 12 },
  counterBtn: { width: 32, height: 32, borderRadius: 9999, backgroundColor: "#F7F4EC", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E0D1" },
  counterBtnDisabled: { opacity: 0.4 },
  counterBtnLabel: { fontSize: 18, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  qty: { width: 32, textAlign: "center", fontSize: 15, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  total: { width: 60, textAlign: "right", fontSize: 13, fontFamily: brandTypography.medium, color: "#6B6B6B" },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DailyCloseScreen({
  loading,
  error,
  report,
  submitting,
  onIncrementDenomination,
  onDecrementDenomination,
  onSubmit,
  onRetry,
  onBack,
}: DailyCloseScreenProps) {
  const [checklistDone, setChecklistDone] = useState({
    cashDrawer: false,
    products: false,
    tipsReconciled: false,
  });

  const allChecked = checklistDone.cashDrawer && checklistDone.products && checklistDone.tipsReconciled;
  const isSubmitted = !!report?.submittedAt;
  const canSubmit = allChecked && !submitting && !isSubmitted;

  function toggleChecklist(key: keyof typeof checklistDone) {
    setChecklistDone((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <ScrollView contentContainerStyle={styles.root} testID="daily-close-screen">
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Location</Text>
      </Pressable>
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Daily close</Text>
        {report?.dateIso ? (
          <Text style={styles.dateLabel}>{report.dateIso}</Text>
        ) : null}
      </View>

      {loading ? <AdminLoadingState label="Loading close report…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {isSubmitted ? (
        <View style={styles.submittedBanner} testID="submitted-banner">
          <Text style={styles.submittedTitle}>Report submitted ✓</Text>
          <Text style={styles.submittedMeta}>
            Submitted by {report?.submittedByName} on {report?.submittedAt?.split("T")[0]}
          </Text>
        </View>
      ) : null}

      {report && !loading ? (
        <>
          {/* Checklist */}
          <Text style={styles.groupLabel}>End-of-day checklist</Text>
          <View style={styles.group} testID="checklist-section">
            {(
              [
                { key: "cashDrawer" as const, label: "Cash drawer balanced" },
                { key: "products" as const, label: "Product stock reconciled" },
                { key: "tipsReconciled" as const, label: "Tips distributed" },
              ] as Array<{ key: keyof typeof checklistDone; label: string }>
            ).map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: checklistDone[item.key] }}
                onPress={() => !isSubmitted && toggleChecklist(item.key)}
                style={styles.checkRow}
                testID={`check-${item.key}`}
              >
                <View style={[styles.checkbox, checklistDone[item.key] && styles.checkboxDone]} />
                <Text style={[styles.checkLabel, checklistDone[item.key] && styles.checkLabelDone]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Cash count */}
          <Text style={styles.groupLabel}>Cash count</Text>
          <View style={styles.group} testID="cash-count-section">
            {report.denominationCounts.map((d) => (
              <DenominationRow
                key={d.label}
                item={d}
                onIncrement={() => !isSubmitted && onIncrementDenomination(d.label)}
                onDecrement={() => !isSubmitted && onDecrementDenomination(d.label)}
                disabled={isSubmitted}
              />
            ))}
            <View style={styles.totalRow} testID="cash-totals-row">
              <Text style={styles.totalLabel}>Counted</Text>
              <Text style={styles.totalValue}>
                {formatCents(report.countedCashCents, report.currency)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Expected</Text>
              <Text style={styles.totalValue}>
                {formatCents(report.expectedCashCents, report.currency)}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.varianceRow]} testID="variance-row">
              <Text style={styles.varianceLabel}>Variance</Text>
              <Text
                style={[
                  styles.varianceValue,
                  report.varianceCents < 0 ? styles.varianceNeg : styles.variancePos,
                ]}
              >
                {report.varianceCents >= 0 ? "+" : ""}
                {formatCents(report.varianceCents, report.currency)}
              </Text>
            </View>
          </View>

          {/* Tips by staff */}
          {report.tipsByStaff.length > 0 ? (
            <>
              <Text style={styles.groupLabel}>Tips by staff</Text>
              <View style={styles.group} testID="tips-section">
                {report.tipsByStaff.map((row) => (
                  <View key={row.staffId} style={styles.tipsRow} testID={`tips-row-${row.staffId}`}>
                    <Text style={styles.tipsStaffName}>{row.staffName}</Text>
                    <Text style={styles.tipsAmount}>
                      {formatCents(row.tipsCents, row.currency)}
                    </Text>
                  </View>
                ))}
                <View style={[styles.tipsRow, styles.tipsTotalRow]}>
                  <Text style={styles.totalLabel}>Total tips</Text>
                  <Text style={styles.totalValue}>
                    {formatCents(report.totalTipsCents, report.currency)}
                  </Text>
                </View>
              </View>
            </>
          ) : null}

          {/* Submit button */}
          {!isSubmitted ? (
            <Pressable
              accessibilityRole="button"
              onPress={onSubmit}
              disabled={!canSubmit}
              style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
              testID="submit-close-btn"
            >
              <Text style={styles.submitBtnLabel}>
                {submitting ? "Submitting…" : "Submit daily close"}
              </Text>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingBottom: 40, gap: 8 },
  backRow: { paddingBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { fontSize: 24, lineHeight: 32, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  dateLabel: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  submittedBanner: { backgroundColor: "#F0FDF4", borderRadius: 12, borderWidth: 1, borderColor: "#22C55E", padding: 12, gap: 4 },
  submittedTitle: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#15803D" },
  submittedMeta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  groupLabel: { fontSize: 12, fontFamily: brandTypography.semibold, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.8, paddingHorizontal: 4, marginTop: 12 },
  group: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", overflow: "hidden" },
  checkRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: "#F0EDE6" },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#E5E0D1", backgroundColor: "#FFFFFF" },
  checkboxDone: { backgroundColor: "#22C55E", borderColor: "#22C55E" },
  checkLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  checkLabelDone: { color: "#6B6B6B", textDecorationLine: "line-through" },
  totalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: "#E5E0D1" },
  varianceRow: { backgroundColor: "#F7F4EC" },
  totalLabel: { fontSize: 13, fontFamily: brandTypography.semibold, color: "#6B6B6B" },
  totalValue: { fontSize: 15, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  varianceLabel: { fontSize: 13, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  varianceValue: { fontSize: 15, fontFamily: brandTypography.semibold },
  variancePos: { color: "#22C55E" },
  varianceNeg: { color: "#EF4444" },
  tipsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F0EDE6" },
  tipsTotalRow: { borderTopWidth: 1, borderTopColor: "#E5E0D1", borderBottomWidth: 0 },
  tipsStaffName: { fontSize: 13, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  tipsAmount: { fontSize: 13, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  submitBtn: { backgroundColor: "#1A1A1A", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnLabel: { fontSize: 15, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
});
