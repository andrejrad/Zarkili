import { generateSlots } from "../../domains/bookings/slotEngine";
import type { AvailableSlot } from "../../domains/bookings/slotEngine";
import type { Booking, CreateBookingInput } from "../../domains/bookings/model";
import type { BookingsRepository } from "../../domains/bookings/repository";
import type { StaffSchedulesRepository } from "../../domains/staff/staffSchedulesRepository";

type GetAvailableSlotsInput = {
  tenantId: string;
  staffId: string;
  locationId: string;
  date: string; // YYYY-MM-DD
  serviceDurationMinutes: number;
  bufferMinutes: number;
};

export function createBookingService(
  schedulesRepository: StaffSchedulesRepository,
  bookingsRepository: BookingsRepository,
) {
  async function getAvailableSlots(input: GetAvailableSlotsInput): Promise<AvailableSlot[]> {
    const schedule = await schedulesRepository.getScheduleTemplate(
      input.tenantId,
      input.staffId,
      input.locationId,
    );
    if (!schedule) return [];

    const existingBookings = await bookingsRepository.listBookingsByStaffAndDate(
      input.tenantId,
      input.staffId,
      input.date,
    );

    return generateSlots({
      schedule,
      date: input.date,
      existingBookings: existingBookings.map((b) => ({
        startMinutes: b.startMinutes,
        endMinutes: b.endMinutes,
        bufferMinutes: b.bufferMinutes,
      })),
      serviceDurationMinutes: input.serviceDurationMinutes,
      bufferMinutes: input.bufferMinutes,
    });
  }

  async function reserveSlot(input: CreateBookingInput): Promise<Booking> {
    return bookingsRepository.createBookingAtomically(input);
  }

  async function listStaffBookingsForDate(
    tenantId: string,
    staffId: string,
    date: string,
  ): Promise<Booking[]> {
    return bookingsRepository.listBookingsByStaffAndDate(tenantId, staffId, date);
  }

  async function listLocationBookingsForDate(
    tenantId: string,
    locationId: string,
    date: string,
  ): Promise<Booking[]> {
    return bookingsRepository.listBookingsByLocationAndDate(tenantId, locationId, date);
  }

  async function cancelBooking(bookingId: string, tenantId: string): Promise<void> {
    return bookingsRepository.updateBookingStatus({
      bookingId,
      tenantId,
      status: "cancelled",
    });
  }

  return {
    getAvailableSlots,
    reserveSlot,
    listStaffBookingsForDate,
    listLocationBookingsForDate,
    cancelBooking,
  };
}

export type BookingService = ReturnType<typeof createBookingService>;
