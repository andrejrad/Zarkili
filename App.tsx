import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AppProviders } from "./src/app/providers/AppProviders";
import { appAuthRepository } from "./src/app/auth/runtime";
import { tenantLocationAdminService, staffAdminService, serviceAdminService } from "./src/app/admin/runtime";
import { AppNavigatorShell } from "./src/app/navigation";
import { appDiscoveryService } from "./src/app/navigation/runtime";
import {
  appAiBudgetAdminService,
  resolvePlatformAdminFromAuthClaims,
} from "./src/app/settings/runtime";

export default function App() {
  const [fontsLoaded] = useFonts({
    "Manrope-Light": Manrope_300Light,
    "Manrope-Regular": Manrope_400Regular,
    "Manrope-Medium": Manrope_500Medium,
    "Manrope-SemiBold": Manrope_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AppProviders authRepository={appAuthRepository}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.container}>
          <AppNavigatorShell
            discoveryService={appDiscoveryService}
            tenantLocationAdminService={tenantLocationAdminService}
            staffAdminService={staffAdminService}
            serviceAdminService={serviceAdminService}
            aiBudgetAdminService={appAiBudgetAdminService}
            isPlatformAdminUser={resolvePlatformAdminFromAuthClaims}
          />
          <StatusBar style="auto" />
        </View>
      </SafeAreaView>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F2EDDD"
  },
  container: {
    flex: 1,
    width: "100%"
  }
});
