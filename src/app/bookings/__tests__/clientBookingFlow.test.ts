import { createClientBookingFlow } from "../clientBookingFlow";
import { BookingError } from "../../../domains/bookings/model";
import type { Location } from "../../../domains/locations/model";
import type { Service } from "../../../domains/services/model";
import type { StaffMember } from "../../../domains/staff/model";
import type { AvailableSlot } from "../../../domains/bookings/slotEngine";
import type { Booking } from "../../../domains/bookings/model";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fakeTimestamp = { seconds: 0, nanoseconds: 0 } as never;

const ACTIVE_LOC: Location = {
  locationId: "loc1",
  tenantId: "tA",
  name: "Downtown",
  code: "DT",
  status: "active",
  timezone: "UTC",
  phone: null,
  email: null,
  address: { line1: "1 Main", city: "City", country: "US", postalCode: "00000" },
  operatingHours: {},
  createdAt: fakeTimestamp,
  updatedAt: fakeTimestamp,
};

const INACTIVE_LOC: Location = { ...ACTIVE_LOC, locationId: "loc2", status: "inactive" };

const ACTIVE_SVC: Service = {
  serviceId: "svc1",
  tenantId: "tA",
  locationIds: ["loc1"],
  name: "Haircut",
  category: "hair",
  durationMinutes: 60,
  bufferMinutes: 10,
  price: 30,
  currency: "€",
  active: true,
  sortOrder: 0,
  createdAt: fakeTimestamp,
  updatedAt: fakeTimestamp,
};

const INACTIVE_SVC: Service = { ...ACTIVE_SVC, serviceId: "svc2", active: false };

const ACTIVE_TECH: StaffMember = {
  staffId: "staff1",
  tenantId: "tA",
  userId: "u1",
  displayName: "Alice",
  role: "technician",
  status: "active",
  locationIds: ["loc1"],
  serviceIds: ["svc1"],
  skills: [],
  constraints: [],
  createdAt: fakeTimestamp,
  updatedAt: fakeTimestamp,
};

const INACTIVE_TECH: StaffMember = { ...ACTIVE_TECH, staffId: "staff2", status: "inactive" };

const SLOT: AvailableSlot = {
  startMinutes: 540,
  endMinutes: 600,
  startTime: "09:00",
  endTime: "10:00",
};

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    bookingId: "bk1",
    tenantId: "tA",
    locationId: "loc1",
    staffId: "staff1",
    serviceId: "svc1",
    customerUserId: "cust1",
    date: "2026-04-27",
    startMinutes: 540,
    endMinutes: 600,
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    bufferMinutes: 10,
    status: "pending",
    version: 0,
    lifecycleEvents: [],
    notes: null,
    createdAt: fakeTimestamp,
    updatedAt: fakeTimestamp,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Helpers to build mock deps
// ---------------------------------------------------------------------------

function makeLocationRepo(locations: Location[]) {
  return { listTenantLocations: jest.fn().mockResolvedValue(locations) };
}

function makeServiceRepo(services: Service[]) {
  return { listServicesByLocation: jest.fn().mockResolvedValue(services) };
}

function makeStaffRepo(staff: StaffMember[]) {
  return { listServiceQualifiedStaff: jest.fn().mockResolvedValue(staff) };
}

function makeBookingService(slots: AvailableSlot[], booking: Booking) {
  return {
    getAvailableSlots: jest.fn().mockResolvedValue(slots),
    reserveSlot: jest.fn().mockResolvedValue(booking),
  };
}

// ---------------------------------------------------------------------------
// loadLocations
// ---------------------------------------------------------------------------

describe("createClientBookingFlow — loadLocations", () => {
  it("returns only active locations", async () => {
    const flow = createClientBookingFlow({
      locationRepository: makeLocationRepo([ACTIVE_LOC, INACTIVE_LOC]) as never,
      serviceRepository: makeServiceRepo([]) as never,
      staffRepository: makeStaffRepo([]) as never,
      bookingService: makeBookingService([], makeBooking()) as never,
    });

    const result = await flow.loadLocations("tA");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.locations).toHaveLength(1);
      expect(result.locations[0]!.locationId).toBe("loc1");
    }
  });

  it("returns ok:false on repository error", async () => {
    const repo = { listTenantLocations: jest.fn().mockRejectedValue(new Error("db error")) };
    const flow = createClientBookingFlow({
      locationRepository: repo as never,
      serviceRepository: makeServiceRepo([]) as never,
      staffRepository: makeStaffRepo([]) as never,
      bookingService: makeBookingService([], makeBooking()) as never,
    });

    const result = await flow.loadLocations("tA");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/db error/);
    }
  });
});

