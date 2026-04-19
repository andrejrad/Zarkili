import { createOnboardingDraftRepository } from "../onboardingDraftRepository";
import { CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION } from "../onboardingDraftContracts";

type StoredDoc = Record<string, unknown>;

const mockStore = new Map<string, StoredDoc>();

const mockDoc = jest.fn((_db: unknown, collectionName: string, id: string) => ({
  path: `${collectionName}/${id}`,
  id,
}));
const mockSetDoc = jest.fn(async (ref: { path: string }, data: StoredDoc, options?: { merge: boolean }) => {
  void options;
  mockStore.set(ref.path, {
    ...(mockStore.get(ref.path) ?? {}),
    ...data,
  });
});
const mockGetDoc = jest.fn(async (ref: { path: string }) => ({
  exists: () => mockStore.has(ref.path),
  data: () => mockStore.get(ref.path),
}));
const mockDeleteDoc = jest.fn(async (ref: { path: string }) => {
  mockStore.delete(ref.path);
});
const mockCollection = jest.fn((_db: unknown, collectionName: string) => ({ collectionName }));
const mockWhere = jest.fn((field: string, op: string, value: unknown) => ({ field, op, value }));
const mockOrderBy = jest.fn((field: string, direction: string) => ({ field, direction }));
const mockQuery = jest.fn((collectionRef: { collectionName: string }, ...clauses: Array<Record<string, unknown>>) => ({
  collectionName: collectionRef.collectionName,
  clauses,
}));
const mockGetDocs = jest.fn(async (q: { clauses: Array<Record<string, unknown>> }) => {
  const tenantId = q.clauses.find((clause) => clause.field === "tenantId")?.value;
  const userId = q.clauses.find((clause) => clause.field === "userId")?.value;
  const status = q.clauses.find((clause) => clause.field === "status")?.value;

  const docs = [...mockStore.entries()]
    .filter(([path]) => path.startsWith("onboardingDrafts/"))
    .map(([, value]) => value)
    .filter((value) => value.tenantId === tenantId)
    .filter((value) => value.userId === userId)
    .filter((value) => value.status === status)
    .map((value) => ({ data: () => value }));

  return { docs };
});

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...(args as [unknown, string, string])),
  setDoc: (...args: unknown[]) =>
    mockSetDoc(...(args as [
      { path: string },
      StoredDoc,
      { merge: boolean }
    ])),
  getDoc: (...args: unknown[]) => mockGetDoc(...(args as [{ path: string }])),
  deleteDoc: (...args: unknown[]) =>
    mockDeleteDoc(...(args as [{ path: string }])),
  collection: (...args: unknown[]) =>
    mockCollection(...(args as [unknown, string])),
  where: (...args: unknown[]) =>
    mockWhere(...(args as [string, string, unknown])),
  orderBy: (...args: unknown[]) =>
    mockOrderBy(...(args as [string, string])),
  query: (...args: unknown[]) =>
    mockQuery(...(args as [{ collectionName: string }, ...Array<Record<string, unknown>>])),
  getDocs: (...args: unknown[]) =>
    mockGetDocs(...(args as [{ clauses: Array<Record<string, unknown>> }])),
  serverTimestamp: () => new Date("2026-04-19T00:00:00.000Z"),
}));

describe("OnboardingDraftRepository", () => {
  const db = {};

  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it("saves and resumes a draft", async () => {
    const repo = createOnboardingDraftRepository(db as never);

    const saved = await repo.saveDraft({
      tenantId: "tenantA",
      userId: "userA",
      flowType: "salon",
      currentStep: "business-profile",
      payload: { name: "Luna" },
    });

    expect(saved.draftId).toBe("tenantA_userA_salon");
    expect(saved.schemaVersion).toBe(CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION);

    const resumed = await repo.resumeDraft("tenantA", "userA", "salon");
    expect(resumed?.currentStep).toBe("business-profile");
    expect(resumed?.payload).toEqual({ name: "Luna" });
  });

  it("saves draft with explicit schemaVersion when provided", async () => {
    const repo = createOnboardingDraftRepository(db as never);

    const saved = await repo.saveDraft({
      tenantId: "tenantA",
      userId: "userA",
      flowType: "salon",
      schemaVersion: 2,
      currentStep: "business-profile",
      payload: { businessName: "Luna" },
    });

    expect(saved.schemaVersion).toBe(2);
  });

  it("returns null when draft does not exist", async () => {
    const repo = createOnboardingDraftRepository(db as never);

    await expect(repo.resumeDraft("tenantA", "userA", "client")).resolves.toBeNull();
  });

  it("lists only draft records for tenant and user", async () => {
    const repo = createOnboardingDraftRepository(db as never);

    await repo.saveDraft({
      tenantId: "tenantA",
      userId: "userA",
      flowType: "salon",
      currentStep: "step-1",
      payload: { a: 1 },
    });
    await repo.saveDraft({
      tenantId: "tenantA",
      userId: "userA",
      flowType: "client",
      currentStep: "step-2",
      payload: { b: 2 },
    });
    await repo.saveDraft({
      tenantId: "tenantB",
      userId: "userA",
      flowType: "client",
      currentStep: "step-3",
      payload: { c: 3 },
    });

    const drafts = await repo.listUserDrafts("tenantA", "userA");

    expect(drafts).toHaveLength(2);
    expect(drafts.every((draft) => draft.tenantId === "tenantA")).toBe(true);
  });

  it("discards draft", async () => {
    const repo = createOnboardingDraftRepository(db as never);

    await repo.saveDraft({
      tenantId: "tenantA",
      userId: "userA",
      flowType: "client",
      currentStep: "profile",
      payload: { x: 1 },
    });

    await repo.discardDraft("tenantA", "userA", "client");

    await expect(repo.resumeDraft("tenantA", "userA", "client")).resolves.toBeNull();
  });

  it("validates required fields", async () => {
    const repo = createOnboardingDraftRepository(db as never);

    await expect(
      repo.saveDraft({
        tenantId: "",
        userId: "userA",
        flowType: "client",
        currentStep: "profile",
        payload: {},
      })
    ).rejects.toThrow("tenantId is required");

    await expect(repo.listUserDrafts("tenantA", "")).rejects.toThrow("userId is required");
  });
});
