/**
 * StaffExtrasScreen.tsx — W31 Batch K (K.6)
 *
 * Exports:
 *   LocationSwitcherSheet     — radio list of locations + confirm
 *   TimeOffRequestScreen      — date range + type chips + notes + submit
 *   AvailabilityOverrideScreen — day chips + time-slot overrides + save
 *   PayoutEarningsScreen      — earnings summary + ReceiptLineItem breakdown + history
 *   DailyCloseReportScreen    — summary tiles + export CTA
 *   StaffOnboardingScreen     — 4-step wizard
 */

import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { InputField } from "../../shared/ui/InputField";
import { ModalSheet } from "../../shared/ui/ModalSheet";
import { ReceiptLineItem } from "../../shared/ui/ReceiptLineItem";
import { SummaryRow } from "../../shared/ui/SummaryRow";
import { WalkInForm, type WalkInService } from "../../shared/ui/WalkInForm";
import { formatMoney } from "../../shared/ui/money";
import { colors, radius, spacing } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Location = {
  id: string;
  name: string;
  address: string;
};

export type LocationSwitcherSheetProps = {
  visible: boolean;
  locations: Location[];
  currentLocationId: string;
  onConfirm: (locationId: string) => void;
  onDismiss: () => void;
  testID?: string;
};

export type TimeOffType = "vacation" | "sick" | "personal" | "other";
const TIME_OFF_TYPES: { id: TimeOffType; label: string }[] = [
  { id: "vacation", label: "Vacation" },
  { id: "sick", label: "Sick leave" },
  { id: "personal", label: "Personal" },
  { id: "other", label: "Other" },
];

export type TimeOffRequestData = {
  startDate: string;
  endDate: string;
  type: TimeOffType;
  notes: string;
};

export type TimeOffRequestScreenProps = {
  onSubmit: (data: TimeOffRequestData) => void | Promise<void>;
  testID?: string;
};

type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
const DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export type AvailabilitySlot = {
  day: DayOfWeek;
  startTime: string;
  endTime: string;
};

export type AvailabilityOverrideScreenProps = {
  initial: AvailabilitySlot[];
  onSave: (slots: AvailabilitySlot[]) => void | Promise<void>;
  testID?: string;
};

export type EarningsLineItem = {
  id: string;
  label: string;
  amount: number;
  type: "credit" | "debit";
};

export type PayoutHistory = {
  id: string;
  date: string;
  amount: number;
};

export type PayoutEarningsScreenProps = {
  currentEarnings: number;
  periodLabel: string;   // e.g. "This week"
  lineItems: EarningsLineItem[];
  payoutHistory: PayoutHistory[];
  onRequestPayout: () => void;
  /** ISO-4217 currency code for the location/tenant. Defaults to "GBP". */
  currency?: string;
  testID?: string;
};

export type DailyCloseSummary = {
  bookingsCount: number;
  revenue: number;
  tips: number;
  noShows: number;
};

export type DailyCloseReportScreenProps = {
  summary: DailyCloseSummary;
  date: string;
  onExport: () => void;
  /** ISO-4217 currency code for the location/tenant. Defaults to "GBP". */
  currency?: string;
  testID?: string;
};

