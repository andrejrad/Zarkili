/**
 * ServiceMiniSheet.tsx — Spec §4.1
 *
 * Bottom sheet that opens from a service row on the Staff Detail screen.
 * Pre-filled: staff (the one whose screen we're on) + service (the row tapped).
 * Manages variant and add-on selection internally.
 * CTA fires onBookWithStaff(variantId, addonIds) — shell navigates to Step 3.
 * Secondary link navigates to the full ServiceDetailScreen.
 */

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ModalSheet } from "../../shared/ui/ModalSheet";
import { Button } from "../../shared/ui/Button";
import { colors, radius, spacing } from "../../shared/ui/tokens";
import {
  formatPrice,
  type ServiceAddonSummary,
  type ServiceVariantSummary,
} from "./discoveryHelpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServiceMiniSheetProps = {
  visible: boolean;
  onClose: () => void;

  /** Service being previewed. */
  service: {
    id: string;
    name: string;
    durationMinutes: number;
    priceCents: number;
    description?: string;
    locationName?: string;
    nextAvailableLabel?: string;
  };
  /** Staff member this sheet is anchored to. */
  staff: {
    id: string;
    name: string;
    /** Human-readable next availability for this service, e.g. "today at 2:00 PM". */
    nextAvailableLabel?: string;
  };

  variants?: readonly ServiceVariantSummary[];
  addons?: readonly ServiceAddonSummary[];

  /**
   * CTA: fires with the final variant + addon selection.
   * Shell pre-fills service + staff and navigates to Step 3 (Date/time).
   */
  onBookWithStaff: (variantId: string | null, addonIds: string[]) => void;
  /** Secondary link: navigates to the full ServiceDetailScreen. */
  onSeeFullDetails: () => void;

  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceMiniSheet({
  visible,
  onClose,
  service,
  staff,
  variants = [],
  addons = [],
  onBookWithStaff,
  onSeeFullDetails,
  testID,
}: ServiceMiniSheetProps) {
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0] ?? null;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    defaultVariant?.id ?? null,
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);

  // Reset selections whenever the service changes (sheet re-opened for another service).
  useEffect(() => {
    const dv = variants.find((v) => v.isDefault) ?? variants[0] ?? null;
    setSelectedVariantId(dv?.id ?? null);
    setSelectedAddonIds([]);
  }, [service.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0] ?? null;
  const totalDuration =
    (selectedVariant?.durationMinutes ?? service.durationMinutes) +
    addons
      .filter((a) => selectedAddonIds.includes(a.id))
      .reduce((sum, a) => sum + a.durationMinutes, 0);
  const totalPrice =
    (selectedVariant?.price ?? service.priceCents) +
    addons
      .filter((a) => selectedAddonIds.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);

  function toggleAddon(addonId: string) {
    setSelectedAddonIds((prev) =>
      prev.includes(addonId) ? prev.filter((id) => id !== addonId) : [...prev, addonId],
    );
  }

  const availabilityLabel = staff.nextAvailableLabel ?? service.nextAvailableLabel;

  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={service.name}
      testID={testID}
      footer={
        <View style={styles.footerCol}>
          <Button
            label={`Book ${service.name} with ${staff.name} \u2192`}
            onPress={() => onBookWithStaff(selectedVariantId, selectedAddonIds)}
            testID={testID ? `${testID}-cta` : undefined}
          />
          <Pressable
            onPress={onSeeFullDetails}
            style={styles.secondaryLink}
            accessibilityRole="button"
            testID={testID ? `${testID}-full-details` : undefined}
          >
            <Text style={styles.secondaryLinkText}>See full service details \u2192</Text>
          </Pressable>
        </View>
      }
    >
      {/* Duration · price · location */}
      <Text style={styles.meta}>
        {totalDuration} min {"\u00b7"} {formatPrice(totalPrice)}
        {service.locationName ? ` \u00b7 ${service.locationName}` : ""}
      </Text>

      {/* Description */}
      {service.description ? (
        <Text style={styles.description}>{service.description}</Text>
      ) : null}

      {/* Variant chips */}
      {variants.length > 1 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Options</Text>
          <View style={styles.chipRow}>
            {variants.map((v) => {
              const selected = (selectedVariantId ?? variants[0]?.id) === v.id;
              return (
                <Pressable
                  key={v.id}
                  style={[styles.variantChip, selected && styles.variantChipSelected]}
                  onPress={() => setSelectedVariantId(v.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${v.name}, ${formatPrice(v.price)}`}
                >
                  <Text
                    style={[styles.variantChipText, selected && styles.variantChipTextSelected]}
                  >
                    {v.name} {"\u00b7"} {formatPrice(v.price)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Add-on chips */}
      {addons.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Add-ons (optional)</Text>
          <View style={styles.chipRow}>
            {addons.map((a) => {
              const selected = selectedAddonIds.includes(a.id);
              return (
                <Pressable
                  key={a.id}
                  style={[styles.addonChip, selected && styles.addonChipSelected]}
                  onPress={() => toggleAddon(a.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${a.name}, +${formatPrice(a.price)}. ${selected ? "checked" : "unchecked"}`}
                >
                  <Text
                    style={[styles.addonChipText, selected && styles.addonChipTextSelected]}
                  >
                    {a.name} +{formatPrice(a.price)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Availability callout */}
      {availabilityLabel ? (
        <View style={styles.availabilityCallout}>
          <Text style={styles.availabilityText}>
            {staff.name} is available {availabilityLabel}
          </Text>
        </View>
      ) : null}
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  meta: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.s1 },
  description: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  section: { gap: spacing.s2, marginTop: spacing.s2 },
  sectionLabel: { fontSize: 13, fontWeight: "600", color: colors.foreground },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },

  variantChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s3,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  variantChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary10 },
  variantChipText: { fontSize: 13, color: colors.foreground },
  variantChipTextSelected: { color: colors.primary, fontWeight: "600" },

  addonChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s3,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  addonChipSelected: { borderColor: "#F4C0D1", backgroundColor: "#FBEAF0" },
  addonChipText: { fontSize: 13, color: colors.foreground },
  addonChipTextSelected: { color: "#993556", fontWeight: "600" },

  availabilityCallout: {
    marginTop: spacing.s3,
    backgroundColor: "#EBF8F3",
    borderRadius: radius.md,
    padding: spacing.s3,
  },
  availabilityText: { fontSize: 13, color: "#0F6E56", fontWeight: "500" },

  footerCol: { gap: spacing.s2 },
  secondaryLink: { alignItems: "center", paddingVertical: spacing.s2 },
  secondaryLinkText: { fontSize: 14, color: colors.primary, fontWeight: "500" },
});
