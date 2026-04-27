import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";

import type {
  AuthRepository,
  CreateAccountInput,
  PasswordResetInput,
  SignInInput,
  UpdateEmailInput,
  UpdateProfileInput,
} from "../../domains/auth";

type AuthContextValue = {
  userId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  authReady: boolean;
  signIn: (input: SignInInput) => Promise<void>;
  createAccount: (input: CreateAccountInput) => Promise<void>;
  updateProfile: (input: UpdateProfileInput) => Promise<void>;
  updateEmailAddress: (input: UpdateEmailInput) => Promise<void>;
  sendPasswordReset: (input: PasswordResetInput) => Promise<void>;
  signInAsDev: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = PropsWithChildren<{
  authRepository?: AuthRepository | null;
}>;

export function AuthProvider({ children, authRepository = null }: AuthProviderProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [firstName, setFirstName] = useState<string | null>(null);
  const [lastName, setLastName] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function hydrateSession() {
      if (!authRepository) {
        if (!cancelled) {
          setAuthReady(true);
        }
        return;
      }

      try {
        const session = await authRepository.getCurrentSession();
        if (!cancelled) {
          setUserId(session?.userId ?? null);
          setEmail(session?.email ?? null);
          setFirstName(session?.firstName ?? null);
          setLastName(session?.lastName ?? null);
        }
      } catch {
        // Hydration errors are non-fatal — user starts unauthenticated.
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    }

    void hydrateSession();

    return () => {
      cancelled = true;
    };
  }, [authRepository]);

  const value = useMemo<AuthContextValue>(
    () => ({
      userId,
      email,
      firstName,
      lastName,
      authReady,
      signIn: async (input) => {
        if (!authRepository) {
          throw new Error("Auth repository is not configured.");
        }

        const session = await authRepository.signIn(input);
        setUserId(session.userId);
        setEmail(session.email);
        setFirstName(session.firstName);
        setLastName(session.lastName);
      },
      createAccount: async (input) => {
        if (!authRepository) {
          throw new Error("Auth repository is not configured.");
        }

        const session = await authRepository.createAccount(input);
        setUserId(session.userId);
        setEmail(session.email);
        setFirstName(session.firstName);
        setLastName(session.lastName);
      },
      updateProfile: async (input) => {
        if (!authRepository) {
          throw new Error("Auth repository is not configured.");
        }

        if (!userId) {
          throw new Error("No authenticated user available.");
        }

        const session = await authRepository.updateProfile(userId, input);
        setUserId(session.userId);
        setEmail(session.email);
        setFirstName(session.firstName);
        setLastName(session.lastName);
      },
      updateEmailAddress: async (input) => {
        if (!authRepository) {
          throw new Error("Auth repository is not configured.");
        }

        if (!userId) {
          throw new Error("No authenticated user available.");
        }

        const session = await authRepository.updateEmailAddress(userId, input);
        setUserId(session.userId);
        setEmail(session.email);
        setFirstName(session.firstName);
        setLastName(session.lastName);
      },
      sendPasswordReset: async (input) => {
        if (!authRepository) {
          throw new Error("Auth repository is not configured.");
        }

        await authRepository.sendPasswordReset(input);
      },
      signInAsDev: () => {
        setUserId("dev-user");
        setEmail("dev-user@zarkili.local");
        setFirstName("Dev");
        setLastName("User");
      },
      signOut: async () => {
        if (authRepository) {
          await authRepository.signOutCurrentUser();
        }
        setUserId(null);
        setEmail(null);
        setFirstName(null);
        setLastName(null);
      }
    }),
    [authReady, authRepository, email, firstName, lastName, userId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
