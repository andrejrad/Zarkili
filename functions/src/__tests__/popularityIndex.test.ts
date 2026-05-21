/**
 * popularityIndex.test.ts
 *
 * Unit tests for the per-tenant popularity index Cloud Function.
 * No Cloud Functions or firebase-admin runtime required.
 *
 * Coverage:
 *   getWindowStart           — 2 tests
 *   countBookingsByService   — 3 tests
 *   normalizeScores          — 4 tests
 *   computeTenantPopularity  — 3 tests (via mock Firestore)
 *   runPopularityIndexJob    — 2 tests
 */

import { describe, it, expect, vi } from "vitest";
import {
  getWindowStart,
  countBookingsByService,
  normalizeScores,
  computeTenantPopularity,
  runPopularityIndexJob,
  POPULARITY_WINDOW_DAYS,
} from "../popularityIndex";

// ---------------------------------------------------------------------------
// Firestore mock helpers
// ---------------------------------------------------------------------------

type DocData = Record<string, unknown>;

function makeBookingQuery(bookings: DocData[]) {
  const filters: Array<[string, string, unknown]> = [];
  const q: Record<string, unknown> = {};
  q.where = (_f: string, _op: string, _v: unknown) => {
    filters.push([_f, _op, _v]);
    return q;
  };
  q.get = vi.fn(async () => ({
    docs: bookings.map((data) => ({ data: () => data })),
  }));
  return q;
}

interface TenantSetup {
  bookings?: DocData[];
}

function makeFirestoreMock(tenants: Record<string, TenantSetup>) {
  const setMock = vi.fn().mockResolvedValue(undefined);
  const serviceUpdateMock = vi.fn().mockResolvedValue(undefined);

  const db = {
    collection: (name: string) => {
      // Stub: brands/{brandId}/locations/{locId}/service_types/{svcId} — returns no data; .update() is a no-op.
      if (name === "brands") {
        return {
          doc: (_brandId: string) => ({
            collection: (sub: string) => {
              if (sub === "locations") {
                return {
                  doc: (_locId: string) => ({
                    collection: (sub2: string) => {
                      if (sub2 === "service_types") {
                        return {
                          doc: (_svcId: string) => ({
                            get: vi.fn().mockResolvedValue({ exists: false, data: () => undefined }),
                            update: serviceUpdateMock,
                          }),
                        };
                      }
                      return {};
                    },
                  }),
                };
              }
              return {};
            },
          }),
        };
      }
      if (name !== "tenants") return {};
      return {
        get: vi.fn(async () => ({
          docs: Object.keys(tenants).map((id) => ({ id })),
        })),
        doc: (tenantId: string) => ({
          collection: (subName: string) => {
            if (subName === "bookings") {
              return makeBookingQuery((tenants[tenantId]?.bookings ?? []) as DocData[]);
            }
            if (subName === "popularityIndex") {
              return {
                doc: (serviceId: string) => ({
                  set: (data: DocData, opts: unknown) =>
                    setMock(`tenants/${tenantId}/popularityIndex/${serviceId}`, data, opts),
                }),
              };
            }
            return {};
          },
        }),
      };
    },
  } as unknown as FirebaseFirestore.Firestore;

  return { db, setMock, serviceUpdateMock };
}

// ---------------------------------------------------------------------------
// getWindowStart
// ---------------------------------------------------------------------------

describe("getWindowStart", () => {
  it("returns a date 30 days before now by default", () => {
    const now = new Date("2025-08-01T02:00:00Z");
    const start = getWindowStart(now);
    const expected = new Date("2025-07-02T02:00:00Z");
    expect(start.toISOString()).toBe(expected.toISOString());
  });

  it("respects a custom windowDays parameter", () => {
    const now = new Date("2025-08-01T00:00:00Z");
    const start = getWindowStart(now, 7);
    const expected = new Date("2025-07-25T00:00:00Z");
    expect(start.toISOString()).toBe(expected.toISOString());
  });
});

// ---------------------------------------------------------------------------
// countBookingsByService
// ---------------------------------------------------------------------------

