import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import type { MigrationJob, MigrationJobStatus } from "./platformAdminTypes";

export type MigrationRunnerScreenProps = {
  loading: boolean;
  triggering: boolean;
  error: string | null;
  jobs: MigrationJob[];
  onTriggerJob: (jobId: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const STATUS_COLORS: Record<MigrationJobStatus, string> = {
  pending: "#6b7280",
  running: "#3b82f6",
  completed: "#10b981",
  failed: "#ef4444",
};

export function MigrationRunnerScreen({
  loading,
  triggering,
  error,
  jobs,
  onTriggerJob,
  onRetry,
  onBack,
  testID = "migration-runner-screen",
}: MigrationRunnerScreenProps) {
  if (loading) {
    return (
      <View style={styles.center} testID={testID}>
        <ActivityIndicator testID="loading-indicator" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center} testID={testID}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={onRetry} testID="retry-btn" style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Migration Runner</Text>
      </View>

      <Text style={styles.description}>
        Run platform-wide data migrations. Migrations are idempotent and logged.
      </Text>

      <ScrollView style={styles.scroll}>
        {jobs.length === 0 && (
          <Text style={styles.emptyText}>No migration jobs available.</Text>
        )}
        {jobs.map((job) => (
          <View key={job.jobId} style={styles.jobCard} testID={`job-${job.jobId}`}>
            <View style={styles.jobHeader}>
              <Text style={styles.jobName}>{job.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[job.status] }]}>
                <Text style={styles.statusText}>{job.status}</Text>
              </View>
            </View>
            <Text style={styles.jobDesc}>{job.description}</Text>

            {job.status === "running" && job.progressPct !== undefined && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${job.progressPct}%` as `${number}%` }]} />
              </View>
            )}

            {job.errorMessage && (
              <Text style={styles.errorMsg}>{job.errorMessage}</Text>
            )}

            <View style={styles.jobMeta}>
              {job.affectedTenants !== undefined && (
                <Text style={styles.metaText}>Affects {job.affectedTenants} tenants</Text>
              )}
              {job.completedAt && (
                <Text style={styles.metaText}>Completed {job.completedAt.slice(0, 10)}</Text>
              )}
            </View>

            {job.status === "pending" && (
              <TouchableOpacity
                style={[styles.runBtn, triggering && styles.btnDisabled]}
                onPress={() => onTriggerJob(job.jobId)}
                disabled={triggering}
                testID={`run-btn-${job.jobId}`}
              >
                <Text style={styles.runBtnText}>{triggering ? "Triggering…" : "Run Migration"}</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  backText: { color: "#6b7280", marginRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  description: { fontSize: 13, color: "#6b7280", padding: 16 },
  scroll: { flex: 1 },
  jobCard: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 8, padding: 16, borderRadius: 8 },
  jobHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  jobName: { fontSize: 14, fontWeight: "700", color: "#111827", flex: 1, marginRight: 8 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { color: "#ffffff", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  jobDesc: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  progressBar: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, marginBottom: 8 },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: "#3b82f6" },
  errorMsg: { fontSize: 12, color: "#ef4444", marginBottom: 8 },
  jobMeta: { flexDirection: "row", gap: 12, marginBottom: 8 },
  metaText: { fontSize: 11, color: "#9ca3af" },
  runBtn: { backgroundColor: "#1d4ed8", padding: 12, borderRadius: 6, alignItems: "center" },
  runBtnText: { color: "#ffffff", fontWeight: "700" },
  btnDisabled: { opacity: 0.4 },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
