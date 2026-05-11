/**
 * StaffDetailScreen.tsx — W22/W34 Stream B.
 *
 * Staff member detail page with their services and a book CTA.
 */

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, colors, radius, spacing } from "../../shared/ui";

import {
  formatPrice,
  type SalonServiceSummary,
  type SalonStaffSummary,
} from "./discoveryHelpers";

export type StaffDetailScreenProps = {
  staff: SalonStaffSummary & { bio?: string; salonName?: string };
  services: SalonServiceSummary[];
  onSelectService: (serviceId: string) => void;
  onBook: () => void;
  onBack: () => void;
  testID?: string;
};

export function StaffDetailScreen({
  staff,
  services,
  onSelectService,
  onBook,
  onBack,
  testID,
}: StaffDetailScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID ?? "staff-detail"}
    >
      <Button
        variant="secondary"
        size="small"
        label="Back"
        onPress={onBack}
        testID="staff-detail-back"
      />

      <Text style={styles.heading} accessibilityRole="header">
        {staff.name}
      </Text>
      <Text style={styles.metaLine}>
        {staff.role}
        {staff.salonName ? ` • ${staff.salonName}` : ""}
        {staff.rating != null ? ` • ★ ${staff.rating.toFixed(1)}` : ""}
      </Text>

      {staff.bio ? <Text style={styles.body}>{staff.bio}</Text> : null}

      <Button label="Book with this stylist" onPress={onBook} testID="staff-detail-book" />

      <Text style={styles.sectionLabel}>Services</Text>
      <View style={styles.list}>
        {services.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => onSelectService(s.id)}
            style={styles.row}
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
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  heading: { fontSize: 26, fontWeight: "700", color: colors.foreground, marginTop: spacing.s2 },
  metaLine: { fontSize: 13, color: colors.textMuted },
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
});
