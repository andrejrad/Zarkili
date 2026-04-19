import {
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";

import type { AuthSession, SignInInput, TenantMembership } from "./model";

const TENANT_USERS_COLLECTION = "tenantUsers";

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function toSession(credential: UserCredential): AuthSession {
  return {
    userId: credential.user.uid,
    email: credential.user.email,
  };
}

export function createAuthRepository(auth: Auth, db: Firestore) {
  async function getCurrentSession(): Promise<AuthSession | null> {
    if (!auth.currentUser) {
      return null;
    }

    return {
      userId: auth.currentUser.uid,
      email: auth.currentUser.email,
    };
  }

  async function signIn(input: SignInInput): Promise<AuthSession> {
    assertNonEmpty(input.email, "email");
    assertNonEmpty(input.password, "password");

    const credential = await signInWithEmailAndPassword(auth, input.email, input.password);
    return toSession(credential);
  }

  async function signOutCurrentUser(): Promise<void> {
    await signOut(auth);
  }

  async function listUserTenantMemberships(userId: string): Promise<TenantMembership[]> {
    assertNonEmpty(userId, "userId");

    // Tenant-safe context loading: memberships are always fetched by authenticated user id.
    const q = query(
      collection(db, TENANT_USERS_COLLECTION),
      where("userId", "==", userId),
      where("status", "==", "active")
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => ({
      membershipId: docSnap.id,
      ...(docSnap.data() as Omit<TenantMembership, "membershipId">),
    }));
  }

  return {
    getCurrentSession,
    signIn,
    signOutCurrentUser,
    listUserTenantMemberships,
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
