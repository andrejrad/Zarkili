/**
 * PlatformCrossScreens.tsx — W32 Batch L (L.1)
 *
 * Cross-cutting platform screens shown at the app-shell level.
 *
 * Exports:
 *   ForceUpdateScreen         — blocks use until app is updated
 *   MaintenanceModeScreen     — app is temporarily offline for maintenance
 *   OfflineScreen             — full-page fallback when no connectivity at launch
 *   ServerErrorFallbackScreen — generic server error with retry
 *   FeatureFlagDisabledScreen — feature not available in this region/version
 *   DeepLinkFallbackScreen    — cold-start deep link could not be resolved
 */

import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { ForceUpdateGate } from "../../shared/ui/ForceUpdateGate";
import { OfflineBanner } from "../../shared/ui/OfflineBanner";
import { colors, radius, spacing } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// ForceUpdateScreen
// ---------------------------------------------------------------------------

export type ForceUpdateScreenProps = {
  currentVersion: string;
  minVersion: string;
  onUpdatePress: () => void;
  testID?: string;
};

export function ForceUpdateScreen({
  currentVersion,
  minVersion,
  onUpdatePress,
  testID,
}: ForceUpdateScreenProps) {
  return (
    <ForceUpdateGate
      visible
      currentVersion={currentVersion}
      minVersion={minVersion}
      onUpdatePress={onUpdatePress}
      testID={testID}
    />
  );
}

// ---------------------------------------------------------------------------
// MaintenanceModeScreen
// ---------------------------------------------------------------------------

export type MaintenanceModeScreenProps = {
  estimatedEndTime?: string;
  onRefresh: () => void;
  testID?: string;
};

