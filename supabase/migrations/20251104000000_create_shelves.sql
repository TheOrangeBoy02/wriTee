-- Create shelves table for organizing journal entries
CREATE TABLE shelves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT, -- Optional color for visual identification (hex code or color name)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique shelf names per user
  UNIQUE (user_id, name)
);

-- Enable Row Level Security
ALTER TABLE shelves ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own shelves
CREATE POLICY "Users can view own shelves"
  ON shelves
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own shelves
CREATE POLICY "Users can insert own shelves"
  ON shelves
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own shelves
CREATE POLICY "Users can update own shelves"
  ON shelves
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own shelves
CREATE POLICY "Users can delete own shelves"
  ON shelves
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_shelves_user_id ON shelves(user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shelves_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_shelves_timestamp
  BEFORE UPDATE ON shelves
  FOR EACH ROW
  EXECUTE FUNCTION update_shelves_timestamp();
