/**
 * SearchSuggestionRow.tsx — W30 Batch J shared primitive.
 *
 * A single row in the search suggestion overlay. Leading icon communicates
 * whether the entry is recent (clock), saved (bookmark), or AI/contextual
 * suggestion (magnifier). Any matching substring in the label is highlighted
 * in `colors.primary`. Trailing chevron for "suggested", × remove for "recent"
 * and "saved".
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type SearchSuggestionRowType = "recent" | "saved" | "suggested";

export type SearchSuggestionRowProps = {
  type: SearchSuggestionRowType;
  label: string;
  /** Substring to highlight inside label. Case-insensitive, first occurrence. */
  highlight?: string;
  onPress: () => void;
  /** Called when user taps the remove × icon (recent / saved). */
  onRemove?: () => void;
  testID?: string;
};

const ICON: Record<SearchSuggestionRowType, string> = {
  recent: "🕐",
  saved: "🔖",
  suggested: "🔍",
};

function HighlightedLabel({
  label,
  highlight,
}: {
  label: string;
  highlight?: string;
}) {
  if (!highlight) {
    return <Text style={styles.label}>{label}</Text>;
  }
  const idx = label.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) {
    return <Text style={styles.label}>{label}</Text>;
  }
  const before = label.slice(0, idx);
  const match = label.slice(idx, idx + highlight.length);
  const after = label.slice(idx + highlight.length);
  return (
    <Text style={styles.label}>
      {before}
      <Text style={styles.labelHighlight}>{match}</Text>
      {after}
    </Text>
  );
}

export function SearchSuggestionRow({
  type,
  label,
  highlight,
  onPress,
  onRemove,
  testID,
}: SearchSuggestionRowProps) {
  const showRemove = type === "recent" || type === "saved";

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
    >
      <Text style={styles.icon} testID={testID ? `${testID}-icon` : undefined}>
        {ICON[type]}
      </Text>
      <View style={styles.labelWrap}>
        <HighlightedLabel label={label} highlight={highlight} />
      </View>
      {showRemove && onRemove ? (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityLabel={`Remove ${label}`}
          accessibilityRole="button"
          testID={testID ? `${testID}-remove` : undefined}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </Pressable>
      ) : (
        <Text
          style={styles.chevron}
          testID={testID ? `${testID}-chevron` : undefined}
        >
          ›
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s4,
    gap: spacing.s3,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  icon: {
    fontSize: 18,
    width: 24,
    textAlign: "center",
  },
  labelWrap: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    color: colors.foreground,
    fontFamily: "System",
  },
  labelHighlight: {
    color: colors.primary,
    fontWeight: "600",
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
  },
  removeIcon: {
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: spacing.s2,
  },
});
