// context/StreakContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getUserStreaks } from '@/services/user';
import { AppState, AppStateStatus } from 'react-native';

interface StreakContextType {
  currentStreak: number;
  bestStreak: number;
  isLoading: boolean;
  refreshStreaks: () => Promise<void>;
  updateStreaksLocally: (current: number, best: number) => void;
}

const StreakContext = createContext<StreakContextType | undefined>(undefined);

export const StreakProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch streaks from database
  const refreshStreaks = useCallback(async () => {
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
  }, []);

  // Update streaks locally (optimistic update)
  const updateStreaksLocally = useCallback((current: number, best: number) => {
    console.log('⚡ StreakContext: Local streak update:', { current, best });
    setCurrentStreak(current);
    setBestStreak(best);
  }, []);

  // Initial load
  useEffect(() => {
    refreshStreaks();
  }, [refreshStreaks]);

  // Refresh when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active, refreshing streaks...');
        refreshStreaks();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [refreshStreaks]);

  const value: StreakContextType = {
    currentStreak,
    bestStreak,
    isLoading,
    refreshStreaks,
    updateStreaksLocally,
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