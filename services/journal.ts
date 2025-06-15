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
    .order('date', { ascending: false });

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

  if (entry.id) {
    // Update existing entry
    const { data, error } = await supabase
      .from('journal_entries')
      .update({
        title: entry.title,
        content: entry.content,
        date: entry.date || new Date().toISOString(),
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
        date: entry.date || new Date().toISOString(),
        user_id: user.id,
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
    .select('date')
    .eq('user_id', user.id);
  
  if (error) throw error;
  return (data || []).map(entry => entry.date.split('T')[0]);
};