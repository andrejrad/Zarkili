/**
 * consumerNotificationService.ts — W37 consumer-side notifications wiring.
 *
 * Firestore layout:
 *   clients/{userId}/notifications/{notifId}  — NotificationItem docs
 *   clients/{userId}/notificationPrefs/prefs  — NotificationPreferences singleton
 */

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import type { PushTokenRecord } from "./registerFcmToken";

import type {
  NotificationItem,
  NotificationPreferences,
} from "../messaging/messagingHelpers";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../messaging/messagingHelpers";

// ---------------------------------------------------------------------------
// Service type
// ---------------------------------------------------------------------------

export type ConsumerNotificationService = {
  /**
   * Real-time listener for a user's notifications.
   * Calls `onUpdate` on each change. Returns unsubscribe function.
   */
  subscribeToNotifications(
    userId: string,
    onUpdate: (items: NotificationItem[]) => void,
  ): () => void;

  /** Mark a single notification as read. */
  markRead(userId: string, notificationId: string): Promise<void>;

  /** Fetch persisted notification preferences. Returns defaults if not yet set. */
  getPreferences(userId: string): Promise<NotificationPreferences>;

  /** Persist notification preferences for a user. */
  updatePreferences(userId: string, prefs: NotificationPreferences): Promise<void>;

  /**
   * Persist a device push token under `clients/{userId}/devices/{deviceId}`.
   * Called by registerFcmToken after obtaining the native token.
   */
  savePushToken(userId: string, deviceId: string, record: PushTokenRecord): Promise<void>;
};

// ---------------------------------------------------------------------------
// Firestore paths
// ---------------------------------------------------------------------------

function notifCol(db: Firestore, userId: string) {
  return collection(db, "clients", userId, "notifications");
}

function prefsDocRef(db: Firestore, userId: string) {
  return doc(db, "clients", userId, "notificationPrefs", "prefs");
}

// ---------------------------------------------------------------------------
// Adapter
// ---------------------------------------------------------------------------

function docToNotificationItem(
  id: string,
  data: Record<string, unknown>,
): NotificationItem {
  return {
    id,
    category: (data.category as NotificationItem["category"] | undefined) ?? "system",
    title: (data.title as string | undefined) ?? "",
    preview: (data.preview as string | undefined) ?? "",
    receivedAt:
      data.receivedAt &&
      typeof (data.receivedAt as { toDate?: () => Date }).toDate === "function"
        ? (data.receivedAt as { toDate: () => Date }).toDate().toISOString()
        : (data.receivedAt as string | undefined) ?? new Date().toISOString(),
    isRead: (data.isRead as boolean | undefined) ?? false,
    deepLinkRoute: (data.deepLinkRoute as string | undefined) ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createConsumerNotificationService(db: Firestore): ConsumerNotificationService {
  function subscribeToNotifications(
    userId: string,
    onUpdate: (items: NotificationItem[]) => void,
  ): () => void {
    const q = query(notifCol(db, userId), orderBy("receivedAt", "desc"));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) =>
        docToNotificationItem(d.id, d.data() as Record<string, unknown>),
      );
      onUpdate(items);
    });
  }

  async function markRead(userId: string, notificationId: string): Promise<void> {
    const ref = doc(notifCol(db, userId), notificationId);
    await updateDoc(ref, { isRead: true });
  }

  async function getPreferences(userId: string): Promise<NotificationPreferences> {
    const snap = await getDoc(prefsDocRef(db, userId));
    if (!snap.exists()) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    return snap.data() as NotificationPreferences;
  }

  async function updatePreferences(
    userId: string,
    prefs: NotificationPreferences,
  ): Promise<void> {
    await setDoc(prefsDocRef(db, userId), prefs, { merge: true });
  }

  async function savePushToken(
    userId: string,
    deviceId: string,
    record: PushTokenRecord,
  ): Promise<void> {
    await setDoc(
      doc(db, "clients", userId, "devices", deviceId),
      record,
      { merge: true },
    );
  }

  return { subscribeToNotifications, markRead, getPreferences, updatePreferences, savePushToken };
}
