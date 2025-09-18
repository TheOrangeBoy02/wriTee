import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Search, Calendar, PenLine, RefreshCw, X } from 'lucide-react-native';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import JournalEntryItem from '@/components/JournalEntryItem';
import { getJournalEntries, getAllTags, getJournalEntriesByTags } from '@/services/journal';
import { JournalEntry } from '@/types';

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadEntries();
    loadTags();
  }, []);

  useEffect(() => {
    loadFilteredEntries();
  }, [selectedTags]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const { entries: journalEntries } = await getJournalEntries();
      setEntries(journalEntries);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const tags = await getAllTags();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const loadFilteredEntries = async () => {
    if (selectedTags.length === 0) {
      loadEntries();
      return;
    }

    setIsLoading(true);
    try {
      const { entries: filteredEntries } = await getJournalEntriesByTags(selectedTags);
      setEntries(filteredEntries);
    } catch (error) {
      console.error('Error loading filtered entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewEntry = () => {
    router.push('/journal/[id]?id=new');
  };

  const handleEntryPress = (id: string) => {
    router.push(`/journal/${id}`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadTags();
      await loadFilteredEntries();
    } catch (error) {
      console.error('Error refreshing journal entries:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSelectedTags([]);
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
      {/* Custom Header Row */}
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Journal</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={20} color={Colors.text.medium} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={Colors.text.medium} />
            ) : (
              <RefreshCw size={20} color={Colors.text.medium} />
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.calendarButton}
            onPress={() => router.push('/calendar')}
          >
            <Calendar size={20} color={Colors.text.medium} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tag Filter Section */}
      {availableTags.length > 0 && (
        <View style={styles.tagFilterContainer}>
          <View style={styles.tagFilterHeader}>
            <Text style={styles.tagFilterTitle}>Filter by tags:</Text>
            {selectedTags.length > 0 && (
              <TouchableOpacity onPress={clearAllFilters} style={styles.clearButton}>
                <X size={16} color={Colors.text.medium} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagFilterScroll}>
            <View style={styles.tagFilterRow}>
              {availableTags.map((tag) => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagFilterButton,
                    selectedTags.includes(tag) && styles.tagFilterButtonActive
                  ]}
                  onPress={() => toggleTag(tag)}
                >
                  <Text style={[
                    styles.tagFilterButtonText,
                    selectedTags.includes(tag) && styles.tagFilterButtonTextActive
                  ]}>
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: Colors.background.main,
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.text.dark,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  searchButton: {
    backgroundColor: Colors.background.light,
    padding: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  refreshButton: {
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
  
  // Tag Filter Styles
  tagFilterContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  tagFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagFilterTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text.dark,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clearButtonText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.medium,
  },
  tagFilterScroll: {
    flexGrow: 0,
  },
  tagFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
  },
  tagFilterButton: {
    backgroundColor: Colors.background.light,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  tagFilterButtonActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  tagFilterButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.text.dark,
  },
  tagFilterButtonTextActive: {
    color: '#fff',
  },
});