/**
 * W15-DEBT-1 — OnboardingAdminScreen
 *
 * Platform-admin / tenant-owner view of salon onboarding:
 *   - Status dashboard: step statuses, completion score, go-live blockers
 *   - Action buttons: Extend Trial, Reset Step, Verification Override
 *   - Audit timeline: append-only list of past admin actions
 */
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type {
  OnboardingStep,
  OnboardingStepStatus,
  OnboardingTimelineEvent,
  SalonOnboardingState,
} from "../../domains/onboarding/model";
import { ONBOARDING_STEPS } from "../../domains/onboarding/model";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STEP_LABELS: Record<OnboardingStep, string> = {
  ACCOUNT: "Account",
  BUSINESS_PROFILE: "Business Profile",
  PAYMENT_SETUP: "Payment Setup",
  SERVICES: "Services",
  STAFF: "Staff",
  POLICIES: "Policies",
  AVAILABILITY: "Availability",
  MARKETPLACE_VISIBILITY: "Marketplace",
  VERIFICATION: "Verification",
};

const STATUS_COLOR: Record<OnboardingStepStatus, string> = {
  pending: "#9ca3af",
  in_progress: "#f59e0b",
  completed: "#16a34a",
  skipped: "#6366f1",
};

const STATUS_BG: Record<OnboardingStepStatus, string> = {
  pending: "#f3f4f6",
  in_progress: "#fef3c7",
  completed: "#dcfce7",
  skipped: "#ede9fe",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type OnboardingAdminScreenProps = {
  loading: boolean;
  error: string | null;
  onboardingState: SalonOnboardingState | null;
  timeline: OnboardingTimelineEvent[];
  timelineLoading: boolean;
  extendTrialSubmitting: boolean;
  extendTrialError: string | null;
  resetStepSubmitting: boolean;
  resetStepError: string | null;
  verificationOverrideSubmitting: boolean;
  verificationOverrideError: string | null;
  onExtendTrial: (daysAdded: number, reason: string) => void;
  onResetStep: (step: OnboardingStep, reason: string) => void;
  onVerificationOverride: (reason: string) => void;
  onReloadTimeline: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function OnboardingAdminScreen({
  loading,
  error,
  onboardingState,
  timeline,
  timelineLoading,
  extendTrialSubmitting,
  extendTrialError,
  resetStepSubmitting,
  resetStepError,
  verificationOverrideSubmitting,
  verificationOverrideError,
  onExtendTrial,
  onResetStep,
  onVerificationOverride,
  onReloadTimeline,
  onRetry,
  onBack,
  testID = "onboarding-admin-screen",
}: OnboardingAdminScreenProps) {
  // Local form state
  const [trialDays, setTrialDays] = useState("7");
  const [trialReason, setTrialReason] = useState("");
  const [selectedStep, setSelectedStep] = useState<OnboardingStep>("ACCOUNT");
  const [resetReason, setResetReason] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [activeAction, setActiveAction] = useState<"extend_trial" | "reset_step" | "verification_override" | null>(null);

  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Onboarding Admin</Text>
      </View>

      {loading ? <AdminLoadingState label="Loading onboarding state…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {/* Status dashboard */}
      {!loading && !error && onboardingState ? (
        <View testID="onboarding-status-dashboard">
          {/* Score / go-live */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Completion</Text>
              <Text style={styles.scoreValue}>{onboardingState.completionScore}%</Text>
            </View>
            <View style={[styles.goLiveBadge, onboardingState.canGoLive ? styles.goLiveBadgeGreen : styles.goLiveBadgeRed]}>
              <Text style={styles.goLiveBadgeText}>
                {onboardingState.canGoLive ? "Ready to go live" : "Not ready"}
              </Text>
            </View>
          </View>

          {/* Step status grid */}
          <Text style={styles.sectionTitle}>Step Statuses</Text>
          <View style={styles.stepGrid}>
            {ONBOARDING_STEPS.map((step) => {
              const status = onboardingState.stepStatuses[step] ?? "pending";
              const isCurrent = onboardingState.currentStep === step;
              return (
                <View
                  key={step}
                  testID={`step-status-${step}`}
                  style={[styles.stepCard, { backgroundColor: STATUS_BG[status] }, isCurrent && styles.stepCardCurrent]}
                >
                  <Text style={styles.stepName}>{STEP_LABELS[step]}</Text>
                  <Text style={[styles.stepStatus, { color: STATUS_COLOR[status] }]}>
                    {status}{isCurrent ? " (current)" : ""}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* Blockers */}
          {onboardingState.blockers.length > 0 ? (
            <View style={styles.blockerBox} testID="blocker-list">
              <Text style={styles.blockerTitle}>Go-live Blockers</Text>
              {onboardingState.blockers.map((b) => (
                <Text key={b.step} style={styles.blockerItem}>
                  • {STEP_LABELS[b.step]}: {b.reason}
                </Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {!loading && !error && !onboardingState ? (
        <AdminEmptyState
          title="No Onboarding State"
          body="This tenant has not started onboarding yet."
        />
      ) : null}

      {/* Action panel */}
      {!loading && !error ? (
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Admin Actions</Text>

          {/* Extend Trial */}
          <Pressable
            onPress={() => setActiveAction(activeAction === "extend_trial" ? null : "extend_trial")}
            style={styles.actionHeader}
            accessibilityRole="button"
            testID="toggle-extend-trial"
          >
            <Text style={styles.actionHeaderText}>Extend Trial</Text>
            <Text style={styles.actionChevron}>{activeAction === "extend_trial" ? "▲" : "▼"}</Text>
          </Pressable>
          {activeAction === "extend_trial" ? (
            <View style={styles.actionForm} testID="extend-trial-form">
              <Text style={styles.formLabel}>Days to add</Text>
              <TextInput
                style={styles.input}
                value={trialDays}
                onChangeText={setTrialDays}
                keyboardType="number-pad"
                placeholder="7"
                testID="trial-days-input"
              />
              <Text style={styles.formLabel}>Reason (required)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={trialReason}
                onChangeText={setTrialReason}
                placeholder="Reason for extension…"
                multiline
                testID="trial-reason-input"
              />
              {extendTrialError ? (
                <Text style={styles.errorText} testID="extend-trial-error">{extendTrialError}</Text>
              ) : null}
              <Pressable
                onPress={() => {
                  const days = parseInt(trialDays, 10);
                  if (!Number.isNaN(days) && days > 0 && trialReason.trim().length > 0) {
                    onExtendTrial(days, trialReason.trim());
                  }
                }}
                disabled={extendTrialSubmitting}
                style={[styles.submitBtn, extendTrialSubmitting && styles.submitBtnDisabled]}
                accessibilityRole="button"
                testID="extend-trial-submit"
              >
                <Text style={styles.submitBtnText}>
                  {extendTrialSubmitting ? "Saving…" : "Extend Trial"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Reset Step */}
          <Pressable
            onPress={() => setActiveAction(activeAction === "reset_step" ? null : "reset_step")}
            style={styles.actionHeader}
            accessibilityRole="button"
            testID="toggle-reset-step"
          >
            <Text style={styles.actionHeaderText}>Reset Step</Text>
            <Text style={styles.actionChevron}>{activeAction === "reset_step" ? "▲" : "▼"}</Text>
          </Pressable>
          {activeAction === "reset_step" ? (
            <View style={styles.actionForm} testID="reset-step-form">
              <Text style={styles.formLabel}>Step to reset</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepPicker}>
                {ONBOARDING_STEPS.map((step) => (
                  <Pressable
                    key={step}
                    onPress={() => setSelectedStep(step)}
                    style={[styles.stepChip, selectedStep === step && styles.stepChipActive]}
                    testID={`step-chip-${step}`}
                  >
                    <Text style={[styles.stepChipText, selectedStep === step && styles.stepChipTextActive]}>
                      {STEP_LABELS[step]}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.formLabel}>Reason (required)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={resetReason}
                onChangeText={setResetReason}
                placeholder="Reason for reset…"
                multiline
                testID="reset-reason-input"
              />
              {resetStepError ? (
                <Text style={styles.errorText} testID="reset-step-error">{resetStepError}</Text>
              ) : null}
              <Pressable
                onPress={() => {
                  if (resetReason.trim().length > 0) {
                    onResetStep(selectedStep, resetReason.trim());
                  }
                }}
                disabled={resetStepSubmitting}
                style={[styles.submitBtn, resetStepSubmitting && styles.submitBtnDisabled]}
                accessibilityRole="button"
                testID="reset-step-submit"
              >
                <Text style={styles.submitBtnText}>
                  {resetStepSubmitting ? "Saving…" : "Reset Step"}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Verification Override */}
          <Pressable
            onPress={() => setActiveAction(activeAction === "verification_override" ? null : "verification_override")}
            style={styles.actionHeader}
            accessibilityRole="button"
            testID="toggle-verification-override"
          >
            <Text style={styles.actionHeaderText}>Verification Override</Text>
            <Text style={styles.actionChevron}>{activeAction === "verification_override" ? "▲" : "▼"}</Text>
          </Pressable>
          {activeAction === "verification_override" ? (
            <View style={styles.actionForm} testID="verification-override-form">
              <Text style={styles.formNote}>
                Marks the VERIFICATION step as completed without the tenant completing it. Use only when manual review has been done.
              </Text>
              <Text style={styles.formLabel}>Reason (required)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                value={overrideReason}
                onChangeText={setOverrideReason}
                placeholder="Reason for override…"
                multiline
                testID="override-reason-input"
              />
              {verificationOverrideError ? (
                <Text style={styles.errorText} testID="verification-override-error">{verificationOverrideError}</Text>
              ) : null}
              <Pressable
                onPress={() => {
                  if (overrideReason.trim().length > 0) {
                    onVerificationOverride(overrideReason.trim());
                  }
                }}
                disabled={verificationOverrideSubmitting}
                style={[styles.submitBtn, styles.submitBtnWarning, verificationOverrideSubmitting && styles.submitBtnDisabled]}
                accessibilityRole="button"
                testID="verification-override-submit"
              >
                <Text style={styles.submitBtnText}>
                  {verificationOverrideSubmitting ? "Saving…" : "Apply Override"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Audit timeline */}
      <View style={styles.timelineSection}>
        <View style={styles.timelineHeader}>
          <Text style={styles.sectionTitle}>Audit Timeline</Text>
          <Pressable
            onPress={onReloadTimeline}
            accessibilityRole="button"
            testID="reload-timeline-btn"
            style={styles.reloadBtn}
          >
            <Text style={styles.reloadBtnText}>Refresh</Text>
          </Pressable>
        </View>
        {timelineLoading ? <AdminLoadingState label="Loading timeline…" /> : null}
        {!timelineLoading && timeline.length === 0 ? (
          <Text style={styles.emptyTimeline} testID="timeline-empty">No audit events yet.</Text>
        ) : null}
        {timeline.map((event) => (
          <View key={event.eventId} style={styles.eventCard} testID={`timeline-event-${event.eventId}`}>
            <View style={styles.eventTop}>
              <Text style={styles.eventAction}>{event.action.replace(/_/g, " ")}</Text>
              <Text style={styles.eventRole}>{event.actorRole}</Text>
            </View>
            <Text style={styles.eventReason}>{event.reason}</Text>
            {Object.keys(event.details).length > 0 ? (
              <Text style={styles.eventDetails}>
                {JSON.stringify(event.details)}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 48 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  backBtn: { marginRight: 12, padding: 4 },
  backText: { ...brandTypography.bodyMedium, color: "#6b7280" },
  title: { ...brandTypography.headingMedium, flex: 1 },

  sectionTitle: { ...brandTypography.labelLarge, marginTop: 20, marginBottom: 8 },

  scoreRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  scoreBox: { backgroundColor: "#f1f5f9", borderRadius: 8, padding: 12, alignItems: "center", minWidth: 80 },
  scoreLabel: { ...brandTypography.caption, color: "#6b7280" },
  scoreValue: { ...brandTypography.headingMedium, color: "#1e293b" },

  goLiveBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  goLiveBadgeGreen: { backgroundColor: "#dcfce7" },
  goLiveBadgeRed: { backgroundColor: "#fee2e2" },
  goLiveBadgeText: { ...brandTypography.labelSmall },

  stepGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stepCard: { borderRadius: 8, padding: 10, minWidth: "46%", flexGrow: 1 },
  stepCardCurrent: { borderWidth: 2, borderColor: "#6366f1" },
  stepName: { ...brandTypography.labelSmall, color: "#1e293b", marginBottom: 2 },
  stepStatus: { ...brandTypography.caption },

  blockerBox: { marginTop: 12, backgroundColor: "#fff7ed", borderRadius: 8, padding: 12 },
  blockerTitle: { ...brandTypography.labelMedium, color: "#c2410c", marginBottom: 4 },
  blockerItem: { ...brandTypography.bodySmall, color: "#c2410c" },

  actionsSection: { marginTop: 16 },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  actionHeaderText: { ...brandTypography.labelMedium, color: "#1e293b" },
  actionChevron: { ...brandTypography.bodySmall, color: "#6b7280" },

  actionForm: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderTopWidth: 0,
  },
  formLabel: { ...brandTypography.labelSmall, color: "#374151", marginTop: 10, marginBottom: 4 },
  formNote: { ...brandTypography.bodySmall, color: "#6b7280", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    ...brandTypography.bodyMedium,
    color: "#111827",
  },
  inputMultiline: { height: 72, textAlignVertical: "top" },

  errorText: { ...brandTypography.bodySmall, color: "#dc2626", marginTop: 6 },

  submitBtn: {
    marginTop: 12,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  submitBtnWarning: { backgroundColor: "#f59e0b" },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { ...brandTypography.labelMedium, color: "#ffffff" },

  stepPicker: { marginBottom: 8 },
  stepChip: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#f3f4f6",
    marginRight: 6,
  },
  stepChipActive: { backgroundColor: "#6366f1" },
  stepChipText: { ...brandTypography.caption, color: "#374151" },
  stepChipTextActive: { color: "#ffffff" },

  timelineSection: { marginTop: 24 },
  timelineHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reloadBtn: { padding: 6, backgroundColor: "#f1f5f9", borderRadius: 6 },
  reloadBtnText: { ...brandTypography.caption, color: "#4b5563" },
  emptyTimeline: { ...brandTypography.bodyMedium, color: "#9ca3af", textAlign: "center", marginTop: 12 },
  eventCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#6366f1",
  },
  eventTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  eventAction: { ...brandTypography.labelSmall, color: "#1e293b", textTransform: "capitalize" },
  eventRole: { ...brandTypography.caption, color: "#6b7280" },
  eventReason: { ...brandTypography.bodySmall, color: "#374151" },
  eventDetails: { ...brandTypography.caption, color: "#9ca3af", marginTop: 4 },
});
