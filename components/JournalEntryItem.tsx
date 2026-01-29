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

  const truncatedTitle = entry.title.length > 24
    ? `${entry.title.substring(0, 24)}...`
    : entry.title;

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.container}>
        {entry.pinned && (
          <View style={styles.pinnedContainer}>
            <PinIcon size={14} color={Colors.primary.main} />
          </View>
        )}

        <Text style={styles.title} numberOfLines={1}>{truncatedTitle}</Text>
        <Text style={styles.date}>{formattedDate}</Text>

        <Text style={styles.excerpt}>{excerpt}</Text>

        {entry.shelves && entry.shelves.length > 0 && (
          <View style={styles.shelvesContainer}>
            {entry.shelves.slice(0, 3).map((shelf) => (
              <View
                key={shelf.id}
                style={[
                  styles.shelfTag,
                  { borderColor: shelf.color || Colors.primary.main },
                ]}
              >
                <View
                  style={[
                    styles.shelfColorDot,
                    { backgroundColor: shelf.color || Colors.primary.main },
                  ]}
                />
                <Text style={styles.shelfTagText} numberOfLines={1}>
                  {shelf.name}
                </Text>
              </View>
            ))}
            {entry.shelves.length > 3 && (
              <Text style={styles.moreShelvesText}>
                +{entry.shelves.length - 3}
              </Text>
            )}
          </View>
        )}
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
    borderLeftColor: Colors.primary.main,
    position: 'relative',
  },
  date: {
    fontFamily: 'Inter-regular',
    fontSize: 14,
    color: Colors.fade.main,
    marginBottom: 8,
  },
  pinnedContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.primary.light,
    padding: 6,
    borderRadius: 12,
    zIndex: 1,
  },
  pinnedText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.primary.main,
  },
  title: {
    fontFamily: 'Playfair-SemiBold',
    fontSize: 20,
    color: Colors.text.dark,
    marginBottom: 1,
    paddingRight: 40,
  },
  excerpt: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.medium,
    lineHeight: 20,
  },
  shelvesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    maxHeight: 32,
    // marginTop: 8,
    alignItems: 'center',
  },
  shelfTag: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    // borderRadius: 12,
   width: '0%',
  },
  shelfColorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  shelfTagText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: Colors.text.dark,
    flex: 1,
  },
  moreShelvesText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: Colors.fade.main,
  },
});