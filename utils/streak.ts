import { updateWritingStreak, updateLastEntryDate } from '@/services/user';
import { getJournalEntryDates } from '@/services/journal';

/**
 * Calculate the current writing streak based on journal entries
 * Uses the same logic as the calendar to ensure consistency
 */
export const calculateStreak = async (): Promise<number> => {
  try {
    // Use the same function as the calendar to get journal entry dates
    const entryDates = await getJournalEntryDates(true); // Force refresh to get latest data
    
    console.log('📅 Entry dates from getJournalEntryDates:', entryDates);
    
    if (entryDates.length === 0) {
      console.log('🔥 No entries found, streak = 0');
      return 0;
    }

    // Remove duplicates and sort by date descending
    const uniqueDates = [...new Set(entryDates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log('🔥 Today:', today, 'Yesterday:', yesterday);
    console.log('🔥 Unique dates:', uniqueDates);

    // Check if the most recent entry is today or yesterday
    const mostRecentDate = uniqueDates[0];
    console.log('🔥 Most recent entry date:', mostRecentDate);
    
    if (mostRecentDate !== today && mostRecentDate !== yesterday) {
      console.log('🔥 Streak broken - most recent entry not today or yesterday');
      return 0; // Streak is broken
    }

    // Count consecutive days starting from the most recent date
    let streak = 0;
    let expectedDateStr = mostRecentDate;

    for (const dateStr of uniqueDates) {
      if (dateStr === expectedDateStr) {
        streak++;
        console.log(`🔥 Day ${streak}: ${dateStr} matches expected ${expectedDateStr}`);
        // Move to the previous day
        const prevDate = new Date(expectedDateStr);
        prevDate.setDate(prevDate.getDate() - 1);
        expectedDateStr = prevDate.toISOString().split('T')[0];
      } else {
        console.log(`🔥 Streak ends: ${dateStr} doesn't match expected ${expectedDateStr}`);
        break;
      }
    }

    console.log('🔥 Final calculated streak:', streak);
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
};

/**
 * Update the user's streak after creating or updating a journal entry
 */
export const updateStreakAfterEntry = async (entryDate?: string): Promise<void> => {
  try {
    console.log('🔥 updateStreakAfterEntry called with entryDate:', entryDate);
    const streak = await calculateStreak();
    const dateToUpdate = entryDate || new Date().toISOString();
    
    console.log('🔥 Updating streak to:', streak);
    console.log('🔥 Updating last entry date to:', dateToUpdate);
    
    await updateWritingStreak(streak);
    await updateLastEntryDate(dateToUpdate);
    
    console.log('🔥 Streak update completed');
  } catch (error) {
    console.error('Error updating streak:', error);
  }
};