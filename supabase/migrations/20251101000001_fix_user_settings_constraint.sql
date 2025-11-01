-- Quick fix for existing user_settings table
-- This adds missing columns if they don't exist without dropping the table

-- Add columns if they don't exist
DO $$
BEGIN
    -- Add notifications_enabled if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'notifications_enabled'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
    END IF;

    -- Add dark_mode_enabled if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'dark_mode_enabled'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN dark_mode_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Add preferred_journal_time if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'preferred_journal_time'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN preferred_journal_time TEXT DEFAULT '21:00';
    END IF;

    -- Add reminder_enabled if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_settings' AND column_name = 'reminder_enabled'
    ) THEN
        ALTER TABLE user_settings ADD COLUMN reminder_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

-- Recreate policies
CREATE POLICY "Users can view own settings"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Ensure trigger function exists
CREATE OR REPLACE FUNCTION update_user_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_user_settings_timestamp ON user_settings;
CREATE TRIGGER update_user_settings_timestamp
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_user_settings_timestamp();
