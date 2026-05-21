/**
 * formatters.ts — US-locale formatting helpers for W21 auth surfaces.
 *
 * Scope: US phone, ZIP, email, password policy helpers only. Currency
 * formatting lives in `./money.ts` (multi-currency, locale-aware) per
 * NEW-DEBT-A — never assume USD at the display layer.
 *
 * Defaults: en-US, MM/DD/YYYY, 12-hour, (XXX) XXX-XXXX phone, 5-digit ZIP.
 */

/** Strips non-digits then formats progressively as `(XXX) XXX-XXXX`. */
export function formatUsPhone(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Returns digits-only US phone (10 digits) or null if not valid. */
export function normalizeUsPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  return digits.length === 10 ? digits : null;
}

/** Returns 5-digit ZIP or null if invalid. */
export function normalizeUsZip(input: string): string | null {
  const digits = input.replace(/\D/g, "").slice(0, 5);
  return digits.length === 5 ? digits : null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(input: string): boolean {
  return EMAIL_RE.test(input.trim());
}

export type PasswordStrength = "weak" | "fair" | "strong";

/** Heuristic: weak<8 || only letters; strong>=12 with mix; else fair. */
export function passwordStrength(input: string): PasswordStrength {
  if (input.length < 8) return "weak";
  const hasNum = /\d/.test(input);
  const hasSym = /[^A-Za-z0-9]/.test(input);
  const hasUpper = /[A-Z]/.test(input);
  if (input.length >= 12 && hasNum && hasSym && hasUpper) return "strong";
  if (hasNum && (hasSym || hasUpper)) return "fair";
  return "weak";
}

/** Returns true if password meets the minimum: 8+ chars, 1 number, 1 symbol. */
export function meetsPasswordPolicy(input: string): boolean {
  return input.length >= 8 && /\d/.test(input) && /[^A-Za-z0-9]/.test(input);
}
