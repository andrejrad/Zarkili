/**
 * W40 — locationAdminService: thin adapter used by admin location screens.
 *
 * Provides per-location dashboard, settings, resource management, walk-in
 * queue, daily close, and holiday calendar through a single injectable
 * surface.  All methods are stub-implemented and will be wired to real
 * Firestore / Cloud Function backends in Phase 3.5 and W43 (Booking Operations).
 */

import type { Location, UpdateLocationInput } from "../../domains/locations/model";
import type { OperatingHours } from "../../domains/locations/model";

// ---------------------------------------------------------------------------
// Re-export domain types
// ---------------------------------------------------------------------------

export type { Location, UpdateLocationInput, OperatingHours };

// ---------------------------------------------------------------------------
// Location KPI / dashboard
// ---------------------------------------------------------------------------

export type LocationKpi = {
  locationId: string;
  locationName: string;
  bookingsToday: number;
  revenueToday: number; // cents
  currency: string;
  occupancyPct: number | null; // 0–100 or null if unknown
  walkInsToday: number;
  openSlotsToday: number | null;
};

export type TodayAppointment = {
  appointmentId: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  startTimeIso: string;
  durationMin: number;
  status: "confirmed" | "pending" | "cancelled" | "completed" | "no_show";
};

// ---------------------------------------------------------------------------
// Resource management
// ---------------------------------------------------------------------------

export type ResourceType = "room" | "chair" | "equipment";

export type ResourceStatus = "active" | "inactive" | "maintenance";

export type ResourceItem = {
  resourceId: string;
  tenantId: string;
  locationId: string;
  name: string;
  type: ResourceType;
  capacity: number;
  status: ResourceStatus;
  maintenanceNote: string | null;
};

export type CreateResourceInput = Omit<ResourceItem, "resourceId">;
export type UpdateResourceInput = Partial<Pick<ResourceItem, "name" | "capacity" | "status" | "maintenanceNote">>;

// ---------------------------------------------------------------------------
// Walk-in queue (admin variant)
// ---------------------------------------------------------------------------

export type WalkInStatus = "waiting" | "seated" | "no_show" | "cancelled";

export type WalkInQueueEntry = {
  entryId: string;
  locationId: string;
  clientName: string;
  partySize: number;
  requestedServiceName: string | null;
  requestedStaffName: string | null;
  waitSinceIso: string;
  status: WalkInStatus;
  assignedStaffName: string | null;
};

// ---------------------------------------------------------------------------
// Daily close / cash report
// ---------------------------------------------------------------------------

export type DenominationCount = {
  label: string; // e.g. "$100", "$50", "$20", …
  valueCents: number; // face value in cents
  quantity: number;
};

export type TipsStaffRow = {
  staffId: string;
  staffName: string;
  tipsCents: number;
  currency: string;
};

export type DailyCloseReport = {
  reportId: string | null;
  locationId: string;
  dateIso: string;
  expectedCashCents: number;
  denominationCounts: DenominationCount[];
  countedCashCents: number; // sum of denomination totals
  varianceCents: number; // counted - expected
  tipsByStaff: TipsStaffRow[];
  totalTipsCents: number;
  currency: string;
  submittedAt: string | null; // ISO if submitted, null if draft
  submittedByName: string | null;
};

// ---------------------------------------------------------------------------
// Holidays
// ---------------------------------------------------------------------------

export type HolidayEntry = {
  holidayId: string;
  name: string;
  dateIso: string; // YYYY-MM-DD
  isFederal: boolean;
  state: string | null; // US state abbreviation or null
  isEnabled: boolean; // whether the location observes (blackout) this day
};

// ---------------------------------------------------------------------------
// Per-location service overrides
// ---------------------------------------------------------------------------

export type LocationServiceOverride = {
  serviceId: string;
  serviceName: string;
  basePriceCents: number;
  baseDurationMin: number;
  currency: string;
  overridePriceCents: number | null;
  overrideDurationMin: number | null;
  isAvailable: boolean;
};

// ---------------------------------------------------------------------------
// ADA accessibility flags
// ---------------------------------------------------------------------------

export type LocationAccessibilityFlags = {
  wheelchairAccessible: boolean;
  accessibleParking: boolean;
  serviceAnimalWelcome: boolean;
};

// ---------------------------------------------------------------------------
// Service surface
// ---------------------------------------------------------------------------

