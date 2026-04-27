/**
 * notificationEventModel.ts
 *
 * Defines the notification event contract used by Cloud Function triggers to
 * communicate booking lifecycle changes toward the notification delivery layer.
 *
 *   NotificationEvent  — discriminated union over all event types
 *   validateNotificationEvent — throws NotificationEventValidationError on bad input
 *
 * Design notes
 * ─────────────
 * • Events are written by Cloud Functions and read by notification workers.
 * • createdAt is an ISO-8601 string rather than a Firestore Timestamp so
 *   events can be serialised to JSON and forwarded to external services.
 * • Each event carries enough payload for templates without a secondary DB
 *   lookup (denormalised at write time).
 */

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export type NotificationEventType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_rejected"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "reminder_due";

export const ALL_NOTIFICATION_EVENT_TYPES: NotificationEventType[] = [
  "booking_created",
  "booking_confirmed",
  "booking_rejected",
  "booking_cancelled",
  "booking_rescheduled",
  "reminder_due",
];

// ---------------------------------------------------------------------------
// Recipients
// ---------------------------------------------------------------------------

export type NotificationChannel = "in_app" | "email" | "push";

export type NotificationRecipient = {
  userId: string;
  channel: NotificationChannel;
};

// ---------------------------------------------------------------------------
// Event payloads
// ---------------------------------------------------------------------------

/** Shared fields present in every booking-related payload */
type BookingPayloadBase = {
  bookingId: string;
  tenantId: string;
  locationId: string;
  customerUserId: string;
  /** YYYY-MM-DD */
  date: string;
  /** Minutes from midnight (e.g. 9 * 60 = 540 for 09:00) */
  startMinutes: number;
  /** Display name of the service, e.g. "Haircut" */
  serviceName: string;
  /** Display name of the staff member */
  staffName: string;
};

export type BookingCreatedPayload = BookingPayloadBase & {
  eventType: "booking_created";
};

export type BookingConfirmedPayload = BookingPayloadBase & {
  eventType: "booking_confirmed";
};

export type BookingRejectedPayload = BookingPayloadBase & {
  eventType: "booking_rejected";
  reason: string | null;
};

export type BookingCancelledPayload = BookingPayloadBase & {
  eventType: "booking_cancelled";
  reason: string | null;
};

export type BookingRescheduledPayload = BookingPayloadBase & {
  eventType: "booking_rescheduled";
  /** Previous date (YYYY-MM-DD) */
  previousDate: string;
  /** Previous start minutes */
  previousStartMinutes: number;
};

export type ReminderDuePayload = BookingPayloadBase & {
  eventType: "reminder_due";
  /** ISO-8601 datetime of the appointment */
  appointmentAt: string;
};

export type NotificationEventPayload =
  | BookingCreatedPayload
  | BookingConfirmedPayload
  | BookingRejectedPayload
  | BookingCancelledPayload
  | BookingRescheduledPayload
  | ReminderDuePayload;

// ---------------------------------------------------------------------------
// Root event envelope
// ---------------------------------------------------------------------------

export type NotificationEvent = {
  /** Unique event ID (UUID v4 recommended) */
  eventId: string;
  eventType: NotificationEventType;
  tenantId: string;
  locationId: string;
  recipients: NotificationRecipient[];
  /** BCP-47 locale tag, e.g. "en", "sl" */
  locale: string;
  payload: NotificationEventPayload;
  /** ISO-8601 timestamp */
  createdAt: string;
};

// ---------------------------------------------------------------------------
// Validation error
// ---------------------------------------------------------------------------

export class NotificationEventValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotificationEventValidationError";
  }
}

// ---------------------------------------------------------------------------
// Validator helpers (intentionally minimal — no third-party schema library)
// ---------------------------------------------------------------------------

function isNonEmptyString(v: unknown, field: string): string {
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new NotificationEventValidationError(`${field} must be a non-empty string`);
  }
  return v;
}

function isNonNegativeInteger(v: unknown, field: string): number {
  if (typeof v !== "number" || !Number.isInteger(v) || v < 0) {
    throw new NotificationEventValidationError(
      `${field} must be a non-negative integer`,
    );
  }
  return v;
}

function isStringOrNull(v: unknown, field: string): string | null {
  if (v !== null && typeof v !== "string") {
    throw new NotificationEventValidationError(`${field} must be a string or null`);
  }
  return v as string | null;
}

function isIsoDateString(v: unknown, field: string): string {
  isNonEmptyString(v, field);
  const d = new Date(v as string);
  if (isNaN(d.getTime())) {
    throw new NotificationEventValidationError(`${field} must be a valid ISO-8601 date string`);
  }
  return v as string;
}

