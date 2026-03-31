'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, FlatList, Pressable,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useParams } from 'next/navigation';
import {
  API_ROUTES, LEAD_STAGES, STAGE_LABELS, STAGE_COLORS,
  CALL_STATUSES, CALL_STATUS_LABELS,
} from '@/lib/constants';
import type { Lead, LeadStage } from '@/types/lead.types';
import type { CallLog, CallStatus } from '@/types/call.types';

export default function CallerLeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCallForm, setShowCallForm] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('answered');
  const [callNotes, setCallNotes] = useState('');
  const [callbackDate, setCallbackDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const getToken = () => localStorage.getItem('token') || '';

  const fetchLead = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLead(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load lead');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  const fetchCalls = useCallback(async () => {
    try {
      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}/calls`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (res.ok) setCalls(json.data);
    } catch { /* non-critical */ }
  }, [leadId]);

  useEffect(() => { fetchLead(); fetchCalls(); }, [fetchLead, fetchCalls]);

  const handleLogCall = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const body: Record<string, unknown> = { status: callStatus };
      if (callNotes.trim()) body.notes = callNotes.trim();
      if (callbackDate) body.callback_date = new Date(callbackDate).toISOString();

      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess('Call logged successfully');
      setShowCallForm(false);
      setCallStatus('answered');
      setCallNotes('');
      setCallbackDate('');
      fetchCalls();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log call');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookDemo = async () => {
    try {
      setError('');
      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ stage: 'demo_booked' as LeadStage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLead(json.data);
      setSuccess('Demo booked!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to book demo');
    }
  };

  if (loading) return <ActivityIndicator color="#22c55e" size="large" style={{ marginTop: 48 }} />;
  if (!lead) return <Text style={styles.errorText}>Lead not found</Text>;

  const canBookDemo = ['uncontacted', 'contacted', 'interested'].includes(lead.stage);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>{lead.school_name}</Text>
        <Text style={styles.meta}>
          {[lead.city, lead.state].filter(Boolean).join(', ') || 'No location'}
          {lead.board ? ` • ${lead.board}` : ''}
        </Text>

        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
        {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Numbers</Text>
          {lead.principal_phone ? (
            <Pressable style={styles.phoneChip}>
              <Text style={styles.phoneLabel}>📞 Principal</Text>
              <Text style={styles.phoneNumber}>{lead.principal_phone}</Text>
            </Pressable>
          ) : null}
          {lead.chairman_phone ? (
            <Pressable style={styles.phoneChip}>
              <Text style={styles.phoneLabel}>📞 Chairman</Text>
              <Text style={styles.phoneNumber}>{lead.chairman_phone}</Text>
            </Pressable>
          ) : null}
          {!lead.principal_phone && !lead.chairman_phone ? (
            <Text style={styles.emptyText}>No contact numbers available</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stage</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {LEAD_STAGES.map((s) => (
              <View
                key={s}
                style={[styles.stageChip, lead.stage === s && { backgroundColor: STAGE_COLORS[s] + '30' }]}
              >
                <Text style={[styles.stageChipText, { color: lead.stage === s ? STAGE_COLORS[s] : '#64748b' }]}>
                  {STAGE_LABELS[s]}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {canBookDemo && (
          <TouchableOpacity style={styles.bookDemoBtn} onPress={handleBookDemo}>
            <Text style={styles.bookDemoBtnText}>📅 Book Demo</Text>
          </TouchableOpacity>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Call History ({calls.length})</Text>
          {calls.length === 0 ? (
            <Text style={styles.emptyText}>No calls logged yet — start calling!</Text>
          ) : (
            <FlatList
              data={calls}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.callCard}>
                  <View style={styles.callHeader}>
                    <Text style={styles.callStatusText}>{item.status.replace('_', ' ')}</Text>
                    <Text style={styles.callDate}>{new Date(item.called_at).toLocaleDateString()}</Text>
                  </View>
                  {item.notes ? <Text style={styles.callNotes}>{item.notes}</Text> : null}
                  {item.callback_date ? (
                    <Text style={styles.callbackText}>
                      🔔 Callback: {new Date(item.callback_date).toLocaleDateString()}
                    </Text>
                  ) : null}
                </View>
              )}
            />
          )}
        </View>
      </ScrollView>

      {showCallForm && (
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Log Call</Text>

          <Text style={styles.sheetLabel}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusRow}>
            {CALL_STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusChip, callStatus === s && styles.statusChipActive]}
                onPress={() => setCallStatus(s)}
              >
                <Text style={[styles.statusChipText, callStatus === s && styles.statusChipTextActive]}>
                  {CALL_STATUS_LABELS[s]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.sheetLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Call notes..."
            placeholderTextColor="#64748b"
            value={callNotes}
            onChangeText={setCallNotes}
            multiline
            numberOfLines={3}
          />

          <Text style={styles.sheetLabel}>Callback Date (optional)</Text>
          <TextInput
            style={styles.sheetInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#64748b"
            value={callbackDate}
            onChangeText={setCallbackDate}
          />

          <View style={styles.sheetActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCallForm(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitCallBtn, submitting && styles.submitCallBtnDisabled]}
              onPress={handleLogCall}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitCallBtnText}>Log Call</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!showCallForm && (
        <TouchableOpacity style={styles.fab} onPress={() => setShowCallForm(true)}>
          <Text style={styles.fabText}>📞 Log Call</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  meta: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 14 },
  successBox: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: 12, marginBottom: 12 },
  successText: { color: '#22c55e', fontSize: 14 },
  section: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc', marginBottom: 12 },
  phoneChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a',
    borderRadius: 12, padding: 16, marginBottom: 8, minHeight: 56, gap: 12,
  },
  phoneLabel: { fontSize: 14, color: '#94a3b8', fontWeight: '500' },
  phoneNumber: { fontSize: 18, color: '#22c55e', fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingVertical: 12 },
  stageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#0f172a', marginRight: 6 },
  stageChipText: { fontSize: 12, fontWeight: '600' },
  bookDemoBtn: {
    backgroundColor: '#f59e0b', borderRadius: 10, padding: 14,
    alignItems: 'center', marginBottom: 12, minHeight: 48,
  },
  bookDemoBtnText: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  callCard: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 8 },
  callHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  callStatusText: { fontSize: 14, color: '#22c55e', fontWeight: '600', textTransform: 'capitalize' },
  callDate: { fontSize: 12, color: '#64748b' },
  callNotes: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  callbackText: { fontSize: 12, color: '#f59e0b', marginTop: 4 },
  bottomSheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 10,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#475569',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 16 },
  sheetLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 8, marginTop: 8 },
  statusRow: { flexDirection: 'row', marginBottom: 4 },
  statusChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#0f172a', marginRight: 6 },
  statusChipActive: { backgroundColor: '#16a34a' },
  statusChipText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  statusChipTextActive: { color: '#ffffff' },
  notesInput: {
    minHeight: 80, borderWidth: 1, borderColor: '#334155', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#f8fafc',
    backgroundColor: '#0f172a', textAlignVertical: 'top',
  },
  sheetInput: {
    height: 48, borderWidth: 1, borderColor: '#334155', borderRadius: 10,
    paddingHorizontal: 16, fontSize: 14, color: '#f8fafc', backgroundColor: '#0f172a',
  },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#334155', alignItems: 'center', minHeight: 48 },
  cancelBtnText: { color: '#cbd5e1', fontWeight: '600', fontSize: 15 },
  submitCallBtn: { flex: 2, padding: 14, borderRadius: 10, backgroundColor: '#16a34a', alignItems: 'center', minHeight: 48 },
  submitCallBtnDisabled: { opacity: 0.6 },
  submitCallBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    backgroundColor: '#16a34a', borderRadius: 14, padding: 16,
    alignItems: 'center', minHeight: 52,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
