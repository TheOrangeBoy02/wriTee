import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { JournalEntry } from '@/types';

type JournalEntryItemProps = {
  entry: JournalEntry;
  onPress: () => void;
};

export default function JournalEntryItem({ entry, onPress }: JournalEntryItemProps) {
  const formattedDate = new Date(entry.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

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
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontFamily: 'Inter-Regular',
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