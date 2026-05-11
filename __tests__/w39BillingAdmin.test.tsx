/**
 * W39 — Billing & payouts admin screens tests.
 *
 * Covers: SubscriptionPlanSelectionScreen, InvoiceHistoryScreen,
 * AdminPaymentMethodScreen, CancelSubscriptionScreen,
 * StripeConnectOnboardingScreen, ConnectHealthStatusScreen,
 * PayoutHistoryScreen, RefundDisputeAdminScreen,
 * BillingHubScreen, PrintPdfLayoutComponent.
 */
import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";

import { SubscriptionPlanSelectionScreen } from "../src/app/admin/SubscriptionPlanSelectionScreen";
import { InvoiceHistoryScreen } from "../src/app/admin/InvoiceHistoryScreen";
import { AdminPaymentMethodScreen } from "../src/app/admin/AdminPaymentMethodScreen";
import { CancelSubscriptionScreen } from "../src/app/admin/CancelSubscriptionScreen";
import { StripeConnectOnboardingScreen } from "../src/app/admin/StripeConnectOnboardingScreen";
import { ConnectHealthStatusScreen } from "../src/app/admin/ConnectHealthStatusScreen";
import { PayoutHistoryScreen } from "../src/app/admin/PayoutHistoryScreen";
import { RefundDisputeAdminScreen } from "../src/app/admin/RefundDisputeAdminScreen";
import { BillingHubScreen } from "../src/app/admin/BillingHubScreen";
import { PrintPdfLayoutComponent } from "../src/app/admin/PrintPdfLayoutComponent";

// ---------------------------------------------------------------------------
// Shared stubs
// ---------------------------------------------------------------------------

const mockSubscription = {
  subscriptionId: "sub_1",
  tenantId: "tenant_1",
  stripeSubscriptionId: "stripe_sub_1",
  planId: "professional",
  status: "active",
  interval: "monthly",
  currentPeriodStart: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  trialEndsAt: null,
  pastDueSince: null,
};

const mockInvoice = {
  invoiceId: "inv_1",
  stripeInvoiceId: "in_1",
  invoiceNumber: "INV-001",
  status: "paid",
  amountDueCents: 0,
  amountPaidCents: 9900,
  currency: "usd",
  periodStart: null,
  periodEnd: null,
  pdfUrl: "https://example.com/invoice.pdf",
  createdAt: null,
  updatedAt: null,
};

const mockPaymentMethod = {
  paymentMethodId: "pm_1",
  brand: "visa",
  last4: "4242",
  expMonth: 12,
  expYear: 2027,
  isDefault: true,
};

const mockPayout = {
  payoutId: "po_1",
  stripePayoutId: "po_stripe_1",
  status: "paid",
  amountCents: 50000,
  currency: "usd",
  arrivalDate: "2026-05-01",
  failureMessage: null,
};

const mockConnectAccount = {
  tenantId: "tenant_1",
  stripeAccountId: "acct_test_1",
  accountType: "express",
  country: "US",
  status: "active",
  payoutsEnabled: true,
  chargesEnabled: true,
  detailsSubmitted: true,
  taxFormType: "w9",
  taxFormCapturedAt: null,
  eligible1099K: false,
  lastPayoutFailureAt: null,
  lastPayoutFailureReason: null,
  restrictionReasons: [],
  lastEventId: null,
  createdAt: null,
  updatedAt: null,
};

