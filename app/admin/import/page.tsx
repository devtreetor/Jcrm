'use client';

import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { API_ROUTES } from '@/lib/constants';
import { useToast } from '@/lib/toast/ToastContext';
import type { ImportRowError } from '@/types/team.types';

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceEvent, setSourceEvent] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
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
    }
  }, []);

  const handleUpload = async () => {
    if (!file) {
      showToast('Please select a CSV or XLSX file', 'error');
      return;
    }

    try {
      setLoading(true);
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
      showToast('Import complete! Your leads have been uploaded successfully.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Import Leads</Text>
      <Text style={styles.subtitle}>Upload a CSV or XLSX file with school lead data</Text>


      <View style={styles.formCard}>
        <Text style={styles.label}>Source Event (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Education Expo 2024"
          placeholderTextColor="#64748b"
          value={sourceEvent}
          onChangeText={setSourceEvent}
        />

        <Text style={styles.label}>CSV / XLSX File</Text>
        <View style={styles.fileInputWrapper}>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
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
              {file ? file.name : 'Choose CSV or XLSX file...'}
            </Text>
          </View>
        </View>

        <View style={styles.formatInfo}>
          <Text style={styles.formatTitle}>Required columns:</Text>
          <Text style={styles.formatText}>school_name (required), location, city, state, board, principal_name, principal_phone, chairman_name, chairman_phone</Text>
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
  scroll: { flex: 1, backgroundColor: 'var(--color-surface)' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: 'var(--color-text-primary)', 
    marginBottom: 6,
    fontFamily: 'Montserrat'
  },
  subtitle: { 
    fontSize: 15, 
    color: 'var(--color-text-secondary)', 
    marginBottom: 24,
    fontFamily: 'Poppins'
  },
  errorBox: { 
    backgroundColor: 'rgba(226,78,89,0.1)', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(226,78,89,0.2)',
  },
  errorText: { color: 'var(--color-primary)', fontSize: 14, fontFamily: 'Poppins' },
  formCard: { 
    backgroundColor: 'var(--color-surface-light)', 
    borderRadius: 24, 
    padding: 24, 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'var(--color-border)',
  },
  label: { 
    fontSize: 14, 
    color: 'var(--color-text-secondary)', 
    marginBottom: 10,
    fontWeight: '600',
    fontFamily: 'Poppins'
  },
  input: {
    height: 54, 
    borderWidth: 1, 
    borderColor: 'var(--color-border)', 
    borderRadius: 14,
    paddingHorizontal: 16, 
    fontSize: 16, 
    color: 'var(--color-text-primary)', 
    backgroundColor: 'var(--color-surface)', 
    marginBottom: 20,
    fontFamily: 'Poppins',
  },
  fileInputWrapper: { position: 'relative', marginBottom: 20 },
  fileDisplay: {
    flexDirection: 'row', 
    alignItems: 'center', 
    height: 54,
    borderWidth: 1, 
    borderColor: 'var(--color-border)', 
    borderRadius: 14,
    paddingHorizontal: 16, 
    backgroundColor: 'var(--color-surface)', 
    gap: 12,
    borderStyle: 'dashed',
  },
  fileIcon: { fontSize: 20 },
  fileText: { fontSize: 15, color: 'var(--color-text-secondary)', fontFamily: 'Poppins' },
  formatInfo: { 
    backgroundColor: 'var(--color-surface)', 
    borderRadius: 14, 
    padding: 16, 
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'var(--color-border)',
  },
  formatTitle: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: 'var(--color-secondary)', 
    marginBottom: 6,
    fontFamily: 'Montserrat'
  },
  formatText: { 
    fontSize: 13, 
    color: 'var(--color-text-secondary)', 
    marginBottom: 6, 
    fontFamily: 'Poppins',
    lineHeight: 18,
  },
  formatNote: { 
    fontSize: 13, 
    color: 'var(--color-accent)', 
    fontWeight: '600',
    fontFamily: 'Poppins'
  },
  uploadBtn: { 
    backgroundColor: 'var(--color-primary)', 
    borderRadius: 16, 
    padding: 18, 
    alignItems: 'center', 
    minHeight: 56,
    shadowColor: 'var(--color-primary)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 17, fontFamily: 'Poppins' },
  resultCard: { 
    backgroundColor: 'var(--color-surface-light)', 
    borderRadius: 24, 
    padding: 24,
    borderWidth: 1,
    borderColor: 'var(--color-border)',
  },
  resultTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: 'var(--color-text-primary)', 
    marginBottom: 20,
    fontFamily: 'Montserrat'
  },
  resultRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  resultStat: { 
    flex: 1, 
    alignItems: 'center', 
    backgroundColor: 'var(--color-surface)', 
    borderRadius: 16, 
    padding: 16,
    borderWidth: 1,
    borderColor: 'var(--color-border)',
  },
  resultValue: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: 'var(--color-text-primary)',
    fontFamily: 'Poppins'
  },
  resultLabel: { 
    fontSize: 12, 
    color: 'var(--color-text-secondary)', 
    marginTop: 4,
    fontWeight: '600',
    fontFamily: 'Poppins',
    textTransform: 'uppercase',
  },
  errorsSection: { borderTopWidth: 1, borderTopColor: 'var(--color-border)', paddingTop: 20 },
  errorsTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: 'var(--color-primary)', 
    marginBottom: 12,
    fontFamily: 'Montserrat'
  },
  errorRow: { 
    flexDirection: 'row', 
    paddingVertical: 8, 
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  errorRowNum: { 
    fontSize: 13, 
    color: 'var(--color-accent)', 
    fontWeight: '700', 
    width: 60,
    fontFamily: 'Poppins'
  },
  errorReason: { 
    fontSize: 13, 
    color: 'var(--color-text-secondary)', 
    flex: 1,
    fontFamily: 'Poppins'
  },
  moreErrors: { 
    fontSize: 13, 
    color: 'var(--color-text-muted)', 
    marginTop: 12, 
    fontStyle: 'italic',
    fontFamily: 'Poppins'
  },
});
