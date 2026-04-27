import { renderTemplate, DEFAULT_VARIABLE_FALLBACKS } from "../model";
import { createTemplateRepository } from "../repository";
import type { Template } from "../model";

// ---------------------------------------------------------------------------
// In-memory Firestore mock
// ---------------------------------------------------------------------------

function makeFirestoreMock() {
  const store: Record<string, Record<string, unknown>> = {};

  function resolveValue(v: unknown): unknown {
    if (v !== null && typeof v === "object" && "_type" in (v as Record<string, unknown>)) {
      return { seconds: 1000, nanoseconds: 0 };
    }
    return v;
  }

  function doc(_db: unknown, path?: string, id?: string) {
    return { _key: `${path}/${id}`, id: id as string };
  }

  async function getDoc(ref: { _key: string; id: string }) {
    const data = store[ref._key];
    return { exists: () => data !== undefined, data: () => (data ? { ...data } : null), id: ref.id };
  }

  async function setDoc(ref: { _key: string }, data: Record<string, unknown>, _opts?: unknown) {
    const resolved: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) resolved[k] = resolveValue(v);
    store[ref._key] = resolved;
  }

  function collection(_db: unknown, path: string) {
    return { _path: path };
  }

  type WhereClause = { _field: string; _op: string; _value: unknown };
  function where(field: string, op: string, value: unknown): WhereClause {
    return { _field: field, _op: op, _value: value };
  }

  type QueryRef = { _path: string; _wheres: WhereClause[] };
  function query(colRef: { _path: string }, ...clauses: unknown[]): QueryRef {
    const wheres = clauses.filter((c) => "_field" in (c as object)) as WhereClause[];
    return { _path: colRef._path, _wheres: wheres };
  }

  function applyWhere(data: Record<string, unknown>, clause: WhereClause): boolean {
    const val = data[clause._field];
    if (clause._op === "==") return val === clause._value;
    return false;
  }

  async function getDocs(q: QueryRef) {
    const prefix = q._path + "/";
    const matches = Object.entries(store)
      .filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes("/"))
      .map(([key, data]) => ({ key, data }))
      .filter(({ data }) => q._wheres.every((w) => applyWhere(data, w)));

    return {
      docs: matches.map(({ key, data }) => ({
        data: () => ({ ...data }),
        id: key.split("/").pop()!,
        exists: () => true,
      })),
    };
  }

  function serverTimestamp() { return { _type: "serverTimestamp" }; }

  return { db: {} as unknown, doc, getDoc, setDoc, collection, where, query, getDocs, serverTimestamp };
}

let mock = makeFirestoreMock();

jest.mock("firebase/firestore", () => ({
  doc:             (...args: unknown[]) => mock.doc(...(args as Parameters<typeof mock.doc>)),
  getDoc:          (...args: unknown[]) => mock.getDoc(...(args as Parameters<typeof mock.getDoc>)),
  setDoc:          (...args: unknown[]) => mock.setDoc(...(args as Parameters<typeof mock.setDoc>)),
  collection:      (...args: unknown[]) => mock.collection(...(args as Parameters<typeof mock.collection>)),
  where:           (...args: unknown[]) => mock.where(...(args as Parameters<typeof mock.where>)),
  query:           (...args: unknown[]) => mock.query(...(args as Parameters<typeof mock.query>)),
  getDocs:         (...args: unknown[]) => mock.getDocs(...(args as Parameters<typeof mock.getDocs>)),
  serverTimestamp: () => mock.serverTimestamp(),
}));

beforeEach(() => { mock = makeFirestoreMock(); });

function makeRepo() { return createTemplateRepository(mock.db as never); }

const TEMPLATE_DRAFT: Omit<Template, "templateId" | "createdAt" | "updatedAt"> = {
  tenantId: "tenant-1",
  name: "Win-back",
  channel: "email",
  subject: "We miss you, {{customerFirstName}}!",
  body: "Hi {{customerFirstName}}, book at {{locationName}} using {{bookingLink}}.",
  variables: ["customerFirstName", "locationName", "bookingLink"],
  isDefault: false,
};

