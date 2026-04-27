/**
 * bookingTriggers.ts
 *
 * Cloud Function trigger for booking status transitions.
 *
 * Responsibilities:
 *   1. Dispatch a NotificationEvent to the `notificationEvents` collection.
 *   2. Denormalise nextAppointmentAt / nextAppointmentServiceName on the
 *      UserTenantAccess document so the Multi-Salon Dashboard can show the
 *      next upcoming appointment without a separate query.
 *
 * Design
 * ──────
 * • Pure handler function `handleBookingWrite` — all business logic lives here
 *   so it can be unit-tested without the Cloud Functions runtime.
 * • Thin `onBookingWritten` export wraps it via onDocumentUpdated.
 * • Idempotency marker written to `processedBookingEvents/{eventId}` before
 *   side-effects so duplicate trigger invocations are no-ops.
 *
 * Composite index required in Firestore for next-appointment re-query:
 *   Collection: bookings
 *   Fields:     tenantId ASC, customerUserId ASC, status ASC, date ASC, startMinutes ASC
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

if (getApps().length === 0) {
  initializeApp();
}

// ---------------------------------------------------------------------------
// Minimal Booking shape (mirrored from src/domains/bookings/model.ts)
// ---------------------------------------------------------------------------

type BookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "rejected"
  | "no_show"
  | "reschedule_pending"
  | "reschedule_rejected"
  | "rescheduled";

export type TriggerBooking = {
  bookingId: string;
  tenantId: string;
  locationId: string;
  staffId: string;
  serviceId: string;
  customerUserId: string;
  /** YYYY-MM-DD */
  date: string;
  /** Minutes since midnight */
  startMinutes: number;
  status: BookingStatus;
  /** Incremented on every status transition — used as idempotency component */
  version: number;
  notes?: string | null;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Statuses indicating the customer has an active upcoming appointment */
const UPCOMING_STATUSES: BookingStatus[] = ["confirmed", "rescheduled"];

/** Statuses that definitively end the active appointment lifecycle */
const TERMINAL_STATUSES: BookingStatus[] = ["cancelled", "rejected", "completed", "no_show"];

