/**
 * LanguagePicker.tsx — W32 Batch L
 *
 * Bottom sheet for selecting the app language/locale. Displays a searchable
 * list of supported locales (flag, language name, locale code). Emits the
 * selected locale code on confirm.
 *
 * Props:
 *   visible
 *   locales           — list of supported locales
 *   currentLocale     — currently active locale code
 *   onConfirm(locale) — called with the selected locale code
 *   onDismiss
 *   testID
 */

import { useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { ModalSheet } from "./ModalSheet";
import { colors, radius, spacing } from "./tokens";

export type SupportedLocale = {
  code: string;       // "en-US"
  name: string;       // "English (US)"
  flag: string;       // "🇺🇸"
};

export type LanguagePickerProps = {
  visible: boolean;
  locales: SupportedLocale[];
  currentLocale: string;
  onConfirm: (locale: string) => void;
  onDismiss: () => void;
  testID?: string;
};

export function LanguagePicker({
  visible,
  locales,
  currentLocale,
  onConfirm,
  onDismiss,
  testID,
}: LanguagePickerProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(currentLocale);

  const filtered = query.trim()
    ? locales.filter(
        (l) =>
          l.name.toLowerCase().includes(query.toLowerCase()) ||
          l.code.toLowerCase().includes(query.toLowerCase())
      )
    : locales;

  function handleConfirm() {
    onConfirm(selected);
    onDismiss();
  }

  return (
    <ModalSheet
      visible={visible}
      onClose={onDismiss}
      title="Language & region"
      testID={testID}
    >
      <View style={styles.body}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search languages…"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          accessibilityLabel="Search languages"
          testID={testID ? `${testID}-search` : undefined}
        />

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.code}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          testID={testID ? `${testID}-list` : undefined}
          ListEmptyComponent={
            <Text style={styles.emptyText} testID={testID ? `${testID}-empty` : undefined}>
              {`No languages match "${query}"`}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelected(item.code)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selected === item.code }}
              style={[
                styles.localeRow,
                selected === item.code && styles.localeRowSelected,
              ]}
              testID={testID ? `${testID}-locale-${item.code}` : undefined}
            >
              <Text style={styles.flag}>{item.flag}</Text>
              <View style={styles.localeText}>
                <Text style={styles.localeName}>{item.name}</Text>
                <Text style={styles.localeCode}>{item.code}</Text>
              </View>
              {selected === item.code && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </Pressable>
          )}
        />

        <Pressable
          onPress={handleConfirm}
          accessibilityRole="button"
          style={styles.confirmBtn}
          testID={testID ? `${testID}-confirm` : undefined}
        >
          <Text style={styles.confirmBtnText}>Apply language</Text>
        </Pressable>
      </View>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingBottom: spacing.s6,
    gap: spacing.s3,
    maxHeight: 520,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s3,
    fontSize: 14,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  list: { maxHeight: 320 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center", paddingVertical: spacing.s4 },
  localeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s2,
    borderRadius: radius.md,
    gap: spacing.s3,
  },
  localeRowSelected: { backgroundColor: colors.background },
  flag: { fontSize: 24 },
  localeText: { flex: 1 },
  localeName: { fontSize: 15, fontWeight: "500", color: colors.foreground },
  localeCode: { fontSize: 12, color: colors.textMuted },
  checkmark: { fontSize: 16, color: colors.primary, fontWeight: "700" },
  confirmBtn: {
    height: spacing.touchTarget,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtnText: { fontSize: 15, fontWeight: "600", color: colors.surface },
});
