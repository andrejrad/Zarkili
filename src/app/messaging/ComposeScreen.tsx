/**
 * ComposeScreen.tsx — F.3 New Message Compose.
 *
 * Header: back + "To:" chip row with selected recipient.
 * Salon search list (when no recipient selected).
 * Subject input (optional).
 * Composer: multiline TextInput + send button.
 * States: default, no-recipients (CTA disabled), sending, sent (nav to thread), error.
 */

import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Banner, StickyCtaBar, colors, radius, spacing, textStyles } from "../../shared/ui";

export type SalonSearchResult = {
  id: string;
  name: string;
};

export type ComposeScreenProps = {
  /** Currently selected recipient salon name; null = no selection yet */
  recipientName: string | null;
  salonSearchQuery: string;
  onSalonSearchChange: (q: string) => void;
  salonResults: SalonSearchResult[];
  onSelectSalon: (id: string, name: string) => void;
  onRemoveRecipient: () => void;
  subject: string;
  onSubjectChange: (s: string) => void;
  message: string;
  onMessageChange: (m: string) => void;
  onPressSend: () => void;
  onPressBack: () => void;
  isSending?: boolean;
  isError?: boolean;
  testID?: string;
};

export function ComposeScreen({
  recipientName,
  salonSearchQuery,
  onSalonSearchChange,
  salonResults,
  onSelectSalon,
  onRemoveRecipient,
  subject,
  onSubjectChange,
  message,
  onMessageChange,
  onPressSend,
  onPressBack,
  isSending,
  isError,
  testID,
}: ComposeScreenProps) {
  const canSend = recipientName !== null && message.trim().length > 0 && !isSending;

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={onPressBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          testID={testID ? `${testID}-back` : undefined}
        >
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>New Message</Text>
      </View>

      {/* Error banner */}
      {isError ? (
        <Banner
          variant="error"
          message="Failed to send message. Please try again."
          testID={testID ? `${testID}-error-banner` : undefined}
        />
      ) : null}

      {/* To: row */}
      <View style={styles.toRow}>
        <Text style={styles.toLabel}>To:</Text>
        {recipientName ? (
          <View style={styles.recipientChip}>
            <Text style={styles.recipientChipText}>{recipientName}</Text>
            <Pressable
              onPress={onRemoveRecipient}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${recipientName}`}
              testID={testID ? `${testID}-remove-recipient` : undefined}
            >
              <Text style={styles.chipRemove}> ✕</Text>
            </Pressable>
          </View>
        ) : (
          <TextInput
            style={styles.recipientInput}
            placeholder="Search salon…"
            placeholderTextColor={colors.textMuted}
            value={salonSearchQuery}
            onChangeText={onSalonSearchChange}
            returnKeyType="search"
            accessibilityLabel="Search for a salon to message"
            testID={testID ? `${testID}-recipient-search` : undefined}
          />
        )}
      </View>

      {/* Salon search results */}
      {!recipientName && salonResults.length > 0 ? (
        <FlatList
          data={salonResults}
          keyExtractor={(item) => item.id}
          style={styles.salonList}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.salonRow,
                pressed && styles.salonRowPressed,
              ]}
              onPress={() => onSelectSalon(item.id, item.name)}
              accessibilityRole="button"
              accessibilityLabel={item.name}
              testID={testID ? `${testID}-salon-${item.id}` : undefined}
            >
              <Text style={styles.salonName}>{item.name}</Text>
            </Pressable>
          )}
        />
      ) : null}

      {/* Not found state */}
      {!recipientName && salonSearchQuery.trim().length > 0 && salonResults.length === 0 ? (
        <View style={styles.notFound}>
          <Text style={styles.bodyMuted}>No salons found for "{salonSearchQuery}"</Text>
        </View>
      ) : null}

      {/* Subject */}
      {recipientName ? (
        <TextInput
          style={styles.subjectInput}
          placeholder="Subject (optional)"
          placeholderTextColor={colors.textMuted}
          value={subject}
          onChangeText={onSubjectChange}
          returnKeyType="next"
          accessibilityLabel="Subject"
          testID={testID ? `${testID}-subject` : undefined}
        />
      ) : null}

      {/* Message body */}
      {recipientName ? (
        <TextInput
          style={styles.messageInput}
          placeholder="Write your message…"
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={onMessageChange}
          multiline
          textAlignVertical="top"
          accessibilityLabel="Message"
          testID={testID ? `${testID}-message` : undefined}
        />
      ) : null}

      {/* Footer CTA */}
      <StickyCtaBar
        primaryLabel={isSending ? "Sending…" : "Send"}
        onPrimaryPress={onPressSend}
        primaryDisabled={!canSend}
        primaryLoading={isSending}
        primaryTestID={testID ? `${testID}-send` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    color: colors.foreground,
  },
  headerTitle: {
    ...textStyles.heading4,
    color: colors.foreground,
  },
  toRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.s2,
    minHeight: spacing.touchTarget,
  },
  toLabel: {
    ...textStyles.label,
    color: colors.textMuted,
  },
  recipientInput: {
    flex: 1,
    ...textStyles.body,
    color: colors.foreground,
    minHeight: spacing.touchTarget,
  },
  recipientChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary20,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
  },
  recipientChipText: {
    ...textStyles.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
  chipRemove: {
    ...textStyles.bodySmall,
    color: colors.primary,
  },
  salonList: {
    maxHeight: 200,
  },
  salonRow: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  salonRowPressed: {
    backgroundColor: colors.hover,
  },
  salonName: {
    ...textStyles.body,
    color: colors.foreground,
  },
  notFound: {
    padding: spacing.pageHorizontal,
  },
  subjectInput: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    ...textStyles.body,
    color: colors.foreground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: spacing.touchTarget,
  },
  messageInput: {
    flex: 1,
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s3,
    ...textStyles.body,
    color: colors.foreground,
  },
  bodyMuted: {
    ...textStyles.body,
    color: colors.textMuted,
  },
});
