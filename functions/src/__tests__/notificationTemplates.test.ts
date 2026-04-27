/**
 * notificationTemplates.test.ts
 *
 * Vitest unit tests for `runPreview` — the pure preview logic extracted from
 * the `previewNotificationTemplate` Cloud Function.
 *
 * Firestore is fully mocked — no emulator required.
 */

import { HttpsError } from "firebase-functions/v2/https";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { runPreview } from "../notificationTemplates";

// ---------------------------------------------------------------------------
// Helpers: minimal Firestore mock
// ---------------------------------------------------------------------------

type FakeDoc = { exists: boolean; data: () => Record<string, unknown> | undefined };
type CollectionMap = Record<string, Record<string, FakeDoc>>;

function makeMockDb(collections: CollectionMap): FirebaseFirestore.Firestore {
  return {
    collection: (colId: string) => ({
      doc: (docId: string) => ({
        get: async () => {
          const col = collections[colId];
          const doc = col?.[docId];
          if (!doc) return { exists: false, data: () => undefined };
          return doc;
        },
      }),
    }),
  } as unknown as FirebaseFirestore.Firestore;
}

const TENANT_ID = "salon_abc";
const TENANT_DOC: FakeDoc = {
  exists: true,
  data: () => ({ tenantId: TENANT_ID, defaultLanguage: "en" }),
};

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

function makeDb(overrides: Partial<CollectionMap> = {}): FirebaseFirestore.Firestore {
  return makeMockDb({
    tenants: { [TENANT_ID]: TENANT_DOC },
    tenantNotificationTemplates: {},
    ...overrides,
  });
}

// ---------------------------------------------------------------------------
// Validation tests
// ---------------------------------------------------------------------------

