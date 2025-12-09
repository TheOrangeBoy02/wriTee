// services/notifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions from the user
 * @returns Promise<boolean> - true if permission granted
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Only ask if permissions have not already been determined
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission not granted');
      return false;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('journal-reminders', {
        name: 'Journal Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#af1dbf',
        sound: 'default',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Check if notification permissions are granted
 * @returns Promise<boolean>
 */
export const checkNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return false;
  }
};

/**
 * Schedule a daily journal reminder notification
 * @param time - Time in HH:mm format (e.g., "21:00")
 * @returns Promise<string> - notification identifier
 */
export const scheduleDailyReminder = async (time: string): Promise<string | null> => {
  try {
    // Cancel all existing scheduled notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Parse the time
    const [hours, minutes] = time.split(':').map(Number);

    // Create notification trigger for daily at specified time
    const trigger: Notifications.CalendarTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: hours,
      minute: minutes,
      repeats: true,
    };

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '✍🏾 Time to journal!',
        body: 'Take a moment to WriTeeeeeeee.',
        data: { type: 'journal-reminder' },
        sound: 'default',
      },
      trigger,
    });

    console.log('Daily reminder scheduled:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
    return null;
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllReminders = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All reminders cancelled');
  } catch (error) {
    console.error('Error cancelling reminders:', error);
  }
};

/**
 * Get all scheduled notifications (for debugging)
 */
export const getScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Send an immediate test notification
 */
export const sendTestNotification = async (): Promise<void> => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '✨ Test Notification',
        body: 'Your journal reminders are working!',
        data: { type: 'test' },
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
};

// Re-export push notification functions
export {
  setupPushNotifications,
  registerForPushNotifications,
  savePushToken,
  removePushToken,
  hasActivePushToken,
  refreshPushToken,
  canSendPushNotifications,
} from './pushNotifications';
