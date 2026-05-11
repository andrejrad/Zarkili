/**
 * W46 — bookingOpsAdapters (clears W43-DEBT-1)
 *
 * Real Firestore implementations for every repository port declared in
 * bookingOpsService.ts.  The five factory functions are designed to be
 * dependency-injected into createBookingOpsService() in production.
 *
 * Firestore path conventions used here:
 *   tenants/{tenantId}/bookings/{bookingId}
 *   tenants/{tenantId}/blockedSlots/{slotId}
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import type { Booking } from "../../domains/bookings/model";
import type {
  AdminBookingDetailView,
  AdminCancellationInput,
  BlockedSlot,
  CalendarBookingEntry,
  CreateBlockedSlotInput,
  ForceBookInput,
  ManualBookingInput,
  NoShowInput,
  RescheduleAdminInput,
} from "../../domains/bookings/bookingOpsModel";
import type {
  BlockedSlotRepository,
  BookingDetailRepository,
  BookingOpsCalendarRepository,
  BookingWriteRepository,
  ManualBookingRepository,
} from "./bookingOpsService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function minutesToHm(minutes: number): string {
  const h = Math.floor(minutes / 60).toString().padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function hmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

// ---------------------------------------------------------------------------
// BookingOpsCalendarRepository
// ---------------------------------------------------------------------------

export function createBookingOpsCalendarAdapter(
  db: Firestore,
): BookingOpsCalendarRepository {
  return {
    async listByLocationAndDate(tenantId, locationId, date) {
      const bookingsRef = collection(db, "tenants", tenantId, "bookings");
      const q = query(
        bookingsRef,
        where("locationId", "==", locationId),
        where("date", "==", date),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => {
        const b = d.data() as Booking;
        return {
          booking: b,
          staffName: b.staffId,        // caller enriches with real name lookup if needed
          serviceName: b.serviceId,    // caller enriches
          customerName: b.customerUserId, // caller enriches
        };
      });
    },
  };
}

// ---------------------------------------------------------------------------
// BlockedSlotRepository
// ---------------------------------------------------------------------------

export function createBlockedSlotAdapter(db: Firestore): BlockedSlotRepository {
  return {
    async createBlockedSlot(input: CreateBlockedSlotInput): Promise<BlockedSlot> {
      const ref = doc(collection(db, "tenants", input.tenantId, "blockedSlots"));
      const slotId = ref.id;
      const now = serverTimestamp();
      const data: Record<string, unknown> = {
        slotId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        staffId: input.staffId,
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        startMinutes: hmToMinutes(input.startTime),
        endMinutes: hmToMinutes(input.endTime),
        reason: input.reason,
        createdAt: now,
      };
      await setDoc(ref, data);
      const snap = await getDoc(ref);
      return snap.data() as BlockedSlot;
    },

    async deleteBlockedSlot(slotId, tenantId) {
      await deleteDoc(doc(db, "tenants", tenantId, "blockedSlots", slotId));
    },

    async listBlockedSlots(tenantId, locationId, date) {
      const q = query(
        collection(db, "tenants", tenantId, "blockedSlots"),
        where("locationId", "==", locationId),
        where("date", "==", date),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as BlockedSlot);
    },
  };
}

// ---------------------------------------------------------------------------
// ManualBookingRepository
// ---------------------------------------------------------------------------

export function createManualBookingAdapter(db: Firestore): ManualBookingRepository {
  return {
    async createManual(input: ManualBookingInput): Promise<Booking> {
      const ref = doc(collection(db, "tenants", input.tenantId, "bookings"));
      const bookingId = ref.id;
      const now = serverTimestamp();
      const startMinutes = hmToMinutes(input.startTime);
      const endMinutes = startMinutes + input.durationMinutes;
      const data = {
        bookingId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        staffId: input.staffId,
        serviceId: input.serviceId,
        customerUserId: "",
        date: input.date,
        startTime: input.startTime,
        endTime: minutesToHm(endMinutes),
        startMinutes,
        endMinutes,
        durationMinutes: input.durationMinutes,
        bufferMinutes: input.bufferMinutes ?? 0,
        status: "confirmed",
        version: 1,
        notes: input.notes ?? null,
        lifecycleEvents: [],
        channel: input.channel,
        customerName: input.customerName ?? null,
        customerPhone: input.customerPhone ?? null,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(ref, data);
      const snap = await getDoc(ref);
      return snap.data() as Booking;
    },

    async forceCreate(input: ForceBookInput): Promise<Booking> {
      const ref = doc(collection(db, "tenants", input.tenantId, "bookings"));
      const bookingId = ref.id;
      const now = serverTimestamp();
      const startMinutes = hmToMinutes(input.startTime);
      const endMinutes = startMinutes + input.durationMinutes;
      const data = {
        bookingId,
        tenantId: input.tenantId,
        locationId: input.locationId,
        staffId: input.staffId,
        serviceId: input.serviceId,
        customerUserId: input.customerUserId,
        date: input.date,
        startTime: input.startTime,
        endTime: minutesToHm(endMinutes),
        startMinutes,
        endMinutes,
        durationMinutes: input.durationMinutes,
        bufferMinutes: 0,
        status: "confirmed",
        version: 1,
        notes: input.overrideReason ?? null,
        lifecycleEvents: [],
        forced: true,
        forceOverrideReason: input.overrideReason,
        createdAt: now,
        updatedAt: now,
      };
      await setDoc(ref, data);
      const snap = await getDoc(ref);
      return snap.data() as Booking;
    },
  };
}

// ---------------------------------------------------------------------------
// BookingDetailRepository
// ---------------------------------------------------------------------------

export function createBookingDetailAdapter(
  db: Firestore,
): BookingDetailRepository {
  return {
    async getDetailView(
      bookingId: string,
      tenantId: string,
    ): Promise<AdminBookingDetailView | null> {
      const snap = await getDoc(
        doc(db, "tenants", tenantId, "bookings", bookingId),
      );
      if (!snap.exists()) return null;
      const b = snap.data() as Booking;
      const detail: AdminBookingDetailView = {
        booking: b,
        staffName: b.staffId,
        serviceName: b.serviceId,
        customerName: (b as Record<string, unknown>)["customerName"] as string ?? "",
        customerEmail: "",
        customerPhone: (b as Record<string, unknown>)["customerPhone"] as string | null ?? null,
        pastBookingsCount: 0,
        totalSpendCents: 0,
        lifecycleEvents: b.lifecycleEvents ?? [],
      };
      return detail;
    },
  };
}

// ---------------------------------------------------------------------------
// BookingWriteRepository
// ---------------------------------------------------------------------------

export function createBookingWriteAdapter(db: Firestore): BookingWriteRepository {
  return {
    async markNoShow(input: NoShowInput): Promise<Booking> {
      const ref = doc(db, "tenants", input.tenantId, "bookings", input.bookingId);
      await updateDoc(ref, {
        status: "no_show",
        noShowPolicyNote: input.policyNote ?? null,
        noShowPenaltyApplied: input.penaltyApplied ?? false,
        version: (await getDoc(ref).then((s) => (s.data() as Booking).version)) + 1,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      return snap.data() as Booking;
    },

    async adminCancel(input: AdminCancellationInput): Promise<Booking> {
      const ref = doc(db, "tenants", input.tenantId, "bookings", input.bookingId);
      const cur = (await getDoc(ref)).data() as Booking;
      await updateDoc(ref, {
        status: "cancelled",
        cancellationReason: input.reason,
        cancellationFeeAmountCents: input.feeCents ?? 0,
        cancellationFeeCurrency: input.feeCurrency ?? "USD",
        version: cur.version + 1,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      return snap.data() as Booking;
    },

    async adminReschedule(input: RescheduleAdminInput): Promise<Booking> {
      const ref = doc(db, "tenants", input.tenantId, "bookings", input.bookingId);
      const cur = (await getDoc(ref)).data() as Booking;
      const startMinutes = hmToMinutes(input.newStartTime);
      const endMinutes = startMinutes + cur.durationMinutes;
      await updateDoc(ref, {
        status: "rescheduled",
        staffId: cur.staffId,
        date: input.newDate,
        startTime: input.newStartTime,
        endTime: minutesToHm(endMinutes),
        startMinutes,
        endMinutes,
        rescheduleReason: input.rescheduleReason ?? null,
        version: cur.version + 1,
        updatedAt: serverTimestamp(),
      });
      const snap = await getDoc(ref);
      return snap.data() as Booking;
    },
  };
}

// ---------------------------------------------------------------------------
// Convenience: build a fully-wired CalendarBookingEntry from a raw Booking row
// ---------------------------------------------------------------------------

export function toCalendarEntry(
  b: Booking,
  staffName: string,
  serviceName: string,
  customerName: string,
): CalendarBookingEntry {
  return {
    bookingId: b.bookingId,
    staffId: b.staffId,
    staffName,
    serviceId: b.serviceId,
    serviceName,
    customerName,
    date: b.date,
    startTime: b.startTime,
    endTime: b.endTime,
    startMinutes: b.startMinutes,
    endMinutes: b.endMinutes,
    durationMinutes: b.durationMinutes,
    status: b.status,
  };
}
