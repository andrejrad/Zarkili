export type {
  Booking,
  BookingLifecycleEvent,
  BookingStatus,
  BookingActorRole,
  BookingErrorCode,
  CreateBookingInput,
  UpdateBookingStatusInput,
} from "./model";
export {
  BookingError,
  assertValidStatusTransition,
  BOOKING_STATUS_TRANSITIONS,
  ACTOR_TRANSITION_PERMISSIONS,
} from "./model";

export type { AvailableSlot, GenerateSlotsInput } from "./slotEngine";
export { generateSlots, timeToMinutes, minutesToTime, dateToWeekday } from "./slotEngine";

export type { BookedInterval, ProposedInterval } from "./conflictChecker";
export { hasConflict } from "./conflictChecker";

export { createBookingsRepository } from "./repository";
export type { BookingsRepository } from "./repository";
