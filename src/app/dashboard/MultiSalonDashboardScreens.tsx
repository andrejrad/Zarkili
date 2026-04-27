/**
 * MultiSalonDashboardScreens.tsx
 *
 * Pure-UI components for the multi-salon home dashboard:
 *
 *   MultiSalonDashboardScreen — outer shell: salon cards + states
 *   SalonCard                 — individual salon card with unread badge
 *                               and quick action buttons
 *
 * All state is prop-driven.
 */

import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { SalonSummary } from "./unreadAggregationService";

// ---------------------------------------------------------------------------
// Design tokens (consistent with existing admin screens)
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
  badge: "#E3A9A0",
  badgeText: "#FFFFFF",
  badgeUnknown: "#B0B0B0",
};

// ---------------------------------------------------------------------------
// Quick-action types (exported for wiring in AppNavigatorShell)
// ---------------------------------------------------------------------------

export type SalonQuickAction = "book" | "messages" | "loyalty" | "profile";

// ---------------------------------------------------------------------------
// Screen props
// ---------------------------------------------------------------------------

export type MultiSalonDashboardScreenProps = {
  summaries: SalonSummary[];
  isLoading: boolean;
  error: string | null;
  /** Used when the unread query fails — if true, badges show "?" */
  unreadFailed: boolean;
  onRetry: () => void;
  /** Opens the marketplace / discovery screen */
  onOpenMarketplace: () => void;
  /** Tap on a salon card body → select it and enter the salon context */
  onSelectSalon: (tenantId: string) => void;
  /** Quick-action button taps */
  onQuickAction: (tenantId: string, action: SalonQuickAction) => void;
};

// ---------------------------------------------------------------------------
// Salon card
// ---------------------------------------------------------------------------

type SalonCardProps = {
  summary: SalonSummary;
  unreadFailed: boolean;
  onSelect: () => void;
  onQuickAction: (action: SalonQuickAction) => void;
};

function SalonCard({ summary, unreadFailed, onSelect, onQuickAction }: SalonCardProps) {
  const badgeCount = summary.unreadMessageCount;
  const showBadge = unreadFailed || badgeCount > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${summary.tenantName}`}
      onPress={onSelect}
      style={({ pressed }) => [card.container, pressed && card.containerPressed]}
      testID={`salon-card-${summary.tenantId}`}
    >
      {/* Logo placeholder + unread badge */}
      <View style={card.logoRow}>
        <View style={card.logoPlaceholder}>
          <Text style={card.logoInitial}>
            {summary.tenantName.charAt(0).toUpperCase()}
          </Text>
        </View>

        {showBadge && (
          <View
            style={[card.badge, unreadFailed && card.badgeUnknown]}
            testID={`unread-badge-${summary.tenantId}`}
          >
            <Text style={card.badgeText}>
              {unreadFailed ? "?" : badgeCount > 99 ? "99+" : String(badgeCount)}
            </Text>
          </View>
        )}
      </View>

      {/* Salon name + status */}
      <Text style={card.name} numberOfLines={1}>
        {summary.tenantName}
      </Text>
      <Text style={card.accessLevel}>{summary.accessLevel}</Text>

      {/* Next appointment */}
      {summary.nextAppointmentAt != null && (
        <Text
          style={card.nextAppointment}
          numberOfLines={1}
          testID={`next-appointment-${summary.tenantId}`}
        >
          {summary.nextAppointmentServiceName != null
            ? `${summary.nextAppointmentServiceName} · `
            : ""}
          {summary.nextAppointmentAt.toDate().toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </Text>
      )}

      {/* Quick-action buttons */}
      <View style={card.actions}>
        <QuickActionButton
          label="Book"
          testID={`action-book-${summary.tenantId}`}
          onPress={() => onQuickAction("book")}
        />
        <QuickActionButton
          label="Messages"
          testID={`action-messages-${summary.tenantId}`}
          onPress={() => onQuickAction("messages")}
        />
        <QuickActionButton
          label="Loyalty"
          testID={`action-loyalty-${summary.tenantId}`}
          onPress={() => onQuickAction("loyalty")}
        />
        <QuickActionButton
          label="Profile"
          testID={`action-profile-${summary.tenantId}`}
          onPress={() => onQuickAction("profile")}
        />
      </View>
    </Pressable>
  );
}

function QuickActionButton({
  label,
  testID,
  onPress,
}: {
  label: string;
  testID: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [action.btn, pressed && action.btnPressed]}
      testID={testID}
    >
      <Text style={action.btnText}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function MultiSalonDashboardScreen({
  summaries,
  isLoading,
  error,
  unreadFailed,
  onRetry,
  onOpenMarketplace,
  onSelectSalon,
  onQuickAction,
}: MultiSalonDashboardScreenProps) {
  return (
    <View style={screen.root} testID="multi-salon-dashboard">
      <View style={screen.header}>
        <Text style={screen.title}>Your salons</Text>
      </View>

      <ScrollView
        style={screen.scroll}
        contentContainerStyle={screen.scrollContent}
        showsVerticalScrollIndicator={false}
        testID="dashboard-scroll"
      >
        {/* Loading */}
        {isLoading && (
          <View style={screen.centred} testID="dashboard-loading">
            <ActivityIndicator color={colors.primary} />
            <Text style={screen.mutedText}>Loading your salons…</Text>
          </View>
        )}

        {/* Error */}
        {!isLoading && error && (
          <View style={screen.centred} testID="dashboard-error">
            <Text style={screen.errorText}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={onRetry}
              style={screen.retryButton}
              testID="dashboard-retry-button"
            >
              <Text style={screen.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {/* Empty state */}
        {!isLoading && !error && summaries.length === 0 && (
          <View style={screen.centred} testID="dashboard-empty">
            <Text style={screen.emptyHeadline}>No salons yet</Text>
            <Text style={screen.mutedText}>
              Discover and subscribe to salons to see them here.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Explore salons"
              onPress={onOpenMarketplace}
              style={screen.marketplaceBtn}
              testID="marketplace-cta"
            >
              <Text style={screen.marketplaceBtnText}>Explore salons</Text>
            </Pressable>
          </View>
        )}

        {/* Salon cards */}
        {!isLoading &&
          !error &&
          summaries.map((summary) => (
            <SalonCard
              key={summary.tenantId}
              summary={summary}
              unreadFailed={unreadFailed}
              onSelect={() => onSelectSalon(summary.tenantId)}
              onQuickAction={(action) => onQuickAction(summary.tenantId, action)}
            />
          ))}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  centred: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
    gap: 12,
  },
  mutedText: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
    marginTop: 4,
  },
  retryButtonText: {
    color: colors.surface,
    fontWeight: "600",
    fontSize: 14,
  },
  emptyHeadline: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  marketplaceBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 10,
    marginTop: 8,
  },
  marketplaceBtnText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: 15,
  },
});

const card = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  containerPressed: {
    opacity: 0.85,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  logoInitial: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.badge,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeUnknown: {
    backgroundColor: colors.badgeUnknown,
  },
  badgeText: {
    color: colors.badgeText,
    fontSize: 11,
    fontWeight: "700",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  accessLevel: {
    fontSize: 12,
    color: colors.muted,
    textTransform: "capitalize",
  },
  nextAppointment: {
    fontSize: 12,
    color: colors.muted,
    fontStyle: "italic",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },
});

const action = StyleSheet.create({
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  btnPressed: {
    opacity: 0.7,
  },
  btnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
});
