/**
 * ServiceDetailScreen.tsx — B.6 Service Detail.
 *
 * Service hero + duration + price + description + staff list (optional)
 * + add-ons + sticky "Choose time" CTA.
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  StaffAvatarList,
  StickyCtaBar,
  colors,
  radius,
  spacing,
  textStyles,
  type StaffAvatarItem,
} from "../../shared/ui";

export type ServiceDetailAddOn = {
  id: string;
  name: string;
  priceLabel: string;
  durationLabel?: string;
};

export type ServiceDetailSummary = {
  id: string;
  name: string;
  imageUri?: string;
  durationLabel: string;
  priceLabel: string;
  description?: string;
  bookingEnabled: boolean;
};

export type ServiceDetailScreenProps = {
  service: ServiceDetailSummary;
  staff: StaffAvatarItem[];
  addOns: ServiceDetailAddOn[];
  selectedStaffId?: string | null;
  selectedAddOnIds?: string[];
  onSelectStaff?: (staff: StaffAvatarItem | null) => void;
  onToggleAddOn?: (id: string, next: boolean) => void;
  onPressChooseTime?: () => void;
  testID?: string;
};

export function ServiceDetailScreen({
  service,
  staff,
  addOns,
  selectedStaffId,
  selectedAddOnIds = [],
  onSelectStaff,
  onToggleAddOn,
  onPressChooseTime,
  testID,
}: ServiceDetailScreenProps) {
  const [localStaff, setLocalStaff] = useState<string | null>(selectedStaffId ?? null);
  const [localAddOns, setLocalAddOns] = useState<string[]>(selectedAddOnIds);

  function handleSelectStaff(item: StaffAvatarItem) {
    const next = localStaff === item.id ? null : item.id;
    setLocalStaff(next);
    onSelectStaff?.(next === null ? null : item);
  }

  function handleToggleAddOn(id: string) {
    const exists = localAddOns.includes(id);
    const next = exists ? localAddOns.filter((x) => x !== id) : [...localAddOns, id];
    setLocalAddOns(next);
    onToggleAddOn?.(id, !exists);
  }

  return (
    <View style={styles.container} testID={testID}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroImage} />
          <Text style={styles.title} accessibilityRole="header">
            {service.name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{service.durationLabel}</Text>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.priceText}>{service.priceLabel}</Text>
          </View>
          {service.description ? (
            <Text style={styles.description}>{service.description}</Text>
          ) : null}
        </View>

        {staff.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Staff</Text>
            <StaffAvatarList
              items={staff}
              selectedId={localStaff}
              onPressItem={handleSelectStaff}
              testID={testID ? `${testID}-staff` : undefined}
            />
          </View>
        ) : null}

        {addOns.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add-ons</Text>
            <View style={styles.addOnList}>
              {addOns.map((a) => {
                const selected = localAddOns.includes(a.id);
                return (
                  <Pressable
                    key={a.id}
                    onPress={() => handleToggleAddOn(a.id)}
                    style={[styles.addOnRow, selected && styles.addOnRowSelected]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${a.name}, ${a.priceLabel}`}
                    testID={testID ? `${testID}-addon-${a.id}` : undefined}
                  >
                    <View style={styles.addOnBody}>
                      <Text style={styles.addOnName}>{a.name}</Text>
                      {a.durationLabel ? (
                        <Text style={styles.addOnMeta}>{a.durationLabel}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.addOnPrice}>{a.priceLabel}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </ScrollView>

      <StickyCtaBar
        primaryLabel="Choose time"
        onPrimaryPress={onPressChooseTime ?? (() => {})}
        primaryDisabled={!service.bookingEnabled}
        primaryTestID={testID ? `${testID}-choose-time` : undefined}
        testID={testID ? `${testID}-cta` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.s12, gap: spacing.s5 },
  hero: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
    gap: spacing.s2,
  },
  heroImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.disabledBg,
    borderRadius: radius.lg,
    marginBottom: spacing.s3,
  },
  title: { ...textStyles.heading1, color: colors.foreground },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.s2 },
  metaText: { ...textStyles.body, color: colors.textMuted },
  metaDot: { ...textStyles.body, color: colors.textMuted },
  priceText: { ...textStyles.heading3, color: colors.coralBlossom },
  description: { ...textStyles.body, color: colors.foreground, marginTop: spacing.s2 },
  section: { gap: spacing.s2 },
  sectionTitle: {
    ...textStyles.heading3,
    color: colors.foreground,
    paddingHorizontal: spacing.pageHorizontal,
  },
  addOnList: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: spacing.s2,
  },
  addOnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.cardPadding,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
  },
  addOnRowSelected: {
    borderColor: colors.coralBlossom,
    backgroundColor: colors.primary10,
  },
  addOnBody: { flex: 1, gap: spacing.s1 },
  addOnName: { ...textStyles.heading4, color: colors.foreground },
  addOnMeta: { ...textStyles.bodySmall, color: colors.textMuted },
  addOnPrice: { ...textStyles.heading4, color: colors.coralBlossom },
});
