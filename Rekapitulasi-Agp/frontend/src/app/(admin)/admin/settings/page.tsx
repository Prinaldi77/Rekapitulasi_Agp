'use client';

import React, { useState } from 'react';
import { Card, Badge, Button, Input } from '@/components/ui';

export default function SystemSettingsPage() {
  const [competitionName, setCompetitionName] = useState('AGP COMPETITION 2026');
  const [isInputLocked, setIsInputLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert('✅ Pengaturan sistem berhasil diperbarui secara global!');
    }, 800);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="pb-6 border-b border-slate-900 space-y-2">
        <Badge variant="warning" className="font-black text-[9px]">⚙️ CONFIG SISTEM</Badge>
        <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">Pengaturan Sistem</h1>
        <p className="text-xs sm:text-sm text-slate-400">Konfigurasi nama kejuaraan, batasan operasional, dan parameter sistem.</p>
      </div>

      <Card>
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <Input
            id="settings-competition"
            label="Nama Kejuaraan Lomba"
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
              Kunci Akses Input Nilai
            </label>
            <select
              value={String(isInputLocked)}
              onChange={(e) => setIsInputLocked(e.target.value === 'true')}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-brand-emerald-500 focus:ring-1 focus:ring-brand-emerald-500 outline-none text-slate-100 text-sm font-bold transition-all duration-300"
            >
              <option value="false">🔓 Buka Sesi Input (Dapat Dimodifikasi)</option>
              <option value="true">🔒 Kunci Sesi Input (Read-Only Seluruh Operator)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              Simpan Konfigurasi
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
