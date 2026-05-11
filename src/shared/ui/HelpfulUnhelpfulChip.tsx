/**
 * HelpfulUnhelpfulChip.tsx — W30 Batch J shared primitive.
 *
 * Two chips rendered side-by-side: 👍 <count> and 👎 <count>. Each is
 * independently tappable. The chip the user has already voted on shows a
 * filled (primary / error) background; the other remains outlined.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type HelpfulVote = "helpful" | "unhelpful" | null;

export type HelpfulUnhelpfulChipProps = {
  helpfulCount: number;
  unhelpfulCount: number;
  /** Which vote, if any, the current user has already cast. */
  userVote?: HelpfulVote;
  onPressHelpful: () => void;
  onPressUnhelpful: () => void;
  testID?: string;
};

export function HelpfulUnhelpfulChip({
  helpfulCount,
  unhelpfulCount,
  userVote = null,
  onPressHelpful,
  onPressUnhelpful,
  testID,
}: HelpfulUnhelpfulChipProps) {
  return (
    <View style={styles.row} testID={testID}>
      <Pressable
        style={[
          styles.chip,
          userVote === "helpful" && styles.chipHelpfulActive,
        ]}
        onPress={onPressHelpful}
        accessibilityRole="button"
        accessibilityLabel={`Mark helpful, ${helpfulCount} people found this helpful`}
        accessibilityState={{ selected: userVote === "helpful" }}
        testID={testID ? `${testID}-helpful` : undefined}
      >
        <Text
          style={[
            styles.chipText,
            userVote === "helpful" && styles.chipTextActive,
          ]}
        >
          👍 {helpfulCount}
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.chip,
          userVote === "unhelpful" && styles.chipUnhelpfulActive,
        ]}
        onPress={onPressUnhelpful}
        accessibilityRole="button"
        accessibilityLabel={`Mark unhelpful, ${unhelpfulCount} people found this unhelpful`}
        accessibilityState={{ selected: userVote === "unhelpful" }}
        testID={testID ? `${testID}-unhelpful` : undefined}
      >
        <Text
          style={[
            styles.chipText,
            userVote === "unhelpful" && styles.chipTextActive,
          ]}
        >
          👎 {unhelpfulCount}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.s2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipHelpfulActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipUnhelpfulActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  chipText: {
    fontSize: 13,
    color: colors.foreground,
    fontFamily: "System",
  },
  chipTextActive: {
    color: colors.surface,
    fontWeight: "600",
  },
});
