import { UserSettings } from '@/types';
import { supabase } from './supabase';

// Simulated user data
const mockUserSettings: UserSettings = {
  notificationsEnabled: true,
  darkModeEnabled: false,
  preferredJournalTime: '21:00',
  reminderEnabled: true,
};

// Simulated delay to mimic network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get the current user's name
 */
export const getUsername = async (): Promise<string> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    if (!data?.display_name) return 'Writer'; // Default name if none set

    return data.display_name;
  } catch (error) {
    console.error('Error fetching username:', error);
    return 'Writer'; // Fallback name
  }
};


export const getUserStreak = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('writing_streak')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data?.writing_streak ?? 0;
  } catch (error) {
    console.error('Error fetching user streak:', error);
    return 0;
  }
};

/**
 * Get the user's app settings
 */
export const getUserSettings = async (): Promise<UserSettings> => {
  // Simulate API call
  await delay(600);
  
  return mockUserSettings;
};

/**
 * Update the user's app settings
 */
export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  // Simulate API call
  await delay(800);
  
  // In a real implementation, this would update settings in Firebase
  Object.assign(mockUserSettings, settings);
  
  return mockUserSettings;
};