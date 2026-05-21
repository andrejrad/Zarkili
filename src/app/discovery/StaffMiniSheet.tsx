/**
 * StaffMiniSheet.tsx — Spec §4.2
 *
 * Bottom sheet that opens from a "Book with [name] →" link on the Staff 
 * team section of Service Detail screen.
 * Pre-filled: service (the one whose detail page we're on) + staff (the one tapped).
 * CTA starts booking at Step 3 (Date/time) with both pre-filled.
 */

import { Image, StyleSheet, Text, View } from "react-native";

import { ModalSheet } from "../../shared/ui/ModalSheet";
import { Button } from "../../shared/ui/Button";
import { colors, radius, spacing } from "../../shared/ui/tokens";
import type { SalonStaffSummary } from "./discoveryHelpers";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StaffMiniSheetProps = {
  visible: boolean;
  onClose: () => void;

  /** Staff member being previewed. */
  staff: SalonStaffSummary & {
    bioSummary?: string;
    nextAvailableLabel?: string;
  };

  /** Service this sheet is anchored to (from the ServiceDetail page). */
  service: {
    id: string;
    name: string;
  };

  /** CTA: starts booking at Step 3 with service + staff pre-filled. */
  onBookWithStaff: () => void;

  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function StaffMiniSheet({
  visible,
  onClose,
  staff,
  service,
  onBookWithStaff,
  testID,
}: StaffMiniSheetProps) {
  return (
    <ModalSheet
      visible={visible}
      onClose={onClose}
      title={`Book with ${staff.name}`}
      testID={testID}
      footer={
        <Button
          label={`Book ${service.name} with ${staff.name} →`}
          onPress={onBookWithStaff}
          testID={testID ? `${testID}-cta` : undefined}
        />
      }
    >
      {/* Profile row: photo + name / role / rating */}
      <View style={styles.profileRow}>
        {staff.imageUrl ? (
          <Image
            source={{ uri: staff.imageUrl }}
            style={styles.avatar}
            accessibilityLabel={`Photo of ${staff.name}`}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitial}>{staff.name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.profileInfo}>
          <Text style={styles.staffName}>{staff.name}</Text>
          {staff.role ? (
            <Text style={styles.staffSpecialty}>{staff.role}</Text>
          ) : null}
          {staff.rating != null ? (
            <Text style={styles.staffRating}>★ {staff.rating.toFixed(1)}</Text>
          ) : null}
        </View>
      </View>

      {/* Bio summary */}
      {staff.bioSummary ? (
        <Text style={styles.bio}>{staff.bioSummary}</Text>
      ) : null}

      {/* Specialty tags */}
      {staff.specialties && staff.specialties.length > 0 ? (
        <View style={styles.tagRow}>
          {staff.specialties.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Availability callout */}
      {staff.nextAvailableLabel ? (
        <View style={styles.availabilityCallout}>
          <Text style={styles.availabilityText}>
            Next available: {staff.nextAvailableLabel}
          </Text>
        </View>
      ) : null}
    </ModalSheet>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  profileRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.s3,
    gap: spacing.s3,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.border,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary10,
  },
  avatarInitial: { fontSize: 22, fontWeight: "700", color: colors.primary },
  profileInfo: { flex: 1, gap: 2 },
  staffName: { fontSize: 16, fontWeight: "700", color: colors.foreground },
  staffSpecialty: { fontSize: 13, color: colors.textMuted },
  staffRating: { fontSize: 13, color: colors.primary, fontWeight: "600" },

  bio: {
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 20,
    marginBottom: spacing.s3,
  },

  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.s2,
    marginBottom: spacing.s3,
  },
  tag: {
    backgroundColor: colors.primary10,
    borderRadius: radius.full,
    paddingHorizontal: spacing.s3,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: colors.primary, fontWeight: "500" },

  availabilityCallout: {
    backgroundColor: "#EBF8F3",
    borderRadius: radius.md,
    padding: spacing.s3,
  },
  availabilityText: { fontSize: 13, color: "#0F6E56", fontWeight: "500" },
});