/** Booking statuses that map to a notification event type */
const STATUS_TO_EVENT_TYPE: Partial<Record<BookingStatus, string>> = {
  confirmed: "booking_confirmed",
  rescheduled: "booking_rescheduled",
  cancelled: "booking_cancelled",
  rejected: "booking_rejected",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildEventId(bookingId: string, status: BookingStatus, version: number): string {
  return `${bookingId}_${status}_v${version}`;
}

function bookingDateToTimestamp(date: string, startMinutes: number): Timestamp {
  const [year, month, day] = date.split("-").map(Number);
  const hours = Math.floor(startMinutes / 60);
  const minutes = startMinutes % 60;
  return Timestamp.fromDate(new Date(year, month - 1, day, hours, minutes, 0, 0));
}

async function lookupServiceName(
  serviceId: string,
  db: FirebaseFirestore.Firestore,
): Promise<string> {
  const snap = await db.collection("services").doc(serviceId).get();
  if (!snap.exists) return serviceId;
  const data = snap.data() as { name?: string };
  return data?.name ?? serviceId;
}

/**
 * Queries for the nearest future confirmed booking for a customer in a tenant.
 * Returns null if none exists.
 *
 * Requires composite Firestore index:
 *   tenantId ASC, customerUserId ASC, status ASC, date ASC, startMinutes ASC
 */
async function findNextConfirmedBooking(
  tenantId: string,
  customerUserId: string,
  db: FirebaseFirestore.Firestore,
): Promise<{ date: string; startMinutes: number; serviceId: string } | null> {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const snap = await db
    .collection("bookings")
    .where("tenantId", "==", tenantId)
    .where("customerUserId", "==", customerUserId)
    .where("status", "==", "confirmed")
    .where("date", ">=", today)
    .orderBy("date", "asc")
    .orderBy("startMinutes", "asc")
    .limit(1)
    .get();

  if (snap.empty) return null;
  const d = snap.docs[0].data() as TriggerBooking;
  return { date: d.date, startMinutes: d.startMinutes, serviceId: d.serviceId };
}

// ---------------------------------------------------------------------------
// Pure handler (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Core trigger logic — receives Firestore document data directly so tests can
 * call it without the Cloud Functions runtime.
 *
 * @param before  Document data before the write (null if this is a creation)
 * @param after   Document data after the write
 * @param db      Admin SDK Firestore instance
 */
export async function handleBookingWrite(
  before: TriggerBooking | null,
  after: TriggerBooking,
  db: FirebaseFirestore.Firestore,
): Promise<void> {
  const beforeStatus = before?.status ?? null;
  const afterStatus = after.status;

  // Only react to status transitions
  if (beforeStatus === afterStatus) return;

  const eventId = buildEventId(after.bookingId, afterStatus, after.version);

  // ── Idempotency ──────────────────────────────────────────────────────────
  const idempotencyRef = db.collection("processedBookingEvents").doc(eventId);
  const idempotencySnap = await idempotencyRef.get();
  if (idempotencySnap.exists) return; // already processed

  // Write marker before side-effects — if the function crashes after this the
  // retry won't re-process.
  await idempotencyRef.set({
    eventId,
    bookingId: after.bookingId,
    status: afterStatus,
    processedAt: FieldValue.serverTimestamp(),
  });

  // ── Routing ──────────────────────────────────────────────────────────────
  if (UPCOMING_STATUSES.includes(afterStatus)) {
    await handleUpcomingTransition(before, after, afterStatus as BookingStatus, eventId, db);
  } else if (TERMINAL_STATUSES.includes(afterStatus)) {
    await handleTerminalTransition(after, afterStatus as BookingStatus, eventId, db);
  }
}

// ---------------------------------------------------------------------------
// Transition handlers
// ---------------------------------------------------------------------------

async function handleUpcomingTransition(
  before: TriggerBooking | null,
  after: TriggerBooking,
  afterStatus: BookingStatus,
  eventId: string,
  db: FirebaseFirestore.Firestore,
): Promise<void> {
  const serviceName = await lookupServiceName(after.serviceId, db);
  const appointmentAt = bookingDateToTimestamp(after.date, after.startMinutes);
  const eventType = STATUS_TO_EVENT_TYPE[afterStatus] ?? afterStatus;

  const notificationEvent: Record<string, unknown> = {
    eventId,
    eventType,
    tenantId: after.tenantId,
    locationId: after.locationId,
    recipients: [{ userId: after.customerUserId, channel: "in_app" }],
    locale: "en",
    payload: {
      eventType,
      bookingId: after.bookingId,
      tenantId: after.tenantId,
      locationId: after.locationId,
      customerUserId: after.customerUserId,
      date: after.date,
      startMinutes: after.startMinutes,
      serviceName,
      staffName: after.staffId,
      ...(afterStatus === "rescheduled" && before != null
        ? { previousDate: before.date, previousStartMinutes: before.startMinutes }
        : {}),
    },
    createdAt: new Date().toISOString(),
  };

  const userTenantRef = db
    .collection("userTenantAccess")
    .doc(`${after.customerUserId}_${after.tenantId}`);

  await Promise.all([
    db.collection("notificationEvents").doc(eventId).set(notificationEvent),
    userTenantRef
      .update({
        nextAppointmentAt: appointmentAt,
        nextAppointmentServiceName: serviceName,
        updatedAt: FieldValue.serverTimestamp(),
      })
      .catch(() => {
        // UserTenantAccess may not exist yet for new customers; non-fatal
        console.warn(`[bookingTriggers] userTenantAccess not found for ${after.customerUserId}_${after.tenantId}`);
      }),
  ]);
}

async function handleTerminalTransition(
  after: TriggerBooking,
  afterStatus: BookingStatus,
  eventId: string,
  db: FirebaseFirestore.Firestore,
): Promise<void> {
  // Re-query for the next upcoming appointment after the terminal event
  const next = await findNextConfirmedBooking(after.tenantId, after.customerUserId, db);

  let nextAppointmentAt: Timestamp | null = null;
  let nextAppointmentServiceName: string | null = null;

  if (next) {
    const serviceName = await lookupServiceName(next.serviceId, db);
    nextAppointmentAt = bookingDateToTimestamp(next.date, next.startMinutes);
    nextAppointmentServiceName = serviceName;
  }

  const userTenantRef = db
    .collection("userTenantAccess")
    .doc(`${after.customerUserId}_${after.tenantId}`);

  const ops: Promise<unknown>[] = [
    userTenantRef
      .update({
        nextAppointmentAt,
        nextAppointmentServiceName,
        updatedAt: FieldValue.serverTimestamp(),
      })
      .catch(() => {
        console.warn(`[bookingTriggers] userTenantAccess not found for ${after.customerUserId}_${after.tenantId}`);
      }),
  ];

  // Dispatch notification event for statuses that have a mapped type
  const eventType = STATUS_TO_EVENT_TYPE[afterStatus];
  if (eventType) {
    const notificationEvent = {
      eventId,
      eventType,
      tenantId: after.tenantId,
      locationId: after.locationId,
      recipients: [{ userId: after.customerUserId, channel: "in_app" }],
      locale: "en",
      payload: {
        eventType,
        bookingId: after.bookingId,
        tenantId: after.tenantId,
        locationId: after.locationId,
        customerUserId: after.customerUserId,
        date: after.date,
        startMinutes: after.startMinutes,
        serviceName: after.serviceId, // serviceId as fallback — terminal events don't re-lookup
        staffName: after.staffId,
        reason: after.notes ?? null,
      },
      createdAt: new Date().toISOString(),
    };
    ops.push(db.collection("notificationEvents").doc(eventId).set(notificationEvent));
  }

  await Promise.all(ops);
}

// ---------------------------------------------------------------------------
// Cloud Function export
// ---------------------------------------------------------------------------

export const onBookingWritten = onDocumentUpdated(
  "bookings/{bookingId}",
  async (event) => {
    const db = getFirestore();

    const before = event.data?.before?.data() as TriggerBooking | undefined;
    const after = event.data?.after?.data() as TriggerBooking | undefined;

    if (!after) return; // deletion — not handled

    await handleBookingWrite(before ?? null, after, db);
  },
);
