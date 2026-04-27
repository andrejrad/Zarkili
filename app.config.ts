import type { ExpoConfig } from "expo/config";

const APP_VARIANT = process.env.EXPO_PUBLIC_APP_VARIANT ?? "development";

const config: ExpoConfig = {
  name: APP_VARIANT === "production" ? "Zarkili" : "Zarkili Dev",
  slug: "zarkili",
  scheme: APP_VARIANT === "production" ? "zarkili" : "zarkili-dev",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  plugins: ["expo-font"],
  extra: {
    appVariant: APP_VARIANT,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? ""
  }
};

export default config;
