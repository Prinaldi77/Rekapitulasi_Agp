'use client';

import React, { useState, useEffect } from 'react';
import { UserCircle, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, Input, Avatar, Skeleton } from '@/components/ui';

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
        const {
          data: { session },
        } = await supabase.auth.getSession();
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

  return (
    <main className="max-w-xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="pb-6 border-b border-white/[0.06] space-y-2">
        <Badge variant="primary" className="gap-1.5">
          <UserCircle className="w-3 h-3" />
          IDENTITAS DIRI
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
          Profil Pengguna
        </h1>
        <p className="text-xs sm:text-sm text-[#B8D8D0]">
          Rincian informasi akun panitia terhubung dalam sesi saat ini.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-72 w-full rounded-xl" />
      ) : (
        <Card className="flex flex-col items-center p-8 space-y-6 text-center">
          <Avatar name={fullName || username || email || 'Panitia'} size="lg" />
          <div className="space-y-1.5">
            <h2 className="text-lg font-medium text-white font-mono">
              @{username || 'operator'}
            </h2>
            <p className="text-xs text-[#B8D8D0]">{email}</p>
            <div className="pt-2 flex justify-center">
              <Badge variant="primary" className="font-mono uppercase gap-1.5">
                <ShieldCheck className="w-3 h-3" />
                ROLE: {role || 'OPERATOR'}
              </Badge>
            </div>
          </div>

          <div className="w-full pt-6 border-t border-white/[0.06] text-left space-y-4">
            <Input id="profile-fullName" label="Nama Lengkap" value={fullName} readOnly />
            <Input
              id="profile-username"
              label="Nama Pengguna (Username)"
              value={username}
              readOnly
              className="font-mono"
            />
            <Input id="profile-email" label="Surel (Email)" value={email} readOnly />
          </div>
        </Card>
      )}
    </main>
  );
}
