import type { ExpoConfig } from "expo/config";

const APP_VARIANT = process.env.EXPO_PUBLIC_APP_VARIANT ?? "development";

const config: ExpoConfig = {
  name: APP_VARIANT === "production" ? "Zarkili" : "Zarkili Dev",
  slug: "zarkili",
  owner: "andrejrad",
  scheme: APP_VARIANT === "production" ? "zarkili" : "zarkili-dev",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  android: {
    package: APP_VARIANT === "production" ? "me.mogy.zarkili" : "me.mogy.zarkili.dev",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#FFFFFF",
    },
    config: {
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
      }
    }
  },
  ios: {
    bundleIdentifier: APP_VARIANT === "production" ? "me.mogy.zarkili" : "me.mogy.zarkili.dev",
    buildNumber: "2",
    supportsTablet: false,
    config: {
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      NSCameraUsageDescription: "Zarkili uses your camera to upload profile and salon photos.",
      NSPhotoLibraryUsageDescription: "Zarkili uses your photo library to upload profile and salon photos.",
      NSLocationWhenInUseUsageDescription: "Zarkili uses your location to find salons near you.",
      NSUserNotificationsUsageDescription: "Zarkili sends you booking reminders and promotional offers."
    }
  },
  plugins: [
    "expo-font",
    "expo-apple-authentication",
    [
      "expo-location",
      {
        locationWhenInUsePermission: "Zarkili needs your location to show beauty services near you."
      }
    ],

    [
      "@stripe/stripe-react-native",
      {
        merchantIdentifier: "merchant.me.mogy.zarkili",
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
    firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    eas: {
      projectId: "38c6b289-45b4-4b5c-9695-92ce0715486c"
    }
  }
};

export default config;
