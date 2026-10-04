'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, DataTable, Skeleton } from '@/components/ui';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function OperatorsManagementPage() {
  const [operators, setOperators] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        setLoading(true);
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['OPERATOR', 'OPERATOR_REKAP']);
        if (data) setOperators(data as Profile[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOperators();
  }, []);

  const columns = [
    {
      key: 'username',
      label: 'Kredensial Login',
      render: (o: Profile) => (
        <span className="font-extrabold text-green-950 text-sm">@{o.username || o.id.slice(0, 8)}</span>
      )
    },
    {
      key: 'full_name',
      label: 'Nama Operator / Jabatan',
      render: (o: Profile) => (
        <span className="text-green-900 font-semibold text-xs">{o.full_name || 'Operator Lapangan'}</span>
      )
    },
    {
      key: 'role',
      label: 'Hak Akses',
      render: (o: Profile) => (
        <Badge variant="primary" className="text-[9px] font-black uppercase">
          📝 {o.role || 'OPERATOR REKAP'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      label: 'Terdaftar Pada',
      render: (o: Profile) => (
        <span className="text-[10px] text-green-700/70 font-mono font-semibold">
          {o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}
        </span>
      )
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-6 border-b border-green-100 space-y-2">
        <Badge variant="primary" className="font-black text-[9px]">👥 OPERATOR LAPANGAN</Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">Operator Rekap Management</h1>
        <p className="text-xs sm:text-sm text-green-700/70">
          Daftar Penanggung Jawab (PJ) operator rekapitulasi nilai per divisi mata lomba.
        </p>
      </div>

      <Card>
        <h3 className="text-sm font-black uppercase text-green-900 tracking-wider mb-6">Petugas Operator Aktif</h3>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={operators}
            isLoading={loading}
            emptyTitle="Operator Kosong"
            emptyDescription="Tidak ada akun operator lapangan terdaftar."
          />
        )}
      </Card>
    </main>
  );
}
