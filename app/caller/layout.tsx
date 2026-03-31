'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.CALLER_DASHBOARD, icon: '📊' },
  { label: 'My Leads', path: ROUTES.CALLER_LEADS, icon: '🏫' },
];

export default function CallerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.role !== 'caller') {
          router.push('/login');
          return;
        }
        setUserName(user.full_name || 'Caller');
      } else {
        router.push('/login');
      }
    } catch {
      router.push('/login');
    }
  }, [router]);

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
            <Text style={styles.roleBadgeText}>Caller</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.userName}>{userName}</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: '100vh' as unknown as number,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E24E59',
  },
  roleBadge: {
    backgroundColor: 'rgba(18, 112, 227, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1270E3',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    fontSize: 14,
    color: '#cbd5e1',
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
  nav: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
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
    backgroundColor: 'rgba(18, 112, 227, 0.15)',
  },
  navIcon: {
    fontSize: 16,
  },
  navLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#1270E3',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
