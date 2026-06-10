import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['General', 'Facilities', 'Staff', 'Services', 'Safety', 'Other']
const URGENCY_LEVELS = ['low', 'medium', 'high']

const URGENCY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: '#F0FDF4', text: '#16A34A', border: '#86EFAC' },
  medium: { bg: '#FFFBEB', text: '#D97706', border: '#FCD34D' },
  high: { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' },
}

export default function NewComplaintScreen() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('General')
  const [urgency, setUrgency] = useState('low')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit() {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title.')
      return
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description.')
      return
    }

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      Alert.alert('Error', 'Not logged in.')
      setLoading(false)
      return
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
      .single()

    if (error) {
      Alert.alert('Error', error.message)
      setLoading(false)
      return
    }

    // Trigger AI in background
    analyzeWithAI(complaint.id, title, description)

    Alert.alert('Success!', 'Complaint submitted.', [
      { text: 'OK', onPress: () => router.back() }
    ])

    setLoading(false)
  }

  async function analyzeWithAI(complaintId: string, titleText: string, descriptionText: string) {
    try {
      const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY
      if (!apiKey) {
        console.warn('Missing OpenAI API key')
        return
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a complaint analyzer. Respond ONLY with valid JSON.'
            },
            {
              role: 'user',
              content: `Analyze this complaint and respond ONLY with this JSON format:
{
  "category": "one of: General, Facilities, Staff, Services, Safety, Other",
  "urgency": "one of: low, medium, high",
  "summary": "1-2 sentence summary"
}

Title: ${titleText}
Description: ${descriptionText}`
            }
          ],
          temperature: 0.3,
          max_tokens: 500
        })
      })

      const data = await response.json()
      const result = JSON.parse(data.choices[0].message.content)

      await supabase.from('ai_analysis').insert({
        complaint_id: complaintId,
        ai_category: result.category,
        ai_urgency: result.urgency,
        ai_summary: result.summary,
      })

      await supabase
        .from('complaints')
        .update({ category: result.category, urgency: result.urgency })
        .eq('id', complaintId)
    } catch (err) {
      console.log('AI analysis failed silently:', err)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageTitle}>Submit a Complaint</Text>
        <Text style={styles.pageSubtitle}>AI will auto-categorize and analyze it.</Text>

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
        <Text style={styles.aiNote}>🤖 AI will auto-update this</Text>
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
        <Text style={styles.aiNote}>🤖 AI will auto-update this</Text>
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
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>Submit Complaint</Text>
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
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },

  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginTop: 8, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#888', marginBottom: 24 },

  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6, marginTop: 16 },
  required: { color: '#DC2626' },
  aiNote: { fontSize: 12, color: '#3B82F6', marginBottom: 8, marginTop: -4 },
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

  submitBtn: {
    backgroundColor: '#3B82F6', padding: 16,
    borderRadius: 12, alignItems: 'center',
    marginTop: 28, height: 54, justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: '#93C5FD' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  cancelBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  cancelBtnText: { color: '#94A3B8', fontWeight: '500', fontSize: 15 },
})