/**
 * BookingReviewScreen.tsx — C.5 Review (Booking step 5/5).
 *
 * Salon mini-card + SummaryRow stack (services / add-ons / staff / date+time
 * / duration) + notes input + promo chip + price breakdown + sticky footer.
 */

import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  StickyFooterCta,
  SummaryRow,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import {
  formatLongDateLabel,
  formatUsd,
  type BookingAddOn,
  type BookingPriceBreakdown,
  type BookingService,
  type BookingStaffOption,
} from "./bookingHelpers";

export type BookingReviewScreenProps = {
  salon: { id: string; name: string; address?: string };
  services: readonly BookingService[];
  addOns?: readonly BookingAddOn[];
  staff: BookingStaffOption | null;
  /** "Any available" sentinel; renders as "Any available". */
  staffAnyAvailable?: boolean;
  date: Date;
  timeSlot: string;
  totalDurationMinutes: number;
  pricing: BookingPriceBreakdown;
  notes: string;
  promoCode?: string | null;
  promoErrorMessage?: string;
  loading?: boolean;
  onChangeNotes: (next: string) => void;
  onPressApplyPromo?: () => void;
  onPressRemovePromo?: () => void;
  onEditServices?: () => void;
  onEditStaff?: () => void;
  onEditDateTime?: () => void;
  onPressContinue: () => void;
  onPressBack?: () => void;
  /** BookingProgressIndicator slot rendered below the header. W50-DEBT-6 */
  progressIndicator?: React.ReactNode;
  /** Free cancellation deadline label e.g. "Free cancellation until Friday, 16 May at 2:00 PM". W50-DEBT-12 */
  freeCancellationLabel?: string;
  /** Loyalty earn preview e.g. "You'll earn 130 pts at Glam Studio". W50-DEBT-12 */
  loyaltyEarnPreviewText?: string;
  /** Compact one-line policy reminder shown when policies were previously
   *  acknowledged for the current version (Review will skip Step 5). GAP-3. */
  policySummary?: string;
  testID?: string;
};

