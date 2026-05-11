/**
 * StaffMemberDetailScreen.tsx — B.7 Staff Member Detail.
 *
 * Bio + portfolio gallery + sticky "Book with {name}" CTA.
 */

import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  GalleryCarousel,
  RatingStars,
  StickyCtaBar,
  colors,
  spacing,
  textStyles,
  type GalleryCarouselItem,
} from "../../shared/ui";

export type StaffMemberSummary = {
  id: string;
  name: string;
  specialty?: string;
  bio?: string;
  rating?: number;
  reviewCount?: number;
  yearsExperience?: number;
  bookingEnabled: boolean;
};

export type StaffMemberDetailScreenProps = {
  staff: StaffMemberSummary;
  portfolio: GalleryCarouselItem[];
  onPressChooseTime?: () => void;
  testID?: string;
};

export function StaffMemberDetailScreen({
  staff,
  portfolio,
  onPressChooseTime,
  testID,
}: StaffMemberDetailScreenProps) {
  return (
    <View style={styles.container} testID={testID}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} accessibilityRole="header">
            {staff.name}
          </Text>
          {staff.specialty ? (
            <Text style={styles.specialty}>{staff.specialty}</Text>
          ) : null}
          {typeof staff.rating === "number" ? (
            <View style={styles.ratingRow}>
              <RatingStars value={staff.rating} size={16} />
              {typeof staff.reviewCount === "number" ? (
                <Text style={styles.metaText}>({staff.reviewCount})</Text>
              ) : null}
              {typeof staff.yearsExperience === "number" ? (
                <Text style={styles.metaText}>· {staff.yearsExperience} yrs</Text>
              ) : null}
            </View>
          ) : null}
          {staff.bio ? <Text style={styles.bio}>{staff.bio}</Text> : null}
        </View>

        {portfolio.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <View style={styles.galleryWrap}>
              <GalleryCarousel
                items={portfolio}
                testID={testID ? `${testID}-portfolio` : undefined}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>

      <StickyCtaBar
        primaryLabel={`Book with ${staff.name.split(" ")[0]}`}
        onPrimaryPress={onPressChooseTime ?? (() => {})}
        primaryDisabled={!staff.bookingEnabled}
        primaryTestID={testID ? `${testID}-book` : undefined}
        testID={testID ? `${testID}-cta` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.s12, gap: spacing.s5 },
  header: {
    paddingHorizontal: spacing.pageHorizontal,
    paddingTop: spacing.pageVertical,
    gap: spacing.s1,
  },
  name: { ...textStyles.heading1, color: colors.foreground },
  specialty: { ...textStyles.body, color: colors.coralBlossom },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.s1, marginTop: spacing.s1 },
  metaText: { ...textStyles.bodySmall, color: colors.textMuted },
  bio: { ...textStyles.body, color: colors.foreground, marginTop: spacing.s3 },
  section: { gap: spacing.s2 },
  sectionTitle: {
    ...textStyles.heading3,
    color: colors.foreground,
    paddingHorizontal: spacing.pageHorizontal,
  },
  galleryWrap: { paddingHorizontal: spacing.pageHorizontal },
});
