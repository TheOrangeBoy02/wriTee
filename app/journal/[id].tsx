import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Save, Trash2, CreditCard as Edit } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { getJournalEntry, updateJournalEntry, deleteJournalEntry } from '@/services/journal';
import { JournalEntry } from '@/types';
import FormatToolbar from '@/components/FormatToolbar';

export default function JournalEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // const contentRef = useRef<TextInput>(null); // TODO: Use for text selection
  const router = useRouter();

  const loadEntry = async () => {
    if (!id || id === 'new') return;
    
    try {
      const entryData = await getJournalEntry(id);
      setEntry(entryData);
      setTitle(entryData.title);
      setContent(entryData.content);
    } catch (error) {
      console.error('Error loading entry:', error);
      Alert.alert('Error', 'Failed to load journal entry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id === 'new') {
      // New entry
      setIsLoading(false);
      setIsEditing(true);
      setTitle('');
      setContent('');
    } else {
      // Existing entry
      loadEntry();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your journal entry.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedEntry = {
        id: id === 'new' ? undefined : id,
        title: title.trim(),
        content: content.trim(),
        entry_date: new Date().toISOString(),
      };

      await updateJournalEntry(updatedEntry);
      setIsEditing(false);
      
      if (id === 'new') {
        router.back();
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
              if (id && id !== 'new') {
                await deleteJournalEntry(id);
                router.back();
              }
            } catch (error) {
              console.error('Error deleting entry:', error);
              Alert.alert('Error', 'Failed to delete your entry. Please try again.');
            }
          }
        },
      ]
    );
  };

  const formatText = (formatType: string) => {
    // For now, just append the formatting to the end of the content
    // TODO: Implement proper text selection and formatting
    let formattedText = '';
    
    switch (formatType) {
      case 'bold':
        formattedText = '**text**';
        break;
      case 'italic':
        formattedText = '_text_';
        break;
      case 'heading':
        formattedText = '# ';
        break;
      case 'bullet':
        formattedText = '• ';
        break;
      default:
        return;
    }
    
    setContent(prev => prev + formattedText);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text.dark} />
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          {id !== 'new' && !isEditing && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => setIsEditing(true)}
            >
              <Edit size={20} color={Colors.primary.main} />
            </TouchableOpacity>
          )}
          
          {(isEditing || id === 'new') && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={Colors.primary.main} />
              ) : (
                <Save size={20} color={Colors.primary.main} />
              )}
            </TouchableOpacity>
          )}
          
          {id !== 'new' && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDelete}
            >
              <Trash2 size={20} color={Colors.error.main} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        {isEditing || id === 'new' ? (
          <>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Entry Title"
              placeholderTextColor={Colors.neutral.main}
              maxLength={100}
            />
            
            {(isEditing || id === 'new') && (
              <FormatToolbar onFormat={formatText} />
            )}
            
            <TextInput
              style={styles.contentInput}
              value={content}
              onChangeText={setContent}
              placeholder="Write your thoughts here..."
              placeholderTextColor={Colors.neutral.main}
              multiline
              textAlignVertical="top"
            />
          </>
        ) : (
          <>
            <Text style={styles.titleText}>{title}</Text>
            <Text style={styles.dateText}>
              {entry?.entry_date ? new Date(entry.entry_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : ''}
            </Text>
            <Text style={styles.contentText}>{content}</Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.main,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: Colors.background.main,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral.border,
  },
  backButton: {
    padding: 8,
  },
  headerRight: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  titleInput: {
    fontFamily: 'Playfair-Bold',
    fontSize: 24,
    color: Colors.text.dark,
    marginBottom: 8,
    padding: 0,
  },
  contentInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
    lineHeight: 24,
    padding: 0,
    minHeight: 300,
  },
  titleText: {
    fontFamily: 'Playfair-Bold',
    fontSize: 24,
    color: Colors.text.dark,
    marginBottom: 8,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.medium,
    marginBottom: 24,
  },
  contentText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
    lineHeight: 24,
  },
});