/**
 * W40 — ResourceManagementScreen: rooms, chairs, equipment management (N.4).
 *
 * Tabbed view (Rooms / Chairs / Equipment) with a data table per tab.
 * Add/edit resource is handled by caller-provided callbacks.
 */
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { ResourceItem, ResourceType } from "./locationAdminService";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ResourceManagementScreenProps = {
  loading: boolean;
  error: string | null;
  locationName: string;
  resources: ResourceItem[];
  onAddResource: (type: ResourceType) => void;
  onEditResource: (resourceId: string) => void;
  onRetry: () => void;
  onBack: () => void;
};

type Tab = ResourceType;

const TABS: { key: Tab; label: string }[] = [
  { key: "room", label: "Rooms" },
  { key: "chair", label: "Chairs" },
  { key: "equipment", label: "Equipment" },
];

function statusColor(status: ResourceItem["status"]): string {
  switch (status) {
    case "active": return "#22C55E";
    case "maintenance": return "#F59E0B";
    case "inactive": return "#9CA3AF";
    default: return "#9CA3AF";
  }
}

function statusLabel(status: ResourceItem["status"]): string {
  switch (status) {
    case "active": return "Active";
    case "maintenance": return "Maintenance";
    case "inactive": return "Inactive";
    default: return status;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ResourceManagementScreen({
  loading,
  error,
  locationName,
  resources,
  onAddResource,
  onEditResource,
  onRetry,
  onBack,
}: ResourceManagementScreenProps) {
  const [activeTab, setActiveTab] = useState<Tab>("room");
  const filtered = resources.filter((r) => r.type === activeTab);

  return (
    <ScrollView contentContainerStyle={styles.root} testID="resource-management-screen">
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ {locationName}</Text>
      </Pressable>
      <View style={styles.titleRow}>
        <Text style={styles.pageTitle}>Resources</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => onAddResource(activeTab)}
          style={styles.addBtn}
          testID="add-resource-btn"
        >
          <Text style={styles.addBtnLabel}>+ Add</Text>
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            testID={`tab-${tab.key}`}
          >
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? <AdminLoadingState label="Loading resources…" /> : null}
      {error && !loading ? <AdminErrorState message={error} onRetry={onRetry} /> : null}

      {!loading && !error && filtered.length === 0 ? (
        <AdminEmptyState
          title={`No ${activeTab}s yet`}
          body={`Add ${activeTab}s to track capacity at this location.`}
          cta={`Add ${activeTab}`}
          onCta={() => onAddResource(activeTab)}
        />
      ) : null}

      {!loading && filtered.length > 0 ? (
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.colName, styles.headerCell]}>Name</Text>
            <Text style={[styles.colCapacity, styles.headerCell]}>Capacity</Text>
            <Text style={[styles.colStatus, styles.headerCell]}>Status</Text>
          </View>
          {filtered.map((res) => (
            <Pressable
              key={res.resourceId}
              accessibilityRole="button"
              onPress={() => onEditResource(res.resourceId)}
              style={styles.tableRow}
              testID={`resource-row-${res.resourceId}`}
            >
              <View style={styles.colName}>
                <Text style={styles.resourceName} numberOfLines={1}>{res.name}</Text>
                {res.maintenanceNote ? (
                  <Text style={styles.maintenanceNote} numberOfLines={1}>{res.maintenanceNote}</Text>
                ) : null}
              </View>
              <Text style={[styles.colCapacity, styles.cellText]}>{res.capacity}</Text>
              <View style={styles.colStatus}>
                <View style={[styles.statusPill, { backgroundColor: `${statusColor(res.status)}20` }]}>
                  <Text style={[styles.statusText, { color: statusColor(res.status) }]}>
                    {statusLabel(res.status)}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* In-maintenance banner */}
      {!loading && filtered.some((r) => r.status === "maintenance") ? (
        <View style={styles.maintenanceBanner} testID="maintenance-banner">
          <Text style={styles.maintenanceBannerText}>
            {filtered.filter((r) => r.status === "maintenance").length}{" "}
            {activeTab}{filtered.filter((r) => r.status === "maintenance").length !== 1 ? "s" : ""}{" "}
            currently under maintenance — these are excluded from booking capacity.
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingBottom: 32, gap: 8 },
  backRow: { paddingBottom: 4 },
  backLabel: { fontSize: 14, fontFamily: brandTypography.regular, color: "#6B6B6B" },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { fontSize: 24, lineHeight: 32, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  addBtn: { backgroundColor: "#1A1A1A", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 9999 },
  addBtnLabel: { fontSize: 13, fontFamily: brandTypography.semibold, color: "#FFFFFF" },
  tabBar: { flexDirection: "row", backgroundColor: "#F7F4EC", borderRadius: 12, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: "#FFFFFF" },
  tabLabel: { fontSize: 13, fontFamily: brandTypography.medium, color: "#6B6B6B" },
  tabLabelActive: { color: "#1A1A1A" },
  table: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E0D1", overflow: "hidden" },
  tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#F0EDE6" },
  tableHeader: { backgroundColor: "#F7F4EC" },
  headerCell: { fontSize: 11, fontFamily: brandTypography.semibold, color: "#6B6B6B", textTransform: "uppercase", letterSpacing: 0.4 },
  colName: { flex: 3, gap: 2 },
  colCapacity: { flex: 1, textAlign: "center" },
  colStatus: { flex: 1.5, alignItems: "flex-end" },
  resourceName: { fontSize: 14, fontFamily: brandTypography.medium, color: "#1A1A1A" },
  maintenanceNote: { fontSize: 11, fontFamily: brandTypography.regular, color: "#F59E0B" },
  cellText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#1A1A1A" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 9999 },
  statusText: { fontSize: 11, fontFamily: brandTypography.semibold },
  maintenanceBanner: { backgroundColor: "#FFFBF0", borderRadius: 12, borderWidth: 1, borderColor: "#F59E0B", padding: 12 },
  maintenanceBannerText: { fontSize: 13, fontFamily: brandTypography.regular, color: "#92400E" },
});
