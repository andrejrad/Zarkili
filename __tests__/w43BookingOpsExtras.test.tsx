/**
 * w43BookingOpsExtras.test.tsx
 *
 * W43 — Booking Operations (~80 tests)
 *
 * Covers:
 *   createBookingOpsService — loadCalendarDay
 *   createBookingOpsService — loadBlockedSlots
 *   createBookingOpsService — blockTimeSlot
 *   createBookingOpsService — unblockTimeSlot
 *   createBookingOpsService — createManualBooking
 *   createBookingOpsService — forceCreateBooking
 *   createBookingOpsService — loadBookingDetail
 *   createBookingOpsService — markNoShow / adminCancel / adminReschedule
 *   createBookingOpsService — buildConflictResolutionOptions
 *   BookingCalendarScreen
 *   BookingDetailAdminScreen
 *   ManualBookingScreen
 *   BlockTimeScreen
 *   ForceBookScreen
 *   NoShowMarkScreen
 *   CancellationAdminScreen
 *   RescheduleAdminScreen
 *   routes.ts — 8 W43 routes
 */

import React from "react";
import { fireEvent, render } from "@testing-library/react-native";
import type { Timestamp } from "firebase/firestore";

import {
  createBookingOpsService,
} from "../src/app/admin/bookingOpsService";
import type {
  BookingOpsCalendarRepository,
  BlockedSlotRepository,
  ManualBookingRepository,
  BookingDetailRepository,
  BookingWriteRepository,
} from "../src/app/admin/bookingOpsService";

import { BookingCalendarScreen } from "../src/app/admin/BookingCalendarScreen";
import { BookingDetailAdminScreen } from "../src/app/admin/BookingDetailAdminScreen";
import { ManualBookingScreen } from "../src/app/admin/ManualBookingScreen";
import { BlockTimeScreen } from "../src/app/admin/BlockTimeScreen";
import { ForceBookScreen } from "../src/app/admin/ForceBookScreen";
import { NoShowMarkScreen } from "../src/app/admin/NoShowMarkScreen";
import { CancellationAdminScreen } from "../src/app/admin/CancellationAdminScreen";
import { RescheduleAdminScreen } from "../src/app/admin/RescheduleAdminScreen";

import { appRoutes as ROUTES } from "../src/app/navigation/routes";
import type { BookingStatus } from "../src/domains/bookings/model";
import type {
  AdminBookingDetailView,
  BlockedSlot,
  CalendarDayView,
} from "../src/domains/bookings/bookingOpsModel";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fakeTs = { seconds: 0, nanoseconds: 0 } as unknown as Timestamp;

const makeBooking = (overrides: Partial<{
  bookingId: string;
  tenantId: string;
  locationId: string;
  staffId: string;
  serviceId: string;
  customerId: string;
  status: BookingStatus;
  date: string;
  startTime: string;
  endTime: string;
  startMinutes: number;
  endMinutes: number;
  durationMinutes: number;
  bufferMinutes: number;
  source: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}> = {}) => ({
  bookingId: "bk1",
  tenantId: "t1",
  locationId: "loc1",
  staffId: "staff1",
  serviceId: "svc1",
  customerId: "cust1",
  status: "confirmed" as BookingStatus,
  date: "2025-06-01",
  startTime: "09:00",
  endTime: "10:00",
  startMinutes: 540,
  endMinutes: 600,
  durationMinutes: 60,
  bufferMinutes: 0,
  source: "manual",
  createdAt: fakeTs,
  updatedAt: fakeTs,
  ...overrides,
});

const makeDayView = (): CalendarDayView => ({
  date: "2025-06-01",
  columns: [
    {
      staffId: "staff1",
      staffName: "Alice",
      entries: [
        {
          bookingId: "bk1",
          staffId: "staff1",
          staffName: "Alice",
          serviceId: "svc1",
          serviceName: "Haircut",
          customerName: "Bob",
          date: "2025-06-01",
          startTime: "09:00",
          endTime: "10:00",
          startMinutes: 540,
          endMinutes: 600,
          durationMinutes: 60,
          status: "confirmed" as BookingStatus,
        },
      ],
    },
  ],
});

const makeBlockedSlot = (): BlockedSlot => ({
  slotId: "slot1",
  tenantId: "t1",
  locationId: "loc1",
  staffId: "staff1",
  date: "2025-06-01",
  startTime: "11:00",
  endTime: "12:00",
  reason: "Lunch",
  createdBy: "owner1",
  createdAt: fakeTs,
});

const makeDetailView = (): AdminBookingDetailView => ({
  booking: makeBooking() as ReturnType<typeof makeBooking>,
  customerName: "Bob",
  customerEmail: "bob@example.com",
  customerPhone: "+1234567890",
  serviceName: "Haircut",
  staffName: "Alice",
  pastBookingsCount: 3,
  totalSpendCents: 10500,
  lifecycleEvents: [
    { status: "confirmed" as BookingStatus, actor: "tenant_admin" as const, reason: null, occurredAt: fakeTs },
  ],
});

// ---------------------------------------------------------------------------
// createBookingOpsService — loadCalendarDay
// ---------------------------------------------------------------------------

