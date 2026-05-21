/**
 * ServiceTypeCard — Phase 5.4
 *
 * Renders one service in the Explore feed. Replaces DiscoverySalonCard.
 *
 * Layout:
 *   Photo block (16:9)  — progressive load, save icon, member badge
 *   Info block          — name, location, rating, categories, availability, price
 *   Book CTA button
 */

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { ServiceTypeCard as ServiceTypeCardData } from "../../domains/discovery";
import { colors, radius, spacing, textStyles } from "../../shared/ui";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deterministic pastel background colour from tenantId hash */
function tenantColor(tenantId: string): string {
  let h = 0;
  for (let i = 0; i < tenantId.length; i++) {
    h = (h * 31 + tenantId.charCodeAt(i)) & 0xffffffff;
  }
  const hue = Math.abs(h) % 360;
  return `hsl(${hue}, 55%, 70%)`;
}

function formatPrice(price: number, variantCount: number): string {
  const label = price.toFixed(0);
  return variantCount === 1 ? `£${label}` : `from £${label}`;
}

function formatAvailability(
  nextAvailableAt: string | null,
  isFullyBooked: boolean,
  durationFrom: number
): string {
  if (isFullyBooked) return "Fully booked";
  if (!nextAvailableAt) return "";
  const date = new Date(nextAvailableAt);
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  const timeLabel = date.toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const dayLabel = isToday
    ? "Today"
    : date.toLocaleDateString("en-GB", { weekday: "short" });
  const durLabel =
    durationFrom >= 60
      ? `${Math.floor(durationFrom / 60)}h${durationFrom % 60 > 0 ? ` ${durationFrom % 60}m` : ""}`
      : `${durationFrom} min`;
  return `${dayLabel} ${timeLabel} · ${durLabel}`;
}

