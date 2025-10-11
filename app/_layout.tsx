// app/_layout.tsx

import { useEffect, useState } from 'react';
import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text } from 'react-native';
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
import { StreakProvider } from '@/context/StreakContext';

SplashScreen.preventAutoHideAsync();
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
    'ComforterBrush_400Regular': require('@/assets/fonts/ComforterBrush-Regular.ttf'),
    'FleurDeLeah_400Regular': require('@/assets/fonts/FleurDeLeah-Regular.ttf'),
  });

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

  useEffect(() => {
    const { unsubscribe } = authService.onAuthStateChange((user) => {
      console.log('Auth state changed:', !!user);
      setIsAuthenticated(!!user);
      setIsInitializing(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isFirstTime === null || isAuthenticated === null || isInitializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isOnWelcomeScreen = segments[1] === 'WelcomeScreen';
    const isOnLoginScreen = segments[1] === 'login';
    const isOnSignupScreen = segments[1] === 'signup';

    console.log('Navigation check:', {
      segments,
      isFirstTime,
      isAuthenticated,
      inAuthGroup,
      inTabsGroup,
      currentScreen: segments[1],
    });

    if (isAuthenticated && !inTabsGroup) {
      try {
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Navigation error:', error);
        router.replace('/');
      }
      return;
    }

    if (!isAuthenticated) {
      if (isFirstTime) {
        if (!isOnWelcomeScreen && !isOnLoginScreen && !isOnSignupScreen) {
          router.replace('/(auth)/WelcomeScreen');
        }
      } else {
        if (!isOnLoginScreen && !isOnSignupScreen) {
          router.replace('/(auth)/login');
        }
      }
    }
  }, [isFirstTime, isAuthenticated, isInitializing, segments, router]);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Safeguard: render null while initializing or fonts are loading
  if (!fontsLoaded && !fontError) return null;
  if (isFirstTime === null || isAuthenticated === null || isInitializing) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <StreakProvider>
          <Stack screenOptions={{ headerShown: false }}>
            {/* Ensure every screen returns only <View> or <Text>, not raw strings */}
          </Stack>
          <StatusBar style="auto" />
        </StreakProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}
