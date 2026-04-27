/**
 * ReportingScreens.tsx
 *
 * Admin-facing analytics and reporting views:
 *   ReportingDashboardScreen — KPI cards, service/staff performance, client attention list
 *   CampaignAnalyticsScreen  — campaign and challenge KPI tables
 *
 * All screens are purely presentational: state and data are received via props.
 */

import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  AtRiskMetrics,
  CampaignKpis,
  ChallengeKpis,
  ClientRiskEntry,
  RebookingMetrics,
  RetentionMetrics,
  ServicePerformanceMetrics,
  StaffPerformanceMetrics,
  TenantAnalyticsContext,
  VisitIntervalMetrics,
} from "../../domains/analytics/model";

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
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",
  highRisk: "#F44336",
  mediumRisk: "#FF9800",
  lowRisk: "#FFC107",
};

// ---------------------------------------------------------------------------
// Primitive components
// ---------------------------------------------------------------------------

function PrimaryButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

type KpiCardProps = {
  label: string;
  value: string;
  subtext?: string;
};

function KpiCard({ label, value, subtext }: KpiCardProps) {
  return (
    <View style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
      {subtext ? <Text style={styles.kpiSubtext}>{subtext}</Text> : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Risk badge
// ---------------------------------------------------------------------------

const riskColor: Record<ClientRiskEntry["riskLevel"], string> = {
  high:   colors.highRisk,
  medium: colors.mediumRisk,
  low:    colors.lowRisk,
};

function RiskBadge({ level }: { level: ClientRiskEntry["riskLevel"] }) {
  return (
    <View style={[styles.badge, { backgroundColor: riskColor[level] }]}>
      <Text style={styles.badgeText}>{level.toUpperCase()}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ReportingDashboardScreen
// ---------------------------------------------------------------------------

export type ReportingDashboardScreenProps = {
  analyticsContext: TenantAnalyticsContext | null;
  retention: RetentionMetrics | null;
  rebooking: RebookingMetrics | null;
  atRisk: AtRiskMetrics | null;
  visitInterval: VisitIntervalMetrics | null;
  staffPerformance: StaffPerformanceMetrics[];
  servicePerformance: ServicePerformanceMetrics[];
  clientAttentionList: ClientRiskEntry[];
  isLoading: boolean;
  errorMessage: string | null;
  dateRangeLabel: string;
  onChangeDateRange: () => void;
  locationLabel: string;
  onChangeLocation: () => void;
  onRetry: () => void;
  onBack: () => void;
  onClientAction: (userId: string) => void;
};

export function ReportingDashboardScreen({
  analyticsContext,
  retention,
  rebooking,
  atRisk,
  visitInterval,
  staffPerformance,
  servicePerformance,
  clientAttentionList,
  isLoading,
  errorMessage,
  dateRangeLabel,
  onChangeDateRange,
  locationLabel,
  onChangeLocation,
  onRetry,
  onBack,
  onClientAction,
}: ReportingDashboardScreenProps) {
  const accessible = analyticsContext?.accessibleReports ?? [];

  return (
    <ScrollView contentContainerStyle={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back</Text>
        </Pressable>
      </View>

      {/* Date range filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Period: {dateRangeLabel}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onChangeDateRange}
          style={styles.filterButton}
          testID="date-filter-change"
        >
          <Text style={styles.filterButtonText}>Change</Text>
        </Pressable>
      </View>

      {/* Location filter */}
      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Location: {locationLabel}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onChangeLocation}
          style={styles.filterButton}
          testID="location-filter-change"
        >
          <Text style={styles.filterButtonText}>Change</Text>
        </Pressable>
      </View>

      {/* Loading / error */}
      {isLoading ? (
        <Text style={styles.bodyText}>Loading analytics…</Text>
      ) : null}
      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <PrimaryButton label="Retry" onPress={onRetry} />
        </View>
      ) : null}

      {!isLoading && !errorMessage ? (
        <>
          {/* KPI cards */}
          {(accessible.includes("retention") || accessible.includes("rebooking")) && (
            <>
              <SectionTitle title="Engagement KPIs" />
              <View style={styles.kpiRow}>
                {accessible.includes("retention") && retention ? (
                  <KpiCard
                    label="Retention Rate"
                    value={`${Math.round(retention.retentionRate * 100)}%`}
                    subtext={`${retention.retainedClients} / ${retention.totalUniqueClients} clients`}
                  />
                ) : null}
                {accessible.includes("rebooking") && rebooking ? (
                  <KpiCard
                    label="Rebooking Rate"
                    value={`${Math.round(rebooking.rebookingRate * 100)}%`}
                    subtext={`${rebooking.rebookedClients} / ${rebooking.totalUniqueClients} clients`}
                  />
                ) : null}
                {accessible.includes("at_risk") && atRisk ? (
                  <KpiCard
                    label="At-Risk Clients"
                    value={String(atRisk.atRiskClients)}
                    subtext={`>${atRisk.thresholdDays}d inactive`}
                  />
                ) : null}
                {accessible.includes("visit_interval") && visitInterval ? (
                  <KpiCard
                    label="Avg Visit Interval"
                    value={
                      visitInterval.avgDaysBetweenVisits !== null
                        ? `${visitInterval.avgDaysBetweenVisits}d`
                        : "—"
                    }
                    subtext="between visits"
                  />
                ) : null}
              </View>
            </>
          )}

          {/* Staff performance */}
          {accessible.includes("staff_performance") && staffPerformance.length > 0 ? (
            <>
              <SectionTitle title="Staff Performance" />
              {staffPerformance.map((s) => (
                <View key={s.staffId} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{s.staffId}</Text>
                  <Text style={styles.tableCell}>{s.completedBookings} completed</Text>
                  <Text style={styles.tableCell}>{s.noShowCount} no-shows</Text>
                  <Text style={styles.tableCellMuted}>
                    {Math.round(s.noShowRate * 100)}% no-show rate
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          {/* Service performance */}
          {accessible.includes("service_performance") && servicePerformance.length > 0 ? (
            <>
              <SectionTitle title="Service Performance" />
              {servicePerformance.map((s) => (
                <View key={s.serviceId} style={styles.tableRow}>
                  <Text style={styles.tableCell}>#{s.popularityRank}</Text>
                  <Text style={styles.tableCell}>{s.serviceId}</Text>
                  <Text style={styles.tableCell}>{s.completedBookings} bookings</Text>
                  <Text style={styles.tableCellMuted}>{s.cancellationCount} cancelled</Text>
                </View>
              ))}
            </>
          ) : null}

          {/* Client attention list */}
          {accessible.includes("at_risk") && clientAttentionList.length > 0 ? (
            <>
              <SectionTitle title="Client Attention List" />
              <FlatList
                data={clientAttentionList}
                keyExtractor={(item) => item.userId}
                scrollEnabled={false}
                renderItem={({ item }) => (
                  <View style={styles.clientRow}>
                    <View style={styles.clientInfo}>
                      <Text style={styles.clientUserId}>{item.userId}</Text>
                      <Text style={styles.clientMeta}>
                        Last visit: {item.lastVisitDate} ({item.daysSinceLastVisit}d ago)
                      </Text>
                      <Text style={styles.clientMeta}>Total visits: {item.totalVisits}</Text>
                    </View>
                    <View style={styles.clientActions}>
                      <RiskBadge level={item.riskLevel} />
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => onClientAction(item.userId)}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionButtonText}>Contact</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              />
            </>
          ) : null}

          {accessible.includes("at_risk") && clientAttentionList.length === 0 && !isLoading ? (
            <Text style={styles.emptyText}>No at-risk clients — great retention!</Text>
          ) : null}
        </>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// CampaignAnalyticsScreen
// ---------------------------------------------------------------------------

export type CampaignAnalyticsScreenProps = {
  campaignKpis: CampaignKpis[];
  challengeKpis: ChallengeKpis[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onBack: () => void;
};

export function CampaignAnalyticsScreen({
  campaignKpis,
  challengeKpis,
  isLoading,
  errorMessage,
  onRetry,
  onBack,
}: CampaignAnalyticsScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Campaign Analytics</Text>
        <Pressable accessibilityRole="button" onPress={onBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>← Back</Text>
        </Pressable>
      </View>

      {isLoading ? <Text style={styles.bodyText}>Loading campaign data…</Text> : null}

      {errorMessage ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <PrimaryButton label="Retry" onPress={onRetry} />
        </View>
      ) : null}

      {!isLoading && !errorMessage ? (
        <>
          {/* Campaign KPIs */}
          <SectionTitle title="Campaigns" />
          {campaignKpis.length === 0 ? (
            <Text style={styles.emptyText}>No campaigns found.</Text>
          ) : (
            campaignKpis.map((c) => (
              <View key={c.campaignId} style={styles.campaignCard}>
                <Text style={styles.campaignName}>{c.name}</Text>
                <Text style={styles.campaignChannel}>{c.channel.toUpperCase()}</Text>
                <View style={styles.kpiRow}>
                  <KpiCard label="Sent" value={String(c.sent)} />
                  <KpiCard
                    label="Open Rate"
                    value={`${Math.round(c.openRate * 100)}%`}
                  />
                  <KpiCard
                    label="Click Rate"
                    value={`${Math.round(c.clickRate * 100)}%`}
                  />
                  <KpiCard
                    label="Conv. Rate"
                    value={`${Math.round(c.conversionRate * 100)}%`}
                  />
                </View>
              </View>
            ))
          )}

          {/* Challenge KPIs */}
          <SectionTitle title="Challenges" />
          {challengeKpis.length === 0 ? (
            <Text style={styles.emptyText}>No active challenges found.</Text>
          ) : (
            challengeKpis.map((ch) => (
              <View key={ch.activityId} style={styles.campaignCard}>
                <Text style={styles.campaignName}>{ch.name}</Text>
                <View style={styles.kpiRow}>
                  <KpiCard label="Participants" value={String(ch.participants)} />
                  <KpiCard
                    label="Completion"
                    value={`${Math.round(ch.completionRate * 100)}%`}
                  />
                  <KpiCard label="Rewards" value={String(ch.rewardsAwarded)} />
                </View>
              </View>
            ))
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: 16,
    paddingBottom: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  backLink: { padding: 8 },
  backLinkText: { color: colors.primary, fontSize: 14 },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  filterLabel: { fontSize: 13, color: colors.muted, flex: 1 },
  filterButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  filterButtonText: { fontSize: 13, color: colors.text },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  kpiRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  kpiCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    minWidth: 100,
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  kpiLabel: { fontSize: 11, color: colors.muted, marginBottom: 4 },
  kpiValue: { fontSize: 20, fontWeight: "700", color: colors.text },
  kpiSubtext: { fontSize: 11, color: colors.muted, marginTop: 2 },
  tableRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableCell: { fontSize: 13, color: colors.text },
  tableCellMuted: { fontSize: 13, color: colors.muted },
  clientRow: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  clientInfo: { flex: 1 },
  clientUserId: { fontSize: 14, fontWeight: "600", color: colors.text },
  clientMeta: { fontSize: 12, color: colors.muted, marginTop: 2 },
  clientActions: { alignItems: "flex-end", gap: 6 },
  badge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
  actionButton: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  actionButtonText: { fontSize: 12, color: "#FFFFFF", fontWeight: "600" },
  campaignCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  campaignName: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 2 },
  campaignChannel: { fontSize: 11, color: colors.muted, marginBottom: 8 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonLabel: { color: "#FFFFFF", fontWeight: "600" },
  errorCard: {
    backgroundColor: "#FFF3F3",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  errorText: { color: colors.error, fontSize: 14, marginBottom: 6 },
  bodyText: { fontSize: 14, color: colors.muted, textAlign: "center", marginVertical: 20 },
  emptyText: { fontSize: 14, color: colors.muted, textAlign: "center", marginVertical: 20 },
});
