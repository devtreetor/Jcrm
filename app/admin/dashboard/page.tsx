'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'next/navigation';
import { API_ROUTES } from '@/lib/constants';
import { STAGE_LABELS, STAGE_COLORS } from '@/lib/constants';
import type { InsightsData, InsightsRange } from '@/types/team.types';

const RANGE_OPTIONS: { label: string; value: InsightsRange }[] = [
  { label: 'Today', value: 'day' },
  { label: 'This Month', value: 'month' },
  { label: 'Last 6 Months', value: '6m' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [range, setRange] = useState<InsightsRange>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
      const message = err instanceof Error ? err.message : 'Failed to load insights';
      setError(message);
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
        { label: 'Total Calls', value: insights.total_calls, color: '#60a5fa' },
        { label: STAGE_LABELS.demo_booked, value: insights.demos_booked, color: STAGE_COLORS.demo_booked },
        { label: STAGE_LABELS.mql, value: insights.mqls, color: STAGE_COLORS.mql },
        { label: STAGE_LABELS.proposal_sent, value: insights.proposals_sent, color: STAGE_COLORS.proposal_sent },
        { label: STAGE_LABELS.won, value: insights.won, color: STAGE_COLORS.won },
        { label: STAGE_LABELS.lost, value: insights.lost, color: STAGE_COLORS.lost },
      ]
    : [];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Dashboard</Text>

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
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color="#60a5fa" size="large" style={styles.loader} />
      ) : (
        <View style={styles.grid}>
          {statCards.map((card) => (
            <View key={card.label} style={styles.statCard}>
              <Text style={styles.statValue}>{card.value}</Text>
              <Text style={[styles.statLabel, { color: card.color }]}>{card.label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/admin/leads')}>
          <Text style={styles.actionIcon}>🏫</Text>
          <Text style={styles.actionText}>View All Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/admin/import')}>
          <Text style={styles.actionIcon}>📥</Text>
          <Text style={styles.actionText}>Import CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/admin/users')}>
          <Text style={styles.actionIcon}>👥</Text>
          <Text style={styles.actionText}>Manage Users</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#f8fafc', marginBottom: 16 },
  rangeRow: { flexDirection: 'row', marginBottom: 20 },
  rangePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 8,
  },
  rangePillActive: { backgroundColor: '#2563eb' },
  rangePillText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  rangePillTextActive: { color: '#ffffff' },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#ef4444', fontSize: 14 },
  loader: { marginTop: 48 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '47%' as unknown as number,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 32, fontWeight: '800', color: '#f8fafc', marginBottom: 4 },
  statLabel: { fontSize: 13, fontWeight: '600' },
  quickActions: { marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#f8fafc', marginBottom: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  actionIcon: { fontSize: 20 },
  actionText: { fontSize: 15, color: '#cbd5e1', fontWeight: '500' },
});
