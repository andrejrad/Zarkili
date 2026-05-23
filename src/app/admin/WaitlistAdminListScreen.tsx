/**
 * W46 — WaitlistAdminListScreen
 *
 * Admin view of all waitlist entries with filter, notify, cancel, convert actions.
 */
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import type {
  WaitlistAdminEntry,
  WaitlistAdminFilter,
} from "../../domains/waitlist/waitlistAdminModel";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const FILTER_OPTIONS: { label: string; value: WaitlistAdminFilter }[] = [
  { label: "All", value: "all" },
  { label: "Waiting", value: "waiting" },
  { label: "Notified", value: "notified" },
  { label: "Booked", value: "booked" },
  { label: "Expired", value: "expired" },
  { label: "Cancelled", value: "cancelled" },
];

export type WaitlistAdminListScreenProps = {
  loading: boolean;
  error: string | null;
  entries: WaitlistAdminEntry[];
  filter: WaitlistAdminFilter;
  onFilterChange: (filter: WaitlistAdminFilter) => void;
  onOpenEntry: (waitlistId: string) => void;
  onNotifyEntry: (waitlistId: string) => void;
  onCancelEntry: (waitlistId: string) => void;
  onConvertEntry: (waitlistId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function WaitlistAdminListScreen({
  loading,
  error,
  entries,
  filter,
  onFilterChange,
  onOpenEntry,
  onNotifyEntry,
  onCancelEntry,
  onConvertEntry,
  onRetry,
  onBack,
  testID = "waitlist-admin-list-screen",
}: WaitlistAdminListScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Waitlist Admin</Text>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {FILTER_OPTIONS.map(({ label, value }) => (
          <Pressable
            key={value}
            onPress={() => onFilterChange(value)}
            testID={`filter-${value}`}
            style={[styles.chip, filter === value && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === value && styles.chipTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? <AdminLoadingState label="Loading waitlist…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}
      {!loading && !error && entries.length === 0 ? (
        <AdminEmptyState title="No Entries" body="No waitlist entries match the current filter." />
      ) : null}

      {entries.map((entry) => (
        <Pressable
          key={entry.waitlistId}
          onPress={() => onOpenEntry(entry.waitlistId)}
          testID={`entry-${entry.waitlistId}`}
          style={styles.entryCard}
          accessibilityRole="button"
        >
          <View style={styles.entryTop}>
            <Text style={styles.clientName}>{entry.clientName}</Text>
            <View style={[styles.statusBadge, styles[`status_${entry.status}`] ?? {}]}>
              <Text style={styles.statusText}>{entry.status}</Text>
            </View>
          </View>
          <Text style={styles.serviceText}>{entry.serviceName}</Text>
          <Text style={styles.dateText}>
            {entry.preferredDateFrom} → {entry.preferredDateTo} • {entry.preferredTime}
          </Text>
          {entry.staffName ? (
            <Text style={styles.staffText}>{entry.staffName}</Text>
          ) : null}
          <View style={styles.actionRow}>
            {entry.status === "waiting" || entry.status === "notified" ? (
              <Pressable
                onPress={() => onNotifyEntry(entry.waitlistId)}
                testID={`notify-${entry.waitlistId}`}
                style={styles.actionBtn}
                accessibilityRole="button"
              >
                <Text style={styles.actionBtnText}>Notify</Text>
              </Pressable>
            ) : null}
            {entry.status === "waiting" || entry.status === "notified" ? (
              <Pressable
                onPress={() => onConvertEntry(entry.waitlistId)}
                testID={`convert-${entry.waitlistId}`}
                style={styles.actionBtn}
                accessibilityRole="button"
              >
                <Text style={styles.actionBtnText}>Convert</Text>
              </Pressable>
            ) : null}
            {entry.status !== "cancelled" && entry.status !== "booked" ? (
              <Pressable
                onPress={() => onCancelEntry(entry.waitlistId)}
                testID={`cancel-${entry.waitlistId}`}
                style={[styles.actionBtn, styles.actionBtnDanger]}
                accessibilityRole="button"
              >
                <Text style={styles.actionBtnText}>Cancel</Text>
              </Pressable>
            ) : null}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scroll: { padding: 16, gap: 12, backgroundColor: "#F2EDDD" },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn: { paddingVertical: 4 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6B6B6B" },
  title: { fontFamily: brandTypography.semibold, fontSize: 20, color: "#1A1A1A" },
  chips: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#E5E0D1" },
  chipActive: { backgroundColor: "#1A1A1A" },
  chipText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#4B4B4B" },
  chipTextActive: { color: "#FFFFFF", fontFamily: brandTypography.semibold },
  entryCard: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 14, gap: 6 },
  entryTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  clientName: { fontFamily: brandTypography.semibold, fontSize: 15, color: "#1A1A1A", flex: 1 },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: "#E5E0D1" },
  statusText: { fontFamily: brandTypography.regular, fontSize: 11, color: "#4B4B4B" },
  serviceText: { fontFamily: brandTypography.regular, fontSize: 13, color: "#4B4B4B" },
  dateText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6B6B6B" },
  staffText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#9CA3AF" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#1A1A1A" },
  actionBtnDanger: { backgroundColor: "#DC2626" },
  actionBtnText: { fontFamily: brandTypography.semibold, fontSize: 12, color: "#FFFFFF" },
  // Status colour variants — not all used but safe
  status_waiting: {},
  status_notified: { backgroundColor: "#FEF3C7" },
  status_booked: { backgroundColor: "#D1FAE5" },
  status_expired: { backgroundColor: "#FEE2E2" },
  status_cancelled: { backgroundColor: "#F3F4F6" },
});
