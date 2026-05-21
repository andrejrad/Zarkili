/**
 * ServiceDetailScreen.tsx — Phase 5.9 Service Detail (full rewrite).
 *
 * Layout:
 *   1. ← Back + Save icon
 *   2. Photo gallery (horizontal scroll, client photos first)
 *   3. Service name + "at locationDisplayName" + rating
 *   4. Description (optional)
 *   5. Variant picker (only when > 1 variant)
 *   6. Add-ons (optional, multi-select chips)
 *   7. "Our team at [location]" — technician cards
 *   8. Reviews (star breakdown + recent)
 *   9. Sticky footer: duration · price + CTA
 */

import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  ServiceDetailObject,
  ServiceVariantObject,
  ServiceAddonObject,
  TechnicianCardObject,
  ReviewObject,
} from "../../domains/discovery";
import {
  colors,
  radius,
  spacing,
  textStyles,
} from "../../shared/ui";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ServiceDetailScreenProps = {
  service: ServiceDetailObject;
  isLoggedIn?: boolean;
  isSaved?: boolean | null;
  initialTechnicianId?: string | null;
  onBack?: () => void;
  onToggleSave?: (serviceId: string, next: boolean) => void;
  onLocationPress?: (locationId: string) => void;
  onContinueToTimeSlots?: (params: {
    serviceId: string;
    variantId: string;
    addonIds: string[];
    technicianId: string | null;
    totalPrice: number;
    totalMinutes: number;
  }) => void;
  onCallToBook?: (phone: string) => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes} min`;
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(0)}`;
}

function relativeDate(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = now - then;
  const days = Math.round(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) return `${Math.round(days / 30)} months ago`;
  return `${Math.round(days / 365)} years ago`;
}

function reviewerInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0] ?? ""} ${(parts[parts.length - 1] ?? "")[0] ?? ""}.`;
  }
  return name;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function VariantChip({
  variant,
  selected,
  onPress,
}: {
  variant: ServiceVariantObject;
  selected: boolean;
  onPress: (v: ServiceVariantObject) => void;
}) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={() => onPress(variant)}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${variant.name}, ${formatDuration(variant.durationMinutes)}, ${formatPrice(variant.price)}`}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {variant.name}
      </Text>
      <Text style={[styles.chipSub, selected && styles.chipSubSelected]}>
        {formatDuration(variant.durationMinutes)} · {formatPrice(variant.price)}
      </Text>
    </Pressable>
  );
}

