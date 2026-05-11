/**
 * W42 — serviceCatalogService
 *
 * Factory for service-catalog depth operations: categories, add-ons,
 * seasonal rules, booking rules, visibility config, per-location price
 * overrides, CSV import parsing, and media reads.
 *
 * All repository-backed methods accept optional port injections and return
 * `{ ok: false, message: "not configured" }` when the repo is absent.
 * Real repository adapters land in W43.
 */
import type {
  ServiceCategory,
  CreateServiceCategoryInput,
  UpdateServiceCategoryInput,
  ServiceAddon,
  CreateServiceAddonInput,
  UpdateServiceAddonInput,
  ServiceSeasonalRule,
  CreateServiceSeasonalRuleInput,
  ServiceBookingRules,
  UpdateServiceBookingRulesInput,
  ServiceVisibilityConfig,
  UpdateServiceVisibilityInput,
  ServicePriceOverride,
  UpsertServicePriceOverrideInput,
  ServiceImportResult,
} from "../../domains/services/serviceCatalogModel";

// ---------------------------------------------------------------------------
// Repository ports (minimal shape — real adapters ship W43)
// ---------------------------------------------------------------------------

export type ServiceCategoryRepository = {
  listCategories(tenantId: string): Promise<ServiceCategory[]>;
  createCategory(input: CreateServiceCategoryInput): Promise<ServiceCategory>;
  updateCategory(categoryId: string, tenantId: string, input: UpdateServiceCategoryInput): Promise<void>;
  deleteCategory(categoryId: string, tenantId: string): Promise<void>;
};

export type ServiceAddonRepository = {
  listAddons(tenantId: string): Promise<ServiceAddon[]>;
  createAddon(input: CreateServiceAddonInput): Promise<ServiceAddon>;
  updateAddon(addonId: string, tenantId: string, input: UpdateServiceAddonInput): Promise<void>;
};

export type ServiceSeasonalRuleRepository = {
  listRules(tenantId: string, serviceId: string): Promise<ServiceSeasonalRule[]>;
  createRule(input: CreateServiceSeasonalRuleInput): Promise<ServiceSeasonalRule>;
  deleteRule(ruleId: string, tenantId: string): Promise<void>;
};

export type ServiceBookingRulesRepository = {
  getRules(tenantId: string, serviceId: string): Promise<ServiceBookingRules | null>;
  saveRules(tenantId: string, serviceId: string, input: UpdateServiceBookingRulesInput): Promise<ServiceBookingRules>;
};

export type ServiceVisibilityRepository = {
  getVisibility(tenantId: string, serviceId: string): Promise<ServiceVisibilityConfig | null>;
  saveVisibility(tenantId: string, serviceId: string, input: UpdateServiceVisibilityInput): Promise<ServiceVisibilityConfig>;
};

export type ServicePriceOverrideRepository = {
  listOverrides(tenantId: string, serviceId: string): Promise<ServicePriceOverride[]>;
  upsertOverride(input: UpsertServicePriceOverrideInput): Promise<ServicePriceOverride>;
  deleteOverride(overrideId: string, tenantId: string): Promise<void>;
};

export type ServiceMediaRepository = {
  listMedia(tenantId: string, serviceId: string): Promise<string[]>;
};

// ---------------------------------------------------------------------------
// UiResult helper
// ---------------------------------------------------------------------------

type UiResult<T> = { ok: true; data: T } | { ok: false; message: string };

function notConfigured<T>(name: string): UiResult<T> {
  return { ok: false, message: `${name} repository not configured.` };
}

function wrapAsync<T>(fn: () => Promise<T>, fallback: string): Promise<UiResult<T>> {
  return fn()
    .then((data): UiResult<T> => ({ ok: true, data }))
    .catch((err: unknown): UiResult<T> => ({
      ok: false,
      message: err instanceof Error ? err.message : fallback,
    }));
}

// ---------------------------------------------------------------------------
// CSV import parser (pure — no async, no repo)
// ---------------------------------------------------------------------------

const CSV_HEADERS = ["name", "category", "durationminutes", "price", "currency"] as const;

