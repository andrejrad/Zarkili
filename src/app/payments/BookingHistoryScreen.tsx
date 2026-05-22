/**
 * BookingHistoryScreen.tsx — D.5 Booking History (List + Filters).
 *
 * Search bar + filter button + tabs (Upcoming / Past / Cancelled), list of
 * booking-card rows, pull-to-refresh + bottom pagination, empty / loading /
 * error states. Filters bottom sheet (FilterSheet) wired to caller state.
 *
 * Filtering logic delegated to `filterBookingHistory` (pure helper). This
 * screen is purely presentational: caller owns the records source.
 */

import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  Banner,
  Button,
  FilterSheet,
  SegmentedControl,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import { formatUsDate, formatTimeOfDay } from "../booking/bookingHelpers";

import {
  BOOKING_HISTORY_TAB_LABELS,
  BOOKING_HISTORY_TABS,
  countActiveBookingFilters,
  filterBookingHistory,
  type BookingHistoryFilters,
  type BookingHistoryRecord,
  type BookingHistoryStatus,
  type BookingHistoryTab,
} from "./receiptsHelpers";
import { formatUsd } from "./paymentsHelpers";

const STATUS_LABELS: Record<BookingHistoryStatus, string> = {
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  noShow: "No-show",
  pending: "Pending",
};

export type BookingHistoryScreenState = {
  tab: BookingHistoryTab;
  searchQuery: string;
  filters: BookingHistoryFilters;
  filterSheetOpen: boolean;
};

export type BookingHistoryScreenProps = {
  records: readonly BookingHistoryRecord[];
  state: BookingHistoryScreenState;
  onChange: (next: BookingHistoryScreenState) => void;
  loading?: boolean;
  refreshing?: boolean;
  errorMessage?: string;
  hasMore?: boolean;
  /** Reference time for upcoming/past partition. */
  now?: Date;
  onPressRecord: (id: string) => void;
  onPressLoadMore?: () => void;
  onPressFindSalon?: () => void;
  onRefresh?: () => void;
  onPressBack?: () => void;
  testID?: string;
};

export function BookingHistoryScreen({
  records,
  state,
  onChange,
  loading,
  refreshing,
  errorMessage,
  hasMore,
  now,
  onPressRecord,
  onPressLoadMore,
  onPressFindSalon,
  onRefresh,
  onPressBack,
  testID,
}: BookingHistoryScreenProps) {
  const filtered = filterBookingHistory(records, state.tab, state.filters, now);
  const matching = state.searchQuery
    ? filtered.filter((r) => {
        const q = state.searchQuery.toLowerCase();
        return (
          r.salonName.toLowerCase().includes(q) || r.serviceName.toLowerCase().includes(q)
        );
      })
    : filtered;

  const activeFilterCount = countActiveBookingFilters(state.filters);
  const isEmpty = !loading && matching.length === 0;

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        {onPressBack ? (
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={styles.backBtn}
            testID={testID ? `${testID}-back` : undefined}
          >
            <Text style={styles.backGlyph}>{"\u2190"}</Text>
          </Pressable>
        ) : null}
        <View style={styles.searchWrap}>
          <TextInput
            value={state.searchQuery}
            onChangeText={(v) => onChange({ ...state, searchQuery: v })}
            placeholder="Search bookings"
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            accessibilityLabel="Search bookings"
            testID={testID ? `${testID}-search` : undefined}
          />
        </View>
        <Pressable
          onPress={() => onChange({ ...state, filterSheetOpen: true })}
          accessibilityRole="button"
          accessibilityLabel={
            activeFilterCount > 0 ? `Filters (${activeFilterCount} active)` : "Filters"
          }
          style={styles.filterBtn}
          testID={testID ? `${testID}-filter-btn` : undefined}
        >
          <Text style={styles.filterGlyph}>{"\u2261"}</Text>
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedControl
          options={BOOKING_HISTORY_TABS.map((t) => ({
            value: t,
            label: BOOKING_HISTORY_TAB_LABELS[t],
          }))}
          value={state.tab}
          onChange={(v: BookingHistoryTab) => onChange({ ...state, tab: v })}
          testID={testID ? `${testID}-tabs` : undefined}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={undefined}
        onScrollEndDrag={() => onRefresh?.()}
      >
        {refreshing ? <Text style={styles.refreshing}>Refreshing…</Text> : null}

        {errorMessage ? (
          <Banner variant="error" message={errorMessage} testID={testID ? `${testID}-error` : undefined} />
        ) : null}

        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={styles.skeleton} testID={testID ? `${testID}-skeleton-${i}` : undefined} />
            ))
          : null}

        {isEmpty ? (
          <View style={styles.emptyState} testID={testID ? `${testID}-empty` : undefined}>
            <Text style={styles.emptyTitle}>{emptyTitle(state.tab)}</Text>
            {state.tab === "upcoming" && onPressFindSalon ? (
              <Button label="Find a salon" onPress={onPressFindSalon} variant="primary" testID={testID ? `${testID}-empty-cta` : undefined} />
            ) : null}
          </View>
        ) : null}

        {!loading && !isEmpty
          ? matching.map((r) => (
              <Pressable
                key={r.id}
                onPress={() => onPressRecord(r.id)}
                accessibilityRole="button"
                accessibilityLabel={`${r.salonName}, ${r.serviceName}, ${STATUS_LABELS[r.status]}`}
                style={styles.row}
                testID={testID ? `${testID}-row-${r.id}` : undefined}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.salon}>{r.salonName}</Text>
                  <Text style={styles.service}>{r.serviceName}</Text>
                  <Text style={styles.dateLine}>
                    {formatUsDate(new Date(r.startsAtIso))} ·{" "}
                    {formatTimeOfDay(
                      new Date(r.startsAtIso).getHours() * 60 +
                        new Date(r.startsAtIso).getMinutes(),
                    )}
                  </Text>
                </View>
                <View style={styles.rowSide}>
                  <View style={[styles.statusPill, statusToneFor(r.status)]}>
                    <Text style={styles.statusText}>{STATUS_LABELS[r.status]}</Text>
                  </View>
                  <Text style={styles.amount}>{formatUsd(r.totalUsd)}</Text>
                </View>
              </Pressable>
            ))
          : null}

        {hasMore && !loading && !isEmpty ? (
          <Pressable
            onPress={onPressLoadMore}
            accessibilityRole="button"
            accessibilityLabel="Load more"
            style={styles.loadMore}
            testID={testID ? `${testID}-load-more` : undefined}
          >
            <Text style={styles.loadMoreText}>Load more</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <FilterSheet
        visible={state.filterSheetOpen}
        onClose={() => onChange({ ...state, filterSheetOpen: false })}
        onReset={() => onChange({ ...state, filters: {}, filterSheetOpen: false })}
        onApply={() => onChange({ ...state, filterSheetOpen: false })}
        title="Filter bookings"
        applyLabel="Apply"
        testID={testID ? `${testID}-filter-sheet` : undefined}
      >
        <Text style={styles.filterPlaceholder}>
          Salon, date range, status, and price range filters wired by the caller.
        </Text>
      </FilterSheet>
    </View>
  );
}

