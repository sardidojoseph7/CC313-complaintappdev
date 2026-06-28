import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://dyhuqoasdleoigiwdwdx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5aHVxb2FzZGxlb2lnaXdkd2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NzkzOTgsImV4cCI6MjA5NjA1NTM5OH0.lZOqd-0LYDmpXxZUUZ6_XPYQgtNPkToeV2d9uwvfSRU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});