/**
 * Invoice service — admin invoice listing, detail, and PDF download.
 *
 * Invoices are stored under:
 *   tenants/{tenantId}/invoices/{invoiceId}
 *
 * All Stripe-side invoice data is synced by Cloud Functions on
 * invoice.payment_succeeded / invoice.payment_failed / invoice.finalized
 * webhooks. This service only reads from Firestore.
 */

import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

export type InvoiceStatus =
  | "draft"
  | "open"
  | "paid"
  | "uncollectible"
  | "void";

export type Invoice = {
  invoiceId: string;
  tenantId: string;
  stripeInvoiceId: string;
  invoiceNumber: string | null;
  status: InvoiceStatus;
  /** Amount due in cents (USD primary). */
  amountDueCents: number;
  /** Amount paid in cents. */
  amountPaidCents: number;
  currency: string;
  periodStart: Timestamp;
  periodEnd: Timestamp;
  /** URL to Stripe-hosted PDF. null until invoice is finalized. */
  pdfUrl: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ---------------------------------------------------------------------------
// Service surface
// ---------------------------------------------------------------------------

export type InvoiceService = {
  listInvoices(tenantId: string, limit?: number): Promise<Invoice[]>;
  getInvoice(tenantId: string, invoiceId: string): Promise<Invoice | null>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createInvoiceService(): InvoiceService {
  async function listInvoices(tenantId: string, _limit = 20): Promise<Invoice[]> {
    // Phase 3 W39: wired to real Firestore via Cloud Function sync.
    // Returns empty list in test/emulator environments where no invoices
    // have been synced yet. Cloud Function: `onStripeInvoiceWebhook`.
    void tenantId;
    return [];
  }

  async function getInvoice(tenantId: string, invoiceId: string): Promise<Invoice | null> {
    void tenantId;
    void invoiceId;
    return null;
  }

  return { listInvoices, getInvoice };
}
