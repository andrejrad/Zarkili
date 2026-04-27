/**
 * SalonOnboardingWizard.tsx
 *
 * Multi-step salon onboarding wizard:
 *   - Step list with status indicators
 *   - Step content panel (placeholder per step for v1)
 *   - Progress score + completion bar
 *   - Go-live blocker list
 *   - Skip / complete step actions
 *   - Resume support (currentStep highlighted)
 */

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  ONBOARDING_STEPS,
  GO_LIVE_REQUIRED_STEPS,
  type OnboardingStep,
  type OnboardingStepStatus,
  type SalonOnboardingState,
  type GoLiveBlocker,
} from "../../domains/onboarding/model";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const colors = {
  background: "#F2EDDD",
  surface: "#FFFFFF",
  border: "#E5E0D1",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  primary: "#E3A9A0",
  primaryPressed: "#CF8B80",
  accent: "#BBEDDA",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type SalonOnboardingWizardProps = {
  tenantId: string;
  wizardState: SalonOnboardingState | null;
  isLoading: boolean;

  /** Called when user confirms a step as complete */
  onCompleteStep: (step: OnboardingStep) => void;
  /** Called when user explicitly skips a non-required step */
  onSkipStep: (step: OnboardingStep) => void;
  /** Called when user clicks "Go Live" after all blockers resolved */
  onGoLive: () => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STEP_LABELS: Record<OnboardingStep, string> = {
  ACCOUNT: "Account Setup",
  BUSINESS_PROFILE: "Business Profile",
  PAYMENT_SETUP: "Payment Setup",
  SERVICES: "Services",
  STAFF: "Staff",
  POLICIES: "Cancellation Policies",
  AVAILABILITY: "Availability",
  MARKETPLACE_VISIBILITY: "Marketplace Visibility",
  VERIFICATION: "Verification",
};

function statusIcon(status: OnboardingStepStatus): string {
  switch (status) {
    case "completed": return "✓";
    case "in_progress": return "●";
    case "skipped": return "→";
    case "pending": return "○";
  }
}

function statusColor(status: OnboardingStepStatus): string {
  switch (status) {
    case "completed": return colors.success;
    case "in_progress": return colors.primary;
    case "skipped": return colors.muted;
    case "pending": return colors.border;
  }
}

function isRequired(step: OnboardingStep): boolean {
  return (GO_LIVE_REQUIRED_STEPS as readonly OnboardingStep[]).includes(step);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StepRow({
  step,
  status,
  isCurrent,
  onComplete,
  onSkip,
}: {
  step: OnboardingStep;
  status: OnboardingStepStatus;
  isCurrent: boolean;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const required = isRequired(step);
  return (
    <View style={[styles.stepRow, isCurrent && styles.stepRowCurrent]}>
      <Text style={[styles.stepIcon, { color: statusColor(status) }]}>
        {statusIcon(status)}
      </Text>
      <View style={styles.stepInfo}>
        <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]}>
          {STEP_LABELS[step]}
          {required && <Text style={styles.requiredBadge}> *</Text>}
        </Text>
        {isCurrent && status !== "completed" && status !== "skipped" && (
          <View style={styles.stepActions}>
            <Pressable
              style={styles.completeBtn}
              onPress={onComplete}
              accessibilityRole="button"
              accessibilityLabel={`Complete ${STEP_LABELS[step]}`}
            >
              <Text style={styles.completeBtnText}>Mark Complete</Text>
            </Pressable>
            {!required && (
              <Pressable
                style={styles.skipBtn}
                onPress={onSkip}
                accessibilityRole="button"
                accessibilityLabel={`Skip ${STEP_LABELS[step]}`}
              >
                <Text style={styles.skipBtnText}>Skip</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function BlockerList({ blockers }: { blockers: GoLiveBlocker[] }) {
  if (blockers.length === 0) return null;
  return (
    <View style={styles.blockerBox}>
      <Text style={styles.blockerTitle}>Required before going live:</Text>
      {blockers.map((b) => (
        <Text key={b.step} style={styles.blockerItem}>• {STEP_LABELS[b.step]}</Text>
      ))}
    </View>
  );
}

function ProgressBar({ score }: { score: number }) {
  return (
    <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: score }}>
      <View style={[styles.progressFill, { width: `${score}%` }]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function SalonOnboardingWizard({
  wizardState,
  isLoading,
  onCompleteStep,
  onSkipStep,
  onGoLive,
}: SalonOnboardingWizardProps) {
  if (isLoading || !wizardState) {
    return (
      <View style={styles.centered}>
        <Text style={styles.mutedText}>
          {isLoading ? "Loading…" : "Starting your onboarding…"}
        </Text>
      </View>
    );
  }

  const { stepStatuses, currentStep, completionScore, blockers, canGoLive } = wizardState;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Salon Setup Wizard</Text>
        <Text style={styles.scoreText}>{completionScore}% complete</Text>
        <ProgressBar score={completionScore} />
      </View>

      {/* Blocker list */}
      <BlockerList blockers={blockers} />

      {/* Step list */}
      <View style={styles.stepList}>
        {ONBOARDING_STEPS.map((step) => (
          <StepRow
            key={step}
            step={step}
            status={stepStatuses[step]}
            isCurrent={step === currentStep}
            onComplete={() => onCompleteStep(step)}
            onSkip={() => onSkipStep(step)}
          />
        ))}
      </View>

      {/* Go Live button */}
      <Pressable
        style={[styles.goLiveBtn, !canGoLive && styles.goLiveBtnDisabled]}
        onPress={onGoLive}
        disabled={!canGoLive}
        accessibilityRole="button"
        accessibilityLabel="Go Live"
        accessibilityState={{ disabled: !canGoLive }}
      >
        <Text style={styles.goLiveBtnText}>
          {canGoLive ? "🚀 Go Live!" : "Complete required steps to go live"}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  header: { marginBottom: 16 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 4 },
  scoreText: { fontSize: 13, color: colors.muted, marginBottom: 6 },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: 4 },
  blockerBox: {
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  blockerTitle: { fontSize: 13, fontWeight: "700", color: colors.warning, marginBottom: 4 },
  blockerItem: { fontSize: 13, color: colors.text, marginTop: 2 },
  stepList: { marginBottom: 24 },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepRowCurrent: { borderColor: colors.primary },
  stepIcon: { fontSize: 18, marginRight: 12, marginTop: 1 },
  stepInfo: { flex: 1 },
  stepLabel: { fontSize: 14, color: colors.text },
  stepLabelCurrent: { fontWeight: "700" },
  requiredBadge: { color: colors.error, fontWeight: "700" },
  stepActions: { flexDirection: "row", marginTop: 10, gap: 8 },
  completeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  completeBtnText: { fontSize: 13, fontWeight: "600", color: "#fff" },
  skipBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  skipBtnText: { fontSize: 13, color: colors.muted },
  goLiveBtn: {
    backgroundColor: colors.success,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  goLiveBtnDisabled: { backgroundColor: colors.border },
  goLiveBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  mutedText: { fontSize: 13, color: colors.muted },
});
