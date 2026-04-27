/**
 * purgeSlotTokens.test.ts (KI-002)
 *
 * Pure-handler tests for `runSlotTokenPurge` and the `computeCutoffDate`
 * helper. Firestore is stubbed with a small in-memory shim that supports
 * `collection().where("date","<", x).get()` plus batched deletes.
 */

import { describe, it, expect, beforeEach } from "vitest";

import { computeCutoffDate, runSlotTokenPurge } from "../src/purgeSlotTokens";

// ---------------------------------------------------------------------------
// In-memory Firestore stub
// ---------------------------------------------------------------------------

type DocShape = { id: string; data: { date: string } & Record<string, unknown> };

function makeFirestoreStub(initialDocs: DocShape[]) {
  let store = new Map<string, DocShape>(initialDocs.map((d) => [d.id, d]));

  const collectionApi = (_name: string) => ({
    where: (field: string, op: string, value: unknown) => ({
      get: async () => {
        if (field !== "date" || op !== "<") {
          throw new Error(`Unsupported query: ${field} ${op}`);
        }
        const matches = Array.from(store.values()).filter(
          (d) => d.data.date < (value as string),
        );
        return {
          empty: matches.length === 0,
          size: matches.length,
          docs: matches.map((m) => ({
            id: m.id,
            ref: { id: m.id },
            data: () => m.data,
          })),
        };
      },
    }),
  });

  function batch() {
    const ops: Array<{ ref: { id: string } }> = [];
    return {
      delete: (ref: { id: string }) => {
        ops.push({ ref });
      },
      commit: async () => {
        for (const op of ops) {
          store.delete(op.ref.id);
        }
      },
    };
  }

  return {
    db: {
      collection: collectionApi,
      batch,
    } as never,
    snapshot: () => Array.from(store.keys()),
    resetTo: (docs: DocShape[]) => {
      store = new Map(docs.map((d) => [d.id, d]));
    },
  };
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const NOW = new Date("2026-03-15T08:00:00.000Z");
// With GRACE_DAYS = 1, cutoff = "2026-03-14"; tokens with date < "2026-03-14" are purged.

function tk(id: string, date: string): DocShape {
  return {
    id,
    data: { tenantId: "t1", staffId: "s1", date, startMinutes: 600, bookingId: `bk-${id}` },
  };
}

// ---------------------------------------------------------------------------
// computeCutoffDate
// ---------------------------------------------------------------------------

describe("computeCutoffDate", () => {
  it("returns yesterday (UTC) by default", () => {
    expect(computeCutoffDate(NOW)).toBe("2026-03-14");
  });

  it("respects custom graceDays", () => {
    expect(computeCutoffDate(NOW, 7)).toBe("2026-03-08");
  });

  it("handles month boundary", () => {
    expect(computeCutoffDate(new Date("2026-04-01T00:30:00.000Z"))).toBe("2026-03-31");
  });

  it("handles year boundary", () => {
    expect(computeCutoffDate(new Date("2026-01-01T05:00:00.000Z"))).toBe("2025-12-31");
  });
});

// ---------------------------------------------------------------------------
// runSlotTokenPurge
// ---------------------------------------------------------------------------

describe("runSlotTokenPurge", () => {
  let fs: ReturnType<typeof makeFirestoreStub>;

  beforeEach(() => {
    fs = makeFirestoreStub([]);
  });

  it("returns scanned=0, deleted=0 when collection is empty", async () => {
    const r = await runSlotTokenPurge(NOW, fs.db);
    expect(r.scanned).toBe(0);
    expect(r.deleted).toBe(0);
    expect(r.cutoff).toBe("2026-03-14");
  });

  it("deletes only tokens with date < cutoff", async () => {
    fs.resetTo([
      tk("old-1", "2026-03-10"),
      tk("old-2", "2026-03-13"),
      tk("boundary", "2026-03-14"),  // not strictly less — kept
      tk("future", "2026-03-20"),
    ]);
    const r = await runSlotTokenPurge(NOW, fs.db);
    expect(r.scanned).toBe(2);
    expect(r.deleted).toBe(2);
    expect(fs.snapshot().sort()).toEqual(["boundary", "future"]);
  });

  it("never deletes tokens for today or later", async () => {
    fs.resetTo([
      tk("today", "2026-03-15"),
      tk("tomorrow", "2026-03-16"),
    ]);
    const r = await runSlotTokenPurge(NOW, fs.db);
    expect(r.deleted).toBe(0);
    expect(fs.snapshot()).toHaveLength(2);
  });

  it("commits in batches over the 400-doc threshold", async () => {
    const many = Array.from({ length: 950 }, (_, i) =>
      tk(`old-${i}`, "2026-03-01"),
    );
    fs.resetTo(many);
    const r = await runSlotTokenPurge(NOW, fs.db);
    expect(r.scanned).toBe(950);
    expect(r.deleted).toBe(950);
    expect(fs.snapshot()).toHaveLength(0);
  });

  it("reports the computed cutoff in the result", async () => {
    const r = await runSlotTokenPurge(new Date("2026-06-15T12:00:00Z"), fs.db);
    expect(r.cutoff).toBe("2026-06-14");
  });
});
