// components/JournalEntryItem.tsx

import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Colors from '@/constants/Colors';
import { JournalEntry } from '@/types';

import { PinIcon } from 'lucide-react-native';

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
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.dateContainer}>
            <Text style={styles.date}>{formattedDate}</Text>
            {entry.pinned && (
              <View style={styles.pinnedContainer}>
                <PinIcon size={12} color={Colors.primary.main} />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.excerpt}>{excerpt}</Text>
      </View>
    </TouchableWithoutFeedback>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  date: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.text.medium,
  },
  pinnedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pinnedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.primary.main,
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