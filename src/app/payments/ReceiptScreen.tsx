/**
 * ReceiptScreen.tsx — D.4 Receipt.
 *
 * Salon header, US date/time, ReceiptLineItem rows, totals (subtotal, tax
 * with jurisdiction label, tip, total), payment-method line, action row
 * (Email · Download PDF · Share), tertiary "Report a problem".
 *
 * Tax lines are passed in pre-formatted (caller composes via `formatTaxLabel`
 * + Stripe Tax line-items).
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ReceiptLineItem,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import { formatUsDate, formatTimeOfDay } from "../booking/bookingHelpers";

import {
  computeReceiptTotals,
  type ReceiptLineItem as ReceiptLineItemModel,
  type ReceiptTaxLine,
} from "./receiptsHelpers";
import { formatUsd } from "./paymentsHelpers";

export type ReceiptScreenProps = {
  salonName: string;
  salonAddress: string;
  /** ISO 8601 timestamp; rendered as MM/DD/YYYY · 12h AM/PM. */
  occurredAtIso: string;
  items: readonly ReceiptLineItemModel[];
  taxLines?: readonly ReceiptTaxLine[];
  tip?: number;
  paymentMethodLabel: string;
  emailing?: boolean;
  emailedToast?: string;
  errorMessage?: string;
  onPressEmail: () => void;
  onPressDownload: () => void;
  onPressShare: () => void;
  onPressReportProblem?: () => void;
  onPressBack?: () => void;
  testID?: string;
};

export function ReceiptScreen({
  salonName,
  salonAddress,
  occurredAtIso,
  items,
  taxLines,
  tip,
  paymentMethodLabel,
  emailing,
  emailedToast,
  errorMessage,
  onPressEmail,
  onPressDownload,
  onPressShare,
  onPressReportProblem,
  onPressBack,
  testID,
}: ReceiptScreenProps) {
  const totals = computeReceiptTotals({ items, taxLines, tip });
  const date = new Date(occurredAtIso);
  const dateLabel = formatUsDate(date);
  const minutes = date.getHours() * 60 + date.getMinutes();
  const timeLabel = formatTimeOfDay(minutes);

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        {onPressBack ? (
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
            testID={testID ? `${testID}-back` : undefined}
          >
            <Text style={styles.backGlyph}>{"\u2190"}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>Receipt</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {errorMessage ? (
          <View style={styles.errorBanner} testID={testID ? `${testID}-error` : undefined}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        {emailedToast ? (
          <View style={styles.toast} testID={testID ? `${testID}-toast` : undefined}>
            <Text style={styles.toastText}>{emailedToast}</Text>
          </View>
        ) : null}

        <View style={styles.salonBlock}>
          <Text style={styles.salonName}>{salonName}</Text>
          <Text style={styles.salonAddress}>{salonAddress}</Text>
          <Text style={styles.dateLine}>
            {dateLabel} · {timeLabel}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Services</Text>
          {items.map((it) => (
            <ReceiptLineItem
              key={it.id}
              description={it.description}
              quantity={it.quantity}
              modifier={it.modifier}
              amountLabel={formatUsd(Math.max(0, it.quantity) * it.unitPriceUsd)}
              testID={testID ? `${testID}-item-${it.id}` : undefined}
            />
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatUsd(totals.subtotal)}</Text>
          </View>
          {totals.taxLines.map((t) => (
            <View key={t.label} style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{t.label}</Text>
              <Text style={styles.totalsValue}>{formatUsd(t.amount)}</Text>
            </View>
          ))}
          {totals.tip > 0 ? (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tip</Text>
              <Text style={styles.totalsValue}>{formatUsd(totals.tip)}</Text>
            </View>
          ) : null}
          <View style={[styles.totalsRow, styles.totalsRowGrand]}>
            <Text style={styles.totalsGrandLabel}>Total</Text>
            <Text style={styles.totalsGrandValue} testID={testID ? `${testID}-total` : undefined}>
              {formatUsd(totals.grandTotal)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Payment</Text>
          <Text style={styles.paymentLine}>{paymentMethodLabel}</Text>
        </View>

        <View style={styles.actionRow}>
          <ActionButton label={emailing ? "Emailing…" : "Email receipt"} onPress={onPressEmail} testID={testID ? `${testID}-email` : undefined} disabled={emailing} />
          <ActionButton label="Download PDF" onPress={onPressDownload} testID={testID ? `${testID}-download` : undefined} />
          <ActionButton label="Share" onPress={onPressShare} testID={testID ? `${testID}-share` : undefined} />
        </View>

        {onPressReportProblem ? (
          <Pressable
            onPress={onPressReportProblem}
            accessibilityRole="button"
            style={styles.reportBtn}
            testID={testID ? `${testID}-report` : undefined}
          >
            <Text style={styles.reportText}>Report a problem</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  testID,
  disabled,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      style={[styles.actionBtn, disabled ? styles.actionBtnDisabled : null]}
      testID={testID}
    >
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backGlyph: { fontSize: 22, lineHeight: 24, color: colors.foreground },
  title: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: "600", color: colors.foreground, textAlign: "center" },
  body: { padding: spacing.pageHorizontal, gap: spacing.s3 },
  errorBanner: { backgroundColor: colors.error, borderRadius: radius.md, padding: spacing.s3 },
  errorText: { color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  toast: { backgroundColor: colors.success, borderRadius: radius.md, padding: spacing.s3 },
  toastText: { color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  salonBlock: { gap: 4 },
  salonName: { fontSize: 18, lineHeight: 24, fontWeight: "600", color: colors.foreground },
  salonAddress: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  dateLine: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    gap: spacing.s2,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.s1,
  },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalsRowGrand: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.s3, marginTop: spacing.s2 },
  totalsLabel: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  totalsValue: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.foreground },
  totalsGrandLabel: { fontSize: 16, lineHeight: 24, fontWeight: "600", color: colors.foreground },
  totalsGrandValue: { fontSize: 16, lineHeight: 24, fontWeight: "600", color: colors.foreground },
  paymentLine: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.foreground },
  actionRow: { flexDirection: "row", gap: spacing.s2 },
  actionBtn: {
    flex: 1,
    minHeight: spacing.touchTarget,
    paddingHorizontal: spacing.s3,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnDisabled: { opacity: 0.6 },
  actionLabel: { fontSize: 12, lineHeight: 16, fontWeight: "500", color: colors.foreground, textAlign: "center" },
  reportBtn: { alignItems: "center", paddingVertical: spacing.s3 },
  reportText: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.error },
});
