import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

export type RoleDeniedScreenProps = {
  requiredRole: string;
  currentRole: string;
  screenName: string;
  onGoBack: () => void;
  onGoHome: () => void;
  testID?: string;
};

export function RoleDeniedScreen({
  requiredRole,
  currentRole,
  screenName,
  onGoBack,
  onGoHome,
  testID = "role-denied-screen",
}: RoleDeniedScreenProps) {
  return (
    <View style={styles.root} testID={testID}>
      <Text style={styles.icon}>🚫</Text>
      <Text style={styles.title} testID="denied-title">Access Denied</Text>
      <Text style={styles.message} testID="denied-message">
        You need <Text style={styles.bold}>{requiredRole}</Text> permissions to access{" "}
        <Text style={styles.bold}>{screenName}</Text>.
      </Text>
      <Text style={styles.currentRole} testID="current-role">
        Your current role: {currentRole}
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.backBtn} onPress={onGoBack} testID="go-back-btn">
          <Text style={styles.backBtnText}>← Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} testID="go-home-btn">
          <Text style={styles.homeBtnText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb", padding: 32 },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 12 },
  message: { fontSize: 15, color: "#374151", textAlign: "center", lineHeight: 22, marginBottom: 8 },
  bold: { fontWeight: "700" },
  currentRole: { fontSize: 13, color: "#9ca3af", marginBottom: 32 },
  actions: { gap: 12 },
  backBtn: { backgroundColor: "#f3f4f6", padding: 14, borderRadius: 8, borderWidth: 1, borderColor: "#d1d5db", alignItems: "center", minWidth: 180 },
  backBtnText: { color: "#374151", fontWeight: "600" },
  homeBtn: { backgroundColor: "#1d4ed8", padding: 14, borderRadius: 8, alignItems: "center", minWidth: 180 },
  homeBtnText: { color: "#ffffff", fontWeight: "700" },
});
