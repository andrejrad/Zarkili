/**
 * AdminMessagingScreens.tsx
 *
 * Pure-UI components for the admin messaging console:
 *
 *   AdminMessagingScreen       — root shell: customer list + thread panel
 *   CustomerListPanel          — searchable/filterable customer list
 *   ThreadPanel                — message thread view + composer
 *   BulkMessageModal           — preview + confirmation before bulk send
 *   MessageBubble              — individual message in the thread
 *   AttachmentChip             — attachment thumbnail / file chip
 */

import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Message, MessageAttachment } from "../../domains/messages/model";
import { ALLOWED_ATTACHMENT_TYPES, MAX_ATTACHMENT_SIZE_BYTES } from "../../domains/messages/model";
import type { CustomerSummary } from "./adminMessagingService";

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------

const colors = {
  background: "#F2EDDD",
  surface: "#FFFFFF",
  border: "#E5E0D1",
  text: "#1A1A1A",
  muted: "#6B6B6B",
  primary: "#E3A9A0",
  primaryPressed: "#CF8B80",
  accent: "#BBEDDA",
  error: "#F44336",
  success: "#4CAF50",
  white: "#FFFFFF",
  bubbleOutbound: "#E3A9A0",
  bubbleInbound: "#FFFFFF",
};

// ---------------------------------------------------------------------------
// Root screen props
// ---------------------------------------------------------------------------

