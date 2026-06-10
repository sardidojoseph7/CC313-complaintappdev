import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

export const supabase = createClient(
  'https://dyhuqoasdleoigiwdwdx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aHVxb2FzZGxlb2lnaXdkd2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzkzOTgsImV4cCI6MjA5NjA1NTM5OH0.lZOqd-0LYDmpXxZUUZ6_XPYQgtNPkToeV2d9uwvfSRU',
  {
    auth: {
      storage: AsyncStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    }
  }
)