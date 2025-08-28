import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Search, Calendar, PenLine, RefreshCw, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import JournalEntryItem from '@/components/JournalEntryItem';
import { getJournalEntries } from '@/services/journal';
import { getUserShelves, createShelf, getJournalEntriesByShelfIds } from '@/services/tags';
import { JournalEntry, Shelf } from '@/types';

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableShelves, setAvailableShelves] = useState<Shelf[]>([]);
  const [selectedShelves, setSelectedShelves] = useState<Shelf[]>([]);
  const [showCreateShelfModal, setShowCreateShelfModal] = useState(false);
  const [newShelfName, setNewShelfName] = useState('');
  const [showLeftChevron, setShowLeftChevron] = useState(false);
  const [showRightChevron, setShowRightChevron] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  useEffect(() => {
    loadEntries();
    loadShelves();
  }, []);

  useEffect(() => {
    loadFilteredEntries();
  }, [selectedShelves]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const loadShelves = async () => {
    try {
      const shelves = await getUserShelves();
      setAvailableShelves(shelves);
    } catch (error) {
      console.error('Error loading shelves:', error);
    }
  };

  const loadFilteredEntries = async () => {
    if (selectedShelves.length === 0) {
      loadEntries();
      return;
    }

    setIsLoading(true);
    try {
      const shelfIds = selectedShelves.map(shelf => shelf.id);
      const { entries: filteredEntries } = await getJournalEntriesByShelfIds(shelfIds);
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
      await loadShelves();
      await loadFilteredEntries();
    } catch (error) {
      console.error('Error refreshing journal entries:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleShelf = (shelf: Shelf) => {
    setSelectedShelves(prev => 
      prev.find(s => s.id === shelf.id) 
        ? prev.filter(s => s.id !== shelf.id)
        : [...prev, shelf]
    );
  };

  const clearAllFilters = () => {
    setSelectedShelves([]);
  };

  const handleCreateShelf = () => {
    setShowCreateShelfModal(true);
  };

  const handleCreateShelfSubmit = async () => {
    const trimmedShelf = newShelfName.trim();
    
    if (!trimmedShelf) {
      Alert.alert('Invalid Shelf', 'Please enter a shelf name.');
      return;
    }
    
    try {
      // Create shelf in database
      const newShelf = await createShelf(trimmedShelf);
      
      // Add the new shelf to available shelves
      setAvailableShelves(prev => [...prev, newShelf]);
      
      // Close modal and reset input
      setShowCreateShelfModal(false);
      setNewShelfName('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create shelf');
    }
  };

  const handleCancelCreateShelf = () => {
    setShowCreateShelfModal(false);
    setNewShelfName('');
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    setShowLeftChevron(contentOffset.x > 0);
    setShowRightChevron(contentOffset.x < contentSize.width - layoutMeasurement.width);
  };

  const scrollLeft = () => {
    scrollViewRef.current?.scrollTo({ x: 0, animated: true });
  };

  const scrollRight = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const getSortedShelves = () => {
    return availableShelves.sort((a, b) => {
      const aIsSelected = selectedShelves.find(s => s.id === a.id) ? 1 : 0;
      const bIsSelected = selectedShelves.find(s => s.id === b.id) ? 1 : 0;
      return bIsSelected - aIsSelected;
    });
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

      {/* Shelves Section */}
      <View style={styles.shelvesSection}>
        <Text style={styles.shelvesSectionTitle}>Shelves</Text>
        <View style={styles.shelvesContainer}>
          {/* Left Chevron */}
          {showLeftChevron && (
            <TouchableOpacity style={styles.chevronButton} onPress={scrollLeft}>
              <ChevronLeft size={16} color={Colors.text.medium} />
            </TouchableOpacity>
          )}
          
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.shelvesScroll}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            <View style={styles.shelvesRow}>
              {/* Add Shelf Button */}
              <TouchableOpacity style={styles.addShelfButton} onPress={handleCreateShelf}>
                <Plus size={20} color="#fff" />
              </TouchableOpacity>
              
              {/* Shelf Pills */}
              {getSortedShelves().map((shelf) => (
                <TouchableOpacity
                  key={shelf.id}
                  style={[
                    styles.shelfPill,
                    selectedShelves.find(s => s.id === shelf.id) && styles.shelfPillActive
                  ]}
                  onPress={() => toggleShelf(shelf)}
                >
                  <Text style={[
                    styles.shelfPillText,
                    selectedShelves.find(s => s.id === shelf.id) && styles.shelfPillTextActive
                  ]}>
                    {shelf.name.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          {/* Right Chevron */}
          {showRightChevron && (
            <TouchableOpacity style={styles.chevronButton} onPress={scrollRight}>
              <ChevronRight size={16} color={Colors.text.medium} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Entries Section */}

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

      {/* Create Shelf Modal */}
      <Modal
        visible={showCreateShelfModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelCreateShelf}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Create New Shelf</Text>
            <TextInput
              style={styles.modalInput}
              value={newShelfName}
              onChangeText={setNewShelfName}
              placeholder="Enter shelf name..."
              placeholderTextColor={Colors.text.medium}
              autoFocus={true}
              maxLength={20}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCancelCreateShelf}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalCreateButton}
                onPress={handleCreateShelfSubmit}
              >
                <Text style={styles.modalCreateButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 70,
    paddingBottom:20 ,
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
  
  // Shelves Section
  shelvesSection: {
    backgroundColor: '#e6e7ecff',
    padding: 12,
    borderRadius: 16,
    marginHorizontal: 22,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  shelvesSectionTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    color: Colors.text.medium,
    marginBottom: 12,
  },
  shelvesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 6,
  },
  shelvesScroll: {
    flex: 1,
  },
  shelvesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 16,
  },
  addShelfButton: {
    backgroundColor: '#000',
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shelfPill: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  shelfPillActive: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  shelfPillText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: Colors.text.dark,
    fontWeight: '700',
  },
  shelfPillTextActive: {
    color: '#fff',
  },
  
  // Entries Section
  entriesSection: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  entriesSectionTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  modalContainer: {
    backgroundColor: Colors.background.main,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.text.dark,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.background.light,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text.dark,
  },
  modalCreateButton: {
    flex: 1,
    backgroundColor: Colors.primary.main,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCreateButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#fff',
  },
});