export type AdminMessagingScreenProps = {
  /** All customers available to message */
  customers: CustomerSummary[];
  isLoadingCustomers: boolean;
  customerSearchQuery: string;
  onCustomerSearchChange: (q: string) => void;
  subscriptionStatusFilter: string;
  onSubscriptionStatusFilterChange: (status: string) => void;

  /** Currently selected customer thread */
  selectedCustomerId: string | null;
  onSelectCustomer: (customerId: string) => void;

  /** Thread messages for the selected customer */
  threadMessages: Message[];
  isLoadingThread: boolean;
  threadError: string | null;

  /** Admin staff user ID (the "current user") */
  staffId: string;

  /** New message composer state */
  composerText: string;
  onComposerTextChange: (text: string) => void;
  pendingAttachments: MessageAttachment[];
  onAddAttachment: () => void;
  onRemoveAttachment: (index: number) => void;
  attachmentError: string | null;

  isSending: boolean;
  sendError: string | null;
  onSend: () => void;

  /** Bulk messaging */
  bulkSelectedIds: string[];
  onToggleBulkSelect: (customerId: string) => void;
  onClearBulkSelection: () => void;
  onOpenBulkModal: () => void;
  bulkModalVisible: boolean;
  bulkMessageText: string;
  onBulkMessageTextChange: (text: string) => void;
  isBulkSending: boolean;
  bulkSendError: string | null;
  onConfirmBulkSend: () => void;
  onDismissBulkModal: () => void;
  bulkSendResult: { sentCount: number; failedCount: number } | null;
};

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({ message, currentUserId }: { message: Message; currentUserId: string }) {
  const isOutbound = message.senderId === currentUserId;

  return (
    <View
      style={[
        bubble.container,
        isOutbound ? bubble.outbound : bubble.inbound,
      ]}
      testID={`message-bubble-${message.messageId}`}
    >
      {message.text.length > 0 && (
        <Text style={[bubble.text, isOutbound ? bubble.textOutbound : bubble.textInbound]}>
          {message.text}
        </Text>
      )}
      {message.attachments.map((att, i) => (
        <AttachmentChip key={`${message.messageId}-att-${i}`} attachment={att} />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Attachment chip
// ---------------------------------------------------------------------------

function AttachmentChip({ attachment }: { attachment: MessageAttachment }) {
  const isImage = attachment.type.startsWith("image/");
  return (
    <View style={att.chip} testID={`attachment-chip-${attachment.name}`}>
      <Text style={att.icon}>{isImage ? "🖼" : "📄"}</Text>
      <View style={att.meta}>
        <Text style={att.name} numberOfLines={1}>{attachment.name}</Text>
        <Text style={att.size}>{Math.round(attachment.size / 1024)} KB</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Customer list item
// ---------------------------------------------------------------------------

function CustomerListItem({
  customer,
  isSelected,
  isBulkSelected,
  onSelect,
  onToggleBulk,
}: {
  customer: CustomerSummary;
  isSelected: boolean;
  isBulkSelected: boolean;
  onSelect: () => void;
  onToggleBulk: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open conversation with ${customer.displayName}`}
      onPress={onSelect}
      style={[cust.item, isSelected && cust.itemSelected]}
      testID={`customer-item-${customer.userId}`}
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={`Select ${customer.displayName} for bulk message`}
        onPress={onToggleBulk}
        style={[cust.checkbox, isBulkSelected && cust.checkboxSelected]}
        testID={`bulk-checkbox-${customer.userId}`}
      >
        {isBulkSelected && <Text style={cust.checkmark}>✓</Text>}
      </Pressable>
      <View style={cust.info}>
        <Text style={cust.name} numberOfLines={1}>{customer.displayName}</Text>
        <Text style={cust.status}>{customer.subscriptionStatus}</Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Bulk message modal
// ---------------------------------------------------------------------------

function BulkMessageModal({
  visible,
  recipientCount,
  messageText,
  onMessageTextChange,
  isSending,
  sendError,
  onConfirm,
  onDismiss,
}: {
  visible: boolean;
  recipientCount: number;
  messageText: string;
  onMessageTextChange: (text: string) => void;
  isSending: boolean;
  sendError: string | null;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const canSend = messageText.trim().length > 0 && recipientCount > 0 && !isSending;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      testID="bulk-modal"
    >
      <View style={modal.overlay}>
        <View style={modal.sheet} testID="bulk-modal-sheet">
          <Text style={modal.title}>Send bulk message</Text>
          <Text style={modal.subtitle} testID="bulk-recipient-count">
            {`Sending to ${recipientCount} customer${recipientCount !== 1 ? "s" : ""}`}
          </Text>

          <TextInput
            style={modal.input}
            value={messageText}
            onChangeText={onMessageTextChange}
            placeholder="Type your message…"
            multiline
            testID="bulk-message-input"
            editable={!isSending}
          />

          {sendError ? (
            <Text style={modal.error} testID="bulk-send-error">{sendError}</Text>
          ) : null}

          <View style={modal.actions}>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              disabled={!canSend}
              style={({ pressed }) => [
                modal.confirmBtn,
                !canSend && modal.confirmBtnDisabled,
                pressed && canSend ? modal.confirmBtnPressed : null,
              ]}
              testID="bulk-confirm-button"
            >
              <Text style={modal.confirmBtnText}>
                {isSending ? "Sending…" : "Send to all"}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onDismiss}
              style={modal.cancelBtn}
              testID="bulk-cancel-button"
            >
              <Text style={modal.cancelBtnText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function AdminMessagingScreen({
  customers,
  isLoadingCustomers,
  customerSearchQuery,
  onCustomerSearchChange,
  subscriptionStatusFilter,
  onSubscriptionStatusFilterChange,
  selectedCustomerId,
  onSelectCustomer,
  threadMessages,
  isLoadingThread,
  threadError,
  staffId,
  composerText,
  onComposerTextChange,
  pendingAttachments,
  onAddAttachment,
  onRemoveAttachment,
  attachmentError,
  isSending,
  sendError,
  onSend,
  bulkSelectedIds,
  onToggleBulkSelect,
  onClearBulkSelection,
  onOpenBulkModal,
  bulkModalVisible,
  bulkMessageText,
  onBulkMessageTextChange,
  isBulkSending,
  bulkSendError,
  onConfirmBulkSend,
  onDismissBulkModal,
  bulkSendResult,
}: AdminMessagingScreenProps) {
  const canSend =
    (composerText.trim().length > 0 || pendingAttachments.length > 0) && !isSending;

  return (
    <View style={screen.root} testID="admin-messaging-screen">
      {/* ── Left panel: customer list ── */}
      <View style={screen.leftPanel} testID="customer-list-panel">
        <View style={screen.listHeader}>
          <TextInput
            style={screen.searchInput}
            value={customerSearchQuery}
            onChangeText={onCustomerSearchChange}
            placeholder="Search customers…"
            testID="customer-search-input"
          />
          <Pressable
            accessibilityRole="button"
            onPress={onOpenBulkModal}
            disabled={bulkSelectedIds.length === 0}
            style={[
              screen.bulkBtn,
              bulkSelectedIds.length === 0 && screen.bulkBtnDisabled,
            ]}
            testID="open-bulk-modal-button"
          >
            <Text style={screen.bulkBtnText}>
              {bulkSelectedIds.length > 0
                ? `Bulk (${bulkSelectedIds.length})`
                : "Bulk"}
            </Text>
          </Pressable>
        </View>

        {/* Status filter tabs */}
        <View style={screen.filterRow}>
          {["all", "active", "trialing"].map((status) => (
            <Pressable
              key={status}
              onPress={() => onSubscriptionStatusFilterChange(status)}
              style={[
                screen.filterTab,
                subscriptionStatusFilter === status && screen.filterTabActive,
              ]}
              testID={`filter-tab-${status}`}
            >
              <Text
                style={[
                  screen.filterTabText,
                  subscriptionStatusFilter === status && screen.filterTabTextActive,
                ]}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoadingCustomers ? (
          <ActivityIndicator testID="customers-loading" style={screen.loading} />
        ) : (
          <ScrollView testID="customer-scroll">
            {customers.length === 0 ? (
              <Text style={screen.emptyText} testID="customers-empty">
                No customers found
              </Text>
            ) : (
              customers.map((customer) => (
                <CustomerListItem
                  key={customer.userId}
                  customer={customer}
                  isSelected={selectedCustomerId === customer.userId}
                  isBulkSelected={bulkSelectedIds.includes(customer.userId)}
                  onSelect={() => onSelectCustomer(customer.userId)}
                  onToggleBulk={() => onToggleBulkSelect(customer.userId)}
                />
              ))
            )}
          </ScrollView>
        )}

        {bulkSendResult ? (
          <View style={screen.bulkResultBanner} testID="bulk-result-banner">
            <Text style={screen.bulkResultText}>
              {`Sent: ${bulkSendResult.sentCount}`}
              {bulkSendResult.failedCount > 0
                ? ` · Failed: ${bulkSendResult.failedCount}`
                : ""}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Right panel: thread ── */}
      <View style={screen.rightPanel} testID="thread-panel">
        {!selectedCustomerId ? (
          <View style={screen.emptyThread} testID="thread-empty-state">
            <Text style={screen.emptyThreadText}>Select a customer to view the conversation</Text>
          </View>
        ) : (
          <>
            {isLoadingThread ? (
              <ActivityIndicator testID="thread-loading" style={screen.loading} />
            ) : threadError ? (
              <Text style={screen.errorText} testID="thread-error">{threadError}</Text>
            ) : (
              <ScrollView
                style={screen.threadScroll}
                contentContainerStyle={screen.threadContent}
                testID="thread-scroll"
              >
                {threadMessages.length === 0 ? (
                  <Text style={screen.emptyText} testID="thread-no-messages">
                    No messages yet
                  </Text>
                ) : (
                  threadMessages.map((msg) => (
                    <MessageBubble key={msg.messageId} message={msg} currentUserId={staffId} />
                  ))
                )}
              </ScrollView>
            )}

            {/* Composer */}
            <View style={screen.composer} testID="message-composer">
              {attachmentError ? (
                <Text style={screen.errorText} testID="attachment-error">{attachmentError}</Text>
              ) : null}

              {pendingAttachments.length > 0 && (
                <ScrollView horizontal style={screen.attachmentRow} testID="pending-attachments">
                  {pendingAttachments.map((att, i) => (
                    <View key={`pending-att-${i}`} style={screen.pendingAttachment}>
                      <AttachmentChip attachment={att} />
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${att.name}`}
                        onPress={() => onRemoveAttachment(i)}
                        testID={`remove-attachment-${i}`}
                      >
                        <Text style={screen.removeAttachment}>✕</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              )}

              <View style={screen.composerRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add attachment"
                  onPress={onAddAttachment}
                  style={screen.attachBtn}
                  testID="add-attachment-button"
                >
                  <Text style={screen.attachBtnText}>📎</Text>
                </Pressable>
                <TextInput
                  style={screen.composerInput}
                  value={composerText}
                  onChangeText={onComposerTextChange}
                  placeholder="Type a message…"
                  multiline
                  testID="composer-input"
                  editable={!isSending}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  onPress={onSend}
                  disabled={!canSend}
                  style={[screen.sendBtn, !canSend && screen.sendBtnDisabled]}
                  testID="send-button"
                >
                  <Text style={screen.sendBtnText}>{isSending ? "…" : "Send"}</Text>
                </Pressable>
              </View>

              {sendError ? (
                <Text style={screen.errorText} testID="send-error">{sendError}</Text>
              ) : null}
            </View>
          </>
        )}
      </View>

      <BulkMessageModal
        visible={bulkModalVisible}
        recipientCount={bulkSelectedIds.length}
        messageText={bulkMessageText}
        onMessageTextChange={onBulkMessageTextChange}
        isSending={isBulkSending}
        sendError={bulkSendError}
        onConfirm={onConfirmBulkSend}
        onDismiss={onDismissBulkModal}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Attachment size/type display helpers (exported for UI use)
// ---------------------------------------------------------------------------

export const MAX_ATTACHMENT_SIZE_MB = MAX_ATTACHMENT_SIZE_BYTES / (1024 * 1024);
export const ALLOWED_TYPES_LABEL = ALLOWED_ATTACHMENT_TYPES.join(", ");

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const screen = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.background,
  },
  leftPanel: {
    width: 280,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surface,
  },
  rightPanel: {
    flex: 1,
    flexDirection: "column",
  },
  listHeader: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    backgroundColor: "#FBFAF5",
  },
  bulkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bulkBtnDisabled: {
    opacity: 0.5,
  },
  bulkBtnText: {
    color: colors.white,
    fontSize: 12,
  },
  filterRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  filterTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: colors.muted,
  },
  filterTabTextActive: {
    color: colors.primary,
  },
  loading: {
    marginTop: 24,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 13,
    textAlign: "center",
    padding: 24,
  },
  bulkResultBanner: {
    padding: 10,
    backgroundColor: colors.accent,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bulkResultText: {
    fontSize: 12,
    color: colors.text,
  },
  emptyThread: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyThreadText: {
    color: colors.muted,
    fontSize: 14,
  },
  threadScroll: {
    flex: 1,
  },
  threadContent: {
    padding: 16,
    gap: 8,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: 12,
    gap: 8,
    backgroundColor: colors.surface,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#FBFAF5",
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  attachBtnText: {
    fontSize: 18,
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: colors.white,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
  },
  attachmentRow: {
    flexGrow: 0,
  },
  pendingAttachment: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
    gap: 4,
  },
  removeAttachment: {
    color: colors.error,
    fontSize: 14,
    padding: 4,
  },
});

const bubble = StyleSheet.create({
  container: {
    maxWidth: "70%",
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  outbound: {
    alignSelf: "flex-end",
    backgroundColor: colors.bubbleOutbound,
  },
  inbound: {
    alignSelf: "flex-start",
    backgroundColor: colors.bubbleInbound,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  textOutbound: {
    color: colors.white,
  },
  textInbound: {
    color: colors.text,
  },
});

const att = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 8,
  },
  icon: {
    fontSize: 20,
  },
  meta: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 12,
    color: colors.text,
    maxWidth: 160,
  },
  size: {
    fontSize: 11,
    color: colors.muted,
  },
});

const cust = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemSelected: {
    backgroundColor: "rgba(227, 169, 160, 0.12)",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.white,
    fontSize: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 14,
    color: colors.text,
  },
  status: {
    fontSize: 11,
    color: colors.muted,
  },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    width: "80%",
    maxWidth: 480,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 18,
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
  },
  input: {
    minHeight: 100,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    backgroundColor: "#FBFAF5",
    textAlignVertical: "top",
  },
  error: {
    color: colors.error,
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: "center",
  },
  confirmBtnDisabled: {
    opacity: 0.5,
  },
  confirmBtnPressed: {
    backgroundColor: colors.primaryPressed,
  },
  confirmBtnText: {
    color: colors.white,
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  cancelBtnText: {
    color: colors.muted,
    fontSize: 14,
  },
});
