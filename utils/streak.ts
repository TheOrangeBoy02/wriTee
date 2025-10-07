// streak.ts
import { updateWritingStreak, updateBestStreak, updateLastEntryDate, getUserBestStreak } from '@/services/user';
import { getJournalEntryDates } from '@/services/journal';

/**
 * Calculate the current writing streak based on journal entries
 * Uses the same logic as the calendar to ensure consistency
 */

export const calculateStreaks = async (): Promise<{ currentStreak: number; bestStreak: number }> => {
  try {
    // Use the same function as the calendar to get journal entry dates
    const entryDates = await getJournalEntryDates(true); // Force refresh to get latest data
    
    
    console.log('📅 Entry dates from getJournalEntryDates:', entryDates);
    
    if (entryDates.length === 0) {
      console.log('🔥 No entries found, streak = 0');
      return { currentStreak: 0, bestStreak: 0 };
    }

    // Remove duplicates and sort by date ascending
    const uniqueDates = [...new Set(entryDates)].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    // Helper to check if two dates are consecutive (ignoring DST issues)
    const isConsecutive = (dateA: string, dateB: string) => {
      const dA = new Date(dateA).setHours(0, 0, 0, 0);
      const dB = new Date(dateB).setHours(0, 0, 0, 0);
      const diffDays = (dB - dA) / (24 * 60 * 60 * 1000);
      return diffDays === 1;
    };

    let bestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      if (isConsecutive(uniqueDates[i - 1], uniqueDates[i])) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    }

    // Calculate current streak (ending at today or yesterday)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()).toISOString().split('T')[0];
    
    let currentStreak = 0;
    const streakEndDate = uniqueDates[uniqueDates.length - 1];
    
    if (streakEndDate === today || streakEndDate === yesterdayStr) {
      currentStreak = 1;
      for (let i = uniqueDates.length - 1; i > 0; i--) {
        const prevDate = uniqueDates[i - 1];
        const currDate = uniqueDates[i];
        if (isConsecutive(prevDate, currDate)) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    console.log('🔥 Final calculated streaks:', { currentStreak, bestStreak });
    return { currentStreak, bestStreak };
  } catch (error) {
    console.error('Error calculating streak:', error);
    return { currentStreak: 0, bestStreak: 0 };
  }
};

/**
 * Update the user's streak after creating or updating a journal entry
 */
export const updateStreakAfterEntry = async (entryDate?: string): Promise<void> => {
  try {
    console.log('🔥 updateStreakAfterEntry called with entryDate:', entryDate);
    
    const { currentStreak, bestStreak } = await calculateStreaks();
    const dateToUpdate = entryDate || new Date().toISOString();
    
    console.log('🔥 Updating current streak to:', currentStreak);
    console.log('🔥 Calculated best streak:', bestStreak);
    console.log('🔥 Updating last entry date to:', dateToUpdate);
    
    // Update current streak
    await updateWritingStreak(currentStreak);
    
    // Update best streak only if it's a new record
    const currentBest = await getUserBestStreak();
    if (bestStreak > currentBest) {
      console.log('🔥 New best streak record! Updating from', currentBest, 'to', bestStreak);
      await updateBestStreak(bestStreak);
    } else {
      console.log('🔥 Best streak unchanged:', currentBest);
    }
    
    // Update last entry date
    await updateLastEntryDate(dateToUpdate);
    
    console.log('🔥 Streak update completed');
  } catch (error) {
    console.error('Error updating streak:', error);
  }
};