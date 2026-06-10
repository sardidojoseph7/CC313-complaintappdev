import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList,
  Platform,
  RefreshControl, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native'
import { supabase } from '../../lib/supabase'

type Complaint = {
  id: string
  title: string
  description: string
  category: string
  urgency: string
  status: string
  created_at: string
}

const FILTERS = ['all', 'pending', 'under_review', 'resolved', 'dismissed']

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF7ED', text: '#EA580C' },
  under_review: { bg: '#EFF6FF', text: '#2563EB' },
  resolved: { bg: '#F0FDF4', text: '#16A34A' },
  dismissed: { bg: '#F9FAFB', text: '#6B7280' },
}

const URGENCY_COLORS: Record<string, string> = {
  low: '#16A34A',
  medium: '#D97706',
  high: '#DC2626',
}

export default function ComplaintsScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [filtered, setFiltered] = useState<Complaint[]>([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  async function fetchComplaints() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setComplaints(data)
      applyFilter(data, activeFilter)
    }
    setLoading(false)
    setRefreshing(false)
  }

  function applyFilter(data: Complaint[], filter: string) {
    if (filter === 'all') {
      setFiltered(data)
    } else {
      setFiltered(data.filter(c => c.status === filter))
    }
  }

  useEffect(() => { fetchComplaints() }, [])

  useEffect(() => {
    applyFilter(complaints, activeFilter)
  }, [activeFilter, complaints])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchComplaints()
  }, [])

 async function handleDelete(id: string) {
  // Use browser confirm on web, React Native Alert on native
  const confirmed = Platform.OS === 'web'
    ? window.confirm('Delete this complaint? This action cannot be undone.')
    : await new Promise((resolve) => {
        Alert.alert('Delete Complaint', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
          { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
        ]);
      });

  if (!confirmed) return;

  // Optimistic update – remove from UI immediately
  const previousComplaints = [...complaints];
  setComplaints(prev => prev.filter(c => c.id !== id));

  const { error } = await supabase
    .from('complaints')
    .delete()
    .eq('id', id);

  if (error) {
    // Restore on error
    setComplaints(previousComplaints);
    Alert.alert('Error', error.message);
  }
}

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterWrapper}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={i => i}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item && styles.filterChipActive]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[
                styles.filterChipText,
                activeFilter === item && styles.filterChipTextActive
              ]}>
                {item.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <Text style={styles.countText}>{filtered.length} complaint{filtered.length !== 1 ? 's' : ''}</Text>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No complaints found</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/complaint/${item.id}`)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status]?.bg }]}>
                <Text style={[styles.statusText, { color: STATUS_COLORS[item.status]?.text }]}>
                  {item.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

            <View style={styles.cardFooter}>
              <Text style={styles.categoryTag}>{item.category}</Text>
              <Text style={[styles.urgencyTag, { color: URGENCY_COLORS[item.urgency] }]}>
                ● {item.urgency}
              </Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => router.push(`/edit-complaint/${item.id}`)}
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/new-complaint')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  filterWrapper: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  filterRow: { paddingHorizontal: 16, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, backgroundColor: '#F1F5F9',
  },
  filterChipActive: { backgroundColor: '#3B82F6' },
  filterChipText: { fontSize: 13, color: '#666', fontWeight: '500', textTransform: 'capitalize' },
  filterChipTextActive: { color: '#fff' },

  countText: { fontSize: 13, color: '#888', paddingHorizontal: 20, paddingVertical: 10 },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  description: { fontSize: 13, color: '#666', lineHeight: 19, marginBottom: 10 },

  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, flexWrap: 'wrap' },
  categoryTag: { fontSize: 12, color: '#666', fontWeight: '500' },
  urgencyTag: { fontSize: 12, fontWeight: '600' },

  cardActions: { flexDirection: 'row', gap: 8, borderTopWidth: 1, borderTopColor: '#f5f5f5', paddingTop: 10 },
  editBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 8,
    backgroundColor: '#EFF6FF', alignItems: 'center',
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  deleteBtn: {
    flex: 1, paddingVertical: 7, borderRadius: 8,
    backgroundColor: '#FEF2F2', alignItems: 'center',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: '#DC2626' },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#3B82F6', shadowOpacity: 0.4, shadowRadius: 10,
    elevation: 6,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300' },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, color: '#888' },
})