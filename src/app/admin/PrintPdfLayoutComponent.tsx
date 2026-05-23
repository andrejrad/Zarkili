/**
 * W39 — PrintPdfLayoutComponent (M.19).
 *
 * A React Native component that describes the layout for printed / PDF
 * documents: invoices, payout statements, and refund receipts.
 *
 * On native the component renders as `<ScrollView>` so the user can preview
 * the document inside the app before sharing. The actual PDF file is produced
 * server-side via a Cloud Function that accepts the same `type` + `data`
 * payload used here.
 *
 * W14-DEBT-4: InvoiceTaxBreakdown shows per-jurisdiction tax lines when the
 * invoice payload contains a `taxLines` array.
 */
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PrintDocumentType = "invoice" | "payout_statement" | "refund_receipt";

/** Shared header fields present on every document type. */
type DocHeader = {
  tenantName: string;
  tenantAddress?: string;
  tenantEmail?: string;
  logoUrl?: string;
  generatedAt?: string;
};

/** Invoice — full invoice with optional per-jurisdiction tax breakdown (W14-DEBT-4). */
type InvoiceData = DocHeader & {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  status: "draft" | "open" | "paid" | "uncollectible" | "void";
  customerName: string;
  customerEmail?: string;
  lineItems: Array<{
    description: string;
    quantity?: number;
    unitAmountCents: number;
    totalAmountCents: number;
  }>;
  subtotalCents: number;
  /** Per-jurisdiction tax lines — W14-DEBT-4 */
  taxLines?: Array<{
    jurisdiction: string;
    rate: number;
    amountCents: number;
  }>;
  totalTaxCents: number;
  totalCents: number;
  amountPaidCents: number;
  amountDueCents: number;
  currency: string;
  notes?: string;
};

/** Payout statement. */
type PayoutStatementData = DocHeader & {
  statementPeriod: string;
  payouts: Array<{
    payoutId: string;
    arrivalDate: string;
    status: string;
    amountCents: number;
  }>;
  totalAmountCents: number;
  currency: string;
};

/** Refund receipt. */
type RefundReceiptData = DocHeader & {
  refundId: string;
  originalChargeId: string;
  refundDate: string;
  amountCents: number;
  currency: string;
  reason?: string;
  customerName: string;
  customerEmail?: string;
};

export type PrintPdfLayoutData = InvoiceData | PayoutStatementData | RefundReceiptData;

type PrintPdfLayoutComponentProps = {
  type: PrintDocumentType;
  data: PrintPdfLayoutData;
};

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

function statusColor(status: string): string {
  switch (status) {
    case "paid": return "#22C55E";
    case "open": return "#3B82F6";
    case "uncollectible":
    case "void": return "#9CA3AF";
    default: return "#F59E0B";
  }
}

// ---------------------------------------------------------------------------
// Sub-layouts
// ---------------------------------------------------------------------------

// W14-DEBT-4: per-jurisdiction tax breakdown
function InvoiceTaxBreakdown({ taxLines, totalTaxCents, currency }: {
  taxLines?: InvoiceData["taxLines"];
  totalTaxCents: number;
  currency: string;
}) {
  if (taxLines && taxLines.length > 0) {
    return (
      <>
        {taxLines.map((line, i) => (
          <View key={i} style={styles.lineRow}>
            <Text style={styles.lineDesc}>
              Tax — {line.jurisdiction} ({(line.rate * 100).toFixed(2)}%)
            </Text>
            <Text style={styles.lineAmount}>{formatCents(line.amountCents, currency)}</Text>
          </View>
        ))}
      </>
    );
  }
  if (totalTaxCents > 0) {
    return (
      <View style={styles.lineRow}>
        <Text style={styles.lineDesc}>Tax</Text>
        <Text style={styles.lineAmount}>{formatCents(totalTaxCents, currency)}</Text>
      </View>
    );
  }
  return null;
}

