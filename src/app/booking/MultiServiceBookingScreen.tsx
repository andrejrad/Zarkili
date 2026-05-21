/**
 * MultiServiceBookingScreen.tsx — J.2 Multi / Recurring / On-Behalf (W30 Batch J).
 *
 * NEW-DEBT-F: This screen is NOT wired into AppNavigatorShell in v1. The v1
 * booking flow scope is single-service only (spec §1 / §5.2). Tests in
 * __tests__/bookingEdgeScreens.test.tsx keep the component compiling. Reactivate
 * once the v2 multi-service / cart spec is published.
 *
 * Covers three booking-customisation surfaces:
 *   J.2.1  MultiServiceBookingScreen  — multi-select variant of C.1 ServiceSelectionScreen
 *                                       (same groups prop) with a sticky "Xh Xm total" banner.
 *   J.2.2  RecurringBookingSheet      — ModalSheet for recurring-booking config.
 *   J.2.3  OnBehalfBookingScreen      — toggle + name/phone fields to book for another person.
 *
 * All three are exported from this file.
 *
 * Decision gate W30: Recurring bookings are post-launch (default No). The
 * RecurringBookingSheet is live but the navigator may show a "Coming soon"
 * overlay before enabling it.
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import {
  Banner,
  Button,
  InputField,
  ModalSheet,
  StickyFooterCta,
  TimeSlotChip,
  colors,
  radius,
  spacing,
} from "../../shared/ui";
import type { BookingServiceCategoryGroup } from "./ServiceSelectionScreen";
import type { BookingService } from "./bookingHelpers";
import { computeBookingTotal, formatUsd } from "./bookingHelpers";

// ---------------------------------------------------------------------------
// J.2.1 — Multi-service booking
// ---------------------------------------------------------------------------

export type MultiServiceBookingScreenProps = {
  groups: readonly BookingServiceCategoryGroup[];
  selectedServiceIds: readonly string[];
  /** When set, a "Max services reached" banner is shown. */
  maxReachedMessage?: string;
  loading?: boolean;
  errorMessage?: string;
  onToggleService: (serviceId: string) => void;
  onPressContinue: () => void;
  onPressBack?: () => void;
  onPressRetry?: () => void;
  testID?: string;
};

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function MultiServiceBookingScreen({
  groups,
  selectedServiceIds,
  maxReachedMessage,
  loading,
  errorMessage,
  onToggleService,
  onPressContinue,
  onPressBack,
  onPressRetry,
  testID,
}: MultiServiceBookingScreenProps) {
  const allServices = groups.flatMap((g) => g.services);
  const selected = allServices.filter((s) => selectedServiceIds.includes(s.id));
  const totalMinutes = selected.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalUsd = selected.reduce((acc, s) => acc + s.priceUsd, 0);
  const continueDisabled =
    selected.length === 0 || Boolean(loading) || Boolean(errorMessage);

  return (
    <View style={styles.root} testID={testID}>
      {/* Duration totalizer sticky banner */}
      {selected.length > 0 && (
        <View
          style={styles.totalizerBanner}
          testID={testID ? `${testID}-totalizer` : undefined}
        >
          <Text style={styles.totalizerText}>
            {formatDuration(totalMinutes)} total · {formatUsd(totalUsd)}
          </Text>
        </View>
      )}

      {maxReachedMessage && (
        <Banner
          variant="warning"
          message={maxReachedMessage}
          testID={testID ? `${testID}-max-banner` : undefined}
        />
      )}

      {errorMessage && (
        <Banner
          variant="error"
          message={errorMessage}
          testID={testID ? `${testID}-error-banner` : undefined}
        />
      )}

      <ScrollView contentContainerStyle={styles.scroll}>
        {groups.map((group) => (
          <View key={group.category} style={styles.section}>
            <Text style={styles.sectionHeader}>{group.label}</Text>
            {group.services.map((svc) => {
              const isSelected = selectedServiceIds.includes(svc.id);
              return (
                <Pressable
                  key={svc.id}
                  style={[styles.serviceRow, isSelected && styles.serviceRowSelected]}
                  onPress={() => onToggleService(svc.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  testID={testID ? `${testID}-svc-${svc.id}` : undefined}
                >
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{svc.name}</Text>
                    <Text style={styles.serviceMeta}>
                      {formatDuration(svc.durationMinutes)} · {formatUsd(svc.priceUsd)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected,
                    ]}
                  >
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <StickyFooterCta
        primaryLabel={`Continue${selected.length > 0 ? ` (${selected.length})` : ""}`}
        primaryDisabled={continueDisabled}
        primaryLoading={loading}
        onPrimaryPress={onPressContinue}
        testID={testID ? `${testID}-cta` : undefined}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// J.2.2 — Recurring booking sheet
// ---------------------------------------------------------------------------

export type RecurringFrequency = "weekly" | "biweekly" | "monthly";

export type RecurringBookingConfig = {
  frequency: RecurringFrequency;
  occurrences: number;
  endDate?: string; // ISO YYYY-MM-DD
};

export type RecurringBookingSheetProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (config: RecurringBookingConfig) => void;
  /** Shown when the chosen recurrence overlaps with blocked dates. */
  conflictWarning?: string;
  testID?: string;
};

const FREQUENCY_LABELS: Record<RecurringFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export function RecurringBookingSheet({
  visible,
  onClose,
  onConfirm,
  conflictWarning,
  testID,
}: RecurringBookingSheetProps) {
  const [frequency, setFrequency] = useState<RecurringFrequency>("weekly");
  const [occurrences, setOccurrences] = useState("4");

  const handleConfirm = () => {
    onConfirm({ frequency, occurrences: Math.max(1, parseInt(occurrences, 10) || 1) });
  };

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title="Repeat this booking"
      testID={testID}
      footer={
        <View style={styles.sheetFooter}>
          {conflictWarning && (
            <Banner
              variant="warning"
              message={conflictWarning}
              testID={testID ? `${testID}-conflict-warning` : undefined}
            />
          )}
          <Button
            label="Confirm recurring"
            variant="primary"
            onPress={handleConfirm}
            testID={testID ? `${testID}-confirm` : undefined}
          />
        </View>
      }
    >
      <View style={styles.sheetBody}>
        <Text style={styles.fieldLabel}>Frequency</Text>
        <View style={styles.freqRow}>
          {(["weekly", "biweekly", "monthly"] as RecurringFrequency[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.freqChip, frequency === f && styles.freqChipSelected]}
              onPress={() => setFrequency(f)}
              accessibilityRole="radio"
              accessibilityState={{ selected: frequency === f }}
              testID={testID ? `${testID}-freq-${f}` : undefined}
            >
              <Text
                style={[
                  styles.freqChipText,
                  frequency === f && styles.freqChipTextSelected,
                ]}
              >
                {FREQUENCY_LABELS[f]}
              </Text>
            </Pressable>
          ))}
        </View>

        <InputField
          label="Number of occurrences"
          value={occurrences}
          onChangeText={setOccurrences}
          variant="otpCell"
          testID={testID ? `${testID}-occurrences` : undefined}
        />
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// J.2.3 — Book on behalf of another person
// ---------------------------------------------------------------------------

export type OnBehalfBookingScreenProps = {
  onBehalfEnabled: boolean;
  onToggleOnBehalf: (enabled: boolean) => void;
  name: string;
  phone: string;
  onChangeName: (v: string) => void;
  onChangePhone: (v: string) => void;
  /** Validation error for required-fields check. */
  requiredFieldsError?: string;
  loading?: boolean;
  onPressContinue: () => void;
  onPressBack?: () => void;
  testID?: string;
};

export function OnBehalfBookingScreen({
  onBehalfEnabled,
  onToggleOnBehalf,
  name,
  phone,
  onChangeName,
  onChangePhone,
  requiredFieldsError,
  loading,
  onPressContinue,
  onPressBack,
  testID,
}: OnBehalfBookingScreenProps) {
  return (
    <View style={styles.root} testID={testID}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Book for someone else</Text>
          <Switch
            value={onBehalfEnabled}
            onValueChange={onToggleOnBehalf}
            trackColor={{ true: colors.primary }}
            thumbColor={colors.surface}
            testID={testID ? `${testID}-toggle` : undefined}
          />
        </View>

        {onBehalfEnabled && (
          <View
            style={styles.onBehalfFields}
            testID={testID ? `${testID}-fields` : undefined}
          >
            <InputField
              label="Full name"
              value={name}
              onChangeText={onChangeName}
              placeholder="e.g. Jane Smith"
              testID={testID ? `${testID}-name` : undefined}
            />
            <InputField
              label="Phone number"
              value={phone}
              onChangeText={onChangePhone}
              variant="phone"
              placeholder="(555) 000-0000"
              testID={testID ? `${testID}-phone` : undefined}
            />
            {requiredFieldsError && (
              <Banner
                variant="error"
                message={requiredFieldsError}
                testID={testID ? `${testID}-required-error` : undefined}
              />
            )}
          </View>
        )}
      </ScrollView>

      <StickyFooterCta
        primaryLabel="Continue"
        primaryDisabled={onBehalfEnabled && (!name.trim() || !phone.trim()) || Boolean(loading)}
        primaryLoading={loading}
        onPrimaryPress={onPressContinue}
        testID={testID ? `${testID}-cta` : undefined}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
    paddingBottom: spacing.s12,
  },
  totalizerBanner: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.pageHorizontal,
    alignItems: "center",
  },
  totalizerText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface,
  },
  section: {
    gap: spacing.s2,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.s1,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s4,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.s3,
    minHeight: spacing.touchTarget,
  },
  serviceRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary10,
  },
  serviceInfo: {
    flex: 1,
    gap: spacing.s1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.foreground,
  },
  serviceMeta: {
    fontSize: 13,
    color: colors.textMuted,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.s3,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.foreground,
  },
  onBehalfFields: {
    gap: spacing.s4,
  },
  sheetBody: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s4,
    gap: spacing.s4,
  },
  sheetFooter: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s3,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.foreground,
    marginBottom: spacing.s1,
  },
  freqRow: {
    flexDirection: "row",
    gap: spacing.s2,
    flexWrap: "wrap",
  },
  freqChip: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  freqChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  freqChipText: {
    fontSize: 14,
    color: colors.foreground,
  },
  freqChipTextSelected: {
    color: colors.surface,
    fontWeight: "600",
  },
});
