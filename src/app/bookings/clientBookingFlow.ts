/**
 * clientBookingFlow.ts
 *
 * Orchestrates the multi-step client booking flow:
 *
 *   1. loadLocations   — list active tenant locations
 *   2. loadServices    — list services available at the chosen location
 *   3. loadTechnicians — list staff qualified for the chosen service
 *   4. loadSlots       — compute available time slots for chosen date + staff
 *   5. reserveSlot     — atomically create the booking
 *
 * The service is pure orchestration; all persistence goes through the
 * injected repository/service dependencies.
 */

import type { BookingService } from "./bookingService";
import type { Location } from "../../domains/locations/model";
import type { LocationRepository } from "../../domains/locations/repository";
import type { Service } from "../../domains/services/model";
import type { ServiceRepository } from "../../domains/services/repository";
import type { StaffMember } from "../../domains/staff/model";
import type { StaffRepository } from "../../domains/staff/repository";
import type { AvailableSlot } from "../../domains/bookings/slotEngine";
import type { Booking } from "../../domains/bookings/model";
import { BookingError } from "../../domains/bookings/model";

export type ClientBookingFlowDeps = {
  locationRepository: LocationRepository;
  serviceRepository: ServiceRepository;
  staffRepository: StaffRepository;
  bookingService: BookingService;
};

export type BookingFlowSelection = {
  tenantId: string;
  location: Location | null;
  service: Service | null;
  technician: StaffMember | null;
  date: string | null;
  slot: AvailableSlot | null;
};

export type LoadLocationsResult =
  | { ok: true; locations: Location[] }
  | { ok: false; message: string };

export type LoadServicesResult =
  | { ok: true; services: Service[] }
  | { ok: false; message: string };

export type LoadTechniciansResult =
  | { ok: true; technicians: StaffMember[] }
  | { ok: false; message: string };

export type LoadSlotsResult =
  | { ok: true; slots: AvailableSlot[] }
  | { ok: false; message: string };

export type ReserveSlotResult =
  | { ok: true; booking: Booking }
  | { ok: false; code: "SLOT_UNAVAILABLE" | "ERROR"; message: string };

export function createClientBookingFlow({
  locationRepository,
  serviceRepository,
  staffRepository,
  bookingService,
}: ClientBookingFlowDeps) {
  async function loadLocations(tenantId: string): Promise<LoadLocationsResult> {
    try {
      const all = await locationRepository.listTenantLocations(tenantId);
      const active = all.filter((loc) => loc.status === "active");
      return { ok: true, locations: active };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }

  async function loadServices(
    tenantId: string,
    locationId: string,
  ): Promise<LoadServicesResult> {
    try {
      const all = await serviceRepository.listServicesByLocation(tenantId, locationId);
      const active = all.filter((svc) => svc.active);
      return { ok: true, services: active };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }

  async function loadTechnicians(
    tenantId: string,
    locationId: string,
    serviceId: string,
  ): Promise<LoadTechniciansResult> {
    try {
      const all = await staffRepository.listServiceQualifiedStaff(
        tenantId,
        locationId,
        serviceId,
      );
      const active = all.filter((s) => s.status === "active");
      return { ok: true, technicians: active };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }

  async function loadSlots(
    tenantId: string,
    staffId: string,
    locationId: string,
    date: string,
    service: Service,
  ): Promise<LoadSlotsResult> {
    try {
      const slots = await bookingService.getAvailableSlots({
        tenantId,
        staffId,
        locationId,
        date,
        serviceDurationMinutes: service.durationMinutes,
        bufferMinutes: service.bufferMinutes,
      });
      return { ok: true, slots };
    } catch (err) {
      return { ok: false, message: errorMessage(err) };
    }
  }

  async function reserveSlot(
    selection: {
      tenantId: string;
      customerUserId: string;
      location: Location;
      service: Service;
      technician: StaffMember;
      date: string;
      slot: AvailableSlot;
      notes?: string | null;
    },
  ): Promise<ReserveSlotResult> {
    const { tenantId, location, service, technician, date, slot, customerUserId } = selection;

    try {
      const booking = await bookingService.reserveSlot({
        tenantId,
        locationId: location.locationId,
        staffId: technician.staffId,
        serviceId: service.serviceId,
        customerUserId,
        date,
        startMinutes: slot.startMinutes,
        endMinutes: slot.endMinutes,
        startTime: slot.startTime,
        endTime: slot.endTime,
        durationMinutes: service.durationMinutes,
        bufferMinutes: service.bufferMinutes,
        notes: selection.notes ?? null,
      });

      return { ok: true, booking };
    } catch (err) {
      if (err instanceof BookingError && err.code === "SLOT_UNAVAILABLE") {
        return { ok: false, code: "SLOT_UNAVAILABLE", message: "This slot is no longer available." };
      }
      return { ok: false, code: "ERROR", message: errorMessage(err) };
    }
  }

  return {
    loadLocations,
    loadServices,
    loadTechnicians,
    loadSlots,
    reserveSlot,
  };
}

export type ClientBookingFlow = ReturnType<typeof createClientBookingFlow>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
}

// ---------------------------------------------------------------------------
// Date utility: generate the next N bookable days starting from today
// ---------------------------------------------------------------------------

export function generateBookableDates(fromDate: Date, count: number): string[] {
  const dates: string[] = [];
  const cursor = new Date(fromDate);
  while (dates.length < count) {
    const iso = toIsoDate(cursor);
    dates.push(iso);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
