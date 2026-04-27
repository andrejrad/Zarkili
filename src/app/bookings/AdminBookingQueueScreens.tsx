/**
 * AdminBookingQueueScreens.tsx
 *
 * Pure-UI components for the admin booking queue:
 *
 *   • AdminBookingQueueScreen  — outer shell with tab bar, filter bar, list
 *   • BookingQueueCard         — individual booking card with action buttons
 *   • AdminQueueActionModal    — confirm/reject/cancel modal with reason input
 *
 * All state is prop-driven; modal state for the reason field is managed
 * internally because it is a transient UI concern.
 */

import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import type { Booking, BookingStatus } from "../../domains/bookings/model";
import type { AdminBookingQueueTab } from "./adminBookingQueueService";
import type { Location } from "../../domains/locations/model";

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
  warning: "#FF9800",
  success: "#4CAF50",
  white: "#FFFFFF",
  disabled: "#B0B0B0",
  disabledBg: "#F5F5F5",
  overlay: "rgba(0,0,0,0.45)",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y ?? 0, (m ?? 1) - 1, d ?? 1);
  return dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function statusBadgeColor(status: BookingStatus): string {
  switch (status) {
    case "pending": return colors.warning;
    case "reschedule_pending": return colors.accent;
    case "reschedule_rejected": return colors.error;
    case "confirmed": return colors.success;
    case "cancelled": return colors.muted;
    case "rejected": return colors.error;
    default: return colors.muted;
  }
}

function statusLabel(status: BookingStatus): string {
  switch (status) {
    case "pending": return "Pending";
    case "reschedule_pending": return "Reschedule pending";
    case "reschedule_rejected": return "Exception";
    case "confirmed": return "Confirmed";
    case "cancelled": return "Cancelled";
    case "rejected": return "Rejected";
    case "completed": return "Completed";
    case "no_show": return "No-show";
    case "rescheduled": return "Rescheduled";
    default: return status;
  }
}

// ---------------------------------------------------------------------------
// Action modal types (internal + exported)
// ---------------------------------------------------------------------------

export type QueueActionType = "confirm" | "reject" | "cancel";

type ActiveAction = {
  bookingId: string;
  actionType: QueueActionType;
};

// ---------------------------------------------------------------------------
// Booking queue card
// ---------------------------------------------------------------------------

type BookingQueueCardProps = {
  booking: Booking;
  /** Name of the location — resolved by caller from location list */
  locationName: string;
  /** Name of the staff member — resolved by caller from staff map */
  staffName: string;
  /** Customer display label */
  customerLabel: string;
  onConfirm: () => void;
  onReject: () => void;
  onCancel: () => void;
};

