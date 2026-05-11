/**
 * W41 — StaffInviteScreen
 *
 * Invite a new staff member by email address and role.
 * The invite service backend lands in W43; in V1 the screen collects input
 * and fires an onSubmit callback that the shell handles.
 */
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { StaffRole } from "../../domains/staff/model";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const ROLES: StaffRole[] = ["owner", "manager", "technician", "assistant"];

export type StaffInviteScreenProps = {
  email: string;
  role: StaffRole;
  locationId: string;
  submitting: boolean;
  formError: string | null;
  submitError: string | null;
  submitSuccess: string | null;
  onEmailChange: (value: string) => void;
  onRoleChange: (role: StaffRole) => void;
  onLocationIdChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StaffInviteScreen({
  email,
  role,
  locationId,
  submitting,
  formError,
  submitError,
  submitSuccess,
  onEmailChange,
  onRoleChange,
  onLocationIdChange,
  onSubmit,
  onBack,
  testID,
}: StaffInviteScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID ?? "staff-invite-screen"}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Staff list</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Invite staff</Text>
      <Text style={styles.pageSubtitle}>Send an email invitation to join this location.</Text>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>Email address</Text>
        <TextInput
          accessibilityLabel="Email address"
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={onEmailChange}
          placeholder="jane@example.com"
          style={styles.input}
          value={email}
          testID="invite-email-input"
        />

        <Text style={styles.inputLabel}>Location ID</Text>
        <TextInput
          accessibilityLabel="Location ID"
          onChangeText={onLocationIdChange}
          placeholder="loc_abc123"
          style={styles.input}
          value={locationId}
          testID="invite-location-input"
        />

        <Text style={styles.inputLabel}>Role</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <Pressable
              key={r}
              accessibilityRole="button"
              accessibilityState={{ selected: role === r }}
              onPress={() => onRoleChange(r)}
              style={[styles.roleChip, role === r && styles.roleChipSelected]}
              testID={`invite-role-${r}`}
            >
              <Text
                style={[styles.roleChipLabel, role === r && styles.roleChipLabelSelected]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        {formError ? (
          <Text style={styles.errorText} testID="invite-form-error">{formError}</Text>
        ) : null}
        {submitError ? (
          <Text style={styles.errorText} testID="invite-submit-error">{submitError}</Text>
        ) : null}
        {submitSuccess ? (
          <Text style={styles.successText} testID="invite-success">{submitSuccess}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={onSubmit}
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          testID="invite-submit-btn"
        >
          <Text style={styles.submitBtnLabel}>
            {submitting ? "Sending…" : "Send invitation"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    padding: 16,
    gap: 12,
  },
  backRow: {
    marginBottom: 4,
  },
  backLabel: {
    fontSize: 14,
    color: "#5E3A8C",
    fontFamily: brandTypography.medium,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: brandTypography.semibold,
    color: "#1A1A2E",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#6B6B6B",
    fontFamily: brandTypography.regular,
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 16,
    padding: 16,
    gap: 8,
    backgroundColor: "#FFFFFF",
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#1A1A2E",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#C4B9A0",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A2E",
    backgroundColor: "#FAFAFA",
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  roleChip: {
    borderWidth: 1,
    borderColor: "#C4B9A0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: "#FAFAFA",
  },
  roleChipSelected: {
    borderColor: "#5E3A8C",
    backgroundColor: "#EDE7F6",
  },
  roleChipLabel: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#6B6B6B",
  },
  roleChipLabelSelected: {
    color: "#5E3A8C",
  },
  errorText: {
    fontSize: 13,
    color: "#C0392B",
    fontFamily: brandTypography.regular,
  },
  successText: {
    fontSize: 13,
    color: "#27AE60",
    fontFamily: brandTypography.regular,
  },
  submitBtn: {
    backgroundColor: "#5E3A8C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: brandTypography.semibold,
  },
});
