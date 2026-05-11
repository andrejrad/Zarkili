/**
 * W41 — StaffRoleScreen
 *
 * Role assignment picker with a read-only audit trail of past changes.
 * The audit log entries are passed in as props; the real audit service lands
 * in W43. In V1 the shell provides the current role and a save callback.
 */
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { StaffRole } from "../../domains/staff/model";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const ROLES: StaffRole[] = ["owner", "manager", "technician", "assistant"];

export type StaffRoleAuditEntry = {
  id: string;
  changedBy: string;
  fromRole: StaffRole;
  toRole: StaffRole;
  /** ISO-8601 date string */
  changedAt: string;
  reason: string | null;
};

export type StaffRoleScreenProps = {
  staffName: string;
  currentRole: StaffRole;
  pendingRole: StaffRole;
  auditTrail: StaffRoleAuditEntry[];
  submitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
  onRoleChange: (role: StaffRole) => void;
  onSave: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StaffRoleScreen({
  staffName,
  currentRole,
  pendingRole,
  auditTrail,
  submitting,
  submitError,
  submitSuccess,
  onRoleChange,
  onSave,
  onBack,
  testID,
}: StaffRoleScreenProps) {
  const hasChange = pendingRole !== currentRole;

  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID ?? "staff-role-screen"}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ {staffName}</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Role assignment</Text>
      <Text style={styles.pageSubtitle}>
        Current role: <Text style={styles.currentRoleLabel}>{currentRole}</Text>
      </Text>

      {/* Role picker */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Assign role</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <Pressable
              key={r}
              accessibilityRole="button"
              accessibilityState={{ selected: pendingRole === r }}
              onPress={() => onRoleChange(r)}
              style={[styles.roleChip, pendingRole === r && styles.roleChipSelected]}
              testID={`role-option-${r}`}
            >
              <Text
                style={[styles.roleChipLabel, pendingRole === r && styles.roleChipLabelSelected]}
              >
                {r}
              </Text>
            </Pressable>
          ))}
        </View>

        {submitError ? (
          <Text style={styles.errorText} testID="role-submit-error">{submitError}</Text>
        ) : null}
        {submitSuccess ? (
          <Text style={styles.successText} testID="role-submit-success">{submitSuccess}</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting || !hasChange}
          onPress={onSave}
          style={[styles.saveBtn, (submitting || !hasChange) && styles.saveBtnDisabled]}
          testID="role-save-btn"
        >
          <Text style={styles.saveBtnLabel}>
            {submitting ? "Saving…" : "Save role"}
          </Text>
        </Pressable>
      </View>

      {/* Audit trail */}
      <Text style={styles.sectionHeader}>Audit trail</Text>
      {auditTrail.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyLabel}>No role changes recorded.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {auditTrail.map((entry) => (
            <View key={entry.id} style={styles.auditEntry} testID={`audit-entry-${entry.id}`}>
              <Text style={styles.auditDate}>{entry.changedAt}</Text>
              <Text style={styles.auditLine}>
                {entry.fromRole} → {entry.toRole}
              </Text>
              <Text style={styles.auditBy}>Changed by {entry.changedBy}</Text>
              {entry.reason ? (
                <Text style={styles.auditReason}>{entry.reason}</Text>
              ) : null}
            </View>
          ))}
        </View>
      )}
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
    marginBottom: 4,
  },
  currentRoleLabel: {
    fontFamily: brandTypography.semibold,
    color: "#1A1A2E",
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: brandTypography.semibold,
    color: "#1A1A2E",
    marginTop: 4,
  },
  card: {
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 16,
    padding: 16,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  emptyCard: {
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#FAFAFA",
  },
  emptyLabel: {
    fontSize: 14,
    color: "#6B6B6B",
    fontFamily: brandTypography.regular,
  },
  roleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  saveBtn: {
    backgroundColor: "#5E3A8C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: brandTypography.semibold,
  },
  auditEntry: {
    gap: 2,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0EBE0",
  },
  auditDate: {
    fontSize: 12,
    color: "#9E9E9E",
    fontFamily: brandTypography.regular,
  },
  auditLine: {
    fontSize: 14,
    fontFamily: brandTypography.semibold,
    color: "#1A1A2E",
  },
  auditBy: {
    fontSize: 13,
    color: "#6B6B6B",
    fontFamily: brandTypography.regular,
  },
  auditReason: {
    fontSize: 12,
    color: "#6B6B6B",
    fontFamily: brandTypography.regular,
    fontStyle: "italic",
  },
});
