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

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const router = useRouter();

  const isValidFullName = (name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 2) return false;
    if (!/^[a-zA-Z\s\.\']+$/.test(trimmed)) return false;
    const parts = trimmed.split(/\s+/).filter(p => p.length > 0);
    return parts.length >= 2;
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const isValidPassword = (password: string) =>
    password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);

  const validate = () => {
    let isValid = true;
    setFullNameError('');
    setEmailError('');
    setPasswordError('');

    if (!fullName.trim()) {
      setFullNameError('Full Name is required');
      isValid = false;
    } else if (!isValidFullName(fullName)) {
      setFullNameError('Must include first and last name (letters only, no numbers)');
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (!isValidPassword(password)) {
      setPasswordError('Must be at least 8 characters with letters and numbers');
      isValid = false;
    }

    return isValid;
  };

  async function handleRegister() {
    if (!validate()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName.trim() } },
      });

      if (error) {
        if (error.message.includes('User already registered')) {
          throw new Error('This email is already registered. Please log in.');
        } else {
          throw new Error(error.message);
        }
      }

      if (data.user) {
        Alert.alert(
          'Registration Successful',
          'Please check your email to confirm your account, then log in.',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

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
        {/* Back + Title */}
        <Pressable style={styles.backRow} onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={22} color={colors.fg} />
          <Text style={styles.backLabel}>Back</Text>
        </Pressable>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join your barangay community</Text>

        {/* Full Name */}
        <View style={styles.inputGroup}>
          <View style={[
            styles.inputWrap,
            nameFocused && styles.inputWrapFocused,
            fullNameError && styles.inputWrapError,
          ]}>
            <Ionicons name="person-outline" size={18} color={fullNameError ? colors.error : nameFocused ? colors.accent : colors.muted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name (e.g., Juan Dela Cruz)"
              placeholderTextColor="#B0BEC5"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (fullNameError) setFullNameError('');
              }}
              autoCapitalize="words"
              onFocus={() => setNameFocused(true)}
              onBlur={() => {
                setNameFocused(false);
                if (!fullName.trim()) setFullNameError('Full Name is required');
                else if (!isValidFullName(fullName)) setFullNameError('Must include first and last name');
              }}
            />
          </View>
          {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}
        </View>

        {/* Email */}
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
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => {
                setEmailFocused(false);
                if (!email.trim()) setEmailError('Email is required');
                else if (!isValidEmail(email)) setEmailError('Please enter a valid email address');
              }}
            />
          </View>
          {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        </View>

        {/* Password */}
        <View style={styles.inputGroup}>
          <View style={[
            styles.inputWrap,
            passwordFocused && styles.inputWrapFocused,
            passwordError && styles.inputWrapError,
          ]}>
            <Ionicons name="lock-closed-outline" size={18} color={passwordError ? colors.error : passwordFocused ? colors.accent : colors.muted} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Password (min 8 chars, letters & numbers)"
              placeholderTextColor="#B0BEC5"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => {
                setPasswordFocused(false);
                if (password && !isValidPassword(password)) {
                  setPasswordError('Must be 8+ chars with letters & numbers');
                }
              }}
            />
            <Pressable style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
            </Pressable>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
        </View>

        {/* Register Button */}
        <Pressable
          style={[styles.registerButton, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Create Account</Text>
          )}
        </Pressable>

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
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

  // Back row
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xxl,
    width: 60,
  },
  backLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.fg,
    marginLeft: spacing.xs,
  },

  // Title
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
    marginBottom: spacing.xxl,
  },

  // Input group
  inputGroup: {
    marginBottom: spacing.md,
  },
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
  registerButton: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.xl,
    height: 52,
    justifyContent: 'center',
    ...shadows.accent,
  },
  registerButtonText: {
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