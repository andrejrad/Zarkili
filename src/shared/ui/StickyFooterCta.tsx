/**
 * StickyFooterCta.tsx — Batch C sticky-footer-cta primitive.
 *
 * Surface, top border, padding 16 + safe-area approximation, primary button
 * full-width 48h. Optional total amount label-large rendered above the CTA
 * (single-row vertical stack so it remains readable in small viewports).
 *
 * Distinct from W22 `StickyCtaBar`, which renders a secondary inline button.
 * StickyFooterCta is the Batch C variant focused on price + primary CTA.
 */

import { StyleSheet, Text, View } from "react-native";

import { Button } from "./Button";
import { colors, spacing } from "./tokens";

export type StickyFooterCtaProps = {
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  primaryTestID?: string;
  /** Optional total label e.g. "Total" */
  totalLabel?: string;
  /** Optional total amount string e.g. "$108.00" */
  totalValue?: string;
  testID?: string;
};

export function StickyFooterCta({
  primaryLabel,
  onPrimaryPress,
  primaryDisabled,
  primaryLoading,
  primaryTestID,
  totalLabel,
  totalValue,
  testID,
}: StickyFooterCtaProps) {
  const showTotal = Boolean(totalLabel || totalValue);

  return (
    <View style={styles.container} testID={testID}>
      {showTotal ? (
        <View style={styles.totalRow}>
          {totalLabel ? <Text style={styles.totalLabel}>{totalLabel}</Text> : null}
          {totalValue ? <Text style={styles.totalValue}>{totalValue}</Text> : null}
        </View>
      ) : null}
      <Button
        label={primaryLabel}
        onPress={onPrimaryPress}
        fullWidth
        disabled={primaryDisabled}
        loading={primaryLoading}
        testID={primaryTestID}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s4 + 8,
    gap: spacing.s2,
  },
  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textMuted,
  },
  totalValue: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.foreground,
  },
});
