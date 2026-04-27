import { createUnreadAggregationService } from "../unreadAggregationService";
import type { UserTenantAccessRepository } from "../../../domains/tenants/userTenantAccessRepository";
import type { TenantRepository } from "../../../domains/tenants/repository";
import type { UserTenantAccess } from "../../../domains/tenants/userTenantAccessModel";
import type { Tenant } from "../../../domains/tenants/model";

// Flush all pending microtasks (Promises scheduled with .then / async/await)
function flushPromises(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const fakeTimestamp = { seconds: 0, nanoseconds: 0 } as never;

function makeAccess(overrides: Partial<UserTenantAccess> = {}): UserTenantAccess {
  return {
    accessId: "acc1",
    userId: "u1",
    tenantId: "tA",
    accessLevel: "owner",
    subscriptionStatus: "active",
    subscribedAt: fakeTimestamp,
    unreadMessageCount: 0,
    lastMessageAt: null,
    lastAccessedAt: null,
    nextAppointmentAt: null,
    nextAppointmentServiceName: null,
    status: "active",
    updatedAt: fakeTimestamp,
    ...overrides,
  };
}

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    tenantId: "tA",
    name: "Alpha Salon",
    slug: "alpha",
    status: "active",
    ownerUserId: "u1",
    plan: "starter",
    country: "HR",
    defaultLanguage: "en",
    defaultCurrency: "EUR",
    timezone: "UTC",
    branding: {
      logoUrl: null,
      primary: "#000",
      secondary: "#fff",
      accent: "#abc",
      fontHeading: "sans",
      fontBody: "sans",
      radius: 4,
    },
    settings: {
      bookingLeadHours: 0,
      bookingMaxDays: 30,
      cancellationWindowHours: 0,
      allowGuestBooking: false,
      requireDeposit: false,
    },
    createdAt: fakeTimestamp,
    updatedAt: fakeTimestamp,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock factories
// ---------------------------------------------------------------------------

function makeAccessRepo(
  overrides: Partial<jest.Mocked<UserTenantAccessRepository>> = {},
): jest.Mocked<UserTenantAccessRepository> {
  return {
    getUserTenants: jest.fn().mockResolvedValue([]),
    subscribeUserTenants: jest.fn().mockReturnValue(jest.fn()),
    createAccess: jest.fn(),
    updateAccess: jest.fn(),
    getAccess: jest.fn(),
    incrementUnread: jest.fn(),
    clearUnread: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<UserTenantAccessRepository>;
}

function makeTenantRepo(
  overrides: Partial<jest.Mocked<TenantRepository>> = {},
): jest.Mocked<TenantRepository> {
  return {
    getTenantById: jest.fn().mockResolvedValue(null),
    getTenantBySlug: jest.fn(),
    createTenant: jest.fn(),
    updateTenant: jest.fn(),
    listActiveTenants: jest.fn(),
    ...overrides,
  } as unknown as jest.Mocked<TenantRepository>;
}

// ---------------------------------------------------------------------------
// loadSalonSummaries
// ---------------------------------------------------------------------------

describe("createUnreadAggregationService — loadSalonSummaries", () => {
  it("returns empty summaries when user has no tenant access", async () => {
    const accessRepo = makeAccessRepo();
    const tenantRepo = makeTenantRepo();
    const svc = createUnreadAggregationService(accessRepo, tenantRepo);

    const result = await svc.loadSalonSummaries("u1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summaries).toHaveLength(0);
    expect(result.totalUnread).toBe(0);
  });

  it("includes active and trialing memberships", async () => {
    const active = makeAccess({ tenantId: "tA", subscriptionStatus: "active" });
    const trialing = makeAccess({
      accessId: "acc2",
      tenantId: "tB",
      subscriptionStatus: "trialing",
    });
    const accessRepo = makeAccessRepo({
      getUserTenants: jest.fn().mockResolvedValue([active, trialing]),
    });
    const tenantRepo = makeTenantRepo({
      getTenantById: jest.fn().mockResolvedValue(null),
    });
    const svc = createUnreadAggregationService(accessRepo, tenantRepo);

    const result = await svc.loadSalonSummaries("u1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summaries).toHaveLength(2);
  });

  it("excludes suspended, past_due and cancelled memberships", async () => {
    const accesses = [
      makeAccess({ tenantId: "t1", subscriptionStatus: "suspended" }),
      makeAccess({ accessId: "acc2", tenantId: "t2", subscriptionStatus: "past_due" }),
      makeAccess({ accessId: "acc3", tenantId: "t3", subscriptionStatus: "cancelled" }),
    ];
    const accessRepo = makeAccessRepo({
      getUserTenants: jest.fn().mockResolvedValue(accesses),
    });
    const svc = createUnreadAggregationService(accessRepo, makeTenantRepo());

    const result = await svc.loadSalonSummaries("u1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summaries).toHaveLength(0);
  });

  it("enriches summaries with tenant name and logoUrl", async () => {
    const access = makeAccess({ tenantId: "tA", unreadMessageCount: 3 });
    const tenant = makeTenant({
      tenantId: "tA",
      name: "Alpha Salon",
      branding: {
        logoUrl: "https://example.com/logo.png",
        primary: "#000",
        secondary: "#fff",
        accent: "#abc",
        fontHeading: "sans",
        fontBody: "sans",
        radius: 4,
      },
    });
    const accessRepo = makeAccessRepo({
      getUserTenants: jest.fn().mockResolvedValue([access]),
    });
    const tenantRepo = makeTenantRepo({
      getTenantById: jest.fn().mockResolvedValue(tenant),
    });
    const svc = createUnreadAggregationService(accessRepo, tenantRepo);

    const result = await svc.loadSalonSummaries("u1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const summary = result.summaries[0]!;
    expect(summary.tenantName).toBe("Alpha Salon");
    expect(summary.logoUrl).toBe("https://example.com/logo.png");
    expect(summary.unreadMessageCount).toBe(3);
  });

  it("falls back to tenantId as name when tenant not found", async () => {
    const access = makeAccess({ tenantId: "tX" });
    const accessRepo = makeAccessRepo({
      getUserTenants: jest.fn().mockResolvedValue([access]),
    });
    const tenantRepo = makeTenantRepo({
      getTenantById: jest.fn().mockResolvedValue(null),
    });
    const svc = createUnreadAggregationService(accessRepo, tenantRepo);

    const result = await svc.loadSalonSummaries("u1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summaries[0]?.tenantName).toBe("tX");
    expect(result.summaries[0]?.logoUrl).toBeNull();
  });

  it("calculates totalUnread correctly across multiple salons", async () => {
    const accesses = [
      makeAccess({ tenantId: "tA", unreadMessageCount: 5 }),
      makeAccess({ accessId: "acc2", tenantId: "tB", unreadMessageCount: 10 }),
    ];
    const accessRepo = makeAccessRepo({
      getUserTenants: jest.fn().mockResolvedValue(accesses),
    });
    const svc = createUnreadAggregationService(accessRepo, makeTenantRepo());

    const result = await svc.loadSalonSummaries("u1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.totalUnread).toBe(15);
  });

  it("returns summaries sorted by tenantName ascending", async () => {
    const accesses = [
      makeAccess({ tenantId: "tC" }),
      makeAccess({ accessId: "acc2", tenantId: "tA" }),
      makeAccess({ accessId: "acc3", tenantId: "tB" }),
    ];
    const tenantMap: Record<string, string> = {
      tC: "Zephyr Salon",
      tA: "Alpha Salon",
      tB: "Beta Salon",
    };
    const accessRepo = makeAccessRepo({
      getUserTenants: jest.fn().mockResolvedValue(accesses),
    });
    const tenantRepo = makeTenantRepo({
      getTenantById: jest.fn().mockImplementation((id: string) =>
        Promise.resolve(makeTenant({ tenantId: id, name: tenantMap[id] ?? id })),
      ),
    });
    const svc = createUnreadAggregationService(accessRepo, tenantRepo);

    const result = await svc.loadSalonSummaries("u1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summaries.map((s) => s.tenantName)).toEqual([
      "Alpha Salon",
      "Beta Salon",
      "Zephyr Salon",
    ]);
  });

  it("returns ok:false when getUserTenants throws", async () => {
    const accessRepo = makeAccessRepo({
      getUserTenants: jest.fn().mockRejectedValue(new Error("network error")),
    });
    const svc = createUnreadAggregationService(accessRepo, makeTenantRepo());

    const result = await svc.loadSalonSummaries("u1");

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toBe("network error");
  });

  it("calls getUserTenants with the provided userId", async () => {
    const accessRepo = makeAccessRepo();
    const svc = createUnreadAggregationService(accessRepo, makeTenantRepo());

    await svc.loadSalonSummaries("user-42");

    expect(accessRepo.getUserTenants).toHaveBeenCalledWith("user-42");
  });
});

// ---------------------------------------------------------------------------
// subscribeToSalonSummaries
// ---------------------------------------------------------------------------

describe("createUnreadAggregationService — subscribeToSalonSummaries", () => {
  it("calls onUpdate with summaries relayed from snapshot", async () => {
    const access = makeAccess({ tenantId: "tA", unreadMessageCount: 2 });
    let capturedCallback: ((accesses: UserTenantAccess[]) => void) | null = null;
    const accessRepo = makeAccessRepo({
      subscribeUserTenants: jest.fn().mockImplementation(
        (_userId: string, onChange: (accesses: UserTenantAccess[]) => void) => {
          capturedCallback = onChange;
          return jest.fn();
        },
      ),
    });
    const tenantRepo = makeTenantRepo({
      getTenantById: jest.fn().mockResolvedValue(makeTenant({ tenantId: "tA" })),
    });
    const svc = createUnreadAggregationService(accessRepo, tenantRepo);

    const onUpdate = jest.fn();
    svc.subscribeToSalonSummaries("u1", onUpdate);

    // Simulate snapshot arriving
    capturedCallback!([access]);

    // Flush all microtasks: buildSummaries → getTenantById → Promise.all → .then
    await flushPromises();

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const result = onUpdate.mock.calls[0][0] as ReturnType<typeof onUpdate>;
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.summaries).toHaveLength(1);
  });

  it("returns an unsubscribe function from the repository", () => {
    const unsubscribeSpy = jest.fn();
    const accessRepo = makeAccessRepo({
      subscribeUserTenants: jest.fn().mockReturnValue(unsubscribeSpy),
    });
    const svc = createUnreadAggregationService(accessRepo, makeTenantRepo());

    const unsubscribe = svc.subscribeToSalonSummaries("u1", jest.fn());

    expect(typeof unsubscribe).toBe("function");
    unsubscribe();
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it("calls onUpdate with ok:false when tenant metadata fetch fails", async () => {
    const access = makeAccess({ tenantId: "tA" });
    let capturedCallback: ((accesses: UserTenantAccess[]) => void) | null = null;
    const accessRepo = makeAccessRepo({
      subscribeUserTenants: jest.fn().mockImplementation(
        (_userId: string, onChange: (accesses: UserTenantAccess[]) => void) => {
          capturedCallback = onChange;
          return jest.fn();
        },
      ),
    });
    const tenantRepo = makeTenantRepo({
      getTenantById: jest.fn().mockRejectedValue(new Error("metadata fetch failed")),
    });
    const svc = createUnreadAggregationService(accessRepo, tenantRepo);

    const onUpdate = jest.fn();
    svc.subscribeToSalonSummaries("u1", onUpdate);

    capturedCallback!([access]);
    await flushPromises();

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const result = onUpdate.mock.calls[0][0];
    expect(result.ok).toBe(false);
    expect(result.message).toBe("metadata fetch failed");
  });
});

// ---------------------------------------------------------------------------
// Context isolation (5.5.3)
// ---------------------------------------------------------------------------

describe("createUnreadAggregationService — context isolation", () => {
  it("passes the exact userId to the repository — other users' data is never requested", async () => {
    const accessRepo = makeAccessRepo({
      getUserTenants: jest.fn().mockResolvedValue([makeAccess({ userId: "u1", tenantId: "tA" })]),
    });
    const svc = createUnreadAggregationService(accessRepo, makeTenantRepo());

    await svc.loadSalonSummaries("u1");

    expect(accessRepo.getUserTenants).toHaveBeenCalledWith("u1");
    expect(accessRepo.getUserTenants).not.toHaveBeenCalledWith("u2");
  });

  it("two parallel calls for different users return isolated results", async () => {
    const accessRepo = makeAccessRepo({
      getUserTenants: jest.fn().mockImplementation((userId: string) => {
        if (userId === "u1") return Promise.resolve([makeAccess({ userId: "u1", tenantId: "tA" })]);
        if (userId === "u2") return Promise.resolve([makeAccess({ accessId: "acc2", userId: "u2", tenantId: "tB" })]);
        return Promise.resolve([]);
      }),
    });
    const svc = createUnreadAggregationService(accessRepo, makeTenantRepo());

    const [r1, r2] = await Promise.all([
      svc.loadSalonSummaries("u1"),
      svc.loadSalonSummaries("u2"),
    ]);

    expect(r1.ok).toBe(true);
    expect(r2.ok).toBe(true);
    if (!r1.ok || !r2.ok) return;

    const ids1 = r1.summaries.map((s) => s.tenantId);
    const ids2 = r2.summaries.map((s) => s.tenantId);

    // u1 sees only tA
    expect(ids1).toContain("tA");
    expect(ids1).not.toContain("tB");

    // u2 sees only tB
    expect(ids2).toContain("tB");
    expect(ids2).not.toContain("tA");
  });

  it("subscribeToSalonSummaries opens a separate subscription per userId, not a shared one", () => {
    const accessRepo = makeAccessRepo({
      subscribeUserTenants: jest.fn().mockReturnValue(jest.fn()),
    });
    const svc = createUnreadAggregationService(accessRepo, makeTenantRepo());

    svc.subscribeToSalonSummaries("u1", jest.fn());
    svc.subscribeToSalonSummaries("u2", jest.fn());

    expect(accessRepo.subscribeUserTenants).toHaveBeenCalledTimes(2);
    expect(accessRepo.subscribeUserTenants).toHaveBeenNthCalledWith(1, "u1", expect.any(Function));
    expect(accessRepo.subscribeUserTenants).toHaveBeenNthCalledWith(2, "u2", expect.any(Function));
  });

  it("suspended and cancelled tenants are excluded even when mixed with active ones in the same account", async () => {
    const accesses = [
      makeAccess({ tenantId: "tActive", subscriptionStatus: "active" }),
      makeAccess({ accessId: "acc2", tenantId: "tSuspended", subscriptionStatus: "suspended" }),
      makeAccess({ accessId: "acc3", tenantId: "tCancelled", subscriptionStatus: "cancelled" }),
      makeAccess({ accessId: "acc4", tenantId: "tPastDue", subscriptionStatus: "past_due" }),
    ];
    const accessRepo = makeAccessRepo({
      getUserTenants: jest.fn().mockResolvedValue(accesses),
    });
    const svc = createUnreadAggregationService(accessRepo, makeTenantRepo());

    const result = await svc.loadSalonSummaries("u1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.summaries).toHaveLength(1);
    expect(result.summaries[0]?.tenantId).toBe("tActive");

    const tenantIds = result.summaries.map((s) => s.tenantId);
    expect(tenantIds).not.toContain("tSuspended");
    expect(tenantIds).not.toContain("tCancelled");
    expect(tenantIds).not.toContain("tPastDue");
  });

  it("unread counts from one tenant do not bleed into another tenant's summary", async () => {
    const accesses = [
      makeAccess({ tenantId: "tA", unreadMessageCount: 10 }),
      makeAccess({ accessId: "acc2", tenantId: "tB", unreadMessageCount: 3 }),
    ];
    const accessRepo = makeAccessRepo({
      getUserTenants: jest.fn().mockResolvedValue(accesses),
    });
    const svc = createUnreadAggregationService(accessRepo, makeTenantRepo());

    const result = await svc.loadSalonSummaries("u1");

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const summaryA = result.summaries.find((s) => s.tenantId === "tA");
    const summaryB = result.summaries.find((s) => s.tenantId === "tB");

    expect(summaryA?.unreadMessageCount).toBe(10);
    expect(summaryB?.unreadMessageCount).toBe(3);
    // totalUnread is additive, not duplicated
    expect(result.totalUnread).toBe(13);
  });
});

