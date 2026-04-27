/**
 * ClientOnboardingScreens.tsx
 *
 * UI for the client onboarding journeys:
 *   - GuestOnboardingBanner  — compact booking-confirmation + upgrade prompt
 *   - UpgradeAccountPanel    — email/password / social CTA for guest → full
 *   - ClientModuleList       — checklist of optional onboarding modules
 *   - ClientOnboardingProgress — progress summary (% complete)
 *
 * All components are purely props-driven. Business logic lives in
 * clientOnboardingOrchestrator.ts.
 */

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  GuestBookingContext,
  OnboardingModule,
  OnboardingSession,
} from "./clientOnboardingOrchestrator";

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
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const MODULE_LABELS: Record<OnboardingModule, string> = {
  profile: "Personal Profile",
  payment: "Payment Method",
  preferences: "Preferences",
  notifications: "Notifications",
  loyalty: "Loyalty Programme",
};

const MODULE_DESCRIPTIONS: Record<OnboardingModule, string> = {
  profile: "Add your name and photo",
  payment: "Save a card for faster checkout",
  preferences: "Choose language and currency",
  notifications: "Control how we contact you",
  loyalty: "Earn points on every visit",
};

const ALL_MODULES: OnboardingModule[] = [
  "profile",
  "payment",
  "preferences",
  "notifications",
  "loyalty",
];

// ---------------------------------------------------------------------------
// GuestOnboardingBanner
// ---------------------------------------------------------------------------

export type GuestOnboardingBannerProps = {
  bookingContext: GuestBookingContext;
  onUpgrade: () => void;
  onDismiss: () => void;
};

