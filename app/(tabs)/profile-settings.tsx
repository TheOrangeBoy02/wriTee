import { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import { getUserProfile, updateUserProfile } from '@/services/user';
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
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile.');
    }
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
      <Header title="Edit Profile" />
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
      </View>
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
    borderRadius: 4 ,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
});