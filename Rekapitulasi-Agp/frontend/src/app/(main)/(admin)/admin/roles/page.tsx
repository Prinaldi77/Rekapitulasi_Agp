'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Crown, Shield, UserCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, DataTable } from '@/components/ui';

interface RolePermission {
  role: string;
  badgeVariant: 'primary' | 'info' | 'success';
  description: string;
  usersCount: number;
}

export default function RoleManagementPage() {
  const [userCounts, setUserCounts] = useState<{
    superAdmin: number;
    admin: number;
    operator: number;
  }>({
    superAdmin: 0,
    admin: 0,
    operator: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoleCounts = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.from('profiles').select('role');
        if (data) {
          let superAdmin = 0;
          let admin = 0;
          let operator = 0;
          data.forEach((u) => {
            if (u.role === 'SUPER_ADMIN' || u.role === 'GRAND_MASTER') superAdmin++;
            else if (u.role === 'ADMIN') admin++;
            else operator++;
          });
          setUserCounts({ superAdmin, admin, operator });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoleCounts();
  }, []);

  const roles: RolePermission[] = [
    {
      role: 'SUPER_ADMIN (Grand Master)',
      badgeVariant: 'primary',
      description:
        'Hak akses penuh dan kontrol mutlak terhadap semua fitur konfigurasi, database, backup, restore, dan manajemen user panitia.',
      usersCount: userCounts.superAdmin,
    },
    {
      role: 'ADMIN',
      badgeVariant: 'info',
      description:
        'Mengelola data master (Peserta, Ruang Barak, Jadwal Arena, Kategori Penilaian) serta pengawasan rekapitulasi nilai.',
      usersCount: userCounts.admin,
    },
    {
      role: 'OPERATOR_REKAP (Operator Lapangan)',
      badgeVariant: 'success',
      description:
        'Entri dan penyuntingan skor dari lembar penilaian juri ke dalam sistem secara real-time. Tidak ada login akun khusus juri; juri memberikan lembar fisik/foto yang diinput oleh Operator.',
      usersCount: userCounts.operator,
    },
  ];

  const columns = [
    {
      key: 'role',
      label: 'Nama Role Akses',
      render: (r: RolePermission) => (
        <Badge variant={r.badgeVariant} className="font-mono gap-1.5">
          {r.badgeVariant === 'primary' ? (
            <Crown className="w-3 h-3" />
          ) : r.badgeVariant === 'info' ? (
            <Shield className="w-3 h-3" />
          ) : (
            <UserCheck className="w-3 h-3" />
          )}
          {r.role}
        </Badge>
      ),
    },
    {
      key: 'description',
      label: 'Deskripsi Wewenang & Otoritas',
      render: (r: RolePermission) => (
        <p className="text-xs text-[#B8D8D0] leading-relaxed max-w-xl">{r.description}</p>
      ),
    },
    {
      key: 'usersCount',
      label: 'Jumlah Pengguna Aktif',
      render: (r: RolePermission) => (
        <Badge variant="secondary" className="font-mono">
          {r.usersCount} Akun
        </Badge>
      ),
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="pb-6 border-b border-white/[0.06] space-y-2">
        <Badge variant="primary" className="gap-1.5">
          <ShieldAlert className="w-3 h-3" />
          HAK AKSES SISTEM
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
          Role Management (RBAC)
        </h1>
        <p className="text-xs sm:text-sm text-[#B8D8D0]">
          Daftar wewenang &amp; matriks otorisasi akses (Super Admin, Admin, dan Operator Rekap).
        </p>
      </div>

      <Card className="p-6">
        <h3 className="text-xs font-mono uppercase text-[#B8D8D0] tracking-wider mb-6">
          Matriks Otorisasi Pengguna
        </h3>
        <DataTable
          columns={columns}
          data={roles}
          isLoading={loading}
          emptyTitle="Role Tidak Ditemukan"
          emptyDescription="Matriks otorisasi sistem kosong."
        />
      </Card>
    </main>
  );
}
