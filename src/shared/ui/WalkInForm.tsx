/**
 * WalkInForm.tsx — W31 Batch K primitive.
 *
 * Walk-in client capture form used at the front desk / staff quick-add flow.
 *
 * Fields:
 *   - Client name (text InputField)
 *   - Phone number (phone InputField)
 *   - Service selector chips (multi-select)
 *   - Optional notes (multiline TextInput)
 *
 * States: default | submitting | success | error
 */

import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { InputField } from "./InputField";
import { colors, radius, spacing } from "./tokens";

export type WalkInService = {
  id: string;
  name: string;
};

export type WalkInFormData = {
  clientName: string;
  phone: string;
  serviceIds: string[];
  notes: string;
};

export type WalkInFormState = "default" | "submitting" | "success" | "error";

export type WalkInFormProps = {
  services: WalkInService[];
  formState?: WalkInFormState;
  errorMessage?: string;
  onSubmit: (data: WalkInFormData) => void;
  /** Called when the user taps "Add another" after success. */
  onReset?: () => void;
  testID?: string;
};

export function WalkInForm({
  services,
  formState = "default",
  errorMessage,
  onSubmit,
  onReset,
  testID,
}: WalkInFormProps) {
  // ------------------------------------------------------------------
  // We keep internal form state; the parent owns async state transitions
  // ------------------------------------------------------------------
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  function toggleService(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    if (!clientName.trim()) return;
    onSubmit({
      clientName: clientName.trim(),
      phone: phone.trim(),
      serviceIds: selectedIds,
      notes: notes.trim(),
    });
  }

  function handleReset() {
    setClientName("");
    setPhone("");
    setSelectedIds([]);
    setNotes("");
    onReset?.();
  }

  const submitDisabled =
    !clientName.trim() || formState === "submitting";

  if (formState === "success") {
    return (
      <View
        style={styles.successContainer}
        testID={testID ? `${testID}-success` : undefined}
      >
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successHeadline}>Walk-in added!</Text>
        <Pressable
          onPress={handleReset}
          accessibilityRole="button"
          style={styles.addAnotherBtn}
          testID={testID ? `${testID}-add-another` : undefined}
        >
          <Text style={styles.addAnotherText}>Add another</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.root}
      showsVerticalScrollIndicator={false}
      testID={testID}
    >
      <View style={styles.formCard}>
        <InputField
          label="Client name"
          value={clientName}
          onChangeText={setClientName}
          variant="text"
          placeholder="First & last name"
          testID={testID ? `${testID}-name` : undefined}
        />

        <InputField
          label="Phone number"
          value={phone}
          onChangeText={setPhone}
          variant="phone"
          placeholder="+1 555 000 0000"
          testID={testID ? `${testID}-phone` : undefined}
        />
      </View>

      {services.length > 0 && (
        <View style={styles.serviceSection}>
          <Text style={styles.serviceLabel}>Service(s)</Text>
          <View
            style={styles.chipRow}
            testID={testID ? `${testID}-services` : undefined}
          >
            {services.map((svc) => {
              const selected = selectedIds.includes(svc.id);
              return (
                <Pressable
                  key={svc.id}
                  onPress={() => toggleService(svc.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  style={[styles.chip, selected && styles.chipSelected]}
                  testID={testID ? `${testID}-svc-${svc.id}` : undefined}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selected && styles.chipTextSelected,
                    ]}
                  >
                    {svc.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.notesSection}>
        <Text style={styles.serviceLabel}>Notes (optional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any details for the staff…"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={300}
          textAlignVertical="top"
          testID={testID ? `${testID}-notes` : undefined}
        />
      </View>

      {formState === "error" && (
        <Text
          style={styles.errorText}
          testID={testID ? `${testID}-error` : undefined}
        >
          {errorMessage ?? "Something went wrong. Please try again."}
        </Text>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={submitDisabled}
        accessibilityRole="button"
        style={[styles.submitBtn, submitDisabled && styles.submitBtnDisabled]}
        testID={testID ? `${testID}-submit` : undefined}
      >
        {formState === "submitting" ? (
          <ActivityIndicator
            color={colors.surface}
            size="small"
            testID={testID ? `${testID}-spinner` : undefined}
          />
        ) : (
          <Text style={styles.submitBtnText}>Add walk-in</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.s4,
    paddingBottom: spacing.s8,
  },
  serviceSection: {
    gap: spacing.s2,
  },
  serviceLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
  },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: colors.foreground,
  },
  chipTextSelected: {
    color: colors.surface,
    fontWeight: "500",
  },
  notesSection: {
    gap: spacing.s2,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    fontSize: 14,
    color: colors.foreground,
    minHeight: 80,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
  },
  submitBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface,
  },
  successContainer: {
    alignItems: "center",
    gap: spacing.s4,
    paddingVertical: spacing.s8,
  },
  successIcon: {
    fontSize: 48,
    color: colors.success,
  },
  successHeadline: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.foreground,
  },
  addAnotherBtn: {
    paddingHorizontal: spacing.s6,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  addAnotherText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s5,
    gap: spacing.s4,
  },
});
