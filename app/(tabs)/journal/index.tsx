//app/(tabs)/journal/index.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, PinIcon, Search, PenLine, RefreshCw, X, TrashIcon, BookMarked } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Colors from '@/constants/Colors';
import JournalEntryItem from '@/components/JournalEntryItem';
import { getJournalEntries, deleteJournalEntry, togglePinJournalEntry } from '@/services/journal';
import { getShelves } from '@/services/shelf';
import { JournalEntry, Shelf } from '@/types';




export default function JournalScreen() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showShelfFilter, setShowShelfFilter] = useState(false);
  const [selectedShelfId, setSelectedShelfId] = useState<string | null>(null);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
      await loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      // TODO: Show error toast
    }
  };

  useEffect(() => {
    loadEntries();
    loadShelves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShelfId]);

  useFocusEffect(
    React.useCallback(() => {
      loadEntries();
      loadShelves();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  const loadShelves = async () => {
    try {
      const shelvesData = await getShelves();
      setShelves(shelvesData);
    } catch (error) {
      console.error('Error loading shelves:', error);
    }
  };

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const { entries: journalEntries } = await getJournalEntries(0, 100, selectedShelfId || undefined);
      setEntries(journalEntries);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter entries based on search term
  const filteredEntries = useMemo(() => {
    if (!searchTerm.trim()) {
      return entries;
    }

    const lowerSearchTerm = searchTerm.toLowerCase().trim();
    return entries.filter(entry => {
      // Search in title
      const titleMatch = entry.title?.toLowerCase().includes(lowerSearchTerm);
      // Search in content
      const contentMatch = entry.content?.toLowerCase().includes(lowerSearchTerm);

      return titleMatch || contentMatch;
    });
  }, [entries, searchTerm]);

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
      await loadEntries();
    } catch (error) {
      console.error('Error refreshing journal entries:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderEmptyState = () => {
    // If there's an active search, show "no results" message
    if (searchTerm.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Search size={64} color={Colors.neutral.light} />
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyText}>
            No entries match "{searchTerm}". Try a different search term.
          </Text>
        </View>
      );
    }

    // If filtering by shelf, show "no entries in shelf" message
    if (selectedShelfId) {
      const selectedShelf = shelves.find(s => s.id === selectedShelfId);
      return (
        <View style={styles.emptyContainer}>
          <BookMarked size={64} color={Colors.neutral.light} />
          <Text style={styles.emptyTitle}>No Entries in This Shelf</Text>
          <Text style={styles.emptyText}>
            {selectedShelf ? `"${selectedShelf.name}" doesn't have any entries yet.` : 'This shelf doesn\'t have any entries yet.'}
          </Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleNewEntry}>
            <Text style={styles.emptyButtonText}>Create Entry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Default: no entries at all
    return (
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
  };

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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Journal</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedShelfId && styles.filterButtonActive]}
            onPress={() => setShowShelfFilter((prev) => !prev)}
          >
            <BookMarked size={20} color={selectedShelfId ? Colors.primary.main : Colors.text.medium} />
          </TouchableOpacity>
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

      {showShelfFilter && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.shelfFilterContainer}
          contentContainerStyle={styles.shelfFilterContent}
        >
          <TouchableOpacity
            style={[styles.shelfFilterChip, !selectedShelfId && styles.shelfFilterChipActive]}
            onPress={() => setSelectedShelfId(null)}
          >
            <Text style={[styles.shelfFilterText, !selectedShelfId && styles.shelfFilterTextActive]}>
              All Entries
            </Text>
          </TouchableOpacity>
          {shelves.map((shelf) => (
            <TouchableOpacity
              key={shelf.id}
              style={[
                styles.shelfFilterChip,
                selectedShelfId === shelf.id && styles.shelfFilterChipActive,
              ]}
              onPress={() => setSelectedShelfId(shelf.id)}
            >
              <View
                style={[
                  styles.shelfFilterDot,
                  { backgroundColor: shelf.color || Colors.primary.main },
                ]}
              />
              <Text
                style={[
                  styles.shelfFilterText,
                  selectedShelfId === shelf.id && styles.shelfFilterTextActive,
                ]}
              >
                {shelf.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {showSearch && (
        <View style={styles.searchBarContainer}>
          <Search size={18} color={Colors.text.light} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            placeholderTextColor={Colors.text.light}
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoFocus={true}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearchButton}
              onPress={() => setSearchTerm('')}
            >
              <X size={18} color={Colors.text.medium} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.main} />
        </View>
      ) : (
        <FlatList
          data={filteredEntries}
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
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
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
    paddingTop: 5,
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
  filterButton: {
    backgroundColor: Colors.background.light,
    padding: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary.light,
  },
  
  shelfFilterContainer: {
    marginTop: 4,
    marginBottom: 8,
    maxHeight: 50,
  },
  shelfFilterContent: {
    paddingHorizontal: 24,
    gap: 8,
    alignItems: 'center',
  },
  shelfFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: Colors.background.light,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  shelfFilterChipActive: {
    backgroundColor: Colors.primary.light,
    borderColor: Colors.primary.main,
  },
  shelfFilterDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shelfFilterText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text.dark,
  },
  shelfFilterTextActive: {
    fontFamily: 'Inter-SemiBold',
    color: Colors.primary.main,
  },
});