export type LocationAdminService = {
  // Overview
  listLocations(tenantId: string): Promise<Location[]>;
  getLocationKpis(tenantId: string): Promise<LocationKpi[]>;
  getLocationKpi(locationId: string, tenantId: string): Promise<LocationKpi | null>;
  getTodayAppointments(locationId: string, tenantId: string): Promise<TodayAppointment[]>;
  // Settings
  getLocation(locationId: string): Promise<Location | null>;
  updateLocation(locationId: string, tenantId: string, input: UpdateLocationInput): Promise<void>;
  getAccessibilityFlags(locationId: string): Promise<LocationAccessibilityFlags>;
  updateAccessibilityFlags(locationId: string, flags: LocationAccessibilityFlags): Promise<void>;
  // Holidays
  listHolidays(locationId: string): Promise<HolidayEntry[]>;
  toggleHoliday(locationId: string, holidayId: string, enabled: boolean): Promise<void>;
  // Service overrides
  listServiceOverrides(locationId: string, tenantId: string): Promise<LocationServiceOverride[]>;
  updateServiceOverride(locationId: string, serviceId: string, patch: Partial<Pick<LocationServiceOverride, "overridePriceCents" | "overrideDurationMin" | "isAvailable">>): Promise<void>;
  // Resources
  listResources(locationId: string, tenantId: string, type?: ResourceType): Promise<ResourceItem[]>;
  createResource(input: CreateResourceInput): Promise<ResourceItem>;
  updateResource(resourceId: string, input: UpdateResourceInput): Promise<void>;
  deleteResource(resourceId: string): Promise<void>;
  // Walk-in queue
  getWalkInQueue(locationId: string): Promise<WalkInQueueEntry[]>;
  addWalkIn(locationId: string, clientName: string, partySize: number, requestedServiceName: string | null, requestedStaffName: string | null): Promise<WalkInQueueEntry>;
  updateWalkInStatus(entryId: string, status: WalkInStatus, assignedStaffName: string | null): Promise<void>;
  // Daily close
  getDailyCloseReport(locationId: string, dateIso: string): Promise<DailyCloseReport>;
  updateDenominationCount(locationId: string, dateIso: string, denominationLabel: string, quantity: number): Promise<void>;
  submitDailyClose(locationId: string, dateIso: string, submittedByName: string): Promise<void>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createLocationAdminService(): LocationAdminService {
  return {
    async listLocations(_tenantId): Promise<Location[]> {
      return [];
    },

    async getLocationKpis(_tenantId): Promise<LocationKpi[]> {
      return [];
    },

    async getLocationKpi(_locationId, _tenantId): Promise<LocationKpi | null> {
      return null;
    },

    async getTodayAppointments(_locationId, _tenantId): Promise<TodayAppointment[]> {
      return [];
    },

    async getLocation(_locationId): Promise<Location | null> {
      return null;
    },

    async updateLocation(_locationId, _tenantId, _input): Promise<void> {
      // Calls updateLocation from Firestore via locationRepository.
    },

    async getAccessibilityFlags(_locationId): Promise<LocationAccessibilityFlags> {
      return { wheelchairAccessible: false, accessibleParking: false, serviceAnimalWelcome: false };
    },

    async updateAccessibilityFlags(_locationId, _flags): Promise<void> {
      // Writes to tenants/{tenantId}/locations/{locationId}.
    },

    async listHolidays(_locationId): Promise<HolidayEntry[]> {
      return [];
    },

    async toggleHoliday(_locationId, _holidayId, _enabled): Promise<void> {
      // Writes enabled flag to locations/{locationId}/holidays/{holidayId}.
    },

    async listServiceOverrides(_locationId, _tenantId): Promise<LocationServiceOverride[]> {
      return [];
    },

    async updateServiceOverride(_locationId, _serviceId, _patch): Promise<void> {
      // Writes to locations/{locationId}/serviceOverrides/{serviceId}.
    },

    async listResources(_locationId, _tenantId, _type): Promise<ResourceItem[]> {
      return [];
    },

    async createResource(_input): Promise<ResourceItem> {
      throw new Error("createResource: not yet wired to Firestore.");
    },

    async updateResource(_resourceId, _input): Promise<void> {
      // Writes to resources/{resourceId}.
    },

    async deleteResource(_resourceId): Promise<void> {
      // Soft-deletes resource (status → inactive).
    },

    async getWalkInQueue(_locationId): Promise<WalkInQueueEntry[]> {
      return [];
    },

    async addWalkIn(locationId, clientName, partySize, requestedServiceName, requestedStaffName): Promise<WalkInQueueEntry> {
      return {
        entryId: `entry-${Date.now()}`,
        locationId,
        clientName,
        partySize,
        requestedServiceName,
        requestedStaffName,
        waitSinceIso: new Date().toISOString(),
        status: "waiting",
        assignedStaffName: null,
      };
    },

    async updateWalkInStatus(_entryId, _status, _assignedStaffName): Promise<void> {
      // Writes to walkInQueue/{entryId}.
    },

    async getDailyCloseReport(locationId, dateIso): Promise<DailyCloseReport> {
      return {
        reportId: null,
        locationId,
        dateIso,
        expectedCashCents: 0,
        denominationCounts: [
          { label: "$100", valueCents: 10000, quantity: 0 },
          { label: "$50", valueCents: 5000, quantity: 0 },
          { label: "$20", valueCents: 2000, quantity: 0 },
          { label: "$10", valueCents: 1000, quantity: 0 },
          { label: "$5", valueCents: 500, quantity: 0 },
          { label: "$1", valueCents: 100, quantity: 0 },
        ],
        countedCashCents: 0,
        varianceCents: 0,
        tipsByStaff: [],
        totalTipsCents: 0,
        currency: "USD",
        submittedAt: null,
        submittedByName: null,
      };
    },

    async updateDenominationCount(_locationId, _dateIso, _denominationLabel, _quantity): Promise<void> {
      // Writes to dailyCloseReports/{locationId}_{dateIso}.
    },

    async submitDailyClose(_locationId, _dateIso, _submittedByName): Promise<void> {
      // Locks the report and sends email summary to owner.
    },
  };
}
