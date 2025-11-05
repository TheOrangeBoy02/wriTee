// app/(tabs)/shelves.tsx

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Plus, Edit2, Trash2, X } from 'lucide-react-native';
import ShelfIcon from '@/assets/images/shelf-icon.svg';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import { Shelf } from '@/types';
import {
  getShelves,
  createShelf,
  updateShelf,
  deleteShelf,
  isShelfInUse,
} from '@/services/shelf';

// Predefined color palette for shelves
const SHELF_COLORS = [
  '#ff0000ff', // Red
  '#4ECDC4', // Teal
  '#0073ffff', // Blue
  '#FF6600', // orange
  '#e642ffff', // Mint
  '#FFD93D', // Yellow
  '#C7CEEA', // Lavender
  '#FF8B94', // Pink
  '#029416ff', // Light Green
  '#8a00f4ff', // Purple
];

export default function ShelvesScreen() {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingShelf, setEditingShelf] = useState<Shelf | null>(null);
  const [newShelfName, setNewShelfName] = useState('');
  const [selectedColor, setSelectedColor] = useState(SHELF_COLORS[0]);

  useEffect(() => {
    loadShelves();
  }, []);

  const loadShelves = async () => {
    try {
      setIsLoading(true);
      const data = await getShelves();
      setShelves(data);
    } catch (error) {
      console.error('Error loading shelves:', error);
      Alert.alert('Error', 'Failed to load shelves. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShelf = async () => {
    if (!newShelfName.trim()) {
      Alert.alert('Error', 'Please enter a shelf name');
      return;
    }

    try {
      await createShelf(newShelfName.trim(), selectedColor);
      setNewShelfName('');
      setSelectedColor(SHELF_COLORS[0]);
      setShowCreateModal(false);
      loadShelves();
      Alert.alert('Success', 'Shelf created successfully');
    } catch (error: any) {
      console.error('Error creating shelf:', error);
      Alert.alert('Error', error.message || 'Failed to create shelf');
    }
  };

  const handleEditShelf = async () => {
    if (!editingShelf || !newShelfName.trim()) {
      Alert.alert('Error', 'Please enter a shelf name');
      return;
    }

    try {
      await updateShelf(editingShelf.id, {
        name: newShelfName.trim(),
        color: selectedColor,
      });
      setNewShelfName('');
      setSelectedColor(SHELF_COLORS[0]);
      setEditingShelf(null);
      setShowEditModal(false);
      loadShelves();
      Alert.alert('Success', 'Shelf updated successfully');
    } catch (error: any) {
      console.error('Error updating shelf:', error);
      Alert.alert('Error', error.message || 'Failed to update shelf');
    }
  };

  const handleDeleteShelf = async (shelf: Shelf) => {
    try {
      const inUse = await isShelfInUse(shelf.id);

      Alert.alert(
        'Delete Shelf',
        inUse
          ? `"${shelf.name}" is being used by journal entries. Deleting it will remove it from all entries. Continue?`
          : `Are you sure you want to delete "${shelf.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteShelf(shelf.id);
                loadShelves();
                Alert.alert('Success', 'Shelf deleted successfully');
              } catch (error: any) {
                console.error('Error deleting shelf:', error);
                Alert.alert('Error', error.message || 'Failed to delete shelf');
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error checking shelf usage:', error);
      Alert.alert('Error', 'Failed to check shelf usage');
    }
  };

  const openEditModal = (shelf: Shelf) => {
    setEditingShelf(shelf);
    setNewShelfName(shelf.name);
    setSelectedColor(shelf.color || SHELF_COLORS[0]);
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingShelf(null);
    setNewShelfName('');
    setSelectedColor(SHELF_COLORS[0]);
  };

  const renderShelfModal = (isEdit: boolean) => (
    <Modal
      visible={isEdit ? showEditModal : showCreateModal}
      transparent
      animationType="fade"
      onRequestClose={closeModals}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEdit ? 'Edit Shelf' : 'Create New Shelf'}
            </Text>
            <TouchableOpacity onPress={closeModals}>
              <X size={24} color={Colors.text.dark} />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Shelf Name</Text>
          <TextInput
            style={styles.input}
            value={newShelfName}
            onChangeText={setNewShelfName}
            placeholder="Enter shelf name"
            placeholderTextColor={Colors.fade.main}
      
          />

          <Text style={styles.inputLabel}>Color</Text>
          <View style={styles.colorGrid}>
            {SHELF_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.selectedColor,
                ]}
                onPress={() => setSelectedColor(color)}
              />
            ))}
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={closeModals}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={isEdit ? handleEditShelf : handleCreateShelf}
            >
              <Text style={styles.saveButtonText}>
                {isEdit ? 'Save' : 'Create'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Header title="Shelves" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.headerTextContainer}>
            <ShelfIcon width={32} height={32} fill={Colors.primary.main} />
            <Text style={styles.headerText}>
              Organize your journal entries with shelves
            </Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color={Colors.background.main} />
            <Text style={styles.createButtonText}>New Shelf</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading shelves...</Text>
          </View>
        ) : shelves.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ShelfIcon width={64} height={64} fill={Colors.primary.main} />
            <Text style={styles.emptyTitle}>No shelves yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first shelf to start organizing your journal entries
            </Text>
          </View>
        ) : (
          <View style={styles.shelvesGrid}>
            {shelves.map((shelf) => (
              <View key={shelf.id} style={styles.shelfCard}>
                <View
                  style={[
                    styles.shelfColorBar,
                    { backgroundColor: shelf.color || Colors.primary.main },
                  ]}
                />
                <View style={styles.shelfContent}>
                  <Text style={styles.shelfName} numberOfLines={1}>
                    {shelf.name}
                  </Text>
                  <View style={styles.shelfActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => openEditModal(shelf)}
                    >
                      <Edit2 size={18} color={Colors.primary.main} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteShelf(shelf)}
                    >
                      <Trash2 size={18} color={Colors.error.main} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {renderShelfModal(false)}
      {renderShelfModal(true)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerSection: {
    marginBottom: 24,
  },
  headerTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary.main,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  createButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.background.main,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.fade.main,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontFamily: 'Playfair-SemiBold',
    fontSize: 24,
    color: Colors.text.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  shelvesGrid: {
    gap: 12,
  },
  shelfCard: {
    backgroundColor: Colors.background.light,
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  shelfColorBar: {
    width: 6,
  },
  shelfContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  shelfName: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text.dark,
    marginRight: 12,
  },
  shelfActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.background.main,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Playfair-SemiBold',
    fontSize: 24,
    color: Colors.text.dark,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.text.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background.light,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
    marginBottom: 20,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 24,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: Colors.text.dark,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background.light,
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.text.dark,
  },
  saveButton: {
    backgroundColor: Colors.primary.main,
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.background.main,
  },
});
