type AppEnv = {
  appVariant: "development" | "production";
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
};

type RequiredEnvKey =
  | "EXPO_PUBLIC_FIREBASE_API_KEY"
  | "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
  | "EXPO_PUBLIC_FIREBASE_PROJECT_ID"
  | "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"
  | "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
  | "EXPO_PUBLIC_FIREBASE_APP_ID";

function requireEnvVar(name: RequiredEnvKey): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env: AppEnv = {
  appVariant: process.env.EXPO_PUBLIC_APP_VARIANT === "production" ? "production" : "development",
  firebase: {
    apiKey: requireEnvVar("EXPO_PUBLIC_FIREBASE_API_KEY"),
    authDomain: requireEnvVar("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
    projectId: requireEnvVar("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
    storageBucket: requireEnvVar("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: requireEnvVar("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
    appId: requireEnvVar("EXPO_PUBLIC_FIREBASE_APP_ID")
  }
};
