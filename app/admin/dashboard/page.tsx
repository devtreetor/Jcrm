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
  { label: '6 Months', value: '6m' },
];

const StageChart = ({ data }: { data: InsightsData }) => {
  const stages = [
    { label: 'Demos', value: data.demos_booked, color: '#E24E59' },
    { label: 'Mtg Fixed', value: data.meetings_fixed, color: '#06b6d4' },
    { label: 'Mtg Done', value: data.meetings_done, color: '#0ea5e9' },
    { label: 'Negotiation', value: data.negotiations, color: '#8b5cf6' },
    { label: 'Proposal', value: data.proposals_sent, color: '#F8DE6F' },
    { label: 'Won', value: data.won, color: '#22c55e' },
    { label: 'Lost', value: data.lost, color: '#94a3b8' },
  ];
  
  const max = Math.max(...stages.map(s => s.value), 1);
  
  return (
    <View style={chartStyles.container}>
      <Text style={chartStyles.title}>Stage Distribution</Text>
      <View style={chartStyles.barContainer}>
        {stages.map((s, i) => (
          <View key={i} style={chartStyles.barWrapper}>
            <View style={chartStyles.barBackground}>
              <View 
                style={[
                  chartStyles.barFill, 
                  { height: `${(s.value / max) * 100}%`, backgroundColor: s.color }
                ]} 
              />
            </View>
            <Text style={chartStyles.barLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

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
        { label: 'Calls', value: insights.total_calls, color: '#1270E3' },
        { label: 'Demos', value: insights.demos_booked, color: '#E24E59' },
        { label: 'Mtg Fixed', value: insights.meetings_fixed, color: '#06b6d4' },
        { label: 'Mtg Done', value: insights.meetings_done, color: '#0ea5e9' },
        { label: 'Negotiation', value: insights.negotiations, color: '#8b5cf6' },
        { label: 'Proposal', value: insights.proposals_sent, color: '#a78bfa' },
        { label: 'Won', value: insights.won, color: '#22c55e' },
        { label: 'Lost', value: insights.lost, color: '#94a3b8' },
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
        <ActivityIndicator color="#E24E59" size="large" style={styles.loader} />
      ) : insights ? (
        <>
          <View style={styles.grid}>
            {statCards.map((card) => (
              <View key={card.label} style={styles.statCard}>
                 <View style={[styles.statIconBadge, { backgroundColor: `${card.color}22` }]}>
                    <Text style={{ color: card.color }}>●</Text>
                 </View>
                <Text style={styles.statValue}>{card.value}</Text>
                <Text style={styles.statLabel}>{card.label}</Text>
              </View>
            ))}
          </View>
          
          <StageChart data={insights} />
          
          <View style={chartStyles.container}>
            <Text style={chartStyles.title}>Growth Trend (Mocked)</Text>
            <svg width="100%" height="150" viewBox="0 0 400 150" style={{ marginTop: 10 }}>
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E24E59" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#E24E59" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path 
                d="M 20,120 Q 80,100 120,60 T 220,80 T 320,30 T 380,50" 
                fill="transparent" 
                stroke="#E24E59" 
                strokeWidth="4" 
                strokeLinecap="round" 
              />
              <path 
                d="M 20,120 Q 80,100 120,60 T 220,80 T 320,30 T 380,50 L 380,150 L 20,150 Z" 
                fill="url(#gradient)" 
              />
            </svg>
          </View>
        </>
      ) : null}

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

const chartStyles = StyleSheet.create({
  container: {
    backgroundColor: '#171f2f',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 20,
    fontFamily: 'Montserrat',
  },
  barContainer: {
    flexDirection: 'row',
    height: 180,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  barWrapper: {
    alignItems: 'center',
    width: '13%',
  },
  barBackground: {
    width: 12,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 8,
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#0b1120' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#f8fafc', 
    marginBottom: 24,
    fontFamily: 'Montserrat',
  },
  rangeRow: { flexDirection: 'row', marginBottom: 24 },
  rangePill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#171f2f',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rangePillActive: { 
    backgroundColor: '#E24E59',
    borderColor: '#E24E59',
  },
  rangePillText: { fontSize: 13, color: '#94a3b8', fontWeight: '600', fontFamily: 'Poppins' },
  rangePillTextActive: { color: '#ffffff' },
  errorBox: {
    backgroundColor: 'rgba(226,78,89,0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(226,78,89,0.2)',
  },
  errorText: { color: '#E24E59', fontSize: 14, fontFamily: 'Poppins' },
  loader: { marginTop: 48 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%' as unknown as number,
    backgroundColor: '#171f2f',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#f8fafc', 
    marginBottom: 4,
    fontFamily: 'Poppins' 
  },
  statLabel: { 
    fontSize: 12, 
    fontWeight: '600', 
    color: '#94a3b8',
    fontFamily: 'Poppins' 
  },
  quickActions: { marginTop: 8 },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#f8fafc', 
    marginBottom: 16,
    fontFamily: 'Montserrat'
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171f2f',
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionIcon: { fontSize: 22 },
  actionText: { fontSize: 16, color: '#f8fafc', fontWeight: '600', fontFamily: 'Poppins' },
});
