import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Calendar as RNCalendar, DateData } from 'react-native-calendars';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import { getJournalEntryDates } from '@/services/journal';

type MarkedDates = {
  [date: string]: {
    marked: boolean;
    dotColor: string;
  };
};

export default function CalendarScreen() {
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    loadJournalDates();
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    updateMonthTitle(today);
  }, []);

  const loadJournalDates = async () => {
    setIsLoading(true);
    try {
      const dates = await getJournalEntryDates();
      
      const marked: MarkedDates = {};
      dates.forEach(date => {
        marked[date] = { marked: true, dotColor: Colors.primary.main };
      });
      
      setMarkedDates(marked);
    } catch (error) {
      console.error('Error loading journal dates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateMonthTitle = (date: string) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    
    const d = new Date(date);
    setCurrentMonth(`${monthNames[d.getMonth()]} ${d.getFullYear()}`);
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    const hasEntry = markedDates[day.dateString]?.marked;
    
    if (hasEntry) {
      // Navigate to the entry for this date
      router.push(`/journal/${day.dateString}`);
    } else {
      // Create new entry for this date
      router.push({
        pathname: '/journal/new',
        params: { date: day.dateString }
      });
    }
  };

  const handleMonthChange = (month: DateData) => {
    updateMonthTitle(month.dateString);
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
          <View style={styles.monthHeader}>
            <CalendarIcon size={20} color={Colors.primary.main} />
            <Text style={styles.monthTitle}>{currentMonth}</Text>
          </View>
          
          <RNCalendar
            onDayPress={handleDayPress}
            markedDates={{
              ...markedDates,
              [selectedDate]: {
                ...(markedDates[selectedDate] || {}),
                selected: true,
                selectedColor: Colors.primary.light,
              },
            }}
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
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  monthTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.text.dark,
    marginLeft: 8,
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
});