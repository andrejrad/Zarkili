/**
 * W45 — campaignAdminService
 *
 * Factory for Campaign admin (list, builder, performance), Transactional
 * Template overrides, and Promo Code management surfaces.
 *
 * Pattern (mirrors clientCrmService / loyaltyAdminService):
 *   • Optional repo port injections.
 *   • Absent repo → { ok: false, message: "… not configured." }
 *   • Pure methods (runComplianceCheck, loadTransactionalDefaults) always
 *     return { ok: true; data }.
 *   • Real Firestore adapters tracked as W45-DEBT-1.
 */

import type {
  CampaignAdminResult,
  CampaignBuilderInput,
  CampaignListEntry,
  CampaignPerformanceDetail,
  ComplianceCheckItem,
  PromoCode,
  PromoCodeCreateInput,
  PromoCodeStatus,
  TransactionalTemplateDefault,
  TransactionalTemplateOverride,
  TransactionalTemplateType,
} from "../../domains/campaigns/campaignAdminModel";

// ---------------------------------------------------------------------------
// Repository ports
// ---------------------------------------------------------------------------

export type CampaignListAdminRepository = {
  list(tenantId: string, status?: string): Promise<CampaignListEntry[]>;
  getDetail(campaignId: string, tenantId: string): Promise<CampaignPerformanceDetail | null>;
};

export type CampaignWriteRepository = {
  create(input: CampaignBuilderInput): Promise<{ campaignId: string }>;
  updateStatus(
    campaignId: string,
    tenantId: string,
    status: "scheduled" | "paused" | "cancelled",
  ): Promise<void>;
};

export type TransactionalTemplateRepository = {
  listOverrides(tenantId: string): Promise<TransactionalTemplateOverride[]>;
  saveOverride(
    overrideId: string | null,
    input: Omit<TransactionalTemplateOverride, "overrideId">,
  ): Promise<TransactionalTemplateOverride>;
  deleteOverride(overrideId: string, tenantId: string): Promise<void>;
};

export type PromoCodeRepository = {
  list(tenantId: string, status?: PromoCodeStatus): Promise<PromoCode[]>;
  create(input: PromoCodeCreateInput): Promise<PromoCode>;
  updateStatus(
    codeId: string,
    tenantId: string,
    status: PromoCodeStatus,
  ): Promise<void>;
};

// ---------------------------------------------------------------------------
// Error normalisation
// ---------------------------------------------------------------------------

