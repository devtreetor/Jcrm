'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'next/navigation';
import { API_ROUTES, LEAD_STAGES, STAGE_LABELS, STAGE_COLORS } from '@/lib/constants';
import type { Lead, LeadStage } from '@/types/lead.types';
import type { User } from '@/types/user.types';

export default function TLLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [callers, setCallers] = useState<User[]>([]);
  const [search, setSearch] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('tlLeadsSearch') || '';
    return '';
  });
  const [stageFilter, setStageFilter] = useState<LeadStage | ''>(() => {
    if (typeof window !== 'undefined') return (sessionStorage.getItem('tlLeadsStage') as LeadStage) || '';
    return '';
  });
  const [selectedClId, setSelectedClId] = useState<string>(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('tlLeadsCl') || '';
    return '';
  });
  const [page, setPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('tlLeadsPage');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });
  const [error, setError] = useState('');

  const fetchCallers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ROUTES.USERS, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setCallers(json.data as User[]);
      }
    } catch (err) {
      console.error('Failed to load team callers for filter:', err);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      
      const querySearch = search.trim();
      if (querySearch && querySearch.length >= 3) {
        params.set('search', querySearch);
      }
      if (stageFilter) params.set('stage', stageFilter);
      if (selectedClId) params.set('assigned_cl_id', selectedClId);

      const res = await fetch(`${API_ROUTES.LEADS}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setLeads(json.data.leads);
      setCount(json.data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [page, search, stageFilter, selectedClId]);

  useEffect(() => {
    fetchCallers();
  }, [fetchCallers]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tlLeadsSearch', search);
      sessionStorage.setItem('tlLeadsStage', stageFilter);
      sessionStorage.setItem('tlLeadsCl', selectedClId);
      sessionStorage.setItem('tlLeadsPage', page.toString());
    }
  }, [search, stageFilter, selectedClId, page]);

  const renderLead = ({ item }: { item: Lead }) => (
    <TouchableOpacity
      style={styles.leadCard}
      onPress={() => router.push(`/tl/leads/${item.id}`)}
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
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team Leads ({count})</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search schools..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={(t) => { setSearch(t); setPage(1); }}
      />

      {/* Stage Filter */}
      <Text style={styles.filterLabel}>Stage</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, !stageFilter && styles.filterPillActive]}
          onPress={() => { setStageFilter(''); setPage(1); }}
        >
          <Text style={[styles.filterPillText, !stageFilter && styles.filterPillTextActive]}>All</Text>
        </TouchableOpacity>
        {LEAD_STAGES.map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterPill, stageFilter === s && styles.filterPillActive]}
            onPress={() => { setStageFilter(s); setPage(1); }}
          >
            <Text style={[styles.filterPillText, stageFilter === s && styles.filterPillTextActive]}>
              {STAGE_LABELS[s]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* SE Filter */}
      <Text style={styles.filterLabel}>Sales Executive</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterPill, !selectedClId && styles.filterPillActive]}
          onPress={() => { setSelectedClId(''); setPage(1); }}
        >
          <Text style={[styles.filterPillText, !selectedClId && styles.filterPillTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterPill, selectedClId === 'unassigned' && styles.filterPillActive]}
          onPress={() => { setSelectedClId('unassigned'); setPage(1); }}
        >
          <Text style={[styles.filterPillText, selectedClId === 'unassigned' && styles.filterPillTextActive]}>Unassigned</Text>
        </TouchableOpacity>
        {callers.map((cl) => (
          <TouchableOpacity
            key={cl.id}
            style={[styles.filterPill, selectedClId === cl.id && styles.filterPillActive]}
            onPress={() => { setSelectedClId(cl.id); setPage(1); }}
          >
            <Text style={[styles.filterPillText, selectedClId === cl.id && styles.filterPillTextActive]}>
              {cl.full_name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      ) : null}

      {loading ? (
        <View style={styles.loaderContainer}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      ) : leads.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏫</Text>
          <Text style={styles.emptyTitle}>No leads found</Text>
          <Text style={styles.emptyMessage}>Try adjusting your search or filters</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={leads}
            keyExtractor={(item) => item.id}
            renderItem={renderLead}
            style={styles.list}
            contentContainerStyle={styles.listContent}
          />
          <View style={styles.pagination}>
            <TouchableOpacity
              style={[styles.pageBtn, page <= 1 && styles.pageBtnDisabled]}
              onPress={() => page > 1 && setPage(page - 1)}
              disabled={page <= 1}
            >
              <Text style={styles.pageBtnText}>← Prev</Text>
            </TouchableOpacity>
            <Text style={styles.pageInfo}>Page {page}</Text>
            <TouchableOpacity
              style={[styles.pageBtn, leads.length < 20 && styles.pageBtnDisabled]}
              onPress={() => leads.length >= 20 && setPage(page + 1)}
              disabled={leads.length < 20}
            >
              <Text style={styles.pageBtnText}>Next →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'var(--color-surface)', padding: 20 },
  title: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: 'var(--color-text-primary)', 
    marginBottom: 16,
    fontFamily: 'Montserrat'
  },
  searchInput: {
    height: 52, 
    borderWidth: 1, 
    borderColor: 'var(--color-border)', 
    borderRadius: 14,
    paddingHorizontal: 16, 
    fontSize: 15, 
    color: 'var(--color-text-primary)', 
    backgroundColor: 'var(--color-surface-light)', 
    marginBottom: 16,
    fontFamily: 'Poppins',
  },
  filterLabel: {
    fontSize: 12,
    color: 'var(--color-text-muted)',
    marginBottom: 8,
    marginTop: 6,
    fontWeight: '700',
    fontFamily: 'Poppins',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterRow: { flexDirection: 'row', marginBottom: 20 },
  filterPill: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    backgroundColor: 'var(--color-surface-light)', 
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'var(--color-border)',
  },
  filterPillActive: { backgroundColor: 'var(--color-secondary)', borderColor: 'var(--color-secondary)' },
  filterPillText: { fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: '600', fontFamily: 'Poppins' },
  filterPillTextActive: { color: 'var(--color-text-primary)' },
  errorBox: { 
    backgroundColor: 'rgba(226,78,89,0.1)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(226,78,89,0.2)',
  },
  errorText: { color: 'var(--color-primary)', fontSize: 14, fontFamily: 'Poppins' },
  loaderContainer: { gap: 12 },
  skeletonCard: {
    height: 80,
    backgroundColor: 'var(--color-surface-light)',
    borderRadius: 20,
    opacity: 0.5,
  },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 64 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: 'var(--color-text-primary)', 
    marginBottom: 8,
    fontFamily: 'Montserrat'
  },
  emptyMessage: { 
    fontSize: 15, 
    color: 'var(--color-text-secondary)', 
    textAlign: 'center',
    fontFamily: 'Poppins'
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 20 },
  leadCard: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'var(--color-surface-light)',
    borderRadius: 20, 
    padding: 18, 
    marginBottom: 12, 
    gap: 14,
    borderWidth: 1,
    borderColor: 'var(--color-border)',
  },
  leadInfo: { flex: 1 },
  schoolName: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: 'var(--color-text-primary)',
    fontFamily: 'Poppins'
  },
  leadMeta: { 
    fontSize: 13, 
    color: 'var(--color-text-secondary)', 
    marginTop: 4,
    fontFamily: 'Poppins'
  },
  stagePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  stagePillText: { fontSize: 12, fontWeight: '700', fontFamily: 'Poppins' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingVertical: 20 },
  pageBtn: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 12, 
    backgroundColor: 'var(--color-surface-light)',
    borderWidth: 1,
    borderColor: 'var(--color-border)',
  },
  pageBtnDisabled: { opacity: 0.3 },
  pageBtnText: { color: 'var(--color-text-primary)', fontSize: 14, fontWeight: '600', fontFamily: 'Poppins' },
  pageInfo: { color: 'var(--color-text-secondary)', fontSize: 14, fontFamily: 'Poppins' },
});
