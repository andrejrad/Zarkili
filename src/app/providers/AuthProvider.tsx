import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

type AuthContextValue = {
  userId: string | null;
  signInAsDev: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [userId, setUserId] = useState<string | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      userId,
      signInAsDev: () => setUserId("dev-user"),
      signOut: () => setUserId(null)
    }),
    [userId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
