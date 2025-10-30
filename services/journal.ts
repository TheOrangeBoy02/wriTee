//services/journal.ts

import { JournalEntry } from '@/types';
import { supabase } from './supabase';
import { updateStreakAfterEntry } from '@/utils/streak';

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
    .order('pinned', { ascending: false })
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

    if (error) {
      // If tags column doesn't exist, try without tags
      if (error.code === '42703' && updateData.tags !== undefined) {
        console.warn('Tags column does not exist, updating without tags');
        delete updateData.tags;
        const { data: retryData, error: retryError } = await supabase
          .from('journal_entries')
          .update(updateData)
          .eq('id', entry.id)
          .eq('user_id', user.id)
          .select()
          .single();
        
        if (retryError) throw retryError;
        if (!retryData) throw new Error('Entry not found');
        return retryData;
      }
      throw error;
    }
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

    if (error) {
      // If tags column doesn't exist, try without tags
      if (error.code === '42703' && insertData.tags !== undefined) {
        console.warn('Tags column does not exist, creating without tags');
        delete insertData.tags;
        const { data: retryData, error: retryError } = await supabase
          .from('journal_entries')
          .insert(insertData)
          .select()
          .single();
        
        if (retryError) throw retryError;
        if (!retryData) throw new Error('Failed to create entry');
        
        console.log('📝 Journal entry created successfully:', retryData.id);
        console.log('📝 About to update streak with entry date:', retryData.entry_date);
        
        // Update streak after creating new entry
        await updateStreakAfterEntry(retryData.entry_date);
        
        // Invalidate dates cache so calendar updates
        datesCache = null;
        
        return retryData;
      }
      throw error;
    }
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
    .select('*')
    .eq('user_id', user.id)
    .order('pinned', { ascending: false })
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
    .order('pinned', { ascending: false })
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
 * Get all unique tags from journal entries
 */
export const getAllTags = async (): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('tags')
      .eq('user_id', user.id)
      .not('tags', 'is', null);

    if (error) {
      // If the tags column doesn't exist yet, return empty array
      if (error.code === '42703') {
        console.warn('Tags column does not exist yet. Please run the database migration.');
        return [];
      }
      throw error;
    }
    
    // Extract all unique tags
    const allTags = new Set<string>();
    (data || []).forEach(entry => {
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags.forEach(tag => allTags.add(tag));
      }
    });
    
    return Array.from(allTags).sort();
  } catch (error) {
    console.error('Error loading tags:', error);
    return [];
  }
};

/**
 * Get journal entries filtered by tags (AND logic)
 */
export const getJournalEntriesByTags = async (tags: string[], page = 0, pageSize = 20): Promise<{ entries: JournalEntry[], hasMore: boolean }> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  if (tags.length === 0) {
    // If no tags selected, return all entries
    return getJournalEntries(page, pageSize);
  }

  try {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Build the query to find entries that contain ALL selected tags
    let query = supabase
      .from('journal_entries')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // For each tag, add a condition that the tags array contains it
    tags.forEach(tag => {
      query = query.contains('tags', [tag]);
    });

    const { data, error, count } = await query
      .order('pinned', { ascending: false })
      .order('entry_date', { ascending: false })
      .range(from, to);

    if (error) {
      // If the tags column doesn't exist yet, return all entries
      if (error.code === '42703') {
        console.warn('Tags column does not exist yet. Falling back to all entries.');
        return getJournalEntries(page, pageSize);
      }
      throw error;
    }
    
    const totalEntries = count || 0;
    const hasMore = (page + 1) * pageSize < totalEntries;
    
    return {
      entries: data || [],
      hasMore
    };
  } catch (error) {
    console.error('Error loading filtered entries:', error);
    return getJournalEntries(page, pageSize);
  }
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