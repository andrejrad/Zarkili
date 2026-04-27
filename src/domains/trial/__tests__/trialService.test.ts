import type { Timestamp } from "firebase/firestore";

import {
  addDays,
  canActivate,
  DEFAULT_TRIAL_DAYS,
  deriveTrialStatusAt,
  EXPIRING_SOON_WINDOW_DAYS,
  isValidTrialTransition,
  TrialError,
  type Trial,
} from "../model";
import type { TrialRepository } from "../repository";
import {
  applyTick,
  applyUpgrade,
  buildInitialTrial,
  createTrialService,
} from "../trialService";
import { applyExtension } from "../trialService";
import { createTrialExtender } from "../trialExtender";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ts(seconds: number): Timestamp {
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}

const DAY = 86_400;

function makeRepoMock() {
  const trials = new Map<string, Trial>();
  const runs = new Set<string>();
  const repo: TrialRepository = {
    async getTrial(tenantId: string) {
      return trials.get(tenantId) ?? null;
    },
    async saveTrial(trial: Trial) {
      trials.set(trial.tenantId, { ...trial });
    },
    async saveTrialWithJobRun(trial: Trial, runId: string) {
      trials.set(trial.tenantId, { ...trial });
      runs.add(`${trial.tenantId}/${runId}`);
    },
    async hasJobRun(tenantId: string, runId: string) {
      return runs.has(`${tenantId}/${runId}`);
    },
    async recordJobRun(tenantId: string, runId: string) {
      runs.add(`${tenantId}/${runId}`);
    },
  };
  return { repo, trials, runs };
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

describe("canActivate", () => {
  it("requires both onboardingComplete and launchActivated", () => {
    expect(canActivate({ onboardingComplete: true, launchActivated: true })).toBe(true);
    expect(canActivate({ onboardingComplete: true, launchActivated: false })).toBe(false);
    expect(canActivate({ onboardingComplete: false, launchActivated: true })).toBe(false);
  });
});

describe("isValidTrialTransition", () => {
  it.each([
    ["not_started", "active"],
    ["active", "expiring_soon"],
    ["active", "expired"],
    ["active", "upgraded"],
    ["expiring_soon", "expired"],
    ["expiring_soon", "upgraded"],
    ["expired", "upgraded"],
    ["upgraded", "upgraded"],
  ] as const)("allows %s → %s", (from, to) => {
    expect(isValidTrialTransition(from, to)).toBe(true);
  });

  it.each([
    ["expired", "active"],
    ["upgraded", "expired"],
    ["upgraded", "active"],
    ["expiring_soon", "active"],
    ["expiring_soon", "not_started"],
  ] as const)("forbids %s → %s", (from, to) => {
    expect(isValidTrialTransition(from, to)).toBe(false);
  });
});

describe("addDays / deriveTrialStatusAt", () => {
  it("addDays adds whole days at second resolution", () => {
    expect(addDays(ts(1_000), 3).seconds).toBe(1_000 + 3 * DAY);
  });

  it("derives active when more than 3 days remain", () => {
    const trial = buildInitialTrial({ tenantId: "t", now: ts(0), trialLengthDays: 14 });
    const activated: Trial = { ...trial, status: "active", startedAt: ts(0), endsAt: ts(14 * DAY) };
    expect(deriveTrialStatusAt(activated, ts(10 * DAY))).toBe("active");
  });

  it("derives expiring_soon at exactly 3 days remaining", () => {
    const trial = buildInitialTrial({ tenantId: "t", now: ts(0), trialLengthDays: 14 });
    const activated: Trial = { ...trial, status: "active", startedAt: ts(0), endsAt: ts(14 * DAY) };
    expect(deriveTrialStatusAt(activated, ts(11 * DAY))).toBe("expiring_soon");
  });

  it("derives expired when endsAt has passed", () => {
    const trial = buildInitialTrial({ tenantId: "t", now: ts(0), trialLengthDays: 14 });
    const activated: Trial = { ...trial, status: "active", startedAt: ts(0), endsAt: ts(14 * DAY) };
    expect(deriveTrialStatusAt(activated, ts(14 * DAY + 1))).toBe("expired");
  });

  it("preserves upgraded regardless of time", () => {
    const trial = buildInitialTrial({ tenantId: "t", now: ts(0), trialLengthDays: 14 });
    const upgraded: Trial = { ...trial, status: "upgraded", upgradedAt: ts(2 * DAY) };
    expect(deriveTrialStatusAt(upgraded, ts(99 * DAY))).toBe("upgraded");
  });
});

describe("buildInitialTrial", () => {
  it("uses default 14 days when length omitted", () => {
    const t = buildInitialTrial({ tenantId: "t1", now: ts(100) });
    expect(t.trialLengthDays).toBe(DEFAULT_TRIAL_DAYS);
    expect(t.status).toBe("not_started");
    expect(t.endsAt).toBeNull();
  });

  it("rejects non-positive lengths", () => {
    expect(() => buildInitialTrial({ tenantId: "t1", now: ts(0), trialLengthDays: 0 })).toThrow(TrialError);
    expect(() => buildInitialTrial({ tenantId: "t1", now: ts(0), trialLengthDays: -3 })).toThrow(TrialError);
    expect(() => buildInitialTrial({ tenantId: "t1", now: ts(0), trialLengthDays: 1.5 })).toThrow(TrialError);
  });

  it("EXPIRING_SOON_WINDOW_DAYS is the documented constant", () => {
    expect(EXPIRING_SOON_WINDOW_DAYS).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// applyTick
// ---------------------------------------------------------------------------

describe("applyTick", () => {
  function activated(endsAtSeconds: number): Trial {
    return {
      tenantId: "t",
      status: "active",
      trialLengthDays: 14,
      startedAt: ts(0),
      endsAt: ts(endsAtSeconds),
      expiredAt: null,
      upgradedAt: null,
      upgradeSubscriptionId: null,
      lastJobRunId: null,
      createdAt: ts(0),
      updatedAt: ts(0),
    };
  }

  it("flips active → expiring_soon when 3 days remain", () => {
    const trial = activated(14 * DAY);
    const { next, changed } = applyTick(trial, ts(11 * DAY), "run1");
    expect(changed).toBe(true);
    expect(next.status).toBe("expiring_soon");
    expect(next.lastJobRunId).toBe("run1");
  });

  it("flips active → expired when endsAt passed (skips expiring_soon if already past)", () => {
    const trial = activated(14 * DAY);
    const { next, changed } = applyTick(trial, ts(14 * DAY + 1), "run2");
    expect(changed).toBe(true);
    expect(next.status).toBe("expired");
    expect(next.expiredAt?.seconds).toBe(14 * DAY + 1);
  });

  it("returns no-op when already in correct status", () => {
    const trial = activated(14 * DAY);
    const { next, changed } = applyTick(trial, ts(5 * DAY), "run3");
    expect(changed).toBe(false);
    expect(next.status).toBe("active");
  });

  it("returns no-op for upgraded/expired/not_started terminal-ish states", () => {
    const tr1 = { ...activated(14 * DAY), status: "upgraded" as const };
    expect(applyTick(tr1, ts(99 * DAY), "r").changed).toBe(false);
    const tr2 = { ...activated(14 * DAY), status: "expired" as const };
    expect(applyTick(tr2, ts(99 * DAY), "r").changed).toBe(false);
    const tr3 = { ...activated(14 * DAY), status: "not_started" as const };
    expect(applyTick(tr3, ts(99 * DAY), "r").changed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyUpgrade
// ---------------------------------------------------------------------------

describe("applyUpgrade", () => {
  function trialIn(status: Trial["status"]): Trial {
    return {
      tenantId: "t",
      status,
      trialLengthDays: 14,
      startedAt: ts(0),
      endsAt: ts(14 * DAY),
      expiredAt: status === "expired" ? ts(14 * DAY + 1) : null,
      upgradedAt: null,
      upgradeSubscriptionId: null,
      lastJobRunId: null,
      createdAt: ts(0),
      updatedAt: ts(0),
    };
  }

  it("upgrades active → upgraded with subscription id", () => {
    const next = applyUpgrade(trialIn("active"), ts(5 * DAY), "sub_1");
    expect(next.status).toBe("upgraded");
    expect(next.upgradeSubscriptionId).toBe("sub_1");
    expect(next.upgradedAt?.seconds).toBe(5 * DAY);
  });

  it("upgrades expiring_soon → upgraded", () => {
    expect(applyUpgrade(trialIn("expiring_soon"), ts(13 * DAY), "sub_2").status).toBe("upgraded");
  });

  it("upgrades expired → upgraded (recoverable)", () => {
    expect(applyUpgrade(trialIn("expired"), ts(15 * DAY), "sub_3").status).toBe("upgraded");
  });

  it("rejects upgrade on not_started (must activate first)", () => {
    expect(() => applyUpgrade(trialIn("not_started"), ts(0), "sub_x")).toThrow(TrialError);
  });
});

// ---------------------------------------------------------------------------
// Service — activateTrial
// ---------------------------------------------------------------------------

describe("TrialService.activateTrial", () => {
  it("creates and activates a new trial when activation context is satisfied", async () => {
    const { repo, trials } = makeRepoMock();
    const svc = createTrialService(repo, { now: () => ts(1_000) });
    const trial = await svc.activateTrial("tenant_a", { onboardingComplete: true, launchActivated: true });
    expect(trial.status).toBe("active");
    expect(trial.startedAt?.seconds).toBe(1_000);
    expect(trial.endsAt?.seconds).toBe(1_000 + 14 * DAY);
    expect(trials.get("tenant_a")?.status).toBe("active");
  });

  it("rejects activation when context is not satisfied", async () => {
    const { repo } = makeRepoMock();
    const svc = createTrialService(repo, { now: () => ts(1_000) });
    await expect(
      svc.activateTrial("tenant_a", { onboardingComplete: false, launchActivated: true }),
    ).rejects.toThrow(TrialError);
  });

  it("respects custom trial length", async () => {
    const { repo } = makeRepoMock();
    const svc = createTrialService(repo, { now: () => ts(1_000) });
    const trial = await svc.activateTrial(
      "tenant_a",
      { onboardingComplete: true, launchActivated: true },
      { trialLengthDays: 30 },
    );
    expect(trial.trialLengthDays).toBe(30);
    expect(trial.endsAt?.seconds).toBe(1_000 + 30 * DAY);
  });

  it("rejects re-activation when trial is already active", async () => {
    const { repo } = makeRepoMock();
    const svc = createTrialService(repo, { now: () => ts(1_000) });
    await svc.activateTrial("tenant_a", { onboardingComplete: true, launchActivated: true });
    await expect(
      svc.activateTrial("tenant_a", { onboardingComplete: true, launchActivated: true }),
    ).rejects.toThrow(/already in status/);
  });
});

// ---------------------------------------------------------------------------
// Service — tickExpiry idempotency + state transitions
// ---------------------------------------------------------------------------

describe("TrialService.tickExpiry", () => {
  async function setup() {
    const { repo, runs } = makeRepoMock();
    let now: Timestamp = ts(1_000);
    const svc = createTrialService(repo, { now: () => now });
    await svc.activateTrial("tenant_a", { onboardingComplete: true, launchActivated: true });
    return {
      svc,
      runs,
      setNow: (t: Timestamp) => {
        now = t;
      },
      get now() {
        return now;
      },
    };
  }

  it("flips to expiring_soon when ≤3 days remain and records run id", async () => {
    const env = await setup();
    env.setNow(ts(1_000 + 11 * DAY));
    const result = await env.svc.tickExpiry("tenant_a", "2026-04-26T00");
    expect(result.outcome).toBe("applied");
    expect(result.fromStatus).toBe("active");
    expect(result.toStatus).toBe("expiring_soon");
    expect(env.runs.has("tenant_a/2026-04-26T00")).toBe(true);
  });

  it("flips to expired after endsAt has passed", async () => {
    const env = await setup();
    env.setNow(ts(1_000 + 14 * DAY + 60));
    const result = await env.svc.tickExpiry("tenant_a", "2026-05-10T00");
    expect(result.toStatus).toBe("expired");
    expect(result.trial.expiredAt?.seconds).toBe(env.now.seconds);
  });

  it("returns duplicate on the same runId without re-applying", async () => {
    const env = await setup();
    env.setNow(ts(1_000 + 14 * DAY + 60));
    await env.svc.tickExpiry("tenant_a", "2026-05-10T00");
    const second = await env.svc.tickExpiry("tenant_a", "2026-05-10T00");
    expect(second.outcome).toBe("duplicate");
    expect(second.toStatus).toBe("expired");
  });

  it("returns noop when nothing changes (still records the run)", async () => {
    const env = await setup();
    env.setNow(ts(1_000 + 1 * DAY));
    const result = await env.svc.tickExpiry("tenant_a", "2026-04-16T00");
    expect(result.outcome).toBe("noop");
    expect(env.runs.has("tenant_a/2026-04-16T00")).toBe(true);
  });

  it("throws when no trial exists for tenant", async () => {
    const { repo } = makeRepoMock();
    const svc = createTrialService(repo, { now: () => ts(0) });
    await expect(svc.tickExpiry("missing", "r1")).rejects.toThrow(/No trial exists/);
  });
});

// ---------------------------------------------------------------------------
// Service — upgrade
// ---------------------------------------------------------------------------

describe("TrialService.upgradeTrial", () => {
  it("upgrades an active trial to upgraded and stamps subscription id", async () => {
    const { repo, trials } = makeRepoMock();
    let now: Timestamp = ts(1_000);
    const svc = createTrialService(repo, { now: () => now });
    await svc.activateTrial("tenant_a", { onboardingComplete: true, launchActivated: true });
    now = ts(1_000 + 5 * DAY);
    const next = await svc.upgradeTrial("tenant_a", "sub_paid_1");
    expect(next.status).toBe("upgraded");
    expect(next.upgradeSubscriptionId).toBe("sub_paid_1");
    expect(trials.get("tenant_a")?.status).toBe("upgraded");
  });

  it("rejects upgrade when trial does not exist", async () => {
    const { repo } = makeRepoMock();
    const svc = createTrialService(repo, { now: () => ts(0) });
    await expect(svc.upgradeTrial("none", "sub_x")).rejects.toThrow(/No trial exists/);
  });
});

// ---------------------------------------------------------------------------
// applyExtension (W15-DEBT-2)
// ---------------------------------------------------------------------------

describe("applyExtension", () => {
  function active(endsAtSeconds: number, status: Trial["status"] = "active"): Trial {
    return {
      tenantId: "t",
      status,
      trialLengthDays: 14,
      startedAt: ts(0),
      endsAt: ts(endsAtSeconds),
      expiredAt: status === "expired" ? ts(endsAtSeconds) : null,
      upgradedAt: null,
      upgradeSubscriptionId: null,
      lastJobRunId: null,
      createdAt: ts(0),
      updatedAt: ts(0),
    };
  }

  it("pushes endsAt forward by daysAdded for an active trial", () => {
    const trial = active(14 * DAY);
    const next = applyExtension(trial, 7, ts(7 * DAY));
    expect(next.endsAt?.seconds).toBe(14 * DAY + 7 * DAY);
    expect(next.status).toBe("active");
  });

  it("flips expiring_soon back to active when extension lands far in the future", () => {
    // endsAt is 2 days away → expiring_soon. Extend by 14 → 16 days away → active.
    const trial = active(2 * DAY, "expiring_soon");
    const next = applyExtension(trial, 14, ts(0));
    expect(next.status).toBe("active");
    expect(next.endsAt?.seconds).toBe(2 * DAY + 14 * DAY);
  });

  it("recovers an expired trial back to active and clears expiredAt", () => {
    const trial = active(-1 * DAY, "expired");
    const next = applyExtension(trial, 7, ts(0));
    expect(next.status).toBe("active");
    expect(next.expiredAt).toBeNull();
    // Anchored to now (since endsAt was in the past), so endsAt = now + 7d
    expect(next.endsAt?.seconds).toBe(7 * DAY);
  });

  it("rejects non-positive or non-integer daysAdded", () => {
    const trial = active(14 * DAY);
    expect(() => applyExtension(trial, 0, ts(0))).toThrow(TrialError);
    expect(() => applyExtension(trial, -3, ts(0))).toThrow(TrialError);
    expect(() => applyExtension(trial, 1.5, ts(0))).toThrow(TrialError);
  });

  it("rejects extending a not_started trial", () => {
    const trial: Trial = { ...active(0), status: "not_started", endsAt: null, startedAt: null };
    expect(() => applyExtension(trial, 7, ts(0))).toThrow(TrialError);
  });

  it("rejects extending an upgraded trial", () => {
    const trial: Trial = { ...active(14 * DAY), status: "upgraded" };
    expect(() => applyExtension(trial, 7, ts(0))).toThrow(TrialError);
  });
});

// ---------------------------------------------------------------------------
// Service — extendTrial
// ---------------------------------------------------------------------------

describe("TrialService.extendTrial", () => {
  it("persists the extended trial and returns it", async () => {
    const { repo, trials } = makeRepoMock();
    let now: Timestamp = ts(1_000);
    const svc = createTrialService(repo, { now: () => now });
    await svc.activateTrial("tenant_a", { onboardingComplete: true, launchActivated: true });
    now = ts(1_000 + 10 * DAY);
    const before = trials.get("tenant_a")!;
    const next = await svc.extendTrial("tenant_a", 7);
    expect(next.endsAt!.seconds).toBe(before.endsAt!.seconds + 7 * DAY);
    expect(trials.get("tenant_a")?.endsAt?.seconds).toBe(before.endsAt!.seconds + 7 * DAY);
  });

  it("rejects extension for an unknown tenant", async () => {
    const { repo } = makeRepoMock();
    const svc = createTrialService(repo, { now: () => ts(0) });
    await expect(svc.extendTrial("none", 7)).rejects.toThrow(/No trial exists/);
  });
});

// ---------------------------------------------------------------------------
// createTrialExtender adapter
// ---------------------------------------------------------------------------

describe("createTrialExtender", () => {
  it("delegates to TrialService.extendTrial and resolves to void", async () => {
    const calls: Array<[string, number]> = [];
    const fakeService: Pick<ReturnType<typeof createTrialService>, "extendTrial"> = {
      async extendTrial(tenantId: string, daysAdded: number) {
        calls.push([tenantId, daysAdded]);
        return {} as Trial;
      },
    };
    const extender = createTrialExtender(fakeService as ReturnType<typeof createTrialService>);
    const result = await extender("tenant_x", 14);
    expect(result).toBeUndefined();
    expect(calls).toEqual([["tenant_x", 14]]);
  });
});
