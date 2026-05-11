/**
 * ClientOnboardingNotificationsScreen.tsx — A.7.3.
 *
 * TCPA / CAN-SPAM SAFE DEFAULTS: every toggle is OFF until explicitly opted in.
 */

import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { Banner, Button, Stepper, colors, radius, spacing } from "../../shared/ui";

export type NotificationPreferences = {
  bookingReminders: boolean;
  promotionsSms: boolean;
  promotionsEmail: boolean;
  newSalonsNearby: boolean;
};

/** All notifications/marketing toggles default OFF — TCPA/CAN-SPAM safe. */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  bookingReminders: false,
  promotionsSms: false,
  promotionsEmail: false,
  newSalonsNearby: false,
};

export type ClientOnboardingNotificationsScreenProps = {
  totalSteps: number;
  currentStep: number;
  initialPreferences?: NotificationPreferences;
  onContinue: (prefs: NotificationPreferences) => Promise<void>;
  onSkip?: () => void;
};

const ROWS: Array<{
  key: keyof NotificationPreferences;
  title: string;
  description: string;
}> = [
  {
    key: "bookingReminders",
    title: "Booking reminders",
    description: "Push and email reminders before your appointments.",
  },
  {
    key: "promotionsSms",
    title: "Promotions and offers (SMS)",
    description: "Message and data rates may apply. Reply STOP to unsubscribe.",
  },
  {
    key: "promotionsEmail",
    title: "Promotions and offers (email)",
    description: "Occasional promos. Unsubscribe any time.",
  },
  {
    key: "newSalonsNearby",
    title: "New salons near you",
    description: "We'll let you know when great salons join near your area.",
  },
];

export function ClientOnboardingNotificationsScreen({
  totalSteps,
  currentStep,
  initialPreferences,
  onContinue,
  onSkip,
}: ClientOnboardingNotificationsScreenProps) {
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    initialPreferences ?? DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function toggle(key: keyof NotificationPreferences) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  async function handleContinue() {
    setError(null);
    setSubmitting(true);
    try {
      await onContinue(prefs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save preferences.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stepper totalSteps={totalSteps} currentStep={currentStep} testID="notif-stepper" />
      <Text style={styles.heading} accessibilityRole="header">
        Stay in the loop
      </Text>
      <Text style={styles.body}>
        Choose what you'd like to hear from us. You can change these any time.
      </Text>

      {error ? (
        <View style={styles.bannerWrap}>
          <Banner variant="error" message={error} />
        </View>
      ) : null}

      <View style={styles.list}>
        {ROWS.map((row) => (
          <View key={row.key} style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowDesc}>{row.description}</Text>
            </View>
            <Switch
              value={prefs[row.key]}
              onValueChange={() => toggle(row.key)}
              accessibilityLabel={row.title}
              testID={`notif-${row.key}`}
            />
          </View>
        ))}
      </View>

      <Text style={styles.disclosure}>
        Message and data rates may apply. Reply STOP to unsubscribe at any time.
      </Text>

      <View style={styles.footerRow}>
        {onSkip ? (
          <Button variant="secondary" label="Skip" onPress={onSkip} testID="notif-skip" />
        ) : null}
        <View style={{ flex: 1 }}>
          <Button
            label="Continue"
            onPress={handleContinue}
            loading={submitting}
            fullWidth
            testID="notif-continue"
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
    color: colors.foreground,
    marginTop: spacing.s4,
  },
  body: { fontSize: 14, lineHeight: 20, color: colors.textMuted, marginBottom: spacing.s4 },
  bannerWrap: { marginBottom: spacing.s2 },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.s3,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.foreground },
  rowDesc: { fontSize: 12, lineHeight: 16, color: colors.textMuted, marginTop: 2 },
  disclosure: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    marginTop: spacing.s2,
  },
  footerRow: { flexDirection: "row", gap: spacing.s3, marginTop: spacing.s6 },
});
