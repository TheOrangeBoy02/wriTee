import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Bell, Moon, User, Clock, Trash2 } from 'lucide-react-native';
import Header from '@/components/Header';
import Colors from '@/constants/Colors';
import { authService } from '@/services/auth';
import { getUserSettings, updateUserSettings } from '@/services/user';
import { UserSettings } from '@/types';


export default function SettingsScreen() {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    darkModeEnabled: false,
    preferredJournalTime: '21:00',
    reminderEnabled: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userSettings = await getUserSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChange = async (setting: keyof UserSettings, value: boolean) => {
    try {
      const updatedSettings = { ...settings, [setting]: value };
      setSettings(updatedSettings);
      await updateUserSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert the setting if the update fails
      setSettings(settings);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.signOut();
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const user = await authService.getCurrentUser();
              if (user?.id) {
                // Delete user data from profiles table
                await supabase.from('profiles').delete().eq('id', user.id);
                // Delete user authentication
                await supabase.auth.admin.deleteUser(user.id);
              }
              router.replace('/login');
            } catch (error) {
              console.error('Error deleting account:', error);
            }
          }
        },
      ]
    );
  };

  const handleTimeSettings = () => {
    router.push('/time-settings');
  };

  const handleProfileSettings = () => {
    router.push('/profile-settings');
  };

  return (
    <View style={styles.container}>
      <Header title="Settings" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <TouchableOpacity 
            style={styles.settingItem} 
            onPress={handleProfileSettings}
          >
            <View style={styles.settingLeft}>
              <User size={20} color={Colors.text.dark} />
              <Text style={styles.settingText}>Edit Profile</Text>
            </View>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={Colors.text.dark} />
              <Text style={styles.settingText}>Notifications</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => handleToggleChange('notificationsEnabled', value)}
              trackColor={{ false: Colors.neutral.border, true: Colors.primary.light }}
              thumbColor={settings.notificationsEnabled ? Colors.primary.main : Colors.neutral.main}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Moon size={20} color={Colors.text.dark} />
              <Text style={styles.settingText}>Dark Mode</Text>
            </View>
            <Switch
              value={settings.darkModeEnabled}
              onValueChange={(value) => handleToggleChange('darkModeEnabled', value)}
              trackColor={{ false: Colors.neutral.border, true: Colors.primary.light }}
              thumbColor={settings.darkModeEnabled ? Colors.primary.main : Colors.neutral.main}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleTimeSettings}
          >
            <View style={styles.settingLeft}>
              <Clock size={20} color={Colors.text.dark} />
              <Text style={styles.settingText}>Journal Reminder</Text>
            </View>
            <View style={styles.reminderRight}>
              <Switch
                value={settings.reminderEnabled}
                onValueChange={(value) => handleToggleChange('reminderEnabled', value)}
                trackColor={{ false: Colors.neutral.border, true: Colors.primary.light }}
                thumbColor={settings.reminderEnabled ? Colors.primary.main : Colors.neutral.main}
              />
              <Text style={styles.timeText}>
                {settings.preferredJournalTime}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <LogOut size={20} color={Colors.text.dark} />
              <Text style={styles.settingText}>Logout</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={20} color={Colors.error.main} />
              <Text style={[styles.settingText, styles.deleteText]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>WriTee v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  scrollView: {
    flex: 1,
  },
  sectionContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: Colors.text.dark,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.neutral.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.text.dark,
    marginLeft: 12,
  },
  actionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.primary.main,
  },
  reminderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.text.medium,
    marginLeft: 12,
  },
  deleteText: {
    color: Colors.error.main,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.text.light,
  },
});