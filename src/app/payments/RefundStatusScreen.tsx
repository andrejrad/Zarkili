/**
 * RefundStatusScreen.tsx — D.6 Refund / Dispute read-only.
 *
 * Status banner (Pending / Issued / Denied), vertical timeline (Requested →
 * Approved → Issued — with denial branch), booking summary mini, refund
 * amount block in USD, body text 5-10 business days expectation, tertiary
 * Contact support footer.
 *
 * Read-only screen; admin-driven state changes happen elsewhere.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, colors, radius, spacing } from "../../shared/ui";
import { formatUsDate, formatTimeOfDay } from "../booking/bookingHelpers";

import {
  REFUND_STATUS_LABELS,
  buildRefundTimeline,
  formatRefundAmountLabel,
  type RefundStatus,
  type RefundTimelineStep,
} from "./receiptsHelpers";

export type RefundBookingSummary = {
  salonName: string;
  serviceName: string;
  /** ISO 8601 timestamp. */
  startsAtIso: string;
};

export type RefundStatusScreenProps = {
  status: RefundStatus;
  amountUsd: number;
  booking: RefundBookingSummary;
  /** ISO 8601 timestamps for each step. */
  requestedAtIso: string;
  approvedAtIso?: string;
  issuedAtIso?: string;
  deniedAtIso?: string;
  /** Required for "denied" status. */
  denialReason?: string;
  errorMessage?: string;
  onPressContactSupport?: () => void;
  onPressBack?: () => void;
  testID?: string;
};

export function RefundStatusScreen({
  status,
  amountUsd,
  booking,
  requestedAtIso,
  approvedAtIso,
  issuedAtIso,
  deniedAtIso,
  denialReason,
  errorMessage,
  onPressContactSupport,
  onPressBack,
  testID,
}: RefundStatusScreenProps) {
  const timeline = buildRefundTimeline({
    requestedAtIso,
    approvedAtIso,
    issuedAtIso,
    deniedAtIso,
  });

  const bannerVariant: "info" | "success" | "error" =
    status === "issued" ? "success" : status === "denied" ? "error" : "info";

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
        <Text style={styles.title}>Refund details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {errorMessage ? (
          <Banner variant="error" message={errorMessage} testID={testID ? `${testID}-error` : undefined} />
        ) : null}

        <Banner
          variant={bannerVariant}
          message={`Refund ${REFUND_STATUS_LABELS[status]}`}
          testID={testID ? `${testID}-status` : undefined}
        />

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Timeline</Text>
          <View style={styles.timeline}>
            {timeline.map((step, idx) => (
              <TimelineRow
                key={step.id}
                step={step}
                isLast={idx === timeline.length - 1}
                testID={testID ? `${testID}-step-${step.id}` : undefined}
              />
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Booking</Text>
          <Text style={styles.bookingSalon}>{booking.salonName}</Text>
          <Text style={styles.bookingService}>{booking.serviceName}</Text>
          <Text style={styles.bookingDate}>
            {formatUsDate(new Date(booking.startsAtIso))} ·{" "}
            {formatTimeOfDay(
              new Date(booking.startsAtIso).getHours() * 60 +
                new Date(booking.startsAtIso).getMinutes(),
            )}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Refund amount</Text>
          <Text style={styles.amount} testID={testID ? `${testID}-amount` : undefined}>
            {formatRefundAmountLabel(amountUsd)}
          </Text>
        </View>

        {status === "denied" && denialReason ? (
          <View style={styles.denyCard} testID={testID ? `${testID}-denial-reason` : undefined}>
            <Text style={styles.sectionLabel}>Reason</Text>
            <Text style={styles.denyText}>{denialReason}</Text>
          </View>
        ) : null}

        <Text style={styles.disclaimer}>
          Refunds typically appear in 5–10 business days.
        </Text>

        {onPressContactSupport ? (
          <Pressable
            onPress={onPressContactSupport}
            accessibilityRole="button"
            style={styles.supportBtn}
            testID={testID ? `${testID}-support` : undefined}
          >
            <Text style={styles.supportText}>Contact support</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function TimelineRow({
  step,
  isLast,
  testID,
}: {
  step: RefundTimelineStep;
  isLast: boolean;
  testID?: string;
}) {
  const reached = Boolean(step.occurredAtIso);
  return (
    <View style={styles.timelineRow} testID={testID}>
      <View style={styles.timelineMarker}>
        <View
          style={[
            styles.dot,
            reached ? styles.dotReached : styles.dotPending,
            step.current ? styles.dotCurrent : null,
          ]}
        />
        {!isLast ? (
          <View
            style={[
              styles.connector,
              reached ? styles.connectorReached : styles.connectorPending,
            ]}
          />
        ) : null}
      </View>
      <View style={styles.timelineContent}>
        <Text style={[styles.timelineLabel, !reached ? styles.timelinePending : null]}>
          {step.label}
        </Text>
        {step.occurredAtIso ? (
          <Text style={styles.timelineDate}>{formatUsDate(new Date(step.occurredAtIso))}</Text>
        ) : null}
      </View>
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
  body: { padding: spacing.pageHorizontal, gap: spacing.s3 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    gap: 4,
  },
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.s2,
  },
  timeline: { paddingLeft: 4 },
  timelineRow: { flexDirection: "row", alignItems: "stretch", minHeight: 48 },
  timelineMarker: { width: 24, alignItems: "center" },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  dotReached: { backgroundColor: colors.success },
  dotPending: { backgroundColor: colors.disabled },
  dotCurrent: { backgroundColor: colors.primary },
  connector: { width: 2, flex: 1, marginTop: 4 },
  connectorReached: { backgroundColor: colors.success },
  connectorPending: { backgroundColor: colors.border },
  timelineContent: { flex: 1, paddingLeft: spacing.s2, paddingBottom: spacing.s2 },
  timelineLabel: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.foreground },
  timelinePending: { color: colors.textMuted },
  timelineDate: { fontSize: 12, lineHeight: 16, color: colors.textMuted, marginTop: 2 },
  bookingSalon: { fontSize: 16, lineHeight: 24, fontWeight: "600", color: colors.foreground },
  bookingService: { fontSize: 14, lineHeight: 20, color: colors.foreground },
  bookingDate: { fontSize: 12, lineHeight: 16, color: colors.textMuted, marginTop: 2 },
  amount: { fontSize: 24, lineHeight: 32, fontWeight: "600", color: colors.foreground },
  denyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.error,
    padding: spacing.s4,
  },
  denyText: { fontSize: 14, lineHeight: 20, color: colors.foreground },
  disclaimer: { fontSize: 12, lineHeight: 16, color: colors.textMuted, textAlign: "center" },
  supportBtn: { alignItems: "center", paddingVertical: spacing.s3 },
  supportText: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.primary },
});
