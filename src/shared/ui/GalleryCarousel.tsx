/**
 * GalleryCarousel.tsx — B.C2 gallery primitive.
 *
 * Horizontal swipeable image list with page dots. Tap an image to invoke
 * `onPressItem` (typically opens a fullscreen lightbox). Lazy loading is
 * delegated to React Native's Image component cache.
 */

import { useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";

import { colors, radius, spacing } from "./tokens";

export type GalleryCarouselItem = {
  id: string;
  uri: string;
  /** Required alt text for screen readers. */
  alt: string;
};

export type GalleryCarouselProps = {
  items: GalleryCarouselItem[];
  /** Display height in points; width is fixed at the container width. */
  height?: number;
  onPressItem?: (item: GalleryCarouselItem, index: number) => void;
  testID?: string;
};

export function GalleryCarousel({
  items,
  height = 220,
  onPressItem,
  testID,
}: GalleryCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [width, setWidth] = useState(0);

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (width <= 0) return;
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / width);
    if (next !== activeIndex && next >= 0 && next < items.length) {
      setActiveIndex(next);
    }
  }

  return (
    <View
      testID={testID}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={styles.container}
    >
      <FlatList
        horizontal
        data={items}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(it) => it.id}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => onPressItem?.(item, index)}
            accessibilityRole="image"
            accessibilityLabel={item.alt}
            testID={testID ? `${testID}-item-${item.id}` : undefined}
            style={{ width, height }}
          >
            <Image
              source={{ uri: item.uri }}
              style={[styles.image, { width, height }]}
              resizeMode="cover"
              accessible
              accessibilityLabel={item.alt}
            />
          </Pressable>
        )}
      />
      {items.length > 1 ? (
        <View style={styles.dots} accessibilityLabel={`Image ${activeIndex + 1} of ${items.length}`}>
          {items.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: colors.disabledBg,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  image: {
    backgroundColor: colors.disabledBg,
  },
  dots: {
    position: "absolute",
    bottom: spacing.s3,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.s1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  dotActive: {
    backgroundColor: colors.white,
  },
  dotInactive: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});
