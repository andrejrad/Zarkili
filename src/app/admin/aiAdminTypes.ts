import type { AiFeatureKey } from "../../shared/ai";

// ---------------------------------------------------------------------------
// Feature toggle config (per-tenant enable/disable per AI feature)
// ---------------------------------------------------------------------------

export type AiFeatureToggleConfig = {
  featureKey: AiFeatureKey;
  enabled: boolean;
  planRequired: "starter" | "professional" | "enterprise" | "free_trial" | null;
};

export type AiFeatureGroupDef = {
  id: string;
  label: string;
  features: AiFeatureKey[];
};

export const AI_FEATURE_GROUPS: AiFeatureGroupDef[] = [
  {
    id: "booking",
    label: "Booking & Scheduling",
    features: ["scheduling-optimization", "service-recommendations"],
  },
  {
    id: "client",
    label: "Client & Retention",
    features: ["retention-insights"],
  },
  {
    id: "campaign",
    label: "Campaigns & Marketing",
    features: ["content-creation", "marketing-orchestration"],
  },
  {
    id: "staff",
    label: "Staff & Fraud",
    features: ["no-show-fraud", "support-triage"],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    features: ["marketplace-personalization"],
  },
];

// ---------------------------------------------------------------------------
// AI suggestion review queue
// ---------------------------------------------------------------------------

export type AiSuggestionKind =
  | "scheduling"
  | "retention"
  | "content"
  | "campaign"
  | "pricing";

export type AiSuggestionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "overridden";

export type AiSuggestion = {
  suggestionId: string;
  tenantId: string;
  kind: AiSuggestionKind;
  status: AiSuggestionStatus;
  model: string;
  confidenceScore: number; // 0–1
  inputSummary: string;
  outputPreview: string;
  generatedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
};

export type AiSuggestionFilter = {
  kind?: AiSuggestionKind;
  status?: AiSuggestionStatus;
  search?: string;
};

export type AiSuggestionQueueSummary = {
  pendingCount: number;
  approvedToday: number;
  rejectedToday: number;
};

// ---------------------------------------------------------------------------
// AI usage analytics
// ---------------------------------------------------------------------------

export type AiUsageKpi = {
  totalTokens: number;
  totalCostUsd: number;
  avgLatencyMs: number;
  incidentCount: number;
  blockCount: number;
};

export type AiUsageByFeature = {
  featureKey: AiFeatureKey;
  tokensUsed: number;
  costUsd: number;
  avgLatencyMs: number;
};

export type AiIncidentType =
  | "prompt_injection"
  | "policy_violation"
  | "hallucination"
  | "pii_leak"
  | "other";

export type AiSafetyIncident = {
  incidentId: string;
  tenantId: string;
  featureKey: AiFeatureKey;
  incidentType: AiIncidentType;
  severity: "low" | "medium" | "high";
  description: string;
  resolvedAt?: string;
  createdAt: string;
};

// ---------------------------------------------------------------------------
// AI audit log
// ---------------------------------------------------------------------------

export type AiAuditDecision =
  | "auto_applied"
  | "human_approved"
  | "human_rejected"
  | "overridden";

export type AiAuditLogEntry = {
  entryId: string;
  tenantId: string;
  featureKey: AiFeatureKey;
  model: string;
  inputHash: string; // 8-char hex
  outputSnippet: string;
  decision: AiAuditDecision;
  actorDisplay: string; // user display name or "System"
  latencyMs: number;
  safetyFlags: string[];
  fullInput?: string;
  fullOutput?: string;
  confidenceScore?: number;
  createdAt: string;
};

export type AiAuditFilter = {
  featureKey?: AiFeatureKey;
  decision?: AiAuditDecision;
  search?: string;
  dateStart?: string;
  dateEnd?: string;
};
