import { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { UpdateAiBudgetConfigInput } from "../../domains/ai";

import {
  useAiBudgetAdminSettings,
  type AiBudgetAdminSettingsService,
} from "./useAiBudgetAdminSettings";

type OwnerAiBudgetSettingsScreenProps = {
  userId: string | null;
  service: AiBudgetAdminSettingsService | null;
  onBack: () => void;
};

export function OwnerAiBudgetSettingsScreen({
  userId,
  service,
  onBack,
}: OwnerAiBudgetSettingsScreenProps) {
  const {
    config,
    loading,
    updating,
    error,
    refresh,
    updateConfig,
  } = useAiBudgetAdminSettings(userId, service);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function increaseSupportTriageCapByTen() {
    if (!config) {
      return;
    }

    const patch: UpdateAiBudgetConfigInput = {
      featureCaps: {
        "support-triage": {
          monthlyCapUsd: config.featureCaps["support-triage"].monthlyCapUsd + 10,
        },
      },
    };
    await updateConfig(patch);
  }

  return (
    <>
      <Text style={styles.screenTitle}>AI budget settings</Text>
      <Text style={styles.screenBody}>
        Owner-only controls for AI monthly caps and budget thresholds.
      </Text>
      {loading ? <Text style={styles.screenBody}>Loading AI budget config...</Text> : null}
      {error ? <Text style={styles.guardText}>{error}</Text> : null}
      {config ? (
        <View>
          <Text style={styles.screenBody}>Global cap USD: {config.globalMonthlyCapUsd}</Text>
          <Text style={styles.screenBody}>
            Support triage cap USD: {config.featureCaps["support-triage"].monthlyCapUsd}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => void refresh()}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Refresh budget config</Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => void increaseSupportTriageCapByTen()}
        style={styles.buttonSecondary}
      >
        <Text style={styles.buttonText}>
          {updating ? "Updating..." : "Increase support triage cap (+10)"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity accessibilityRole="button" onPress={onBack} style={styles.buttonSecondary}>
        <Text style={styles.buttonText}>Back</Text>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  screenBody: {
    marginTop: 8,
    fontSize: 15,
    color: "#4b5563",
    textAlign: "center",
  },
  button: {
    marginTop: 16,
    backgroundColor: "#111827",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonSecondary: {
    marginTop: 12,
    backgroundColor: "#374151",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#f9fafb",
    fontWeight: "600",
  },
  guardText: {
    marginTop: 10,
    fontSize: 13,
    color: "#7f1d1d",
    textAlign: "center",
  },
});
