/**
 * HomeScreen.tsx — B.1 Home.
 *
 * Greeting + search entry + category-pill scroll + featured-salons row +
 * "Pick up where you left off" recent-bookings row. Data is supplied
 * pre-fetched via the `feed` prop so the screen stays test-friendly.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type {
  DiscoveryCategoryId,
  DiscoveryHomeFeed,
  ServiceTypeCard,
} from "../../domains/discovery";
import { RatingStars, colors, radius, spacing, textStyles } from "../../shared/ui";

export type HomeScreenProps = {
  feed: DiscoveryHomeFeed;
  greetingName?: string;
  onPressSearch?: () => void;
  onPressCategory?: (id: DiscoveryCategoryId) => void;
  onPressSalon?: (service: ServiceTypeCard) => void;
  onPressRecentBooking?: (id: string) => void;
  onPressDiscoverTab?: () => void;
  testID?: string;
};

const CATEGORY_LABELS: Record<DiscoveryCategoryId, string> = {
  all: "All",
  nails: "Nails",
  hair: "Hair",
  skin: "Skin",
  lashes: "Lashes",
  brows: "Brows",
  massage: "Massage",
  makeup: "Makeup",
  barber: "Barber",
  waxing: "Waxing",
  spa: "Spa",
  injectables: "Injectables",
  wellness: "Wellness",
};

export function HomeScreen({
  feed,
  greetingName,
  onPressSearch,
  onPressCategory,
  onPressSalon,
  onPressRecentBooking,
  onPressDiscoverTab,
  testID,
}: HomeScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID}
    >
      <Text style={styles.greeting} accessibilityRole="header">
        {greetingName ? `Hi, ${greetingName}` : "Welcome"}
      </Text>
      <Text style={styles.subgreeting}>Find your next glow-up.</Text>

      <Pressable
        onPress={onPressSearch}
        style={styles.searchBar}
        accessibilityRole="button"
        accessibilityLabel="Search salons and services"
        testID={testID ? `${testID}-search` : undefined}
      >
        <Text style={styles.searchPlaceholder}>Search salons, services, staff…</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
        {feed.categories.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => onPressCategory?.(c.id)}
            style={styles.pill}
            accessibilityRole="button"
            accessibilityLabel={`${CATEGORY_LABELS[c.id]} category`}
            testID={testID ? `${testID}-cat-${c.id}` : undefined}
          >
            <Text style={styles.pillText}>{CATEGORY_LABELS[c.id]}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Featured salons</Text>
        <Pressable
          onPress={onPressDiscoverTab}
          accessibilityRole="button"
          accessibilityLabel="See all salons"
          hitSlop={8}
          testID={testID ? `${testID}-see-all` : undefined}
        >
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
        {feed.featuredSalons.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => onPressSalon?.(s)}
            style={styles.salonCard}
            accessibilityRole="button"
            accessibilityLabel={`${s.serviceName} at ${s.locationDisplayName}`}
            testID={testID ? `${testID}-salon-${s.id}` : undefined}
          >
            <View style={styles.salonImage} />
            <Text style={styles.salonName} numberOfLines={1}>
              {s.serviceName}
            </Text>
            <Text style={styles.salonCity} numberOfLines={1}>
              {s.locationDisplayName}
            </Text>
            <View style={styles.ratingRow}>
              <RatingStars value={s.serviceAverageRating ?? s.locationAverageRating ?? 0} size={16} />
              <Text style={styles.salonMeta}>({s.serviceReviewCount})</Text>
            </View>
            <Text style={styles.salonMeta}>From £{s.priceFrom.toFixed(0)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {feed.recentBookings.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Pick up where you left off</Text>
          <View style={styles.recentList}>
            {feed.recentBookings.map((b) => (
              <Pressable
                key={b.id}
                onPress={() => onPressRecentBooking?.(b.id)}
                style={styles.recentRow}
                accessibilityRole="button"
                accessibilityLabel={`Recent booking with ${b.salonName}`}
                testID={testID ? `${testID}-recent-${b.id}` : undefined}
              >
                <Text style={styles.recentTitle} numberOfLines={1}>
                  {b.salonName}
                </Text>
                <Text style={styles.recentMeta} numberOfLines={1}>
                  {b.serviceName} · {b.dateTimeLabel}
                </Text>
                <Text style={styles.recentStatus}>{b.statusLabel}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
    paddingBottom: spacing.s12,
    gap: spacing.s4,
  },
  greeting: { ...textStyles.heading1, color: colors.foreground },
  subgreeting: { ...textStyles.body, color: colors.textMuted },
  searchBar: {
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: spacing.s3,
    paddingHorizontal: spacing.s4,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
  },
  searchPlaceholder: { ...textStyles.body, color: colors.textMuted },
  sectionTitle: { ...textStyles.heading3, color: colors.foreground, marginTop: spacing.s2 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.s2,
  },
  seeAll: { ...textStyles.label, color: colors.coralBlossom },
  pillRow: { gap: spacing.s2, paddingVertical: spacing.s2 },
  pill: {
    paddingVertical: spacing.s2,
    paddingHorizontal: spacing.s4,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: spacing.touchTarget,
    justifyContent: "center",
  },
  pillText: { ...textStyles.label, color: colors.foreground },
  cardRow: { gap: spacing.s4, paddingVertical: spacing.s2 },
  salonCard: {
    width: 240,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.cardPadding,
    gap: spacing.s1,
  },
  salonImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: colors.disabledBg,
    borderRadius: radius.md,
    marginBottom: spacing.s2,
  },
  salonName: { ...textStyles.heading4, color: colors.foreground },
  salonCity: { ...textStyles.bodySmall, color: colors.textMuted },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.s1 },
  salonMeta: { ...textStyles.bodySmall, color: colors.textMuted },
  recentList: { gap: spacing.s2 },
  recentRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.cardPadding,
    gap: spacing.s1,
  },
  recentTitle: { ...textStyles.heading4, color: colors.foreground },
  recentMeta: { ...textStyles.bodySmall, color: colors.textMuted },
  recentStatus: { ...textStyles.labelSmall, color: colors.coralBlossom },
});