// ---------------------------------------------------------------------------
// renderTemplate (pure)
// ---------------------------------------------------------------------------

describe("renderTemplate", () => {
  it("replaces all known variables",              () => {
    const result = renderTemplate(
      { subject: "Hi {{customerFirstName}}", body: "Book at {{locationName}}" },
      { customerFirstName: "Alice", locationName: "The Hair Lab" },
    );
    expect(result.subject).toBe("Hi Alice");
    expect(result.body).toBe("Book at The Hair Lab");
    expect(result.missingVariables).toEqual([]);
  });

  it("uses DEFAULT_VARIABLE_FALLBACKS for missing vars", () => {
    const result = renderTemplate(
      { body: "Dear {{customerFirstName}}" },
      {},
    );
    expect(result.body).toBe(`Dear ${DEFAULT_VARIABLE_FALLBACKS.customerFirstName}`);
    expect(result.missingVariables).toEqual([]);
  });

  it("replaces completely unknown variable with empty string", () => {
    const result = renderTemplate({ body: "Code: {{promoCode}}" }, {});
    expect(result.body).toBe("Code: ");
    expect(result.missingVariables).toContain("promoCode");
  });

  it("reports each missing variable only once", () => {
    const result = renderTemplate({ body: "{{foo}} {{foo}} {{bar}}" }, {});
    expect(result.missingVariables).toEqual(["foo", "bar"]);
  });

  it("renders body without subject",              () => {
    const result = renderTemplate({ body: "Hello {{customerFirstName}}" }, { customerFirstName: "Bob" });
    expect(result.subject).toBeUndefined();
    expect(result.body).toBe("Hello Bob");
  });

  it("handles template with no placeholders",     () => {
    const result = renderTemplate({ body: "Just plain text." }, {});
    expect(result.body).toBe("Just plain text.");
    expect(result.missingVariables).toEqual([]);
  });

  it("leaves content safe when value is empty string", () => {
    const result = renderTemplate({ body: "Link: {{bookingLink}}" }, {});
    expect(result.body).toBe("Link: ");
  });
});

// ---------------------------------------------------------------------------
// createTemplate
// ---------------------------------------------------------------------------

describe("TemplateRepository — createTemplate", () => {
  it("returns a template with a generated id", async () => {
    const t = await makeRepo().createTemplate(TEMPLATE_DRAFT);
    expect(t.templateId).toBeTruthy();
    expect(t.name).toBe("Win-back");
  });

  it("persists so getTemplate retrieves it", async () => {
    const repo = makeRepo();
    const t = await repo.createTemplate(TEMPLATE_DRAFT);
    const fetched = await repo.getTemplate("tenant-1", t.templateId);
    expect(fetched?.templateId).toBe(t.templateId);
  });

  it("throws TENANT_REQUIRED for empty tenantId", async () => {
    await expect(makeRepo().createTemplate({ ...TEMPLATE_DRAFT, tenantId: "" })).rejects.toThrow("TENANT_REQUIRED");
  });
});

// ---------------------------------------------------------------------------
// getTemplate
// ---------------------------------------------------------------------------