describe("runPreview — validation", () => {
  it("throws invalid-argument when tenantId is missing", async () => {
    await expect(
      runPreview({ tenantId: "", eventType: "booking_confirmed" }, makeDb()),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("throws invalid-argument when tenantId is whitespace only", async () => {
    await expect(
      runPreview({ tenantId: "   ", eventType: "booking_confirmed" }, makeDb()),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("throws invalid-argument for unknown eventType", async () => {
    await expect(
      runPreview({ tenantId: TENANT_ID, eventType: "not_a_real_event" }, makeDb()),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("throws invalid-argument for invalid locale", async () => {
    await expect(
      runPreview({ tenantId: TENANT_ID, eventType: "booking_confirmed", locale: "fr" }, makeDb()),
    ).rejects.toMatchObject({ code: "invalid-argument" });
  });

  it("accepts all valid event types without throwing", async () => {
    const eventTypes = [
      "booking_created",
      "booking_confirmed",
      "booking_rejected",
      "booking_cancelled",
      "booking_rescheduled",
      "reminder_due",
    ];
    for (const eventType of eventTypes) {
      await expect(
        runPreview({ tenantId: TENANT_ID, eventType }, makeDb()),
      ).resolves.toBeDefined();
    }
  });

  it("accepts all valid locales without throwing", async () => {
    for (const locale of ["en", "hr", "es"]) {
      await expect(
        runPreview({ tenantId: TENANT_ID, eventType: "booking_confirmed", locale }, makeDb()),
      ).resolves.toBeDefined();
    }
  });
});

// ---------------------------------------------------------------------------
// Tenant not found
// ---------------------------------------------------------------------------

describe("runPreview — tenant not found", () => {
  it("throws not-found when tenant document does not exist", async () => {
    const db = makeMockDb({
      tenants: { [TENANT_ID]: { exists: false, data: () => undefined } },
      tenantNotificationTemplates: {},
    });
    await expect(
      runPreview({ tenantId: TENANT_ID, eventType: "booking_confirmed" }, db),
    ).rejects.toMatchObject({ code: "not-found" });
  });
});

// ---------------------------------------------------------------------------
// Built-in template rendering
// ---------------------------------------------------------------------------

describe("runPreview — built-in templates", () => {
  it("returns source 'built_in' when no tenant template exists", async () => {
    const result = await runPreview(
      { tenantId: TENANT_ID, eventType: "booking_confirmed" },
      makeDb(),
    );
    expect(result.source).toBe("built_in");
  });

  it("resolves to 'en' when tenant defaultLanguage is 'en' and no user locale supplied", async () => {
    const result = await runPreview(
      { tenantId: TENANT_ID, eventType: "booking_confirmed" },
      makeDb(),
    );
    expect(result.resolvedLocale).toBe("en");
  });

  it("resolves to tenant defaultLanguage when no user locale is supplied", async () => {
    const db = makeMockDb({
      tenants: {
        [TENANT_ID]: { exists: true, data: () => ({ defaultLanguage: "hr" }) },
      },
      tenantNotificationTemplates: {},
    });
    const result = await runPreview(
      { tenantId: TENANT_ID, eventType: "booking_confirmed" },
      db,
    );
    expect(result.resolvedLocale).toBe("hr");
  });

  it("uses user locale over tenant defaultLanguage", async () => {
    const db = makeMockDb({
      tenants: {
        [TENANT_ID]: { exists: true, data: () => ({ defaultLanguage: "hr" }) },
      },
      tenantNotificationTemplates: {},
    });
    const result = await runPreview(
      { tenantId: TENANT_ID, eventType: "booking_confirmed", locale: "es" },
      db,
    );
    expect(result.resolvedLocale).toBe("es");
  });

  it("renders subject and body without raw placeholders", async () => {
    const result = await runPreview(
      { tenantId: TENANT_ID, eventType: "reminder_due" },
      makeDb(),
    );
    expect(result.subject).not.toMatch(/\{\{/);
    expect(result.body).not.toMatch(/\{\{/);
  });
});

// ---------------------------------------------------------------------------
// Tenant override template
// ---------------------------------------------------------------------------

describe("runPreview — tenant override templates", () => {
  const DB_WITH_OVERRIDE = makeMockDb({
    tenants: { [TENANT_ID]: TENANT_DOC },
    tenantNotificationTemplates: {
      [`${TENANT_ID}_booking_confirmed`]: {
        exists: true,
        data: () => ({
          translations: {
            en: { subject: "Custom subject {{customerName}}", body: "Custom body {{serviceName}}" },
          },
        }),
      },
    },
  });

  it("returns source 'tenant_override' when tenant translation exists for resolved locale", async () => {
    const result = await runPreview(
      { tenantId: TENANT_ID, eventType: "booking_confirmed" },
      DB_WITH_OVERRIDE,
    );
    expect(result.source).toBe("tenant_override");
  });

  it("uses the tenant override template content", async () => {
    const result = await runPreview(
      {
        tenantId: TENANT_ID,
        eventType: "booking_confirmed",
        sampleVars: { customerName: "Lena", serviceName: "Cut" },
      },
      DB_WITH_OVERRIDE,
    );
    expect(result.subject).toBe("Custom subject Lena");
    expect(result.body).toBe("Custom body Cut");
  });

  it("falls back to built-in when tenant template exists but lacks the requested locale", async () => {
    // Tenant override only has 'hr'; user requests 'es'
    const db = makeMockDb({
      tenants: { [TENANT_ID]: TENANT_DOC },
      tenantNotificationTemplates: {
        [`${TENANT_ID}_booking_confirmed`]: {
          exists: true,
          data: () => ({
            translations: { hr: { subject: "HR subject", body: "HR body" } },
          }),
        },
      },
    });
    // user locale 'es', tenant defaultLanguage 'en'
    const result = await runPreview(
      { tenantId: TENANT_ID, eventType: "booking_confirmed", locale: "es" },
      db,
    );
    // tenant has no 'es', but built-in 'es' exists — should use built-in 'es'
    expect(result.resolvedLocale).toBe("es");
    expect(result.source).toBe("built_in");
  });
});

// ---------------------------------------------------------------------------
// sampleVars override
// ---------------------------------------------------------------------------

describe("runPreview — sampleVars", () => {
  it("merges sampleVars over DEFAULT_SAMPLE_VARS", async () => {
    const result = await runPreview(
      {
        tenantId: TENANT_ID,
        eventType: "booking_confirmed",
        sampleVars: { customerName: "Override Name" },
      },
      makeDb(),
    );
    expect(result.body).toContain("Override Name");
  });

  it("custom sampleVars are fully interpolated — no placeholders leak", async () => {
    const result = await runPreview(
      {
        tenantId: TENANT_ID,
        eventType: "booking_confirmed",
        sampleVars: {
          customerName: "X",
          serviceName: "Y",
          staffName: "Z",
          date: "D",
          time: "T",
        },
      },
      makeDb(),
    );
    expect(result.subject).not.toMatch(/\{\{/);
    expect(result.body).not.toMatch(/\{\{/);
  });
});
