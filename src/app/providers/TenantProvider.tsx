import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useRef, useState } from "react";

type TenantContextValue = {
  tenantId: string | null;
  setTenantId: (tenantId: string | null) => void;
};

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

type TenantProviderProps = PropsWithChildren<{
  authUserId?: string | null;
}>;

export function TenantProvider({ children, authUserId }: TenantProviderProps) {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const previousAuthUserIdRef = useRef<string | null | undefined>(authUserId);

  useEffect(() => {
    const previousAuthUserId = previousAuthUserIdRef.current;
    if (previousAuthUserId !== authUserId) {
      setTenantId(null);
    }
    previousAuthUserIdRef.current = authUserId;
  }, [authUserId]);

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
