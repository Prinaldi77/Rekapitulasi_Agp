'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customRedirect = searchParams?.get('redirectTo');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const rawInput = email.trim();
      let primaryEmail = rawInput;

      if (!primaryEmail.includes('@')) {
        primaryEmail = `${rawInput}@agp.local`;
      }

      // Try primary attempt
      let res: any = await supabase.auth.signInWithPassword({
        email: primaryEmail,
        password,
      });

      // Fallback attempt with @agp.com if primary fails and user didn't type explicit domain
      if (res.error && !rawInput.includes('@')) {
        const secondaryEmail = `${rawInput}@agp.com`;
        const resFallback: any = await supabase.auth.signInWithPassword({
          email: secondaryEmail,
          password,
        });
        if (!resFallback.error) {
          res = resFallback;
          primaryEmail = secondaryEmail;
        }
      }

      if (res.error) {
        console.error('Supabase Auth Error:', res.error);
        const rawMsg = res.error.message || (typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
        const finalMsg = (!rawMsg || rawMsg === '{}') 
          ? 'Kombinasi Username/Email & Password salah.' 
          : rawMsg;

        setErrorMessage(finalMsg);
        setLoading(false);
        return;
      }

      if (res.data?.session && res.data?.user) {
        // Fetch user profile role to determine default dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', res.data.user.id)
          .single();

        let targetUrl = customRedirect;
        if (!targetUrl) {
          const isGrandMaster = profile?.role === 'GRAND_MASTER' || primaryEmail.includes('grandmaster') || rawInput.includes('grandmaster');
          targetUrl = isGrandMaster ? '/admin/leaderboard' : '/admin/schedule-manage';
        }

        // Use hard location navigation to guarantee cookie sync with Next.js Middleware
        window.location.href = targetUrl;
      }
    } catch (err: any) {
      console.error('System Login Error:', err);
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat menghubungi Supabase Auth.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
      {/* Glow Accent */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-emerald-500/20 mx-auto mb-4">
          AGP
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Login Portal Panitia</h1>
        <p className="text-xs text-slate-400 mt-1">
          Masuk untuk mengakses Control Panel Panitia AGP 2026
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label className="block text-xs font-extrabold uppercase text-slate-300 mb-2 tracking-wider">
            Username atau Email Panitia
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: grandmaster / operator_lapangan"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-semibold placeholder:text-slate-600 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase text-slate-300 mb-2 tracking-wider">
            Kata Sandi (Password)
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm font-semibold placeholder:text-slate-600 outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          {loading ? (
            <span>Memverifikasi Hak Akses...</span>
          ) : (
            <>
              <span>🔑</span>
              <span>MASUK SEKARANG</span>
            </>
          )}
        </button>
      </form>

      {/* Footer Info */}
      <div className="mt-8 pt-6 border-t border-slate-800 text-center">
        <p className="text-[11px] text-slate-500 font-medium">
          Hak Akses Terlindungi. Supabase Auth &amp; Server Middleware Protection
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <Suspense fallback={<div className="text-white text-xs">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
