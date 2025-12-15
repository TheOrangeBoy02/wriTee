import { Tabs } from 'expo-router';
import ShelfIcon from '@/components/ShelfIcon';
import {
  Calendar,
  HomeSimple,
  Settings,
  Book,
  BookStack
} from 'iconoir-react-native';
import {
  Book as BookSolid
} from 'iconoir-react-native/solid';
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
        animation: 'fade',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color, focused }) => {
            return <HomeSimple width={size} height={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
          },
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ size, color, focused }) => {
            const Icon = focused ? BookSolid : Book;
            return <Icon width={size} height={size} color={color} />;
          },
        }}
      />
       <Tabs.Screen
        name="shelves"
        options={{
          title: 'Shelves',
          tabBarIcon: ({ size, color, focused }) => {
            return <ShelfIcon width={size} height={size} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ size, color, focused }) => {
            return <Calendar width={size} height={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
          },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color, focused }) => {
            return <Settings width={size} height={size} color={color} strokeWidth={focused ? 2.5 : 2} />;
          },
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