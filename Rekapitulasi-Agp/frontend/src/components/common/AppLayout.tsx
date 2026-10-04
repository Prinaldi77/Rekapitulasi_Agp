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
  User, LogOut, ChevronLeft, ChevronRight, Menu, Bell, Key, Crown, ArrowLeft
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
    { id: '1', title: '📢 Urutan Tampil', message: 'Regu SMA-02 statusnya diubah menjadi PERFORMING!', time: 'Baru saja', unread: true },
    { id: '2', title: '💾 Nilai Terkirim', message: 'Juri 1 menyelesaikan rekap nilai untuk SD-01.', time: '5m lalu', unread: true },
    { id: '3', title: '🏕️ Barak Terisi', message: 'Tim PANG LIMA MUDA menempati Kelas IX-A.', time: '12m lalu', unread: false },
  ]);

  const notificationRef = useRef<HTMLDivElement>(null);

  const isLoginPage = pathname === '/login';
  const isAdminRoute = pathname?.startsWith('/admin');
  const isGrandMaster = profile?.role === 'GRAND_MASTER';

  // Load sidebar collapsed state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agp_sidebar_collapsed') === 'true';
      setIsSidebarCollapsed(saved);
    }
  }, []);

  // Sync session and profile details
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        
        let currentUser = session?.user ?? null;

        // Local dev fallback user check
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
          const metaRole = (currentUser as any).user_metadata?.role;
          setProfile({
            username: (currentUser as any).user_metadata?.username || currentUser.email?.split('@')[0] || 'admin',
            full_name: 'Sekretaris Utama AGP (Grand Master)',
            role: (metaRole as any) || 'SUPER_ADMIN',
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
            .single();

          const metaRole = session.user.user_metadata?.role;
          const dbRole = data?.role;
          let effectiveRole: 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR_REKAP' = 'OPERATOR_REKAP';
          
          if (metaRole === 'SUPER_ADMIN' || metaRole === 'ADMIN' || metaRole === 'OPERATOR_REKAP') {
            effectiveRole = metaRole as any;
          } else if (dbRole === 'GRAND_MASTER' || session.user.email?.includes('grandmaster') || data?.username === 'grandmaster') {
            effectiveRole = 'SUPER_ADMIN';
          } else if (data?.username?.includes('admin')) {
            effectiveRole = 'ADMIN';
          }

          setProfile({
            username: data?.username || session.user.email?.split('@')[0],
            full_name: data?.full_name || (effectiveRole === 'SUPER_ADMIN' ? 'Sekretaris Utama AGP (Grand Master)' : 'Operator Lapangan'),
            role: effectiveRole as any,
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

  // Realtime Supabase Channel Notifications
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
              title: '📢 Urutan Tampil Realtime',
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
          // Only show score submission notification to internal Panitia/Admin users
          if (user) {
            const newItem: NotificationItem = {
              id: String(Date.now()),
              title: '💾 Nilai Juri Masuk (Internal)',
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
            title: '🏕️ Update Ruang Transit',
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
  }, []);

  // Notifications click-outside listener
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
      else if (seg === 'live-score') label = 'HASIL & SK JUARA';
      else if (seg === 'schedule') label = 'URUTAN TAMPIL';
      else if (seg === 'barack') label = 'TRANSIT BARAK';
      return { label, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  const publicLinks = [
    { label: 'Hasil & SK Juara', href: '/live-score', icon: <Trophy className="w-5 h-5" /> },
    { label: 'Urutan Tampil', href: '/schedule', icon: <Clock className="w-5 h-5" /> },
    { label: 'Transit Barak', href: '/barack', icon: <Tent className="w-5 h-5" /> },
  ];

  const superAdminLinks = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'User Management', href: '/admin/users', icon: <Users className="w-5 h-5" /> },
    { label: 'Role Management', href: '/admin/roles', icon: <KeyRound className="w-5 h-5" /> },
    { label: 'Peserta', href: '/admin/participants', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Barack', href: '/admin/barack-manage', icon: <Tent className="w-5 h-5" /> },
    { label: 'Jadwal', href: '/admin/schedule-manage', icon: <Clock className="w-5 h-5" /> },
    { label: 'Kategori Penilaian', href: '/admin/categories', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Input Nilai', href: '/admin/score-entry', icon: <Zap className="w-5 h-5" /> },
    { label: 'Rekap Nilai', href: '/admin/leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { label: 'Leaderboard', href: '/live-score', icon: <FileText className="w-5 h-5" /> },
    { label: 'Audit Log', href: '/admin/audit-logs', icon: <ShieldAlert className="w-5 h-5" /> },
    { label: 'Backup Database', href: '/admin/backup', icon: <Database className="w-5 h-5" /> },
    { label: 'Restore Database', href: '/admin/restore', icon: <RefreshCw className="w-5 h-5" /> },
    { label: 'Pengaturan Sistem', href: '/admin/settings', icon: <Settings className="w-5 h-5" /> },
  ];

  const adminLinks = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Peserta', href: '/admin/participants', icon: <UserCheck className="w-5 h-5" /> },
    { label: 'Barack', href: '/admin/barack-manage', icon: <Tent className="w-5 h-5" /> },
    { label: 'Jadwal', href: '/admin/schedule-manage', icon: <Clock className="w-5 h-5" /> },
    { label: 'Kategori Penilaian', href: '/admin/categories', icon: <ClipboardList className="w-5 h-5" /> },
    { label: 'Input Nilai', href: '/admin/score-entry', icon: <Zap className="w-5 h-5" /> },
    { label: 'Rekap Nilai', href: '/admin/leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { label: 'Leaderboard', href: '/live-score', icon: <FileText className="w-5 h-5" /> },
    { label: 'Operator Rekap Management', href: '/admin/operators', icon: <Users className="w-5 h-5" /> },
  ];

  const operatorRekapLinks = [
    { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Input Nilai', href: '/admin/score-entry', icon: <Zap className="w-5 h-5" /> },
    { label: 'Rekap Nilai', href: '/admin/leaderboard', icon: <Trophy className="w-5 h-5" /> },
    { label: 'Leaderboard', href: '/live-score', icon: <FileText className="w-5 h-5" /> },
    { label: 'Profile', href: '/admin/profile', icon: <User className="w-5 h-5" /> },
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

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllNotificationsAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const renderNavLinks = (isMobile: boolean = false) => {
    return (
      <nav className="flex flex-col gap-1.5 px-3 py-4">
        <div className={`px-3 mb-2 text-[10px] font-bold text-slate-500 tracking-wider uppercase ${isSidebarCollapsed && !isMobile ? 'text-center' : ''}`}>
          {isSidebarCollapsed && !isMobile ? 'Menu' : 'Navigasi'}
        </div>
        {currentLinks.map((link) => {
          const isActive = pathname === link.href || (link.href === '/live-score' && pathname === '/');
          
          let colorClass = 'text-gray-600 hover:text-gray-900 hover:bg-gray-100';
          if (isActive) {
            colorClass = 'bg-green-50 text-green-700 border border-green-200/50 shadow-sm font-bold';
            if (effectiveRole === 'SUPER_ADMIN') {
              colorClass = 'bg-amber-50 text-amber-700 border border-amber-200/50 shadow-sm font-bold';
            }
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => isMobile && setIsDrawerOpen(false)}
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${colorClass}`}
            >
              <span className="shrink-0 flex items-center justify-center">{link.icon}</span>
              {(!isSidebarCollapsed || isMobile) && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="min-h-screen flex bg-gray-50 text-gray-900 font-sans">
      <a href="#main-content" className="skip-to-content">
        Lewati ke konten utama
      </a>
      
      {/* 1. DESKTOP SIDEBAR */}
      <motion.aside
        animate={{ width: isSidebarCollapsed ? 80 : 256 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
        className="hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-hidden bg-white border-r border-gray-200 shadow-[2px_0_8px_rgba(0,0,0,0.02)] z-30"
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
          {!isSidebarCollapsed ? (
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-100 transition-all duration-300">
                <img src="/kirani.svg" alt="Kirani" className="w-7 h-7 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.innerText='K'; }} />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-wider uppercase text-gray-900 leading-none">
                  KIRANI AGP
                </span>
                <span className="text-[9px] text-green-600 font-bold leading-none mt-1">
                  COMPETITION 2026
                </span>
              </div>
            </Link>
          ) : (
            <div className="mx-auto w-9 h-9 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 font-black text-sm">
              <img src="/kirani.svg" alt="Kirani" className="w-6 h-6 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; (e.target as HTMLImageElement).parentElement!.innerText='K'; }} />
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto">
          {renderNavLinks(false)}
        </div>

        {/* Footer Area with Server Status */}
        <div className={`p-4 border-t border-gray-100 flex flex-col gap-2 ${isSidebarCollapsed ? 'items-center' : ''}`}>
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
                <span className="text-[10px] text-green-700 font-bold">SERVER ONLINE</span>
              </div>
              <div className="text-[10px] text-gray-400 text-center font-medium mt-1">
                v1.2.0 — Kirani AGP 2026
              </div>
            </>
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" title="Server Online" />
          )}
        </div>
      </motion.aside>

      {/* 2. MOBILE DRAWER OVERLAY */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          {/* Drawer Body */}
          <div className="relative w-72 h-full flex flex-col z-10 bg-white shadow-2xl animate-in slide-in-from-left duration-250">
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
              <span className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <Menu className="w-5 h-5 text-gray-600" /> MENU KIRANI
              </span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-lg border border-gray-200 cursor-pointer text-base font-bold"
                aria-label="Tutup Menu"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderNavLinks(true)}
            </div>
            <div className="p-4 border-t border-gray-100 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-100">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span className="text-[10px] text-green-700 font-bold">SERVER ONLINE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* TOPBAR */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          
          {/* Drawer Hamburger & Breadcrumbs */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Breadcrumb list */}
            <nav className="hidden sm:flex items-center gap-2 text-xs font-semibold text-green-600/70">
              <span className="hover:text-green-800 transition-colors">PORTAL</span>
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={bc.href}>
                  <span className="text-green-300">/</span>
                  <span
                    className={idx === breadcrumbs.length - 1 ? 'text-green-900 font-black' : 'hover:text-green-800 transition-colors'}
                  >
                    {bc.label}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Search Box & Utilities */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Realtime Live Digital Clock */}
            <LiveClock className="inline-flex scale-90 sm:scale-100 transform origin-right" />
            
            {/* Global Search Bar */}
            <div className="hidden lg:block w-64">
              <Input
                placeholder="Cari tim, no dada..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                className="py-1.5 text-xs"
                icon={
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>

            {/* Notifications Popover */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  if (!isNotificationsOpen) markAllNotificationsAsRead();
                }}
                className="p-2.5 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 hover:text-green-900 transition-colors relative cursor-pointer"
                aria-label="Notification center"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white font-black text-[9px] flex items-center justify-center border-2 border-white animate-bounce">
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
                    className="absolute right-0 mt-2 w-80 rounded-xl border border-green-100 bg-white shadow-xl shadow-green-900/10 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-green-100 flex justify-between items-center bg-green-50/60">
                      <span className="text-xs font-black uppercase text-green-900">Notifikasi Terbaru</span>
                      <Badge variant="danger" className="text-[9px]">Live</Badge>
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-green-50">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3.5 flex flex-col gap-1 transition-colors ${
                            notif.unread ? 'bg-green-50/60' : 'hover:bg-green-50/30'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-green-900 leading-tight">
                              {notif.title}
                            </span>
                            <span className="text-[9px] text-green-600/60 whitespace-nowrap">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-green-700/70 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            {user ? (
              <div className="flex items-center gap-3">
                {!isAdminRoute && (
                  <Link href="/admin">
                    <Button variant="primary" size="sm" className="text-xs font-black hidden sm:flex items-center gap-1 shadow-sm">
                      <LayoutDashboard className="w-3.5 h-3.5" /> Portal Admin
                    </Button>
                  </Link>
                )}
                <Dropdown
                  align="right"
                  trigger={
                    <div className="flex items-center gap-2 cursor-pointer group">
                      <Avatar name={profile?.full_name || profile?.username || user.email} size="sm" />
                      <div className="hidden sm:flex flex-col items-start leading-none">
                        <span className="text-xs font-extrabold text-green-900 group-hover:text-green-700 transition-colors">
                          {profile?.username || user.email?.split('@')[0]}
                        </span>
                        <span className="text-[9px] font-bold text-green-600/70 uppercase tracking-wide mt-0.5">
                          {profile?.role || 'OPERATOR'}
                        </span>
                      </div>
                    </div>
                  }
                  items={profileDropdownItems}
                />
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm" className="text-xs font-black flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" /> Login Panitia
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* MAIN WORKING AREA - Page transitions enabled */}
        <main id="main-content" className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          {/* Admin Navigation Banner on Public Pages */}
          {user && !isAdminRoute && (
            <div className="max-w-7xl mx-auto mb-6 p-4 rounded-2xl bg-gradient-to-r from-green-800 to-green-700 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md border border-green-600">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center font-black text-sm shrink-0">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-green-100">
                    Sesi Panitia Aktif ({profile?.role || 'OPERATOR'})
                  </h4>
                  <p className="text-xs font-medium text-white/90">
                    Anda sedang membuka tampilan publik. Klik tombol di kanan untuk kembali ke Dashboard Control Admin.
                  </p>
                </div>
              </div>
              <Link href="/admin">
                <Button variant="secondary" size="sm" className="font-black text-xs shrink-0 shadow-md flex items-center gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Kembali ke Portal Admin
                </Button>
              </Link>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
