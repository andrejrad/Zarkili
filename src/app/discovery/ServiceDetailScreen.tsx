/**
 * ServiceDetailScreen.tsx — W22/W34 Stream B / Spec §3.2.
 *
 * Service detail page reachable from a salon profile or search results.
 * Supports variant chips, add-on chips, team staff section (with StaffMiniSheet),
 * reviews snippets, and a sticky footer CTA.
 */

import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, colors, radius, spacing } from "../../shared/ui";

import {
  formatPrice,
  type SalonProfile,
  type SalonReviewSnippet,
  type SalonServiceSummary,
  type SalonStaffSummary,
  type ServiceAddonSummary,
  type ServiceVariantSummary,
} from "./discoveryHelpers";
import { StaffMiniSheet } from "./StaffMiniSheet";

export type ServiceDetailScreenProps = {
  service: SalonServiceSummary & { description?: string };
  salon: Pick<SalonProfile, "id" | "name" | "city">;

  /** Pricing/duration variants for the service (e.g. "Partial" vs "Full head"). */
  variants?: ServiceVariantSummary[];
  /** Optional add-ons the user can bolt on. */
  addons?: ServiceAddonSummary[];
  /** Staff members filtered to this service type (for the "Our team" section). */
  teamStaff?: SalonStaffSummary[];
  /** Review snippets for the "Reviews" section. */
  reviews?: SalonReviewSnippet[];
  /** W50-DEBT-16: photo gallery. Client photos first, then salon photos. */
  photos?: readonly { url: string; source?: "client" | "salon" }[];

  /** Primary CTA — book with no pre-selected staff (goes to Step 2). */
  onBook: (variantId: string | null, addonIds: string[]) => void;
  /**
   * Fired from the StaffMiniSheet CTA when the user picks a specific stylist.
   * Shell pre-fills staffId + serviceId and navigates to Step 3 (Date/time).
   */
  onBookWithStaff?: (staffId: string, variantId: string | null, addonIds: string[]) => void;
  onBack: () => void;
  testID?: string;
};