describe("countBookingsByService", () => {
  it("counts bookings correctly per serviceId", () => {
    const bookings = [
      { serviceId: "svc-A" },
      { serviceId: "svc-A" },
      { serviceId: "svc-B" },
    ];
    const counts = countBookingsByService(bookings);
    expect(counts["svc-A"]).toBe(2);
    expect(counts["svc-B"]).toBe(1);
  });

  it("ignores bookings without a string serviceId", () => {
    const bookings = [
      { serviceId: 42 },
      { serviceId: null },
      {},
      { serviceId: "svc-C" },
    ];
    const counts = countBookingsByService(bookings);
    expect(Object.keys(counts)).toHaveLength(1);
    expect(counts["svc-C"]).toBe(1);
  });

  it("returns empty object when bookings array is empty", () => {
    expect(countBookingsByService([])).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// normalizeScores
// ---------------------------------------------------------------------------

describe("normalizeScores", () => {
  it("returns scores in [0, 1] with the top service scoring 1.0", () => {
    const scores = normalizeScores({ svcA: 10, svcB: 5, svcC: 2 });
    expect(scores["svcA"]).toBe(1.0);
    expect(scores["svcB"]).toBe(0.5);
    expect(scores["svcC"]).toBeCloseTo(0.2);
  });

  it("returns empty object for empty input", () => {
    expect(normalizeScores({})).toEqual({});
  });

  it("all-zero counts all score 0", () => {
    const scores = normalizeScores({ svcA: 0, svcB: 0 });
    expect(scores["svcA"]).toBe(0);
    expect(scores["svcB"]).toBe(0);
  });

  it("single service scores 1.0", () => {
    const scores = normalizeScores({ svcX: 7 });
    expect(scores["svcX"]).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// computeTenantPopularity
// ---------------------------------------------------------------------------

describe("computeTenantPopularity", () => {
  const windowStart = new Date("2025-07-01T00:00:00Z");

  it("writes popularity docs for each service in the booking data", async () => {
    const bookings = [
      { serviceId: "haircut", status: "completed", createdAt: "2025-07-10T10:00:00Z", locationId: "loc-1" },
      { serviceId: "haircut", status: "completed", createdAt: "2025-07-11T10:00:00Z", locationId: "loc-1" },
      { serviceId: "coloring", status: "completed", createdAt: "2025-07-12T10:00:00Z", locationId: "loc-1" },
    ];
    const { db, setMock } = makeFirestoreMock({ t1: { bookings } });

    await computeTenantPopularity(db, "t1", windowStart);

    expect(setMock).toHaveBeenCalledTimes(2);
    const haircutCall = setMock.mock.calls.find((c) =>
      (c[0] as string).includes("haircut")
    );
    expect(haircutCall).toBeDefined();
    expect(haircutCall![1]).toMatchObject({ serviceId: "haircut", bookedCount: 2, score: 1.0 });
  });

  it("does not write any docs when there are no qualifying bookings", async () => {
    const { db, setMock } = makeFirestoreMock({ t1: { bookings: [] } });
    await computeTenantPopularity(db, "t1", windowStart);
    expect(setMock).not.toHaveBeenCalled();
  });

  it("assigns score 1.0 to the only service when only one exists", async () => {
    const bookings = [
      { serviceId: "massage", status: "completed", createdAt: "2025-07-10T09:00:00Z", locationId: "loc-1" },
    ];
    const { db, setMock } = makeFirestoreMock({ t1: { bookings } });

    await computeTenantPopularity(db, "t1", windowStart);

    expect(setMock).toHaveBeenCalledWith(
      expect.stringContaining("massage"),
      expect.objectContaining({ score: 1.0, bookedCount: 1 }),
      { merge: true },
    );
  });
});

// ---------------------------------------------------------------------------
// runPopularityIndexJob
// ---------------------------------------------------------------------------

describe("runPopularityIndexJob", () => {
  it("returns the list of processed tenant ids", async () => {
    const { db } = makeFirestoreMock({ t1: {}, t2: {} });
    const now = new Date("2025-08-01T02:00:00Z");
    const result = await runPopularityIndexJob(db, now);
    expect(result.processed).toContain("t1");
    expect(result.processed).toContain("t2");
  });

  it("returns empty processed array when there are no tenants", async () => {
    const { db } = makeFirestoreMock({});
    const result = await runPopularityIndexJob(db);
    expect(result.processed).toHaveLength(0);
  });
});
