'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'next/navigation';
import { API_ROUTES, STAGE_LABELS, STAGE_COLORS } from '@/lib/constants';
import type { Lead } from '@/types/lead.types';

export default function CallerLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_ROUTES.LEADS}?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLeads(json.data.leads);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  if (loading) return <ActivityIndicator color="#22c55e" size="large" style={{ marginTop: 48 }} />;

  if (error) {
    return (
      <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
    );
  }

  if (leads.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyTitle}>No leads assigned</Text>
        <Text style={styles.emptyMessage}>Ask your team lead to assign leads to you</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Leads ({leads.length})</Text>
      <FlatList
        data={leads}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.leadCard}
            onPress={() => router.push(`/caller/leads/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.leadInfo}>
              <Text style={styles.schoolName} numberOfLines={1}>{item.school_name}</Text>
              <Text style={styles.leadMeta}>
                {[item.city, item.state].filter(Boolean).join(', ') || 'No location'}
              </Text>
            </View>
            <View style={[styles.stagePill, { backgroundColor: STAGE_COLORS[item.stage] + '20' }]}>
              <Text style={[styles.stagePillText, { color: STAGE_COLORS[item.stage] }]}>
                {STAGE_LABELS[item.stage]}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b1120', padding: 20 },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#f8fafc', 
    marginBottom: 20,
    fontFamily: 'Montserrat'
  },
  errorBox: { 
    backgroundColor: 'rgba(226,78,89,0.1)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(226,78,89,0.2)',
  },
  errorText: { color: '#E24E59', fontSize: 14, fontFamily: 'Poppins' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#f8fafc', 
    marginBottom: 8,
    fontFamily: 'Montserrat'
  },
  emptyMessage: { 
    fontSize: 15, 
    color: '#94a3b8', 
    textAlign: 'center',
    fontFamily: 'Poppins'
  },
  listContent: { paddingBottom: 24 },
  leadCard: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#171f2f',
    borderRadius: 20, 
    padding: 18, 
    marginBottom: 12, 
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  leadInfo: { flex: 1 },
  schoolName: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#f8fafc',
    fontFamily: 'Poppins'
  },
  leadMeta: { 
    fontSize: 13, 
    color: '#94a3b8', 
    marginTop: 4,
    fontFamily: 'Poppins'
  },
  stagePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  stagePillText: { fontSize: 12, fontWeight: '700', fontFamily: 'Poppins' },
});
