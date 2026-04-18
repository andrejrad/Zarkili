import { createContext, PropsWithChildren, useContext, useMemo } from "react";

type ThemeTokens = {
  primary: string;
  background: string;
  text: string;
};

const defaultTheme: ThemeTokens = {
  primary: "#1F4D3A",
  background: "#F6F5F1",
  text: "#1A1A1A"
};

const ThemeContext = createContext<ThemeTokens | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const value = useMemo(() => defaultTheme, []);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
