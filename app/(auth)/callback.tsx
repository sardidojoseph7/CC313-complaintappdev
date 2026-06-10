import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()


  useEffect(() => {
  Linking.getInitialURL().then(url => {
    console.log('INITIAL URL:', url)
  })
}, [])

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const url = await Linking.getInitialURL()

        console.log('CALLBACK URL:', url)

        if (!url) {
          router.replace('/(auth)/login')
          return
        }

        const access_token =
          url.match(/access_token=([^&]*)/)?.[1]

        const refresh_token =
          url.match(/refresh_token=([^&]*)/)?.[1]

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          })

          if (error) {
            console.log(error)
            router.replace('/(auth)/login')
            return
          }

          router.replace('/(tabs)')
        } else {
          router.replace('/(auth)/login')
        }
      } catch (e) {
        console.log(e)
        router.replace('/(auth)/login')
      }
    }

    handleAuth()
  }, [])

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <ActivityIndicator />
    </View>
  )
}