function validateRecipient(r: unknown, index: number): NotificationRecipient {
  if (typeof r !== "object" || r === null) {
    throw new NotificationEventValidationError(`recipients[${index}] must be an object`);
  }
  const rec = r as Record<string, unknown>;
  const userId = isNonEmptyString(rec.userId, `recipients[${index}].userId`);
  const VALID_CHANNELS: NotificationChannel[] = ["in_app", "email", "push"];
  if (!VALID_CHANNELS.includes(rec.channel as NotificationChannel)) {
    throw new NotificationEventValidationError(
      `recipients[${index}].channel must be one of: ${VALID_CHANNELS.join(", ")}`,
    );
  }
  return { userId, channel: rec.channel as NotificationChannel };
}

function validateBookingPayloadBase(
  payload: Record<string, unknown>,
  prefix: string,
): BookingPayloadBase {
  return {
    bookingId: isNonEmptyString(payload.bookingId, `${prefix}.bookingId`),
    tenantId: isNonEmptyString(payload.tenantId, `${prefix}.tenantId`),
    locationId: isNonEmptyString(payload.locationId, `${prefix}.locationId`),
    customerUserId: isNonEmptyString(payload.customerUserId, `${prefix}.customerUserId`),
    date: isNonEmptyString(payload.date, `${prefix}.date`),
    startMinutes: isNonNegativeInteger(payload.startMinutes, `${prefix}.startMinutes`),
    serviceName: isNonEmptyString(payload.serviceName, `${prefix}.serviceName`),
    staffName: isNonEmptyString(payload.staffName, `${prefix}.staffName`),
  };
}

function validatePayload(
  payload: unknown,
  eventType: NotificationEventType,
): NotificationEventPayload {
  if (typeof payload !== "object" || payload === null) {
    throw new NotificationEventValidationError("payload must be an object");
  }
  const p = payload as Record<string, unknown>;
  const base = validateBookingPayloadBase(p, "payload");

  switch (eventType) {
    case "booking_created":
      return { ...base, eventType: "booking_created" };

    case "booking_confirmed":
      return { ...base, eventType: "booking_confirmed" };

    case "booking_rejected":
      return {
        ...base,
        eventType: "booking_rejected",
        reason: isStringOrNull(p.reason, "payload.reason"),
      };

    case "booking_cancelled":
      return {
        ...base,
        eventType: "booking_cancelled",
        reason: isStringOrNull(p.reason, "payload.reason"),
      };

    case "booking_rescheduled":
      return {
        ...base,
        eventType: "booking_rescheduled",
        previousDate: isNonEmptyString(p.previousDate, "payload.previousDate"),
        previousStartMinutes: isNonNegativeInteger(
          p.previousStartMinutes,
          "payload.previousStartMinutes",
        ),
      };

    case "reminder_due":
      return {
        ...base,
        eventType: "reminder_due",
        appointmentAt: isIsoDateString(p.appointmentAt, "payload.appointmentAt"),
      };
  }
}

// ---------------------------------------------------------------------------
// Public validator
// ---------------------------------------------------------------------------

/**
 * Validates a raw (unknown) value as a NotificationEvent.
 *
 * Returns a strongly-typed NotificationEvent on success.
 * Throws NotificationEventValidationError with a descriptive message on failure.
 */
export function validateNotificationEvent(raw: unknown): NotificationEvent {
  if (typeof raw !== "object" || raw === null) {
    throw new NotificationEventValidationError("event must be an object");
  }
  const e = raw as Record<string, unknown>;

  const eventId = isNonEmptyString(e.eventId, "eventId");

  if (!ALL_NOTIFICATION_EVENT_TYPES.includes(e.eventType as NotificationEventType)) {
    throw new NotificationEventValidationError(
      `eventType must be one of: ${ALL_NOTIFICATION_EVENT_TYPES.join(", ")}`,
    );
  }
  const eventType = e.eventType as NotificationEventType;

  const tenantId = isNonEmptyString(e.tenantId, "tenantId");
  const locationId = isNonEmptyString(e.locationId, "locationId");
  const locale = isNonEmptyString(e.locale, "locale");
  const createdAt = isIsoDateString(e.createdAt, "createdAt");

  if (!Array.isArray(e.recipients) || e.recipients.length === 0) {
    throw new NotificationEventValidationError(
      "recipients must be a non-empty array",
    );
  }
  const recipients = (e.recipients as unknown[]).map((r, i) => validateRecipient(r, i));

  const payload = validatePayload(e.payload, eventType);

  return { eventId, eventType, tenantId, locationId, recipients, locale, payload, createdAt };
}
