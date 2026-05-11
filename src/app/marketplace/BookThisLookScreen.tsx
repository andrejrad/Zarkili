/**
 * BookThisLookScreen.tsx — W28 Batch H screen H.4
 *
 * Deep-link landing screen for "Book this look" social links.
 * Shows the look hero image, mapped service preview, and booking CTA.
 * Handles auth-gate banner for signed-out visitors.
 *
 * Presentation-only. Container wires auth state + navigation.
 *
 * States: matched | unmatched | unauthenticated | expired-link | error | loading
 */

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, radius, spacing, textStyles } from "../../shared/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BookLookState =
  | "matched"
  | "unmatched"
  | "unauthenticated"
  | "expired"
  | "error"
  | "loading";

export type MappedService = {
  serviceId: string;
  serviceName: string;
  salonName: string;
  priceFrom: number;
  currency: string;
  durationMinutes: number;
};

export type BookThisLookScreenProps = {
  lookState: BookLookState;
  lookTitle?: string;
  lookImageUri?: string;
  mappedService?: MappedService;
  isLoading?: boolean;
  onPressBook?: () => void;
  /** Navigate to similar looks / explore results */
  onPressFindSimilar?: () => void;
  /** Guest path: proceed to booking without account */
  onPressContinueAsGuest?: () => void;
  /** Auth gate: sign in */
  onPressSignIn?: () => void;
  onPressRetry?: () => void;
  onPressBack?: () => void;
  testID?: string;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function BookThisLookScreen({
  lookState,
  lookTitle,
  lookImageUri,
  mappedService,
  isLoading = false,
  onPressBook,
  onPressFindSimilar,
  onPressContinueAsGuest,
  onPressSignIn,
  onPressRetry,
  onPressBack,
  testID,
}: BookThisLookScreenProps) {
  // Loading
  if (isLoading || lookState === "loading") {
    return (
      <View style={styles.screen} testID={testID}>
        <View style={styles.heroShimmer} />
        <View style={styles.loadingBody}>
          <View style={[styles.shimmerLine, { width: "60%" }]} />
          <View style={[styles.shimmerLine, { width: "80%" }]} />
          <View style={[styles.shimmerLine, { width: "50%", marginTop: spacing.s4 }]} />
        </View>
      </View>
    );
  }

  // Expired link
  if (lookState === "expired") {
    return (
      <View style={[styles.screen, styles.centered]} testID={testID}>
        <Text style={styles.stateTitle}>This link has expired</Text>
        <Text style={styles.stateBody}>The post or booking link is no longer available.</Text>
        {onPressFindSimilar && (
          <Pressable accessibilityRole="button" onPress={onPressFindSimilar} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>Find similar looks</Text>
          </Pressable>
        )}
        {onPressBack && (
          <Pressable accessibilityRole="button" onPress={onPressBack} style={styles.ghostButton}>
            <Text style={styles.ghostButtonLabel}>Go back</Text>
          </Pressable>
        )}
      </View>
    );
  }

  // Generic error
  if (lookState === "error") {
    return (
      <View style={[styles.screen, styles.centered]} testID={testID}>
        <Text style={styles.stateTitle}>Something went wrong</Text>
        <Text style={styles.stateBody}>We couldn't load this look. Please try again.</Text>
        {onPressRetry && (
          <Pressable accessibilityRole="button" onPress={onPressRetry} style={styles.primaryButton}>
            <Text style={styles.primaryButtonLabel}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.screen} testID={testID}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero image */}
        <View style={styles.heroContainer}>
          {lookImageUri ? (
            <View style={styles.heroImagePlaceholder} />
          ) : (
            <View style={styles.heroImagePlaceholder} />
          )}
        </View>

        {/* Look title */}
        {lookTitle && (
          <Text
            style={styles.lookTitle}
            testID={testID ? `${testID}-title` : undefined}
          >
            {lookTitle}
          </Text>
        )}

        {/* Auth gate banner (unauthenticated) */}
        {lookState === "unauthenticated" && (
          <View style={styles.authGate} testID={testID ? `${testID}-auth-gate` : undefined}>
            <Text style={styles.authGateText}>
              Sign in to book — or continue as guest
            </Text>
            <View style={styles.authGateButtons}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                onPress={onPressSignIn}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
              >
                <Text style={styles.primaryButtonLabel}>Sign in</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Continue as guest"
                onPress={onPressContinueAsGuest}
                style={styles.ghostButton}
              >
                <Text style={styles.ghostButtonLabel}>Continue as guest</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Mapped service preview (matched state) */}
        {lookState === "matched" && mappedService && (
          <View style={styles.serviceCard} testID={testID ? `${testID}-service-card` : undefined}>
            <View style={styles.serviceCardBody}>
              <Text style={styles.serviceName}>{mappedService.serviceName}</Text>
              <Text style={styles.salonName}>{mappedService.salonName}</Text>
              <View style={styles.serviceMeta}>
                <Text style={styles.serviceMetaText}>
                  {mappedService.currency}{mappedService.priceFrom.toFixed(2)} · {mappedService.durationMinutes} min
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Book ${mappedService.serviceName}`}
              onPress={onPressBook}
              style={({ pressed }) => [styles.bookButton, pressed && styles.bookButtonPressed]}
              testID={testID ? `${testID}-book` : undefined}
            >
              <Text style={styles.bookButtonLabel}>Book now</Text>
            </Pressable>
          </View>
        )}

        {/* Unmatched state — suggest similar */}
        {lookState === "unmatched" && (
          <View style={styles.unmatchedContainer} testID={testID ? `${testID}-unmatched` : undefined}>
            <Text style={styles.unmatchedTitle}>We couldn't find an exact match</Text>
            <Text style={styles.unmatchedBody}>
              This service may not be available in your area yet. Try exploring similar looks nearby.
            </Text>
          </View>
        )}

        {/* Find similar CTA */}
        {(lookState === "unmatched" || lookState === "matched") && (
          <View style={styles.findSimilarContainer}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Find similar looks near you"
              onPress={onPressFindSimilar}
              style={({ pressed }) => [styles.findSimilarButton, pressed && styles.findSimilarButtonPressed]}
              testID={testID ? `${testID}-find-similar` : undefined}
            >
              <Text style={styles.findSimilarLabel}>Find similar near you</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.s12,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  // Loading
  heroShimmer: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.border,
  },
  loadingBody: {
    padding: spacing.pageHorizontal,
    gap: spacing.s3,
  },
  shimmerLine: {
    height: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.border,
  },
  // State screens
  stateTitle: {
    ...textStyles.heading3,
    color: colors.foreground,
    textAlign: "center",
  },
  stateBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  // Hero
  heroContainer: {
    width: "100%",
    aspectRatio: 1,
  },
  heroImagePlaceholder: {
    flex: 1,
    backgroundColor: colors.warmOat,
  },
  // Title
  lookTitle: {
    ...textStyles.heading2,
    color: colors.foreground,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s3,
  },
  // Auth gate
  authGate: {
    marginHorizontal: spacing.pageHorizontal,
    marginBottom: spacing.s4,
    padding: spacing.cardPadding,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.s3,
  },
  authGateText: {
    ...textStyles.body,
    color: colors.foreground,
    textAlign: "center",
  },
  authGateButtons: {
    gap: spacing.s2,
  },
  // Service card
  serviceCard: {
    marginHorizontal: spacing.pageHorizontal,
    marginBottom: spacing.s4,
    padding: spacing.cardPadding,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
  },
  serviceCardBody: {
    flex: 1,
    gap: spacing.s1,
  },
  serviceName: {
    ...textStyles.label,
    color: colors.foreground,
  },
  salonName: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  serviceMeta: {
    flexDirection: "row",
  },
  serviceMetaText: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  bookButton: {
    height: 44,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bookButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  bookButtonLabel: {
    ...textStyles.label,
    color: colors.white,
  },
  // Unmatched
  unmatchedContainer: {
    marginHorizontal: spacing.pageHorizontal,
    marginBottom: spacing.s4,
    gap: spacing.s2,
  },
  unmatchedTitle: {
    ...textStyles.heading4,
    color: colors.foreground,
  },
  unmatchedBody: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  // Find similar
  findSimilarContainer: {
    paddingHorizontal: spacing.pageHorizontal,
  },
  findSimilarButton: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  findSimilarButtonPressed: {
    backgroundColor: colors.primary10,
  },
  findSimilarLabel: {
    ...textStyles.label,
    color: colors.primary,
  },
  // Generic buttons
  primaryButton: {
    height: 52,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  primaryButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryButtonLabel: {
    ...textStyles.label,
    color: colors.white,
  },
  ghostButton: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostButtonLabel: {
    ...textStyles.label,
    color: colors.primary,
  },
});
