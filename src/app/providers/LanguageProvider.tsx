import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import {
  fallbackLanguage,
  resolveTranslatedText,
  supportedLanguages,
  type SupportedLanguage,
  type TranslationKey,
} from "../../shared/i18n";

import { useTenant } from "./TenantProvider";

const USER_LANGUAGE_OVERRIDES_STORAGE_KEY = "zarkili.user-language-overrides.v1";
const TENANT_DEFAULT_LANGUAGES_STORAGE_KEY = "zarkili.tenant-default-languages.v1";

type LanguageContextValue = {
  language: SupportedLanguage;
  fallbackLanguage: SupportedLanguage;
  supportedLanguages: readonly SupportedLanguage[];
  setLanguage: (lang: SupportedLanguage) => void;
  setTenantDefaultLanguage: (tenantId: string, lang: SupportedLanguage) => void;
  getTenantDefaultLanguage: (tenantId: string | null) => SupportedLanguage;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === "string" && supportedLanguages.includes(value as SupportedLanguage);
}

function parseLanguageMap(raw: string | null): Record<string, SupportedLanguage> {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const entries = Object.entries(parsed).filter(([, value]) => isSupportedLanguage(value));
    return Object.fromEntries(entries) as Record<string, SupportedLanguage>;
  } catch {
    return {};
  }
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const { tenantId } = useTenant();
  const [userLanguageOverrides, setUserLanguageOverrides] = useState<Record<string, SupportedLanguage>>({});
  const [tenantDefaultLanguages, setTenantDefaultLanguages] = useState<Record<string, SupportedLanguage>>({});

  useEffect(() => {
    let cancelled = false;

    async function hydrateLanguagePreferences() {
      try {
        const [rawOverrides, rawTenantDefaults] = await Promise.all([
          AsyncStorage.getItem(USER_LANGUAGE_OVERRIDES_STORAGE_KEY),
          AsyncStorage.getItem(TENANT_DEFAULT_LANGUAGES_STORAGE_KEY),
        ]);

        if (!cancelled && rawOverrides) {
          const parsedOverrides = parseLanguageMap(rawOverrides);
          if (Object.keys(parsedOverrides).length > 0) {
            setUserLanguageOverrides((current) => ({ ...parsedOverrides, ...current }));
          }
        }

        if (!cancelled && rawTenantDefaults) {
          const parsedTenantDefaults = parseLanguageMap(rawTenantDefaults);
          if (Object.keys(parsedTenantDefaults).length > 0) {
            setTenantDefaultLanguages((current) => ({ ...parsedTenantDefaults, ...current }));
          }
        }
      } finally {
        // noop
      }
    }

    void hydrateLanguagePreferences();

    return () => {
      cancelled = true;
    };
  }, []);

  const language = useMemo<SupportedLanguage>(() => {
    if (!tenantId) {
      return fallbackLanguage;
    }

    const override = userLanguageOverrides[tenantId];
    if (override) {
      return override;
    }

    return tenantDefaultLanguages[tenantId] ?? fallbackLanguage;
  }, [tenantDefaultLanguages, tenantId, userLanguageOverrides]);

  function setLanguage(lang: SupportedLanguage) {
    if (!tenantId) {
      return;
    }

    setUserLanguageOverrides((current) => {
      const next = { ...current, [tenantId]: lang };
      void AsyncStorage.setItem(USER_LANGUAGE_OVERRIDES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function setTenantDefaultLanguage(nextTenantId: string, lang: SupportedLanguage) {
    if (!nextTenantId.trim()) {
      return;
    }

    setTenantDefaultLanguages((current) => {
      const next = { ...current, [nextTenantId]: lang };
      void AsyncStorage.setItem(TENANT_DEFAULT_LANGUAGES_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function getTenantDefaultLanguage(nextTenantId: string | null): SupportedLanguage {
    if (!nextTenantId) {
      return fallbackLanguage;
    }

    return tenantDefaultLanguages[nextTenantId] ?? fallbackLanguage;
  }

  function t(key: TranslationKey, params?: Record<string, string>): string {
    return resolveTranslatedText(language, key, params);
  }

  const value: LanguageContextValue = {
    language,
    fallbackLanguage,
    supportedLanguages,
    setLanguage,
    setTenantDefaultLanguage,
    getTenantDefaultLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
