'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

interface UserAccount {
  id: string;
  username: string;
  full_name: string;
  role: 'GRAND_MASTER' | 'OPERATOR';
  created_at?: string;
}

const INITIAL_USERS: UserAccount[] = [
  { id: 'u1', username: 'grandmaster', full_name: 'Sekretaris Utama AGP (Grand Master)', role: 'GRAND_MASTER' },
  { id: 'u2', username: 'operator_lkbb_sma', full_name: 'Operator Lapangan & Live Scoreboard LKBB SMA', role: 'OPERATOR' },
  { id: 'u3', username: 'operator_lkbb_smp', full_name: 'Operator Lapangan LKBB SMP', role: 'OPERATOR' },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'GRAND_MASTER' | 'OPERATOR'>('OPERATOR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch users from Supabase profiles table
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data && data.length > 0) {
        setUsers(data as UserAccount[]);
      }
    };
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    if (!cleanUsername || !fullName) {
      setFeedback('⚠️ Username dan Nama Lengkap wajib diisi.');
      return;
    }

    const pwd = password.trim() || 'Password123!';

    if (pwd.length < 6) {
      setFeedback('⚠️ Kata sandi (Password) minimal harus 6 karakter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const email = `${cleanUsername}@agp.com`;

      // Use an isolated secondary Supabase client so active Grand Master session is NEVER replaced/logged out
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const isolatedClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });

      const { data, error } = await isolatedClient.auth.signUp({
        email,
        password: pwd,
        options: {
          data: {
            username: cleanUsername,
            full_name: fullName.trim(),
            role,
          },
        },
      });

      if (error) {
        throw error;
      }

      // Also upsert profile directly
      if (data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username: cleanUsername,
          full_name: fullName.trim(),
          role,
        });
      }

      const newUser: UserAccount = {
        id: data?.user?.id || 'u_' + Date.now(),
        username: cleanUsername,
        full_name: fullName.trim(),
        role,
        created_at: new Date().toISOString(),
      };

      const updated = [...users.filter(u => u.username !== cleanUsername), newUser];
      setUsers(updated);
      setIsSubmitting(false);

      setFeedback(`✅ Akun ${role === 'GRAND_MASTER' ? '👑 Grand Master' : '⚡ Operator'} '${cleanUsername}' (${email}) berhasil dibuat! Password: ${pwd}`);

      // Reset form
      setUsername('');
      setFullName('');
      setPassword('');
    } catch (err: any) {
      setIsSubmitting(false);
      console.error('Error creating user:', err);
      setFeedback(`❌ Gagal membuat akun: ${err.message || 'Periksa koneksi Supabase.'}`);
    }
  };

  const handleRoleToggle = async (id: string, currentRole: 'GRAND_MASTER' | 'OPERATOR') => {
    const nextRole = currentRole === 'GRAND_MASTER' ? 'OPERATOR' : 'GRAND_MASTER';
    
    // Update in Supabase
    await supabase.from('profiles').update({ role: nextRole }).eq('id', id);

    const updated = users.map(u => (u.id === id ? { ...u, role: nextRole as any } : u));
    setUsers(updated);
    setFeedback(`🔄 Role akun berhasil diubah menjadi '${nextRole}'.`);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black mb-2">
            <span>👑</span>
            <span>KHUSUS SEKRETARIS UTAMA (GRAND MASTER)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Manajemen Akun Panitia &amp; Hak Akses
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Buat akun operator baru dan kelola pembagian wewenang antara Grand Master dan Operator Lapangan.
          </p>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-2">
          <span>ℹ️</span>
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah User Baru */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl h-fit">
          <h2 className="text-base font-extrabold text-white mb-4 flex items-center gap-2">
            <span>➕ Buat Akun Panitia Baru</span>
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Username Panitia *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: operator_lkbb_sma"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Nama Lengkap / Jabatan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Operator Lapangan LKBB SMA"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Kata Sandi (Password Min. 6 Karakter)
              </label>
              <input
                type="text"
                minLength={6}
                placeholder="Default: Password123!"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Kosongkan jika ingin memakai password default (Password123!).</p>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
                Wewenang &amp; Role Akses *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-xs outline-none focus:border-amber-500 font-bold"
              >
                <option value="OPERATOR">⚡ OPERATOR LAPANGAN &amp; LIVE SCOREBOARD</option>
                <option value="GRAND_MASTER">👑 GRAND MASTER (SEKRETARIS UTAMA)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
            >
              {isSubmitting ? 'MEMBUAT AKUN...' : '🔑 BUAT AKUN PANITIA'}
            </button>
          </form>
        </div>

        {/* Tabel Daftar Akun Panitia */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
            Daftar Terdaftar Akun Panitia ({users.length} Akun)
          </h2>

          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
              >
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                      u.role === 'GRAND_MASTER'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {u.role === 'GRAND_MASTER' ? '👑 GRAND MASTER' : '⚡ OPERATOR LAPANGAN'}
                    </span>
                    <span className="font-mono text-xs text-slate-400 font-bold">@{u.username}</span>
                  </div>
                  <h3 className="font-extrabold text-white text-base">{u.full_name}</h3>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => handleRoleToggle(u.id, u.role)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all"
                  >
                    🔄 Tukar Role
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
