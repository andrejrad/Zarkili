/**
 * TippingScreen.tsx — D.3 Tipping.
 *
 * Heading + tip-preset-chip-group + (when "Custom" selected) currency-input,
 * live total, body-small note "100% of tips go to your stylist", sticky
 * footer Confirm CTA. Can be used standalone or as a modal in C.7.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";

import {
  CurrencyInput,
  StickyFooterCta,
  TipPresetChipGroup,
  colors,
  spacing,
} from "../../shared/ui";
import {
  DEFAULT_TIP_PRESETS,
  formatUsd,
  parseCurrencyInput,
  tipAmountFromPreset,
  type TipPreset,
} from "./paymentsHelpers";

export type TippingScreenState = {
  selectedPresetId: string;
  customAmountInput: string;
};

export type TippingScreenProps = {
  subtotal: number;
  state: TippingScreenState;
  onChange: (next: TippingScreenState) => void;
  presets?: readonly TipPreset[];
  loading?: boolean;
  onConfirm: () => void;
  onPressBack?: () => void;
  testID?: string;
};

export function TippingScreen({
  subtotal,
  state,
  onChange,
  presets,
  loading,
  onConfirm,
  onPressBack,
  testID,
}: TippingScreenProps) {
  const allPresets = presets ?? DEFAULT_TIP_PRESETS;
  const selected = allPresets.find((p) => p.id === state.selectedPresetId);
  const isCustom = selected?.kind === "fixed";
  const customNum = isCustom ? parseCurrencyInput(state.customAmountInput) : NaN;
  const customError =
    isCustom && state.customAmountInput.length > 0 && (Number.isNaN(customNum) || customNum < 0)
      ? "Enter a valid tip amount."
      : undefined;

  const tipAmount = useMemo(
    () =>
      tipAmountFromPreset({
        preset: selected,
        subtotal,
        customAmount: Number.isFinite(customNum) ? customNum : 0,
      }),
    [selected, subtotal, customNum],
  );

  const total = subtotal + tipAmount;

  const chipItems = allPresets.map((p) => {
    const accessibilityLabel =
      p.kind === "percent" && p.value !== undefined
        ? `${Math.round(p.value * 100)} percent tip, ${formatUsd(subtotal * p.value)}`
        : p.label;
    return {
      id: p.id,
      label: p.label,
      destructive: p.kind === "none",
      accessibilityLabel,
    };
  });

  const confirmDisabled = Boolean(loading) || Boolean(customError);

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        {onPressBack ? (
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
            testID={testID ? `${testID}-back` : undefined}
          >
            <Text style={styles.backGlyph}>{"\u2190"}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>Add a tip</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>How much would you like to tip?</Text>

        <TipPresetChipGroup
          options={chipItems}
          selectedId={state.selectedPresetId}
          onSelect={(id) => onChange({ ...state, selectedPresetId: id })}
          testID={testID ? `${testID}-chips` : undefined}
        />

        {isCustom ? (
          <View style={styles.customWrap}>
            <Text style={styles.label}>Custom amount</Text>
            <CurrencyInput
              value={state.customAmountInput}
              onChangeText={(next) => onChange({ ...state, customAmountInput: next })}
              autoFocus
              errorText={customError}
              testID={testID ? `${testID}-custom` : undefined}
            />
          </View>
        ) : null}

        <View style={styles.totalsCard}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text style={styles.totalsValue}>{formatUsd(subtotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Tip</Text>
            <Text style={styles.totalsValue} testID={testID ? `${testID}-tip-amount` : undefined}>
              {formatUsd(tipAmount)}
            </Text>
          </View>
          <View style={[styles.totalsRow, styles.totalsRowGrand]}>
            <Text style={styles.totalsGrandLabel}>Total</Text>
            <Text style={styles.totalsGrandValue} testID={testID ? `${testID}-total` : undefined}>
              {formatUsd(total)}
            </Text>
          </View>
        </View>

        <Text style={styles.note}>100% of tips go to your stylist.</Text>
      </ScrollView>

      <StickyFooterCta
        primaryLabel="Confirm"
        primaryDisabled={confirmDisabled}
        primaryLoading={loading}
        onPrimaryPress={onConfirm}
        totalLabel="Total"
        totalValue={formatUsd(total)}
        primaryTestID={testID ? `${testID}-confirm` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s3,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backGlyph: { fontSize: 22, lineHeight: 24, color: colors.foreground },
  title: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: "600", color: colors.foreground, textAlign: "center" },
  body: { padding: spacing.pageHorizontal, gap: spacing.s4 },
  heading: { fontSize: 20, lineHeight: 28, fontWeight: "600", color: colors.foreground },
  customWrap: { gap: spacing.s2 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  totalsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    gap: spacing.s2,
  },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalsRowGrand: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.s3, marginTop: spacing.s2 },
  totalsLabel: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  totalsValue: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.foreground },
  totalsGrandLabel: { fontSize: 16, lineHeight: 24, fontWeight: "600", color: colors.foreground },
  totalsGrandValue: { fontSize: 16, lineHeight: 24, fontWeight: "600", color: colors.foreground },
  note: { fontSize: 12, lineHeight: 16, color: colors.textMuted, textAlign: "center" },
});
