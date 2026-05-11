/**
 * ServiceDetailScreen.tsx — W22/W34 Stream B.
 *
 * Service detail page reachable from a salon profile or search results.
 */

import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, colors, radius, spacing } from "../../shared/ui";

import { formatPrice, type SalonProfile, type SalonServiceSummary } from "./discoveryHelpers";

export type ServiceDetailScreenProps = {
  service: SalonServiceSummary & { description?: string };
  salon: Pick<SalonProfile, "id" | "name" | "city">;
  onBook: () => void;
  onBack: () => void;
  testID?: string;
};

export function ServiceDetailScreen({
  service,
  salon,
  onBook,
  onBack,
  testID,
}: ServiceDetailScreenProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      testID={testID ?? "service-detail"}
    >
      <Button
        variant="secondary"
        size="small"
        label="Back"
        onPress={onBack}
        testID="service-detail-back"
      />

      <Text style={styles.salonLine}>
        {salon.name} • {salon.city}
      </Text>
      <Text style={styles.heading} accessibilityRole="header">
        {service.name}
      </Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaItem}>{service.durationMinutes} min</Text>
        <Text style={styles.metaItem}>•</Text>
        <Text style={styles.metaItem}>{formatPrice(service.priceCents)}</Text>
      </View>

      {service.description ? <Text style={styles.body}>{service.description}</Text> : null}

      <Button label="Book this service" onPress={onBook} testID="service-detail-book" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.pageVertical, gap: spacing.s3 },
  salonLine: { fontSize: 13, color: colors.textMuted, marginTop: spacing.s2 },
  heading: { fontSize: 26, fontWeight: "700", color: colors.foreground },
  metaRow: { flexDirection: "row", gap: spacing.s2, alignItems: "center" },
  metaItem: { fontSize: 14, color: colors.foreground },
  body: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
});
