import { supabase } from './supabase';
import { UserProfile } from '@/types';

export const authService = {
  async signUp(email: string, password: string, displayName?: string, phoneNumber?: string) {
    try {
      // First check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (existingUser) {
        throw new Error('An account with this email already exists');
      }

      // Create auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            phone_number: phoneNumber,
          },
        },
      });
      
      if (signUpError) throw signUpError;
      
      if (!data.user) {
        throw new Error('Failed to create user account');
      }
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: data.user.email,
          display_name: displayName || null,
          phone_number: phoneNumber || null,
          writing_streak: 0,
          monthly_goal: 30,
          created_at: new Date().toISOString(),
          update_at: new Date().toISOString(),
        });
      
      if (profileError) {
        // If profile creation fails, delete the auth user
        await supabase.auth.admin.deleteUser(data.user.id);
        throw new Error('Failed to create user profile: ' + profileError.message);
      }
      
      return data;
    } catch (error) {
      // Forward the error message
      throw error instanceof Error ? error : new Error('An unexpected error occurred');
    }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'myapp://',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      // Check if we have a valid OAuth response
      if (!data?.url) {
        throw new Error('No OAuth URL returned');
      }

      return data;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error instanceof Error ? error : new Error('Failed to sign in with Google');
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async getCurrentProfile(): Promise<UserProfile | null> {
    const user = await this.getCurrentUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(updates: Partial<UserProfile>) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        update_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateStreak(streak: number, lastEntryDate: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({
        writing_streak: streak,
        last_entry_date: lastEntryDate,
        update_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;
  },

  async updateMonthlyGoal(goal: number) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('profiles')
      .update({
        monthly_goal: goal,
        update_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;
  },

  async deleteAccount() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Delete profile first
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (profileError) throw profileError;

    // Then delete the auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    if (authError) throw authError;
  },

  onAuthStateChange(callback: (user: any) => void) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null);
    });
    return data.subscription;
  }
};