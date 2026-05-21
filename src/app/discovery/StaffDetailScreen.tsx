/**
 * StaffDetailScreen.tsx — W22/W34 Stream B / Spec §3.3.
 *
 * Staff member detail page with their services and a book CTA.
 * Each service row now has a "Book →" link that opens a ServiceMiniSheet.
 * The mini-sheet CTA fires onBookServiceWithStaff so the shell can pre-fill
 * both service + staff and navigate directly to Step 3 (Date/time).
 */

import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, colors, radius, spacing } from "../../shared/ui";

import {
  formatPrice,
  type SalonServiceSummary,
  type SalonStaffSummary,
  type ServiceAddonSummary,
  type ServiceVariantSummary,
} from "./discoveryHelpers";
import { ServiceMiniSheet } from "./ServiceMiniSheet";

export type StaffDetailScreenProps = {
  staff: SalonStaffSummary & { bio?: string; salonName?: string };
  services: SalonServiceSummary[];

  /** Called when the user taps a service row body → navigate to ServiceDetail. */
  onSelectService: (serviceId: string) => void;
  /**
   * Called when the user completes booking via ServiceMiniSheet CTA.
   * Shell pre-fills service + staff and navigates to Step 3 (Date/time).
   */
  onBookServiceWithStaff?: (
    serviceId: string,
    variantId: string | null,
    addonIds: string[],
  ) => void;
  /** Called by the top-level "Book with this stylist" button → pre-fills staff, Step 1. */
  onBook: () => void;
  onBack: () => void;

  /**
   * Per-service variant/addon data — keyed by serviceId.
   * Passed through to the mini-sheet when the user taps "Book →" on a row.
   */
  serviceVariants?: Record<string, ServiceVariantSummary[]>;
  serviceAddons?: Record<string, ServiceAddonSummary[]>;

  testID?: string;
};

export function StaffDetailScreen({
  staff,
  services,
  onSelectService,
  onBook,
  onBookServiceWithStaff,
  serviceVariants = {},
  serviceAddons = {},
  onBack,
  testID,
}: StaffDetailScreenProps) {
  const [miniSheetServiceId, setMiniSheetServiceId] = useState<string | null>(null);

  const miniSheetService =
    miniSheetServiceId != null ? services.find((s) => s.id === miniSheetServiceId) ?? null : null;

  return (
    <View style={styles.shell} testID={testID ?? "staff-detail"}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Button
          variant="secondary"
          size="small"
          label="Back"
          onPress={onBack}
          testID="staff-detail-back"
        />

        <View style={styles.avatarRow}>
          {staff.imageUrl ? (
            <Image
              source={{ uri: staff.imageUrl }}
              style={styles.avatar}
              accessibilityElementsHidden
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{staff.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.heading} accessibilityRole="header">
            {staff.name}
          </Text>
        </View>
        <Text style={styles.metaLine}>
          {staff.role}
          {staff.salonName ? ` • ${staff.salonName}` : ""}
        </Text>

        {staff.rating != null && (
          <Text style={styles.ratingLine}>
            {"★ "}
            {staff.rating.toFixed(1)}
            {staff.reviewCount != null && staff.reviewCount > 0
              ? `  (${staff.reviewCount} reviews)`
              : ""}
          </Text>
        )}

        {staff.specialties != null && staff.specialties.length > 0 && (
          <View style={styles.tagRow}>
            {staff.specialties.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagLabel}>{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {staff.bio ? <Text style={styles.body}>{staff.bio}</Text> : null}

        <Button label="Book with this stylist" onPress={onBook} testID="staff-detail-book" />

        <Text style={styles.sectionLabel}>Services</Text>
        <View style={styles.list}>
          {services.map((s) => (
            <View key={s.id} style={styles.row}>
              {/* Row body — navigate to full ServiceDetail */}
              <Pressable
                style={styles.rowBody}
                onPress={() => onSelectService(s.id)}
                accessibilityRole="button"
                accessibilityLabel={s.name}
                testID={`staff-detail-service-${s.id}`}
              >
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{s.name}</Text>
                  <Text style={styles.rowMeta}>{s.durationMinutes} min</Text>
                </View>
                <Text style={styles.price}>{formatPrice(s.priceCents)}</Text>
              </Pressable>

              {/* "Book →" link — opens ServiceMiniSheet */}
              {onBookServiceWithStaff != null ? (
                <Pressable
                  style={styles.bookLink}
                  onPress={() => setMiniSheetServiceId(s.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Book ${s.name}`}
                  testID={`staff-detail-service-book-${s.id}`}
                >
                  <Text style={styles.bookLinkText}>Book →</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* ServiceMiniSheet overlay */}
      {miniSheetService != null ? (
        <ServiceMiniSheet
          visible
          onClose={() => setMiniSheetServiceId(null)}
          service={miniSheetService}
          staff={{
            id: staff.id,
            name: staff.name,
            nextAvailableLabel: miniSheetService.nextAvailableLabel,
          }}
          variants={serviceVariants[miniSheetService.id] ?? []}
          addons={serviceAddons[miniSheetService.id] ?? []}
          onBookWithStaff={(variantId, addonIds) => {
            setMiniSheetServiceId(null);
            onBookServiceWithStaff?.(miniSheetService.id, variantId, addonIds);
          }}
          onSeeFullDetails={() => {
            setMiniSheetServiceId(null);
            onSelectService(miniSheetService.id);
          }}
          testID="staff-detail-service-sheet"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: { fontSize: 26, fontWeight: "700", color: colors.foreground, flex: 1 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: spacing.s3, marginTop: spacing.s2 },
  avatar: { width: 64, height: 64, borderRadius: radius.full, backgroundColor: colors.surface, overflow: "hidden" },
  avatarFallback: { backgroundColor: colors.primary10, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 24, fontWeight: "700", color: colors.primary },
  metaLine: { fontSize: 13, color: colors.textMuted },
  ratingLine: { fontSize: 15, fontWeight: "600", color: colors.foreground },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s1 },
  tag: {
    backgroundColor: colors.primary10,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s2,
    paddingVertical: 4,
  },
  tagLabel: { fontSize: 12, fontWeight: "500", color: colors.primary },
  body: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginTop: spacing.s3 },
  list: { gap: spacing.s2 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
  },
  rowBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.s3,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  bookLink: {
    paddingHorizontal: spacing.s3,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  bookLinkText: { fontSize: 13, color: colors.primary, fontWeight: "600" },
});
