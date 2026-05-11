/**
 * ThreeDsOverlay.tsx — W30 Batch J shared primitive.
 *
 * Full-screen scrim overlay rendering a centred 320×420 white card that
 * represents the bank's 3D-Secure iframe. Four states are supported:
 *   - pending   : spinner + "Verifying with your bank…"
 *   - approved  : success banner (mint-fresh) + "Payment approved"
 *   - declined  : error banner (error red) + reason text
 *   - timeout   : warning banner + "Verification timed out" + retry/cancel
 *
 * The cancel (×) button is always visible top-right of the card.
 */

import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type ThreeDsState = "pending" | "approved" | "declined" | "timeout";

export type ThreeDsOverlayProps = {
  visible: boolean;
  state?: ThreeDsState;
  /** Decline reason shown in the declined state. */
  declineReason?: string;
  onCancel: () => void;
  onRetry?: () => void;
  testID?: string;
};

const BANNER_BG: Record<Exclude<ThreeDsState, "pending">, string> = {
  approved: colors.accent,
  declined: colors.error,
  timeout: "#FF9800",
};

const BANNER_TEXT: Record<Exclude<ThreeDsState, "pending">, string> = {
  approved: "Payment approved",
  declined: "Payment declined",
  timeout: "Verification timed out",
};

export function ThreeDsOverlay({
  visible,
  state = "pending",
  declineReason,
  onCancel,
  onRetry,
  testID,
}: ThreeDsOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      testID={testID}
    >
      <View style={styles.scrim}>
        <View style={styles.card} testID={testID ? `${testID}-card` : undefined}>
          {/* Cancel button — always visible */}
          <Pressable
            style={styles.cancelBtn}
            onPress={onCancel}
            hitSlop={8}
            accessibilityLabel="Cancel verification"
            accessibilityRole="button"
            testID={testID ? `${testID}-cancel` : undefined}
          >
            <Text style={styles.cancelIcon}>✕</Text>
          </Pressable>

          {/* Banner (approved / declined / timeout) */}
          {state !== "pending" && (
            <View
              style={[styles.banner, { backgroundColor: BANNER_BG[state] }]}
              testID={testID ? `${testID}-banner` : undefined}
            >
              <Text style={styles.bannerText}>{BANNER_TEXT[state]}</Text>
              {state === "declined" && declineReason ? (
                <Text style={styles.bannerSub}>{declineReason}</Text>
              ) : null}
            </View>
          )}

          {/* Main card content */}
          <View style={styles.body}>
            {state === "pending" && (
              <>
                <ActivityIndicator
                  color={colors.primary}
                  size="large"
                  testID={testID ? `${testID}-spinner` : undefined}
                />
                <Text style={styles.pendingText}>Verifying with your bank…</Text>
                <View
                  style={styles.iframePlaceholder}
                  testID={testID ? `${testID}-iframe` : undefined}
                >
                  <Text style={styles.iframeLabel}>Bank authentication frame</Text>
                </View>
              </>
            )}

            {state === "timeout" && (
              <View style={styles.timeoutActions}>
                {onRetry && (
                  <Pressable
                    style={styles.retryBtn}
                    onPress={onRetry}
                    accessibilityRole="button"
                    testID={testID ? `${testID}-retry` : undefined}
                  >
                    <Text style={styles.retryText}>Try again</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={onCancel}
                  accessibilityRole="button"
                  testID={testID ? `${testID}-cancel-link` : undefined}
                >
                  <Text style={styles.cancelLink}>Cancel payment</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: 320,
    height: 420,
    backgroundColor: colors.surface,
    borderRadius: 24, // 2xl
    overflow: "hidden",
  },
  cancelBtn: {
    position: "absolute",
    top: spacing.s3,
    right: spacing.s3,
    zIndex: 10,
    padding: spacing.s2,
  },
  cancelIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
  banner: {
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s4,
    alignItems: "center",
  },
  bannerText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface,
  },
  bannerSub: {
    fontSize: 13,
    color: colors.surface,
    marginTop: 2,
    opacity: 0.9,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.s6,
    gap: spacing.s4,
  },
  pendingText: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: "center",
  },
  iframePlaceholder: {
    width: "100%",
    height: 200,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  iframeLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  timeoutActions: {
    gap: spacing.s3,
    alignItems: "center",
  },
  retryBtn: {
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s8,
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  retryText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface,
  },
  cancelLink: {
    fontSize: 14,
    color: colors.textMuted,
    textDecorationLine: "underline",
  },
});
