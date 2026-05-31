'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import ChangePasswordModal from '@/app/components/ChangePasswordModal';

const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.ADMIN_DASHBOARD, icon: '📊' },
  { label: 'Leads', path: ROUTES.ADMIN_LEADS, icon: '🏫' },
  { label: 'Users', path: ROUTES.ADMIN_USERS, icon: '👥' },
  { label: 'Import', path: ROUTES.ADMIN_IMPORT, icon: '📥' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'brand'>('brand');

  useEffect(() => {
    try {
      const savedTheme = (localStorage.getItem('theme') as 'dark' | 'light' | 'brand') || 'brand';
      setTheme(savedTheme);
      const root = window.document.documentElement;
      root.classList.remove('theme-dark', 'theme-light', 'theme-brand');
      root.classList.add(`theme-${savedTheme}`);

      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role !== 'admin') {
          router.push('/login');
          return;
        }
        setUserName(user.full_name || 'Admin');
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

  const toggleTheme = (newTheme: 'dark' | 'light' | 'brand') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    const root = window.document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-brand');
    root.classList.add(`theme-${newTheme}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'supabase-auth-token=; path=/; max-age=0';
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logoText}>Jigyasu</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Admin</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.themeRow}>
            <TouchableOpacity 
              style={[styles.themeChip, theme === 'light' && styles.themeChipActive]} 
              onPress={() => toggleTheme('light')}
              activeOpacity={0.7}
            >
              <Text style={styles.themeIcon}>☀️</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.themeChip, theme === 'dark' && styles.themeChipActive]} 
              onPress={() => toggleTheme('dark')}
              activeOpacity={0.7}
            >
              <Text style={styles.themeIcon}>🌙</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.themeChip, theme === 'brand' && styles.themeChipActive]} 
              onPress={() => toggleTheme('brand')}
              activeOpacity={0.7}
            >
              <Text style={styles.themeIcon}>🎓</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userName}</Text>
          <TouchableOpacity style={styles.changePwdBtn} onPress={() => setShowChangePassword(true)}>
            <Text style={styles.changePwdText}>🔒 Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <TouchableOpacity
              key={item.path}
              style={[styles.navItem, isActive && styles.navItemActive]}
              onPress={() => router.push(item.path)}
              activeOpacity={0.7}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.content}>{children}</View>

      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh' as unknown as number,
    backgroundColor: 'var(--color-surface)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'var(--color-surface-light)',
    borderBottomWidth: 1,
    borderBottomColor: 'var(--color-border)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'var(--color-primary)',
  },
  roleBadge: {
    backgroundColor: 'rgba(18, 112, 227, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'var(--color-secondary)',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    fontSize: 14,
    color: 'var(--color-text-primary)',
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  logoutText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
  },
  changePwdBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(18, 112, 227, 0.15)',
  },
  changePwdText: {
    fontSize: 13,
    color: 'var(--color-secondary)',
    fontWeight: '500',
  },
  nav: {
    flexDirection: 'row',
    backgroundColor: 'var(--color-surface-light)',
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 4,
  },
  navItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  navItemActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
  },
  navIcon: {
    fontSize: 16,
  },
  navLabel: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    fontWeight: '500',
  },
  navLabelActive: {
    color: 'var(--color-secondary)',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  themeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 2,
    marginRight: 4,
  },
  themeChip: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeChipActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  themeIcon: {
    fontSize: 14,
  },
});
