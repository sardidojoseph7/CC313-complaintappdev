import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Success',
        'A password reset link has been sent to your email.'
      );
      router.back();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>

        <Pressable onPress={() => router.back()}>
          <Ionicons
            name="arrow-back"
            size={28}
            color={colors.fg}
          />
        </Pressable>

        <Text style={styles.title}>Forgot Password</Text>

        <Text style={styles.subtitle}>
          Enter your email address and we'll send you a password reset link.
        </Text>

        <View style={styles.inputWrap}>
          <Ionicons
            name="mail-outline"
            size={18}
            color={colors.muted}
            style={styles.icon}
          />

          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Pressable
          style={styles.button}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Text>
        </Pressable>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
  },

  content: {
    padding: spacing.xxl,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.fg,
    marginTop: 20,
  },

  subtitle: {
    color: colors.muted,
    marginTop: 10,
    marginBottom: 30,
    fontSize: 15,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
    ...shadows.sm,
  },

  icon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: colors.fg,
  },

  button: {
    marginTop: 25,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.accent,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});