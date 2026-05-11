/**
 * ConflictRecoveryModal.tsx — W30 Batch J shared primitive.
 *
 * Bottom-sheet modal shown when the user's chosen time slot was just taken.
 * Presents up to 3 alternative time chips; the "Pick this time" CTA is
 * enabled only when an alternative is selected. Delegates close / pick /
 * "see more" entirely to caller via props (no internal navigation).
 *
 * States: default (alternatives available), no-alternatives, error.
 */

import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";
import { Button } from "./Button";
import { ModalSheet } from "./ModalSheet";
import { TimeSlotChip } from "./TimeSlotChip";

export type ConflictRecoveryState = "default" | "no-alternatives" | "error";

export type ConflictRecoveryModalProps = {
  visible: boolean;
  /** ISO-format alternative times, max 3 rendered. */
  alternatives: string[];
  state?: ConflictRecoveryState;
  onClose: () => void;
  onPickTime: (time: string) => void;
  onSeeMoreTimes: () => void;
  onRetry?: () => void;
  testID?: string;
};

export function ConflictRecoveryModal({
  visible,
  alternatives,
  state = "default",
  onClose,
  onPickTime,
  onSeeMoreTimes,
  onRetry,
  testID,
}: ConflictRecoveryModalProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const slices = alternatives.slice(0, 3);

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="That time was just taken"
      testID={testID}
      footer={
        state !== "error" ? (
          <View style={styles.footer}>
            <Pressable
              onPress={onSeeMoreTimes}
              accessibilityRole="button"
              testID={testID ? `${testID}-see-more` : undefined}
            >
              <Text style={styles.seeMore}>See more times</Text>
            </Pressable>
            {state === "default" && (
              <Button
                label="Pick this time"
                variant="primary"
                disabled={!selectedTime}
                onPress={() => selectedTime && onPickTime(selectedTime)}
                testID={testID ? `${testID}-pick-cta` : undefined}
              />
            )}
          </View>
        ) : undefined
      }
    >
      <View style={styles.body} testID={testID ? `${testID}-body` : undefined}>
        {state === "error" && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorMsg}>
              Something went wrong loading alternatives.
            </Text>
            {onRetry && (
              <Pressable
                onPress={onRetry}
                accessibilityRole="button"
                testID={testID ? `${testID}-retry` : undefined}
              >
                <Text style={styles.retryLink}>Try again</Text>
              </Pressable>
            )}
          </View>
        )}

        {state === "no-alternatives" && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyMsg}>
              No alternative times are available right now.
            </Text>
            <Pressable
              onPress={onSeeMoreTimes}
              accessibilityRole="button"
              testID={testID ? `${testID}-see-more-empty` : undefined}
            >
              <Text style={styles.seeMore}>Browse all available times</Text>
            </Pressable>
          </View>
        )}

        {state === "default" && (
          <>
            <Text style={styles.subtitle}>
              Choose one of these nearby times instead:
            </Text>
            <View style={styles.chips}>
              {slices.map((t) => (
                <TimeSlotChip
                  key={t}
                  time={t}
                  selected={selectedTime === t}
                  onPress={(time) => setSelectedTime(time)}
                  testID={testID ? `${testID}-chip-${t}` : undefined}
                />
              ))}
            </View>
          </>
        )}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.s4,
    paddingBottom: spacing.s4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.s3,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s3,
  },
  footer: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    gap: spacing.s3,
    alignItems: "center",
  },
  seeMore: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: spacing.s6,
    gap: spacing.s3,
  },
  emptyMsg: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
  },
  errorWrap: {
    alignItems: "center",
    paddingVertical: spacing.s6,
    gap: spacing.s3,
  },
  errorMsg: {
    fontSize: 15,
    color: colors.error,
    textAlign: "center",
  },
  retryLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
});
