/**
 * StaffTodayScreen.tsx — W27 Batch G screen G.1.
 *
 * Daily dashboard for a staff member (stylist / technician).
 * Sections:
 *  – Sticky header: "Today, {date}" greeting + availability toggle
 *  – KPI row: bookings count, revenue, next slot, avg rating
 *  – AI suggestion card (optional / conditional)
 *  – Appointment list: QueueCard rows for today's schedule
 *  – Walk-in queue strip: count + "View queue" shortcut
 *
 * States: default | light-day (encouragement) | no-day (off) | loading | error
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  AISuggestionCard,
  Banner,
  QueueCard,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import type {
  AISuggestion,
  StaffAppointment,
} from "./staffHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type StaffTodayScreenProps = {
  staffName: string;
  dateLabel: string;
  isAvailable: boolean;
  bookingsToday: number;
  revenueToday: string;
  nextSlotLabel: string;
  avgRating: string;
  appointments: StaffAppointment[];
  walkInQueueCount: number;
  aiSuggestion?: AISuggestion;
  isLightDay?: boolean;
  isOffDay?: boolean;
  nextShiftLabel?: string;
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  onToggleAvailability?: () => void;
  onPressViewQueue?: () => void;
  onPressAppointment?: (appointmentId: string) => void;
  onStartAppointment?: (appointmentId: string) => void;
  onNotifyClient?: (appointmentId: string) => void;
  onAIPrimaryAction?: () => void;
  onAISecondaryAction?: () => void;
  onAIDismiss?: () => void;
  onAIWhy?: () => void;
  testID?: string;
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export function StaffTodayScreen({
  staffName,
  dateLabel,
  isAvailable,
  bookingsToday,
  revenueToday,
  nextSlotLabel,
  avgRating,
  appointments,
  walkInQueueCount,
  aiSuggestion,
  isLightDay = false,
  isOffDay = false,
  nextShiftLabel,
  isLoading = false,
  isError = false,
  onPressRetry,
  onToggleAvailability,
  onPressViewQueue,
  onPressAppointment,
  onStartAppointment,
  onNotifyClient,
  onAIPrimaryAction,
  onAISecondaryAction,
  onAIDismiss,
  onAIWhy,
  testID,
}: StaffTodayScreenProps) {
  if (isLoading) {
    return (
      <View style={styles.root} testID={testID}>
        <SkeletonHeader />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <SkeletonKpiRow />
          {Array.from({ length: 4 }).map((_, i) => (
            <View key={i} style={[styles.shimmerBlock, styles.shimmerCard]} />
          ))}
        </ScrollView>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={[styles.root, styles.centered]} testID={testID}>
        <Text style={styles.errorTitle}>Couldn't load today's schedule</Text>
        <Text style={styles.errorBody}>Check your connection and try again.</Text>
        {onPressRetry && (
          <Pressable style={styles.retryBtn} onPress={onPressRetry} accessibilityRole="button">
            <Text style={styles.retryBtnText}>Retry</Text>
          </Pressable>
        )}
      </View>
    );
  }

  if (isOffDay) {
    return (
      <View style={[styles.root, styles.centered]} testID={testID}>
        <Text style={styles.emptyTitle}>You're off today ☀️</Text>
        {nextShiftLabel && (
          <Text style={styles.emptyBody}>Next shift: {nextShiftLabel}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testID}>
      {/* Sticky header */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerTextBlock}>
          <Text style={styles.greeting}>Good day, {staffName}</Text>
          <Text style={styles.dateLabel}>{dateLabel}</Text>
        </View>
        <Pressable
          style={[styles.availabilityToggle, isAvailable && styles.availabilityToggleOn]}
          onPress={onToggleAvailability}
          accessibilityRole="switch"
          accessibilityState={{ checked: isAvailable }}
          accessibilityLabel={isAvailable ? "Available — tap to mark unavailable" : "Unavailable — tap to mark available"}
        >
          <Text style={[styles.availabilityLabel, isAvailable && styles.availabilityLabelOn]}>
            {isAvailable ? "Available" : "Away"}
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Light day encouragement banner */}
        {isLightDay && (
          <Banner
            variant="info"
            message="Light day — great time to reach out to returning clients!"
          />
        )}

        {/* KPI row */}
        <View style={styles.kpiRow}>
          <KpiCard label="Bookings" value={String(bookingsToday)} />
          <KpiCard label="Revenue" value={revenueToday} />
          <KpiCard label="Next slot" value={nextSlotLabel} />
          <KpiCard label="Rating" value={avgRating} />
        </View>

        {/* AI suggestion */}
        {aiSuggestion && (
          <View style={styles.section}>
            <AISuggestionCard
              suggestion={aiSuggestion}
              onPrimaryAction={onAIPrimaryAction}
              onSecondaryAction={onAISecondaryAction}
              onDismiss={onAIDismiss}
              onWhy={onAIWhy}
            />
          </View>
        )}

        {/* Today's appointments */}
        <SectionHeader title="Today's schedule" />
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No appointments scheduled for today.</Text>
          </View>
        ) : (
          appointments.map((appt) => (
            <Pressable
              key={appt.id}
              onPress={() => onPressAppointment?.(appt.id)}
              style={styles.cardWrapper}
              accessibilityRole="button"
              accessibilityLabel={`Open appointment for ${appt.clientName}`}
            >
              <QueueCard
                position={appt.position ?? 0}
                clientName={appt.clientName}
                service={appt.service}
                status={appt.status}
                startedAt={appt.status === "in-service" ? appt.startTime : undefined}
                onStart={appt.status === "waiting" ? () => onStartAppointment?.(appt.id) : undefined}
                onNotify={() => onNotifyClient?.(appt.id)}
              />
            </Pressable>
          ))
        )}

        {/* Walk-in queue strip */}
        {walkInQueueCount > 0 && (
          <Pressable
            style={styles.queueStrip}
            onPress={onPressViewQueue}
            accessibilityRole="button"
            accessibilityLabel={`Walk-in queue: ${walkInQueueCount} waiting — view queue`}
          >
            <View style={styles.queueStripDot} />
            <Text style={styles.queueStripText}>
              {walkInQueueCount} walk-in{walkInQueueCount !== 1 ? "s" : ""} waiting
            </Text>
            <Text style={styles.queueStripCta}>View queue →</Text>
          </Pressable>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpiCard} accessibilityLabel={`${label}: ${value}`}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function SkeletonHeader() {
  return (
    <View style={styles.stickyHeader}>
      <View style={[styles.shimmerBlock, { width: 160, height: 36 }]} />
      <View style={[styles.shimmerBlock, { width: 88, height: 32, borderRadius: radius.full }]} />
    </View>
  );
}

function SkeletonKpiRow() {
  return (
    <View style={styles.kpiRow}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.kpiCard, styles.shimmerBlock]} />
      ))}
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
  headerTextBlock: {
    gap: 2,
  },
  greeting: {
    ...textStyles.heading3,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  dateLabel: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  availabilityToggle: {
    height: 32,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.full,
    backgroundColor: colors.disabledBg,
    justifyContent: "center",
    alignItems: "center",
  },
  availabilityToggleOn: {
    backgroundColor: "rgba(76,175,80,0.15)",
  },
  availabilityLabel: {
    ...textStyles.labelSmall,
    fontWeight: "600",
    color: colors.textMuted,
  },
  availabilityLabelOn: {
    color: "#2E7D32",
  },

  // KPI row
  kpiRow: {
    flexDirection: "row",
    gap: spacing.elementGapSmall,
    marginBottom: spacing.sectionGap,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  kpiValue: {
    ...textStyles.heading3,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  kpiLabel: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: "center",
  },

  // Section
  section: {
    marginBottom: spacing.elementGap,
  },
  sectionHeaderRow: {
    marginBottom: spacing.elementGapSmall,
  },
  sectionHeaderText: {
    ...textStyles.heading4,
    color: "#1A1A1A",
  },

  // Cards
  cardWrapper: {
    marginBottom: spacing.elementGapSmall,
  },

  // Walk-in strip
  queueStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.cardPadding,
    marginTop: spacing.s3,
    gap: spacing.elementGapSmall,
  },
  queueStripDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.warning,
  },
  queueStripText: {
    ...textStyles.body,
    color: "#1A1A1A",
    flex: 1,
  },
  queueStripCta: {
    ...textStyles.label,
    color: colors.primary,
  },

  // Empty / error states
  emptyState: {
    paddingVertical: spacing.sectionGap,
    alignItems: "center",
  },
  emptyStateText: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
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
  },
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
    height: 88,
    marginBottom: spacing.elementGapSmall,
  },

  bottomSpacer: {
    height: spacing.s8,
  },
});
