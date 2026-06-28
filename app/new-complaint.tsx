import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, shadows, spacing } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { analyzeComplaint } from '../services/ai';

const CATEGORIES = [
  'Peace & Order',
  'Infrastructure',
  'Health & Sanitation',
  'Disaster Response',
  'Social Services',
  'Other',
];
const URGENCY_LEVELS = ['low', 'medium', 'high'];

const URGENCY_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  low: { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', dot: '#059669' },
  medium: { bg: '#FFFBEB', text: '#D97706', border: '#FCD34D', dot: '#D97706' },
  high: { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5', dot: '#DC2626' },
};

export default function NewComplaintScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [urgency, setUrgency] = useState('low');
  const [loading, setLoading] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a formal blotter title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a detailed statement narrative.');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Session Error', 'User not found. Please log in again.');
        setLoading(false);
        return;
      }

      const { data: complaint, error } = await supabase
        .from('complaints')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          urgency,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      runGeminiAnalysis(complaint.id, title.trim(), description.trim());

      if (Platform.OS === 'web') {
        window.alert('Blotter filed successfully!');
        router.replace('/(tabs)/complaints');
      } else {
        Alert.alert('Blotter Filed', 'Incident record has been cataloged.', [
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
      Alert.alert('Database Error', error.message || 'Failed to save complaint.');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }

  async function runGeminiAnalysis(complaintId: string, titleText: string, descriptionText: string) {
    try {
      const result = await analyzeComplaint(titleText, descriptionText);

      const { error: upsertError } = await supabase
        .from('ai_analysis')
        .upsert(
          {
            complaint_id: complaintId,
            ai_category: result.category,
            ai_urgency: result.priority.toLowerCase(),
            ai_summary: result.summary,
          },
          { onConflict: 'complaint_id' }
        );

      if (upsertError) {
        console.error('Upsert error:', upsertError);
        return;
      }

      await supabase
        .from('complaints')
        .update({
          category: result.category,
          urgency: result.priority.toLowerCase(),
        })
        .eq('id', complaintId);

      console.log(`✅ AI analysis complete for complaint ${complaintId}`);
    } catch (err) {
      console.error('Background Gemini analysis error (ignored):', err);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>File Blotter Record</Text>
        <Text style={styles.pageSubtitle}>
          Ensure all logged details are objective and accurate. AI will auto-categorize and analyze the entry.
        </Text>

        <Text style={styles.label}>Blotter Title <Text style={styles.required}>*</Text></Text>
        <View style={[styles.inputWrap, titleFocused && styles.inputWrapFocused]}>
          <TextInput
            style={styles.input}
            placeholder="e.g., Public Disturbance past 10PM (Purok 3)"
            placeholderTextColor="#B0BEC5"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            onFocus={() => setTitleFocused(true)}
            onBlur={() => setTitleFocused(false)}
          />
        </View>
        <Text style={styles.charCount}>{title.length}/100</Text>

        <Text style={styles.label}>Statement Narrative <Text style={styles.required}>*</Text></Text>
        <View style={[styles.inputWrap, styles.textAreaWrap, descFocused && styles.inputWrapFocused]}>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Provide a detailed, step-by-step log of the incident..."
            placeholderTextColor="#B0BEC5"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
            onFocus={() => setDescFocused(true)}
            onBlur={() => setDescFocused(false)}
          />
        </View>
        <Text style={styles.charCount}>{description.length}/1000</Text>

        <Text style={styles.label}>Administrative Category</Text>
        <View style={styles.aiNoteRow}>
          <Ionicons name="sparkles" size={12} color={colors.accent} />
          <Text style={styles.aiNote}>AI will auto-update this based on analysis</Text>
        </View>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Initial Risk Assessment</Text>
        <View style={styles.aiNoteRow}>
          <Ionicons name="sparkles" size={12} color={colors.accent} />
          <Text style={styles.aiNote}>AI will auto-update this based on analysis</Text>
        </View>
        <View style={styles.urgencyRow}>
          {URGENCY_LEVELS.map((level) => {
            const style = URGENCY_STYLES[level];
            const isActive = urgency === level;
            return (
              <Pressable
                key={level}
                style={[
                  styles.urgencyBtn,
                  {
                    backgroundColor: isActive ? style.bg : colors.card,
                    borderColor: isActive ? style.border : colors.border,
                  },
                ]}
                onPress={() => setUrgency(level)}
              >
                <View style={[styles.urgencyDot, { backgroundColor: isActive ? style.dot : '#CBD5E1' }]} />
                <Text style={[styles.urgencyText, { color: isActive ? style.text : '#94A3B8' }]}>
                  {level.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.submitBtnContent}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Submit Blotter Entry</Text>
            </View>
          )}
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xxl },

  pageTitle: { fontSize: 22, fontWeight: '800', color: colors.fg, marginTop: spacing.sm, marginBottom: 4, letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 13, color: colors.muted, marginBottom: spacing.xxl, lineHeight: 18 },

  label: { fontSize: 12, fontWeight: '700', color: colors.fg, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.lg },
  required: { color: colors.error },
  aiNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm, marginTop: -2 },
  aiNote: { fontSize: 11, color: colors.accent, fontWeight: '500' },
  charCount: { fontSize: 11, color: '#94A3B8', textAlign: 'right', marginTop: 4 },

  inputWrap: {
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, ...shadows.sm,
  },
  inputWrapFocused: { borderColor: colors.accent },
  input: { padding: spacing.md, fontSize: 15, color: colors.fg },
  textAreaWrap: {},
  textArea: { height: 120, paddingTop: spacing.md, textAlignVertical: 'top' as any },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radius.full, backgroundColor: '#F1F5F9',
    borderWidth: 1, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accentLight, borderColor: colors.accent },
  chipText: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  chipTextActive: { color: colors.accent, fontWeight: '700' },

  urgencyRow: { flexDirection: 'row', gap: spacing.sm },
  urgencyBtn: {
    flex: 1, paddingVertical: spacing.md, borderRadius: radius.md,
    borderWidth: 1.5, alignItems: 'center', gap: 6,
  },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
  urgencyText: { fontSize: 13, fontWeight: '700' },

  submitBtn: {
    backgroundColor: colors.accent, padding: spacing.lg,
    borderRadius: radius.md, marginTop: spacing.xxl,
    height: 54, justifyContent: 'center', ...shadows.accent,
  },
  submitBtnDisabled: { backgroundColor: '#5EEAD4', shadowOpacity: 0, elevation: 0 },
  submitBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  cancelBtn: { padding: spacing.md, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.sm },
  cancelBtnText: { color: colors.muted, fontWeight: '600', fontSize: 14 },
});