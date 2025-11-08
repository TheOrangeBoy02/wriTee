// app/_layout.tsx

import { useEffect, useState } from 'react';
import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { authService } from '@/services/auth';
import { supabase } from '@/services/supabase';
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
import { StreakProvider, useStreaks } from '@/context/StreakContext';
import { ThemeProvider } from '@/context/ThemeContext';
import StreakCelebration from '@/components/StreakCelebration';

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

  // Handle deep links for password reset and OAuth
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const url = event.url;
      console.log('🔗 Deep link received:', url);

      // Parse the URL
      const { path, queryParams } = Linking.parse(url);

      // Check if it's a password reset link
      // Handle both exp:// (Expo Go) and writee:// (production) schemes
      if (path === 'reset-password' ||
          path === '--/reset-password' ||  // Expo Go format
          url.includes('type=recovery')) {
        console.log('🔐 Password reset link detected');

        // Extract hash fragments if they exist (for Supabase auth)
        const hashParams = url.split('#')[1];
        if (hashParams) {
          // Create a URL object to parse hash parameters
          const params = new URLSearchParams(hashParams);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          const type = params.get('type');

          if (accessToken && type === 'recovery') {
            console.log('✅ Setting recovery session from deep link');

            // Set the session in Supabase
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            // Navigate to reset password screen
            router.push('/(auth)/reset-password');
          }
        } else {
          // Just navigate if no hash params (session might already be set)
          router.push('/(auth)/reset-password');
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [router]);

  useEffect(() => {
    if (isFirstTime === null || isAuthenticated === null || isInitializing) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';
    const isOnWelcomeScreen = segments[1] === 'WelcomeScreen';
    const isOnLoginScreen = segments[1] === 'login';
    const isOnSignupScreen = segments[1] === 'signup';
    const isOnForgotPasswordScreen = segments[1] === 'forgot-password';
    const isOnResetPasswordScreen = segments[1] === 'reset-password';

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
        if (!isOnWelcomeScreen && !isOnLoginScreen && !isOnSignupScreen && !isOnForgotPasswordScreen && !isOnResetPasswordScreen) {
          router.replace('/(auth)/WelcomeScreen');
        }
      } else {
        if (!isOnLoginScreen && !isOnSignupScreen && !isOnForgotPasswordScreen && !isOnResetPasswordScreen) {
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
        <ThemeProvider>
          <StreakProvider>
            <AppContent />
          </StreakProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

function AppContent() {
  const { celebrationData, hideCelebration } = useStreaks();
  const router = useRouter();

  const handleNavigateToJournal = () => {
    // Use replace to avoid navigation stack issues when modal is dismissing
    router.replace('/(tabs)/journal');
  };

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Ensure every screen returns only <View> or <Text>, not raw strings */}
      </Stack>
      <StatusBar style="auto" />
      {celebrationData && (
        <StreakCelebration
          visible={celebrationData.visible}
          streakCount={celebrationData.streakCount}
          isNewRecord={celebrationData.isNewRecord}
          onComplete={hideCelebration}
          onNavigateToJournal={handleNavigateToJournal}
        />
      )}
    </>
  );
}
