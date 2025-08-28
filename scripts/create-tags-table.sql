-- Create tags table migration
-- Run this in your Supabase SQL editor

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#8B5CF6', -- Default purple color
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0,
    
    -- Ensure tag names are unique per user
    UNIQUE(user_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own tags" ON tags
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags" ON tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags" ON tags
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags" ON tags
    FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tags_updated_at();

-- Create junction table for journal_entries and tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS journal_entry_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique combinations
    UNIQUE(journal_entry_id, tag_id)
);

-- Create indexes for junction table
CREATE INDEX IF NOT EXISTS idx_journal_entry_tags_entry_id ON journal_entry_tags(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entry_tags_tag_id ON journal_entry_tags(tag_id);

-- Enable RLS for junction table
ALTER TABLE journal_entry_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for junction table
CREATE POLICY "Users can manage their own journal entry tags" ON journal_entry_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM journal_entries 
            WHERE journal_entries.id = journal_entry_tags.journal_entry_id 
            AND journal_entries.user_id = auth.uid()
        )
    );

-- Optional: Migrate existing tags from journal_entries table
-- Uncomment and run this if you have existing tags in the tags column of journal_entries
/*
DO $$ 
DECLARE
    entry_record RECORD;
    tag_name TEXT;
    tag_id UUID;
    existing_tag_id UUID;
BEGIN
    -- Loop through all journal entries that have tags
    FOR entry_record IN 
        SELECT id, user_id, tags 
        FROM journal_entries 
        WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
    LOOP
        -- Loop through each tag in the entry
        FOREACH tag_name IN ARRAY entry_record.tags
        LOOP
            -- Check if tag already exists for this user
            SELECT id INTO existing_tag_id
            FROM tags 
            WHERE user_id = entry_record.user_id AND name = tag_name;
            
            -- If tag doesn't exist, create it
            IF existing_tag_id IS NULL THEN
                INSERT INTO tags (user_id, name, usage_count)
                VALUES (entry_record.user_id, tag_name, 1)
                RETURNING id INTO tag_id;
            ELSE
                -- Update usage count
                UPDATE tags 
                SET usage_count = usage_count + 1 
                WHERE id = existing_tag_id;
                tag_id := existing_tag_id;
            END IF;
            
            -- Create junction table entry
            INSERT INTO journal_entry_tags (journal_entry_id, tag_id)
            VALUES (entry_record.id, tag_id)
            ON CONFLICT (journal_entry_id, tag_id) DO NOTHING;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Successfully migrated existing tags to new tags table';
END $$;
*/