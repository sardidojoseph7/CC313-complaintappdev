import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const router = useRouter();

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');

    let isValid = true;
    if (!email.trim()) { setEmailError('Email is required'); isValid = false; }
    else if (!validateEmail(email)) { setEmailError('Please enter a valid email address'); isValid = false; }

    if (!password.trim()) { setPasswordError('Password is required'); isValid = false; }

    if (!isValid) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Incorrect email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email before logging in.');
        } else {
          throw new Error(error.message);
        }
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Ionicons name="document-text" size={32} color={colors.accent} />
            </View>
          </View>
          <Text style={styles.appName}>BarangayConnect</Text>
          <Text style={styles.tagline}>Connecting residents to local government</Text>
        </View>

        {/* Welcome text */}
        <View style={styles.welcomeSection}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue to your barangay</Text>
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <View style={[
            styles.inputWrap,
            emailFocused && styles.inputWrapFocused,
            emailError && styles.inputWrapError,
          ]}>
            <Ionicons name="mail-outline" size={18} color={emailError ? colors.error : emailFocused ? colors.accent : colors.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#B0BEC5"
              value={email}
              onChangeText={text => { setEmail(text); if (emailError) setEmailError(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => {
                setEmailFocused(false);
                if (!email.trim()) setEmailError('Email is required');
                else if (!validateEmail(email)) setEmailError('Please enter a valid email address');
              }}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        {/* Password Input */}
        <View style={styles.inputGroup}>
          <View style={[
            styles.inputWrap,
            passwordFocused && styles.inputWrapFocused,
            passwordError && styles.inputWrapError,
          ]}>
            <Ionicons name="lock-closed-outline" size={18} color={passwordError ? colors.error : passwordFocused ? colors.accent : colors.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor="#B0BEC5"
              value={password}
              onChangeText={text => { setPassword(text); if (passwordError) setPasswordError(''); }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => {
                setPasswordFocused(false);
                if (!password.trim()) setPasswordError('Password is required');
              }}
            />
            <Pressable style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
            </Pressable>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        {/* Login Button */}
        <Pressable
          style={[styles.loginButton, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>Sign In</Text>
          )}
        </Pressable>

        {/* Register Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: Platform.OS === 'ios' ? 70 : 50,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  logoRing: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: colors.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.accent,
  },
  logoInner: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.fg,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: colors.muted,
    marginTop: spacing.xs,
  },

  // Welcome
  welcomeSection: {
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.fg,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginTop: spacing.xs,
  },

  // Input group (wraps input + error)
  inputGroup: {
    marginBottom: spacing.md,
  },

  // Input wrapper (icon + field + eye in one box)
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 52,
    ...shadows.sm,
  },
  inputWrapFocused: {
    borderColor: colors.accent,
    backgroundColor: colors.card,
  },
  inputWrapError: {
    borderColor: colors.error,
    backgroundColor: colors.errorBg,
  },
  inputIcon: {
    marginRight: spacing.sm,
    width: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.fg,
    padding: 0,
    height: '100%',
  },
  passwordInput: {
    paddingRight: spacing.xs,
  },
  eyeIcon: {
    paddingLeft: spacing.sm,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 6,
    marginLeft: spacing.sm,
  },

  // Button
  loginButton: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    height: 52,
    justifyContent: 'center',
    ...shadows.accent,
  },
  loginButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  buttonDisabled: {
    backgroundColor: '#5EEAD4',
    shadowOpacity: 0,
    elevation: 0,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  footerText: {
    color: colors.muted,
    fontSize: 14,
  },
  footerLink: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
});