//app/(tabs)/journal/index.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, PinIcon, Search, PenLine, RefreshCw, X, TrashIcon, BookMarked, Filter, XCircle } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, runOnJS } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Colors from '@/constants/Colors';
import JournalEntryItem from '@/components/JournalEntryItem';
import JournalEntrySkeleton from '@/components/JournalEntrySkeleton';
import { getJournalEntries, deleteJournalEntry, togglePinJournalEntry } from '@/services/journal';
import { getShelves } from '@/services/shelf';
import { JournalEntry, Shelf } from '@/types';
import ShelfIcon from '@/components/ShelfIcon';




export default function JournalScreen() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showShelfFilter, setShowShelfFilter] = useState(false);
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([]);
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Track when we last loaded to avoid excessive refetching
  const lastLoadTime = useRef<number>(0);
  const STALE_THRESHOLD = 30000; // 30 seconds - reload if data is older than this

const handlePinEntry = async (id: string) => {
  // Optimistic update - update UI immediately
  const entryIndex = entries.findIndex(e => e.id === id);
  if (entryIndex === -1) return;

  const originalEntries = [...entries];
  const updatedEntries = [...entries];
  updatedEntries[entryIndex] = {
    ...updatedEntries[entryIndex],
    pinned: !updatedEntries[entryIndex].pinned
  };

  // Sort entries: pinned first, then by date
  updatedEntries.sort((a, b) => {
    if (a.pinned !== b.pinned) return b.pinned ? 1 : -1;
    return new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime();
  });

  setEntries(updatedEntries);

  try {
    await togglePinJournalEntry(id);
  } catch (error) {
    console.error('Error pinning entry:', error);
    // Revert on error
    setEntries(originalEntries);
  }
};


const handleDeleteEntry = async (id: string) => {
  // Optimistic update - remove from UI immediately
  const originalEntries = [...entries];
  setEntries(entries.filter(e => e.id !== id));

  try {
    await deleteJournalEntry(id);
  } catch (error) {
    console.error('Error deleting entry:', error);
    // Revert on error
    setEntries(originalEntries);
  }
};

  useEffect(() => {
    loadEntries();
    loadShelves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadEntries(true); // Force reload when shelf filter changes
  }, [selectedShelfIds]);

  useFocusEffect(
    React.useCallback(() => {
      // Only reload if data is stale - loadEntries handles the check
      loadEntries();
      loadShelves();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedShelfIds])
  );

  const loadShelves = async () => {
    try {
      const shelvesData = await getShelves();
      setShelves(shelvesData);
    } catch (error) {
      console.error('Error loading shelves:', error);
    }
  };

  const loadEntries = async (force = false) => {
    // Skip loading if data is fresh (unless forced)
    const now = Date.now();
    if (!force && entries.length > 0 && now - lastLoadTime.current < STALE_THRESHOLD) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // If multiple shelves selected, load all and filter client-side
      // If single shelf, use the API parameter for efficiency
      const singleShelfId = selectedShelfIds.length === 1 ? selectedShelfIds[0] : undefined;
      const { entries: journalEntries } = await getJournalEntries(0, 100, singleShelfId);

      // Filter by multiple shelves if needed
      if (selectedShelfIds.length > 1) {
        const filtered = journalEntries.filter(entry =>
          entry.shelves?.some(shelf => selectedShelfIds.includes(shelf.id))
        );
        setEntries(filtered);
      } else {
        setEntries(journalEntries);
      }

      lastLoadTime.current = now;
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
      await loadEntries(true); // Force reload on manual refresh
    } catch (error) {
      console.error('Error refreshing journal entries:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderEmptyState = () => {
    const hasSearchOrFilter = searchTerm.trim() || selectedShelfIds.length > 0;
    const isSearching = searchTerm.trim();
    const selectedShelves = shelves.filter(shelf => selectedShelfIds.includes(shelf.id));
    const shelfNames = selectedShelves.map(s => s.name).join(', ');

    if (hasSearchOrFilter) {
      return (
        <View style={styles.emptyContainer}>
          <Search size={64} color={Colors.neutral.light} />
          <Text style={styles.emptyTitle}>
            {isSearching ? 'No Results Found' : `No Entries in ${shelfNames || 'Selected Shelves'}`}
          </Text>
          <Text style={styles.emptyText}>
            {isSearching
              ? `No entries match "${searchTerm}". Try a different search term.`
              : `${shelfNames || 'These shelves are'} empty. Add entries to see them here.`}
          </Text>
        </View>
      );
    }

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
            style={[styles.filterButton, selectedShelfIds.length > 0 && styles.filterButtonActive]}
            onPress={() => setShowShelfFilter((prev) => !prev)}
          >
            <ShelfIcon color={selectedShelfIds.length > 0 ? Colors.primary.main : Colors.text.medium} />
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
          {selectedShelfIds.length > 0 && (
            <TouchableOpacity
              style={styles.clearFilterChip}
              onPress={() => setSelectedShelfIds([])}
            >
              <XCircle size={16} color={Colors.text.medium} />

            </TouchableOpacity>
          )}
          {shelves.map((shelf) => {
            const isSelected = selectedShelfIds.includes(shelf.id);
            return (
              <TouchableOpacity
                key={shelf.id}
                style={[
                  styles.shelfFilterChip,
                  isSelected && styles.shelfFilterChipActive,
                ]}
                onPress={() => {
                  if (isSelected) {
                    setSelectedShelfIds(selectedShelfIds.filter(id => id !== shelf.id));
                  } else {
                    setSelectedShelfIds([...selectedShelfIds, shelf.id]);
                  }
                }}
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
                    isSelected && styles.shelfFilterTextActive,
                  ]}
                >
                  {shelf.name}
                </Text>
              </TouchableOpacity>
            );
          })}
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
        <JournalEntrySkeleton count={5} />
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
    // backgroundColor: Colors.background.light,
    marginTop: 4,
    marginBottom: 12,
    flexGrow: 0,
    flexShrink: 0,
  },
  shelfFilterContent: {
    paddingHorizontal: 24,
    gap: 8,
    alignItems: 'center',
    paddingVertical: 8,
    flexGrow: 0,
  },
  clearFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.background.light,
    borderWidth: 1,
    borderColor: Colors.text.light,
  },
  clearFilterText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.text.medium,
  },
  shelfFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
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