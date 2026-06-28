import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

type Complaint = {
  id: string;
  title: string;
  category: string;
  urgency: string;
  status: string;
  created_at: string;
};

const STAT_CONFIG = [
  { key: 'total' as const, label: 'Total', color: '#0284C7', bg: '#F0F9FF', icon: 'layers-outline' as const },
  { key: 'pending' as const, label: 'Pending', color: '#EA580C', bg: '#FFF7ED', icon: 'clock-outline' as const },
  { key: 'under_review' as const, label: 'In Review', color: '#2563EB', bg: '#EFF6FF', icon: 'sync-outline' as const },
  { key: 'resolved' as const, label: 'Resolved', color: '#059669', bg: '#ECFDF5', icon: 'checkmark-circle-outline' as const },
  { key: 'high_urgency' as const, label: 'High Urgency', color: '#DC2626', bg: '#FEF2F2', icon: 'alert-circle-outline' as const },
  { key: 'dismissed' as const, label: 'Dismissed', color: '#6B7280', bg: '#F9FAFB', icon: 'close-circle-outline' as const },
];

export default function ReportsScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { fetchData() }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name);
      setUserEmail(profile.email);
    }

    const { data } = await supabase
      .from('complaints')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setComplaints(data);
    setLoading(false);
  }

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'pending').length,
    under_review: complaints.filter(c => c.status === 'under_review').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    dismissed: complaints.filter(c => c.status === 'dismissed').length,
    high_urgency: complaints.filter(c => c.urgency === 'high').length,
  };

  async function handleGenerateReport() {
    setGenerating(true);
    try {
      const html = generateReportHTML();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Complaint Report',
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('complaint_reports').insert({
          generated_by: user.id,
          report_title: `Complaint Report — ${new Date().toLocaleDateString('en-PH')}`,
          date_range: 'All time',
          total_complaints: stats.total,
          resolved_count: stats.resolved,
          pending_count: stats.pending,
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Could not generate report.');
    } finally {
      setGenerating(false);
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

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Arial,sans-serif;color:#111;padding:40px;background:#fff}.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0D9488;padding-bottom:20px;margin-bottom:28px}.app-name{font-size:24px;font-weight:800;color:#0D9488}.doc-label{font-size:13px;color:#888;margin-top:3px}.meta{text-align:right;font-size:12px;color:#888;line-height:1.6}.meta strong{color:#111}.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:30px}.stat-box{background:#F8FAFC;border-radius:10px;padding:14px;text-align:center;border:1px solid #E2E8F0}.stat-num{font-size:28px;font-weight:700}.stat-lbl{font-size:11px;color:#888;margin-top:2px;text-transform:uppercase;letter-spacing:0.4px}h2{font-size:16px;font-weight:700;margin-bottom:14px;color:#111}table{width:100%;border-collapse:collapse;font-size:13px}th{background:#F1F5F9;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:#64748B;border-bottom:1px solid #E2E8F0}td{padding:10px 12px;border-bottom:1px solid #F1F5F9;color:#333;vertical-align:middle}tr:last-child td{border-bottom:none}.footer{margin-top:40px;border-top:1px solid #eee;padding-top:16px;text-align:center;font-size:11px;color:#aaa}</style></head><body><div class="header"><div><div class="app-name">BarangayConnect</div><div class="doc-label">Complaint Activity Report</div></div><div class="meta"><strong>${userName}</strong><br/>${userEmail}<br/>Generated: ${new Date().toLocaleDateString('en-PH')}</div></div><div class="stats-grid"><div class="stat-box"><div class="stat-num" style="color:#0284C7">${stats.total}</div><div class="stat-lbl">Total</div></div><div class="stat-box"><div class="stat-num" style="color:#EA580C">${stats.pending}</div><div class="stat-lbl">Pending</div></div><div class="stat-box"><div class="stat-num" style="color:#2563EB">${stats.under_review}</div><div class="stat-lbl">Under Review</div></div><div class="stat-box"><div class="stat-num" style="color:#16A34A">${stats.resolved}</div><div class="stat-lbl">Resolved</div></div><div class="stat-box"><div class="stat-num" style="color:#6B7280">${stats.dismissed}</div><div class="stat-lbl">Dismissed</div></div><div class="stat-box"><div class="stat-num" style="color:#DC2626">${stats.high_urgency}</div><div class="stat-lbl">High Urgency</div></div></div><h2>All Complaints</h2><table><thead><tr><th>Title</th><th>Category</th><th>Urgency</th><th>Status</th><th>Date</th></tr></thead><tbody>${rows.length > 0 ? rows : '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:24px">No complaints found</td></tr>'}</tbody></table><div class="footer">BarangayConnect — Auto-generated report • Total records: ${stats.total}</div></body></html>`
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Reports</Text>
      <Text style={styles.pageSubtitle}>Generate your complaint activity report</Text>

      <View style={styles.statsGrid}>
        {STAT_CONFIG.map(s => (
          <View key={s.key} style={[styles.statCard, { backgroundColor: s.bg, borderTopColor: s.color }]}>
            <View style={[styles.statIcon, { backgroundColor: 'rgba(255,255,255,0.7)' }]}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={s.color} />
            </View>
            <Text style={[styles.statNum, { color: s.color }]}>{stats[s.key]}</Text>
            <Text style={styles.statLbl}>{s.label}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={[styles.generateBtn, generating && styles.generateBtnDisabled]}
        onPress={handleGenerateReport}
        disabled={generating}
      >
        {generating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.generateBtnContent}>
            <Ionicons name="document-text" size={18} color="#fff" />
            <Text style={styles.generateBtnText}>Generate PDF Report</Text>
          </View>
        )}
      </Pressable>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xxl },

  pageTitle: { fontSize: 22, fontWeight: '800', color: colors.fg, marginTop: spacing.sm, marginBottom: 4, letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 13, color: colors.muted, marginBottom: spacing.xl },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing.xxl },
  statCard: {
    width: '31%', borderRadius: radius.lg, padding: spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    borderLeftWidth: 0, borderRightWidth: 0, borderBottomWidth: 0,
  },
  statIcon: {
    width: 30, height: 30, borderRadius: radius.sm,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statNum: { fontSize: 24, fontWeight: '800' },
  statLbl: { fontSize: 10, color: colors.muted, marginTop: 2, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  generateBtn: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    ...shadows.accent,
  },
  generateBtnDisabled: { backgroundColor: '#5EEAD4', shadowOpacity: 0, elevation: 0 },
  generateBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  generateBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});1