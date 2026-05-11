/**
 * SalonProfileScreen.tsx — B.5 Salon Profile.
 *
 * Hero card + tab strip (Services / Staff / Reviews / Gallery / About) +
 * sticky "Book now" CTA. ADA-accessible badge displayed when applicable.
 */

import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  GalleryCarousel,
  RatingStars,
  SalonHeroCard,
  StaffAvatarList,
  StickyCtaBar,
  colors,
  radius,
  spacing,
  textStyles,
  type GalleryCarouselItem,
  type StaffAvatarItem,
} from "../../shared/ui";

export type SalonProfileService = {
  id: string;
  name: string;
  durationLabel: string;
  priceLabel: string;
};

export type SalonProfileReview = {
  id: string;
  authorName: string;
  rating: number;
  body: string;
  dateLabel: string;
};

export type SalonProfileSummary = {
  id: string;
  name: string;
  imageUri?: string;
  rating: number;
  reviewCount: number;
  metaLine?: string;
  hours?: string;
  about?: string;
  adaAccessible?: boolean;
  bookingEnabled: boolean;
  messageEnabled: boolean;
};

export type SalonProfileScreenProps = {
  salon: SalonProfileSummary;
  services: SalonProfileService[];
  staff: StaffAvatarItem[];
  reviews: SalonProfileReview[];
  gallery: GalleryCarouselItem[];
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onPressService?: (service: SalonProfileService) => void;
  onPressStaff?: (staff: StaffAvatarItem) => void;
  onPressBookNow?: () => void;
  onPressMessage?: () => void;
  testID?: string;
};

type Tab = "services" | "staff" | "reviews" | "gallery" | "about";

const TABS: { id: Tab; label: string }[] = [
  { id: "services", label: "Services" },
  { id: "staff", label: "Staff" },
  { id: "reviews", label: "Reviews" },
  { id: "gallery", label: "Gallery" },
  { id: "about", label: "About" },
];

export function SalonProfileScreen({
  salon,
  services,
  staff,
  reviews,
  gallery,
  isFavorite,
  onToggleFavorite,
  onPressService,
  onPressStaff,
  onPressBookNow,
  onPressMessage,
  testID,
}: SalonProfileScreenProps) {
  const [tab, setTab] = useState<Tab>("services");

  return (
    <View style={styles.container} testID={testID}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <SalonHeroCard
            name={salon.name}
            imageUri={salon.imageUri}
            rating={salon.rating}
            reviewCount={salon.reviewCount}
            metaLine={salon.metaLine}
            hours={salon.hours}
            isFavorite={isFavorite}
            onToggleFavorite={onToggleFavorite}
            testID={testID ? `${testID}-hero` : undefined}
          />
        </View>

        {salon.adaAccessible ? (
          <View style={styles.adaBadge} testID={testID ? `${testID}-ada` : undefined}>
            <Text style={styles.adaBadgeText}>♿ ADA accessible</Text>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                style={[styles.tab, active && styles.tabActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={t.label}
                testID={testID ? `${testID}-tab-${t.id}` : undefined}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {tab === "services" ? (
          <View style={styles.list}>
            {services.map((s) => (
              <Pressable
                key={s.id}
                onPress={() => onPressService?.(s)}
                style={styles.serviceRow}
                accessibilityRole="button"
                accessibilityLabel={`${s.name}, ${s.durationLabel}, ${s.priceLabel}`}
                testID={testID ? `${testID}-service-${s.id}` : undefined}
              >
                <View style={styles.serviceBody}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <Text style={styles.serviceMeta}>{s.durationLabel}</Text>
                </View>
                <Text style={styles.servicePrice}>{s.priceLabel}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {tab === "staff" ? (
          <StaffAvatarList
            items={staff}
            onPressItem={onPressStaff}
            testID={testID ? `${testID}-staff` : undefined}
          />
        ) : null}

        {tab === "reviews" ? (
          <View style={styles.list}>
            {reviews.map((r) => (
              <View
                key={r.id}
                style={styles.reviewCard}
                testID={testID ? `${testID}-review-${r.id}` : undefined}
              >
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewAuthor}>{r.authorName}</Text>
                  <Text style={styles.reviewDate}>{r.dateLabel}</Text>
                </View>
                <RatingStars value={r.rating} size={16} />
                <Text style={styles.reviewBody}>{r.body}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {tab === "gallery" ? (
          <View style={styles.galleryWrap}>
            <GalleryCarousel
              items={gallery}
              testID={testID ? `${testID}-gallery` : undefined}
            />
          </View>
        ) : null}

        {tab === "about" ? (
          <View style={styles.aboutCard}>
            <Text style={styles.aboutText}>{salon.about ?? "No about text yet."}</Text>
          </View>
        ) : null}
      </ScrollView>

      <StickyCtaBar
        primaryLabel="Book now"
        onPrimaryPress={onPressBookNow ?? (() => {})}
        primaryDisabled={!salon.bookingEnabled}
        primaryTestID={testID ? `${testID}-book` : undefined}
        secondaryLabel={salon.messageEnabled ? "Message" : undefined}
        onSecondaryPress={salon.messageEnabled ? onPressMessage : undefined}
        secondaryTestID={testID ? `${testID}-message` : undefined}
        testID={testID ? `${testID}-cta` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingBottom: spacing.s12,
    gap: spacing.s4,
  },
  heroWrap: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
  },
  adaBadge: {
    alignSelf: "flex-start",
    marginHorizontal: spacing.pageHorizontal,
    backgroundColor: colors.mintFresh,
    paddingHorizontal: spacing.s3,
    paddingVertical: spacing.s1,
    borderRadius: radius.full,
  },
  adaBadgeText: { ...textStyles.labelSmall, color: colors.accentForeground },
  tabRow: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: spacing.s2,
  },
  tab: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
  },
  tabActive: {
    backgroundColor: colors.coralBlossom,
    borderColor: colors.coralBlossom,
  },
  tabText: { ...textStyles.label, color: colors.foreground },
  tabTextActive: { color: colors.white },
  list: {
    paddingHorizontal: spacing.pageHorizontal,
    gap: spacing.s2,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.cardPadding,
    minHeight: spacing.touchTarget,
  },
  serviceBody: { flex: 1, gap: spacing.s1 },
  serviceName: { ...textStyles.heading4, color: colors.foreground },
  serviceMeta: { ...textStyles.bodySmall, color: colors.textMuted },
  servicePrice: { ...textStyles.heading4, color: colors.coralBlossom },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.cardPadding,
    gap: spacing.s2,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reviewAuthor: { ...textStyles.heading4, color: colors.foreground },
  reviewDate: { ...textStyles.bodySmall, color: colors.textMuted },
  reviewBody: { ...textStyles.body, color: colors.foreground },
  galleryWrap: { paddingHorizontal: spacing.pageHorizontal },
  aboutCard: {
    marginHorizontal: spacing.pageHorizontal,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.cardPadding,
  },
  aboutText: { ...textStyles.body, color: colors.foreground },
});