function BookingQueueCard({
  booking,
  locationName,
  staffName,
  customerLabel,
  onConfirm,
  onReject,
  onCancel,
}: BookingQueueCardProps) {
  const badgeColor = statusBadgeColor(booking.status);

  return (
    <View style={card.container} testID={`booking-card-${booking.bookingId}`}>
      {/* Status badge + date/time row */}
      <View style={card.headerRow}>
        <View style={[card.badge, { backgroundColor: badgeColor }]}>
          <Text style={card.badgeText}>{statusLabel(booking.status)}</Text>
        </View>
        <Text style={card.datetime}>
          {formatDate(booking.date)} · {booking.startTime}–{booking.endTime}
        </Text>
      </View>

      {/* Context rows */}
      <View style={card.body}>
        <ContextRow label="Location" value={locationName} />
        <ContextRow label="Staff" value={staffName} />
        <ContextRow label="Customer" value={customerLabel} />
        <ContextRow label="Service" value={`${booking.serviceId}`} />
        <ContextRow label="Duration" value={`${booking.durationMinutes} min`} />
        {booking.notes ? <ContextRow label="Notes" value={booking.notes} /> : null}
      </View>

      {/* Action buttons */}
      <View style={card.actions}>
        {(booking.status === "pending" || booking.status === "reschedule_pending") && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirm booking"
            onPress={onConfirm}
            style={({ pressed }) => [card.actionBtn, card.confirmBtn, pressed && card.confirmBtnPressed]}
            testID={`confirm-btn-${booking.bookingId}`}
          >
            <Text style={card.actionBtnText}>Confirm</Text>
          </Pressable>
        )}
        {booking.status === "pending" && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reject booking"
            onPress={onReject}
            style={({ pressed }) => [card.actionBtn, card.rejectBtn, pressed && card.rejectBtnPressed]}
            testID={`reject-btn-${booking.bookingId}`}
          >
            <Text style={card.actionBtnText}>Reject</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel booking"
          onPress={onCancel}
          style={({ pressed }) => [card.actionBtn, card.cancelBtn, pressed && card.cancelBtnPressed]}
          testID={`cancel-btn-${booking.bookingId}`}
        >
          <Text style={[card.actionBtnText, card.cancelBtnText]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ContextRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={card.contextRow}>
      <Text style={card.contextLabel}>{label}</Text>
      <Text style={card.contextValue}>{value}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Action modal (internal: manages reason text state itself)
// ---------------------------------------------------------------------------

type AdminQueueActionModalProps = {
  visible: boolean;
  actionType: QueueActionType;
  isSubmitting: boolean;
  errorMessage: string | null;
  onConfirm: (reason: string) => void;
  onDismiss: () => void;
};

export function AdminQueueActionModal({
  visible,
  actionType,
  isSubmitting,
  errorMessage,
  onConfirm,
  onDismiss,
}: AdminQueueActionModalProps) {
  const [reason, setReason] = useState("");

  const needsReason = actionType === "reject" || actionType === "cancel";
  const title =
    actionType === "confirm" ? "Confirm booking" :
    actionType === "reject"  ? "Reject booking" :
    "Cancel booking";
  const submitLabel =
    actionType === "confirm" ? "Confirm" :
    actionType === "reject"  ? "Reject" :
    "Cancel booking";

  function handleSubmit() {
    onConfirm(reason.trim());
  }

  const submitDisabled = isSubmitting || (needsReason && reason.trim().length === 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      testID="action-modal"
    >
      <View style={modal.overlay}>
        <View style={modal.sheet} testID="action-modal-sheet">
          <Text style={modal.title}>{title}</Text>

          {needsReason && (
            <>
              <Text style={modal.label}>Reason (required)</Text>
              <TextInput
                style={modal.input}
                value={reason}
                onChangeText={setReason}
                placeholder="Enter reason…"
                multiline
                testID="action-reason-input"
                editable={!isSubmitting}
              />
            </>
          )}

          {!needsReason && (
            <Text style={modal.body}>Are you sure you want to confirm this booking?</Text>
          )}

          {errorMessage ? (
            <Text style={modal.error} testID="action-modal-error">{errorMessage}</Text>
          ) : null}

          <View style={modal.buttons}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={onDismiss}
              style={modal.secondaryBtn}
              disabled={isSubmitting}
              testID="action-modal-dismiss"
            >
              <Text style={modal.secondaryBtnText}>Go back</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={submitLabel}
              onPress={handleSubmit}
              disabled={submitDisabled}
              style={[
                modal.primaryBtn,
                actionType !== "confirm" && modal.destructiveBtn,
                submitDisabled && modal.primaryBtnDisabled,
              ]}
              testID="action-modal-submit"
            >
              <Text style={modal.primaryBtnText}>
                {isSubmitting ? "Processing…" : submitLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

type FilterBarProps = {
  locations: Location[];
  filterLocationId: string | null;
  filterDate: string | null;
  onLocationChange: (locationId: string | null) => void;
  onDateChange: (date: string | null) => void;
};

function FilterBar({
  locations,
  filterLocationId,
  filterDate,
  onLocationChange,
  onDateChange,
}: FilterBarProps) {
  return (
    <View style={filter.bar} testID="filter-bar">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={filter.scroll}
      >
        {/* Location filter chips */}
        <Pressable
          accessibilityRole="button"
          onPress={() => onLocationChange(null)}
          style={[filter.chip, !filterLocationId && filter.chipActive]}
          testID="filter-location-all"
        >
          <Text style={[filter.chipText, !filterLocationId && filter.chipTextActive]}>
            All locations
          </Text>
        </Pressable>
        {locations.map((loc) => (
          <Pressable
            key={loc.locationId}
            accessibilityRole="button"
            onPress={() => onLocationChange(loc.locationId)}
            style={[filter.chip, filterLocationId === loc.locationId && filter.chipActive]}
            testID={`filter-location-${loc.locationId}`}
          >
            <Text style={[filter.chipText, filterLocationId === loc.locationId && filter.chipTextActive]}>
              {loc.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Date filter — plain text input for simplicity (matches existing admin patterns) */}
      <View style={filter.dateRow}>
        <Text style={filter.dateLabel}>Date:</Text>
        <TextInput
          style={filter.dateInput}
          value={filterDate ?? ""}
          onChangeText={(v) => onDateChange(v.trim() || null)}
          placeholder="YYYY-MM-DD  (all dates)"
          testID="filter-date-input"
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------

const TABS: Array<{ key: AdminBookingQueueTab; label: string }> = [
  { key: "pending", label: "Pending" },
  { key: "reschedule_pending", label: "Reschedule" },
  { key: "exceptions", label: "Exceptions" },
];

type TabBarProps = {
  activeTab: AdminBookingQueueTab;
  counts: Record<AdminBookingQueueTab, number>;
  onTabChange: (tab: AdminBookingQueueTab) => void;
};

function QueueTabBar({ activeTab, counts, onTabChange }: TabBarProps) {
  return (
    <View style={tabs.bar} testID="queue-tab-bar">
      {TABS.map(({ key, label }) => (
        <Pressable
          key={key}
          accessibilityRole="tab"
          accessibilityLabel={label}
          onPress={() => onTabChange(key)}
          style={[tabs.tab, activeTab === key && tabs.tabActive]}
          testID={`tab-${key}`}
        >
          <Text style={[tabs.tabText, activeTab === key && tabs.tabTextActive]}>
            {label}
          </Text>
          {counts[key] > 0 && (
            <View style={tabs.badge}>
              <Text style={tabs.badgeText}>{counts[key]}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export type AdminBookingQueueScreenProps = {
  /** Names resolved by caller: bookingId → locationName / staffName / customerLabel */
  locationNames: Record<string, string>;
  staffNames: Record<string, string>;
  customerLabels: Record<string, string>;
  locations: Location[];

  activeTab: AdminBookingQueueTab;
  /** All loaded bookings for the active tab (pre-filtered by service) */
  bookings: Booking[];
  /** Counts per tab for badge display */
  tabCounts: Record<AdminBookingQueueTab, number>;

  isLoading: boolean;
  error: string | null;

  filterLocationId: string | null;
  filterDate: string | null;

  /** Action submission state — fed back from parent after modal confirm */
  isActionSubmitting: boolean;
  actionError: string | null;

  onTabChange: (tab: AdminBookingQueueTab) => void;
  onFilterLocationChange: (locationId: string | null) => void;
  onFilterDateChange: (date: string | null) => void;
  onRetry: () => void;
  onBack: () => void;

  /** Called with bookingId + reason (empty string for confirm) */
  onConfirmAction: (bookingId: string, actionType: QueueActionType, reason: string) => void;
};

export function AdminBookingQueueScreen({
  locationNames,
  staffNames,
  customerLabels,
  locations,
  activeTab,
  bookings,
  tabCounts,
  isLoading,
  error,
  filterLocationId,
  filterDate,
  isActionSubmitting,
  actionError,
  onTabChange,
  onFilterLocationChange,
  onFilterDateChange,
  onRetry,
  onBack,
  onConfirmAction,
}: AdminBookingQueueScreenProps) {
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);

  function openAction(bookingId: string, actionType: QueueActionType) {
    setActiveAction({ bookingId, actionType });
  }

  function handleModalConfirm(reason: string) {
    if (!activeAction) return;
    onConfirmAction(activeAction.bookingId, activeAction.actionType, reason);
  }

  function handleModalDismiss() {
    if (!isActionSubmitting) {
      setActiveAction(null);
    }
  }

  // Close modal after successful action (no error, not submitting, modal open)
  // This is handled by the parent clearing actionError and setting isActionSubmitting=false,
  // then calling onConfirmAction which triggers a reload + modal close via setActiveAction(null)
  // handled in the parent callback after success.

  return (
    <View style={screen.root} testID="admin-booking-queue-screen">
      {/* Header */}
      <View style={screen.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          style={screen.backButton}
          testID="queue-back-button"
        >
          <Text style={screen.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={screen.title}>Booking queue</Text>
      </View>

      {/* Tab bar */}
      <QueueTabBar activeTab={activeTab} counts={tabCounts} onTabChange={onTabChange} />

      {/* Filter bar */}
      <FilterBar
        locations={locations}
        filterLocationId={filterLocationId}
        filterDate={filterDate}
        onLocationChange={onFilterLocationChange}
        onDateChange={onFilterDateChange}
      />

      {/* Content */}
      <ScrollView
        style={screen.scroll}
        contentContainerStyle={screen.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="queue-scroll"
      >
        {isLoading && (
          <View style={screen.centred}>
            <Text style={screen.mutedText}>Loading bookings…</Text>
          </View>
        )}

        {!isLoading && error && (
          <View style={screen.centred}>
            <Text style={screen.errorText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={screen.retryButton}
              testID="queue-retry-button"
            >
              <Text style={screen.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {!isLoading && !error && bookings.length === 0 && (
          <View style={screen.centred} testID="queue-empty-state">
            <Text style={screen.emptyHeadline}>All clear!</Text>
            <Text style={screen.mutedText}>No bookings in this queue.</Text>
          </View>
        )}

        {!isLoading && !error && bookings.map((booking) => (
          <BookingQueueCard
            key={booking.bookingId}
            booking={booking}
            locationName={locationNames[booking.locationId] ?? booking.locationId}
            staffName={staffNames[booking.staffId] ?? booking.staffId}
            customerLabel={customerLabels[booking.customerUserId] ?? booking.customerUserId}
            onConfirm={() => openAction(booking.bookingId, "confirm")}
            onReject={() => openAction(booking.bookingId, "reject")}
            onCancel={() => openAction(booking.bookingId, "cancel")}
          />
        ))}
      </ScrollView>

      {/* Action modal */}
      {activeAction && (
        <AdminQueueActionModal
          visible={!!activeAction}
          actionType={activeAction.actionType}
          isSubmitting={isActionSubmitting}
          errorMessage={actionError}
          onConfirm={handleModalConfirm}
          onDismiss={handleModalDismiss}
        />
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const screen = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
  },
  backButtonText: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  centred: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  mutedText: {
    color: colors.muted,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: "center",
  },
  emptyHeadline: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryButtonText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: 14,
  },
});

const tabs = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
});

const filter = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  scroll: {
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 8,
    flexDirection: "row",
  },
  chip: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  chipTextActive: {
    color: colors.white,
    fontWeight: "700",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 6,
    gap: 8,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  dateInput: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 13,
    color: colors.text,
    backgroundColor: colors.surface,
  },
});

const card = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  badge: {
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  datetime: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
  },
  body: {
    gap: 4,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  contextLabel: {
    fontSize: 11,
    color: colors.muted,
    width: 70,
    fontWeight: "500",
  },
  contextValue: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },
  actionBtn: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.white,
  },
  confirmBtn: {
    backgroundColor: colors.success,
  },
  confirmBtnPressed: {
    backgroundColor: "#388E3C",
  },
  rejectBtn: {
    backgroundColor: colors.error,
  },
  rejectBtnPressed: {
    backgroundColor: "#C62828",
  },
  cancelBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnPressed: {
    backgroundColor: "#F5F5F5",
  },
  cancelBtnText: {
    color: colors.muted,
  },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 480,
    gap: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  body: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.text,
    minHeight: 72,
    textAlignVertical: "top",
    backgroundColor: colors.background,
  },
  error: {
    fontSize: 13,
    color: colors.error,
  },
  buttons: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  destructiveBtn: {
    backgroundColor: colors.error,
  },
  primaryBtnDisabled: {
    backgroundColor: colors.disabled,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryBtn: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 14,
  },
});
