import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

import { AppProviders } from "./src/app/providers/AppProviders";

export default function App() {
  return (
    <AppProviders>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Zarkili</Text>
          <Text style={styles.subtitle}>Day 0 bootstrap is ready.</Text>
          <StatusBar style="auto" />
        </View>
      </SafeAreaView>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f7f9"
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: "#111827"
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: "#4b5563"
  }
});
