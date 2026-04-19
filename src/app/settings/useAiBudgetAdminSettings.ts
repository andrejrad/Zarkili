import { useCallback, useState } from "react";

import type { UpdateAiBudgetConfigInput } from "../../domains/ai";
import type { AiBudgetGuardConfig } from "../../shared/ai";

export type AiBudgetAdminSettingsService = {
  getBudgetConfigForAdmin: (actor: { userId: string }) => Promise<AiBudgetGuardConfig>;
  updateBudgetConfigForAdmin: (
    actor: { userId: string },
    input: UpdateAiBudgetConfigInput
  ) => Promise<AiBudgetGuardConfig>;
};

export type UseAiBudgetAdminSettingsState = {
  config: AiBudgetGuardConfig | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateConfig: (input: UpdateAiBudgetConfigInput) => Promise<void>;
};

export function useAiBudgetAdminSettings(
  userId: string | null,
  service: AiBudgetAdminSettingsService | null
): UseAiBudgetAdminSettingsState {
  const [config, setConfig] = useState<AiBudgetGuardConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId || !service) {
      setConfig(null);
      setError("AI budget admin service is unavailable");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const nextConfig = await service.getBudgetConfigForAdmin({ userId });
      setConfig(nextConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load AI budget config");
    } finally {
      setLoading(false);
    }
  }, [service, userId]);

  const updateConfig = useCallback(
    async (input: UpdateAiBudgetConfigInput) => {
      if (!userId || !service) {
        setError("AI budget admin service is unavailable");
        return;
      }

      setUpdating(true);
      setError(null);
      try {
        const nextConfig = await service.updateBudgetConfigForAdmin({ userId }, input);
        setConfig(nextConfig);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update AI budget config");
      } finally {
        setUpdating(false);
      }
    },
    [service, userId]
  );

  return {
    config,
    loading,
    updating,
    error,
    refresh,
    updateConfig,
  };
}
