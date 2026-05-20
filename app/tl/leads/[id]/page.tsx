'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput
} from 'react-native';
import { useParams } from 'next/navigation';
import { API_ROUTES, LEAD_STAGES, STAGE_LABELS, STAGE_COLORS, CALL_STATUSES, CALL_STATUS_LABELS } from '@/lib/constants';
import EditLeadModal from '@/app/components/EditLeadModal';
import type { Lead, LeadStage } from '@/types/lead.types';
import type { CallLog } from '@/types/call.types';
import type { User } from '@/types/user.types';

export default function TLLeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [callers, setCallers] = useState<User[]>([]);
  const [selectedCl, setSelectedCl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [callStatus, setCallStatus] = useState('answered');
  const [callNotes, setCallNotes] = useState('');
  const [loggingCall, setLoggingCall] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);

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
      setSelectedCl(json.data.assigned_cl_id || '');
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

  const fetchCallers = useCallback(async () => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) return;
      const user = JSON.parse(stored);
      const res = await fetch(API_ROUTES.USERS, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (res.ok) {
        const allUsers = json.data as User[];
        setCallers(allUsers.filter((u: User) => u.role === 'caller' && u.team_lead_id === user.id && u.is_active));
      }
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchLead(); fetchCalls(); fetchCallers(); }, [fetchLead, fetchCalls, fetchCallers]);

  const handleAssign = async () => {
    if (!lead) return;
    try {
      setAssigning(true);
      setError('');
      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          assigned_tl_id: lead.assigned_tl_id,
          assigned_cl_id: selectedCl || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLead(json.data);
      setNotice('Sales Executive assignment updated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assignment failed');
    } finally {
      setAssigning(false);
    }
  };

  const handleStageChange = async (stage: LeadStage) => {
    try {
      setError('');
      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ stage }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLead(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stage update failed');
    }
  };

  const handleLogCall = async () => {
    try {
      setLoggingCall(true);
      setError('');
      setNotice('');
      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}/calls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: callStatus, notes: callNotes.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setNotice('Call logged successfully');
      setShowCallForm(false);
      setCallNotes('');
      fetchCalls();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log call');
    } finally {
      setLoggingCall(false);
    }
  };

  if (loading) return <ActivityIndicator color="#a78bfa" size="large" style={{ marginTop: 48 }} />;
  if (!lead) return <Text style={styles.errorText}>Lead not found</Text>;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{lead.school_name}</Text>
          <Text style={styles.meta}>
            {[lead.city, lead.state].filter(Boolean).join(', ') || 'No location'}
          </Text>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => setShowEditModal(true)}>
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
      {notice ? <View style={styles.noticeBox}><Text style={styles.noticeText}>{notice}</Text></View> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact</Text>
        {lead.principal_phone ? (
          <View style={styles.phoneChip}>
            <Text style={styles.phoneLabel}>Principal</Text>
            <Text style={styles.phoneNumber}>{lead.principal_phone}</Text>
          </View>
        ) : null}
        {lead.chairman_phone ? (
          <View style={styles.phoneChip}>
            <Text style={styles.phoneLabel}>Chairman</Text>
            <Text style={styles.phoneNumber}>{lead.chairman_phone}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stage</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {LEAD_STAGES.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => handleStageChange(s)}
              style={[styles.stageChip, lead.stage === s && { backgroundColor: STAGE_COLORS[s] + '30' }]}
            >
              <Text style={[styles.stageChipText, { color: lead.stage === s ? STAGE_COLORS[s] : '#94a3b8' }]}>
                {STAGE_LABELS[s]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Assign Sales Executive</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.callerRow}>
          <TouchableOpacity
            style={[styles.callerChip, !selectedCl && styles.callerChipActive]}
            onPress={() => setSelectedCl('')}
          >
            <Text style={[styles.callerChipText, !selectedCl && styles.callerChipTextActive]}>None</Text>
          </TouchableOpacity>
          {callers.map((cl) => (
            <TouchableOpacity
              key={cl.id}
              style={[styles.callerChip, selectedCl === cl.id && styles.callerChipActive]}
              onPress={() => setSelectedCl(cl.id)}
            >
              <Text style={[styles.callerChipText, selectedCl === cl.id && styles.callerChipTextActive]}>
                {cl.full_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity
          style={[styles.assignBtn, assigning && styles.assignBtnDisabled]}
          onPress={handleAssign}
          disabled={assigning}
        >
          {assigning ? <ActivityIndicator color="#fff" /> : <Text style={styles.assignBtnText}>Update Assignment</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Call History ({calls.length})</Text>
          <TouchableOpacity onPress={() => setShowCallForm(!showCallForm)}>
            <Text style={{ color: '#7c3aed', fontWeight: '600', fontSize: 14 }}>
              {showCallForm ? 'Cancel' : '+ Log Call'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={[{ backgroundColor: '#0f172a', padding: 12, borderRadius: 8, marginBottom: 12 }, !showCallForm && { display: 'none' }]}>
          <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {CALL_STATUSES.map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.stageChip, callStatus === s && { backgroundColor: '#7c3aed' }]}
                onPress={() => setCallStatus(s)}
              >
                <Text style={[styles.stageChipText, { color: callStatus === s ? '#fff' : '#94a3b8' }]}>
                  {CALL_STATUS_LABELS[s as keyof typeof CALL_STATUS_LABELS]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={{ color: '#94a3b8', fontSize: 13, marginBottom: 8, fontWeight: '600' }}>Notes</Text>
          <TextInput
            style={{
              backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: 8, padding: 12,
              minHeight: 80, textAlignVertical: 'top', marginBottom: 12
            }}
            placeholder="Enter call details..."
            placeholderTextColor="#64748b"
            multiline
            value={callNotes}
            onChangeText={setCallNotes}
          />
          <TouchableOpacity
            style={[styles.assignBtn, { minHeight: 40, padding: 10 }, loggingCall && { opacity: 0.6 }]}
            onPress={handleLogCall}
            disabled={loggingCall}
          >
            {loggingCall ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.assignBtnText}>Save Call</Text>}
          </TouchableOpacity>
        </View>

        {calls.length === 0 ? (
          <Text style={styles.emptyText}>No calls logged yet</Text>
        ) : (
          calls.map((c) => (
            <View key={c.id} style={styles.callCard}>
              <View style={styles.callHeader}>
                <Text style={styles.callStatus}>{c.status.replace('_', ' ')}</Text>
                <Text style={styles.callDate}>{new Date(c.called_at).toLocaleDateString()}</Text>
              </View>
              {c.caller ? (
                <Text style={styles.callAuthor}>
                  By: {c.caller.full_name} ({c.caller.role === 'team_lead' ? 'Director Sales' : c.caller.role === 'caller' ? 'Sales Executive' : 'Admin'})
                </Text>
              ) : null}
              {c.notes ? <Text style={styles.callNotes}>{c.notes}</Text> : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>

    <EditLeadModal
      lead={lead}
      visible={showEditModal}
      onClose={() => setShowEditModal(false)}
      onUpdate={setLead}
    />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1120' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  titleContainer: { flex: 1, paddingRight: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  meta: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  editBtn: { backgroundColor: '#334155', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  editBtnText: { color: '#f8fafc', fontSize: 13, fontWeight: '600' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 14 },
  noticeBox: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: 12, marginBottom: 12 },
  noticeText: { color: '#22c55e', fontSize: 14 },
  section: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc', marginBottom: 12 },
  phoneChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a',
    borderRadius: 10, padding: 14, marginBottom: 8, minHeight: 48, gap: 12,
  },
  phoneLabel: { fontSize: 12, color: '#94a3b8', fontWeight: '500', width: 80 },
  phoneNumber: { fontSize: 16, color: '#a78bfa', fontWeight: '600' },
  stageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#0f172a', marginRight: 6 },
  stageChipText: { fontSize: 12, fontWeight: '600' },
  callerRow: { flexDirection: 'row', marginBottom: 12 },
  callerChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#0f172a', marginRight: 6 },
  callerChipActive: { backgroundColor: '#7c3aed' },
  callerChipText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  callerChipTextActive: { color: '#ffffff' },
  assignBtn: { backgroundColor: '#7c3aed', borderRadius: 10, padding: 14, alignItems: 'center', minHeight: 48 },
  assignBtnDisabled: { opacity: 0.6 },
  assignBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  callCard: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 8 },
  callHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  callStatus: { fontSize: 14, color: '#a78bfa', fontWeight: '600', textTransform: 'capitalize' },
  callDate: { fontSize: 12, color: '#64748b' },
  callAuthor: { fontSize: 12, color: '#94a3b8', fontStyle: 'italic', marginTop: 2, marginBottom: 4 },
  callNotes: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingVertical: 16 },
});
