/**
 * StickyCtaBar.tsx — B.C2 sticky-cta-bar primitive.
 *
 * Surface-white container with top border + safe-area-aware bottom padding.
 * Wraps a primary `Button` and an optional secondary inline button.
 */

import { StyleSheet, View } from "react-native";

import { Button } from "./Button";
import type { ButtonVariant } from "./Button";
import { colors, spacing } from "./tokens";

export type StickyCtaBarProps = {
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryTestID?: string;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  secondaryVariant?: ButtonVariant;
  secondaryTestID?: string;
  testID?: string;
};

export function StickyCtaBar({
  primaryLabel,
  onPrimaryPress,
  primaryDisabled,
  primaryLoading,
  primaryTestID,
  secondaryLabel,
  onSecondaryPress,
  secondaryVariant = "tertiary",
  secondaryTestID,
  testID,
}: StickyCtaBarProps) {
  return (
    <View style={styles.container} testID={testID}>
      {secondaryLabel && onSecondaryPress ? (
        <View style={styles.secondaryWrap}>
          <Button
            label={secondaryLabel}
            onPress={onSecondaryPress}
            variant={secondaryVariant}
            size="medium"
            testID={secondaryTestID}
          />
        </View>
      ) : null}
      <View style={styles.primaryWrap}>
        <Button
          label={primaryLabel}
          onPress={onPrimaryPress}
          fullWidth
          disabled={primaryDisabled}
          loading={primaryLoading}
          testID={primaryTestID}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s4 + 8, // safe-area approximation
    gap: spacing.s3,
  },
  primaryWrap: {
    flex: 1,
  },
  secondaryWrap: {
    flexShrink: 0,
  },
});
