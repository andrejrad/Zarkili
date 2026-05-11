/**
 * registerFcmToken.ts — W37-DEBT-3
 *
 * Requests push notification permission and retrieves the device push token
 * (FCM on Android, APNs on iOS via Expo). Returns a `PushTokenRecord` that
 * the caller can persist via `ConsumerNotificationService.savePushToken()`.
 *
 * Design:
 *   - getDevicePushToken()  — pure native side: permissions + token
 *   - registerFcmToken()    — convenience wrapper used from AppNavigatorShell
 *
 * Keeps Firestore concerns in ConsumerNotificationService where the db reference lives.
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

export type PushTokenRecord = {
  token: string;
  platform: "ios" | "android" | "web" | "other";
  /** ISO timestamp of last registration */
  registeredAt: string;
};

/**
 * Request permission and get the native push token.
 * Returns null if device is a simulator, permission is denied, or an error occurs.
 */
export async function getDevicePushToken(): Promise<{
  token: string;
  deviceId: string;
  record: PushTokenRecord;
} | null> {
  try {
    // Simulators cannot receive push notifications.
    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") return null;

    // On Android, a notification channel must exist before notifications can be shown.
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Zarkili",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const { data: token } = await Notifications.getDevicePushTokenAsync();

    const platform: PushTokenRecord["platform"] =
      Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "other";

    // Stable device identifier — used as the Firestore doc ID so re-registration is idempotent.
    const deviceId = Device.modelId ?? `${platform}-${token.slice(-8)}`;

    const record: PushTokenRecord = {
      token,
      platform,
      registeredAt: new Date().toISOString(),
    };

    return { token, deviceId, record };
  } catch {
    return null;
  }
}
