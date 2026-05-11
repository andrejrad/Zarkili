/**
 * StaffAvatarList.tsx — B.C2 staff-avatar-list primitive.
 *
 * Horizontal scroll of avatar + name + specialty rows. The selected
 * variant draws a 2px coral-blossom ring around the avatar.
 */

import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "./tokens";

export type StaffAvatarItem = {
  id: string;
  name: string;
  specialty?: string;
  avatarUri?: string;
};

export type StaffAvatarListProps = {
  items: StaffAvatarItem[];
  selectedId?: string | null;
  onPressItem?: (item: StaffAvatarItem) => void;
  testID?: string;
};

export function StaffAvatarList({
  items,
  selectedId = null,
  onPressItem,
  testID,
}: StaffAvatarListProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID={testID}
      accessibilityLabel="Staff list"
    >
      {items.map((it) => {
        const selected = it.id === selectedId;
        return (
          <Pressable
            key={it.id}
            onPress={() => onPressItem?.(it)}
            accessibilityRole="button"
            accessibilityLabel={`${it.name}${it.specialty ? `, ${it.specialty}` : ""}`}
            accessibilityState={{ selected }}
            style={styles.item}
            testID={testID ? `${testID}-${it.id}` : undefined}
          >
            <View style={[styles.avatarWrap, selected && styles.avatarSelected]}>
              {it.avatarUri ? (
                <Image source={{ uri: it.avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>{it.name.charAt(0)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.name} numberOfLines={1}>
              {it.name}
            </Text>
            {it.specialty ? (
              <Text style={styles.specialty} numberOfLines={1}>
                {it.specialty}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.s4,
    paddingHorizontal: spacing.pageHorizontal,
  },
  item: {
    width: 96,
    alignItems: "center",
    gap: spacing.s1,
  },
  avatarWrap: {
    padding: 2,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: "transparent",
  },
  avatarSelected: {
    borderColor: colors.coralBlossom,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.disabledBg,
  },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    color: colors.foreground,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600",
  },
  name: {
    color: colors.foreground,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  specialty: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
  },
});
