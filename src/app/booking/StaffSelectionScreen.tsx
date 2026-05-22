/**
 * StaffSelectionScreen.tsx — C.2 Staff Selection (Booking step 2/5).
 *
 * "Any available" anchor card on top, then list of named staff cards. Tapping
 * a card surfaces preview slots inline. Caller owns selection + slot fetch.
 */

import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  RatingStars,
  StickyFooterCta,
  TimeSlotChip,
  colors,
  radius,
  spacing,
} from "../../shared/ui";

import type { BookingStaffOption } from "./bookingHelpers";

export const ANY_STAFF_ID = "any" as const;

export type StaffSelectionScreenProps = {
  staffOptions: readonly BookingStaffOption[];
  /** Selected id ("any" or a specific staff id). */
  selectedStaffId: string | null;
  /** When set, all staff are unavailable for the chosen date. */
  allUnavailable?: boolean;
  loading?: boolean;
  errorMessage?: string;
  onSelectStaff: (id: string) => void;
  onPressContinue: () => void;
  onPressBack?: () => void;
  onPressTryDifferentDate?: () => void;
  /** BookingProgressIndicator slot — replaces the plain "2/5" step badge when provided. W50-DEBT-6 */
  progressIndicator?: React.ReactNode;
  testID?: string;
};

export function StaffSelectionScreen({
  staffOptions,
  selectedStaffId,
  allUnavailable,
  loading,
  errorMessage,
  onSelectStaff,
  onPressContinue,
  onPressBack,
  onPressTryDifferentDate,
  progressIndicator,
  testID,
}: StaffSelectionScreenProps) {
  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        {onPressBack ? (
          <Pressable
            onPress={onPressBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID={testID ? `${testID}-back` : undefined}
            style={styles.backBtn}
          >
            <Text style={styles.backText}>{"\u2190"}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.title}>Choose staff</Text>
        {progressIndicator ? null : <Text style={styles.step}>2/5</Text>}
      </View>
      {progressIndicator}
      <ScrollView contentContainerStyle={styles.body}>
        {allUnavailable ? (
          <View style={styles.banner} testID={testID ? `${testID}-unavailable` : undefined}>
            <Text style={styles.bannerText}>All staff unavailable for this date.</Text>
            {onPressTryDifferentDate ? (
              <Pressable
                onPress={onPressTryDifferentDate}
                accessibilityRole="button"
                accessibilityLabel="Try a different date"
                testID={testID ? `${testID}-try-date` : undefined}
              >
                <Text style={styles.bannerLink}>Try a different date</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {errorMessage ? (
          <View style={[styles.banner, styles.errorBanner]} testID={testID ? `${testID}-error` : undefined}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        {loading ? (
          <Text style={styles.loading} testID={testID ? `${testID}-loading` : undefined}>
            Loading staff…
          </Text>
        ) : null}
        <Pressable
          onPress={() => onSelectStaff(ANY_STAFF_ID)}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedStaffId === ANY_STAFF_ID }}
          accessibilityLabel="Any available"
          testID={testID ? `${testID}-any` : undefined}
          style={[
            styles.anyCard,
            selectedStaffId === ANY_STAFF_ID ? styles.cardSelected : null,
          ]}
        >
          <Text style={styles.anyTitle}>Any available</Text>
          <Text style={styles.anySubtitle}>Earliest opening with any team member</Text>
        </Pressable>
        {staffOptions.map((s) => {
          const sel = selectedStaffId === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => onSelectStaff(s.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`${s.name}${s.rating ? `, ${s.rating} stars` : ""}`}
              testID={testID ? `${testID}-staff-${s.id}` : undefined}
              style={[styles.card, sel ? styles.cardSelected : null]}
            >
              <View style={styles.staffRow}>
                {s.photoUrl ? (
                  <Image
                    source={{ uri: s.photoUrl }}
                    style={styles.avatar}
                    accessibilityElementsHidden
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{s.name.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.staffText}>
                  <Text style={styles.staffName}>{s.name}</Text>
                  {s.rating !== undefined ? (
                    <View style={styles.ratingRow}>
                      <RatingStars value={s.rating} size={16} />
                      <Text style={styles.ratingLabel}>
                        {s.rating.toFixed(1)}
                        {s.reviewCount !== undefined ? ` (${s.reviewCount})` : ""}
                      </Text>
                    </View>
                  ) : null}
                  {s.specialties && s.specialties.length > 0 ? (
                    <Text style={styles.specialties}>{s.specialties.join(" · ")}</Text>
                  ) : null}
                  {s.nextAvailableLabel ? (
                    <Text style={styles.nextAvailable}>{s.nextAvailableLabel}</Text>
                  ) : null}
                  {s.onLeaveLabel ? (
                    <View style={styles.leaveBadge}>
                      <Text style={styles.leaveBadgeText}>{s.onLeaveLabel}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {sel && s.previewSlots && s.previewSlots.length > 0 ? (
                <View style={styles.preview} testID={testID ? `${testID}-preview-${s.id}` : undefined}>
                  {s.previewSlots.slice(0, 3).map((slot) => (
                    <TimeSlotChip key={slot} time={slot} />
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <StickyFooterCta
        primaryLabel="Continue"
        onPrimaryPress={onPressContinue}
        primaryDisabled={!selectedStaffId || Boolean(allUnavailable)}
        primaryTestID={testID ? `${testID}-continue` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 56,
    paddingHorizontal: spacing.pageHorizontal,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  backText: { fontSize: 20, color: colors.foreground },
  title: { fontSize: 20, fontWeight: "600", color: colors.foreground },
  step: { fontSize: 12, fontWeight: "500", color: colors.textMuted },
  body: { padding: spacing.pageHorizontal, paddingBottom: spacing.s24 },
  banner: {
    padding: spacing.s3,
    backgroundColor: colors.creamSilk,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s4,
  },
  bannerText: { color: colors.foreground, fontSize: 14 },
  bannerLink: { color: colors.primary, fontWeight: "600", marginTop: spacing.s1 },
  errorBanner: { backgroundColor: "rgba(244, 67, 54, 0.05)", borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 14 },
  loading: { color: colors.textMuted, marginBottom: spacing.s3 },
  anyCard: {
    padding: spacing.s4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.s3,
  },
  anyTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  anySubtitle: { fontSize: 12, color: colors.textMuted, marginTop: spacing.s1 },
  card: {
    padding: spacing.s4,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.s3,
  },
  cardSelected: { borderColor: colors.mintFresh, borderWidth: 2 },
  staffRow: { flexDirection: "row", gap: spacing.s3 },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    overflow: "hidden",
    backgroundColor: colors.primary10,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "600", color: colors.primary },
  staffText: { flex: 1 },
  staffName: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.s1, marginTop: 2 },
  ratingLabel: { fontSize: 12, color: colors.textMuted },
  specialties: { fontSize: 12, color: colors.textMuted, marginTop: spacing.s1 },
  nextAvailable: { fontSize: 12, color: colors.foreground, marginTop: spacing.s1 },
  leaveBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.s2,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: spacing.s1,
  },
  leaveBadgeText: { fontSize: 12, color: colors.white, fontWeight: "500" },
  preview: { flexDirection: "row", gap: spacing.s2, marginTop: spacing.s3 },
});
