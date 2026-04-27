/**
 * waitlistNotificationService.ts
 *
 * Handles the "slot opened" → "notify waitlist" automation (Task 7.4).
 *
 * Flow:
 *   1. Caller invokes handleSlotOpened({ tenantId, locationId, serviceId, staffId, date, slotId })
 *   2. Service queries waitlist for matching active entries
 *   3. For each candidate (FCFS order):
 *        a. Check throttle log: skip if already notified in the last throttleCooldownMs
 *        b. Send notification via the injected NotificationSender
 *        c. Write throttle log to Firestore
 *        d. Update entry.lastNotifiedAt
 *        e. If markMatchedOnFirst is true: mark first candidate as "matched" and stop
 *   4. Return summary { notified, skipped, errors }
 *
 * Throttle log: stored at waitlistNotificationLogs/{logKey}
 *   where logKey = `${entryId}_${tenantId}_${slotId}`
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import type { WaitlistRepository } from "../../domains/waitlist/repository";
import type { WaitlistMatchCandidate } from "../../domains/waitlist/model";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SlotOpenedEvent = {
  tenantId: string;
  locationId: string;
  serviceId: string;
  staffId: string;
  /** ISO date string "YYYY-MM-DD" */
  date: string;
  /** The booking slot document ID that became available */
  slotId: string;
};

export type NotificationPayload = {
  userId: string;
  tenantId: string;
  title: string;
  body: string;
  data: Record<string, string>;
};

export type NotificationSender = {
  sendNotification(payload: NotificationPayload): Promise<void>;
};

export type HandleSlotOpenedResult = {
  notified: number;
  skipped: number;
  errors: number;
};

export type WaitlistNotificationServiceOptions = {
  /** Maximum candidates to process per event (default: 20) */
  maxCandidatesPerEvent?: number;
  /**
   * Minimum ms between notifications to the same entry for the same slot.
   * Default: 24 hours.
   */
  throttleCooldownMs?: number;
  /**
   * If true, mark the first notified candidate as "matched" and stop processing.
   * If false, notify all matching candidates.
   * Default: false (notify all).
   */
  markMatchedOnFirst?: boolean;
};

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

export type WaitlistNotificationService = {
  handleSlotOpened(event: SlotOpenedEvent): Promise<HandleSlotOpenedResult>;
};

const LOG_COLLECTION = "waitlistNotificationLogs";
const DEFAULT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createWaitlistNotificationService(
  db: Firestore,
  waitlistRepository: WaitlistRepository,
  notificationSender: NotificationSender,
  options: WaitlistNotificationServiceOptions = {},
): WaitlistNotificationService {
  const maxCandidates = options.maxCandidatesPerEvent ?? 20;
  const cooldownMs = options.throttleCooldownMs ?? DEFAULT_COOLDOWN_MS;
  const markMatchedOnFirst = options.markMatchedOnFirst ?? false;

  function buildLogKey(entryId: string, slotId: string): string {
    return `${entryId}_${slotId}`;
  }

  async function isThrottled(
    entryId: string,
    slotId: string,
    nowMs: number,
  ): Promise<boolean> {
    const logKey = buildLogKey(entryId, slotId);
    const logRef = doc(db, LOG_COLLECTION, logKey);
    const snap = await getDoc(logRef);
    if (!snap.exists()) return false;
    const data = snap.data() as { sentAt: number };
    return nowMs - data.sentAt < cooldownMs;
  }

  async function writeThrottleLog(
    entryId: string,
    slotId: string,
    nowMs: number,
  ): Promise<void> {
    const logKey = buildLogKey(entryId, slotId);
    const logRef = doc(db, LOG_COLLECTION, logKey);
    await setDoc(logRef, { entryId, slotId, sentAt: nowMs });
  }

  function buildNotification(
    candidate: WaitlistMatchCandidate,
    event: SlotOpenedEvent,
  ): NotificationPayload {
    return {
      userId: candidate.userId,
      tenantId: event.tenantId,
      title: "A slot is available!",
      body: `A booking slot opened for your waitlisted service on ${event.date}.`,
      data: {
        type: "waitlist_slot_available",
        slotId: event.slotId,
        serviceId: event.serviceId,
        locationId: event.locationId,
        date: event.date,
        waitlistEntryId: candidate.entryId,
      },
    };
  }

  async function handleSlotOpened(event: SlotOpenedEvent): Promise<HandleSlotOpenedResult> {
    const { tenantId, locationId, serviceId, staffId, date, slotId } = event;
    const nowMs = Date.now();

    const candidates = await waitlistRepository.findMatchingWaitlistEntries(
      tenantId,
      locationId,
      serviceId,
      staffId,
      date,
      maxCandidates,
    );

    let notified = 0;
    let skipped = 0;
    let errors = 0;

    for (const candidate of candidates) {
      try {
        const throttled = await isThrottled(candidate.entryId, slotId, nowMs);
        if (throttled) {
          skipped++;
          continue;
        }

        await notificationSender.sendNotification(buildNotification(candidate, event));
        await writeThrottleLog(candidate.entryId, slotId, nowMs);
        await waitlistRepository.updateLastNotifiedAt(
          candidate.entryId,
          tenantId,
          new Date(nowMs).toISOString(),
        );

        notified++;

        if (markMatchedOnFirst) {
          await waitlistRepository.markMatched(candidate.entryId, tenantId, slotId);
          break;
        }
      } catch {
        errors++;
      }
    }

    return { notified, skipped, errors };
  }

  return { handleSlotOpened };
}
