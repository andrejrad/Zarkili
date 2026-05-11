/**
 * ActivitiesScreen.tsx — E.4 Activities List.
 *
 * Segmented tabs: Active | Completed | All. Cards with icon, title, progress bar,
 * reward chip. Section header "New this month". States: default | loading | empty | error.
 */

import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Banner, SegmentedControl, colors, radius, spacing, textStyles } from "../../shared/ui";
import {
  ACTIVITY_TAB_LABELS,
  computeActivityProgressLabel,
  filterActivitiesByTab,
  type Activity,
  type ActivityTab,
} from "../loyalty/loyaltyHelpers";

export type ActivitiesScreenProps = {
  activities: readonly Activity[];
  activeTab: ActivityTab;
  loading?: boolean;
  error?: string;
  onTabChange: (tab: ActivityTab) => void;
  onActivityPress: (activity: Activity) => void;
  onRetry?: () => void;
  testID?: string;
};

const TABS: ActivityTab[] = ["active", "completed", "all"];

export function ActivitiesScreen({
  activities,
  activeTab,
  loading,
  error,
  onTabChange,
  onActivityPress,
  onRetry,
  testID,
}: ActivitiesScreenProps) {
  const visible = filterActivitiesByTab(activities, activeTab);
  const newThisMonth = visible.filter((a) => a.isNew);
  const rest = visible.filter((a) => !a.isNew);

  const sections: Array<{ title: string | null; data: readonly Activity[] }> = [];
  if (newThisMonth.length > 0) sections.push({ title: "New this month", data: newThisMonth });
  if (rest.length > 0) sections.push({ title: null, data: rest });
  const flatData: Array<string | Activity> = sections.flatMap((s) =>
    s.title ? [s.title, ...s.data] : [...s.data]
  );

  return (
    <View style={styles.root} testID={testID}>
      {/* Segmented tabs */}
      <View style={styles.tabs}>
        <SegmentedControl
          options={TABS.map((t) => ({ label: ACTIVITY_TAB_LABELS[t], value: t }))}
          value={activeTab}
          onChange={(v) => onTabChange(v as ActivityTab)}
          testID={testID ? `${testID}-tabs` : undefined}
        />
      </View>

      {error ? (
        <View style={styles.centeredFill}>
          <Text style={styles.errorGlyph}>⚠</Text>
          <Text style={styles.bodyMuted}>{error}</Text>
          {onRetry ? (
            <Pressable onPress={onRetry} style={styles.retryBtn} accessibilityRole="button" accessibilityLabel="Retry">
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : loading ? (
        <View style={styles.list} accessible={false}>
          {Array.from({ length: 4 }).map((_, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.centeredFill}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.bodyMuted}>
            {activeTab === "active"
              ? "No active challenges right now"
              : activeTab === "completed"
              ? "You haven't completed any challenges yet"
              : "No activities available"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={flatData}
          keyExtractor={(item, i) => (typeof item === "string" ? `section-${i}` : item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) =>
            typeof item === "string" ? (
              <Text style={styles.sectionHeader}>{item}</Text>
            ) : (
              <ActivityCard
                activity={item}
                onPress={() => onActivityPress(item)}
                testID={testID ? `${testID}-activity-${item.id}` : undefined}
              />
            )
          }
        />
      )}
    </View>
  );
}

/* ---------- ActivityCard sub-component ---------- */

type ActivityCardProps = {
  activity: Activity;
  onPress: () => void;
  testID?: string;
};

function ActivityCard({ activity, onPress, testID }: ActivityCardProps) {
  const { title, icon, status, currentSteps, totalSteps, pointsReward } = activity;
  const isExpired = status === "expired";
  const isCompleted = status === "completed";
  const progress = totalSteps > 0 ? Math.min(1, currentSteps / totalSteps) : 0;
  const progressLabel = computeActivityProgressLabel(activity);

  return (
    <Pressable
      onPress={isExpired ? undefined : onPress}
      disabled={isExpired}
      style={[styles.card, isExpired ? styles.cardExpired : null]}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${progressLabel}`}
      accessibilityState={{ disabled: isExpired }}
      testID={testID}
    >
      {/* Expired banner inside card */}
      {isExpired && (
        <Banner variant="warning" message="This challenge has expired" />
      )}

      <View style={styles.cardInner}>
        {/* Icon */}
        <View style={styles.iconBox} accessible={false}>
          <Text style={styles.iconText}>{icon ?? "⭐"}</Text>
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{title}</Text>

          {/* Progress bar */}
          {!isCompleted && totalSteps > 1 ? (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
          ) : null}

          <Text style={styles.progressLabel}>{progressLabel}</Text>
        </View>

        {/* Reward chip */}
        <View
          style={[styles.rewardChip, isCompleted ? styles.rewardChipCompleted : null]}
          accessible
          accessibilityLabel={`${pointsReward} points reward`}
        >
          <Text
            style={[
              styles.rewardChipText,
              isCompleted ? styles.rewardChipTextCompleted : null,
            ]}
          >
            +{pointsReward} pts
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  tabs: { paddingHorizontal: spacing.s4, paddingVertical: spacing.s3 },
  list: { padding: spacing.s4, gap: spacing.s3, paddingBottom: 32 },
  sectionHeader: { ...textStyles.labelSmall, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: spacing.s1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardExpired: { opacity: 0.6 },
  cardInner: { flexDirection: "row", alignItems: "center", padding: spacing.s4, gap: spacing.s3 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.disabledBg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  iconText: { fontSize: 24 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { ...textStyles.heading4, color: colors.foreground },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  progressLabel: { ...textStyles.bodySmall, color: colors.textMuted },
  rewardChip: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
    flexShrink: 0,
  },
  rewardChipCompleted: { backgroundColor: colors.accent, borderColor: colors.accent },
  rewardChipText: { ...textStyles.labelSmall, color: colors.primary },
  rewardChipTextCompleted: { color: colors.accentForeground },
  skeletonCard: { height: 96, borderRadius: radius.lg, backgroundColor: colors.disabledBg },
  centeredFill: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.s3, padding: spacing.s8 },
  errorGlyph: { fontSize: 40, color: colors.error },
  emptyIcon: { fontSize: 48 },
  bodyMuted: { ...textStyles.body, color: colors.textMuted, textAlign: "center" },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.s6, paddingVertical: spacing.s2 },
  retryText: { ...textStyles.label, color: colors.white },
});
