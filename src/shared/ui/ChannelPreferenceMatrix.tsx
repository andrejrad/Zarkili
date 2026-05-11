/**
 * ChannelPreferenceMatrix.tsx — W31 Batch K primitive.
 *
 * A scrollable grid of notification channels (push / email / SMS) × event
 * types (booking / payment / marketing / etc.).  Each cell is a `Switch`.
 *
 * The outer consumer owns the state; this component is stateless.
 */

import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { colors, spacing } from "./tokens";

export type NotificationChannel = "push" | "email" | "sms";
export type NotificationEventType =
  | "booking_confirmed"
  | "booking_reminder"
  | "booking_cancelled"
  | "payment_receipt"
  | "payment_failed"
  | "marketing"
  | "loyalty"
  | "system";

/** Map: eventType → channel → enabled */
export type ChannelPreferenceMap = {
  [E in NotificationEventType]?: {
    [C in NotificationChannel]?: boolean;
  };
};

const EVENT_LABELS: Record<NotificationEventType, string> = {
  booking_confirmed: "Booking confirmed",
  booking_reminder: "Booking reminder",
  booking_cancelled: "Booking cancelled",
  payment_receipt: "Payment receipt",
  payment_failed: "Payment failed",
  marketing: "Promotions & marketing",
  loyalty: "Loyalty & rewards",
  system: "System & security",
};

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  push: "Push",
  email: "Email",
  sms: "SMS",
};

const ALL_EVENTS: NotificationEventType[] = [
  "booking_confirmed",
  "booking_reminder",
  "booking_cancelled",
  "payment_receipt",
  "payment_failed",
  "marketing",
  "loyalty",
  "system",
];

const ALL_CHANNELS: NotificationChannel[] = ["push", "email", "sms"];

export type ChannelPreferenceMatrixProps = {
  preferences: ChannelPreferenceMap;
  onToggle: (
    channel: NotificationChannel,
    eventType: NotificationEventType,
    enabled: boolean
  ) => void;
  testID?: string;
};

export function ChannelPreferenceMatrix({
  preferences,
  onToggle,
  testID,
}: ChannelPreferenceMatrixProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
    >
      <View style={styles.table}>
        {/* Header row */}
        <View style={styles.row}>
          <View style={styles.eventLabelCell} />
          {ALL_CHANNELS.map((ch) => (
            <View key={ch} style={styles.channelHeaderCell}>
              <Text style={styles.channelHeaderText}>{CHANNEL_LABELS[ch]}</Text>
            </View>
          ))}
        </View>

        {/* Data rows */}
        {ALL_EVENTS.map((ev) => (
          <View key={ev} style={styles.row}>
            <View style={styles.eventLabelCell}>
              <Text style={styles.eventLabelText}>{EVENT_LABELS[ev]}</Text>
            </View>
            {ALL_CHANNELS.map((ch) => {
              const enabled = preferences[ev]?.[ch] ?? false;
              return (
                <View key={ch} style={styles.switchCell}>
                  <Switch
                    value={enabled}
                    onValueChange={(v) => onToggle(ch, ev, v)}
                    trackColor={{
                      false: colors.border,
                      true: colors.primary,
                    }}
                    thumbColor={colors.surface}
                    accessibilityLabel={`${CHANNEL_LABELS[ch]} ${EVENT_LABELS[ev]}`}
                    testID={
                      testID ? `${testID}-${ev}-${ch}` : undefined
                    }
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: {
    gap: 1,
    backgroundColor: colors.border,
    borderRadius: 8,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  eventLabelCell: {
    width: 164,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    justifyContent: "center",
  },
  eventLabelText: {
    fontSize: 13,
    color: colors.foreground,
    flexWrap: "wrap",
  },
  channelHeaderCell: {
    width: 76,
    alignItems: "center",
    paddingVertical: spacing.s2,
  },
  channelHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  switchCell: {
    width: 76,
    alignItems: "center",
    paddingVertical: spacing.s2,
  },
});
