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
      bundleIdentifier: "com.writee.app"
    },
    android: {
      package: "com.writee.app"
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/writee-logo.png"
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser"
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
      },
    }
  }
};