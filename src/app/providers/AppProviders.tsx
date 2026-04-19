import { PropsWithChildren } from "react";

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

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <AppProvidersWithinAuth>{children}</AppProvidersWithinAuth>
    </AuthProvider>
  );
}
