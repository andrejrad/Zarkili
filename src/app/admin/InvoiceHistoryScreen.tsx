/**
 * W39 — InvoiceHistoryScreen: invoice list with PDF download links.
 *
 * Shows all invoices for the tenant ordered by most recent first.
 * PDF download opens the Stripe-hosted PDF URL.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { Invoice } from "../../domains/billing/invoiceService";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";

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

function formatTimestamp(ts: { toDate: () => Date } | null): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusLabel(status: Invoice["status"]): string {
  const map: Record<Invoice["status"], string> = {
    draft: "Draft",
    open: "Open",
    paid: "Paid",
    uncollectible: "Uncollectible",
    void: "Void",
  };
  return map[status];
}

function statusColor(status: Invoice["status"]): string {
  if (status === "paid") return "#22C55E";
  if (status === "open") return "#F59E0B";
  return "#9CA3AF";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type InvoiceHistoryScreenProps = {
  loading: boolean;
  error: string | null;
  invoices: Invoice[];
  onRetry: () => void;
  onBack: () => void;
  onDownloadInvoice: (invoice: Invoice) => void;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function InvoiceHistoryScreen({
  loading,
  error,
  invoices,
  onRetry,
  onBack,
  onDownloadInvoice,
}: InvoiceHistoryScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Billing</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Invoice history</Text>

      {loading ? <AdminLoadingState label="Loading invoices…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && !error && invoices.length === 0 ? (
        <AdminEmptyState
          title="No invoices yet"
          body="Invoices will appear here once your subscription generates its first billing cycle."
        />
      ) : null}

      {!loading && invoices.length > 0 ? (
        <View style={styles.list}>
          {invoices.map((invoice) => (
            <View key={invoice.invoiceId} style={styles.row} testID={`invoice-row-${invoice.invoiceId}`}>
              <View style={styles.rowLeft}>
                <Text style={styles.invoiceNumber}>
                  {invoice.invoiceNumber ?? invoice.stripeInvoiceId}
                </Text>
                <Text style={styles.period}>
                  {formatTimestamp(invoice.periodStart)} – {formatTimestamp(invoice.periodEnd)}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: `${statusColor(invoice.status)}22` }]}>
                  <Text style={[styles.statusPillText, { color: statusColor(invoice.status) }]}>
                    {statusLabel(invoice.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.amount}>
                  {formatCents(invoice.amountPaidCents > 0 ? invoice.amountPaidCents : invoice.amountDueCents, invoice.currency)}
                </Text>
                {invoice.pdfUrl ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Download PDF for ${invoice.invoiceNumber ?? "invoice"}`}
                    onPress={() => onDownloadInvoice(invoice)}
                    style={styles.downloadBtn}
                    testID={`download-invoice-${invoice.invoiceId}`}
                  >
                    <Text style={styles.downloadLabel}>PDF ↓</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingBottom: 32, gap: 12 },
  backRow: { paddingBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  pageTitle: { fontSize: 26, lineHeight: 34, fontFamily: brandTypography.semibold, color: "#1A1A1A", marginBottom: 4 },
  list: { gap: 8 },
  row: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  rowLeft: { flex: 1, gap: 4 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  invoiceNumber: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  period: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  statusPill: { borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  statusPillText: { fontSize: 11, fontFamily: brandTypography.medium },
  amount: { fontSize: 15, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  downloadBtn: { backgroundColor: "#F5F0E8", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  downloadLabel: { fontSize: 12, fontFamily: brandTypography.medium, color: "#1A1A1A" },
});
