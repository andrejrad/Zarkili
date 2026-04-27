/**
 * scheduledReminders.ts
 *
 * Daily scheduled Cloud Function that scans confirmed bookings falling within
 * a 24-hour reminder window and dispatches `reminder_due` notification events.
 *
 * Responsibilities
 * ─────────────────
 * 1. Query confirmed bookings whose dates cover the possible reminder window
 *    across all UTC offsets.
 * 2. Convert each booking's local datetime to UTC using the tenant's IANA
 *    timezone (via the Intl API — no external library dependency).
 * 3. Filter to bookings in the [now + 23 h, now + 25 h] window.
 * 4. Skip if a send log already exists for that booking (idempotency).
 * 5. Respect user opt-in preferences (`userNotificationPreferences` collection).
 * 6. Write a `reminder_due` NotificationEvent and a send-log document
 *    atomically via a Firestore batch.
 *
 * The pure handler `runReminderScan(now, db)` accepts a `now` Date so it can
 * be unit-tested without mocking the system clock.
 *
 * Composite Firestore index required
 * ────────────────────────────────────
 *   Collection : bookings
 *   Fields     : status ASC, date ASC
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";

if (getApps().length === 0) {
  initializeApp();
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Lead time in hours before the appointment to send the reminder */
const REMINDER_LEAD_H = 24;
/** Half-width of the scan window — absorbs clock drift, re-run jitter, and
 *  DST edge cases from the single-step offset correction */
const WINDOW_HALF_H = 1;

// ---------------------------------------------------------------------------
// Minimal types (mirrored locally — no cross-package import from src/)
// ---------------------------------------------------------------------------

type TriggerBooking = {
  bookingId: string;
  tenantId: string;
  locationId: string;
  staffId: string;
  serviceId: string;
  customerUserId: string;
  /** YYYY-MM-DD */
  date: string;
  /** Minutes since midnight (local time in tenant timezone) */
  startMinutes: number;
  status: string;
};

type StoredPreferences = {
  reminderEnabled: boolean;
  channels: {
    in_app: boolean;
    email: boolean;
    push: boolean;
  };
};

type NotificationChannel = "in_app" | "email" | "push";

// ---------------------------------------------------------------------------
// Timezone-aware UTC conversion
// ---------------------------------------------------------------------------

/**
 * Converts a booking's local date + startMinutes to a UTC millisecond
 * timestamp, accounting for the tenant's IANA timezone.
 *
 * Algorithm: single-step offset correction via the Intl API.
 *   1. Treat the desired local time as if it were UTC (naïve UTC guess).
 *   2. Ask Intl.DateTimeFormat what the tenant timezone shows at that instant.
 *   3. Compute the difference (offsetMs = localShown − naïveUTC).
 *   4. Return naïveUTC − offsetMs.
 *
 * Accuracy: exact for fixed-offset timezones; within 1–2 minutes near DST
 * boundaries — well inside the ±1 h scan window.
 *
 * @param date         YYYY-MM-DD booking date
 * @param startMinutes Minutes since midnight (local time)
 * @param timezone     IANA timezone identifier, e.g. "Europe/Zagreb"
 */
export function appointmentUtcMs(
  date: string,
  startMinutes: number,
  timezone: string,
): number {
  const hours = Math.floor(startMinutes / 60);
  const mins = startMinutes % 60;
  const [y, mo, d] = date.split("-").map(Number);

  // Step 1: naïve UTC — treat the local time as if it were UTC
  const naiveUtcMs = Date.UTC(y, mo - 1, d, hours, mins, 0, 0);

  // Step 2: what does the tenant timezone show for that naïve UTC instant?
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(naiveUtcMs));

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0");

  // "What does the local clock show" at naiveUtcMs
  const localAtNaiveMs = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
  );

  // offsetMs > 0 means timezone is ahead of UTC (e.g. UTC+2 → +7200000)
  const offsetMs = localAtNaiveMs - naiveUtcMs;

  // Corrected UTC = desired local time − offset
  return naiveUtcMs - offsetMs;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildEventId(bookingId: string): string {
  return `${bookingId}_reminder_24h`;
}

async function getTenantTimezone(
  tenantId: string,
  db: FirebaseFirestore.Firestore,
  cache: Map<string, string>,
): Promise<string> {
  const hit = cache.get(tenantId);
  if (hit !== undefined) return hit;
  const snap = await db.collection("tenants").doc(tenantId).get();
  const tz: string = snap.exists
    ? ((snap.data() as { timezone?: string }).timezone ?? "UTC")
    : "UTC";
  cache.set(tenantId, tz);
  return tz;
}

async function getUserPreferences(
  userId: string,
  tenantId: string,
  db: FirebaseFirestore.Firestore,
): Promise<StoredPreferences> {
  const prefId = `${userId}_${tenantId}`;
  const snap = await db.collection("userNotificationPreferences").doc(prefId).get();
  if (!snap.exists) {
    // Default: opt-in with in_app only
    return { reminderEnabled: true, channels: { in_app: true, email: false, push: false } };
  }
  return snap.data() as StoredPreferences;
}

