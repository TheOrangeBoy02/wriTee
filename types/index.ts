// Journal entry type
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
}

// User settings type
export interface UserSettings {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  preferredJournalTime: string;
  reminderEnabled: boolean;
}

// User profile type matching Supabase schema
export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  phone_number: string;
  created_at: string;
  update_at: string;
  writing_streak: number;
  last_entry_date: string | null;
  monthly_goal: number;
}