import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import type { BackupJob, BackupJobStatus } from "./platformAdminTypes";

export type BackupRestoreStatusScreenProps = {
  loading: boolean;
  error: string | null;
  jobs: BackupJob[];
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const STATUS_COLORS: Record<BackupJobStatus, string> = {
  scheduled: "#6b7280",
  running: "#3b82f6",
  completed: "#10b981",
  failed: "#ef4444",
};

function formatBytes(bytes?: number): string {
  if (!bytes) return "—";
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

export function BackupRestoreStatusScreen({
  loading,
  error,
  jobs,
  onRetry,
  onBack,
  testID = "backup-restore-status-screen",
}: BackupRestoreStatusScreenProps) {
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

  const lastCompleted = jobs.find((j) => j.status === "completed");

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Backup / Restore Status</Text>
      </View>

      {lastCompleted && (
        <View style={styles.lastBackupBanner} testID="last-backup-banner">
          <Text style={styles.lastBackupText}>
            Last backup: {lastCompleted.completedAt?.slice(0, 16).replace("T", " ")} — {formatBytes(lastCompleted.sizeBytes)}
          </Text>
        </View>
      )}

      <ScrollView style={styles.scroll}>
        {jobs.length === 0 && (
          <Text style={styles.emptyText}>No backup jobs on record.</Text>
        )}
        {jobs.map((job) => (
          <View key={job.jobId} style={styles.jobRow} testID={`job-${job.jobId}`}>
            <View style={styles.jobLeft}>
              <Text style={styles.jobScope}>{job.scope.toUpperCase()} BACKUP</Text>
              <Text style={styles.jobDate}>
                {job.startedAt ? job.startedAt.slice(0, 16).replace("T", " ") : "Scheduled"}
              </Text>
              {job.storagePath && (
                <Text style={styles.storagePath} numberOfLines={1}>{job.storagePath}</Text>
              )}
              {job.errorMessage && (
                <Text style={styles.errorMsg}>{job.errorMessage}</Text>
              )}
            </View>
            <View style={styles.jobRight}>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[job.status] }]}>
                <Text style={styles.statusText}>{job.status}</Text>
              </View>
              <Text style={styles.sizeText}>{formatBytes(job.sizeBytes)}</Text>
            </View>
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
  lastBackupBanner: { backgroundColor: "#f0fdf4", padding: 12, margin: 12, borderRadius: 8 },
  lastBackupText: { fontSize: 13, color: "#065f46", fontWeight: "500" },
  scroll: { flex: 1 },
  jobRow: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 8, padding: 16, borderRadius: 8, flexDirection: "row", justifyContent: "space-between" },
  jobLeft: { flex: 1 },
  jobScope: { fontSize: 13, fontWeight: "700", color: "#111827" },
  jobDate: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  storagePath: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  errorMsg: { fontSize: 12, color: "#ef4444", marginTop: 4 },
  jobRight: { alignItems: "flex-end", gap: 4 },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { color: "#ffffff", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  sizeText: { fontSize: 12, color: "#6b7280" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
