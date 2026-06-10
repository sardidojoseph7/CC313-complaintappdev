import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, ScrollView, StyleSheet,
  Text, TouchableOpacity, View
} from 'react-native'
import { supabase } from '../../lib/supabase'

type Complaint = {
  id: string
  title: string
  category: string
  urgency: string
  status: string
  created_at: string
}

export default function ReportsScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    if (profile) {
      setUserName(profile.full_name)
      setUserEmail(profile.email)
    }

    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setComplaints(data)
    setLoading(false)
  }

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    under_review: complaints.filter(c => c.status === 'under_review').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    dismissed: complaints.filter(c => c.status === 'dismissed').length,
    high_urgency: complaints.filter(c => c.urgency === 'high').length,
  }

  async function handleGenerateReport() {
    setGenerating(true)
    try {
      const html = generateReportHTML()
      const { uri } = await Print.printToFileAsync({ html })
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Complaint Report',
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('complaint_reports').insert({
          generated_by: user.id,
          report_title: `Complaint Report — ${new Date().toLocaleDateString('en-PH')}`,
          date_range: 'All time',
          total_complaints: stats.total,
          resolved_count: stats.resolved,
          pending_count: stats.pending,
        })
      }
    } catch (err) {
      Alert.alert('Error', 'Could not generate report.')
    } finally {
      setGenerating(false)
    }
  }

  function generateReportHTML(): string {
    const rows = complaints.map(c => {
      const statusColor: Record<string, string> = {
        pending: '#EA580C', under_review: '#2563EB',
        resolved: '#16A34A', dismissed: '#6B7280'
      }
      const urgColor: Record<string, string> = {
        low: '#16A34A', medium: '#D97706', high: '#DC2626'
      }
      return `<tr><td>${c.title}</td><td>${c.category}</td><td style="color:${urgColor[c.urgency]};font-weight:600">${c.urgency}</td><td style="color:${statusColor[c.status]};font-weight:600">${c.status.replace('_', ' ')}</td><td>${new Date(c.created_at).toLocaleDateString('en-PH')}</td></tr>`
    }).join('')

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Arial,sans-serif;color:#111;padding:40px;background:#fff}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #3B82F6;padding-bottom:20px;margin-bottom:28px}.app-name{font-size:24px;font-weight:800;color:#3B82F6}.doc-label{font-size:13px;color:#888;margin-top:3px}.meta{text-align:right;font-size:12px;color:#888;line-height:1.6}.meta strong{color:#111}.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:30px}.stat-box{background:#F8FAFC;border-radius:10px;padding:14px;text-align:center;border:1px solid #E2E8F0}.stat-num{font-size:28px;font-weight:700}.stat-lbl{font-size:11px;color:#888;margin-top:2px;text-transform:uppercase;letter-spacing:0.4px}h2{font-size:16px;font-weight:700;margin-bottom:14px;color:#111}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#F1F5F9;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:#64748B;border-bottom:1px solid #E2E8F0}td{padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#333;vertical-align:middle}tr:last-child td{border-bottom:none}.footer{margin-top:40px;border-top:1px solid #eee;padding-top:16px;text-align:center;font-size:11px;color:#aaa}</style></head><body><div class="header"><div><div class="app-name">ComplaintApp</div><div class="doc-label">Complaint Activity Report</div></div><div class="meta"><strong>${userName}</strong><br/>${userEmail}<br/>Generated: ${new Date().toLocaleDateString('en-PH')}</div></div><div class="stats-grid"><div class="stat-box"><div class="stat-num" style="color:#0284C7">${stats.total}</div><div class="stat-lbl">Total</div></div><div class="stat-box"><div class="stat-num" style="color:#EA580C">${stats.pending}</div><div class="stat-lbl">Pending</div></div><div class="stat-box"><div class="stat-num" style="color:#2563EB">${stats.under_review}</div><div class="stat-lbl">Under Review</div></div><div class="stat-box"><div class="stat-num" style="color:#16A34A">${stats.resolved}</div><div class="stat-lbl">Resolved</div></div><div class="stat-box"><div class="stat-num" style="color:#6B7280">${stats.dismissed}</div><div class="stat-lbl">Dismissed</div></div><div class="stat-box"><div class="stat-num" style="color:#DC2626">${stats.high_urgency}</div><div class="stat-lbl">High Urgency</div></div></div><h2>All Complaints</h2><table><thead><tr><th>Title</th><th>Category</th><th>Urgency</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows.length > 0 ? rows : '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:24px">No complaints found</td></tr>'}</tbody></table><div class="footer">ComplaintApp — Auto-generated report • Total records: ${stats.total}</div></body></html>`
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Reports</Text>
      <Text style={styles.pageSubtitle}>Generate your complaint activity report</Text>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#F0F9FF' }]}>
          <Text style={[styles.statNum, { color: '#0284C7' }]}>{stats.total}</Text>
          <Text style={styles.statLbl}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF7ED' }]}>
          <Text style={[styles.statNum, { color: '#EA580C' }]}>{stats.pending}</Text>
          <Text style={styles.statLbl}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
          <Text style={[styles.statNum, { color: '#2563EB' }]}>{stats.under_review}</Text>
          <Text style={styles.statLbl}>In Review</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
          <Text style={[styles.statNum, { color: '#16A34A' }]}>{stats.resolved}</Text>
          <Text style={styles.statLbl}>Resolved</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
          <Text style={[styles.statNum, { color: '#DC2626' }]}>{stats.high_urgency}</Text>
          <Text style={styles.statLbl}>High Urgency</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F9FAFB' }]}>
          <Text style={[styles.statNum, { color: '#6B7280' }]}>{stats.dismissed}</Text>
          <Text style={styles.statLbl}>Dismissed</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
        onPress={handleGenerateReport}
        disabled={generating}
      >
        {generating
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.generateBtnText}>📄  Generate PDF Report</Text>
        }
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },

  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginTop: 8, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 20 },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: { width: '30.5%', borderRadius: 12, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: '700' },
  statLbl: { fontSize: 11, color: '#666', marginTop: 2 },

  generateBtn: {
    backgroundColor: '#3B82F6', padding: 16,
    borderRadius: 12, alignItems: 'center',
    marginBottom: 28, height: 54, justifyContent: 'center',
    shadowColor: '#3B82F6', shadowOpacity: 0.3,
    shadowRadius: 10, elevation: 4,
  },
  generateBtnDisabled: { backgroundColor: '#93C5FD' },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})