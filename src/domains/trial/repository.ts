/**
 * Trial repository
 *
 * Collection layout:
 *   tenants/{tenantId}/trial/state               — singleton Trial record
 *   tenants/{tenantId}/trialJobRuns/{runId}      — idempotency markers for the
 *                                                  expiry job (one doc per
 *                                                  (tenant, runId) pair)
 *
 * `runId` is provided by the caller (typically a UTC date bucket like
 * "2026-04-26T00") so a job that retries within the same bucket is a no-op.
 */

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import type { Trial } from "./model";

const trialCol = (tenantId: string) => `tenants/${tenantId}/trial`;
const jobRunsCol = (tenantId: string) => `tenants/${tenantId}/trialJobRuns`;
const TRIAL_DOC = "state";

export type TrialJobRunRecord = {
  runId: string;
  appliedAt: unknown;
};

export type TrialRepository = {
  getTrial(tenantId: string): Promise<Trial | null>;
  saveTrial(trial: Trial): Promise<void>;
  /**
   * Atomically save the trial and a job-run idempotency marker.
   * Used by the expiry job so the state change and the run marker
   * cannot diverge under retry.
   */
  saveTrialWithJobRun(trial: Trial, runId: string): Promise<void>;
  hasJobRun(tenantId: string, runId: string): Promise<boolean>;
  recordJobRun(tenantId: string, runId: string): Promise<void>;
};

export function createTrialRepository(db: Firestore): TrialRepository {
  async function getTrial(tenantId: string): Promise<Trial | null> {
    const ref = doc(db, trialCol(tenantId), TRIAL_DOC);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as Trial;
  }

  async function saveTrial(trial: Trial): Promise<void> {
    const ref = doc(db, trialCol(trial.tenantId), TRIAL_DOC);
    await setDoc(ref, { ...trial, updatedAt: serverTimestamp() });
  }

  async function saveTrialWithJobRun(trial: Trial, runId: string): Promise<void> {
    const trialRef = doc(db, trialCol(trial.tenantId), TRIAL_DOC);
    const runRef = doc(db, jobRunsCol(trial.tenantId), runId);
    const now = serverTimestamp();
    const batch = writeBatch(db);
    batch.set(trialRef, { ...trial, updatedAt: now });
    batch.set(runRef, { runId, appliedAt: now });
    await batch.commit();
  }

  async function hasJobRun(tenantId: string, runId: string): Promise<boolean> {
    const ref = doc(db, jobRunsCol(tenantId), runId);
    const snap = await getDoc(ref);
    return snap.exists();
  }

  async function recordJobRun(tenantId: string, runId: string): Promise<void> {
    const ref = doc(db, jobRunsCol(tenantId), runId);
    await setDoc(ref, { runId, appliedAt: serverTimestamp() });
  }

  return { getTrial, saveTrial, saveTrialWithJobRun, hasJobRun, recordJobRun };
}
