/**
 * notificationPreferencesModel.ts
 *
 * Defines the user notification preferences model stored in Firestore under
 * `userNotificationPreferences/{userId}_{tenantId}`.
 *
 * Used by:
 *   - Client app to read/write user preferences
 *   - Cloud Function reminder scanner to decide which channels to use and
 *     whether to send at all
 */

import { Timestamp } from "firebase/firestore";

import type { SupportedLanguage } from "../../shared/i18n";

export type NotificationChannel = "in_app" | "email" | "push";

export type NotificationChannelFlags = {
  in_app: boolean;
  email: boolean;
  push: boolean;
};

export type UserNotificationPreferences = {
  /** `${userId}_${tenantId}` */
  prefId: string;
  userId: string;
  tenantId: string;
  /** Master switch — when false, no reminders are sent regardless of channel flags */
  reminderEnabled: boolean;
  channels: NotificationChannelFlags;
  /** Hours before appointment to send the reminder (default: 24) */
  reminderLeadHours: number;
  /**
   * Preferred notification language for this user+tenant pair.
   * null → fall back to the tenant's defaultLanguage, then "en".
   */
  language: SupportedLanguage | null;
  updatedAt: Timestamp;
};

export type CreateNotificationPreferencesInput = Omit<
  UserNotificationPreferences,
  "prefId" | "updatedAt"
>;

/**
 * Default preferences applied when no document exists for a user+tenant pair.
 * Only in_app is enabled by default; email and push require explicit opt-in.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Omit<
  UserNotificationPreferences,
  "prefId" | "userId" | "tenantId" | "updatedAt"
> = {
  reminderEnabled: true,
  channels: {
    in_app: true,
    email: false,
    push: false,
  },
  reminderLeadHours: 24,
  language: null,
};
