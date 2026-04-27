/**
 * templateRenderer.test.ts
 *
 * Unit tests for the pure template rendering utilities.
 * No Firebase / async code — pure string manipulation.
 */

import {
  renderNotification,
  renderTemplate,
  resolveLocaleChain,
  resolveTemplateBody,
  type TemplateVariables,
} from "../templateRenderer";

// ---------------------------------------------------------------------------
// renderTemplate
// ---------------------------------------------------------------------------

describe("renderTemplate", () => {
  const template = {
    subject: "Hello {{customerName}} — booking for {{serviceName}}",
    body: "Hi {{customerName}},\n\nYour {{serviceName}} on {{date}} at {{time}} is confirmed.",
  };

  it("replaces all known placeholders", () => {
    const vars: TemplateVariables = {
      customerName: "Jane",
      serviceName: "Haircut",
      date: "15 Sep",
      time: "09:00",
    };
    const result = renderTemplate(template, vars);
    expect(result.subject).toBe("Hello Jane — booking for Haircut");
    expect(result.body).toBe("Hi Jane,\n\nYour Haircut on 15 Sep at 09:00 is confirmed.");
  });

  it("replaces unknown keys with empty string (no raw {{key}} leakage)", () => {
    const result = renderTemplate(template, {}); // no vars at all
    expect(result.subject).toBe("Hello  — booking for ");
    expect(result.body).toContain("Hi ,");
    expect(result.subject).not.toContain("{{");
    expect(result.body).not.toContain("{{");
  });

  it("handles partial variables — missing keys become empty string", () => {
    const result = renderTemplate(template, { customerName: "Bob" });
    expect(result.subject).toBe("Hello Bob — booking for ");
    expect(result.subject).not.toContain("{{serviceName}}");
  });

  it("does not double-interpolate — values with {{ are left as-is", () => {
    const result = renderTemplate(
      { subject: "Test {{name}}", body: "" },
      { name: "{{injected}}" },
    );
    expect(result.subject).toBe("Test {{injected}}");
  });

  it("returns unchanged text when there are no placeholders", () => {
    const plain = { subject: "Plain subject", body: "Plain body" };
    expect(renderTemplate(plain, { foo: "bar" })).toEqual({ subject: "Plain subject", body: "Plain body" });
  });
});

// ---------------------------------------------------------------------------
// resolveLocaleChain
// ---------------------------------------------------------------------------

describe("resolveLocaleChain", () => {
  it("returns [userLang, tenantLang, 'en'] when all are distinct", () => {
    expect(resolveLocaleChain("hr", "es")).toEqual(["hr", "es", "en"]);
  });

  it("deduplicates when user and tenant language are the same", () => {
    expect(resolveLocaleChain("hr", "hr")).toEqual(["hr", "en"]);
  });

  it("deduplicates when user language is 'en'", () => {
    expect(resolveLocaleChain("en", "hr")).toEqual(["en", "hr"]);
  });

  it("skips null/undefined user language", () => {
    expect(resolveLocaleChain(null, "hr")).toEqual(["hr", "en"]);
    expect(resolveLocaleChain(undefined, "hr")).toEqual(["hr", "en"]);
  });

  it("skips null/undefined tenant language", () => {
    expect(resolveLocaleChain("es", null)).toEqual(["es", "en"]);
  });

  it("returns only ['en'] when both are null", () => {
    expect(resolveLocaleChain(null, null)).toEqual(["en"]);
    expect(resolveLocaleChain(undefined, undefined)).toEqual(["en"]);
  });

  it("always ends with 'en' even if user/tenant is already en", () => {
    const chain = resolveLocaleChain("en", "en");
    expect(chain[chain.length - 1]).toBe("en");
  });
});

// ---------------------------------------------------------------------------
// resolveTemplateBody
// ---------------------------------------------------------------------------

