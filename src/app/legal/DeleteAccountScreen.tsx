/**
 * DeleteAccountScreen.tsx — I.4 Account Deletion.
 *
 * States:
 *  - "default"    → reason picker + delete CTA (opens confirmation modal)
 *  - "cooldown"   → account deletion scheduled, shows days remaining + cancel CTA
 *  - "confirming" → DeletionConfirmationModal open
 *  - "error"      → deletion failed
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, DeletionConfirmationModal, colors, spacing, textStyles } from "../../shared/ui";

export type DeleteAccountState = "default" | "cooldown" | "confirming" | "error";

export type DeleteAccountScreenProps = {
  state?: DeleteAccountState;
  cooldownDaysRemaining?: number;
  deleteError?: string | null;
  isDeleting?: boolean;
  onDelete: (password: string) => void;
  onCancelDeletion?: () => void;
  onBack?: () => void;
  testID?: string;
};

const DELETION_REASONS = [
  "I'm not using the app anymore",
  "I have a duplicate account",
  "Privacy concerns",
  "I found a better alternative",
  "The app is missing features I need",
  "Other",
];

export function DeleteAccountScreen({
  state = "default",
  cooldownDaysRemaining,
  deleteError,
  isDeleting,
  onDelete,
  onCancelDeletion,
  onBack,
  testID,
}: DeleteAccountScreenProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(state === "confirming");

  function handleOpenModal() {
    setModalVisible(true);
  }

  function handleCloseModal() {
    setModalVisible(false);
  }

  function handleConfirm(password: string) {
    setModalVisible(false);
    onDelete(password);
  }

  if (state === "cooldown") {
    return (
      <View style={styles.container} testID={testID}>
        <Text style={styles.heading}>Account deletion scheduled</Text>
        <View style={styles.cooldownCard} testID={testID ? `${testID}-cooldown-card` : undefined}>
          <Text style={styles.cooldownDays}>
            {cooldownDaysRemaining ?? 30} days remaining
          </Text>
          <Text style={styles.cooldownBody}>
            Your account is scheduled for deletion. You can cancel before the
            cooldown period ends.
          </Text>
        </View>
        <Button
          label="Cancel deletion"
          variant="secondary"
          onPress={onCancelDeletion}
          testID={testID ? `${testID}-cancel-deletion` : undefined}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      <Text style={styles.heading}>Delete account</Text>

      <View style={styles.warningBlock}>
        <Text style={styles.warningText}>
          Deleting your account will permanently remove all your data, including
          booking history, loyalty points, and messages. Any outstanding refunds
          will be processed before deletion. A 30-day cooldown applies.
        </Text>
      </View>

      {state === "error" || deleteError ? (
        <Banner
          variant="error"
          message={deleteError ?? "Failed to delete account. Please try again."}
          testID={testID ? `${testID}-error-banner` : undefined}
        />
      ) : null}

      <Text style={styles.sectionLabel}>Why are you leaving?</Text>
      {DELETION_REASONS.map((reason) => (
        <Pressable
          key={reason}
          style={styles.radioRow}
          onPress={() => setSelectedReason(reason)}
          accessibilityRole="radio"
          accessibilityState={{ checked: selectedReason === reason }}
          testID={testID ? `${testID}-reason-${reason.slice(0, 12).replace(/\s/g, "-").toLowerCase()}` : undefined}
        >
          <View
            style={[
              styles.radio,
              selectedReason === reason ? styles.radioSelected : null,
            ]}
          >
            {selectedReason === reason ? <View style={styles.radioDot} /> : null}
          </View>
          <Text style={styles.radioLabel}>{reason}</Text>
        </Pressable>
      ))}

      <Button
        label="Delete account"
        variant="destructive"
        onPress={handleOpenModal}
        testID={testID ? `${testID}-delete-btn` : undefined}
      />

      <DeletionConfirmationModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
        isDeleting={isDeleting}
        error={deleteError}
        testID={testID ? `${testID}-modal` : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.pageHorizontal,
    paddingBottom: spacing.s12,
    gap: spacing.s4,
  },
  heading: {
    ...textStyles.heading2,
    color: colors.foreground,
  },
  warningBlock: {
    backgroundColor: colors.primary10,
    borderRadius: 8,
    padding: spacing.s4,
  },
  warningText: {
    ...textStyles.body,
    color: colors.foreground,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.foreground,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    minHeight: spacing.touchTarget,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    ...textStyles.body,
    color: colors.foreground,
    flex: 1,
  },
  cooldownCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.s5,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.s2,
    alignItems: "center",
  },
  cooldownDays: {
    ...textStyles.heading3,
    color: colors.foreground,
  },
  cooldownBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
});
