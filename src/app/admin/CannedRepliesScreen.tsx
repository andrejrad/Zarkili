/**
 * W46 — CannedRepliesScreen
 *
 * Manage canned (template) replies for the messaging inbox.
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
import type { CannedReply, CannedReplyInput } from "../../domains/messaging/messagingAdminModel";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type CannedRepliesScreenProps = {
  loading: boolean;
  error: string | null;
  replies: CannedReply[];
  showCreateForm: boolean;
  form: CannedReplyInput;
  saving: boolean;
  saveError: string | null;
  onToggleForm: () => void;
  onFormChange: <K extends keyof CannedReplyInput>(field: K, value: CannedReplyInput[K]) => void;
  onSaveReply: () => void;
  onDeleteReply: (cannedId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function CannedRepliesScreen({
  loading,
  error,
  replies,
  showCreateForm,
  form,
  saving,
  saveError,
  onToggleForm,
  onFormChange,
  onSaveReply,
  onDeleteReply,
  onRetry,
  onBack,
  testID = "canned-replies-screen",
}: CannedRepliesScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Canned Replies</Text>
        <Pressable onPress={onToggleForm} accessibilityRole="button" testID="toggle-form-btn" style={styles.addBtn}>
          <Text style={styles.addBtnText}>{showCreateForm ? "Cancel" : "+ New"}</Text>
        </Pressable>
      </View>

      {showCreateForm ? (
        <View style={styles.form} testID="create-form">
          <Text style={styles.sectionLabel}>Title</Text>
          <TextInput
            value={form.title}
            onChangeText={(v) => onFormChange("title", v)}
            placeholder="e.g. Appointment confirmation"
            style={styles.input}
            testID="title-input"
            accessibilityLabel="Canned reply title"
          />
          <Text style={styles.sectionLabel}>Body</Text>
          <TextInput
            value={form.body}
            onChangeText={(v) => onFormChange("body", v)}
            multiline
            numberOfLines={5}
            placeholder="Message body…"
            style={[styles.input, styles.textArea]}
            testID="body-input"
            accessibilityLabel="Canned reply body"
          />
          {saveError ? <Text style={styles.errorText} testID="save-error">{saveError}</Text> : null}
          <Pressable
            onPress={onSaveReply}
            disabled={saving || !form.title.trim() || !form.body.trim()}
            accessibilityRole="button"
            testID="save-reply-btn"
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          >
            <Text style={styles.saveBtnText}>{saving ? "Saving…" : "Save Reply"}</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? <AdminLoadingState label="Loading replies…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}
      {!loading && !error && replies.length === 0 ? (
        <AdminEmptyState title="No Replies" body="No canned replies have been created yet." />
      ) : null}

      {replies.map((reply) => (
        <View key={reply.cannedId} style={styles.replyCard} testID={`reply-${reply.cannedId}`}>
          <View style={styles.replyTop}>
            <Text style={styles.replyTitle}>{reply.title}</Text>
            <Pressable
              onPress={() => onDeleteReply(reply.cannedId)}
              testID={`delete-${reply.cannedId}`}
              style={styles.deleteBtn}
              accessibilityRole="button"
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </Pressable>
          </View>
          <Text style={styles.replyBody} numberOfLines={3}>{reply.body}</Text>
          {reply.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {reply.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 14, backgroundColor: "#F2EDDD" },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: { paddingVertical: 4 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6B6B6B" },
  title: { fontFamily: brandTypography.semibold, fontSize: 20, color: "#1A1A1A", flex: 1 },
  addBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#1A1A1A", borderRadius: 8 },
  addBtnText: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#FFFFFF" },
  form: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, gap: 10 },
  sectionLabel: { fontFamily: brandTypography.semibold, fontSize: 13, color: "#6B6B6B" },
  input: {
    backgroundColor: "#F9F9F9",
    borderRadius: 8,
    padding: 10,
    fontFamily: brandTypography.regular,
    fontSize: 14,
    color: "#1A1A1A",
  },
  textArea: { minHeight: 110, textAlignVertical: "top" },
  errorText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#DC2626" },
  saveBtn: { backgroundColor: "#1A1A1A", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  saveBtnDisabled: { backgroundColor: "#D1D5DB" },
  saveBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#FFFFFF" },
  replyCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, gap: 8 },
  replyTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  replyTitle: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#1A1A1A", flex: 1 },
  deleteBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  deleteBtnText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#DC2626" },
  replyBody: { fontFamily: brandTypography.regular, fontSize: 13, color: "#4B4B4B" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { backgroundColor: "#E5E0D1", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontFamily: brandTypography.regular, fontSize: 11, color: "#4B4B4B" },
});
