'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Button, Input } from '@/components/ui';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Lock,
} from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const customRedirect = searchParams.get('redirectTo') || searchParams.get('redirect');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const savedIdentifier = localStorage.getItem('agp_remember_user');
    if (savedIdentifier) {
      setIdentifier(savedIdentifier);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const trimmedInput = identifier.trim().toLowerCase();
    if (!trimmedInput || !password) {
      setErrorMessage('Harap isi username/email dan kata sandi.');
      setLoading(false);
      return;
    }

    // Mendukung input email lengkap maupun username panitia
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
          'Email/username atau kata sandi tidak sesuai. Pastikan akun telah terdaftar sebagai panitia resmi.'
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

          // Pastikan profile sinkron jika pengguna baru pertama kali login
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id, username, full_name, role')
            .eq('id', userId)
            .maybeSingle();

          if (!existingProfile) {
            const fullNameVal = user.user_metadata?.full_name || cleanUsername;
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
          console.error('Sinkronisasi profil login:', profileErr);
        }

        if (rememberMe) {
          localStorage.setItem('agp_remember_user', identifier.trim());
        } else {
          localStorage.removeItem('agp_remember_user');
        }

        setSuccess(true);
        const targetUrl = customRedirect || '/admin';

        setTimeout(() => {
          window.location.href = targetUrl;
        }, 700);
      }
    } catch (err: any) {
      console.error('Kesalahan Autentikasi:', err);
      setErrorMessage(
        'Gagal terhubung ke peladen autentikasi. Silakan periksa koneksi internet Anda.'
      );
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-2xl bg-[#09221C] border border-[#0E3D32] p-8 text-center space-y-5 shadow-2xl shadow-black/50"
      >
        <div className="w-14 h-14 rounded-xl bg-[#0C342C] border border-[#E3EF26]/40 flex items-center justify-center mx-auto shadow-sm">
          <ShieldCheck className="w-7 h-7 text-[#E3EF26]" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Otorisasi Berhasil
          </h2>
          <p className="text-xs text-[#94B8AE] leading-relaxed">
            Selamat bertugas. Mengalihkan ke Ruang Kendali Rekapitulasi...
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <span className="w-2 h-2 rounded-full bg-[#E3EF26] animate-ping" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="w-full max-w-[440px]"
    >
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-3 group mb-4 focus:outline-none"
        >
          <img
            src="/kirani.svg"
            alt="Logo KIRANI AGP"
            className="w-12 h-12 object-contain group-hover:opacity-90 transition-opacity"
          />
          <div className="text-left">
            <div className="text-base font-extrabold tracking-tight text-white leading-none">
              KIRANI <span className="text-[#E3EF26]">AGP-III</span>
            </div>
            <div className="text-xs font-mono tracking-wider text-[#94B8AE] uppercase mt-1">
              Rekapitulasi Nilai
            </div>
          </div>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Masuk ke Portal Panitia
        </h1>
        <p className="text-xs sm:text-sm text-[#8DAEA4] mt-1.5">
          Gunakan akun resmi panitia untuk mengakses ruang kendali.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="rounded-2xl bg-[#09221C] border border-[#0E3D32] p-6 sm:p-8 shadow-2xl shadow-black/40">
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="identifier-input"
              className="block text-xs font-mono font-medium text-[#B8D8D0] tracking-[0.06em] uppercase mb-1.5"
            >
              Email atau Username
            </label>
            <input
              id="identifier-input"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              placeholder="nama@email.com atau username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#061C18] border border-[#076653] focus:border-[#E3EF26] focus:bg-[#082620] outline-none text-white placeholder-[#5D8479] text-sm transition-all duration-200"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password-input"
                className="block text-xs font-mono font-medium text-[#B8D8D0] tracking-[0.06em] uppercase"
              >
                Kata Sandi
              </label>
            </div>
            <div className="relative">
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg bg-[#061C18] border border-[#076653] focus:border-[#E3EF26] focus:bg-[#082620] outline-none text-white placeholder-[#5D8479] text-sm transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7AA89C] hover:text-white transition-colors cursor-pointer p-0.5"
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

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-[#94B8AE] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded bg-[#061C18] border-[#076653] accent-[#E3EF26]"
              />
              <span>Ingat saya di perangkat ini</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full py-2.5 rounded-lg font-semibold text-sm tracking-wide mt-2"
            isLoading={loading}
          >
            Masuk ke Ruang Kendali
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#0E3D32] flex items-center justify-between text-xs text-[#7AA89C]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[#94B8AE] hover:text-[#E3EF26] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
          <Link
            href="/schedule"
            className="text-[#94B8AE] hover:text-[#E3EF26] transition-colors"
          >
            Portal Publik
          </Link>
        </div>
      </div>

      {/* Institutional Security Notice */}
      <div className="mt-6 text-center space-y-2">
        <p className="text-xs text-[#698E84] flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-[#E3EF26]/80" />
          <span>Akses terenkripsi khusus panitia &amp; operator resmi AGP</span>
        </p>
        <p className="text-xs text-[#4E7067]">
          &copy; {new Date().getFullYear()} KIRANI AGP-III &bull; Seluruh Hak Cipta Dilindungi
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#051814] text-[#F4F9F7] selection:bg-[#E3EF26] selection:text-[#0C342C]">
      <div className="w-full flex justify-center">
        <Suspense
          fallback={
            <div className="text-[#8DAEA4] text-xs font-mono uppercase tracking-widest animate-pulse">
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
