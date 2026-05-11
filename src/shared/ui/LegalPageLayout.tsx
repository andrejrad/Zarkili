/**
 * LegalPageLayout.tsx — W29 Batch I legal page container primitive.
 *
 * Layout: back header + heading-3 title, last-updated label-small muted,
 * optional horizontal jump-link chip-row, scrollable body slot,
 * optional sticky footer slot.
 */

import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";

export type LegalJumpLink = {
  id: string;
  label: string;
};

export type LegalPageLayoutProps = {
  title: string;
  lastUpdated?: string;
  jumpLinks?: LegalJumpLink[];
  onJumpLink?: (id: string) => void;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  testID?: string;
};

export function LegalPageLayout({
  title,
  lastUpdated,
  jumpLinks,
  onJumpLink,
  children,
  footer,
  onBack,
  testID,
}: LegalPageLayoutProps) {
  return (
    <View style={styles.container} testID={testID}>
      {/* Header row */}
      <View style={styles.header}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
            testID={testID ? `${testID}-back` : undefined}
          >
            <Text style={styles.backArrow}>{"←"}</Text>
          </Pressable>
        ) : null}
        <Text
          style={styles.title}
          testID={testID ? `${testID}-title` : undefined}
        >
          {title}
        </Text>
      </View>

      {lastUpdated ? (
        <Text style={styles.updated}>{`Updated ${lastUpdated}`}</Text>
      ) : null}

      {/* Jump-link chip row */}
      {jumpLinks && jumpLinks.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.jumpRow}
          testID={testID ? `${testID}-jump-links` : undefined}
        >
          {jumpLinks.map((link) => (
            <TouchableOpacity
              key={link.id}
              style={styles.chip}
              onPress={() => onJumpLink?.(link.id)}
              accessibilityRole="button"
              testID={testID ? `${testID}-jump-${link.id}` : undefined}
            >
              <Text style={styles.chipLabel}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        testID={testID ? `${testID}-scroll` : undefined}
      >
        {children}
      </ScrollView>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s6,
    paddingBottom: spacing.s4,
    gap: spacing.s3,
  },
  backBtn: {
    minWidth: spacing.touchTarget,
    minHeight: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  backArrow: {
    ...textStyles.heading3,
    color: colors.foreground,
  },
  title: {
    ...textStyles.heading3,
    color: colors.foreground,
    flex: 1,
  },
  updated: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
    paddingHorizontal: spacing.pageHorizontal,
    marginBottom: spacing.s3,
  },
  jumpRow: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s3,
    gap: spacing.s2,
  },
  chip: {
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipLabel: {
    ...textStyles.labelSmall,
    color: colors.foreground,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s8,
  },
  footer: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
