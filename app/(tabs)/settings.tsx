import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LogOut, Bell, Moon, User, Clock, Trash2 } from 'lucide-react-native';
import Header from '@/components/Header';
import TimePickerModal from '@/components/TimePickerModal';
import { useTheme } from '@/context/ThemeContext';
import { authService } from '@/services/auth';
import { getUserSettings, updateUserSettings } from '@/services/user';
import { UserSettings } from '@/types';
import {
  requestNotificationPermissions,
  scheduleDailyReminder,
  cancelAllReminders,
} from '@/services/notifications';


export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDarkMode, setDarkMode } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: true,
    darkModeEnabled: false,
    preferredJournalTime: '21:00',
    reminderEnabled: true,
  });
  const [, setIsLoading] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const userSettings = await getUserSettings();
      setSettings(userSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if loading fails
      setSettings({
        notificationsEnabled: true,
        darkModeEnabled: false,
        preferredJournalTime: '21:00',
        reminderEnabled: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChange = async (setting: keyof UserSettings, value: boolean) => {
    try {
      const updatedSettings = { ...settings, [setting]: value };
      setSettings(updatedSettings);
      await updateUserSettings(updatedSettings);

      // Handle notifications toggle
      if (setting === 'notificationsEnabled') {
        if (value) {
          const granted = await requestNotificationPermissions();
          if (!granted) {
            Alert.alert(
              'Permission Required',
              'Please enable notifications in your device settings to receive journal reminders.',
              [{ text: 'OK' }]
            );
            // Revert the toggle if permission not granted
            setSettings(prev => ({ ...prev, notificationsEnabled: false }));
            await updateUserSettings({ ...updatedSettings, notificationsEnabled: false });
          } else if (updatedSettings.reminderEnabled) {
            // Re-schedule reminder if it was enabled
            await scheduleDailyReminder(updatedSettings.preferredJournalTime);
          }
        } else {
          // Cancel all notifications when disabled
          await cancelAllReminders();
        }
      }

      // Handle reminder toggle
      if (setting === 'reminderEnabled') {
        if (value && updatedSettings.notificationsEnabled) {
          await scheduleDailyReminder(updatedSettings.preferredJournalTime);
        } else {
          await cancelAllReminders();
        }
      }

      // Handle dark mode toggle
      if (setting === 'darkModeEnabled') {
        await setDarkMode(value);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      // Revert the setting if the update fails
      setSettings(prev => ({ ...prev, [setting]: !value }));
      Alert.alert(
        'Error',
        'Failed to update setting. Please try again.',
        [{ text: 'OK' }]
      );
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
              await authService.deleteAccount();
              router.replace('/login');
            } catch (error) {
              console.error('Error deleting account:', error);
            }
          }
        },
      ]
    );
  };

  const handleTimePickerOpen = () => {
    setShowTimePicker(true);
  };

  const handleTimeConfirm = async (time: string) => {
    try {
      const updatedSettings = { ...settings, preferredJournalTime: time };
      setSettings(updatedSettings);
      await updateUserSettings(updatedSettings);

      // Reschedule notification with new time if reminders are enabled
      if (settings.reminderEnabled && settings.notificationsEnabled) {
        await scheduleDailyReminder(time);
        Alert.alert(
          'Reminder Updated',
          `Your daily journal reminder has been set for ${time}.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error updating time:', error);
      Alert.alert(
        'Error',
        'Failed to update reminder time. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setShowTimePicker(false);
    }
  };

  const handleTimeCancel = () => {
    setShowTimePicker(false);
  };

  const handleProfileSettings = () => {
    router.push('/(tabs)/profile-settings');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background.main }]}>
      <Header title="Settings" />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text.dark }]}>Profile</Text>
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.neutral.border }]}
            onPress={handleProfileSettings}
          >
            <View style={styles.settingLeft}>
              <User size={20} color={colors.text.dark} />
              <Text style={[styles.settingText, { color: colors.text.dark }]}>Edit Profile</Text>
            </View>
            <Text style={[styles.actionText, { color: colors.primary.main }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text.dark }]}>Preferences</Text>

          <View style={[styles.settingItem, { borderBottomColor: colors.neutral.border }]}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={colors.text.dark} />
              <Text style={[styles.settingText, { color: colors.text.dark }]}>Notifications</Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={(value) => handleToggleChange('notificationsEnabled', value)}
              trackColor={{ false: colors.neutral.border, true: colors.primary.light }}
              thumbColor={settings.notificationsEnabled ? colors.primary.main : '#f4f3f4'}
              ios_backgroundColor={colors.neutral.border}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: colors.neutral.border, opacity: 0.5 }]}>
            <View style={styles.settingLeft}>
              <Moon size={20} color={colors.text.light} />
              <View>
                <Text style={[styles.settingText, { color: colors.text.light }]}>Dark Mode</Text>
                <Text style={[styles.helperText, { color: colors.text.light }]}>Coming soon</Text>
              </View>
            </View>
            <Switch
              value={false}
              disabled={true}
              trackColor={{ false: colors.neutral.border, true: colors.primary.light }}
              thumbColor="#f4f3f4"
              ios_backgroundColor={colors.neutral.border}
            />
          </View>

          <View style={[styles.settingItem, { borderBottomColor: colors.neutral.border }]}>
            <TouchableOpacity
              style={styles.settingLeft}
              onPress={handleTimePickerOpen}
              disabled={!settings.reminderEnabled || !settings.notificationsEnabled}
              activeOpacity={0.7}
            >
              <Clock size={20} color={colors.text.dark} />
              <View>
                <Text style={[styles.settingText, { color: colors.text.dark }]}>Journal Reminder</Text>
                {!settings.notificationsEnabled && (
                  <Text style={[styles.helperText, { color: colors.text.light }]}>Enable notifications first</Text>
                )}
              </View>
            </TouchableOpacity>
            <View style={styles.reminderRight}>
              <Switch
                value={settings.reminderEnabled}
                onValueChange={(value) => handleToggleChange('reminderEnabled', value)}
                trackColor={{ false: colors.neutral.border, true: colors.primary.light }}
                thumbColor={settings.reminderEnabled ? colors.primary.main : '#f4f3f4'}
                ios_backgroundColor={colors.neutral.border}
                disabled={!settings.notificationsEnabled}
              />
              <TouchableOpacity
                onPress={handleTimePickerOpen}
                disabled={!settings.reminderEnabled || !settings.notificationsEnabled}
              >
                <Text
                  style={[
                    styles.timeText,
                    {
                      color: (!settings.reminderEnabled || !settings.notificationsEnabled) ? colors.text.light : colors.primary.main,
                      backgroundColor: (!settings.reminderEnabled || !settings.notificationsEnabled) ? colors.background.light : colors.primary.light + '20'
                    }
                  ]}
                >
                  {settings.preferredJournalTime}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text.dark }]}>Account</Text>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.neutral.border }]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <LogOut size={20} color={colors.text.dark} />
              <Text style={[styles.settingText, { color: colors.text.dark }]}>Logout</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.neutral.border }]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={20} color={colors.error.main} />
              <Text style={[styles.settingText, { color: colors.error.main }]}>Delete Account</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.text.light }]}>WriTee v1.0.0</Text>
        </View>
      </ScrollView>

      <TimePickerModal
        visible={showTimePicker}
        initialTime={settings.preferredJournalTime}
        onConfirm={handleTimeConfirm}
        onCancel={handleTimeCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginLeft: 12,
  },
  actionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  reminderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginLeft: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  helperText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 2,
    paddingLeft: 12,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
});