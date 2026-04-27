import { createStaffAdminService } from "../staffAdminService";
import type { StaffRepository } from "../../../domains/staff/repository";
import type { StaffMember } from "../../../domains/staff";

function makeStaffMember(overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    staffId: "staff1",
    tenantId: "tenantA",
    userId: "userA",
    displayName: "Ana Novak",
    role: "technician",
    status: "active",
    locationIds: ["locA"],
    serviceIds: ["svc1"],
    skills: [],
    constraints: [],
    createdAt: {} as never,
    updatedAt: {} as never,
    ...overrides,
  };
}

function makeRepositoryStub(overrides: Partial<StaffRepository> = {}): StaffRepository {
  return {
    createStaff: async () => makeStaffMember(),
    updateStaff: async () => undefined,
    listLocationStaff: async () => [makeStaffMember()],
    listServiceQualifiedStaff: async () => [],
    deactivateStaff: async () => undefined,
    ...overrides,
  };
}

describe("staffAdminService", () => {
  describe("readStaffList", () => {
    it("returns staff list on success", async () => {
      const repo = makeRepositoryStub();
      const service = createStaffAdminService({ staffRepository: repo });

      const result = await service.readStaffList("tenantA", "locA");

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].staffId).toBe("staff1");
      }
    });

    it("returns error message when repository throws", async () => {
      const repo = makeRepositoryStub({
        listLocationStaff: async () => {
          throw new Error("Firestore read failed");
        },
      });
      const service = createStaffAdminService({ staffRepository: repo });

      const result = await service.readStaffList("tenantA", "locA");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBe("Unable to load staff list right now.");
      }
    });

    it("normalizes cross-tenant error", async () => {
      const repo = makeRepositoryStub({
        listLocationStaff: async () => {
          throw new Error("Cross-tenant staff access denied");
        },
      });
      const service = createStaffAdminService({ staffRepository: repo });

      const result = await service.readStaffList("tenantA", "locA");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBe("You do not have permission to access data outside your tenant.");
      }
    });
  });

  describe("createStaffForTenant", () => {
    it("returns created staff member on success", async () => {
      const repo = makeRepositoryStub();
      const service = createStaffAdminService({ staffRepository: repo });

      const result = await service.createStaffForTenant("staff1", {
        tenantId: "tenantA",
        userId: "userA",
        displayName: "Ana Novak",
        role: "technician",
        status: "active",
        locationIds: ["locA"],
        serviceIds: [],
        skills: [],
        constraints: [],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.staffId).toBe("staff1");
      }
    });

    it("normalizes validation error from repository", async () => {
      const repo = makeRepositoryStub({
        createStaff: async () => {
          throw new Error("displayName is required");
        },
      });
      const service = createStaffAdminService({ staffRepository: repo });

      const result = await service.createStaffForTenant("staff1", {
        tenantId: "tenantA",
        userId: "userA",
        displayName: "",
        role: "technician",
        status: "active",
        locationIds: [],
        serviceIds: [],
        skills: [],
        constraints: [],
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBe("Please fill in all required fields correctly.");
      }
    });
  });

  describe("deactivateStaffMember", () => {
    it("returns ok on success", async () => {
      const repo = makeRepositoryStub();
      const service = createStaffAdminService({ staffRepository: repo });

      const result = await service.deactivateStaffMember("staff1", "tenantA");

      expect(result.ok).toBe(true);
    });

    it("normalizes cross-tenant error on deactivation", async () => {
      const repo = makeRepositoryStub({
        deactivateStaff: async () => {
          throw new Error("Cross-tenant staff deactivation is not allowed");
        },
      });
      const service = createStaffAdminService({ staffRepository: repo });

      const result = await service.deactivateStaffMember("staff1", "tenantB");

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.message).toBe("You do not have permission to access data outside your tenant.");
      }
    });
  });
});
