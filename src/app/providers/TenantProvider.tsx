import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

type TenantContextValue = {
  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

export function TenantProvider({ children }: PropsWithChildren) {
  const [tenantId, setTenantId] = useState<string | null>(null);

  const value = useMemo<TenantContextValue>(() => ({ tenantId, setTenantId }), [tenantId]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return ctx;
}