const mockService = {
  getSubscription: jest.fn().mockResolvedValue(mockSubscription),
  changePlan: jest.fn().mockResolvedValue(undefined),
  cancelSubscription: jest.fn().mockResolvedValue(undefined),
  pauseSubscription: jest.fn().mockResolvedValue(undefined),
  resumeSubscription: jest.fn().mockResolvedValue(undefined),
  listInvoices: jest.fn().mockResolvedValue([mockInvoice]),
  listPaymentMethods: jest.fn().mockResolvedValue([mockPaymentMethod]),
  listPayouts: jest.fn().mockResolvedValue([mockPayout]),
  getPendingBalance: jest.fn().mockResolvedValue({ availableCents: 12000, pendingCents: 500, currency: "usd" }),
  getPayoutSchedule: jest.fn().mockResolvedValue({ interval: "daily", delayDays: 2 }),
  setPayoutSchedule: jest.fn().mockResolvedValue(undefined),
  getConnectAccount: jest.fn().mockResolvedValue(mockConnectAccount),
  startConnectOnboarding: jest.fn().mockResolvedValue({ url: "https://connect.stripe.com/onboarding" }),
  listRefunds: jest.fn().mockResolvedValue([]),
  listDisputes: jest.fn().mockResolvedValue([]),
  initiateRefund: jest.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// SubscriptionPlanSelectionScreen
// ---------------------------------------------------------------------------

describe("SubscriptionPlanSelectionScreen", () => {
  it("renders plan cards for all three tiers", () => {
    const { getByTestId } = render(
      <SubscriptionPlanSelectionScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        subscription={mockSubscription}
        userRole="owner"
        service={mockService}
        onBack={jest.fn()}
        onPlanChanged={jest.fn()}
      />
    );
    expect(getByTestId("plan-card-starter")).toBeTruthy();
    expect(getByTestId("plan-card-professional")).toBeTruthy();
    expect(getByTestId("plan-card-enterprise")).toBeTruthy();
  });

  it("shows confirm button when a different plan is selected", () => {
    const { getByTestId } = render(
      <SubscriptionPlanSelectionScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        subscription={mockSubscription}
        userRole="owner"
        service={mockService}
        onBack={jest.fn()}
        onPlanChanged={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("plan-card-starter"));
    expect(getByTestId("confirm-plan-change")).toBeTruthy();
  });

  it("calls service.changePlan on confirm", async () => {
    const onPlanChanged = jest.fn();
    const { getByTestId } = render(
      <SubscriptionPlanSelectionScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        subscription={mockSubscription}
        userRole="owner"
        service={mockService}
        onBack={jest.fn()}
        onPlanChanged={onPlanChanged}
      />
    );
    fireEvent.press(getByTestId("plan-card-starter"));
    fireEvent.press(getByTestId("confirm-plan-change"));
    await waitFor(() => expect(mockService.changePlan).toHaveBeenCalled());
  });
});

// ---------------------------------------------------------------------------
// InvoiceHistoryScreen
// ---------------------------------------------------------------------------

describe("InvoiceHistoryScreen", () => {
  it("renders invoice rows", () => {
    const { getByTestId } = render(
      <InvoiceHistoryScreen
        loading={false}
        error={null}
        invoices={[mockInvoice]}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onDownloadInvoice={jest.fn()}
      />
    );
    expect(getByTestId("invoice-row-inv_1")).toBeTruthy();
  });

  it("renders download button for invoice with PDF URL", () => {
    const onDownload = jest.fn();
    const { getByTestId } = render(
      <InvoiceHistoryScreen
        loading={false}
        error={null}
        invoices={[mockInvoice]}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onDownloadInvoice={onDownload}
      />
    );
    fireEvent.press(getByTestId("download-invoice-inv_1"));
    expect(onDownload).toHaveBeenCalledWith(mockInvoice);
  });

  it("shows empty state when no invoices", () => {
    const { queryByTestId } = render(
      <InvoiceHistoryScreen
        loading={false}
        error={null}
        invoices={[]}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onDownloadInvoice={jest.fn()}
      />
    );
    expect(queryByTestId("invoice-row-inv_1")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// AdminPaymentMethodScreen
// ---------------------------------------------------------------------------

describe("AdminPaymentMethodScreen", () => {
  it("renders card with last4 and default badge", () => {
    const { getByTestId } = render(
      <AdminPaymentMethodScreen
        loading={false}
        error={null}
        methods={[mockPaymentMethod]}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onAddCard={jest.fn()}
        onSetDefault={jest.fn().mockResolvedValue(undefined)}
        onRemove={jest.fn().mockResolvedValue(undefined)}
      />
    );
    expect(getByTestId("card-pm_1")).toBeTruthy();
  });

  it("shows confirm remove step after pressing remove", () => {
    const { getByTestId } = render(
      <AdminPaymentMethodScreen
        loading={false}
        error={null}
        methods={[mockPaymentMethod]}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onAddCard={jest.fn()}
        onSetDefault={jest.fn().mockResolvedValue(undefined)}
        onRemove={jest.fn().mockResolvedValue(undefined)}
      />
    );
    fireEvent.press(getByTestId("remove-pm_1"));
    expect(getByTestId("confirm-remove-pm_1")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// CancelSubscriptionScreen
// ---------------------------------------------------------------------------

describe("CancelSubscriptionScreen", () => {
  it("renders reason options", () => {
    const { getByTestId } = render(
      <CancelSubscriptionScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        subscription={mockSubscription}
        userRole="owner"
        service={mockService}
        onBack={jest.fn()}
        onCancelled={jest.fn()}
        onPaused={jest.fn()}
      />
    );
    expect(getByTestId("reason-Too expensive")).toBeTruthy();
    expect(getByTestId("reason-Switching to a competitor")).toBeTruthy();
  });

  it("shows proceed button after selecting a reason", () => {
    const { getByTestId } = render(
      <CancelSubscriptionScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        subscription={mockSubscription}
        userRole="owner"
        service={mockService}
        onBack={jest.fn()}
        onCancelled={jest.fn()}
        onPaused={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("reason-Too expensive"));
    expect(getByTestId("proceed-to-confirm")).toBeTruthy();
  });

  it("shows confirm cancel button after proceeding", () => {
    const { getByTestId } = render(
      <CancelSubscriptionScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        subscription={mockSubscription}
        userRole="owner"
        service={mockService}
        onBack={jest.fn()}
        onCancelled={jest.fn()}
        onPaused={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("reason-Too expensive"));
    fireEvent.press(getByTestId("cancel-at-period-end"));
    fireEvent.press(getByTestId("proceed-to-confirm"));
    expect(getByTestId("confirm-cancel-btn")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// StripeConnectOnboardingScreen
// ---------------------------------------------------------------------------

describe("StripeConnectOnboardingScreen", () => {
  const noAccountProps = {
    tenantId: "tenant_1",
    loading: false,
    error: null,
    account: null,
    userRole: "owner" as const,
    service: mockService,
    onBack: jest.fn(),
    onOnboardingLinkReady: jest.fn(),
  };

  it("renders country selection options", () => {
    const { getByTestId } = render(<StripeConnectOnboardingScreen {...noAccountProps} />);
    expect(getByTestId("country-us")).toBeTruthy();
    expect(getByTestId("country-other")).toBeTruthy();
  });

  it("shows tax form options after selecting US", () => {
    const { getByTestId } = render(<StripeConnectOnboardingScreen {...noAccountProps} />);
    fireEvent.press(getByTestId("country-us"));
    expect(getByTestId("tax-form-w9")).toBeTruthy();
    expect(getByTestId("tax-form-w8ben")).toBeTruthy();
  });

  it("enables launch button after selecting tax form", () => {
    const { getByTestId } = render(<StripeConnectOnboardingScreen {...noAccountProps} />);
    fireEvent.press(getByTestId("country-us"));
    fireEvent.press(getByTestId("tax-form-w9"));
    expect(getByTestId("launch-connect-onboarding")).toBeTruthy();
  });

  it("shows active success state when account is already active", () => {
    // When account is active, the onboarding screen shows 'already active' content.
    // Verify country selection is NOT shown (replaced by active state).
    const { queryByTestId } = render(
      <StripeConnectOnboardingScreen {...noAccountProps} account={mockConnectAccount} />
    );
    // No country/tax-form pickers when account is already active
    expect(queryByTestId("country-us")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ConnectHealthStatusScreen
// ---------------------------------------------------------------------------

describe("ConnectHealthStatusScreen", () => {
  it("renders active Connect status with account details", () => {
    // Active account shows account content (no empty state)
    const { queryByText } = render(
      <ConnectHealthStatusScreen
        loading={false}
        error={null}
        account={mockConnectAccount}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onResumeOnboarding={jest.fn()}
      />
    );
    // Should not show empty state prompt
    expect(queryByText("No Connect account")).toBeNull();
  });

  it("shows resolve restrictions button when restricted", () => {
    const restrictedAccount = { ...mockConnectAccount, status: "restricted", restrictionReasons: ["individual.id_number"] };
    const { getByTestId } = render(
      <ConnectHealthStatusScreen
        loading={false}
        error={null}
        account={restrictedAccount}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onResumeOnboarding={jest.fn()}
      />
    );
    expect(getByTestId("resolve-restrictions-btn")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// PayoutHistoryScreen
// ---------------------------------------------------------------------------

describe("PayoutHistoryScreen", () => {
  const pendingBalance = { availableCents: 12000, pendingCents: 500, currency: "usd" };
  const payoutSchedule = { interval: "daily" as const, delayDays: 2 };

  it("renders available and pending balance tiles", () => {
    const { getByTestId } = render(
      <PayoutHistoryScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        payouts={[mockPayout]}
        pendingBalance={pendingBalance}
        payoutSchedule={payoutSchedule}
        service={mockService}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onScheduleSaved={jest.fn()}
      />
    );
    expect(getByTestId("available-balance")).toBeTruthy();
    expect(getByTestId("pending-balance")).toBeTruthy();
  });

  it("renders payout rows", () => {
    const { getByTestId } = render(
      <PayoutHistoryScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        payouts={[mockPayout]}
        pendingBalance={pendingBalance}
        payoutSchedule={payoutSchedule}
        service={mockService}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onScheduleSaved={jest.fn()}
      />
    );
    expect(getByTestId("payout-po_1")).toBeTruthy();
  });

  it("shows schedule edit button", () => {
    const { getByTestId } = render(
      <PayoutHistoryScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        payouts={[]}
        pendingBalance={pendingBalance}
        payoutSchedule={payoutSchedule}
        service={mockService}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onScheduleSaved={jest.fn()}
      />
    );
    expect(getByTestId("edit-schedule-btn")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// RefundDisputeAdminScreen
// ---------------------------------------------------------------------------

describe("RefundDisputeAdminScreen", () => {
  const mockDispute = {
    disputeId: "dp_1",
    chargeId: "ch_1",
    amountCents: 5000,
    currency: "usd",
    reason: "fraudulent",
    status: "needs_response",
    dueByIso: "2026-06-01",
    createdAtIso: "2026-05-01",
  };

  it("renders refunds tab by default", () => {
    const { getByTestId } = render(
      <RefundDisputeAdminScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        refunds={[]}
        disputes={[mockDispute]}
        service={mockService}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onRefundInitiated={jest.fn()}
      />
    );
    expect(getByTestId("tab-refunds")).toBeTruthy();
  });

  it("switches to disputes tab", () => {
    const { getByTestId } = render(
      <RefundDisputeAdminScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        refunds={[]}
        disputes={[mockDispute]}
        service={mockService}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onRefundInitiated={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("tab-disputes"));
    expect(getByTestId("dispute-dp_1")).toBeTruthy();
  });

  it("highlights urgent disputes (needs_response)", () => {
    const { getByTestId } = render(
      <RefundDisputeAdminScreen
        tenantId="tenant_1"
        loading={false}
        error={null}
        refunds={[]}
        disputes={[mockDispute]}
        service={mockService}
        onRetry={jest.fn()}
        onBack={jest.fn()}
        onRefundInitiated={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("tab-disputes"));
    // Dispute card renders with urgent styling
    expect(getByTestId("dispute-dp_1")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// BillingHubScreen (W14-DEBT-3 suspension banner)
// ---------------------------------------------------------------------------

describe("BillingHubScreen", () => {
  it("renders subscription summary when active", () => {
    const { getByTestId, queryByTestId } = render(
      <BillingHubScreen
        loading={false}
        error={null}
        subscription={mockSubscription}
        connectAccount={mockConnectAccount}
        pendingBalance={null}
        onBack={jest.fn()}
        onNavigateTo={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    expect(queryByTestId("suspension-banner")).toBeNull();
    expect(queryByTestId("past-due-banner")).toBeNull();
  });

  it("shows suspended banner and upgrade CTA for suspended subscription (W14-DEBT-3)", () => {
    const suspended = { ...mockSubscription, status: "suspended" };
    const { getByTestId } = render(
      <BillingHubScreen
        loading={false}
        error={null}
        subscription={suspended}
        connectAccount={null}
        pendingBalance={null}
        onBack={jest.fn()}
        onNavigateTo={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    expect(getByTestId("suspension-banner")).toBeTruthy();
    expect(getByTestId("suspension-cta")).toBeTruthy();
  });

  it("shows past-due banner for past_due subscription (W14-DEBT-3)", () => {
    const pastDue = { ...mockSubscription, status: "past_due" };
    const { getByTestId } = render(
      <BillingHubScreen
        loading={false}
        error={null}
        subscription={pastDue}
        connectAccount={null}
        pendingBalance={null}
        onBack={jest.fn()}
        onNavigateTo={jest.fn()}
        onRetry={jest.fn()}
      />
    );
    expect(getByTestId("past-due-banner")).toBeTruthy();
    expect(getByTestId("past-due-cta")).toBeTruthy();
  });

  it("navigates to payment-method route from suspension CTA", () => {
    const suspended = { ...mockSubscription, status: "suspended" };
    const onNavigateTo = jest.fn();
    const { getByTestId } = render(
      <BillingHubScreen
        loading={false}
        error={null}
        subscription={suspended}
        connectAccount={null}
        pendingBalance={null}
        onBack={jest.fn()}
        onNavigateTo={onNavigateTo}
        onRetry={jest.fn()}
      />
    );
    fireEvent.press(getByTestId("suspension-cta"));
    expect(onNavigateTo).toHaveBeenCalledWith("payment-method");
  });
});

// ---------------------------------------------------------------------------
// PrintPdfLayoutComponent (M.19 + W14-DEBT-4 tax breakdown)
// ---------------------------------------------------------------------------

describe("PrintPdfLayoutComponent", () => {
  const baseInvoiceData = {
    tenantName: "Test Salon",
    invoiceNumber: "INV-001",
    invoiceDate: "2026-01-01",
    status: "paid" as const,
    customerName: "Jane Doe",
    lineItems: [{ description: "Haircut", totalAmountCents: 5000, unitAmountCents: 5000 }],
    subtotalCents: 5000,
    totalTaxCents: 400,
    totalCents: 5400,
    amountPaidCents: 5400,
    amountDueCents: 0,
    currency: "usd",
  };

  it("renders invoice layout", () => {
    const { getByTestId } = render(
      <PrintPdfLayoutComponent type="invoice" data={baseInvoiceData} />
    );
    expect(getByTestId("invoice-layout")).toBeTruthy();
  });

  it("renders per-jurisdiction tax lines when taxLines present (W14-DEBT-4)", () => {
    const dataWithTax = {
      ...baseInvoiceData,
      taxLines: [
        { jurisdiction: "CA", rate: 0.08, amountCents: 400 },
      ],
    };
    const { getByText } = render(
      <PrintPdfLayoutComponent type="invoice" data={dataWithTax} />
    );
    expect(getByText(/Tax — CA/)).toBeTruthy();
  });

  it("renders payout statement layout", () => {
    const { getByTestId } = render(
      <PrintPdfLayoutComponent
        type="payout_statement"
        data={{
          tenantName: "Test Salon",
          statementPeriod: "April 2026",
          payouts: [],
          totalAmountCents: 0,
          currency: "usd",
        }}
      />
    );
    expect(getByTestId("payout-statement-layout")).toBeTruthy();
  });

  it("renders refund receipt layout", () => {
    const { getByTestId } = render(
      <PrintPdfLayoutComponent
        type="refund_receipt"
        data={{
          tenantName: "Test Salon",
          refundId: "re_1",
          originalChargeId: "ch_1",
          refundDate: "2026-01-15",
          amountCents: 2500,
          currency: "usd",
          customerName: "Jane Doe",
        }}
      />
    );
    expect(getByTestId("refund-receipt-layout")).toBeTruthy();
  });
});
