/**
 * Utility functions shared across the application
 */

/**
 * Creates a promise that resolves after the specified time
 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates a user profile in Supabase
 */
export const createUserProfile = async (supabase: any, userId: string, email: string, displayName: string | null, phoneNumber: string | null) => {
  const { error } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      display_name: displayName,
      phone_number: phoneNumber,
      writing_streak: 0,
      monthly_goal: 30,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
};