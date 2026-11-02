'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { Card, Badge, Button, Input, Toast } from '@/components/ui';

export default function SystemSettingsPage() {
  const [competitionName, setCompetitionName] = useState('AGP COMPETITION 2027');
  const [isInputLocked, setIsInputLocked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedRaw = localStorage.getItem('agp_system_settings');
      if (savedRaw) {
        try {
          const parsed = JSON.parse(savedRaw);
          if (parsed.competitionName) setCompetitionName(parsed.competitionName);
          if (typeof parsed.isInputLocked === 'boolean') setIsInputLocked(parsed.isInputLocked);
        } catch {
          // ignore invalid json
        }
      }
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'agp_system_settings',
        JSON.stringify({ competitionName, isInputLocked, updatedAt: new Date().toISOString() })
      );
    }
    setTimeout(() => {
      setIsSubmitting(false);
      setToastMessage('Pengaturan sistem berhasil disimpan secara global.');
    }, 350);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="pb-6 border-b border-[#076653] space-y-2">
        <Badge variant="primary" className="gap-1.5">
          <Settings className="w-3 h-3" />
          CONFIG SISTEM
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
          Pengaturan Sistem
        </h1>
        <p className="text-xs sm:text-sm text-[#B8D8D0]">
          Konfigurasi nama kejuaraan, batasan operasional, dan parameter sistem.
        </p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <Input
            id="settings-competition"
            label="Nama Kejuaraan Lomba"
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="settings-lock"
              className="text-xs font-mono text-[#B8D8D0] tracking-wider uppercase"
            >
              Kunci Akses Input Nilai
            </label>
            <select
              id="settings-lock"
              value={String(isInputLocked)}
              onChange={(e) => setIsInputLocked(e.target.value === 'true')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#061C18] border border-[#076653] focus:border-[#E3EF26] outline-none text-white text-xs font-medium transition-all"
            >
              <option value="false">Buka Sesi Input (Dapat Dimodifikasi)</option>
              <option value="true">Kunci Sesi Input (Read-Only Seluruh Operator)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[#076653]">
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              className="gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              Simpan Konfigurasi
            </Button>
          </div>
        </form>
      </Card>

      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
    </main>
  );
}
