'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Crown,
  ShieldCheck,
  Trophy,
  Clock,
  Building2,
  ClipboardEdit,
  BarChart3,
  Users,
  Radio,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
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
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data: profData } = await supabase
            .from('profiles')
            .select('username, full_name, role')
            .eq('id', session.user.id)
            .single();

          const effectiveRole =
            profData?.role === 'GRAND_MASTER' ||
            session.user.email?.includes('grandmaster') ||
            profData?.username === 'grandmaster'
              ? 'GRAND_MASTER'
              : 'OPERATOR';

          setProfile({
            username: profData?.username || session.user.email?.split('@')[0],
            full_name:
              profData?.full_name ||
              (effectiveRole === 'GRAND_MASTER'
                ? 'Sekretaris Utama AGP (Grand Master)'
                : 'Operator Lapangan'),
            role: effectiveRole,
          });
        }
      } catch (err) {
        console.warn('Navbar getSession notice:', err);
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
            .single();

          const effectiveRole =
            profData?.role === 'GRAND_MASTER' ||
            session.user.email?.includes('grandmaster') ||
            profData?.username === 'grandmaster'
              ? 'GRAND_MASTER'
              : 'OPERATOR';

          setProfile({
            username: profData?.username || session.user.email?.split('@')[0],
            full_name:
              profData?.full_name ||
              (effectiveRole === 'GRAND_MASTER'
                ? 'Sekretaris Utama AGP (Grand Master)'
                : 'Operator Lapangan'),
            role: effectiveRole,
          });
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.warn('Navbar onAuthStateChange notice:', err);
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
    <header className="border-b border-white/[0.06] bg-[#0C342C]/90 backdrop-blur-md sticky top-0 z-50 text-white font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <Link
            href={
              isAdminRoute
                ? isGrandMaster
                  ? '/admin/leaderboard'
                  : '/admin/schedule-manage'
                : '/live-score'
            }
            className="flex items-center space-x-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-[#061C18] border border-white/[0.08] flex items-center justify-center text-[#E3EF26] font-mono font-bold text-sm">
              AGP
            </div>
            <div>
              <h1 className="text-sm font-medium text-white tracking-wide flex items-center gap-2">
                AGP COMPETITION SYSTEM
                {isAdminRoute && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono uppercase tracking-wider rounded bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30">
                    {isGrandMaster ? (
                      <>
                        <Crown className="w-3 h-3" /> GRAND MASTER
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-3 h-3" /> OPERATOR LAPANGAN
                      </>
                    )}
                  </span>
                )}
              </h1>
              <p className="text-xs text-[#B8D8D0] font-mono">
                {isAdminRoute
                  ? isGrandMaster
                    ? 'Sekretaris Utama & Master Control'
                    : 'Operator Lapangan & Arena Control'
                  : 'Rekapitulasi Nilai & Live Leaderboard'}
              </p>
            </div>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {!isAdminRoute ? (
            <>
              <Link
                href="/live-score"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  pathname === '/live-score' || pathname === '/'
                    ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                    : 'text-[#B8D8D0] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                Hasil &amp; SK Juara
              </Link>
              <Link
                href="/schedule"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  pathname === '/schedule'
                    ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                    : 'text-[#B8D8D0] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Urutan Tampil
              </Link>
              <Link
                href="/barack"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  pathname === '/barack'
                    ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                    : 'text-[#B8D8D0] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Transit Barak
              </Link>
            </>
          ) : isGrandMaster ? (
            <>
              <Link
                href="/admin/score-entry"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  pathname === '/admin/score-entry'
                    ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                    : 'text-[#B8D8D0] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <ClipboardEdit className="w-3.5 h-3.5" />
                Input Nilai Juri
              </Link>
              <Link
                href="/admin/leaderboard"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  pathname === '/admin/leaderboard'
                    ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                    : 'text-[#B8D8D0] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Master Recap &amp; SK
              </Link>
              <Link
                href="/admin/users"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  pathname === '/admin/users'
                    ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                    : 'text-[#B8D8D0] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Kelola User Panitia
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/admin/schedule-manage"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  pathname === '/admin/schedule-manage'
                    ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                    : 'text-[#B8D8D0] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                Kelola Urutan Tampil Arena
              </Link>
              <Link
                href="/admin/barack-manage"
                className={`px-3 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors ${
                  pathname === '/admin/barack-manage'
                    ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                    : 'text-[#B8D8D0] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Kelola Ruang Barak
              </Link>
            </>
          )}
        </nav>

        {/* User Badges & Action Buttons */}
        <div className="flex items-center space-x-3">
          <span className="hidden lg:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono bg-[#061C18] text-[#E3EF26] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E3EF26] animate-ping mr-1.5" />
            SERVER ONLINE
          </span>

          {user && (
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-white">
                  {profile?.full_name || profile?.username || user.email?.split('@')[0]}
                </span>
                <span className="text-xs font-mono tracking-wider uppercase text-[#E3EF26]">
                  {profile?.role || 'OPERATOR'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 bg-[#076653] hover:bg-[#076653]/80 text-[#E3EF26] border border-[#E3EF26]/30 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
                title="Keluar dari Admin Portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-[#061C18] border border-white/[0.08] text-[#B8D8D0] hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/[0.06] bg-[#082620] px-4 py-4 space-y-2">
          {!isAdminRoute ? (
            <>
              <Link
                href="/live-score"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#ffffff] hover:bg-white/[0.04]"
              >
                <Trophy className="w-4 h-4 text-[#E3EF26]" />
                Hasil &amp; SK Juara
              </Link>
              <Link
                href="/schedule"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#ffffff] hover:bg-white/[0.04]"
              >
                <Clock className="w-4 h-4 text-[#E3EF26]" />
                Urutan Tampil Realtime
              </Link>
              <Link
                href="/barack"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#ffffff] hover:bg-white/[0.04]"
              >
                <Building2 className="w-4 h-4 text-[#E3EF26]" />
                Transit Barak Room
              </Link>
            </>
          ) : isGrandMaster ? (
            <>
              <Link
                href="/admin/score-entry"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#ffffff] hover:bg-white/[0.04]"
              >
                <ClipboardEdit className="w-4 h-4 text-[#E3EF26]" />
                Input Nilai Juri
              </Link>
              <Link
                href="/admin/leaderboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#ffffff] hover:bg-white/[0.04]"
              >
                <BarChart3 className="w-4 h-4 text-[#E3EF26]" />
                Master Recap &amp; SK
              </Link>
              <Link
                href="/admin/users"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#ffffff] hover:bg-white/[0.04]"
              >
                <Users className="w-4 h-4 text-[#E3EF26]" />
                Kelola User Panitia
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/admin/schedule-manage"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#ffffff] hover:bg-white/[0.04]"
              >
                <Radio className="w-4 h-4 text-[#E3EF26]" />
                Kelola Urutan Tampil Arena
              </Link>
              <Link
                href="/admin/barack-manage"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#ffffff] hover:bg-white/[0.04]"
              >
                <Building2 className="w-4 h-4 text-[#E3EF26]" />
                Kelola Ruang Barak
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
