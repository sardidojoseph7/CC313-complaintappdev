import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native'
import { supabase } from '../../lib/supabase'

type Profile = {
  full_name: string
  email: string
  role: string
  created_at: string
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [email, setEmail] = useState('')
  const [stats, setStats] = useState({ total: 0, resolved: 0 })
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setEmail(user.email || '')

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileData) setProfile(profileData)

        const { data: complaints } = await supabase
          .from('complaints')
          .select('status')
          .eq('user_id', user.id)

        if (complaints) {
          setStats({
            total: complaints.length,
            resolved: complaints.filter(c => c.status === 'resolved').length,
          })
        }
      }
    } catch (error) {
      console.error('Error loading user:', error)
    } finally {
      setLoading(false)
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

  setLoggingOut(true)
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error

    if (Platform.OS === 'web') {
      window.localStorage.clear()
      window.sessionStorage.clear()
      window.location.href = '/login'
    } else {
      router.replace('/(auth)/login')
    }
  } catch (err) {
    Alert.alert('Error', 'Logout failed')
    setLoggingOut(false)
  }
}

  if (loggingOut) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.heroSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(profile?.full_name ?? 'U')}</Text>
        </View>
        <Text style={styles.name}>{profile?.full_name || 'User'}</Text>
        <Text style={styles.email}>{email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{profile?.role || 'user'}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLbl}>Submitted</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#16A34A' }]}>{stats.resolved}</Text>
          <Text style={styles.statLbl}>Resolved</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={[styles.statNum, { color: '#EA580C' }]}>{stats.total - stats.resolved}</Text>
          <Text style={styles.statLbl}>Ongoing</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionLabel}>Account Details</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Full Name</Text>
          <Text style={styles.infoValue}>{profile?.full_name || 'Not set'}</Text>
        </View>
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{email}</Text>
        </View>
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Role</Text>
          <Text style={styles.infoValue}>{profile?.role || 'user'}</Text>
        </View>
        <View style={styles.divider} />
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Member Since</Text>
          <Text style={styles.infoValue}>
            {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-PH') : '—'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  heroSection: { alignItems: 'center', paddingVertical: 32, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 4 },
  email: { fontSize: 14, color: '#888', marginBottom: 10 },
  roleBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { fontSize: 12, color: '#2563EB', fontWeight: '600', textTransform: 'capitalize' },

  statsRow: { flexDirection: 'row', backgroundColor: '#fff', marginTop: 12, padding: 20, borderRadius: 14, marginHorizontal: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '700', color: '#1D4ED8' },
  statLbl: { fontSize: 12, color: '#888', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#f0f0f0' },

  infoSection: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#888', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, color: '#111', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#f5f5f5' },

  logoutBtn: { marginHorizontal: 16, marginTop: 16, padding: 16, borderRadius: 12, backgroundColor: '#FEF2F2', alignItems: 'center' },
  logoutText: { color: '#DC2626', fontWeight: '600', fontSize: 15 },
})