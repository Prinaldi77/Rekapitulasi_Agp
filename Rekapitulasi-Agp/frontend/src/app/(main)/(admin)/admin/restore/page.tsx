'use client';

import React, { useState, useRef } from 'react';
import { RotateCcw, AlertTriangle, History, UploadCloud, FileJson } from 'lucide-react';
import { saveStoredSchedules, saveStoredBaracks } from '@/lib/dynamicStore';
import { Card, Badge, Button, DataTable, Modal, Toast } from '@/components/ui';

interface BackupItem {
  id: string;
  filename: string;
  size: string;
  date: string;
  payload?: any;
}

export default function RestoreDatabasePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success');

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        const kbSize = Math.max(1, Math.round(file.size / 1024));
        const uploadedItem: BackupItem = {
          id: String(Date.now()),
          filename: file.name,
          size: `${kbSize} KB`,
          date: new Date().toLocaleString('id-ID'),
          payload: parsed,
        };
        setBackups((prev) => [uploadedItem, ...prev]);
        setSelectedBackup(uploadedItem);
      } catch {
        setToastType('error');
        setToastMessage('Berkas bukan format JSON snapshot AGP yang valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (!selectedBackup) return;

    if (selectedBackup.payload) {
      if (Array.isArray(selectedBackup.payload.schedules)) {
        saveStoredSchedules(selectedBackup.payload.schedules);
      }
      if (Array.isArray(selectedBackup.payload.baracks)) {
        saveStoredBaracks(selectedBackup.payload.baracks);
      }
    }

    setToastType('success');
    setToastMessage(
      `Pemulihan berhasil dilakukan! Sistem telah disinkronisasi ke snapshot '${selectedBackup.filename}'.`
    );
    setSelectedBackup(null);
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
      label: 'Ukuran',
      render: (b: BackupItem) => (
        <Badge variant="secondary" className="font-mono">
          {b.size}
        </Badge>
      ),
    },
    {
      key: 'date',
      label: 'Waktu Snapshot',
      render: (b: BackupItem) => (
        <span className="text-[#B8D8D0] font-mono text-xs">{b.date}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Pemulihan',
      render: (b: BackupItem) => (
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => setSelectedBackup(b)}
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#E3EF26]" />
          Restore Snapshot
        </Button>
      ),
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="pb-6 border-b border-[#076653] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="primary" className="gap-1.5">
            <History className="w-3 h-3" />
            SNAPSHOT DATA
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
            Restore Database
          </h1>
          <p className="text-xs sm:text-sm text-[#B8D8D0]">
            Pulihkan sistem database dari daftar snapshot atau unggah berkas cadangan JSON dari perangkat Anda.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Unggah File Backup (.JSON)
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <h3 className="text-xs font-mono uppercase text-[#B8D8D0] tracking-wider mb-6">
          Pilih Snapshot Pemulihan ({backups.length})
        </h3>
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
        title="Konfirmasi Restore Database"
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setSelectedBackup(null)}>
              Batal
            </Button>
            <Button variant="danger" size="sm" onClick={handleConfirmRestore}>
              Ya, Lanjutkan Restore
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3 rounded-lg bg-[#061C18] border border-[#076653]">
          <AlertTriangle className="w-5 h-5 text-[#E3EF26] shrink-0 mt-0.5" />
          <p className="text-xs text-[#B8D8D0] leading-relaxed">
            Apakah Anda yakin ingin memulihkan database dari file{' '}
            <strong className="font-mono text-white">{selectedBackup?.filename}</strong>?
            <br />
            <br />
            <span className="text-[#E3EF26] font-medium">Peringatan:</span> Seluruh data saat ini
            akan digantikan dengan data snapshot dari file tersebut.
          </p>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
    </main>
  );
}
