import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { X } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { Shelf } from '@/types';

// Legacy support for Tag type
type Tag = Shelf;

interface TagsInputProps {
  selectedTags?: Tag[];
  onTagsChange?: (tags: Tag[]) => void;
  availableTags?: Tag[];
  selectedShelves?: Shelf[];
  onShelvesChange?: (shelves: Shelf[]) => void;
  availableShelves?: Shelf[];
  placeholder?: string;
  maxTags?: number;
  readOnly?: boolean;
}

export default function TagsInput({ 
  selectedTags, 
  onTagsChange, 
  availableTags,
  selectedShelves,
  onShelvesChange,
  availableShelves,
  placeholder = "Add shelves...",
  maxTags = 10,
  readOnly = false 
}: TagsInputProps) {
  // Use shelf props if provided, otherwise fall back to tag props
  const items = selectedShelves || selectedTags || [];
  const onItemsChange = onShelvesChange || onTagsChange || (() => {});
  const availableItems = availableShelves || availableTags || [];
  const [showSuggestions, setShowSuggestions] = useState(false);

  const addItem = (item: Shelf) => {
    if (items.length >= maxTags) {
      Alert.alert('Shelf Limit', `You can only add up to ${maxTags} shelves.`);
      return;
    }
    
    if (items.find(selected => selected.id === item.id)) {
      Alert.alert('Duplicate Shelf', 'This shelf has already been added.');
      return;
    }
    
    onItemsChange([...items, item]);
    setShowSuggestions(false);
  };

  const removeItem = (itemToRemove: Shelf) => {
    onItemsChange(items.filter(item => item.id !== itemToRemove.id));
    setShowSuggestions(false);
  };

  const renderItem = ({ item }: { item: Shelf }) => (
    <View style={styles.tag}>
      <Text style={styles.tagText}>{item.name}</Text>
      {!readOnly && (
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeItem(item)}
        >
          <X size={14} color={Colors.text.medium} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Show selected shelf or dropdown button */}
      {readOnly ? (
        // Read-only mode: show selected shelves as pills
        items.length > 0 ? (
          <View style={styles.tagsContainer}>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsList}
            />
          </View>
        ) : (
          <Text style={styles.noTagsText}>No shelves added</Text>
        )
      ) : (
        // Edit mode: show dropdown interface
        <>
          {items.length > 0 ? (
            // Show selected shelf as a colored pill
            <View style={styles.selectedTagContainer}>
              {items.map((item) => (
                <View key={item.id} style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>{item.name.toUpperCase()}</Text>
                  <TouchableOpacity 
                    style={styles.removeSelectedButton}
                    onPress={() => removeItem(item)}
                  >
                    <X size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            // Show dropdown selector
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => setShowSuggestions(!showSuggestions)}
            >
              <Text style={styles.dropdownText}>{placeholder}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </TouchableOpacity>
          )}

          {/* Shelf pills dropdown */}
          {showSuggestions && availableItems.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.tagPillsContainer}>
                {availableItems
                  .filter(item => !items.find(selected => selected.id === item.id))
                  .map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.availableTagPill}
                      onPress={() => addItem(item)}
                    >
                      <Text style={styles.availableTagText}>{item.name.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    position: 'relative',
  },
  tagsContainer: {
    marginBottom: 8,
  },
  tagsList: {
    paddingVertical: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.light,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.primary.main,
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral.border,
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
    padding: 0,
  },
  addButton: {
    padding: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    marginTop: 4,
    backgroundColor: Colors.background.main,
    borderRadius: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    padding: 12,
  },
  tagPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availableTagPill: {
    backgroundColor: Colors.background.light,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
  },
  availableTagText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.text.dark,
  },
  noTagsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.medium,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  
  // New dropdown styles
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background.main,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignSelf: 'flex-start',
  },
  dropdownText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.text.medium,
  },
  dropdownArrow: {
    fontSize: 12,
    color: Colors.text.medium,
    marginLeft: 8,
  },
  
  // Selected tag styles for edit mode
  selectedTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6', // Purple color like in screenshot
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  selectedTagText: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: 'white',
    marginRight: 8,
  },
  removeSelectedButton: {
    padding: 2,
  },
});