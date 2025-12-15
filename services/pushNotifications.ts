// services/pushNotifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

/**
 * Register for push notifications and get Expo push token
 * This works on both physical devices and emulators (Expo Go)
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    console.log('🔔 registerForPushNotifications called');
    console.log('🔔 Requesting permissions...');

    // Get existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('🔔 Push notification permission not granted, status:', finalStatus);
      return null;
    }

    console.log('🔔 Permission granted! Getting push token...');

    // Get the Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    console.log('🔔 Project ID:', projectId);

    if (!projectId) {
      throw new Error('EAS Project ID not found in app.config.js');
    }

    console.log('🔔 Calling getExpoPushTokenAsync...');

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    const token = tokenData.data;
    console.log('🔔 Expo Push Token:', token);

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('journal-reminders', {
        name: 'Journal Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#af1dbf',
        sound: 'default',
      });
    }

    return token;
  } catch (error: any) {
    console.error('🔔 Error registering for push notifications:', error?.message || error);
    console.error('🔔 Full error:', JSON.stringify(error, null, 2));
    return null;
  }
};

/**
 * Save push token to Supabase database
 */
export const savePushToken = async (pushToken: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get device info
    const deviceType = Platform.OS as 'ios' | 'android' | 'web';
    const deviceName = Device.deviceName || `${Platform.OS} Device`;
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    // Upsert push token (insert or update if exists)
    const { error } = await supabase
      .from('push_tokens')
      .upsert(
        {
          user_id: user.id,
          push_token: pushToken,
          device_type: deviceType,
          device_name: deviceName,
          app_version: appVersion,
          is_active: true,
          last_used_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,push_token',
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('Error saving push token:', error);
      throw error;
    }

    console.log('Push token saved successfully');
  } catch (error) {
    console.error('Failed to save push token:', error);
    throw error;
  }
};

/**
 * Remove push token from database (when user logs out or disables notifications)
 */
export const removePushToken = async (pushToken: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('push_tokens')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('push_token', pushToken);

    if (error) {
      console.error('Error removing push token:', error);
      throw error;
    }

    console.log('Push token marked as inactive');
  } catch (error) {
    console.error('Failed to remove push token:', error);
  }
};

/**
 * Register and save push token in one call
 */
export const setupPushNotifications = async (): Promise<string | null> => {
  try {
    const token = await registerForPushNotifications();

    if (token) {
      await savePushToken(token);
      return token;
    }

    return null;
  } catch (error) {
    console.error('Error setting up push notifications:', error);
    return null;
  }
};

/**
 * Check if user has valid push token registered
 */
export const hasActivePushToken = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('push_tokens')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1);

    if (error) {
      console.error('Error checking push token:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (error) {
    console.error('Error checking push token:', error);
    return false;
  }
};

/**
 * Refresh push token periodically (call on app startup)
 */
export const refreshPushToken = async (): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current token
    const token = await registerForPushNotifications();
    if (!token) return;

    // Update last_used_at timestamp
    await supabase
      .from('push_tokens')
      .update({ last_used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('push_token', token);

    console.log('Push token refreshed');
  } catch (error) {
    console.error('Error refreshing push token:', error);
  }
};

/**
 * Check if push notifications are available and permissions granted
 */
export const canSendPushNotifications = async (): Promise<{
  available: boolean;
  reason?: string;
}> => {
  // Check permissions
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    return {
      available: false,
      reason: 'Permission not granted',
    };
  }

  return { available: true };
};
