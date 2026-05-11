import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { IncidentRecord, IncidentSeverity, IncidentStatus } from "./platformAdminTypes";

export type IncidentResponseScreenProps = {
  loading: boolean;
  saving: boolean;
  error: string | null;
  incidents: IncidentRecord[];
  onUpdateStatus: (incidentId: string, status: IncidentStatus, notes?: string) => void;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  P1: "#ef4444",
  P2: "#f97316",
  P3: "#f59e0b",
  P4: "#6b7280",
};

const STATUS_COLORS: Record<IncidentStatus, string> = {
  open: "#ef4444",
  investigating: "#f59e0b",
  mitigated: "#3b82f6",
  resolved: "#10b981",
};

export function IncidentResponseScreen({
  loading,
  saving,
  error,
  incidents,
  onUpdateStatus,
  onRetry,
  onBack,
  testID = "incident-response-screen",
}: IncidentResponseScreenProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

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

  const openIncidents = incidents.filter((i) => i.status !== "resolved");

  return (
    <View style={styles.root} testID={testID}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} testID="back-btn">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Incident Response</Text>
      </View>

      {openIncidents.length > 0 && (
        <View style={styles.alertBanner} testID="open-incidents-banner">
          <Text style={styles.alertText}>{openIncidents.length} active incident{openIncidents.length !== 1 ? "s" : ""}</Text>
        </View>
      )}

      <ScrollView style={styles.scroll}>
        {incidents.length === 0 && (
          <Text style={styles.emptyText}>No incidents on record.</Text>
        )}
        {incidents.map((incident) => (
          <View key={incident.incidentId} style={styles.incidentCard} testID={`incident-${incident.incidentId}`}>
            <TouchableOpacity
              onPress={() => setExpandedId(expandedId === incident.incidentId ? null : incident.incidentId)}
            >
              <View style={styles.incidentHeader}>
                <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[incident.severity] }]}>
                  <Text style={styles.severityText}>{incident.severity}</Text>
                </View>
                <Text style={styles.incidentTitle}>{incident.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[incident.status] }]}>
                  <Text style={styles.statusText}>{incident.status}</Text>
                </View>
              </View>
              <Text style={styles.incidentDate}>
                {incident.createdAt.slice(0, 10)} · {incident.affectedServices.join(", ")}
              </Text>
            </TouchableOpacity>

            {expandedId === incident.incidentId && (
              <View style={styles.expanded} testID={`expanded-${incident.incidentId}`}>
                <Text style={styles.description}>{incident.description}</Text>
                {incident.mitigationNotes && (
                  <Text style={styles.mitigationNotes}>{incident.mitigationNotes}</Text>
                )}
                {incident.ownerEmail && (
                  <Text style={styles.owner}>Owner: {incident.ownerEmail}</Text>
                )}

                {incident.status !== "resolved" && (
                  <>
                    <TextInput
                      style={styles.notesInput}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Mitigation notes…"
                      multiline
                      testID={`notes-input-${incident.incidentId}`}
                    />
                    <View style={styles.statusButtons}>
                      {(["investigating", "mitigated", "resolved"] as IncidentStatus[])
                        .filter((s) => s !== incident.status)
                        .map((s) => (
                          <TouchableOpacity
                            key={s}
                            style={[styles.statusBtn, { backgroundColor: STATUS_COLORS[s] }]}
                            onPress={() => {
                              onUpdateStatus(incident.incidentId, s, notes || undefined);
                              setNotes("");
                              setExpandedId(null);
                            }}
                            disabled={saving}
                            testID={`status-btn-${incident.incidentId}-${s}`}
                          >
                            <Text style={styles.statusBtnText}>→ {s}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </>
                )}
              </View>
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
  alertBanner: { backgroundColor: "#fef2f2", padding: 12, alignItems: "center" },
  alertText: { color: "#dc2626", fontWeight: "700" },
  scroll: { flex: 1 },
  incidentCard: { backgroundColor: "#ffffff", marginHorizontal: 12, marginTop: 8, padding: 14, borderRadius: 8 },
  incidentHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  severityBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  severityText: { color: "#ffffff", fontSize: 11, fontWeight: "800" },
  incidentTitle: { flex: 1, fontSize: 14, fontWeight: "700", color: "#111827" },
  statusBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { color: "#ffffff", fontSize: 10, fontWeight: "700", textTransform: "uppercase" },
  incidentDate: { fontSize: 11, color: "#9ca3af" },
  expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  description: { fontSize: 13, color: "#374151", marginBottom: 8 },
  mitigationNotes: { fontSize: 12, color: "#6b7280", fontStyle: "italic", marginBottom: 8 },
  owner: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  notesInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 8, fontSize: 13, minHeight: 60, textAlignVertical: "top", marginBottom: 8 },
  statusButtons: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  statusBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 12 },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 32 },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
