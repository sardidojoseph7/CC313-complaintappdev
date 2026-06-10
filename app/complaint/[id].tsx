import * as Print from 'expo-print'
import { useLocalSearchParams, useRouter } from 'expo-router'
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
  description: string
  category: string
  urgency: string
  status: string
  resolution_notes: string | null
  created_at: string
  updated_at: string
}

type AIAnalysis = {
  ai_category: string
  ai_urgency: string
  ai_summary: string
  analyzed_at: string
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: '#FFF7ED', text: '#EA580C' },
  under_review: { bg: '#EFF6FF', text: '#2563EB' },
  resolved: { bg: '#F0FDF4', text: '#16A34A' },
  dismissed: { bg: '#F9FAFB', text: '#6B7280' },
}

const URGENCY_COLORS: Record<string, string> = {
  low: '#16A34A', medium: '#D97706', high: '#DC2626'
}

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [generatingPDF, setGeneratingPDF] = useState(false)
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

    const { data: comp } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single()

    if (!comp) {
      Alert.alert('Error', 'Complaint not found.')
      router.back()
      return
    }

    setComplaint(comp)

    const { data: ai } = await supabase
      .from('ai_analysis')
      .select('*')
      .eq('complaint_id', id)
      .single()

    if (ai) setAnalysis(ai)

    setLoading(false)
  }

  useEffect(() => {
    fetchData()

    // Poll for AI every 3 seconds
    let pollCount = 0
    const pollInterval = setInterval(async () => {
      const { data: ai } = await supabase
        .from('ai_analysis')
        .select('*')
        .eq('complaint_id', id)
        .single()

      if (ai) {
        setAnalysis(ai)
        clearInterval(pollInterval)
      }

      pollCount++
      if (pollCount > 10) clearInterval(pollInterval)
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [id])

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-PH', {
      month: 'long', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  async function handleGeneratePDF() {
    if (!complaint) return
    setGeneratingPDF(true)

    try {
      const html = generateComplaintHTML(complaint, analysis, userName)
      const { uri } = await Print.printToFileAsync({ html })
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Complaint Receipt',
      })
    } catch (err) {
      Alert.alert('Error', 'Could not generate PDF.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  function generateComplaintHTML(
    c: Complaint,
    ai: AIAnalysis | null,
    name: string
  ): string {
    const statusColor: Record<string, string> = {
      pending: '#EA580C', under_review: '#2563EB',
      resolved: '#16A34A', dismissed: '#6B7280'
    }
    const urgColor: Record<string, string> = {
      low: '#16A34A', medium: '#D97706', high: '#DC2626'
    }

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;color:#111;padding:40px}.header{border-bottom:3px solid #3B82F6;padding-bottom:20px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:flex-start}.app-name{font-size:22px;font-weight:800;color:#3B82F6}.doc-type{font-size:13px;color:#888;margin-top:4px}.receipt-no{text-align:right;font-size:12px;color:#888}.receipt-no strong{font-size:14px;color:#111;display:block}h2{font-size:18px;font-weight:700;margin-bottom:14px;color:#111}.section{margin-bottom:24px}.field{margin-bottom:12px}.field-label{font-size:11px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:3px}.field-value{font-size:14px;color:#111;font-weight:500}.badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}.ai-box{background:#F0F9FF;border:1px solid #BAE6FD;border-radius:10px;padding:16px;margin-bottom:24px}.ai-title{font-size:13px;font-weight:700;color:#0284C7;margin-bottom:10px}.description-box{background:#F8FAFC;border-radius:8px;padding:14px;font-size:14px;color:#333;line-height:1.6}.footer{margin-top:40px;border-top:1px solid #eee;padding-top:16px;font-size:11px;color:#aaa;text-align:center}.status-badge{background:${statusColor[c.status]??'#888'}22;color:${statusColor[c.status]??'#888'}}.urgency-badge{background:${urgColor[c.urgency]??'#888'}22;color:${urgColor[c.urgency]??'#888'}}</style></head><body><div class="header"><div><div class="app-name">ComplaintApp</div><div class="doc-type">Official Complaint Receipt</div></div><div class="receipt-no"><strong>#${c.id.slice(0,8).toUpperCase()}</strong>Generated: ${new Date().toLocaleDateString('en-PH')}</div></div><div class="section"><h2>Complaint Information</h2><div class="field"><div class="field-label">Submitted by</div><div class="field-value">${name}</div></div><div class="field"><div class="field-label">Title</div><div class="field-value">${c.title}</div></div><div class="grid2"><div class="field"><div class="field-label">Status</div><span class="badge status-badge">${c.status.replace('_',' ')}</span></div><div class="field"><div class="field-label">Urgency</div><span class="badge urgency-badge">${c.urgency}</span></div><div class="field"><div class="field-label">Category</div><div class="field-value">${c.category}</div></div><div class="field"><div class="field-label">Date Submitted</div><div class="field-value">${new Date(c.created_at).toLocaleDateString('en-PH')}</div></div></div><div class="field"><div class="field-label">Description</div><div class="description-box">${c.description}</div></div>${c.resolution_notes?`<div class="field"><div class="field-label">Resolution Notes</div><div class="description-box">${c.resolution_notes}</div></div>`:''}</div>${ai?`<div class="ai-box"><div class="ai-title">🤖 AI Analysis Result</div><div class="grid2"><div class="field"><div class="field-label">AI Category</div><div class="field-value">${ai.ai_category}</div></div><div class="field"><div class="field-label">AI Urgency</div><div class="field-value">${ai.ai_urgency}</div></div></div><div class="field"><div class="field-label">AI Summary</div><div class="field-value">${ai.ai_summary}</div></div></div>`:''}        <div class="footer">This document was automatically generated by ComplaintApp. Complaint ID: ${c.id} • Last updated: ${new Date(c.updated_at).toLocaleDateString('en-PH')}</div></body></html>`
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  if (!complaint) return null

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      <View style={[
        styles.statusBanner,
        { backgroundColor: STATUS_COLORS[complaint.status]?.bg ?? '#F9FAFB' }
      ]}>
        <Text style={[
          styles.statusBannerText,
          { color: STATUS_COLORS[complaint.status]?.text ?? '#6B7280' }
        ]}>
          {complaint.status.replace('_', ' ').toUpperCase()}
        </Text>
      </View>

      <View style={styles.content}>

        <Text style={styles.title}>{complaint.title}</Text>
        <Text style={styles.date}>Submitted {formatDate(complaint.created_at)}</Text>

        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>🏷 {complaint.category}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: '#FFF7ED' }]}>
            <Text style={[styles.chipText, { color: URGENCY_COLORS[complaint.urgency] }]}>
              ● {complaint.urgency}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Description</Text>
          <View style={styles.descBox}>
            <Text style={styles.descText}>{complaint.description}</Text>
          </View>
        </View>

        {complaint.resolution_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Resolution Notes</Text>
            <View style={[styles.descBox, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Text style={[styles.descText, { color: '#166534' }]}>
                {complaint.resolution_notes}
              </Text>
            </View>
          </View>
        )}

        {analysis ? (
          <View style={styles.aiSection}>
            <Text style={styles.aiTitle}>🤖 AI Analysis</Text>
            <View style={styles.aiGrid}>
              <View style={styles.aiCard}>
                <Text style={styles.aiCardLabel}>Category</Text>
                <Text style={styles.aiCardValue}>{analysis.ai_category}</Text>
              </View>
              <View style={styles.aiCard}>
                <Text style={styles.aiCardLabel}>Urgency</Text>
                <Text style={[styles.aiCardValue, { color: URGENCY_COLORS[analysis.ai_urgency] }]}>
                  {analysis.ai_urgency}
                </Text>
              </View>
            </View>
            <View style={styles.section}>
              <Text style={styles.aiCardLabel}>Summary</Text>
              <Text style={styles.aiSummary}>{analysis.ai_summary}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.aiPending}>
            <Text style={styles.aiPendingText}>⏳ AI analysis is being processed...</Text>
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => fetchData()}
          >
            <Text style={styles.refreshBtnText}>🔄</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push(`/edit-complaint/${complaint.id}`)}
          >
            <Text style={styles.editBtnText}>✏️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pdfBtn, generatingPDF && styles.pdfBtnDisabled]}
            onPress={handleGeneratePDF}
            disabled={generatingPDF}
          >
            {generatingPDF
              ? <ActivityIndicator color="#fff" size="small" />
              : <Text style={styles.pdfBtnText}>📄</Text>
            }
          </TouchableOpacity>
        </View>

      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  statusBanner: { paddingVertical: 10, alignItems: 'center' },
  statusBannerText: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },

  content: { padding: 20 },

  title: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 6 },
  date: { fontSize: 13, color: '#888', marginBottom: 14 },

  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  chip: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  chipText: { fontSize: 13, color: '#555', fontWeight: '500' },

  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  descBox: { backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  descText: { fontSize: 14, color: '#333', lineHeight: 22 },

  aiSection: { backgroundColor: '#F0F9FF', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#BAE6FD' },
  aiTitle: { fontSize: 14, fontWeight: '700', color: '#0284C7', marginBottom: 14 },
  aiGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  aiCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E0F2FE' },
  aiCardLabel: { fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  aiCardValue: { fontSize: 15, fontWeight: '600', color: '#111', textTransform: 'capitalize' },
  aiSummary: { fontSize: 14, color: '#333', lineHeight: 21 },

  aiPending: { backgroundColor: '#FFFBEB', borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: '#FDE68A' },
  aiPendingText: { fontSize: 13, color: '#92400E', textAlign: 'center' },

  actionsRow: { flexDirection: 'row', gap: 10 },
  refreshBtn: { flex: 1, backgroundColor: '#F3F4F6', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  refreshBtnText: { fontSize: 16 },
  editBtn: { flex: 1, backgroundColor: '#EFF6FF', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 16 },
  pdfBtn: { flex: 1, backgroundColor: '#3B82F6', padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', height: 50 },
  pdfBtnDisabled: { backgroundColor: '#93C5FD' },
  pdfBtnText: { color: '#fff', fontSize: 16 },
})