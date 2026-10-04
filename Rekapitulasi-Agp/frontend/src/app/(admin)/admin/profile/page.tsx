'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Button, Input, Avatar } from '@/components/ui';

export default function ProfilePage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setEmail(session.user.email || '');
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profile) {
            setUsername(profile.username || '');
            setFullName(profile.full_name || '');
            setRole(profile.role || '');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-400 text-xs font-bold animate-pulse">Memuat profil...</div>;
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-6 border-b border-slate-900 space-y-2">
        <Badge variant="primary" className="font-black text-[9px]">👤 IDENTITAS DIRI</Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Profil Pengguna</h1>
        <p className="text-xs sm:text-sm text-slate-400">Rincian informasi akun panitia terhubung dalam sesi saat ini.</p>
      </div>

      <Card className="flex flex-col items-center p-8 space-y-6 text-center">
        <Avatar name={fullName || username || email} size="lg" className="scale-125 border-4 border-slate-900 shadow-glow-emerald" />
        <div className="space-y-1">
          <h2 className="text-lg font-black text-white">@{username}</h2>
          <p className="text-xs text-slate-400">{email}</p>
          <div className="pt-2">
            <Badge variant="warning" className="text-[9px] font-black uppercase py-1 px-3">
              ⚡ ROLE: {role || 'OPERATOR'}
            </Badge>
          </div>
        </div>

        <div className="w-full pt-4 border-t border-slate-900/60 text-left space-y-4">
          <Input id="profile-fullName" label="Nama Lengkap" value={fullName} readOnly />
          <Input id="profile-username" label="Nama Pengguna (Username)" value={username} readOnly />
          <Input id="profile-email" label="Surel (Email)" value={email} readOnly />
        </div>
      </Card>
    </main>
  );
}
