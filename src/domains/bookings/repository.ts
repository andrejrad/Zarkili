import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import {
  assertValidStatusTransition,
  BookingError,
  type Booking,
  type BookingActorRole,
  type BookingStatus,
  type CreateBookingInput,
  type UpdateBookingStatusInput,
} from "./model";

const COLLECTION = "bookings";
const SLOT_TOKENS_COLLECTION = "bookingSlotTokens";

function buildSlotTokenId(
  tenantId: string,
  staffId: string,
  date: string,
  startMinutes: number,
): string {
  return `${tenantId}_${staffId}_${date}_${startMinutes}`;
}

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

export function createBookingsRepository(db: Firestore) {
  /**
   * Atomically reserves a booking slot using a slot-token document as a mutex.
   *
   * Strategy:
   *   1. Begin a Firestore transaction.
   *   2. Check whether a slot token document already exists for
   *      {tenantId}_{staffId}_{date}_{startMinutes}.
   *   3. If the token exists → throw BookingError("SLOT_UNAVAILABLE").
   *   4. If clear → write the token doc + the booking doc in the same commit.
   *
   * Two concurrent callers racing for the same slot will land in conflict via
   * Firestore's optimistic locking — only the first commit wins; the second
   * transaction retries and then sees the token, throwing SLOT_UNAVAILABLE.
   */
  async function createBookingAtomically(input: CreateBookingInput): Promise<Booking> {
    assertNonEmpty(input.tenantId, "tenantId");
    assertNonEmpty(input.staffId, "staffId");
    assertNonEmpty(input.locationId, "locationId");
    assertNonEmpty(input.serviceId, "serviceId");
    assertNonEmpty(input.customerUserId, "customerUserId");
    assertNonEmpty(input.date, "date");

    const bookingId = `${input.tenantId}_${input.customerUserId}_${Date.now()}`;
    const slotTokenId = buildSlotTokenId(
      input.tenantId,
      input.staffId,
      input.date,
      input.startMinutes,
    );
    const slotTokenRef = doc(db, SLOT_TOKENS_COLLECTION, slotTokenId);
    const bookingRef = doc(db, COLLECTION, bookingId);

    await runTransaction(db, async (tx) => {
      const slotTokenSnap = await tx.get(slotTokenRef);
      if (slotTokenSnap.exists()) {
        throw new BookingError(
          "SLOT_UNAVAILABLE",
          `Slot ${slotTokenId} is already reserved`,
        );
      }

      const now = serverTimestamp();
      tx.set(slotTokenRef, {
        bookingId,
        tenantId: input.tenantId,
        staffId: input.staffId,
        date: input.date,
        startMinutes: input.startMinutes,
        createdAt: now,
      });
      tx.set(bookingRef, {
        bookingId,
        ...input,
        status: "pending" as BookingStatus,
        version: 0,
        lifecycleEvents: [],
        createdAt: now,
        updatedAt: now,
      });
    });

    const snap = await getDoc(bookingRef);
    return snap.data() as Booking;
  }

  async function getBookingById(
    bookingId: string,
    tenantId: string,
  ): Promise<Booking | null> {
    assertNonEmpty(bookingId, "bookingId");
    assertNonEmpty(tenantId, "tenantId");

    const ref = doc(db, COLLECTION, bookingId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const booking = snap.data() as Booking;
    if (booking.tenantId !== tenantId) return null; // cross-tenant guard
    return booking;
  }

  async function listBookingsByStaffAndDate(
    tenantId: string,
    staffId: string,
    date: string,
  ): Promise<Booking[]> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(staffId, "staffId");
    assertNonEmpty(date, "date");

    const col = collection(db, COLLECTION);
    const q = query(
      col,
      where("tenantId", "==", tenantId),
      where("staffId", "==", staffId),
      where("date", "==", date),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as Booking)
      .filter((b) => b.status !== "cancelled");
  }

  async function listBookingsByLocationAndDate(
    tenantId: string,
    locationId: string,
    date: string,
  ): Promise<Booking[]> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(locationId, "locationId");
    assertNonEmpty(date, "date");

    const col = collection(db, COLLECTION);
    const q = query(
      col,
      where("tenantId", "==", tenantId),
      where("locationId", "==", locationId),
      where("date", "==", date),
    );
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => d.data() as Booking)
      .filter((b) => b.status !== "cancelled");
  }

  async function listBookingsByCustomer(
    tenantId: string,
    customerUserId: string,
  ): Promise<Booking[]> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(customerUserId, "customerUserId");

    const col = collection(db, COLLECTION);
    const q = query(
      col,
      where("tenantId", "==", tenantId),
      where("customerUserId", "==", customerUserId),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Booking);
  }

  /**
   * Transitions a booking to a new status.
   *
   * Optimistic locking: if `expectedVersion` is provided and does not match the
   * stored version the write is rejected with STALE_WRITE, preventing lost-update
   * races between concurrent callers that both read the same prior state.
   *
   * Audit trail: every successful transition appends a BookingLifecycleEvent.
   *
   * Slot token cleanup: token is released on 'cancelled' and 'rescheduled' so
   * the slot becomes bookable again.
   */
  async function updateBookingStatus(input: UpdateBookingStatusInput): Promise<void> {
    assertNonEmpty(input.bookingId, "bookingId");
    assertNonEmpty(input.tenantId, "tenantId");

    const ref = doc(db, COLLECTION, input.bookingId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new BookingError("BOOKING_NOT_FOUND", `Booking ${input.bookingId} not found`);
    }

    const booking = snap.data() as Booking;
    if (booking.tenantId !== input.tenantId) {
      throw new BookingError("BOOKING_NOT_FOUND", `Booking ${input.bookingId} not found`);
    }

    if (input.expectedVersion !== undefined && booking.version !== input.expectedVersion) {
      throw new BookingError(
        "STALE_WRITE",
        `Booking ${input.bookingId} has been modified (expected version ${input.expectedVersion}, got ${booking.version})`,
      );
    }

    assertValidStatusTransition(booking.status, input.status, input.actor);

    const lifecycleEvent = {
      status: input.status,
      actor: input.actor ?? "system",
      reason: input.reason ?? null,
      occurredAt: serverTimestamp(),
    };

    await updateDoc(ref, {
      status: input.status,
      version: booking.version + 1,
      lifecycleEvents: arrayUnion(lifecycleEvent),
      updatedAt: serverTimestamp(),
    });

    if (input.status === "cancelled" || input.status === "rescheduled") {
      const slotTokenId = buildSlotTokenId(
        booking.tenantId,
        booking.staffId,
        booking.date,
        booking.startMinutes,
      );
      const tokenRef = doc(db, SLOT_TOKENS_COLLECTION, slotTokenId);
      await deleteDoc(tokenRef);
    }
  }

  // ---------------------------------------------------------------------------
  // Named write methods (delegate to updateBookingStatus with actor + scope checks)
  // ---------------------------------------------------------------------------

  function assertTenantScope(booking: Booking, tenantId: string): void {
    if (booking.tenantId !== tenantId) {
      throw new BookingError(
        "BOOKING_SCOPE_MISMATCH",
        `Booking ${booking.bookingId} does not belong to tenant ${tenantId}`,
      );
    }
  }

  async function resolveBooking(bookingId: string, tenantId: string): Promise<Booking> {
    assertNonEmpty(bookingId, "bookingId");
    assertNonEmpty(tenantId, "tenantId");
    const ref = doc(db, COLLECTION, bookingId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new BookingError("BOOKING_NOT_FOUND", `Booking ${bookingId} not found`);
    }
    const booking = snap.data() as Booking;
    assertTenantScope(booking, tenantId);
    return booking;
  }

  async function confirmBooking(
    bookingId: string,
    tenantId: string,
    actor: BookingActorRole,
    reason?: string,
  ): Promise<void> {
    await resolveBooking(bookingId, tenantId);
    return updateBookingStatus({ bookingId, tenantId, status: "confirmed", actor, reason: reason ?? null });
  }

  async function rejectBooking(
    bookingId: string,
    tenantId: string,
    actor: BookingActorRole,
    reason: string,
  ): Promise<void> {
    if (!reason || reason.trim().length === 0) {
      throw new Error("reason is required when rejecting a booking");
    }
    await resolveBooking(bookingId, tenantId);
    return updateBookingStatus({ bookingId, tenantId, status: "rejected", actor, reason });
  }

  async function cancelBooking(
    bookingId: string,
    tenantId: string,
    actor: BookingActorRole,
    reason: string,
  ): Promise<void> {
    if (!reason || reason.trim().length === 0) {
      throw new Error("reason is required when cancelling a booking");
    }
    await resolveBooking(bookingId, tenantId);
    return updateBookingStatus({ bookingId, tenantId, status: "cancelled", actor, reason });
  }

  async function markCompleted(
    bookingId: string,
    tenantId: string,
    actor: BookingActorRole,
  ): Promise<void> {
    await resolveBooking(bookingId, tenantId);
    return updateBookingStatus({ bookingId, tenantId, status: "completed", actor });
  }

  async function markNoShow(
    bookingId: string,
    tenantId: string,
    actor: BookingActorRole,
  ): Promise<void> {
    await resolveBooking(bookingId, tenantId);
    return updateBookingStatus({ bookingId, tenantId, status: "no_show", actor });
  }

  /**
   * Lists bookings for a tenant filtered by one or more statuses, with optional
   * location and date filters for the admin booking queue.
   *
   * Firestore composite index required: tenantId + status + (optional) locationId / date.
   * For the 'in' operator on status, Firestore supports up to 10 values — well within range.
   */
  async function listBookingsByStatus(
    tenantId: string,
    statuses: BookingStatus[],
    options: { locationId?: string; date?: string } = {},
  ): Promise<Booking[]> {
    assertNonEmpty(tenantId, "tenantId");
    if (statuses.length === 0) return [];

    const col = collection(db, COLLECTION);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const constraints: any[] = [where("tenantId", "==", tenantId)];

    if (statuses.length === 1) {
      constraints.push(where("status", "==", statuses[0]));
    } else {
      constraints.push(where("status", "in", statuses));
    }

    if (options.locationId) {
      constraints.push(where("locationId", "==", options.locationId));
    }

    if (options.date) {
      constraints.push(where("date", "==", options.date));
    }

    const q = query(col, ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as Booking);
  }

  return {
    createBookingAtomically,
    getBookingById,
    listBookingsByStaffAndDate,
    listBookingsByLocationAndDate,
    listBookingsByCustomer,
    listBookingsByStatus,
    updateBookingStatus,
    confirmBooking,
    rejectBooking,
    cancelBooking,
    markCompleted,
    markNoShow,
  };
}

export type BookingsRepository = ReturnType<typeof createBookingsRepository>;
