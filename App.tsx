import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, View } from "react-native";

import { AppProviders } from "./src/app/providers/AppProviders";
import { AppNavigatorShell } from "./src/app/navigation";

export default function App() {
  return (
    <AppProviders>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <AppNavigatorShell />
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
    justifyContent: "center"
  }
});
