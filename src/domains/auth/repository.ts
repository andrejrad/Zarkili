import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateEmail as updateAuthEmail,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
} from "firebase/firestore";

import type {
  AuthSession,
  CreateAccountInput,
  PasswordResetInput,
  SignInInput,
  TenantMembership,
  UpdateEmailInput,
  UpdateProfileInput,
} from "./model";
import { toUserFacingAuthError } from "./errorMessages";

const TENANT_USERS_COLLECTION = "tenantUsers";
const USER_PROFILES_COLLECTION = "userProfiles";

type UserProfileRecord = {
  userId: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
};

function assertNonEmpty(value: string, field: string): void {
  if (!value || value.trim().length === 0) {
    throw new Error(`${field} is required`);
  }
}

function toSession(credential: UserCredential, profile?: Partial<UserProfileRecord> | null): AuthSession {
  return {
    userId: credential.user.uid,
    email: credential.user.email,
    firstName: typeof profile?.firstName === "string" ? profile.firstName : null,
    lastName: typeof profile?.lastName === "string" ? profile.lastName : null,
  };
}

export function createAuthRepository(auth: Auth, db: Firestore) {
  async function readUserProfile(userId: string): Promise<UserProfileRecord | null> {
    const snapshot = await getDoc(doc(db, USER_PROFILES_COLLECTION, userId));
    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data() as Partial<UserProfileRecord>;
    return {
      userId,
      email: typeof data.email === "string" || data.email === null ? (data.email ?? null) : null,
      firstName: typeof data.firstName === "string" ? data.firstName : null,
      lastName: typeof data.lastName === "string" ? data.lastName : null,
    };
  }

  async function getCurrentSession(): Promise<AuthSession | null> {
    if (!auth.currentUser) {
      return null;
    }

    const profile = await readUserProfile(auth.currentUser.uid);
    return {
      userId: auth.currentUser.uid,
      email: auth.currentUser.email,
      firstName: profile?.firstName ?? null,
      lastName: profile?.lastName ?? null,
    };
  }

  async function signIn(input: SignInInput): Promise<AuthSession> {
    assertNonEmpty(input.email, "email");
    assertNonEmpty(input.password, "password");

    try {
      const credential = await signInWithEmailAndPassword(auth, input.email, input.password);
      const profile = await readUserProfile(credential.user.uid);
      return toSession(credential, profile);
    } catch (error) {
      throw toUserFacingAuthError(error, "Authentication failed.");
    }
  }

  async function createAccount(input: CreateAccountInput): Promise<AuthSession> {
    assertNonEmpty(input.email, "email");
    assertNonEmpty(input.password, "password");

    try {
      const credential = await createUserWithEmailAndPassword(auth, input.email, input.password);
      return toSession(credential, null);
    } catch (error) {
      throw toUserFacingAuthError(error, "Authentication failed.");
    }
  }

  async function updateProfile(userId: string, input: UpdateProfileInput): Promise<AuthSession> {
    assertNonEmpty(userId, "userId");
    assertNonEmpty(input.firstName, "firstName");
    assertNonEmpty(input.lastName, "lastName");

    const normalizedFirstName = input.firstName.trim();
    const normalizedLastName = input.lastName.trim();
    const currentEmail = auth.currentUser?.uid === userId ? auth.currentUser.email : null;

    await setDoc(
      doc(db, USER_PROFILES_COLLECTION, userId),
      {
        userId,
        email: currentEmail,
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      userId,
      email: currentEmail,
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
    };
  }

  async function updateEmailAddress(userId: string, input: UpdateEmailInput): Promise<AuthSession> {
    assertNonEmpty(userId, "userId");
    assertNonEmpty(input.email, "email");

    const currentUser = auth.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error("No authenticated user available.");
    }

    try {
      const normalizedEmail = input.email.trim();
      await updateAuthEmail(currentUser, normalizedEmail);

      const profile = await readUserProfile(userId);
      await setDoc(
        doc(db, USER_PROFILES_COLLECTION, userId),
        {
          userId,
          email: normalizedEmail,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return {
        userId,
        email: normalizedEmail,
        firstName: profile?.firstName ?? null,
        lastName: profile?.lastName ?? null,
      };
    } catch (error) {
      throw toUserFacingAuthError(error, "Unable to save email.");
    }
  }

  async function sendPasswordReset(input: PasswordResetInput): Promise<void> {
    assertNonEmpty(input.email, "email");

    try {
      await sendPasswordResetEmail(auth, input.email.trim());
    } catch (error) {
      throw toUserFacingAuthError(error, "Unable to send password reset email.");
    }
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
    createAccount,
    updateProfile,
    updateEmailAddress,
    sendPasswordReset,
    signOutCurrentUser,
    listUserTenantMemberships,
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
