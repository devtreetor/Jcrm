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
      setNotice('Sales Executive unset — please reassign from the new team.');
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
        <Text style={styles.sectionTitle}>Contact Directory</Text>
        {lead.principal_phone ? (
          <TouchableOpacity 
            style={styles.phoneChip} 
            onPress={() => window.location.href = `tel:${lead.principal_phone}`}
          >
            <View style={styles.phoneIconBadge}>
              <Text style={{ fontSize: 18 }}>📞</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.phoneLabel}>Principal</Text>
              <Text style={styles.phoneNumber}>{lead.principal_phone}</Text>
            </View>
            <Text style={styles.callNowText}>Call Now</Text>
          </TouchableOpacity>
        ) : null}
        {lead.chairman_phone ? (
          <TouchableOpacity 
            style={styles.phoneChip} 
            onPress={() => window.location.href = `tel:${lead.chairman_phone}`}
          >
            <View style={styles.phoneIconBadge}>
              <Text style={{ fontSize: 18 }}>📞</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.phoneLabel}>Chairman</Text>
              <Text style={styles.phoneNumber}>{lead.chairman_phone}</Text>
            </View>
            <Text style={styles.callNowText}>Call Now</Text>
          </TouchableOpacity>
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
            <Text style={styles.dropdownLabel}>Sales Executive</Text>
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
  scroll: { flex: 1, backgroundColor: '#0b1120' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { 
    fontSize: 26, 
    fontWeight: '800', 
    color: '#f8fafc', 
    marginBottom: 6,
    fontFamily: 'Montserrat'
  },
  meta: { 
    fontSize: 15, 
    color: '#94a3b8', 
    marginBottom: 24,
    fontFamily: 'Poppins'
  },
  errorBox: { 
    backgroundColor: 'rgba(226,78,89,0.1)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,78,89,0.2)',
  },
  errorText: { color: '#E24E59', fontSize: 14, fontFamily: 'Poppins' },
  noticeBox: { 
    backgroundColor: 'rgba(18,112,227,0.1)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(18,112,227,0.2)',
  },
  noticeText: { color: '#1270E3', fontSize: 14, fontWeight: '600', fontFamily: 'Poppins' },
  section: { 
    backgroundColor: '#171f2f', 
    borderRadius: 20, 
    padding: 20, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#f8fafc', 
    marginBottom: 16,
    fontFamily: 'Montserrat'
  },
  phoneChip: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 16, 
    padding: 16, 
    marginBottom: 12, 
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  phoneIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(18, 112, 227, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneLabel: { 
    fontSize: 12, 
    color: '#94a3b8', 
    fontWeight: '600',
    fontFamily: 'Poppins',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneNumber: { 
    fontSize: 17, 
    color: '#1270E3', 
    fontWeight: '700',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  callNowText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E24E59',
    fontFamily: 'Poppins',
  },
  stageChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    backgroundColor: 'rgba(15, 23, 42, 0.5)', 
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  stageChipText: { fontSize: 13, fontWeight: '700', fontFamily: 'Poppins' },
  dropdownLabel: { 
    fontSize: 13, 
    color: '#94a3b8', 
    marginBottom: 10, 
    marginTop: 10,
    fontWeight: '600',
    fontFamily: 'Poppins'
  },
  dropdownRow: { flexDirection: 'row', marginBottom: 12 },
  optionChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    backgroundColor: 'rgba(15, 23, 42, 0.5)', 
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionActive: { 
    backgroundColor: '#1270E3',
    borderColor: '#1270E3',
  },
  optionText: { fontSize: 13, color: '#94a3b8', fontWeight: '600', fontFamily: 'Poppins' },
  optionTextActive: { color: '#ffffff' },
  assignBtn: { 
    backgroundColor: '#E24E59', 
    borderRadius: 14, 
    padding: 16, 
    alignItems: 'center', 
    marginTop: 16,
    shadowColor: '#E24E59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  assignBtnDisabled: { opacity: 0.6 },
  assignBtnText: { color: '#fff', fontWeight: '700', fontSize: 16, fontFamily: 'Poppins' },
  callCard: { 
    backgroundColor: 'rgba(15, 23, 42, 0.5)', 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  callHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  callStatus: { 
    fontSize: 15, 
    color: '#1270E3', 
    fontWeight: '700', 
    textTransform: 'capitalize',
    fontFamily: 'Poppins'
  },
  callDate: { fontSize: 12, color: '#64748b', fontFamily: 'Poppins' },
  callNotes: { fontSize: 14, color: '#cbd5e1', marginTop: 4, fontFamily: 'Poppins', lineHeight: 20 },
  emptyText: { fontSize: 14, color: '#64748b', textAlign: 'center', paddingVertical: 20, fontFamily: 'Poppins' },
});
