import { UserSettings, Profile } from '@/types';
import { supabase } from './supabase';

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
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // For now, use localStorage/AsyncStorage as fallback until user_settings table is created
    const defaults: UserSettings = {
      notificationsEnabled: true,
      darkModeEnabled: false,
      preferredJournalTime: '21:00',
      reminderEnabled: true,
    };

    // Try to get from database first
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      // If no settings exist for this user, return defaults
      console.log('No settings found for user, using defaults:', error.message);
      return defaults;
    }

    // Map database columns to interface
    if (data) {
      return {
        notificationsEnabled: data.notifications_enabled ?? defaults.notificationsEnabled,
        darkModeEnabled: data.dark_mode_enabled ?? defaults.darkModeEnabled,
        preferredJournalTime: data.preferred_journal_time ?? defaults.preferredJournalTime,
        reminderEnabled: data.reminder_enabled ?? defaults.reminderEnabled,
      };
    }

    return defaults;
  } catch (error) {
    console.error('Unexpected error loading settings:', error);
    // Return defaults if anything fails
    return {
      notificationsEnabled: true,
      darkModeEnabled: false,
      preferredJournalTime: '21:00',
      reminderEnabled: true,
    };
  }
};

/**
 * Update the user's app settings
 */
export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Try to update in database
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        notifications_enabled: settings.notificationsEnabled,
        dark_mode_enabled: settings.darkModeEnabled,
        preferred_journal_time: settings.preferredJournalTime,
        reminder_enabled: settings.reminderEnabled,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save settings to database:', error.message);
      // Return the settings anyway so UI updates
      return settings;
    }

    // Map the database response back to our interface
    if (data) {
      return {
        notificationsEnabled: data.notifications_enabled,
        darkModeEnabled: data.dark_mode_enabled,
        preferredJournalTime: data.preferred_journal_time,
        reminderEnabled: data.reminder_enabled,
      };
    }
    
    return settings;
  } catch (error) {
    console.error('Unexpected error updating settings:', error);
    // Return the settings anyway so UI doesn't break
    return settings;
  }
};

// Helper function to create default settings
const createDefaultSettings = async (userId: string, settings: UserSettings) => {
  try {
    const { error } = await supabase
      .from('user_settings')
      .insert({
        user_id: userId,
        notifications_enabled: settings.notificationsEnabled,
        dark_mode_enabled: settings.darkModeEnabled,
        preferred_journal_time: settings.preferredJournalTime,
        reminder_enabled: settings.reminderEnabled,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Could not create default settings:', error.message);
    }
  } catch (error) {
    console.error('Error creating default settings:', error);
  }
};

export const updateUserProfile = async (profile: Partial<Profile>): Promise<Profile> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...profile,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserProfile = async (): Promise<Profile | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
};

export const updateWritingStreak = async (streak: number): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ 
      writing_streak: streak,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) throw error;
};

export const updateLastEntryDate = async (date: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ 
      last_entry_date: date,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) throw error;
};

export const updateMonthlyGoal = async (goal: number): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ 
      monthly_goal: goal,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) throw error;
};

export const updatePhoneNumber = async (phoneNumber: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('profiles')
    .update({ 
      phone_number: phoneNumber,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id);

  if (error) throw error;
};