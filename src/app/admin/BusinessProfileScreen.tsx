/**
 * W38 — BusinessProfileScreen: editable business profile form.
 *
 * Loads the current profile from tenantLocationAdminService on mount and
 * writes changes via updateBusinessProfile.  Slug is display-only (changing
 * slugs requires a migration and is not self-service).
 */
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { brandTypography } from "../../shared/ui/brandTypography";
import { AdminErrorState, AdminLoadingState } from "./AdminPatterns";
import type { TenantLocationAdminService } from "./tenantLocationAdminService";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type BusinessProfileScreenProps = {
  tenantId: string;
  service: TenantLocationAdminService | null;
  onBack: () => void;
};

export function BusinessProfileScreen({ tenantId, service, onBack }: BusinessProfileScreenProps) {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [country, setCountry] = useState("");
  const [timezone, setTimezone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  function load() {
    if (!service || !tenantId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    void (async () => {
      const result = await service.readTenantProfile(tenantId);
      if (cancelled) return;
      if (result.ok) {
        setName(result.data.name);
        setSlug(result.data.slug);
        setCountry(result.data.country);
        setTimezone(result.data.timezone);
      } else {
        setLoadError(result.message);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { return load(); }, [tenantId, service]);

  async function handleSubmit() {
    if (!service || !tenantId || !name.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    const result = await service.updateBusinessProfile(tenantId, {
      name: name.trim(),
      country: country.trim(),
      timezone: timezone.trim(),
    });
    setSubmitting(false);
    if (result.ok) {
      setSubmitSuccess(true);
    } else {
      setSubmitError(result.message);
    }
  }

  if (loading) return <AdminLoadingState label="Loading profile…" />;
  if (loadError) return <AdminErrorState message={loadError} onRetry={load} />;

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <Pressable accessibilityRole="button" onPress={onBack} style={styles.backRow}>
        <Text style={styles.backLabel}>‹ Settings</Text>
      </Pressable>
      <Text style={styles.pageTitle}>Business profile</Text>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>Business name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={(v) => { setName(v); setSubmitSuccess(false); }}
          placeholder="My Salon LLC"
          accessibilityLabel="Business name"
        />

        <Text style={styles.inputLabel}>Slug (read-only)</Text>
        <View style={styles.readOnlyInput}>
          <Text style={styles.readOnlyText}>{slug}</Text>
        </View>

        <Text style={styles.inputLabel}>Country code</Text>
        <TextInput
          style={styles.input}
          value={country}
          onChangeText={(v) => { setCountry(v); setSubmitSuccess(false); }}
          placeholder="US"
          autoCapitalize="characters"
          maxLength={2}
          accessibilityLabel="Country code"
        />

        <Text style={styles.inputLabel}>Timezone</Text>
        <TextInput
          style={styles.input}
          value={timezone}
          onChangeText={(v) => { setTimezone(v); setSubmitSuccess(false); }}
          placeholder="America/New_York"
          autoCapitalize="none"
          accessibilityLabel="Timezone"
        />

        {submitError ? (
          <Text style={styles.errorMsg}>{submitError}</Text>
        ) : null}
        {submitSuccess ? (
          <Text style={styles.successMsg}>Profile saved successfully.</Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting || !name.trim()}
          onPress={() => void handleSubmit()}
          style={[styles.ctaButton, (submitting || !name.trim()) ? styles.ctaDisabled : null]}
        >
          <Text style={styles.ctaLabel}>{submitting ? "Saving…" : "Save profile"}</Text>
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
  readOnlyInput: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E0D1",
    borderRadius: 10,
    paddingHorizontal: 12,
    justifyContent: "center",
    backgroundColor: "#F9F8F5",
  },
  readOnlyText: {
    fontSize: 15,
    fontFamily: brandTypography.regular,
    color: "#9CA3AF",
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
