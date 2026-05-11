import {
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  useFonts,
} from "@expo-google-fonts/manrope";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StripeProvider } from "@stripe/stripe-react-native";
import Constants from "expo-constants";

import { AppProviders } from "./src/app/providers/AppProviders";
import { appAuthRepository, appSocialAuthService } from "./src/app/auth/runtime";
import { tenantLocationAdminService, staffAdminService, serviceAdminService, ownerKpiService } from "./src/app/admin/runtime";
import { AppNavigatorShell } from "./src/app/navigation";
import { appDiscoveryService } from "./src/app/navigation/runtime";
import { appClientBookingFlow } from "./src/app/bookings/runtime";
import { appPaymentsRepository } from "./src/app/payments/runtime";
import {
  appAiBudgetAdminService,
  resolvePlatformAdminFromAuthClaims,
} from "./src/app/settings/runtime";
import { consumerLoyaltyService } from "./src/app/loyalty/consumerLoyaltyRuntime";
import { consumerMessagingService } from "./src/app/messaging/consumerMessagingRuntime";
import { consumerNotificationService } from "./src/app/notifications/consumerNotificationRuntime";
import { appWizardService, appWaitlistRepository } from "./src/app/onboarding/salonOnboardingRuntime";

// ---------------------------------------------------------------------------
// Error boundary — catches JS crashes in the render tree and shows a message
// instead of a blank white page.
// ---------------------------------------------------------------------------
type EBState = { hasError: boolean; message: string };
class AppErrorBoundary extends React.Component<React.PropsWithChildren, EBState> {
  state: EBState = { hasError: false, message: "" };
  static getDerivedStateFromError(err: unknown): EBState {
    const message = err instanceof Error ? err.message : String(err);
    return { hasError: true, message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.detail}>{this.state.message}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}
const errorStyles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 8, color: "#c00" },
  detail: { fontSize: 13, color: "#555", textAlign: "center" },
});

export default function App() {
  // `fontError` is non-null when loading fails (e.g. on some mobile browsers).
  // Render the app regardless — system fonts will be used as fallback.
  const [fontsLoaded, fontError] = useFonts({
    "Manrope-Light": Manrope_300Light,
    "Manrope-Regular": Manrope_400Regular,
    "Manrope-Medium": Manrope_500Medium,
    "Manrope-SemiBold": Manrope_600SemiBold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // stripePublishableKey is only set in production / EAS dev-client builds.
  // When absent (e.g. Expo Go, web) we skip StripeProvider so the app boots
  // without the Stripe native module. Stripe payment screens still render but
  // the live payment sheet is non-functional — acceptable for W35 mock QA.
  const stripePublishableKey =
    (Constants.expoConfig?.extra?.stripePublishableKey as string | undefined) ?? "";

  const shell = (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        <AppNavigatorShell
          discoveryService={appDiscoveryService}
          tenantLocationAdminService={tenantLocationAdminService}
          staffAdminService={staffAdminService}
          ownerKpiService={ownerKpiService}
          serviceAdminService={serviceAdminService}
          aiBudgetAdminService={appAiBudgetAdminService}
          isPlatformAdminUser={resolvePlatformAdminFromAuthClaims}
          clientBookingFlow={appClientBookingFlow}
          paymentsRepository={appPaymentsRepository}
          consumerLoyaltyService={consumerLoyaltyService}
          consumerMessagingService={consumerMessagingService}
          consumerNotificationService={consumerNotificationService}
          waitlistRepository={appWaitlistRepository}
          wizardService={appWizardService}
        />
        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );

  return (
    <AppErrorBoundary>
      <AppProviders authRepository={appAuthRepository} socialAuthService={appSocialAuthService}>
        {stripePublishableKey ? (
          <StripeProvider
            publishableKey={stripePublishableKey}
            merchantIdentifier="merchant.com.zarkili"
          >
            {shell}
          </StripeProvider>
        ) : (
          shell
        )}
      </AppProviders>
    </AppErrorBoundary>
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
