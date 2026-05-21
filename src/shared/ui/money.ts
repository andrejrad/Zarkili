/**
 * money.ts — Generic, multi-currency money formatting.
 *
 * NEW-DEBT-A: the platform is multi-currency (each tenant/brand defines the
 * currency per location). Never assume USD or GBP at the display layer — always
 * pull the currency code from the data being rendered and pass it here.
 *
 * Stored amounts use minor units (pence/cents) to avoid float arithmetic, so
 * these helpers all take `minorUnits: number` as input.
 */

/**
 * Format a money amount stored in minor units (pence/cents) using the
 * locale-appropriate currency symbol for the given ISO-4217 currency code.
 *
 * @param minorUnits  Amount in minor units (e.g. 2500 = £25.00 / $25.00).
 * @param currencyCode  ISO-4217 currency code, case-insensitive. Defaults to
 *                      "GBP" when missing or empty. Falls back to "GBP" for
 *                      legacy symbol values like "$" or "€".
 * @param locale  Optional override (defaults to "en-GB").
 */
export function formatMoney(
  minorUnits: number,
  currencyCode: string | null | undefined,
  locale: string = "en-GB",
): string {
  const code = normalizeCurrencyCode(currencyCode);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    }).format(minorUnits / 100);
  } catch {
    // Fallback for environments without full Intl support
    return `${code} ${(minorUnits / 100).toFixed(2)}`;
  }
}

/**
 * Format a money amount stored in MAJOR units (whole pounds/dollars).
 * Use this only when the source data is in major units (rare; most modern
 * code paths store minor units to avoid float drift).
 */
export function formatMoneyMajor(
  majorUnits: number,
  currencyCode: string | null | undefined,
  locale: string = "en-GB",
): string {
  return formatMoney(Math.round(majorUnits * 100), currencyCode, locale);
}

/**
 * Normalise legacy currency values to ISO-4217 codes. Accepts symbols like
 * "$" / "€" / "£" for backward compatibility and maps them to USD/EUR/GBP.
 */
export function normalizeCurrencyCode(input: string | null | undefined): string {
  if (!input) return "GBP";
  const trimmed = input.trim();
  if (trimmed.length === 0) return "GBP";
  const upper = trimmed.toUpperCase();
  // Already an ISO code
  if (/^[A-Z]{3}$/.test(upper)) return upper;
  // Common symbols
  switch (trimmed) {
    case "$":
      return "USD";
    case "€":
      return "EUR";
    case "£":
      return "GBP";
    case "¥":
      return "JPY";
    default:
      return "GBP";
  }
}
