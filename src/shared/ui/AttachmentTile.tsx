/**
 * AttachmentTile.tsx — W26 Batch F messaging primitive.
 *
 * Two variants:
 *   image — 64×64 thumbnail with radius.md (Image component).
 *   file  — 56h row: file icon + filename + file size + download icon button.
 *
 * Both are pressable (onPress opens/previews the attachment).
 */

import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing, textStyles } from "./tokens";

export type AttachmentTileType = "image" | "file";

export type AttachmentTileProps = {
  type: AttachmentTileType;
  /** Image URI (for type="image") */
  uri?: string;
  /** Filename displayed for type="file" */
  filename?: string;
  /** Human-readable file size string e.g. "2.4 MB" (for type="file") */
  fileSize?: string;
  onPress?: () => void;
  onDownload?: () => void;
  testID?: string;
};

export function AttachmentTile({
  type,
  uri,
  filename,
  fileSize,
  onPress,
  onDownload,
  testID,
}: AttachmentTileProps) {
  if (type === "image") {
    return (
      <Pressable
        onPress={onPress}
        style={styles.imageTile}
        accessibilityRole="button"
        accessibilityLabel={filename ?? "View attachment"}
        testID={testID}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={styles.image}
            resizeMode="cover"
            testID={testID ? `${testID}-image` : undefined}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderIcon}>🖼</Text>
          </View>
        )}
      </Pressable>
    );
  }

  return (
    <View style={styles.fileRow} testID={testID}>
      <Pressable
        onPress={onPress}
        style={styles.fileBody}
        accessibilityRole="button"
        accessibilityLabel={filename ?? "Open attachment"}
      >
        <Text style={styles.fileIcon}>📄</Text>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {filename ?? "attachment"}
          </Text>
          {fileSize ? (
            <Text style={styles.fileSize}>{fileSize}</Text>
          ) : null}
        </View>
      </Pressable>
      {onDownload ? (
        <Pressable
          onPress={onDownload}
          style={styles.downloadBtn}
          accessibilityRole="button"
          accessibilityLabel="Download"
          hitSlop={8}
          testID={testID ? `${testID}-download` : undefined}
        >
          <Text style={styles.downloadIcon}>⬇</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  imageTile: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  image: {
    width: 64,
    height: 64,
  },
  imagePlaceholder: {
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: {
    fontSize: 24,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.s3,
  },
  fileBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.s2,
    minHeight: spacing.touchTarget,
  },
  fileIcon: {
    fontSize: 20,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    ...textStyles.body,
    color: colors.foreground,
  },
  fileSize: {
    ...textStyles.bodySmall,
    color: colors.textMuted,
  },
  downloadBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadIcon: {
    fontSize: 18,
    color: colors.textMuted,
  },
});
