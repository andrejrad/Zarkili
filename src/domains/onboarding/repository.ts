/**
 * Onboarding repository
 *
 * Collection layout:
 *   tenants/{tenantId}/onboarding/wizard  — singleton SalonOnboardingState per tenant
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore";

import {
  ONBOARDING_STEPS,
  WIZARD_SCHEMA_VERSION,
  buildInitialStepStatuses,
  computeCompletionScore,
  deriveBlockers,
  type OnboardingStep,
  type OnboardingStepStatus,
  type OnboardingTimelineEvent,
  type SalonOnboardingState,
  type WizardStepDraft,
} from "./model";

// ---------------------------------------------------------------------------
// Collection helpers
// ---------------------------------------------------------------------------

function wizardDocRef(db: Firestore, tenantId: string) {
  return doc(db, `tenants/${tenantId}/onboarding`, "wizard");
}

function draftDocRef(db: Firestore, tenantId: string, step: OnboardingStep) {
  return doc(db, `tenants/${tenantId}/onboardingDrafts`, step);
}

function draftsColRef(db: Firestore, tenantId: string) {
  return collection(db, `tenants/${tenantId}/onboardingDrafts`);
}

function timelineDocRef(db: Firestore, tenantId: string, eventId: string) {
  return doc(db, `tenants/${tenantId}/onboardingTimeline`, eventId);
}

function timelineColRef(db: Firestore, tenantId: string) {
  return collection(db, `tenants/${tenantId}/onboardingTimeline`);
}

// ---------------------------------------------------------------------------
// Repository type
// ---------------------------------------------------------------------------

export type OnboardingRepository = {
  /** Return the current wizard state, or null if not yet started. */
  getOnboardingState(tenantId: string): Promise<SalonOnboardingState | null>;

  /**
   * Initialise a new wizard session for a tenant.
   * Noop if a wizard document already exists.
   */
  startOnboarding(tenantId: string): Promise<SalonOnboardingState>;

  /**
   * Mark a specific step with the given status and recompute score/blockers.
   * Creates the wizard document if it doesn't exist.
   * Returns the updated state.
   */
  advanceStep(
    tenantId: string,
    step: OnboardingStep,
    status: OnboardingStepStatus,
  ): Promise<SalonOnboardingState>;

  /** Persist an arbitrary wizard state (used for full saves). */
  saveOnboardingState(state: SalonOnboardingState): Promise<void>;

  /** Reset all steps to "pending" and restart the wizard from step 1. */
  resetOnboarding(tenantId: string): Promise<void>;

  // -------- W15.1 drafts --------

  /** Persist a versioned per-step draft payload. */
  saveDraft(
    tenantId: string,
    step: OnboardingStep,
    payload: Record<string, unknown>,
  ): Promise<WizardStepDraft>;

  /** Fetch a single per-step draft, or null if none saved. */
  getDraft(tenantId: string, step: OnboardingStep): Promise<WizardStepDraft | null>;

  /** List all per-step drafts for a tenant. */
  listDrafts(tenantId: string): Promise<WizardStepDraft[]>;

  // -------- W15.2 timeline --------

  /** Append an audit event to the onboarding timeline. */
  appendTimelineEvent(
    event: Omit<OnboardingTimelineEvent, "createdAt">,
  ): Promise<OnboardingTimelineEvent>;

  /** List timeline events for a tenant, newest first when ordered by createdAt desc. */
  listTimeline(tenantId: string): Promise<OnboardingTimelineEvent[]>;
};

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createOnboardingRepository(db: Firestore): OnboardingRepository {
  async function getOnboardingState(tenantId: string): Promise<SalonOnboardingState | null> {
    const ref = wizardDocRef(db, tenantId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as SalonOnboardingState;
  }

  async function startOnboarding(tenantId: string): Promise<SalonOnboardingState> {
    const existing = await getOnboardingState(tenantId);
    if (existing) return existing;

    const statuses = buildInitialStepStatuses();
    const blockers = deriveBlockers(statuses);
    const now = serverTimestamp();

    const state: Record<string, unknown> = {
      tenantId,
      stepStatuses: statuses,
      currentStep: ONBOARDING_STEPS[0],
      completionScore: 0,
      blockers,
      canGoLive: blockers.length === 0,
      startedAt: now,
      updatedAt: now,
    };

    const ref = wizardDocRef(db, tenantId);
    await setDoc(ref, state);
    const snap = await getDoc(ref);
    return snap.data() as SalonOnboardingState;
  }

  async function advanceStep(
    tenantId: string,
    step: OnboardingStep,
    status: OnboardingStepStatus,
  ): Promise<SalonOnboardingState> {
    let existing = await getOnboardingState(tenantId);
    if (!existing) {
      existing = await startOnboarding(tenantId);
    }

    const statuses = { ...existing.stepStatuses, [step]: status };
    const score = computeCompletionScore(statuses);
    const blockers = deriveBlockers(statuses);

    // Advance currentStep to the next pending step after this one
    const currentIndex = ONBOARDING_STEPS.indexOf(step);
    let nextStep: OnboardingStep = existing.currentStep;
    for (let i = currentIndex + 1; i < ONBOARDING_STEPS.length; i++) {
      if (statuses[ONBOARDING_STEPS[i]!] === "pending") {
        nextStep = ONBOARDING_STEPS[i]!;
        break;
      }
    }

    const now = serverTimestamp();
    const updated: Record<string, unknown> = {
      ...existing,
      stepStatuses: statuses,
      currentStep: nextStep,
      completionScore: score,
      blockers,
      canGoLive: blockers.length === 0,
      updatedAt: now,
    };

    const ref = wizardDocRef(db, tenantId);
    await setDoc(ref, updated);
    const snap = await getDoc(ref);
    return snap.data() as SalonOnboardingState;
  }

  async function saveOnboardingState(state: SalonOnboardingState): Promise<void> {
    const ref = wizardDocRef(db, state.tenantId);
    await setDoc(ref, { ...state, updatedAt: serverTimestamp() });
  }

  async function resetOnboarding(tenantId: string): Promise<void> {
    const statuses = buildInitialStepStatuses();
    const blockers = deriveBlockers(statuses);
    const now = serverTimestamp();

    const reset: Record<string, unknown> = {
      tenantId,
      stepStatuses: statuses,
      currentStep: ONBOARDING_STEPS[0],
      completionScore: 0,
      blockers,
      canGoLive: false,
      startedAt: now,
      updatedAt: now,
    };

    const ref = wizardDocRef(db, tenantId);
    await setDoc(ref, reset);
  }

  // -------- W15.1 drafts --------

  async function saveDraft(
    tenantId: string,
    step: OnboardingStep,
    payload: Record<string, unknown>,
  ): Promise<WizardStepDraft> {
    const ref = draftDocRef(db, tenantId, step);
    const data: Record<string, unknown> = {
      tenantId,
      step,
      schemaVersion: WIZARD_SCHEMA_VERSION,
      payload,
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    const snap = await getDoc(ref);
    return snap.data() as WizardStepDraft;
  }

  async function getDraft(
    tenantId: string,
    step: OnboardingStep,
  ): Promise<WizardStepDraft | null> {
    const ref = draftDocRef(db, tenantId, step);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data() as WizardStepDraft;
  }

  async function listDrafts(tenantId: string): Promise<WizardStepDraft[]> {
    const snap = await getDocs(draftsColRef(db, tenantId));
    const out: WizardStepDraft[] = [];
    snap.forEach((d) => out.push(d.data() as WizardStepDraft));
    return out;
  }

  // -------- W15.2 timeline --------

  async function appendTimelineEvent(
    event: Omit<OnboardingTimelineEvent, "createdAt">,
  ): Promise<OnboardingTimelineEvent> {
    const ref = timelineDocRef(db, event.tenantId, event.eventId);
    const existing = await getDoc(ref);
    if (existing.exists()) {
      throw new Error(`Timeline event ${event.eventId} already exists`);
    }
    const data: Record<string, unknown> = {
      ...event,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, data);
    const snap = await getDoc(ref);
    return snap.data() as OnboardingTimelineEvent;
  }

  async function listTimeline(tenantId: string): Promise<OnboardingTimelineEvent[]> {
    const snap = await getDocs(
      query(timelineColRef(db, tenantId), orderBy("createdAt", "desc")),
    );
    const out: OnboardingTimelineEvent[] = [];
    snap.forEach((d) => out.push(d.data() as OnboardingTimelineEvent));
    return out;
  }

  return {
    getOnboardingState,
    startOnboarding,
    advanceStep,
    saveOnboardingState,
    resetOnboarding,
    saveDraft,
    getDraft,
    listDrafts,
    appendTimelineEvent,
    listTimeline,
  };
}
