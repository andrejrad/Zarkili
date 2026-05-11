import type { ExpoConfig } from "expo/config";

const APP_VARIANT = process.env.EXPO_PUBLIC_APP_VARIANT ?? "development";

const config: ExpoConfig = {
  name: APP_VARIANT === "production" ? "Zarkili" : "Zarkili Dev",
  slug: "zarkili",
  scheme: APP_VARIANT === "production" ? "zarkili" : "zarkili-dev",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  plugins: [
    "expo-font",
    "expo-apple-authentication",
    [
      "react-native-maps",
      {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
      }
    ],
    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier: "merchant.com.zarkili",
        enableGooglePay: false
      }
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#E3A9A0",
        defaultChannel: "default"
      }
    ]
  ],
  extra: {
    appVariant: APP_VARIANT,
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? ""
  }
};

export default config;
