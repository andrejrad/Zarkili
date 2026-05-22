import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  type Firestore,
} from "firebase/firestore";
import type { ImpersonationSession } from "./platformAdminTypes";

const USER_PROFILES_COLLECTION = "userProfiles";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_DURATION_MS = 30 * 60 * 1000; // 30-minute cap

// ---------------------------------------------------------------------------
// RBAC
// ---------------------------------------------------------------------------

function assertPlatformAdmin(role: string): void {
  if (role !== "platform_admin") {
    throw new Error("FORBIDDEN: platform_admin role required for impersonation");
  }
}

// ---------------------------------------------------------------------------
// Service factory
// ---------------------------------------------------------------------------

export function createImpersonationService(db: Firestore) {
  async function startImpersonation(
    actorRole: string,
    platformAdminId: string,
    targetTenantId: string,
    targetUserId: string,
    reason: string
  ): Promise<ImpersonationSession> {
    assertPlatformAdmin(actorRole);

    if (!reason || reason.trim().length < 10) {
      throw new Error("VALIDATION: reason must be at least 10 characters");
    }

    const profileSnap = await getDoc(doc(db, USER_PROFILES_COLLECTION, targetUserId));
    const targetUserEmail: string =
      (profileSnap.exists() && typeof profileSnap.data()?.email === "string"
        ? (profileSnap.data().email as string)
        : "") || "";

    // Check for an already-active session
    const existing = await getActiveImpersonationSession(actorRole, platformAdminId);
    if (existing) {
      throw new Error("CONFLICT: an active impersonation session already exists; end it first");
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);

    const session: Omit<ImpersonationSession, "sessionId"> = {
      platformAdminId,
      targetTenantId,
      targetUserId,
      targetUserEmail,
      reason,
      startedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      active: true,
    };

    const ref = await addDoc(collection(db, "impersonationSessions"), {
      ...session,
      startedAt: serverTimestamp(),
    });

    // Write to platform audit log
    await addDoc(collection(db, "platformAuditLog"), {
      actorId: platformAdminId,
      actorKind: "platform_admin",
      action: "impersonation.started",
      targetKind: "user",
      targetId: targetUserId,
      detail: `tenant=${targetTenantId} reason=${reason}`,
      occurredAt: serverTimestamp(),
    });

    // Write security event
    await addDoc(collection(db, "securityEvents"), {
      kind: "impersonation_start",
      severity: "high",
      actorId: platformAdminId,
      tenantId: targetTenantId,
      detail: `Impersonation started for ${targetUserEmail} — ${reason}`,
      occurredAt: serverTimestamp(),
      resolved: false,
    });

    return { sessionId: ref.id, ...session };
  }

  async function endImpersonation(
    actorRole: string,
    sessionId: string,
    actorId: string
  ): Promise<void> {
    assertPlatformAdmin(actorRole);
    const ref = doc(db, "impersonationSessions", sessionId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("NOT_FOUND: impersonation session not found");

    await updateDoc(ref, {
      active: false,
      endedAt: new Date().toISOString(),
    });

    await addDoc(collection(db, "platformAuditLog"), {
      actorId,
      actorKind: "platform_admin",
      action: "impersonation.ended",
      targetKind: "user",
      targetId: snap.data().targetUserId,
      occurredAt: serverTimestamp(),
    });

    await addDoc(collection(db, "securityEvents"), {
      kind: "impersonation_end",
      severity: "medium",
      actorId,
      tenantId: snap.data().targetTenantId,
      detail: `Impersonation session ${sessionId} ended`,
      occurredAt: serverTimestamp(),
      resolved: true,
      resolvedAt: new Date().toISOString(),
    });
  }

  async function getActiveImpersonationSession(
    actorRole: string,
    platformAdminId: string
  ): Promise<ImpersonationSession | null> {
    assertPlatformAdmin(actorRole);
    const col = collection(db, "impersonationSessions");
    const q = query(
      col,
      where("platformAdminId", "==", platformAdminId),
      where("active", "==", true)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    const session = { sessionId: d.id, ...(d.data() as Omit<ImpersonationSession, "sessionId">) };
    // Auto-expire: if past expiresAt, treat as inactive
    if (new Date(session.expiresAt) < new Date()) {
      await updateDoc(doc(db, "impersonationSessions", d.id), {
        active: false,
        endedAt: new Date().toISOString(),
      });
      return null;
    }
    return session;
  }

  return {
    startImpersonation,
    endImpersonation,
    getActiveImpersonationSession,
  };
}
