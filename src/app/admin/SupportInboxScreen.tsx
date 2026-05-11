import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

export type SupportInboxScreenProps = {
  loading: boolean;
  error: string | null;
  vendorEmbedUrl: string;
  onRetry: () => void;
  onBack: () => void;
  testID?: string;
};

export function SupportInboxScreen({
  loading,
  error,
  vendorEmbedUrl,
  onRetry,
  onBack,
  testID = "support-inbox-screen",
}: SupportInboxScreenProps) {
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
        <Text style={styles.title}>Support Inbox</Text>
      </View>

      {/* Vendor embed stub — replace with real WebView or Zendesk SDK in production */}
      <View style={styles.embedStub} testID="vendor-embed-stub">
        <Text style={styles.embedIcon}>🎧</Text>
        <Text style={styles.embedTitle}>Support Inbox</Text>
        <Text style={styles.embedSubtitle}>
          Powered by your support vendor (Zendesk / Intercom)
        </Text>
        <Text style={styles.embedUrl}>{vendorEmbedUrl}</Text>
        <ScrollView style={styles.ticketList}>
          <Text style={styles.stubNote}>
            Vendor embed integration pending. Tickets will appear here once the SDK is configured.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f9fafb" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#ffffff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  backText: { color: "#6b7280", marginRight: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  embedStub: { flex: 1, alignItems: "center", padding: 32 },
  embedIcon: { fontSize: 48, marginBottom: 12 },
  embedTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 4 },
  embedSubtitle: { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 12 },
  embedUrl: { fontSize: 11, color: "#9ca3af", fontFamily: "monospace", marginBottom: 24 },
  ticketList: { width: "100%" },
  stubNote: { fontSize: 13, color: "#9ca3af", textAlign: "center", fontStyle: "italic" },
  errorText: { color: "#ef4444", marginBottom: 12 },
  retryBtn: { backgroundColor: "#3b82f6", padding: 10, borderRadius: 8 },
  retryText: { color: "#ffffff", fontWeight: "600" },
});
