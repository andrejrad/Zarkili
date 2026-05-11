// ---------------------------------------------------------------------------
// Marketplace post types (tenant-admin authoring surface)
// ---------------------------------------------------------------------------

export type MarketplacePostStatus = "draft" | "published" | "hidden" | "compliance_blocked";
export type MarketplaceVisibility = "marketplace" | "profile_only";

export type MarketplacePost = {
  postId: string;
  tenantId: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  priceUsd: number | null;
  durationMin: number | null;
  mediaUrls: string[];
  primaryMediaIndex: number;
  bookThisLookServiceId?: string;
  visibility: MarketplaceVisibility;
  status: MarketplacePostStatus;
  availableForBooking: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateMarketplacePostInput = {
  title: string;
  category: string;
  description: string;
  tags: string[];
  priceUsd: number | null;
  durationMin: number | null;
  mediaUrls: string[];
  primaryMediaIndex: number;
  bookThisLookServiceId?: string;
  visibility: MarketplaceVisibility;
  availableForBooking: boolean;
};

export type UpdateMarketplacePostInput = Partial<CreateMarketplacePostInput> & {
  status?: MarketplacePostStatus;
};

export type PostComplianceCheckResult = {
  titleOk: boolean;
  priceSet: boolean;
  hasPhoto: boolean;
  descriptionOk: boolean;
  categorySelected: boolean;
  allPassing: boolean;
};

// ---------------------------------------------------------------------------
// Per-post performance metrics
// ---------------------------------------------------------------------------

export type PostPerformanceMetrics = {
  postId: string;
  tenantId: string;
  impressions: number;
  clicks: number;
  ctr: number; // clicks / impressions
  bookings: number;
  revenueUsd: number;
  avgRating: number | null;
  totalReviews: number;
  fiveStarPct: number;
  lowRatingPct: number;
};

export type PostBookingRow = {
  date: string;
  clientName: string;
  serviceName: string;
  amountUsd: number;
};

// ---------------------------------------------------------------------------
// Anti-theft / compliance
// ---------------------------------------------------------------------------

export type AntiTheftAnomalyType =
  | "no_show_fraud"
  | "refund_cluster"
  | "discount_abuse"
  | "after_hours_payment"
  | "invoice_tampering"
  | "other";

export type AntiTheftSignalStatus = "suspicious" | "confirmed" | "dismissed" | "clean";

export type AntiTheftSignal = {
  signalId: string;
  tenantId: string;
  staffId: string;
  staffName: string;
  clientId?: string;
  clientName?: string;
  anomalyType: AntiTheftAnomalyType;
  riskScore: number; // 0–100
  amountUsd: number;
  status: AntiTheftSignalStatus;
  detectedAt: string;
  investigatedAt?: string;
  investigatedBy?: string;
  escalatedAt?: string;
};

export type AntiTheftKpi = {
  signalCount: number;
  confirmedCount: number;
  atRiskStaffCount: number;
};
