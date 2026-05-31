'use client';

import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import { API_ROUTES } from '@/lib/constants';

interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ visible, onClose }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccess('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async () => {
    setError('');
    setSuccess('');

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API_ROUTES.AUTH_CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to change password');
        return;
      }

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [currentPassword, newPassword, confirmPassword, handleClose]);

  if (!visible) return null;

  // @ts-ignore
  const fixedStyle: any = { position: 'fixed', top: 0, bottom: 0, left: 0, right: 0, zIndex: 9999 };

  return (
    <View style={[styles.overlay, fixedStyle]}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Change Password</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            placeholderTextColor="#64748b"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            placeholderTextColor="#64748b"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm New Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            placeholderTextColor="#64748b"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Update Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
//test
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modal: {
    width: '90%' as unknown as number,
    maxWidth: 440,
    backgroundColor: 'var(--color-surface-light)',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'var(--color-border)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'var(--color-text-primary)',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'var(--color-border)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: 'var(--color-text-secondary)',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 13,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: '#22c55e',
    fontSize: 13,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'var(--color-text-secondary)',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: 'var(--color-border)',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: 'var(--color-text-primary)',
    backgroundColor: 'var(--color-surface)',
  },
  submitBtn: {
    height: 48,
    backgroundColor: '#E24E59',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#E24E59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
    backgroundColor: '#94a3b8',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
