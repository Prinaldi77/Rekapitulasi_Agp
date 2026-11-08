'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Avatar, Dropdown, Input, Badge, Button, LiveClock } from '@/components/ui';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Trophy, Clock, Tent, LayoutDashboard, Users, KeyRound, UserCheck,
  ClipboardList, Zap, FileText, Database, RefreshCw, Settings, ShieldAlert,
  User, LogOut, ChevronLeft, ChevronRight, Menu, Bell, Key, Crown, ArrowLeft, Home, X, Search
} from 'lucide-react';

interface UserProfile {
  username?: string;
  full_name?: string;
  role?: 'GRAND_MASTER' | 'OPERATOR' | 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP';
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const notificationRef = useRef<HTMLDivElement>(null);

  const isLoginPage = pathname === '/login';
  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agp_sidebar_collapsed') === 'true';
      setIsSidebarCollapsed(saved);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;

        let currentUser = session?.user ?? null;

        if (!currentUser && typeof window !== 'undefined') {
          const savedDevUser = localStorage.getItem('agp_dev_user');
          if (savedDevUser) {
            try {
              currentUser = JSON.parse(savedDevUser);
            } catch {
              currentUser = null;
            }
          }
        }

        setUser(currentUser);

        if (currentUser) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('username, full_name, role')
            .eq('id', currentUser.id)
            .maybeSingle();

          const metaRole = (currentUser as any).user_metadata?.role;
          const dbRole = profData?.role;
          const uname = (
            profData?.username ||
            (currentUser as any).user_metadata?.username ||
            currentUser.email?.split('@')[0] ||
            'operator'
          ).toLowerCase();

          let effectiveRole: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP' = 'OPERATOR_REKAP';
          if (
            uname === 'superadmin' ||
            uname === 'grandmaster' ||
            dbRole === 'GRAND_MASTER' ||
            metaRole === 'SUPER_ADMIN' ||
            metaRole === 'GRAND_MASTER'
          ) {
            effectiveRole = 'SUPER_ADMIN';
          } else if (uname === 'admin' || uname.includes('admin') || metaRole === 'ADMIN') {
            effectiveRole = 'ADMIN';
          }

          const defaultFullName =
            effectiveRole === 'SUPER_ADMIN'
              ? 'Sekretaris Utama AGP (Super Admin)'
              : effectiveRole === 'ADMIN'
                ? 'Pengelola Master Data (Admin)'
                : 'Operator Entri Nilai (PJ Rekap)';

          setProfile({
            username: uname,
            full_name: profData?.full_name || session?.user?.user_metadata?.full_name || defaultFullName,
            role: effectiveRole,
          });
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.warn('AppLayout auth check notice:', err);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('username, full_name, role')
            .eq('id', session.user.id)
            .maybeSingle();

          const metaRole = session.user.user_metadata?.role;
          const dbRole = profData?.role;
          const uname = (
            profData?.username ||
            session.user.user_metadata?.username ||
            session.user.email?.split('@')[0] ||
            'operator'
          ).toLowerCase();

          let effectiveRole: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP' = 'OPERATOR_REKAP';
          if (
            uname === 'superadmin' ||
            uname === 'grandmaster' ||
            dbRole === 'GRAND_MASTER' ||
            metaRole === 'SUPER_ADMIN' ||
            metaRole === 'GRAND_MASTER'
          ) {
            effectiveRole = 'SUPER_ADMIN';
          } else if (uname === 'admin' || uname.includes('admin') || metaRole === 'ADMIN') {
            effectiveRole = 'ADMIN';
          }

          const defaultFullName =
            effectiveRole === 'SUPER_ADMIN'
              ? 'Sekretaris Utama AGP (Super Admin)'
              : effectiveRole === 'ADMIN'
                ? 'Pengelola Master Data (Admin)'
                : 'Operator Entri Nilai (PJ Rekap)';