function InvoiceLayout({ data }: { data: InvoiceData }) {
  return (
    <View style={styles.page} testID="invoice-layout">
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.tenantName}>{data.tenantName}</Text>
          {data.tenantAddress ? <Text style={styles.headerMeta}>{data.tenantAddress}</Text> : null}
          {data.tenantEmail ? <Text style={styles.headerMeta}>{data.tenantEmail}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.docType}>INVOICE</Text>
          <Text style={styles.docNumber}>{data.invoiceNumber}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(data.status) }]}>
            <Text style={styles.statusBadgeText}>{data.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Bill to */}
      <View style={styles.billTo}>
        <Text style={styles.metaLabel}>Bill to</Text>
        <Text style={styles.billToName}>{data.customerName}</Text>
        {data.customerEmail ? <Text style={styles.metaValue}>{data.customerEmail}</Text> : null}
      </View>

      {/* Dates */}
      <View style={styles.datesRow}>
        <View>
          <Text style={styles.metaLabel}>Invoice date</Text>
          <Text style={styles.metaValue}>{data.invoiceDate}</Text>
        </View>
        {data.dueDate ? (
          <View>
            <Text style={styles.metaLabel}>Due date</Text>
            <Text style={styles.metaValue}>{data.dueDate}</Text>
          </View>
        ) : null}
      </View>

      {/* Line items */}
      <View style={styles.table}>
        <View style={[styles.lineRow, styles.tableHeader]}>
          <Text style={[styles.lineDesc, styles.tableHeaderText]}>Description</Text>
          <Text style={[styles.lineAmount, styles.tableHeaderText]}>Amount</Text>
        </View>
        {data.lineItems.map((item, i) => (
          <View key={i} style={styles.lineRow}>
            <Text style={styles.lineDesc}>{item.description}</Text>
            <Text style={styles.lineAmount}>{formatCents(item.totalAmountCents, data.currency)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <View style={styles.lineRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.lineAmount}>{formatCents(data.subtotalCents, data.currency)}</Text>
        </View>
        {/* W14-DEBT-4 */}
        <InvoiceTaxBreakdown
          taxLines={data.taxLines}
          totalTaxCents={data.totalTaxCents}
          currency={data.currency}
        />
        <View style={[styles.lineRow, styles.totalRow]}>
          <Text style={styles.totalBold}>Total</Text>
          <Text style={styles.totalBold}>{formatCents(data.totalCents, data.currency)}</Text>
        </View>
        {data.amountPaidCents > 0 ? (
          <View style={styles.lineRow}>
            <Text style={styles.totalLabel}>Amount paid</Text>
            <Text style={[styles.lineAmount, { color: "#22C55E" }]}>
              -{formatCents(data.amountPaidCents, data.currency)}
            </Text>
          </View>
        ) : null}
        <View style={[styles.lineRow, styles.totalRow]}>
          <Text style={styles.totalBold}>Amount due</Text>
          <Text style={styles.totalBold}>{formatCents(data.amountDueCents, data.currency)}</Text>
        </View>
      </View>

      {data.notes ? (
        <View style={styles.notes}>
          <Text style={styles.metaLabel}>Notes</Text>
          <Text style={styles.notesText}>{data.notes}</Text>
        </View>
      ) : null}

      {data.generatedAt ? (
        <Text style={styles.footer}>Generated {data.generatedAt}</Text>
      ) : null}
    </View>
  );
}

function PayoutStatementLayout({ data }: { data: PayoutStatementData }) {
  return (
    <View style={styles.page} testID="payout-statement-layout">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.tenantName}>{data.tenantName}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.docType}>PAYOUT STATEMENT</Text>
          <Text style={styles.docNumber}>{data.statementPeriod}</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.lineRow, styles.tableHeader]}>
          <Text style={[styles.lineDesc, styles.tableHeaderText]}>Date</Text>
          <Text style={[styles.lineDesc, styles.tableHeaderText]}>Status</Text>
          <Text style={[styles.lineAmount, styles.tableHeaderText]}>Amount</Text>
        </View>
        {data.payouts.map((p) => (
          <View key={p.payoutId} style={styles.lineRow}>
            <Text style={styles.lineDesc}>{p.arrivalDate}</Text>
            <Text style={styles.lineDesc}>{p.status}</Text>
            <Text style={styles.lineAmount}>{formatCents(p.amountCents, data.currency)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.totals}>
        <View style={[styles.lineRow, styles.totalRow]}>
          <Text style={styles.totalBold}>Total paid out</Text>
          <Text style={styles.totalBold}>{formatCents(data.totalAmountCents, data.currency)}</Text>
        </View>
      </View>

      {data.generatedAt ? (
        <Text style={styles.footer}>Generated {data.generatedAt}</Text>
      ) : null}
    </View>
  );
}

function RefundReceiptLayout({ data }: { data: RefundReceiptData }) {
  return (
    <View style={styles.page} testID="refund-receipt-layout">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.tenantName}>{data.tenantName}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.docType}>REFUND RECEIPT</Text>
          <Text style={styles.docNumber}>{data.refundId}</Text>
        </View>
      </View>

      <View style={styles.billTo}>
        <Text style={styles.metaLabel}>Customer</Text>
        <Text style={styles.billToName}>{data.customerName}</Text>
        {data.customerEmail ? <Text style={styles.metaValue}>{data.customerEmail}</Text> : null}
      </View>

      <View style={styles.datesRow}>
        <View>
          <Text style={styles.metaLabel}>Refund date</Text>
          <Text style={styles.metaValue}>{data.refundDate}</Text>
        </View>
        <View>
          <Text style={styles.metaLabel}>Original charge</Text>
          <Text style={styles.metaValue}>{data.originalChargeId}</Text>
        </View>
      </View>

      {data.reason ? (
        <View style={styles.notes}>
          <Text style={styles.metaLabel}>Reason</Text>
          <Text style={styles.notesText}>{data.reason}</Text>
        </View>
      ) : null}

      <View style={styles.totals}>
        <View style={[styles.lineRow, styles.totalRow]}>
          <Text style={styles.totalBold}>Refund amount</Text>
          <Text style={styles.totalBold}>{formatCents(data.amountCents, data.currency)}</Text>
        </View>
      </View>

      {data.generatedAt ? (
        <Text style={styles.footer}>Generated {data.generatedAt}</Text>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PrintPdfLayoutComponent({ type, data }: PrintPdfLayoutComponentProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID="print-pdf-layout">
      {type === "invoice" ? (
        <InvoiceLayout data={data as InvoiceData} />
      ) : type === "payout_statement" ? (
        <PayoutStatementLayout data={data as PayoutStatementData} />
      ) : (
        <RefundReceiptLayout data={data as RefundReceiptData} />
      )}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: "#F7F4EE", alignItems: "center", paddingVertical: 24 },
  page: { width: "100%", maxWidth: 680, backgroundColor: "#FFFFFF", borderRadius: 8, padding: 24, gap: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#E5E0D1", paddingBottom: 16 },
  headerLeft: { gap: 2, flex: 1 },
  headerRight: { alignItems: "flex-end", gap: 4 },
  tenantName: { fontSize: 18, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  headerMeta: { fontSize: 12, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  docType: { fontSize: 20, fontFamily: brandTypography.semibold, color: "#1A1A1A", letterSpacing: 1 },
  docNumber: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9999, alignSelf: "flex-end" },
  statusBadgeText: { fontSize: 11, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  billTo: { gap: 2 },
  billToName: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  datesRow: { flexDirection: "row", gap: 32 },
  metaLabel: { fontSize: 11, fontFamily: brandTypography.medium, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5 },
  metaValue: { fontSize: 13, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  table: { borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 8, overflow: "hidden" },
  tableHeader: { backgroundColor: "#F7F4EE" },
  tableHeaderText: { fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  lineRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: "#E5E0D1" },
  lineDesc: { flex: 1, fontSize: 13, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  lineAmount: { fontSize: 13, fontFamily: brandTypography.regular, color: "#1A1A1A", textAlign: "right", minWidth: 80 },
  totals: { alignSelf: "flex-end", width: "50%", gap: 4 },
  totalLabel: { fontSize: 13, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  totalBold: { fontSize: 14, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  totalRow: { borderTopWidth: 1.5, borderTopColor: "#1A1A1A", marginTop: 4, paddingTop: 6 },
  notes: { gap: 4 },
  notesText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  footer: { fontSize: 11, fontFamily: brandTypography.regular, color: "#9CA3AF", textAlign: "center" },
});
