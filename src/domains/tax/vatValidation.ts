/**
 * EU VAT id pre-flight format validation (W14-DEBT-5).
 *
 * Stripe Tax handles canonical validation against VIES; this is a fast,
 * offline format check so admin UI can surface "this doesn't look right"
 * feedback before round-tripping to the API. A `valid: true` result here
 * means the string *could* be a real VAT id — final authority is Stripe Tax.
 *
 * Pure function, no I/O. Patterns sourced from the public EU VAT format
 * reference (Commission DG TAXUD).
 *
 * Note: the canonical VIES prefix for Greece is `EL`, not `GR` (ISO 3166).
 * `validateEuVatIdFormat("GR", "EL999999999")` accepts the EL prefix.
 */

import { isEuMemberState } from "./model";

// ---------------------------------------------------------------------------
// Per-member-state VAT id patterns
// ---------------------------------------------------------------------------
//
// Each entry is the regex that the digits/letters AFTER the country prefix
// must match. The prefix itself ("DE", "FR", "EL" for Greece, …) is stripped
// before matching.

const VAT_PATTERNS: Record<string, RegExp> = {
  AT: /^U\d{8}$/,                             // ATU + 8 digits
  BE: /^[01]\d{9}$/,                          // BE0 or BE1 + 9 digits (10 total)
  BG: /^\d{9,10}$/,                           // BG + 9-10 digits
  HR: /^\d{11}$/,                             // HR + 11 digits
  CY: /^\d{8}[A-Z]$/,                         // CY + 8 digits + 1 letter
  CZ: /^\d{8,10}$/,                           // CZ + 8-10 digits
  DK: /^\d{8}$/,                              // DK + 8 digits
  EE: /^\d{9}$/,                              // EE + 9 digits
  FI: /^\d{8}$/,                              // FI + 8 digits
  FR: /^[A-HJ-NP-Z0-9]{2}\d{9}$/,             // FR + 2 alphanum (excl. I,O) + 9 digits
  DE: /^\d{9}$/,                              // DE + 9 digits
  GR: /^\d{9}$/,                              // EL prefix — 9 digits (Greece)
  HU: /^\d{8}$/,                              // HU + 8 digits
  IE: /^\d{7}[A-W][A-IW]?$|^\d[A-Z+*]\d{5}[A-W]$/, // IE legacy + new
  IT: /^\d{11}$/,                             // IT + 11 digits
  LV: /^\d{11}$/,                             // LV + 11 digits
  LT: /^(\d{9}|\d{12})$/,                     // LT + 9 or 12 digits
  LU: /^\d{8}$/,                              // LU + 8 digits
  MT: /^\d{8}$/,                              // MT + 8 digits
  NL: /^\d{9}B\d{2}$/,                        // NL + 9 digits + B + 2 digits
  PL: /^\d{10}$/,                             // PL + 10 digits
  PT: /^\d{9}$/,                              // PT + 9 digits
  RO: /^\d{2,10}$/,                           // RO + 2-10 digits
  SK: /^\d{10}$/,                             // SK + 10 digits
  SI: /^\d{8}$/,                              // SI + 8 digits
  ES: /^[A-Z0-9]\d{7}[A-Z0-9]$/,              // ES + letter|digit + 7 digits + letter|digit
  SE: /^\d{12}$/,                             // SE + 12 digits
};

/** ISO country -> the actual VAT prefix used on the id. Greece is the only mismatch. */
const COUNTRY_TO_VAT_PREFIX: Record<string, string> = {
  GR: "EL",
};

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type VatValidationReason =
  | "missing_country"
  | "missing_vat_id"
  | "country_not_eu"
  | "prefix_mismatch"
  | "format_mismatch"
  | "ok";

export type VatValidationResult = {
  valid: boolean;
  reason: VatValidationReason;
  /** Country prefix the id should start with (e.g. "EL" for Greece, "DE" for Germany). */
  expectedPrefix?: string;
  /** The portion after the prefix that was actually matched (or attempted). */
  body?: string;
};

// ---------------------------------------------------------------------------
// Validator
// ---------------------------------------------------------------------------

/**
 * Validates the format of an EU VAT id for the given ISO country code.
 * Whitespace and dots/dashes inside the id are tolerated.
 *
 * Returns `{ valid: true, reason: "ok" }` on success; otherwise a structured
 * reason so admin UI can render a precise hint.
 */
export function validateEuVatIdFormat(
  country: string | null | undefined,
  vatId: string | null | undefined,
): VatValidationResult {
  if (!country || !country.trim()) {
    return { valid: false, reason: "missing_country" };
  }
  if (!vatId || !vatId.trim()) {
    return { valid: false, reason: "missing_vat_id" };
  }

  const iso = country.trim().toUpperCase();
  if (!isEuMemberState(iso)) {
    return { valid: false, reason: "country_not_eu" };
  }

  const expectedPrefix = COUNTRY_TO_VAT_PREFIX[iso] ?? iso;
  // Strip whitespace, dots, and dashes — these are common copy-paste artefacts.
  const normalised = vatId.replace(/[\s.\-]/g, "").toUpperCase();

  if (!normalised.startsWith(expectedPrefix)) {
    return { valid: false, reason: "prefix_mismatch", expectedPrefix };
  }

  const body = normalised.slice(expectedPrefix.length);
  const pattern = VAT_PATTERNS[iso];
  if (!pattern || !pattern.test(body)) {
    return { valid: false, reason: "format_mismatch", expectedPrefix, body };
  }

  return { valid: true, reason: "ok", expectedPrefix, body };
}

/**
 * Convenience: returns the canonical normalised form of a VAT id (uppercase,
 * no whitespace/punctuation) when the input is format-valid; otherwise null.
 */
export function normaliseEuVatId(
  country: string | null | undefined,
  vatId: string | null | undefined,
): string | null {
  const result = validateEuVatIdFormat(country, vatId);
  if (!result.valid) return null;
  return `${result.expectedPrefix}${result.body}`;
}
