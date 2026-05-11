/**
 * GuestContactScreen.tsx — C.10 Guest contact (between Review and Policies
 * for unauthenticated bookings).
 *
 * Captures: first name, last name, email, phone (auto-formatted to US
 * format), and an SMS-reminders consent toggle that defaults to OFF per TCPA.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  InputField,
  StickyFooterCta,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import { formatPhoneUs } from "./bookingHelpers";

export type GuestContactValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  smsConsent: boolean;
};

export type GuestContactScreenErrors = Partial<Record<keyof GuestContactValues, string>>;

export type GuestContactScreenProps = {
  values: GuestContactValues;
  errors?: GuestContactScreenErrors;
  loading?: boolean;
  onChange: (next: GuestContactValues) => void;
  onPressContinue: () => void;
  onPressSignIn?: () => void;
  onPressBack?: () => void;
  testID?: string;
};

export function GuestContactScreen({
  values,
  errors = {},
  loading,
  onChange,
  onPressContinue,
  onPressSignIn,
  onPressBack,
  testID,
}: GuestContactScreenProps) {
  const set = <K extends keyof GuestContactValues>(key: K, val: GuestContactValues[K]) =>
    onChange({ ...values, [key]: val });

  const continueDisabled =
    Boolean(loading) ||
    !values.firstName.trim() ||
    !values.lastName.trim() ||
    !values.email.trim() ||
    values.phone.replace(/\D/g, "").length !== 10;

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
        <Text style={styles.title}>Your contact info</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {onPressSignIn ? (
          <Pressable
            onPress={onPressSignIn}
            accessibilityRole="button"
            accessibilityLabel="Sign in instead"
            testID={testID ? `${testID}-sign-in` : undefined}
            style={styles.signInBanner}
          >
            <Text style={styles.signInText}>Have an account? Sign in for faster checkout.</Text>
          </Pressable>
        ) : null}

        <View style={styles.row}>
          <View style={styles.cell}>
            <InputField
              label="First name"
              value={values.firstName}
              onChangeText={(t) => set("firstName", t)}
              error={errors.firstName}
              testID={testID ? `${testID}-first-name` : undefined}
            />
          </View>
          <View style={styles.cell}>
            <InputField
              label="Last name"
              value={values.lastName}
              onChangeText={(t) => set("lastName", t)}
              error={errors.lastName}
              testID={testID ? `${testID}-last-name` : undefined}
            />
          </View>
        </View>
        <InputField
          label="Email"
          value={values.email}
          onChangeText={(t) => set("email", t.trim())}
          variant="email"
          error={errors.email}
          testID={testID ? `${testID}-email` : undefined}
        />
        <InputField
          label="Phone"
          value={values.phone}
          onChangeText={(t) => set("phone", formatPhoneUs(t))}
          variant="phone"
          error={errors.phone}
          testID={testID ? `${testID}-phone` : undefined}
        />

        <Pressable
          onPress={() => set("smsConsent", !values.smsConsent)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: values.smsConsent }}
          accessibilityLabel="SMS reminder consent"
          testID={testID ? `${testID}-sms-consent` : undefined}
          style={styles.consentRow}
        >
          <View style={[styles.checkbox, values.smsConsent ? styles.checkboxOn : null]}>
            {values.smsConsent ? <Text style={styles.checkboxMark}>{"\u2713"}</Text> : null}
          </View>
          <Text style={styles.consentText}>
            Send me SMS booking reminders. Standard message rates may apply. Reply STOP to opt out.
          </Text>
        </Pressable>
      </ScrollView>
      <StickyFooterCta
        primaryLabel="Continue"
        onPrimaryPress={onPressContinue}
        primaryDisabled={continueDisabled}
        primaryLoading={loading}
        primaryTestID={testID ? `${testID}-continue` : undefined}
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
  body: { padding: spacing.pageHorizontal, paddingBottom: spacing.s24, gap: spacing.s3 },
  signInBanner: {
    backgroundColor: colors.primary10,
    borderRadius: radius.sm,
    padding: spacing.s3,
    marginBottom: spacing.s2,
  },
  signInText: { color: colors.primary, fontSize: 14, fontWeight: "500" },
  row: { flexDirection: "row", gap: spacing.s3 },
  cell: { flex: 1 },
  consentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.s3,
    paddingVertical: spacing.s2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: colors.white, fontSize: 16, fontWeight: "600" },
  consentText: { flex: 1, fontSize: 12, lineHeight: 16, color: colors.textMuted },
});
