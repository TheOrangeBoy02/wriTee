-- Create push_tokens table for storing Expo push tokens
CREATE TABLE push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
  device_name TEXT,
  app_version TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique token per user+device combination
  UNIQUE (user_id, push_token)
);

-- Enable Row Level Security
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tokens
CREATE POLICY "Users can view own push tokens"
  ON push_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own tokens
CREATE POLICY "Users can insert own push tokens"
  ON push_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own tokens
CREATE POLICY "Users can update own push tokens"
  ON push_tokens
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own tokens
CREATE POLICY "Users can delete own push tokens"
  ON push_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for faster lookups
CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX idx_push_tokens_active ON push_tokens(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_push_tokens_token ON push_tokens(push_token);

-- Function to auto-update timestamp
CREATE OR REPLACE FUNCTION update_push_tokens_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_push_tokens_timestamp
  BEFORE UPDATE ON push_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_push_tokens_timestamp();

-- Function to clean up old inactive tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_push_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM push_tokens
  WHERE is_active = false
  AND updated_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
