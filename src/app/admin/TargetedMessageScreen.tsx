/**
 * W44 — TargetedMessageScreen
 *
 * Compose and send a targeted message (push / sms / email) to a saved segment.
 * Links to the W40 campaign send infrastructure.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type { TargetedMessageChannel } from "../../domains/clients/clientCrmModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TargetedMessageScreenProps = {
  segmentName: string;
  recipientCount: number | null;
  channel: TargetedMessageChannel;
  subject: string;
  body: string;
  scheduledAt: string | null; // ISO-8601 or null = now
  sending: boolean;
  error: string | null;
  success: boolean;
  onChannelChange: (c: TargetedMessageChannel) => void;
  onSubjectChange: (text: string) => void;
  onBodyChange: (text: string) => void;
  onScheduleChange: (dt: string | null) => void;
  onSend: () => void;
  onBack: () => void;
  testID?: string;
};

const CHANNEL_LABELS: Record<TargetedMessageChannel, string> = {
  push: "Push notification",
  sms: "SMS",
  email: "Email",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function TargetedMessageScreen({
  segmentName,
  recipientCount,
  channel,
  subject,
  body,
  scheduledAt,
  sending,
  error,
  success,
  onChannelChange,
  onSubjectChange,
  onBodyChange,
  onScheduleChange,
  onSend,
  onBack,
  testID = "targeted-message-screen",
}: TargetedMessageScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Message Segment</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Segment info */}
        <View style={styles.segmentBanner}>
          <Text style={styles.segmentBannerLabel}>Segment</Text>
          <Text style={styles.segmentBannerName}>{segmentName}</Text>
          {recipientCount != null && (
            <Text style={styles.segmentBannerCount}>{recipientCount} recipients</Text>
          )}
        </View>

        {/* Channel */}
        <Text style={styles.sectionLabel}>Channel</Text>
        <View style={styles.channelRow} testID="channel-selector">
          {(Object.keys(CHANNEL_LABELS) as TargetedMessageChannel[]).map((c) => (
            <Pressable
              key={c}
              onPress={() => onChannelChange(c)}
              style={[styles.channelChip, channel === c && styles.channelChipActive]}
              accessibilityRole="radio"
              accessibilityState={{ checked: channel === c }}
              testID={`channel-${c}`}
            >
              <Text
                style={[
                  styles.channelChipText,
                  channel === c && styles.channelChipTextActive,
                ]}
              >
                {CHANNEL_LABELS[c]}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Subject (email only) */}
        {channel === "email" && (
          <>
            <Text style={styles.sectionLabel}>Subject *</Text>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={onSubjectChange}
              placeholder="Email subject…"
              placeholderTextColor="#999"
              testID="subject-input"
              accessibilityLabel="Email subject"
            />
          </>
        )}

        {/* Body */}
        <Text style={styles.sectionLabel}>Message *</Text>
        <TextInput
          style={styles.bodyInput}
          value={body}
          onChangeText={onBodyChange}
          multiline
          numberOfLines={5}
          placeholder="Write your message…"
          placeholderTextColor="#999"
          testID="body-input"
          accessibilityLabel="Message body"
        />

        {/* Schedule */}
        <Text style={styles.sectionLabel}>Send timing</Text>
        <View style={styles.scheduleRow}>
          <Pressable
            onPress={() => onScheduleChange(null)}
            style={[styles.scheduleChip, scheduledAt === null && styles.scheduleChipActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: scheduledAt === null }}
          >
            <Text
              style={[
                styles.scheduleChipText,
                scheduledAt === null && styles.scheduleChipTextActive,
              ]}
            >
              Send now
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onScheduleChange(new Date(Date.now() + 3600_000).toISOString())}
            style={[styles.scheduleChip, scheduledAt !== null && styles.scheduleChipActive]}
            accessibilityRole="radio"
            accessibilityState={{ checked: scheduledAt !== null }}
          >
            <Text
              style={[
                styles.scheduleChipText,
                scheduledAt !== null && styles.scheduleChipTextActive,
              ]}
            >
              Schedule
            </Text>
          </Pressable>
        </View>

        {scheduledAt && (
          <TextInput
            style={styles.input}
            value={scheduledAt}
            onChangeText={(v) => onScheduleChange(v)}
            placeholder="ISO-8601 datetime"
            placeholderTextColor="#999"
            accessibilityLabel="Scheduled send time"
          />
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
        {success && (
          <Text style={styles.successText}>Message dispatched successfully.</Text>
        )}

        <Pressable
          onPress={onSend}
          disabled={sending || !body.trim()}
          style={[styles.sendBtn, (sending || !body.trim()) && styles.sendBtnDisabled]}
          accessibilityRole="button"
          testID="send-btn"
        >
          <Text style={styles.sendBtnText}>{sending ? "Sending…" : "Send Message"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backBtn: { marginRight: 12 },
  backText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6B4EFF" },
  title: { fontFamily: brandTypography.semibold, fontSize: 22 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  segmentBanner: {
    backgroundColor: "#F0EDFF",
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#6B4EFF",
  },
  segmentBannerLabel: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888", marginBottom: 2 },
  segmentBannerName: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#6B4EFF" },
  segmentBannerCount: { fontFamily: brandTypography.regular, fontSize: 12, color: "#666", marginTop: 4 },
  sectionLabel: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888", marginBottom: 8, marginTop: 16 },
  channelRow: { flexDirection: "row", gap: 8 },
  channelChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#CCC",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  channelChipActive: { borderColor: "#6B4EFF", backgroundColor: "#6B4EFF" },
  channelChipText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#444" },
  channelChipTextActive: { color: "#FFFFFF" },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    fontFamily: brandTypography.regular, fontSize: 14,
  },
  bodyInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: "#DDD",
    fontFamily: brandTypography.regular, fontSize: 14,
  },
  scheduleRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  scheduleChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#CCC",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  scheduleChipActive: { borderColor: "#6B4EFF", backgroundColor: "#6B4EFF" },
  scheduleChipText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#444" },
  scheduleChipTextActive: { color: "#FFFFFF" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#CC0000", marginTop: 12 },
  successText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#2E7D32", marginTop: 12 },
  sendBtn: {
    marginTop: 24,
    backgroundColor: "#6B4EFF",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#CCCCCC" },
  sendBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#FFFFFF" },
});
