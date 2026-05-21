/**
 * src/app/admin/FinalizePaymentAdminScreen.tsx
 *
 * Admin screen for finalizing post-service payment:
 *
 *   - Shows service total, authorized amount, remaining to charge
 *   - Tip input
 *   - "Charge Card on File" → captureBookingPayment()
 *   - "Mark as Paid in Person" → captureBookingPayment({ paidInPerson: true })
 *
 * Props:
 *   tenantId        — current tenant
 *   bookingId       — booking being finalized
 *   serviceTotal    — full service price in MAJOR units (e.g. 45.00)
 *   currency        — ISO 4217 lowercase (e.g. "usd")
 *   depositPaid     — authorized/charged deposit amount in MAJOR units (0 if none)
 *   paymentMode     — deposit | full | card_on_file | null (null → bypass, show in-person only)
 *   functions       — Firebase Functions instance
 *   onDone          — called with status string when finalization completes
 *   onBack          — back nav handler
 */

import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { httpsCallable, type Functions } from "firebase/functions";

import { colors, spacing } from "../../shared/ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FinalizePaymentAdminScreenProps = {
  tenantId: string;
  bookingId: string;
  /** Service total in MAJOR units (e.g. 45.00 for $45) */
  serviceTotal: number;
  currency: string;
  /** Deposit or authorized amount in MAJOR units (0 if card_on_file or no prior charge) */
  depositPaid: number;
  paymentMode: "deposit" | "full" | "card_on_file" | null;
  functions: Functions;
  onDone: (status: string) => void;
  onBack: () => void;
};

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

function formatAmount(minorUnits: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(minorUnits / 100);
  } catch {
    return `${(minorUnits / 100).toFixed(2)} ${currency.toUpperCase()}`;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FinalizePaymentAdminScreen({
  tenantId,
  bookingId,
  serviceTotal,
  currency,
  depositPaid,
  paymentMode,
  functions,
  onDone,
  onBack,
}: FinalizePaymentAdminScreenProps) {
  const [tipText, setTipText] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tipDollars = parseFloat(tipText) || 0;
  const totalWithTip = serviceTotal + tipDollars;
  const remainingAfterDeposit = Math.max(0, totalWithTip - depositPaid);

  const totalMinor = Math.round(totalWithTip * 100);
  const tipMinor = Math.round(tipDollars * 100);

  async function capture(paidInPerson: boolean) {
    setLoading(true);
    setError(null);
    try {
      const fn = httpsCallable<
        {
          tenantId: string;
          bookingId: string;
          finalAmountMinor: number;
          tipAmountMinor: number;
          paidInPerson?: boolean;
        },
        { status: string }
      >(functions, "captureBookingPayment");
      const result = await fn({
        tenantId,
        bookingId,
        finalAmountMinor: totalMinor,
        tipAmountMinor: tipMinor,
        paidInPerson,
      });
      onDone(result.data.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment finalization failed.");
    } finally {
      setLoading(false);
    }
  }

  const canChargeCard =
    paymentMode === "card_on_file" ||
    paymentMode === "deposit" ||
    paymentMode === "full";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Finalize Payment</Text>
      </View>

      {/* Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Summary</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Service total</Text>
          <Text style={styles.rowValue}>
            {formatAmount(Math.round(serviceTotal * 100), currency)}
          </Text>
        </View>

        {depositPaid > 0 && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>
              {paymentMode === "card_on_file" ? "Card on file" : "Deposit authorized"}
            </Text>
            <Text style={styles.rowValue}>
              {formatAmount(Math.round(depositPaid * 100), currency)}
            </Text>
          </View>
        )}

        {/* Tip input */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <Text style={styles.rowLabel}>Tip</Text>
          <View style={styles.tipInputRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.tipInput}
              value={tipText}
              onChangeText={(v) => {
                if (/^\d*\.?\d{0,2}$/.test(v)) setTipText(v);
              }}
              keyboardType="decimal-pad"
              selectTextOnFocus
              placeholder="0.00"
            />
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <View style={[styles.row, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total to charge</Text>
          <Text style={styles.totalValue}>{formatAmount(totalMinor, currency)}</Text>
        </View>

        {depositPaid > 0 && paymentMode !== "card_on_file" && (
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Remaining to charge</Text>
            <Text style={styles.rowValue}>
              {formatAmount(Math.round(remainingAfterDeposit * 100), currency)}
            </Text>
          </View>
        )}
      </View>

      {/* Error */}
      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Actions */}
      <View style={styles.actions}>
        {canChargeCard && (
          <TouchableOpacity
            style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
            onPress={() => void capture(false)}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Charge Card on File</Text>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.secondaryBtn, loading && styles.primaryBtnDisabled]}
          onPress={() => void capture(true)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.secondaryBtnText}>Mark as Paid in Person</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: spacing.s6, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: spacing.s6, gap: 12 },
  backText: { fontSize: 16, color: colors.primary ?? "#000" },
  title: { fontSize: 20, fontWeight: "700" },
  section: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: spacing.s4,
    marginBottom: spacing.s4,
    gap: 6,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { fontSize: 15, color: "#444" },
  rowValue: { fontSize: 15, color: "#111", fontWeight: "500" },
  tipInputRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  currencySymbol: { fontSize: 15, color: "#444" },
  tipInput: {
    borderWidth: 1, borderColor: "#ccc", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    fontSize: 15, width: 80, textAlign: "right",
  },
  divider: { height: 1, backgroundColor: "#e5e5e5", marginVertical: 8 },
  totalRow: { paddingTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#111" },
  totalValue: { fontSize: 18, fontWeight: "800", color: "#111" },
  errorText: { color: "#dc2626", fontSize: 14, marginBottom: 12, textAlign: "center" },
  actions: { gap: spacing.s2 },
  primaryBtn: {
    backgroundColor: "#000", borderRadius: 10,
    paddingVertical: 14, alignItems: "center",
  },
  primaryBtnDisabled: { backgroundColor: "#888" },
  primaryBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: {
    backgroundColor: "#fff", borderRadius: 10,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1.5, borderColor: "#000",
  },
  secondaryBtnText: { color: "#000", fontWeight: "600", fontSize: 16 },
});