describe("bookingOpsService.loadCalendarDay", () => {
  it("returns not-configured when no calendarRepo provided", async () => {
    const svc = createBookingOpsService();
    const result = await svc.loadCalendarDay("t1", "loc1", "2025-06-01");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/calendar repository not configured/i);
  });

  it("returns ok:true with CalendarDayView when repo resolves", async () => {
    const booking = makeBooking();
    const repo: BookingOpsCalendarRepository = {
      listByLocationAndDate: jest.fn().mockResolvedValue([
        { booking, staffName: "Alice", serviceName: "Haircut", customerName: "Bob" },
      ]),
    };
    const svc = createBookingOpsService(repo);
    const result = await svc.loadCalendarDay("t1", "loc1", "2025-06-01");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.date).toBe("2025-06-01");
      expect(result.data.columns).toHaveLength(1);
      expect(result.data.columns[0].staffId).toBe("staff1");
      expect(result.data.columns[0].entries).toHaveLength(1);
    }
  });

  it("returns ok:false when repo throws", async () => {
    const repo: BookingOpsCalendarRepository = {
      listByLocationAndDate: jest.fn().mockRejectedValue(new Error("DB error")),
    };
    const svc = createBookingOpsService(repo);
    const result = await svc.loadCalendarDay("t1", "loc1", "2025-06-01");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe("DB error");
  });

  it("groups bookings by staffId into separate columns", async () => {
    const b1 = makeBooking({ bookingId: "bk1", staffId: "staff1" });
    const b2 = makeBooking({ bookingId: "bk2", staffId: "staff2" });
    const repo: BookingOpsCalendarRepository = {
      listByLocationAndDate: jest.fn().mockResolvedValue([
        { booking: b1, staffName: "Alice", serviceName: "Haircut", customerName: "Bob" },
        { booking: b2, staffName: "Carol", serviceName: "Blowout", customerName: "Dan" },
      ]),
    };
    const svc = createBookingOpsService(repo);
    const result = await svc.loadCalendarDay("t1", "loc1", "2025-06-01");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.columns).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// createBookingOpsService — loadBlockedSlots
// ---------------------------------------------------------------------------

describe("bookingOpsService.loadBlockedSlots", () => {
  it("returns not-configured when no blockedSlotRepo provided", async () => {
    const svc = createBookingOpsService();
    const result = await svc.loadBlockedSlots("t1", "loc1", "2025-06-01");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/blocked slot repository not configured/i);
  });

  it("returns ok:true with array when repo resolves", async () => {
    const slot = makeBlockedSlot();
    const blockedRepo: BlockedSlotRepository = {
      createBlockedSlot: jest.fn(),
      deleteBlockedSlot: jest.fn(),
      listBlockedSlots: jest.fn().mockResolvedValue([slot]),
    };
    const svc = createBookingOpsService(undefined, blockedRepo);
    const result = await svc.loadBlockedSlots("t1", "loc1", "2025-06-01");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toHaveLength(1);
  });

  it("returns ok:false when repo throws", async () => {
    const blockedRepo: BlockedSlotRepository = {
      createBlockedSlot: jest.fn(),
      deleteBlockedSlot: jest.fn(),
      listBlockedSlots: jest.fn().mockRejectedValue(new Error("Network")),
    };
    const svc = createBookingOpsService(undefined, blockedRepo);
    const result = await svc.loadBlockedSlots("t1", "loc1", "2025-06-01");
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createBookingOpsService — blockTimeSlot
// ---------------------------------------------------------------------------

describe("bookingOpsService.blockTimeSlot", () => {
  const baseInput = {
    tenantId: "t1",
    locationId: "loc1",
    staffId: "staff1",
    date: "2025-06-01",
    startTime: "13:00",
    endTime: "14:00",
    reason: "Training",
    createdBy: "owner1",
  };

  it("returns not-configured when no blockedSlotRepo provided", async () => {
    const svc = createBookingOpsService();
    const result = await svc.blockTimeSlot(baseInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/blocked slot repository not configured/i);
  });

  it("returns error when reason is empty", async () => {
    const blockedRepo: BlockedSlotRepository = {
      createBlockedSlot: jest.fn(),
      deleteBlockedSlot: jest.fn(),
      listBlockedSlots: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, blockedRepo);
    const result = await svc.blockTimeSlot({ ...baseInput, reason: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/reason is required/i);
  });

  it("returns error when times are empty", async () => {
    const blockedRepo: BlockedSlotRepository = {
      createBlockedSlot: jest.fn(),
      deleteBlockedSlot: jest.fn(),
      listBlockedSlots: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, blockedRepo);
    const result = await svc.blockTimeSlot({ ...baseInput, startTime: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/start time and end time are required/i);
  });

  it("returns ok:true with slot when repo resolves", async () => {
    const slot = makeBlockedSlot();
    const blockedRepo: BlockedSlotRepository = {
      createBlockedSlot: jest.fn().mockResolvedValue(slot),
      deleteBlockedSlot: jest.fn(),
      listBlockedSlots: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, blockedRepo);
    const result = await svc.blockTimeSlot(baseInput);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.slotId).toBe("slot1");
  });
});

// ---------------------------------------------------------------------------
// createBookingOpsService — unblockTimeSlot
// ---------------------------------------------------------------------------

describe("bookingOpsService.unblockTimeSlot", () => {
  it("returns not-configured when no blockedSlotRepo provided", async () => {
    const svc = createBookingOpsService();
    const result = await svc.unblockTimeSlot("slot1", "t1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/blocked slot repository not configured/i);
  });

  it("returns ok:true when repo resolves", async () => {
    const blockedRepo: BlockedSlotRepository = {
      createBlockedSlot: jest.fn(),
      deleteBlockedSlot: jest.fn().mockResolvedValue(undefined),
      listBlockedSlots: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, blockedRepo);
    const result = await svc.unblockTimeSlot("slot1", "t1");
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createBookingOpsService — createManualBooking
// ---------------------------------------------------------------------------

const baseManualInput = {
  channel: "phone" as const,
  tenantId: "t1",
  locationId: "loc1",
  staffId: "staff1",
  serviceId: "svc1",
  customerName: "Bob",
  customerPhone: null,
  date: "2025-06-01",
  startMinutes: 540,
  endMinutes: 600,
  startTime: "09:00",
  endTime: "10:00",
  durationMinutes: 60,
  bufferMinutes: 0,
  notes: null,
};

describe("bookingOpsService.createManualBooking", () => {
  it("returns not-configured when no manualBookingRepo provided", async () => {
    const svc = createBookingOpsService();
    const result = await svc.createManualBooking(baseManualInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/manual booking repository not configured/i);
  });

  it("returns error when customerName is empty", async () => {
    const manualRepo: ManualBookingRepository = {
      createManual: jest.fn(),
      forceCreate: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, undefined, manualRepo);
    const result = await svc.createManualBooking({ ...baseManualInput, customerName: "  " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/customer name is required/i);
  });

  it("returns error when staffId is empty", async () => {
    const manualRepo: ManualBookingRepository = {
      createManual: jest.fn(),
      forceCreate: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, undefined, manualRepo);
    const result = await svc.createManualBooking({ ...baseManualInput, staffId: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/staff member is required/i);
  });

  it("returns error when serviceId is empty", async () => {
    const manualRepo: ManualBookingRepository = {
      createManual: jest.fn(),
      forceCreate: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, undefined, manualRepo);
    const result = await svc.createManualBooking({ ...baseManualInput, serviceId: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/service is required/i);
  });

  it("returns ok:true with booking when repo resolves", async () => {
    const booking = makeBooking();
    const manualRepo: ManualBookingRepository = {
      createManual: jest.fn().mockResolvedValue(booking),
      forceCreate: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, undefined, manualRepo);
    const result = await svc.createManualBooking(baseManualInput);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.bookingId).toBe("bk1");
  });
});

// ---------------------------------------------------------------------------
// createBookingOpsService — forceCreateBooking
// ---------------------------------------------------------------------------

const baseForceInput = {
  tenantId: "t1",
  locationId: "loc1",
  staffId: "staff1",
  serviceId: "svc1",
  customerUserId: "cust1",
  date: "2025-06-01",
  startMinutes: 540,
  endMinutes: 600,
  startTime: "09:00",
  endTime: "10:00",
  durationMinutes: 60,
  bufferMinutes: 0,
  overrideReason: "VIP customer request",
  overriddenBy: "owner1",
};

describe("bookingOpsService.forceCreateBooking", () => {
  it("returns not-configured when no manualBookingRepo provided", async () => {
    const svc = createBookingOpsService();
    const result = await svc.forceCreateBooking(baseForceInput);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/force booking repository not configured/i);
  });

  it("returns error when overrideReason is empty", async () => {
    const manualRepo: ManualBookingRepository = {
      createManual: jest.fn(),
      forceCreate: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, undefined, manualRepo);
    const result = await svc.forceCreateBooking({ ...baseForceInput, overrideReason: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/override reason is required/i);
  });

  it("returns error when overriddenBy is empty", async () => {
    const manualRepo: ManualBookingRepository = {
      createManual: jest.fn(),
      forceCreate: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, undefined, manualRepo);
    const result = await svc.forceCreateBooking({ ...baseForceInput, overriddenBy: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/authorising user/i);
  });

  it("returns ok:true with booking when repo resolves", async () => {
    const booking = makeBooking();
    const manualRepo: ManualBookingRepository = {
      createManual: jest.fn(),
      forceCreate: jest.fn().mockResolvedValue(booking),
    };
    const svc = createBookingOpsService(undefined, undefined, manualRepo);
    const result = await svc.forceCreateBooking(baseForceInput);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.bookingId).toBe("bk1");
  });
});

// ---------------------------------------------------------------------------
// createBookingOpsService — loadBookingDetail
// ---------------------------------------------------------------------------

describe("bookingOpsService.loadBookingDetail", () => {
  it("returns not-configured when no detailRepo provided", async () => {
    const svc = createBookingOpsService();
    const result = await svc.loadBookingDetail("bk1", "t1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/booking detail repository not configured/i);
  });

  it("returns ok:false with 'not found' when repo returns null", async () => {
    const detailRepo: BookingDetailRepository = {
      getDetailView: jest.fn().mockResolvedValue(null),
    };
    const svc = createBookingOpsService(undefined, undefined, undefined, detailRepo);
    const result = await svc.loadBookingDetail("bk1", "t1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/booking not found/i);
  });

  it("returns ok:true with detail view when repo resolves", async () => {
    const detail = makeDetailView();
    const detailRepo: BookingDetailRepository = {
      getDetailView: jest.fn().mockResolvedValue(detail),
    };
    const svc = createBookingOpsService(undefined, undefined, undefined, detailRepo);
    const result = await svc.loadBookingDetail("bk1", "t1");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.customerName).toBe("Bob");
      expect(result.data.lifecycleEvents).toHaveLength(1);
    }
  });
});

// ---------------------------------------------------------------------------
// createBookingOpsService — markNoShow / adminCancel / adminReschedule
// ---------------------------------------------------------------------------

describe("bookingOpsService.markNoShow", () => {
  it("returns not-configured when no writeRepo provided", async () => {
    const svc = createBookingOpsService();
    const result = await svc.markNoShow({ bookingId: "bk1", tenantId: "t1", policyNote: null, penaltyApplied: false, performedBy: "owner1" });
    expect(result.ok).toBe(false);
  });

  it("returns ok:true when writeRepo resolves", async () => {
    const booking = makeBooking({ status: "no_show" });
    const writeRepo: BookingWriteRepository = {
      markNoShow: jest.fn().mockResolvedValue(booking),
      adminCancel: jest.fn(),
      adminReschedule: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, undefined, undefined, undefined, writeRepo);
    const result = await svc.markNoShow({ bookingId: "bk1", tenantId: "t1", policyNote: "First offence.", penaltyApplied: true, performedBy: "owner1" });
    expect(result.ok).toBe(true);
  });
});

describe("bookingOpsService.adminCancel", () => {
  const baseCancelInput = {
    bookingId: "bk1",
    tenantId: "t1",
    reason: "Client complained",
    feeCents: 0,
    feeCurrency: "USD",
    performedBy: "owner1",
  };

  it("returns not-configured when no writeRepo provided", async () => {
    const svc = createBookingOpsService();
    const result = await svc.adminCancel(baseCancelInput);
    expect(result.ok).toBe(false);
  });

  it("returns error when reason is empty", async () => {
    const writeRepo: BookingWriteRepository = {
      markNoShow: jest.fn(),
      adminCancel: jest.fn(),
      adminReschedule: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, undefined, undefined, undefined, writeRepo);
    const result = await svc.adminCancel({ ...baseCancelInput, reason: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/cancellation reason is required/i);
  });

  it("returns ok:true when writeRepo resolves", async () => {
    const booking = makeBooking({ status: "cancelled" });
    const writeRepo: BookingWriteRepository = {
      markNoShow: jest.fn(),
      adminCancel: jest.fn().mockResolvedValue(booking),
      adminReschedule: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, undefined, undefined, undefined, writeRepo);
    const result = await svc.adminCancel(baseCancelInput);
    expect(result.ok).toBe(true);
  });
});

describe("bookingOpsService.adminReschedule", () => {
  const baseRescheduleInput = {
    bookingId: "bk1",
    tenantId: "t1",
    newDate: "2025-06-05",
    newStartMinutes: 540,
    newEndMinutes: 600,
    newStartTime: "09:00",
    newEndTime: "10:00",
    rescheduleReason: null,
    performedBy: "owner1",
  };

  it("returns not-configured when no writeRepo provided", async () => {
    const svc = createBookingOpsService();
    const result = await svc.adminReschedule(baseRescheduleInput);
    expect(result.ok).toBe(false);
  });

  it("returns error when newDate is empty", async () => {
    const writeRepo: BookingWriteRepository = {
      markNoShow: jest.fn(),
      adminCancel: jest.fn(),
      adminReschedule: jest.fn(),
    };
    const svc = createBookingOpsService(undefined, undefined, undefined, undefined, writeRepo);
    const result = await svc.adminReschedule({ ...baseRescheduleInput, newDate: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/new date is required/i);
  });

  it("returns ok:true when writeRepo resolves", async () => {
    const booking = makeBooking({ date: "2025-06-05" });
    const writeRepo: BookingWriteRepository = {
      markNoShow: jest.fn(),
      adminCancel: jest.fn(),
      adminReschedule: jest.fn().mockResolvedValue(booking),
    };
    const svc = createBookingOpsService(undefined, undefined, undefined, undefined, writeRepo);
    const result = await svc.adminReschedule(baseRescheduleInput);
    expect(result.ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// createBookingOpsService — buildConflictResolutionOptions
// ---------------------------------------------------------------------------

describe("bookingOpsService.buildConflictResolutionOptions", () => {
  const svc = createBookingOpsService();

  it("returns empty array when no conflicts", () => {
    const opts = svc.buildConflictResolutionOptions([]);
    expect(opts).toHaveLength(0);
  });

  it("returns cancel_existing and reassign_staff for one conflict", () => {
    const conflict = {
      existingBookingId: "bk2",
      staffId: "staff1",
      date: "2025-06-01",
      startTime: "09:00",
      endTime: "10:00",
    };
    const opts = svc.buildConflictResolutionOptions([conflict]);
    expect(opts).toHaveLength(2);
    expect(opts[0].strategy).toBe("cancel_existing");
    expect(opts[1].strategy).toBe("reassign_staff");
  });

  it("pluralises label for multiple conflicts", () => {
    const conflict = {
      existingBookingId: "bk2",
      staffId: "staff1",
      date: "2025-06-01",
      startTime: "09:00",
      endTime: "10:00",
    };
    const opts = svc.buildConflictResolutionOptions([conflict, conflict]);
    expect(opts[0].label).toMatch(/2 conflicting bookings/);
  });

  it("appends offer_next_slot when next slot is provided", () => {
    const conflict = {
      existingBookingId: "bk2",
      staffId: "staff1",
      date: "2025-06-01",
      startTime: "09:00",
      endTime: "10:00",
    };
    const opts = svc.buildConflictResolutionOptions([conflict], "2025-06-01", "11:00", "12:00");
    expect(opts).toHaveLength(3);
    const next = opts.find((o) => o.strategy === "offer_next_slot");
    expect(next).toBeDefined();
    expect(next?.nextSlot?.startTime).toBe("11:00");
  });
});

// ---------------------------------------------------------------------------
// BookingCalendarScreen
// ---------------------------------------------------------------------------

const defaultCalendarProps = {
  loading: false,
  error: null,
  dayView: null,
  blockedSlots: [],
  selectedDate: "2025-06-01",
  onPrevDay: jest.fn(),
  onNextDay: jest.fn(),
  onSelectBooking: jest.fn(),
  onCreateManual: jest.fn(),
  onBlockTime: jest.fn(),
  onForceBook: jest.fn(),
  onRetry: jest.fn(),
  onBack: jest.fn(),
};

describe("BookingCalendarScreen", () => {
  it("shows loading state", () => {
    const { getByText } = render(
      <BookingCalendarScreen {...defaultCalendarProps} loading={true} />,
    );
    expect(getByText(/loading/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(
      <BookingCalendarScreen {...defaultCalendarProps} error="Calendar unavailable" />,
    );
    expect(getByText(/calendar unavailable/i)).toBeTruthy();
  });

  it("renders root testID when idle", () => {
    const { getByTestId } = render(
      <BookingCalendarScreen {...defaultCalendarProps} />,
    );
    expect(getByTestId("booking-calendar-screen")).toBeTruthy();
  });

  it("renders selected date", () => {
    const { getByTestId } = render(
      <BookingCalendarScreen {...defaultCalendarProps} />,
    );
    expect(getByTestId("selected-date")).toBeTruthy();
  });

  it("calls onPrevDay when prev button pressed", () => {
    const onPrevDay = jest.fn();
    const { getByTestId } = render(
      <BookingCalendarScreen {...defaultCalendarProps} onPrevDay={onPrevDay} />,
    );
    fireEvent.press(getByTestId("prev-day-btn"));
    expect(onPrevDay).toHaveBeenCalledTimes(1);
  });

  it("calls onNextDay when next button pressed", () => {
    const onNextDay = jest.fn();
    const { getByTestId } = render(
      <BookingCalendarScreen {...defaultCalendarProps} onNextDay={onNextDay} />,
    );
    fireEvent.press(getByTestId("next-day-btn"));
    expect(onNextDay).toHaveBeenCalledTimes(1);
  });

  it("renders staff columns and booking cards when dayView provided", () => {
    const { getByTestId } = render(
      <BookingCalendarScreen {...defaultCalendarProps} dayView={makeDayView()} />,
    );
    expect(getByTestId("staff-column-staff1")).toBeTruthy();
    expect(getByTestId("booking-card-bk1")).toBeTruthy();
  });

  it("calls onSelectBooking with bookingId when booking card pressed", () => {
    const onSelectBooking = jest.fn();
    const { getByTestId } = render(
      <BookingCalendarScreen
        {...defaultCalendarProps}
        dayView={makeDayView()}
        onSelectBooking={onSelectBooking}
      />,
    );
    fireEvent.press(getByTestId("booking-card-bk1"));
    expect(onSelectBooking).toHaveBeenCalledWith("bk1");
  });

  it("renders blocked slots section when slots provided", () => {
    const { getByTestId } = render(
      <BookingCalendarScreen {...defaultCalendarProps} blockedSlots={[makeBlockedSlot()]} />,
    );
    expect(getByTestId("blocked-slots-section")).toBeTruthy();
    expect(getByTestId("blocked-slot-slot1")).toBeTruthy();
  });

  it("calls onCreateManual when Create Manual button pressed", () => {
    const onCreateManual = jest.fn();
    const { getByTestId } = render(
      <BookingCalendarScreen {...defaultCalendarProps} onCreateManual={onCreateManual} />,
    );
    fireEvent.press(getByTestId("create-manual-btn"));
    expect(onCreateManual).toHaveBeenCalledTimes(1);
  });

  it("calls onBlockTime when Block Time button pressed", () => {
    const onBlockTime = jest.fn();
    const { getByTestId } = render(
      <BookingCalendarScreen {...defaultCalendarProps} onBlockTime={onBlockTime} />,
    );
    fireEvent.press(getByTestId("block-time-btn"));
    expect(onBlockTime).toHaveBeenCalledTimes(1);
  });

  it("calls onForceBook when Force Book button pressed", () => {
    const onForceBook = jest.fn();
    const { getByTestId } = render(
      <BookingCalendarScreen {...defaultCalendarProps} onForceBook={onForceBook} />,
    );
    fireEvent.press(getByTestId("force-book-btn"));
    expect(onForceBook).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// BookingDetailAdminScreen
// ---------------------------------------------------------------------------

const defaultDetailProps = {
  loading: false,
  error: null,
  detail: null,
  submitting: false,
  actionError: null,
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
  onReschedule: jest.fn(),
  onMarkNoShow: jest.fn(),
  onForceBook: jest.fn(),
  onRetry: jest.fn(),
  onBack: jest.fn(),
};

describe("BookingDetailAdminScreen", () => {
  it("shows loading state", () => {
    const { getByText } = render(
      <BookingDetailAdminScreen {...defaultDetailProps} loading={true} />,
    );
    expect(getByText(/loading booking/i)).toBeTruthy();
  });

  it("shows error state", () => {
    const { getByText } = render(
      <BookingDetailAdminScreen {...defaultDetailProps} error="Not found" />,
    );
    expect(getByText(/not found/i)).toBeTruthy();
  });

  it("renders root testID when idle", () => {
    const { getByTestId } = render(
      <BookingDetailAdminScreen {...defaultDetailProps} />,
    );
    expect(getByTestId("booking-detail-admin-screen")).toBeTruthy();
  });

  it("renders booking summary when detail provided", () => {
    const { getByTestId } = render(
      <BookingDetailAdminScreen {...defaultDetailProps} detail={makeDetailView()} />,
    );
    expect(getByTestId("booking-summary-card")).toBeTruthy();
  });

  it("renders action error when actionError provided", () => {
    const { getByTestId } = render(
      <BookingDetailAdminScreen {...defaultDetailProps} actionError="Something went wrong" />,
    );
    expect(getByTestId("action-error")).toBeTruthy();
  });

  it("calls onReschedule when reschedule button pressed", () => {
    const onReschedule = jest.fn();
    const { getByTestId } = render(
      <BookingDetailAdminScreen
        {...defaultDetailProps}
        detail={makeDetailView()}
        onReschedule={onReschedule}
      />,
    );
    fireEvent.press(getByTestId("reschedule-btn"));
    expect(onReschedule).toHaveBeenCalledTimes(1);
  });

  it("calls onMarkNoShow when no-show button pressed", () => {
    const onMarkNoShow = jest.fn();
    const { getByTestId } = render(
      <BookingDetailAdminScreen
        {...defaultDetailProps}
        detail={makeDetailView()}
        onMarkNoShow={onMarkNoShow}
      />,
    );
    fireEvent.press(getByTestId("no-show-btn"));
    expect(onMarkNoShow).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button pressed", () => {
    const onCancel = jest.fn();
    const { getByTestId } = render(
      <BookingDetailAdminScreen
        {...defaultDetailProps}
        detail={makeDetailView()}
        onCancel={onCancel}
      />,
    );
    fireEvent.press(getByTestId("cancel-booking-btn"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders lifecycle audit when detail provided", () => {
    const { getByTestId } = render(
      <BookingDetailAdminScreen {...defaultDetailProps} detail={makeDetailView()} />,
    );
    expect(getByTestId("lifecycle-audit")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ManualBookingScreen
// ---------------------------------------------------------------------------

const defaultManualProps = {
  staffOptions: [{ staffId: "staff1", name: "Alice" }],
  serviceOptions: [{ serviceId: "svc1", name: "Haircut" }],
  channel: "phone_in" as const,
  selectedStaffId: "",
  selectedServiceId: "",
  date: "2025-06-01",
  startTime: "09:00",
  durationMinutes: "45",
  customerName: "",
  customerPhone: "",
  notes: "",
  submitting: false,
  formError: null,
  submitError: null,
  submitSuccess: null,
  onChannelChange: jest.fn(),
  onStaffChange: jest.fn(),
  onServiceChange: jest.fn(),
  onDateChange: jest.fn(),
  onStartTimeChange: jest.fn(),
  onDurationChange: jest.fn(),
  onCustomerNameChange: jest.fn(),
  onCustomerPhoneChange: jest.fn(),
  onNotesChange: jest.fn(),
  onSubmit: jest.fn(),
  onBack: jest.fn(),
};

describe("ManualBookingScreen", () => {
  it("renders root testID", () => {
    const { getByTestId } = render(<ManualBookingScreen {...defaultManualProps} />);
    expect(getByTestId("manual-booking-screen")).toBeTruthy();
  });

  it("renders channel selector", () => {
    const { getByTestId } = render(<ManualBookingScreen {...defaultManualProps} />);
    expect(getByTestId("channel-selector")).toBeTruthy();
  });

  it("calls onChannelChange when Walk-in pressed", () => {
    const onChannelChange = jest.fn();
    const { getByTestId } = render(
      <ManualBookingScreen {...defaultManualProps} onChannelChange={onChannelChange} />,
    );
    fireEvent.press(getByTestId("channel-walkin"));
    expect(onChannelChange).toHaveBeenCalledWith("walk_in");
  });

  it("renders staff option list and calls onStaffChange on press", () => {
    const onStaffChange = jest.fn();
    const { getByTestId } = render(
      <ManualBookingScreen {...defaultManualProps} onStaffChange={onStaffChange} />,
    );
    fireEvent.press(getByTestId("staff-option-staff1"));
    expect(onStaffChange).toHaveBeenCalledWith("staff1");
  });

  it("renders service option list and calls onServiceChange on press", () => {
    const onServiceChange = jest.fn();
    const { getByTestId } = render(
      <ManualBookingScreen {...defaultManualProps} onServiceChange={onServiceChange} />,
    );
    fireEvent.press(getByTestId("service-option-svc1"));
    expect(onServiceChange).toHaveBeenCalledWith("svc1");
  });

  it("renders customer name input", () => {
    const { getByTestId } = render(<ManualBookingScreen {...defaultManualProps} />);
    expect(getByTestId("customer-name-input")).toBeTruthy();
  });

  it("shows form error when formError provided", () => {
    const { getByTestId } = render(
      <ManualBookingScreen {...defaultManualProps} formError="Name required" />,
    );
    expect(getByTestId("form-error")).toBeTruthy();
  });

  it("shows submit success when submitSuccess provided", () => {
    const { getByTestId } = render(
      <ManualBookingScreen {...defaultManualProps} submitSuccess="Booking created." />,
    );
    expect(getByTestId("submit-success")).toBeTruthy();
  });

  it("calls onSubmit when submit button pressed", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ManualBookingScreen {...defaultManualProps} onSubmit={onSubmit} />,
    );
    fireEvent.press(getByTestId("submit-btn"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// BlockTimeScreen
// ---------------------------------------------------------------------------

const defaultBlockProps = {
  staffOptions: [{ staffId: "staff1", name: "Alice" }],
  selectedStaffId: "",
  date: "2025-06-01",
  startTime: "13:00",
  endTime: "14:00",
  reason: "",
  submitting: false,
  formError: null,
  submitError: null,
  submitSuccess: null,
  onStaffChange: jest.fn(),
  onDateChange: jest.fn(),
  onStartTimeChange: jest.fn(),
  onEndTimeChange: jest.fn(),
  onReasonChange: jest.fn(),
  onSubmit: jest.fn(),
  onBack: jest.fn(),
};

describe("BlockTimeScreen", () => {
  it("renders root testID", () => {
    const { getByTestId } = render(<BlockTimeScreen {...defaultBlockProps} />);
    expect(getByTestId("block-time-screen")).toBeTruthy();
  });

  it("renders reason input", () => {
    const { getByTestId } = render(<BlockTimeScreen {...defaultBlockProps} />);
    expect(getByTestId("reason-input")).toBeTruthy();
  });

  it("calls onSubmit when submit button pressed", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <BlockTimeScreen {...defaultBlockProps} onSubmit={onSubmit} />,
    );
    fireEvent.press(getByTestId("submit-btn"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows submit success when submitSuccess provided", () => {
    const { getByTestId } = render(
      <BlockTimeScreen {...defaultBlockProps} submitSuccess="Slot blocked." />,
    );
    expect(getByTestId("submit-success")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// ForceBookScreen
// ---------------------------------------------------------------------------

const defaultForceProps = {
  staffOptions: [{ staffId: "staff1", name: "Alice" }],
  serviceOptions: [{ serviceId: "svc1", name: "Haircut" }],
  selectedStaffId: "",
  selectedServiceId: "",
  customerUserId: "",
  date: "2025-06-01",
  startTime: "09:00",
  durationMinutes: "60",
  overrideReason: "",
  submitting: false,
  formError: null,
  submitError: null,
  submitSuccess: null,
  onStaffChange: jest.fn(),
  onServiceChange: jest.fn(),
  onCustomerUserIdChange: jest.fn(),
  onDateChange: jest.fn(),
  onStartTimeChange: jest.fn(),
  onDurationChange: jest.fn(),
  onOverrideReasonChange: jest.fn(),
  onSubmit: jest.fn(),
  onBack: jest.fn(),
};

describe("ForceBookScreen", () => {
  it("renders root testID", () => {
    const { getByTestId } = render(<ForceBookScreen {...defaultForceProps} />);
    expect(getByTestId("force-book-screen")).toBeTruthy();
  });

  it("renders force-book warning card", () => {
    const { getByTestId } = render(<ForceBookScreen {...defaultForceProps} />);
    expect(getByTestId("force-book-warning")).toBeTruthy();
  });

  it("renders override reason input", () => {
    const { getByTestId } = render(<ForceBookScreen {...defaultForceProps} />);
    expect(getByTestId("override-reason-input")).toBeTruthy();
  });

  it("calls onSubmit when submit button pressed", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <ForceBookScreen {...defaultForceProps} onSubmit={onSubmit} />,
    );
    fireEvent.press(getByTestId("submit-btn"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// NoShowMarkScreen
// ---------------------------------------------------------------------------

const defaultNoShowProps = {
  booking: {
    bookingId: "bk1",
    customerName: "Bob",
    serviceName: "Haircut",
    date: "2025-06-01",
    startTime: "09:00",
  },
  policyNote: "",
  penaltyApplied: false,
  submitting: false,
  submitError: null,
  submitSuccess: null,
  onPolicyNoteChange: jest.fn(),
  onPenaltyToggle: jest.fn(),
  onConfirm: jest.fn(),
  onBack: jest.fn(),
};

describe("NoShowMarkScreen", () => {
  it("renders root testID", () => {
    const { getByTestId } = render(<NoShowMarkScreen {...defaultNoShowProps} />);
    expect(getByTestId("no-show-mark-screen")).toBeTruthy();
  });

  it("renders booking summary card", () => {
    const { getByTestId } = render(<NoShowMarkScreen {...defaultNoShowProps} />);
    expect(getByTestId("booking-summary")).toBeTruthy();
  });

  it("renders penalty toggle", () => {
    const { getByTestId } = render(<NoShowMarkScreen {...defaultNoShowProps} />);
    expect(getByTestId("penalty-toggle")).toBeTruthy();
  });

  it("calls onConfirm when confirm button pressed", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <NoShowMarkScreen {...defaultNoShowProps} onConfirm={onConfirm} />,
    );
    fireEvent.press(getByTestId("confirm-btn"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows submit success when submitSuccess provided", () => {
    const { getByTestId } = render(
      <NoShowMarkScreen {...defaultNoShowProps} submitSuccess="Marked as no-show." />,
    );
    expect(getByTestId("submit-success")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// CancellationAdminScreen
// ---------------------------------------------------------------------------

const defaultCancelProps = {
  booking: {
    bookingId: "bk1",
    customerName: "Bob",
    serviceName: "Haircut",
    date: "2025-06-01",
    startTime: "09:00",
  },
  reason: "",
  feeAmount: "",
  feeCurrency: "USD",
  submitting: false,
  formError: null,
  submitError: null,
  submitSuccess: null,
  onReasonChange: jest.fn(),
  onFeeAmountChange: jest.fn(),
  onFeeCurrencyChange: jest.fn(),
  onConfirm: jest.fn(),
  onBack: jest.fn(),
};

describe("CancellationAdminScreen", () => {
  it("renders root testID", () => {
    const { getByTestId } = render(<CancellationAdminScreen {...defaultCancelProps} />);
    expect(getByTestId("cancellation-admin-screen")).toBeTruthy();
  });

  it("renders booking summary card", () => {
    const { getByTestId } = render(<CancellationAdminScreen {...defaultCancelProps} />);
    expect(getByTestId("booking-summary")).toBeTruthy();
  });

  it("renders reason input", () => {
    const { getByTestId } = render(<CancellationAdminScreen {...defaultCancelProps} />);
    expect(getByTestId("reason-input")).toBeTruthy();
  });

  it("calls onConfirm when confirm button pressed", () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <CancellationAdminScreen {...defaultCancelProps} onConfirm={onConfirm} />,
    );
    fireEvent.press(getByTestId("confirm-btn"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows form error when formError provided", () => {
    const { getByTestId } = render(
      <CancellationAdminScreen {...defaultCancelProps} formError="Reason required." />,
    );
    expect(getByTestId("form-error")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// RescheduleAdminScreen
// ---------------------------------------------------------------------------

const defaultRescheduleProps = {
  booking: { bookingId: "bk1", customerName: "Bob", serviceName: "Haircut" },
  staffOptions: [{ staffId: "staff1", name: "Alice" }],
  selectedStaffId: "",
  newDate: "2025-06-05",
  availableSlots: [],
  selectedStartTime: "",
  rescheduleReason: "",
  conflicts: [],
  conflictOptions: [],
  slotsLoading: false,
  submitting: false,
  formError: null,
  submitError: null,
  submitSuccess: null,
  onStaffChange: jest.fn(),
  onNewDateChange: jest.fn(),
  onLoadSlots: jest.fn(),
  onSelectSlot: jest.fn(),
  onRescheduleReasonChange: jest.fn(),
  onSelectConflictStrategy: jest.fn(),
  onSubmit: jest.fn(),
  onBack: jest.fn(),
};

describe("RescheduleAdminScreen", () => {
  it("renders root testID", () => {
    const { getByTestId } = render(<RescheduleAdminScreen {...defaultRescheduleProps} />);
    expect(getByTestId("reschedule-admin-screen")).toBeTruthy();
  });

  it("renders booking summary", () => {
    const { getByTestId } = render(<RescheduleAdminScreen {...defaultRescheduleProps} />);
    expect(getByTestId("booking-summary")).toBeTruthy();
  });

  it("renders load-slots button", () => {
    const { getByTestId } = render(<RescheduleAdminScreen {...defaultRescheduleProps} />);
    expect(getByTestId("load-slots-btn")).toBeTruthy();
  });

  it("calls onLoadSlots when load slots button pressed", () => {
    const onLoadSlots = jest.fn();
    const { getByTestId } = render(
      <RescheduleAdminScreen {...defaultRescheduleProps} onLoadSlots={onLoadSlots} />,
    );
    fireEvent.press(getByTestId("load-slots-btn"));
    expect(onLoadSlots).toHaveBeenCalledTimes(1);
  });

  it("calls onSubmit when submit button pressed", () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <RescheduleAdminScreen {...defaultRescheduleProps} onSubmit={onSubmit} />,
    );
    fireEvent.press(getByTestId("submit-btn"));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("shows form error when formError provided", () => {
    const { getByTestId } = render(
      <RescheduleAdminScreen {...defaultRescheduleProps} formError="Date required." />,
    );
    expect(getByTestId("form-error")).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// routes.ts — W43 routes
// ---------------------------------------------------------------------------

describe("routes.ts — W43 booking operations routes", () => {
  const w43Names = [
    "BookingCalendar",
    "BookingDetailAdmin",
    "ManualBooking",
    "BlockTime",
    "ForceBook",
    "NoShowMark",
    "CancellationAdmin",
    "RescheduleAdmin",
  ];

  it.each(w43Names)('route "%s" exists in appRoutes', (name) => {
    const route = ROUTES.find((r) => r.name === name);
    expect(route).toBeDefined();
  });

  it("BookingCalendar has authenticated guard", () => {
    const route = ROUTES.find((r) => r.name === "BookingCalendar");
    expect(route?.guard).toBe("authenticated");
  });

  it("BookingCalendar has owner group", () => {
    const route = ROUTES.find((r) => r.name === "BookingCalendar");
    expect(route?.group).toBe("owner");
  });

  it("ManualBooking path is /owner/bookings/manual", () => {
    const route = ROUTES.find((r) => r.name === "ManualBooking");
    expect(route?.path).toBe("/owner/bookings/manual");
  });

  it("NoShowMark path is /owner/bookings/no-show", () => {
    const route = ROUTES.find((r) => r.name === "NoShowMark");
    expect(route?.path).toBe("/owner/bookings/no-show");
  });

  it("CancellationAdmin path is /owner/bookings/cancel", () => {
    const route = ROUTES.find((r) => r.name === "CancellationAdmin");
    expect(route?.path).toBe("/owner/bookings/cancel");
  });

  it("RescheduleAdmin path is /owner/bookings/reschedule", () => {
    const route = ROUTES.find((r) => r.name === "RescheduleAdmin");
    expect(route?.path).toBe("/owner/bookings/reschedule");
  });
});
