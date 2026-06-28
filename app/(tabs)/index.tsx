import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

type RecentComplaint = {
  id: string;
  title: string;
  category: string;
  status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF7ED', text: '#EA580C' },
  under_review: { bg: '#EFF6FF', text: '#2563EB' },
  resolved: { bg: '#ECFDF5', text: '#059669' },
  dismissed: { bg: '#F9FAFB', text: '#6B7280' },
};

export default function DashboardScreen() {
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({ total: 0, pending: 0, under_review: 0, resolved: 0 });
  const [recent, setRecent] = useState<RecentComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      if (profile) setUserName(profile.full_name);

      const { data: complaints } = await supabase
        .from('complaints')
        .select('id, title, category, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (complaints) {
        setStats({
          total: complaints.length,
          pending: complaints.filter(c => c.status === 'pending').length,
          under_review: complaints.filter(c => c.status === 'under_review').length,
          resolved: complaints.filter(c => c.status === 'resolved').length,
        });
        setRecent(complaints.slice(0, 5));
      }
    } catch (err) {
      console.error('Dashboard synchronization error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brandName}>BarangayConnect</Text>
          <Text style={styles.brandSub}>Public Portal</Text>
        </View>
        <Pressable
          style={styles.fileBtn}
          onPress={() => router.push('/new-complaint')}
        >
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.fileBtnText}>File Blotter</Text>
        </Pressable>
      </View>

      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>Hello, {userName || 'Citizen'}</Text>
        <Text style={styles.greetingSub}>Here's your activity overview</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Pressable
          style={[styles.statCard, { borderTopColor: colors.accent }]}
          onPress={() => router.push('/(tabs)/complaints')}
        >
          <View style={[styles.statIcon, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="layers" size={16} color={colors.accent} />
          </View>
          <Text style={[styles.statNum, { color: colors.fg }]}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Filed</Text>
        </Pressable>

        <Pressable
          style={[styles.statCard, { borderTopColor: '#EA580C' }]}
          onPress={() => router.push('/(tabs)/complaints')}
        >
          <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
            <Ionicons name="time-outline" size={16} color="#EA580C" />
          </View>
          <Text style={[styles.statNum, { color: colors.fg }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </Pressable>

        <Pressable
          style={[styles.statCard, { borderTopColor: '#2563EB' }]}
          onPress={() => router.push('/(tabs)/complaints')}
        >
          <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="sync-outline" size={16} color="#2563EB" />
          </View>
          <Text style={[styles.statNum, { color: colors.fg }]}>{stats.under_review}</Text>
          <Text style={styles.statLabel}>Under Review</Text>
        </Pressable>

        <Pressable
          style={[styles.statCard, { borderTopColor: '#059669' }]}
          onPress={() => router.push('/(tabs)/complaints')}
        >
          <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#059669" />
          </View>
          <Text style={[styles.statNum, { color: colors.fg }]}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>Resolved</Text>
        </Pressable>
      </View>

      {/* Recent Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Submissions</Text>
        <Pressable onPress={() => router.push('/(tabs)/complaints')}>
          <Text style={styles.seeAll}>See all</Text>
        </Pressable>
      </View>

      {recent.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="document-text-outline" size={40} color="#CBD5E1" />
          <Text style={styles.emptyText}>No blotters filed under this account.</Text>
          <Pressable style={styles.emptyBtn} onPress={() => router.push('/new-complaint')}>
            <Text style={styles.emptyBtnText}>File your first blotter</Text>
          </Pressable>
        </View>
      ) : (
        recent.map(item => (
          <Pressable
            key={item.id}
            style={styles.complaintCard}
            onPress={() => router.push(`/complaint/${item.id}`)}
          >
            <View style={styles.complaintHeader}>
              <Text style={styles.complaintTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status]?.bg || '#F3F4F6' }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status]?.text || '#374151' }]}>
                  {item.status.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.complaintFooter}>
              <View style={styles.categoryRow}>
                <Ionicons name="folder-outline" size={13} color={colors.muted} />
                <Text style={styles.categoryTag}>{item.category}</Text>
              </View>
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </Pressable>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },

  // Top bar — replaces dark blue banner
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.card,
  },
  brandName: { fontSize: 16, fontWeight: '800', color: colors.accent, letterSpacing: -0.3 },
  brandSub: { fontSize: 11, color: colors.muted, fontWeight: '500', marginTop: 1 },
  fileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
    ...shadows.accent,
  },
  fileBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Greeting
  greetingSection: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.fg, letterSpacing: -0.5 },
  greetingSub: { fontSize: 13, color: colors.muted, marginTop: 2 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.xl,
    gap: 10,
    marginTop: spacing.lg,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderTopWidth: 3,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    ...shadows.sm,
  },
  statIcon: {
    width: 32, height: 32, borderRadius: radius.sm,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNum: { fontSize: 26, fontWeight: '800', lineHeight: 30 },
  statLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.4 },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.fg },
  seeAll: { color: colors.accent, fontSize: 13, fontWeight: '700' },

  // Complaint cards
  complaintCard: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.xxl,
    marginBottom: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  complaintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm + 2,
  },
  complaintTitle: {
    fontSize: 14, fontWeight: '600', color: colors.fg,
    flex: 1, marginRight: spacing.md,
  },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  complaintFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: spacing.sm,
  },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  categoryTag: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  dateText: { fontSize: 12, color: '#94A3B8' },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xxl,
  },
  emptyText: { fontSize: 14, color: colors.muted, marginTop: spacing.md, textAlign: 'center' },
  emptyBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accentLight,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  emptyBtnText: { color: colors.accent, fontWeight: '700', fontSize: 13 },
});