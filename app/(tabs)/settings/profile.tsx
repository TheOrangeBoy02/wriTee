import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Trash2, AlertTriangle } from 'lucide-react-native';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import { getUserProfile, updateUserProfile } from '@/services/user';
import { authService } from '@/services/auth';
import { UserProfile, Profile } from '@/types';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    display_name: '',
    phone_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProfile = await getUserProfile();
        if (userProfile) {
          setProfile({
            id: userProfile.id,
            email: userProfile.email,
            display_name: userProfile.display_name || '',
            phone_number: userProfile.phone_number || '',
          });
        } else {
          Alert.alert('Error', 'No profile found.');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        Alert.alert('Error', 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    try {
      // Validation
      if (!profile.display_name?.trim()) {
        Alert.alert('Error', 'Display name is required.');
        return;
      }

      const updateData: Partial<Profile> = {
        display_name: profile.display_name.trim(),
        phone_number: profile.phone_number?.trim() || null,
      };

      await updateUserProfile(updateData);
      Alert.alert('Success', 'Profile updated!', [
        { text: 'OK', onPress: () => router.navigate('/(tabs)/settings') }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toLowerCase() !== 'delete') {
      Alert.alert('Error', 'Please type "delete" to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      await authService.deleteAccount();
      setShowDeleteModal(false);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', 'Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary.main} />
        <Text style={{ marginTop: 16, fontFamily: 'Inter-Medium', fontSize: 16, color: Colors.text.dark }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Edit Profile" showBackButton onBackPress={() => router.navigate('/(tabs)/settings')} />
      <View style={styles.form}>
        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={profile.display_name || ''}
          onChangeText={text => setProfile({ ...profile, display_name: text })}
          placeholder="Enter display name"
        />
        <Text style={styles.label}>Phone Number</Text>
        <TextInput
          style={styles.input}
          value={profile.phone_number || ''}
          onChangeText={text => setProfile({ ...profile, phone_number: text })}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={[styles.input, { backgroundColor: Colors.neutral.border }]}
          value={profile.email}
          editable={false}
        />
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>

        {/* Delete Account Section */}
        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
          <Text style={styles.dangerZoneDescription}>
            Once you delete your account, there is no going back. All your journal entries and data will be permanently removed.
          </Text>
          <TouchableOpacity style={styles.deleteButton} onPress={openDeleteModal}>
            <Trash2 size={18} color={Colors.error.main} />
            <Text style={styles.deleteButtonText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <AlertTriangle size={48} color={Colors.error.main} />
            </View>
            <Text style={styles.modalTitle}>Delete Account</Text>
            <Text style={styles.modalDescription}>
              This action is irreversible. All your data including journal entries, shelves, and settings will be permanently deleted.
            </Text>
            <Text style={styles.modalInstruction}>
              Type <Text style={styles.deleteWord}>delete</Text> to confirm:
            </Text>
            <TextInput
              style={styles.confirmInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="Type 'delete' here"
              placeholderTextColor={Colors.text.light}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmDeleteButton,
                  deleteConfirmText.toLowerCase() !== 'delete' && styles.confirmDeleteButtonDisabled
                ]}
                onPress={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmText.toLowerCase() !== 'delete'}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteButtonText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background.main },
  form: { padding: 24 },
  label: { fontFamily: 'Inter-Medium', fontSize: 14, color: Colors.text.dark, marginTop: 16 },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    backgroundColor: Colors.background.light,
    color: Colors.text.dark,
  },
  saveButton: {
    marginTop: 32,
    backgroundColor: Colors.primary.main,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  dangerZone: {
    marginTop: 48,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.error.main,
    borderRadius: 8,
    backgroundColor: Colors.error.light,
  },
  dangerZoneTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: Colors.error.main,
    marginBottom: 8,
  },
  dangerZoneDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.medium,
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.error.main,
    borderRadius: 8,
    backgroundColor: Colors.background.main,
  },
  deleteButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.error.main,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.background.main,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: Colors.error.main,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.medium,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalInstruction: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.text.dark,
    marginBottom: 8,
  },
  deleteWord: {
    fontFamily: 'Inter-Bold',
    color: Colors.error.main,
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.text.dark,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.text.medium,
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: Colors.error.main,
    alignItems: 'center',
  },
  confirmDeleteButtonDisabled: {
    backgroundColor: Colors.neutral.border,
  },
  confirmDeleteButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});
