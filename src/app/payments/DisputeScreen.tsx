/**
 * DisputeScreen.tsx — J.7 Refund + Dispute Display (W30 Batch J).
 *
 * Extends the W24 RefundStatusScreen concept with a dispute-specific view:
 *   - "Disputed" status pill
 *   - Reg E / Visa dispute rules body text
 *   - Read-only dispute timeline (Filed → Under review → Resolved)
 *   - Evidence list (read-only)
 *
 * States: open | resolved-won | resolved-lost | error
 */

import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Banner,
  Button,
  colors,
  radius,
  spacing,
} from "../../shared/ui";

export type DisputeState = "open" | "resolved-won" | "resolved-lost" | "error";

export type DisputeEvidenceItem = {
  id: string;
  label: string;
  type: "receipt" | "photo" | "message" | "other";
};

export type DisputeTimelineStep = {
  label: string;
  dateIso?: string;
  completed: boolean;
};

export type DisputeScreenProps = {
  state?: DisputeState;
  /** Formatted amount, e.g. "$75.00". */
  disputedAmount: string;
  reason: string;
  filedDateIso?: string;
  resolvedDateIso?: string;
  timeline?: DisputeTimelineStep[];
  evidence?: DisputeEvidenceItem[];
  errorMessage?: string;
  onContactSupport?: () => void;
  onPressBack?: () => void;
  testID?: string;
};

const EVIDENCE_ICONS: Record<DisputeEvidenceItem["type"], string> = {
  receipt: "🧾",
  photo:   "📷",
  message: "💬",
  other:   "📄",
};

const DEFAULT_TIMELINE: DisputeTimelineStep[] = [
  { label: "Dispute filed",   completed: true },
  { label: "Under review",    completed: false },
  { label: "Resolved",        completed: false },
];

export function DisputeScreen({
  state = "open",
  disputedAmount,
  reason,
  filedDateIso,
  resolvedDateIso,
  timeline = DEFAULT_TIMELINE,
  evidence = [],
  errorMessage,
  onContactSupport,
  onPressBack,
  testID,
}: DisputeScreenProps) {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.container}
      testID={testID}
    >
      {/* Status pill */}
      <View style={styles.pillRow}>
        <View
          style={[
            styles.pill,
            state === "open" && styles.pillOpen,
            state === "resolved-won" && styles.pillWon,
            state === "resolved-lost" && styles.pillLost,
            state === "error" && styles.pillError,
          ]}
          testID={testID ? `${testID}-pill` : undefined}
        >
          <Text style={styles.pillText}>
            {state === "open" ? "Disputed"
              : state === "resolved-won" ? "Resolved — Won"
              : state === "resolved-lost" ? "Resolved — Lost"
              : "Error"}
          </Text>
        </View>
      </View>

      {/* Amount + reason */}
      <Text style={styles.amount}>{disputedAmount}</Text>
      <Text style={styles.reason}>{reason}</Text>

      {/* Reg E / network rules note */}
      <View style={styles.rulesBox} testID={testID ? `${testID}-rules` : undefined}>
        <Text style={styles.rulesHeading}>What happens next</Text>
        <Text style={styles.rulesBody}>
          This dispute has been filed under applicable network chargeback rules
          (Reg E / Visa). Your bank is reviewing the transaction and may take up
          to 10 business days. You'll be notified of the outcome by email.
        </Text>
      </View>

      {state === "error" && errorMessage && (
        <Banner
          variant="error"
          message={errorMessage}
          testID={testID ? `${testID}-error-banner` : undefined}
        />
      )}

      {/* Timeline */}
      <Text style={styles.sectionTitle}>Dispute timeline</Text>
      <View style={styles.timeline} testID={testID ? `${testID}-timeline` : undefined}>
        {timeline.map((step, i) => (
          <View key={i} style={styles.timelineRow}>
            <View style={styles.timelineLeft}>
              <View
                style={[
                  styles.dot,
                  step.completed && styles.dotCompleted,
                ]}
              />
              {i < timeline.length - 1 && (
                <View
                  style={[
                    styles.line,
                    step.completed && styles.lineCompleted,
                  ]}
                />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.stepLabel,
                  step.completed && styles.stepLabelCompleted,
                ]}
              >
                {step.label}
              </Text>
              {step.dateIso && (
                <Text style={styles.stepDate}>{step.dateIso}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Evidence list */}
      {evidence.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Evidence submitted</Text>
          <View style={styles.evidenceList} testID={testID ? `${testID}-evidence` : undefined}>
            {evidence.map((item) => (
              <View key={item.id} style={styles.evidenceRow}>
                <Text style={styles.evidenceIcon}>{EVIDENCE_ICONS[item.type]}</Text>
                <Text style={styles.evidenceLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Support */}
      {onContactSupport && (
        <Button
          label="Contact support"
          variant="tertiary"
          onPress={onContactSupport}
          testID={testID ? `${testID}-support` : undefined}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
    paddingBottom: spacing.s12,
  },
  pillRow: {
    alignItems: "flex-start",
  },
  pill: {
    paddingVertical: spacing.s1,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.full,
  },
  pillOpen: {
    backgroundColor: "#FF9800",
  },
  pillWon: {
    backgroundColor: colors.success,
  },
  pillLost: {
    backgroundColor: colors.error,
  },
  pillError: {
    backgroundColor: colors.error,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  amount: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.foreground,
  },
  reason: {
    fontSize: 15,
    color: colors.textMuted,
    lineHeight: 22,
  },
  rulesBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.s4,
    gap: spacing.s2,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  rulesHeading: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  rulesBody: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.foreground,
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: "row",
    gap: spacing.s3,
    minHeight: 48,
  },
  timelineLeft: {
    alignItems: "center",
    width: 24,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginTop: 4,
  },
  dotCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  line: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginTop: 2,
  },
  lineCompleted: {
    backgroundColor: colors.success,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.s3,
  },
  stepLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  stepLabelCompleted: {
    color: colors.foreground,
    fontWeight: "500",
  },
  stepDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  evidenceList: {
    gap: spacing.s2,
  },
  evidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s4,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  evidenceIcon: {
    fontSize: 18,
  },
  evidenceLabel: {
    fontSize: 14,
    color: colors.foreground,
  },
});
