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

// Array of notification messages to rotate through
const NOTIFICATION_MESSAGES = [
  {
    title: '✍🏾 Time to journal!',
    body: 'Take a moment to WriTeeeeeeee.',
  },
  {
    title: '📖 Your journal awaits',
    body: 'What\'s on your mind today?',
  },
  {
    title: '💭 Capture your thoughts',
    body: 'A few minutes of reflection can make all the difference.',
  },
  {
    title: '✨ Moment of reflection',
    body: 'Document your day and preserve your memories.',
  },
  {
    title: '🌟 Time to WriTeee',
    body: 'Your future self will thank you for writing today.',
  },
  {
    title: '📝 Daily check-in',
    body: 'How are you feeling? WriTee it down.',
  },
  {
    title: '💫 Let\'s work on the streak!',
    body: 'Just a few words can keep your momentum going.',
  },
  {
    title: '🎯 Journal time',
    body: 'What made today special?',
  },
  {
    title: '🌙 End your day mindfully',
    body: 'Reflect, write, and unwind.',
  },
  {
    title: '☀️ Document your journey',
    body: 'Every day has a story worth telling.',
  },
  {
  title: '🦉 The Journal Owl is watching',
  body: 'You forgot to WriTee. Again. Open the journal. Please.',
},
{
  title: '🔥 Your streak is in danger',
  body: 'WriTee one sentence. ONE. We both know you have thoughts.',
},
{
  title: '😐 We noticed something',
  body: 'You have emotions. The journal is empty. Explain yourself.',
},
{
  title: '🚨 Emergency! Thoughts detected',
  body: 'Unload them into the journal before they escape.',
},
{
  title: '👀 Still thinking?',
  body: 'Cool. WriTee it down instead of overthinking it.',
},
{
  title: '📉 Streak anxiety activated',
  body: 'Five words is enough. Don\'t be dramatic.',
},
{
  title: '🧠 Brain full. Journal empty.',
  body: 'This feels illegal. Fix it.',
},
{
  title: '⏰ Procrastination check',
  body: 'If you have time to breathe, you have time to journal.',
},
{
  title: '😤 WriTee is disappointed',
  body: 'Not angry. Just… disappointed. WriTee something.',
},
{
  title: '🏃🏾‍♂️ Quick! Before tomorrow happens',
  body: 'Future you will judge this silence.',
},
{
  title: '📓 The journal misses you',
  body: 'It\'s been staring at the wall all day.',
},
{
  title: '💀 RIP forgotten thoughts',
  body: 'Unless you WriTee them down. Now.',
},
{
  title: '🎭 Main character moment',
  body: 'Every protagonist journals. Just saying.',
},
{
  title: '⚠️ Overthinking detected',
  body: 'Redirecting to… journaling.',
},
{
  title: '🤏🏾 Bare minimum challenge',
  body: 'One line. Lower the bar. Do it.',
},
{
  title: '👀 Ask yourself: What would a TKanjaye do?',
  body: 'Exactly. Let\'s WriTee something.',
},
];

/**
 * Get a random notification message
 * @returns Object with title and body
 */
const getRandomNotificationMessage = () => {
  const randomIndex = Math.floor(Math.random() * NOTIFICATION_MESSAGES.length);
  return NOTIFICATION_MESSAGES[randomIndex];
};

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

    // Ensure channel exists on Android before scheduling
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('journal-reminders', {
        name: 'Journal Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#af1dbf',
        sound: 'default',
      });
    }

    // Parse the time
    const [hours, minutes] = time.split(':').map(Number);

    // Create notification trigger - use DAILY for Android, CALENDAR for iOS
    const trigger = Platform.OS === 'android'
      ? {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: hours,
          minute: minutes,
        } as Notifications.DailyTriggerInput
      : {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour: hours,
          minute: minutes,
          repeats: true,
        } as Notifications.CalendarTriggerInput;

    // Get a random notification message
    const message = getRandomNotificationMessage();

    // Schedule the notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: { type: 'journal-reminder' },
        sound: 'default',
        ...(Platform.OS === 'android' && { channelId: 'journal-reminders' }),
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
    // Ensure channel exists on Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('journal-reminders', {
        name: 'Journal Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#af1dbf',
        sound: 'default',
      });
    }

    // Get a random message for the test notification
    const message = getRandomNotificationMessage();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        data: { type: 'test' },
        ...(Platform.OS === 'android' && { channelId: 'journal-reminders' }),
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
