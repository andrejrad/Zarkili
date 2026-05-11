/**
 * analyticsTypes.ts — W47
 *
 * Shared types for the W47 analytics screen layer.
 * Extends the domains/analytics model with presentation-layer shapes.
 */

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------

export type CurrencyRevenueLine = {
  currency: string;
  amount: number;
  /** FX rate to USD used for cross-currency total; null if already USD */
  fxRateToUsd?: number | null;
};

export type RevenueBreakdown = {
  weekTotalUsd: number;
  monthTotalUsd: number;
  monthBookingCount: number;
  /** Per-currency revenue lines for the current month */
  byCurrency: CurrencyRevenueLine[];
};

// ---------------------------------------------------------------------------
// Booking funnel
// ---------------------------------------------------------------------------

export type BookingFunnelStage = {
  label: string;
  count: number;
  /** Drop-off from previous stage (0–1) */
  dropOffRate?: number;
};

export type BookingFunnelData = {
  dateRangeLabel: string;
  stages: BookingFunnelStage[];
};

// ---------------------------------------------------------------------------
// Marketplace attribution
// ---------------------------------------------------------------------------

export type MarketplaceAttributionData = {
  directBookings: number;
  marketplaceBookings: number;
  marketplaceAttributionRate: number;
  /** Attribution by referral source */
  bySource: Array<{ source: string; bookings: number; rate: number }>;
};
