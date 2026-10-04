'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, DataTable } from '@/components/ui';

interface BackupItem {
  id: string;
  filename: string;
  size: string;
  date: string;
}

export default function BackupDatabasePage() {
  const [backups, setBackups] = useState<BackupItem[]>([
    { id: '1', filename: 'agp_db_backup_20260805.sql.gz', size: '2.4 MB', date: '2026-08-05 23:00:00' },
    { id: '2', filename: 'agp_db_backup_20260804.sql.gz', size: '2.2 MB', date: '2026-08-04 23:00:00' },
  ]);

  const handleBackup = () => {
    const newBackup = {
      id: String(backups.length + 1),
      filename: `agp_db_backup_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.sql.gz`,
      size: '2.5 MB',
      date: new Date().toLocaleString(),
    };
    setBackups(prev => [newBackup, ...prev]);
    alert('✅ Pencadangan data berhasil disimpan di media cloud storage!');
  };

  const columns = [
    {
      key: 'filename',
      label: 'Nama File Backup',
      render: (b: BackupItem) => (
        <span className="font-mono text-xs text-slate-200 font-extrabold">{b.filename}</span>
      )
    },
    {
      key: 'size',
      label: 'Ukuran File',
      render: (b: BackupItem) => (
        <span className="text-slate-400 font-semibold text-xs">{b.size}</span>
      )
    },
    {
      key: 'date',
      label: 'Tanggal Backup',
      render: (b: BackupItem) => (
        <span className="text-slate-400 font-semibold text-xs">{b.date}</span>
      )
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-6 border-b border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="warning" className="font-black text-[9px]">💾 CADANGAN DATA</Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Backup Database</h1>
          <p className="text-xs sm:text-sm text-slate-400">Ekspor seluruh tabel database sistem ke berkas terkompresi SQL Gzip.</p>
        </div>
        <Button variant="primary" onClick={handleBackup} className="text-xs font-bold">
          ⚡ Buat Cadangan Sekarang
        </Button>
      </div>

      <Card>
        <h3 className="text-sm font-black uppercase text-slate-200 tracking-wider mb-6">Berkas Cadangan Tersimpan</h3>
        <DataTable
          columns={columns}
          data={backups}
          isLoading={false}
          emptyTitle="Backup Kosong"
          emptyDescription="Belum ada berkas cadangan database."
        />
      </Card>
    </main>
  );
}
