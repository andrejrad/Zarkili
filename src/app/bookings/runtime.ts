/**
 * bookings/runtime.ts — W36-B
 *
 * Wires the clientBookingFlow with real Firestore-backed repositories so the
 * consumer booking wizard (bookingFlowStep state machine in AppNavigatorShell)
 * reads live data instead of falling back to the no-op stub.
 */

import { createBookingsRepository } from "../../domains/bookings/repository";
import { createLocationRepository } from "../../domains/locations";
import { createServiceRepository } from "../../domains/services";
import {
  createStaffRepository,
  createStaffSchedulesRepository,
} from "../../domains/staff";
import { db } from "../../shared/config/firebase";

import { createBookingService } from "./bookingService";
import { createClientBookingFlow } from "./clientBookingFlow";

export const bookingsRepository = createBookingsRepository(db);
const staffSchedulesRepository = createStaffSchedulesRepository(db);
const bookingService = createBookingService(staffSchedulesRepository, bookingsRepository);

const locationRepository = createLocationRepository(db);
const serviceRepository = createServiceRepository(db);
const staffRepository = createStaffRepository(db);

export const appClientBookingFlow = createClientBookingFlow({
  locationRepository,
  serviceRepository,
  staffRepository,
  bookingService,
});
