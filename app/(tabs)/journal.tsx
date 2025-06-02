import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Search, Calendar, PenLine } from 'lucide-react-native';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import JournalEntryItem from '@/components/JournalEntryItem';
import { getJournalEntries } from '@/services/journal';
import { JournalEntry } from '@/types';

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const journalEntries = await getJournalEntries();
      setEntries(journalEntries);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewEntry = () => {
    router.push('/journal/new');
  };

  const handleEntryPress = (id: string) => {
    router.push(`/journal/${id}`);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <PenLine size={64} color={Colors.neutral.light} />
      <Text style={styles.emptyTitle}>Start Your Journal</Text>
      <Text style={styles.emptyText}>
        Begin capturing your thoughts and reflections with your first entry.
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleNewEntry}>
        <Text style={styles.emptyButtonText}>Create First Entry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Journal" />
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={20} color={Colors.text.medium} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.calendarButton}
          onPress={() => router.push('/calendar')}
        >
          <Calendar size={20} color={Colors.text.medium} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JournalEntryItem
              entry={item}
              onPress={() => handleEntryPress(item.id)}
            />
          )}
          contentContainerStyle={styles.entriesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}

      <TouchableOpacity style={styles.fabButton} onPress={handleNewEntry}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchButton: {
    backgroundColor: Colors.background.light,
    padding: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  calendarButton: {
    backgroundColor: Colors.background.light,
    padding: 10,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entriesList: {
    padding: 24,
    paddingTop: 0,
    flexGrow: 1,
  },
  fabButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: Colors.primary.main,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: Colors.text.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  emptyButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});