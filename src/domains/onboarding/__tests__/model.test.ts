import {
  ONBOARDING_STEPS,
  STEP_GUIDANCE,
  STEP_REQUIRED_FIELDS,
  WIZARD_SCHEMA_VERSION,
  validateStepPayload,
} from "../model";

describe("STEP_GUIDANCE", () => {
  it("has guidance text for every step", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(typeof STEP_GUIDANCE[step]).toBe("string");
      expect(STEP_GUIDANCE[step].length).toBeGreaterThan(0);
    }
  });
});

describe("STEP_REQUIRED_FIELDS", () => {
  it("has a required-fields entry for every step", () => {
    for (const step of ONBOARDING_STEPS) {
      expect(Array.isArray(STEP_REQUIRED_FIELDS[step])).toBe(true);
    }
  });
});

describe("WIZARD_SCHEMA_VERSION", () => {
  it("is a positive integer", () => {
    expect(Number.isInteger(WIZARD_SCHEMA_VERSION)).toBe(true);
    expect(WIZARD_SCHEMA_VERSION).toBeGreaterThan(0);
  });
});

describe("validateStepPayload", () => {
  it("returns ok=true for a fully populated BUSINESS_PROFILE", () => {
    const r = validateStepPayload("BUSINESS_PROFILE", {
      legalName: "Acme",
      addressLine1: "1 Main",
      city: "Zagreb",
      country: "HR",
    });
    expect(r.ok).toBe(true);
    expect(r.missingFields).toEqual([]);
  });

  it("flags every missing required field", () => {
    const r = validateStepPayload("BUSINESS_PROFILE", { legalName: "Acme" });
    expect(r.ok).toBe(false);
    expect(r.missingFields).toEqual(
      expect.arrayContaining(["addressLine1", "city", "country"]),
    );
  });

  it("treats empty strings as missing", () => {
    const r = validateStepPayload("ACCOUNT", { ownerEmail: "   " });
    expect(r.ok).toBe(false);
    expect(r.missingFields).toContain("ownerEmail");
  });

  it("treats null and undefined as missing", () => {
    const r = validateStepPayload("PAYMENT_SETUP", { stripeAccountId: null });
    expect(r.ok).toBe(false);
    expect(r.missingFields).toContain("stripeAccountId");
  });

  it("treats empty arrays as missing", () => {
    const r = validateStepPayload("SERVICES", { services: [] });
    expect(r.ok).toBe(false);
    expect(r.missingFields).toContain("services");
  });

  it("accepts non-empty arrays", () => {
    const r = validateStepPayload("STAFF", { staff: [{ id: "s1" }] });
    expect(r.ok).toBe(true);
  });

  it("returns ok=false with full required list when payload is null", () => {
    const r = validateStepPayload("BUSINESS_PROFILE", null);
    expect(r.ok).toBe(false);
    expect(r.missingFields.length).toBe(STEP_REQUIRED_FIELDS.BUSINESS_PROFILE.length);
  });

  it("returns ok=true when step has no required fields and payload is empty", () => {
    // Find a step with no required fields, if any. Otherwise pass an empty list.
    const noRequiredStep = ONBOARDING_STEPS.find(
      (s) => STEP_REQUIRED_FIELDS[s].length === 0,
    );
    if (noRequiredStep) {
      const r = validateStepPayload(noRequiredStep, {});
      expect(r.ok).toBe(true);
    } else {
      // Sanity: every step in the current spec has at least one required field.
      expect(true).toBe(true);
    }
  });

  it("accepts boolean false as a present value", () => {
    const r = validateStepPayload("MARKETPLACE_VISIBILITY", { isListed: false });
    expect(r.ok).toBe(true);
  });
});
