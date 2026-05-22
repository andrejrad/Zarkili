/**
 * AddPaymentMethodScreen.tsx — D.2 Add Payment Method.
 *
 * Renders Stripe `CardField` for PCI-compliant card capture (we never see the
 * full PAN; tokenization happens inside Stripe). Cardholder name + ZIP + a
 * "Set as default" toggle are first-class fields. Sticky footer Add card CTA.
 *
 * Caller wires the `onSubmit` handler that calls `useStripe().createPaymentMethod`
 * (or PaymentSheet) — this screen is presentational only.
 */

import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { CardField, type CardFieldInput } from "@stripe/stripe-react-native";

import {
  Button,
  InputField,
  StickyFooterCta,
  colors,
  radius,
  spacing,
} from "../../shared/ui";

export type AddCardFormState = {
  cardholderName: string;
  zip: string;
  cardComplete: boolean;
  setAsDefault: boolean;
};

export type AddPaymentMethodScreenProps = {
  state: AddCardFormState;
  onChange: (next: AddCardFormState) => void;
  validating?: boolean;
  declinedMessage?: string;
  /** Renders a 3DS step placeholder banner. */
  threeDSecureInProgress?: boolean;
  cardholderNameError?: string;
  zipError?: string;
  onSubmit: () => void;
  onPressBack?: () => void;
  testID?: string;
};

export function AddPaymentMethodScreen({
  state,
  onChange,
  validating,
  declinedMessage,
  threeDSecureInProgress,
  cardholderNameError,
  zipError,
  onSubmit,
  onPressBack,
  testID,
}: AddPaymentMethodScreenProps) {
  const submitDisabled =
    Boolean(validating) ||
    !state.cardComplete ||
    state.cardholderName.trim().length === 0 ||
    state.zip.length !== 5;

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
        <Text style={styles.title}>Add card</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {declinedMessage ? (
          <View style={styles.errorBanner} testID={testID ? `${testID}-declined` : undefined}>
            <Text style={styles.errorText}>{declinedMessage}</Text>
          </View>
        ) : null}

        {threeDSecureInProgress ? (
          <View style={styles.infoBanner} testID={testID ? `${testID}-3ds` : undefined}>
            <Text style={styles.infoText}>Verifying with your bank…</Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Card details</Text>
        <View style={styles.cardFieldWrap} testID={testID ? `${testID}-card` : undefined}>
          <CardField
            postalCodeEnabled={false}
            placeholders={{ number: "Card number" }}
            onCardChange={(details: CardFieldInput.Details) =>
              onChange({ ...state, cardComplete: details.complete })
            }
            cardStyle={{
              backgroundColor: colors.surface,
              textColor: colors.foreground,
              placeholderColor: colors.textMuted,
            }}
            style={styles.cardField}
          />
        </View>
        <Text style={styles.helper}>
          Card secured by Stripe. We never see full card numbers.
        </Text>

        <View style={styles.formCard}>
          <InputField
            label="Cardholder name"
            value={state.cardholderName}
            onChangeText={(v) => onChange({ ...state, cardholderName: v })}
            placeholder="Name on card"
            error={cardholderNameError}
            testID={testID ? `${testID}-name` : undefined}
          />

          <InputField
            label="ZIP code"
            value={state.zip}
            onChangeText={(v) => onChange({ ...state, zip: v.replace(/\D/g, "").slice(0, 5) })}
            placeholder="12345"
            maxLength={5}
            error={zipError}
            accessibilityHint="5-digit US ZIP code"
            testID={testID ? `${testID}-zip` : undefined}
          />
        </View>

        <View style={styles.gap} />
        <View style={styles.toggleRow}>
          <View style={styles.toggleText}>
            <Text style={styles.toggleLabel}>Set as default</Text>
            <Text style={styles.toggleHelper}>
              Use this card by default for future bookings.
            </Text>
          </View>
          <Switch
            value={state.setAsDefault}
            onValueChange={(v) => onChange({ ...state, setAsDefault: v })}
            testID={testID ? `${testID}-default-toggle` : undefined}
          />
        </View>
      </ScrollView>

      <StickyFooterCta
        primaryLabel={validating ? "Adding…" : "Add card"}
        primaryDisabled={submitDisabled}
        primaryLoading={validating}
        onPrimaryPress={onSubmit}
        primaryTestID={testID ? `${testID}-submit` : undefined}
        testID={testID ? `${testID}-footer` : undefined}
      />
    </View>
  );
}

// Stripe CardField visual styling lives in a plain object (not StyleSheet).
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
  body: { padding: spacing.pageHorizontal },
  errorBanner: { backgroundColor: colors.error, borderRadius: radius.md, padding: spacing.s3, marginBottom: spacing.s3 },
  errorText: { color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  infoBanner: { backgroundColor: colors.info, borderRadius: radius.md, padding: spacing.s3, marginBottom: spacing.s3 },
  infoText: { color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: "500" },
  sectionLabel: { fontSize: 12, lineHeight: 16, fontWeight: "600", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.s2 },
  cardFieldWrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.s3,
  },
  cardField: {
    height: 56,
    width: "100%",
  },
  helper: { fontSize: 12, lineHeight: 16, color: colors.textMuted, marginTop: spacing.s1 },
  gap: { height: spacing.s4 },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: spacing.s3 },
  toggleText: { flex: 1 },
  toggleLabel: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.foreground },
  toggleHelper: { fontSize: 12, lineHeight: 16, color: colors.textMuted, marginTop: 2 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s5,
    gap: spacing.s4,
    marginTop: spacing.s4,
  },
});
