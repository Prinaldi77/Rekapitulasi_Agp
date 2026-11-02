'use client';

import React, { useState, useEffect } from 'react';
import { UserCheck, ShieldCheck } from 'lucide-react';
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
        <span className="font-mono text-[#E3EF26] text-xs">
          @{o.username || o.id.slice(0, 8)}
        </span>
      ),
    },
    {
      key: 'full_name',
      label: 'Nama Operator / Jabatan',
      render: (o: Profile) => (
        <span className="text-white font-medium text-sm">
          {o.full_name || 'Operator Lapangan'}
        </span>
      ),
    },
    {
      key: 'role',
      label: 'Hak Akses',
      render: (o: Profile) => (
        <Badge variant="primary" className="gap-1 font-mono uppercase">
          <ShieldCheck className="w-3 h-3" />
          {o.role || 'OPERATOR REKAP'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Terdaftar Pada',
      render: (o: Profile) => (
        <span className="text-xs text-[#7AA89C] font-mono">
          {o.created_at ? new Date(o.created_at).toLocaleDateString('id-ID') : '-'}
        </span>
      ),
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="pb-6 border-b border-white/[0.06] space-y-2">
        <Badge variant="primary" className="gap-1.5">
          <UserCheck className="w-3 h-3" />
          OPERATOR LAPANGAN
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
          Operator Rekap Management
        </h1>
        <p className="text-xs sm:text-sm text-[#B8D8D0]">
          Daftar Penanggung Jawab (PJ) operator rekapitulasi nilai per divisi mata lomba.
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-xs font-mono uppercase text-[#B8D8D0] tracking-wider mb-6">
          Petugas Operator Aktif ({operators.length})
        </h3>

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
