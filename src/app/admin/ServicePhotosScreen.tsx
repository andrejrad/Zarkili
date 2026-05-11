/**
 * W42 — ServicePhotosScreen
 *
 * Media manager for a service: view, reorder, and remove photos.
 * Upload is a stub (returns stored URL placeholder) — real Storage wiring
 * uses expo-image-picker + Firebase Storage and lands in W43.
 */
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AdminEmptyState, AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import { brandTypography } from "../../shared/ui/brandTypography";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ServicePhotosScreenProps = {
  serviceName: string;
  loading: boolean;
  error: string | null;
  mediaUrls: string[];
  uploading: boolean;
  uploadError: string | null;
  onUpload: () => void;
  onRemovePhoto: (index: number) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ServicePhotosScreen({
  serviceName,
  loading,
  error,
  mediaUrls,
  uploading,
  uploadError,
  onUpload,
  onRemovePhoto,
  onRetry,
  onBack,
  testID = "service-photos-screen",
}: ServicePhotosScreenProps) {
  if (loading) return <AdminLoadingState label="Loading photos…" />;
  if (error) return <AdminErrorState message={error} onRetry={onRetry} />;

  return (
    <ScrollView contentContainerStyle={styles.root} testID={testID}>
      <Pressable onPress={onBack} accessibilityRole="button">
        <Text style={styles.back}>‹ {serviceName}</Text>
      </Pressable>

      <Text style={styles.title}>Photos & Media</Text>
      <Text style={styles.subtitle}>Add photos to showcase this service in your marketplace listing.</Text>

      {/* Upload button */}
      <Pressable
        style={[styles.uploadBtn, uploading && styles.btnDisabled]}
        disabled={uploading}
        onPress={onUpload}
        accessibilityRole="button"
        testID={`${testID}-upload-btn`}
      >
        <Text style={styles.uploadBtnLabel}>{uploading ? "Uploading…" : "Upload photo"}</Text>
      </Pressable>
      {uploadError ? <Text style={styles.error} testID={`${testID}-upload-error`}>{uploadError}</Text> : null}

      {/* Photo grid */}
      <Text style={styles.sectionLabel}>
        {mediaUrls.length === 0 ? "No photos yet" : `${mediaUrls.length} photo${mediaUrls.length === 1 ? "" : "s"}`}
      </Text>

      {mediaUrls.length === 0 ? (
        <AdminEmptyState
          title="No photos yet"
          body="Upload photos to help clients recognise your service."
        />
      ) : (
        <View style={styles.grid} testID={`${testID}-photos-grid`}>
          {mediaUrls.map((url, i) => (
            <View key={i} style={styles.photoCard} testID={`${testID}-photo-${i}`}>
              {/* Image preview placeholder (real Image component requires real URLs) */}
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderText}>Photo {i + 1}</Text>
                <Text style={styles.photoUrl} numberOfLines={1}>{url}</Text>
              </View>
              <Pressable
                onPress={() => onRemovePhoto(i)}
                accessibilityRole="button"
                testID={`${testID}-remove-photo-${i}`}
                style={styles.removeBtn}
              >
                <Text style={styles.removeLabel}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable onPress={onBack} style={styles.backBtn} accessibilityRole="button">
        <Text style={styles.backBtnLabel}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { gap: 12, paddingBottom: 24 },
  back: { fontSize: 14, color: "#6B6B6B", fontFamily: brandTypography.regular, marginBottom: 4 },
  title: { fontSize: 20, lineHeight: 28, fontFamily: brandTypography.semibold, color: "#1A1A1A" },
  subtitle: { fontSize: 14, lineHeight: 20, color: "#6B6B6B", fontFamily: brandTypography.regular },
  sectionLabel: { fontSize: 13, fontFamily: brandTypography.medium, color: "#1A1A1A", marginTop: 4 },
  uploadBtn: {
    borderRadius: 9999, paddingVertical: 14, paddingHorizontal: 16,
    alignItems: "center", backgroundColor: "#E3A9A0",
  },
  btnDisabled: { opacity: 0.6 },
  uploadBtnLabel: { color: "#FFFFFF", fontSize: 14, fontFamily: brandTypography.medium },
  error: { fontSize: 13, lineHeight: 18, color: "#F44336", fontFamily: brandTypography.regular },
  grid: { gap: 8 },
  photoCard: {
    borderWidth: 1, borderColor: "#E5E0D1", borderRadius: 12,
    overflow: "hidden", backgroundColor: "#FFFFFF",
  },
  photoPlaceholder: {
    height: 120, backgroundColor: "#F5F0E8",
    justifyContent: "center", alignItems: "center", padding: 8,
  },
  photoPlaceholderText: { fontSize: 14, fontFamily: brandTypography.medium, color: "#6B6B6B" },
  photoUrl: { fontSize: 10, fontFamily: brandTypography.regular, color: "#AAAAAA", marginTop: 4 },
  removeBtn: { paddingVertical: 10, alignItems: "center" },
  removeLabel: { fontSize: 13, color: "#F44336", fontFamily: brandTypography.medium },
  backBtn: {
    marginTop: 4, borderRadius: 9999, paddingVertical: 12,
    paddingHorizontal: 16, alignItems: "center",
    backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E5E0D1",
  },
  backBtnLabel: { color: "#6B6B6B", fontSize: 14, fontFamily: brandTypography.medium },
});
