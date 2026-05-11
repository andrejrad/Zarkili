/**
 * ShareSheetScreen.tsx — W28 Batch H screen H.3
 *
 * Share sheet bottom modal. Shows:
 *  – Header "Share post"
 *  – App contacts row (share-target-row)
 *  – System apps icon row
 *  – Action row: Copy link · Save image · Report post
 *  – Optional message note input
 *
 * Presentation-only. Parent renders inside a ModalSheet.
 *
 * States: default | link-copied (toast) | sending | error
 */

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ShareTargetRow, colors, radius, spacing, textStyles } from "../../shared/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShareContact = {
  contactId: string;
  name: string;
  initials: string;
  selected: boolean;
};

export type ShareSheetScreenProps = {
  contacts: ShareContact[];
  noteValue: string;
  linkCopied?: boolean;
  isSending?: boolean;
  isError?: boolean;
  onPressContact?: (contactId: string) => void;
  onChangeNote?: (text: string) => void;
  onPressCopyLink?: () => void;
  onPressSaveImage?: () => void;
  onPressReport?: () => void;
  onPressSend?: () => void;
  onPressClose?: () => void;
  testID?: string;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ShareSheetScreen({
  contacts,
  noteValue,
  linkCopied = false,
  isSending = false,
  isError = false,
  onPressContact,
  onChangeNote,
  onPressCopyLink,
  onPressSaveImage,
  onPressReport,
  onPressSend,
  onPressClose,
  testID,
}: ShareSheetScreenProps) {
  return (
    <View style={styles.sheet} testID={testID}>
      {/* Handle bar */}
      <View style={styles.handle} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Share post</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onPressClose}
          hitSlop={8}
          style={styles.closeButton}
        >
          <Text style={styles.closeIcon}>✕</Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* App contacts */}
        {contacts.length > 0 && (
          <View style={styles.section}>
            {contacts.map((contact, index) => (
              <ShareTargetRow
                key={contact.contactId}
                name={contact.name}
                initials={contact.initials}
                selected={contact.selected}
                showSeparator={index < contacts.length - 1}
                onPress={() => onPressContact?.(contact.contactId)}
                testID={testID ? `${testID}-contact-${contact.contactId}` : undefined}
              />
            ))}
          </View>
        )}

        {/* System apps row */}
        <View style={styles.systemAppsRow}>
          {SYSTEM_APP_LABELS.map((app) => (
            <View key={app.id} style={styles.systemApp}>
              <View style={[styles.systemAppIcon, { backgroundColor: app.color }]}>
                <Text style={styles.systemAppEmoji}>{app.emoji}</Text>
              </View>
              <Text style={styles.systemAppLabel} numberOfLines={1}>{app.label}</Text>
            </View>
          ))}
        </View>

        {/* Note input */}
        <View style={styles.noteContainer}>
          <TextInput
            accessible
            accessibilityLabel="Add a note"
            placeholder="Add a note..."
            placeholderTextColor={colors.textMuted}
            value={noteValue}
            onChangeText={onChangeNote}
            style={styles.noteInput}
            multiline
            maxLength={200}
            testID={testID ? `${testID}-note-input` : undefined}
          />
        </View>

        {/* Action row */}
        <View style={styles.actionSection}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={linkCopied ? "Link copied" : "Copy link"}
            onPress={onPressCopyLink}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
            testID={testID ? `${testID}-copy-link` : undefined}
          >
            <View style={styles.actionIconBox}>
              <Text style={styles.actionEmoji}>🔗</Text>
            </View>
            <Text style={styles.actionLabel}>
              {linkCopied ? "Link copied!" : "Copy link"}
            </Text>
            {linkCopied && <Text style={styles.checkmark}>✓</Text>}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save image"
            onPress={onPressSaveImage}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
            testID={testID ? `${testID}-save-image` : undefined}
          >
            <View style={styles.actionIconBox}>
              <Text style={styles.actionEmoji}>⬇️</Text>
            </View>
            <Text style={styles.actionLabel}>Save image</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Report post"
            onPress={onPressReport}
            style={({ pressed }) => [styles.actionRow, pressed && styles.actionRowPressed]}
            testID={testID ? `${testID}-report` : undefined}
          >
            <View style={styles.actionIconBox}>
              <Text style={styles.actionEmoji}>🚩</Text>
            </View>
            <Text style={[styles.actionLabel, styles.actionLabelDestructive]}>Report post</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Send button */}
      {contacts.some((c) => c.selected) && (
        <View style={styles.sendContainer}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSending ? "Sending…" : "Send"}
            disabled={isSending}
            onPress={onPressSend}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.sendButtonPressed,
              isSending && styles.sendButtonDisabled,
            ]}
            testID={testID ? `${testID}-send` : undefined}
          >
            <Text style={styles.sendLabel}>{isSending ? "Sending…" : "Send"}</Text>
          </Pressable>
        </View>
      )}

      {isError && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Couldn't share. Please try again.</Text>
        </View>
      )}
    </View>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SYSTEM_APP_LABELS = [
  { id: "messages", label: "Messages", emoji: "💬", color: "#4CAF50" },
  { id: "instagram", label: "Instagram", emoji: "📸", color: "#E3A9A0" },
  { id: "whatsapp", label: "WhatsApp", emoji: "📱", color: "#4CAF50" },
  { id: "more", label: "More", emoji: "•••", color: colors.border },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingBottom: spacing.s10,
    minHeight: 340,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: spacing.s2,
    marginBottom: spacing.s3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...textStyles.heading4,
    color: colors.foreground,
    flex: 1,
  },
  closeButton: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 16,
    color: colors.textMuted,
  },
  section: {
    marginTop: spacing.s2,
  },
  systemAppsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s4,
    gap: spacing.s5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  systemApp: {
    alignItems: "center",
    gap: spacing.s1,
    minWidth: 56,
  },
  systemAppIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  systemAppEmoji: {
    fontSize: 20,
  },
  systemAppLabel: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
    maxWidth: 56,
    textAlign: "center",
  },
  noteContainer: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  noteInput: {
    ...textStyles.body,
    color: colors.foreground,
    minHeight: 40,
  },
  actionSection: {
    paddingVertical: spacing.s2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s3,
  },
  actionRowPressed: {
    backgroundColor: colors.hover,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  actionEmoji: {
    fontSize: 18,
  },
  actionLabel: {
    ...textStyles.body,
    color: colors.foreground,
    flex: 1,
  },
  actionLabelDestructive: {
    color: colors.error,
  },
  checkmark: {
    ...textStyles.label,
    color: colors.accent,
  },
  sendContainer: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s3,
  },
  sendButton: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  sendButtonDisabled: {
    backgroundColor: colors.disabledBg,
  },
  sendLabel: {
    ...textStyles.label,
    color: colors.white,
  },
  errorBanner: {
    marginHorizontal: spacing.pageHorizontal,
    marginTop: spacing.s2,
    padding: spacing.s3,
    borderRadius: radius.sm,
    backgroundColor: "rgba(244,67,54,0.08)",
  },
  errorText: {
    ...textStyles.bodySmall,
    color: colors.error,
    textAlign: "center",
  },
});
