/**
 * PhotoUploadTile.tsx — Batch E photo-upload-tile primitive.
 *
 * 80×80 tile, radius 12.
 * States: empty | pressed | filled | uploading | error | disabled | max-reached
 *
 * Empty/error/max: accessibilityRole="button"
 * Filled: accessibilityRole="image" + separate remove button
 * Uploading: accessibilityRole="progressbar"
 * Disabled/max: non-interactive
 *
 * #FFF5F5 error bg → rgba(244,67,54,0.04) per spec note.
 */

import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius } from "./tokens";

export type PhotoUploadTileState =
  | "empty"
  | "filled"
  | "uploading"
  | "error"
  | "disabled"
  | "max-reached";

export type PhotoUploadTileProps = {
  state: PhotoUploadTileState;
  /** Filled state: description of the uploaded image. */
  imageAlt?: string;
  onPress?: () => void;
  onRemove?: () => void;
  testID?: string;
};

export function PhotoUploadTile({
  state,
  imageAlt,
  onPress,
  onRemove,
  testID,
}: PhotoUploadTileProps) {
  const isDisabled = state === "disabled" || state === "max-reached";
  const isInteractive = state === "empty" || state === "error";

  const tileContent = (
    <View
      style={[
        styles.tile,
        state === "empty" ? styles.tileEmpty : null,
        state === "error" ? styles.tileError : null,
        state === "filled" ? styles.tileFilled : null,
        state === "uploading" ? styles.tileUploading : null,
        state === "disabled" ? styles.tileDisabled : null,
        state === "max-reached" ? styles.tileMaxReached : null,
      ]}
      testID={isInteractive ? undefined : testID}
    >
      {state === "empty" && (
        <Text style={styles.plusGlyph} accessibilityElementsHidden>+</Text>
      )}
      {state === "uploading" && (
        <Text style={styles.spinnerGlyph} accessibilityElementsHidden>↻</Text>
      )}
      {state === "error" && (
        <Text style={styles.errorGlyph} accessibilityElementsHidden>↺</Text>
      )}
      {state === "max-reached" && (
        <Text style={styles.maxLabel} numberOfLines={2} accessibilityElementsHidden>
          Max 5 photos
        </Text>
      )}
    </View>
  );

  // Filled: image tile + separate remove button
  if (state === "filled") {
    return (
      <View style={styles.filledWrapper} testID={testID}>
        <View
          style={[styles.tile, styles.tileFilled]}
          accessible
          accessibilityRole="image"
          accessibilityLabel={imageAlt ?? "Uploaded photo"}
        />
        {onRemove ? (
          <Pressable
            onPress={onRemove}
            style={styles.removeBtn}
            accessibilityRole="button"
            accessibilityLabel="Remove photo"
            hitSlop={10}
            testID={testID ? `${testID}-remove` : undefined}
          >
            <Text style={styles.removeGlyph}>✕</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  // Uploading: non-interactive progressbar
  if (state === "uploading") {
    return (
      <View
        style={[styles.tile, styles.tileUploading]}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Uploading photo"
        accessibilityValue={{ text: "Uploading" }}
        testID={testID}
      >
        {tileContent.props.children}
      </View>
    );
  }

  // Disabled / max-reached: non-interactive
  if (isDisabled) {
    return (
      <View
        style={[
          styles.tile,
          state === "disabled" ? styles.tileDisabled : styles.tileMaxReached,
        ]}
        testID={testID}
      >
        {state === "max-reached" ? (
          <Text style={styles.maxLabel} numberOfLines={2}>
            Max 5 photos
          </Text>
        ) : null}
      </View>
    );
  }

  // Empty / error: interactive button
  return (
    <Pressable
      onPress={onPress}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={state === "error" ? "Retry photo upload" : "Add photo"}
      testID={testID}
    >
      {tileContent}
    </Pressable>
  );
}

const BASE_TILE = {
  width: 80,
  height: 80,
  borderRadius: radius.md,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  overflow: "hidden" as const,
};

const styles = StyleSheet.create({
  tile: {
    ...BASE_TILE,
  },
  tileEmpty: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tileFilled: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.disabledBg,
  },
  tileUploading: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.disabledBg,
    opacity: 0.5,
  },
  tileError: {
    borderWidth: 1.5,
    borderColor: colors.error,
    backgroundColor: "rgba(244,67,54,0.04)",
  },
  tileDisabled: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.disabledBg,
    backgroundColor: colors.background,
    opacity: 0.6,
  },
  tileMaxReached: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.disabledBg,
    backgroundColor: colors.disabledBg,
  },
  plusGlyph: {
    fontSize: 24,
    color: colors.textMuted,
    lineHeight: 28,
  },
  spinnerGlyph: {
    fontSize: 24,
    color: colors.primary,
    lineHeight: 28,
  },
  errorGlyph: {
    fontSize: 24,
    color: colors.error,
    lineHeight: 28,
  },
  maxLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 14,
    paddingHorizontal: 4,
  },
  filledWrapper: {
    position: "relative",
    width: 80,
    height: 80,
  },
  removeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    // Shadow for contrast
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  removeGlyph: {
    fontSize: 12,
    color: colors.white,
    lineHeight: 16,
  },
});
