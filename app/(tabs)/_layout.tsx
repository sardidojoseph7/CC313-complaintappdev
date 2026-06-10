import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#3B82F6',
      tabBarInactiveTintColor: '#94A3B8',
      tabBarStyle: {
        paddingBottom: 8, height: 64,
        borderTopWidth: 1, borderTopColor: '#F1F5F9',
        backgroundColor: '#fff',
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
      headerStyle: { backgroundColor: '#fff' },
      headerTitleStyle: { fontWeight: '700', fontSize: 17, color: '#111' },
      headerShadowVisible: false,
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: 'My Complaints',
          tabBarLabel: 'Complaints',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" label="Complaints" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarLabel: 'Reports',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Reports" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Profile" focused={focused} />,
        }}
      />
    </Tabs>
  )
}