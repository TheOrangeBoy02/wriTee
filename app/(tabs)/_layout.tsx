import { Tabs } from 'expo-router';
import { Calendar, Home, Settings, StickyNote } from 'lucide-react-native';
import { StyleSheet } from 'react-native';
import Colors from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarStyle = [styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8), height: 60 + insets.bottom }];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.main,
        tabBarInactiveTintColor: Colors.neutral.light,
        tabBarStyle: tabBarStyle,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ size, color }) => (
            <StickyNote size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile-settings"
        options={{
          href: null, // Hide from tab bar
          title: 'Profile Settings',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background.main,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.neutral.border,
    height: 60,
    paddingBottom: 6,
  },
  tabBarLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
});