function resolveActiveChannels(prefs: StoredPreferences): NotificationChannel[] {
  const out: NotificationChannel[] = [];
  if (prefs.channels.in_app) out.push("in_app");
  if (prefs.channels.email) out.push("email");
  if (prefs.channels.push) out.push("push");
  return out;
}

// ---------------------------------------------------------------------------
// Public result type
// ---------------------------------------------------------------------------

export type ReminderScanResult = {
  scanned: number;
  sent: number;
  skipped: number;
};

// ---------------------------------------------------------------------------
// Pure scan handler (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Core reminder scan logic.
 *
 * Accepts an explicit `now` Date so tests can control the clock without
 * patching globals.
 */
export async function runReminderScan(
  now: Date,
  db: FirebaseFirestore.Firestore,
): Promise<ReminderScanResult> {
  const nowMs = now.getTime();
  const windowStartMs = nowMs + (REMINDER_LEAD_H - WINDOW_HALF_H) * 60 * 60 * 1000;
  const windowEndMs = nowMs + (REMINDER_LEAD_H + WINDOW_HALF_H) * 60 * 60 * 1000;

  // Date range to query — expands by 14 h in each direction to cover all UTC
  // offsets (UTC−12 to UTC+14), ensuring no booking slips through the date filter.
  const dateMin = toDateStr(new Date(windowStartMs - 14 * 60 * 60 * 1000));
  const dateMax = toDateStr(new Date(windowEndMs + 14 * 60 * 60 * 1000));

  const snap = await db
    .collection("bookings")
    .where("status", "==", "confirmed")
    .where("date", ">=", dateMin)
    .where("date", "<=", dateMax)
    .get();

  const bookings = snap.docs.map((d) => d.data() as TriggerBooking);
  const timezoneCache = new Map<string, string>();
  let sent = 0;
  let skipped = 0;

  for (const booking of bookings) {
    // 1. Compute UTC appointment time in the tenant's timezone
    const timezone = await getTenantTimezone(booking.tenantId, db, timezoneCache);
    const apptMs = appointmentUtcMs(booking.date, booking.startMinutes, timezone);

    // 2. Reject bookings outside the reminder window
    if (apptMs < windowStartMs || apptMs > windowEndMs) {
      skipped++;
      continue;
    }

    // 3. Idempotency — skip if the send log already exists
    const eventId = buildEventId(booking.bookingId);
    const logRef = db.collection("reminderSendLogs").doc(eventId);
    const logSnap = await logRef.get();
    if (logSnap.exists) {
      skipped++;
      continue;
    }

    // 4. User opt-in preferences
    const prefs = await getUserPreferences(booking.customerUserId, booking.tenantId, db);
    if (!prefs.reminderEnabled) {
      skipped++;
      continue;
    }
    const channels = resolveActiveChannels(prefs);
    if (channels.length === 0) {
      skipped++;
      continue;
    }

    // 5. Build notification event
    const appointmentAt = new Date(apptMs).toISOString();
    const notificationEvent = {
      eventId,
      eventType: "reminder_due",
      tenantId: booking.tenantId,
      locationId: booking.locationId,
      recipients: channels.map((channel) => ({
        userId: booking.customerUserId,
        channel,
      })),
      locale: "en",
      payload: {
        eventType: "reminder_due",
        bookingId: booking.bookingId,
        tenantId: booking.tenantId,
        locationId: booking.locationId,
        customerUserId: booking.customerUserId,
        date: booking.date,
        startMinutes: booking.startMinutes,
        serviceName: booking.serviceId, // serviceId used as fallback; caller can resolve display name
        staffName: booking.staffId,
        appointmentAt,
      },
      createdAt: now.toISOString(),
    };

    // 6. Atomically write event + send log
    const batch = db.batch();
    batch.set(
      db.collection("notificationEvents").doc(eventId),
      notificationEvent,
    );
    batch.set(logRef, {
      logId: eventId,
      bookingId: booking.bookingId,
      tenantId: booking.tenantId,
      customerUserId: booking.customerUserId,
      channels,
      sentAt: FieldValue.serverTimestamp(),
      status: "sent",
    });
    await batch.commit();

    sent++;
  }

  return { scanned: bookings.length, sent, skipped };
}

// ---------------------------------------------------------------------------
// Cloud Function export — runs daily at 01:00 UTC
// ---------------------------------------------------------------------------

export const dailyBookingReminders = onSchedule(
  { schedule: "0 1 * * *", timeZone: "UTC" },
  async () => {
    const db = getFirestore();
    const result = await runReminderScan(new Date(), db);
    console.info("[dailyBookingReminders] scan complete", result);
  },
);
