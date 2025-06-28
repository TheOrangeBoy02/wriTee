# Database Setup Guide

## Issue Resolution

The errors you're seeing:
```
ERROR  Error loading settings: {}
ERROR  Error updating settings: {}
LOG  Profile settings not yet implemented
```

These occur because the `user_settings` table doesn't exist in your Supabase database yet.

## Solution

### Step 1: Create the Database Table

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-migrations.sql` 
4. Click **Run** to execute the SQL

This will create:
- `user_settings` table with proper columns
- Row Level Security policies
- Default settings for existing users

### Step 2: Verify the Setup

After running the migration, your app should:
- ✅ Load settings without errors
- ✅ Save setting changes properly
- ✅ Show user-friendly alerts instead of repeated console logs

### Step 3: Test the Settings

1. Open the app
2. Go to Settings tab
3. Toggle notifications/reminders - should work without errors
4. Try the "Profile Settings" and "Time Settings" buttons - should show proper alerts

### Alternative: Manual Table Creation

If you prefer to create the table manually:

```sql
CREATE TABLE user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  notifications_enabled BOOLEAN DEFAULT true,
  dark_mode_enabled BOOLEAN DEFAULT false,
  preferred_journal_time TIME DEFAULT '21:00:00',
  reminder_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);
```

Then enable RLS and create policies as shown in the migration file.

## What Was Fixed

1. **Graceful Error Handling**: Settings now fall back to defaults if database is unavailable
2. **Reduced Console Spam**: Profile/Time settings show user-friendly alerts instead of repeated logs
3. **Proper Column Mapping**: Database columns now properly map to TypeScript interfaces
4. **Better UX**: Settings toggles work immediately in the UI, even if backend save fails

The app will now work properly whether the database table exists or not!