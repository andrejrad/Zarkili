/**
 * functions/src/trialExpiryScheduler.ts (W14-DEBT-2)
 *
 * Hourly scheduled scan that re-derives trial status for every tenant whose
 * trial is still in flight (active | expiring_soon). When the derived status
 * differs from the persisted one, the trial doc is updated atomically with a
 * trialJobRuns/{runId} marker so the same hour bucket can never double-apply.
 *
 * RunId is the ISO hour bucket (YYYY-MM-DDTHH).
 *
 * Pure handler `runTrialExpiryScan` keeps the I/O composition testable.
 */

import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";

if (getApps().length === 0) {
  initializeApp();
}

const SECONDS_PER_DAY = 86_400;
const EXPIRING_SOON_WINDOW_DAYS = 3;

type LocalTimestamp = { seconds: number; nanoseconds: number };

type TrialDoc = {
  tenantId: string;
  status: "not_started" | "active" | "expiring_soon" | "expired" | "upgraded";
  endsAt: LocalTimestamp | null;
  expiredAt: LocalTimestamp | null;
  lastJobRunId: string | null;
};

export function deriveTrialStatusAt(
  trial: Pick<TrialDoc, "status" | "endsAt">,
  now: LocalTimestamp,
): TrialDoc["status"] {
  if (trial.status === "upgraded") return "upgraded";
  if (trial.status === "not_started") return "not_started";
  if (!trial.endsAt) return trial.status;
  if (trial.endsAt.seconds <= now.seconds) return "expired";
  const remainingDays = (trial.endsAt.seconds - now.seconds) / SECONDS_PER_DAY;
  if (remainingDays <= EXPIRING_SOON_WINDOW_DAYS) return "expiring_soon";
  return "active";
}

export function buildRunId(now: LocalTimestamp): string {
  const d = new Date(now.seconds * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}`;
}

// ---------------------------------------------------------------------------
// Pure handler (DI-friendly)
// ---------------------------------------------------------------------------

export type TrialScanRepo = {
  /** Yields candidate trial docs (status in active | expiring_soon). */
  scanCandidates(): Promise<
    Array<{ ref: TrialRef; data: TrialDoc }>
  >;
  /**
   * Atomically: ensure no trialJobRuns/{runId} doc exists for this tenant,
   * write the new trial fields, and create the run marker. Returns true if
   * the update was applied; false if the run had already executed.
   */
  applyIfFresh(
    ref: TrialRef,
    runId: string,
    update: Partial<TrialDoc>,
    now: LocalTimestamp,
  ): Promise<boolean>;
};

export type TrialRef = { tenantId: string };

export type ScanResult = {
  scanned: number;
  transitioned: number;
  skippedAlreadyRun: number;
  errors: number;
};

export async function runTrialExpiryScan(
  now: LocalTimestamp,
  repo: TrialScanRepo,
): Promise<ScanResult> {
  const runId = buildRunId(now);
  const candidates = await repo.scanCandidates();
  let transitioned = 0;
  let skippedAlreadyRun = 0;
  let errors = 0;

  for (const { ref, data } of candidates) {
    try {
      const next = deriveTrialStatusAt(data, now);
      if (next === data.status) continue;

      const update: Partial<TrialDoc> = {
        status: next,
        lastJobRunId: runId,
        ...(next === "expired" ? { expiredAt: now } : {}),
      };
      const applied = await repo.applyIfFresh(ref, runId, update, now);
      if (applied) transitioned += 1;
      else skippedAlreadyRun += 1;
    } catch (err) {
      errors += 1;
      logger.error("trialExpiryScheduler: tenant scan failed", {
        tenantId: ref.tenantId,
        err,
      });
    }
  }

  return {
    scanned: candidates.length,
    transitioned,
    skippedAlreadyRun,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Admin-SDK adapter
// ---------------------------------------------------------------------------

export function createAdminTrialScanRepo(
  db: FirebaseFirestore.Firestore,
): TrialScanRepo {
  return {
    async scanCandidates() {
      const snap = await db
        .collectionGroup("trial")
        .where("status", "in", ["active", "expiring_soon"])
        .get();
      return snap.docs
        .filter((d) => d.id === "state")
        .map((d) => {
          const data = d.data() as TrialDoc;
          return { ref: { tenantId: data.tenantId }, data };
        });
    },
    async applyIfFresh(ref, runId, update, _now) {
      const trialDoc = db.doc(`tenants/${ref.tenantId}/trial/state`);
      const runDoc = db.doc(`tenants/${ref.tenantId}/trialJobRuns/${runId}`);
      return db.runTransaction(async (tx) => {
        const existing = await tx.get(runDoc);
        if (existing.exists) return false;
        tx.set(
          trialDoc,
          { ...update, updatedAt: FieldValue.serverTimestamp() },
          { merge: true },
        );
        tx.set(runDoc, { runId, appliedAt: FieldValue.serverTimestamp() });
        return true;
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Cloud Function entrypoint
// ---------------------------------------------------------------------------

export const trialExpiryHourly = onSchedule(
  { schedule: "0 * * * *", timeZone: "UTC", region: "us-central1" },
  async () => {
    const db = getFirestore();
    const result = await runTrialExpiryScan(
      { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
      createAdminTrialScanRepo(db),
    );
    logger.info("trialExpiryHourly completed", result);
  },
);
