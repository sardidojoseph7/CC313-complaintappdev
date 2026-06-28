import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

type Complaint = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  created_at: string;
};

const FILTERS = ['all', 'pending', 'under_review', 'resolved', 'dismissed'];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF7ED', text: '#EA580C' },
  under_review: { bg: '#EFF6FF', text: '#2563EB' },
  resolved: { bg: '#ECFDF5', text: '#059669' },
  dismissed: { bg: '#F9FAFB', text: '#6B7280' },
};

const URGENCY_COLORS: Record<string, string> = {
  low: '#059669',
  medium: '#D97706',
  high: '#DC2626',
};

export default function ComplaintsScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filtered, setFiltered] = useState<Complaint[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  async function fetchComplaints() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setComplaints(data);
      applyFilter(data, activeFilter);
    }
    setLoading(false);
    setRefreshing(false);
  }

  function applyFilter(data: Complaint[], filter: string) {
    if (filter === 'all') {
      setFiltered(data);
    } else {
      setFiltered(data.filter(c => c.status === filter));
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [])
  );

  useEffect(() => {
    applyFilter(complaints, activeFilter);
  }, [activeFilter, complaints]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchComplaints();
  }, []);

  async function handleDelete(id: string) {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Delete this complaint? This action cannot be undone.')
      : await new Promise((resolve) => {
          Alert.alert('Delete Complaint', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
          ]);
        });

    if (!confirmed) return;

    const previousComplaints = [...complaints];
    setComplaints(prev => prev.filter(c => c.id !== id));

    const { error } = await supabase
      .from('complaints')
      .delete()
      .eq('id', id);

    if (error) {
      setComplaints(previousComplaints);
      Alert.alert('Error', error.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter bar */}
      <View style={styles.filterBar}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={i => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.filterChipText, activeFilter === item && styles.filterChipTextActive]}>
                {item.replace('_', ' ')}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <Text style={styles.countText}>{filtered.length} complaint{filtered.length !== 1 ? 's' : ''}</Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="document-text-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No complaints found</Text>
            <Text style={styles.emptySub}>Try changing the filter or file a new one</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/complaint/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.urgencyDot, { backgroundColor: URGENCY_COLORS[item.urgency] || '#6B7280' }]} />
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status]?.bg }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status]?.text }]}>
                  {item.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

            <View style={styles.cardMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="folder-outline" size={13} color={colors.muted} />
                <Text style={styles.metaText}>{item.category}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={13} color={colors.muted} />
                <Text style={styles.metaText}>
                  {new Date(item.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            </View>

            <View style={styles.cardActions}>
              <Pressable
                style={styles.editBtn}
                onPress={() => router.push(`/edit-complaint/${item.id}`)}
              >
                <Ionicons name="create-outline" size={14} color="#2563EB" />
                <Text style={styles.editBtnText}>Edit</Text>
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={14} color="#DC2626" />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />

      <Pressable
        style={styles.fab}
        onPress={() => router.push('/new-complaint')}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },

  // Filters
  filterBar: {
    backgroundColor: colors.card,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterRow: { paddingHorizontal: spacing.xl, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: '#F1F5F9',
  },
  filterChipActive: { backgroundColor: colors.fg },
  filterChipText: { fontSize: 12, color: colors.muted, fontWeight: '600', textTransform: 'capitalize' },
  filterChipTextActive: { color: '#fff' },

  countText: {
    fontSize: 12, color: colors.muted, fontWeight: '600',
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.3,
  },

  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.md, gap: spacing.sm },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.fg, flex: 1 },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize', letterSpacing: 0.3 },

  description: { fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: spacing.md },

  cardMeta: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.lg,
    marginBottom: spacing.md,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.muted, fontWeight: '500' },

  // Actions
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.md,
  },
  editBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: radius.sm,
    backgroundColor: '#EFF6FF',
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    paddingVertical: 9, borderRadius: radius.sm,
    backgroundColor: '#FEF2F2',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.accent,
  },

  // Empty
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: colors.fg, marginTop: spacing.md },
  emptySub: { fontSize: 13, color: colors.muted, marginTop: 4 },
});