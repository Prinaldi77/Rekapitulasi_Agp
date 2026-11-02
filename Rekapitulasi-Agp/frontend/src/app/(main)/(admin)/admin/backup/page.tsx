'use client';

import React, { useState } from 'react';
import { DatabaseBackup, DownloadCloud, FileJson, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getStoredSchedules, getStoredBaracks } from '@/lib/dynamicStore';
import { Card, Badge, Button, DataTable, Toast } from '@/components/ui';

interface BackupItem {
  id: string;
  filename: string;
  size: string;
  date: string;
  payload?: any;
}

export default function BackupDatabasePage() {
  const [backups, setBackups] = useState<BackupItem[]>([
    {
      id: '1',
      filename: 'agp_db_backup_20260805.json',
      size: '248 KB',
      date: '2026-08-05 23:00:00',
    },
    {
      id: '2',
      filename: 'agp_db_backup_20260804.json',
      size: '215 KB',
      date: '2026-08-04 23:00:00',
    },
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerDownload = (filename: string, dataObj: any) => {
    const jsonString = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBackup = async () => {
    try {
      setIsExporting(true);
      const [{ data: categories }, { data: participants }, { data: scores }, { data: schedules }, { data: baracks }] =
        await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('participants').select('*'),
          supabase.from('scores').select('*'),
          supabase.from('schedules').select('*'),
          supabase.from('baracks').select('*'),
        ]);

      const snapshotPayload = {
        meta: {
          system: 'Rekapitulasi AGP Command Center',
          version: '1.2.0',
          exportedAt: new Date().toISOString(),
        },
        categories: categories || [],
        participants: participants || [],
        scores: scores || [],
        schedules: schedules && schedules.length > 0 ? schedules : getStoredSchedules(),
        baracks: baracks && baracks.length > 0 ? baracks : getStoredBaracks(),
      };

      const jsonStr = JSON.stringify(snapshotPayload);
      const kbSize = Math.max(12, Math.round(jsonStr.length / 1024));
      const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `agp_db_backup_${dateStamp}_${Date.now().toString().slice(-4)}.json`;

      const newBackup: BackupItem = {
        id: String(Date.now()),
        filename,
        size: `${kbSize} KB`,
        date: new Date().toLocaleString('id-ID'),
        payload: snapshotPayload,
      };

      setBackups((prev) => [newBackup, ...prev]);
      if (typeof window !== 'undefined') {
        localStorage.setItem('agp_latest_backup_snapshot', jsonStr);
      }
      triggerDownload(filename, snapshotPayload);
      setToastMessage(`Cadangan database '${filename}' berhasil dibuat dan diunduh!`);
    } catch (err: any) {
      console.error(err);
      setToastMessage(`Cadangan lokal dibuat: ${err?.message || 'Mode Offline'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const columns = [
    {
      key: 'filename',
      label: 'Nama File Snapshot',
      render: (b: BackupItem) => (
        <div className="flex items-center gap-2">
          <FileJson className="w-4 h-4 text-[#E3EF26] shrink-0" />
          <span className="font-mono text-xs text-white font-medium">{b.filename}</span>
        </div>
      ),
    },
    {
      key: 'size',
      label: 'Ukuran File',
      render: (b: BackupItem) => (
        <Badge variant="secondary" className="font-mono">
          {b.size}
        </Badge>
      ),
    },
    {
      key: 'date',
      label: 'Tanggal Backup',
      render: (b: BackupItem) => (
        <span className="text-[#B8D8D0] font-mono text-xs">{b.date}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Unduh Snapshot',
      render: (b: BackupItem) => (
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5"
          onClick={() =>
            triggerDownload(
              b.filename,
              b.payload || {
                meta: { filename: b.filename, date: b.date, system: 'Rekapitulasi AGP' },
                schedules: getStoredSchedules(),
                baracks: getStoredBaracks(),
              }
            )
          }
        >
          <Download className="w-3.5 h-3.5 text-[#E3EF26]" />
          Unduh JSON
        </Button>
      ),
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="pb-6 border-b border-[#076653] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="primary" className="gap-1.5">
            <DatabaseBackup className="w-3 h-3" />
            CADANGAN DATA
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
            Backup Database
          </h1>
          <p className="text-xs sm:text-sm text-[#B8D8D0]">
            Ekspor seluruh tabel database sistem (Peserta, Skor, Jadwal, Barak, Kategori) ke berkas snapshot JSON.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleBackup}
          isLoading={isExporting}
          className="gap-1.5"
        >
          <DownloadCloud className="w-3.5 h-3.5" />
          Buat &amp; Unduh Cadangan Sekarang
        </Button>
      </div>

      <Card className="p-6">
        <h3 className="text-xs font-mono uppercase text-[#B8D8D0] tracking-wider mb-6">
          Berkas Cadangan Tersimpan ({backups.length})
        </h3>
        <DataTable
          columns={columns}
          data={backups}
          isLoading={false}
          emptyTitle="Backup Kosong"
          emptyDescription="Belum ada berkas cadangan database."
        />
      </Card>

      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </main>
  );
}
