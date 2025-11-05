//services/journal.ts

import { JournalEntry } from '@/types';
import { supabase } from './supabase';
import { updateStreakAfterEntry } from '@/utils/streak';

/**
 * Get all journal entries with pagination
 */
export const getJournalEntries = async (page = 0, pageSize = 20, shelfId?: string): Promise<{ entries: JournalEntry[], hasMore: boolean }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const from = page * pageSize;
  const to = from + pageSize - 1;

  // Use inner join only when filtering by shelf, otherwise use left join
  const joinType = shelfId ? '!inner' : '';

  let query = supabase
    .from('journal_entries')
    .select(`
      *,
      journal_shelves${joinType} (
        shelf_id,
        shelves (*)
      )
    `, { count: 'exact' })
    .eq('user_id', user.id);

  // Filter by shelf if shelfId is provided
  if (shelfId) {
    query = query.eq('journal_shelves.shelf_id', shelfId);
  }

  const { data, error, count } = await query
    .order('pinned', { ascending: false })
    .order('entry_date', { ascending: false })
    .range(from, to);

  if (error) throw error;

  // Transform data to include shelves array
  const entries = (data || []).map((entry: any) => {
    const shelves = entry.journal_shelves
      ?.map((js: any) => js.shelves)
      .filter((shelf: any) => shelf !== null) || [];

    const { journal_shelves, ...entryData } = entry;
    return {
      ...entryData,
      shelves
    };
  });

  const totalEntries = count || 0;
  const hasMore = (page + 1) * pageSize < totalEntries;

  return {
    entries,
    hasMore
  };
};

/**
 * Get a specific journal entry by ID
 */
export const getJournalEntry = async (id: string): Promise<JournalEntry> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select(`
      *,
      journal_shelves (
        shelf_id,
        shelves (*)
      )
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Entry not found');

  // Transform data to include shelves array
  const shelves = (data as any).journal_shelves
    ?.map((js: any) => js.shelves)
    .filter((shelf: any) => shelf !== null) || [];

  const { journal_shelves, ...entryData } = data as any;

  return {
    ...entryData,
    shelves
  };
};

/**
 * Create or update a journal entry
 */
export const updateJournalEntry = async (entry: Partial<JournalEntry>): Promise<JournalEntry> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const now = new Date().toISOString();

  if (entry.id) {
    // Update existing entry
    console.log('📝 Updating existing journal entry:', entry.id);
    
    // Build update object conditionally
    const updateData: any = {
      title: entry.title,
      content: entry.content,
      entry_date: entry.entry_date || now,
      updated_at: now
    };

  

    const { data, error } = await supabase
      .from('journal_entries')
      .update(updateData)
      .eq('id', entry.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Entry not found');
    
    return data;
  } else {
    // Create new entry
    console.log('📝 Creating new journal entry');
    
    // Build insert object conditionally
    const insertData: any = {
      title: entry.title || 'Untitled',
      content: entry.content || '',
      user_id: user.id,
      entry_date: entry.entry_date || now,
      created_at: now,
      updated_at: now
    };

    const { data, error } = await supabase
      .from('journal_entries')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create entry');
    
    console.log('📝 Journal entry created successfully:', data.id);
    console.log('📝 About to update streak with entry date:', data.entry_date);
    
    // Update streak after creating new entry
    await updateStreakAfterEntry(data.entry_date);
    
    // Invalidate dates cache so calendar updates
    datesCache = null;
    
    return data;
  }
};

/**
 * Delete a journal entry
 */
export const deleteJournalEntry = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('journal_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
  
  // Recalculate streak after deletion
  await updateStreakAfterEntry();
  
  // Invalidate dates cache so calendar updates
  datesCache = null;
};

/**
 * Get dates that have journal entries (with caching)
 */
let datesCache: { data: string[], timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getJournalEntryDates = async (forceRefresh = false): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check cache
  if (!forceRefresh && datesCache && Date.now() - datesCache.timestamp < CACHE_DURATION) {
    return datesCache.data;
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .select('entry_date')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false });
  
  if (error) throw error;
  
  const dates = (data || []).map(entry => entry.entry_date.split('T')[0]);
  
  // Update cache
  datesCache = {
    data: dates,
    timestamp: Date.now()
  };
  
  return dates;
};

/**
 * Get the count of journal entries
 */
/**
 * Get recent journal entries (for dashboard)
 */
export const getRecentJournalEntries = async (limit = 5): Promise<JournalEntry[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select(`
      *,
      journal_shelves (
        shelf_id,
        shelves (*)
      )
    `)
    .eq('user_id', user.id)
    .order('pinned', { ascending: false })
    .order('entry_date', { ascending: false })
    .limit(limit);

  if (error) throw error;

  // Transform data to include shelves array
  const entries = (data || []).map((entry: any) => {
    const shelves = entry.journal_shelves
      ?.map((js: any) => js.shelves)
      .filter((shelf: any) => shelf !== null) || [];

    const { journal_shelves, ...entryData } = entry;
    return {
      ...entryData,
      shelves
    };
  });

  return entries;
};

export const getJournalEntryCount = async (): Promise<number> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { count, error } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) throw error;
  return count || 0;
};

/**
 * Search journal entries by title or content
 */
export const searchJournalEntries = async (query: string, page = 0, pageSize = 10): Promise<{ entries: JournalEntry[], hasMore: boolean }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('journal_entries')
    .select(`
      *,
      journal_shelves (
        shelf_id,
        shelves (*)
      )
    `, { count: 'exact' })
    .eq('user_id', user.id)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('pinned', { ascending: false })
    .order('entry_date', { ascending: false })
    .range(from, to);

  if (error) throw error;

  // Transform data to include shelves array
  const entries = (data || []).map((entry: any) => {
    const shelves = entry.journal_shelves
      ?.map((js: any) => js.shelves)
      .filter((shelf: any) => shelf !== null) || [];

    const { journal_shelves, ...entryData } = entry;
    return {
      ...entryData,
      shelves
    };
  });

  const totalEntries = count || 0;
  const hasMore = (page + 1) * pageSize < totalEntries;

  return {
    entries,
    hasMore
  };
};

/**
 * Toggle pin status of a journal entry
 */
export const togglePinJournalEntry = async (id: string): Promise<JournalEntry> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // First, get the current pin status
  const { data: currentEntry, error: getError } = await supabase
    .from('journal_entries')
    .select('pinned')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (getError) throw getError;
  if (!currentEntry) throw new Error('Entry not found');

  // Toggle the pin status
  const { data, error } = await supabase
    .from('journal_entries')
    .update({ pinned: !currentEntry.pinned })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Entry not found');

  return data;
};