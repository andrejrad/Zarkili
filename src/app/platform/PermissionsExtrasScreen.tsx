/**
 * PermissionsExtrasScreen.tsx — W32 Batch L (L.2)
 *
 * Per-permission OS recovery screens using the PermissionsGate primitive.
 *
 * Exports:
 *   CameraPermissionScreen
 *   PhotosPermissionScreen
 *   ContactsPermissionScreen
 *   CalendarPermissionScreen
 *   LocationPermissionScreen
 */

import { SafeAreaView, StyleSheet } from "react-native";

import { PermissionsGate } from "../../shared/ui/PermissionsGate";
import { colors } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// Shared type
// ---------------------------------------------------------------------------

export type PermissionRecoveryScreenProps = {
  onOpenSettings: () => void;
  onDismiss?: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// CameraPermissionScreen
// ---------------------------------------------------------------------------

export function CameraPermissionScreen({
  onOpenSettings,
  onDismiss,
  testID,
}: PermissionRecoveryScreenProps) {
  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <PermissionsGate
        permissionType="camera"
        variant="screen"
        onOpenSettings={onOpenSettings}
        onDismiss={onDismiss}
        testID={testID ? `${testID}-gate` : undefined}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// PhotosPermissionScreen
// ---------------------------------------------------------------------------

export function PhotosPermissionScreen({
  onOpenSettings,
  onDismiss,
  testID,
}: PermissionRecoveryScreenProps) {
  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <PermissionsGate
        permissionType="photos"
        variant="screen"
        onOpenSettings={onOpenSettings}
        onDismiss={onDismiss}
        testID={testID ? `${testID}-gate` : undefined}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// ContactsPermissionScreen
// ---------------------------------------------------------------------------

export function ContactsPermissionScreen({
  onOpenSettings,
  onDismiss,
  testID,
}: PermissionRecoveryScreenProps) {
  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <PermissionsGate
        permissionType="contacts"
        variant="screen"
        onOpenSettings={onOpenSettings}
        onDismiss={onDismiss}
        testID={testID ? `${testID}-gate` : undefined}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// CalendarPermissionScreen
// ---------------------------------------------------------------------------

export function CalendarPermissionScreen({
  onOpenSettings,
  onDismiss,
  testID,
}: PermissionRecoveryScreenProps) {
  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <PermissionsGate
        permissionType="calendar"
        variant="screen"
        onOpenSettings={onOpenSettings}
        onDismiss={onDismiss}
        testID={testID ? `${testID}-gate` : undefined}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// LocationPermissionScreen
// ---------------------------------------------------------------------------

export function LocationPermissionScreen({
  onOpenSettings,
  onDismiss,
  testID,
}: PermissionRecoveryScreenProps) {
  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <PermissionsGate
        permissionType="location"
        variant="screen"
        onOpenSettings={onOpenSettings}
        onDismiss={onDismiss}
        testID={testID ? `${testID}-gate` : undefined}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
});
