/**
 * W41 — StaffCommissionScreen
 *
 * Commission & payout configuration for a single staff member.
 * W41-DEBT-2: adds inline edit mode so admins can update commission settings.
 */
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

import { AdminSectionRow } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StaffCommissionConfig = {
  /** Percentage 0–100 */
  commissionRate: number;
  /** "percentage" | "flat_per_booking" */
  model: "percentage" | "flat_per_booking";
  /** Flat rate in USD cents (only used when model is flat_per_booking) */
  flatRateCents: number | null;
  /**
   * Payout schedule: "weekly" | "biweekly" | "monthly"
   */
  payoutSchedule: "weekly" | "biweekly" | "monthly";
  currency: string;
};

export type StaffCommissionScreenProps = {
  staffName: string;
  config: StaffCommissionConfig | null;
  onBack: () => void;
  testID?: string;
  // --- Edit mode ---
  editMode?: boolean;
  onToggleEditMode?: () => void;
  /** Controlled string values for form inputs */
  editRate?: string;
  editFlatRate?: string;
  editModel?: StaffCommissionConfig["model"];
  editSchedule?: StaffCommissionConfig["payoutSchedule"];
  onRateChange?: (value: string) => void;
  onFlatRateChange?: (value: string) => void;
  onModelChange?: (model: StaffCommissionConfig["model"]) => void;
  onScheduleChange?: (schedule: StaffCommissionConfig["payoutSchedule"]) => void;
  onSave?: () => void;
  submitting?: boolean;
  submitError?: string | null;
  submitSuccess?: string | null;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function modelLabel(model: StaffCommissionConfig["model"]): string {
  return model === "percentage" ? "Percentage of booking value" : "Flat rate per booking";
}

function scheduleLabel(schedule: StaffCommissionConfig["payoutSchedule"]): string {
  const map = { weekly: "Weekly", biweekly: "Every two weeks", monthly: "Monthly" };
  return map[schedule];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StaffCommissionScreen({
  staffName,
  config,
  onBack,
  testID,
  editMode = false,
  onToggleEditMode,
  editRate = "",
  editFlatRate = "",
  editModel = "percentage",
  editSchedule = "monthly",
  onRateChange,
  onFlatRateChange,
  onModelChange,
  onScheduleChange,
  onSave,
  submitting = false,
  submitError = null,
  submitSuccess = null,
}: StaffCommissionScreenProps) {
  const MODELS: StaffCommissionConfig["model"][] = ["percentage", "flat_per_booking"];
  const SCHEDULES: StaffCommissionConfig["payoutSchedule"][] = [
    "weekly",
    "biweekly",
    "monthly",
  ];

  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID ?? "staff-commission-screen"}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ {staffName}</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Commission & payout</Text>

      {/* Edit toggle */}
      {onToggleEditMode ? (
        <Pressable
          accessibilityRole="button"
          onPress={onToggleEditMode}
          style={styles.editToggleBtn}
          testID="commission-edit-toggle"
        >
          <Text style={styles.editToggleLabel}>{editMode ? "Cancel" : "Edit"}</Text>
        </Pressable>
      ) : null}

      {/* ---- EDIT MODE ---- */}
      {editMode ? (
        <View style={styles.card}>
          {/* Model picker */}
          <Text style={styles.fieldLabel}>Commission model</Text>
          <View style={styles.chipRow}>
            {MODELS.map((m) => (
              <Pressable
                key={m}
                accessibilityRole="button"
                accessibilityState={{ selected: editModel === m }}
                onPress={() => onModelChange?.(m)}
                style={[styles.chip, editModel === m && styles.chipActive]}
                testID={`commission-model-${m === "percentage" ? "percentage" : "flat"}`}
              >
                <Text style={[styles.chipLabel, editModel === m && styles.chipLabelActive]}>
                  {modelLabel(m)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Rate or flat */}
          {editModel === "percentage" ? (
            <>
              <Text style={styles.fieldLabel}>Commission rate (%)</Text>
              <TextInput
                accessibilityLabel="Commission rate"
                keyboardType="decimal-pad"
                onChangeText={onRateChange}
                placeholder="e.g. 15"
                style={styles.input}
                testID="commission-rate-input"
                value={editRate}
              />
            </>
          ) : (
            <>
              <Text style={styles.fieldLabel}>Flat rate (cents)</Text>
              <TextInput
                accessibilityLabel="Flat rate in cents"
                keyboardType="number-pad"
                onChangeText={onFlatRateChange}
                placeholder="e.g. 2500 = €25.00"
                style={styles.input}
                testID="commission-flat-input"
                value={editFlatRate}
              />
            </>
          )}

          {/* Payout schedule */}
          <Text style={styles.fieldLabel}>Payout schedule</Text>
          <View style={styles.chipRow}>
            {SCHEDULES.map((s) => (
              <Pressable
                key={s}
                accessibilityRole="button"
                accessibilityState={{ selected: editSchedule === s }}
                onPress={() => onScheduleChange?.(s)}
                style={[styles.chip, editSchedule === s && styles.chipActive]}
                testID={`commission-schedule-${s}`}
              >
                <Text style={[styles.chipLabel, editSchedule === s && styles.chipLabelActive]}>
                  {scheduleLabel(s)}
                </Text>
              </Pressable>
            ))}
          </View>

          {submitError ? (
            <Text style={styles.errorText} testID="commission-submit-error">
              {submitError}
            </Text>
          ) : null}
          {submitSuccess ? (
            <Text style={styles.successText} testID="commission-submit-success">
              {submitSuccess}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            disabled={submitting}
            onPress={onSave}
            style={[styles.saveBtn, submitting && styles.saveBtnDisabled]}
            testID="commission-save-btn"
          >
            <Text style={styles.saveBtnLabel}>{submitting ? "Saving…" : "Save changes"}</Text>
          </Pressable>
        </View>
      ) : (
        /* ---- DISPLAY MODE ---- */
        <>
          <Text style={styles.pageSubtitle}>
            {config ? "Current configuration." : "Tap Edit to add the first commission config."}
          </Text>
          {!config ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyLabel}>
                No commission configuration set for this staff member.
              </Text>
            </View>
          ) : (
            <View style={styles.card}>
              <AdminSectionRow
                label="Commission model"
                sublabel={modelLabel(config.model)}
                testID="commission-model"
              />
              {config.model === "percentage" ? (
                <AdminSectionRow
                  label="Commission rate"
                  sublabel={`${config.commissionRate}%`}
                  testID="commission-rate"
                />
              ) : (
                <AdminSectionRow
                  label="Flat rate"
                  sublabel={
                    config.flatRateCents !== null
                      ? `${config.currency} ${(config.flatRateCents / 100).toFixed(2)}`
                      : "—"
                  }
                  testID="commission-flat"
                />
              )}
              <AdminSectionRow
                label="Payout schedule"
                sublabel={scheduleLabel(config.payoutSchedule)}
                testID="commission-schedule"
              />
              <AdminSectionRow
                label="Currency"
                sublabel={config.currency}
                testID="commission-currency"
              />
            </View>
          )}
        </>
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
    marginBottom: 8,
  },
  editToggleBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#5E3A8C",
  },
  editToggleLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#5E3A8C",
  },
  card: {
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    padding: 16,
    gap: 12,
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
  fieldLabel: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#444",
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: brandTypography.regular,
    color: "#1A1A2E",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8B4E8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FAF6FF",
  },
  chipActive: {
    backgroundColor: "#5E3A8C",
    borderColor: "#5E3A8C",
  },
  chipLabel: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#5E3A8C",
  },
  chipLabelActive: {
    color: "#FFFFFF",
  },
  errorText: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#D00",
    textAlign: "center",
  },
  successText: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#0A8A0A",
    textAlign: "center",
  },
  saveBtn: {
    backgroundColor: "#5E3A8C",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
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
