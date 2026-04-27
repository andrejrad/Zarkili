import type { LocationRepository } from "../../../domains/locations/repository";
import type { Tenant } from "../../../domains/tenants";
import type { TenantRepository } from "../../../domains/tenants/repository";
import { createTenantLocationAdminService } from "../tenantLocationAdminService";

describe("tenantLocationAdminService", () => {
  function createTenantRepositoryStub(overrides: Partial<TenantRepository> = {}): TenantRepository {
    return {
      createTenant: jest.fn(),
      getTenantById: jest.fn(async () => null),
      getTenantBySlug: jest.fn(),
      updateTenant: jest.fn(),
      listActiveTenants: jest.fn(),
      ...overrides,
    } as unknown as TenantRepository;
  }

  function createLocationRepositoryStub(overrides: Partial<LocationRepository> = {}): LocationRepository {
    return {
      createLocation: jest.fn(),
      getLocationById: jest.fn(),
      listTenantLocations: jest.fn(async () => []),
      updateLocation: jest.fn(),
      deactivateLocation: jest.fn(),
      ...overrides,
    } as unknown as LocationRepository;
  }

  it("returns mapped tenant profile summary on success", async () => {
    const tenantRepository = createTenantRepositoryStub({
      getTenantById: jest.fn(async () => ({
        tenantId: "tenantA",
        name: "Luna Nails",
        slug: "luna-nails",
        status: "active",
        ownerUserId: "u1",
        plan: "starter",
        country: "HR",
        defaultLanguage: "hr",
        defaultCurrency: "EUR",
        timezone: "Europe/Zagreb",
        branding: {
          logoUrl: null,
          primary: "#111111",
          secondary: "#eeeeee",
          accent: "#cccccc",
          fontHeading: "Manrope",
          fontBody: "Manrope",
          radius: 12,
        },
        settings: {
          bookingLeadHours: 2,
          bookingMaxDays: 90,
          cancellationWindowHours: 24,
          allowGuestBooking: true,
          requireDeposit: false,
        },
        createdAt: {} as never,
        updatedAt: {} as never,
      } as Tenant)),
    });
    const locationRepository = createLocationRepositoryStub();

    const service = createTenantLocationAdminService({ tenantRepository, locationRepository });
    const result = await service.readTenantProfile("tenantA");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Luna Nails");
      expect(result.data.slug).toBe("luna-nails");
      expect(result.data.allowGuestBooking).toBe(true);
    }
  });

  it("returns UI-safe not-found message for missing tenant", async () => {
    const service = createTenantLocationAdminService({
      tenantRepository: createTenantRepositoryStub(),
      locationRepository: createLocationRepositoryStub(),
    });

    const result = await service.readTenantProfile("missing");

    expect(result).toEqual({
      ok: false,
      message: "Tenant profile was not found for the active tenant context.",
    });
  });

  it("normalizes location list errors to UI-safe message", async () => {
    const locationRepository = createLocationRepositoryStub({
      listTenantLocations: jest.fn(async () => {
        throw new Error("tenantId is required for listTenantLocations");
      }),
    });

    const service = createTenantLocationAdminService({
      tenantRepository: createTenantRepositoryStub(),
      locationRepository,
    });

    const result = await service.readTenantLocations(" ");

    expect(result).toEqual({
      ok: false,
      message: "You do not have permission to access data outside your tenant.",
    });
  });

  it("returns created location from createLocationForTenant", async () => {
    const locationRepository = createLocationRepositoryStub({
      createLocation: jest.fn(async (_id, input) => ({
        ...input,
        locationId: "loc-a",
        createdAt: {} as never,
        updatedAt: {} as never,
      })),
    });

    const service = createTenantLocationAdminService({
      tenantRepository: createTenantRepositoryStub(),
      locationRepository,
    });

    const result = await service.createLocationForTenant("loc-a", {
      tenantId: "tenantA",
      name: "Downtown",
      code: "DOWNTOWN",
      status: "active",
      timezone: "Europe/Zagreb",
      phone: null,
      email: null,
      address: {
        line1: "",
        city: "Zagreb",
        country: "HR",
        postalCode: "",
      },
      operatingHours: {},
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.locationId).toBe("loc-a");
      expect(result.data.tenantId).toBe("tenantA");
    }
  });
});
