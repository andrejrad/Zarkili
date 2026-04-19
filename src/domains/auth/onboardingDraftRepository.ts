import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import type {
  OnboardingDraft,
  OnboardingFlowType,
  SaveOnboardingDraftInput,
} from "./model";
import { CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION } from "./onboardingDraftContracts";

const ONBOARDING_DRAFTS_COLLECTION = "onboardingDrafts";

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function buildDraftId(tenantId: string, userId: string, flowType: OnboardingFlowType): string {
  return `${tenantId}_${userId}_${flowType}`;
}

export function createOnboardingDraftRepository(db: Firestore) {
  const currentSchemaVersion = CURRENT_ONBOARDING_DRAFT_SCHEMA_VERSION;

  async function saveDraft(input: SaveOnboardingDraftInput): Promise<OnboardingDraft> {
    assertNonEmpty(input.tenantId, "tenantId");
    assertNonEmpty(input.userId, "userId");
    assertNonEmpty(input.currentStep, "currentStep");

    const draftId = buildDraftId(input.tenantId, input.userId, input.flowType);
    const ref = doc(db, ONBOARDING_DRAFTS_COLLECTION, draftId);

    await setDoc(
      ref,
      {
        draftId,
        tenantId: input.tenantId,
        userId: input.userId,
        flowType: input.flowType,
        schemaVersion: input.schemaVersion ?? currentSchemaVersion,
        status: "draft",
        currentStep: input.currentStep,
        payload: input.payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    const snapshot = await getDoc(ref);
    return snapshot.data() as OnboardingDraft;
  }

  async function resumeDraft(
    tenantId: string,
    userId: string,
    flowType: OnboardingFlowType
  ): Promise<OnboardingDraft | null> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(userId, "userId");

    const draftId = buildDraftId(tenantId, userId, flowType);
    const ref = doc(db, ONBOARDING_DRAFTS_COLLECTION, draftId);
    const snapshot = await getDoc(ref);

    if (!snapshot.exists()) {
      return null;
    }

    return snapshot.data() as OnboardingDraft;
  }

  async function discardDraft(
    tenantId: string,
    userId: string,
    flowType: OnboardingFlowType
  ): Promise<void> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(userId, "userId");

    const draftId = buildDraftId(tenantId, userId, flowType);
    await deleteDoc(doc(db, ONBOARDING_DRAFTS_COLLECTION, draftId));
  }

  async function listUserDrafts(tenantId: string, userId: string): Promise<OnboardingDraft[]> {
    assertNonEmpty(tenantId, "tenantId");
    assertNonEmpty(userId, "userId");

    const q = query(
      collection(db, ONBOARDING_DRAFTS_COLLECTION),
      where("tenantId", "==", tenantId),
      where("userId", "==", userId),
      where("status", "==", "draft"),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data() as OnboardingDraft);
  }

  return {
    saveDraft,
    resumeDraft,
    discardDraft,
    listUserDrafts,
  };
}

export type OnboardingDraftRepository = ReturnType<typeof createOnboardingDraftRepository>;
