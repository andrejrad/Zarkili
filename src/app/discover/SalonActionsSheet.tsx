/**
 * SalonActionsSheet.tsx — J.10 Salon Actions (W30 Batch J).
 *
 * A ModalSheet that aggregates contextual actions for a salon:
 *   - Hours & holidays (with US holiday list)
 *   - Directions (launches native maps)
 *   - Share salon
 *   - Report (form → toast)
 *   - Block salon (destructive confirm)
 *
 * States: default | reporting | reported (toast) | blocked | error
 */

import { useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";

import {
  Banner,
  Button,
  InputField,
  ModalSheet,
  colors,
  radius,
  spacing,
} from "../../shared/ui";

export type SalonActionsState =
  | "default"
  | "reporting"
  | "reported"
  | "blocked"
  | "error";

export type SalonHoursEntry = {
  day: string;
  hours: string;
};

export type SalonActionsSheetProps = {
  visible: boolean;
  salonName: string;
  salonAddress?: string;
  hours?: SalonHoursEntry[];
  /** US federal holidays with "closed" annotation, e.g. ["Thanksgiving", "Christmas"]. */
  closedHolidays?: string[];
  state?: SalonActionsState;
  errorMessage?: string;
  onClose: () => void;
  onBlock: () => void;
  onReport: (reason: string) => void;
  testID?: string;
};


export function SalonActionsSheet({
  visible,
  salonName,
  salonAddress,
  hours = [],
  closedHolidays = [],
  state: initialState = "default",
  errorMessage,
  onClose,
  onBlock,
  onReport,
  testID,
}: SalonActionsSheetProps) {
  const [state, setState] = useState<SalonActionsState>(initialState);
  const [reportReason, setReportReason] = useState("");
  const [hoursExpanded, setHoursExpanded] = useState(false);

  const handleDirections = () => {
    if (salonAddress) {
      const encoded = encodeURIComponent(salonAddress);
      Linking.openURL(`https://maps.apple.com/?q=${encoded}`).catch(() => {
        Linking.openURL(`https://maps.google.com/?q=${encoded}`);
      });
    }
  };

  const handleShare = async () => {
    await Share.share({
      title: salonName,
      message: `Check out ${salonName} on Zarkili!`,
    });
  };

  const handleBlockPress = () => {
    Alert.alert(
      "Block this salon?",
      `You won't see ${salonName} in search results anymore.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            setState("blocked");
            onBlock();
          },
        },
      ],
    );
  };

  const handleSubmitReport = () => {
    if (!reportReason.trim()) return;
    setState("reported");
    onReport(reportReason.trim());
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={salonName}
      testID={testID}
    >
      <ScrollView
        contentContainerStyle={styles.body}
        testID={testID ? `${testID}-body` : undefined}
      >
        {state === "reported" && (
          <Banner
            variant="success"
            message="Thank you. Your report has been submitted."
            testID={testID ? `${testID}-reported-toast` : undefined}
          />
        )}

        {state === "blocked" && (
          <Banner
            variant="info"
            message={`${salonName} has been blocked. You won't see them in search results.`}
            testID={testID ? `${testID}-blocked-banner` : undefined}
          />
        )}

        {state === "error" && errorMessage && (
          <Banner
            variant="error"
            message={errorMessage}
            testID={testID ? `${testID}-error-banner` : undefined}
          />
        )}

        {state !== "reporting" && state !== "reported" && state !== "blocked" && (
          <>
            {/* Hours & holidays */}
            <Pressable
              style={styles.actionRow}
              onPress={() => setHoursExpanded((v) => !v)}
              accessibilityRole="button"
              testID={testID ? `${testID}-hours-toggle` : undefined}
            >
              <Text style={styles.actionIcon}>🕐</Text>
              <Text style={styles.actionLabel}>Hours & holidays</Text>
              <Text style={styles.chevron}>{hoursExpanded ? "∧" : "∨"}</Text>
            </Pressable>

            {hoursExpanded && (
              <View
                style={styles.hoursPanel}
                testID={testID ? `${testID}-hours-panel` : undefined}
              >
                {hours.map((h) => (
                  <View key={h.day} style={styles.hoursRow}>
                    <Text style={styles.hoursDay}>{h.day}</Text>
                    <Text style={styles.hoursTime}>{h.hours}</Text>
                  </View>
                ))}
                {closedHolidays.length > 0 && (
                  <View style={styles.holidaysSection}>
                    <Text style={styles.holidaysHeader}>Closed on holidays:</Text>
                    {closedHolidays.map((h) => (
                      <Text key={h} style={styles.holidayItem}>
                        • {h}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Directions */}
            <Pressable
              style={styles.actionRow}
              onPress={handleDirections}
              accessibilityRole="button"
              testID={testID ? `${testID}-directions` : undefined}
            >
              <Text style={styles.actionIcon}>📍</Text>
              <Text style={styles.actionLabel}>Get directions</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Share */}
            <Pressable
              style={styles.actionRow}
              onPress={handleShare}
              accessibilityRole="button"
              testID={testID ? `${testID}-share` : undefined}
            >
              <Text style={styles.actionIcon}>📤</Text>
              <Text style={styles.actionLabel}>Share salon</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Report */}
            <Pressable
              style={styles.actionRow}
              onPress={() => setState("reporting")}
              accessibilityRole="button"
              testID={testID ? `${testID}-report` : undefined}
            >
              <Text style={styles.actionIcon}>🚩</Text>
              <Text style={styles.actionLabel}>Report</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>

            {/* Block */}
            <Pressable
              style={[styles.actionRow, styles.destructiveRow]}
              onPress={handleBlockPress}
              accessibilityRole="button"
              testID={testID ? `${testID}-block` : undefined}
            >
              <Text style={styles.actionIcon}>🚫</Text>
              <Text style={[styles.actionLabel, styles.destructiveLabel]}>
                Block salon
              </Text>
            </Pressable>
          </>
        )}

        {/* Report form */}
        {state === "reporting" && (
          <View style={styles.reportForm} testID={testID ? `${testID}-report-form` : undefined}>
            <Text style={styles.reportTitle}>Why are you reporting this salon?</Text>
            <InputField
              label="Reason"
              value={reportReason}
              onChangeText={setReportReason}
              placeholder="Describe the issue…"
              testID={testID ? `${testID}-report-input` : undefined}
            />
            <Button
              label="Submit report"
              variant="primary"
              disabled={!reportReason.trim()}
              onPress={handleSubmitReport}
              testID={testID ? `${testID}-report-submit` : undefined}
            />
            <Button
              label="Cancel"
              variant="tertiary"
              onPress={() => setState("default")}
              testID={testID ? `${testID}-report-cancel` : undefined}
            />
          </View>
        )}
      </ScrollView>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s6,
    gap: spacing.s1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: spacing.s3,
    minHeight: spacing.touchTarget,
  },
  destructiveRow: {
    borderBottomWidth: 0,
  },
  actionIcon: {
    fontSize: 18,
    width: 28,
    textAlign: "center",
  },
  actionLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.foreground,
  },
  destructiveLabel: {
    color: colors.error,
  },
  chevron: {
    fontSize: 16,
    color: colors.textMuted,
  },
  hoursPanel: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.s3,
    gap: spacing.s2,
    marginBottom: spacing.s2,
  },
  hoursRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hoursDay: {
    fontSize: 14,
    color: colors.foreground,
    fontWeight: "500",
    width: 110,
  },
  hoursTime: {
    fontSize: 14,
    color: colors.textMuted,
  },
  holidaysSection: {
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingTop: spacing.s2,
    gap: spacing.s1,
  },
  holidaysHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.foreground,
    marginBottom: spacing.s1,
  },
  holidayItem: {
    fontSize: 13,
    color: colors.textMuted,
  },
  reportForm: {
    gap: spacing.s3,
    paddingTop: spacing.s2,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.foreground,
  },
});
