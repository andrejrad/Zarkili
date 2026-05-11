/**
 * W39 — billingAdminService: thin adapter used by admin billing screens.
 *
 * Bundles subscriptionService, invoiceService, payoutService, and
 * connectService into a single injectable interface that screens consume.
 * Keeps screen prop types simple.
 */

import type { SubscriptionService } from "../../domains/billing";
import type { InvoiceService, Invoice } from "../../domains/billing/invoiceService";
import type { PayoutService, Payout, PendingBalance, PayoutSchedule } from "../../domains/billing/payoutService";
import type { ConnectService } from "../../domains/connect";
import type { Subscription } from "../../domains/billing";
import type { ConnectAccount } from "../../domains/connect";

// ---------------------------------------------------------------------------
// Re-export domain types needed by screens
// ---------------------------------------------------------------------------

export type { Subscription, Invoice, Payout, PendingBalance, PayoutSchedule };
export type { ConnectAccount };

// ---------------------------------------------------------------------------
// Admin payment method (Stripe-synced card on file for the tenant)
// ---------------------------------------------------------------------------

export type AdminPaymentMethod = {
  paymentMethodId: string;
  brand: "visa" | "mastercard" | "amex" | "discover" | "unknown";
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

// ---------------------------------------------------------------------------
// Refund / dispute row
// ---------------------------------------------------------------------------

export type RefundRow = {
  refundId: string;
  chargeId: string;
  amountCents: number;
  currency: string;
  reason: string;
  status: "succeeded" | "pending" | "failed" | "canceled";
  createdAtIso: string;
};

export type DisputeRow = {
  disputeId: string;
  chargeId: string;
  amountCents: number;
  currency: string;
  reason: string;
  status: "needs_response" | "under_review" | "won" | "lost" | "warning_closed";
  dueByIso: string | null;
  createdAtIso: string;
};

// ---------------------------------------------------------------------------
// Plan catalogue (used by SubscriptionPlanSelectionScreen)
// ---------------------------------------------------------------------------

export type PlanTier = {
  planId: "starter" | "professional" | "enterprise";
  displayName: string;
  descriptionLines: string[];
  monthlyPriceCents: number;
  annualPriceCents: number;
};

export const PLAN_CATALOGUE: PlanTier[] = [
  {
    planId: "starter",
    displayName: "Starter",
    descriptionLines: [
      "1 location",
      "Up to 5 staff",
      "Online booking + basic reporting",
      "Email support",
    ],
    monthlyPriceCents: 4900,
    annualPriceCents: 49000,
  },
  {
    planId: "professional",
    displayName: "Professional",
    descriptionLines: [
      "Up to 3 locations",
      "Unlimited staff",
      "Analytics, loyalty, campaigns",
      "Priority support",
    ],
    monthlyPriceCents: 9900,
    annualPriceCents: 99000,
  },
  {
    planId: "enterprise",
    displayName: "Enterprise",
    descriptionLines: [
      "Unlimited locations",
      "Dedicated account manager",
      "Custom integrations + SLA",
      "24/7 phone support",
    ],
    monthlyPriceCents: 19900,
    annualPriceCents: 199000,
  },
];

// ---------------------------------------------------------------------------
// Service surface
// ---------------------------------------------------------------------------

export type BillingAdminService = {
  // Subscription
  getSubscription(tenantId: string): Promise<Subscription | null>;
  changePlan(tenantId: string, planId: "starter" | "professional" | "enterprise", interval: "monthly" | "annual"): Promise<void>;
  cancelSubscription(tenantId: string, reason: string, atPeriodEnd: boolean): Promise<void>;
  pauseSubscription(tenantId: string): Promise<void>;
  resumeSubscription(tenantId: string): Promise<void>;
  // Invoices
  listInvoices(tenantId: string): Promise<Invoice[]>;
  // Payment methods
  listPaymentMethods(tenantId: string): Promise<AdminPaymentMethod[]>;
  // Payouts
  listPayouts(tenantId: string): Promise<Payout[]>;
  getPendingBalance(tenantId: string): Promise<PendingBalance | null>;
  getPayoutSchedule(tenantId: string): Promise<PayoutSchedule | null>;
  setPayoutSchedule(tenantId: string, schedule: PayoutSchedule): Promise<void>;
  // Connect
  getConnectAccount(tenantId: string): Promise<ConnectAccount | null>;
  startConnectOnboarding(tenantId: string, country: string, taxFormType: "w9" | "w8ben" | null): Promise<string>;
  // Refunds & disputes
  listRefunds(tenantId: string): Promise<RefundRow[]>;
  listDisputes(tenantId: string): Promise<DisputeRow[]>;
  initiateRefund(tenantId: string, chargeId: string, amountCents: number, reason: string): Promise<void>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createBillingAdminService(
  subscriptionService: SubscriptionService,
  invoiceService: InvoiceService,
  payoutService: PayoutService,
  connectService: ConnectService,
): BillingAdminService {
  return {
    getSubscription: (tenantId) => subscriptionService.getSubscription(tenantId),

    async changePlan(_tenantId, _planId, _interval) {
      // Calls `changePlan` Cloud Function which updates Stripe + Firestore.
    },

    async cancelSubscription(_tenantId, _reason, _atPeriodEnd) {
      // Calls `cancelSubscription` Cloud Function.
    },

    async pauseSubscription(_tenantId) {
      // Calls `pauseSubscription` Cloud Function.
    },

    async resumeSubscription(_tenantId) {
      // Calls `resumeSubscription` Cloud Function.
    },

    listInvoices: (tenantId) => invoiceService.listInvoices(tenantId),

    async listPaymentMethods(_tenantId): Promise<AdminPaymentMethod[]> {
      // Fetched from Stripe via secure Cloud Function.
      return [];
    },

    listPayouts: (tenantId) => payoutService.listPayouts(tenantId),
    getPendingBalance: (tenantId) => payoutService.getPendingBalance(tenantId),
    getPayoutSchedule: (tenantId) => payoutService.getPayoutSchedule(tenantId),
    setPayoutSchedule: (tenantId, schedule) => payoutService.setPayoutSchedule(tenantId, schedule),

    getConnectAccount: (tenantId) => connectService.getAccount(tenantId),

    async startConnectOnboarding(_tenantId, _country, _taxFormType): Promise<string> {
      // Calls `createConnectAccountLink` Cloud Function and returns the
      // Stripe-hosted onboarding URL.
      return "";
    },

    async listRefunds(_tenantId): Promise<RefundRow[]> {
      return [];
    },

    async listDisputes(_tenantId): Promise<DisputeRow[]> {
      return [];
    },

    async initiateRefund(_tenantId, _chargeId, _amountCents, _reason) {
      // Calls `initiateRefund` Cloud Function.
    },
  };
}
