// services/shelf.ts

import { Shelf, JournalShelf } from '@/types';
import { supabase } from './supabase';

/**
 * Get all shelves for the current user
 */
export const getShelves = async (): Promise<Shelf[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('shelves')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
};

/**
 * Get a specific shelf by ID
 */
export const getShelf = async (id: string): Promise<Shelf> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('shelves')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Shelf not found');

  return data;
};

/**
 * Create a new shelf
 */
export const createShelf = async (name: string, color?: string): Promise<Shelf> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Validate name
  if (!name || name.trim().length === 0) {
    throw new Error('Shelf name cannot be empty');
  }

  // Check for duplicate name
  const { data: existingShelf } = await supabase
    .from('shelves')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', name.trim())
    .single();

  if (existingShelf) {
    throw new Error('A shelf with this name already exists');
  }

  const now = new Date().toISOString();

  const insertData: any = {
    name: name.trim(),
    user_id: user.id,
    created_at: now,
    updated_at: now
  };

  if (color) {
    insertData.color = color;
  }

  const { data, error } = await supabase
    .from('shelves')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create shelf');

  return data;
};

/**
 * Update a shelf (name and/or color)
 */
export const updateShelf = async (id: string, updates: { name?: string; color?: string }): Promise<Shelf> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Validate updates
  if (!updates.name && !updates.color) {
    throw new Error('No updates provided');
  }

  // If updating name, check for duplicates
  if (updates.name) {
    const trimmedName = updates.name.trim();
    if (trimmedName.length === 0) {
      throw new Error('Shelf name cannot be empty');
    }

    const { data: existingShelf } = await supabase
      .from('shelves')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', trimmedName)
      .neq('id', id)
      .single();

    if (existingShelf) {
      throw new Error('A shelf with this name already exists');
    }
  }

  const updateData: any = {};
  if (updates.name) {
    updateData.name = updates.name.trim();
  }
  if (updates.color !== undefined) {
    updateData.color = updates.color;
  }

  const { data, error } = await supabase
    .from('shelves')
    .update(updateData)
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
 * Note: Due to CASCADE, this will also remove all journal_shelves associations
 */
export const deleteShelf = async (id: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('shelves')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
};

/**
 * Check if a shelf is in use (has any journal entries)
 */
export const isShelfInUse = async (shelfId: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { count, error } = await supabase
    .from('journal_shelves')
    .select('*', { count: 'exact', head: true })
    .eq('shelf_id', shelfId);

  if (error) throw error;
  return (count || 0) > 0;
};

/**
 * Get all shelves for a specific journal entry
 */
export const getShelvesForEntry = async (journalEntryId: string): Promise<Shelf[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_shelves')
    .select(`
      shelf_id,
      shelves (*)
    `)
    .eq('journal_entry_id', journalEntryId);

  if (error) throw error;
  if (!data) return [];

  // Extract shelves from the nested structure
  return data
    .map((item: any) => item.shelves)
    .filter((shelf: any) => shelf !== null) as Shelf[];
};

/**
 * Attach a shelf to a journal entry
 */
export const attachShelfToEntry = async (journalEntryId: string, shelfId: string): Promise<JournalShelf> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify the entry and shelf belong to the user
  const [entryCheck, shelfCheck] = await Promise.all([
    supabase
      .from('journal_entries')
      .select('id')
      .eq('id', journalEntryId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('shelves')
      .select('id')
      .eq('id', shelfId)
      .eq('user_id', user.id)
      .single()
  ]);

  if (entryCheck.error || !entryCheck.data) {
    throw new Error('Journal entry not found');
  }
  if (shelfCheck.error || !shelfCheck.data) {
    throw new Error('Shelf not found');
  }

  const { data, error } = await supabase
    .from('journal_shelves')
    .insert({
      journal_entry_id: journalEntryId,
      shelf_id: shelfId,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    // Check if it's a duplicate error
    if (error.code === '23505') {
      throw new Error('This shelf is already attached to the entry');
    }
    throw error;
  }
  if (!data) throw new Error('Failed to attach shelf');

  return data;
};

/**
 * Detach a shelf from a journal entry
 */
export const detachShelfFromEntry = async (journalEntryId: string, shelfId: string): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('journal_shelves')
    .delete()
    .eq('journal_entry_id', journalEntryId)
    .eq('shelf_id', shelfId);

  if (error) throw error;
};

/**
 * Set shelves for a journal entry (replaces all existing shelves)
 */
export const setShelvesForEntry = async (journalEntryId: string, shelfIds: string[]): Promise<void> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Verify the entry belongs to the user
  const { data: entry, error: entryError } = await supabase
    .from('journal_entries')
    .select('id')
    .eq('id', journalEntryId)
    .eq('user_id', user.id)
    .single();

  if (entryError || !entry) {
    throw new Error('Journal entry not found');
  }

  // Remove all existing shelf associations
  const { error: deleteError } = await supabase
    .from('journal_shelves')
    .delete()
    .eq('journal_entry_id', journalEntryId);

  if (deleteError) throw deleteError;

  // If no shelves to add, we're done
  if (shelfIds.length === 0) return;

  // Verify all shelves belong to the user
  const { data: shelves, error: shelvesError } = await supabase
    .from('shelves')
    .select('id')
    .eq('user_id', user.id)
    .in('id', shelfIds);

  if (shelvesError) throw shelvesError;
  if (!shelves || shelves.length !== shelfIds.length) {
    throw new Error('One or more shelves not found');
  }

  // Insert new associations
  const now = new Date().toISOString();
  const associations = shelfIds.map(shelfId => ({
    journal_entry_id: journalEntryId,
    shelf_id: shelfId,
    created_at: now
  }));

  const { error: insertError } = await supabase
    .from('journal_shelves')
    .insert(associations);

  if (insertError) throw insertError;
};

/**
 * Get all journal entries for a specific shelf
 */
export const getEntriesForShelf = async (shelfId: string): Promise<any[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('journal_shelves')
    .select(`
      journal_entry_id,
      journal_entries (*)
    `)
    .eq('shelf_id', shelfId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  // Extract journal entries from the nested structure
  return data
    .map((item: any) => item.journal_entries)
    .filter((entry: any) => entry !== null);
};
