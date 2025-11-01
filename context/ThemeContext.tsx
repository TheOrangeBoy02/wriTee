import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import Colors from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeContextType {
  colors: typeof Colors;
  isDarkMode: boolean;
  setDarkMode: (enabled: boolean) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@writee_theme_preference';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load saved theme preference on mount
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      } else {
        // Default to system preference if no saved preference
        setIsDarkMode(systemColorScheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Fall back to system preference
      setIsDarkMode(systemColorScheme === 'dark');
    }
  };

  const setDarkMode = async (enabled: boolean) => {
    try {
      setIsDarkMode(enabled);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, enabled ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
      throw error;
    }
  };

  // TODO: Implement dark mode color palette
  // For now, we return the same colors regardless of dark mode
  // In the future, this can return a different color palette when isDarkMode is true
  const colors = Colors;

  const value: ThemeContextType = {
    colors,
    isDarkMode,
    setDarkMode,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
