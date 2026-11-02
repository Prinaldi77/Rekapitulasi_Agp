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

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: '1', title: 'Urutan Tampil', message: 'Regu SMA-02 statusnya diubah menjadi PERFORMING!', time: 'Baru saja', unread: true },
    { id: '2', title: 'Nilai Terkirim', message: 'Juri 1 menyelesaikan rekap nilai untuk SD-01.', time: '5m lalu', unread: true },
    { id: '3', title: 'Barak Terisi', message: 'Tim PANG LIMA MUDA menempati Kelas IX-A.', time: '12m lalu', unread: false },
  ]);

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
            full_name: profData?.full_name || (currentUser as any).user_metadata?.full_name || defaultFullName,
            role: effectiveRole,
          });
        }
      } catch (err) {
        console.warn('AppLayout getSession notice:', err);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('username, full_name, role')
            .eq('id', session.user.id)
            .maybeSingle();

          const metaRole = session.user.user_metadata?.role;
          const dbRole = data?.role;
          const uname = (
            data?.username ||
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
            full_name: data?.full_name || session.user.user_metadata?.full_name || defaultFullName,
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
              title: 'Nilai Juri Masuk (Internal)',
              message: `Rekap nilai baru dari Juri telah terisi ke sistem rekapitulasi rahasia.`,
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
      else if (seg === 'leaderboard') label = 'MASTER RECAP & SK';
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
  // PUBLIC WEB SHELL (Non-Admin Routes: /schedule, /barack, /live-score)
  // Awwwards-Style Glassmorphic Pill Navigation Bar (#0C342C, #076653, #E3EF26)
  // ============================================================================
  if (!isAdminRoute) {
    const arenaTabs = [
      { label: 'WAKTU TAMPIL', href: '/schedule', icon: <Clock className="w-3.5 h-3.5" /> },
      { label: 'LOKASI BARAK', href: '/barack', icon: <Tent className="w-3.5 h-3.5" /> },
      { label: 'PENGUMUMAN JUARA', href: '/live-score', icon: <Trophy className="w-3.5 h-3.5" /> },
    ];

    return (
      <div className="min-h-screen flex flex-col bg-[#07201B] text-[#F4F9F7] font-inter selection:bg-[#E3EF26] selection:text-[#0C342C] relative overflow-x-hidden">
        <a href="#main-content" className="skip-to-content">
          Lewati ke konten utama
        </a>

        {/* Subtle Ambient Studio Lighting & Fine Grid */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute -top-44 left-1/2 -translate-x-1/2 w-[1000px] h-[480px] rounded-full opacity-30 blur-[140px]"
            style={{
              background:
                'radial-gradient(circle, rgba(7,102,83,0.65) 0%, rgba(227,239,38,0.12) 50%, transparent 75%)',
            }}
          />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(to right, #E3EF26 1px, transparent 1px), linear-gradient(to bottom, #E3EF26 1px, transparent 1px)',
              backgroundSize: '72px 72px',
            }}
          />
        </div>

        {/* Minimalist Awwwards Top Navigation Bar */}
        <header className="sticky top-0 z-50 px-4 sm:px-8 pt-4 pb-2">
          <div className="max-w-[1360px] mx-auto flex items-center justify-between gap-3">
            {/* Left: Brand Pill with Crisp Kirani Logo */}
            <Link
              href="/"
              className="group inline-flex items-center gap-3 pl-2.5 pr-4 py-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/65 backdrop-blur-xl hover:border-[#E3EF26]/65 transition-all duration-300 shrink-0 shadow-[0_10px_28px_rgba(0,0,0,0.4)]"
            >
              <img
                src="/kirani.svg"
                alt="Logo Kirani AGP"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(227,239,38,0.28)] group-hover:scale-105 transition-transform duration-300"
              />
              <div className="flex flex-col leading-none">
                <span className="text-xs sm:text-[13px] font-black tracking-[0.14em] uppercase text-white">
                  KIRANI<span className="text-[#E3EF26]">.ARENA</span>
                </span>
                <span className="text-[9px] font-mono tracking-[0.15em] text-[#E3EF26] mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E3EF26] animate-pulse" />
                  PORTAL ARENA
                </span>
              </div>
            </Link>

            {/* Center: Segmented Pill Switcher with Framer Motion layoutId */}
            <nav
              className="hidden md:flex items-center gap-1 p-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/65 backdrop-blur-2xl shadow-[0_16px_36px_rgba(0,0,0,0.45)]"
              aria-label="Navigasi Arena Publik"
            >
              {arenaTabs.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.12em] uppercase transition-colors duration-300 flex items-center gap-2 ${
                      isActive ? 'text-[#0C342C]' : 'text-[#A9C6BE] hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="arena-nav-pill"
                        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                        className="absolute inset-0 rounded-full bg-[#E3EF26] shadow-[0_0_20px_rgba(227,239,38,0.4)]"
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

            {/* Right: Live Clock + Juklak Download + Back to Landing Page (or Admin if committee logged in) */}
            <div className="flex items-center gap-2.5">
              <LiveClock className="hidden lg:inline-flex" />
              <a
                href="/Juklak_AGP_III_SMKN1_Soreang.pdf"
                download="Surat_Edaran_dan_JUKLAK_AGP_Vol_III_SMKN1_Soreang.pdf"
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#092922]/90 border border-[#E3EF26]/45 text-xs font-semibold text-[#E3EF26] hover:bg-[#E3EF26] hover:text-[#0C342C] backdrop-blur-xl transition-all"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Unduh Juklak</span>
              </a>
              {user ? (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E3EF26] text-[#0C342C] text-xs font-extrabold tracking-wide shadow-[0_10px_24px_rgba(227,239,38,0.25)] hover:bg-[#eef842] transition-all"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard Panitia</span>
                </Link>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#092922]/90 border border-[#076653]/70 text-xs font-semibold text-[#D7EAE3] hover:border-[#E3EF26] hover:text-[#E3EF26] backdrop-blur-xl transition-all"
                >
                  <Home className="w-3.5 h-3.5 text-[#E3EF26]" />
                  <span>Beranda Event</span>
                </Link>
              )}
            </div>
          </div>

          {/* Mobile Segmented Sub-navigation Bar */}
          <div className="md:hidden max-w-[1360px] mx-auto mt-2.5 p-1 rounded-full bg-[#092922]/95 border border-[#076653]/65 backdrop-blur-xl flex items-center justify-between gap-1 overflow-x-auto">
            {arenaTabs.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-bold tracking-wider uppercase whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#E3EF26] text-[#0C342C] shadow-[0_0_16px_rgba(227,239,38,0.3)]'
                      : 'text-[#A9C6BE] hover:text-white'
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
            <div className="mb-6 p-4 rounded-2xl bg-[#092922]/90 border border-[#E3EF26]/45 backdrop-blur-xl text-[#ffffff] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_16px_40px_rgba(0,0,0,0.4)]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0C342C] border border-[#E3EF26]/50 flex items-center justify-center text-[#E3EF26] shrink-0">
                  <Crown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-mono font-semibold uppercase tracking-wider text-[#E3EF26]">
                    Sesi Panitia Aktif ({profile?.role || 'OPERATOR'})
                  </h4>
                  <p className="text-xs text-[#D7EAE3]">
                    Anda sedang memantau Portal Live Arena Publik. Klik tombol di kanan untuk kembali ke ruang Rekapitulasi Panitia.
                  </p>
                </div>
              </div>
              <Link href="/admin">
                <Button variant="primary" size="sm" className="shrink-0 gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Portal Panitia
                </Button>
              </Link>
            </div>
          )}

          {children}
        </main>

        {/* Footer Meta Strip */}
        <footer className="relative z-10 border-t border-[#076653]/40 bg-[#061A15]/80 py-6 px-4 text-center">
          <div className="max-w-[1360px] mx-auto flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono uppercase tracking-[0.14em] text-[#7FA69A]">
            <span className="text-[#B8D8D0]">AGP-III • SMKN 1 SOREANG LIVE ARENA PORTAL (04.105–04.106)</span>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-[#E3EF26] transition-colors">
                BERANDA EVENT
              </Link>
              <span>•</span>
              <a
                href="/Juklak_AGP_III_SMKN1_Soreang.pdf"
                download="Surat_Edaran_dan_JUKLAK_AGP_Vol_III_SMKN1_Soreang.pdf"
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
  // COMMITTEE ADMIN SHELL (/admin/*) — Midnight Command Center Cockpit
  // ============================================================================
  const renderNavLinks = (isMobile: boolean = false) => {
    return (
      <nav className="flex flex-col gap-1 px-3 py-4" aria-label="Menu Navigasi Panitia">
        <div
          className={`px-3 mb-2 text-[10px] font-mono font-medium text-[#7AA89C] tracking-[0.08em] uppercase ${
            isSidebarCollapsed && !isMobile ? 'text-center' : ''
          }`}
        >
          {isSidebarCollapsed && !isMobile ? 'CMD' : 'Command Center'}
        </div>
        {currentLinks.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => isMobile && setIsDrawerOpen(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#076653] text-[#ffffff] border border-[#076653] shadow-[rgba(255,255,255,0.06)_0px_1px_0px_0px_inset]'
                  : 'text-[#B8D8D0] hover:text-[#ffffff] hover:bg-[#061C18] border border-transparent'
              }`}
            >
              <span className={`shrink-0 flex items-center justify-center ${isActive ? 'text-[#E3EF26]' : 'text-[#7AA89C]'}`}>
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
    <div className="min-h-screen flex bg-[#0C342C] text-[#ffffff] font-inter">
      <a href="#main-content" className="skip-to-content">
        Lewati ke konten utama
      </a>

      {/* 1. DESKTOP SIDEBAR */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 76 : 252 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
        className="hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden bg-[#082620] border-r border-[#076653] z-30"
      >
        {/* Brand Header with Crisp Kirani Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#076653] shrink-0">
          {!isSidebarCollapsed ? (
            <Link href="/admin" className="flex items-center gap-3 group min-w-0">
              <img
                src="/kirani.svg"
                alt="Logo Kirani AGP"
                className="w-9 h-9 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(227,239,38,0.25)] group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[13px] font-black tracking-wider text-[#ffffff] leading-none truncate">
                  KIRANI<span className="text-[#E3EF26]">.AGP</span>
                </span>
                <span className="text-[9px] font-mono text-[#B8D8D0] leading-none mt-1 truncate">
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
            className="p-1.5 rounded-[8px] border border-[#076653] bg-[#061C18] hover:bg-[#076653] text-[#B8D8D0] hover:text-[#ffffff] transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
            aria-label={isSidebarCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto">{renderNavLinks(false)}</div>

        {/* Footer Area with Server Status */}
        <div className={`p-4 border-t border-[#076653] flex flex-col gap-2 ${isSidebarCollapsed ? 'items-center' : ''}`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-[#061C18] rounded-[8px] border border-[#076653]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E3EF26] animate-pulse" />
                <span className="text-[10px] font-mono text-[#E3EF26] font-medium">LAN / CLOUD ONLINE</span>
              </div>
              <div className="text-[11px] font-mono text-[#7AA89C] text-center mt-0.5">
                v1.2.0 | AGP 2026
              </div>
            </>
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#E3EF26] animate-pulse" title="Server Online" />
          )}
        </div>
      </motion.aside>

      {/* 2. MOBILE DRAWER OVERLAY */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-[#0C342C]/80 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-72 h-full flex flex-col z-10 bg-[#082620] border-r border-[#076653] shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="h-16 flex items-center justify-between px-4 border-b border-[#076653] shrink-0">
              <span className="text-xs font-mono font-semibold text-[#ffffff] uppercase tracking-widest flex items-center gap-2">
                <span className="w-2.5 h-2.5 rotate-45 bg-[#E3EF26] inline-block" /> AGP COMMAND
              </span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-[#B8D8D0] hover:text-[#ffffff] hover:bg-[#076653] p-2 rounded-[8px] border border-[#076653] cursor-pointer"
                aria-label="Tutup Menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{renderNavLinks(true)}</div>
            <div className="p-4 border-t border-[#076653] shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-[#061C18] rounded-[8px] border border-[#076653]">
                <span className="w-2 h-2 rounded-full bg-[#E3EF26] animate-pulse" />
                <span className="text-[10px] font-mono text-[#E3EF26]">SERVER ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOPBAR */}
        <header className="h-16 bg-[#082620]/85 backdrop-blur-xl border-b border-[#076653] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-2 rounded-[8px] border border-[#076653] bg-[#061C18] text-[#ffffff] hover:bg-[#076653] cursor-pointer"
              aria-label="Buka navigasi menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <nav className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-[#7AA89C]" aria-label="Breadcrumb">
              <span className="text-[#B8D8D0]">CMD</span>
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={bc.href}>
                  <span className="text-[#076653]">/</span>
                  <span
                    className={
                      idx === breadcrumbs.length - 1
                        ? 'text-[#ffffff] font-semibold'
                        : 'text-[#B8D8D0]'
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
                icon={<Search className="w-3.5 h-3.5" />}
              />
            </div>

            {/* Notifications Popover */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (!isNotificationsOpen) markAllNotificationsAsRead();
                }}
                className="p-2 rounded-[8px] border border-[#076653] bg-[#061C18] hover:bg-[#076653] text-[#B8D8D0] hover:text-[#ffffff] transition-colors relative cursor-pointer"
                aria-label="Pusat notifikasi"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E3EF26] text-[#0C342C] font-mono font-bold text-[9px] flex items-center justify-center">
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
                    className="absolute right-0 mt-2 w-80 rounded-[12px] bg-[#082620] key-card z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#076653] flex justify-between items-center bg-[#061C18]">
                      <span className="text-[11px] font-mono font-semibold uppercase text-[#ffffff]">
                        Notifikasi Arena
                      </span>
                      <Badge variant="danger">LIVE</Badge>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-[#076653]">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3.5 flex flex-col gap-1 transition-colors ${
                            notif.unread ? 'bg-[#061C18]' : 'hover:bg-[#061C18]/60'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-semibold text-[#ffffff] leading-tight">
                              {notif.title}
                            </span>
                            <span className="text-[10px] font-mono text-[#7AA89C] whitespace-nowrap">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-xs text-[#B8D8D0] leading-relaxed">{notif.message}</p>
                        </div>
                      ))}
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
                      <span className="text-xs font-medium text-[#ffffff] group-hover:text-[#ffffff] transition-colors">
                        {profile?.username || user.email?.split('@')[0]}
                      </span>
                      <span className="text-[10px] font-mono text-[#B8D8D0] uppercase mt-0.5">
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
                  <Key className="w-3.5 h-3.5" /> Login Panitia
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
