import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native'
import { supabase } from '../../lib/supabase'

type RecentComplaint = {
  id: string
  title: string
  category: string
  status: string
  created_at: string
}

export default function DashboardScreen() {
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState({ total: 0, pending: 0, under_review: 0, resolved: 0 })
  const [recent, setRecent] = useState<RecentComplaint[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
    if (profile) setUserName(profile.full_name)

    const { data: complaints } = await supabase
      .from('complaints')
      .select('id, title, category, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (complaints) {
      setStats({
        total: complaints.length,
        pending: complaints.filter(c => c.status === 'pending').length,
        under_review: complaints.filter(c => c.status === 'under_review').length,
        resolved: complaints.filter(c => c.status === 'resolved').length,
      })
      setRecent(complaints.slice(0, 5))
    }
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { fetchData() }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchData()
  }, [])

  const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    pending: { bg: '#FFF7ED', text: '#EA580C' },
    under_review: { bg: '#EFF6FF', text: '#2563EB' },
    resolved: { bg: '#F0FDF4', text: '#16A34A' },
    dismissed: { bg: '#F9FAFB', text: '#6B7280' },
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#3B82F6" />

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {userName} 👋</Text>
          <Text style={styles.sub}>Here's your activity</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => router.push('/new-complaint')}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsRow}>
        <View style={[styles.card, { backgroundColor: '#F0F9FF' }]}>
          <Text style={[styles.cardNum, { color: '#0284C7' }]}>{stats.total}</Text>
          <Text style={styles.cardLabel}>Submitted</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#FFF7ED' }]}>
          <Text style={[styles.cardNum, { color: '#EA580C' }]}>{stats.pending}</Text>
          <Text style={styles.cardLabel}>Pending</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#EFF6FF' }]}>
          <Text style={[styles.cardNum, { color: '#2563EB' }]}>{stats.under_review}</Text>
          <Text style={styles.cardLabel}>In Review</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[styles.cardNum, { color: '#16A34A' }]}>{stats.resolved}</Text>
          <Text style={styles.cardLabel}>Resolved</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/complaints')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>

      {recent.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>No complaints yet</Text>
        </View>
      ) : (
        recent.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.complaintCard}
            onPress={() => router.push(`/complaint/${item.id}`)}
          >
            <View style={styles.complaintHeader}>
              <Text style={styles.complaintTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status]?.bg }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status]?.text }]}>
                  {item.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <View style={styles.complaintFooter}>
              <Text style={styles.categoryTag}>{item.category}</Text>
              <Text style={styles.dateText}>
                {new Date(item.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  greeting: { fontSize: 18, fontWeight: '700', color: '#111' },
  sub: { fontSize: 13, color: '#888' },
  newBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  newBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  seeAll: { color: '#3B82F6', fontSize: 13, fontWeight: '500' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 10, gap: 8 },
  card: { width: '47%', padding: 14, borderRadius: 12, alignItems: 'center', marginHorizontal: 2 },
  cardNum: { fontSize: 28, fontWeight: '700', color: '#1D4ED8' },
  cardLabel: { fontSize: 11, color: '#666', marginTop: 4 },

  complaintCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  complaintHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  complaintTitle: { fontSize: 14, fontWeight: '600', color: '#111', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  complaintFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryTag: { fontSize: 12, color: '#666' },
  dateText: { fontSize: 12, color: '#aaa' },

  emptyBox: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#888' },
})