          setProfile({
            username: uname,
            full_name: profData?.full_name || session.user.user_metadata?.full_name || defaultFullName,
            role: effectiveRole,
          });
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.warn('AppLayout onAuthStateChange notice:', err);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Realtime Supabase notifications listener
  useEffect(() => {
    const channel = supabase
      .channel('realtime-app-notifications')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'schedules' },
        (payload: any) => {
          const newStatus = payload.new?.status;
          if (newStatus === 'NOW PERFORMING') {
            const newItem: NotificationItem = {
              id: String(Date.now()),
              title: 'Urutan Tampil Realtime',
              message: `Tim peserta baru saja dipanggil dan tampil di Arena Lapangan Utama!`,
              time: 'Baru saja',
              unread: true,
            };
            setNotifications((prev) => [newItem, ...prev.slice(0, 9)]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scores' },
        () => {
          if (user) {
            const newItem: NotificationItem = {
              id: String(Date.now()),
              title: 'Nilai Juri Masuk',
              message: `Rekap nilai baru dari Dewan Juri telah terisi ke sistem rekapitulasi.`,
              time: 'Baru saja',
              unread: true,
            };
            setNotifications((prev) => [newItem, ...prev.slice(0, 9)]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'baracks' },
        () => {
          const newItem: NotificationItem = {
            id: String(Date.now()),
            title: 'Update Ruang Transit',
            message: `Alokasi barak peserta diperbarui oleh Panitia Logistik.`,
            time: 'Baru saja',
            unread: true,
          };
          setNotifications((prev) => [newItem, ...prev.slice(0, 9)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoginPage) {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const toggleSidebar = () => {
    const nextState = !isSidebarCollapsed;
    setIsSidebarCollapsed(nextState);
    localStorage.setItem('agp_sidebar_collapsed', String(nextState));
  };

  const getBreadcrumbs = () => {
    if (!pathname) return [];
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((seg, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      let label = seg.toUpperCase();
      if (seg === 'admin') label = 'ADMIN PORTAL';
      else if (seg === 'score-entry') label = 'INPUT NILAI JURI';
      else if (seg === 'leaderboard') label = 'MASTER REKAP & SK';
      else if (seg === 'users') label = 'KELOLA PANITIA';
      else if (seg === 'schedule-manage') label = 'KELOLA JADWAL';
      else if (seg === 'barack-manage') label = 'KELOLA BARAK';
      else if (seg === 'live-score') label = 'PENGUMUMAN JUARA & SK';
      else if (seg === 'schedule') label = 'WAKTU & URUTAN TAMPIL';
      else if (seg === 'barack') label = 'LOKASI BARAK';
      return { label, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const publicLinks = [
    { label: 'Landing Page', href: '/', icon: <Home className="w-4 h-4" /> },
    { label: 'Waktu Tampil', href: '/schedule', icon: <Clock className="w-4 h-4" /> },
    { label: 'Lokasi Barak', href: '/barack', icon: <Tent className="w-4 h-4" /> },
    { label: 'Pengumuman Juara', href: '/live-score', icon: <Trophy className="w-4 h-4" /> },
  ];

  const superAdminLinks = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Input Nilai Juri', href: '/admin/score-entry', icon: <Zap className="w-4 h-4" /> },
    { label: 'Rekap & SK Juara', href: '/admin/leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { label: 'Kelola Jadwal', href: '/admin/schedule-manage', icon: <Clock className="w-4 h-4" /> },
    { label: 'Kelola Barak', href: '/admin/barack-manage', icon: <Tent className="w-4 h-4" /> },
    { label: 'Data Peserta', href: '/admin/participants', icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Kategori Penilaian', href: '/admin/categories', icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'User Management', href: '/admin/users', icon: <Users className="w-4 h-4" /> },
    { label: 'Role Management', href: '/admin/roles', icon: <KeyRound className="w-4 h-4" /> },
    { label: 'Audit Log', href: '/admin/audit-logs', icon: <ShieldAlert className="w-4 h-4" /> },
    { label: 'Backup Database', href: '/admin/backup', icon: <Database className="w-4 h-4" /> },
    { label: 'Restore Database', href: '/admin/restore', icon: <RefreshCw className="w-4 h-4" /> },
    { label: 'Pengaturan Sistem', href: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
    { label: 'Pratinjau Publik', href: '/live-score', icon: <FileText className="w-4 h-4" /> },
  ];

  const adminLinks = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Kelola Jadwal', href: '/admin/schedule-manage', icon: <Clock className="w-4 h-4" /> },
    { label: 'Kelola Barak', href: '/admin/barack-manage', icon: <Tent className="w-4 h-4" /> },
    { label: 'Data Peserta', href: '/admin/participants', icon: <UserCheck className="w-4 h-4" /> },
    { label: 'Kategori Penilaian', href: '/admin/categories', icon: <ClipboardList className="w-4 h-4" /> },
    { label: 'Input Nilai Juri', href: '/admin/score-entry', icon: <Zap className="w-4 h-4" /> },
    { label: 'Rekap & SK Juara', href: '/admin/leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { label: 'Operator Rekap', href: '/admin/operators', icon: <Users className="w-4 h-4" /> },
    { label: 'Pratinjau Publik', href: '/live-score', icon: <FileText className="w-4 h-4" /> },
  ];

  const operatorRekapLinks = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Input Nilai Juri', href: '/admin/score-entry', icon: <Zap className="w-4 h-4" /> },
    { label: 'Rekap & SK Juara', href: '/admin/leaderboard', icon: <Trophy className="w-4 h-4" /> },
    { label: 'Pratinjau Publik', href: '/live-score', icon: <FileText className="w-4 h-4" /> },
    { label: 'Profile', href: '/admin/profile', icon: <User className="w-4 h-4" /> },
  ];

  const getRole = () => {
    if (!profile) return 'PUBLIC';
    const roleStr = profile.role;
    if (roleStr === 'SUPER_ADMIN' || roleStr === 'GRAND_MASTER') return 'SUPER_ADMIN';
    if (roleStr === 'ADMIN') return 'ADMIN';
    return 'OPERATOR_REKAP';
  };

  const effectiveRole = getRole();

  const currentLinks = isAdminRoute
    ? (effectiveRole === 'SUPER_ADMIN' ? superAdminLinks : (effectiveRole === 'ADMIN' ? adminLinks : operatorRekapLinks))
    : publicLinks;

  const profileDropdownItems = [
    {
      label: profile?.full_name || 'User Profile',
      onClick: () => {},
      icon: <User className="w-4 h-4" />,
    },
    {
      label: 'Portal Admin',
      onClick: () => router.push('/admin'),
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      label: 'Logout Portal',
      onClick: handleLogout,
      icon: <LogOut className="w-4 h-4" />,
      danger: true,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, unread: false })));
  };

  // ============================================================================
  // PUBLIC WEB SHELL (/schedule, /barack, /live-score)
  // Clean Architectural Bar with Plus Jakarta Sans & JetBrains Mono
  // ============================================================================
  if (!isAdminRoute) {
    const arenaTabs = [
      { label: 'WAKTU TAMPIL', href: '/schedule', icon: <Clock className="w-4 h-4" /> },
      { label: 'LOKASI BARAK', href: '/barack', icon: <Tent className="w-4 h-4" /> },
      { label: 'PENGUMUMAN JUARA', href: '/live-score', icon: <Trophy className="w-4 h-4" /> },
    ];

    return (
      <div className="min-h-screen flex flex-col bg-[#07201B] text-[#FFFFFF] font-sans selection:bg-[#E3EF26] selection:text-[#0C342C] relative overflow-x-hidden">
        <a href="#main-content" className="skip-to-content">
          Lewati ke konten utama
        </a>

        {/* Minimalist Top Navigation Bar */}
        <header className="sticky top-0 z-50 bg-[#07201B]/95 border-b border-[#123E34] backdrop-blur-md px-4 sm:px-8 py-3.5">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-3">
            {/* Left: Brand Link */}
            <Link
              href="/"
              className="inline-flex items-center gap-3 py-1 px-2.5 rounded-lg hover:bg-[#0A2620] transition-colors shrink-0"
            >
              <img
                src="/kirani.svg"
                alt="Logo Kirani AGP"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold tracking-wider uppercase text-white">
                  KIRANI<span className="text-[#E3EF26]">.ARENA</span>
                </span>
                <span className="text-xs font-mono tracking-wider text-[#A7C7BE]">
                  PORTAL RESMI AGP
                </span>
              </div>
            </Link>

            {/* Center: Segmented Navigation Switcher with Framer Motion layoutId */}
            <nav
              className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-[#0A2620] border border-[#1E564A]"
              aria-label="Navigasi Arena Publik"
            >
              {arenaTabs.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-1.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors flex items-center gap-2 ${
                      isActive ? 'text-[#0C342C]' : 'text-[#C5E0D8] hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="arena-nav-pill"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-lg bg-[#E3EF26]"
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      {link.icon}
                      <span>{link.label}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2.5">
              <LiveClock className="hidden lg:inline-flex" />
              <a
                href="/Juklak_AGP_IV_SMKN1_Soreang.pdf"
                download="Juklak_Resmi_AGP_IV_SMKN1_Soreang.pdf"
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#0A2620] border border-[#1E564A] text-xs font-bold text-[#E3EF26] hover:bg-[#0E332B] hover:border-[#E3EF26] transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Unduh Juklak</span>
              </a>

              {user ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E3EF26] text-[#0C342C] text-xs font-bold hover:bg-[#d8e420] transition-colors shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard Panitia</span>
                </Link>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0A2620] border border-[#1E564A] text-xs font-semibold text-white hover:border-[#E3EF26] hover:text-[#E3EF26] transition-colors"
                >
                  <Home className="w-4 h-4 text-[#E3EF26]" />
                  <span>Beranda</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden max-w-[1360px] mx-auto mt-3 p-1 rounded-xl bg-[#0A2620] border border-[#1E564A] flex items-center justify-between gap-1 overflow-x-auto">
            {arenaTabs.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-[#E3EF26] text-[#0C342C]'
                      : 'text-[#C5E0D8] hover:text-white'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </header>

        {/* Main Public Content */}
        <main
          id="main-content"
          className="relative z-10 flex-1 w-full max-w-[1360px] mx-auto px-4 py-6 sm:px-8 sm:py-10"
        >
          {user && (
            <div className="mb-6 p-4 rounded-xl bg-[#0A2620] border border-[#E3EF26]/50 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0E332B] border border-[#E3EF26]/50 flex items-center justify-center text-[#E3EF26] shrink-0">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E3EF26]">
                    Sesi Panitia Aktif ({profile?.role || 'OPERATOR'})
                  </h4>
                  <p className="text-xs text-[#C5E0D8]">
                    Anda sedang memantau Portal Live Arena Publik. Klik tombol di samping untuk kembali ke Dashboard Panitia.
                  </p>
                </div>
              </div>
              <Link href="/admin">
                <Button variant="primary" size="sm" className="shrink-0 gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
                </Button>
              </Link>
            </div>
          )}

          {children}
        </main>

        {/* Footer Meta Strip */}
        <footer className="border-t border-[#123E34] bg-[#051713] py-6 px-4 text-center">
          <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono uppercase tracking-wider text-[#A7C7BE]">
            <span className="text-[#FFFFFF]">KIRANI AGP • SMKN 1 SOREANG LIVE ARENA PORTAL</span>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-[#E3EF26] transition-colors">
                BERANDA EVENT
              </Link>
              <span>•</span>
              <a
                href="/Juklak_AGP_IV_SMKN1_Soreang.pdf"
                download="Juklak_Resmi_AGP_IV_SMKN1_Soreang.pdf"
                className="text-[#E3EF26] hover:underline"
              >
                UNDUH JUKLAK PDF
              </a>
              <span>•</span>
              <Link href="/schedule" className="hover:text-[#E3EF26] transition-colors">
                WAKTU TAMPIL
              </Link>
              <span>•</span>
              <Link href="/barack" className="hover:text-[#E3EF26] transition-colors">
                LOKASI BARAK
              </Link>
              <span>•</span>
              <Link href="/live-score" className="hover:text-[#E3EF26] transition-colors">
                PENGUMUMAN JUARA
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // COMMITTEE ADMIN SHELL (/admin/*)
  // Clean Professional Workspace with Plus Jakarta Sans & JetBrains Mono
  // ============================================================================
  const renderNavLinks = (isMobile: boolean = false) => {
    return (
      <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Menu Navigasi Panitia">
        <div
          className={`px-3 mb-2 text-xs font-mono font-bold text-[#A7C7BE] tracking-wider uppercase ${
            isSidebarCollapsed && !isMobile ? 'text-center' : ''
          }`}
        >
          {isSidebarCollapsed && !isMobile ? 'CMD' : 'Menu Panitia'}
        </div>
        {currentLinks.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => isMobile && setIsDrawerOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#0E332B] text-[#FFFFFF] border border-[#1E564A]'
                  : 'text-[#C5E0D8] hover:text-[#FFFFFF] hover:bg-[#061C18] border border-transparent'
              }`}
            >
              <span className={`shrink-0 flex items-center justify-center ${isActive ? 'text-[#E3EF26]' : 'text-[#A7C7BE]'}`}>
                {link.icon}
              </span>
              {(!isSidebarCollapsed || isMobile) && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="min-h-screen flex bg-[#07201B] text-[#FFFFFF] font-sans">
      <a href="#main-content" className="skip-to-content">
        Lewati ke konten utama
      </a>

      {/* 1. DESKTOP SIDEBAR */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 76 : 252 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
        className="hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden bg-[#0A2620] border-r border-[#1E564A] z-30"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E564A] shrink-0">
          {!isSidebarCollapsed ? (
            <Link href="/admin" className="flex items-center gap-3 group min-w-0">
              <img
                src="/kirani.svg"
                alt="Logo Kirani AGP"
                className="w-9 h-9 object-contain shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold tracking-wider text-white leading-tight truncate">
                  KIRANI<span className="text-[#E3EF26]">.AGP</span>
                </span>
                <span className="text-xs font-mono text-[#A7C7BE] leading-tight truncate">
                  REKAPITULASI PANITIA
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/admin" className="mx-auto flex items-center justify-center">
              <img
                src="/kirani.svg"
                alt="Logo Kirani AGP"
                className="w-9 h-9 object-contain shrink-0"
              />
            </Link>
          )}

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg border border-[#1E564A] bg-[#07201B] hover:bg-[#0E332B] text-[#C5E0D8] hover:text-white transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            aria-label={isSidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto">{renderNavLinks(false)}</div>

        {/* Footer Area with Server Status */}
        <div className={`p-4 border-t border-[#1E564A] flex flex-col gap-2 ${isSidebarCollapsed ? 'items-center' : ''}`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#07201B] rounded-lg border border-[#123E34]">
                <span className="w-2 h-2 rounded-full bg-[#E3EF26]" />
                <span className="text-xs font-mono text-[#E3EF26] font-semibold">SERVER TERHUBUNG</span>
              </div>
              <div className="text-xs font-mono text-[#A7C7BE] text-center mt-0.5">
                AGP-IV SMKN 1 Soreang
              </div>
            </>
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-[#E3EF26]" title="Server Online" />
          )}
        </div>
      </motion.aside>

      {/* 2. MOBILE DRAWER OVERLAY */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-72 h-full flex flex-col z-10 bg-[#0A2620] border-r border-[#1E564A] shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="h-16 flex items-center justify-between px-4 border-b border-[#1E564A] shrink-0">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#E3EF26] inline-block" /> AGP COMMAND
              </span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-[#C5E0D8] hover:text-white hover:bg-[#0E332B] p-2 rounded-lg border border-[#1E564A] cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderNavLinks(true)}</div>
            <div className="p-4 border-t border-[#1E564A] shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#07201B] rounded-lg border border-[#123E34]">
                <span className="w-2 h-2 rounded-full bg-[#E3EF26]" />
                <span className="text-xs font-mono text-[#E3EF26] font-semibold">SERVER TERHUBUNG</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="h-16 bg-[#0A2620] border-b border-[#1E564A] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg border border-[#1E564A] bg-[#07201B] text-white hover:bg-[#0E332B] cursor-pointer"
              aria-label="Buka navigasi menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav className="hidden sm:flex items-center gap-2 text-xs font-mono text-[#A7C7BE]" aria-label="Breadcrumb">
              <span className="text-white font-semibold">CMD</span>
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={bc.href}>
                  <span className="text-[#1E564A]">/</span>
                  <span
                    className={
                      idx === breadcrumbs.length - 1
                        ? 'text-[#E3EF26] font-bold'
                        : 'text-[#C5E0D8]'
                    }
                  >
                    {bc.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <LiveClock className="inline-flex scale-90 sm:scale-100 transform origin-right" />

            <div className="hidden lg:block w-60">
              <Input
                placeholder="Cari regu, pangkalan..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="py-1.5 text-xs"
                icon={<Search className="w-4 h-4 text-[#A7C7BE]" />}
              />
            </div>

            {/* Notifications Popover */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (!isNotificationsOpen) markAllNotificationsAsRead();
                }}
                className="p-2 rounded-lg border border-[#1E564A] bg-[#07201B] hover:bg-[#0E332B] text-[#C5E0D8] hover:text-white transition-colors relative cursor-pointer"
                aria-label="Pusat notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E3EF26] text-[#0C342C] font-mono font-bold text-xs flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 5, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-80 rounded-xl bg-[#0A2620] border border-[#1E564A] z-50 overflow-hidden shadow-2xl"
                  >
                    <div className="px-4 py-3 border-b border-[#1E564A] flex justify-between items-center bg-[#07201B]">
                      <span className="text-xs font-mono font-bold uppercase text-white">
                        Notifikasi Arena
                      </span>
                      {unreadCount > 0 && <Badge variant="primary">{unreadCount} Baru</Badge>}
                    </div>

                    <div className="max-h-64 overflow-y-auto divide-y divide-[#123E34]">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#A7C7BE]">
                          Belum ada notifikasi baru.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-3.5 flex flex-col gap-1 transition-colors ${
                              notif.unread ? 'bg-[#0E332B]' : 'hover:bg-[#0E332B]/60'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-xs font-bold text-white leading-tight">
                                {notif.title}
                              </span>
                              <span className="text-xs font-mono text-[#A7C7BE] whitespace-nowrap">
                                {notif.time}
                              </span>
                            </div>
                            <p className="text-xs text-[#C5E0D8] leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            {user ? (
              <Dropdown
                align="right"
                trigger={
                  <div className="flex items-center gap-2 cursor-pointer group pl-1">
                    <Avatar name={profile?.full_name || profile?.username || user.email} size="sm" />
                    <div className="hidden sm:flex flex-col items-start leading-none">
                      <span className="text-xs font-semibold text-white transition-colors">
                        {profile?.username || user.email?.split('@')[0]}
                      </span>
                      <span className="text-xs font-mono text-[#A7C7BE] uppercase mt-0.5">
                        {profile?.role || 'OPERATOR'}
                      </span>
                    </div>
                  </div>
                }
                items={profileDropdownItems}
              />
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm" className="gap-1.5">
                  <Key className="w-4 h-4" /> Login Panitia
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* MAIN WORKING AREA */}
        <main id="main-content" className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