function formatRating(
  serviceRating: number | null,
  serviceCount: number,
  locationRating: number | null,
  locationCount: number
): string | null {
  if (serviceRating != null) {
    return `${serviceRating.toFixed(1)} ★ (${serviceCount})`;
  }
  if (locationRating != null) {
    return `${locationRating.toFixed(1)} ★ location (${locationCount})`;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export type ServiceTypeCardProps = {
  card: ServiceTypeCardData;
  isLoggedIn: boolean;
  isSaved?: boolean | null;
  onPress?: (card: ServiceTypeCardData) => void;
  onBook?: (card: ServiceTypeCardData) => void;
  onJoinWaitlist?: (card: ServiceTypeCardData) => void;
  onCallToBook?: (card: ServiceTypeCardData) => void;
  onToggleSave?: (card: ServiceTypeCardData, next: boolean) => void;
  onCategoryPress?: (categoryId: string) => void;
  onLocationPress?: (locationId: string) => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServiceTypeCard({
  card,
  isLoggedIn,
  isSaved,
  onPress,
  onBook,
  onJoinWaitlist,
  onCallToBook,
  onToggleSave,
  onCategoryPress,
  onLocationPress,
  testID,
}: ServiceTypeCardProps) {
  const {
    id,
    tenantId,
    locationId,
    categoryId,
    categoryName,
    serviceName,
    locationDisplayName,
    priceFrom,
    variantCount,
    durationFrom,
    serviceAverageRating,
    serviceReviewCount,
    locationAverageRating,
    locationReviewCount,
    nextAvailableAt,
    isFullyBooked,
    primaryPhotoUrl,
    isBookableOnline,
  } = card;

  const ratingLabel = formatRating(
    serviceAverageRating,
    serviceReviewCount,
    locationAverageRating,
    locationReviewCount
  );
  const availabilityLabel = formatAvailability(
    nextAvailableAt,
    isFullyBooked,
    durationFrom
  );
  const priceLabel = formatPrice(priceFrom, variantCount);
  const savedState = isSaved ?? card.isSaved;

  // a11y label
  const a11yLabel = isFullyBooked
    ? `${serviceName} at ${locationDisplayName}, fully booked. Join waitlist.`
    : [
        serviceName,
        `at ${locationDisplayName}`,
        ratingLabel ? `${ratingLabel} stars` : "New",
        priceLabel,
        availabilityLabel ? `available ${availabilityLabel}` : "",
      ]
        .filter(Boolean)
        .join(", ");

  // CTA
  let ctaLabel: string;
  let ctaAction: () => void;
  if (!isBookableOnline) {
    ctaLabel = "Book (coming soon)";
    ctaAction = () => onCallToBook?.(card);
  } else if (isFullyBooked) {
    ctaLabel = "Join waitlist";
    ctaAction = () => onJoinWaitlist?.(card);
  } else {
    ctaLabel = "Book";
    ctaAction = () => onBook?.(card);
  }

  return (
    <Pressable
      style={styles.card}
      onPress={() => onPress?.(card)}
      accessibilityLabel={a11yLabel}
      accessibilityRole="button"
      testID={testID ?? `service-card-${id}`}
    >
      {/* Photo block */}
      <View style={styles.photoBlock}>
        {primaryPhotoUrl ? (
          <Image
            source={{ uri: primaryPhotoUrl }}
            style={styles.photo}
            resizeMode="cover"
            accessibilityElementsHidden
          />
        ) : (
          <View
            style={[
              styles.photo,
              styles.photoFallback,
              { backgroundColor: tenantColor(tenantId) },
            ]}
            accessibilityElementsHidden
          >
            <Text style={styles.fallbackInitials}>
              {(serviceName[0] ?? "S").toUpperCase()}
            </Text>
          </View>
        )}

        {/* Save icon — logged-in only */}
        {isLoggedIn ? (
          <Pressable
            style={styles.saveBtn}
            onPress={() => onToggleSave?.(card, !savedState)}
            accessibilityRole="button"
            accessibilityLabel={
              savedState ? `Remove ${serviceName} from saved` : `Save ${serviceName}`
            }
            hitSlop={8}
          >
            <Text style={styles.saveIcon}>{savedState ? "♥" : "♡"}</Text>
          </Pressable>
        ) : null}

        {/* Member badge — bottom-left, hidden from a11y */}
        {isLoggedIn && card.memberPoints != null ? (
          <View style={styles.memberBadge} accessibilityElementsHidden>
            <Text style={styles.memberBadgeText}>
              Member · {card.memberPoints} pts
            </Text>
          </View>
        ) : null}
      </View>

      {/* Info block */}
      <View style={styles.infoBlock}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {serviceName}
        </Text>

        <Pressable
          onPress={() => onLocationPress?.(locationId)}
          accessibilityRole="link"
          accessibilityLabel={`View ${locationDisplayName}`}
        >
          <Text style={styles.locationLabel} numberOfLines={1}>
            at {locationDisplayName}
          </Text>
        </Pressable>

        <View style={styles.metaRow}>
          {ratingLabel ? (
            <Text style={styles.ratingText}>{ratingLabel}</Text>
          ) : (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>New</Text>
            </View>
          )}
        </View>

        {/* Category chip */}
        {categoryName ? (
          <View style={styles.categoryRow}>
            <Pressable
              onPress={() => onCategoryPress?.(categoryId)}
              style={styles.categoryChip}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${categoryName}`}
            >
              <Text style={styles.categoryChipText}>{categoryName}</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <View style={styles.footerLeft}>
            {isFullyBooked ? (
              <View style={styles.fullyBookedBadge}>
                <Text style={styles.fullyBookedText}>Fully booked</Text>
              </View>
            ) : availabilityLabel ? (
              <Text style={styles.availabilityText} numberOfLines={1}>
                {availabilityLabel}
              </Text>
            ) : null}
            <Text style={styles.priceText}>{priceLabel}</Text>
          </View>

          <Pressable
            style={[
              styles.ctaBtn,
              isFullyBooked && styles.ctaBtnWaitlist,
              !isBookableOnline && styles.ctaBtnCall,
            ]}
            onPress={ctaAction}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
          >
            <Text
              style={[
                styles.ctaBtnText,
                (isFullyBooked || !isBookableOnline) &&
                  styles.ctaBtnTextSecondary,
              ]}
            >
              {ctaLabel}
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const PHOTO_ASPECT = 9 / 16;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginHorizontal: spacing.pageHorizontal,
    marginBottom: spacing.s4,
    shadowColor: colors.foreground,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  photoBlock: {
    width: "100%",
    aspectRatio: 1 / PHOTO_ASPECT, // 16:9
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackInitials: {
    fontSize: 40,
    fontWeight: "700",
    color: colors.white,
    opacity: 0.8,
  },
  saveBtn: {
    position: "absolute",
    top: spacing.s2,
    right: spacing.s2,
    backgroundColor: colors.black50,
    borderRadius: radius.full,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  saveIcon: {
    fontSize: 18,
    color: colors.white,
  },
  memberBadge: {
    position: "absolute",
    bottom: spacing.s2,
    left: spacing.s2,
    backgroundColor: "#D4537E",
    borderRadius: radius.full,
    paddingHorizontal: spacing.s2,
    paddingVertical: 3,
  },
  memberBadgeText: {
    ...textStyles.labelSmall,
    color: colors.white,
  },
  infoBlock: {
    padding: spacing.s4,
    gap: spacing.s1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.foreground,
    lineHeight: 20,
  },
  locationLabel: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.s1,
  },
  ratingText: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  newBadge: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s2,
    paddingVertical: 2,
  },
  newBadgeText: {
    ...textStyles.labelSmall,
    color: colors.accentForeground,
  },
  categoryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s1,
    marginTop: spacing.s1,
  },
  categoryChip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s2,
    paddingVertical: 3,
  },
  categoryChipText: {
    ...textStyles.labelSmall,
    color: colors.textMuted,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.s2,
    gap: spacing.s2,
  },
  footerLeft: {
    flex: 1,
    gap: 2,
  },
  availabilityText: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  priceText: {
    ...textStyles.label,
    color: colors.foreground,
  },
  fullyBookedBadge: {
    backgroundColor: colors.disabledBg,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s2,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  fullyBookedText: {
    ...textStyles.labelSmall,
    color: colors.disabled,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s4,
    paddingVertical: spacing.s2,
    minWidth: 72,
    alignItems: "center",
  },
  ctaBtnWaitlist: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaBtnCall: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ctaBtnText: {
    ...textStyles.label,
    color: colors.white,
  },
  ctaBtnTextSecondary: {
    color: colors.foreground,
  },
});
