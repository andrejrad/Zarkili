import { act, render, screen, waitFor } from "@testing-library/react-native";
import { fireEvent } from "@testing-library/react-native";
import { PropsWithChildren } from "react";
import { Text, TouchableOpacity } from "react-native";

import type { AuthRepository } from "../../../domains/auth";
import { AuthProvider, useAuth } from "../AuthProvider";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createAuthRepositoryStub(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    getCurrentSession: () => new Promise<never>(() => {}), // suspended by default
    signIn: async () => ({ userId: "repo-user", email: "repo@example.com", firstName: null, lastName: null }),
    createAccount: async () => ({ userId: "new-user", email: "new@example.com", firstName: null, lastName: null }),
    updateProfile: async (_userId, input) => ({ userId: "repo-user", email: "repo@example.com", firstName: input.firstName, lastName: input.lastName }),
    updateEmailAddress: async (_userId, input) => ({ userId: "repo-user", email: input.email, firstName: "Repo", lastName: "User" }),
    sendPasswordReset: async () => undefined,
    signOutCurrentUser: async () => undefined,
    listUserTenantMemberships: async () => [],
    ...overrides,
  };
}

function Wrapper({ children, authRepository }: PropsWithChildren<{ authRepository?: AuthRepository | null }>) {
  return <AuthProvider authRepository={authRepository}>{children}</AuthProvider>;
}

