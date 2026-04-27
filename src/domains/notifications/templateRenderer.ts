/**
 * templateRenderer.ts
 *
 * Pure, side-effect-free template rendering utilities for notification templates.
 *
 * Public API
 * ──────────
 *   renderTemplate(template, variables)
 *     Interpolates `{{variableName}}` placeholders in subject + body.
 *     Missing variables → empty string (safe — never exposes raw placeholders).
 *
 *   resolveTemplateBody(eventType, tenantTranslations, preferredLocales)
 *     Walks the locale fallback chain to find the best available template:
 *       1. User's preferred language
 *       2. Tenant's defaultLanguage
 *       3. "en" (system fallback)
 *       4. Built-in English default
 *
 *   resolveLocaleChain(userLanguage, tenantLanguage)
 *     Returns the ordered list of locales to try (deduped).
 */

import type { SupportedLanguage } from "../../shared/i18n";
import { fallbackLanguage, supportedLanguages } from "../../shared/i18n";
import type { NotificationEventType } from "./notificationEventModel";
import {
  BUILT_IN_TEMPLATES,
  type TemplateBody,
  type TenantNotificationTemplate,
} from "./notificationTemplateModel";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type TemplateVariables = Record<string, string>;

export type RenderedNotification = {
  subject: string;
  body: string;
  /** The locale that was actually used */
  resolvedLocale: SupportedLanguage;
};

// ---------------------------------------------------------------------------
// renderTemplate
// ---------------------------------------------------------------------------

/**
 * Replaces every `{{key}}` occurrence in `subject` and `body` with the
 * corresponding value from `variables`.
 *
 * Safety rules:
 *   - Unknown keys → replaced with empty string (no raw `{{key}}` leaks through)
 *   - Values are not further interpreted (no HTML, no nested templates)
 */
export function renderTemplate(
  template: TemplateBody,
  variables: TemplateVariables,
): { subject: string; body: string } {
  const interpolate = (text: string): string =>
    text.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? "");

  return {
    subject: interpolate(template.subject),
    body: interpolate(template.body),
  };
}

// ---------------------------------------------------------------------------
// resolveLocaleChain
// ---------------------------------------------------------------------------

/**
 * Returns an ordered, deduplicated list of locales to try when resolving a
 * template:  [userLang?, tenantLang?, "en"]
 */
export function resolveLocaleChain(
  userLanguage: SupportedLanguage | null | undefined,
  tenantLanguage: SupportedLanguage | null | undefined,
): SupportedLanguage[] {
  const chain: SupportedLanguage[] = [];

  const push = (lang: SupportedLanguage | null | undefined) => {
    if (lang && supportedLanguages.includes(lang) && !chain.includes(lang)) {
      chain.push(lang);
    }
  };

  push(userLanguage);
  push(tenantLanguage);
  push(fallbackLanguage); // always "en" as final fallback

  return chain;
}

// ---------------------------------------------------------------------------
// resolveTemplateBody
// ---------------------------------------------------------------------------

/**
 * Selects the best available `TemplateBody` for an event type, walking the
 * locale chain until a match is found.
 *
 * Priority:
 *   1. Tenant override (from `tenantTemplate.translations`)
 *   2. Built-in default (`BUILT_IN_TEMPLATES`)
 *
 * Within each source, the locale chain determines which language to use.
 *
 * @param eventType          The notification event type
 * @param tenantTemplate     The tenant's custom template document (may be null)
 * @param preferredLocales   Ordered locale chain (from resolveLocaleChain)
 * @returns                  The resolved TemplateBody and the locale used
 */
export function resolveTemplateBody(
  eventType: NotificationEventType,
  tenantTemplate: Pick<TenantNotificationTemplate, "translations"> | null,
  preferredLocales: SupportedLanguage[],
): { body: TemplateBody; resolvedLocale: SupportedLanguage } {
  const builtIn = BUILT_IN_TEMPLATES[eventType];

  for (const locale of preferredLocales) {
    // Prefer tenant override first
    const tenantBody = tenantTemplate?.translations[locale];
    if (tenantBody) return { body: tenantBody, resolvedLocale: locale };

    // Fall back to built-in for this locale
    const builtInBody = builtIn[locale];
    if (builtInBody) return { body: builtInBody, resolvedLocale: locale };
  }

  // Ultimate safety net: built-in English (always exists)
  return {
    body: builtIn[fallbackLanguage] ?? { subject: "", body: "" },
    resolvedLocale: fallbackLanguage,
  };
}

// ---------------------------------------------------------------------------
// High-level render helper
// ---------------------------------------------------------------------------

/**
 * Combines locale resolution, template selection, and variable interpolation
 * into a single call.
 *
 * @param eventType        Notification event type
 * @param tenantTemplate   Tenant's custom template document (null → use built-in)
 * @param variables        Variable map for placeholder substitution
 * @param userLanguage     User's preferred language (null → use tenant default)
 * @param tenantLanguage   Tenant's defaultLanguage
 */
export function renderNotification(
  eventType: NotificationEventType,
  tenantTemplate: Pick<TenantNotificationTemplate, "translations"> | null,
  variables: TemplateVariables,
  userLanguage: SupportedLanguage | null | undefined,
  tenantLanguage: SupportedLanguage | null | undefined,
): RenderedNotification {
  const localeChain = resolveLocaleChain(userLanguage, tenantLanguage);
  const { body: templateBody, resolvedLocale } = resolveTemplateBody(
    eventType,
    tenantTemplate,
    localeChain,
  );
  const rendered = renderTemplate(templateBody, variables);
  return { ...rendered, resolvedLocale };
}
