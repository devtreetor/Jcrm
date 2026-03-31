'use client';

import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { API_ROUTES } from '@/lib/constants';
import type { ImportRowError } from '@/types/team.types';

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceEvent, setSourceEvent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{
    batch_id: string;
    total: number;
    imported: number;
    errors: ImportRowError[];
  } | null>(null);

  const getToken = () => localStorage.getItem('token') || '';

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError('');
    }
  }, []);

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const formData = new FormData();
      formData.append('file', file);
      if (sourceEvent.trim()) {
        formData.append('source_event', sourceEvent.trim());
      }

      const res = await fetch(API_ROUTES.LEADS_IMPORT, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setResult(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Import Leads</Text>
      <Text style={styles.subtitle}>Upload a CSV file with school lead data</Text>

      {error ? (
        <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>
      ) : null}

      <View style={styles.formCard}>
        <Text style={styles.label}>Source Event (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Education Expo 2024"
          placeholderTextColor="#64748b"
          value={sourceEvent}
          onChangeText={setSourceEvent}
        />

        <Text style={styles.label}>CSV File</Text>
        <View style={styles.fileInputWrapper}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{
              width: '100%',
              height: 48,
              cursor: 'pointer',
              opacity: 0.01,
              position: 'absolute',
              zIndex: 2,
            }}
          />
          <View style={styles.fileDisplay}>
            <Text style={styles.fileIcon}>📄</Text>
            <Text style={styles.fileText}>
              {file ? file.name : 'Choose CSV file...'}
            </Text>
          </View>
        </View>

        <View style={styles.formatInfo}>
          <Text style={styles.formatTitle}>Required columns:</Text>
          <Text style={styles.formatText}>school_name (required), location, city, state, board, principal_phone, chairman_phone</Text>
          <Text style={styles.formatNote}>Max 777 rows per import</Text>
        </View>

        <TouchableOpacity
          style={[styles.uploadBtn, loading && styles.uploadBtnDisabled]}
          onPress={handleUpload}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.uploadBtnText}>Upload & Import</Text>
          )}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Import Complete</Text>
          <View style={styles.resultRow}>
            <View style={styles.resultStat}>
              <Text style={styles.resultValue}>{result.total}</Text>
              <Text style={styles.resultLabel}>Total Rows</Text>
            </View>
            <View style={styles.resultStat}>
              <Text style={[styles.resultValue, { color: '#22c55e' }]}>{result.imported}</Text>
              <Text style={styles.resultLabel}>Imported</Text>
            </View>
            <View style={styles.resultStat}>
              <Text style={[styles.resultValue, { color: result.errors.length > 0 ? '#ef4444' : '#22c55e' }]}>
                {result.errors.length}
              </Text>
              <Text style={styles.resultLabel}>Errors</Text>
            </View>
          </View>

          {result.errors.length > 0 && (
            <View style={styles.errorsSection}>
              <Text style={styles.errorsTitle}>Errors:</Text>
              {result.errors.slice(0, 20).map((e, idx) => (
                <View key={idx} style={styles.errorRow}>
                  <Text style={styles.errorRowNum}>Row {e.row}</Text>
                  <Text style={styles.errorReason}>{e.reason}</Text>
                </View>
              ))}
              {result.errors.length > 20 && (
                <Text style={styles.moreErrors}>
                  ...and {result.errors.length - 20} more errors
                </Text>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 16 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 14 },
  formCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  input: {
    height: 48, borderWidth: 1, borderColor: '#334155', borderRadius: 10,
    paddingHorizontal: 16, fontSize: 15, color: '#f8fafc', backgroundColor: '#0f172a', marginBottom: 16,
  },
  fileInputWrapper: { position: 'relative', marginBottom: 16 },
  fileDisplay: {
    flexDirection: 'row', alignItems: 'center', height: 48,
    borderWidth: 1, borderColor: '#334155', borderRadius: 10,
    paddingHorizontal: 16, backgroundColor: '#0f172a', gap: 8,
    borderStyle: 'dashed',
  },
  fileIcon: { fontSize: 18 },
  fileText: { fontSize: 14, color: '#94a3b8' },
  formatInfo: { backgroundColor: '#0f172a', borderRadius: 8, padding: 12, marginBottom: 16 },
  formatTitle: { fontSize: 13, fontWeight: '600', color: '#60a5fa', marginBottom: 4 },
  formatText: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  formatNote: { fontSize: 12, color: '#f59e0b' },
  uploadBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center', minHeight: 48 },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  resultCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16 },
  resultTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc', marginBottom: 16 },
  resultRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  resultStat: { flex: 1, alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 8, padding: 12 },
  resultValue: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  resultLabel: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  errorsSection: { borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12 },
  errorsTitle: { fontSize: 14, fontWeight: '600', color: '#ef4444', marginBottom: 8 },
  errorRow: { flexDirection: 'row', paddingVertical: 4, gap: 12 },
  errorRowNum: { fontSize: 12, color: '#f59e0b', fontWeight: '600', width: 50 },
  errorReason: { fontSize: 12, color: '#94a3b8', flex: 1 },
  moreErrors: { fontSize: 12, color: '#64748b', marginTop: 8, fontStyle: 'italic' },
});
