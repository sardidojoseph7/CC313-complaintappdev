import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { colors, radius, shadows, spacing } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { analyzeComplaint } from '../../services/ai';

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

export default function EditComplaintScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [urgency, setUrgency] = useState('low');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchComplaint();
  }, [id]);

  async function fetchComplaint() {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      Alert.alert('Error', 'Blotter record not located.');
      router.back();
      return;
    }

    setTitle(data.title);
    setDescription(data.description);
    setCategory(data.category);
    setUrgency(data.urgency);
    setLoading(false);
  }

  async function handleUpdate() {
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Please enter a formal title.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a detailed statement narrative.');
      return;
    }

    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from('complaints')
        .update({
          title: title.trim(),
          description: description.trim(),
          category,
          urgency,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      runGeminiAnalysis(id, title.trim(), description.trim());

      if (Platform.OS === 'web') {
        window.alert('Blotter modifications saved successfully!');
        router.replace('/(tabs)/complaints');
      } else {
        Alert.alert('Record Updated', 'Blotter modifications saved successfully.', [
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
      Alert.alert('Database Error', error.message || 'Update failed.');
      setSaving(false);
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.pageTitle}>Modify Blotter Record</Text>
        <Text style={styles.pageSubtitle}>Update statement values or log modifications below.</Text>

        <Text style={styles.label}>Blotter Title <Text style={styles.required}>*</Text></Text>
        <View style={[styles.inputWrap, titleFocused && styles.inputWrapFocused]}>
          <TextInput
            style={styles.input}
            placeholder="Brief title"
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
            placeholder="Describe your complaint..."
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

        <Text style={styles.label}>Risk Assessment Profile</Text>
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
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.saveBtnContent}>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xxl },

  pageTitle: { fontSize: 22, fontWeight: '800', color: colors.fg, marginTop: spacing.sm, marginBottom: 4, letterSpacing: -0.3 },
  pageSubtitle: { fontSize: 13, color: colors.muted, marginBottom: spacing.xxl, lineHeight: 18 },

  label: { fontSize: 12, fontWeight: '700', color: colors.fg, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm, marginTop: spacing.lg },
  required: { color: colors.error },
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

  saveBtn: {
    backgroundColor: colors.accent, padding: spacing.lg,
    borderRadius: radius.md, marginTop: spacing.xxl,
    height: 54, justifyContent: 'center', ...shadows.accent,
  },
  saveBtnDisabled: { backgroundColor: '#5EEAD4', shadowOpacity: 0, elevation: 0 },
  saveBtnContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  cancelBtn: { padding: spacing.md, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.sm },
  cancelBtnText: { color: colors.muted, fontWeight: '600', fontSize: 14 },
});