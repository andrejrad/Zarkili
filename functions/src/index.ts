import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

export {
  getAiBudgetConfigAdmin,
  listAiBudgetAuditLogsAdmin,
  updateAiBudgetConfigAdmin,
} from "./aiBudgetAdmin";

export { onBookingWritten } from "./bookingTriggers";

export { updateAvailabilitySummary } from "./availabilitySummaryTrigger";

export { dailyBookingReminders } from "./scheduledReminders";

export { purgeExpiredSlotTokens } from "./purgeSlotTokens";

export { previewNotificationTemplate } from "./notificationTemplates";

export { stripeWebhookHandler } from "./stripeWebhookHandler";

export { trialExpiryHourly } from "./trialExpiryScheduler";

export { getRiskPolicyAdmin, updateRiskPolicyAdmin } from "./riskPolicyAdmin";

export { stripeTaxCalculate } from "./stripeTaxCalculate";

export {
  paymentsAttachMethod,
  paymentsDetachMethod,
  paymentsChargeBooking,
  paymentsApplyLoyaltyDiscount,
  paymentsRefundBooking,
  updateLoyaltyOnBookingComplete,
} from "./payments";

export { receiptsGeneratePdf } from "./receipts";

export { check1099KThreshold } from "./tax1099K";

export { computePopularityIndex } from "./popularityIndex";

// ---------------------------------------------------------------------------
// Stripe Connect — tenant onboarding
// ---------------------------------------------------------------------------
export { stripeConnectOnboard, stripeConnectDashboardLink } from "./stripeConnectCallable";

// ---------------------------------------------------------------------------
// Payment settings — tenant admin CRUD
// ---------------------------------------------------------------------------
export { getPaymentSettings, updatePaymentSettings, getPaymentSummary } from "./paymentSettingsCallable";

// ---------------------------------------------------------------------------
// Booking-level payments — intent, capture, cancel
// ---------------------------------------------------------------------------
export {
  createBookingPaymentIntent,
  captureBookingPayment,
  cancelBookingPayment,
} from "./appointmentPaymentsCallable";

// ---------------------------------------------------------------------------
// Stripe payment hold re-authorization (7-day expiry)
// ---------------------------------------------------------------------------
export { reauthorizeExpiredHolds } from "./reauthorizeExpiredHolds";

// ---------------------------------------------------------------------------
// Explore tab — service data model v3 (Phase 2)
// ---------------------------------------------------------------------------
export { updateServiceDerivedFields } from "./updateServiceDerivedFields";
export { syncLocationGeohash } from "./geohashTrigger";
export { updateServiceAvailability } from "./serviceAvailabilityTrigger";

setGlobalOptions({ maxInstances: 10 });

export const health = onRequest((req, res) => {
  res.status(200).json({
    ok: true,
    message: "zarkili-functions-ready",
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

