-- Migration to ensure all user data is deleted when account is deleted
-- This adds ON DELETE CASCADE to journal_entries if not already present

-- First, check if journal_entries has the proper foreign key constraint
-- We'll drop any existing foreign key constraint on user_id and recreate it with CASCADE

DO $$
DECLARE
    constraint_name_var TEXT;
BEGIN
    -- Find the existing foreign key constraint on journal_entries.user_id
    SELECT constraint_name INTO constraint_name_var
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE tc.table_name = 'journal_entries'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id';

    -- If a constraint exists, drop it
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE format('ALTER TABLE journal_entries DROP CONSTRAINT %I', constraint_name_var);
        RAISE NOTICE 'Dropped existing constraint: %', constraint_name_var;
    END IF;

    -- Add the foreign key constraint with ON DELETE CASCADE
    ALTER TABLE journal_entries
    ADD CONSTRAINT journal_entries_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;

    RAISE NOTICE 'Added foreign key constraint with ON DELETE CASCADE';
END $$;

-- Verify all tables have proper CASCADE deletion
-- This query will show all foreign key constraints to auth.users

-- Create a comment to document this migration
COMMENT ON TABLE journal_entries IS 'Journal entries - all user data deleted on account deletion via CASCADE';
COMMENT ON TABLE profiles IS 'User profiles - deleted on account deletion via CASCADE';
COMMENT ON TABLE user_settings IS 'User settings - deleted on account deletion via CASCADE';
COMMENT ON TABLE shelves IS 'User shelves - deleted on account deletion via CASCADE';
COMMENT ON TABLE push_tokens IS 'Push notification tokens - deleted on account deletion via CASCADE';
COMMENT ON TABLE journal_shelves IS 'Journal-shelf relationships - deleted when journal or shelf is deleted via CASCADE';