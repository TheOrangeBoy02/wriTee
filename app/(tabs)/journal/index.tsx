//app/(tabs)/journal/index.tsx

import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, PinIcon ,Search, PenLine, RefreshCw, X, TrashIcon } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import JournalEntryItem from '@/components/JournalEntryItem';
import { getJournalEntries, getAllTags, getJournalEntriesByTags, deleteJournalEntry, togglePinJournalEntry } from '@/services/journal';
import { JournalEntry } from '@/types';




export default function JournalScreen() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const router = useRouter();

const handlePinEntry = async (id: string) => {
  try {
    await togglePinJournalEntry(id);
    // Refresh the entries list after pinning
    loadEntries();
  } catch (error) {
    console.error('Error pinning entry:', error);
    // TODO: Show error toast
  }
};


const handleDeleteEntry = async (id: string) => {
    try {
      await deleteJournalEntry(id);
      // Refresh the entries list after deletion
      await loadFilteredEntries(); // Use loadFilteredEntries to respect current filters
    } catch (error) {
      console.error('Error deleting entry:', error);
      // TODO: Show error toast
    }
  };

  useEffect(() => {
    loadEntries();
    loadTags();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadEntries();
      loadTags();
    }, [])
  );

  useEffect(() => {
    loadFilteredEntries();
  }, [selectedTags]);

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

  const clearAllFilters = () => setSelectedTags([]);

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

  const SwipeableItem = ({ item }: { item: JournalEntry }) => {
  const translateX = useSharedValue(0);
  const SWIPE_TRIGGER = 80;
  const MAX_SWIPE = 100;
  

  // Updated gesture with horizontal dominance detection
  const gesture = Gesture.Pan()
  .activeOffsetX([-15, 15])    // Need MORE horizontal movement (15px) to activate swipe
  .failOffsetY([-10, 10])       // Fail quickly if vertical movement (10px) detected
  .onUpdate((event) => {
    translateX.value = Math.min(Math.max(event.translationX, -MAX_SWIPE), MAX_SWIPE);
  })
  .onEnd(() => {
    if (translateX.value > SWIPE_TRIGGER) {
      runOnJS(handlePinEntry)(item.id);
    } else if (translateX.value < -SWIPE_TRIGGER) {
      runOnJS(handleDeleteEntry)(item.id);
    }
    translateX.value = withTiming(0, { duration: 200 });
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{ marginBottom: 2 }}>
      {/* Background actions (Pin + Delete) */}
      <View style={styles.swipeActions}>
        <View style={[styles.pinAction, item.pinned && styles.unpinAction]}>
          <PinIcon color={item.pinned ? Colors.primary.dark : Colors.primary.main} />
          <Text style={[styles.actionText, item.pinned && styles.unpinText]}>
            {item.pinned ? 'Unpin' : 'Pin'}
          </Text>
        </View>

        <View style={styles.deleteAction}>
          <TrashIcon color="#fff" />
          <Text style={styles.deleteText}>Delete</Text>
        </View>
      </View>

      {/* Foreground journal card */}
      <GestureDetector gesture={gesture}>
        <Animated.View style={[animatedStyle]}>
          <JournalEntryItem
            entry={item}
            onPress={() => handleEntryPress(item.id)}
          />
        </Animated.View>
      </GestureDetector>

    </View>
    
  );
};

   const translateX = useSharedValue(0);
  const SWIPE_TRIGGER = 80;
  const MAX_SWIPE = 100;

  return (
    <View style={styles.container}>
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

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SwipeableItem item={item} />}
          contentContainerStyle={styles.entriesList}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[Colors.primary.main]}
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
   swipeActions: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pinAction: {
    backgroundColor: Colors.primary.light,
    width: 130,
    height: "89%",
    marginBottom: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  unpinAction: {
    backgroundColor: Colors.background.light,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  deleteAction: {
    backgroundColor: '#E57373',
    width: 130,
    height: "89%",
    marginBottom: 8,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: Colors.primary.main,
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  unpinText: {
    color: Colors.primary.dark,
  },
  deleteText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});