export function parseImportCsv(csvText: string): ServiceImportResult {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { rows: [], errors: ["CSV is empty."] };

  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.split(",").map((h) => h.toLowerCase().trim());

  for (const required of CSV_HEADERS) {
    if (!headers.includes(required)) {
      return {
        rows: [],
        errors: [`Missing required column: "${required}". Expected: name,category,durationMinutes,price,currency`],
      };
    }
  }

  const nameIdx = headers.indexOf("name");
  const catIdx = headers.indexOf("category");
  const durIdx = headers.indexOf("durationminutes");
  const priceIdx = headers.indexOf("price");
  const currIdx = headers.indexOf("currency");

  const rows: ServiceImportResult["rows"] = [];
  const errors: string[] = [];

  dataLines.forEach((line, i) => {
    const rowNum = i + 2; // 1-based, header is row 1
    const cols = line.split(",").map((c) => c.trim());

    const name = cols[nameIdx] ?? "";
    const category = cols[catIdx] ?? "";
    const durationStr = cols[durIdx] ?? "";
    const priceStr = cols[priceIdx] ?? "";
    const currency = cols[currIdx] ?? "";

    if (!name) { errors.push(`Row ${rowNum}: name is required.`); return; }
    if (!category) { errors.push(`Row ${rowNum}: category is required.`); return; }
    if (!currency || currency.length !== 3) { errors.push(`Row ${rowNum}: currency must be a 3-letter code.`); return; }

    const durationMinutes = Number(durationStr);
    if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
      errors.push(`Row ${rowNum}: durationMinutes must be a positive integer.`);
      return;
    }

    const price = Number(priceStr);
    if (isNaN(price) || price < 0) {
      errors.push(`Row ${rowNum}: price must be a non-negative number.`);
      return;
    }

    rows.push({ name, category, durationMinutes, price, currency });
  });

  return { rows, errors };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

type ServiceCatalogServiceInput = {
  categoryRepository?: ServiceCategoryRepository;
  addonRepository?: ServiceAddonRepository;
  seasonalRuleRepository?: ServiceSeasonalRuleRepository;
  bookingRulesRepository?: ServiceBookingRulesRepository;
  visibilityRepository?: ServiceVisibilityRepository;
  priceOverrideRepository?: ServicePriceOverrideRepository;
  mediaRepository?: ServiceMediaRepository;
};

