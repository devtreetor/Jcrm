'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { API_ROUTES, ROLE_LABELS } from '@/lib/constants';
import type { User, UserRole } from '@/types/user.types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('caller');
  const [formTlId, setFormTlId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const getToken = () => localStorage.getItem('token') || '';

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ROUTES.USERS, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const body: Record<string, unknown> = {
        full_name: formName,
        email: formEmail,
        role: formRole,
      };
      if (formRole === 'caller' && formTlId) {
        body.team_lead_id = formTlId;
      }
      const res = await fetch(API_ROUTES.USERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess(`User created! Temp password: ${json.data.temp_password}`);
      setShowForm(false);
      setFormName('');
      setFormEmail('');
      setFormRole('caller');
      setFormTlId('');
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (user: User) => {
    try {
      setError('');
      const res = await fetch(`${API_ROUTES.USERS}/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    }
  };

  const teamLeads = users.filter((u) => u.role === 'team_lead' && u.is_active);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Users ({users.length})</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(!showForm)}>
          <Text style={styles.addBtnText}>{showForm ? 'Cancel' : '+ Add User'}</Text>
        </TouchableOpacity>
      </View>

      {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
      {success ? <View style={styles.successBox}><Text style={styles.successText}>{success}</Text></View> : null}

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Create New User</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#64748b"
            value={formName}
            onChangeText={setFormName}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#64748b"
            value={formEmail}
            onChangeText={setFormEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.dropdownLabel}>Role</Text>
          <View style={styles.roleRow}>
            {(['admin', 'team_lead', 'caller'] as UserRole[]).map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleChip, formRole === r && styles.roleChipActive]}
                onPress={() => setFormRole(r)}
              >
                <Text style={[styles.roleChipText, formRole === r && styles.roleChipTextActive]}>
                  {ROLE_LABELS[r]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {formRole === 'caller' && (
            <>
              <Text style={styles.dropdownLabel}>Team Lead</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tlRow}>
                {teamLeads.map((tl) => (
                  <TouchableOpacity
                    key={tl.id}
                    style={[styles.roleChip, formTlId === tl.id && styles.roleChipActive]}
                    onPress={() => setFormTlId(tl.id)}
                  >
                    <Text style={[styles.roleChipText, formTlId === tl.id && styles.roleChipTextActive]}>
                      {tl.full_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleCreate}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Create User</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color="#60a5fa" size="large" style={styles.loader} />
      ) : (
        users.map((user) => (
          <View key={user.id} style={[styles.userCard, !user.is_active && styles.userCardInactive]}>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.full_name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
            <View style={styles.userActions}>
              <View style={[styles.roleBadge, { backgroundColor: user.role === 'admin' ? '#2563eb20' : user.role === 'team_lead' ? '#a78bfa20' : '#22c55e20' }]}>
                <Text style={[styles.roleBadgeText, { color: user.role === 'admin' ? '#60a5fa' : user.role === 'team_lead' ? '#a78bfa' : '#22c55e' }]}>
                  {ROLE_LABELS[user.role]}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, user.is_active ? styles.toggleBtnActive : styles.toggleBtnInactive]}
                onPress={() => toggleActive(user)}
              >
                <Text style={styles.toggleText}>{user.is_active ? 'Active' : 'Inactive'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  addBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  errorBox: { backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorText: { color: '#ef4444', fontSize: 14 },
  successBox: { backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 8, padding: 12, marginBottom: 12 },
  successText: { color: '#22c55e', fontSize: 14 },
  formCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 },
  formTitle: { fontSize: 16, fontWeight: '600', color: '#f8fafc', marginBottom: 12 },
  input: {
    height: 48, borderWidth: 1, borderColor: '#334155', borderRadius: 10,
    paddingHorizontal: 16, fontSize: 15, color: '#f8fafc', backgroundColor: '#0f172a', marginBottom: 12,
  },
  dropdownLabel: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  roleChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#0f172a' },
  roleChipActive: { backgroundColor: '#2563eb' },
  roleChipText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  roleChipTextActive: { color: '#ffffff' },
  tlRow: { flexDirection: 'row', marginBottom: 12 },
  submitBtn: { backgroundColor: '#2563eb', borderRadius: 10, padding: 14, alignItems: 'center', minHeight: 48 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  loader: { marginTop: 48 },
  userCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#1e293b', borderRadius: 10, padding: 14, marginBottom: 8,
  },
  userCardInactive: { opacity: 0.5 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '600', color: '#f8fafc' },
  userEmail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  userActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  roleBadgeText: { fontSize: 11, fontWeight: '600' },
  toggleBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  toggleBtnActive: { backgroundColor: 'rgba(34,197,94,0.15)' },
  toggleBtnInactive: { backgroundColor: 'rgba(239,68,68,0.15)' },
  toggleText: { fontSize: 11, fontWeight: '600', color: '#cbd5e1' },
});