function AddonChip({
  addon,
  selected,
  onPress,
  testID,
}: {
  addon: ServiceAddonObject;
  selected: boolean;
  onPress: (a: ServiceAddonObject) => void;
  testID?: string;
}) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={() => onPress(addon)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${addon.name} +${formatPrice(addon.price)}`}
      testID={testID}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {addon.name} +{formatPrice(addon.price)}
      </Text>
    </Pressable>
  );
}

function TechnicianCard({
  tech,
  selected,
  onPress,
}: {
  tech: TechnicianCardObject;
  selected: boolean;
  onPress: (t: TechnicianCardObject) => void;
}) {
  return (
    <Pressable
      style={[styles.techCard, selected && styles.techCardSelected]}
      onPress={() => onPress(tech)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={[
        tech.firstName,
        tech.specialtyTags.join(", "),
        tech.averageRating != null
          ? `${tech.averageRating.toFixed(1)} stars`
          : "New",
      ].join(", ")}
    >
      {tech.avatarUrl ? (
        <Image
          source={{ uri: tech.avatarUrl }}
          style={styles.techAvatar}
          accessibilityElementsHidden
        />
      ) : (
        <View style={[styles.techAvatar, styles.techAvatarFallback]}>
          <Text style={styles.techAvatarInitial}>
            {tech.firstName[0]?.toUpperCase() ?? "?"}
          </Text>
        </View>
      )}
      <Text style={styles.techName} numberOfLines={1}>
        {tech.firstName}
      </Text>
      <Text style={styles.techRating} numberOfLines={1}>
        {tech.averageRating != null
          ? `${tech.averageRating.toFixed(1)} ★`
          : "New"}
      </Text>
      {tech.specialtyTags.slice(0, 3).map((tag) => (
        <Text key={tag} style={styles.techTag} numberOfLines={1}>
          {tag}
        </Text>
      ))}
      {tech.nextAvailableAt ? (
        <Text style={styles.techNext} numberOfLines={1}>
          Next: {relativeDate(tech.nextAvailableAt)}
        </Text>
      ) : null}
    </Pressable>
  );
}

function ReviewCard({ review }: { review: ReviewObject }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewerName}>{reviewerInitials(review.reviewerName)}</Text>
        <Text style={styles.reviewRating}>{"★".repeat(review.rating)}</Text>
        <Text style={styles.reviewDate}>{relativeDate(review.createdAt)}</Text>
      </View>
      <Text style={styles.reviewBody}>{review.body}</Text>
      {review.technicianComment ? (
        <View style={styles.techComment}>
          <Text style={styles.techCommentText}>{review.technicianComment}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ServiceDetailScreen({
  service,
  isLoggedIn = false,
  isSaved,
  initialTechnicianId,
  onBack,
  onToggleSave,
  onLocationPress,
  onContinueToTimeSlots,
  onCallToBook,
  testID,
}: ServiceDetailScreenProps) {
  const {
    serviceId,
    locationId,
    serviceName,
    locationDisplayName,
    description,
    variantLabel,
    variants,
    addons,
    photos,
    technicians,
    reviewSummary,
    isBookableOnline,
    locationPhone,
  } = service;

  const defaultVariant =
    variants.find((v) => v.isDefault) ?? variants[0] ?? null;

  const [selectedVariant, setSelectedVariant] =
    useState<ServiceVariantObject | null>(defaultVariant);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(
    initialTechnicianId ?? null
  );
  const [savedState, setSavedState] = useState<boolean | null>(
    isSaved ?? null
  );

  // Live price / duration
  const basePrice = selectedVariant?.price ?? 0;
  const baseDuration = selectedVariant?.durationMinutes ?? 0;
  const selectedAddons = addons.filter((a) => selectedAddonIds.includes(a.addonId));
  const totalPrice =
    basePrice + selectedAddons.reduce((s, a) => s + a.price, 0);
  const totalMinutes =
    baseDuration + selectedAddons.reduce((s, a) => s + a.durationMinutes, 0);

  const footerLabel =
    totalMinutes > 0
      ? `${formatDuration(totalMinutes)}  ·  ${formatPrice(totalPrice)}`
      : formatPrice(totalPrice);

  const ctaEnabled = selectedVariant != null;

  function toggleAddon(addon: ServiceAddonObject) {
    setSelectedAddonIds((prev) =>
      prev.includes(addon.addonId)
        ? prev.filter((id) => id !== addon.addonId)
        : [...prev, addon.addonId]
    );
  }

  function handleTechPress(tech: TechnicianCardObject) {
    setSelectedTechId((prev) =>
      prev === tech.staffId ? null : tech.staffId
    );
  }

  function handleContinue() {
    onContinueToTimeSlots?.({
      serviceId,
      variantId: selectedVariant?.variantId ?? "",
      addonIds: selectedAddonIds,
      technicianId: selectedTechId,
      totalPrice,
      totalMinutes,
    });
  }

  // Sort photos: client first
  const sortedPhotos = [...photos].sort((a, b) => {
    if (a.source === "client" && b.source !== "client") return -1;
    if (b.source === "client" && a.source !== "client") return 1;
    return 0;
  });

  const ratingLabel =
    reviewSummary.averageRating != null
      ? `${reviewSummary.averageRating.toFixed(1)} ★ (${reviewSummary.totalCount})`
      : null;

  return (
    <View style={styles.container} testID={testID}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable
          onPress={onBack}
          style={styles.navBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
          testID={testID ? `${testID}-back` : undefined}
        >
          <Text style={styles.navBtnText}>← Back</Text>
        </Pressable>
        {isLoggedIn ? (
          <Pressable
            onPress={() => {
              const next = !(savedState ?? false);
              setSavedState(next);
              onToggleSave?.(serviceId, next);
            }}
            style={styles.navBtn}
            accessibilityRole="button"
            accessibilityLabel={
              savedState ? `Remove ${serviceName} from saved` : `Save ${serviceName}`
            }
            testID={testID ? `${testID}-save` : undefined}
          >
            <Text style={styles.saveIcon}>{savedState ? "♥" : "♡"}</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Photo gallery */}
        {sortedPhotos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photoGallery}
            contentContainerStyle={styles.photoGalleryContent}
            testID={testID ? `${testID}-gallery` : undefined}
          >
            {sortedPhotos.map((p, i) => (
              <Image
                key={i}
                source={{ uri: p.url }}
                style={styles.galleryPhoto}
                resizeMode="cover"
                accessibilityElementsHidden
              />
            ))}
          </ScrollView>
        ) : (
          <View
            style={styles.photoPlaceholder}
            accessibilityElementsHidden
            testID={testID ? `${testID}-photo-placeholder` : undefined}
          />
        )}

        {/* Service name + location + rating */}
        <View style={styles.identity}>
          <Text
            style={styles.serviceName}
            accessibilityRole="header"
            testID={testID ? `${testID}-name` : undefined}
          >
            {serviceName}
          </Text>
          <Pressable
            onPress={() => onLocationPress?.(locationId)}
            accessibilityRole="link"
            accessibilityLabel={`View ${locationDisplayName}`}
          >
            <Text style={styles.locationLabel}>at {locationDisplayName}</Text>
          </Pressable>
          {ratingLabel ? (
            <Text style={styles.ratingLabel}>{ratingLabel}</Text>
          ) : (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>New</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {description ? (
          <Text
            style={styles.description}
            testID={testID ? `${testID}-description` : undefined}
          >
            {description}
          </Text>
        ) : null}

        {/* Variant picker */}
        {variants.length > 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {variantLabel ?? "Options"}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
              accessibilityRole="radiogroup"
            >
              {variants.map((v) => (
                <VariantChip
                  key={v.variantId}
                  variant={v}
                  selected={selectedVariant?.variantId === v.variantId}
                  onPress={setSelectedVariant}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Add-ons */}
        {addons.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add-ons (optional)</Text>
            <View style={styles.chipRow}>
              {addons.map((a) => (
                <AddonChip
                  key={a.addonId}
                  addon={a}
                  selected={selectedAddonIds.includes(a.addonId)}
                  onPress={toggleAddon}
                  testID={testID ? `${testID}-addon-${a.addonId}` : undefined}
                />
              ))}
            </View>
          </View>
        ) : null}

        {/* Technician cards */}
        {technicians.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Our team at {locationDisplayName.split("·")[0]?.trim() ?? locationDisplayName}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.techRow}
            >
              {technicians.map((t) => (
                <TechnicianCard
                  key={t.staffId}
                  tech={t}
                  selected={selectedTechId === t.staffId}
                  onPress={handleTechPress}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Reviews */}
        {reviewSummary.totalCount > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviewSummary.averageRating != null ? (
              <View style={styles.ratingSummary}>
                <Text style={styles.ratingLarge}>
                  {reviewSummary.averageRating.toFixed(1)}
                </Text>
                <Text style={styles.ratingStars}>★★★★★</Text>
                <Text style={styles.ratingCountText}>
                  {reviewSummary.totalCount} reviews
                </Text>
              </View>
            ) : null}
            {reviewSummary.recentReviews.map((r) => (
              <ReviewCard key={r.reviewId} review={r} />
            ))}
          </View>
        ) : null}

        {/* Spacer for sticky footer */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Sticky footer */}
      <View
        style={styles.stickyFooter}
        testID={testID ? `${testID}-footer` : undefined}
      >
        <Text style={styles.footerLabel}>{footerLabel}</Text>
        {isBookableOnline ? (
          <Pressable
            style={[styles.ctaBtn, !ctaEnabled && styles.ctaBtnDisabled]}
            onPress={ctaEnabled ? handleContinue : undefined}
            disabled={!ctaEnabled}
            accessibilityRole="button"
            accessibilityLabel="Continue to time slots"
            accessibilityState={{ disabled: !ctaEnabled }}
            testID={testID ? `${testID}-choose-time` : undefined}
          >
            <Text style={styles.ctaBtnText}>Continue to time slots →</Text>
          </Pressable>
        ) : locationPhone ? (
          <Pressable
            style={styles.ctaBtn}
            onPress={() => onCallToBook?.(locationPhone)}
            accessibilityRole="button"
            accessibilityLabel="Call to book"
            testID={testID ? `${testID}-call` : undefined}
          >
            <Text style={styles.ctaBtnText}>Call to book</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.s6,
    paddingBottom: spacing.s2,
  },
  navBtn: {
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.s2,
  },
  navBtnText: { ...textStyles.label, color: colors.foreground },
  saveIcon: { fontSize: 22, color: colors.primary },
  scroll: { flex: 1 },
  scrollContent: { gap: spacing.s5, paddingBottom: spacing.s4 },
  photoGallery: { flexGrow: 0 },
  photoGalleryContent: { gap: spacing.s2, paddingHorizontal: spacing.pageHorizontal },
  galleryPhoto: {
    width: 320,
    height: 180,
    borderRadius: radius.lg,
  },
  photoPlaceholder: {
    marginHorizontal: spacing.pageHorizontal,
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
  },
  identity: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: spacing.s1,
  },
  serviceName: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.foreground,
    lineHeight: 32,
  },
  locationLabel: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  ratingLabel: {
    ...textStyles.body,
    color: colors.textMuted,
  },
  newBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s2,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  newBadgeText: { ...textStyles.labelSmall, color: colors.accentForeground },
  description: {
    ...textStyles.body,
    color: colors.foreground,
    paddingHorizontal: spacing.pageHorizontal,
  },
  section: { gap: spacing.s3, paddingHorizontal: spacing.pageHorizontal },
  sectionTitle: { ...textStyles.heading3, color: colors.foreground },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
  },
  chip: {
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  chipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary10,
  },
  chipText: { ...textStyles.label, color: colors.foreground },
  chipTextSelected: { color: colors.primary },
  chipSub: { ...textStyles.bodySmall, color: colors.textMuted },
  chipSubSelected: { color: colors.primary },
  // Technician cards
  techRow: { gap: spacing.s3, paddingBottom: spacing.s1 },
  techCard: {
    width: 100,
    alignItems: "center",
    gap: spacing.s1,
    padding: spacing.s2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  techCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary10,
  },
  techAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceMuted,
  },
  techAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  techAvatarInitial: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.textMuted,
  },
  techName: { ...textStyles.label, color: colors.foreground, textAlign: "center" },
  techRating: { ...textStyles.bodySmall, color: colors.textMuted, textAlign: "center" },
  techTag: { ...textStyles.labelSmall, color: colors.textMuted, textAlign: "center" },
  techNext: { ...textStyles.labelSmall, color: colors.primary, textAlign: "center" },
  // Rating summary
  ratingSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
  },
  ratingLarge: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.foreground,
  },
  ratingStars: { fontSize: 20, color: "#F5A623" },
  ratingCountText: { ...textStyles.body, color: colors.textMuted },
  // Review card
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.s4,
    gap: spacing.s2,
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
  },
  reviewerName: { ...textStyles.label, color: colors.foreground, flex: 1 },
  reviewRating: { fontSize: 14, color: "#F5A623" },
  reviewDate: { ...textStyles.bodySmall, color: colors.textMuted },
  reviewBody: { ...textStyles.body, color: colors.foreground },
  techComment: {
    backgroundColor: "#E8F5F2",
    borderLeftWidth: 3,
    borderLeftColor: "#2D8A7A",
    borderRadius: radius.sm,
    padding: spacing.s3,
  },
  techCommentText: { ...textStyles.body, color: "#1A4D44" },
  // Sticky footer
  footerSpacer: { height: 80 },
  stickyFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.pageHorizontal,
    paddingVertical: spacing.s3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.s3,
  },
  footerLabel: {
    ...textStyles.heading4,
    color: colors.foreground,
    flex: 1,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s3,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaBtnDisabled: {
    backgroundColor: colors.disabledBg,
  },
  ctaBtnText: {
    ...textStyles.label,
    color: colors.white,
  },
});



