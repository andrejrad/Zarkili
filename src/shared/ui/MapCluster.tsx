/**
 * MapCluster.tsx — W30 Batch J shared primitive.
 *
 * Renders a single map pin or a cluster pin depending on whether `count` is
 * provided and > 1.
 *
 *   Single pin  : 32×32 coral-blossom circle
 *   Cluster pin : 40×40 (count 2–9) or 48×48 (count 10+) mint-fresh circle
 *                 with white count label
 *
 * This is a pure presentational component — the caller is responsible for
 * positioning it within a map view.
 */

import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "./tokens";

export type MapClusterProps = {
  /**
   * Pass count ≥ 2 to render a cluster; omit (or pass 1) for a single pin.
   */
  count?: number;
  testID?: string;
};

export function MapCluster({ count, testID }: MapClusterProps) {
  const isCluster = count !== undefined && count > 1;
  const isLarge = count !== undefined && count >= 10;

  if (!isCluster) {
    return (
      <View
        style={styles.singlePin}
        testID={testID}
        accessibilityLabel="Map pin"
        accessible
      />
    );
  }

  return (
    <View
      style={[styles.cluster, isLarge ? styles.clusterLarge : styles.clusterSmall]}
      testID={testID}
      accessibilityLabel={`${count} salons in this area`}
      accessible
    >
      <Text style={styles.count}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  singlePin: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    // White border to stand out on map
    borderWidth: 2,
    borderColor: colors.surface,
  },
  cluster: {
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
    // White border to stand out on map
    borderWidth: 2,
    borderColor: colors.surface,
  },
  clusterSmall: {
    width: 40,
    height: 40,
  },
  clusterLarge: {
    width: 48,
    height: 48,
  },
  count: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.surface,
  },
});
