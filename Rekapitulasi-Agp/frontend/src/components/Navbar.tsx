'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  username?: string;
  full_name?: string;
  role?: 'GRAND_MASTER' | 'OPERATOR';
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdminRoute = pathname?.startsWith('/admin');
  const isGrandMaster = profile?.role === 'GRAND_MASTER';

  useEffect(() => {
    // Get active user session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('username, full_name, role')
          .eq('id', session.user.id)
          .single();
        
        const effectiveRole = (data?.role === 'GRAND_MASTER' || session.user.email?.includes('grandmaster') || data?.username === 'grandmaster')
          ? 'GRAND_MASTER'
          : 'OPERATOR';

        setProfile({
          username: data?.username || session.user.email?.split('@')[0],
          full_name: data?.full_name || (effectiveRole === 'GRAND_MASTER' ? 'Sekretaris Utama AGP (Grand Master)' : 'Operator Lapangan'),
          role: effectiveRole,
        });
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('username, full_name, role')
          .eq('id', session.user.id)
          .single();

        const effectiveRole = (data?.role === 'GRAND_MASTER' || session.user.email?.includes('grandmaster') || data?.username === 'grandmaster')
          ? 'GRAND_MASTER'
          : 'OPERATOR';

        setProfile({
          username: data?.username || session.user.email?.split('@')[0],
          full_name: data?.full_name || (effectiveRole === 'GRAND_MASTER' ? 'Sekretaris Utama AGP (Grand Master)' : 'Operator Lapangan'),
          role: effectiveRole,
        });
      } else {
        setProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 text-slate-100 font-sans shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <Link href={isAdminRoute ? (isGrandMaster ? "/admin/leaderboard" : "/admin/schedule-manage") : "/live-score"} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              AGP
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                AGP COMPETITION SYSTEM
                {isAdminRoute && (
                  <span className={`hidden md:inline-block px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border ${
                    isGrandMaster
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {isGrandMaster ? '👑 GRAND MASTER' : '⚡ OPERATOR LAPANGAN'}
                  </span>
                )}
              </h1>
              <p className="text-[11px] text-emerald-400 font-semibold">
                {isAdminRoute 
                  ? (isGrandMaster ? 'Sekretaris Utama & Master Control' : 'Operator Lapangan & Arena Control') 
                  : 'Rekapitulasi Nilai & Live Leaderboard'}
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links (Strict 100% Separation) */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {!isAdminRoute ? (
            <>
              <Link
                href="/live-score"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname === '/live-score' || pathname === '/'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                🏆 Hasil &amp; SK Juara
              </Link>
              <Link
                href="/schedule"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname === '/schedule'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                ⏱️ Urutan Tampil
              </Link>
              <Link
                href="/barack"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname === '/barack'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                🏕️ Transit Barak
              </Link>
            </>
          ) : isGrandMaster ? (
            /* ================= PANEL EKSKLUSIF GRAND MASTER ================= */
            <>
              <Link
                href="/admin/score-entry"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname === '/admin/score-entry'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                ⚡ Input Nilai Juri
              </Link>
              <Link
                href="/admin/leaderboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname === '/admin/leaderboard'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                📊 Master Recap &amp; SK
              </Link>
              <Link
                href="/admin/users"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname === '/admin/users'
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                👥 Kelola User Panitia
              </Link>
            </>
          ) : (
            /* ================= PANEL EKSKLUSIF OPERATOR LAPANGAN ================= */
            <>
              <Link
                href="/admin/schedule-manage"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname === '/admin/schedule-manage'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                🎛️ Kelola Urutan Tampil Arena
              </Link>
              <Link
                href="/admin/barack-manage"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  pathname === '/admin/barack-manage'
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                ⛺ Kelola Ruang Barak
              </Link>
            </>
          )}
        </nav>

        {/* User Badges & Action Buttons */}
        <div className="flex items-center space-x-3">
          {/* Offline LAN Server Status Badge */}
          <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5"></span>
            LAN ONLINE (0.0.0.0)
          </span>

          {user && (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-200">
                  {profile?.full_name || profile?.username || user.email?.split('@')[0]}
                </span>
                <span className={`text-[10px] font-extrabold tracking-wider uppercase ${
                  isGrandMaster ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {profile?.role || 'OPERATOR'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 flex items-center space-x-1"
                title="Keluar dari Admin Portal"
              >
                <span>🚪</span>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 py-4 space-y-2">
          {!isAdminRoute ? (
            <>
              <Link
                href="/live-score"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-slate-200 hover:bg-slate-900"
              >
                🏆 Hasil &amp; SK Juara
              </Link>
              <Link
                href="/schedule"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-slate-200 hover:bg-slate-900"
              >
                ⏱️ Urutan Tampil Realtime
              </Link>
              <Link
                href="/barack"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-slate-200 hover:bg-slate-900"
              >
                🏕️ Transit Barak Room
              </Link>
            </>
          ) : isGrandMaster ? (
            <>
              <Link
                href="/admin/score-entry"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-amber-300 hover:bg-slate-900"
              >
                ⚡ Input Nilai Juri
              </Link>
              <Link
                href="/admin/leaderboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-amber-300 hover:bg-slate-900"
              >
                📊 Master Recap &amp; SK
              </Link>
              <Link
                href="/admin/users"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-amber-300 hover:bg-slate-900"
              >
                👥 Kelola User Panitia
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/admin/schedule-manage"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-emerald-300 hover:bg-slate-900"
              >
                🎛️ Kelola Urutan Tampil Arena
              </Link>
              <Link
                href="/admin/barack-manage"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-bold text-cyan-300 hover:bg-slate-900"
              >
                ⛺ Kelola Ruang Barak
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
