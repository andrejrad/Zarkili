/**
 * PaymentExtrasScreen.tsx — J.6 Pre-Auth / Split / Gift Card / Promo / Wallet
 * (W30 Batch J).
 *
 * Five sub-surfaces, each exported individually:
 *
 *   J.6.1  PreAuthDisclosureSheet   — bottom sheet explaining hold amount + when charged.
 *   J.6.2  SplitPaymentSheet        — two PaymentMethodRow entries with $ allocated, sum check.
 *   J.6.3  GiftCardSheet            — code input + balance reveal + apply button.
 *   J.6.4  PromoCodeSheet           — promo code input + discount line.
 *   J.6.5  WalletTopUpSheet         — CurrencyInput + $25/$50/$100 preset chips + "Top up".
 */

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  Banner,
  Button,
  CurrencyInput,
  InputField,
  ModalSheet,
  PaymentMethodRow,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import type { PaymentMethodRowProps } from "../../shared/ui";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// J.6.1 — Pre-auth Disclosure Sheet
// ---------------------------------------------------------------------------

export type PreAuthDisclosureSheetProps = {
  visible: boolean;
  holdAmountCents: number;
  onConfirm: () => void;
  onClose: () => void;
  testID?: string;
};

export function PreAuthDisclosureSheet({
  visible,
  holdAmountCents,
  onConfirm,
  onClose,
  testID,
}: PreAuthDisclosureSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="A hold will be placed"
      testID={testID}
      footer={
        <View style={styles.sheetFooter}>
          <Button
            label="I understand, continue"
            variant="primary"
            onPress={onConfirm}
            testID={testID ? `${testID}-confirm` : undefined}
          />
        </View>
      }
    >
      <View style={styles.sheetBody}>
        <View style={styles.feeBox} testID={testID ? `${testID}-fee-box` : undefined}>
          <Text style={styles.feeAmount}>{formatUsd(holdAmountCents)}</Text>
          <Text style={styles.feeLabel}>temporary hold</Text>
        </View>
        <Text style={styles.description}>
          {"We'll place a temporary authorization hold of"}{" "}
          {formatUsd(holdAmountCents)} on your card. This will be released once
          your appointment is confirmed and only the final amount will be
          charged.
        </Text>
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// J.6.2 — Split Payment Sheet
// ---------------------------------------------------------------------------

export type SplitPaymentSheetProps = {
  visible: boolean;
  totalCents: number;
  methods: (PaymentMethodRowProps & { id: string })[];
  splitAmountsCents: [number, number];
  onChangeSplit: (amounts: [number, number]) => void;
  onConfirm: () => void;
  onClose: () => void;
  testID?: string;
};

export function SplitPaymentSheet({
  visible,
  totalCents,
  methods,
  splitAmountsCents,
  onChangeSplit,
  onConfirm,
  onClose,
  testID,
}: SplitPaymentSheetProps) {
  const sumCents = splitAmountsCents[0] + splitAmountsCents[1];
  const balanced = sumCents === totalCents;

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Split payment"
      testID={testID}
      footer={
        <View style={styles.sheetFooter}>
          {!balanced && (
            <Banner
              variant="error"
              message={`Amounts must total ${formatUsd(totalCents)}. Current total: ${formatUsd(sumCents)}.`}
              testID={testID ? `${testID}-sum-error` : undefined}
            />
          )}
          <Button
            label="Confirm split"
            variant="primary"
            disabled={!balanced}
            onPress={onConfirm}
            testID={testID ? `${testID}-confirm` : undefined}
          />
        </View>
      }
    >
      <View style={styles.sheetBody}>
        {methods.slice(0, 2).map((m, idx) => (
          <View key={m.id} style={styles.splitRow}>
            <PaymentMethodRow {...m} selected={false} onPress={() => {}} />
            <InputField
              label={`Amount from card ${idx + 1}`}
              value={formatUsd(splitAmountsCents[idx])}
              onChangeText={(v) => {
                const parsed = Math.round(parseFloat(v.replace(/[^0-9.]/g, "")) * 100) || 0;
                const other = totalCents - parsed;
                if (idx === 0) onChangeSplit([parsed, other]);
                else onChangeSplit([other, parsed]);
              }}
              testID={testID ? `${testID}-amount-${idx}` : undefined}
            />
          </View>
        ))}
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// J.6.3 — Gift Card Sheet
// ---------------------------------------------------------------------------

export type GiftCardState = "default" | "valid" | "invalid" | "applied" | "removed" | "error";

export type GiftCardSheetProps = {
  visible: boolean;
  state?: GiftCardState;
  balanceCents?: number;
  errorMessage?: string;
  onApply: (code: string) => void;
  onRemove: () => void;
  onClose: () => void;
  testID?: string;
};

export function GiftCardSheet({
  visible,
  state = "default",
  balanceCents,
  errorMessage,
  onApply,
  onRemove,
  onClose,
  testID,
}: GiftCardSheetProps) {
  const [code, setCode] = useState("");

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Gift card"
      testID={testID}
      footer={
        <View style={styles.sheetFooter}>
          {state === "applied" ? (
            <Button
              label="Remove gift card"
              variant="destructive"
              onPress={onRemove}
              testID={testID ? `${testID}-remove` : undefined}
            />
          ) : (
            <Button
              label="Apply"
              variant="primary"
              disabled={code.trim().length === 0 || state === "error"}
              onPress={() => onApply(code.trim())}
              testID={testID ? `${testID}-apply` : undefined}
            />
          )}
        </View>
      }
    >
      <View style={styles.sheetBody}>
        <InputField
          label="Gift card code"
          value={code}
          onChangeText={setCode}
          placeholder="e.g. GC-XXXX-XXXX"
          disabled={state === "applied"}
          testID={testID ? `${testID}-code-input` : undefined}
        />
        {(state === "valid" || state === "applied") && balanceCents !== undefined && (
          <View style={styles.balanceRow} testID={testID ? `${testID}-balance` : undefined}>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <Text style={styles.balanceAmount}>{formatUsd(balanceCents)}</Text>
          </View>
        )}
        {state === "invalid" && (
          <Banner
            variant="error"
            message="This gift card code is invalid or expired."
            testID={testID ? `${testID}-invalid-banner` : undefined}
          />
        )}
        {state === "error" && errorMessage && (
          <Banner
            variant="error"
            message={errorMessage}
            testID={testID ? `${testID}-error-banner` : undefined}
          />
        )}
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// J.6.4 — Promo Code Sheet
// ---------------------------------------------------------------------------

export type PromoCodeState = "default" | "valid" | "invalid" | "applied" | "removed" | "error";

export type PromoCodeSheetProps = {
  visible: boolean;
  state?: PromoCodeState;
  discountLabel?: string;
  errorMessage?: string;
  onApply: (code: string) => void;
  onRemove: () => void;
  onClose: () => void;
  testID?: string;
};

export function PromoCodeSheet({
  visible,
  state = "default",
  discountLabel,
  errorMessage,
  onApply,
  onRemove,
  onClose,
  testID,
}: PromoCodeSheetProps) {
  const [code, setCode] = useState("");

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Promo code"
      testID={testID}
      footer={
        <View style={styles.sheetFooter}>
          {state === "applied" ? (
            <Button
              label="Remove promo"
              variant="destructive"
              onPress={onRemove}
              testID={testID ? `${testID}-remove` : undefined}
            />
          ) : (
            <Button
              label="Apply"
              variant="primary"
              disabled={code.trim().length === 0}
              onPress={() => onApply(code.trim())}
              testID={testID ? `${testID}-apply` : undefined}
            />
          )}
        </View>
      }
    >
      <View style={styles.sheetBody}>
        <InputField
          label="Promo code"
          value={code}
          onChangeText={setCode}
          placeholder="e.g. SAVE10"
          disabled={state === "applied"}
          testID={testID ? `${testID}-code-input` : undefined}
        />
        {state === "applied" && discountLabel && (
          <View style={styles.balanceRow} testID={testID ? `${testID}-discount` : undefined}>
            <Text style={styles.balanceLabel}>Discount applied</Text>
            <Text style={[styles.balanceAmount, { color: colors.success }]}>
              {discountLabel}
            </Text>
          </View>
        )}
        {state === "invalid" && (
          <Banner
            variant="error"
            message="This promo code is invalid or has expired."
            testID={testID ? `${testID}-invalid-banner` : undefined}
          />
        )}
        {state === "error" && errorMessage && (
          <Banner
            variant="error"
            message={errorMessage}
            testID={testID ? `${testID}-error-banner` : undefined}
          />
        )}
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// J.6.5 — Wallet Top-Up Sheet
// ---------------------------------------------------------------------------

const TOP_UP_PRESETS_CENTS = [2500, 5000, 10000] as const;

export type WalletTopUpSheetProps = {
  visible: boolean;
  loading?: boolean;
  errorMessage?: string;
  onTopUp: (amountCents: number) => void;
  onClose: () => void;
  testID?: string;
};

export function WalletTopUpSheet({
  visible,
  loading,
  errorMessage,
  onTopUp,
  onClose,
  testID,
}: WalletTopUpSheetProps) {
  const [customValue, setCustomValue] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);

  const amountCents = selectedPreset !== null
    ? selectedPreset
    : Math.round(parseFloat(customValue.replace(/[^0-9.]/g, "")) * 100) || 0;

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Top up wallet"
      testID={testID}
      footer={
        <View style={styles.sheetFooter}>
          {errorMessage && (
            <Banner
              variant="error"
              message={errorMessage}
              testID={testID ? `${testID}-error` : undefined}
            />
          )}
          <Button
            label="Top up"
            variant="primary"
            disabled={amountCents === 0 || Boolean(loading)}
            loading={loading}
            onPress={() => onTopUp(amountCents)}
            testID={testID ? `${testID}-topup` : undefined}
          />
        </View>
      }
    >
      <View style={styles.sheetBody}>
        <Text style={styles.fieldLabel}>Choose an amount</Text>
        <View style={styles.presetsRow}>
          {TOP_UP_PRESETS_CENTS.map((p) => (
            <Pressable
              key={p}
              style={[styles.preset, selectedPreset === p && styles.presetSelected]}
              onPress={() => {
                setSelectedPreset(p);
                setCustomValue("");
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedPreset === p }}
              testID={testID ? `${testID}-preset-${p}` : undefined}
            >
              <Text style={[styles.presetText, selectedPreset === p && styles.presetTextSelected]}>
                {formatUsd(p)}
              </Text>
            </Pressable>
          ))}
        </View>

        <CurrencyInput
          value={customValue}
          onChangeText={(s) => {
            setCustomValue(s);
            setSelectedPreset(null);
          }}
          placeholder="Or enter custom amount"
          testID={testID ? `${testID}-custom` : undefined}
        />
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  sheetBody: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s4,
    gap: spacing.s4,
  },
  sheetFooter: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s3,
  },
  feeBox: {
    backgroundColor: colors.primary10,
    borderRadius: radius.md,
    paddingVertical: spacing.s4,
    alignItems: "center",
    gap: spacing.s1,
  },
  feeAmount: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primary,
  },
  feeLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  description: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  splitRow: {
    gap: spacing.s2,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: spacing.s3,
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.accentForeground,
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.accentForeground,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
  },
  presetsRow: {
    flexDirection: "row",
    gap: spacing.s2,
  },
  preset: {
    flex: 1,
    paddingVertical: spacing.s3,
    alignItems: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  presetSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  presetTextSelected: {
    color: colors.surface,
  },
});
