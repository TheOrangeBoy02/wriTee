// utils/streak.ts
import { updateUserStreaks, getCurrentUserId } from '@/services/user';
import { getJournalEntryDates } from '@/services/journal';

/**
 * Get local date string in YYYY-MM-DD format
 */
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Calculate current and best writing streaks from journal entries
 */
export const calculateStreaks = async (): Promise<{ 
  currentStreak: number; 
  bestStreak: number;
}> => {
  try {
    const entryDates = await getJournalEntryDates(true);
    
    if (entryDates.length === 0) {
      return { currentStreak: 0, bestStreak: 0 };
    }

    // Remove duplicates and sort ascending
    const uniqueDates = [...new Set(entryDates)].sort((a, b) => 
      new Date(a).getTime() - new Date(b).getTime()
    );

    // Helper: check consecutive days
    const isConsecutive = (dateA: string, dateB: string): boolean => {
      const dA = new Date(dateA + 'T00:00:00');
      const dB = new Date(dateB + 'T00:00:00');
      const diffDays = (dB.getTime() - dA.getTime()) / (24 * 60 * 60 * 1000);
      return diffDays === 1;
    };

    // Calculate best streak (all-time)
    let bestStreak = 1;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      if (isConsecutive(uniqueDates[i - 1], uniqueDates[i])) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
    }

    // Calculate current streak
    const today = getLocalDateString();
    const yesterday = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    let currentStreak = 0;
    const mostRecentEntry = uniqueDates[uniqueDates.length - 1];
    
    // First check if the user has written today
    if (mostRecentEntry === today) {
      currentStreak = 1;
      let previousDate = today;
      
      // Count consecutive days backwards
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        if (isConsecutive(uniqueDates[i], previousDate)) {
          currentStreak++;
          previousDate = uniqueDates[i];
        } else {
          break;
        }
      }
    }
    // If not written today, check if they wrote yesterday
    else if (mostRecentEntry === yesterday) {
      currentStreak = 1;
      let previousDate = yesterday;
      
      // Count consecutive days backwards from yesterday
      for (let i = uniqueDates.length - 2; i >= 0; i--) {
        if (isConsecutive(uniqueDates[i], previousDate)) {
          currentStreak++;
          previousDate = uniqueDates[i];
        } else {
          break;
        }
      }
    }
    // If neither today nor yesterday, streak is broken
    else {
      currentStreak = 0;
    }

    console.log('🔥 Calculated streaks:', { currentStreak, bestStreak });
    return { currentStreak, bestStreak };
    
  } catch (error) {
    console.error('Error calculating streaks:', error);
    return { currentStreak: 0, bestStreak: 0 };
  }
};

/**
 * Single function export for backward compatibility
 */
export const calculateStreak = async (): Promise<number> => {
  const { currentStreak } = await calculateStreaks();
  return currentStreak;
};

/**
 * Update user's streak after creating/updating a journal entry
 * Now uses atomic RPC call instead of three separate updates
 *
 * @param entryDate - Optional entry date (defaults to today)
 * @returns Object with streak data and whether to show celebration
 */
export const updateStreakAfterEntry = async (entryDate?: string): Promise<{
  currentStreak: number;
  bestStreak: number;
  isNewRecord: boolean;
  shouldCelebrate: boolean;
}> => {
  try {
    console.log('🔥 Starting streak update for entry date:', entryDate);

    // Get user ID
    const userId = await getCurrentUserId();

    // Get all entry dates to check if this is first entry today
    const entryDates = await getJournalEntryDates(true);
    const today = getLocalDateString();
    const dateToUpdate = entryDate || today;

    // Check if this is the first entry for today
    const todayEntryCount = entryDates.filter(date => date === today).length;
    const isFirstEntryToday = todayEntryCount === 1 && dateToUpdate === today;

    // Calculate streaks from all entries
    const { currentStreak, bestStreak } = await calculateStreaks();

    console.log('🔥 Calculated values:', {
      currentStreak,
      bestStreak,
      lastEntryDate: dateToUpdate,
      isFirstEntryToday,
      todayEntryCount
    });

    // Single atomic update via RPC
    const result = await updateUserStreaks(
      userId,
      currentStreak,
      bestStreak,
      dateToUpdate
    );

    if (result.is_new_record) {
      console.log('🎉 NEW BEST STREAK RECORD!', result.best_streak);
    }

    console.log('✅ Streak update completed successfully');

    return {
      currentStreak,
      bestStreak,
      isNewRecord: result.is_new_record,
      shouldCelebrate: isFirstEntryToday && currentStreak > 0,
    };

  } catch (error) {
    console.error('❌ Error updating streak:', error);
    throw error;
  }
};