'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Badge, DataTable } from '@/components/ui';

interface RolePermission {
  role: string;
  description: string;
  usersCount: number;
}

export default function RoleManagementPage() {
  const [userCounts, setUserCounts] = useState<{ superAdmin: number; admin: number; operator: number }>({
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
          data.forEach(u => {
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
      role: '👑 SUPER_ADMIN (Grand Master)',
      description: 'Hak akses penuh dan kontrol mutlak terhadap semua fitur konfigurasi, database, backup, restore, dan manajemen user panitia.',
      usersCount: userCounts.superAdmin,
    },
    {
      role: '⚡ ADMIN',
      description: 'Mengelola data master (Peserta, Ruang Barak, Jadwal Arena, Kategori Penilaian) serta pengawasan rekapitulasi nilai.',
      usersCount: userCounts.admin,
    },
    {
      role: '📝 OPERATOR (Operator Rekap)',
      description: 'Entri dan penyuntingan skor dari lembar penilaian juri ke dalam sistem secara real-time. Tidak ada login akun khusus juri; juri memberikan lembar fisik/foto yang diinput oleh Operator.',
      usersCount: userCounts.operator,
    },
  ];

  const columns = [
    {
      key: 'role',
      label: 'Nama Role Akses',
      render: (r: RolePermission) => (
        <span className="font-extrabold text-green-950 text-sm">{r.role}</span>
      )
    },
    {
      key: 'description',
      label: 'Deskripsi Wewenang & Otoritas',
      render: (r: RolePermission) => (
        <p className="text-xs text-green-800/80 leading-normal max-w-md">{r.description}</p>
      )
    },
    {
      key: 'usersCount',
      label: 'Jumlah Pengguna Aktif',
      render: (r: RolePermission) => (
        <Badge variant="primary" className="font-mono font-bold">{r.usersCount} Akun</Badge>
      )
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-6 border-b border-green-100 space-y-2">
        <Badge variant="warning" className="font-black text-[9px]">👑 HAK AKSES SISTEM</Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">Role Management</h1>
        <p className="text-xs sm:text-sm text-green-700/70">
          Daftar wewenang &amp; matriks otorisasi akses (Super Admin, Admin, dan Operator Rekap).
        </p>
      </div>

      <Card>
        <h3 className="text-sm font-black uppercase text-green-900 tracking-wider mb-6">Matriks Otorisasi Pengguna</h3>
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