function AuthProbe() {
  const {
    userId,
    email,
    firstName,
    lastName,
    authReady,
    signIn,
    createAccount,
    updateProfile,
    updateEmailAddress,
    sendPasswordReset,
    signInAsDev,
    signOut,
  } = useAuth();

  return (
    <>
      <Text testID="userId">{userId ?? "none"}</Text>
      <Text testID="email">{email ?? "none"}</Text>
      <Text testID="firstName">{firstName ?? "none"}</Text>
      <Text testID="lastName">{lastName ?? "none"}</Text>
      <Text testID="authReady">{authReady ? "ready" : "loading"}</Text>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => void signIn({ email: "test@example.com", password: "pass123" })}
      >
        <Text>sign-in</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => void createAccount({ email: "new@example.com", password: "pass123" })}
      >
        <Text>create-account</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => void updateProfile({ firstName: "Ana", lastName: "Novak" })}
      >
        <Text>update-profile</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => void updateEmailAddress({ email: "updated@example.com" })}
      >
        <Text>update-email</Text>
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => void sendPasswordReset({ email: "updated@example.com" })}
      >
        <Text>reset-password</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={signInAsDev}>
        <Text>sign-in-dev</Text>
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" onPress={() => void signOut()}>
        <Text>sign-out</Text>
      </TouchableOpacity>
    </>
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("AuthProvider", () => {
  it("sets authReady immediately when no repository provided", async () => {
    render(
      <Wrapper authRepository={null}>
        <AuthProbe />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("authReady").props.children).toBe("ready");
    });
    expect(screen.getByTestId("userId").props.children).toBe("none");
    expect(screen.getByTestId("email").props.children).toBe("none");
  });

  it("hydrates session from repository on mount", async () => {
    const stub = createAuthRepositoryStub({
      getCurrentSession: async () => ({ userId: "hydrated-user", email: "hydrated@example.com", firstName: "Ana", lastName: "Novak" }),
    });

    render(
      <Wrapper authRepository={stub}>
        <AuthProbe />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("authReady").props.children).toBe("ready");
    });
    expect(screen.getByTestId("userId").props.children).toBe("hydrated-user");
    expect(screen.getByTestId("email").props.children).toBe("hydrated@example.com");
    expect(screen.getByTestId("firstName").props.children).toBe("Ana");
    expect(screen.getByTestId("lastName").props.children).toBe("Novak");
  });

  it("sets authReady even when getCurrentSession returns null", async () => {
    const stub = createAuthRepositoryStub({
      getCurrentSession: async () => null,
    });

    render(
      <Wrapper authRepository={stub}>
        <AuthProbe />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("authReady").props.children).toBe("ready");
    });
    expect(screen.getByTestId("userId").props.children).toBe("none");
  });

  it("sets authReady even when getCurrentSession throws", async () => {
    const stub = createAuthRepositoryStub({
      getCurrentSession: async () => { throw new Error("network error"); },
    });

    render(
      <Wrapper authRepository={stub}>
        <AuthProbe />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByTestId("authReady").props.children).toBe("ready");
    });
    expect(screen.getByTestId("userId").props.children).toBe("none");
  });

  it("signIn calls repository and updates userId and email", async () => {
    const signIn = jest.fn().mockResolvedValue({ userId: "signed-in-user", email: "signed-in@example.com", firstName: "Signed", lastName: "In" });
    const stub = createAuthRepositoryStub({ signIn });

    render(
      <Wrapper authRepository={stub}>
        <AuthProbe />
      </Wrapper>
    );

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "sign-in" }));
    });

    expect(signIn).toHaveBeenCalledWith({ email: "test@example.com", password: "pass123" });
    expect(screen.getByTestId("userId").props.children).toBe("signed-in-user");
    expect(screen.getByTestId("email").props.children).toBe("signed-in@example.com");
    expect(screen.getByTestId("firstName").props.children).toBe("Signed");
    expect(screen.getByTestId("lastName").props.children).toBe("In");
  });

  it("createAccount calls repository and updates userId and email", async () => {
    const createAccount = jest.fn().mockResolvedValue({ userId: "created-user", email: "created@example.com", firstName: null, lastName: null });
    const stub = createAuthRepositoryStub({ createAccount });

    render(
      <Wrapper authRepository={stub}>
        <AuthProbe />
      </Wrapper>
    );

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "create-account" }));
    });

    expect(createAccount).toHaveBeenCalledWith({ email: "new@example.com", password: "pass123" });
    expect(screen.getByTestId("userId").props.children).toBe("created-user");
    expect(screen.getByTestId("email").props.children).toBe("created@example.com");
  });

  it("updateProfile calls repository and updates stored names", async () => {
    const updateProfile = jest.fn().mockResolvedValue({
      userId: "created-user",
      email: "created@example.com",
      firstName: "Ana",
      lastName: "Novak",
    });
    const stub = createAuthRepositoryStub({
      createAccount: jest.fn().mockResolvedValue({ userId: "created-user", email: "created@example.com", firstName: null, lastName: null }),
      updateProfile,
    });

    render(
      <Wrapper authRepository={stub}>
        <AuthProbe />
      </Wrapper>
    );

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "create-account" }));
    });

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "update-profile" }));
    });

    expect(updateProfile).toHaveBeenCalledWith("created-user", { firstName: "Ana", lastName: "Novak" });
    expect(screen.getByTestId("firstName").props.children).toBe("Ana");
    expect(screen.getByTestId("lastName").props.children).toBe("Novak");
  });

  it("updateEmailAddress calls repository and updates email", async () => {
    const updateEmailAddress = jest.fn().mockResolvedValue({
      userId: "created-user",
      email: "updated@example.com",
      firstName: "Ana",
      lastName: "Novak",
    });
    const stub = createAuthRepositoryStub({
      createAccount: jest.fn().mockResolvedValue({ userId: "created-user", email: "created@example.com", firstName: "Ana", lastName: "Novak" }),
      updateEmailAddress,
    });

    render(
      <Wrapper authRepository={stub}>
        <AuthProbe />
      </Wrapper>
    );

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "create-account" }));
    });

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "update-email" }));
    });

    expect(updateEmailAddress).toHaveBeenCalledWith("created-user", { email: "updated@example.com" });
    expect(screen.getByTestId("email").props.children).toBe("updated@example.com");
  });

  it("sendPasswordReset calls repository", async () => {
    const sendPasswordReset = jest.fn().mockResolvedValue(undefined);
    const stub = createAuthRepositoryStub({ sendPasswordReset });

    render(
      <Wrapper authRepository={stub}>
        <AuthProbe />
      </Wrapper>
    );

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "reset-password" }));
    });

    expect(sendPasswordReset).toHaveBeenCalledWith({ email: "updated@example.com" });
  });

  it("signInAsDev sets dev credentials without a repository", async () => {
    render(
      <Wrapper authRepository={null}>
        <AuthProbe />
      </Wrapper>
    );

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "sign-in-dev" }));
    });

    expect(screen.getByTestId("userId").props.children).toBe("dev-user");
    expect(screen.getByTestId("email").props.children).toBe("dev-user@zarkili.local");
    expect(screen.getByTestId("firstName").props.children).toBe("Dev");
    expect(screen.getByTestId("lastName").props.children).toBe("User");
  });

  it("signOut clears state and calls signOutCurrentUser", async () => {
    const signIn = jest.fn().mockResolvedValue({ userId: "signed-in-user", email: "signed-in@example.com", firstName: "Signed", lastName: "In" });
    const signOutCurrentUser = jest.fn().mockResolvedValue(undefined);
    const stub = createAuthRepositoryStub({ signIn, signOutCurrentUser });

    render(
      <Wrapper authRepository={stub}>
        <AuthProbe />
      </Wrapper>
    );

    // First sign in
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "sign-in" }));
    });
    expect(screen.getByTestId("userId").props.children).toBe("signed-in-user");

    // Then sign out
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "sign-out" }));
    });

    expect(signOutCurrentUser).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("userId").props.children).toBe("none");
    expect(screen.getByTestId("email").props.children).toBe("none");
    expect(screen.getByTestId("firstName").props.children).toBe("none");
    expect(screen.getByTestId("lastName").props.children).toBe("none");
  });

  it("signIn throws when no repository is configured", async () => {
    const thrownErrors: Error[] = [];

    function ErrorCapturingProbe() {
      const { signIn } = useAuth();
      return (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => signIn({ email: "x@example.com", password: "p" }).catch((e) => thrownErrors.push(e as Error))}
        >
          <Text>sign-in</Text>
        </TouchableOpacity>
      );
    }

    render(
      <Wrapper authRepository={null}>
        <ErrorCapturingProbe />
      </Wrapper>
    );

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "sign-in" }));
    });

    expect(thrownErrors).toHaveLength(1);
    expect(thrownErrors[0].message).toBe("Auth repository is not configured.");
  });
});
