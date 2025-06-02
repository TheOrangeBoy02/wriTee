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

// User type
export interface User {
  id: string;
  name: string;
  email: string;
}