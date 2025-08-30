import { useEffect, useState } from 'react';
import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { authService } from '@/services/auth';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_700Bold,
  PlayfairDisplay_600SemiBold
} from '@expo-google-fonts/playfair-display';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  useFrameworkReady();
  const router = useRouter();
  const segments = useSegments();
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
    'Playfair-SemiBold': PlayfairDisplay_600SemiBold,
    'Playfair-Bold': PlayfairDisplay_700Bold,
  });

  // Check if it's first time launch
  useEffect(() => {
    const checkFirstTime = async () => {
      try {
        const hasLaunchedBefore = await AsyncStorage.getItem('hasLaunchedBefore');
        setIsFirstTime(hasLaunchedBefore === null);
      } catch (error) {
        console.error('Error checking first launch:', error);
        setIsFirstTime(true);
      }
    };

    checkFirstTime();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const { unsubscribe } = authService.onAuthStateChange((user) => {
      setIsAuthenticated(!!user);
      setIsInitializing(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle navigation based on app state
  useEffect(() => {
    if (isFirstTime === null || isAuthenticated === null || isInitializing) {
      return; // Still loading
    }

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (isFirstTime) {
      // First time: Welcome -> Login -> Home
      if (!inAuthGroup || segments[1] === 'login') {
        // If not in auth group, or specifically on login, go to welcome
        if (segments[1] !== 'WelcomeScreen') {
          router.replace('/(auth)/WelcomeScreen');
        }
      }
    } else {
      // Subsequent launches: Login -> Home (skip welcome)
      if (isAuthenticated) {
        if (!inTabsGroup) {
          router.replace('/(tabs)');
        }
      } else {
        if (!inAuthGroup || segments[1] !== 'login') {
          router.replace('/(auth)/login');
        }
      }
    }
  }, [isFirstTime, isAuthenticated, isInitializing, segments]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  // Show loading screen while checking app state
  if (isFirstTime === null || isAuthenticated === null || isInitializing) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="journal/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Page Not Found' }} />
      </Stack>
      <StatusBar style="auto" />
    </ErrorBoundary>
  );
}