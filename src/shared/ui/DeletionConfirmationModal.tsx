/**
 * DeletionConfirmationModal.tsx — W29 Batch I account deletion confirm modal.
 *
 * Bottom-sheet requiring the user to type "DELETE" and re-enter their password.
 * The destructive CTA stays disabled until both fields pass validation.
 */

import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "./Button";
import { InputField } from "./InputField";
import { ModalSheet } from "./ModalSheet";
import { colors, spacing, textStyles } from "./tokens";

export type DeletionConfirmationModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  isDeleting?: boolean;
  error?: string | null;
  testID?: string;
};

const REQUIRED_PHRASE = "DELETE";

export function DeletionConfirmationModal({
  visible,
  onClose,
  onConfirm,
  isDeleting,
  error,
  testID,
}: DeletionConfirmationModalProps) {
  const [phrase, setPhrase] = useState("");
  const [password, setPassword] = useState("");

  const isValid = phrase === REQUIRED_PHRASE && password.length > 0;

  function handleConfirm() {
    if (isValid) onConfirm(password);
  }

  function handleClose() {
    setPhrase("");
    setPassword("");
    onClose();
  }

  return (
    <ModalSheet
      visible={visible}
      onClose={handleClose}
      title="Confirm deletion"
      testID={testID}
      footer={
        <Button
          label="Delete account"
          variant="destructive"
          disabled={!isValid || isDeleting}
          loading={isDeleting}
          onPress={handleConfirm}
          testID={testID ? `${testID}-confirm` : undefined}
        />
      }
    >
      <View style={styles.body}>
        <Text style={styles.warning}>
          This action is permanent and cannot be undone. Your account and all
          associated data will be deleted after a 30-day cooldown period.
        </Text>
        <InputField
          label='Type "DELETE" to confirm'
          value={phrase}
          onChangeText={setPhrase}
          testID={testID ? `${testID}-phrase` : undefined}
        />
        <View style={styles.gap} />
        <InputField
          label="Enter your password"
          value={password}
          onChangeText={setPassword}
          variant="password"
          testID={testID ? `${testID}-password` : undefined}
        />
        {error ? (
          <Text
            style={styles.error}
            accessibilityRole="alert"
            testID={testID ? `${testID}-error` : undefined}
          >
            {error}
          </Text>
        ) : null}
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingBottom: spacing.s4,
  },
  warning: {
    ...textStyles.body,
    color: colors.foreground,
    marginBottom: spacing.s4,
  },
  gap: {
    height: spacing.s4,
  },
  error: {
    ...textStyles.bodySmall,
    color: colors.error,
    marginTop: spacing.s3,
  },
});
