/**
 * socialAuthService.ts — W38-DEBT-5
 *
 * Orchestrates social provider OAuth flows on React Native / Expo and hands
 * the resulting Firebase AuthCredential to authRepository for sign-in.
 *
 * Supported:
 *   • Google  — expo-auth-session authorization-code + PKCE flow
 *   • Apple   — expo-apple-authentication (iOS only; no-op stub on other platforms)
 *   • Facebook — not yet implemented (requires FB Developer App registration)
 *
 * Callers must set EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID in the environment
 * to enable Google sign-in. Apple sign-in works without additional env vars
 * but requires "Sign In with Apple" to be enabled in the Apple Developer
 * portal and the iOS provisioning profile.
 */

import * as AuthSession from "expo-auth-session";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { GoogleAuthProvider, OAuthProvider, type AuthCredential } from "firebase/auth";

import type { AuthRepository } from "./repository";
import type { AuthSession as AuthSessionModel, SocialProvider } from "./model";

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

async function buildGoogleCredential(): Promise<AuthCredential> {
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "Google Sign-In is not configured. Set EXPO_PUBLIC_GOOGLE_OAUTH_WEB_CLIENT_ID in your environment."
    );
  }

  // makeRedirectUri without useProxy — use the app's native redirect URI.
  // Register this URI as an authorized redirect in the Google Cloud Console OAuth client.
  const redirectUri = AuthSession.makeRedirectUri({});

  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: ["openid", "profile", "email"],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY);

  if (result.type === "cancel" || result.type === "dismiss") {
    throw new Error("Google sign-in was cancelled.");
  }

  if (result.type !== "success") {
    throw new Error("Google sign-in failed. Please try again.");
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: result.params["code"] as string,
      redirectUri,
      extraParams: { code_verifier: request.codeVerifier ?? "" },
    },
    GOOGLE_DISCOVERY
  );

  const idToken = tokenResponse.idToken;
  if (!idToken) {
    throw new Error(
      "Google sign-in did not return an ID token. Ensure the openid scope is requested and your OAuth client is configured correctly."
    );
  }

  return GoogleAuthProvider.credential(idToken);
}

async function buildAppleCredential(): Promise<AuthCredential> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce
  );

  const appleResult = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  const { identityToken } = appleResult;
  if (!identityToken) {
    throw new Error("Apple sign-in did not return an identity token.");
  }

  const provider = new OAuthProvider("apple.com");
  // Firebase requires the raw (unhashed) nonce — it rehashes it internally
  // to verify against the hashed nonce sent to Apple.
  return provider.credential({ idToken: identityToken, rawNonce });
}

export type SocialAuthService = {
  signInWithProvider: (provider: SocialProvider) => Promise<AuthSessionModel>;
};

export function createSocialAuthService(authRepository: AuthRepository): SocialAuthService {
  return {
    async signInWithProvider(provider: SocialProvider): Promise<AuthSessionModel> {
      let credential: AuthCredential;

      switch (provider) {
        case "google":
          credential = await buildGoogleCredential();
          break;
        case "apple":
          credential = await buildAppleCredential();
          break;
        case "facebook":
          throw new Error(
            "Facebook sign-in is not yet available. Please use email or Google to sign in."
          );
        default: {
          const _exhaustive: never = provider;
          throw new Error(`Unknown social provider: ${_exhaustive as string}`);
        }
      }

      return authRepository.signInWithSocialCredential(credential);
    },
  };
}
