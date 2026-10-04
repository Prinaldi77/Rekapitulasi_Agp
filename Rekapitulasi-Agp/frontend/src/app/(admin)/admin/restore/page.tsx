'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, DataTable, Modal, Toast } from '@/components/ui';

interface BackupItem {
  id: string;
  filename: string;
  size: string;
  date: string;
}

export default function RestoreDatabasePage() {
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const backups: BackupItem[] = [
    { id: '1', filename: 'agp_db_backup_20260805.sql.gz', size: '2.4 MB', date: '2026-08-05 23:00:00' },
    { id: '2', filename: 'agp_db_backup_20260804.sql.gz', size: '2.2 MB', date: '2026-08-04 23:00:00' },
  ];

  const handleConfirmRestore = () => {
    if (!selectedBackup) return;
    setToastMessage(`🔄 Pemulihan berhasil dilakukan! Database telah disetel kembali ke snapshot '${selectedBackup.filename}'.`);
    setSelectedBackup(null);
  };

  const columns = [
    {
      key: 'filename',
      label: 'Nama File Backup',
      render: (b: BackupItem) => (
        <span className="font-mono text-xs text-green-900 font-extrabold">{b.filename}</span>
      )
    },
    {
      key: 'size',
      label: 'Ukuran',
      render: (b: BackupItem) => (
        <span className="text-green-700/70 font-semibold text-xs">{b.size}</span>
      )
    },
    {
      key: 'actions',
      label: 'Pemulihan',
      render: (b: BackupItem) => (
        <Button
          variant="secondary"
          size="sm"
          className="text-xs font-bold py-1"
          onClick={() => setSelectedBackup(b)}
        >
          🔄 Restore
        </Button>
      )
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-6 border-b border-green-100 space-y-2">
        <Badge variant="warning" className="font-black text-[9px]">🔄 SNAPSHOT DATA</Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">Restore Database</h1>
        <p className="text-xs sm:text-sm text-green-700/70">Pulihkan sistem database ke snapshot titik waktu tertentu.</p>
      </div>

      <Card>
        <h3 className="text-sm font-black uppercase text-green-900 tracking-wider mb-6">Pilih Snapshot Pemulihan</h3>
        <DataTable
          columns={columns}
          data={backups}
          isLoading={false}
          emptyTitle="Snapshot Kosong"
          emptyDescription="Tidak ada snapshot pemulihan database."
        />
      </Card>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!selectedBackup}
        onClose={() => setSelectedBackup(null)}
        title="⚠️ Konfirmasi Restore Database"
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setSelectedBackup(null)}>
              Batal
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmRestore}>
              Ya, Lanjutkan Restore
            </Button>
          </>
        }
      >
        <p className="text-sm text-green-900 leading-relaxed">
          Apakah Anda yakin ingin memulihkan database dari file <strong className="font-mono">{selectedBackup?.filename}</strong>?
          <br /><br />
          <span className="text-red-600 font-semibold">Peringatan:</span> Seluruh data saat ini akan digantikan dengan data snapshot dari file tersebut.
        </p>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </main>
  );
}
