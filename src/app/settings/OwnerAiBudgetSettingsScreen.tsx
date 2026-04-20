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

function formatAuditCreatedAt(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  if (value && typeof value === "object" && "toDate" in value) {
    const dateMaybe = (value as { toDate?: () => Date }).toDate;
    if (typeof dateMaybe === "function") {
      return dateMaybe().toISOString();
    }
  }

  return "n/a";
}

export function OwnerAiBudgetSettingsScreen({
  userId,
  service,
  onBack,
}: OwnerAiBudgetSettingsScreenProps) {
  const {
    config,
    auditLogs,
    auditEventTypeFilter,
    auditLoadingMore,
    auditHasMore,
    loading,
    updating,
    error,
    refresh,
    applyAuditEventTypeFilter,
    resetAuditFilters,
    loadMoreAuditLogs,
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

      <View style={styles.auditSection}>
        <Text style={styles.auditTitle}>Recent budget audit events</Text>
        <Text style={styles.auditFilterMeta}>
          Active filter: {auditEventTypeFilter ?? "all events"}
        </Text>
        <View style={styles.auditFilterRow}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => void applyAuditEventTypeFilter("ai_budget_config_update")}
            style={styles.buttonSecondary}
          >
            <Text style={styles.buttonText}>Show config updates only</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => void resetAuditFilters()}
            style={styles.buttonSecondary}
          >
            <Text style={styles.buttonText}>Reset audit filters</Text>
          </TouchableOpacity>
        </View>
        {loading ? <Text style={styles.auditItemMeta}>Loading audit history...</Text> : null}
        {!loading && auditLogs.length === 0 ? (
          <Text style={styles.auditItemMeta}>No audit events yet.</Text>
        ) : null}
        {auditLogs.map((item) => (
          <View key={item.id} style={styles.auditItemCard}>
            <Text style={styles.auditItemTitle}>{item.eventType ?? "unknown_event"}</Text>
            <Text style={styles.auditItemMeta}>Target: {item.targetPath ?? "n/a"}</Text>
            <Text style={styles.auditItemMeta}>Actor: {item.actorUserId ?? "n/a"}</Text>
            <Text style={styles.auditItemMeta}>Reason: {item.reason ?? "n/a"}</Text>
            <Text style={styles.auditItemMeta}>Created: {formatAuditCreatedAt(item.createdAt)}</Text>
          </View>
        ))}

        {auditHasMore ? (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => void loadMoreAuditLogs()}
            style={styles.buttonSecondary}
          >
            <Text style={styles.buttonText}>
              {auditLoadingMore ? "Loading more..." : "Load more audit events"}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

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
  auditSection: {
    marginTop: 18,
    width: "100%",
  },
  auditTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  auditFilterMeta: {
    marginTop: 8,
    fontSize: 12,
    color: "#4b5563",
    textAlign: "center",
  },
  auditFilterRow: {
    marginTop: 8,
    width: "100%",
  },
  auditItemCard: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  auditItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  auditItemMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#4b5563",
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
    textAlign: "center",
  },
  guardText: {
    marginTop: 10,
    fontSize: 13,
    color: "#7f1d1d",
    textAlign: "center",
  },
});
