/**
 * BookingPaymentScreen.tsx — C.7 Payment.
 *
 * Apple Pay button placeholder, saved cards list, "Add new payment method"
 * tile, total breakdown, sticky footer Confirm CTA.
 *
 * Note: Stripe in-flow integration is W23-DEBT-2 (deferred to W24+). This
 * screen is purely props-driven — caller wires the actual payment intent.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  StickyFooterCta,
  SummaryRow,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import {
  formatUsd,
  type BookingPriceBreakdown,
} from "./bookingHelpers";

export type SavedCard = {
  id: string;
  brand: string; // "Visa", "Mastercard", etc.
  last4: string;
  isDefault?: boolean;
};

export type BookingPaymentScreenProps = {
  pricing: BookingPriceBreakdown;
  savedCards: readonly SavedCard[];
  selectedCardId: string | null;
  applePayAvailable?: boolean;
  loading?: boolean;
  errorMessage?: string;
  onSelectCard: (id: string) => void;
  onPressApplePay?: () => void;
  onPressAddCard: () => void;
  onPressConfirm: () => void;
  onPressBack?: () => void;
  testID?: string;
};

export function BookingPaymentScreen({
  pricing,
  savedCards,
  selectedCardId,
  applePayAvailable,
  loading,
  errorMessage,
  onSelectCard,
  onPressApplePay,
  onPressAddCard,
  onPressConfirm,
  onPressBack,
  testID,
}: BookingPaymentScreenProps) {
  const confirmDisabled =
    Boolean(loading) || (!selectedCardId && !applePayAvailable);

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        {onPressBack ? (
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID={testID ? `${testID}-back` : undefined}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>{"\u2190"}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>Payment</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {errorMessage ? (
          <View style={styles.errorBanner} testID={testID ? `${testID}-error` : undefined}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {applePayAvailable ? (
          <Pressable
            onPress={onPressApplePay}
            accessibilityRole="button"
            accessibilityLabel="Pay with Apple Pay"
            testID={testID ? `${testID}-apple-pay` : undefined}
            style={styles.applePay}
          >
            <Text style={styles.applePayText}>{"\uF8FF"} Pay</Text>
          </Pressable>
        ) : null}

        <Text style={styles.sectionLabel}>Saved cards</Text>
        {savedCards.length === 0 ? (
          <Text style={styles.emptyText} testID={testID ? `${testID}-empty` : undefined}>
            No saved payment methods.
          </Text>
        ) : (
          savedCards.map((c) => {
            const sel = selectedCardId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => onSelectCard(c.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={`${c.brand} ending in ${c.last4}${c.isDefault ? ", default" : ""}`}
                testID={testID ? `${testID}-card-${c.id}` : undefined}
                style={[styles.cardRow, sel ? styles.cardRowSelected : null]}
              >
                <View style={styles.cardLogo}>
                  <Text style={styles.cardLogoText}>{c.brand.charAt(0)}</Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardTitle}>
                    {c.brand} •••• {c.last4}
                  </Text>
                  {c.isDefault ? <Text style={styles.cardDefault}>Default</Text> : null}
                </View>
                <View style={[styles.radio, sel ? styles.radioOn : null]}>
                  {sel ? <View style={styles.radioDot} /> : null}
                </View>
              </Pressable>
            );
          })
        )}

        <Pressable
          onPress={onPressAddCard}
          accessibilityRole="button"
          accessibilityLabel="Add new payment method"
          testID={testID ? `${testID}-add-card` : undefined}
          style={styles.addCard}
        >
          <Text style={styles.addCardText}>+ Add new payment method</Text>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Total</Text>
          <SummaryRow label="Subtotal" value={formatUsd(pricing.subtotal)} />
          {pricing.tax > 0 ? (
            <SummaryRow label="Tax" value={formatUsd(pricing.tax)} />
          ) : null}
          {pricing.tip > 0 ? (
            <SummaryRow label="Tip" value={formatUsd(pricing.tip)} />
          ) : null}
          <SummaryRow label="Total" value={formatUsd(pricing.total)} noDivider />
        </View>
      </ScrollView>
      <StickyFooterCta
        primaryLabel="Confirm and pay"
        totalLabel="Total"
        totalValue={formatUsd(pricing.total)}
        onPrimaryPress={onPressConfirm}
        primaryDisabled={confirmDisabled}
        primaryLoading={loading}
        primaryTestID={testID ? `${testID}-confirm` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 56,
    paddingHorizontal: spacing.pageHorizontal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  backText: { fontSize: 20, color: colors.foreground },
  title: { fontSize: 18, fontWeight: "600", color: colors.foreground },
  body: { padding: spacing.pageHorizontal, paddingBottom: spacing.s24 },
  errorBanner: {
    backgroundColor: "rgba(244, 67, 54, 0.05)",
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.sm,
    padding: spacing.s3,
    marginBottom: spacing.s4,
  },
  errorText: { color: colors.error, fontSize: 14 },
  applePay: {
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.foreground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.s4,
  },
  applePayText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.s2,
  },
  emptyText: { color: colors.textMuted, marginBottom: spacing.s3 },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    padding: spacing.s3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.s2,
  },
  cardRowSelected: { borderColor: colors.primary, borderWidth: 2 },
  cardLogo: {
    width: 40,
    height: 28,
    borderRadius: 4,
    backgroundColor: colors.primary10,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLogoText: { fontSize: 14, fontWeight: "700", color: colors.primary },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "500", color: colors.foreground },
  cardDefault: { fontSize: 12, color: colors.textMuted },
  radio: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.primary, borderWidth: 2 },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  addCard: {
    height: 48,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.s4,
  },
  addCardText: { color: colors.primary, fontWeight: "500" },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
