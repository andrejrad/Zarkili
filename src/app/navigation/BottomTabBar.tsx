import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path, Rect } from "react-native-svg";

import { brandTypography } from "../../shared/ui/brandTypography";

export type BottomTabName = "Home" | "Explore" | "Bookings" | "Rewards" | "Profile";

type BottomTabBarProps = {
  activeTab: BottomTabName;
  onTabPress: (tab: BottomTabName) => void;
};

const colors = {
  active: "#E3A9A0",
  inactive: "#6B6B6B",
  background: "#FFFFFF",
  border: "#E5E0D1",
};

const TABS: Array<{ name: BottomTabName; label: string }> = [
  { name: "Home", label: "Home" },
  { name: "Explore", label: "Explore" },
  { name: "Bookings", label: "Bookings" },
  { name: "Rewards", label: "Rewards" },
  { name: "Profile", label: "Profile" },
];

// ---------------------------------------------------------------------------
// SVG tab icons
// ---------------------------------------------------------------------------

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExploreIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={1.5} />
      <Path d="M17 17L21 21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function BookingsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth={1.5} />
      <Path d="M3 10H21" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M8 3V7M16 3V7" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M7 14H10M7 18H13" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </Svg>
  );
}

function RewardsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L14.09 8.26L20.69 8.27L15.49 12.14L17.57 18.41L12 14.77L6.43 18.41L8.51 12.14L3.31 8.27L9.91 8.26L12 2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={1.5} />
      <Path
        d="M4 20C4 17 7.58 15 12 15C16.42 15 20 17 20 20"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function TabIcon({ tab, color }: { tab: BottomTabName; color: string }) {
  switch (tab) {
    case "Home":     return <HomeIcon color={color} />;
    case "Explore":  return <ExploreIcon color={color} />;
    case "Bookings": return <BookingsIcon color={color} />;
    case "Rewards":  return <RewardsIcon color={color} />;
    case "Profile":  return <ProfileIcon color={color} />;
  }
}

// ---------------------------------------------------------------------------
// Bar
// ---------------------------------------------------------------------------

export function BottomTabBar({ activeTab, onTabPress }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(12, insets.bottom + 6);

  return (
    <View style={[styles.container, { paddingBottom }]}>
      {TABS.map((tab) => {
        const isActive = tab.name === activeTab;
        const color = isActive ? colors.active : colors.inactive;
        return (
          <Pressable
            key={tab.name}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            onPress={() => onTabPress(tab.name)}
            style={styles.tab}
          >
            {isActive && <View style={styles.activeBar} />}
            <TabIcon tab={tab.name} color={color} />
            <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    // paddingBottom is dynamic (useSafeAreaInsets) — set via inline style
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    position: "relative",
  },
  activeBar: {
    position: "absolute",
    top: -6,
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.active,
  },
  label: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: brandTypography.medium,
  },
  labelActive: {
    color: colors.active,
  },
  labelInactive: {
    color: colors.inactive,
  },
});
