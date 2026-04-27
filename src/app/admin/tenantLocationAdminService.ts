import type { CreateLocationInput, Location } from "../../domains/locations";
import type { LocationRepository } from "../../domains/locations/repository";
import type { Tenant } from "../../domains/tenants";
import type { TenantRepository } from "../../domains/tenants/repository";

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

  return {
    readTenantProfile,
    readTenantLocations,
    createLocationForTenant,
  };
}

export type TenantLocationAdminService = ReturnType<typeof createTenantLocationAdminService>;
