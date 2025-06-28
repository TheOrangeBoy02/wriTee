// User type
export interface User {
  id: number;
  created_at: string;
}

// Profile type matching Supabase schema
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  created_at: string;
  updated_at: string;
  writing_streak: number;
  last_entry_date: string | null;
  monthly_goal: number;
  phone_number: string | null;
}
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string | null;
  phone_number?: string | null;
  writing_streak?: number;
  last_entry_date?: string;
  monthly_goal?: number;
  updated_at?: string;
 
}

// Journal entry type
export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  entry_date: string;
}

// User settings type
export interface UserSettings {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  preferredJournalTime: string;
  reminderEnabled: boolean;
}