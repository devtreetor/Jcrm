'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Pressable,
} from 'react-native';
import { useRouter } from 'next/navigation';
import { API_ROUTES, LEAD_STAGES, STAGE_LABELS, STAGE_COLORS } from '@/lib/constants';
import type { Lead, LeadStage } from '@/types/lead.types';

export default function AdminLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('adminLeadsSearch') || '';
    return '';
  });
  const [stageFilter, setStageFilter] = useState<LeadStage | ''>(() => {
    if (typeof window !== 'undefined') return (sessionStorage.getItem('adminLeadsStage') as LeadStage) || '';
    return '';
  });
  const [page, setPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('adminLeadsPage');
      return saved ? parseInt(saved, 10) : 1;
    }
    return 1;
  });
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectMode, setSelectMode] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (stageFilter) params.set('stage', stageFilter);

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
  }, [page, search, stageFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('adminLeadsSearch', search);
      sessionStorage.setItem('adminLeadsStage', stageFilter);
      sessionStorage.setItem('adminLeadsPage', page.toString());
    }
  }, [search, stageFilter, page]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLongPress = (id: string) => {
    setSelectMode(true);
    setSelectedIds(new Set([id]));
  };

  const renderLead = ({ item }: { item: Lead }) => (
    <Pressable
      onPress={() => {
        if (selectMode) {
          toggleSelect(item.id);
        } else {
          router.push(`/admin/leads/${item.id}`);
        }
      }}
      onLongPress={() => handleLongPress(item.id)}
      style={[styles.leadCard, selectedIds.has(item.id) && styles.leadCardSelected]}
    >
      {selectMode && (
        <View style={[styles.checkbox, selectedIds.has(item.id) && styles.checkboxChecked]}>
          {selectedIds.has(item.id) && <Text style={styles.checkmark}>✓</Text>}
        </View>
      )}
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
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Leads ({count})</Text>
        {selectMode && (
          <TouchableOpacity onPress={() => { setSelectMode(false); setSelectedIds(new Set()); }}>
            <Text style={styles.cancelSelect}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="Search schools..."
        placeholderTextColor="#64748b"
        value={search}
        onChangeText={(t) => { setSearch(t); setPage(1); }}
      />

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

      {error ? (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      ) : null}

      {loading ? (
        <View style={styles.loaderContainer}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      ) : leads.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏫</Text>
          <Text style={styles.emptyTitle}>No leads found</Text>
          <Text style={styles.emptyMessage}>Try adjusting your filters or import new leads</Text>
          <TouchableOpacity style={styles.emptyCta} onPress={() => router.push('/admin/import')}>
            <Text style={styles.emptyCtaText}>Import CSV</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={leads}
            renderItem={renderLead}
            keyExtractor={(item) => item.id}
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
  container: { flex: 1, backgroundColor: '#0b1120', padding: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc', fontFamily: 'Montserrat' },
  cancelSelect: { fontSize: 14, color: '#E24E59', fontWeight: '600' },
  searchInput: {
    height: 52, 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.1)', 
    borderRadius: 14,
    paddingHorizontal: 16, 
    fontSize: 15, 
    color: '#f8fafc', 
    backgroundColor: '#171f2f', 
    marginBottom: 16,
    fontFamily: 'Poppins',
  },
  filterRow: { flexDirection: 'row', marginBottom: 20 },
  filterPill: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    backgroundColor: '#171f2f', 
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  filterPillActive: { backgroundColor: '#1270E3', borderColor: '#1270E3' },
  filterPillText: { fontSize: 13, color: '#94a3b8', fontWeight: '600', fontFamily: 'Poppins' },
  filterPillTextActive: { color: '#ffffff' },
  errorBox: { 
    backgroundColor: 'rgba(226,78,89,0.1)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,78,89,0.2)',
  },
  errorText: { color: '#E24E59', fontSize: 14, fontFamily: 'Poppins' },
  loaderContainer: { gap: 12 },
  skeletonCard: {
    height: 80,
    backgroundColor: '#171f2f',
    borderRadius: 20,
    opacity: 0.5,
  },
  loader: { marginTop: 48 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 64 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#f8fafc', marginBottom: 8, fontFamily: 'Montserrat' },
  emptyMessage: { fontSize: 15, color: '#94a3b8', textAlign: 'center', marginBottom: 24, fontFamily: 'Poppins' },
  emptyCta: { backgroundColor: '#E24E59', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  emptyCtaText: { color: '#fff', fontWeight: '700', fontSize: 16, fontFamily: 'Poppins' },
  list: { flex: 1 },
  listContent: { paddingBottom: 20 },
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
  leadCardSelected: { borderColor: '#1270E3', borderWidth: 2 },
  checkbox: { 
    width: 24, 
    height: 24, 
    borderRadius: 8, 
    borderWidth: 2, 
    borderColor: 'rgba(255, 255, 255, 0.2)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  checkboxChecked: { backgroundColor: '#1270E3', borderColor: '#1270E3' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '800' },
  leadInfo: { flex: 1 },
  schoolName: { fontSize: 17, fontWeight: '700', color: '#f8fafc', fontFamily: 'Poppins' },
  leadMeta: { fontSize: 13, color: '#94a3b8', marginTop: 4, fontFamily: 'Poppins' },
  stagePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  stagePillText: { fontSize: 12, fontWeight: '700', fontFamily: 'Poppins' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingVertical: 20 },
  pageBtn: { 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 12, 
    backgroundColor: '#171f2f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  pageBtnDisabled: { opacity: 0.3 },
  pageBtnText: { color: '#f8fafc', fontSize: 14, fontWeight: '600', fontFamily: 'Poppins' },
  pageInfo: { color: '#94a3b8', fontSize: 14, fontFamily: 'Poppins' },
});
