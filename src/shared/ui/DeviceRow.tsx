/**
 * DeviceRow.tsx — W29 Batch I device management list row primitive.
 *
 * Layout: device icon (rect placeholder) | name body + last-active
 * label-small muted | 44×44 revoke icon-button (trash).
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";

export type DeviceRowProps = {
  deviceName: string;
  lastActive: string;
  /** True if this is the current device (revoke button hidden). */
  isCurrent?: boolean;
  onRevoke?: () => void;
  showSeparator?: boolean;
  testID?: string;
};

export function DeviceRow({
  deviceName,
  lastActive,
  isCurrent,
  onRevoke,
  showSeparator,
  testID,
}: DeviceRowProps) {
  return (
    <View
      style={[styles.row, showSeparator ? styles.separator : null]}
      testID={testID}
    >
      {/* Device icon placeholder */}
      <View style={styles.icon} accessibilityElementsHidden>
        <Text style={styles.iconGlyph}>{"▣"}</Text>
      </View>

      {/* Name + last active */}
      <View style={styles.info}>
        <Text style={styles.name} testID={testID ? `${testID}-name` : undefined}>
          {deviceName}
          {isCurrent ? " (this device)" : ""}
        </Text>
        <Text
          style={styles.lastActive}
          testID={testID ? `${testID}-last-active` : undefined}
        >
          {lastActive}
        </Text>
      </View>

      {/* Revoke button — hidden on current device */}
      {!isCurrent ? (
        <Pressable
          style={styles.revokeBtn}
          onPress={onRevoke}
          accessibilityRole="button"
          accessibilityLabel={`Revoke ${deviceName}`}
          hitSlop={4}
          testID={testID ? `${testID}-revoke` : undefined}
        >
          <Text style={styles.revokeIcon}>{"🗑"}</Text>
        </Pressable>
      ) : (
        <View style={styles.revokeBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s3,
    gap: spacing.s3,
    minHeight: spacing.touchTarget,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primary10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconGlyph: {
    fontSize: 16,
    color: colors.primary,
  },
  info: {
    flex: 1,
    gap: spacing.s1,
  },
  name: {
    ...textStyles.body,
    color: colors.foreground,
  },
  lastActive: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  revokeBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  revokeIcon: {
    fontSize: 18,
    color: colors.error,
  },
});
