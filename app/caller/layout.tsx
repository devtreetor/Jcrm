'use client';

import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants';
import ChangePasswordModal from '@/app/components/ChangePasswordModal';

const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.CALLER_DASHBOARD, icon: '📊' },
  { label: 'My Leads', path: ROUTES.CALLER_LEADS, icon: '🏫' },
];

export default function CallerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'brand'>('brand');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json && json.data) {
          setNotifications(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [pathname]);

  const handleNotificationClick = async (notif: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: notif.id }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
        setShowNotifications(false);
        router.push(`/caller/leads/${notif.lead_id}`);
      }
    } catch (err) {
      console.error('Failed to click notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ all: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
        if (user.role !== 'caller') {
          router.push('/login');
          return;
        }
        setUserName(user.full_name || 'Sales Executive');
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
            <Text style={styles.roleBadgeText}>Sales Executive</Text>
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

          <TouchableOpacity 
            style={styles.bellBtn} 
            onPress={() => setShowNotifications(!showNotifications)}
            activeOpacity={0.7}
          >
            <Text style={styles.bellIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

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

      {showNotifications && (
        <View style={styles.notificationsDropdown}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={handleMarkAllRead}>
                <Text style={styles.markAllReadText}>Mark all read</Text>
              </TouchableOpacity>
            )}
          </View>
          <ScrollView style={styles.dropdownList} nestedScrollEnabled>
            {notifications.length === 0 ? (
              <Text style={styles.emptyNotificationText}>No notifications yet</Text>
            ) : (
              notifications.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.notificationItem, !n.is_read && styles.notificationItemUnread]}
                  onPress={() => handleNotificationClick(n)}
                >
                  <Text style={styles.notificationText}>{n.message}</Text>
                  <Text style={styles.notificationTime}>
                    {new Date(n.created_at).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

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
    backgroundColor: 'rgba(18, 112, 227, 0.15)',
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
  bellBtn: {
    position: 'relative',
    padding: 6,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 18,
  },
  bellBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: 'var(--color-primary)',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
  },
  notificationsDropdown: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 320,
    maxHeight: 400,
    backgroundColor: 'var(--color-surface-light)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'var(--color-border)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    zIndex: 999,
    padding: 16,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'var(--color-border)',
    paddingBottom: 8,
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'var(--color-text-primary)',
    fontFamily: 'Montserrat',
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'var(--color-secondary)',
    fontFamily: 'Poppins',
  },
  dropdownList: {
    maxHeight: 300,
  },
  notificationItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'var(--color-border)',
  },
  notificationItemUnread: {
    backgroundColor: 'rgba(237, 82, 81, 0.05)',
  },
  notificationText: {
    fontSize: 12,
    color: 'var(--color-text-primary)',
    fontFamily: 'Poppins',
    lineHeight: 16,
  },
  notificationTime: {
    fontSize: 10,
    color: 'var(--color-text-muted)',
    fontFamily: 'Poppins',
    marginTop: 4,
  },
  emptyNotificationText: {
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: 13,
    fontFamily: 'Poppins',
    paddingVertical: 20,
  },
});
