import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

export type AdminSignInScreenProps = {
  loading: boolean;
  error: string | null;
  onSignIn: (email: string, password: string) => void;
  testID?: string;
};

export function AdminSignInScreen({
  loading,
  error,
  onSignIn,
  testID = "admin-sign-in-screen",
}: AdminSignInScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isValid = email.includes("@") && password.length >= 8;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      testID={testID}
    >
      <View style={styles.card}>
        <Text style={styles.logo}>🔒</Text>
        <Text style={styles.title}>Platform Admin</Text>
        <Text style={styles.subtitle}>Sign in with your platform administrator account</Text>

        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="admin@platform.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          testID="email-input"
        />

        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
          autoComplete="password"
          testID="password-input"
        />

        {error && (
          <Text style={styles.errorText} testID="error-message">{error}</Text>
        )}

        <TouchableOpacity
          style={[styles.signInBtn, (!isValid || loading) && styles.btnDisabled]}
          onPress={() => isValid && onSignIn(email.trim(), password)}
          disabled={!isValid || loading}
          testID="sign-in-btn"
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.signInBtnText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.securityNote}>
          All admin sign-ins are logged and monitored.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  card: { width: "90%", maxWidth: 400, backgroundColor: "#ffffff", borderRadius: 16, padding: 32 },
  logo: { fontSize: 40, textAlign: "center", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 24 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 12 },
  errorText: { color: "#ef4444", fontSize: 13, marginBottom: 12, textAlign: "center" },
  signInBtn: { backgroundColor: "#1d4ed8", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 4 },
  signInBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 15 },
  btnDisabled: { opacity: 0.4 },
  securityNote: { fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 16 },
});