describe("resolveTemplateBody", () => {
  const hrTemplate = {
    subject: "HR subject",
    body: "HR body",
  };
  const tenantOverrideHr = {
    translations: {
      hr: { subject: "Tenant HR subject", body: "Tenant HR body" },
    },
  };

  it("uses built-in 'en' template by default (no tenant template, 'en' locale chain)", () => {
    const { body, resolvedLocale } = resolveTemplateBody(
      "booking_confirmed",
      null,
      ["en"],
    );
    expect(resolvedLocale).toBe("en");
    expect(body.subject).toContain("confirmed");
  });

  it("uses built-in 'hr' when locale chain includes 'hr'", () => {
    const { resolvedLocale } = resolveTemplateBody("booking_confirmed", null, ["hr", "en"]);
    expect(resolvedLocale).toBe("hr");
  });

  it("tenant override beats built-in for matching locale", () => {
    const { body, resolvedLocale } = resolveTemplateBody(
      "booking_confirmed",
      tenantOverrideHr,
      ["hr", "en"],
    );
    expect(resolvedLocale).toBe("hr");
    expect(body.subject).toBe("Tenant HR subject");
  });

  it("falls back to next locale if tenant has no translation for first locale", () => {
    // tenant only has 'hr', but locale chain asks for 'es' first
    const { resolvedLocale } = resolveTemplateBody(
      "booking_confirmed",
      tenantOverrideHr,
      ["es", "hr", "en"],
    );
    // 'es' not in tenant override, built-in 'es' exists → should resolve 'es'
    expect(resolvedLocale).toBe("es");
  });

  it("falls back to 'en' built-in when no locale matches", () => {
    const { resolvedLocale } = resolveTemplateBody(
      "booking_confirmed",
      null,
      // contrived — only ask for "en" (always exists)
      ["en"],
    );
    expect(resolvedLocale).toBe("en");
  });

  it("all 6 event types have a built-in 'en' template", () => {
    const eventTypes = [
      "booking_created",
      "booking_confirmed",
      "booking_rejected",
      "booking_cancelled",
      "booking_rescheduled",
      "reminder_due",
    ] as const;

    for (const eventType of eventTypes) {
      const { body, resolvedLocale } = resolveTemplateBody(eventType, null, ["en"]);
      expect(resolvedLocale).toBe("en");
      expect(body.subject.length).toBeGreaterThan(0);
      expect(body.body.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// renderNotification (high-level integration)
// ---------------------------------------------------------------------------

describe("renderNotification", () => {
  const vars: TemplateVariables = {
    customerName: "Ana",
    serviceName: "Massage",
    staffName: "Marko",
    date: "20 Jan",
    time: "10:00",
    tenantName: "Test Salon",
    reason: "N/A",
    previousDate: "19 Jan",
    previousTime: "09:00",
    appointmentAt: "2025-01-20T10:00:00.000Z",
  };

  it("renders booking_confirmed in English end-to-end", () => {
    const result = renderNotification("booking_confirmed", null, vars, "en", "en");
    expect(result.resolvedLocale).toBe("en");
    expect(result.subject).not.toContain("{{");
    expect(result.body).toContain("Ana");
    expect(result.body).not.toContain("{{");
  });

  it("respects user language preference (hr)", () => {
    const result = renderNotification("booking_confirmed", null, vars, "hr", "en");
    expect(result.resolvedLocale).toBe("hr");
  });

  it("falls back to tenant language when user language is null", () => {
    const result = renderNotification("booking_confirmed", null, vars, null, "es");
    expect(result.resolvedLocale).toBe("es");
  });

  it("falls back to 'en' when both user and tenant language are null", () => {
    const result = renderNotification("booking_confirmed", null, vars, null, null);
    expect(result.resolvedLocale).toBe("en");
  });

  it("uses tenant override when present", () => {
    const tenantTemplate = {
      translations: {
        en: { subject: "Custom subject {{customerName}}", body: "Custom body {{serviceName}}" },
      },
    };
    const result = renderNotification("booking_confirmed", tenantTemplate, vars, null, "en");
    expect(result.subject).toBe("Custom subject Ana");
    expect(result.body).toBe("Custom body Massage");
  });

  it("variables are fully interpolated — no raw placeholders remain", () => {
    const result = renderNotification("reminder_due", null, vars, "en", "en");
    expect(result.subject).not.toMatch(/\{\{/);
    expect(result.body).not.toMatch(/\{\{/);
  });
});
