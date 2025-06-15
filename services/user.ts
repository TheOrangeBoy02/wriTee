import { UserSettings } from '@/types';
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    // If no settings exist yet, return defaults
    const defaults: UserSettings = {
      notificationsEnabled: true,
      darkModeEnabled: false,
      preferredJournalTime: '21:00',
      reminderEnabled: true,
    };

    // Create default settings in database
    await createDefaultSettings(user.id, defaults);
    return defaults;
  }

  return data;
};

/**
 * Update the user's app settings
 */
export const updateUserSettings = async (settings: UserSettings): Promise<UserSettings> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      ...settings,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Helper function to create default settings
const createDefaultSettings = async (userId: string, settings: UserSettings) => {
  const { error } = await supabase
    .from('user_settings')
    .insert({
      user_id: userId,
      ...settings,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
};