/**
 * AdminActivityScreen.tsx
 *
 * Admin-facing activity/challenge management views:
 *   ActivityListScreen   — list all challenges with status badges + activate/deactivate actions
 *   CreateActivityScreen — form to create a new draft challenge
 */

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { Activity, ActivityType, ActivityRewardType } from "../../domains/activities/model";

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
  inactive: "#9E9E9E",
  draft: "#2196F3",
};

const statusColor: Record<Activity["status"], string> = {
  draft:    colors.draft,
  active:   colors.success,
  inactive: colors.inactive,
  expired:  colors.muted,
};

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, disabled ? styles.buttonDisabled : null]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonLabel}>{label}</Text>
    </Pressable>
  );
}

function StatusBadge({ status }: { status: Activity["status"] }) {
  return (
    <View style={[styles.badge, { backgroundColor: statusColor[status] }]}>
      <Text style={styles.badgeText}>{status.toUpperCase()}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// ActivityListScreen
// ---------------------------------------------------------------------------

export type ActivityListScreenProps = {
  activities: Activity[];
  isLoading: boolean;
  errorMessage: string | null;
  actionError: string | null;
  activatingId: string | null;
  deactivatingId: string | null;
  onActivate: (activityId: string) => void;
  onDeactivate: (activityId: string) => void;
  onCreateNew: () => void;
  onRetry: () => void;
};

function ActivityCard({
  activity,
  isActivating,
  isDeactivating,
  onActivate,
  onDeactivate,
}: {
  activity: Activity;
  isActivating: boolean;
  isDeactivating: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const canActivate   = activity.status === "draft" || activity.status === "inactive";
  const canDeactivate = activity.status === "active";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{activity.name}</Text>
        <StatusBadge status={activity.status} />
      </View>

      <Text style={styles.meta}>Type: {activity.type.replace("_", " ")}</Text>
      <Text style={styles.meta}>
        {activity.startDate} → {activity.endDate}
      </Text>
      <Text style={styles.meta}>
        Goal: {activity.rule.targetValue} {activity.rule.type.replace("_", " ")}
        {activity.rule.windowDays ? ` within ${activity.rule.windowDays} days` : ""}
      </Text>
      <Text style={styles.meta}>
        Reward: {activity.reward.description} ({activity.reward.value}
        {activity.reward.type === "discount_percent" ? "%" : ""})
      </Text>

      <View style={styles.cardActions}>
        {canActivate ? (
          <PrimaryButton
            label={isActivating ? "Activating…" : "Activate"}
            onPress={onActivate}
            disabled={isActivating}
          />
        ) : null}
        {canDeactivate ? (
          <SecondaryButton
            label={isDeactivating ? "Deactivating…" : "Deactivate"}
            onPress={onDeactivate}
          />
        ) : null}
      </View>
    </View>
  );
}

export function ActivityListScreen({
  activities,
  isLoading,
  errorMessage,
  actionError,
  activatingId,
  deactivatingId,
  onActivate,
  onDeactivate,
  onCreateNew,
  onRetry,
}: ActivityListScreenProps) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Activities & Challenges</Text>
        <PrimaryButton label="+ New challenge" onPress={onCreateNew} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.muted}>Loading challenges…</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <SecondaryButton label="Retry" onPress={onRetry} />
        </View>
      ) : null}

      {actionError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{actionError}</Text>
        </View>
      ) : null}

      {!isLoading && !errorMessage && activities.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyHeading}>No challenges yet</Text>
          <Text style={styles.muted}>Create your first customer challenge to drive engagement.</Text>
        </View>
      ) : null}

      {!isLoading && !errorMessage && activities.length > 0 ? (
        <FlatList
          data={activities}
          keyExtractor={(a) => a.activityId}
          renderItem={({ item }) => (
            <ActivityCard
              activity={item}
              isActivating={activatingId === item.activityId}
              isDeactivating={deactivatingId === item.activityId}
              onActivate={() => onActivate(item.activityId)}
              onDeactivate={() => onDeactivate(item.activityId)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// CreateActivityScreen
// ---------------------------------------------------------------------------

export type CreateActivityScreenProps = {
  // form state
  name: string;
  type: ActivityType;
  startDate: string;
  endDate: string;
  targetValue: string;
  windowDays: string;
  rewardType: ActivityRewardType;
  rewardValue: string;
  rewardDescription: string;
  // callbacks
  onNameChange: (v: string) => void;
  onTypeChange: (v: ActivityType) => void;
  onStartDateChange: (v: string) => void;
  onEndDateChange: (v: string) => void;
  onTargetValueChange: (v: string) => void;
  onWindowDaysChange: (v: string) => void;
  onRewardTypeChange: (v: ActivityRewardType) => void;
  onRewardValueChange: (v: string) => void;
  onRewardDescriptionChange: (v: string) => void;
  // submission
  onSubmit: () => void;
  submitting: boolean;
  formError: string | null;
  successMessage: string | null;
  onBack: () => void;
};

const ACTIVITY_TYPES: ActivityType[] = ["visit_streak", "spend_goal", "referral", "custom"];
const REWARD_TYPES: ActivityRewardType[] = ["discount_percent", "discount_fixed", "free_service", "points"];

function TypeSelector<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: T[];
  selected: T;
  onSelect: (v: T) => void;
}) {
  return (
    <View style={styles.selectorGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.selectorRow}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            accessibilityRole="button"
            onPress={() => onSelect(opt)}
            style={[styles.selectorChip, selected === opt ? styles.selectorChipSelected : null]}
          >
            <Text
              style={[
                styles.selectorChipText,
                selected === opt ? styles.selectorChipTextSelected : null,
              ]}
            >
              {opt.replace(/_/g, " ")}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export function CreateActivityScreen(props: CreateActivityScreenProps) {
  return (
    <ScrollView contentContainerStyle={styles.rootContent}>
      <Text style={styles.title}>New Challenge</Text>
      <Text style={styles.subtitle}>Create a draft challenge. Activate it when ready to go live.</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Details</Text>

        <Text style={styles.inputLabel}>Challenge name</Text>
        <TextInput
          placeholder="Visit 3 times this month"
          style={styles.input}
          value={props.name}
          onChangeText={props.onNameChange}
          accessibilityLabel="Challenge name"
        />

        <TypeSelector
          label="Type"
          options={ACTIVITY_TYPES}
          selected={props.type}
          onSelect={props.onTypeChange}
        />

        <Text style={styles.inputLabel}>Start date (YYYY-MM-DD)</Text>
        <TextInput
          placeholder="2026-05-01"
          style={styles.input}
          value={props.startDate}
          onChangeText={props.onStartDateChange}
          accessibilityLabel="Start date"
        />

        <Text style={styles.inputLabel}>End date (YYYY-MM-DD)</Text>
        <TextInput
          placeholder="2026-07-31"
          style={styles.input}
          value={props.endDate}
          onChangeText={props.onEndDateChange}
          accessibilityLabel="End date"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Goal</Text>

        <Text style={styles.inputLabel}>Target value</Text>
        <TextInput
          placeholder="3"
          keyboardType="number-pad"
          style={styles.input}
          value={props.targetValue}
          onChangeText={props.onTargetValueChange}
          accessibilityLabel="Target value"
        />

        <Text style={styles.inputLabel}>Window (days, optional)</Text>
        <TextInput
          placeholder="30"
          keyboardType="number-pad"
          style={styles.input}
          value={props.windowDays}
          onChangeText={props.onWindowDaysChange}
          accessibilityLabel="Window days"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Reward</Text>

        <TypeSelector
          label="Reward type"
          options={REWARD_TYPES}
          selected={props.rewardType}
          onSelect={props.onRewardTypeChange}
        />

        <Text style={styles.inputLabel}>Value</Text>
        <TextInput
          placeholder="15"
          keyboardType="number-pad"
          style={styles.input}
          value={props.rewardValue}
          onChangeText={props.onRewardValueChange}
          accessibilityLabel="Reward value"
        />

        <Text style={styles.inputLabel}>Description (shown to customer)</Text>
        <TextInput
          placeholder="15% off your next visit"
          style={styles.input}
          value={props.rewardDescription}
          onChangeText={props.onRewardDescriptionChange}
          accessibilityLabel="Reward description"
        />
      </View>

      {props.formError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{props.formError}</Text>
        </View>
      ) : null}

      {props.successMessage ? (
        <View style={styles.successBox}>
          <Text style={styles.successText}>{props.successMessage}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label={props.submitting ? "Creating…" : "Create challenge"}
        onPress={props.onSubmit}
        disabled={props.submitting}
      />
      <SecondaryButton label="Back" onPress={props.onBack} />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  rootContent: {
    padding: 16,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  meta: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 2,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  selectorGroup: {
    marginTop: 10,
  },
  selectorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  selectorChip: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.background,
  },
  selectorChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectorChipText: {
    fontSize: 12,
    color: colors.muted,
  },
  selectorChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 11,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 8,
  },
  secondaryButtonLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  muted: {
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
    marginTop: 6,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyHeading: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 6,
  },
  errorBox: {
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    color: colors.error,
    fontSize: 13,
  },
  successBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  successText: {
    color: colors.success,
    fontSize: 13,
  },
});
