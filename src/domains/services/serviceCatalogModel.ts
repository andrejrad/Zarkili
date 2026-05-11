/**
 * W42 — Service Catalog Depth domain types
 *
 * These types extend the base Service model with sub-features:
 * categories, add-ons, seasonal rules, booking rules, visibility config,
 * and per-location price overrides.
 */
import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// ServiceCategory
// ---------------------------------------------------------------------------

export type ServiceCategory = {
  categoryId: string;
  tenantId: string;
  name: string;
  sortOrder: number;
  color?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateServiceCategoryInput = Pick<
  ServiceCategory,
  "tenantId" | "name" | "sortOrder"
> & { color?: string };

export type UpdateServiceCategoryInput = Partial<
  Pick<ServiceCategory, "name" | "sortOrder" | "color">
>;

// ---------------------------------------------------------------------------
// ServiceAddon
// ---------------------------------------------------------------------------

export type ServiceAddon = {
  addonId: string;
  tenantId: string;
  name: string;
  price: number;
  currency: string;
  durationMinutes: number;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateServiceAddonInput = Omit<
  ServiceAddon,
  "addonId" | "createdAt" | "updatedAt"
>;

export type UpdateServiceAddonInput = Partial<
  Pick<ServiceAddon, "name" | "price" | "currency" | "durationMinutes" | "active">
>;

// ---------------------------------------------------------------------------
// ServiceSeasonalRule
// ---------------------------------------------------------------------------

export type ServiceSeasonalRule = {
  ruleId: string;
  serviceId: string;
  tenantId: string;
  label: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  blockedCompletely: boolean;
  customDurationMinutes?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateServiceSeasonalRuleInput = Omit<
  ServiceSeasonalRule,
  "ruleId" | "createdAt" | "updatedAt"
>;

// ---------------------------------------------------------------------------
// ServiceBookingRules
// ---------------------------------------------------------------------------

export type ServiceBookingRules = {
  serviceId: string;
  tenantId: string;
  depositPercent: number; // 0–100
  cancellationWindowHours: number;
  leadTimeHours: number;
  bufferMinutes: number;
  updatedAt: Timestamp;
};

export type UpdateServiceBookingRulesInput = Partial<
  Pick<
    ServiceBookingRules,
    "depositPercent" | "cancellationWindowHours" | "leadTimeHours" | "bufferMinutes"
  >
>;

// ---------------------------------------------------------------------------
// ServiceVisibilityConfig
// ---------------------------------------------------------------------------

export type ServiceVisibilityConfig = {
  serviceId: string;
  tenantId: string;
  onlineBooking: boolean;
  marketplaceListed: boolean;
  internalOnly: boolean;
  updatedAt: Timestamp;
};

export type UpdateServiceVisibilityInput = Partial<
  Pick<ServiceVisibilityConfig, "onlineBooking" | "marketplaceListed" | "internalOnly">
>;

// ---------------------------------------------------------------------------
// ServicePriceOverride  (per-location)
// ---------------------------------------------------------------------------

export type ServicePriceOverride = {
  overrideId: string;
  serviceId: string;
  locationId: string;
  tenantId: string;
  price: number;
  currency: string;
  updatedAt: Timestamp;
};

export type UpsertServicePriceOverrideInput = Pick<
  ServicePriceOverride,
  "serviceId" | "locationId" | "tenantId" | "price" | "currency"
>;

// ---------------------------------------------------------------------------
// CSV import row (parsed from raw text — no Timestamp)
// ---------------------------------------------------------------------------

export type ServiceImportRow = {
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  currency: string;
};

export type ServiceImportResult = {
  rows: ServiceImportRow[];
  errors: string[];
};
