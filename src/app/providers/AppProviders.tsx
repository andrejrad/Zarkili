import { PropsWithChildren } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { AuthRepository } from "../../domains/auth";

import { AuthProvider, useAuth } from "./AuthProvider";
import { TenantProvider } from "./TenantProvider";
import { ThemeProvider } from "./ThemeProvider";
import { LanguageProvider } from "./LanguageProvider";

function AppProvidersWithinAuth({ children }: PropsWithChildren) {
  const { userId } = useAuth();

  return (
    <TenantProvider authUserId={userId}>
      <ThemeProvider>
        <LanguageProvider>{children}</LanguageProvider>
      </ThemeProvider>
    </TenantProvider>
  );
}

type AppProvidersProps = PropsWithChildren<{
  authRepository?: AuthRepository | null;
}>;

export function AppProviders({ children, authRepository }: AppProvidersProps) {
  return (
    <SafeAreaProvider>
      <AuthProvider authRepository={authRepository}>
        <AppProvidersWithinAuth>{children}</AppProvidersWithinAuth>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
