-- Add pinned column to journal_entries table
ALTER TABLE journal_entries 
ADD pinned BOOLEAN DEFAULT false;

-- Update existing entries to have pinned=false
UPDATE journal_entries 
SET pinned = false 
WHERE pinned IS NULL;