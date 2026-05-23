/**
 * I18nSettingsScreen.tsx — W32 Batch L (L.4)
 *
 * Internationalization settings screens.
 *
 * Exports:
 *   LanguagePickerScreen       — full-page language/locale selection
 *   LocaleFormatsScreen        — date, time, currency format preview + override
 *   LanguageSwitchConfirmSheet — confirmation sheet before applying a new locale
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

import { LanguagePicker } from "../../shared/ui/LanguagePicker";
import { ModalSheet } from "../../shared/ui/ModalSheet";
import { SegmentedControl } from "../../shared/ui/SegmentedControl";
import { SummaryRow } from "../../shared/ui/SummaryRow";
import { colors, radius, spacing } from "../../shared/ui/tokens";

// ---------------------------------------------------------------------------
// Supported locales catalogue
// ---------------------------------------------------------------------------

export type SupportedLocale = {
  code: string;
  name: string;
  flag: string;
};

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: "en-US", name: "English (US)", flag: "🇺🇸" },
  { code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
  { code: "de-DE", name: "German (Germany)", flag: "🇩🇪" },
  { code: "hr-HR", name: "Croatian (Croatia)", flag: "🇭🇷" },
  { code: "es-ES", name: "Spanish (Spain)", flag: "🇪🇸" },
  { code: "fr-FR", name: "French (France)", flag: "🇫🇷" },
  { code: "it-IT", name: "Italian (Italy)", flag: "🇮🇹" },
  { code: "pt-BR", name: "Portuguese (Brazil)", flag: "🇧🇷" },
];

// ---------------------------------------------------------------------------
// LanguagePickerScreen
// ---------------------------------------------------------------------------

export type LanguagePickerScreenProps = {
  currentLocale: string;
  onApply: (locale: string) => void;
  testID?: string;
};

export function LanguagePickerScreen({
  currentLocale,
  onApply,
  testID,
}: LanguagePickerScreenProps) {
  const [pickerVisible, setPickerVisible] = useState(true);

  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <LanguagePicker
        visible={pickerVisible}
        locales={SUPPORTED_LOCALES}
        currentLocale={currentLocale}
        onConfirm={(locale) => {
          setPickerVisible(false);
          onApply(locale);
        }}
        onDismiss={() => setPickerVisible(false)}
        testID={testID ? `${testID}-picker` : undefined}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// LocaleFormatsScreen
// ---------------------------------------------------------------------------

type DateFormat = "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
type TimeFormat = "12h" | "24h";

export type LocaleFormatsScreenProps = {
  currentLocale: string;
  onSave: (prefs: { dateFormat: DateFormat; timeFormat: TimeFormat }) => void;
  testID?: string;
};

const SAMPLE_DATE = new Date(2026, 3, 29, 14, 30); // April 29 2026 14:30

function formatDate(d: Date, fmt: DateFormat) {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  if (fmt === "MM/DD/YYYY") return `${mm}/${dd}/${yyyy}`;
  if (fmt === "DD/MM/YYYY") return `${dd}/${mm}/${yyyy}`;
  return `${yyyy}-${mm}-${dd}`;
}

function formatTime(d: Date, fmt: TimeFormat) {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  if (fmt === "24h") return `${String(h).padStart(2, "0")}:${m}`;
  const h12 = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";
  return `${h12}:${m} ${ampm}`;
}

export function LocaleFormatsScreen({
  currentLocale,
  onSave,
  testID,
}: LocaleFormatsScreenProps) {
  const defaultDate: DateFormat = currentLocale.startsWith("en-US") ? "MM/DD/YYYY" : "DD/MM/YYYY";
  const defaultTime: TimeFormat = currentLocale.startsWith("en-US") ? "12h" : "24h";

  const [dateFormat, setDateFormat] = useState<DateFormat>(defaultDate);
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(defaultTime);

  return (
    <SafeAreaView style={styles.safe} testID={testID}>
      <ScrollView contentContainerStyle={styles.page}>
        <Text style={styles.pageTitle}>Date & time formats</Text>
        <Text style={styles.subtitle}>
          These settings override your system defaults within Zarkili.
        </Text>

        <Text style={styles.sectionLabel}>Date format</Text>
        <SegmentedControl<DateFormat>
          options={[
            { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
            { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
            { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
          ]}
          value={dateFormat}
          onChange={setDateFormat}
          testID={testID ? `${testID}-date-format` : undefined}
        />

        <Text style={styles.sectionLabel}>Time format</Text>
        <SegmentedControl<TimeFormat>
          options={[
            { value: "12h", label: "12-hour (AM/PM)" },
            { value: "24h", label: "24-hour" },
          ]}
          value={timeFormat}
          onChange={setTimeFormat}
          testID={testID ? `${testID}-time-format` : undefined}
        />

        <View style={styles.previewBox} testID={testID ? `${testID}-preview` : undefined}>
          <Text style={styles.previewLabel}>Preview</Text>
          <SummaryRow
            label="Date"
            value={formatDate(SAMPLE_DATE, dateFormat)}
            testID={testID ? `${testID}-preview-date` : undefined}
          />
          <SummaryRow
            label="Time"
            value={formatTime(SAMPLE_DATE, timeFormat)}
            noDivider
            testID={testID ? `${testID}-preview-time` : undefined}
          />
        </View>

        <Pressable
          onPress={() => onSave({ dateFormat, timeFormat })}
          accessibilityRole="button"
          style={styles.saveBtn}
          testID={testID ? `${testID}-save` : undefined}
        >
          <Text style={styles.saveBtnText}>Save preferences</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// LanguageSwitchConfirmSheet
// ---------------------------------------------------------------------------

export type LanguageSwitchConfirmSheetProps = {
  visible: boolean;
  fromLocale: string;
  toLocale: string;
  onConfirm: () => void;
  onCancel: () => void;
  testID?: string;
};

export function LanguageSwitchConfirmSheet({
  visible,
  fromLocale,
  toLocale,
  onConfirm,
  onCancel,
  testID,
}: LanguageSwitchConfirmSheetProps) {
  const from = SUPPORTED_LOCALES.find((l) => l.code === fromLocale);
  const to = SUPPORTED_LOCALES.find((l) => l.code === toLocale);

  return (
    <ModalSheet
      visible={visible}
      onClose={onCancel}
      title="Switch language?"
      testID={testID}
    >
      <View style={styles.confirmBody}>
        <Text style={styles.confirmText} testID={testID ? `${testID}-body` : undefined}>
          The app will switch from{" "}
          <Text style={styles.bold}>{from?.name ?? fromLocale}</Text> to{" "}
          <Text style={styles.bold}>{to?.name ?? toLocale}</Text>. The app will
          reload to apply the change.
        </Text>

        <Pressable
          onPress={onConfirm}
          accessibilityRole="button"
          style={styles.saveBtn}
          testID={testID ? `${testID}-confirm` : undefined}
        >
          <Text style={styles.saveBtnText}>Switch & reload</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          testID={testID ? `${testID}-cancel` : undefined}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: {
    padding: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
    gap: spacing.s4,
  },
  pageTitle: { fontSize: 24, fontWeight: "700", color: colors.foreground },
  subtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  previewBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: spacing.s4,
    paddingTop: spacing.s3,
  },
  saveBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
  confirmBody: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s6,
    gap: spacing.s4,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 15,
    color: colors.foreground,
    textAlign: "center",
    lineHeight: 22,
  },
  bold: { fontWeight: "700" },
  cancelText: { fontSize: 14, color: colors.textMuted },
});
