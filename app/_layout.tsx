import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { supabase } from '../lib/supabase'

export default function RootLayout() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const segments = useSegments()

 useEffect(() => {
  let mounted = true

  // Get initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (mounted) {
      setSession(session)
      setLoading(false)
    }
  })

  // Listen for auth changes (THIS IS IMPORTANT)
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session)

      if (loading) {
        setLoading(false)
      }
    }
  )

  return () => {
    mounted = false
    subscription.unsubscribe()
  }
}, [])

 useEffect(() => {
  if (loading) return

  const inAuthGroup = segments[0] === '(auth)'

  if (!session && !inAuthGroup) {
    router.replace('/(auth)/login')
  }

  if (session && inAuthGroup) {
    router.replace('/(tabs)')
  }
}, [session, loading, segments])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="new-complaint"
        options={{
          title: 'New Complaint',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700', color: '#111' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="complaint/[id]"
        options={{
          title: 'Complaint Details',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700', color: '#111' },
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="edit-complaint/[id]"
        options={{
          title: 'Edit Complaint',
          headerShown: true,
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700', color: '#111' },
          headerShadowVisible: false,
        }}
      />
    </Stack>
  )
}