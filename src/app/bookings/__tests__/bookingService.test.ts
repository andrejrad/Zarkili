import { createBookingService } from "../bookingService";
import type { StaffSchedulesRepository } from "../../../domains/staff/staffSchedulesRepository";
import type { BookingsRepository } from "../../../domains/bookings/repository";
import type { Booking } from "../../../domains/bookings/model";
import type { StaffScheduleTemplate } from "../../../domains/staff/staffSchedulesModel";

// Minimal fake Timestamp that satisfies type constraints
const fakeTimestamp = { seconds: 0, nanoseconds: 0 } as never;

function makeSchedule(
  overrides: Partial<StaffScheduleTemplate> = {},
): StaffScheduleTemplate {
  return {
    scheduleId: "s1",
    tenantId: "tA",
    staffId: "staff1",
    locationId: "loc1",
    weekTemplate: {
      mon: [{ start: "09:00", end: "17:00" }],
    },
    exceptions: [],
    updatedAt: fakeTimestamp,
    ...overrides,
  };
}

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
    status: "confirmed",
    version: 0,
    lifecycleEvents: [],
    notes: null,
    createdAt: fakeTimestamp,
    updatedAt: fakeTimestamp,
    ...overrides,
  };
}

function makeSchedulesRepo(
  schedule: StaffScheduleTemplate | null = null,
): jest.Mocked<StaffSchedulesRepository> {
  return {
    getScheduleTemplate: jest.fn().mockResolvedValue(schedule),
    upsertScheduleTemplate: jest.fn(),
  } as unknown as jest.Mocked<StaffSchedulesRepository>;
}

function makeBookingsRepo(
  overrides: Partial<jest.Mocked<BookingsRepository>> = {},
): jest.Mocked<BookingsRepository> {
  return {
    createBookingAtomically: jest.fn(),
    getBookingById: jest.fn(),
    listBookingsByStaffAndDate: jest.fn().mockResolvedValue([]),
    listBookingsByLocationAndDate: jest.fn().mockResolvedValue([]),
    listBookingsByCustomer: jest.fn().mockResolvedValue([]),
    updateBookingStatus: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<BookingsRepository>;
}

const BASE_SLOT_INPUT = {
  tenantId: "tA",
  staffId: "staff1",
  locationId: "loc1",
  // 2026-04-27 = Monday
  date: "2026-04-27",
  serviceDurationMinutes: 60,
  bufferMinutes: 10,
};

describe("createBookingService", () => {
  describe("getAvailableSlots", () => {
    it("returns empty array when staff has no schedule", async () => {
      const svc = createBookingService(makeSchedulesRepo(null), makeBookingsRepo());
      const slots = await svc.getAvailableSlots(BASE_SLOT_INPUT);
      expect(slots).toHaveLength(0);
    });

    it("returns 7 slots for a full Monday 9-17 schedule with no bookings", async () => {
      const svc = createBookingService(
        makeSchedulesRepo(makeSchedule()),
        makeBookingsRepo({ listBookingsByStaffAndDate: jest.fn().mockResolvedValue([]) }),
      );
      const slots = await svc.getAvailableSlots(BASE_SLOT_INPUT);
      expect(slots).toHaveLength(7);
      expect(slots[0]?.startTime).toBe("09:00");
    });

    it("excludes slots blocked by existing bookings", async () => {
      const existingBooking = makeBooking({ startMinutes: 540, endMinutes: 600, bufferMinutes: 10 });
      const svc = createBookingService(
        makeSchedulesRepo(makeSchedule()),
        makeBookingsRepo({
          listBookingsByStaffAndDate: jest.fn().mockResolvedValue([existingBooking]),
        }),
      );
      const slots = await svc.getAvailableSlots(BASE_SLOT_INPUT);
      const startTimes = slots.map((s) => s.startMinutes);
      expect(startTimes).not.toContain(540);
    });

    it("passes tenantId, staffId and locationId to schedulesRepository", async () => {
      const schedulesRepo = makeSchedulesRepo(null);
      const svc = createBookingService(schedulesRepo, makeBookingsRepo());
      await svc.getAvailableSlots(BASE_SLOT_INPUT);
      expect(schedulesRepo.getScheduleTemplate).toHaveBeenCalledWith("tA", "staff1", "loc1");
    });
  });

  describe("reserveSlot", () => {
    it("delegates to bookingsRepository.createBookingAtomically", async () => {
      const booking = makeBooking();
      const bookingsRepo = makeBookingsRepo({
        createBookingAtomically: jest.fn().mockResolvedValue(booking),
      });
      const svc = createBookingService(makeSchedulesRepo(), bookingsRepo);
      const input = {
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
        notes: null,
      };
      const result = await svc.reserveSlot(input);
      expect(bookingsRepo.createBookingAtomically).toHaveBeenCalledWith(input);
      expect(result).toBe(booking);
    });
  });

  describe("listStaffBookingsForDate", () => {
    it("calls repository and returns results", async () => {
      const booking = makeBooking();
      const bookingsRepo = makeBookingsRepo({
        listBookingsByStaffAndDate: jest.fn().mockResolvedValue([booking]),
      });
      const svc = createBookingService(makeSchedulesRepo(), bookingsRepo);
      const results = await svc.listStaffBookingsForDate("tA", "staff1", "2026-04-27");
      expect(results).toHaveLength(1);
      expect(bookingsRepo.listBookingsByStaffAndDate).toHaveBeenCalledWith("tA", "staff1", "2026-04-27");
    });
  });

  describe("cancelBooking", () => {
    it("calls updateBookingStatus with cancelled", async () => {
      const bookingsRepo = makeBookingsRepo({
        updateBookingStatus: jest.fn().mockResolvedValue(undefined),
      });
      const svc = createBookingService(makeSchedulesRepo(), bookingsRepo);
      await svc.cancelBooking("bk1", "tA");
      expect(bookingsRepo.updateBookingStatus).toHaveBeenCalledWith({
        bookingId: "bk1",
        tenantId: "tA",
        status: "cancelled",
      });
    });
  });
});
