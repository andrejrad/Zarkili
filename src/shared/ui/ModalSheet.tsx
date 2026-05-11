/**
 * ModalSheet.tsx — Batch C modal-sheet primitive.
 *
 * Generic bottom sheet shell: drag handle, header with title + close X,
 * scrollable body, optional sticky footer slot. Distinct from `FilterSheet`
 * (W22), which is filter-specific (reset/apply footer).
 */

import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ReactNode } from "react";

import { colors, radius, spacing } from "./tokens";

export type ModalSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Optional content rendered in a sticky footer below the scroll body. */
  footer?: ReactNode;
  testID?: string;
};

export function ModalSheet({
  visible,
  onClose,
  title,
  children,
  footer,
  testID,
}: ModalSheetProps) {
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
          accessibilityLabel="Close"
          accessibilityRole="button"
          testID={testID ? `${testID}-scrim` : undefined}
        />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          {title ? (
            <View style={styles.header}>
              <Text style={styles.title}>{title}</Text>
              <Pressable
                onPress={onClose}
                accessibilityLabel="Close"
                accessibilityRole="button"
                hitSlop={8}
                testID={testID ? `${testID}-close` : undefined}
              >
                <Text style={styles.close}>{"\u2715"}</Text>
              </Pressable>
            </View>
          ) : null}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.black50,
  },
  scrim: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: "90%",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: spacing.s2,
    marginBottom: spacing.s2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.foreground,
  },
  close: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.foreground,
    width: 44,
    height: 44,
    textAlign: "right",
    textAlignVertical: "center",
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s4,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
