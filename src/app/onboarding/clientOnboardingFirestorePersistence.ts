/**
 * clientOnboardingFirestorePersistence.ts
 *
 * Firestore-backed implementation of the `OnboardingPersistencePort` so that
 * onboarding sessions survive app restarts and can be resumed on a different
 * device. This is the W16-DEBT-1 closeout — the orchestrator's mutation API
 * stays sync; this adapter is invoked fire-and-forget by the orchestrator and
 * loaded explicitly via `restoreSession`.
 *
 * Document path: `userOnboardingDrafts/{sessionId}`
 *
 * Notes:
 *  - The full `OnboardingSession` shape is plain JSON-friendly data
 *    (numbers / strings / arrays) so we can persist it as-is via setDoc.
 *  - Reads use `getDoc`; writes use `setDoc` with merge:false so the latest
 *    snapshot always reflects the in-memory session.
 *  - Module arrays are normalised into known values on load to defend
 *    against client-side schema drift.
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";

import type {
  OnboardingModule,
  OnboardingPersistencePort,
  OnboardingSession,
} from "./clientOnboardingOrchestrator";

const COLLECTION = "userOnboardingDrafts";

const KNOWN_MODULES: ReadonlySet<OnboardingModule> = new Set([
  "profile",
  "payment",
  "preferences",
  "notifications",
  "loyalty",
]);

function sanitiseModules(input: unknown): OnboardingModule[] {
  if (!Array.isArray(input)) return [];
  const out: OnboardingModule[] = [];
  for (const v of input) {
    if (typeof v === "string" && KNOWN_MODULES.has(v as OnboardingModule)) {
      out.push(v as OnboardingModule);
    }
  }
  return out;
}

function deserialiseSession(raw: unknown): OnboardingSession | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.sessionId !== "string" || !r.sessionId) return null;
  if (typeof r.tenantId !== "string") return null;
  if (r.mode !== "guest" && r.mode !== "full" && r.mode !== "merged") {
    return null;
  }
  if (typeof r.email !== "string") return null;
  if (typeof r.createdAt !== "number") return null;

  const prefsRaw = (r.preferences ?? {}) as Record<string, unknown>;

  return {
    sessionId: r.sessionId,
    tenantId: r.tenantId,
    mode: r.mode,
    email: r.email,
    phone: typeof r.phone === "string" ? r.phone : undefined,
    userId: typeof r.userId === "string" ? r.userId : undefined,
    bookingContext:
      r.bookingContext && typeof r.bookingContext === "object"
        ? (r.bookingContext as OnboardingSession["bookingContext"])
        : undefined,
    completedModules: sanitiseModules(r.completedModules),
    skippedModules: sanitiseModules(r.skippedModules),
    preferences: {
      notificationsEnabled: prefsRaw.notificationsEnabled === true,
      promotionsEnabled: prefsRaw.promotionsEnabled === true,
      loyaltyOptIn: prefsRaw.loyaltyOptIn === true,
    },
    createdAt: r.createdAt,
    upgradedAt: typeof r.upgradedAt === "number" ? r.upgradedAt : undefined,
    mergedAt: typeof r.mergedAt === "number" ? r.mergedAt : undefined,
    mergeStrategy:
      r.mergeStrategy === "preserve_existing" ||
      r.mergeStrategy === "prefer_session"
        ? r.mergeStrategy
        : undefined,
  };
}

/**
 * Strips `undefined` values before passing to setDoc — Firestore rejects
 * undefined fields by default (it accepts null instead).
 */
function serialiseSession(session: OnboardingSession): Record<string, unknown> {
  const out: Record<string, unknown> = {
    sessionId: session.sessionId,
    tenantId: session.tenantId,
    mode: session.mode,
    email: session.email,
    completedModules: session.completedModules,
    skippedModules: session.skippedModules,
    preferences: session.preferences,
    createdAt: session.createdAt,
  };
  if (session.phone !== undefined) out.phone = session.phone;
  if (session.userId !== undefined) out.userId = session.userId;
  if (session.bookingContext !== undefined) {
    out.bookingContext = session.bookingContext;
  }
  if (session.upgradedAt !== undefined) out.upgradedAt = session.upgradedAt;
  if (session.mergedAt !== undefined) out.mergedAt = session.mergedAt;
  if (session.mergeStrategy !== undefined) {
    out.mergeStrategy = session.mergeStrategy;
  }
  return out;
}

export function createFirestoreOnboardingPersistence(
  db: Firestore,
): OnboardingPersistencePort {
  return {
    async save(session) {
      const ref = doc(db, COLLECTION, session.sessionId);
      await setDoc(ref, serialiseSession(session));
    },
    async load(sessionId) {
      const ref = doc(db, COLLECTION, sessionId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      return deserialiseSession(snap.data());
    },
  };
}
