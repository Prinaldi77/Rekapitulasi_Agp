'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customRedirect = searchParams.get('redirect');

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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        try {
          const { user } = data.session;
          const userId = user.id;
          const metaRole = user.user_metadata?.role || 'OPERATOR';
          const usernameVal = user.user_metadata?.username || email.split('@')[0];
          const fullNameVal = user.user_metadata?.full_name || usernameVal;
          
          let dbRole = 'OPERATOR';
          if (metaRole === 'SUPER_ADMIN' || metaRole === 'GRAND_MASTER' || email.includes('grandmaster')) {
            dbRole = 'GRAND_MASTER';
          }

          await supabase.from('profiles').upsert({
            id: userId,
            username: usernameVal.toLowerCase().replace(/[^a-z0-9_]/g, ''),
            full_name: fullNameVal,
            role: dbRole,
          });
        } catch (profileErr) {
          console.error('Failed to self-heal profile on login:', profileErr);
        }

        if (rememberMe) {
          localStorage.setItem('agp_remember_email', email);
        } else {
          localStorage.removeItem('agp_remember_email');
        }

        setSuccess(true);
        let targetUrl = customRedirect || '/admin';

        setTimeout(() => {
          window.location.href = targetUrl;
        }, 1200);
      }
    } catch (err: any) {
      console.error('System Login Error:', err);
      setErrorMessage(err?.message || 'Terjadi kesalahan sistem saat menghubungi Supabase Auth.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md p-8 text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">Berhasil masuk</h2>
          <p className="text-sm text-slate-500">
            Mengalihkan ke dashboard...
          </p>
        </div>
        <div className="flex justify-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-sm p-8 shadow-sm border border-slate-200 bg-white">
      {/* Navigation Top Action Bar */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Beranda
        </Link>
        <Link
          href="/live-score"
          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Live Score
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-slate-900">Masuk ke Portal</h1>
        <p className="text-sm text-slate-500 mt-1">
          Silakan masuk menggunakan akun panitia Anda.
        </p>
      </div>

      {/* Error State */}
      {errorMessage && (
        <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100">
          {errorMessage}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label htmlFor="email-input" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email atau Username
          </label>
          <Input
            id="email-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="password-input" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative">
            <Input
              id="password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-xs font-medium text-slate-400 hover:text-slate-700"
            >
              {showPassword ? 'Sembunyikan' : 'Tampilkan'}
            </button>
          </div>
        </div>

        {/* Remember Me Toggle */}
        <div className="flex items-center pt-2 pb-4">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            Ingat saya
          </label>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full py-2.5 bg-slate-900 text-white hover:bg-slate-800"
          isLoading={loading}
        >
          Masuk
        </Button>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50">
      <Suspense fallback={<div className="text-slate-500 text-sm font-medium animate-pulse">Memuat...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
