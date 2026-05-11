/**
 * SalonProfileScreen.tsx — W22/W34 Stream B.
 *
 * Salon detail page with services, staff, and reviews.
 */

import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, RatingStars, colors, radius, spacing } from "../../shared/ui";

import {
  formatPrice,
  type SalonProfile,
  type SalonReviewSnippet,
  type SalonServiceSummary,
  type SalonStaffSummary,
} from "./discoveryHelpers";

export type SalonProfileScreenProps = {
  salon: SalonProfile;
  services: SalonServiceSummary[];
  staff: SalonStaffSummary[];
  reviews: SalonReviewSnippet[];
  heroImageUrl?: string;
  galleryUrls?: string[];
  onSelectService: (serviceId: string) => void;
  onSelectStaff: (staffId: string) => void;
  onBook: () => void;
  onBack: () => void;
  testID?: string;
};

export function SalonProfileScreen({
  salon,
  services,
  staff,
  reviews,
  heroImageUrl,
  galleryUrls,
  onSelectService,
  onSelectStaff,
  onBook,
  onBack,
  testID,
}: SalonProfileScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID ?? "salon-profile"}
    >
      <Button
        variant="secondary"
        size="small"
        label="Back"
        onPress={onBack}
        testID="salon-profile-back"
      />

      <Text style={styles.heading} accessibilityRole="header">
        {salon.name}
      </Text>
      {salon.tagline ? <Text style={styles.tagline}>{salon.tagline}</Text> : null}
      <View style={styles.ratingRow}>
        <RatingStars value={salon.rating} size={16} />
        <Text style={styles.reviewCount}>
          ({salon.reviewCount} reviews) • {salon.city}
        </Text>
      </View>

      <Text style={styles.body}>{salon.description}</Text>

      {heroImageUrl ? (
        <Image
          source={{ uri: heroImageUrl }}
          style={styles.heroImage}
          accessibilityLabel={`${salon.name} hero image`}
          testID="salon-profile-hero-image"
        />
      ) : null}

      {galleryUrls && galleryUrls.length > 0 ? (
        <>
          <Text style={styles.sectionLabel}>Gallery</Text>
          <View style={styles.galleryGrid}>
            {galleryUrls.map((url, index) => (
              <Image
                key={url}
                source={{ uri: url }}
                style={styles.galleryThumb}
                accessibilityLabel={`Gallery photo ${index + 1}`}
                testID={`salon-profile-gallery-${index}`}
              />
            ))}
          </View>
        </>
      ) : null}

      <Button label="Book now" onPress={onBook} testID="salon-profile-book" />

      <Text style={styles.sectionLabel}>Services</Text>
      <View style={styles.list}>
        {services.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => onSelectService(s.id)}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={s.name}
            testID={`salon-profile-service-${s.id}`}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{s.name}</Text>
              <Text style={styles.rowMeta}>{s.durationMinutes} min</Text>
            </View>
            <Text style={styles.price}>{formatPrice(s.priceCents)}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Staff</Text>
      <View style={styles.list}>
        {staff.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onSelectStaff(p.id)}
            style={styles.row}
            accessibilityRole="button"
            accessibilityLabel={p.name}
            testID={`salon-profile-staff-${p.id}`}
          >
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{p.name}</Text>
              <Text style={styles.rowMeta}>{p.role}</Text>
            </View>
            {p.rating != null ? (
              <Text style={styles.staffRating}>★ {p.rating.toFixed(1)}</Text>
            ) : null}
          </Pressable>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Reviews</Text>
      <View style={styles.list}>
        {reviews.map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.ratingRow}>
              <RatingStars value={r.rating} size={16} />
              <Text style={styles.reviewMeta}>
                {r.authorName} • {r.postedAt}
              </Text>
            </View>
            <Text style={styles.reviewText}>{r.text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: { fontSize: 26, fontWeight: "700", color: colors.foreground, marginTop: spacing.s2 },
  tagline: { fontSize: 14, color: colors.textMuted },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: spacing.s2 },
  reviewCount: { fontSize: 12, color: colors.textMuted },
  body: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginTop: spacing.s3 },
  list: { gap: spacing.s2 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s3,
    flexDirection: "row",
    alignItems: "center",
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  rowMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  price: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  staffRating: { fontSize: 13, color: colors.foreground },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.s3,
    gap: spacing.s2,
  },
  reviewMeta: { fontSize: 12, color: colors.textMuted },
  reviewText: { fontSize: 13, color: colors.foreground, lineHeight: 18 },
  heroImage: { width: "100%", height: 200, borderRadius: radius.md, backgroundColor: colors.surface },
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.s2 },
  galleryThumb: { width: 96, height: 96, borderRadius: radius.sm, backgroundColor: colors.surface },
});
