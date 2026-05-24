type FirebaseAuthLikeError = Error & { code: string };

const firebaseCodeMessages: Record<string, string> = {
  "auth/email-already-in-use": "This email is already registered. Try logging in instead.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/invalid-email": "Please enter a valid email address.",
  "auth/operation-not-allowed": "Email sign-up is currently disabled. Please contact support.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/wrong-password": "Incorrect password.",
  "auth/user-not-found": "No account found with this email.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/network-request-failed": "Network error. Please check your connection and try again.",
  "auth/invalid-credential": "Invalid email or password.",
  "auth/requires-recent-login": "For security, please log in again before changing your email.",
  "auth/account-exists-with-different-credential": "An account already exists with the same email but with a different sign-in method.",
  "auth/credential-already-in-use": "This credential is already associated with a different user account.",
  "auth/popup-closed-by-user": "Sign-in was cancelled.",
  "auth/cancelled-popup-request": "Sign-in was cancelled.",
};

export function isFirebaseAuthError(error: unknown): error is FirebaseAuthLikeError {
  if (error instanceof Error && typeof (error as { code?: unknown }).code === "string") {
    return true;
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    return typeof (error as { code?: unknown }).code === "string";
  }

  return false;
}

export function getFriendlyFirebaseAuthMessage(error: unknown): string | null {
  if (!isFirebaseAuthError(error)) {
    return null;
  }

  const maybeMessage =
    typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : null;

  return firebaseCodeMessages[error.code] ?? maybeMessage ?? null;
}

export function toUserFacingAuthError(error: unknown, fallbackMessage: string): Error {
  const friendlyMessage = getFriendlyFirebaseAuthMessage(error);
  if (friendlyMessage) {
    const wrapped = new Error(friendlyMessage);
    (wrapped as { code?: string }).code = (error as { code?: string })?.code;
    return wrapped;
  }

  if (error instanceof Error) {
    return new Error(error.message);
  }

  return new Error(fallbackMessage);
}
