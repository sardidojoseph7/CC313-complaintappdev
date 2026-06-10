import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { supabase } from '../../lib/supabase'

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRegister() {
    if (!fullName || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }
    
    setLoading(true)
    
    console.log('Attempting to register:', email)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      }
    })
    
    console.log('Registration response:', { data, error })
    
    if (error) {
      Alert.alert('Registration Failed', error.message)
      setLoading(false)
    } else if (data?.user) {
      // Check if email confirmation is required
      if (data.user.identities?.length === 0) {
        Alert.alert('Error', 'User already exists. Please login instead.')
        router.replace('/(auth)/login')
      } else {
        Alert.alert(
          'Success!', 
          'Account created successfully! You can now log in.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        )
      }
    }
    setLoading(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor="#999"
        value={fullName}
        onChangeText={setFullName}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password (min 6 characters)"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>
          Already have an account? <Text style={styles.linkBold}>Sign In</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 24, 
    backgroundColor: '#fff' 
  },
  header: {
    marginBottom: 32,
  },
  title: { 
    fontSize: 32, 
    fontWeight: '700', 
    marginBottom: 8, 
    color: '#111' 
  },
  subtitle: { 
    fontSize: 15, 
    color: '#888'
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    fontSize: 15,
    backgroundColor: '#F8FAFC',
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { 
    backgroundColor: '#93C5FD' 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '600', 
    fontSize: 16 
  },
  link: { 
    textAlign: 'center', 
    marginTop: 20, 
    color: '#666', 
    fontSize: 14 
  },
  linkBold: {
    color: '#3B82F6',
    fontWeight: '600',
  },
})