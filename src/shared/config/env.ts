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

// Read all EXPO_PUBLIC_* vars using string literals so Metro/Babel can inline
// them at build time. Dynamic `process.env[variableName]` access is NOT
// statically replaced and evaluates to undefined on web (no process.env at
// runtime in the browser).
const RAW: Record<RequiredEnvKey, string | undefined> = {
  EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function requireEnvVar(name: RequiredEnvKey): string {
  const value = RAW[name];
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
    appId: requireEnvVar("EXPO_PUBLIC_FIREBASE_APP_ID"),
  },
};
