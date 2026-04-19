import { createAiBudgetConfigRepository } from "../budgetConfigRepository";

type StoredDoc = Record<string, unknown>;

const mockStore = new Map<string, StoredDoc>();

const mockDoc = jest.fn((_db: unknown, collectionName: string, id: string) => ({
  path: `${collectionName}/${id}`,
  id,
}));
const mockGetDoc = jest.fn(async (ref: { path: string }) => ({
  exists: () => mockStore.has(ref.path),
  data: () => mockStore.get(ref.path),
}));
const mockSetDoc = jest.fn(async (ref: { path: string }, data: StoredDoc, options?: { merge: boolean }) => {
  void options;
  mockStore.set(ref.path, {
    ...(mockStore.get(ref.path) ?? {}),
    ...data,
  });
});

jest.mock("firebase/firestore", () => ({
  doc: (...args: unknown[]) => mockDoc(...(args as [unknown, string, string])),
  getDoc: (...args: unknown[]) => mockGetDoc(...(args as [{ path: string }])),
  setDoc: (...args: unknown[]) =>
    mockSetDoc(...(args as [
      { path: string },
      StoredDoc,
      { merge: boolean }
    ])),
  serverTimestamp: () => new Date("2026-04-19T00:00:00.000Z"),
}));

describe("AiBudgetConfigRepository", () => {
  const db = {};

  beforeEach(() => {
    mockStore.clear();
    jest.clearAllMocks();
  });

  it("returns default config when platform document is missing", async () => {
    const repo = createAiBudgetConfigRepository(db as never);

    const config = await repo.getBudgetConfig();

    expect(config.globalMonthlyCapUsd).toBe(1090);
    expect(config.featureCaps["support-triage"].monthlyCapUsd).toBe(120);
  });

  it("applies partial admin override for one feature cap", async () => {
    const repo = createAiBudgetConfigRepository(db as never);

    const updated = await repo.updateBudgetConfig({
      featureCaps: {
        "support-triage": { monthlyCapUsd: 150 },
      },
    });

    expect(updated.featureCaps["support-triage"].monthlyCapUsd).toBe(150);
    expect(updated.featureCaps["content-creation"].monthlyCapUsd).toBe(120);
  });

  it("applies threshold and global cap overrides", async () => {
    const repo = createAiBudgetConfigRepository(db as never);

    const updated = await repo.updateBudgetConfig({
      globalMonthlyCapUsd: 1500,
      warningThreshold: 0.65,
      protectionThreshold: 0.92,
    });

    expect(updated.globalMonthlyCapUsd).toBe(1500);
    expect(updated.warningThreshold).toBe(0.65);
    expect(updated.protectionThreshold).toBe(0.92);
  });

  it("throws when update payload is empty", async () => {
    const repo = createAiBudgetConfigRepository(db as never);

    await expect(repo.updateBudgetConfig({})).rejects.toThrow("Update payload must not be empty");
  });

  it("throws when thresholds are invalid", async () => {
    const repo = createAiBudgetConfigRepository(db as never);

    await expect(
      repo.updateBudgetConfig({
        warningThreshold: 0.95,
        protectionThreshold: 0.9,
      })
    ).rejects.toThrow("protectionThreshold must be within (warningThreshold, 1]");
  });

  it("throws when feature cap override is invalid", async () => {
    const repo = createAiBudgetConfigRepository(db as never);

    await expect(
      repo.updateBudgetConfig({
        featureCaps: {
          "support-triage": { monthlyCapUsd: 0 },
        },
      })
    ).rejects.toThrow("Invalid monthly cap for feature support-triage");
  });
});