export function createServiceCatalogService({
  categoryRepository,
  addonRepository,
  seasonalRuleRepository,
  bookingRulesRepository,
  visibilityRepository,
  priceOverrideRepository,
  mediaRepository,
}: ServiceCatalogServiceInput = {}) {
  // --- Categories ---
  async function readCategories(tenantId: string): Promise<UiResult<ServiceCategory[]>> {
    if (!categoryRepository) return notConfigured("Category");
    return wrapAsync(() => categoryRepository!.listCategories(tenantId), "Unable to load categories.");
  }

  async function createCategory(input: CreateServiceCategoryInput): Promise<UiResult<ServiceCategory>> {
    if (!categoryRepository) return notConfigured("Category");
    return wrapAsync(() => categoryRepository!.createCategory(input), "Unable to create category.");
  }

  async function updateCategory(categoryId: string, tenantId: string, input: UpdateServiceCategoryInput): Promise<UiResult<void>> {
    if (!categoryRepository) return notConfigured("Category");
    return wrapAsync(() => categoryRepository!.updateCategory(categoryId, tenantId, input), "Unable to update category.");
  }

  async function deleteCategory(categoryId: string, tenantId: string): Promise<UiResult<void>> {
    if (!categoryRepository) return notConfigured("Category");
    return wrapAsync(() => categoryRepository!.deleteCategory(categoryId, tenantId), "Unable to delete category.");
  }

  // --- Add-ons ---
  async function readAddons(tenantId: string): Promise<UiResult<ServiceAddon[]>> {
    if (!addonRepository) return notConfigured("Addon");
    return wrapAsync(() => addonRepository!.listAddons(tenantId), "Unable to load add-ons.");
  }

  async function createAddon(input: CreateServiceAddonInput): Promise<UiResult<ServiceAddon>> {
    if (!addonRepository) return notConfigured("Addon");
    return wrapAsync(() => addonRepository!.createAddon(input), "Unable to create add-on.");
  }

  async function updateAddon(addonId: string, tenantId: string, input: UpdateServiceAddonInput): Promise<UiResult<void>> {
    if (!addonRepository) return notConfigured("Addon");
    return wrapAsync(() => addonRepository!.updateAddon(addonId, tenantId, input), "Unable to update add-on.");
  }

  // --- Seasonal rules ---
  async function readSeasonalRules(tenantId: string, serviceId: string): Promise<UiResult<ServiceSeasonalRule[]>> {
    if (!seasonalRuleRepository) return notConfigured("SeasonalRule");
    return wrapAsync(() => seasonalRuleRepository!.listRules(tenantId, serviceId), "Unable to load seasonal rules.");
  }

  async function createSeasonalRule(input: CreateServiceSeasonalRuleInput): Promise<UiResult<ServiceSeasonalRule>> {
    if (!seasonalRuleRepository) return notConfigured("SeasonalRule");
    return wrapAsync(() => seasonalRuleRepository!.createRule(input), "Unable to create rule.");
  }

  async function deleteSeasonalRule(ruleId: string, tenantId: string): Promise<UiResult<void>> {
    if (!seasonalRuleRepository) return notConfigured("SeasonalRule");
    return wrapAsync(() => seasonalRuleRepository!.deleteRule(ruleId, tenantId), "Unable to delete rule.");
  }

  // --- Booking rules ---
  async function readBookingRules(tenantId: string, serviceId: string): Promise<UiResult<ServiceBookingRules | null>> {
    if (!bookingRulesRepository) return notConfigured("BookingRules");
    return wrapAsync(() => bookingRulesRepository!.getRules(tenantId, serviceId), "Unable to load booking rules.");
  }

  async function saveBookingRules(tenantId: string, serviceId: string, input: UpdateServiceBookingRulesInput): Promise<UiResult<ServiceBookingRules>> {
    if (!bookingRulesRepository) return notConfigured("BookingRules");
    return wrapAsync(() => bookingRulesRepository!.saveRules(tenantId, serviceId, input), "Unable to save booking rules.");
  }

  // --- Visibility ---
  async function readVisibility(tenantId: string, serviceId: string): Promise<UiResult<ServiceVisibilityConfig | null>> {
    if (!visibilityRepository) return notConfigured("Visibility");
    return wrapAsync(() => visibilityRepository!.getVisibility(tenantId, serviceId), "Unable to load visibility config.");
  }

  async function saveVisibility(tenantId: string, serviceId: string, input: UpdateServiceVisibilityInput): Promise<UiResult<ServiceVisibilityConfig>> {
    if (!visibilityRepository) return notConfigured("Visibility");
    return wrapAsync(() => visibilityRepository!.saveVisibility(tenantId, serviceId, input), "Unable to save visibility config.");
  }

  // --- Price overrides ---
  async function readPriceOverrides(tenantId: string, serviceId: string): Promise<UiResult<ServicePriceOverride[]>> {
    if (!priceOverrideRepository) return notConfigured("PriceOverride");
    return wrapAsync(() => priceOverrideRepository!.listOverrides(tenantId, serviceId), "Unable to load price overrides.");
  }

  async function upsertPriceOverride(input: UpsertServicePriceOverrideInput): Promise<UiResult<ServicePriceOverride>> {
    if (!priceOverrideRepository) return notConfigured("PriceOverride");
    return wrapAsync(() => priceOverrideRepository!.upsertOverride(input), "Unable to save price override.");
  }

  async function deletePriceOverride(overrideId: string, tenantId: string): Promise<UiResult<void>> {
    if (!priceOverrideRepository) return notConfigured("PriceOverride");
    return wrapAsync(() => priceOverrideRepository!.deleteOverride(overrideId, tenantId), "Unable to delete price override.");
  }

  // --- Media ---
  async function readServiceMedia(tenantId: string, serviceId: string): Promise<UiResult<string[]>> {
    if (!mediaRepository) return notConfigured("Media");
    return wrapAsync(() => mediaRepository!.listMedia(tenantId, serviceId), "Unable to load media.");
  }

  return {
    readCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    readAddons,
    createAddon,
    updateAddon,
    readSeasonalRules,
    createSeasonalRule,
    deleteSeasonalRule,
    readBookingRules,
    saveBookingRules,
    readVisibility,
    saveVisibility,
    readPriceOverrides,
    upsertPriceOverride,
    deletePriceOverride,
    readServiceMedia,
    parseImportCsv,
  };
}

export type ServiceCatalogService = ReturnType<typeof createServiceCatalogService>;
