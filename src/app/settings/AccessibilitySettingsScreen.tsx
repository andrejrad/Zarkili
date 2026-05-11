/**
 * AccessibilitySettingsScreen.tsx — I.9 Accessibility Settings + Theme Picker.
 *
 * Controls:
 *  - Text size slider: S / M / L / XL with live preview block
 *  - Reduce motion toggle
 *  - High contrast toggle
 *  - VoiceOver hints toggle
 *  - Theme picker: System · Light · Dark (radio cards)
 *
 * States: default | saving | error
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Banner, Button, PreferenceToggleRow, colors, radius, spacing, textStyles } from "../../shared/ui";

export type TextSizeOption = "S" | "M" | "L" | "XL";
export type ThemeOption = "system" | "light" | "dark";
export type AccessibilitySettingsState = "default" | "saving" | "error";

export type AccessibilitySettingsScreenProps = {
  textSize: TextSizeOption;
  reduceMotion: boolean;
  highContrast: boolean;
  voiceOverHints: boolean;
  theme: ThemeOption;
  state?: AccessibilitySettingsState;
  onChangeTextSize: (size: TextSizeOption) => void;
  onChangeReduceMotion: (value: boolean) => void;
  onChangeHighContrast: (value: boolean) => void;
  onChangeVoiceOverHints: (value: boolean) => void;
  onChangeTheme: (theme: ThemeOption) => void;
  onSave: () => void;
  testID?: string;
};

const TEXT_SIZES: TextSizeOption[] = ["S", "M", "L", "XL"];
const TEXT_SIZE_LABELS: Record<TextSizeOption, string> = {
  S: "Small",
  M: "Medium",
  L: "Large",
  XL: "Extra Large",
};
const PREVIEW_FONT_SIZE: Record<TextSizeOption, number> = {
  S: 12,
  M: 14,
  L: 18,
  XL: 22,
};

const THEMES: { value: ThemeOption; label: string; symbol: string }[] = [
  { value: "system", label: "System", symbol: "⬛" },
  { value: "light", label: "Light", symbol: "☀️" },
  { value: "dark", label: "Dark", symbol: "🌙" },
];

export function AccessibilitySettingsScreen({
  textSize,
  reduceMotion,
  highContrast,
  voiceOverHints,
  theme,
  state = "default",
  onChangeTextSize,
  onChangeReduceMotion,
  onChangeHighContrast,
  onChangeVoiceOverHints,
  onChangeTheme,
  onSave,
  testID,
}: AccessibilitySettingsScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      <Text style={styles.heading}>Accessibility & theme</Text>

      {state === "error" ? (
        <Banner
          variant="error"
          message="Failed to save settings. Please try again."
          testID={testID ? `${testID}-error-banner` : undefined}
        />
      ) : null}

      {/* Text size */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Text size</Text>
        <View style={styles.sizeRow} testID={testID ? `${testID}-text-size` : undefined}>
          {TEXT_SIZES.map((size) => (
            <Pressable
              key={size}
              style={[styles.sizeBtn, textSize === size ? styles.sizeBtnActive : null]}
              onPress={() => onChangeTextSize(size)}
              accessibilityRole="radio"
              accessibilityState={{ checked: textSize === size }}
              accessibilityValue={{ text: TEXT_SIZE_LABELS[size] }}
              testID={testID ? `${testID}-size-${size}` : undefined}
            >
              <Text
                style={[
                  styles.sizeBtnLabel,
                  textSize === size ? styles.sizeBtnLabelActive : null,
                ]}
              >
                {size}
              </Text>
            </Pressable>
          ))}
        </View>
        {/* Live preview block */}
        <View style={styles.preview} testID={testID ? `${testID}-preview` : undefined}>
          <Text
            style={{
              fontSize: PREVIEW_FONT_SIZE[textSize],
              lineHeight: PREVIEW_FONT_SIZE[textSize] * 1.5,
              color: colors.foreground,
            }}
          >
            Preview: The quick brown fox jumps over the lazy dog.
          </Text>
        </View>
      </View>

      {/* Toggle options */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Motion & contrast</Text>
        <View style={styles.card}>
          <PreferenceToggleRow
            label="Reduce motion"
            helperText="Minimizes animations and transitions"
            value={reduceMotion}
            onValueChange={onChangeReduceMotion}
            testID={testID ? `${testID}-reduce-motion` : undefined}
          />
          <View style={styles.divider} />
          <PreferenceToggleRow
            label="High contrast"
            helperText="Increases text and UI contrast"
            value={highContrast}
            onValueChange={onChangeHighContrast}
            testID={testID ? `${testID}-high-contrast` : undefined}
          />
          <View style={styles.divider} />
          <PreferenceToggleRow
            label="VoiceOver / TalkBack hints"
            helperText="Show accessibility hints for screen readers"
            value={voiceOverHints}
            onValueChange={onChangeVoiceOverHints}
            testID={testID ? `${testID}-voiceover-hints` : undefined}
          />
        </View>
      </View>

      {/* Theme picker */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Appearance</Text>
        <View style={styles.themeRow} testID={testID ? `${testID}-theme` : undefined}>
          {THEMES.map((t) => (
            <Pressable
              key={t.value}
              style={[
                styles.themeCard,
                theme === t.value ? styles.themeCardSelected : null,
              ]}
              onPress={() => onChangeTheme(t.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: theme === t.value }}
              testID={testID ? `${testID}-theme-${t.value}` : undefined}
            >
              <Text style={styles.themeSymbol}>{t.symbol}</Text>
              <Text
                style={[
                  styles.themeLabel,
                  theme === t.value ? styles.themeLabelSelected : null,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Button
        label={state === "saving" ? "Saving..." : "Save settings"}
        variant="primary"
        disabled={state === "saving"}
        loading={state === "saving"}
        onPress={onSave}
        testID={testID ? `${testID}-save` : undefined}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.pageHorizontal,
    paddingBottom: spacing.s12,
    gap: spacing.s5,
  },
  heading: {
    ...textStyles.heading2,
    color: colors.foreground,
  },
  section: {
    gap: spacing.s3,
  },
  sectionLabel: {
    ...textStyles.label,
    color: colors.foreground,
  },
  sizeRow: {
    flexDirection: "row",
    gap: spacing.s2,
  },
  sizeBtn: {
    flex: 1,
    paddingVertical: spacing.s3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
  },
  sizeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizeBtnLabel: {
    ...textStyles.label,
    color: colors.foreground,
  },
  sizeBtnLabelActive: {
    color: colors.white,
  },
  preview: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    paddingHorizontal: spacing.s4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  themeRow: {
    flexDirection: "row",
    gap: spacing.s3,
  },
  themeCard: {
    flex: 1,
    paddingVertical: spacing.s4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    gap: spacing.s2,
  },
  themeCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary10,
  },
  themeSymbol: {
    fontSize: 24,
  },
  themeLabel: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  themeLabelSelected: {
    color: colors.primary,
    fontWeight: "600",
  },
});
