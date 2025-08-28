import { Shelf } from '@/types';
import { supabase } from './supabase';

/**
 * Get all shelves for the current user
 */
export const getUserShelves = async (): Promise<Shelf[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .order('usage_count', { ascending: false })
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Create a new shelf
 */
export const createShelf = async (name: string, color?: string): Promise<Shelf> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Shelf name is required');

  const { data, error } = await supabase
    .from('tags')
    .insert({
      user_id: user.id,
      name: trimmedName,
      color: color || '#8B5CF6',
      usage_count: 0
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error('A shelf with this name already exists');
    }
    throw error;
  }

  return data;
};

/**
 * Update a shelf
 */
export const updateShelf = async (id: string, updates: Partial<Shelf>): Promise<Shelf> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tags')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Shelf not found');

  return data;
};

/**
 * Delete a shelf
 */
export const deleteShelf = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('tags')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

/**
 * Increment shelf usage count
 */
export const incrementShelfUsage = async (shelfId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First get the current usage count
  const { data: shelf, error: fetchError } = await supabase
    .from('tags')
    .select('usage_count')
    .eq('id', shelfId)
    .eq('user_id', user.id)
    .single();

  if (fetchError) throw fetchError;

  // Then update with incremented value
  const { error } = await supabase
    .from('tags')
    .update({ usage_count: (shelf?.usage_count || 0) + 1 })
    .eq('id', shelfId)
    .eq('user_id', user.id);

  if (error) throw error;
};

/**
 * Get shelves for a specific journal entry
 */
export const getJournalEntryShelves = async (journalEntryId: string): Promise<Shelf[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entry_tags')
    .select(`
      tag_id,
      tags (*)
    `)
    .eq('journal_entry_id', journalEntryId);

  if (error) throw error;

  // Extract shelves from the joined data
  return (data || [])
    .map(item => item.tags)
    .filter(Boolean) as Shelf[];
};

/**
 * Add shelves to a journal entry
 */
export const addShelvesToJournalEntry = async (journalEntryId: string, shelfIds: string[]): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First, remove existing shelves for this journal entry
  await supabase
    .from('journal_entry_tags')
    .delete()
    .eq('journal_entry_id', journalEntryId);

  if (shelfIds.length === 0) return;

  // Add new shelves
  const journalEntryTags = shelfIds.map(shelfId => ({
    journal_entry_id: journalEntryId,
    tag_id: shelfId
  }));

  const { error } = await supabase
    .from('journal_entry_tags')
    .insert(journalEntryTags);

  if (error) throw error;

  // Increment usage count for all used shelves
  for (const shelfId of shelfIds) {
    await incrementShelfUsage(shelfId);
  }
};

/**
 * Get journal entries by shelf IDs
 */
export const getJournalEntriesByShelfIds = async (shelfIds: string[], page = 0, pageSize = 20) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (shelfIds.length === 0) {
    // If no shelves selected, return all entries
    const { data, error, count } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('entry_date', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    
    return {
      entries: data || [],
      hasMore: (page + 1) * pageSize < (count || 0)
    };
  }

  // Get journal entries that have ALL the selected shelves
  const { data, error, count } = await supabase
    .from('journal_entries')
    .select(`
      *,
      journal_entry_tags!inner(tag_id)
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .in('journal_entry_tags.tag_id', shelfIds)
    .order('entry_date', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;

  // Filter entries that have ALL selected shelves (AND logic)
  const filteredEntries = (data || []).filter(entry => {
    const entryShelfIds = entry.journal_entry_tags.map((jt: any) => jt.tag_id);
    return shelfIds.every(shelfId => entryShelfIds.includes(shelfId));
  });

  return {
    entries: filteredEntries,
    hasMore: (page + 1) * pageSize < (count || 0)
  };
};

/**
 * Search shelves by name
 */
export const searchShelves = async (query: string): Promise<Shelf[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('user_id', user.id)
    .ilike('name', `%${query}%`)
    .order('usage_count', { ascending: false })
    .limit(10);

  if (error) throw error;
  return data || [];
};