import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { JournalEntry } from '@/types';


interface MinimalRecentEntryProps {
  entry: JournalEntry;
  onPress: () => void;
}

export default function MinimalRecentEntry({ entry, onPress }: MinimalRecentEntryProps) {
  const formattedDate = new Date(entry.entry_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.leftBar} />
      <View style={styles.content}>
         <Text style={styles.title}>{entry.title}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
        {entry.shelves && entry.shelves.length > 0 && (
          <View style={styles.shelvesContainer}>
            {entry.shelves.slice(0, 2).map((shelf) => (
              <View
                key={shelf.id}
                style={[
                  styles.shelfDot,
                  { backgroundColor: shelf.color || Colors.primary.main },
                ]}
              />
            ))}
            {entry.shelves.length > 2 && (
              <Text style={styles.moreShelvesText}>
                +{entry.shelves.length - 2}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5ff',
  
    borderRadius: 10,
    marginBottom: 2,
    minHeight: 10,
  },
  leftBar: {
    borderRadius: 20,
    width: 6,
    height: '50%',
    backgroundColor: Colors.primary.main,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#8a8a8aff',
    marginBottom: 2,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.text.dark,
  },
  shelvesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  shelfDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  moreShelvesText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: '#8a8a8aff',
  },
});
