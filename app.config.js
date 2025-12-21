// app.config.js
import 'dotenv/config';

export default {
  expo: {
    name: "writee",
    slug: "writee",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/writee-logo.png",
    scheme: "writee",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.writee.app",
      buildNumber: "1.0.0",
      infoPlist: {
        UIBackgroundModes: ["remote-notification"]
      },
      googleServicesFile: "./ios/GoogleService-Info.plist"
    },
    android: {
      package: "com.writee.app",
      versionCode: 6,
      googleServicesFile: "./android/app/google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/images/writee-logo.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/writee-logo.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "expo-notifications",
        {
          icon: "./assets/images/writee-logo.png",
          color: "#af1dbf",
          sounds: ["./assets/sounds/notification.wav"],
          mode: "production"
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      router: {},
      eas: {
        projectId: "53039e10-fc7a-4cf6-b394-8b1b70b6da8c"
      }
    }
  }
};