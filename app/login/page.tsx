'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { useRouter } from 'next/navigation';
import { API_ROUTES, ROUTES } from '@/lib/constants';
import type { UserRole } from '@/types/user.types';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') || 'brand';
      const root = window.document.documentElement;
      root.classList.remove('theme-dark', 'theme-light', 'theme-brand');
      root.classList.add(`theme-${savedTheme}`);

      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          const parts = token.split('.');
          let isExpired = false;
          if (parts.length === 3) {
            const payload = JSON.parse(window.atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            if (payload.exp) {
              const now = Math.floor(Date.now() / 1000);
              isExpired = payload.exp < now;
            }
          } else {
            isExpired = true;
          }

          if (isExpired) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            document.cookie = 'supabase-auth-token=; path=/; max-age=0';
          } else {
            const user = JSON.parse(storedUser);
            const role = user.role as UserRole;
            if (role === 'admin') {
              router.push(ROUTES.ADMIN_DASHBOARD);
            } else if (role === 'team_lead') {
              router.push(ROUTES.TL_DASHBOARD);
            } else {
              router.push(ROUTES.CALLER_DASHBOARD);
            }
          }
        } catch (e) {
          console.error('Failed to parse auto-login details:', e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          document.cookie = 'supabase-auth-token=; path=/; max-age=0';
        }
      }
    }
  }, [router]);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(API_ROUTES.AUTH_LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password, remember_me: rememberMe }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Login failed');
        return;
      }

      const { token, user } = json.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      const role = user.role as UserRole;
      if (role === 'admin') {
        router.push(ROUTES.ADMIN_DASHBOARD);
      } else if (role === 'team_lead') {
        router.push(ROUTES.TL_DASHBOARD);
      } else {
        router.push(ROUTES.CALLER_DASHBOARD);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [email, password, rememberMe, router]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoJ}>J!</Text>
          <Text style={styles.logoText}>gyasu</Text>
        </View>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue to Jigyasu</Text>

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            placeholderTextColor="#64748b"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#64748b"
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.rememberRow}
          onPress={() => setRememberMe(!rememberMe)}
          activeOpacity={0.8}
        >
          <Switch
            value={rememberMe}
            onValueChange={setRememberMe}
            trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(226,78,89,0.4)' }}
            thumbColor={rememberMe ? '#E24E59' : '#64748b'}
          />
          <Text style={styles.rememberLabel}>Keep me logged in for a week</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh' as unknown as number,
    padding: 16,
    backgroundColor: 'var(--color-surface)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 40,
    backgroundColor: 'var(--color-surface-light)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'var(--color-border)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 32,
    elevation: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 32,
  },
  logoJ: {
    fontSize: 42,
    fontWeight: '800',
    color: 'var(--color-primary)',
    fontFamily: 'Montserrat',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    fontFamily: 'Montserrat',
    marginLeft: -2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Montserrat',
  },
  subtitle: {
    fontSize: 16,
    color: 'var(--color-text-secondary)',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Poppins',
  },
  errorContainer: {
    backgroundColor: 'rgba(226, 78, 89, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(226, 78, 89, 0.3)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    color: 'var(--color-primary)',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Poppins',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'var(--color-text-primary)',
    marginBottom: 8,
    fontFamily: 'Poppins',
  },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: 'var(--color-border)',
    borderRadius: 14,
    paddingHorizontal: 20,
    fontSize: 16,
    color: 'var(--color-text-primary)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    fontFamily: 'Poppins',
  },
  button: {
    height: 56,
    backgroundColor: 'var(--color-primary)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: 'var(--color-primary)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
    backgroundColor: 'var(--color-text-muted)',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'Poppins',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    marginTop: 4,
  },
  rememberLabel: {
    fontSize: 14,
    color: 'var(--color-text-secondary)',
    fontFamily: 'Poppins',
  },
});
