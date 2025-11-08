// components/ShelfSelector.tsx

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import ShelfIcon from '@/components/ShelfIcon';
import Colors from '@/constants/Colors';
import { Shelf } from '@/types';
import { getShelves } from '@/services/shelf';

type ShelfSelectorProps = {
  selectedShelfIds: string[];
  onSelectionChange: (shelfIds: string[]) => void;
  compact?: boolean;
};

export default function ShelfSelector({
  selectedShelfIds,
  onSelectionChange,
  compact = false,
}: ShelfSelectorProps) {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [tempSelection, setTempSelection] = useState<string[]>(selectedShelfIds);

  useEffect(() => {
    loadShelves();
  }, []);

  useEffect(() => {
    setTempSelection(selectedShelfIds);
  }, [selectedShelfIds]);

  const loadShelves = async () => {
    try {
      const data = await getShelves();
      setShelves(data);
    } catch (error) {
      console.error('Error loading shelves:', error);
      Alert.alert('Error', 'Failed to load shelves');
    }
  };

  const toggleShelfSelection = (shelfId: string) => {
    setTempSelection((prev) =>
      prev.includes(shelfId)
        ? prev.filter((id) => id !== shelfId)
        : [...prev, shelfId]
    );
  };

  const handleSave = () => {
    onSelectionChange(tempSelection);
    setShowModal(false);
  };

  const handleCancel = () => {
    setTempSelection(selectedShelfIds);
    setShowModal(false);
  };

  const selectedShelves = shelves.filter((shelf) =>
    selectedShelfIds.includes(shelf.id)
  );

  if (compact) {
    return (
      <>
        <TouchableOpacity
          style={styles.compactButton}
          onPress={() => setShowModal(true)}
        >
          <ShelfIcon width={16} height={16} fill={Colors.primary.main} />
          <Text style={styles.compactButtonText}>
            {selectedShelves.length > 0
              ? `${selectedShelves.length} shelf${selectedShelves.length > 1 ? 'ves' : ''}`
              : 'Add to shelf'}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showModal}
          transparent
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Shelves</Text>
                <TouchableOpacity onPress={handleCancel}>
                  <X size={24} color={Colors.text.dark} />
                </TouchableOpacity>
              </View>

              {shelves.length === 0 ? (
                <View style={styles.emptyState}>
                  <ShelfIcon width={48} height={48} fill={Colors.fade.main} />
                  <Text style={styles.emptyText}>
                    No shelves available. Create a shelf first.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.shelfList}
                  showsVerticalScrollIndicator={false}
                >
                  {shelves.map((shelf) => {
                    const isSelected = tempSelection.includes(shelf.id);
                    return (
                      <TouchableOpacity
                        key={shelf.id}
                        style={[
                          styles.shelfOption,
                          isSelected && styles.selectedShelfOption,
                        ]}
                        onPress={() => toggleShelfSelection(shelf.id)}
                      >
                        <View style={styles.shelfOptionContent}>
                          <View
                            style={[
                              styles.colorIndicator,
                              {
                                backgroundColor:
                                  shelf.color || Colors.primary.main,
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.shelfOptionText,
                              isSelected && styles.selectedShelfText,
                            ]}
                          >
                            {shelf.name}
                          </Text>
                        </View>
                        {isSelected && (
                          <Check size={20} color={Colors.primary.main} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // Full version (non-compact)
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Shelves</Text>

      {selectedShelves.length > 0 && (
        <View style={styles.selectedShelvesContainer}>
          {selectedShelves.map((shelf) => (
            <View key={shelf.id} style={styles.shelfTag}>
              <View
                style={[
                  styles.tagColorDot,
                  { backgroundColor: shelf.color || Colors.primary.main },
                ]}
              />
              <Text style={styles.shelfTagText}>{shelf.name}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setShowModal(true)}
      >
        <ShelfIcon width={20} height={20} fill={Colors.primary.main} />
        <Text style={styles.selectButtonText}>
          {selectedShelves.length > 0 ? 'Edit Shelves' : 'Add to Shelves'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Shelves</Text>
              <TouchableOpacity onPress={handleCancel}>
                <X size={24} color={Colors.text.dark} />
              </TouchableOpacity>
            </View>

            {shelves.length === 0 ? (
              <View style={styles.emptyState}>
                <ShelfIcon width={48} height={48} fill={Colors.fade.main} />
                <Text style={styles.emptyText}>
                  No shelves available. Create a shelf first.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.shelfList}
                showsVerticalScrollIndicator={false}
              >
                {shelves.map((shelf) => {
                  const isSelected = tempSelection.includes(shelf.id);
                  return (
                    <TouchableOpacity
                      key={shelf.id}
                      style={[
                        styles.shelfOption,
                        isSelected && styles.selectedShelfOption,
                      ]}
                      onPress={() => toggleShelfSelection(shelf.id)}
                    >
                      <View style={styles.shelfOptionContent}>
                        <View
                          style={[
                            styles.colorIndicator,
                            {
                              backgroundColor:
                                shelf.color || Colors.primary.main,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.shelfOptionText,
                            isSelected && styles.selectedShelfText,
                          ]}
                        >
                          {shelf.name}
                        </Text>
                      </View>
                      {isSelected && (
                        <Check size={20} color={Colors.primary.main} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
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
    marginBottom: 20,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.text.dark,
    marginBottom: 8,
  },
  selectedShelvesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  shelfTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background.light,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  shelfTagText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.dark,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary.light,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.primary.main,
  },
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.background.light,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  compactButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: Colors.text.dark,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.main,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
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
  shelfList: {
    maxHeight: 400,
    marginBottom: 20,
  },
  shelfOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: Colors.background.light,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedShelfOption: {
    backgroundColor: Colors.primary.light,
  },
  shelfOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  shelfOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
    flex: 1,
  },
  selectedShelfText: {
    fontFamily: 'Inter-SemiBold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    marginBottom: 20,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.medium,
    textAlign: 'center',
    marginTop: 16,
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
