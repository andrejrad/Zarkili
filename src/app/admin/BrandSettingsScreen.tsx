/**
 * W38 — BrandSettingsScreen: logo URL, brand color editor, live preview panel.
 *
 * Loads current branding from tenantLocationAdminService.readTenantProfile and
 * writes via updateBrandSettings.  Accent color is a W38 addition — accentColor
 * is stored in the branding subdocument.
 */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";

import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { TenantLocationAdminService } from "./tenantLocationAdminService";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type BrandSettingsScreenProps = {
  tenantId: string;
  service: TenantLocationAdminService | null;
  onBack: () => void;
};

export function BrandSettingsScreen({ tenantId, service, onBack }: BrandSettingsScreenProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [logoUrl, setLogoUrl] = useState("");
  const [primary, setPrimary] = useState("#E3A9A0");
  const [secondary, setSecondary] = useState("#F2EDDD");
  const [accent, setAccent] = useState("#8B5CF6");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (!service || !tenantId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const result = await service.readTenantProfile(tenantId);
      if (cancelled) return;
      if (result.ok) {
        setPrimary(result.data.brandingPrimary || "#E3A9A0");
        setSecondary(result.data.brandingSecondary || "#F2EDDD");
      } else {
        setLoadError(result.message);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tenantId, service]);

  async function handleSubmit() {
    if (!service || !tenantId) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    const result = await service.updateBrandSettings(tenantId, {
      logoUrl: logoUrl.trim() || null,
      primary: primary.trim() || "#E3A9A0",
      secondary: secondary.trim() || "#F2EDDD",
      accent: accent.trim() || "#8B5CF6",
    });
    setSubmitting(false);
    if (result.ok) {
      setSubmitSuccess(true);
    } else {
      setSubmitError(result.message);
    }
  }

  if (loading) return <AdminLoadingState label="Loading brand settings…" />;
  if (loadError) return <AdminErrorState message={loadError} />;

  const previewPrimary = primary && primary.startsWith("#") ? primary : "#E3A9A0";
  const previewSecondary = secondary && secondary.startsWith("#") ? secondary : "#F2EDDD";
  const previewAccent = accent && accent.startsWith("#") ? accent : "#8B5CF6";

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Settings</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Brand settings</Text>

      {/* Live preview panel */}
      <View style={[styles.preview, { backgroundColor: previewSecondary }]}>
        <Text style={styles.previewSalonName}>Preview</Text>
        <Pressable style={[styles.previewBookBtn, { backgroundColor: previewPrimary }]}>
          <Text style={styles.previewBookLabel}>Book now</Text>
        </Pressable>
        <View style={[styles.previewAccentDot, { backgroundColor: previewAccent }]} />
      </View>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>Logo URL (optional)</Text>
        <TextInput
          style={styles.input}
          value={logoUrl}
          onChangeText={(v) => { setLogoUrl(v); setSubmitSuccess(false); }}
          placeholder="https://example.com/logo.png"
          autoCapitalize="none"
          keyboardType="url"
          accessibilityLabel="Logo URL"
        />

        <Text style={styles.inputLabel}>Primary color</Text>
        <View style={styles.colorRow}>
          <TextInput
            style={[styles.input, styles.colorInput]}
            value={primary}
            onChangeText={(v) => { setPrimary(v); setSubmitSuccess(false); }}
            placeholder="#E3A9A0"
            autoCapitalize="none"
            maxLength={7}
            accessibilityLabel="Primary color hex"
          />
          <View
            style={[
              styles.colorSwatch,
              { backgroundColor: previewPrimary },
            ]}
          />
        </View>

        <Text style={styles.inputLabel}>Secondary color</Text>
        <View style={styles.colorRow}>
          <TextInput
            style={[styles.input, styles.colorInput]}
            value={secondary}
            onChangeText={(v) => { setSecondary(v); setSubmitSuccess(false); }}
            placeholder="#F2EDDD"
            autoCapitalize="none"
            maxLength={7}
            accessibilityLabel="Secondary color hex"
          />
          <View
            style={[
              styles.colorSwatch,
              { backgroundColor: previewSecondary },
            ]}
          />
        </View>

        <Text style={styles.inputLabel}>Accent color</Text>
        <View style={styles.colorRow}>
          <TextInput
            style={[styles.input, styles.colorInput]}
            value={accent}
            onChangeText={(v) => { setAccent(v); setSubmitSuccess(false); }}
            placeholder="#8B5CF6"
            autoCapitalize="none"
            maxLength={7}
            accessibilityLabel="Accent color hex"
          />
          <View
            style={[
              styles.colorSwatch,
              { backgroundColor: previewAccent },
            ]}
          />
        </View>

        {submitError ? <Text style={styles.errorMsg}>{submitError}</Text> : null}
        {submitSuccess ? <Text style={styles.successMsg}>Brand settings saved.</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          onPress={() => void handleSubmit()}
          style={[styles.ctaButton, submitting ? styles.ctaDisabled : null]}
        >
          <Text style={styles.ctaLabel}>
            {submitting ? "Saving…" : "Save brand settings"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: { flexGrow: 1, paddingBottom: 32, gap: 16 },
  backRow: { paddingBottom: 4 },
  backLabel: {
    fontSize: 14,
    fontFamily: brandTypography.regular,
    color: "#6B6B6B",
  },
  pageTitle: {
    fontSize: 26,
    lineHeight: 34,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
  },
  preview: {
    borderRadius: 16,
    padding: 20,
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E0D1",
  },
  previewSalonName: {
    fontSize: 18,
    fontFamily: brandTypography.semibold,
    color: "#1A1A1A",
  },
  previewBookBtn: {
    borderRadius: 9999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  previewBookLabel: {
    fontSize: 14,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
  previewAccentDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    padding: 16,
    gap: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: brandTypography.medium,
    color: "#1A1A1A",
    marginTop: 10,
    marginBottom: 2,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: brandTypography.regular,
    color: "#1A1A1A",
    backgroundColor: "#FFFFFF",
  },
  colorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colorInput: {
    flex: 1,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E0D1",
  },
  errorMsg: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#EF4444",
    marginTop: 4,
  },
  successMsg: {
    fontSize: 13,
    fontFamily: brandTypography.regular,
    color: "#22C55E",
    marginTop: 4,
  },
  ctaButton: {
    marginTop: 14,
    backgroundColor: "#E3A9A0",
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.5 },
  ctaLabel: {
    fontSize: 15,
    fontFamily: brandTypography.medium,
    color: "#FFFFFF",
  },
});
