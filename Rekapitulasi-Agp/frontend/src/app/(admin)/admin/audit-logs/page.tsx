'use client';

import React from 'react';
import { Card, Badge, DataTable } from '@/components/ui';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export default function AuditLogsPage() {
  const auditLogs: AuditLog[] = [
    { id: '1', timestamp: '2026-08-06 00:22:15', user: 'grandmaster', action: 'Daftar user baru @operator_lkbb_sma', module: 'Users', status: 'SUCCESS' },
    { id: '2', timestamp: '2026-08-06 00:15:30', user: 'operator_lkbb_sma', action: 'Input Nilai Juri 1 SMA-01', module: 'Score Entry', status: 'SUCCESS' },
    { id: '3', timestamp: '2026-08-05 23:45:10', user: 'grandmaster', action: 'Publish Peringkat SMA', module: 'Leaderboard', status: 'SUCCESS' },
    { id: '4', timestamp: '2026-08-05 23:30:12', user: 'system', action: 'Pembersihan cache database otomatis', module: 'Database', status: 'SUCCESS' },
    { id: '5', timestamp: '2026-08-05 22:12:05', user: 'operator_lkbb_smp', action: 'Gagal login: Password salah', module: 'Auth', status: 'WARNING' },
  ];

  const columns = [
    {
      key: 'timestamp',
      label: 'Waktu Aktivitas',
      render: (a: AuditLog) => (
        <span className="font-mono text-xs text-green-950 font-bold">{a.timestamp}</span>
      )
    },
    {
      key: 'user',
      label: 'Pelaku (Actor)',
      render: (a: AuditLog) => (
        <span className="font-black text-green-950 text-xs">@{a.user}</span>
      )
    },
    {
      key: 'action',
      label: 'Detail Aksi',
      render: (a: AuditLog) => (
        <span className="text-green-900 text-xs font-semibold">{a.action}</span>
      )
    },
    {
      key: 'module',
      label: 'Modul',
      render: (a: AuditLog) => (
        <Badge variant="primary" className="text-[9px] font-black">{a.module}</Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (a: AuditLog) => (
        <Badge variant={a.status === 'SUCCESS' ? 'success' : a.status === 'WARNING' ? 'warning' : 'danger'} className="text-[8px] font-black">
          {a.status}
        </Badge>
      )
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-6 border-b border-green-100 space-y-2">
        <Badge variant="primary" className="font-black text-[9px]">📁 LOG MONITORING</Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">Audit Logs Sistem</h1>
        <p className="text-xs sm:text-sm text-green-800 font-semibold">Riwayat jejak audit aktivitas panitia dan sistem secara realtime.</p>
      </div>

      <Card>
        <h3 className="text-sm font-black uppercase text-green-950 tracking-wider mb-6">Log Aktivitas Sistem</h3>
        <DataTable
          columns={columns}
          data={auditLogs}
          isLoading={false}
          emptyTitle="Log Kosong"
          emptyDescription="Belum ada audit log terekam."
        />
      </Card>
    </main>
  );
}
