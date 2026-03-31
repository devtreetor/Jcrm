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
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | ''>('');
  const [page, setPage] = useState(1);
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
        <ActivityIndicator color="#60a5fa" size="large" style={styles.loader} />
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
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  cancelSelect: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
  searchInput: {
    height: 48, borderWidth: 1, borderColor: '#334155', borderRadius: 10,
    paddingHorizontal: 16, fontSize: 15, color: '#f8fafc', backgroundColor: '#1e293b', marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', marginBottom: 16 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', marginRight: 6 },
  filterPillActive: { backgroundColor: '#2563eb' },
  filterPillText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  filterPillTextActive: { color: '#ffffff' },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 14 },
  loader: { marginTop: 48 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingTop: 64 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#f8fafc', marginBottom: 4 },
  emptyMessage: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  emptyCta: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyCtaText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  list: { flex: 1 },
  listContent: { paddingBottom: 16 },
  leadCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b',
    borderRadius: 10, padding: 14, marginBottom: 8, gap: 12,
  },
  leadCardSelected: { borderWidth: 1, borderColor: '#2563eb' },
  checkbox: { width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#475569', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  checkmark: { color: '#fff', fontSize: 13, fontWeight: '700' },
  leadInfo: { flex: 1 },
  schoolName: { fontSize: 15, fontWeight: '600', color: '#f8fafc' },
  leadMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  stagePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stagePillText: { fontSize: 11, fontWeight: '600' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, paddingVertical: 12 },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e293b' },
  pageBtnDisabled: { opacity: 0.4 },
  pageBtnText: { color: '#cbd5e1', fontSize: 13, fontWeight: '500' },
  pageInfo: { color: '#94a3b8', fontSize: 13 },
});
