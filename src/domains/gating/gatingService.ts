/**
 * Gating service — combines billing + trial state, computes a decision per
 * feature, and records denial audit events.
 *
 * Public surface:
 *   - check(feature, opts)            — single-feature decision
 *   - checkAll(opts)                  — decisions for every FeatureGroup
 *   - assertAllowed(feature, opts)    — throws GateDeniedError on deny
 *
 * The middleware is intentionally unaware of how Subscription/Trial are
 * loaded — callers inject the data so we can reuse the same logic in
 * Cloud Functions, the admin shell, and tests.
 */

import type { Timestamp } from "firebase/firestore";

import type { Subscription } from "../billing/model";
import type { Trial } from "../trial/model";

import {
  buildDenialAudit,
  decideGate,
  FEATURE_GROUPS,
  type FeatureGroup,
  type GateDecision,
} from "./model";
import type { GatingAuditRepository } from "./repository";

export type GateCheckInput = {
  tenantId: string;
  userId: string | null;
  subscription: Subscription | null;
  trial: Trial | null;
};

export type GatingService = {
  check(feature: FeatureGroup, input: GateCheckInput): Promise<GateDecision>;
  checkAll(input: GateCheckInput): Promise<readonly GateDecision[]>;
  assertAllowed(feature: FeatureGroup, input: GateCheckInput): Promise<GateDecision>;
};

export class GateDeniedError extends Error {
  constructor(public readonly decision: GateDecision) {
    super(`Feature ${decision.feature} denied: ${decision.reason}`);
    this.name = "GateDeniedError";
  }
}

export function createGatingService(
  audit: GatingAuditRepository,
  options?: { now?: () => Timestamp; auditWarnings?: boolean },
): GatingService {
  const now = options?.now ?? defaultNow;
  const auditWarnings = options?.auditWarnings ?? false;

  async function record(input: GateCheckInput, decision: GateDecision, ts: Timestamp): Promise<void> {
    if (decision.outcome === "allow") return;
    if (decision.outcome === "allow_with_warning" && !auditWarnings) return;
    const ev = buildDenialAudit(input.tenantId, input.userId, decision, ts);
    if (!ev) return;
    await audit.recordDenial(ev);
  }

  async function check(feature: FeatureGroup, input: GateCheckInput): Promise<GateDecision> {
    const ts = now();
    const decision = decideGate(feature, {
      subscription: input.subscription,
      trial: input.trial,
      now: ts,
    });
    await record(input, decision, ts);
    return decision;
  }

  async function checkAll(input: GateCheckInput): Promise<readonly GateDecision[]> {
    const ts = now();
    const decisions = FEATURE_GROUPS.map((feature) =>
      decideGate(feature, { subscription: input.subscription, trial: input.trial, now: ts }),
    );
    for (const d of decisions) {
      await record(input, d, ts);
    }
    return decisions;
  }

  async function assertAllowed(feature: FeatureGroup, input: GateCheckInput): Promise<GateDecision> {
    const decision = await check(feature, input);
    if (decision.outcome === "deny") {
      throw new GateDeniedError(decision);
    }
    return decision;
  }

  return { check, checkAll, assertAllowed };
}

function defaultNow(): Timestamp {
  const seconds = Math.floor(Date.now() / 1000);
  return { seconds, nanoseconds: 0 } as unknown as Timestamp;
}
