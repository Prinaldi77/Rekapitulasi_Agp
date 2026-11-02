'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button, Input } from '@/components/ui';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowUpRight,
  Eye,
  EyeOff,
  ShieldCheck,
  Crown,
  UserCheck,
  Zap,
  Lock,
} from 'lucide-react';

const EASE_AWWWARDS: [number, number, number, number] = [0.16, 1, 0.3, 1];

const SUPABASE_COMMITTEE_ACCOUNTS = [
  {
    username: 'superadmin',
    email: 'superadmin@email.com',
    fullName: 'Sekretaris Utama AGP (Super Admin)',
    shortLabel: 'SUPER ADMIN',
    roleBadge: 'GRAND MASTER',
    icon: Crown,
  },
  {
    username: 'admin',
    email: 'admin@email.com',
    fullName: 'Pengelola Master Data (Admin)',
    shortLabel: 'ADMIN',
    roleBadge: 'MASTER DATA',
    icon: UserCheck,
  },
  {
    username: 'operator',
    email: 'operator@email.com',
    fullName: 'Operator Entri Nilai (PJ Rekap)',
    shortLabel: 'OPERATOR',
    roleBadge: 'PJ REKAP',
    icon: Zap,
  },
] as const;

function LoginForm() {
  const searchParams = useSearchParams();
  const customRedirect = searchParams.get('redirectTo') || searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem('agp_remember_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    // Allow entering either username ('superadmin', 'admin', 'operator') or full email ('superadmin@email.com')
    const trimmedInput = email.trim().toLowerCase();
    const normalizedEmail = trimmedInput.includes('@')
      ? trimmedInput
      : `${trimmedInput}@email.com`;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        setErrorMessage(
          'Akun atau kata sandi panitia tidak sesuai. Gunakan akun @superadmin, @admin, atau @operator.'
        );
        setLoading(false);
        return;
      }

      if (data?.session) {
        try {
          const { user } = data.session;
          const userId = user.id;
          const rawUsername =
            user.user_metadata?.username || normalizedEmail.split('@')[0];
          const cleanUsername = rawUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');

          // Check if profile already exists in database
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, username, full_name, role')
            .eq('id', userId)
            .maybeSingle();

          if (!existingProfile) {
            const matchedPreset = SUPABASE_COMMITTEE_ACCOUNTS.find(
              (acc) => acc.username === cleanUsername
            );
            const fullNameVal =
              matchedPreset?.fullName ||
              user.user_metadata?.full_name ||
              cleanUsername;
            const dbRole =
              cleanUsername === 'superadmin' ||
              cleanUsername === 'grandmaster' ||
              user.user_metadata?.role === 'SUPER_ADMIN' ||
              user.user_metadata?.role === 'GRAND_MASTER'
                ? 'GRAND_MASTER'
                : 'OPERATOR';

            await supabase.from('profiles').upsert({
              id: userId,
              username: cleanUsername,
              full_name: fullNameVal,
              role: dbRole,
            });
          }
        } catch (profileErr) {
          console.error('Failed to sync profile on login:', profileErr);
        }

        if (rememberMe) {
          localStorage.setItem('agp_remember_email', normalizedEmail);
        } else {
          localStorage.removeItem('agp_remember_email');
        }

        setSuccess(true);
        const targetUrl = customRedirect || '/admin';

        setTimeout(() => {
          window.location.href = targetUrl;
        }, 800);
      }
    } catch (err: any) {
      console.error('System Login Error:', err);
      setErrorMessage(
        'Tidak dapat terhubung ke peladen autentikasi panitia. Silakan coba beberapa saat lagi.'
      );
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, ease: EASE_AWWWARDS }}
        className="w-full max-w-md rounded-[28px] bg-[#092922]/95 border border-[#E3EF26]/50 p-10 text-center space-y-5 backdrop-blur-2xl shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#0C342C] border border-[#E3EF26]/50 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(227,239,38,0.25)]">
          <img
            src="/kirani.svg"
            alt="Logo Kirani AGP"
            className="w-11 h-11 object-contain"
          />
        </div>
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#E3EF26] uppercase tracking-widest">
            <ShieldCheck className="w-4 h-4" />
            <span>OTORISASI DITERIMA</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Selamat bertugas, Panitia AGP
          </h2>
          <p className="text-xs text-[#94B8AE] font-mono uppercase tracking-[0.14em]">
            Mengalihkan ke Ruang Kendali Rekapitulasi...
          </p>
        </div>
        <div className="flex justify-center pt-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E3EF26] animate-ping" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: EASE_AWWWARDS }}
      className="w-full max-w-[1060px] grid grid-cols-1 lg:grid-cols-12 rounded-[32px] bg-[#092922]/90 border border-[#076653]/75 overflow-hidden backdrop-blur-2xl shadow-[0_32px_90px_rgba(0,0,0,0.7)]"
    >
      {/* Left 5 Cols: 3D Visual Showcase Panel with Crisp Kirani Logo */}
      <div className="lg:col-span-5 relative min-h-[280px] lg:min-h-full bg-[#061A15] flex flex-col justify-between p-7 sm:p-9 overflow-hidden border-b lg:border-b-0 lg:border-r border-[#076653]/50">
        <img
          src="/images/landing/card-sandi.jpg"
          alt="AGP Command Center"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#061A15] via-[#061A15]/65 to-[#061A15]/30" />

        {/* Top Brand Pill with Large Crisp Kirani Shield */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-3 pl-2.5 pr-4 py-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/80 backdrop-blur-md hover:border-[#E3EF26]/65 transition-colors"
          >
            <img
              src="/kirani.svg"
              alt="Logo Kirani AGP"
              className="w-10 h-10 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(227,239,38,0.28)]"
            />
            <div className="flex flex-col leading-none">
              <span className="text-xs font-black tracking-[0.14em] uppercase text-white">
                KIRANI<span className="text-[#E3EF26]">.AGP</span>
              </span>
              <span className="text-[9px] font-mono tracking-[0.15em] text-[#94B8AE] mt-0.5">
                COMMAND 2027
              </span>
            </div>
          </Link>

          <span className="px-2.5 py-1 rounded-full bg-[#092922]/85 border border-white/10 text-[10px] font-mono uppercase tracking-[0.15em] text-[#E3EF26] backdrop-blur-md">
            INTERNAL ACCESS
          </span>
        </div>

        {/* Bottom Editorial Copy */}
        <div className="relative z-10 space-y-3 pt-12">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-[#E3EF26]">
            <Lock className="w-3 h-3" />
            <span>SISTEM REKAPITULASI TERPADU</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            Pusat Kendali Nilai &amp; Operasional Arena.
          </h2>
          <p className="text-xs sm:text-sm text-[#A9C6BE] leading-relaxed">
            Akses resmi untuk Sekretaris Utama (Super Admin), Pengelola Master Data
            (Admin), serta Operator Entri Nilai (PJ Rekap).
          </p>
        </div>
      </div>

      {/* Right 7 Cols: Clean Form Area */}
      <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-between">
        <div>
          {/* Top Navigation Strip */}
          <div className="mb-7 flex items-center justify-between pb-4 border-b border-[#076653]/45">
            <Link
              href="/"
              className="text-xs font-medium text-[#94B8AE] hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#E3EF26]" />
              <span>Beranda Event</span>
            </Link>
            <Link
              href="/schedule"
              className="text-xs font-semibold text-[#E3EF26] hover:underline inline-flex items-center gap-1"
            >
              <span>Portal Live Arena</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Form Header */}
          <div className="mb-6 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#0C342C] border border-[#076653] flex items-center justify-center shrink-0">
              <img
                src="/kirani.svg"
                alt="Logo Kirani"
                className="w-9 h-9 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Masuk Portal Panitia
              </h1>
              <p className="text-xs sm:text-sm text-[#94B8AE]">
                Masukkan username atau email resmi panitia (`@superadmin`, `@admin`, `@operator`).
              </p>
            </div>
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-2xl bg-[#0C342C] text-[#E3EF26] text-xs font-medium border border-[#E3EF26]/45">
              {errorMessage}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              id="email-input"
              label="Username atau Email Panitia"
              placeholder="superadmin@email.com atau superadmin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <label
                htmlFor="password-input"
                className="block text-[11px] font-mono font-medium text-[#B8D8D0] tracking-[0.08em] uppercase mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="relative">
                <Input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7AA89C] hover:text-white transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 pb-2">
              <label className="flex items-center gap-2 text-xs text-[#94B8AE] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#061C18] border-[#076653] accent-[#E3EF26]"
                />
                <span>Simpan akun panitia di perangkat ini</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 rounded-xl font-bold tracking-wide"
              isLoading={loading}
            >
              Masuk ke Ruang Kendali
            </Button>
          </form>
        </div>

        {/* Exact Supabase Accounts Quick-Fill Selector */}
        <div className="mt-7 pt-5 border-t border-[#076653]/45">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#7FA69A] mb-2.5">
            AKUN RESMI PANITIA TERDAFTAR (KLIK UNTUK ISI OTOMATIS)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SUPABASE_COMMITTEE_ACCOUNTS.map((acc) => {
              const IconComp = acc.icon;
              const isSelected =
                email.toLowerCase() === acc.email ||
                email.toLowerCase() === acc.username;

              return (
                <button
                  key={acc.username}
                  type="button"
                  onClick={() => {
                    setEmail(acc.email);
                    if (!password) setPassword('Password123!');
                    setErrorMessage('');
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0C342C] border-[#E3EF26] shadow-[0_0_16px_rgba(227,239,38,0.16)]'
                      : 'bg-[#061C18]/90 hover:bg-[#0C342C] border-[#076653]/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 text-[11px] font-mono font-bold text-[#E3EF26]">
                    <span className="inline-flex items-center gap-1.5">
                      <IconComp className="w-3.5 h-3.5" />
                      <span>@{acc.username}</span>
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#092922] text-[#A9C6BE]">
                      {acc.roleBadge}
                    </span>
                  </div>
                  <div className="text-[11px] text-white font-medium truncate mt-1">
                    {acc.fullName}
                  </div>
                  <div className="text-[10px] font-mono text-[#7FA69A] truncate mt-0.5">
                    {acc.email}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-[#07201B] text-[#F4F9F7] overflow-hidden selection:bg-[#E3EF26] selection:text-[#0C342C]">
      {/* Subtle Ambient Studio Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[960px] h-[460px] rounded-full opacity-30 blur-[140px]"
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

      <div className="relative z-10 w-full flex justify-center">
        <Suspense
          fallback={
            <div className="text-[#B8D8D0] text-xs font-mono uppercase tracking-[0.16em] animate-pulse">
              Memuat Portal Panitia...
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
