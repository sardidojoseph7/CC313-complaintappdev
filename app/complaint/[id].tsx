import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
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

type Complaint = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  status: string;
  created_at: string;
  user_id: string;
};

type AIAnalysis = {
  ai_category: string;
  ai_urgency: string;
  ai_summary: string;
};

const STATUS_THEMES: Record<string, { bg: string; text: string; icon: string }> = {
  pending: { bg: '#FFF7ED', text: '#EA580C', icon: 'time-outline' },
  under_review: { bg: '#EFF6FF', text: '#2563EB', icon: 'sync-outline' },
  resolved: { bg: '#ECFDF5', text: '#059669', icon: 'checkmark-circle-outline' },
  dismissed: { bg: '#F9FAFB', text: '#6B7280', icon: 'close-circle-outline' },
};

const URGENCY_COLORS: Record<string, string> = {
  low: '#059669',
  medium: '#D97706',
  high: '#DC2626',
};

export default function ComplaintDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiTimedOut, setAiTimedOut] = useState(false);

  async function fetchComplaintDetails() {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setComplaint(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchComplaintDetails();
  }, [id]);

  useEffect(() => {
    if (!complaint || aiAnalysis) return;

    let attempts = 0;
    const maxAttempts = 4;

    const checkAIAnalysis = async () => {
      attempts++;
      console.log(`Polling DB for AI Analysis... Entry ${attempts}/${maxAttempts}`);

      const { data, error } = await supabase
        .from('ai_analysis')
        .select('*')
        .eq('complaint_id', id)
        .maybeSingle();

      if (!error && data) {
        setAiAnalysis(data);
        clearInterval(interval);
      } else if (attempts >= maxAttempts) {
        console.warn('⚠️ AI analysis polling window timed out.');
        setAiTimedOut(true);
        clearInterval(interval);
      }
    };

    checkAIAnalysis();

    const interval = setInterval(() => {
      checkAIAnalysis();
    }, 3000);

    return () => clearInterval(interval);
  }, [complaint, aiAnalysis, id]);

  function handleDelete() {
    const executeDelete = async () => {
      setLoading(true);

      try {
        await supabase.from('ai_analysis').delete().eq('complaint_id', id);

        const { error } = await supabase.from('complaints').delete().eq('id', id);
        if (error) throw error;

        if (Platform.OS === 'web') {
          window.alert('Blotter record removed successfully.');
          router.replace('/(tabs)/complaints');
        } else {
          Alert.alert('Success', 'Blotter record removed.', [
            {
              text: 'OK',
              onPress: () => {
                setTimeout(() => {
                  router.replace('/(tabs)/complaints');
                }, 100);
              },
            },
          ], { cancelable: false });
        }
      } catch (error: any) {
        if (Platform.OS === 'web') {
          window.alert(`Database Error: ${error.message}`);
        } else {
          Alert.alert('Database Error', error.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Void Blotter Record:\n\nAre you sure you want to delete this incident file permanently?'
      );
      if (confirmed) executeDelete();
    } else {
      Alert.alert(
        'Void Blotter Record',
        'Are you sure you want to delete this incident file permanently?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Void File', style: 'destructive', onPress: executeDelete },
        ]
      );
    }
  }

  async function handlePrintPDF() {
    if (!complaint) return;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 30px; color: #333; line-height: 1.5; }
        .header { display: flex; justify-content: space-between; border-bottom: 3px solid #0D9488; padding-bottom: 15px; margin-bottom: 30px; }
        .app-name { font-size: 24px; font-weight: 800; color: #0D9488; text-transform: uppercase; }
        .doc-type { font-size: 14px; color: #64748B; margin-top: 4px; font-weight: 600; }
        .reference { text-align: right; font-size: 12px; color: #475569; }
        .section { margin-bottom: 25px; }
        h2 { font-size: 14px; text-transform: uppercase; color: #0D9488; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 15px; letter-spacing: 0.5px; }
        .field { margin-bottom: 15px; }
        .label { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: 700; margin-bottom: 4px; }
        .value { font-size: 14px; color: #0F172A; font-weight: 500; }
        .narrative { background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px; border-radius: 6px; min-height: 80px; font-size: 13px; }
        .ai-box { background-color: #ECFDF5; border: 1px solid #A7F3D0; padding: 15px; border-radius: 6px; }
        .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="app-name">BarangayConnect Portal</div>
          <div class="doc-type">Official Public Incident & Blotter Receipt</div>
        </div>
        <div class="reference">
          <strong>REF ID: #${complaint.id.slice(0, 8).toUpperCase()}</strong><br/>
          Date: ${new Date(complaint.created_at).toLocaleDateString('en-PH')}
        </div>
      </div>

      <div class="section">
        <h2>Administrative Metadata</h2>
        <div class="field">
          <div class="label">Incident Category</div>
          <div class="value">${complaint.category}</div>
        </div>
        <div class="field">
          <div class="label">Operational Status</div>
          <div class="value">${complaint.status.replace('_', ' ').toUpperCase()}</div>
        </div>
      </div>

      <div class="section">
        <h2>Statement Narrative</h2>
        <div class="field">
          <div class="label">Blotter Title</div>
          <div class="value" style="font-size: 16px; font-weight: 700; color: #1E293B; margin-bottom: 8px;">${complaint.title}</div>
        </div>
        <div class="field">
          <div class="label">Detailed Content Log</div>
          <div class="narrative">${complaint.description}</div>
        </div>
      </div>

      ${aiAnalysis ? `
      <div class="section">
        <h2>AI Decision Optimization Log</h2>
        <div class="ai-box">
          <div class="field">
            <div class="label" style="color: #059669;">Automated Structural Summary</div>
            <div class="value" style="color: #0D9488; font-style: italic;">"${aiAnalysis.ai_summary}"</div>
          </div>
        </div>
      </div>
      ` : ''}

      <div class="footer">
        This document is an authenticated transmission snapshot from the BarangayConnect cloud relational system database.
      </div>
    </body>
    </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (err) {
      Alert.alert('Print Error', 'Could not compile layout document container.');
    }
  }

  if (loading || !complaint) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const activeTheme = STATUS_THEMES[complaint.status] || { bg: '#F9FAFB', text: '#6B7280', icon: 'help-circle-outline' };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: activeTheme.bg }]}>
        <View style={styles.bannerLeft}>
          <Ionicons name={activeTheme.icon as any} size={18} color={activeTheme.text} />
          <Text style={styles.bannerLabel}>Current Status</Text>
        </View>
        <Text style={[styles.bannerValue, { color: activeTheme.text }]}>
          {complaint.status.replace('_', ' ').toUpperCase()}
        </Text>
      </View>

      {/* Main Content Card */}
      <View style={styles.contentCard}>
        <Text style={styles.refId}>REF #{complaint.id.slice(0, 8).toUpperCase()}</Text>
        <Text style={styles.titleText}>{complaint.title}</Text>

        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Ionicons name="folder-outline" size={13} color={colors.muted} />
            <Text style={styles.tagText}>{complaint.category}</Text>
          </View>
          <View style={[styles.tag, styles.urgencyTag]}>
            <View style={[styles.urgencyDot, { backgroundColor: URGENCY_COLORS[complaint.urgency] || '#6B7280' }]} />
            <Text style={[styles.tagText, { color: URGENCY_COLORS[complaint.urgency] || '#6B7280' }]}>
              {complaint.urgency.toUpperCase()} PRIORITY
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Statement Narrative</Text>
        <View style={styles.descriptionBox}>
          <Text style={styles.bodyText}>{complaint.description}</Text>
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
          <Text style={styles.dateText}>
            Filed {new Date(complaint.created_at).toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' })}
          </Text>
        </View>
      </View>

      {/* AI Analysis Section */}
      <Text style={styles.sectionHeading}>AI Semantic Analysis</Text>

      {aiAnalysis ? (
        <View style={styles.aiCard}>
          <View style={styles.aiHeader}>
            <View style={styles.aiHeaderLeft}>
              <Ionicons name="sparkles" size={16} color={colors.accent} />
              <Text style={styles.aiHeaderTitle}>Automated Triage Report</Text>
            </View>
            <View style={styles.aiBadge}>
              <Ionicons name="checkmark" size={10} color="#fff" />
              <Text style={styles.aiBadgeText}>VERIFIED</Text>
            </View>
          </View>
          <View style={styles.aiMetaRow}>
            <View style={styles.aiMetaItem}>
              <Text style={styles.aiMetaLabel}>Category</Text>
              <Text style={styles.aiMetaValue}>{aiAnalysis.ai_category}</Text>
            </View>
            <View style={styles.aiMetaDivider} />
            <View style={styles.aiMetaItem}>
              <Text style={styles.aiMetaLabel}>Risk Profile</Text>
              <Text style={styles.aiMetaValue}>{aiAnalysis.ai_urgency.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.aiDivider} />
          <Text style={styles.aiSummaryLabel}>Operational Summary</Text>
          <Text style={styles.aiSummaryText}>"{aiAnalysis.ai_summary}"</Text>
        </View>
      ) : aiTimedOut ? (
        <View style={styles.aiFallbackBox}>
          <Ionicons name="hourglass-outline" size={20} color={colors.muted} />
          <Text style={styles.aiFallbackText}>
            Triage parameters pending. Classification will be verified upon review.
          </Text>
        </View>
      ) : (
        <View style={styles.aiLoadingBox}>
          <ActivityIndicator size="small" color={colors.accent} style={{ marginBottom: 8 }} />
          <Text style={styles.aiLoadingText}>Analyzing record attributes...</Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionContainer}>
        <Pressable style={styles.printBtn} onPress={handlePrintPDF}>
          <Ionicons name="document-text" size={18} color="#fff" />
          <Text style={styles.printBtnText}>Generate Blotter PDF</Text>
        </Pressable>

        <View style={styles.doubleRow}>
          <Pressable
            style={styles.editBtn}
            onPress={() => router.push(`/edit-complaint/${complaint.id}`)}
          >
            <Ionicons name="create-outline" size={16} color={colors.fg} />
            <Text style={styles.editBtnText}>Edit</Text>
          </Pressable>

          <Pressable style={styles.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={16} color="#DC2626" />
            <Text style={styles.deleteBtnText}>Void</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },

  // Status Banner
  statusBanner: {
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xxl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bannerLabel: { fontSize: 12, fontWeight: '600', color: colors.muted },
  bannerValue: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  // Content Card
  contentCard: {
    backgroundColor: colors.card,
    padding: spacing.xxl,
    marginHorizontal: spacing.xxl,
    marginTop: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  refId: { fontSize: 10, color: '#94A3B8', fontWeight: '700', letterSpacing: 0.8, marginBottom: spacing.sm },
  titleText: { fontSize: 20, fontWeight: '800', color: colors.fg, lineHeight: 26, letterSpacing: -0.3 },
  tagRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.xl },
  tag: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#F1F5F9', paddingHorizontal: spacing.md, paddingVertical: 6,
    borderRadius: radius.sm,
  },
  urgencyTag: { backgroundColor: '#FEF2F2' },
  urgencyDot: { width: 7, height: 7, borderRadius: 4 },
  tagText: { fontSize: 11, fontWeight: '600', color: colors.muted },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm,
  },
  descriptionBox: {
    backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.lg,
  },
  bodyText: { fontSize: 14, color: '#334155', lineHeight: 21 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacing.lg },
  dateText: { fontSize: 12, color: '#94A3B8' },

  // AI Section
  sectionHeading: {
    fontSize: 12, fontWeight: '700', color: colors.fg,
    paddingHorizontal: spacing.xxl, marginTop: spacing.xxl, marginBottom: spacing.md,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  aiLoadingBox: {
    backgroundColor: colors.card, marginHorizontal: spacing.xxl, padding: spacing.xxl,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center',
  },
  aiLoadingText: { fontSize: 12, color: colors.muted, fontWeight: '500' },

  aiCard: {
    backgroundColor: colors.accentLight, marginHorizontal: spacing.xxl,
    padding: spacing.lg, borderRadius: radius.lg,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  aiHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiHeaderTitle: { fontSize: 14, fontWeight: '700', color: colors.accentDark },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.accent, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.sm,
  },
  aiBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },

  aiMetaRow: { flexDirection: 'row', alignItems: 'center' },
  aiMetaItem: { flex: 1 },
  aiMetaLabel: { fontSize: 10, color: colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  aiMetaValue: { fontSize: 14, fontWeight: '700', color: colors.accentDark, marginTop: 2 },
  aiMetaDivider: { width: 1, height: 30, backgroundColor: '#A7F3D0', marginHorizontal: spacing.md },

  aiDivider: { height: 1, backgroundColor: '#A7F3D0', marginVertical: spacing.md },
  aiSummaryLabel: { fontSize: 11, fontWeight: '700', color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: spacing.sm },
  aiSummaryText: { fontSize: 14, color: colors.accentDark, fontStyle: 'italic', lineHeight: 20 },

  aiFallbackBox: {
    backgroundColor: colors.card, marginHorizontal: spacing.xxl, padding: spacing.lg,
    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border,
    borderStyle: 'dashed', alignItems: 'center', gap: spacing.sm,
  },
  aiFallbackText: { fontSize: 13, color: colors.muted, lineHeight: 18, fontWeight: '500', textAlign: 'center' },

  // Actions
  actionContainer: { paddingHorizontal: spacing.xxl, marginTop: spacing.xxl, gap: spacing.sm },
  printBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.accent, padding: spacing.lg,
    borderRadius: radius.md, ...shadows.accent,
  },
  printBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  doubleRow: { flexDirection: 'row', gap: spacing.sm },
  editBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, borderRadius: radius.md,
  },
  editBtnText: { color: colors.fg, fontWeight: '600', fontSize: 14 },
  deleteBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA',
    padding: spacing.md, borderRadius: radius.md,
  },
  deleteBtnText: { color: '#DC2626', fontWeight: '600', fontSize: 14 },
});