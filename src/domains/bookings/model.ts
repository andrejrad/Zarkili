import { Timestamp } from "firebase/firestore";

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected"
  | "no_show"
  | "reschedule_pending"
  | "reschedule_rejected"
  | "rescheduled";

export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending:             ["confirmed", "cancelled", "rejected"],
  confirmed:           ["completed", "cancelled", "no_show", "reschedule_pending"],
  reschedule_pending:  ["rescheduled", "reschedule_rejected", "cancelled"],
  reschedule_rejected: ["confirmed", "cancelled"],
  rescheduled:         ["completed", "cancelled", "no_show"],
  cancelled:           [],
  completed:           [],
  rejected:            [],
  no_show:             [],
};

export type BookingActorRole = "client" | "tenant_admin" | "location_manager" | "technician";

/**
 * Defines which actor roles may perform each transition.
 * tenant_admin is omitted from inline lists and handled as a wildcard in
 * assertValidStatusTransition — admins may perform any structurally valid transition.
 */
export const ACTOR_TRANSITION_PERMISSIONS: Partial<
  Record<BookingStatus, Partial<Record<BookingStatus, BookingActorRole[]>>>
> = {
  pending: {
    confirmed:           ["tenant_admin", "location_manager"],
    cancelled:           ["tenant_admin", "location_manager", "client"],
    rejected:            ["tenant_admin", "location_manager"],
  },
  confirmed: {
    completed:           ["tenant_admin", "location_manager", "technician"],
    cancelled:           ["tenant_admin", "location_manager", "client"],
    no_show:             ["tenant_admin", "location_manager", "technician"],
    reschedule_pending:  ["tenant_admin", "location_manager", "client"],
  },
  reschedule_pending: {
    rescheduled:         ["tenant_admin", "location_manager"],
    reschedule_rejected: ["tenant_admin", "location_manager"],
    cancelled:           ["tenant_admin", "location_manager", "client"],
  },
  reschedule_rejected: {
    confirmed:           ["tenant_admin", "location_manager", "client"],
    cancelled:           ["tenant_admin", "location_manager", "client"],
  },
  rescheduled: {
    completed:           ["tenant_admin", "location_manager", "technician"],
    cancelled:           ["tenant_admin", "location_manager", "client"],
    no_show:             ["tenant_admin", "location_manager", "technician"],
  },
};

export type BookingLifecycleEvent = {
  status: BookingStatus;
  actor: BookingActorRole | "system";
  reason: string | null;
  occurredAt: Timestamp;
};

export type Booking = {
  bookingId: string;
  tenantId: string;
  locationId: string;
  staffId: string;
  serviceId: string;
  customerUserId: string;
  date: string;         // YYYY-MM-DD
  startMinutes: number; // minutes since midnight
  endMinutes: number;   // startMinutes + durationMinutes (buffer NOT included)
  startTime: string;    // HH:mm
  endTime: string;      // HH:mm
  durationMinutes: number;
  bufferMinutes: number;
  status: BookingStatus;
  version: number;      // incremented on every status transition for optimistic locking
  notes: string | null;
  lifecycleEvents: BookingLifecycleEvent[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type CreateBookingInput = Omit<Booking, "bookingId" | "status" | "createdAt" | "updatedAt" | "version" | "lifecycleEvents">;

export type UpdateBookingStatusInput = {
  bookingId: string;
  tenantId: string;
  status: BookingStatus;
  actor?: BookingActorRole;
  /** Human-readable reason — required for rejected/cancelled, optional otherwise */
  reason?: string | null;
  /** If provided, the repository will reject the write if the stored version differs (optimistic lock) */
  expectedVersion?: number;
};

export type BookingErrorCode =
  | "SLOT_UNAVAILABLE"
  | "BOOKING_NOT_FOUND"
  | "BOOKING_SCOPE_MISMATCH"
  | "INVALID_STATUS_TRANSITION"
  | "UNAUTHORIZED_TRANSITION"
  | "STALE_WRITE";

export class BookingError extends Error {
  constructor(
    public readonly code: BookingErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "BookingError";
  }
}

export function assertValidStatusTransition(
  from: BookingStatus,
  to: BookingStatus,
  actor?: BookingActorRole,
): void {
  const allowed = BOOKING_STATUS_TRANSITIONS[from];
  if (!allowed.includes(to)) {
    throw new BookingError(
      "INVALID_STATUS_TRANSITION",
      `Cannot transition booking from '${from}' to '${to}'`,
    );
  }

  if (actor !== undefined) {
    const permittedActors = ACTOR_TRANSITION_PERMISSIONS[from]?.[to];
    if (!permittedActors || !permittedActors.includes(actor)) {
      throw new BookingError(
        "UNAUTHORIZED_TRANSITION",
        `Actor '${actor}' is not permitted to transition booking from '${from}' to '${to}'`,
      );
    }
  }
}
