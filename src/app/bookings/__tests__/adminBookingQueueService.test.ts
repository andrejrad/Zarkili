import type { BookingsRepository } from "../../../domains/bookings/repository";
import type { Booking } from "../../../domains/bookings/model";
import { createAdminBookingQueueService } from "../adminBookingQueueService";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fakeTimestamp = { seconds: 0, nanoseconds: 0 } as never;

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    bookingId: "bk1",
    tenantId: "tA",
    locationId: "loc1",
    staffId: "staff1",
    serviceId: "svc1",
    customerUserId: "cust1",
    date: "2026-05-01",
    startMinutes: 540,
    endMinutes: 600,
    startTime: "09:00",
    endTime: "10:00",
    durationMinutes: 60,
    bufferMinutes: 0,
    status: "pending",
    version: 0,
    lifecycleEvents: [],
    notes: null,
    createdAt: fakeTimestamp,
    updatedAt: fakeTimestamp,
    ...overrides,
  };
}

function makeRepo(overrides: Partial<BookingsRepository> = {}): BookingsRepository {
  return {
    createBookingAtomically: jest.fn(),
    getBookingById: jest.fn(),
    listBookingsByStaffAndDate: jest.fn().mockResolvedValue([]),
    listBookingsByLocationAndDate: jest.fn().mockResolvedValue([]),
    listBookingsByCustomer: jest.fn().mockResolvedValue([]),
    updateBookingStatus: jest.fn().mockResolvedValue(undefined),
    listBookingsByStatus: jest.fn().mockResolvedValue([]),
    confirmBooking: jest.fn().mockResolvedValue(undefined),
    rejectBooking: jest.fn().mockResolvedValue(undefined),
    cancelBooking: jest.fn().mockResolvedValue(undefined),
    markNoShow: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as BookingsRepository;
}

// ---------------------------------------------------------------------------
// loadQueue
// ---------------------------------------------------------------------------

describe("adminBookingQueueService.loadQueue", () => {
  it("returns sorted bookings on success", async () => {
    const b1 = makeBooking({ bookingId: "bk1", date: "2026-05-02", startMinutes: 600 });
    const b2 = makeBooking({ bookingId: "bk2", date: "2026-05-01", startMinutes: 540 });
    const b3 = makeBooking({ bookingId: "bk3", date: "2026-05-01", startMinutes: 480 });

    const repo = makeRepo({ listBookingsByStatus: jest.fn().mockResolvedValue([b1, b2, b3]) });
    const service = createAdminBookingQueueService(repo);

    const result = await service.loadQueue("tA", "pending");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bookings.map((b) => b.bookingId)).toEqual(["bk3", "bk2", "bk1"]);
  });

  it("queries the correct statuses for each tab", async () => {
    const listFn = jest.fn().mockResolvedValue([]);
    const repo = makeRepo({ listBookingsByStatus: listFn });
    const service = createAdminBookingQueueService(repo);

    await service.loadQueue("tA", "pending");
    expect(listFn).toHaveBeenCalledWith("tA", ["pending"], expect.anything());

    await service.loadQueue("tA", "reschedule_pending");
    expect(listFn).toHaveBeenCalledWith("tA", ["reschedule_pending"], expect.anything());

    await service.loadQueue("tA", "exceptions");
    expect(listFn).toHaveBeenCalledWith("tA", ["reschedule_rejected"], expect.anything());
  });

  it("passes location and date filters through", async () => {
    const listFn = jest.fn().mockResolvedValue([]);
    const repo = makeRepo({ listBookingsByStatus: listFn });
    const service = createAdminBookingQueueService(repo);

    await service.loadQueue("tA", "pending", { locationId: "loc2", date: "2026-06-01" });

    expect(listFn).toHaveBeenCalledWith("tA", ["pending"], { locationId: "loc2", date: "2026-06-01" });
  });

  it("returns ok:false on repository error", async () => {
    const repo = makeRepo({
      listBookingsByStatus: jest.fn().mockRejectedValue(new Error("Firestore unavailable")),
    });
    const service = createAdminBookingQueueService(repo);

    const result = await service.loadQueue("tA", "pending");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toBe("Firestore unavailable");
  });

  it("returns empty array when no bookings match", async () => {
    const repo = makeRepo({ listBookingsByStatus: jest.fn().mockResolvedValue([]) });
    const service = createAdminBookingQueueService(repo);

    const result = await service.loadQueue("tA", "exceptions");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.bookings).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// confirmBooking
// ---------------------------------------------------------------------------

describe("adminBookingQueueService.confirmBooking", () => {
  it("returns ok:true on success", async () => {
    const repo = makeRepo({ confirmBooking: jest.fn().mockResolvedValue(undefined) });
    const service = createAdminBookingQueueService(repo);

    const result = await service.confirmBooking("bk1", "tA");

    expect(result.ok).toBe(true);
    expect(repo.confirmBooking).toHaveBeenCalledWith("bk1", "tA", "location_manager");
  });

  it("returns ok:false with message on failure", async () => {
    const repo = makeRepo({
      confirmBooking: jest.fn().mockRejectedValue(new Error("not found")),
    });
    const service = createAdminBookingQueueService(repo);

    const result = await service.confirmBooking("bk1", "tA");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toBe("Booking not found.");
  });
});

// ---------------------------------------------------------------------------
// rejectBooking
// ---------------------------------------------------------------------------

describe("adminBookingQueueService.rejectBooking", () => {
  it("returns ok:true and passes reason through", async () => {
    const repo = makeRepo({ rejectBooking: jest.fn().mockResolvedValue(undefined) });
    const service = createAdminBookingQueueService(repo);

    const result = await service.rejectBooking("bk1", "tA", "Fully booked that day");

    expect(result.ok).toBe(true);
    expect(repo.rejectBooking).toHaveBeenCalledWith("bk1", "tA", "location_manager", "Fully booked that day");
  });

  it("returns ok:false on failure", async () => {
    const repo = makeRepo({
      rejectBooking: jest.fn().mockRejectedValue(new Error("stale_write")),
    });
    const service = createAdminBookingQueueService(repo);

    const result = await service.rejectBooking("bk1", "tA", "reason");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toMatch(/updated by someone else/i);
  });
});

// ---------------------------------------------------------------------------
// cancelBooking
// ---------------------------------------------------------------------------

describe("adminBookingQueueService.cancelBooking", () => {
  it("returns ok:true and passes reason through", async () => {
    const repo = makeRepo({ cancelBooking: jest.fn().mockResolvedValue(undefined) });
    const service = createAdminBookingQueueService(repo);

    const result = await service.cancelBooking("bk1", "tA", "Client request");

    expect(result.ok).toBe(true);
    expect(repo.cancelBooking).toHaveBeenCalledWith("bk1", "tA", "location_manager", "Client request");
  });
});