describe("TemplateRepository — getTemplate", () => {
  it("returns null for unknown template", async () => {
    expect(await makeRepo().getTemplate("tenant-1", "nonexistent")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updateTemplate
// ---------------------------------------------------------------------------

describe("TemplateRepository — updateTemplate", () => {
  it("updates body", async () => {
    const repo = makeRepo();
    const t = await repo.createTemplate(TEMPLATE_DRAFT);
    await repo.updateTemplate("tenant-1", t.templateId, { body: "Updated body" });
    const fetched = await repo.getTemplate("tenant-1", t.templateId);
    expect(fetched?.body).toBe("Updated body");
  });

  it("throws TEMPLATE_NOT_FOUND for unknown id", async () => {
    await expect(makeRepo().updateTemplate("tenant-1", "bad-id", { name: "X" })).rejects.toThrow("TEMPLATE_NOT_FOUND");
  });

  it("does not overwrite unrelated fields", async () => {
    const repo = makeRepo();
    const t = await repo.createTemplate(TEMPLATE_DRAFT);
    await repo.updateTemplate("tenant-1", t.templateId, { name: "New Name" });
    const fetched = await repo.getTemplate("tenant-1", t.templateId);
    expect(fetched?.channel).toBe("email");
  });
});

// ---------------------------------------------------------------------------
// deleteTemplate
// ---------------------------------------------------------------------------

describe("TemplateRepository — deleteTemplate", () => {
  it("throws TEMPLATE_NOT_FOUND for unknown id", async () => {
    await expect(makeRepo().deleteTemplate("tenant-1", "bad-id")).rejects.toThrow("TEMPLATE_NOT_FOUND");
  });

  it("throws CANNOT_DELETE_DEFAULT for default templates", async () => {
    const repo = makeRepo();
    const t = await repo.createTemplate({ ...TEMPLATE_DRAFT, isDefault: true });
    await expect(repo.deleteTemplate("tenant-1", t.templateId)).rejects.toThrow("CANNOT_DELETE_DEFAULT");
  });

  it("soft-deletes a non-default template", async () => {
    const repo = makeRepo();
    const t = await repo.createTemplate(TEMPLATE_DRAFT);
    await expect(repo.deleteTemplate("tenant-1", t.templateId)).resolves.not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getDefaultTemplates
// ---------------------------------------------------------------------------

describe("TemplateRepository — getDefaultTemplates", () => {
  it("returns only default templates", async () => {
    const repo = makeRepo();
    await repo.createTemplate({ ...TEMPLATE_DRAFT, isDefault: true, name: "Default Email" });
    await repo.createTemplate({ ...TEMPLATE_DRAFT, isDefault: false, name: "Custom" });
    const defaults = await repo.getDefaultTemplates("tenant-1");
    expect(defaults.every((t) => t.isDefault)).toBe(true);
  });

  it("filters by channel when provided", async () => {
    const repo = makeRepo();
    await repo.createTemplate({ ...TEMPLATE_DRAFT, isDefault: true, channel: "email",  name: "Email Default" });
    await repo.createTemplate({ ...TEMPLATE_DRAFT, isDefault: true, channel: "sms",    name: "SMS Default" });
    const smsDefaults = await repo.getDefaultTemplates("tenant-1", "sms");
    expect(smsDefaults.every((t) => t.channel === "sms")).toBe(true);
  });

  it("throws TENANT_REQUIRED for empty tenantId", async () => {
    await expect(makeRepo().getDefaultTemplates("")).rejects.toThrow("TENANT_REQUIRED");
  });
});

// ---------------------------------------------------------------------------
// previewTemplate
// ---------------------------------------------------------------------------

describe("TemplateRepository — previewTemplate", () => {
  it("renders template with sample variables", async () => {
    const repo = makeRepo();
    const t = await repo.createTemplate(TEMPLATE_DRAFT);
    const preview = await repo.previewTemplate("tenant-1", t.templateId, {
      customerFirstName: "Carol",
      locationName: "Glow Studio",
      bookingLink: "https://example.com/book",
    });
    expect(preview.body).toContain("Carol");
    expect(preview.body).toContain("Glow Studio");
    expect(preview.missingVariables).toEqual([]);
  });

  it("throws TEMPLATE_NOT_FOUND for unknown id", async () => {
    await expect(makeRepo().previewTemplate("tenant-1", "bad-id", {})).rejects.toThrow("TEMPLATE_NOT_FOUND");
  });
});
