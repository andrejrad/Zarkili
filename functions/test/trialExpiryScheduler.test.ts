/**
 * trialExpiryScheduler.test.ts (W14-DEBT-2)
 */

import { describe, it, expect } from "vitest";

import {
  buildRunId,
  deriveTrialStatusAt,
  runTrialExpiryScan,
  type TrialScanRepo,
} from "../src/trialExpiryScheduler";

const NOW = { seconds: 1700000000, nanoseconds: 0 }; // 2023-11-14T22:13:20Z

describe("buildRunId", () => {
  it("formats UTC hour bucket", () => {
    expect(buildRunId(NOW)).toBe("2023-11-14T22");
  });

  it("buckets by hour (different minutes → same id)", () => {
    const a = { seconds: NOW.seconds, nanoseconds: 0 };
    const b = { seconds: NOW.seconds + 60 * 30, nanoseconds: 0 };
    expect(buildRunId(a)).toBe(buildRunId(b));
  });
});

describe("deriveTrialStatusAt", () => {
  it("returns expired when endsAt is in the past", () => {
    expect(
      deriveTrialStatusAt(
        { status: "active", endsAt: { seconds: NOW.seconds - 100, nanoseconds: 0 } },
        NOW,
      ),
    ).toBe("expired");
  });

  it("returns expiring_soon when within 3 days", () => {
    expect(
      deriveTrialStatusAt(
        {
          status: "active",
          endsAt: { seconds: NOW.seconds + 86400, nanoseconds: 0 },
        },
        NOW,
      ),
    ).toBe("expiring_soon");
  });

  it("returns active when more than 3 days remain", () => {
    expect(
      deriveTrialStatusAt(
        {
          status: "active",
          endsAt: { seconds: NOW.seconds + 86400 * 10, nanoseconds: 0 },
        },
        NOW,
      ),
    ).toBe("active");
  });

  it("never resurrects upgraded", () => {
    expect(
      deriveTrialStatusAt(
        { status: "upgraded", endsAt: null },
        NOW,
      ),
    ).toBe("upgraded");
  });
});

// ---------------------------------------------------------------------------
// runTrialExpiryScan
// ---------------------------------------------------------------------------

function makeStubRepo(initial: Array<{ tenantId: string; status: any; endsAt: { seconds: number; nanoseconds: number } | null }>): {
  repo: TrialScanRepo;
  applied: Array<{ tenantId: string; runId: string; update: any }>;
  duplicates: Set<string>;
} {
  const applied: Array<{ tenantId: string; runId: string; update: any }> = [];
  const duplicates = new Set<string>();
  return {
    applied,
    duplicates,
    repo: {
      async scanCandidates() {
        return initial.map((t) => ({
          ref: { tenantId: t.tenantId },
          data: {
            tenantId: t.tenantId,
            status: t.status,
            endsAt: t.endsAt,
            expiredAt: null,
            lastJobRunId: null,
          },
        }));
      },
      async applyIfFresh(ref, runId, update) {
        const k = `${ref.tenantId}:${runId}`;
        if (duplicates.has(k)) return false;
        duplicates.add(k);
        applied.push({ tenantId: ref.tenantId, runId, update });
        return true;
      },
    },
  };
}

describe("runTrialExpiryScan", () => {
  it("transitions active → expired when endsAt is past", async () => {
    const { repo, applied } = makeStubRepo([
      {
        tenantId: "t1",
        status: "active",
        endsAt: { seconds: NOW.seconds - 100, nanoseconds: 0 },
      },
    ]);
    const result = await runTrialExpiryScan(NOW, repo);
    expect(result).toEqual({
      scanned: 1,
      transitioned: 1,
      skippedAlreadyRun: 0,
      errors: 0,
    });
    expect(applied[0]?.update).toMatchObject({
      status: "expired",
      expiredAt: NOW,
      lastJobRunId: "2023-11-14T22",
    });
  });

  it("transitions active → expiring_soon", async () => {
    const { repo, applied } = makeStubRepo([
      {
        tenantId: "t1",
        status: "active",
        endsAt: { seconds: NOW.seconds + 86400 * 2, nanoseconds: 0 },
      },
    ]);
    await runTrialExpiryScan(NOW, repo);
    expect(applied[0]?.update.status).toBe("expiring_soon");
    expect(applied[0]?.update.expiredAt).toBeUndefined();
  });

  it("skips when status already matches derived", async () => {
    const { repo, applied } = makeStubRepo([
      {
        tenantId: "t1",
        status: "active",
        endsAt: { seconds: NOW.seconds + 86400 * 10, nanoseconds: 0 },
      },
    ]);
    const result = await runTrialExpiryScan(NOW, repo);
    expect(result.transitioned).toBe(0);
    expect(applied).toHaveLength(0);
  });

  it("counts skippedAlreadyRun when applyIfFresh returns false", async () => {
    const { repo, duplicates } = makeStubRepo([
      {
        tenantId: "t1",
        status: "active",
        endsAt: { seconds: NOW.seconds - 100, nanoseconds: 0 },
      },
    ]);
    duplicates.add("t1:2023-11-14T22");
    const result = await runTrialExpiryScan(NOW, repo);
    expect(result).toEqual({
      scanned: 1,
      transitioned: 0,
      skippedAlreadyRun: 1,
      errors: 0,
    });
  });

  it("records errors per tenant without aborting the run", async () => {
    const repo: TrialScanRepo = {
      async scanCandidates() {
        return [
          {
            ref: { tenantId: "t_bad" },
            data: {
              tenantId: "t_bad",
              status: "active",
              endsAt: { seconds: NOW.seconds - 100, nanoseconds: 0 },
              expiredAt: null,
              lastJobRunId: null,
            },
          },
          {
            ref: { tenantId: "t_ok" },
            data: {
              tenantId: "t_ok",
              status: "active",
              endsAt: { seconds: NOW.seconds - 100, nanoseconds: 0 },
              expiredAt: null,
              lastJobRunId: null,
            },
          },
        ];
      },
      async applyIfFresh(ref) {
        if (ref.tenantId === "t_bad") throw new Error("boom");
        return true;
      },
    };
    const result = await runTrialExpiryScan(NOW, repo);
    expect(result.errors).toBe(1);
    expect(result.transitioned).toBe(1);
  });
});