export function GuestOnboardingBanner({
  bookingContext,
  onUpgrade,
  onDismiss,
}: GuestOnboardingBannerProps) {
  return (
    <View style={styles.banner}>
      <View style={styles.bannerBody}>
        <Text style={styles.bannerTitle}>Booking confirmed!</Text>
        <Text style={styles.bannerSubtitle}>
          {bookingContext.email} • {bookingContext.slotAt}
        </Text>
        <Text style={styles.bannerCta}>
          Create a free account to manage bookings and earn loyalty points.
        </Text>
      </View>
      <View style={styles.bannerActions}>
        <Pressable
          style={styles.primaryBtn}
          onPress={onUpgrade}
          accessibilityRole="button"
          accessibilityLabel="Create account"
        >
          <Text style={styles.primaryBtnText}>Create Account</Text>
        </Pressable>
        <Pressable
          style={styles.ghostBtn}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Continue as guest"
        >
          <Text style={styles.ghostBtnText}>Continue as guest</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// UpgradeAccountPanel
// ---------------------------------------------------------------------------

export type UpgradeAccountPanelProps = {
  guestEmail: string;
  onEmailSignUp: (email: string, password: string) => void;
  onGoogleSignUp: () => void;
  onAppleSignUp: () => void;
  /** True while async sign-up is in progress */
  isLoading?: boolean;
};

export function UpgradeAccountPanel({
  guestEmail,
  onEmailSignUp,
  onGoogleSignUp,
  onAppleSignUp,
  isLoading = false,
}: UpgradeAccountPanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>Create your account</Text>
      <Text style={styles.panelSubtitle}>
        Using: <Text style={styles.bold}>{guestEmail}</Text>
      </Text>
      <Text style={styles.panelNote}>
        Your booking and payment details will be preserved.
      </Text>

      {isLoading ? (
        <Text style={styles.mutedText}>Creating account…</Text>
      ) : (
        <View style={styles.authOptions}>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => onEmailSignUp(guestEmail, "")}
            accessibilityRole="button"
            accessibilityLabel="Sign up with email"
          >
            <Text style={styles.primaryBtnText}>Sign up with Email</Text>
          </Pressable>
          <Pressable
            style={styles.socialBtn}
            onPress={onGoogleSignUp}
            accessibilityRole="button"
            accessibilityLabel="Sign up with Google"
          >
            <Text style={styles.socialBtnText}>Continue with Google</Text>
          </Pressable>
          <Pressable
            style={styles.socialBtn}
            onPress={onAppleSignUp}
            accessibilityRole="button"
            accessibilityLabel="Sign up with Apple"
          >
            <Text style={styles.socialBtnText}>Continue with Apple</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ModuleRow
// ---------------------------------------------------------------------------

function ModuleRow({
  module,
  completed,
  onComplete,
  onSkip,
}: {
  module: OnboardingModule;
  completed: boolean;
  onComplete: () => void;
  onSkip: () => void;
}) {
  return (
    <View style={[styles.moduleRow, completed && styles.moduleRowDone]}>
      <View style={styles.moduleIcon}>
        <Text style={{ color: completed ? colors.success : colors.muted }}>
          {completed ? "✓" : "○"}
        </Text>
      </View>
      <View style={styles.moduleInfo}>
        <Text style={styles.moduleLabel}>{MODULE_LABELS[module]}</Text>
        <Text style={styles.moduleDescription}>{MODULE_DESCRIPTIONS[module]}</Text>
      </View>
      {!completed && (
        <View style={styles.moduleActions}>
          <Pressable
            style={styles.smallPrimaryBtn}
            onPress={onComplete}
            accessibilityRole="button"
            accessibilityLabel={`Complete ${MODULE_LABELS[module]}`}
          >
            <Text style={styles.smallPrimaryBtnText}>Set up</Text>
          </Pressable>
          <Pressable
            style={styles.smallGhostBtn}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel={`Skip ${MODULE_LABELS[module]}`}
          >
            <Text style={styles.smallGhostBtnText}>Skip</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ClientModuleList
// ---------------------------------------------------------------------------

export type ClientModuleListProps = {
  completedModules: OnboardingModule[];
  onCompleteModule: (module: OnboardingModule) => void;
  onSkipModule: (module: OnboardingModule) => void;
};

export function ClientModuleList({
  completedModules,
  onCompleteModule,
  onSkipModule,
}: ClientModuleListProps) {
  return (
    <View style={styles.moduleList} accessibilityLabel="Onboarding modules">
      {ALL_MODULES.map((m) => (
        <ModuleRow
          key={m}
          module={m}
          completed={completedModules.includes(m)}
          onComplete={() => onCompleteModule(m)}
          onSkip={() => onSkipModule(m)}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// ClientOnboardingProgress
// ---------------------------------------------------------------------------

export type ClientOnboardingProgressProps = {
  session: OnboardingSession;
  onCompleteModule: (module: OnboardingModule) => void;
  onSkipModule: (module: OnboardingModule) => void;
  onFinish: () => void;
};

export function ClientOnboardingProgress({
  session,
  onCompleteModule,
  onSkipModule,
  onFinish,
}: ClientOnboardingProgressProps) {
  const total = ALL_MODULES.length;
  const done = session.completedModules.length;
  const pct = Math.round((done / total) * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>
          {session.mode === "guest" ? "Guest Booking" : "Account Setup"}
        </Text>
        <Text style={styles.progressScore}>{pct}% complete</Text>
        <View
          style={styles.progressTrack}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: pct }}
        >
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>

      {/* Booking context pill (guest + upgraded sessions) */}
      {session.bookingContext && (
        <View style={styles.bookingPill}>
          <Text style={styles.bookingPillText}>
            Booking preserved: {session.bookingContext.slotAt}
          </Text>
        </View>
      )}

      {/* Module list */}
      <ClientModuleList
        completedModules={session.completedModules}
        onCompleteModule={onCompleteModule}
        onSkipModule={onSkipModule}
      />

      {/* Finish CTA */}
      <Pressable
        style={[styles.primaryBtn, styles.finishBtn]}
        onPress={onFinish}
        accessibilityRole="button"
        accessibilityLabel="Finish setup"
      >
        <Text style={styles.primaryBtnText}>
          {done === total ? "All done! Let's go" : "Finish setup"}
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
  content: { padding: 20, gap: 16 },

  // Banner
  banner: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  bannerBody: { gap: 4 },
  bannerTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  bannerSubtitle: { fontSize: 13, color: colors.muted },
  bannerCta: { fontSize: 14, color: colors.text, marginTop: 4 },
  bannerActions: { flexDirection: "row", gap: 10 },

  // Panel
  panel: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  panelTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  panelSubtitle: { fontSize: 14, color: colors.muted },
  panelNote: {
    fontSize: 13,
    color: colors.success,
    fontStyle: "italic",
  },
  authOptions: { gap: 10, marginTop: 8 },

  // Buttons
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  primaryBtnText: { color: colors.surface, fontWeight: "700", fontSize: 15 },
  ghostBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostBtnText: { color: colors.muted, fontSize: 14 },
  socialBtn: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialBtnText: { color: colors.text, fontSize: 15 },
  finishBtn: { marginTop: 8 },
  smallPrimaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  smallPrimaryBtnText: { color: colors.surface, fontSize: 13, fontWeight: "600" },
  smallGhostBtn: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  smallGhostBtnText: { color: colors.muted, fontSize: 13 },

  // Module list
  moduleList: { gap: 8 },
  moduleRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  moduleRowDone: { borderColor: colors.success, opacity: 0.75 },
  moduleIcon: { width: 24, alignItems: "center" },
  moduleInfo: { flex: 1 },
  moduleLabel: { fontSize: 14, fontWeight: "600", color: colors.text },
  moduleDescription: { fontSize: 12, color: colors.muted },
  moduleActions: { flexDirection: "row", gap: 6 },

  // Progress header
  progressHeader: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  progressScore: { fontSize: 14, color: colors.muted },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  // Booking pill
  bookingPill: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: "flex-start",
  },
  bookingPillText: { fontSize: 12, color: colors.text },

  // Misc
  bold: { fontWeight: "700" },
  mutedText: { color: colors.muted, fontSize: 14 },
});
