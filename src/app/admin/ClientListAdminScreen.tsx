/**
 * W44 — ClientListAdminScreen
 *
 * Admin view of the full client roster with search, filter chips (all / active /
 * blocked / vip), saved-view selector (myClients / noShowRisk / churned), and
 * a bulk-action bar.
 */
import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";
import type { ClientFilter, ClientListEntry, ClientSavedView } from "../../domains/clients/clientCrmModel";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ClientListAdminScreenProps = {
  loading: boolean;
  error: string | null;
  clients: ClientListEntry[];
  search: string;
  filter: ClientFilter;
  savedView: ClientSavedView | null;
  selectedIds: string[];
  onSearchChange: (text: string) => void;
  onFilterChange: (f: ClientFilter) => void;
  onSavedViewChange: (v: ClientSavedView | null) => void;
  onSelectClient: (clientId: string) => void;
  onToggleSelect: (clientId: string) => void;
  onBulkBlock: () => void;
  onBulkExport: () => void;
  onBulkMessage: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const FILTER_LABELS: Record<ClientFilter, string> = {
  all: "All",
  active: "Active",
  blocked: "Blocked",
  vip: "VIP",
};

const SAVED_VIEW_LABELS: Record<ClientSavedView, string> = {
  myClients: "My Clients",
  noShowRisk: "No-Show Risk",
  churned: "Churned",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ClientRow({
  client,
  selected,
  onPress,
  onLongPress,
}: {
  client: ClientListEntry;
  selected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const initials = client.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.clientRow, selected && styles.clientRowSelected]}
      testID={`client-row-${client.clientId}`}
    >
      <View style={[styles.avatar, selected && styles.avatarSelected]}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.clientInfo}>
        <View style={styles.clientNameRow}>
          <Text style={styles.clientName}>{client.name}</Text>
          {client.isVip && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipBadgeText}>VIP</Text>
            </View>
          )}
          {client.status === "blocked" && (
            <View style={styles.blockedBadge}>
              <Text style={styles.blockedBadgeText}>Blocked</Text>
            </View>
          )}
        </View>
        <Text style={styles.clientSub}>
          {client.phone ?? client.email ?? "No contact info"}
        </Text>
      </View>
      <View style={styles.clientMeta}>
        <Text style={styles.metaBookings}>{client.totalBookings} visits</Text>
        {client.lastVisitDate && (
          <Text style={styles.metaDate}>{client.lastVisitDate}</Text>
        )}
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function ClientListAdminScreen({
  loading,
  error,
  clients,
  search,
  filter,
  savedView,
  selectedIds,
  onSearchChange,
  onFilterChange,
  onSavedViewChange,
  onSelectClient,
  onToggleSelect,
  onBulkBlock,
  onBulkExport,
  onBulkMessage,
  onRetry,
  onBack,
  testID = "client-list-screen",
}: ClientListAdminScreenProps) {
  const [showSavedViews, setShowSavedViews] = useState(false);
  const bulkActive = selectedIds.length > 0;

  return (
    <View style={styles.container} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Clients</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={onSearchChange}
          placeholder="Search clients…"
          placeholderTextColor="#999"
          testID="search-input"
          accessibilityLabel="Search clients"
        />
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        {(Object.keys(FILTER_LABELS) as ClientFilter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => onFilterChange(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            testID={`filter-${f}`}
            accessibilityRole="button"
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </Pressable>
        ))}

        {/* Saved view selector */}
        <Pressable
          onPress={() => setShowSavedViews((v) => !v)}
          style={[styles.filterChip, savedView != null && styles.filterChipActive]}
          testID="saved-view-selector"
          accessibilityRole="button"
        >
          <Text style={[styles.filterChipText, savedView != null && styles.filterChipTextActive]}>
            {savedView ? SAVED_VIEW_LABELS[savedView] : "Saved Views ▾"}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Saved view dropdown */}
      {showSavedViews && (
        <View style={styles.savedViewDropdown}>
          <Pressable
            onPress={() => {
              onSavedViewChange(null);
              setShowSavedViews(false);
            }}
            style={styles.savedViewOption}
            accessibilityRole="button"
          >
            <Text style={styles.savedViewOptionText}>Clear saved view</Text>
          </Pressable>
          {(Object.keys(SAVED_VIEW_LABELS) as ClientSavedView[]).map((v) => (
            <Pressable
              key={v}
              onPress={() => {
                onSavedViewChange(v);
                setShowSavedViews(false);
              }}
              style={styles.savedViewOption}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.savedViewOptionText,
                  savedView === v && styles.savedViewOptionTextActive,
                ]}
              >
                {SAVED_VIEW_LABELS[v]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Content */}
      {loading ? (
        <AdminLoadingState label="Loading clients…" />
      ) : error ? (
        <AdminErrorState message={error} onRetry={onRetry} />
      ) : clients.length === 0 ? (
        <AdminEmptyState
          title="No clients found"
          body="Try adjusting your search or filter."
        />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(c) => c.clientId}
          renderItem={({ item }) => (
            <ClientRow
              client={item}
              selected={selectedIds.includes(item.clientId)}
              onPress={() => {
                if (bulkActive) onToggleSelect(item.clientId);
                else onSelectClient(item.clientId);
              }}
              onLongPress={() => onToggleSelect(item.clientId)}
            />
          )}
          contentContainerStyle={bulkActive ? styles.listWithBulk : undefined}
        />
      )}

      {/* Bulk action bar */}
      {bulkActive && (
        <View style={styles.bulkBar} testID="bulk-action-bar">
          <Text style={styles.bulkCount}>{selectedIds.length} selected</Text>
          <Pressable onPress={onBulkMessage} style={styles.bulkBtn} accessibilityRole="button">
            <Text style={styles.bulkBtnText}>Message</Text>
          </Pressable>
          <Pressable onPress={onBulkExport} style={styles.bulkBtn} accessibilityRole="button">
            <Text style={styles.bulkBtnText}>Export</Text>
          </Pressable>
          <Pressable onPress={onBulkBlock} style={[styles.bulkBtn, styles.bulkBtnDestructive]} accessibilityRole="button">
            <Text style={styles.bulkBtnText}>Block</Text>
          </Pressable>
        </View>
      )}
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
  title: { fontFamily: brandTypography.semibold, fontSize: 22, flex: 1 },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  searchInput: {
    height: 40,
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontFamily: brandTypography.regular, fontSize: 14,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#CCCCCC",
    marginRight: 8,
    backgroundColor: "#FFFFFF",
  },
  filterChipActive: { backgroundColor: "#6B4EFF", borderColor: "#6B4EFF" },
  filterChipText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#444" },
  filterChipTextActive: { color: "#FFFFFF" },
  savedViewDropdown: {
    position: "absolute",
    top: 148,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  savedViewOption: { paddingHorizontal: 16, paddingVertical: 12 },
  savedViewOptionText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#444" },
  savedViewOptionTextActive: { color: "#6B4EFF", fontWeight: "600" },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  clientRowSelected: { backgroundColor: "#F0EDFF" },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6B4EFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarSelected: { backgroundColor: "#4A30CC" },
  avatarText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  clientInfo: { flex: 1 },
  clientNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  clientName: { fontFamily: brandTypography.semibold, fontSize: 14 },
  vipBadge: {
    backgroundColor: "#FFD700",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  vipBadgeText: { fontSize: 10, fontWeight: "700", color: "#5A4000" },
  blockedBadge: {
    backgroundColor: "#FFEEEE",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  blockedBadgeText: { fontSize: 10, fontWeight: "600", color: "#CC0000" },
  clientSub: { fontFamily: brandTypography.regular, fontSize: 12, color: "#666", marginTop: 2 },
  clientMeta: { alignItems: "flex-end" },
  metaBookings: { fontFamily: brandTypography.regular, fontSize: 12, color: "#444" },
  metaDate: { fontFamily: brandTypography.regular, fontSize: 12, color: "#999", marginTop: 2 },
  listWithBulk: { paddingBottom: 80 },
  bulkBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#333333",
    gap: 8,
  },
  bulkCount: { fontFamily: brandTypography.regular, fontSize: 12, color: "#FFFFFF", flex: 1 },
  bulkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#6B4EFF",
  },
  bulkBtnDestructive: { backgroundColor: "#CC0000" },
  bulkBtnText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#FFFFFF", fontWeight: "600" },
});
