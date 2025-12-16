// context/StreakContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getUserStreaks } from '@/services/user';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '@/services/supabase';

interface StreakContextType {
  currentStreak: number;
  bestStreak: number;
  isLoading: boolean;
  refreshStreaks: () => Promise<void>;
  updateStreaksLocally: (current: number, best: number) => void;
  showCelebration: (streakCount: number, isNewRecord?: boolean) => void;
  hideCelebration: () => void;
  celebrationData: { visible: boolean; streakCount: number; isNewRecord: boolean } | null;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ visible: boolean; streakCount: number; isNewRecord: boolean } | null>(null);

  // Fetch streaks from database
  const refreshStreaks = useCallback(async () => {
    // Only fetch if authenticated
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 StreakContext: Fetching latest streaks...');
      const { currentStreak: current, bestStreak: best } = await getUserStreaks();
      setCurrentStreak(current);
      setBestStreak(best);
      console.log('✅ StreakContext: Streaks updated:', { current, best });
    } catch (error) {
      console.error('❌ StreakContext: Error fetching streaks:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Update streaks locally (optimistic update)
  const updateStreaksLocally = useCallback((current: number, best: number) => {
    console.log('⚡ StreakContext: Local streak update:', { current, best });
    setCurrentStreak(current);
    setBestStreak(best);
  }, []);

  // Show celebration
  const showCelebration = useCallback((streakCount: number, isNewRecord = false) => {
    setCelebrationData({ visible: true, streakCount, isNewRecord });
  }, []);

  // Hide celebration
  const hideCelebration = useCallback(() => {
    setCelebrationData(null);
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      // If there's an error (like invalid refresh token), clear the session
      if (error) {
        console.log('StreakContext: Auth error detected, clearing session:', error.message);
        supabase.auth.signOut();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(!!user);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const authenticated = !!session?.user;
      setIsAuthenticated(authenticated);

      // Refresh streaks when user logs in
      if (authenticated && event === 'SIGNED_IN') {
        refreshStreaks();
      }

      // Reset streaks when user logs out
      if (!authenticated) {
        setCurrentStreak(0);
        setBestStreak(0);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Initial load when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshStreaks();
    }
  }, [isAuthenticated, refreshStreaks]);

  // Refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isAuthenticated) {
        console.log('📱 App became active, refreshing streaks...');
        refreshStreaks();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshStreaks, isAuthenticated]);

  const value: StreakContextType = {
    currentStreak,
    bestStreak,
    isLoading,
    refreshStreaks,
    updateStreaksLocally,
    showCelebration,
    hideCelebration,
    celebrationData,
  };

  return <StreakContext.Provider value={value}>{children}</StreakContext.Provider>;
};

// Custom hook for using streak context
export const useStreaks = () => {
  const context = useContext(StreakContext);
  if (context === undefined) {
    throw new Error('useStreaks must be used within a StreakProvider');
  }
  return context;
};