export type StaffOnboardingScreenProps = {
  onComplete: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// LocationSwitcherSheet
// ---------------------------------------------------------------------------

export function LocationSwitcherSheet({
  visible,
  locations,
  currentLocationId,
  onConfirm,
  onDismiss,
  testID,
}: LocationSwitcherSheetProps) {
  const [selected, setSelected] = useState(currentLocationId);

  return (
    <ModalSheet
      visible={visible}
      onClose={onDismiss}
      title="Switch location"
      testID={testID}
    >
      <View style={styles.sheetBody}>
        {locations.map((loc) => (
          <Pressable
            key={loc.id}
            onPress={() => setSelected(loc.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === loc.id }}
            style={[styles.locationRow, selected === loc.id && styles.locationRowSelected]}
            testID={testID ? `${testID}-loc-${loc.id}` : undefined}
          >
            <View style={styles.radioOuter}>
              {selected === loc.id && <View style={styles.radioInner} />}
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationName}>{loc.name}</Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {loc.address}
              </Text>
            </View>
          </Pressable>
        ))}
        <Pressable
          onPress={() => {
            onConfirm(selected);
            onDismiss();
          }}
          accessibilityRole="button"
          style={styles.primaryBtn}
          testID={testID ? `${testID}-confirm` : undefined}
        >
          <Text style={styles.primaryBtnText}>Confirm</Text>
        </Pressable>
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// TimeOffRequestScreen
// ---------------------------------------------------------------------------

export function TimeOffRequestScreen({
  onSubmit,
  testID,
}: TimeOffRequestScreenProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<TimeOffType>("vacation");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = startDate.trim() && endDate.trim() && !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    const result = onSubmit({ startDate: startDate.trim(), endDate: endDate.trim(), type, notes: notes.trim() });
    if (result instanceof Promise) await result;
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <SafeAreaView style={styles.safeArea} testID={testID}>
        <View style={styles.centreContainer}>
          <Text style={styles.bigIcon}>✓</Text>
          <Text style={styles.pageTitle} testID={testID ? `${testID}-submitted` : undefined}>
            Request submitted
          </Text>
          <Text style={styles.subText}>
            Your manager will review and respond shortly.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.pageTitle}>Request time off</Text>

        <View style={styles.formCard}>
          <InputField
            label="Start date"
            value={startDate}
            onChangeText={setStartDate}
            variant="text"
            placeholder="YYYY-MM-DD"
            testID={testID ? `${testID}-start` : undefined}
          />
          <InputField
            label="End date"
            value={endDate}
            onChangeText={setEndDate}
            variant="text"
            placeholder="YYYY-MM-DD"
            testID={testID ? `${testID}-end` : undefined}
          />
        </View>

        <View style={styles.chipSection}>
          <Text style={styles.sectionLabel}>Type</Text>
          <View style={styles.chipRow}>
            {TIME_OFF_TYPES.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setType(t.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: type === t.id }}
                style={[styles.chip, type === t.id && styles.chipActive]}
                testID={testID ? `${testID}-type-${t.id}` : undefined}
              >
                <Text style={[styles.chipText, type === t.id && styles.chipTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.formCard}>
          <InputField
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            variant="text"
            placeholder="Any additional details…"
            testID={testID ? `${testID}-notes` : undefined}
          />
        </View>

        <Pressable
          onPress={handleSubmit}
          disabled={!canSubmit}
          accessibilityRole="button"
          style={[styles.primaryBtn, !canSubmit && styles.btnDisabled]}
          testID={testID ? `${testID}-submit` : undefined}
        >
          <Text style={styles.primaryBtnText}>
            {submitting ? "Submitting…" : "Submit request"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// AvailabilityOverrideScreen
// ---------------------------------------------------------------------------

export function AvailabilityOverrideScreen({
  initial,
  onSave,
  testID,
}: AvailabilityOverrideScreenProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initial);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>("Mon");
  const [saveState, setSaveState] = useState<"default" | "saving" | "saved" | "error">("default");

  const daySlot = slots.find((s) => s.day === selectedDay);

  function updateSlot(field: "startTime" | "endTime", value: string) {
    setSlots((prev) => {
      const existing = prev.find((s) => s.day === selectedDay);
      if (existing) {
        return prev.map((s) =>
          s.day === selectedDay ? { ...s, [field]: value } : s
        );
      }
      return [
        ...prev,
        {
          day: selectedDay,
          startTime: field === "startTime" ? value : "09:00",
          endTime: field === "endTime" ? value : "17:00",
        },
      ];
    });
    setSaveState("default");
  }

  async function handleSave() {
    setSaveState("saving");
    try {
      const result = onSave(slots);
      if (result instanceof Promise) await result;
      setSaveState("saved");
    } catch {
      setSaveState("error");
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Availability override</Text>

        <View style={styles.chipRow}>
          {DAYS.map((day) => {
            const hasSlot = slots.some((s) => s.day === day);
            return (
              <Pressable
                key={day}
                onPress={() => setSelectedDay(day)}
                accessibilityRole="button"
                style={[
                  styles.dayChip,
                  selectedDay === day && styles.dayChipActive,
                  hasSlot && styles.dayChipHasSlot,
                ]}
                testID={testID ? `${testID}-day-${day}` : undefined}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedDay === day && styles.chipTextActive,
                  ]}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.formCard}>
          <InputField
            label="Start time"
            value={daySlot?.startTime ?? ""}
            onChangeText={(v) => updateSlot("startTime", v)}
            variant="text"
            placeholder="09:00"
            testID={testID ? `${testID}-start` : undefined}
          />
          <InputField
            label="End time"
            value={daySlot?.endTime ?? ""}
            onChangeText={(v) => updateSlot("endTime", v)}
            variant="text"
            placeholder="17:00"
            testID={testID ? `${testID}-end` : undefined}
          />
        </View>

        {saveState === "error" && (
          <Text style={styles.errorText}>Failed to save. Please try again.</Text>
        )}

        <Pressable
          onPress={handleSave}
          disabled={saveState === "saving"}
          accessibilityRole="button"
          style={[styles.primaryBtn, saveState === "saving" && styles.btnDisabled]}
          testID={testID ? `${testID}-save` : undefined}
        >
          <Text style={styles.primaryBtnText}>
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved ✓" : "Save availability"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// PayoutEarningsScreen
// ---------------------------------------------------------------------------

export function PayoutEarningsScreen({
  currentEarnings,
  periodLabel,
  lineItems,
  payoutHistory,
  onRequestPayout,
  currency = "GBP",
  testID,
}: PayoutEarningsScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        {/* Earnings summary card */}
        <View style={styles.earningsCard} testID={testID ? `${testID}-card` : undefined}>
          <Text style={styles.earningsPeriod}>{periodLabel}</Text>
          <Text style={styles.earningsAmount} testID={testID ? `${testID}-amount` : undefined}>
            {formatMoney(currentEarnings, currency)}
          </Text>
          <Pressable
            onPress={onRequestPayout}
            accessibilityRole="button"
            style={styles.payoutBtn}
            testID={testID ? `${testID}-payout` : undefined}
          >
            <Text style={styles.payoutBtnText}>Request payout</Text>
          </Pressable>
        </View>

        {/* Line items */}
        <Text style={styles.sectionLabel}>Breakdown</Text>
        <View style={styles.lineItemBox}>
          {lineItems.map((item) => (
            <ReceiptLineItem
              key={item.id}
              description={item.label}
              amountLabel={`${item.type === "debit" ? "−" : "+"}${formatMoney(item.amount, currency)}`}
              testID={testID ? `${testID}-line-${item.id}` : undefined}
            />
          ))}
        </View>

        {/* Payout history */}
        {payoutHistory.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Payout history</Text>
            <View style={styles.historyBox}>
              {payoutHistory.map((p) => (
                <SummaryRow
                  key={p.id}
                  label={p.date}
                  value={formatMoney(p.amount, currency)}
                  testID={testID ? `${testID}-payout-${p.id}` : undefined}
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// DailyCloseReportScreen
// ---------------------------------------------------------------------------

export function DailyCloseReportScreen({
  summary,
  date,
  onExport,
  currency = "GBP",
  testID,
}: DailyCloseReportScreenProps) {
  const tiles = [
    { id: "bookings", label: "Bookings", value: String(summary.bookingsCount), icon: "📅" },
    { id: "revenue", label: "Revenue", value: formatMoney(summary.revenue, currency), icon: "💵" },
    { id: "tips", label: "Tips", value: formatMoney(summary.tips, currency), icon: "🙏" },
    { id: "no-shows", label: "No-shows", value: String(summary.noShows), icon: "❌" },
  ];

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Daily close report</Text>
        <Text style={styles.subText}>{date}</Text>

        <View style={styles.tilesGrid}>
          {tiles.map((tile) => (
            <View
              key={tile.id}
              style={styles.tile}
              testID={testID ? `${testID}-${tile.id}` : undefined}
            >
              <Text style={styles.tileIcon}>{tile.icon}</Text>
              <Text style={styles.tileValue}>{tile.value}</Text>
              <Text style={styles.tileLabel}>{tile.label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={onExport}
          accessibilityRole="button"
          style={styles.exportBtn}
          testID={testID ? `${testID}-export` : undefined}
        >
          <Text style={styles.exportBtnText}>Export report</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// StaffOnboardingScreen (4-step wizard)
// ---------------------------------------------------------------------------

const STEPS = ["Welcome", "Profile", "Schedule", "Services"] as const;
type OnboardingStep = 0 | 1 | 2 | 3;

const WALK_IN_DEMO_SERVICES: WalkInService[] = [
  { id: "haircut", name: "Haircut" },
  { id: "colour", name: "Colour" },
  { id: "blowout", name: "Blowout" },
];

export function StaffOnboardingScreen({
  onComplete,
  testID,
}: StaffOnboardingScreenProps) {
  const [step, setStep] = useState<OnboardingStep>(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  function nextStep() {
    if (step < 3) {
      setStep((s) => (s + 1) as OnboardingStep);
    } else {
      onComplete();
    }
  }

  const isLast = step === 3;

  return (
    <SafeAreaView style={styles.safeArea} testID={testID}>
      {/* Step indicator */}
      <View style={styles.stepBar} testID={testID ? `${testID}-stepbar` : undefined}>
        {STEPS.map((s, i) => (
          <View
            key={s}
            style={[styles.stepDot, i <= step && styles.stepDotActive]}
            testID={testID ? `${testID}-dot-${i}` : undefined}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <View testID={testID ? `${testID}-step-0` : undefined}>
            <Text style={styles.bigIcon}>👋</Text>
            <Text style={styles.pageTitle}>Welcome to Zarkili Staff</Text>
            <Text style={styles.subText}>
              {'Let\'s get you set up in just a few steps. Tap "Next" to begin.'}
            </Text>
          </View>
        )}

        {step === 1 && (
          <View style={styles.stepContent} testID={testID ? `${testID}-step-1` : undefined}>
            <Text style={styles.pageTitle}>Your profile</Text>
            <View style={styles.formCard}>
              <InputField
                label="First name"
                value={firstName}
                onChangeText={setFirstName}
                variant="text"
                placeholder="Jane"
                testID={testID ? `${testID}-first-name` : undefined}
              />
              <InputField
                label="Last name"
                value={lastName}
                onChangeText={setLastName}
                variant="text"
                placeholder="Doe"
                testID={testID ? `${testID}-last-name` : undefined}
              />
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent} testID={testID ? `${testID}-step-2` : undefined}>
            <Text style={styles.pageTitle}>Your schedule</Text>
            <Text style={styles.subText}>
              Your manager will set up your default schedule. You can override
              specific days from your profile later.
            </Text>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent} testID={testID ? `${testID}-step-3` : undefined}>
            <Text style={styles.pageTitle}>Services</Text>
            <Text style={styles.subText}>
              Practice capturing a walk-in before you start.
            </Text>
            <WalkInForm
              services={WALK_IN_DEMO_SERVICES}
              onSubmit={() => {}}
              testID={testID ? `${testID}-walkin-form` : undefined}
            />
          </View>
        )}

        <Pressable
          onPress={nextStep}
          accessibilityRole="button"
          style={styles.primaryBtn}
          testID={testID ? `${testID}-next` : undefined}
        >
          <Text style={styles.primaryBtnText}>
            {isLast ? "Finish setup" : "Next"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: {
    padding: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
    gap: spacing.s4,
  },
  pageTitle: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  subText: { fontSize: 15, color: colors.textMuted, lineHeight: 22 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  errorText: { fontSize: 14, color: colors.error },
  bigIcon: { fontSize: 56, textAlign: "center", marginBottom: spacing.s4 },
  centreContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.pageHorizontal,
    gap: spacing.s4,
  },
  primaryBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
  btnDisabled: { opacity: 0.4 },
  chipSection: { gap: spacing.s2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.foreground },
  chipTextActive: { color: colors.surface, fontWeight: "500" },
  dayChip: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipHasSlot: { borderColor: colors.success },
  slotForm: { gap: spacing.s3 },
  // LocationSwitcherSheet
  sheetBody: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s6,
    gap: spacing.s3,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s3,
    padding: spacing.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  locationText: { flex: 1 },
  locationName: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  locationAddress: { fontSize: 13, color: colors.textMuted },
  // Earnings
  earningsCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.s5,
    alignItems: "center",
    gap: spacing.s2,
  },
  earningsPeriod: { fontSize: 14, color: "rgba(255,255,255,0.8)" },
  earningsAmount: { fontSize: 36, fontWeight: "700", color: colors.surface },
  payoutBtn: {
    marginTop: spacing.s2,
    paddingHorizontal: spacing.s5,
    paddingVertical: spacing.s2,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  payoutBtnText: { fontSize: 14, fontWeight: "600", color: colors.surface },
  lineItemBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s3,
    gap: spacing.s2,
  },
  // Daily close
  tilesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s3,
  },
  tile: {
    flex: 1,
    minWidth: "44%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.s4,
    alignItems: "center",
    gap: spacing.s1,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tileIcon: { fontSize: 28 },
  tileValue: { fontSize: 22, fontWeight: "700", color: colors.foreground },
  tileLabel: { fontSize: 13, color: colors.textMuted },
  exportBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  exportBtnText: { fontSize: 15, fontWeight: "600", color: colors.primary },
  // Onboarding wizard
  stepBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.s2,
    paddingVertical: spacing.s3,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  stepDotActive: { backgroundColor: colors.primary },
  stepContent: { gap: spacing.s4 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.cardPadding,
    paddingTop: spacing.s4,
    paddingBottom: spacing.s5,
    gap: spacing.s4,
  },
});
