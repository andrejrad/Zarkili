/**
 * socialAuthService.test.ts — W38-DEBT-5
 * Unit tests for social OAuth orchestration in socialAuthService.
 */

import type { AuthSession } from "../model";

// ---------------------------------------------------------------------------
// Module mocks — factory closures only reference jest.fn() (no outer vars)
// ---------------------------------------------------------------------------

// expo-web-browser is no longer called at module level in socialAuthService
// (it was moved to SocialSignInSelectorScreen). Mock it defensively.
jest.mock("expo-web-browser", () => ({
  maybeCompleteAuthSession: jest.fn(),
}));

jest.mock("expo-auth-session", () => ({
  makeRedirectUri: jest.fn(() => "zarkili://oauth/redirect"),
  AuthRequest: jest.fn(),
  ResponseType: { Code: "code" },
  exchangeCodeAsync: jest.fn(),
}));

jest.mock("expo-crypto", () => ({
  randomUUID: jest.fn(() => "test-raw-nonce-uuid"),
  digestStringAsync: jest.fn(() => Promise.resolve("hashed-nonce-sha256")),
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
}));

jest.mock("expo-apple-authentication", () => ({
  signInAsync: jest.fn(),
  AppleAuthenticationScope: { FULL_NAME: 0, EMAIL: 1 },
}));

jest.mock("firebase/auth", () => ({
  GoogleAuthProvider: {
    credential: jest.fn((idToken: string) => ({ providerId: "google.com", idToken })),
  },
  OAuthProvider: jest.fn().mockImplementation(() => ({
    credential: jest.fn((params: Record<string, string>) => ({
      providerId: "apple.com",
      ...params,
    })),
  })),
}));

// ---------------------------------------------------------------------------
// Get references to mock functions after mocks are applied
// ---------------------------------------------------------------------------

import * as ExpoAuthSession from "expo-auth-session";
import * as ExpoApple from "expo-apple-authentication";
import * as ExpoWebBrowser from "expo-web-browser";
import { GoogleAuthProvider, OAuthProvider } from "firebase/auth";

const mockAuthRequestCtor = ExpoAuthSession.AuthRequest as jest.Mock;
const mockExchangeCodeAsync = ExpoAuthSession.exchangeCodeAsync as jest.Mock;
const mockAppleSignInAsync = ExpoApple.signInAsync as jest.Mock;
const MockOAuthProvider = OAuthProvider as unknown as jest.Mock;

// ---------------------------------------------------------------------------
// Module under test
// ---------------------------------------------------------------------------

import { createSocialAuthService } from "../socialAuthService";

// ---------------------------------------------------------------------------
// Mock authRepository
// ---------------------------------------------------------------------------

const mockSignInWithSocialCredential = jest.fn();
const fakeAuthRepository = {
  signInWithSocialCredential: (...args: unknown[]) =>
    mockSignInWithSocialCredential(...args),
} as never;

const fakeSession: AuthSession = {
  userId: "uid-social-123",
  email: "social@example.com",
  firstName: null,
  lastName: null,
};

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeService() {
  return createSocialAuthService(fakeAuthRepository);
}

