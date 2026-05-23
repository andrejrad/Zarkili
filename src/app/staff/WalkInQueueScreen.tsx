/**
 * WalkInQueueScreen.tsx — W27 Batch G screen G.3.
 *
 * Real-time walk-in queue management for staff.
 * Sections:
 *  – Sticky header: "Walk-in Queue" title + queue count badge + "Add walk-in" FAB
 *  – Sort/filter bar (not implemented in W27 — placeholder)
 *  – Queue list: QueueCard rows with Start / Notify / Remove actions
 *  – Empty state when queue is empty
 *
 * States: default | loading | error | empty
 * Drag-to-reorder: W28 polish (dragging prop passed through, no PanResponder yet).
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { QueueCard, colors, radius, spacing, textStyles } from "../../shared/ui";

import type { StaffAppointment } from "./staffHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type WalkInQueueScreenProps = {
  queue: StaffAppointment[];
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  onPressAddWalkIn?: () => void;
  onStartEntry?: (id: string) => void;
  onNotifyClient?: (id: string) => void;
  onRemoveEntry?: (id: string) => void;
  onPressEntry?: (id: string) => void;
  testID?: string;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function WalkInQueueScreen({
  queue,
  isLoading = false,
  isError = false,
  onPressRetry,
  onPressAddWalkIn,
  onStartEntry,
  onNotifyClient,
  onRemoveEntry,
  onPressEntry,
  testID,
}: WalkInQueueScreenProps) {
  const waitingCount = queue.filter((e) => e.status === "waiting").length;

  if (isLoading) {
    return (
      <View style={styles.root} testID={testID}>
        <StickyHeader count={0} onPressAdd={undefined} />
        <View style={styles.scrollContent}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={[styles.shimmerBlock, styles.shimmerCard]} />
          ))}
        </View>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.root, styles.centered]} testID={testID}>
        <Text style={styles.errorTitle}>{"Couldn't load the queue"}</Text>
        <Text style={styles.errorBody}>Check your connection and try again.</Text>
        {onPressRetry && (
          <Pressable style={styles.retryBtn} onPress={onPressRetry} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testID}>
      <StickyHeader count={waitingCount} onPressAdd={onPressAddWalkIn} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {queue.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🕐</Text>
            <Text style={styles.emptyTitle}>No one in the queue</Text>
            <Text style={styles.emptyBody}>Walk-ins will appear here when they check in.</Text>
            {onPressAddWalkIn && (
              <Pressable style={styles.retryBtn} onPress={onPressAddWalkIn} accessibilityRole="button">
                <Text style={styles.retryBtnText}>Add walk-in</Text>
              </Pressable>
            )}
          </View>
        ) : (
          queue.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => onPressEntry?.(entry.id)}
              style={styles.cardWrapper}
              accessibilityRole="button"
              accessibilityLabel={`Open queue entry for ${entry.clientName}`}
            >
              <QueueCard
                position={entry.position ?? 0}
                clientName={entry.clientName}
                service={entry.service}
                status={entry.status}
                startedAt={entry.status === "in-service" ? entry.startTime : undefined}
                onStart={entry.status === "waiting" ? () => onStartEntry?.(entry.id) : undefined}
                onNotify={() => onNotifyClient?.(entry.id)}
                onRemove={() => onRemoveEntry?.(entry.id)}
              />
            </Pressable>
          ))
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StickyHeader({
  count,
  onPressAdd,
}: {
  count: number;
  onPressAdd?: () => void;
}) {
  return (
    <View style={styles.stickyHeader}>
      <View style={styles.headerLeft}>
        <Text style={styles.headerTitle}>Walk-in Queue</Text>
        {count > 0 && (
          <View style={styles.countBadge} accessibilityElementsHidden>
            <Text style={styles.countBadgeText}>{count}</Text>
          </View>
        )}
      </View>
      {onPressAdd && (
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
          onPress={onPressAdd}
          accessibilityRole="button"
          accessibilityLabel="Add walk-in client"
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
  },
  scrollContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s4,
  },

  // Sticky header
  stickyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.cardPadding,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.elementGapSmall,
  },
  headerTitle: {
    ...textStyles.heading3,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  countBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  countBadgeText: {
    ...textStyles.labelSmall,
    fontWeight: "600",
    color: colors.white,
    textAlign: "center",
  },
  addBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addBtnPressed: {
    opacity: 0.85,
  },
  addBtnText: {
    ...textStyles.label,
    fontWeight: "600",
    color: colors.white,
  },

  // Cards
  cardWrapper: {
    marginBottom: spacing.elementGapSmall,
  },

  // Empty state
  emptyState: {
    paddingTop: spacing.s10,
    alignItems: "center",
    paddingHorizontal: spacing.pageHorizontal,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: spacing.s3,
  },
  emptyTitle: {
    ...textStyles.heading3,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: spacing.elementGapSmall,
  },
  emptyBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sectionGap,
  },

  // Error state
  errorTitle: {
    ...textStyles.heading3,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: spacing.elementGapSmall,
  },
  errorBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.sectionGap,
  },
  retryBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  retryBtnText: {
    ...textStyles.label,
    fontWeight: "600",
    color: colors.white,
  },

  // Shimmer
  shimmerBlock: {
    backgroundColor: "#EDE8D8",
    borderRadius: radius.md,
  },
  shimmerCard: {
    height: 100,
    marginBottom: spacing.elementGapSmall,
  },

  bottomSpacer: {
    height: spacing.s8,
  },
});
