/**
 * RecoveryCodesList.tsx — W29 Batch I recovery codes display primitive.
 *
 * 2-column grid of monospaced recovery codes with dotted dividers.
 * Copy All and Download action buttons at bottom.
 * Warning label prompts user to store codes securely.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";

export type RecoveryCodesListProps = {
  codes: string[];
  onCopyAll?: () => void;
  onDownload?: () => void;
  testID?: string;
};

export function RecoveryCodesList({
  codes,
  onCopyAll,
  onDownload,
  testID,
}: RecoveryCodesListProps) {
  // Pair codes into rows of 2
  const rows: [string, string | undefined][] = [];
  for (let i = 0; i < codes.length; i += 2) {
    rows.push([codes[i], codes[i + 1]]);
  }

  return (
    <View testID={testID}>
      {/* Warning banner */}
      <View style={styles.warning}>
        <Text style={styles.warningText}>
          Save these codes somewhere secure. Each code can only be used once.
        </Text>
      </View>

      {/* Code grid */}
      <View style={styles.grid}>
        {rows.map(([a, b], idx) => (
          <View
            key={idx}
            style={[styles.row, idx < rows.length - 1 ? styles.rowDivider : null]}
          >
            <Text
              style={styles.code}
              testID={testID ? `${testID}-code-${idx * 2}` : undefined}
            >
              {a}
            </Text>
            {b ? (
              <Text
                style={styles.code}
                testID={testID ? `${testID}-code-${idx * 2 + 1}` : undefined}
              >
                {b}
              </Text>
            ) : (
              <View style={styles.codeEmpty} />
            )}
          </View>
        ))}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.actionBtn}
          onPress={onCopyAll}
          accessibilityRole="button"
          accessibilityLabel="Copy all codes"
          testID={testID ? `${testID}-copy-all` : undefined}
        >
          <Text style={styles.actionLabel}>Copy all</Text>
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={onDownload}
          accessibilityRole="button"
          accessibilityLabel="Download codes"
          testID={testID ? `${testID}-download` : undefined}
        >
          <Text style={styles.actionLabel}>Download</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  warning: {
    backgroundColor: colors.primary10,
    borderRadius: radius.sm,
    padding: spacing.s3,
    marginBottom: spacing.s4,
  },
  warningText: {
    ...textStyles.bodySmall,
    color: colors.foreground,
  },
  grid: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.s4,
  },
  row: {
    flexDirection: "row",
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  code: {
    flex: 1,
    fontFamily: "monospace",
    ...textStyles.labelLarge,
    color: colors.foreground,
    padding: spacing.s3,
    textAlign: "center",
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  codeEmpty: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.s3,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: spacing.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: "center",
  },
  actionLabel: {
    ...textStyles.label,
    color: colors.primary,
  },
});
