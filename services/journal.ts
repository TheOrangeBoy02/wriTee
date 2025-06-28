import { JournalEntry } from '@/types';
import { supabase } from './supabase';

/**
 * Get all journal entries with pagination
 */
export const getJournalEntries = async (page = 0, pageSize = 20): Promise<{ entries: JournalEntry[], hasMore: boolean }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('journal_entries')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .range(from, to);

  if (error) throw error;
  
  const totalEntries = count || 0;
  const hasMore = (page + 1) * pageSize < totalEntries;
  
  return {
    entries: data || [],
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
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (error) throw error;
  if (!data) throw new Error('Entry not found');
  
  return data;
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
    const { data, error } = await supabase
      .from('journal_entries')
      .update({
        title: entry.title,
        content: entry.content,
        entry_date: entry.entry_date || now,
        updated_at: now
      })
      .eq('id', entry.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Entry not found');
    
    return data;
  } else {
    // Create new entry
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        title: entry.title || 'Untitled',
        content: entry.content || '',
        user_id: user.id,
        entry_date: entry.entry_date || now,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create entry');
    
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
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
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
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
    .order('entry_date', { ascending: false })
    .range(from, to);

  if (error) throw error;
  
  const totalEntries = count || 0;
  const hasMore = (page + 1) * pageSize < totalEntries;
  
  return {
    entries: data || [],
    hasMore
  };
};