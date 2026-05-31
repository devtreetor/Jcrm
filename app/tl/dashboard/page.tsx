'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'next/navigation';
import { API_ROUTES, STAGE_LABELS, STAGE_COLORS } from '@/lib/constants';
import type { InsightsData, InsightsRange } from '@/types/team.types';
import type { LeadStage } from '@/types/lead.types';
import InsightLeadsModal from '@/app/components/InsightLeadsModal';

const RANGE_OPTIONS: { label: string; value: InsightsRange }[] = [
  { label: 'Today', value: 'day' },
  { label: 'This Month', value: 'month' },
  { label: 'Last 6 Months', value: '6m' },
];

export default function TLDashboard() {
  const router = useRouter();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [range, setRange] = useState<InsightsRange>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCard, setSelectedCard] = useState<{
    label: string; color: string; type: 'stage' | 'calls'; stage?: LeadStage;
  } | null>(null);

  const fetchInsights = useCallback(async (r: InsightsRange) => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ROUTES.INSIGHTS}?range=${r}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setInsights(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights(range);
    const interval = setInterval(() => fetchInsights(range), 60000);
    return () => clearInterval(interval);
  }, [range, fetchInsights]);

  const statCards = insights
    ? [
        { label: 'Total Calls', value: insights.total_calls, color: '#a78bfa', type: 'calls' as const },
        { label: STAGE_LABELS.demo_booked, value: insights.demos_booked, color: STAGE_COLORS.demo_booked, type: 'stage' as const, stage: 'demo_booked' as LeadStage },
        { label: STAGE_LABELS.meeting_fixed, value: insights.meetings_fixed, color: STAGE_COLORS.meeting_fixed, type: 'stage' as const, stage: 'meeting_fixed' as LeadStage },
        { label: STAGE_LABELS.meeting_done, value: insights.meetings_done, color: STAGE_COLORS.meeting_done, type: 'stage' as const, stage: 'meeting_done' as LeadStage },
        { label: STAGE_LABELS.won, value: insights.won, color: STAGE_COLORS.won, type: 'stage' as const, stage: 'won' as LeadStage },
        { label: STAGE_LABELS.lost, value: insights.lost, color: STAGE_COLORS.lost, type: 'stage' as const, stage: 'lost' as LeadStage },
        { label: STAGE_LABELS.proposal_sent, value: insights.proposals_sent, color: STAGE_COLORS.proposal_sent, type: 'stage' as const, stage: 'proposal_sent' as LeadStage },
      ]
    : [];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Team Dashboard</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rangeRow}>
        {RANGE_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.rangePill, range === opt.value && styles.rangePillActive]}
            onPress={() => setRange(opt.value)}
          >
            <Text style={[styles.rangePillText, range === opt.value && styles.rangePillTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      ) : null}

      {loading ? (
        <ActivityIndicator color="#a78bfa" size="large" style={styles.loader} />
      ) : (
        <View style={styles.grid}>
          {statCards.map((card) => (
            <TouchableOpacity
              key={card.label}
              style={styles.statCard}
              activeOpacity={0.7}
              onPress={() => setSelectedCard({ label: card.label, color: card.color, type: card.type, stage: card.stage })}
            >
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={[styles.statLabel, { color: card.color }]}>{card.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={styles.viewLeadsBtn}
        onPress={() => router.push('/tl/leads')}
      >
        <Text style={styles.viewLeadsBtnText}>View Team Leads →</Text>
      </TouchableOpacity>

      <InsightLeadsModal
        visible={!!selectedCard}
        onClose={() => setSelectedCard(null)}
        title={selectedCard?.label ?? ''}
        color={selectedCard?.color ?? '#fff'}
        type={selectedCard?.type ?? 'stage'}
        stage={selectedCard?.stage}
        range={range}
        rolePrefix="/tl"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: 'var(--color-text-primary)', marginBottom: 16 },
  rangeRow: { flexDirection: 'row', marginBottom: 20 },
  rangePill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'var(--color-surface-lighter)', marginRight: 8 },
  rangePillActive: { backgroundColor: '#7c3aed' },
  rangePillText: { fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: '500' },
  rangePillTextActive: { color: 'var(--color-text-primary)' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 14 },
  loader: { marginTop: 48 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    width: '47%' as unknown as number,
    backgroundColor: 'var(--color-surface-lighter)', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  statValue: { fontSize: 32, fontWeight: '800', color: 'var(--color-text-primary)', marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: '600' },
  viewLeadsBtn: {
    backgroundColor: '#7c3aed', borderRadius: 10, padding: 14, alignItems: 'center', minHeight: 48,
  },
  viewLeadsBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
