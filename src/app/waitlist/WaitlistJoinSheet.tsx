/**
 * WaitlistJoinSheet.tsx — F.6 Waitlist Join Sheet.
 *
 * ModalSheet with:
 *   - Date range inputs (MM/DD/YYYY)
 *   - Time preference chips: Morning | Afternoon | Evening | Anytime
 *   - Staff preference: SegmentedControl  Any | Specific
 *   - Notify toggles: Push (PreferenceToggleRow) + SMS (PreferenceToggleRow, TCPA note)
 *   - Policy disclosure
 *   - StickyCtaBar "Join waitlist" / "Already on waitlist" banner
 * TCPA: SMS toggle defaults to false; helper text explains prior-consent requirement.
 */

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Banner,
  ModalSheet,
  PreferenceToggleRow,
  SegmentedControl,
  StickyCtaBar,
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";
import {
  CAN_SPAM_UNSUBSCRIBE_COPY,
  WAITLIST_TIME_PREFERENCE_LABELS,
  WAITLIST_TIME_PREFERENCES,
  WaitlistStaffPreference,
  WaitlistTimePreference,
} from "../messaging/messagingHelpers";

const STAFF_OPTIONS: ReadonlyArray<{ value: WaitlistStaffPreference; label: string }> = [
  { value: "any", label: "Any" },
  { value: "specific", label: "Specific" },
];

export type WaitlistJoinSheetProps = {
  visible: boolean;
  onClose: () => void;
  serviceName: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  onDateRangeStartChange: (d: string) => void;
  onDateRangeEndChange: (d: string) => void;
  timePreference: WaitlistTimePreference;
  onTimePreferenceChange: (p: WaitlistTimePreference) => void;
  staffPreference: WaitlistStaffPreference;
  onStaffPreferenceChange: (p: WaitlistStaffPreference) => void;
  notifyByPush: boolean;
  onTogglePush: (v: boolean) => void;
  /** Defaults false — TCPA requires explicit opt-in before SMS is enabled */
  notifyBySms: boolean;
  onToggleSms: (v: boolean) => void;
  onJoin: () => void;
  isJoining?: boolean;
  isAlreadyOnWaitlist?: boolean;
  testID?: string;
};

export function WaitlistJoinSheet({
  visible,
  onClose,
  serviceName,
  dateRangeStart,
  dateRangeEnd,
  onDateRangeStartChange,
  onDateRangeEndChange,
  timePreference,
  onTimePreferenceChange,
  staffPreference,
  onStaffPreferenceChange,
  notifyByPush,
  onTogglePush,
  notifyBySms,
  onToggleSms,
  onJoin,
  isJoining,
  isAlreadyOnWaitlist,
  testID,
}: WaitlistJoinSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={`Join waitlist for ${serviceName}`}
      testID={testID}
      footer={
        <StickyCtaBar
          primaryLabel={isJoining ? "Joining…" : "Join waitlist"}
          onPrimaryPress={onJoin}
          primaryDisabled={isAlreadyOnWaitlist || isJoining}
          primaryLoading={isJoining}
          primaryTestID={testID ? `${testID}-join-cta` : undefined}
        />
      }
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Already on waitlist */}
        {isAlreadyOnWaitlist ? (
          <Banner
            variant="info"
            message={`You're already on the waitlist for ${serviceName}.`}
            testID={testID ? `${testID}-already-banner` : undefined}
          />
        ) : null}

        {/* Date range */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Preferred date range</Text>
          <View style={styles.dateRow}>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="From MM/DD/YYYY"
              placeholderTextColor={colors.textMuted}
              value={dateRangeStart}
              onChangeText={onDateRangeStartChange}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="Waitlist start date"
              testID={testID ? `${testID}-date-start` : undefined}
            />
            <Text style={styles.dateSeparator}>–</Text>
            <TextInput
              style={[styles.input, styles.dateInput]}
              placeholder="To MM/DD/YYYY"
              placeholderTextColor={colors.textMuted}
              value={dateRangeEnd}
              onChangeText={onDateRangeEndChange}
              keyboardType="numbers-and-punctuation"
              accessibilityLabel="Waitlist end date"
              testID={testID ? `${testID}-date-end` : undefined}
            />
          </View>
        </View>

        {/* Time preference */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Preferred time of day</Text>
          <View style={styles.chipsRow}>
            {WAITLIST_TIME_PREFERENCES.map((pref) => {
              const active = timePreference === pref;
              return (
                <Pressable
                  key={pref}
                  style={[styles.timeChip, active && styles.timeChipActive]}
                  onPress={() => onTimePreferenceChange(pref)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={WAITLIST_TIME_PREFERENCE_LABELS[pref]}
                  testID={testID ? `${testID}-time-${pref}` : undefined}
                >
                  <Text
                    style={[styles.timeChipText, active && styles.timeChipTextActive]}
                  >
                    {WAITLIST_TIME_PREFERENCE_LABELS[pref]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Staff preference */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Staff preference</Text>
          <SegmentedControl
            options={STAFF_OPTIONS}
            value={staffPreference}
            onChange={(v) => onStaffPreferenceChange(v as WaitlistStaffPreference)}
            testID={testID ? `${testID}-staff-pref` : undefined}
          />
        </View>

        {/* Notification toggles */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Notify me when a slot opens</Text>
          <PreferenceToggleRow
            label="Push notification"
            value={notifyByPush}
            onValueChange={onTogglePush}
            testID={testID ? `${testID}-notify-push` : undefined}
          />
          <PreferenceToggleRow
            label="SMS"
            helperText="Requires prior consent. Message & data rates may apply."
            value={notifyBySms}
            onValueChange={onToggleSms}
            testID={testID ? `${testID}-notify-sms` : undefined}
          />
        </View>

        {/* Policy disclosure */}
        <Text style={styles.policyText} accessibilityRole="text">
          By joining this waitlist you agree to be contacted when a slot becomes
          available. {CAN_SPAM_UNSUBSCRIBE_COPY}
        </Text>
      </ScrollView>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    gap: spacing.s4,
    paddingBottom: spacing.s6,
  },
  fieldGroup: {
    gap: spacing.s2,
  },
  fieldLabel: {
    ...textStyles.label,
    color: colors.foreground,
    fontWeight: "600",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
  },
  dateInput: {
    flex: 1,
  },
  dateSeparator: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  input: {
    height: spacing.touchTarget,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s3,
    ...textStyles.body,
    color: colors.foreground,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
  },
  timeChip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  timeChipActive: {
    backgroundColor: colors.primary,
  },
  timeChipText: {
    ...textStyles.bodySmall,
    color: colors.primary,
    fontWeight: "600",
  },
  timeChipTextActive: {
    color: colors.white,
  },
  policyText: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: spacing.s2,
  },
});
