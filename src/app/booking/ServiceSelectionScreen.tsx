/**
 * ServiceSelectionScreen.tsx — C.1 Service Selection (Booking step 1/5).
 *
 * Vertical scroll of services grouped by category, with checkbox to add and
 * an inline add-on chip row when the service is selected. Sticky footer shows
 * count + total + Continue.
 *
 * Pure props — caller supplies pre-grouped services and selection state.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  StickyFooterCta,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import {
  computeBookingTotal,
  formatUsd,
  type BookingAddOn,
  type BookingService,
} from "./bookingHelpers";

export type BookingServiceCategoryGroup = {
  category: string;
  label: string;
  services: BookingService[];
};

export type ServiceSelectionScreenProps = {
  groups: readonly BookingServiceCategoryGroup[];
  /** IDs of selected services. */
  selectedServiceIds: readonly string[];
  /** Optional add-ons keyed by serviceId; selection state held by caller. */
  addOnCatalog?: Record<string, BookingAddOn[]>;
  selectedAddOnIds?: readonly string[];
  /** Banner shown when caller has hit a duration cap. */
  maxReachedMessage?: string;
  loading?: boolean;
  errorMessage?: string;
  onToggleService: (serviceId: string) => void;
  onToggleAddOn?: (addOnId: string) => void;
  onPressContinue: () => void;
  onPressBack?: () => void;
  onPressRetry?: () => void;
  testID?: string;
};

export function ServiceSelectionScreen({
  groups,
  selectedServiceIds,
  addOnCatalog = {},
  selectedAddOnIds = [],
  maxReachedMessage,
  loading,
  errorMessage,
  onToggleService,
  onToggleAddOn,
  onPressContinue,
  onPressBack,
  onPressRetry,
  testID,
}: ServiceSelectionScreenProps) {
  const allServices = groups.flatMap((g) => g.services);
  const selectedServices = allServices.filter((s) =>
    selectedServiceIds.includes(s.id),
  );
  const selectedAddOns = Object.values(addOnCatalog)
    .flat()
    .filter((a) => selectedAddOnIds.includes(a.id));
  const totals = computeBookingTotal({
    services: selectedServices,
    addOns: selectedAddOns,
  });
  const continueDisabled = selectedServiceIds.length === 0 || Boolean(loading) || Boolean(errorMessage);

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
        <Text style={styles.title}>Choose services</Text>
        <Text style={styles.step}>1/5</Text>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {maxReachedMessage ? (
          <View style={[styles.banner, styles.warnBanner]} testID={testID ? `${testID}-max-banner` : undefined}>
            <Text style={styles.warnText}>{maxReachedMessage}</Text>
          </View>
        ) : null}
        {errorMessage ? (
          <View style={[styles.banner, styles.errorBanner]} testID={testID ? `${testID}-error` : undefined}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            {onPressRetry ? (
              <Pressable
                onPress={onPressRetry}
                accessibilityRole="button"
                accessibilityLabel="Retry"
                testID={testID ? `${testID}-retry` : undefined}
              >
                <Text style={styles.errorRetry}>Retry</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {loading ? (
          <Text style={styles.loading} testID={testID ? `${testID}-loading` : undefined}>
            Loading services…
          </Text>
        ) : null}
        {groups.map((group) => (
          <View key={group.category} style={styles.group}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            {group.services.map((svc) => {
              const checked = selectedServiceIds.includes(svc.id);
              const addOns = addOnCatalog[svc.id] ?? [];
              return (
                <View
                  key={svc.id}
                  style={[styles.card, checked ? styles.cardSelected : null]}
                >
                  <Pressable
                    onPress={() => onToggleService(svc.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={`${svc.name}, ${formatUsd(svc.priceUsd)}, ${svc.durationMinutes} minutes`}
                    testID={testID ? `${testID}-svc-${svc.id}` : undefined}
                    style={styles.cardRow}
                  >
                    <View style={styles.cardText}>
                      <Text style={styles.cardTitle}>{svc.name}</Text>
                      <Text style={styles.cardMeta}>
                        {svc.durationMinutes} min · {formatUsd(svc.priceUsd)}
                      </Text>
                    </View>
                    <View style={[styles.checkbox, checked ? styles.checkboxOn : null]}>
                      {checked ? <Text style={styles.checkboxMark}>{"\u2713"}</Text> : null}
                    </View>
                  </Pressable>
                  {checked && addOns.length > 0 ? (
                    <View style={styles.addOnRow}>
                      {addOns.map((addOn) => {
                        const onSel = selectedAddOnIds.includes(addOn.id);
                        return (
                          <Pressable
                            key={addOn.id}
                            onPress={() => onToggleAddOn?.(addOn.id)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: onSel }}
                            accessibilityLabel={`${addOn.name} add-on, ${formatUsd(addOn.priceUsd)}`}
                            testID={testID ? `${testID}-addon-${addOn.id}` : undefined}
                            style={[styles.addOnChip, onSel ? styles.addOnChipOn : null]}
                          >
                            <Text style={[styles.addOnText, onSel ? styles.addOnTextOn : null]}>
                              {addOn.name} +{formatUsd(addOn.priceUsd)}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
      <StickyFooterCta
        primaryLabel={
          selectedServiceIds.length === 0
            ? "Continue"
            : `Continue · ${selectedServiceIds.length} selected`
        }
        totalLabel="Total"
        totalValue={formatUsd(totals.total)}
        onPrimaryPress={onPressContinue}
        primaryDisabled={continueDisabled}
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
  title: { fontSize: 20, lineHeight: 28, fontWeight: "600", color: colors.foreground },
  step: { fontSize: 12, lineHeight: 16, fontWeight: "500", color: colors.textMuted },
  body: { padding: spacing.pageHorizontal, paddingBottom: spacing.s24 },
  banner: {
    padding: spacing.s3,
    borderRadius: radius.sm,
    marginBottom: spacing.s4,
  },
  warnBanner: { backgroundColor: colors.creamSilk, borderWidth: 1, borderColor: colors.warning },
  warnText: { color: colors.foreground, fontSize: 14 },
  errorBanner: {
    backgroundColor: "rgba(244, 67, 54, 0.05)",
    borderWidth: 1,
    borderColor: colors.error,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: { color: colors.error, fontSize: 14, flex: 1 },
  errorRetry: { color: colors.error, fontWeight: "600" },
  loading: { color: colors.textMuted, marginBottom: spacing.s3 },
  group: { marginBottom: spacing.s5 },
  groupLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: spacing.s2,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s4,
    marginBottom: spacing.s3,
  },
  cardSelected: { borderColor: colors.primary },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 14, lineHeight: 20, fontWeight: "500", color: colors.foreground },
  cardMeta: { fontSize: 12, lineHeight: 16, color: colors.textMuted, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkboxMark: { color: colors.white, fontSize: 16, fontWeight: "600" },
  addOnRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2, marginTop: spacing.s3 },
  addOnChip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  addOnChipOn: { backgroundColor: colors.primary10, borderColor: colors.primary },
  addOnText: { fontSize: 12, color: colors.foreground },
  addOnTextOn: { color: colors.primary, fontWeight: "500" },
});
