import { describe, expect, it } from "@jest/globals";

import {
  normaliseEuVatId,
  validateEuVatIdFormat,
} from "../vatValidation";

describe("validateEuVatIdFormat", () => {
  it("returns missing_country when country is empty", () => {
    expect(validateEuVatIdFormat("", "DE123456789")).toMatchObject({
      valid: false,
      reason: "missing_country",
    });
    expect(validateEuVatIdFormat(null, "DE123456789").reason).toBe("missing_country");
  });

  it("returns missing_vat_id when vat id is empty", () => {
    expect(validateEuVatIdFormat("DE", "")).toMatchObject({
      valid: false,
      reason: "missing_vat_id",
    });
    expect(validateEuVatIdFormat("DE", null).reason).toBe("missing_vat_id");
  });

  it("rejects non-EU country codes", () => {
    expect(validateEuVatIdFormat("US", "DE123456789").reason).toBe("country_not_eu");
    expect(validateEuVatIdFormat("CH", "CHE-123.456.789").reason).toBe("country_not_eu");
  });

  it("rejects prefix mismatch (FR id submitted under DE)", () => {
    const result = validateEuVatIdFormat("DE", "FR12345678901");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("prefix_mismatch");
    expect(result.expectedPrefix).toBe("DE");
  });

  it("uses EL prefix for Greece (not GR)", () => {
    expect(validateEuVatIdFormat("GR", "EL123456789").valid).toBe(true);
    const wrong = validateEuVatIdFormat("GR", "GR123456789");
    expect(wrong.valid).toBe(false);
    expect(wrong.reason).toBe("prefix_mismatch");
    expect(wrong.expectedPrefix).toBe("EL");
  });

  it("accepts canonical formats for representative member states", () => {
    const cases: Array<[string, string]> = [
      ["DE", "DE123456789"],
      ["FR", "FRAB123456789"],
      ["IT", "IT12345678901"],
      ["ES", "ESA1234567Z"],
      ["NL", "NL123456789B01"],
      ["AT", "ATU12345678"],
      ["BE", "BE0123456789"],
      ["PL", "PL1234567890"],
      ["SE", "SE123456789012"],
      ["IE", "IE1234567T"],
      ["IE", "IE1A23456T"],
    ];
    for (const [country, id] of cases) {
      const result = validateEuVatIdFormat(country, id);
      expect(result).toMatchObject({ valid: true, reason: "ok" });
    }
  });

  it("tolerates whitespace, dashes and dots", () => {
    expect(validateEuVatIdFormat("DE", "de 123-456.789").valid).toBe(true);
    expect(validateEuVatIdFormat("FR", "fr ab 123 456 789").valid).toBe(true);
  });

  it("rejects format_mismatch for too-short ids", () => {
    const result = validateEuVatIdFormat("DE", "DE123");
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("format_mismatch");
    expect(result.expectedPrefix).toBe("DE");
  });

  it("rejects format_mismatch for too-long ids", () => {
    expect(validateEuVatIdFormat("DE", "DE12345678901234").reason).toBe("format_mismatch");
  });

  it("rejects FR ids using forbidden letters I or O", () => {
    expect(validateEuVatIdFormat("FR", "FRIO123456789").reason).toBe("format_mismatch");
  });

  it("accepts BG with both 9 and 10 digit forms", () => {
    expect(validateEuVatIdFormat("BG", "BG123456789").valid).toBe(true);
    expect(validateEuVatIdFormat("BG", "BG1234567890").valid).toBe(true);
    expect(validateEuVatIdFormat("BG", "BG12345678").reason).toBe("format_mismatch");
  });

  it("accepts LT with both 9 and 12 digit forms", () => {
    expect(validateEuVatIdFormat("LT", "LT123456789").valid).toBe(true);
    expect(validateEuVatIdFormat("LT", "LT123456789012").valid).toBe(true);
    expect(validateEuVatIdFormat("LT", "LT1234567890").reason).toBe("format_mismatch");
  });
});

describe("normaliseEuVatId", () => {
  it("returns canonical uppercase form when input is valid", () => {
    expect(normaliseEuVatId("DE", "de 123-456.789")).toBe("DE123456789");
    expect(normaliseEuVatId("GR", "el 123 456 789")).toBe("EL123456789");
  });

  it("returns null when input fails validation", () => {
    expect(normaliseEuVatId("DE", "DE123")).toBeNull();
    expect(normaliseEuVatId("US", "DE123456789")).toBeNull();
    expect(normaliseEuVatId("", "DE123456789")).toBeNull();
  });
});