export function MaintenanceModeScreen({
  estimatedEndTime,
  onRefresh,
  testID,
}: MaintenanceModeScreenProps) {
  return (
    <SafeAreaView style={styles.fullPage} testID={testID}>
      <View style={styles.centre}>
        <Text style={styles.bigIcon}>🛠️</Text>
        <Text style={styles.title} testID={testID ? `${testID}-title` : undefined}>
          Down for maintenance
        </Text>
        <Text style={styles.body} testID={testID ? `${testID}-body` : undefined}>
          We're making Zarkili even better. This should only take a little while.
        </Text>
        {estimatedEndTime && (
          <Text style={styles.eta} testID={testID ? `${testID}-eta` : undefined}>
            Expected back: {estimatedEndTime}
          </Text>
        )}
        <Pressable
          onPress={onRefresh}
          accessibilityRole="button"
          style={styles.primaryBtn}
          testID={testID ? `${testID}-refresh` : undefined}
        >
          <Text style={styles.primaryBtnText}>Check again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// OfflineScreen
// ---------------------------------------------------------------------------

export type OfflineScreenProps = {
  onRetry: () => void;
  testID?: string;
};

export function OfflineScreen({ onRetry, testID }: OfflineScreenProps) {
  return (
    <SafeAreaView style={styles.fullPage} testID={testID}>
      <OfflineBanner
        status="offline"
        onRetry={onRetry}
        testID={testID ? `${testID}-banner` : undefined}
      />
      <View style={styles.centre}>
        <Text style={styles.bigIcon}>📡</Text>
        <Text style={styles.title} testID={testID ? `${testID}-title` : undefined}>
          No internet connection
        </Text>
        <Text style={styles.body}>
          Check your connection and try again.
        </Text>
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={styles.primaryBtn}
          testID={testID ? `${testID}-retry` : undefined}
        >
          <Text style={styles.primaryBtnText}>Try again</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// ServerErrorFallbackScreen
// ---------------------------------------------------------------------------

export type ServerErrorFallbackScreenProps = {
  errorCode?: string;
  onRetry: () => void;
  onGoHome?: () => void;
  testID?: string;
};

export function ServerErrorFallbackScreen({
  errorCode,
  onRetry,
  onGoHome,
  testID,
}: ServerErrorFallbackScreenProps) {
  return (
    <SafeAreaView style={styles.fullPage} testID={testID}>
      <View style={styles.centre}>
        <Text style={styles.bigIcon}>⚠️</Text>
        <Text style={styles.title} testID={testID ? `${testID}-title` : undefined}>
          Something went wrong
        </Text>
        <Text style={styles.body}>
          We couldn't load this page. Our team has been notified.
        </Text>
        {errorCode && (
          <Text style={styles.errorCode} testID={testID ? `${testID}-code` : undefined}>
            Error: {errorCode}
          </Text>
        )}
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={styles.primaryBtn}
          testID={testID ? `${testID}-retry` : undefined}
        >
          <Text style={styles.primaryBtnText}>Try again</Text>
        </Pressable>
        {onGoHome && (
          <Pressable
            onPress={onGoHome}
            accessibilityRole="button"
            testID={testID ? `${testID}-home` : undefined}
          >
            <Text style={styles.ghostText}>Go to home</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// FeatureFlagDisabledScreen
// ---------------------------------------------------------------------------

export type FeatureFlagDisabledScreenProps = {
  featureName: string;
  reason?: "region" | "version" | "role" | "beta";
  onGoBack: () => void;
  testID?: string;
};

const FLAG_REASON: Record<string, string> = {
  region: "This feature isn't available in your region yet.",
  version: "Update the app to access this feature.",
  role: "This feature requires a different account type.",
  beta: "This feature is in beta and not yet available to all users.",
};

export function FeatureFlagDisabledScreen({
  featureName,
  reason = "region",
  onGoBack,
  testID,
}: FeatureFlagDisabledScreenProps) {
  return (
    <SafeAreaView style={styles.fullPage} testID={testID}>
      <View style={styles.centre}>
        <Text style={styles.bigIcon}>🚧</Text>
        <Text style={styles.title} testID={testID ? `${testID}-title` : undefined}>
          {featureName} isn't available
        </Text>
        <Text style={styles.body} testID={testID ? `${testID}-reason` : undefined}>
          {FLAG_REASON[reason]}
        </Text>
        <Pressable
          onPress={onGoBack}
          accessibilityRole="button"
          style={styles.primaryBtn}
          testID={testID ? `${testID}-back` : undefined}
        >
          <Text style={styles.primaryBtnText}>Go back</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// DeepLinkFallbackScreen
// ---------------------------------------------------------------------------

export type DeepLinkFallbackScreenProps = {
  deepLink?: string;
  onGoHome: () => void;
  onGoBack?: () => void;
  testID?: string;
};

export function DeepLinkFallbackScreen({
  deepLink,
  onGoHome,
  onGoBack,
  testID,
}: DeepLinkFallbackScreenProps) {
  return (
    <SafeAreaView style={styles.fullPage} testID={testID}>
      <View style={styles.centre}>
        <Text style={styles.bigIcon}>🔗</Text>
        <Text style={styles.title} testID={testID ? `${testID}-title` : undefined}>
          Link not found
        </Text>
        <Text style={styles.body}>
          The link you followed couldn't be resolved. It may have expired or
          been removed.
        </Text>
        {deepLink && (
          <Text style={styles.errorCode} testID={testID ? `${testID}-link` : undefined}>
            {deepLink}
          </Text>
        )}
        <Pressable
          onPress={onGoHome}
          accessibilityRole="button"
          style={styles.primaryBtn}
          testID={testID ? `${testID}-home` : undefined}
        >
          <Text style={styles.primaryBtnText}>Go to home</Text>
        </Pressable>
        {onGoBack && (
          <Pressable
            onPress={onGoBack}
            accessibilityRole="button"
            testID={testID ? `${testID}-back` : undefined}
          >
            <Text style={styles.ghostText}>Go back</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  fullPage: { flex: 1, backgroundColor: colors.background },
  centre: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  bigIcon: { fontSize: 64 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  eta: { fontSize: 13, color: colors.textMuted, fontStyle: "italic" },
  errorCode: { fontSize: 12, color: colors.textMuted, fontFamily: "monospace" },
  primaryBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
  ghostText: { fontSize: 14, color: colors.textMuted },
});
