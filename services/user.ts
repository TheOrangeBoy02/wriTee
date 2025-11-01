// services/user.ts
import { UserSettings, Profile } from '@/types';
import { supabase } from './supabase';

// ====================================
// NEW: Atomic Streak Update via RPC
// ====================================

/**
 * Response type for the update_user_streaks RPC function
 */
interface UpdateStreaksResponse {
  success: boolean;
  current_streak: number;
  best_streak: number;
  is_new_record: boolean;
}

/**
 * Atomically update user streaks using a single database transaction
 * This replaces the old three-call approach for better data consistency
 * 
 * @param userId - The user's UUID
 * @param currentStreak - Current writing streak count
 * @param bestStreak - Calculated best streak (will only update if greater than DB value)
 * @param lastEntryDate - Date of the most recent entry (YYYY-MM-DD format)
 * @returns Promise with update results
 */
export const updateUserStreaks = async (
  userId: string,
  currentStreak: number,
  bestStreak: number,
  lastEntryDate: string
): Promise<UpdateStreaksResponse> => {
  try {
    console.log('🔄 updateUserStreaks: Calling RPC with:', {
      userId,
      currentStreak,
      bestStreak,
      lastEntryDate
    });

    const { data, error } = await supabase.rpc('update_user_streaks', {
      p_user_id: userId,
      p_current_streak: currentStreak,
      p_best_streak: bestStreak,
      p_last_entry_date: lastEntryDate
    });

    if (error) {
      console.error('❌ updateUserStreaks: RPC error:', error);
      throw error;
    }

    console.log('✅ updateUserStreaks: RPC success:', data);
    return data;
    
  } catch (error) {
    console.error('❌ updateUserStreaks: Failed to update streaks:', error);
    throw error;
  }
};

/**
 * Get the current user's ID
 * Helper function used by streak operations
 */
export const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }
  
  return user.id;
};

// ====================================
// Existing User Functions
// ====================================

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

/**
 * Get the user's current and best writing streaks
 */
/**
 * Get the user's current and best writing streaks
 * Validates that the current streak is still active based on last_entry_date
 */
export const getUserStreaks = async (): Promise<{ currentStreak: number; bestStreak: number }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('📊 getUserStreaks: Fetching streaks for user:', user.id);

    const { data, error } = await supabase
      .from('profiles')
      .select('writing_streak, best_streak, last_entry_date')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('📊 getUserStreaks: Database error:', error);
      throw error;
    }
    
    console.log('📊 getUserStreaks: Raw database result:', data);
    
    let currentStreak = data?.writing_streak ?? 0;
    const bestStreak = data?.best_streak ?? 0;
    
    // Validate streak freshness - streak is only valid if last entry was today or yesterday
    if (data?.last_entry_date && currentStreak > 0) {
      const lastEntry = new Date(data.last_entry_date + 'T00:00:00');
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      // If last entry is older than yesterday, streak is broken
      if (lastEntry < yesterday) {
        console.log('📊 getUserStreaks: Streak expired! Last entry:', data.last_entry_date);
        currentStreak = 0;
        
        // Update database to reflect broken streak
        // Using fire-and-forget to not block the return
        supabase
          .from('profiles')
          .update({ 
            writing_streak: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .then(
            () => console.log('📊 getUserStreaks: Reset expired streak in database'),
            (err) => console.error('📊 getUserStreaks: Failed to reset streak:', err)
          );}
    }
    
    console.log('📊 getUserStreaks: Validated streaks:', { currentStreak, bestStreak });
    return { currentStreak, bestStreak };
    
  } catch (error) {
    console.error('Error fetching user streaks:', error);
    return { currentStreak: 0, bestStreak: 0 };
  }
};

/**
 * Get the user's best writing streak
 */
export const getUserBestStreak = async (): Promise<number> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    console.log('🏆 getUserBestStreak: Fetching best streak for user:', user.id);

    const { data, error } = await supabase
      .from('profiles')
      .select('best_streak')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('🏆 getUserBestStreak: Database error:', error);
      throw error;
    }
    
    const bestStreak = data?.best_streak ?? 0;
    console.log('🏆 getUserBestStreak: Best streak value:', bestStreak);
    
    return bestStreak;
  } catch (error) {
    console.error('Error fetching best streak:', error);
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

    const defaults: UserSettings = {
      notificationsEnabled: true,
      darkModeEnabled: false,
      preferredJournalTime: '21:00',
      reminderEnabled: true,
    };

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.log('No settings found for user, using defaults:', error.message);
      return defaults;
    }

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

    // Use upsert with onConflict to handle existing records
    const { data, error } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          notifications_enabled: settings.notificationsEnabled,
          dark_mode_enabled: settings.darkModeEnabled,
          preferred_journal_time: settings.preferredJournalTime,
          reminder_enabled: settings.reminderEnabled,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id', // Specify the conflict column
          ignoreDuplicates: false, // Update on conflict instead of ignoring
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save settings to database:', error.message, error);
      return settings;
    }

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
    return settings;
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

// ====================================
// DEPRECATED: Individual Streak Updates
// These are kept for backward compatibility but should be replaced with updateUserStreaks()
// ====================================

/**
 * @deprecated Use updateUserStreaks() for atomic updates
 * Update the user's current writing streak
 */
export const updateWritingStreak = async (streak: number): Promise<void> => {
  console.warn('⚠️ updateWritingStreak is deprecated. Use updateUserStreaks() instead.');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('💾 updateWritingStreak: Updating streak for user:', user.id, 'to value:', streak);

  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      writing_streak: streak,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select('writing_streak');

  if (error) {
    console.error('💾 updateWritingStreak: Database error:', error);
    throw error;
  }

  console.log('💾 updateWritingStreak: Database update result:', data);
  console.log('💾 updateWritingStreak: Streak successfully updated to:', streak);
};

/**
 * @deprecated Use updateUserStreaks() for atomic updates
 * Update the user's best writing streak (all-time record)
 */
export const updateBestStreak = async (streak: number): Promise<void> => {
  console.warn('⚠️ updateBestStreak is deprecated. Use updateUserStreaks() instead.');
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  console.log('🏆 updateBestStreak: Updating best streak for user:', user.id, 'to value:', streak);

  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      best_streak: streak,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select('best_streak');

  if (error) {
    console.error('🏆 updateBestStreak: Database error:', error);
    throw error;
  }

  console.log('🏆 updateBestStreak: Database update result:', data);
  console.log('🏆 updateBestStreak: Best streak successfully updated to:', streak);
};

/**
 * @deprecated Use updateUserStreaks() for atomic updates
 * Update the last entry date
 */
export const updateLastEntryDate = async (date: string): Promise<void> => {
  console.warn('⚠️ updateLastEntryDate is deprecated. Use updateUserStreaks() instead.');
  
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