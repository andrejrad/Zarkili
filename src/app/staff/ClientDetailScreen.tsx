/**
 * ClientDetailScreen.tsx — W27 Batch G screen G.4.2.
 *
 * Full client profile page for staff. Built around the ClientHeader component
 * plus tab-based content (Upcoming / History / Notes / Preferences).
 *
 * States: default | loading (ClientHeader shimmer + shimmer tabs) | error
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ClientHeader,
  SegmentedControl,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";

import type { ClientDetail, StaffAppointment } from "./staffHelpers";
import { formatLtv } from "./staffHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ClientDetailTab = "upcoming" | "history" | "notes" | "preferences";

export type ClientDetailScreenProps = {
  client: ClientDetail | null;
  activeTab: ClientDetailTab;
  upcomingAppointments: StaffAppointment[];
  pastAppointments: StaffAppointment[];
  isLoading?: boolean;
  isError?: boolean;
  onPressRetry?: () => void;
  onChangeTab: (tab: ClientDetailTab) => void;
  onPressOpenNotes?: () => void;
  onPressBookAppointment?: () => void;
  onPressAppointment?: (appointmentId: string) => void;
  testID?: string;
};

const TAB_OPTIONS: { value: ClientDetailTab; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "history", label: "History" },
  { value: "notes", label: "Notes" },
  { value: "preferences", label: "Prefs" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export function ClientDetailScreen({
  client,
  activeTab,
  upcomingAppointments,
  pastAppointments,
  isLoading = false,
  isError = false,
  onPressRetry,
  onChangeTab,
  onPressOpenNotes,
  onPressBookAppointment,
  onPressAppointment,
  testID,
}: ClientDetailScreenProps) {
  if (isError) {
    return (
      <View style={[styles.root, styles.centered]} testID={testID}>
        <Text style={styles.errorTitle}>Couldn't load client profile</Text>
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
      {/* ClientHeader — handles its own loading shimmer */}
      <ClientHeader
        clientName={client?.name ?? ""}
        initials={client?.initials ?? ""}
        tier={client?.tier ?? "locked"}
        isVIP={client?.isVIP ?? false}
        phone={client?.phone ?? null}
        email={client?.email ?? null}
        since={client?.since ?? "—"}
        visits={client?.totalVisits ?? 0}
        lifetimeValue={client ? formatLtv(client.lifetimeValueCents / 100) : "—"}
        lastVisit={client?.lastVisit ?? null}
        noShows={client?.noShows ?? 0}
        loading={isLoading}
      />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        <SegmentedControl
          options={TAB_OPTIONS}
          value={activeTab}
          onChange={onChangeTab}
        />
      </View>

      {/* Tab content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.shimmerContent}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={[styles.shimmerBlock, styles.shimmerRow]} />
            ))}
          </View>
        ) : activeTab === "upcoming" ? (
          <UpcomingTab
            appointments={upcomingAppointments}
            onPressAppointment={onPressAppointment}
            onPressBook={onPressBookAppointment}
          />
        ) : activeTab === "history" ? (
          <HistoryTab
            appointments={pastAppointments}
            onPressAppointment={onPressAppointment}
          />
        ) : activeTab === "notes" ? (
          <NotesTab onPressViewAll={onPressOpenNotes} />
        ) : (
          <PreferencesTab client={client} />
        )}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// ─── Tab sub-components ───────────────────────────────────────────────────────

function UpcomingTab({
  appointments,
  onPressAppointment,
  onPressBook,
}: {
  appointments: StaffAppointment[];
  onPressAppointment?: (id: string) => void;
  onPressBook?: () => void;
}) {
  return (
    <>
      {appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No upcoming appointments</Text>
          {onPressBook && (
            <Pressable style={styles.bookBtn} onPress={onPressBook} accessibilityRole="button">
              <Text style={styles.bookBtnText}>Book appointment</Text>
            </Pressable>
          )}
        </View>
      ) : (
        appointments.map((appt) => (
          <AppointmentRow
            key={appt.id}
            appointment={appt}
            onPress={() => onPressAppointment?.(appt.id)}
          />
        ))
      )}
    </>
  );
}

function HistoryTab({
  appointments,
  onPressAppointment,
}: {
  appointments: StaffAppointment[];
  onPressAppointment?: (id: string) => void;
}) {
  return (
    <>
      {appointments.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No visit history yet</Text>
        </View>
      ) : (
        appointments.map((appt) => (
          <AppointmentRow
            key={appt.id}
            appointment={appt}
            onPress={() => onPressAppointment?.(appt.id)}
          />
        ))
      )}
    </>
  );
}

function NotesTab({ onPressViewAll }: { onPressViewAll?: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyBody}>Notes and service history live in the Notes tab.</Text>
      {onPressViewAll && (
        <Pressable onPress={onPressViewAll} accessibilityRole="button">
          <Text style={styles.linkText}>View all notes →</Text>
        </Pressable>
      )}
    </View>
  );
}

function PreferencesTab({ client }: { client: ClientDetail | null }) {
  if (!client) return null;
  return (
    <View style={styles.preferencesSection}>
      <PreferenceGroup
        label="Preferred services"
        items={client.preferredServices}
      />
      <PreferenceGroup
        label="Preferred stylists"
        items={client.preferredStylists}
      />
      {client.allergies && (
        <View style={styles.allergyBlock}>
          <Text style={styles.prefGroupLabel}>Allergies / sensitivities</Text>
          <Text style={styles.allergyText}>{client.allergies}</Text>
        </View>
      )}
    </View>
  );
}

function PreferenceGroup({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <View style={styles.prefGroup}>
      <Text style={styles.prefGroupLabel}>{label}</Text>
      {items.length === 0 ? (
        <Text style={styles.prefEmpty}>None recorded</Text>
      ) : (
        <View style={styles.chipRow}>
          {items.map((item) => (
            <View key={item} style={styles.chip}>
              <Text style={styles.chipText}>{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function AppointmentRow({
  appointment,
  onPress,
}: {
  appointment: StaffAppointment;
  onPress?: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.apptRow, pressed && styles.apptRowPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${appointment.service} on ${appointment.startTime}`}
    >
      <View style={styles.apptInfo}>
        <Text style={styles.apptService}>{appointment.service}</Text>
        <Text style={styles.apptMeta}>{appointment.startTime}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
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

  // Tab bar
  tabBar: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s2,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  // Scroll content
  scrollContent: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s4,
  },
  shimmerContent: {
    gap: spacing.elementGapSmall,
  },

  // Appointment row
  apptRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: spacing.s3,
    marginBottom: spacing.elementGapSmall,
  },
  apptRowPressed: {
    backgroundColor: colors.hover,
  },
  apptInfo: {
    flex: 1,
    gap: 2,
  },
  apptService: {
    ...textStyles.body,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  apptMeta: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 18,
    color: colors.textMuted,
  },

  // Empty states
  emptyState: {
    paddingTop: spacing.s8,
    alignItems: "center",
  },
  emptyTitle: {
    ...textStyles.heading3,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: spacing.s3,
  },
  emptyBody: {
    ...textStyles.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  linkText: {
    ...textStyles.label,
    color: colors.primary,
    marginTop: spacing.s3,
  },

  // Preferences
  preferencesSection: {
    gap: spacing.sectionGap,
  },
  prefGroup: {
    gap: spacing.s2,
  },
  prefGroupLabel: {
    ...textStyles.label,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  prefEmpty: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.elementGapSmall,
  },
  chip: {
    height: 28,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.full,
    backgroundColor: colors.primary10,
    justifyContent: "center",
    alignItems: "center",
  },
  chipText: {
    ...textStyles.labelSmall,
    color: colors.primary,
  },
  allergyBlock: {
    gap: spacing.s2,
  },
  allergyText: {
    ...textStyles.body,
    color: "#1A1A1A",
    backgroundColor: "rgba(255,152,0,0.06)",
    padding: spacing.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,152,0,0.20)",
  },

  // Action buttons
  bookBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.s6,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  bookBtnText: {
    ...textStyles.label,
    fontWeight: "600",
    color: colors.white,
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

  // Shimmer
  shimmerBlock: {
    backgroundColor: "#EDE8D8",
    borderRadius: radius.md,
  },
  shimmerRow: {
    height: 64,
    marginBottom: spacing.elementGapSmall,
  },

  bottomSpacer: {
    height: spacing.s8,
  },
});