export function ServiceDetailScreen({
  service,
  salon,
  variants = [],
  addons = [],
  teamStaff = [],
  reviews = [],
  photos = [],
  onBook,
  onBookWithStaff,
  onBack,
  testID,
}: ServiceDetailScreenProps) {
  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0] ?? null;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    defaultVariant?.id ?? null,
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [staffSheetStaffId, setStaffSheetStaffId] = useState<string | null>(null);

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;
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

  const activeStaffSheet =
    staffSheetStaffId != null ? teamStaff.find((p) => p.id === staffSheetStaffId) ?? null : null;

  return (
    <View style={styles.shell} testID={testID ?? "service-detail"}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        // leave room for the sticky footer
        contentInset={{ bottom: 120 }}
      >
        <Button
          variant="secondary"
          size="small"
          label="Back"
          onPress={onBack}
          testID="service-detail-back"
        />

        {/* W50-DEBT-16: photo gallery — client photos first, then salon photos,
            then a deterministic brand-initial fallback tile. */}
        {photos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.gallery}
            contentContainerStyle={styles.galleryContent}
            testID="service-detail-gallery"
          >
            {[...photos]
              .sort((a, b) => {
                // "client" sorts before "salon" before undefined
                const rank = (s?: string) => (s === "client" ? 0 : s === "salon" ? 1 : 2);
                return rank(a.source) - rank(b.source);
              })
              .map((p, idx) => (
                <Image
                  key={`${p.url}-${idx}`}
                  source={{ uri: p.url }}
                  style={styles.galleryImage}
                  accessibilityLabel={`${service.name} photo ${idx + 1}`}
                />
              ))}
          </ScrollView>
        ) : (
          <View style={styles.galleryFallback} testID="service-detail-gallery-fallback">
            <Text style={styles.galleryFallbackText}>
              {(salon.name || "?")
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() ?? "")
                .join("")}
            </Text>
          </View>
        )}

        <Text style={styles.salonLine}>
          {salon.name} • {salon.city}
        </Text>
        <Text style={styles.heading} accessibilityRole="header">
          {service.name}
        </Text>

        {/* Duration · price */}
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>{totalDuration} min</Text>
          <Text style={styles.metaItem}>•</Text>
          <Text style={styles.metaItem}>{formatPrice(totalPrice)}</Text>
        </View>

        {/* Description */}
        {service.description ? <Text style={styles.body}>{service.description}</Text> : null}

        {/* Variant chips */}
        {variants.length > 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Options</Text>
            <View style={styles.chipRow}>
              {variants.map((v) => {
                const selected = selectedVariantId === v.id;
                return (
                  <Pressable
                    key={v.id}
                    style={[styles.variantChip, selected && styles.variantChipSelected]}
                    onPress={() => setSelectedVariantId(v.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${v.name}, ${formatPrice(v.price)}`}
                    testID={`service-detail-variant-${v.id}`}
                  >
                    <Text
                      style={[styles.variantChipText, selected && styles.variantChipTextSelected]}
                    >
                      {v.name} · {formatPrice(v.price)}
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
                    testID={`service-detail-addon-${a.id}`}
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

        {/* Our team */}
        {teamStaff.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Our team</Text>
            <View style={styles.list}>
              {teamStaff.map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.staffRow}
                  onPress={() => setStaffSheetStaffId(p.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Book with ${p.name}`}
                  testID={`service-detail-staff-${p.id}`}
                >
                  <View style={styles.staffRowInfo}>
                    <Text style={styles.staffRowName}>{p.name}</Text>
                    <Text style={styles.staffRowRole}>{p.role}</Text>
                    {p.nextAvailableLabel ? (
                      <Text style={styles.staffAvailLabel}>{p.nextAvailableLabel}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.staffBookLink}>Book with {p.name} →</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Reviews */}
        {reviews.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Reviews</Text>
            <View style={styles.list}>
              {reviews.map((r) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewAuthor}>{r.authorName}</Text>
                    <Text style={styles.reviewRating}>★ {r.rating}</Text>
                  </View>
                  <Text style={styles.reviewText}>{r.text}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky booking footer */}
      <View style={styles.footer}>
        <View style={styles.footerPriceRow}>
          <Text style={styles.footerDuration}>{totalDuration} min</Text>
          <Text style={styles.footerPrice}>{formatPrice(totalPrice)}</Text>
        </View>
        <Button
          label="Book this service →"
          onPress={() => onBook(selectedVariantId, selectedAddonIds)}
          testID="service-detail-book"
        />
      </View>

      {/* Staff mini-sheet overlay */}
      {activeStaffSheet != null ? (
        <StaffMiniSheet
          visible
          onClose={() => setStaffSheetStaffId(null)}
          staff={activeStaffSheet}
          service={{ id: service.id, name: service.name }}
          onBookWithStaff={() => {
            setStaffSheetStaffId(null);
            onBookWithStaff?.(activeStaffSheet.id, selectedVariantId, selectedAddonIds);
          }}
          testID="service-detail-staff-sheet"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  salonLine: { fontSize: 13, color: colors.textMuted, marginTop: spacing.s2 },

  // W50-DEBT-16: photo gallery styles
  gallery: { marginTop: spacing.s2, marginHorizontal: -spacing.s3 },
  galleryContent: { paddingHorizontal: spacing.s3, gap: spacing.s2 },
  galleryImage: { width: 280, height: 158, borderRadius: radius.md, backgroundColor: colors.border },
  galleryFallback: {
    marginTop: spacing.s2,
    height: 158,
    borderRadius: radius.md,
    backgroundColor: "#FBEAF0",
    alignItems: "center",
    justifyContent: "center",
  },
  galleryFallbackText: { fontSize: 36, fontWeight: "700", color: "#993556" },
  heading: { fontSize: 26, fontWeight: "700", color: colors.foreground },
  metaRow: { flexDirection: "row", gap: spacing.s2, alignItems: "center" },
  metaItem: { fontSize: 14, color: colors.foreground },
  body: { fontSize: 14, color: colors.foreground, lineHeight: 20 },

  section: { gap: spacing.s2 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  list: { gap: spacing.s2 },

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

  staffRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s3,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
  },
  staffRowInfo: { flex: 1 },
  staffRowName: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  staffRowRole: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  staffAvailLabel: { fontSize: 12, color: "#0F6E56", marginTop: 2 },
  staffBookLink: { fontSize: 13, color: colors.primary, fontWeight: "500" },

  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s3,
    gap: spacing.s1,
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between" },
  reviewAuthor: { fontSize: 13, fontWeight: "600", color: colors.foreground },
  reviewRating: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  reviewText: { fontSize: 13, color: colors.foreground, lineHeight: 18 },

  footer: {
    backgroundColor: colors.background,
    padding: spacing.s3,
    paddingBottom: spacing.s4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.s2,
  },
  footerPriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerDuration: { fontSize: 13, color: colors.textMuted },
  footerPrice: { fontSize: 18, fontWeight: "700", color: colors.foreground },
});
