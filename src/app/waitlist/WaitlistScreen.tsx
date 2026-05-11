/**
 * WaitlistScreen.tsx — W37-DEBT-1 consumer waitlist list view.
 *
 * Shows the user's active waitlist entries. Each entry has a service name,
 * date-range preference, position in queue (if known), and a Leave button.
 *
 * Purely props-driven. Data loading lives in AppNavigatorShell.
 */

import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, colors, radius, spacing } from "../../shared/ui";

export type WaitlistEntry = {
  entryId: string;
  serviceName: string;
  dateFrom: string;
  dateTo: string;
  /** Position in queue — null if not yet calculated */
  positionNumber: number | null;
  estimatedWait?: string;
  salonName: string;
};

export type WaitlistScreenProps = {
  entries: WaitlistEntry[];
  isLoading: boolean;
  errorMessage?: string | null;
  onJoinWaitlist: () => void;
  onViewPosition: (entryId: string) => void;
  onLeave: (entryId: string) => void;
  onBack: () => void;
  testID?: string;
};

export function WaitlistScreen({
  entries,
  isLoading,
  errorMessage,
  onJoinWaitlist,
  onViewPosition,
  onLeave,
  onBack,
  testID,
}: WaitlistScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID ?? "waitlist-screen"}
    >
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          testID="waitlist-back"
        >
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.heading} accessibilityRole="header">
          My Waitlists
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : errorMessage ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{errorMessage}</Text>
        </View>
      ) : entries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No active waitlists</Text>
          <Text style={styles.emptyText}>
            If a service you want is fully booked, join the waitlist and we'll notify you when a slot opens up.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => (
            <Pressable
              key={entry.entryId}
              onPress={() => onViewPosition(entry.entryId)}
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={`Waitlist for ${entry.serviceName}`}
              testID={`waitlist-entry-${entry.entryId}`}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.serviceName}>{entry.serviceName}</Text>
                {entry.positionNumber != null ? (
                  <View style={styles.positionBadge}>
                    <Text style={styles.positionText}>#{entry.positionNumber}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.salonName}>{entry.salonName}</Text>

              <Text style={styles.dateRange}>
                {entry.dateFrom} – {entry.dateTo}
              </Text>

              {entry.estimatedWait ? (
                <Text style={styles.waitLabel}>Est. wait: {entry.estimatedWait}</Text>
              ) : null}

              <Button
                variant="secondary"
                size="small"
                label="Leave waitlist"
                onPress={() => onLeave(entry.entryId)}
                testID={`waitlist-leave-${entry.entryId}`}
              />
            </Pressable>
          ))}
        </View>
      )}

      <Button
        label="Join a waitlist"
        onPress={onJoinWaitlist}
        testID="waitlist-join-cta"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.s6, gap: spacing.s4, paddingBottom: spacing.s8 },
  header: { gap: spacing.s2 },
  backButton: { alignSelf: "flex-start", paddingVertical: spacing.s2 },
  backText: { color: colors.primary, fontSize: 15 },
  heading: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  loader: { marginTop: spacing.s8 },
  emptyState: { gap: spacing.s3, paddingVertical: spacing.s8, alignItems: "center" },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20 },
  list: { gap: spacing.s4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.s4,
    gap: spacing.s3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  serviceName: { fontSize: 16, fontWeight: "700", color: colors.foreground, flex: 1 },
  positionBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.s3,
    paddingVertical: 2,
  },
  positionText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  salonName: { fontSize: 13, color: colors.textMuted },
  dateRange: { fontSize: 13, color: colors.foreground },
  waitLabel: { fontSize: 13, color: colors.textMuted, fontStyle: "italic" },
});
