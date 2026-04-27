import { createServiceAdminService } from "../serviceAdminService";
import type { ServiceRepository } from "../../../domains/services/repository";
import type { Service } from "../../../domains/services";

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    serviceId: "svc1",
    tenantId: "tenantA",
    locationIds: ["locA"],
    name: "Gel Manicure",
    category: "manicure",
    durationMinutes: 60,
    bufferMinutes: 10,
    price: 45,
    currency: "EUR",
    active: true,
    sortOrder: 10,
    createdAt: {} as never,
    updatedAt: {} as never,
    ...overrides,
  };
}

function makeRepositoryStub(overrides: Partial<ServiceRepository> = {}): ServiceRepository {
  return {
    createService: async () => makeService(),
    updateService: async () => undefined,
    listServicesByTenant: async () => [makeService()],
    listServicesByLocation: async () => [makeService()],
    archiveService: async () => undefined,
    ...overrides,
  };
}

describe("serviceAdminService", () => {
  describe("readServicesList", () => {
    it("returns services list on success", async () => {
      const repo = makeRepositoryStub();
      const service = createServiceAdminService({ serviceRepository: repo });

      const result = await service.readServicesList("tenantA");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].serviceId).toBe("svc1");
      }
    });

    it("returns error message when repository throws", async () => {
      const repo = makeRepositoryStub({
        listServicesByTenant: async () => {
          throw new Error("Firestore read failed");
        },
      });
      const service = createServiceAdminService({ serviceRepository: repo });

      const result = await service.readServicesList("tenantA");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBe("Unable to load services list right now.");
      }
    });

    it("normalizes cross-tenant error", async () => {
      const repo = makeRepositoryStub({
        listServicesByTenant: async () => {
          throw new Error("Cross-tenant service access denied");
        },
      });
      const service = createServiceAdminService({ serviceRepository: repo });

      const result = await service.readServicesList("tenantA");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBe("You do not have permission to access data outside your tenant.");
      }
    });
  });

  describe("createServiceForTenant", () => {
    it("returns created service on success", async () => {
      const repo = makeRepositoryStub();
      const service = createServiceAdminService({ serviceRepository: repo });

      const result = await service.createServiceForTenant("svc1", {
        tenantId: "tenantA",
        locationIds: [],
        name: "Gel Manicure",
        category: "manicure",
        durationMinutes: 60,
        bufferMinutes: 10,
        price: 45,
        currency: "EUR",
        active: true,
        sortOrder: 0,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.serviceId).toBe("svc1");
      }
    });

    it("normalizes validation error from repository", async () => {
      const repo = makeRepositoryStub({
        createService: async () => {
          throw new Error("durationMinutes must be between 5 and 480");
        },
      });
      const service = createServiceAdminService({ serviceRepository: repo });

      const result = await service.createServiceForTenant("svc1", {
        tenantId: "tenantA",
        locationIds: [],
        name: "Gel Manicure",
        category: "manicure",
        durationMinutes: 3,
        bufferMinutes: 0,
        price: 45,
        currency: "EUR",
        active: true,
        sortOrder: 0,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBe("Please fill in all required fields correctly.");
      }
    });
  });

  describe("archiveService", () => {
    it("returns ok on success", async () => {
      const repo = makeRepositoryStub();
      const service = createServiceAdminService({ serviceRepository: repo });

      const result = await service.archiveService("svc1", "tenantA");

      expect(result.ok).toBe(true);
    });

    it("normalizes cross-tenant error on archive", async () => {
      const repo = makeRepositoryStub({
        archiveService: async () => {
          throw new Error("Cross-tenant service archive is not allowed");
        },
      });
      const service = createServiceAdminService({ serviceRepository: repo });

      const result = await service.archiveService("svc1", "tenantB");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBe("You do not have permission to access data outside your tenant.");
      }
    });
  });
});
