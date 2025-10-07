import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Search, Calendar, PenLine, RefreshCw, X, Bold } from 'lucide-react-native';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import JournalEntryItem from '@/components/JournalEntryItem';
import { getJournalEntries, getAllTags, getJournalEntriesByTags } from '@/services/journal';
import { JournalEntry } from '@/types';

export default function JournalScreen() {
  // Custom empty state for search
  const renderSearchEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Search size={64} color={Colors.neutral.light} />
      <Text style={styles.emptyTitle}>Searched word not found</Text>
      <Text style={styles.emptyText}>
        Try a different word or check your spelling.
      </Text>
    </View>
  );
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Reload entries every time screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadEntries();
      loadTags();
    }, [])
  );

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
      await loadEntries();
    } else {
      setIsLoading(true);
      try {
        const { entries: filteredEntries } = await getJournalEntriesByTags(selectedTags);
        setEntries(filteredEntries);
      } catch (error) {
        console.error('Error loading filtered entries:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNewEntry = () => {
    router.push({
      pathname: '/journal/[id]',
      params: { id: 'new' }
    });
  };

  const handleEntryPress = (id: string) => {
    router.push({
      pathname: '/journal/[id]',
      params: { id: id }
    });
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
          <TouchableOpacity
            style={[styles.searchButton, showSearch && styles.searchButtonActive]}
            onPress={() => setShowSearch((prev) => !prev)}
          >
            <Search size={20} color={showSearch ? Colors.primary.main : Colors.text.medium} />
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
        </View>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={styles.searchBarContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search journal entries..."
            placeholderTextColor={Colors.text.medium}
            autoFocus
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchTerm('')}>
              <X size={18} color={Colors.text.medium} />
            </TouchableOpacity>
          )}
        </View>
      )}

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
          data={entries
            .slice() // copy to avoid mutating state
            .sort((a, b) => {
              // Sort descending by updated_at, fallback to created_at
              const aDate = new Date(a.updated_at || a.created_at || 0).getTime();
              const bDate = new Date(b.updated_at || b.created_at || 0).getTime();
              return bDate - aDate;
            })
            .filter(e => {
              if (!searchTerm.trim()) return true;
              const term = searchTerm.trim().toLowerCase();
              return (
                e.title.toLowerCase().includes(term) ||
                e.content.toLowerCase().includes(term)
              );
            })}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <JournalEntryItem
              entry={item}
              onPress={() => handleEntryPress(item.id)}
            />
          )}
          contentContainerStyle={styles.entriesList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={searchTerm.trim() ? renderSearchEmptyState : renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary.main]}
              tintColor={Colors.primary.main}
              progressBackgroundColor={Colors.background.light}
            />
          }
        />
      )}

      <TouchableOpacity style={styles.fabButton} onPress={handleNewEntry}>
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.light,
    marginHorizontal: 24,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
    padding: 0,
   
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
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
  searchButtonActive: {
    backgroundColor: Colors.primary.light,
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