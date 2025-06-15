import { JournalEntry } from '@/types';
import { supabase } from './supabase';

/**
 * Get all journal entries
 */
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false });

  if (error) throw error;
  return data || [];
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
 * Get dates that have journal entries
 */
export const getJournalEntryDates = async (): Promise<string[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_entries')
    .select('entry_date')
    .eq('user_id', user.id)
    .order('entry_date', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(entry => entry.entry_date.split('T')[0]);
};

/**
 * Get the count of journal entries
 */
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