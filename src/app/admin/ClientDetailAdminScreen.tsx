/**
 * W44 — ClientDetailAdminScreen
 *
 * Full admin profile of a single client with 7 tabs: history, preferences,
 * loyalty, notes, allergies, gallery, consents. Header shows photo initials,
 * name, phone, email, sinceDate, totalSpend, tierBadge, statusBadge, and
 * admin action buttons (merge, block, GDPR, delete).
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
import type {
  ClientDetailAdmin,
  ClientDetailTab,
} from "../../domains/clients/clientCrmModel";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ClientDetailAdminScreenProps = {
  loading: boolean;
  error: string | null;
  client: ClientDetailAdmin | null;
  activeTab: ClientDetailTab;
  notesEditing: boolean;
  notesText: string;
  onTabChange: (tab: ClientDetailTab) => void;
  onNotesChange: (text: string) => void;
  onNotesSave: () => void;
  onMerge: () => void;
  onBlock: () => void;
  onGdpr: () => void;
  onDelete: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const TABS: { id: ClientDetailTab; label: string }[] = [
  { id: "history", label: "History" },
  { id: "preferences", label: "Preferences" },
  { id: "loyalty", label: "Loyalty" },
  { id: "notes", label: "Notes" },
  { id: "allergies", label: "Allergies" },
  { id: "gallery", label: "Gallery" },
  { id: "consents", label: "Consents" },
];

const SEVERITY_COLORS: Record<string, string> = {
  low: "#E8F5E9",
  medium: "#FFF8E1",
  high: "#FFF3E0",
  critical: "#FFEBEE",
};
const SEVERITY_TEXT: Record<string, string> = {
  low: "#2E7D32",
  medium: "#F57F17",
  high: "#E65100",
  critical: "#B71C1C",
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ClientDetailAdminScreen({
  loading,
  error,
  client,
  activeTab,
  notesEditing,
  notesText,
  onTabChange,
  onNotesChange,
  onNotesSave,
  onMerge,
  onBlock,
  onGdpr,
  onDelete,
  onRetry,
  onBack,
  testID = "client-detail-admin-screen",
}: ClientDetailAdminScreenProps) {
  if (loading) return <AdminLoadingState label="Loading client…" />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;
  if (!client)
    return (
      <AdminEmptyState
        title="Client not found"
        body="This client record no longer exists."
        cta="Go back"
        onCta={onBack}
      />
    );

  const initials = client.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header} testID="client-header">
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.clientName}>{client.name}</Text>
            {client.isVip && (
              <View style={styles.vipBadge}>
                <Text style={styles.vipBadgeText}>VIP</Text>
              </View>
            )}
            <View
              style={[
                styles.statusBadge,
                client.status === "blocked" && styles.statusBadgeBlocked,
              ]}
            >
              <Text style={styles.statusBadgeText}>{client.status}</Text>
            </View>
          </View>
          {client.phone && <Text style={styles.contactLine}>{client.phone}</Text>}
          {client.email && <Text style={styles.contactLine}>{client.email}</Text>}
          <Text style={styles.sinceText}>
            Client since {client.sinceDate} · {formatCents(client.totalSpendCents)} total
          </Text>
          {client.tier && (
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>{client.tier.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Admin action buttons */}
      <View style={styles.actionRow}>
        <Pressable onPress={onMerge} style={styles.actionBtn} accessibilityRole="button">
          <Text style={styles.actionBtnText}>Merge</Text>
        </Pressable>
        <Pressable
          onPress={onBlock}
          style={[styles.actionBtn, client.status === "blocked" && styles.actionBtnWarning]}
          accessibilityRole="button"
        >
          <Text style={styles.actionBtnText}>
            {client.status === "blocked" ? "Unblock" : "Block"}
          </Text>
        </Pressable>
        <Pressable onPress={onGdpr} style={styles.actionBtn} accessibilityRole="button">
          <Text style={styles.actionBtnText}>GDPR</Text>
        </Pressable>
        <Pressable onPress={onDelete} style={[styles.actionBtn, styles.actionBtnDestructive]} accessibilityRole="button">
          <Text style={styles.actionBtnText}>Delete</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => onTabChange(t.id)}
            style={[styles.tab, activeTab === t.id && styles.tabActive]}
            testID={`tab-${t.id}`}
            accessibilityRole="tab"
          >
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tab content */}
      <ScrollView style={styles.tabContent}>
        {activeTab === "history" && (
          <View testID="booking-history-list">
            {client.bookingHistory.length === 0 ? (
              <Text style={styles.emptyTabText}>No booking history.</Text>
            ) : (
              client.bookingHistory.map((entry) => (
                <View key={entry.bookingId} style={styles.historyRow}>
                  <View style={styles.historyMeta}>
                    <Text style={styles.historyDate}>{entry.date}</Text>
                    <Text style={styles.historyStatus}>{entry.status}</Text>
                  </View>
                  <Text style={styles.historyService}>{entry.serviceName}</Text>
                  <Text style={styles.historyStaff}>with {entry.staffName}</Text>
                  <Text style={styles.historyAmount}>{formatCents(entry.amountCents)}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "preferences" && (
          <View>
            <Text style={styles.sectionLabel}>Preferred services</Text>
            <Text style={styles.prefText}>(Preference data loads from booking history)</Text>
          </View>
        )}

        {activeTab === "loyalty" && (
          <View>
            <Text style={styles.sectionLabel}>Loyalty balance</Text>
            <Text style={styles.loyaltyStat}>{client.loyaltyBalance} pts available</Text>
            <Text style={styles.sectionLabel}>Tier points</Text>
            <Text style={styles.loyaltyStat}>{client.tierPoints} pts this cycle</Text>
          </View>
        )}

        {activeTab === "notes" && (
          <View testID="notes-editor">
            {notesEditing ? (
              <>
                <TextInput
                  style={styles.notesInput}
                  value={notesText}
                  onChangeText={onNotesChange}
                  multiline
                  numberOfLines={6}
                  placeholder="Add a note…"
                  placeholderTextColor="#999"
                  accessibilityLabel="Client notes"
                />
                <Pressable onPress={onNotesSave} style={styles.saveBtn} accessibilityRole="button">
                  <Text style={styles.saveBtnText}>Save notes</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.notesText}>{notesText || "No notes yet."}</Text>
            )}
          </View>
        )}

        {activeTab === "allergies" && (
          <View style={styles.allergyChips} testID="allergy-chips">
            {client.allergies.length === 0 ? (
              <Text style={styles.emptyTabText}>No allergies recorded.</Text>
            ) : (
              client.allergies.map((a) => (
                <View
                  key={a.allergyId}
                  style={[
                    styles.allergyChip,
                    { backgroundColor: SEVERITY_COLORS[a.severity] ?? "#EEE" },
                  ]}
                >
                  <Text style={[styles.allergyLabel, { color: SEVERITY_TEXT[a.severity] ?? "#444" }]}>
                    {a.label} ({a.severity})
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "gallery" && (
          <View>
            {client.photoUrls.length === 0 ? (
              <Text style={styles.emptyTabText}>No photos uploaded.</Text>
            ) : (
              <Text style={styles.emptyTabText}>{client.photoUrls.length} photo(s) available.</Text>
            )}
          </View>
        )}

        {activeTab === "consents" && (
          <View testID="consent-list">
            {client.consents.length === 0 ? (
              <Text style={styles.emptyTabText}>No consent records.</Text>
            ) : (
              client.consents.map((c) => (
                <View key={c.consentId} style={styles.consentRow}>
                  <Text style={styles.consentType}>{c.type}</Text>
                  <Text style={styles.consentDate}>
                    {c.revokedAt
                      ? `Revoked ${c.revokedAt}`
                      : c.grantedAt
                        ? `Granted ${c.grantedAt}`
                        : "Not recorded"}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  backBtn: { marginBottom: 12 },
  backText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6B4EFF" },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#6B4EFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#FFFFFF", fontWeight: "700", fontSize: 22 },
  headerInfo: {},
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  clientName: { fontFamily: brandTypography.semibold, fontSize: 22 },
  vipBadge: {
    backgroundColor: "#FFD700",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  vipBadgeText: { fontSize: 11, fontWeight: "700", color: "#5A4000" },
  statusBadge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeBlocked: { backgroundColor: "#FFEEEE" },
  statusBadgeText: { fontSize: 11, fontWeight: "600", color: "#444" },
  contactLine: { fontFamily: brandTypography.regular, fontSize: 12, color: "#555", marginTop: 4 },
  sinceText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888", marginTop: 4 },
  tierBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#6B4EFF",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  tierBadgeText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#6B4EFF",
    alignItems: "center",
  },
  actionBtnWarning: { backgroundColor: "#E65100" },
  actionBtnDestructive: { backgroundColor: "#CC0000" },
  actionBtnText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#FFFFFF", fontWeight: "700" },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    paddingHorizontal: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#6B4EFF" },
  tabText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#666" },
  tabTextActive: { color: "#6B4EFF", fontWeight: "700" },
  tabContent: { flex: 1, padding: 16 },
  emptyTabText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#888", textAlign: "center", marginTop: 24 },
  historyRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  historyMeta: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  historyDate: { fontFamily: brandTypography.regular, fontSize: 12, color: "#666" },
  historyStatus: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888" },
  historyService: { fontFamily: brandTypography.semibold, fontSize: 14 },
  historyStaff: { fontFamily: brandTypography.regular, fontSize: 12, color: "#666", marginTop: 2 },
  historyAmount: { fontFamily: brandTypography.regular, fontSize: 12, color: "#444", marginTop: 4, textAlign: "right" },
  sectionLabel: { fontFamily: brandTypography.regular, fontSize: 12, color: "#888", marginBottom: 8, marginTop: 12 },
  loyaltyStat: { fontFamily: brandTypography.semibold, fontSize: 22, color: "#6B4EFF" },
  prefText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#666" },
  notesInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    minHeight: 120,
    textAlignVertical: "top",
    fontFamily: brandTypography.regular, fontSize: 14,
  },
  saveBtn: {
    marginTop: 12,
    backgroundColor: "#6B4EFF",
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#FFFFFF" },
  notesText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#444", lineHeight: 22 },
  allergyChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  allergyChip: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6 },
  allergyLabel: { fontSize: 13, fontWeight: "600" },
  consentRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  consentType: { fontFamily: brandTypography.semibold, fontSize: 14, textTransform: "capitalize" },
  consentDate: { fontFamily: brandTypography.regular, fontSize: 12, color: "#666", marginTop: 2 },
});
