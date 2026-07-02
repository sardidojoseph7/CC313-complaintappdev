import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, shadows } from '../../constants/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          paddingBottom: Math.max(insets.bottom, 8),
          height: 64 + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.card,
          ...shadows.sm,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          color: colors.fg,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: 'My Complaints',
          tabBarLabel: 'Complaints',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'document-text' : 'document-text-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'bar-chart' : 'bar-chart-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}