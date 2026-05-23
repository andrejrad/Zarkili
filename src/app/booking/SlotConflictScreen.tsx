/**
 * SlotConflictScreen.tsx — J.1 Slot Conflict Mid-Flow (W30 Batch J).
 *
 * Shown in-flow when the user's selected time slot is taken after they tapped
 * "Continue". Renders a warning illustration, heading, up to 3 alternative
 * TimeSlotChips, a "See more times" tertiary link, and a "Pick this time"
 * primary CTA (enabled once an alternative is tapped).
 *
 * The ConflictRecoveryModal is also exported from here so that navigator can
 * mount it as an overlay over the time-picker screen when preferred.
 *
 * States: default (alternatives present), no-alternatives, error.
 */

import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useState } from "react";

import {
  Button,
  ConflictRecoveryModal,
  TimeSlotChip,
  colors,
  radius,
  spacing,
} from "../../shared/ui";

export { ConflictRecoveryModal };

export type SlotConflictState = "default" | "no-alternatives" | "error";

export type SlotConflictScreenProps = {
  /** Up to 3 alternative times in US 12h format. */
  alternatives: string[];
  state?: SlotConflictState;
  onPickTime: (time: string) => void;
  onSeeMoreTimes: () => void;
  onRetry?: () => void;
  onBack?: () => void;
  testID?: string;
};

export function SlotConflictScreen({
  alternatives,
  state = "default",
  onPickTime,
  onSeeMoreTimes,
  onRetry,
  onBack,
  testID,
}: SlotConflictScreenProps) {
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const slices = alternatives.slice(0, 3);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      testID={testID}
    >
      {/* Warning icon area */}
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>⏰</Text>
      </View>

      <Text style={styles.heading}>That time was just taken</Text>
      <Text style={styles.body}>
        Sorry, someone else booked that slot. Pick one of these nearby times or
        search for more availability.
      </Text>

      {state === "error" && (
        <View style={styles.errorBox} testID={testID ? `${testID}-error` : undefined}>
          <Text style={styles.errorText}>
            {"We couldn't load alternatives. Please try again."}
          </Text>
          {onRetry && (
            <Button
              label="Try again"
              variant="secondary"
              onPress={onRetry}
              testID={testID ? `${testID}-retry` : undefined}
            />
          )}
        </View>
      )}

      {state === "no-alternatives" && (
        <View style={styles.emptyBox} testID={testID ? `${testID}-no-alts` : undefined}>
          <Text style={styles.emptyText}>
            No nearby alternatives available right now.
          </Text>
          <Button
            label="Browse all times"
            variant="secondary"
            onPress={onSeeMoreTimes}
            testID={testID ? `${testID}-browse` : undefined}
          />
        </View>
      )}

      {state === "default" && (
        <>
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

          <Button
            label="See more times"
            variant="tertiary"
            onPress={onSeeMoreTimes}
            testID={testID ? `${testID}-see-more` : undefined}
          />

          <Button
            label="Pick this time"
            variant="primary"
            disabled={!selectedTime}
            onPress={() => selectedTime && onPickTime(selectedTime)}
            testID={testID ? `${testID}-pick` : undefined}
          />
        </>
      )}

      {onBack && (
        <Button
          label="Go back"
          variant="tertiary"
          onPress={onBack}
          testID={testID ? `${testID}-back` : undefined}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.pageVertical,
    backgroundColor: colors.background,
    gap: spacing.s4,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    backgroundColor: colors.primary10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.s2,
  },
  icon: {
    fontSize: 36,
  },
  heading: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.foreground,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s3,
    justifyContent: "center",
    width: "100%",
  },
  errorBox: {
    gap: spacing.s3,
    alignItems: "center",
    width: "100%",
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
  },
  emptyBox: {
    gap: spacing.s3,
    alignItems: "center",
    width: "100%",
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
  },
});
