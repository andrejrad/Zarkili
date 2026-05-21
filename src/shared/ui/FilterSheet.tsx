/**
 * FilterSheet.tsx — B.C1 filter-sheet primitive.
 *
 * Modal bottom sheet wrapper with drag-handle header, scrollable body,
 * and sticky footer. The sheet is presentation-only — filter logic lives
 * in `discoveryFilters.ts` and is supplied via the children of the sheet.
 */

import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

import { Button } from "./Button";
import { colors, radius, spacing } from "./tokens";

export type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  onReset?: () => void;
  /** Sticky footer button label. Omit to hide the footer entirely (live-apply mode). */
  applyLabel?: string;
  onApply?: () => void;
  applyDisabled?: boolean;
  title?: string;
  children: ReactNode;
  testID?: string;
};

export function FilterSheet({
  visible,
  onClose,
  onReset,
  applyLabel,
  onApply,
  applyDisabled = false,
  title = "Filters",
  children,
  testID,
}: FilterSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={styles.scrim}
          onPress={onClose}
          accessibilityLabel="Close filters"
          accessibilityRole="button"
          testID={testID ? `${testID}-scrim` : undefined}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {onReset ? (
              <Pressable
                onPress={onReset}
                accessibilityRole="button"
                accessibilityLabel="Reset filters"
                testID={testID ? `${testID}-reset` : undefined}
                hitSlop={8}
              >
                <Text style={styles.resetText}>Reset</Text>
              </Pressable>
            ) : null}
          </View>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {onApply ? (
            <View style={styles.footer}>
              <Button
                label={applyLabel ?? "Done"}
                onPress={onApply}
                fullWidth
                disabled={applyDisabled}
                testID={testID ? `${testID}-apply` : undefined}
              />
            </View>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.black50,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: "90%",
    paddingBottom: spacing.s4,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginTop: spacing.s2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s4,
  },
  title: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    color: colors.foreground,
  },
  resetText: {
    color: colors.coralBlossom,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s4,
    gap: spacing.s5,
  },
  footer: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s3,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
