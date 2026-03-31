'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useParams } from 'next/navigation';
import { STAGE_LABELS, STAGE_COLORS, LEAD_STAGES, API_ROUTES } from '@/lib/constants';
import type { Lead, LeadStage } from '@/types/lead.types';
import type { CallLog } from '@/types/call.types';
import type { User } from '@/types/user.types';

export default function AdminLeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;
  const [lead, setLead] = useState<Lead | null>(null);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [teamLeads, setTeamLeads] = useState<User[]>([]);
  const [callers, setCallers] = useState<User[]>([]);
  const [selectedTl, setSelectedTl] = useState<string>('');
  const [selectedCl, setSelectedCl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

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
      setSelectedTl(json.data.assigned_tl_id || '');
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

  const fetchTeamLeads = useCallback(async () => {
    try {
      const res = await fetch(`${API_ROUTES.USERS}?`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (res.ok) {
        const allUsers = json.data as User[];
        setTeamLeads(allUsers.filter((u: User) => u.role === 'team_lead' && u.is_active));
      }
    } catch { /* non-critical */ }
  }, []);

  const fetchCallers = useCallback(async (tlId: string) => {
    if (!tlId) {
      setCallers([]);
      return;
    }
    try {
      const res = await fetch(`${API_ROUTES.USERS}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (res.ok) {
        const allUsers = json.data as User[];
        setCallers(allUsers.filter((u: User) => u.role === 'caller' && u.team_lead_id === tlId && u.is_active));
      }
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { fetchLead(); fetchCalls(); fetchTeamLeads(); }, [fetchLead, fetchCalls, fetchTeamLeads]);

  useEffect(() => {
    if (selectedTl) fetchCallers(selectedTl);
    else setCallers([]);
  }, [selectedTl, fetchCallers]);

  const handleTlChange = (tlId: string) => {
    setSelectedTl(tlId);
    if (selectedCl) {
      setSelectedCl('');
      setNotice('Caller unset — please reassign from the new team.');
    }
  };

  const handleAssign = async () => {
    try {
      setAssigning(true);
      setError('');
      setNotice('');
      const res = await fetch(`${API_ROUTES.LEADS}/${leadId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          assigned_tl_id: selectedTl || null,
          assigned_cl_id: selectedCl || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLead(json.data);
      setNotice('Assignment updated successfully');
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

  if (loading) return <ActivityIndicator color="#60a5fa" size="large" style={{ marginTop: 48 }} />;
  if (!lead) return <Text style={styles.errorText}>Lead not found</Text>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>{lead.school_name}</Text>
      <Text style={styles.meta}>
        {[lead.city, lead.state].filter(Boolean).join(', ') || 'No location'}{' '}
        {lead.board ? `• ${lead.board}` : ''}
      </Text>

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
        <Text style={styles.sectionTitle}>Assignment</Text>
        <Text style={styles.dropdownLabel}>Team Lead</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dropdownRow}>
          <TouchableOpacity
            style={[styles.optionChip, !selectedTl && styles.optionActive]}
            onPress={() => handleTlChange('')}
          >
            <Text style={[styles.optionText, !selectedTl && styles.optionTextActive]}>None</Text>
          </TouchableOpacity>
          {teamLeads.map((tl) => (
            <TouchableOpacity
              key={tl.id}
              style={[styles.optionChip, selectedTl === tl.id && styles.optionActive]}
              onPress={() => handleTlChange(tl.id)}
            >
              <Text style={[styles.optionText, selectedTl === tl.id && styles.optionTextActive]}>
                {tl.full_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedTl ? (
          <>
            <Text style={styles.dropdownLabel}>Caller</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dropdownRow}>
              <TouchableOpacity
                style={[styles.optionChip, !selectedCl && styles.optionActive]}
                onPress={() => setSelectedCl('')}
              >
                <Text style={[styles.optionText, !selectedCl && styles.optionTextActive]}>None</Text>
              </TouchableOpacity>
              {callers.map((cl) => (
                <TouchableOpacity
                  key={cl.id}
                  style={[styles.optionChip, selectedCl === cl.id && styles.optionActive]}
                  onPress={() => setSelectedCl(cl.id)}
                >
                  <Text style={[styles.optionText, selectedCl === cl.id && styles.optionTextActive]}>
                    {cl.full_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.assignBtn, assigning && styles.assignBtnDisabled]}
          onPress={handleAssign}
          disabled={assigning}
        >
          {assigning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.assignBtnText}>Update Assignment</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Call History ({calls.length})</Text>
        {calls.length === 0 ? (
          <Text style={styles.emptyText}>No calls logged yet</Text>
        ) : (
          calls.map((c) => (
            <View key={c.id} style={styles.callCard}>
              <View style={styles.callHeader}>
                <Text style={styles.callStatus}>{c.status.replace('_', ' ')}</Text>
                <Text style={styles.callDate}>{new Date(c.called_at).toLocaleDateString()}</Text>
              </View>
              {c.notes ? <Text style={styles.callNotes}>{c.notes}</Text> : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  meta: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
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
  phoneNumber: { fontSize: 16, color: '#60a5fa', fontWeight: '600' },
  stageChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#0f172a', marginRight: 6 },
  stageChipText: { fontSize: 12, fontWeight: '600' },
  dropdownLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 8, marginTop: 8 },
  dropdownRow: { flexDirection: 'row', marginBottom: 8 },
  optionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#0f172a', marginRight: 6 },
  optionActive: { backgroundColor: '#2563eb' },
  optionText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  optionTextActive: { color: '#ffffff' },
  assignBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12, minHeight: 48 },
  assignBtnDisabled: { opacity: 0.6 },
  assignBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  callCard: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 8 },
  callHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  callStatus: { fontSize: 14, color: '#60a5fa', fontWeight: '600', textTransform: 'capitalize' },
  callDate: { fontSize: 12, color: '#64748b' },
  callNotes: { fontSize: 13, color: '#cbd5e1', marginTop: 4 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingVertical: 16 },
});
