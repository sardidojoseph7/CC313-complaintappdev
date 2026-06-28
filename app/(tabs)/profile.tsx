import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

type Profile = {
  full_name: string;
  email: string;
  role: string;
  created_at: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [stats, setStats] = useState({ total: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || '');

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileData) setProfile(profileData);

        const { data: complaints } = await supabase
          .from('complaints')
          .select('status')
          .eq('user_id', user.id);

        if (complaints) {
          setStats({
            total: complaints.length,
            resolved: complaints.filter(c => c.status === 'resolved').length,
          });
        }
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to log out?')
      : await new Promise((resolve) => {
          Alert.alert('Log Out', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Log Out', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });

    if (!confirmed) return;

    setLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      if (Platform.OS === 'web') {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.location.href = '/login';
      } else {
        router.replace('/(auth)/login');
      }
    } catch (err) {
      Alert.alert('Error', 'Logout failed');
      setLoggingOut(false);
    }
  }

  if (loggingOut || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <View style={styles.heroSection}>
        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarText}>{getInitials(profile?.full_name ?? 'U')}</Text>
          </View>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.roleBadge}>
          <Ionicons name="shield-checkmark-outline" size={13} color={colors.accent} />
          <Text style={styles.roleText}>{profile?.role || 'user'}</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLbl}>Submitted</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#059669' }]}>{stats.resolved}</Text>
          <Text style={styles.statLbl}>Resolved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#EA580C' }]}>{stats.total - stats.resolved}</Text>
          <Text style={styles.statLbl}>Ongoing</Text>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionLabel}>Account Details</Text>

        {[
          { label: 'Full Name', value: profile?.full_name || 'Not set' },
          { label: 'Email', value: email },
          { label: 'Role', value: profile?.role || 'user' },
          { label: 'Member Since', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-PH') : '—' },
        ].map((row, i) => (
          <View key={i}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
            {i < 3 && <View style={styles.infoDivider} />}
          </View>
        ))}
      </View>

      {/* Logout */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#DC2626" />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>

      <Text style={styles.version}>BarangayConnect v1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarRing: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: colors.accentLight,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.accent,
  },
  avatarInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.accent,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  name: { fontSize: 20, fontWeight: '800', color: colors.fg, letterSpacing: -0.3 },
  email: { fontSize: 13, color: colors.muted, marginTop: 4 },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.md, paddingVertical: 5,
    borderRadius: radius.full, marginTop: spacing.md,
  },
  roleText: { fontSize: 12, color: colors.accent, fontWeight: '700', textTransform: 'capitalize' },

  // Stats
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xl,
    ...shadows.sm,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '800', color: colors.fg },
  statLbl: { fontSize: 11, color: colors.muted, marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  statDivider: { width: 1, backgroundColor: colors.border },

  // Info
  infoSection: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.sm,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.muted,
    marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.6,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.md, alignItems: 'center' },
  infoLabel: { fontSize: 14, color: colors.muted },
  infoValue: { fontSize: 14, color: colors.fg, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  infoDivider: { height: 1, backgroundColor: colors.border },

  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    marginHorizontal: spacing.xl, marginTop: spacing.xl,
    padding: spacing.lg, borderRadius: radius.md,
    backgroundColor: '#FEF2F2',
    borderWidth: 1, borderColor: '#FECACA',
  },
  logoutText: { color: '#DC2626', fontWeight: '700', fontSize: 15 },

  version: {
    textAlign: 'center', marginTop: spacing.xxl,
    fontSize: 11, color: '#B0BEC5', fontWeight: '500',
  },
});