// ---------------------------------------------------------------------------
// loadServices
// ---------------------------------------------------------------------------

describe("createClientBookingFlow — loadServices", () => {
  it("returns only active services", async () => {
    const flow = createClientBookingFlow({
      locationRepository: makeLocationRepo([]) as never,
      serviceRepository: makeServiceRepo([ACTIVE_SVC, INACTIVE_SVC]) as never,
      staffRepository: makeStaffRepo([]) as never,
      bookingService: makeBookingService([], makeBooking()) as never,
    });

    const result = await flow.loadServices("tA", "loc1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.services).toHaveLength(1);
      expect(result.services[0]!.serviceId).toBe("svc1");
    }
  });
});

// ---------------------------------------------------------------------------
// loadTechnicians
// ---------------------------------------------------------------------------

describe("createClientBookingFlow — loadTechnicians", () => {
  it("returns only active technicians", async () => {
    const flow = createClientBookingFlow({
      locationRepository: makeLocationRepo([]) as never,
      serviceRepository: makeServiceRepo([]) as never,
      staffRepository: makeStaffRepo([ACTIVE_TECH, INACTIVE_TECH]) as never,
      bookingService: makeBookingService([], makeBooking()) as never,
    });

    const result = await flow.loadTechnicians("tA", "loc1", "svc1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.technicians).toHaveLength(1);
      expect(result.technicians[0]!.staffId).toBe("staff1");
    }
  });
});

// ---------------------------------------------------------------------------
// reserveSlot
// ---------------------------------------------------------------------------

describe("createClientBookingFlow — reserveSlot", () => {
  const BASE_SELECTION = {
    tenantId: "tA",
    customerUserId: "cust1",
    location: ACTIVE_LOC,
    service: ACTIVE_SVC,
    technician: ACTIVE_TECH,
    date: "2026-04-27",
    slot: SLOT,
    notes: null,
  };

  it("returns ok:true with booking on success", async () => {
    const booking = makeBooking();
    const flow = createClientBookingFlow({
      locationRepository: makeLocationRepo([]) as never,
      serviceRepository: makeServiceRepo([]) as never,
      staffRepository: makeStaffRepo([]) as never,
      bookingService: makeBookingService([], booking) as never,
    });

    const result = await flow.reserveSlot(BASE_SELECTION);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.booking.bookingId).toBe("bk1");
    }
  });

  it("returns ok:false with SLOT_UNAVAILABLE on BookingError(SLOT_UNAVAILABLE)", async () => {
    const bookingService = {
      getAvailableSlots: jest.fn(),
      reserveSlot: jest.fn().mockRejectedValue(new BookingError("SLOT_UNAVAILABLE", "Slot no longer available")),  
    };
    const flow = createClientBookingFlow({
      locationRepository: makeLocationRepo([]) as never,
      serviceRepository: makeServiceRepo([]) as never,
      staffRepository: makeStaffRepo([]) as never,
      bookingService: bookingService as never,
    });

    const result = await flow.reserveSlot(BASE_SELECTION);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("SLOT_UNAVAILABLE");
    }
  });

  it("returns ok:false with ERROR on generic error", async () => {
    const bookingService = {
      getAvailableSlots: jest.fn(),
      reserveSlot: jest.fn().mockRejectedValue(new Error("network failure")),
    };
    const flow = createClientBookingFlow({
      locationRepository: makeLocationRepo([]) as never,
      serviceRepository: makeServiceRepo([]) as never,
      staffRepository: makeStaffRepo([]) as never,
      bookingService: bookingService as never,
    });

    const result = await flow.reserveSlot(BASE_SELECTION);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("ERROR");
      expect(result.message).toMatch(/network failure/);
    }
  });

  it("passes service.durationMinutes to bookingService.reserveSlot", async () => {
    const reserveSlot = jest.fn().mockResolvedValue(makeBooking());
    const bookingService = { getAvailableSlots: jest.fn(), reserveSlot };
    const flow = createClientBookingFlow({
      locationRepository: makeLocationRepo([]) as never,
      serviceRepository: makeServiceRepo([]) as never,
      staffRepository: makeStaffRepo([]) as never,
      bookingService: bookingService as never,
    });

    await flow.reserveSlot(BASE_SELECTION);
    expect(reserveSlot).toHaveBeenCalledWith(
      expect.objectContaining({ durationMinutes: ACTIVE_SVC.durationMinutes }),
    );
  });
});
