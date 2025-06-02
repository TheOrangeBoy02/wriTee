import { JournalEntry } from '@/types';

// Simulated journal entries
let mockEntries: JournalEntry[] = [
  {
    id: '1',
    title: 'A New Beginning',
    content: 'Today marks the start of my journaling journey. I feel excited about the possibilities and looking forward to tracking my growth over time.',
    date: '2025-04-01T12:00:00Z',
  },
  {
    id: '2',
    title: 'Reflections on Growth',
    content: 'Looking back at the past week, I notice how much more aware I\'ve become of my thoughts and feelings. Writing has helped me process emotions I didn\'t know I had.',
    date: '2025-04-03T18:30:00Z',
  },
];

// Simulated delay to mimic network request
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get all journal entries
 */
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  // Simulate API call
  await delay(800);
  
  // Sort entries by date (newest first)
  return [...mockEntries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
};

/**
 * Get a specific journal entry by ID
 */
export const getJournalEntry = async (id: string): Promise<JournalEntry> => {
  // Simulate API call
  await delay(500);
  
  const entry = mockEntries.find(entry => entry.id === id);
  
  if (!entry) {
    throw new Error('Entry not found');
  }
  
  return entry;
};

/**
 * Create or update a journal entry
 */
export const updateJournalEntry = async (entry: Partial<JournalEntry>): Promise<JournalEntry> => {
  // Simulate API call
  await delay(1000);
  
  if (entry.id) {
    // Update existing entry
    const index = mockEntries.findIndex(e => e.id === entry.id);
    
    if (index === -1) {
      throw new Error('Entry not found');
    }
    
    mockEntries[index] = {
      ...mockEntries[index],
      ...entry,
    } as JournalEntry;
    
    return mockEntries[index];
  } else {
    // Create new entry
    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      title: entry.title || 'Untitled',
      content: entry.content || '',
      date: entry.date || new Date().toISOString(),
    };
    
    mockEntries.push(newEntry);
    return newEntry;
  }
};

/**
 * Delete a journal entry
 */
export const deleteJournalEntry = async (id: string): Promise<void> => {
  // Simulate API call
  await delay(800);
  
  const index = mockEntries.findIndex(entry => entry.id === id);
  
  if (index === -1) {
    throw new Error('Entry not found');
  }
  
  mockEntries.splice(index, 1);
};

/**
 * Get dates that have journal entries
 */
export const getJournalEntryDates = async (): Promise<string[]> => {
  // Simulate API call
  await delay(600);
  
  // Return just the dates (YYYY-MM-DD) from the entries
  return mockEntries.map(entry => entry.date.split('T')[0]);
};