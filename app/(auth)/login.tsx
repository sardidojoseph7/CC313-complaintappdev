
import * as AuthSession from 'expo-auth-session'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { supabase } from '../../lib/supabase'

// Required for web authentication
WebBrowser.maybeCompleteAuthSession()

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const router = useRouter()

  // Prevent back button on login screen
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true
    })
    return () => backHandler.remove()
  }, [])

  // Email login
  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      Alert.alert('Login Failed', error.message)
    } else {
      router.replace('/(tabs)')
    }
    setLoading(false)
  }


  // Google login

async function handleGoogleLogin() {
  setSocialLoading('google')

  try {
    const redirectTo = Linking.createURL('/auth/callback')

console.log('REDIRECT URI GENERATED:', redirectTo)


console.log('REDIRECT:', redirectTo)

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
      },
    })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    const result = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectTo
    )

    console.log('OAUTH RESULT:', result)

  console.log(result)

    // 🔥 THIS is now enough — Supabase handles session automatically
    const { data: sessionData } = await supabase.auth.getSession()
    console.log('SESSION:', sessionData)

  } catch (e) {
    console.log('LOGIN ERROR:', e)
  } finally {
    setSocialLoading(null)
  }
}


  // Facebook login
  async function handleFacebookLogin() {
  setSocialLoading('facebook')

  try {
    // Create a proper deep link redirect for Expo
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'complaintapp',
    })

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
         redirectTo: 'http://localhost:3000',
      },
    })

    if (error) {
      Alert.alert('Error', error.message)
      return
    }

    const res = await WebBrowser.openAuthSessionAsync(
      data.url,
      redirectUri
    )

    console.log('FACEBOOK AUTH RESULT:', res)
  } catch (error) {
    console.log('FACEBOOK ERROR:', error)
    Alert.alert('Error', 'Failed to sign in with Facebook')
  } finally {
    setSocialLoading(null)
  }
}

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* App Logo and Name */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>📋</Text>
        </View>
        <Text style={styles.appName}>ComplaintApp</Text>
        <Text style={styles.tagline}>Your voice matters</Text>
      </View>

      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Email Login Button */}
      <TouchableOpacity
        style={[styles.loginButton, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.loginButtonText}>
          {loading ? 'Signing in...' : 'Sign In with Email'}
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>Or continue with</Text>
        <View style={styles.dividerLine} />
      </View>

      {/* Google Button */}
      <TouchableOpacity
        style={[styles.socialButton, styles.googleButton]}
        onPress={handleGoogleLogin}
        disabled={socialLoading !== null}
      >
        {socialLoading === 'google' ? (
          <ActivityIndicator color="#666" />
        ) : (
          <>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.socialButtonText}>Google</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Facebook Button */}
      <TouchableOpacity
        style={[styles.socialButton, styles.facebookButton]}
        onPress={handleFacebookLogin}
        disabled={socialLoading !== null}
      >
        {socialLoading === 'facebook' ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={styles.facebookIcon}>f</Text>
            <Text style={[styles.socialButtonText, styles.facebookText]}>Facebook</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Register Link */}
      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>
          Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 40,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 14,
    color: '#888',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 32,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: '#F8FAFC',
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonDisabled: {
    backgroundColor: '#93C5FD',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#94A3B8',
    fontSize: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: '#E2E8F0',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  facebookIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  facebookText: {
    color: '#fff',
  },
  link: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 14,
  },
  linkBold: {
    color: '#3B82F6',
    fontWeight: '600',
  },
})