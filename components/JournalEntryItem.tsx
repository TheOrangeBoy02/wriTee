import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { JournalEntry } from '@/types';

type JournalEntryItemProps = {
  entry: JournalEntry;
  onPress: () => void;
};

export default function JournalEntryItem({ entry, onPress }: JournalEntryItemProps) {
  const getFormattedDate = () => {
    const entryDate = new Date(entry.entry_date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    entryDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (entryDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (entryDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return entryDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const formattedDate = getFormattedDate();

  const excerpt = entry.content.length > 120 
    ? `${entry.content.substring(0, 120)}...` 
    : entry.content;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <View style={styles.dateContainer}>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      <Text style={styles.title}>{entry.title}</Text>
      <Text style={styles.excerpt}>{excerpt}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.light,
    borderRadius: 12,
    padding: 16,
    marginBottom: 6,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.text.medium,
  },
  title: {
    fontFamily: 'Playfair-SemiBold',
    fontSize: 18,
    color: Colors.text.dark,
    marginBottom: 8,
  },
  excerpt: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.medium,
    lineHeight: 20,
  },
});