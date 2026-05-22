/**
 * W45 — CampaignListScreen
 *
 * Campaign list with status filter chips and create button.
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
import type { CampaignListEntry } from "../../domains/campaigns/campaignAdminModel";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type CampaignListScreenProps = {
  loading: boolean;
  error: string | null;
  campaigns: CampaignListEntry[];
  statusFilter: string | null;
  onStatusFilter: (status: string | null) => void;
  onOpenCampaign: (campaignId: string) => void;
  onCreateCampaign: () => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const STATUS_OPTIONS = ["draft", "scheduled", "sending", "sent", "paused", "cancelled"] as const;

const STATUS_BG: Record<string, string> = {
  draft: "#f3f4f6",
  scheduled: "#dbeafe",
  sending: "#fef9c3",
  sent: "#dcfce7",
  paused: "#fef3c7",
  cancelled: "#fee2e2",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "#6b7280",
  scheduled: "#2563eb",
  sending: "#ca8a04",
  sent: "#16a34a",
  paused: "#f59e0b",
  cancelled: "#ef4444",
};

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export function CampaignListScreen({
  loading,
  error,
  campaigns,
  statusFilter,
  onStatusFilter,
  onOpenCampaign,
  onCreateCampaign,
  onRetry,
  onBack,
  testID = "campaign-list-screen",
}: CampaignListScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Pressable onPress={onBack} accessibilityRole="button" style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Campaigns</Text>
        <Pressable onPress={onCreateCampaign} accessibilityRole="button" testID="create-campaign-btn" style={styles.addBtn}>
          <Text style={styles.addBtnText}>+ New</Text>
        </Pressable>
      </View>

      {/* Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filterBarContent}>
        <Pressable
          onPress={() => onStatusFilter(null)}
          style={[styles.filterChip, statusFilter === null && styles.filterChipActive]}
          testID="filter-all"
        >
          <Text style={[styles.filterChipText, statusFilter === null && styles.filterChipTextActive]}>All</Text>
        </Pressable>
        {STATUS_OPTIONS.map((s) => (
          <Pressable
            key={s}
            onPress={() => onStatusFilter(s)}
            style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
            testID={`filter-${s}`}
          >
            <Text style={[styles.filterChipText, statusFilter === s && styles.filterChipTextActive]}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading && <AdminLoadingState label="Loading campaigns…" />}
      {!loading && error && <AdminErrorState message={error} onRetry={onRetry} />}
      {!loading && !error && campaigns.length === 0 && (
        <AdminEmptyState
          title="No campaigns"
          body="Create your first marketing campaign."
          cta="Create campaign"
          onCta={onCreateCampaign}
        />
      )}
      {!loading && !error && campaigns.length > 0 && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {campaigns.map((c) => (
            <Pressable
              key={c.campaignId}
              onPress={() => onOpenCampaign(c.campaignId)}
              style={styles.card}
              testID={`campaign-item-${c.campaignId}`}
            >
              <View style={styles.cardTop}>
                <Text style={styles.campaignName}>{c.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[c.status] ?? "#f3f4f6" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[c.status] ?? "#374151" }]}>
                    {c.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.metaText}>{c.channel} · {c.segmentName}</Text>
              <Text style={styles.metaText}>{c.scheduledAt}</Text>
              {c.sent > 0 && (
                <Text style={styles.metricsText}>
                  Sent {c.sent} · Opened {c.opened} · Clicked {c.clicked}
                </Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    gap: 12,
  },
  backBtn: { paddingRight: 8 },
  backText: { fontFamily: brandTypography.regular, fontSize: 14, color: "#6b7280" },
  title: { flex: 1, fontFamily: brandTypography.semibold, fontSize: 18, color: "#111827" },
  addBtn: { paddingLeft: 8 },
  addBtnText: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#4f46e5" },
  filterBar: { maxHeight: 52, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  filterBarContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  filterChipActive: { backgroundColor: "#4f46e5", borderColor: "#4f46e5" },
  filterChipText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#374151" },
  filterChipTextActive: { color: "#fff" },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 4,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  campaignName: { fontFamily: brandTypography.semibold, fontSize: 14, color: "#111827", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontFamily: brandTypography.semibold, fontSize: 11 },
  metaText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#6b7280" },
  metricsText: { fontFamily: brandTypography.regular, fontSize: 12, color: "#374151", marginTop: 2 },
});
