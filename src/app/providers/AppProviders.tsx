import { PropsWithChildren } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";

import type { AuthRepository, SocialAuthService } from "../../domains/auth";

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
  socialAuthService?: SocialAuthService | null;
}>;

export function AppProviders({ children, authRepository, socialAuthService }: AppProvidersProps) {
  return (
    <SafeAreaProvider>
      <AuthProvider authRepository={authRepository} socialAuthService={socialAuthService}>
        <AppProvidersWithinAuth>{children}</AppProvidersWithinAuth>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
