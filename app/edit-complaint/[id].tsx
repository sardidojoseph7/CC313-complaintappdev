import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native'
import { supabase } from '../../lib/supabase'

const CATEGORIES = ['General', 'Facilities', 'Staff', 'Services', 'Safety', 'Other']
const URGENCY_LEVELS = ['low', 'medium', 'high']

const URGENCY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: '#F0FDF4', text: '#16A34A', border: '#86EFAC' },
  medium: { bg: '#FFFBEB', text: '#D97706', border: '#FCD34D' },
  high: { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' },
}

export default function EditComplaintScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [urgency, setUrgency] = useState('low')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => { fetchComplaint() }, [id])

  async function fetchComplaint() {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      Alert.alert('Error', 'Complaint not found.')
      router.back()
      return
    }

    setTitle(data.title)
    setDescription(data.description)
    setCategory(data.category)
    setUrgency(data.urgency)
    setLoading(false)
  }

  async function handleUpdate() {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title.')
      return
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description.')
      return
    }

    setSaving(true)

    const { error } = await supabase
      .from('complaints')
      .update({
        title: title.trim(),
        description: description.trim(),
        category,
        urgency,
      })
      .eq('id', id)

    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Success!', 'Complaint updated.', [
        { text: 'OK', onPress: () => router.back() }
      ])
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>Edit Complaint</Text>
        <Text style={styles.pageSubtitle}>Make changes and save.</Text>

        <Text style={styles.label}>Title <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={styles.input}
          placeholder="Brief title"
          placeholderTextColor="#bbb"
          value={title}
          onChangeText={setTitle}
          maxLength={100}
        />
        <Text style={styles.charCount}>{title.length}/100</Text>

        <Text style={styles.label}>Description <Text style={styles.required}>*</Text></Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your complaint..."
          placeholderTextColor="#bbb"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          maxLength={1000}
        />
        <Text style={styles.charCount}>{description.length}/1000</Text>

        <Text style={styles.label}>Category</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, category === cat && styles.chipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Urgency</Text>
        <View style={styles.urgencyRow}>
          {URGENCY_LEVELS.map(level => {
            const colors = URGENCY_COLORS[level]
            const isActive = urgency === level
            return (
              <TouchableOpacity
                key={level}
                style={[
                  styles.urgencyBtn,
                  {
                    backgroundColor: isActive ? colors.bg : '#F8FAFC',
                    borderColor: isActive ? colors.border : '#E2E8F0',
                  }
                ]}
                onPress={() => setUrgency(level)}
              >
                <Text style={[
                  styles.urgencyText,
                  { color: isActive ? colors.text : '#94A3B8' }
                ]}>
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleUpdate}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Save Changes</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },

  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginTop: 8, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 24 },

  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 16 },
  required: { color: '#DC2626' },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#111',
  },
  textArea: { height: 120, paddingTop: 14 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#F1F5F9',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' },
  chipText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  chipTextActive: { color: '#3B82F6', fontWeight: '600' },

  urgencyRow: { flexDirection: 'row', gap: 10 },
  urgencyBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1.5, alignItems: 'center',
  },
  urgencyText: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },

  saveBtn: {
    backgroundColor: '#3B82F6', padding: 16,
    borderRadius: 12, alignItems: 'center',
    marginTop: 28, height: 54, justifyContent: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#93C5FD' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  cancelBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: '#94A3B8', fontWeight: '500', fontSize: 15 },
})