import {
  formatUsPhone,
  isValidEmail,
  meetsPasswordPolicy,
  normalizeUsPhone,
  normalizeUsZip,
  passwordStrength,
} from "../formatters";

describe("formatUsPhone", () => {
  it("formats progressively as the user types", () => {
    expect(formatUsPhone("")).toBe("");
    expect(formatUsPhone("5")).toBe("(5");
    expect(formatUsPhone("555")).toBe("(555");
    expect(formatUsPhone("5555")).toBe("(555) 5");
    expect(formatUsPhone("5555551234")).toBe("(555) 555-1234");
  });

  it("strips non-digits and caps at 10 digits", () => {
    expect(formatUsPhone("abc(555)555-1234extra")).toBe("(555) 555-1234");
  });
});

describe("normalizeUsPhone", () => {
  it("returns 10 digits when valid", () => {
    expect(normalizeUsPhone("(555) 555-1234")).toBe("5555551234");
  });
  it("returns null when not 10 digits", () => {
    expect(normalizeUsPhone("123")).toBeNull();
  });
});

describe("normalizeUsZip", () => {
  it("returns 5-digit zip when valid", () => {
    expect(normalizeUsZip("90210")).toBe("90210");
    expect(normalizeUsZip("90210-1234")).toBe("90210");
  });
  it("returns null when invalid", () => {
    expect(normalizeUsZip("abc")).toBeNull();
    expect(normalizeUsZip("123")).toBeNull();
  });
});

describe("isValidEmail", () => {
  it("accepts well-formed addresses", () => {
    expect(isValidEmail("you@example.com")).toBe(true);
  });
  it("rejects malformed addresses", () => {
    expect(isValidEmail("you@example")).toBe(false);
    expect(isValidEmail("plain")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("passwordStrength + meetsPasswordPolicy", () => {
  it("classifies weak/fair/strong", () => {
    expect(passwordStrength("abc")).toBe("weak");
    expect(passwordStrength("abcdefgh")).toBe("weak");
    expect(passwordStrength("abcdefg1!")).toBe("fair");
    expect(passwordStrength("Abcdefghij1!")).toBe("strong");
  });

  it("enforces minimum policy 8+ chars, 1 number, 1 symbol", () => {
    expect(meetsPasswordPolicy("abc1!")).toBe(false);
    expect(meetsPasswordPolicy("abcdefgh")).toBe(false);
    expect(meetsPasswordPolicy("abcdefg1")).toBe(false);
    expect(meetsPasswordPolicy("abcdefg1!")).toBe(true);
  });
});
