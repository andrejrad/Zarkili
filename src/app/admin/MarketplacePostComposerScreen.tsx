import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Switch,
} from "react-native";

import type {
  MarketplacePost,
  CreateMarketplacePostInput,
  MarketplaceVisibility,
  PostComplianceCheckResult,
} from "./marketplaceAdminTypes";
import { checkPostCompliance } from "./marketplaceAdminService";

export type MarketplacePostComposerScreenProps = {
  saving: boolean;
  error: string | null;
  initialPost?: Partial<MarketplacePost>;
  onSaveDraft: (input: CreateMarketplacePostInput) => void;
  onPublish: (input: CreateMarketplacePostInput) => void;
  onBack: () => void;
  testID?: string;
};

const CATEGORIES = [
  "Hair", "Nails", "Skincare", "Makeup", "Massage", "Barber",
  "Brows & Lashes", "Spa", "Wellness", "Other",
];

export function MarketplacePostComposerScreen({
  saving,
  error,
  initialPost,
  onSaveDraft,
  onPublish,
  onBack,
  testID = "marketplace-post-composer-screen",
}: MarketplacePostComposerScreenProps) {
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [category, setCategory] = useState(initialPost?.category ?? "");
  const [description, setDescription] = useState(initialPost?.description ?? "");
  const [tags, setTagsRaw] = useState((initialPost?.tags ?? []).join(", "));
  const [priceStr, setPriceStr] = useState(initialPost?.priceUsd != null ? String(initialPost.priceUsd) : "");
  const [durationStr, setDurationStr] = useState(initialPost?.durationMin != null ? String(initialPost.durationMin) : "");
  const [visibility, setVisibility] = useState<MarketplaceVisibility>(initialPost?.visibility ?? "marketplace");
  const [availableForBooking, setAvailableForBooking] = useState(initialPost?.availableForBooking ?? true);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  function buildInput(): CreateMarketplacePostInput {
    const parsedTags = tags.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 10);
    return {
      title: title.trim(),
      category,
      description: description.trim(),
      tags: parsedTags,
      priceUsd: priceStr ? parseFloat(priceStr) : null,
      durationMin: durationStr ? parseInt(durationStr, 10) : null,
      mediaUrls: initialPost?.mediaUrls ?? [],
      primaryMediaIndex: initialPost?.primaryMediaIndex ?? 0,
      bookThisLookServiceId: initialPost?.bookThisLookServiceId,
      visibility,
      availableForBooking,
    };
  }

  const compliance: PostComplianceCheckResult = checkPostCompliance(buildInput());

  return (
    <View style={styles.root} testID={testID}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backLabel}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {initialPost?.postId ? "Edit Post" : "New Post"}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => onSaveDraft(buildInput())}
            disabled={saving}
            testID="save-draft-btn"
          >
            <Text style={[styles.draftLabel, saving && styles.disabled]}>Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onPublish(buildInput())}
            disabled={saving || !compliance.allPassing}
            testID="publish-btn"
            style={[styles.publishBtn, (!compliance.allPassing || saving) && styles.publishBtnDisabled]}
          >
            <Text style={styles.publishBtnText}>{saving ? "Saving…" : "Publish"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Title */}
        <View style={styles.field} testID="field-title">
          <Text style={styles.fieldLabel}>Title <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Balayage + Gloss Treatment"
            maxLength={80}
            testID="input-title"
          />
          <Text style={styles.charCount}>{title.length}/80</Text>
        </View>

        {/* Category */}
        <View style={styles.field} testID="field-category">
          <Text style={styles.fieldLabel}>Category <Text style={styles.required}>*</Text></Text>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            testID="category-picker"
          >
            <Text style={category ? styles.pickerValue : styles.pickerPlaceholder}>
              {category || "Select a category…"}
            </Text>
          </TouchableOpacity>
          {showCategoryPicker && (
            <View style={styles.categoryDropdown} testID="category-dropdown">
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => { setCategory(c); setShowCategoryPicker(false); }}
                  style={[styles.categoryOption, category === c && styles.categoryOptionActive]}
                  testID={`category-option-${c.toLowerCase().replace(/\s/g, "-")}`}
                >
                  <Text style={[styles.categoryOptionText, category === c && styles.categoryOptionTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.field} testID="field-description">
          <Text style={styles.fieldLabel}>Description <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the service in detail (min 100 characters)…"
            maxLength={800}
            multiline
            numberOfLines={5}
            testID="input-description"
          />
          <Text style={[styles.charCount, description.length < 100 && styles.charCountWarn]}>
            {description.length}/800 {description.length < 100 ? `(${100 - description.length} more needed)` : "✓"}
          </Text>
        </View>

        {/* Price + Duration */}
        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]} testID="field-price">
            <Text style={styles.fieldLabel}>Price ($) <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={priceStr}
              onChangeText={setPriceStr}
              placeholder="0.00"
              keyboardType="numeric"
              testID="input-price"
            />
          </View>
          <View style={[styles.field, { flex: 1 }]} testID="field-duration">
            <Text style={styles.fieldLabel}>Duration (min)</Text>
            <TextInput
              style={styles.input}
              value={durationStr}
              onChangeText={setDurationStr}
              placeholder="60"
              keyboardType="numeric"
              testID="input-duration"
            />
          </View>
        </View>

        {/* Tags */}
        <View style={styles.field} testID="field-tags">
          <Text style={styles.fieldLabel}>Tags (comma-separated, max 10)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTagsRaw}
            placeholder="balayage, glossing, hair color…"
            testID="input-tags"
          />
        </View>

        {/* Visibility */}
        <View style={styles.field} testID="field-visibility">
          <Text style={styles.fieldLabel}>Visibility</Text>
          <View style={styles.visibilityRow}>
            {(["marketplace", "profile_only"] as MarketplaceVisibility[]).map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => setVisibility(v)}
                style={[styles.visibilityChip, visibility === v && styles.visibilityChipActive]}
                testID={`visibility-${v}`}
              >
                <Text style={[styles.visibilityChipText, visibility === v && styles.visibilityChipTextActive]}>
                  {v === "marketplace" ? "Marketplace" : "Profile Only"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Available for booking toggle */}
        <View style={styles.toggleField} testID="field-available">
          <Text style={styles.fieldLabel}>Available for Booking</Text>
          <Switch
            value={availableForBooking}
            onValueChange={setAvailableForBooking}
            testID="toggle-available"
          />
        </View>

        {/* Compliance checklist */}
        <View style={styles.complianceCard} testID="compliance-checklist">
          <Text style={styles.complianceTitle}>
            {compliance.allPassing ? "✓ Ready to publish" : `${[
              compliance.titleOk, compliance.priceSet, compliance.hasPhoto,
              compliance.descriptionOk, compliance.categorySelected,
            ].filter(Boolean).length}/5 requirements met`}
          </Text>
          {[
            { label: "Title ≤ 80 chars", ok: compliance.titleOk },
            { label: "Price set", ok: compliance.priceSet },
            { label: "At least 1 photo", ok: compliance.hasPhoto },
            { label: "Description ≥ 100 chars", ok: compliance.descriptionOk },
            { label: "Category selected", ok: compliance.categorySelected },
          ].map((check) => (
            <View key={check.label} style={styles.complianceRow}>
              <Text style={check.ok ? styles.checkOk : styles.checkFail}>
                {check.ok ? "✓" : "✗"}
              </Text>
              <Text style={[styles.complianceLabel, !check.ok && styles.complianceLabelFail]}>
                {check.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    gap: 8,
  },
  backLabel: { fontSize: 16, color: "#007AFF", marginRight: 4 },
  title: { flex: 1, fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  draftLabel: { fontSize: 14, color: "#007AFF" },
  disabled: { opacity: 0.4 },
  publishBtn: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  publishBtnDisabled: { backgroundColor: "#c0c0c0" },
  publishBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  errorBanner: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  errorText: { color: "#ef4444", fontSize: 13 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  field: { marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 4 },
  required: { color: "#ef4444" },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1a1a1a",
  },
  textArea: { minHeight: 100, textAlignVertical: "top" },
  charCount: { fontSize: 11, color: "#aaa", textAlign: "right", marginTop: 2 },
  charCountWarn: { color: "#f59e0b" },
  row: { flexDirection: "row", gap: 12 },
  picker: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerValue: { fontSize: 14, color: "#1a1a1a" },
  pickerPlaceholder: { fontSize: 14, color: "#aaa" },
  categoryDropdown: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: 2,
    overflow: "hidden",
  },
  categoryOption: { paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  categoryOptionActive: { backgroundColor: "#eff6ff" },
  categoryOptionText: { fontSize: 14, color: "#333" },
  categoryOptionTextActive: { color: "#007AFF", fontWeight: "600" },
  visibilityRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  visibilityChip: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f0f0f0",
  },
  visibilityChipActive: { backgroundColor: "#eff6ff" },
  visibilityChipText: { fontSize: 14, color: "#666" },
  visibilityChipTextActive: { color: "#007AFF", fontWeight: "600" },
  toggleField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  complianceCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
  },
  complianceTitle: { fontSize: 14, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  complianceRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  checkOk: { fontSize: 14, color: "#10b981", fontWeight: "700" },
  checkFail: { fontSize: 14, color: "#ef4444", fontWeight: "700" },
  complianceLabel: { fontSize: 13, color: "#555" },
  complianceLabelFail: { color: "#ef4444" },
});
