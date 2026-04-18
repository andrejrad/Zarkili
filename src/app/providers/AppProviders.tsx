import { PropsWithChildren } from "react";

import { AuthProvider } from "./AuthProvider";
import { TenantProvider } from "./TenantProvider";
import { ThemeProvider } from "./ThemeProvider";
import { LanguageProvider } from "./LanguageProvider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <TenantProvider>
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </TenantProvider>
    </AuthProvider>
  );
}
