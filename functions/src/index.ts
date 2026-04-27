import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

export {
  getAiBudgetConfigAdmin,
  listAiBudgetAuditLogsAdmin,
  updateAiBudgetConfigAdmin,
} from "./aiBudgetAdmin";

export { onBookingWritten } from "./bookingTriggers";

export { dailyBookingReminders } from "./scheduledReminders";

export { purgeExpiredSlotTokens } from "./purgeSlotTokens";

export { previewNotificationTemplate } from "./notificationTemplates";

export { stripeWebhookHandler } from "./stripeWebhookHandler";

export { trialExpiryHourly } from "./trialExpiryScheduler";

export { getRiskPolicyAdmin, updateRiskPolicyAdmin } from "./riskPolicyAdmin";

export { stripeTaxCalculate } from "./stripeTaxCalculate";

setGlobalOptions({ maxInstances: 10 });

export const health = onRequest((req, res) => {
  res.status(200).json({
    ok: true,
    message: "zarkili-functions-ready",
    method: req.method,
    timestamp: new Date().toISOString()
  });
});
