/**
 * FollowToggle.tsx — W31 Batch K primitive.
 *
 * A pressable chip/button that toggles follow/unfollow state for a salon or
 * creator.  Maintains optimistic internal state and syncs via `onToggle`.
 *
 * Visual states:
 *   - following  → filled coral / primary background, "Following" label
 *   - not following → outlined, "Follow" label
 */

import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type FollowToggleProps = {
  /** Initial follow state (controlled only on mount; optimistic after). */
  followed: boolean;
  /** Invoked with the *new* state after toggle. Return a promise to show
   *  loading indicator while it resolves. */
  onToggle: (following: boolean) => void | Promise<void>;
  size?: "sm" | "md";
  testID?: string;
};

export function FollowToggle({
  followed: followedProp,
  onToggle,
  size = "md",
  testID,
}: FollowToggleProps) {
  const [following, setFollowing] = useState(followedProp);
  const [loading, setLoading] = useState(false);

  // Sync when parent changes the prop (e.g. after a navigation push)
  useEffect(() => {
    setFollowing(followedProp);
  }, [followedProp]);

  async function handlePress() {
    if (loading) return;
    const next = !following;
    setFollowing(next); // optimistic
    const result = onToggle(next);
    if (result instanceof Promise) {
      setLoading(true);
      try {
        await result;
      } catch {
        // Roll back on error
        setFollowing(!next);
      } finally {
        setLoading(false);
      }
    }
  }

  const sm = size === "sm";

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={following ? "Unfollow" : "Follow"}
      accessibilityState={{ selected: following }}
      style={[
        styles.base,
        sm ? styles.baseSm : styles.baseMd,
        following ? styles.followed : styles.notFollowed,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={following ? colors.surface : colors.primary}
          testID={testID ? `${testID}-spinner` : undefined}
        />
      ) : (
        <Text
          style={[
            styles.label,
            sm ? styles.labelSm : styles.labelMd,
            following ? styles.labelFollowed : styles.labelNotFollowed,
          ]}
          testID={testID ? `${testID}-label` : undefined}
        >
          {following ? "Following" : "Follow"}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  baseMd: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s5,
    minWidth: 96,
  },
  baseSm: {
    height: 30,
    paddingHorizontal: spacing.s3,
    minWidth: 72,
  },
  followed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  notFollowed: {
    backgroundColor: "transparent",
    borderColor: colors.primary,
  },
  label: {
    fontWeight: "600",
  },
  labelMd: {
    fontSize: 14,
  },
  labelSm: {
    fontSize: 13,
  },
  labelFollowed: {
    color: colors.surface,
  },
  labelNotFollowed: {
    color: colors.primary,
  },
});
