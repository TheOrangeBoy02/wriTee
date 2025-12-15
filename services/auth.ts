import { supabase } from './supabase';
import { UserProfile } from '@/types';
import { createUserProfile } from '@/utils/common';
import { clearJournalCache } from './journal';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      
      // Create profile using shared utility
      try {
        await createUserProfile(supabase, data.user.id, data.user.email!, displayName || null, phoneNumber || null);
      } catch (profileError: any) {
        // If profile creation fails, delete the auth user
        await supabase.auth.admin.deleteUser(data.user.id);
        throw new Error('Failed to create user profile: ' + (profileError.message || 'Unknown error'));
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
      console.log('🔐 Starting Google OAuth flow...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'writee://',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('❌ OAuth error:', error);
        throw error;
      }

      if (!data?.url) {
        throw new Error('No OAuth URL returned');
      }

      console.log('✅ OAuth URL generated:', data.url);

      // NOTE: Don't check session here - it will be set by the deep link handler
      // after the OAuth flow completes and the app receives the callback URL

      return data;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error instanceof Error ? error : new Error('Failed to sign in with Google');
    }
  },

  // Helper method to handle OAuth callback and create profile if needed
  async handleOAuthCallback(userId: string, email: string, fullName?: string) {
    try {
      console.log('🔐 Handling OAuth callback for user:', email);

      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingProfile) {
        console.log('📝 Creating new profile for OAuth user');
        // Create new profile using shared utility
        await createUserProfile(
          supabase,
          userId,
          email,
          fullName || email.split('@')[0],
          null
        );
        console.log('✅ Profile created successfully');
      } else {
        console.log('✅ Profile already exists');
      }
    } catch (error) {
      console.error('❌ Error handling OAuth callback:', error);
      throw error;
    }
  },

  async signOut() {
    // Clear all caches before signing out to prevent data leakage
    clearJournalCache();

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async resetPassword(email: string) {
    // For now, use writee:// for all environments
    // Supabase will handle the redirect to the registered URL
    const redirectTo = 'writee://reset-password';

    console.log('🔐 Password reset redirect URL:', redirectTo);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        console.error('❌ Password reset error:', error);
        throw error;
      }

      console.log('✅ Password reset email sent successfully');
    } catch (error: any) {
      console.error('❌ Failed to send password reset email:', error);
      throw error;
    }
  },

  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
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
        updated_at: new Date().toISOString(),
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
        updated_at: new Date().toISOString(),
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) throw error;
  },

  async deleteAccount() {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Clear all caches before deleting
    clearJournalCache();

    // Call Edge Function to delete both profile AND auth user
    const { data: session } = await supabase.auth.getSession();
    const { error } = await supabase.functions.invoke('delete-account', {
      headers: {
        Authorization: `Bearer ${session.session?.access_token}`,
      },
    });

    if (error) throw error;

    // Force complete session clearing
    await supabase.auth.signOut();

    // Manually clear ALL Supabase-related keys from AsyncStorage
    try {
      const keys = await AsyncStorage.getAllKeys();
      const supabaseKeys = keys.filter(key =>
        key.includes('supabase') ||
        key.includes('sb-') ||
        key.includes('auth')
      );
      if (supabaseKeys.length > 0) {
        await AsyncStorage.multiRemove(supabaseKeys);
      }
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
      // Don't throw - we still want to proceed
    }
  },

  onAuthStateChange(callback: (user: any) => void) {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
    return data.subscription;
  }
};