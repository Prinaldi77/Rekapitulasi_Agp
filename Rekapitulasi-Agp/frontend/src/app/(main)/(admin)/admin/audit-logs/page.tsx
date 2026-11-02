'use client';

import React, { useState, useMemo } from 'react';
import { Activity, Search } from 'lucide-react';
import { Card, Badge, DataTable, Input, Button } from '@/components/ui';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'WARNING' | 'FAILED'>('ALL');

  const auditLogs: AuditLog[] = [
    {
      id: '1',
      timestamp: '2026-08-06 00:22:15',
      user: 'grandmaster',
      action: 'Daftar user baru @operator_lkbb_sma',
      module: 'Users',
      status: 'SUCCESS',
    },
    {
      id: '2',
      timestamp: '2026-08-06 00:15:30',
      user: 'operator_lkbb_sma',
      action: 'Input Nilai Juri 1 SMA-01',
      module: 'Score Entry',
      status: 'SUCCESS',
    },
    {
      id: '3',
      timestamp: '2026-08-05 23:45:10',
      user: 'grandmaster',
      action: 'Publish Peringkat SMA',
      module: 'Leaderboard',
      status: 'SUCCESS',
    },
    {
      id: '4',
      timestamp: '2026-08-05 23:30:12',
      user: 'system',
      action: 'Pembersihan cache database otomatis',
      module: 'Database',
      status: 'SUCCESS',
    },
    {
      id: '5',
      timestamp: '2026-08-05 22:12:05',
      user: 'operator_lkbb_smp',
      action: 'Gagal login: Password salah',
      module: 'Auth',
      status: 'WARNING',
    },
  ];

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return auditLogs.filter((log) => {
      const matchStatus = statusFilter === 'ALL' || log.status === statusFilter;
      const matchQuery =
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.module.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [searchQuery, statusFilter]);

  const columns = [
    {
      key: 'timestamp',
      label: 'Waktu Aktivitas',
      render: (a: AuditLog) => (
        <span className="font-mono text-xs text-[#B8D8D0]">{a.timestamp}</span>
      ),
    },
    {
      key: 'user',
      label: 'Pelaku (Actor)',
      render: (a: AuditLog) => (
        <span className="font-mono text-[#E3EF26] text-xs">@{a.user}</span>
      ),
    },
    {
      key: 'action',
      label: 'Detail Aksi',
      render: (a: AuditLog) => (
        <span className="text-white text-xs font-medium">{a.action}</span>
      ),
    },
    {
      key: 'module',
      label: 'Modul',
      render: (a: AuditLog) => (
        <Badge variant="secondary" className="font-mono">
          {a.module}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (a: AuditLog) => (
        <Badge
          variant={
            a.status === 'SUCCESS'
              ? 'success'
              : a.status === 'WARNING'
              ? 'warning'
              : 'danger'
          }
          className="font-mono"
        >
          {a.status}
        </Badge>
      ),
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="pb-6 border-b border-[#076653] space-y-2">
        <Badge variant="primary" className="gap-1.5">
          <Activity className="w-3 h-3" />
          LOG MONITORING
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
          Audit Logs Sistem
        </h1>
        <p className="text-xs sm:text-sm text-[#B8D8D0]">
          Riwayat jejak audit aktivitas panitia dan sistem secara realtime.
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {(['ALL', 'SUCCESS', 'WARNING', 'FAILED'] as const).map((st) => (
              <Button
                key={st}
                size="sm"
                variant={statusFilter === st ? 'primary' : 'outline'}
                onClick={() => setStatusFilter(st)}
                className="font-mono text-xs"
              >
                {st === 'ALL' ? 'SEMUA LOG' : st}
              </Button>
            ))}
          </div>
          <div className="w-full sm:w-72">
            <Input
              placeholder="Cari user, aksi, atau modul..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2 text-xs"
              icon={<Search className="w-3.5 h-3.5 text-[#7AA89C]" />}
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredLogs}
          isLoading={false}
          emptyTitle="Log Kosong"
          emptyDescription="Tidak ada audit log yang cocok dengan pencarian Anda."
        />
      </Card>
    </main>
  );
}
