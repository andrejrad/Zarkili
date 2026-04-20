import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AiBudgetAuditLogItem,
  AiBudgetAuditLogPage,
  ListAiBudgetAuditLogsInput,
  UpdateAiBudgetConfigInput,
} from "../../domains/ai";
import type { AiBudgetGuardConfig } from "../../shared/ai";

const AUDIT_LOG_PAGE_LIMIT = 10;

export type AiBudgetAdminSettingsService = {
  getBudgetConfigForAdmin: (actor: { userId: string }) => Promise<AiBudgetGuardConfig>;
  listBudgetAuditLogsForAdmin: (
    actor: { userId: string },
    input: ListAiBudgetAuditLogsInput
  ) => Promise<AiBudgetAuditLogPage>;
  updateBudgetConfigForAdmin: (
    actor: { userId: string },
    input: UpdateAiBudgetConfigInput
  ) => Promise<AiBudgetGuardConfig>;
};

export type UseAiBudgetAdminSettingsState = {
  config: AiBudgetGuardConfig | null;
  auditLogs: AiBudgetAuditLogItem[];
  auditEventTypeFilter: string | null;
  auditLoadingMore: boolean;
  auditHasMore: boolean;
  loading: boolean;
  updating: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  applyAuditEventTypeFilter: (eventType: string) => Promise<void>;
  resetAuditFilters: () => Promise<void>;
  loadMoreAuditLogs: () => Promise<void>;
  updateConfig: (input: UpdateAiBudgetConfigInput) => Promise<void>;
};

export function useAiBudgetAdminSettings(
  userId: string | null,
  service: AiBudgetAdminSettingsService | null
): UseAiBudgetAdminSettingsState {
  const [config, setConfig] = useState<AiBudgetGuardConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AiBudgetAuditLogItem[]>([]);
  const [auditEventTypeFilter, setAuditEventTypeFilter] = useState<string | null>(null);
  const [auditNextPageToken, setAuditNextPageToken] = useState<string | null>(null);
  const auditEventTypeFilterRef = useRef<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [auditLoadingMore, setAuditLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    auditEventTypeFilterRef.current = auditEventTypeFilter;
  }, [auditEventTypeFilter]);

  const loadInitialData = useCallback(
    async (eventTypeFilter: string | null) => {
      if (!userId || !service) {
        setConfig(null);
        setAuditLogs([]);
        setAuditNextPageToken(null);
        setError("AI budget admin service is unavailable");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const [nextConfig, firstAuditPage] = await Promise.all([
          service.getBudgetConfigForAdmin({ userId }),
          service.listBudgetAuditLogsForAdmin(
            { userId },
            {
              limit: AUDIT_LOG_PAGE_LIMIT,
              ...(eventTypeFilter ? { eventType: eventTypeFilter } : {}),
            }
          ),
        ]);

        setConfig(nextConfig);
        setAuditLogs(firstAuditPage.items);
        setAuditNextPageToken(firstAuditPage.nextPageToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load AI budget settings");
      } finally {
        setLoading(false);
      }
    },
    [service, userId]
  );

  const refresh = useCallback(async () => {
    await loadInitialData(auditEventTypeFilterRef.current);
  }, [loadInitialData]);

  const applyAuditEventTypeFilter = useCallback(
    async (eventType: string) => {
      setAuditEventTypeFilter(eventType);
      await loadInitialData(eventType);
    },
    [loadInitialData]
  );

  const resetAuditFilters = useCallback(async () => {
    setAuditEventTypeFilter(null);
    await loadInitialData(null);
  }, [loadInitialData]);

  const loadMoreAuditLogs = useCallback(async () => {
    if (!userId || !service) {
      return;
    }

    if (!auditNextPageToken || auditLoadingMore) {
      return;
    }

    setAuditLoadingMore(true);
    setError(null);
    try {
      const nextAuditPage = await service.listBudgetAuditLogsForAdmin(
        { userId },
        {
          limit: AUDIT_LOG_PAGE_LIMIT,
          nextPageToken: auditNextPageToken,
          ...(auditEventTypeFilter ? { eventType: auditEventTypeFilter } : {}),
        }
      );

      setAuditLogs((current) => [...current, ...nextAuditPage.items]);
      setAuditNextPageToken(nextAuditPage.nextPageToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more audit logs");
    } finally {
      setAuditLoadingMore(false);
    }
  }, [auditEventTypeFilter, auditLoadingMore, auditNextPageToken, service, userId]);

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
    auditLogs,
    auditEventTypeFilter,
    auditLoadingMore,
    auditHasMore: Boolean(auditNextPageToken),
    loading,
    updating,
    error,
    refresh,
    applyAuditEventTypeFilter,
    resetAuditFilters,
    loadMoreAuditLogs,
    updateConfig,
  };
}
