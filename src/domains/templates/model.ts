/**
 * Templates domain model
 *
 * Templates are per-tenant reusable message bodies with variable placeholders.
 * Supported placeholder syntax: {{variableName}}
 *
 * At render time, each placeholder is replaced with the supplied value.
 * Missing variables fall back to the DEFAULT_VARIABLE_FALLBACKS map.
 * Any remaining un-replaced placeholders are replaced with "" to prevent
 * raw placeholder strings reaching end users.
 */

import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TemplateChannel = "email" | "sms" | "push";

/** Stored at tenants/{tenantId}/templates/{templateId} */
export type Template = {
  templateId: string;
  tenantId: string;
  name: string;
  channel: TemplateChannel;
  /** Subject line — used for email, ignored for SMS/push */
  subject?: string;
  /** Message body — may contain {{variable}} placeholders */
  body: string;
  /** Declared variable names used in this template */
  variables: string[];
  /** Whether this is a system default (cannot be deleted by tenant) */
  isDefault: boolean;
  createdAt: Timestamp | { _type: string };
  updatedAt: Timestamp | { _type: string };
};

export type RenderedTemplate = {
  subject?: string;
  body: string;
  /** Variable names that were missing AND had no fallback */
  missingVariables: string[];
};

// ---------------------------------------------------------------------------
// Default fallbacks
// ---------------------------------------------------------------------------

export const DEFAULT_VARIABLE_FALLBACKS: Record<string, string> = {
  customerFirstName: "Valued Customer",
  locationName:      "our salon",
  bookingLink:       "",
};

// ---------------------------------------------------------------------------
// Variable rendering
// ---------------------------------------------------------------------------

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

/**
 * Render a template body/subject with the supplied variables.
 * Falls back to DEFAULT_VARIABLE_FALLBACKS for missing keys.
 * Reports any keys that had neither a supplied value nor a fallback.
 */
export function renderTemplate(
  template: Pick<Template, "subject" | "body">,
  variables: Record<string, string>,
): RenderedTemplate {
  const missing: string[] = [];

  function replace(text: string): string {
    return text.replace(PLACEHOLDER_RE, (_match, key: string) => {
      if (Object.prototype.hasOwnProperty.call(variables, key)) return variables[key];
      if (Object.prototype.hasOwnProperty.call(DEFAULT_VARIABLE_FALLBACKS, key)) {
        return DEFAULT_VARIABLE_FALLBACKS[key];
      }
      missing.push(key);
      return "";
    });
  }

  return {
    subject: template.subject ? replace(template.subject) : undefined,
    body: replace(template.body),
    missingVariables: [...new Set(missing)],
  };
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type TemplateErrorCode =
  | "TEMPLATE_NOT_FOUND"
  | "TENANT_REQUIRED"
  | "CANNOT_DELETE_DEFAULT";

export class TemplateError extends Error {
  constructor(
    public readonly code: TemplateErrorCode,
    message: string,
  ) {
    super(`${code}: ${message}`);
    this.name = "TemplateError";
  }
}
