/**
 * BookingConfirmationScreen.tsx — C.8 Confirmation.
 *
 * Success illustration + summary card + action row (calendar / directions /
 * message) + Manage CTA + Done.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Button,
  SummaryRow,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import {
  formatLongDateLabel,
  formatUsd,
  type BookingPriceBreakdown,
} from "./bookingHelpers";

export type BookingConfirmationScreenProps = {
  bookingId: string;
  salonName: string;
  salonAddress?: string;
  servicesSummary: string;
  staffName: string;
  date: Date;
  timeSlot: string;
  pricing: BookingPriceBreakdown;
  onPressAddToCalendar?: () => void;
  onPressDirections?: () => void;
  onPressMessageSalon?: () => void;
  onPressManage: () => void;
  onPressDone: () => void;
  testID?: string;
};

export function BookingConfirmationScreen({
  bookingId,
  salonName,
  salonAddress,
  servicesSummary,
  staffName,
  date,
  timeSlot,
  pricing,
  onPressAddToCalendar,
  onPressDirections,
  onPressMessageSalon,
  onPressManage,
  onPressDone,
  testID,
}: BookingConfirmationScreenProps) {
  return (
    <View style={styles.root} testID={testID}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.successCircle}>
          <Text style={styles.successCheck}>{"\u2713"}</Text>
        </View>
        <Text style={styles.title}>Booking confirmed</Text>
        <Text style={styles.subtitle} testID={testID ? `${testID}-booking-id` : undefined}>
          Confirmation #{bookingId}
        </Text>

        <View style={styles.card}>
          <Text style={styles.salonName}>{salonName}</Text>
          {salonAddress ? <Text style={styles.salonAddr}>{salonAddress}</Text> : null}
          <View style={styles.cardDivider} />
          <SummaryRow label="Services" value={servicesSummary} />
          <SummaryRow label="Staff" value={staffName} />
          <SummaryRow label="When" value={`${formatLongDateLabel(date)} · ${timeSlot}`} />
          <SummaryRow label="Total" value={formatUsd(pricing.total)} noDivider />
        </View>

        <View style={styles.actionRow}>
          {onPressAddToCalendar ? (
            <ActionButton
              icon="\u{1F4C5}"
              label="Add to calendar"
              onPress={onPressAddToCalendar}
              testID={testID ? `${testID}-action-calendar` : undefined}
            />
          ) : null}
          {onPressDirections ? (
            <ActionButton
              icon="\u{1F4CD}"
              label="Directions"
              onPress={onPressDirections}
              testID={testID ? `${testID}-action-directions` : undefined}
            />
          ) : null}
          {onPressMessageSalon ? (
            <ActionButton
              icon="\u{1F4AC}"
              label="Message"
              onPress={onPressMessageSalon}
              testID={testID ? `${testID}-action-message` : undefined}
            />
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Button
          label="Manage booking"
          variant="secondary"
          onPress={onPressManage}
          fullWidth
          testID={testID ? `${testID}-manage` : undefined}
        />
        <View style={{ height: spacing.s2 }} />
        <Button
          label="Done"
          onPress={onPressDone}
          fullWidth
          testID={testID ? `${testID}-done` : undefined}
        />
      </View>
    </View>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  testID,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      style={styles.actionBtn}
    >
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.pageHorizontal, paddingBottom: spacing.s24, alignItems: "center" },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.mintFresh,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.s10,
  },
  successCheck: { fontSize: 48, color: colors.accentForeground, fontWeight: "700" },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.foreground,
    marginTop: spacing.s4,
  },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: spacing.s1 },
  card: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.s6,
  },
  salonName: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  salonAddr: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.s3,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.s3,
    marginTop: spacing.s4,
    width: "100%",
    justifyContent: "space-around",
  },
  actionBtn: {
    alignItems: "center",
    gap: spacing.s1,
    minWidth: 64,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 12, color: colors.foreground },
  footer: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s3,
    paddingBottom: spacing.s4 + 8,
  },
});
