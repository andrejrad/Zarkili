/**
 * Activities repository
 *
 * Collections:
 *   tenants/{tenantId}/activities/{activityId}
 *   tenants/{tenantId}/activityParticipations/{participationId}
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  serverTimestamp,
  where,
  type Firestore,
} from "firebase/firestore";

import {
  ActivityError,
  isValidActivityTransition,
  isActivityCompleted,
  type Activity,
  type ActivityStatus,
  type ParticipationRecord,
} from "./model";

// ---------------------------------------------------------------------------
// Repository type
// ---------------------------------------------------------------------------

export type ActivityRepository = {
  listActivities(tenantId: string): Promise<Activity[]>;
  createActivity(draft: Omit<Activity, "activityId" | "createdAt" | "updatedAt">): Promise<Activity>;
  getActivity(tenantId: string, activityId: string): Promise<Activity | null>;
  activateActivity(tenantId: string, activityId: string): Promise<void>;
  deactivateActivity(tenantId: string, activityId: string): Promise<void>;
  updateActivityStatus(tenantId: string, activityId: string, status: ActivityStatus): Promise<void>;
  recordParticipation(tenantId: string, activityId: string, userId: string, progressIncrement: number): Promise<ParticipationRecord>;
  getParticipation(tenantId: string, activityId: string, userId: string): Promise<ParticipationRecord | null>;
  checkCompletion(tenantId: string, activityId: string, userId: string): Promise<boolean>;
  awardReward(tenantId: string, activityId: string, userId: string, nowIso: string): Promise<void>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createActivityRepository(db: Firestore): ActivityRepository {
  function activityCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/activities`);
  }

  function activityRef(tenantId: string, activityId: string) {
    return doc(db, `tenants/${tenantId}/activities`, activityId);
  }

  function participationCol(tenantId: string) {
    return collection(db, `tenants/${tenantId}/activityParticipations`);
  }

  function participationRef(tenantId: string, participationId: string) {
    return doc(db, `tenants/${tenantId}/activityParticipations`, participationId);
  }

  function participationId(activityId: string, userId: string) {
    return `${activityId}__${userId}`;
  }

  async function createActivity(
    draft: Omit<Activity, "activityId" | "createdAt" | "updatedAt">,
  ): Promise<Activity> {
    if (!draft.tenantId) throw new ActivityError("TENANT_REQUIRED", "tenantId is required");

    const activityId = `act_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const activity: Activity = {
      ...draft,
      activityId,
      createdAt: serverTimestamp() as never,
      updatedAt: serverTimestamp() as never,
    };

    await setDoc(activityRef(draft.tenantId, activityId), activity);
    return activity;
  }

  async function listActivities(tenantId: string): Promise<Activity[]> {
    if (!tenantId) throw new ActivityError("TENANT_REQUIRED", "tenantId is required");
    const snap = await getDocs(query(activityCol(tenantId)));
    return snap.docs.map((d) => d.data() as Activity);
  }

  async function getActivity(tenantId: string, activityId: string): Promise<Activity | null> {
    const snap = await getDoc(activityRef(tenantId, activityId));
    if (!snap.exists()) return null;
    return snap.data() as Activity;
  }

  async function updateActivityStatus(
    tenantId: string,
    activityId: string,
    newStatus: ActivityStatus,
  ): Promise<void> {
    const snap = await getDoc(activityRef(tenantId, activityId));
    if (!snap.exists()) throw new ActivityError("ACTIVITY_NOT_FOUND", `Activity ${activityId} not found`);

    const current = snap.data() as Activity;
    if (!isValidActivityTransition(current.status, newStatus)) {
      throw new ActivityError(
        "INVALID_STATUS_TRANSITION",
        `Cannot transition from ${current.status} to ${newStatus}`,
      );
    }

    await setDoc(
      activityRef(tenantId, activityId),
      { ...current, status: newStatus, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  async function activateActivity(tenantId: string, activityId: string): Promise<void> {
    return updateActivityStatus(tenantId, activityId, "active");
  }

  async function deactivateActivity(tenantId: string, activityId: string): Promise<void> {
    return updateActivityStatus(tenantId, activityId, "inactive");
  }

  async function getParticipation(
    tenantId: string,
    activityId: string,
    userId: string,
  ): Promise<ParticipationRecord | null> {
    const pid = participationId(activityId, userId);
    const snap = await getDoc(participationRef(tenantId, pid));
    if (!snap.exists()) return null;
    return snap.data() as ParticipationRecord;
  }

  async function recordParticipation(
    tenantId: string,
    activityId: string,
    userId: string,
    progressIncrement: number,
  ): Promise<ParticipationRecord> {
    const activity = await getActivity(tenantId, activityId);
    if (!activity) throw new ActivityError("ACTIVITY_NOT_FOUND", `Activity ${activityId} not found`);
    if (activity.status !== "active") {
      throw new ActivityError("ACTIVITY_NOT_ACTIVE", `Activity ${activityId} is not active`);
    }

    const existing = await getParticipation(tenantId, activityId, userId);
    if (existing?.completed) {
      throw new ActivityError("ALREADY_COMPLETED", "Activity already completed by this user");
    }

    const currentProgress = existing?.progress ?? 0;
    const newProgress = currentProgress + progressIncrement;
    const completed = newProgress >= activity.rule.targetValue;

    const pid = participationId(activityId, userId);
    const record: ParticipationRecord = {
      participationId: pid,
      activityId,
      tenantId,
      userId,
      progress: newProgress,
      completed,
      createdAt: existing?.createdAt ?? (serverTimestamp() as never),
      updatedAt: serverTimestamp() as never,
    };

    await setDoc(participationRef(tenantId, pid), record);
    return record;
  }

  async function checkCompletion(
    tenantId: string,
    activityId: string,
    userId: string,
  ): Promise<boolean> {
    const activity = await getActivity(tenantId, activityId);
    if (!activity) return false;

    const participation = await getParticipation(tenantId, activityId, userId);
    if (!participation) return false;

    return isActivityCompleted(participation, activity.rule);
  }

  async function awardReward(
    tenantId: string,
    activityId: string,
    userId: string,
    nowIso: string,
  ): Promise<void> {
    const pid = participationId(activityId, userId);
    const snap = await getDoc(participationRef(tenantId, pid));
    if (!snap.exists()) throw new ActivityError("ACTIVITY_NOT_FOUND", "Participation not found");

    const existing = snap.data() as ParticipationRecord;
    await setDoc(
      participationRef(tenantId, pid),
      { ...existing, rewardedAt: nowIso, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  return {
    listActivities,
    createActivity,
    getActivity,
    activateActivity,
    deactivateActivity,
    updateActivityStatus,
    recordParticipation,
    getParticipation,
    checkCompletion,
    awardReward,
  };
}
