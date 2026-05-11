/**
 * PermissionsGate.tsx — W32 Batch L
 *
 * Reusable full-screen (or inline card) shown when a required OS permission
 * has been denied and the user must go to Settings to re-enable it.
 *
 * Props:
 *   permissionType   — "camera"|"photos"|"contacts"|"calendar"|"location"|"notifications"
 *   variant?         — "screen" (fills space) | "card" (compact inline card)
 *   onOpenSettings   — opens OS Settings deep link
 *   onDismiss?       — "Maybe later" — only rendered when provided
 *   testID
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type PermissionType =
  | "camera"
  | "photos"
  | "contacts"
  | "calendar"
  | "location"
  | "notifications";

export type PermissionsGateProps = {
  permissionType: PermissionType;
  variant?: "screen" | "card";
  onOpenSettings: () => void;
  onDismiss?: () => void;
  testID?: string;
};

const META: Record<PermissionType, { icon: string; title: string; reason: string }> = {
  camera: {
    icon: "📷",
    title: "Camera access needed",
    reason:
      "Zarkili needs camera access to let you upload profile photos and share looks.",
  },
  photos: {
    icon: "🖼️",
    title: "Photos access needed",
    reason:
      "Zarkili needs access to your photo library to let you select and share photos.",
  },
  contacts: {
    icon: "👥",
    title: "Contacts access needed",
    reason:
      "Zarkili needs contacts access to help you find and invite friends on the platform.",
  },
  calendar: {
    icon: "📅",
    title: "Calendar access needed",
    reason:
      "Zarkili needs calendar access to add bookings to your device calendar automatically.",
  },
  location: {
    icon: "📍",
    title: "Location access needed",
    reason:
      "Zarkili needs your location to show salons near you and provide accurate availability.",
  },
  notifications: {
    icon: "🔔",
    title: "Notifications turned off",
    reason:
      "Enable notifications to receive booking reminders, messages, and loyalty updates.",
  },
};

export function PermissionsGate({
  permissionType,
  variant = "screen",
  onOpenSettings,
  onDismiss,
  testID,
}: PermissionsGateProps) {
  const meta = META[permissionType];

  return (
    <View
      style={variant === "screen" ? styles.screenContainer : styles.cardContainer}
      testID={testID}
    >
      <Text style={styles.icon} testID={testID ? `${testID}-icon` : undefined}>
        {meta.icon}
      </Text>
      <Text style={styles.title} testID={testID ? `${testID}-title` : undefined}>
        {meta.title}
      </Text>
      <Text style={styles.reason} testID={testID ? `${testID}-reason` : undefined}>
        {meta.reason}
      </Text>

      <Pressable
        onPress={onOpenSettings}
        accessibilityRole="button"
        accessibilityLabel="Open device settings"
        style={styles.settingsBtn}
        testID={testID ? `${testID}-open-settings` : undefined}
      >
        <Text style={styles.settingsBtnText}>Open Settings</Text>
      </Pressable>

      {onDismiss && (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          testID={testID ? `${testID}-dismiss` : undefined}
        >
          <Text style={styles.dismissText}>Maybe later</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.s5,
    alignItems: "center",
    gap: spacing.s3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: { fontSize: 52 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  reason: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
  settingsBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  settingsBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
  dismissText: { fontSize: 13, color: colors.textMuted },
});
