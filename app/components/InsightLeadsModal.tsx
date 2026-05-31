'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal,
} from 'react-native';
import { useRouter } from 'next/navigation';
import { API_ROUTES, STAGE_LABELS, STAGE_COLORS, CALL_STATUS_LABELS, CALL_STATUS_COLORS } from '@/lib/constants';
import type { Lead, LeadStage } from '@/types/lead.types';
import type { InsightsRange } from '@/types/team.types';

interface CalledLeadRow {
  call_id: string;
  caller_name: string;
  status: string;
  notes: string | null;
  called_at: string;
  lead_id: string;
  school_name: string;
  city: string | null;
  state: string | null;
  stage: LeadStage;
}

interface InsightLeadsModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  color: string;
  type: 'stage' | 'calls';
  stage?: LeadStage;
  range: InsightsRange;
  rolePrefix: string; // e.g. '/admin', '/tl', '/caller'
}

const RANGE_LABELS: Record<InsightsRange, string> = {
  day: 'Today',
  month: 'This Month',
  '6m': 'Last 6 Months',
};

export default function InsightLeadsModal({
  visible, onClose, title, color, type, stage, range, rolePrefix,
}: InsightLeadsModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<CalledLeadRow[]>([]);
  const [callsLeads, setCallsLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState<'calls' | 'leads'>('calls');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ type, range });
      if (type === 'stage' && stage) {
        params.set('stage', stage);
      }

      const res = await fetch(`${API_ROUTES.INSIGHTS_LEADS}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      if (type === 'stage') {
        setLeads(json.data.leads ?? []);
        setCalls([]);
        setCallsLeads([]);
      } else {
        setCalls(json.data.calls ?? []);
        setCallsLeads(json.data.leads ?? []);
        setLeads([]);
        setActiveTab('calls');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [type, stage, range]);

  useEffect(() => {
    if (visible) {
      fetchData();
    } else {
      // Reset state when modal closes
      setLeads([]);
      setCalls([]);
      setCallsLeads([]);
      setError('');
    }
  }, [visible, fetchData]);

  const handleLeadPress = (leadId: string) => {
    onClose();
    router.push(`${rolePrefix}/leads/${leadId}`);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const renderStagePill = (leadStage: LeadStage) => (
    <View style={[s.stagePill, { backgroundColor: `${STAGE_COLORS[leadStage]}22` }]}>
      <Text style={[s.stagePillText, { color: STAGE_COLORS[leadStage] }]}>
        {STAGE_LABELS[leadStage]}
      </Text>
    </View>
  );

  const renderLeadCard = (lead: Lead) => (
    <TouchableOpacity
      key={lead.id}
      style={s.leadCard}
      onPress={() => handleLeadPress(lead.id)}
      activeOpacity={0.7}
    >
      <View style={s.leadCardTop}>
        <Text style={s.leadName} numberOfLines={1}>{lead.school_name}</Text>
        <Text style={s.leadArrow}>›</Text>
      </View>
      <View style={s.leadCardBottom}>
        {lead.city || lead.state ? (
          <Text style={s.leadLocation} numberOfLines={1}>
            {[lead.city, lead.state].filter(Boolean).join(', ')}
          </Text>
        ) : null}
        {renderStagePill(lead.stage)}
      </View>
    </TouchableOpacity>
  );

  const renderCallCard = (call: CalledLeadRow) => {
    const statusLabel = CALL_STATUS_LABELS[call.status as keyof typeof CALL_STATUS_LABELS] ?? call.status;
    const statusColor = CALL_STATUS_COLORS[call.status as keyof typeof CALL_STATUS_COLORS] ?? '#94a3b8';
    return (
      <TouchableOpacity
        key={call.call_id}
        style={s.callCard}
        onPress={() => handleLeadPress(call.lead_id)}
        activeOpacity={0.7}
      >
        <View style={s.callCardTop}>
          <Text style={s.leadName} numberOfLines={1}>{call.school_name}</Text>
          <View style={[s.callStatusPill, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[s.callStatusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>
        <View style={s.callCardBottom}>
          <Text style={s.callerName}>📞 {call.caller_name}</Text>
          <Text style={s.callDate}>{formatDate(call.called_at)}</Text>
        </View>
        {call.notes ? (
          <Text style={s.callNotes} numberOfLines={2}>💬 {call.notes}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={color} size="large" style={s.loader} />;
    }
    if (error) {
      return (
        <View style={s.errorBox}>
          <Text style={s.errorText}>{error}</Text>
        </View>
      );
    }

    // Stage-type: show leads list
    if (type === 'stage') {
      if (leads.length === 0) {
        return (
          <View style={s.emptyBox}>
            <Text style={s.emptyText}>No leads found</Text>
          </View>
        );
      }
      return leads.map(renderLeadCard);
    }

    // Calls-type: tabbed view — Call Logs / Unique Leads
    return (
      <>
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, activeTab === 'calls' && { borderBottomColor: color }]}
            onPress={() => setActiveTab('calls')}
          >
            <Text style={[s.tabText, activeTab === 'calls' && { color }]}>
              Call Logs ({calls.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, activeTab === 'leads' && { borderBottomColor: color }]}
            onPress={() => setActiveTab('leads')}
          >
            <Text style={[s.tabText, activeTab === 'leads' && { color }]}>
              Unique Leads ({callsLeads.length})
            </Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'calls' ? (
          calls.length === 0 ? (
            <View style={s.emptyBox}><Text style={s.emptyText}>No call logs found</Text></View>
          ) : calls.map(renderCallCard)
        ) : (
          callsLeads.length === 0 ? (
            <View style={s.emptyBox}><Text style={s.emptyText}>No leads found</Text></View>
          ) : callsLeads.map(renderLeadCard)
        )}
      </>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <View style={s.modalContainer}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={[s.headerDot, { backgroundColor: color }]} />
              <View>
                <Text style={s.headerTitle}>{title}</Text>
                <Text style={s.headerSubtitle}>{RANGE_LABELS[range]}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={s.contentScroll}
            contentContainerStyle={s.contentScrollInner}
            showsVerticalScrollIndicator={false}
          >
            {renderContent()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    fontFamily: 'Montserrat',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Poppins',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  contentScroll: {
    flex: 1,
  },
  contentScrollInner: {
    padding: 16,
    paddingBottom: 40,
  },
  loader: {
    marginTop: 40,
    marginBottom: 40,
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    fontFamily: 'Poppins',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
    fontFamily: 'Poppins',
  },
  // Lead card
  leadCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  leadCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leadName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
    fontFamily: 'Poppins',
    flex: 1,
    marginRight: 8,
  },
  leadArrow: {
    fontSize: 20,
    color: '#64748b',
    fontWeight: '300',
  },
  leadCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadLocation: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Poppins',
    flex: 1,
    marginRight: 8,
  },
  stagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stagePillText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  // Call card
  callCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  callCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  callStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  callStatusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Poppins',
  },
  callCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  callerName: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: 'Poppins',
  },
  callDate: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: 'Poppins',
  },
  callNotes: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Poppins',
    marginTop: 6,
  },
  // Tabs
  tabRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    fontFamily: 'Poppins',
  },
});
