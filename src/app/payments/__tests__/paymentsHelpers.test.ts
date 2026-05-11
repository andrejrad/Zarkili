import {
  DEFAULT_TIP_PRESETS,
  computeOrderTotal,
  formatBrandLabel,
  formatCardExpiry,
  formatCardLabel,
  formatLast4,
  formatPercent,
  formatTaxLabel,
  formatUsd,
  isCardExpired,
  normalizeCardBrand,
  parseCurrencyInput,
  roundCents,
  tipAmountFromPreset,
} from "../paymentsHelpers";

describe("paymentsHelpers", () => {
  describe("normalizeCardBrand", () => {
    it("maps known brands case- and separator-insensitively", () => {
      expect(normalizeCardBrand("VISA")).toBe("visa");
      expect(normalizeCardBrand("Master Card")).toBe("mastercard");
      expect(normalizeCardBrand("MC")).toBe("mastercard");
      expect(normalizeCardBrand("American Express")).toBe("amex");
      expect(normalizeCardBrand("amex")).toBe("amex");
      expect(normalizeCardBrand("Discover")).toBe("discover");
      expect(normalizeCardBrand("Diners Club")).toBe("diners");
      expect(normalizeCardBrand("JCB")).toBe("jcb");
      expect(normalizeCardBrand("UnionPay")).toBe("unionpay");
    });

    it("returns unknown for null/undefined/garbage", () => {
      expect(normalizeCardBrand(null)).toBe("unknown");
      expect(normalizeCardBrand(undefined)).toBe("unknown");
      expect(normalizeCardBrand("solana")).toBe("unknown");
    });
  });

  describe("formatBrandLabel + formatLast4 + formatCardLabel", () => {
    it("formats human labels", () => {
      expect(formatBrandLabel("visa")).toBe("Visa");
      expect(formatBrandLabel("amex")).toBe("American Express");
      expect(formatBrandLabel("unknown")).toBe("Card");
      expect(formatLast4("4242")).toBe("•••• 4242");
      expect(formatLast4("xx4242")).toBe("•••• 4242");
      expect(formatCardLabel({ brand: "visa", last4: "4242" })).toBe("Visa •••• 4242");
    });
  });

  describe("formatCardExpiry + isCardExpired", () => {
    it("formats expiry as MM/YY", () => {
      expect(formatCardExpiry(1, 2028)).toBe("Expires 01/28");
      expect(formatCardExpiry(12, 2030)).toBe("Expires 12/30");
    });

    it("detects expired cards relative to a reference date", () => {
      const ref = new Date(2026, 3, 27); // April 2026
      expect(isCardExpired(3, 2026, ref)).toBe(true); // March 2026
      expect(isCardExpired(4, 2026, ref)).toBe(false); // current month
      expect(isCardExpired(1, 2025, ref)).toBe(true);
      expect(isCardExpired(12, 2030, ref)).toBe(false);
      expect(isCardExpired(0, 2030, ref)).toBe(true); // invalid month
    });
  });

  describe("roundCents + parseCurrencyInput + formatUsd", () => {
    it("rounds to 2 decimal places", () => {
      expect(roundCents(1.234)).toBe(1.23);
      expect(roundCents(1.236)).toBe(1.24);
      expect(roundCents(0)).toBe(0);
      expect(roundCents(Number.NaN)).toBe(0);
    });

    it("parses messy currency strings", () => {
      expect(parseCurrencyInput("$12.34")).toBe(12.34);
      expect(parseCurrencyInput("1,234.56")).toBe(1234.56);
      expect(parseCurrencyInput("1234")).toBe(1234);
      expect(parseCurrencyInput("12.346")).toBe(12.34); // truncate to 2 decimals
      expect(parseCurrencyInput("")).toBeNaN();
      expect(parseCurrencyInput(".")).toBeNaN();
      expect(parseCurrencyInput("abc")).toBeNaN();
    });

    it("formats USD with thousands separator", () => {
      expect(formatUsd(0)).toBe("$0.00");
      expect(formatUsd(1)).toBe("$1.00");
      expect(formatUsd(1234.5)).toBe("$1,234.50");
      expect(formatUsd(-99.99)).toBe("-$99.99");
    });
  });

  describe("tipAmountFromPreset", () => {
    const presets = DEFAULT_TIP_PRESETS;
    const findPreset = (id: string) => presets.find((p) => p.id === id);

    it("returns 0 for missing or 'none' preset", () => {
      expect(tipAmountFromPreset({ preset: undefined, subtotal: 100 })).toBe(0);
      expect(tipAmountFromPreset({ preset: findPreset("none"), subtotal: 100 })).toBe(0);
    });

    it("computes percent-of-subtotal correctly", () => {
      expect(tipAmountFromPreset({ preset: findPreset("p20"), subtotal: 50 })).toBe(10);
      expect(tipAmountFromPreset({ preset: findPreset("p15"), subtotal: 33.33 })).toBe(5);
    });

    it("uses customAmount for fixed preset, clamped to >= 0", () => {
      expect(
        tipAmountFromPreset({ preset: findPreset("custom"), subtotal: 50, customAmount: 7.5 }),
      ).toBe(7.5);
      expect(
        tipAmountFromPreset({ preset: findPreset("custom"), subtotal: 50, customAmount: -5 }),
      ).toBe(0);
      expect(
        tipAmountFromPreset({ preset: findPreset("custom"), subtotal: 50 }),
      ).toBe(0);
    });
  });

  describe("computeOrderTotal", () => {
    it("sums subtotal + tax + tip and rounds to cents", () => {
      const r = computeOrderTotal({ subtotal: 100, taxRate: 0.1025, tip: 18 });
      expect(r.subtotal).toBe(100);
      expect(r.tax).toBeCloseTo(10.25, 2);
      expect(r.tip).toBe(18);
      expect(r.total).toBeCloseTo(128.25, 2);
    });

    it("clamps subtotal and tip to >= 0 and defaults zero", () => {
      const r = computeOrderTotal({ subtotal: -5 });
      expect(r.subtotal).toBe(0);
      expect(r.tip).toBe(0);
      expect(r.tax).toBe(0);
      expect(r.total).toBe(0);
    });
  });

  describe("formatTaxLabel + formatPercent", () => {
    it("includes jurisdiction code + percent", () => {
      expect(formatTaxLabel({ jurisdictionCode: "wa", percentRate: 0.1025 })).toBe(
        "WA Sales Tax 10.25%",
      );
      expect(formatTaxLabel({ percentRate: 0.05 })).toBe("5% Sales Tax");
      expect(formatTaxLabel({})).toBe("Sales Tax");
    });

    it("formats integer percents without decimals", () => {
      expect(formatPercent(0.1)).toBe("10%");
      expect(formatPercent(0.1025)).toBe("10.25%");
      expect(formatPercent(NaN)).toBe("0%");
    });
  });
});
