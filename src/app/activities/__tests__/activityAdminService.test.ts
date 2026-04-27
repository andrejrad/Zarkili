import { createActivityAdminService } from "../activityAdminService";
import type { ActivityRepository } from "../../../domains/activities/repository";
import type { Activity } from "../../../domains/activities/model";
import { ActivityError } from "../../../domains/activities/model";

// ---------------------------------------------------------------------------
// Reusable stub factory
// ---------------------------------------------------------------------------

const MOCK_ACTIVITY: Activity = {
  activityId: "act-1",
  tenantId: "t1",
  type: "visit_streak",
  name: "Visit 3 times",
  status: "draft",
  startDate: "2026-05-01",
  endDate: "2026-07-31",
  rule: { type: "visit_streak", targetValue: 3 },
  reward: { type: "discount_percent", value: 15, description: "15% off next visit" },
  createdBy: "admin",
  createdAt: { seconds: 1000, nanoseconds: 0 } as never,
  updatedAt: { seconds: 1000, nanoseconds: 0 } as never,
};

function stubRepo(overrides: Partial<ActivityRepository> = {}): ActivityRepository {
  return {
    listActivities:     jest.fn(async () => []),
    createActivity:     jest.fn(async () => MOCK_ACTIVITY),
    getActivity:        jest.fn(async () => null),
    activateActivity:   jest.fn(async () => {}),
    deactivateActivity: jest.fn(async () => {}),
    updateActivityStatus: jest.fn(async () => {}),
    recordParticipation:  jest.fn(async () => ({} as never)),
    getParticipation:     jest.fn(async () => null),
    checkCompletion:      jest.fn(async () => false),
    awardReward:          jest.fn(async () => {}),
    ...overrides,
  } as unknown as ActivityRepository;
}

const VALID_INPUT = {
  tenantId: "t1",
  type: "visit_streak" as const,
  name: "Visit 3 times",
  startDate: "2026-05-01",
  endDate: "2026-07-31",
  rule: { type: "visit_streak" as const, targetValue: 3 },
  reward: { type: "discount_percent" as const, value: 15, description: "15% off" },
  createdBy: "admin",
};

// ---------------------------------------------------------------------------
// listActivities
// ---------------------------------------------------------------------------

describe("activityAdminService — listActivities", () => {
  it("returns ok with empty list when no activities", async () => {
    const svc = createActivityAdminService(stubRepo());
    const result = await svc.listActivities("t1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual([]);
  });

  it("returns ok with activities from repository", async () => {
    const svc = createActivityAdminService(stubRepo({ listActivities: jest.fn(async () => [MOCK_ACTIVITY]) }));
    const result = await svc.listActivities("t1");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toHaveLength(1);
  });

  it("returns error for empty tenantId", async () => {
    const svc = createActivityAdminService(stubRepo());
    const result = await svc.listActivities("");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("TENANT_REQUIRED");
  });

  it("maps repository errors to ok: false", async () => {
    const svc = createActivityAdminService(
      stubRepo({ listActivities: jest.fn(async () => { throw new ActivityError("TENANT_REQUIRED", "fail"); }) }),
    );
    const result = await svc.listActivities("t1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("TENANT_REQUIRED");
  });
});

// ---------------------------------------------------------------------------
// createActivity
// ---------------------------------------------------------------------------

describe("activityAdminService — createActivity", () => {
  it("returns ok with created activity on success", async () => {
    const svc = createActivityAdminService(stubRepo());
    const result = await svc.createActivity(VALID_INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.activityId).toBe("act-1");
  });

  it("rejects empty tenantId", async () => {
    const svc = createActivityAdminService(stubRepo());
    const result = await svc.createActivity({ ...VALID_INPUT, tenantId: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("TENANT_REQUIRED");
  });

  it("rejects empty name", async () => {
    const svc = createActivityAdminService(stubRepo());
    const result = await svc.createActivity({ ...VALID_INPUT, name: "   " });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("rejects end date before start date", async () => {
    const svc = createActivityAdminService(stubRepo());
    const result = await svc.createActivity({ ...VALID_INPUT, startDate: "2026-07-01", endDate: "2026-06-01" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("rejects zero target value", async () => {
    const svc = createActivityAdminService(stubRepo());
    const result = await svc.createActivity({ ...VALID_INPUT, rule: { type: "visit_streak", targetValue: 0 } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("VALIDATION_ERROR");
  });

  it("maps repository errors to ok: false", async () => {
    const svc = createActivityAdminService(
      stubRepo({ createActivity: jest.fn(async () => { throw new Error("DB error"); }) }),
    );
    const result = await svc.createActivity(VALID_INPUT);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("UNKNOWN_ERROR");
  });
});

// ---------------------------------------------------------------------------
// activateActivity
// ---------------------------------------------------------------------------

describe("activityAdminService — activateActivity", () => {
  it("returns ok on success", async () => {
    const svc = createActivityAdminService(stubRepo());
    const result = await svc.activateActivity("t1", "act-1");
    expect(result.ok).toBe(true);
  });

  it("maps ActivityError to ok: false with correct code", async () => {
    const svc = createActivityAdminService(
      stubRepo({ activateActivity: jest.fn(async () => { throw new ActivityError("ACTIVITY_NOT_FOUND", "not found"); }) }),
    );
    const result = await svc.activateActivity("t1", "bad-id");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("ACTIVITY_NOT_FOUND");
  });

  it("maps generic errors to UNKNOWN_ERROR", async () => {
    const svc = createActivityAdminService(
      stubRepo({ activateActivity: jest.fn(async () => { throw new Error("network"); }) }),
    );
    const result = await svc.activateActivity("t1", "act-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("UNKNOWN_ERROR");
  });
});

// ---------------------------------------------------------------------------
// deactivateActivity
// ---------------------------------------------------------------------------

describe("activityAdminService — deactivateActivity", () => {
  it("returns ok on success", async () => {
    const svc = createActivityAdminService(stubRepo());
    const result = await svc.deactivateActivity("t1", "act-1");
    expect(result.ok).toBe(true);
  });

  it("maps ActivityError to ok: false", async () => {
    const svc = createActivityAdminService(
      stubRepo({ deactivateActivity: jest.fn(async () => { throw new ActivityError("INVALID_STATUS_TRANSITION", "bad transition"); }) }),
    );
    const result = await svc.deactivateActivity("t1", "act-1");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_STATUS_TRANSITION");
  });
});