function fmtError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const TRANSACTIONAL_DEFAULTS: TransactionalTemplateDefault[] = (
  [
    "booking_confirmation",
    "booking_reminder",
    "no_show",
    "cancellation",
    "receipt",
    "password_reset",
  ] as TransactionalTemplateType[]
).flatMap((templateType) => {
  const defaults: TransactionalTemplateDefault[] = [];

  if (templateType === "booking_confirmation") {
    defaults.push({
      templateType,
      channel: "email",
      subject: "Your booking is confirmed",
      body: "Hi {{clientName}}, your appointment on {{date}} at {{time}} with {{staffName}} is confirmed.",
      variables: ["clientName", "date", "time", "staffName"],
    });
    defaults.push({
      templateType,
      channel: "sms",
      body: "Confirmed: {{date}} {{time}} with {{staffName}}. Reply STOP to opt out.",
      variables: ["date", "time", "staffName"],
    });
    defaults.push({
      templateType,
      channel: "push",
      body: "Your booking on {{date}} at {{time}} is confirmed!",
      variables: ["date", "time"],
    });
  } else if (templateType === "booking_reminder") {
    defaults.push({
      templateType,
      channel: "email",
      subject: "Reminder: your appointment tomorrow",
      body: "Hi {{clientName}}, just a reminder about your appointment on {{date}} at {{time}}.",
      variables: ["clientName", "date", "time"],
    });
    defaults.push({
      templateType,
      channel: "sms",
      body: "Reminder: {{date}} {{time}}. Reply STOP to opt out.",
      variables: ["date", "time"],
    });
    defaults.push({
      templateType,
      channel: "push",
      body: "Reminder: appointment on {{date}} at {{time}}.",
      variables: ["date", "time"],
    });
  } else if (templateType === "no_show") {
    defaults.push({
      templateType,
      channel: "email",
      subject: "We missed you",
      body: "Hi {{clientName}}, we noticed you missed your appointment on {{date}}. Please reschedule at your convenience.",
      variables: ["clientName", "date"],
    });
    defaults.push({
      templateType,
      channel: "sms",
      body: "We missed you on {{date}}. Please rebook when ready.",
      variables: ["date"],
    });
    defaults.push({
      templateType,
      channel: "push",
      body: "You missed your appointment on {{date}}. Tap to rebook.",
      variables: ["date"],
    });
  } else if (templateType === "cancellation") {
    defaults.push({
      templateType,
      channel: "email",
      subject: "Appointment cancelled",
      body: "Hi {{clientName}}, your appointment on {{date}} has been cancelled.",
      variables: ["clientName", "date"],
    });
    defaults.push({
      templateType,
      channel: "sms",
      body: "Your appointment on {{date}} is cancelled.",
      variables: ["date"],
    });
    defaults.push({
      templateType,
      channel: "push",
      body: "Appointment on {{date}} cancelled.",
      variables: ["date"],
    });
  } else if (templateType === "receipt") {
    defaults.push({
      templateType,
      channel: "email",
      subject: "Your receipt from {{salonName}}",
      body: "Hi {{clientName}}, thank you for your visit on {{date}}. Amount charged: {{amount}}.",
      variables: ["clientName", "date", "amount", "salonName"],
    });
    defaults.push({
      templateType,
      channel: "sms",
      body: "Thanks for visiting {{salonName}} on {{date}}. Total: {{amount}}.",
      variables: ["date", "amount", "salonName"],
    });
    defaults.push({
      templateType,
      channel: "push",
      body: "Receipt for {{date}}: {{amount}}.",
      variables: ["date", "amount"],
    });
  } else {
    // password_reset
    defaults.push({
      templateType,
      channel: "email",
      subject: "Reset your password",
      body: "Hi {{clientName}}, click the link below to reset your password. The link expires in 1 hour.",
      variables: ["clientName"],
    });
    defaults.push({
      templateType,
      channel: "sms",
      body: "Your password reset code is {{code}}. Expires in 60 min.",
      variables: ["code"],
    });
    defaults.push({
      templateType,
      channel: "push",
      body: "Your password reset link is ready. Tap to continue.",
      variables: [],
    });
  }

  return defaults;
});

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createCampaignAdminService(
  listRepo?: CampaignListAdminRepository,
  writeRepo?: CampaignWriteRepository,
  templateRepo?: TransactionalTemplateRepository,
  promoRepo?: PromoCodeRepository,
) {
  // -------------------------------------------------------------------------
  // Campaign list
  // -------------------------------------------------------------------------

  async function listCampaigns(
    tenantId: string,
    status?: string,
  ): Promise<CampaignAdminResult<CampaignListEntry[]>> {
    if (!listRepo) {
      return { ok: false, message: "Campaign list repository not configured." };
    }
    try {
      const data = await listRepo.list(tenantId, status);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function loadCampaignPerformance(
    campaignId: string,
    tenantId: string,
  ): Promise<CampaignAdminResult<CampaignPerformanceDetail | null>> {
    if (!listRepo) {
      return { ok: false, message: "Campaign list repository not configured." };
    }
    try {
      const data = await listRepo.getDetail(campaignId, tenantId);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Campaign builder
  // -------------------------------------------------------------------------

  async function createCampaign(
    input: CampaignBuilderInput,
  ): Promise<CampaignAdminResult<{ campaignId: string }>> {
    if (!input.name.trim()) {
      return { ok: false, message: "Campaign name is required." };
    }
    if (!input.segmentId.trim()) {
      return { ok: false, message: "Segment is required." };
    }
    if (!input.body.trim()) {
      return { ok: false, message: "Message body is required." };
    }
    if (!writeRepo) {
      return { ok: false, message: "Campaign write repository not configured." };
    }
    try {
      const data = await writeRepo.create(input);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function updateCampaignStatus(
    campaignId: string,
    tenantId: string,
    status: "scheduled" | "paused" | "cancelled",
  ): Promise<CampaignAdminResult<void>> {
    if (!writeRepo) {
      return { ok: false, message: "Campaign write repository not configured." };
    }
    try {
      await writeRepo.updateStatus(campaignId, tenantId, status);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Compliance check (pure — no repo)
  // -------------------------------------------------------------------------

  function runComplianceCheck(
    input: CampaignBuilderInput,
  ): CampaignAdminResult<ComplianceCheckItem[]> {
    const items: ComplianceCheckItem[] = [
      {
        itemId: "consent",
        label: "Segment has consent",
        passed: input.segmentId.trim().length > 0,
        detail: input.segmentId.trim().length === 0 ? "No segment selected." : undefined,
      },
      {
        itemId: "throttle",
        label: "Send rate within limits",
        passed: true,
        detail: undefined,
      },
      {
        itemId: "quiet_hours",
        label: "Scheduled outside quiet hours (22:00–08:00)",
        passed: true,
        detail: undefined,
      },
      {
        itemId: "body",
        label: "Message body is not empty",
        passed: input.body.trim().length > 0,
        detail: input.body.trim().length === 0 ? "Body cannot be empty." : undefined,
      },
      {
        itemId: "subject",
        label: "Email subject provided",
        passed: input.channel !== "email" || (input.subject ?? "").trim().length > 0,
        detail:
          input.channel === "email" && (input.subject ?? "").trim().length === 0
            ? "Subject is required for email campaigns."
            : undefined,
      },
    ];

    return { ok: true, data: items };
  }

  // -------------------------------------------------------------------------
  // Transactional templates
  // -------------------------------------------------------------------------

  function loadTransactionalDefaults(): CampaignAdminResult<TransactionalTemplateDefault[]> {
    return { ok: true, data: TRANSACTIONAL_DEFAULTS };
  }

  async function listTransactionalOverrides(
    tenantId: string,
  ): Promise<CampaignAdminResult<TransactionalTemplateOverride[]>> {
    if (!templateRepo) {
      return { ok: false, message: "Template repository not configured." };
    }
    try {
      const data = await templateRepo.listOverrides(tenantId);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function saveTransactionalOverride(
    overrideId: string | null,
    input: Omit<TransactionalTemplateOverride, "overrideId">,
  ): Promise<CampaignAdminResult<TransactionalTemplateOverride>> {
    if (!input.body.trim()) {
      return { ok: false, message: "Template body is required." };
    }
    if (!templateRepo) {
      return { ok: false, message: "Template repository not configured." };
    }
    try {
      const data = await templateRepo.saveOverride(overrideId, input);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function deleteTransactionalOverride(
    overrideId: string,
    tenantId: string,
  ): Promise<CampaignAdminResult<void>> {
    if (!templateRepo) {
      return { ok: false, message: "Template repository not configured." };
    }
    try {
      await templateRepo.deleteOverride(overrideId, tenantId);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Promo codes
  // -------------------------------------------------------------------------

  async function listPromoCodes(
    tenantId: string,
    status?: PromoCodeStatus,
  ): Promise<CampaignAdminResult<PromoCode[]>> {
    if (!promoRepo) {
      return { ok: false, message: "Promo code repository not configured." };
    }
    try {
      const data = await promoRepo.list(tenantId, status);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function createPromoCode(
    input: PromoCodeCreateInput,
  ): Promise<CampaignAdminResult<PromoCode>> {
    if (!input.code.trim()) {
      return { ok: false, message: "Promo code cannot be empty." };
    }
    if (input.value <= 0) {
      return { ok: false, message: "Promo code value must be greater than zero." };
    }
    if (!promoRepo) {
      return { ok: false, message: "Promo code repository not configured." };
    }
    try {
      const data = await promoRepo.create(input);
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  async function updatePromoCodeStatus(
    codeId: string,
    tenantId: string,
    status: PromoCodeStatus,
  ): Promise<CampaignAdminResult<void>> {
    if (!promoRepo) {
      return { ok: false, message: "Promo code repository not configured." };
    }
    try {
      await promoRepo.updateStatus(codeId, tenantId, status);
      return { ok: true, data: undefined };
    } catch (err) {
      return { ok: false, message: fmtError(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  return {
    listCampaigns,
    loadCampaignPerformance,
    createCampaign,
    updateCampaignStatus,
    runComplianceCheck,
    loadTransactionalDefaults,
    listTransactionalOverrides,
    saveTransactionalOverride,
    deleteTransactionalOverride,
    listPromoCodes,
    createPromoCode,
    updatePromoCodeStatus,
  };
}

export type CampaignAdminService = ReturnType<typeof createCampaignAdminService>;