function setupMockAuthRequest(promptResult: object) {
  const mockPromptAsync = jest.fn().mockResolvedValue(promptResult);
  mockAuthRequestCtor.mockImplementation(() => ({
    codeVerifier: "test-pkce-verifier",
    promptAsync: mockPromptAsync,
  }));
  return mockPromptAsync;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("socialAuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID = "test-google-client-id.apps.googleusercontent.com";
    mockSignInWithSocialCredential.mockResolvedValue(fakeSession);
  });

  afterEach(() => {
    delete process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID;
  });

  // ── Google ─────────────────────────────────────────────────────────────

  describe("Google sign-in", () => {
    it("returns an AuthSession on success", async () => {
      setupMockAuthRequest({ type: "success", params: { code: "auth-code-abc" } });
      mockExchangeCodeAsync.mockResolvedValue({ idToken: "google-id-token" });

      const service = makeService();
      const result = await service.signInWithProvider("google");

      expect(mockAuthRequestCtor).toHaveBeenCalledTimes(1);
      expect(mockExchangeCodeAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          code: "auth-code-abc",
          clientId: "test-google-client-id.apps.googleusercontent.com",
        }),
        expect.objectContaining({ tokenEndpoint: expect.stringContaining("googleapis.com") })
      );
      expect(GoogleAuthProvider.credential).toHaveBeenCalledWith("google-id-token");
      expect(mockSignInWithSocialCredential).toHaveBeenCalledTimes(1);
      expect(result).toEqual(fakeSession);
    });

    it("throws a user-friendly error when user cancels the browser", async () => {
      setupMockAuthRequest({ type: "cancel" });

      const service = makeService();
      await expect(service.signInWithProvider("google")).rejects.toThrow("cancelled");
    });

    it("throws a user-friendly error when browser is dismissed", async () => {
      setupMockAuthRequest({ type: "dismiss" });

      const service = makeService();
      await expect(service.signInWithProvider("google")).rejects.toThrow("cancelled");
    });

    it("throws when promptAsync returns an error type", async () => {
      setupMockAuthRequest({ type: "error", error: {} });

      const service = makeService();
      await expect(service.signInWithProvider("google")).rejects.toThrow("failed");
    });

    it("throws when the token exchange returns no idToken", async () => {
      setupMockAuthRequest({ type: "success", params: { code: "code-abc" } });
      mockExchangeCodeAsync.mockResolvedValue({ idToken: undefined });

      const service = makeService();
      await expect(service.signInWithProvider("google")).rejects.toThrow(
        "did not return an ID token"
      );
    });

    it("throws when EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID is not set", async () => {
      delete process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID;

      const service = makeService();
      await expect(service.signInWithProvider("google")).rejects.toThrow("not configured");
    });
  });

  // ── Apple ──────────────────────────────────────────────────────────────

  describe("Apple sign-in", () => {
    it("returns an AuthSession on success", async () => {
      const mockOAuthProviderCredential = jest.fn((params: Record<string, string>) => ({
        providerId: "apple.com",
        ...params,
      }));
      MockOAuthProvider.mockImplementation(() => ({
        credential: mockOAuthProviderCredential,
      }));
      mockAppleSignInAsync.mockResolvedValue({
        identityToken: "apple-identity-token",
        fullName: null,
        email: null,
      });

      const service = makeService();
      const result = await service.signInWithProvider("apple");

      expect(mockAppleSignInAsync).toHaveBeenCalledTimes(1);
      expect(MockOAuthProvider).toHaveBeenCalledWith("apple.com");
      expect(mockOAuthProviderCredential).toHaveBeenCalledWith({
        idToken: "apple-identity-token",
        rawNonce: "test-raw-nonce-uuid",
      });
      expect(mockSignInWithSocialCredential).toHaveBeenCalledTimes(1);
      expect(result).toEqual(fakeSession);
    });

    it("throws when Apple returns no identity token", async () => {
      mockAppleSignInAsync.mockResolvedValue({ identityToken: null });

      const service = makeService();
      await expect(service.signInWithProvider("apple")).rejects.toThrow(
        "did not return an identity token"
      );
    });

    it("passes hashed nonce to Apple's signInAsync", async () => {
      mockAppleSignInAsync.mockResolvedValue({ identityToken: "apple-token" });
      MockOAuthProvider.mockImplementation(() => ({ credential: jest.fn(() => ({})) }));

      const service = makeService();
      await service.signInWithProvider("apple");

      const callArgs = mockAppleSignInAsync.mock.calls[0][0] as { nonce: string };
      expect(callArgs.nonce).toBe("hashed-nonce-sha256");
    });
  });

  // ── Facebook ───────────────────────────────────────────────────────────

  describe("Facebook sign-in", () => {
    it("throws a not-yet-available error", async () => {
      const service = makeService();
      await expect(service.signInWithProvider("facebook")).rejects.toThrow(
        "not yet available"
      );
    });
  });

  // ── maybeCompleteAuthSession ────────────────────────────────────────────

  it("does not call maybeCompleteAuthSession at module load (moved to screen)", () => {
    expect(ExpoWebBrowser.maybeCompleteAuthSession).not.toHaveBeenCalled();
  });
});

