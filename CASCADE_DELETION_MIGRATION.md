# Account Deletion with Cascade - Migration Guide

## Overview
This migration ensures that when a user deletes their account, **ALL** their associated data is automatically deleted from the database. This includes:

- ✓ Journal entries
- ✓ User profile
- ✓ User settings
- ✓ Shelves
- ✓ Journal-shelf relationships
- ✓ Push notification tokens

## Migration File
The migration has been created at:
```
supabase/migrations/20251215000001_ensure_cascade_deletion.sql
```

## How to Apply the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** tab
3. Copy the contents of `supabase/migrations/20251215000001_ensure_cascade_deletion.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

### Option 2: Supabase CLI

If you have the Supabase CLI linked to your project:

```bash
# Link your project (if not already linked)
supabase link --project-ref your-project-ref

# Push the migration
supabase db push
```

## What This Migration Does

1. **Checks existing constraints**: Finds any existing foreign key constraint on `journal_entries.user_id`
2. **Drops old constraint**: Removes the existing constraint if it doesn't have CASCADE
3. **Adds new constraint**: Creates a new foreign key with `ON DELETE CASCADE`
4. **Documents tables**: Adds comments to all tables explaining the cascade behavior

## Tables Already Configured

The following tables were already properly configured with `ON DELETE CASCADE`:
- `profiles`
- `user_settings`
- `shelves`
- `push_tokens`
- `journal_shelves`

## Testing the Migration

After applying the migration, you can verify it worked by running this query:

```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    rc.delete_rule
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('journal_entries', 'profiles', 'user_settings', 'shelves', 'journal_shelves', 'push_tokens')
AND ccu.table_name = 'users';
```

All rows should show `delete_rule` as `CASCADE`.

## Important Notes

⚠️ **This is a destructive operation**: Once a user deletes their account, ALL their data is permanently deleted and cannot be recovered.

✓ **Privacy compliance**: This migration helps comply with data privacy regulations (GDPR, CCPA) that require user data deletion upon account closure.

✓ **Database integrity**: The CASCADE ensures referential integrity is maintained - no orphaned records will exist.

## Rollback (if needed)

If you need to rollback this change (NOT recommended for production):

```sql
-- This would remove CASCADE and prevent automatic deletion
-- Only use if you have a specific reason to retain user data after account deletion

ALTER TABLE journal_entries
DROP CONSTRAINT journal_entries_user_id_fkey;

ALTER TABLE journal_entries
ADD CONSTRAINT journal_entries_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id);
-- Note: No ON DELETE CASCADE
```

## Next Steps

After applying this migration:
1. Test account deletion in a development/staging environment
2. Verify all user data is properly deleted
3. Update your privacy policy if needed
4. Consider implementing a "soft delete" feature if you want to give users a grace period before permanent deletion
