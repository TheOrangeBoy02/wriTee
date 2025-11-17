// app/(tabs)/journal/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView, Image, GestureResponderEvent } from 'react-native';
import UnsavedChangesDialog from '@/components/UnsavedChangesDialog';
import ShelfSelector from '@/components/ShelfSelector';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Trash2, Bold, Italic, Underline, X, Pencil } from 'lucide-react-native';
import CheckMarkIcon from '@/assets/images/check-mark-icon.svg';
import Colors from '@/constants/Colors';
import { getJournalEntry, updateJournalEntry, deleteJournalEntry } from '@/services/journal';
import { setShelvesForEntry } from '@/services/shelf';
import { getRandomPrompt } from '@/services/prompts';
import { JournalEntry } from '@/types';
import { useStreaks } from '@/context/StreakContext';
import { updateStreakAfterEntry } from '@/utils/streak';

export default function JournalEntryScreen() {
  const { id, prompt: navPrompt } = useLocalSearchParams<{ id: string; prompt?: string }>();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedShelfIds, setSelectedShelfIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const contentInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const { refreshStreaks, showCelebration } = useStreaks();

  // Double-tap detection
  const lastTapRef = useRef<number | null>(null);
  const handleContentDoubleTap = (event?: GestureResponderEvent) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      setIsEditing(true);
      setTimeout(() => contentInputRef.current?.focus(), 50);
      lastTapRef.current = null;
    } else {
      lastTapRef.current = now;
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const loadEntry = async () => {
    if (!id || id === 'new' || id === '[id]') return;
    try {
      const entryData = await getJournalEntry(id);
      setEntry(entryData);
      setTitle(entryData.title);
      setContent(entryData.content);
      setSelectedShelfIds(entryData.shelves?.map(shelf => shelf.id) || []);
    } catch (error) {
      console.error('Error loading entry:', error);
      Alert.alert('Error', 'Failed to load journal entry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id === 'new' || id === '[id]') {
      setIsLoading(false);
      setIsEditing(true);
      setTitle('');
      setContent('');
      if (navPrompt) {
        setCurrentPrompt(navPrompt);
        setShowPrompt(true);
      } else {
        loadPrompt();
      }
    } else {
      loadEntry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const navigation = useNavigation();

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (!hasUnsavedChanges) {
          return;
        }

        // Prevent default navigation
        e.preventDefault();

        // Show confirmation dialog
        setShowUnsavedDialog(true);
        setPendingNavigation(() => () => navigation.dispatch(e.data.action));
      });

      return unsubscribe;
    }, [navigation, hasUnsavedChanges])
  );

  const loadPrompt = async () => {
    try {
      const prompt = await getRandomPrompt();
      setCurrentPrompt(prompt);
      setShowPrompt(true);
    } catch (error) {
      console.error('Error loading prompt:', error);
    }
  };

  // UPDATED: handleSave with streak refresh and shelf management
  const handleSave = async () => {
    let entryTitle = title.trim();
    if (!entryTitle) {
      entryTitle = '[too lazy for title]';
    }

    if (!content.trim()) {
      Alert.alert('Empty Content', 'Please write some content for your journal entry.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedEntry = {
        id: (id === 'new' || id === '[id]') ? undefined : id,
        title: entryTitle,
        content: content.trim(),
        entry_date: (id === 'new' || id === '[id]')
          ? new Date().toISOString()
          : entry?.entry_date || new Date().toISOString(),
      };

      const savedEntry = await updateJournalEntry(updatedEntry);

      // Update shelves for the entry
      await setShelvesForEntry(savedEntry.id, selectedShelfIds);

      // Update streaks and refresh context
      const entryDateStr = savedEntry.entry_date.split('T')[0];
      const streakResult = await updateStreakAfterEntry(entryDateStr);
      await refreshStreaks();

      // Show celebration if it's the first entry of the day
      if (streakResult.shouldCelebrate) {
        showCelebration(streakResult.currentStreak, streakResult.isNewRecord);
      }

      setIsEditing(false);
      setHasUnsavedChanges(false);

      if (id === 'new' || id === '[id]') {
        router.back();
      } else {
        setEntry(savedEntry);
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'Failed to save your entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (id && id !== 'new' && id !== '[id]') {
                await deleteJournalEntry(id);
                router.back();
              }
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete your entry. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  const isViewMode = !isEditing;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}           onPress={() => {
            if (hasUnsavedChanges) {
              setShowUnsavedDialog(true);
              setPendingNavigation(() => router.back);
            } else {
              router.back();
            }
          }}>
          <ArrowLeft size={24} color={Colors.text.dark} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.logoContainer}>
            <Image source={require('@/assets/images/writee-logo.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
          </View>
          <Text style={styles.wordCount}>{wordCount} Words</Text>
        </View>

        <View style={styles.headerRight}>
          {id !== 'new' && id !== '[id]' && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Trash2 size={20} color={Colors.error.main} />
            </TouchableOpacity>
          )}
          {!isEditing && (
            <TouchableOpacity
              onPress={() => {
                setIsEditing(true);
                setTimeout(() => contentInputRef.current?.focus(), 50);
              }}
              style={styles.editToggleButton}
            >
              <Pencil size={16} color={Colors.primary.main} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.titleSection}>
        {isViewMode ? (
          <TouchableOpacity activeOpacity={0.9} onPress={handleContentDoubleTap} onLongPress={() => setIsEditing(true)}>
            <Text style={[styles.titleInput, { fontFamily: 'Playfair-Bold', fontSize: 30, color: Colors.primary.main }]}>
              {title || 'Journal Title'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={(newTitle) => {
              setTitle(newTitle);
              setHasUnsavedChanges(true);
            }}
            placeholder="Journal Title"
            placeholderTextColor={Colors.fade.main}
            maxLength={100}
          />
        )}
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        {isViewMode ? (
          <TouchableOpacity activeOpacity={0.95} onPress={handleContentDoubleTap} onLongPress={() => setIsEditing(true)}>
            <Text style={styles.contentInput}>{content || 'Start writing your thoughts here...'}</Text>
          </TouchableOpacity>
        ) : (
          <TextInput
            ref={contentInputRef}
            style={styles.contentInput}
            value={content}
            onChangeText={(newContent) => {
              setContent(newContent);
              setHasUnsavedChanges(true);
            }}
            placeholder="Start writing your thoughts here..."
            placeholderTextColor={Colors.text.medium}
            multiline
            textAlignVertical="top"
          />
        )}
      </ScrollView>

      {showPrompt && currentPrompt && (
        <View style={styles.promptContainer}>
          <View style={styles.promptHeader}>
            <View style={styles.promptLabel}>
              <Text style={styles.promptText}>Prompt</Text>
            </View>
            <TouchableOpacity style={styles.closePromptButton} onPress={() => setShowPrompt(false)}>
              <X size={16} color={Colors.text.medium} />
            </TouchableOpacity>
          </View>
          <Text style={styles.promptContent}>{currentPrompt}</Text>
        </View>
      )}

      {!isViewMode && (
        <View style={styles.bottomToolbar}>
          <ShelfSelector
            selectedShelfIds={selectedShelfIds}
            onSelectionChange={(shelfIds) => {
              setSelectedShelfIds(shelfIds);
              setHasUnsavedChanges(true);
            }}
            compact
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View style={styles.saveButtonContent}>
                <Text style={styles.saveButtonText}>Save</Text>
                <CheckMarkIcon width={20} height={20} />
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
      {/* Unsaved Changes Dialog */}
      <UnsavedChangesDialog
        visible={showUnsavedDialog}
        onSave={async () => {
          setShowUnsavedDialog(false);
          await handleSave();
          if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
          }
        }}
        onDiscard={() => {
          setShowUnsavedDialog(false);
          setHasUnsavedChanges(false);
          if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
          }
        }}
        onCancel={() => {
          setShowUnsavedDialog(false);
          setPendingNavigation(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.light,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.light,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: Colors.background.light,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerCenter: {
    paddingTop: 64,
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: 'white',
  },
  wordCount: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.text.medium,
  },
 headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  deleteButton: {
    padding: 8,
  },
  
  // Content
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
    // backgroundColor: Colors.background.main,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 120, // Space for bottom toolbar
  },
  titleInput: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: Colors.text.dark,
    padding: 0,
  },
  contentInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
    lineHeight: 24,
    padding: 0,
    minHeight: 400,
  },
  
  // Prompt Section
  promptContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: Colors.background.main,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 24,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  promptLabel: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  promptText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: 'white',
  },
  closePromptButton: {
    padding: 4,
  },
  promptContent: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.dark,
    lineHeight: 20,
  },
  
  // Bottom Toolbar
  bottomToolbar: {
     borderTopLeftRadius: 25,
  borderTopRightRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.background.main,
    // borderTopWidth: 1,
    borderTopColor: Colors.neutral.border,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  formatButton: {
    padding: 8,
    borderRadius: 6,
  },
  formatButtonActive: {
    backgroundColor: Colors.primary.light,
  },
  saveButton: {
    backgroundColor: Colors.primary.main,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: 'white',
  },
  editToggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.primary.light,
  },
  editToggleText: {
    fontFamily: 'Inter-Bold',
    fontSize: 12,
    color: Colors.primary.main,
  },
});