function emptyTitle(tab: BookingHistoryTab): string {
  if (tab === "upcoming") return "No upcoming bookings";
  if (tab === "past") return "No past bookings yet";
  return "No cancelled bookings";
}

function statusToneFor(s: BookingHistoryStatus) {
  if (s === "confirmed" || s === "completed") return styles.statusPositive;
  if (s === "cancelled" || s === "noShow") return styles.statusNegative;
  return styles.statusNeutral;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.s2,
  },
  backBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backGlyph: { fontSize: 22, lineHeight: 24, color: colors.foreground },
  searchWrap: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s3,
    justifyContent: "center",
  },
  searchInput: { fontSize: 14, lineHeight: 20, color: colors.foreground },
  filterBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  filterGlyph: { fontSize: 20, color: colors.foreground },
  filterBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { fontSize: 10, lineHeight: 14, fontWeight: "700", color: colors.white },
  tabsWrap: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s2,
    paddingBottom: spacing.s2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  body: { padding: spacing.pageHorizontal, gap: spacing.s2 },
  refreshing: { textAlign: "center", color: colors.textMuted, fontSize: 12 },
  skeleton: { height: 88, borderRadius: radius.md, backgroundColor: colors.disabledBg },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s5,
    alignItems: "center",
    gap: spacing.s3,
  },
  emptyTitle: { fontSize: 16, lineHeight: 24, fontWeight: "600", color: colors.foreground },
  row: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    gap: spacing.s3,
    minHeight: 88,
  },
  rowMain: { flex: 1, gap: 4 },
  rowSide: { alignItems: "flex-end", gap: spacing.s2 },
  salon: { fontSize: 16, lineHeight: 24, fontWeight: "600", color: colors.foreground },
  service: { fontSize: 14, lineHeight: 20, color: colors.foreground },
  dateLine: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  amount: { fontSize: 14, lineHeight: 20, fontWeight: "600", color: colors.foreground },
  statusPill: {
    paddingHorizontal: spacing.s2,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  statusPositive: { backgroundColor: colors.mintFresh },
  statusNegative: { backgroundColor: colors.disabledBg },
  statusNeutral: { backgroundColor: colors.background },
  statusText: { fontSize: 10, lineHeight: 14, fontWeight: "600", color: colors.foreground, letterSpacing: 0.5 },
  loadMore: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.s3,
  },
  loadMoreText: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.primary },
  filterPlaceholder: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
});
