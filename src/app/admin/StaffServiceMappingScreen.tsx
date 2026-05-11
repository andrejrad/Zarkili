/**
 * W41-DEBT-6 — StaffServiceMappingScreen
 *
 * Assign services and skills to a staff member.
 * Renders a toggleable list of available services and a skills text input.
 * Pure presentation — all state management lives in the shell navigator.
 */
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceOption = {
  serviceId: string;
  name: string;
};

export type StaffServiceMappingScreenProps = {
  staffName: string;
  /** IDs of services currently assigned to this staff member. */
  assignedServiceIds: string[];
  /** Current skill tags (free text). */
  skills: string[];
  /** Full list of services available in this tenant. */
  serviceOptions: ServiceOption[];
  submitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
  onToggleService: (serviceId: string) => void;
  /** Called with the raw comma-separated input value so the shell can parse. */
  onSkillsChange: (raw: string) => void;
  onSave: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StaffServiceMappingScreen({
  staffName,
  assignedServiceIds,
  skills,
  serviceOptions,
  submitting,
  submitError,
  submitSuccess,
  onToggleService,
  onSkillsChange,
  onSave,
  onBack,
  testID,
}: StaffServiceMappingScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.root}
      testID={testID ?? "staff-service-mapping-screen"}
    >
      {/* Back */}
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ {staffName}</Text>
      </Pressable>

      <Text style={styles.pageTitle}>Services & skills</Text>
      <Text style={styles.pageSubtitle}>
        Select which services this staff member can perform.
      </Text>

      {/* Service toggles */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Assigned services</Text>
        {serviceOptions.length === 0 ? (
          <Text style={styles.emptyLabel}>No services found. Add services first.</Text>
        ) : (
          serviceOptions.map((svc) => {
            const assigned = assignedServiceIds.includes(svc.serviceId);
            return (
              <Pressable
                key={svc.serviceId}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: assigned }}
                onPress={() => onToggleService(svc.serviceId)}
                style={styles.serviceRow}
                testID={`service-toggle-${svc.serviceId}`}
              >
                <View style={[styles.checkbox, assigned && styles.checkboxActive]}>
                  {assigned ? <Text style={styles.checkmark}>✓</Text> : null}
                </View>
                <Text style={styles.serviceLabel}>{svc.name}</Text>
              </Pressable>
            );
          })
        )}
      </View>

      {/* Skills input */}
      <View style={styles.card}>
        <Text style={styles.sectionHeader}>Skills</Text>
        <Text style={styles.fieldHint}>
          Comma-separated tags, e.g. balayage, nail art, threading
        </Text>
        <TextInput
          accessibilityLabel="Skills"
          autoCapitalize="none"
          autoCorrect={false}
          multiline
          numberOfLines={3}
          onChangeText={onSkillsChange}
          placeholder="balayage, nail art…"
          style={styles.skillsInput}
          testID="skills-input"
          value={skills.join(", ")}
        />
      </View>

      {/* Feedback */}
      {submitError ? (
        <Text style={styles.errorText} testID="mapping-submit-error">
          {submitError}
        </Text>
      ) : null}
      {submitSuccess ? (
        <Text style={styles.successText} testID="mapping-submit-success">
          {submitSuccess}
        </Text>
      ) : null}

      {/* Save */}
      <Pressable
        accessibilityRole="button"
        disabled={submitting}
        onPress={onSave}
        style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
        testID="save-mapping-btn"
      >
        <Text style={styles.saveBtnLabel}>
          {submitting ? "Saving…" : "Save mapping"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    backgroundColor: "#FAFAFA",
    padding: 16,
    gap: 12,
  },
  backRow: {
    paddingVertical: 4,
    marginBottom: 8,
  },
  backLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#4F7FD4",
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: brandTypography.semibold,
    color: "#1A1A2E",
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#666",
    marginBottom: 8,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: brandTypography.semibold,
    color: "#1A1A2E",
    marginBottom: 4,
  },
  emptyLabel: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#999",
    textAlign: "center",
    paddingVertical: 8,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#4F7FD4",
    borderColor: "#4F7FD4",
  },
  checkmark: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
  },
  serviceLabel: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A2E",
    flex: 1,
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: brandTypography.regular,
    color: "#999",
  },
  skillsInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    padding: 10,
    minHeight: 72,
    textAlignVertical: "top",
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#1A1A2E",
  },
  errorText: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#D00",
    textAlign: "center",
    marginTop: 4,
  },
  successText: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#0A8A0A",
    textAlign: "center",
    marginTop: 4,
  },
  saveBtn: {
    backgroundColor: "#4F7FD4",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnLabel: {
    fontSize: 15,
    fontFamily: brandTypography.semibold,
    color: "#FFFFFF",
  },
});
