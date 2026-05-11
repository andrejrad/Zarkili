/**
 * ForceUpdateGate.tsx — W32 Batch L
 *
 * Full-screen, non-dismissible overlay shown when the installed app version
 * is below the minimum required version. Blocks all interaction until the
 * user taps "Update now", which opens the App/Play Store.
 *
 * Props:
 *   visible          — whether to show the gate
 *   minVersion       — minimum required version string ("2.1.0")
 *   currentVersion   — installed version string ("1.9.3")
 *   onUpdatePress    — called when user taps Update now (open store URL)
 *   testID
 */

import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type ForceUpdateGateProps = {
  visible: boolean;
  minVersion: string;
  currentVersion: string;
  onUpdatePress: () => void;
  testID?: string;
};

export function ForceUpdateGate({
  visible,
  minVersion,
  currentVersion,
  onUpdatePress,
  testID,
}: ForceUpdateGateProps) {
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      statusBarTranslucent
      testID={testID}
    >
      <View style={styles.container} testID={testID ? `${testID}-card` : undefined}>
        <Text style={styles.icon}>🔄</Text>

        <Text style={styles.title} testID={testID ? `${testID}-title` : undefined}>
          Update required
        </Text>
        <Text style={styles.body} testID={testID ? `${testID}-body` : undefined}>
          Your version ({currentVersion}) is no longer supported. Please update
          to version {minVersion} or later to continue.
        </Text>

        <Pressable
          onPress={onUpdatePress}
          accessibilityRole="button"
          accessibilityLabel="Update app now"
          style={styles.updateBtn}
          testID={testID ? `${testID}-update` : undefined}
        >
          <Text style={styles.updateBtnText}>Update now</Text>
        </Pressable>

        <Text style={styles.versionNote} testID={testID ? `${testID}-version` : undefined}>
          Current: {currentVersion} · Required: {minVersion}
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  icon: { fontSize: 64 },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 320,
  },
  updateBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.s2,
  },
  updateBtnText: { fontSize: 16, fontWeight: "700", color: colors.surface },
  versionNote: { fontSize: 12, color: colors.textMuted },
});
