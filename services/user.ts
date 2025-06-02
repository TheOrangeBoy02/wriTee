import { UserSettings } from '@/types';

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
  // Simulate API call
  await delay(300);
  
  return 'Jane';
};

/**
 * Get the current user's streak
 */
export const getUserStreak = async (): Promise<number> => {
  // Simulate API call
  await delay(500);
  
  return 7; // Mock streak count
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