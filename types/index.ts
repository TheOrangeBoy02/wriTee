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

// Shelf type
export interface Shelf {
  id: string;
  user_id: string;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

// Journal-Shelf junction type
export interface JournalShelf {
  id: string;
  journal_entry_id: string;
  shelf_id: string;
  created_at: string;
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
  pinned: boolean;
  shelves?: Shelf[]; // Optional array of shelves attached to this entry
}

// User settings type
export interface UserSettings {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  preferredJournalTime: string;
  reminderEnabled: boolean;
}