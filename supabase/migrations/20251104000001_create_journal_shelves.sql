-- Create junction table for many-to-many relationship between journal entries and shelves
CREATE TABLE journal_shelves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  shelf_id UUID NOT NULL REFERENCES shelves(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure a journal entry can't be added to the same shelf twice
  UNIQUE (journal_entry_id, shelf_id)
);

-- Enable Row Level Security
ALTER TABLE journal_shelves ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view journal-shelf associations for their own entries
CREATE POLICY "Users can view own journal shelves"
  ON journal_shelves
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM journal_entries
      WHERE journal_entries.id = journal_shelves.journal_entry_id
      AND journal_entries.user_id = auth.uid()
    )
  );

-- Policy: Users can insert journal-shelf associations for their own entries
CREATE POLICY "Users can insert own journal shelves"
  ON journal_shelves
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM journal_entries
      WHERE journal_entries.id = journal_shelves.journal_entry_id
      AND journal_entries.user_id = auth.uid()
    )
    AND
    EXISTS (
      SELECT 1 FROM shelves
      WHERE shelves.id = journal_shelves.shelf_id
      AND shelves.user_id = auth.uid()
    )
  );

-- Policy: Users can delete journal-shelf associations for their own entries
CREATE POLICY "Users can delete own journal shelves"
  ON journal_shelves
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM journal_entries
      WHERE journal_entries.id = journal_shelves.journal_entry_id
      AND journal_entries.user_id = auth.uid()
    )
  );

-- Create indexes for faster lookups
CREATE INDEX idx_journal_shelves_journal_entry_id ON journal_shelves(journal_entry_id);
CREATE INDEX idx_journal_shelves_shelf_id ON journal_shelves(shelf_id);
