/**
 * ReceiptLineItem.tsx — Batch D receipt-line-item primitive.
 *
 * Per spec D.4: 3-col layout: description (body 14/20, wraps), qty (label-small),
 * amount (body 14/20 right). Optional second line for modifier description
 * (body-small muted).
 */

import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "./tokens";

export type ReceiptLineItemRowProps = {
  description: string;
  /** Always rendered when > 1 ("× 2"). When 1, hidden by default for cleaner receipts. */
  quantity?: number;
  /** Right-aligned, pre-formatted ("$45.00"). */
  amountLabel: string;
  /** Optional second-line modifier ("Add: aromatherapy"). */
  modifier?: string;
  testID?: string;
};

export function ReceiptLineItem({
  description,
  quantity,
  amountLabel,
  modifier,
  testID,
}: ReceiptLineItemRowProps) {
  const showQty = typeof quantity === "number" && quantity > 1;
  return (
    <View style={styles.row} testID={testID}>
      <View style={styles.descCol}>
        <Text style={styles.desc}>{description}</Text>
        {modifier ? <Text style={styles.modifier}>{modifier}</Text> : null}
      </View>
      {showQty ? (
        <Text style={styles.qty} testID={testID ? `${testID}-qty` : undefined}>
          {`× ${quantity}`}
        </Text>
      ) : null}
      <Text style={styles.amount}>{amountLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: spacing.s2,
    gap: spacing.s3,
  },
  descCol: {
    flex: 1,
  },
  desc: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: colors.foreground,
  },
  modifier: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
    color: colors.textMuted,
    marginTop: 2,
  },
  qty: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.textMuted,
    minWidth: 32,
    textAlign: "right",
  },
  amount: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: colors.foreground,
    textAlign: "right",
    minWidth: 80,
  },
});
