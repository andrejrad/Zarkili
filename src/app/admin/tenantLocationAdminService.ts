import type { CreateLocationInput, Location } from "../../domains/locations";
import type { LocationRepository } from "../../domains/locations/repository";
import type { Tenant } from "../../domains/tenants";
import type { TenantRepository } from "../../domains/tenants/repository";

// ---------------------------------------------------------------------------
// W38 — input types for update operations
// ---------------------------------------------------------------------------

export type UpdateBusinessProfileInput = {
  name: string;
  country: string;
  timezone: string;
};

export type UpdateBrandSettingsInput = {
  logoUrl: string | null;
  primary: string;
  secondary: string;
  accent: string;
};

export type UpdateCurrencySettingsInput = {
  defaultCurrency: string;
};

type UiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

export type TenantProfileSummary = {
  tenantId: string;
  name: string;
  slug: string;
  status: string;
  plan: string;
  country: string;
  timezone: string;
  defaultLanguage: string;
  defaultCurrency: string;
  brandingPrimary: string;
  brandingSecondary: string;
  allowGuestBooking: boolean;
  requireDeposit: boolean;
};

function normalizeErrorMessage(error: unknown, fallbackMessage: string): string {
  if (!(error instanceof Error) || !error.message.trim()) {
    return fallbackMessage;
  }

  const lower = error.message.toLowerCase();
  if (lower.includes("not found")) {
    return "The requested record was not found.";
  }

  if (lower.includes("cross-tenant") || lower.includes("tenant")) {
    return "You do not have permission to access data outside your tenant.";
  }

  if (lower.includes("required")) {
    return "Please fill in all required fields.";
  }

  return fallbackMessage;
}

function toTenantProfileSummary(tenant: Tenant): TenantProfileSummary {
  return {
    tenantId: tenant.tenantId,
    name: tenant.name,
    slug: tenant.slug,
    status: tenant.status,
    plan: tenant.plan,
    country: tenant.country,
    timezone: tenant.timezone,
    defaultLanguage: tenant.defaultLanguage,
    defaultCurrency: tenant.defaultCurrency,
    brandingPrimary: tenant.branding.primary,
    brandingSecondary: tenant.branding.secondary,
    allowGuestBooking: tenant.settings.allowGuestBooking,
    requireDeposit: tenant.settings.requireDeposit,
  };
}

export function createTenantLocationAdminService(input: {
  tenantRepository: TenantRepository;
  locationRepository: LocationRepository;
}) {
  async function readTenantProfile(tenantId: string): Promise<UiResult<TenantProfileSummary>> {
    try {
      const tenant = await input.tenantRepository.getTenantById(tenantId);
      if (!tenant) {
        return {
          ok: false,
          message: "Tenant profile was not found for the active tenant context.",
        };
      }

      return {
        ok: true,
        data: toTenantProfileSummary(tenant),
      };
    } catch (error) {
      return {
        ok: false,
        message: normalizeErrorMessage(error, "Unable to load tenant profile right now."),
      };
    }
  }

  async function readTenantLocations(tenantId: string): Promise<UiResult<Location[]>> {
    try {
      const locations = await input.locationRepository.listTenantLocations(tenantId);
      return {
        ok: true,
        data: locations,
      };
    } catch (error) {
      return {
        ok: false,
        message: normalizeErrorMessage(error, "Unable to load tenant locations right now."),
      };
    }
  }

  async function createLocationForTenant(
    locationId: string,
    createInput: CreateLocationInput
  ): Promise<UiResult<Location>> {
    try {
      const location = await input.locationRepository.createLocation(locationId, createInput);
      return {
        ok: true,
        data: location,
      };
    } catch (error) {
      return {
        ok: false,
        message: normalizeErrorMessage(error, "Unable to create location right now."),
      };
    }
  }

  // -------------------------------------------------------------------------
  // W38 — update operations
  // -------------------------------------------------------------------------

  async function updateBusinessProfile(
    tenantId: string,
    updateInput: UpdateBusinessProfileInput,
  ): Promise<UiResult<TenantProfileSummary>> {
    try {
      if (!updateInput.name.trim()) {
        return { ok: false, message: "Business name is required." };
      }
      await input.tenantRepository.updateTenant(tenantId, {
        name: updateInput.name.trim(),
        country: updateInput.country.trim() || undefined,
        timezone: updateInput.timezone.trim() || undefined,
      });
      // Re-read so the caller gets the persisted state.
      return readTenantProfile(tenantId);
    } catch (error) {
      return {
        ok: false,
        message: normalizeErrorMessage(error, "Unable to save business profile right now."),
      };
    }
  }

  async function updateBrandSettings(
    tenantId: string,
    updateInput: UpdateBrandSettingsInput,
  ): Promise<UiResult<void>> {
    try {
      const tenant = await input.tenantRepository.getTenantById(tenantId);
      if (!tenant) {
        return { ok: false, message: "Tenant profile was not found." };
      }
      await input.tenantRepository.updateTenant(tenantId, {
        branding: {
          ...tenant.branding,
          logoUrl: updateInput.logoUrl,
          primary: updateInput.primary,
          secondary: updateInput.secondary,
          accent: updateInput.accent,
        },
      });
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        message: normalizeErrorMessage(error, "Unable to save brand settings right now."),
      };
    }
  }

  async function updateCurrencySettings(
    tenantId: string,
    updateInput: UpdateCurrencySettingsInput,
  ): Promise<UiResult<void>> {
    try {
      if (!updateInput.defaultCurrency.trim()) {
        return { ok: false, message: "Currency code is required." };
      }
      await input.tenantRepository.updateTenant(tenantId, {
        defaultCurrency: updateInput.defaultCurrency.trim().toUpperCase(),
      });
      return { ok: true, data: undefined };
    } catch (error) {
      return {
        ok: false,
        message: normalizeErrorMessage(error, "Unable to save currency settings right now."),
      };
    }
  }

  return {
    readTenantProfile,
    readTenantLocations,
    createLocationForTenant,
    updateBusinessProfile,
    updateBrandSettings,
    updateCurrencySettings,
  };
}

export type TenantLocationAdminService = ReturnType<typeof createTenantLocationAdminService>;
