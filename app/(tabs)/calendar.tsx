// app/(tabs)/calendar.tsx
import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react-native';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import { getJournalEntryDates } from '@/services/journal';
import { useStreaks } from '@/context/StreakContext';

type MarkedDates = {
  [date: string]: {
    marked: boolean;
    dotColor: string;
  };
};

// Helper to get local date string
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [streakDates, setStreakDates] = useState<string[]>([]);
  const router = useRouter();

  // Use streak context
  const { currentStreak } = useStreaks();

  useEffect(() => {
    const today = getLocalDateString();
    setSelectedDate(today);
    loadJournalDates();
  }, []);

  // Recalculate streak visualization when currentStreak changes
  useEffect(() => {
    if (!isLoading) {
      calculateStreakVisualization();
    }
  }, [currentStreak, isLoading]);

  const loadJournalDates = async () => {
    setIsLoading(true);
    try {
      const dates = await getJournalEntryDates();
      
      const marked: MarkedDates = {};
      dates.forEach(date => {
        marked[date] = { marked: true, dotColor: Colors.primary.main };
      });
      
      setMarkedDates(marked);
      calculateStreakVisualization();
    } catch (error) {
      console.error('Error loading journal dates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStreakVisualization = async () => {
    try {
      const dates = await getJournalEntryDates();
      
      if (currentStreak > 0 && dates.length > 0) {
        const sortedDates = [...dates].sort((a, b) => 
          new Date(b).getTime() - new Date(a).getTime()
        );
        
        const streakDatesList: string[] = [];
        const today = getLocalDateString();
        const yesterday = getLocalDateString(new Date(Date.now() - 24 * 60 * 60 * 1000));
        
        let expectedDateStr = sortedDates[0] === today ? today : yesterday;
        
        // Show max 7 days in visualization
        for (let i = 0; i < currentStreak && i < 7; i++) {
          if (sortedDates.includes(expectedDateStr)) {
            streakDatesList.push(expectedDateStr);
          }
          const prevDate = new Date(expectedDateStr);
          prevDate.setDate(prevDate.getDate() - 1);
          expectedDateStr = getLocalDateString(prevDate);
        }
        
        setStreakDates(streakDatesList.reverse());
      } else {
        setStreakDates([]);
      }
    } catch (error) {
      console.error('Error calculating streak visualization:', error);
      setStreakDates([]);
    }
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    const hasEntry = markedDates[day.dateString]?.marked;
    
    if (hasEntry) {
      router.push(`/journal/${day.dateString}`);
    } else {
      router.push({
        pathname: '/journal/[id]',
        params: { id: 'new', date: day.dateString }
      });
    }
  };

  const handleMonthChange = (month: DateData) => {
    // Month change logic if needed
  };

  const calendarMarkedDates = useMemo(() => ({
    ...markedDates,
    [selectedDate]: {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: Colors.primary.light,
    },
  }), [markedDates, selectedDate]);

  const renderStreakVisualization = () => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <View style={styles.streakContainer}>
        <View style={styles.streakHeader}>
          <Flame size={24} color={Colors.primary.main} />
          <Text style={styles.streakNumber}>{currentStreak}</Text>
        </View>
        
        <View style={styles.streakDays}>
          {Array.from({ length: 7 }, (_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const dateStr = getLocalDateString(date);
            const dayName = daysOfWeek[date.getDay()];
            const hasEntry = streakDates.includes(dateStr);
            
            return (
              <View key={dateStr} style={styles.streakDay}>
                <Text style={styles.streakDayLabel}>{dayName}</Text>
                <View style={[
                  styles.streakDot,
                  hasEntry && styles.streakDotFilled
                ]} />
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Calendar" />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      ) : (
        <>
          {renderStreakVisualization()}
          
          <RNCalendar
            onDayPress={handleDayPress}
            markedDates={calendarMarkedDates}
            theme={{
              calendarBackground: Colors.background.main,
              textSectionTitleColor: Colors.text.medium,
              selectedDayBackgroundColor: Colors.primary.main,
              selectedDayTextColor: '#ffffff',
              todayTextColor: Colors.primary.main,
              dayTextColor: Colors.text.dark,
              textDisabledColor: Colors.neutral.light,
              dotColor: Colors.primary.main,
              selectedDotColor: '#ffffff',
              arrowColor: Colors.primary.main,
              monthTextColor: Colors.text.dark,
              indicatorColor: Colors.primary.main,
              textDayFontFamily: 'Inter-Regular',
              textMonthFontFamily: 'Inter-SemiBold',
              textDayHeaderFontFamily: 'Inter-Medium',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
            }}
            onMonthChange={handleMonthChange}
            renderArrow={(direction) => (
              direction === 'left' ? 
                <ChevronLeft size={20} color={Colors.primary.main} /> : 
                <ChevronRight size={20} color={Colors.primary.main} />
            )}
            enableSwipeMonths={true}
          />
          
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary.main }]} />
              <Text style={styles.legendText}>Journal Entry</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.primary.light }]} />
              <Text style={styles.legendText}>Selected Date</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.medium,
  },
  streakContainer: {
    backgroundColor: Colors.background.light,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  streakNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.primary.main,
    marginLeft: 8,
  },
  streakDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakDay: {
    alignItems: 'center',
    flex: 1,
  },
  streakDayLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.text.medium,
    marginBottom: 8,
  },
  streakDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.neutral.light,
    borderWidth: 2,
    borderColor: Colors.neutral.border,
  },
  streakDotFilled: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
});