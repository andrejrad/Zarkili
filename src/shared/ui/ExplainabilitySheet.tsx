/**
 * ExplainabilitySheet.tsx — W31 Batch K primitive.
 *
 * A `ModalSheet` wrapper that explains why the user received a particular
 * AI suggestion.  Uses reason chips + a paragraph, plus a "Don't show me
 * content like this" opt-out CTA.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { ModalSheet } from "./ModalSheet";
import { colors, radius, spacing } from "./tokens";

export type ExplainabilityReason = {
  id: string;
  label: string;
};

export type ExplainabilitySheetProps = {
  visible: boolean;
  /** Short paragraph text explaining the recommendation. */
  explanation: string;
  /** Optional list of compact reason chips (e.g. "Based on your history"). */
  reasons?: ExplainabilityReason[];
  onDismiss: () => void;
  onOptOut?: () => void;
  testID?: string;
};

export function ExplainabilitySheet({
  visible,
  explanation,
  reasons = [],
  onDismiss,
  onOptOut,
  testID,
}: ExplainabilitySheetProps) {
  return (
    <ModalSheet
      visible={visible}
      onClose={onDismiss}
      title="Why did I get this?"
      testID={testID}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {reasons.length > 0 && (
          <View
            style={styles.chipsRow}
            testID={testID ? `${testID}-chips` : undefined}
          >
            {reasons.map((r) => (
              <View key={r.id} style={styles.chip}>
                <Text style={styles.chipText}>{r.label}</Text>
              </View>
            ))}
          </View>
        )}

        <Text
          style={styles.explanation}
          testID={testID ? `${testID}-explanation` : undefined}
        >
          {explanation}
        </Text>

        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          style={styles.dismissBtn}
          testID={testID ? `${testID}-dismiss` : undefined}
        >
          <Text style={styles.dismissBtnText}>Got it</Text>
        </Pressable>

        {onOptOut && (
          <Pressable
            onPress={onOptOut}
            accessibilityRole="button"
            style={styles.optOutBtn}
            testID={testID ? `${testID}-opt-out` : undefined}
          >
            <Text style={styles.optOutText}>
              Don't show me content like this
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s6,
    gap: spacing.s4,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
  },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "500",
  },
  explanation: {
    fontSize: 15,
    color: colors.foreground,
    lineHeight: 22,
  },
  dismissBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  dismissBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface,
  },
  optOutBtn: {
    height: spacing.touchTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  optOutText: {
    fontSize: 14,
    color: colors.error,
    textDecorationLine: "underline",
  },
});