export function BookingReviewScreen({
  salon,
  services,
  addOns = [],
  staff,
  staffAnyAvailable,
  date,
  timeSlot,
  totalDurationMinutes,
  pricing,
  notes,
  promoCode,
  promoErrorMessage,
  loading,
  onChangeNotes,
  onPressApplyPromo,
  onPressRemovePromo,
  onEditServices,
  onEditStaff,
  onEditDateTime,
  onPressContinue,
  onPressBack,
  progressIndicator,
  freeCancellationLabel,
  loyaltyEarnPreviewText,
  policySummary,
  testID,
}: BookingReviewScreenProps) {
  const staffName = staffAnyAvailable
    ? "Any available"
    : (staff?.name ?? "—");
  const servicesValue = services.map((s) => s.name).join(", ");
  const addOnsValue = addOns.map((a) => a.name).join(", ");

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
        <Text style={styles.title}>Review your booking</Text>
        <View style={{ width: 44 }} />
      </View>
      {progressIndicator}
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.salonCard}>
          <Text style={styles.salonName}>{salon.name}</Text>
          {salon.address ? <Text style={styles.salonAddr}>{salon.address}</Text> : null}
        </View>

        <View style={styles.section}>
          <SummaryRow
            label="Services"
            value={servicesValue || "—"}
            editable
            onPress={onEditServices}
            testID={testID ? `${testID}-row-services` : undefined}
          />
          {addOnsValue ? (
            <SummaryRow
              label="Add-ons"
              value={addOnsValue}
              testID={testID ? `${testID}-row-addons` : undefined}
            />
          ) : null}
          <SummaryRow
            label="Staff"
            value={staffName}
            editable
            onPress={onEditStaff}
            testID={testID ? `${testID}-row-staff` : undefined}
          />
          <SummaryRow
            label="Date & time"
            value={`${formatLongDateLabel(date)} · ${timeSlot}`}
            editable
            onPress={onEditDateTime}
            testID={testID ? `${testID}-row-datetime` : undefined}
          />
          <SummaryRow
            label="Duration"
            value={`${totalDurationMinutes} min`}
            noDivider
            testID={testID ? `${testID}-row-duration` : undefined}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notes for staff (optional)</Text>
          <TextInput
            value={notes}
            onChangeText={onChangeNotes}
            placeholder="Allergies, preferences, anything else"
            placeholderTextColor={colors.textMuted}
            multiline
            style={styles.notesInput}
            accessibilityLabel="Notes for staff"
            testID={testID ? `${testID}-notes` : undefined}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Promo code</Text>
          {promoCode ? (
            <View style={styles.promoChipRow}>
              <View style={styles.promoChip}>
                <Text style={styles.promoChipText}>{promoCode}</Text>
                <Pressable
                  onPress={onPressRemovePromo}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove promo ${promoCode}`}
                  hitSlop={8}
                  testID={testID ? `${testID}-promo-remove` : undefined}
                >
                  <Text style={styles.promoChipClose}>{"\u2715"}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable
              onPress={onPressApplyPromo}
              accessibilityRole="button"
              accessibilityLabel="Add promo code"
              testID={testID ? `${testID}-promo-add` : undefined}
              style={styles.promoAddBtn}
            >
              <Text style={styles.promoAddText}>+ Add promo code</Text>
            </Pressable>
          )}
          {promoErrorMessage ? (
            <Text style={styles.promoError} testID={testID ? `${testID}-promo-error` : undefined}>
              {promoErrorMessage}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Price breakdown</Text>
          <SummaryRow label="Subtotal" value={formatUsd(pricing.subtotal)} />
          {pricing.tax > 0 ? (
            <SummaryRow label="Tax" value={formatUsd(pricing.tax)} />
          ) : null}
          {pricing.tip > 0 ? (
            <SummaryRow label="Tip" value={formatUsd(pricing.tip)} />
          ) : null}
          <SummaryRow
            label="Total"
            value={formatUsd(pricing.total)}
            noDivider
            testID={testID ? `${testID}-row-total` : undefined}
          />
        </View>
        {freeCancellationLabel ? (
          <View style={styles.cancellationNote} testID={testID ? `${testID}-cancel-note` : undefined}>
            <Text style={styles.cancellationText}>{freeCancellationLabel}</Text>
          </View>
        ) : null}
        {loyaltyEarnPreviewText ? (
          <View style={styles.loyaltyPreview} testID={testID ? `${testID}-loyalty-preview` : undefined}>
            <Text style={styles.loyaltyPreviewText}>{loyaltyEarnPreviewText}</Text>
          </View>
        ) : null}
        {policySummary ? (
          <View style={styles.policySummary} testID={testID ? `${testID}-policy-summary` : undefined}>
            <Text style={styles.policySummaryText}>{policySummary}</Text>
          </View>
        ) : null}
      </ScrollView>
      <StickyFooterCta
        primaryLabel="Continue to policies"
        totalLabel="Total"
        totalValue={formatUsd(pricing.total)}
        onPrimaryPress={onPressContinue}
        primaryDisabled={loading}
        primaryLoading={loading}
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
  title: { fontSize: 18, fontWeight: "600", color: colors.foreground },
  body: { padding: spacing.pageHorizontal, paddingBottom: spacing.s24 },
  salonCard: {
    padding: spacing.s4,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.s4,
  },
  salonName: { fontSize: 16, fontWeight: "600", color: colors.foreground },
  salonAddr: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    marginBottom: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.s2,
  },
  notesInput: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.s3,
    fontSize: 14,
    color: colors.foreground,
    textAlignVertical: "top",
  },
  promoChipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  promoChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.sm,
    backgroundColor: colors.primary10,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  promoChipText: { color: colors.primary, fontWeight: "500" },
  promoChipClose: { color: colors.primary, fontSize: 14 },
  promoAddBtn: { paddingVertical: spacing.s2 },
  promoAddText: { color: colors.primary, fontWeight: "500" },
  promoError: { color: colors.error, fontSize: 12, marginTop: spacing.s2 },
  cancellationNote: {
    marginHorizontal: spacing.pageHorizontal,
    marginTop: spacing.s2,
    marginBottom: spacing.s2,
    padding: spacing.s3,
    backgroundColor: colors.creamSilk,
    borderRadius: radius.sm,
  },
  cancellationText: { fontSize: 13, color: colors.textMuted },
  loyaltyPreview: {
    marginHorizontal: spacing.pageHorizontal,
    marginTop: spacing.s2,
    marginBottom: spacing.s2,
    padding: spacing.s3,
    backgroundColor: "#E6F7F5",
    borderRadius: radius.sm,
  },
  loyaltyPreviewText: { fontSize: 13, color: "#0D9488" },
  policySummary: {
    marginHorizontal: spacing.pageHorizontal,
    marginTop: spacing.s2,
    marginBottom: spacing.s2,
    padding: spacing.s3,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  policySummaryText: { fontSize: 12, color: colors.textMuted, lineHeight: 16 },
});
