'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Lock, Unlock, Layers, AlertTriangle, Bookmark } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Card, Button, Input, Badge, Modal, DataTable, Skeleton, Toast } from '@/components/ui';

const JUKLAK_PRESET_COMPETITIONS = [
  'LKBB PRAMUKA AGP-III (70% PBB, 20% VAFOR, 10% DANTON)',
  'PERIODE I - ADMINISTRASI REGU (AMPLOP AIRMAIL NO. 310)',
  'PERIODE I - LOMBA FOTO KREASI (@KIRANICREW_OFFICIAL)',
  'PERIODE II - BANK SOAL (5 ORANG/REGU - 100 PG)',
  'PERIODE II - SEMAPHORE (1 ORANG/REGU - 10 KATA)',
  'PERIODE II - MORSE AUDIO (1 ORANG/REGU - 10 KATA)',
  'PERIODE II - MINI PIONERING BENDERA (1 ORANG/REGU)',
  'PERIODE III - FASHION SHOW DAUR ULANG (2 ORANG/BASIS)',
  'PERIODE IV - KEBERSIHAN BARAK & LAPANGAN (2X TAHAP)',
];

interface Category {
  id: string;
  level: string;
  competition_name: string;
  is_published: boolean;
  created_at: string;
}

export default function CategoriesManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'error'>('info');

  // Modal State (Create Category)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [level, setLevel] = useState('SMA');
  const [competitionName, setCompetitionName] = useState('LKBB PRAMUKA UTAMA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });
      if (data) setCategories(data as Category[]);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Create Category
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitionName.trim()) {
      setFeedbackType('error');
      setFeedback('Nama Mata Lomba wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        level,
        competition_name: competitionName.trim().toUpperCase(),
        is_published: false,
      };

      const { error } = await supabase.from('categories').insert([payload]);
      if (error) throw error;

      setFeedbackType('success');
      setFeedback(`Kategori Lomba "${competitionName}" (${level}) berhasil ditambahkan!`);
      setIsModalOpen(false);
      setCompetitionName('LKBB PRAMUKA UTAMA');
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`Gagal menambah kategori: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Publish
  const handleTogglePublish = async (c: Category) => {
    try {
      const nextState = !c.is_published;
      const { error } = await supabase
        .from('categories')
        .update({ is_published: nextState })
        .eq('id', c.id);

      if (error) throw error;

      setFeedbackType('success');
      setFeedback(
        nextState
          ? `Kategori ${c.level} dipublish ke publik.`
          : `Kategori ${c.level} dikunci dari publik.`
      );
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`Gagal mengubah status publish: ${err.message}`);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      const { error } = await supabase.from('categories').delete().eq('id', deleteTarget.id);
      if (error) throw error;

      setFeedbackType('success');
      setFeedback(
        `Kategori "${deleteTarget.competition_name}" (${deleteTarget.level}) berhasil dihapus.`
      );
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`Gagal menghapus kategori: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'level',
      label: 'Golongan & Jenjang',
      render: (c: Category) => (
        <Badge
          variant={c.level === 'SD' ? 'success' : c.level === 'SMP' ? 'info' : 'primary'}
          className="font-mono"
        >
          {c.level === 'SD'
            ? 'GOL A • PENGGALANG SD/MI'
            : c.level === 'SMP'
            ? 'GOL B • PENGGALANG SMP/MTs'
            : 'GOL C • PENEGAK SMA/SMK/MA'}
        </Badge>
      ),
    },
    {
      key: 'competition_name',
      label: 'Nama Mata Lomba',
      render: (c: Category) => (
        <span className="font-medium text-white text-sm">{c.competition_name}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status Penilaian Publik',
      render: (c: Category) => (
        <Badge variant={c.is_published ? 'success' : 'secondary'} className="gap-1">
          {c.is_published ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
          {c.is_published ? 'TERPUBLIKASI' : 'TERKUNCI (LOCK)'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Kontrol Publikasi & Aksi (CRUD)',
      render: (c: Category) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={c.is_published ? 'outline' : 'primary'}
            onClick={() => handleTogglePublish(c)}
            className="text-xs py-1 px-2.5 gap-1.5"
          >
            {c.is_published ? (
              <>
                <Lock className="w-3 h-3" /> Lock
              </>
            ) : (
              <>
                <Unlock className="w-3 h-3" /> Publish
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={() => {
              setDeleteTarget(c);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-[#061C18] hover:bg-[#076653]/40 text-[#B8D8D0] hover:text-[#E3EF26] transition-colors cursor-pointer border border-white/[0.08]"
            title="Hapus Kategori"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
        <div className="space-y-2">
          <Badge variant="primary" className="gap-1.5">
            <Layers className="w-3 h-3" />
            MATA LOMBA MASTER • JUKLAK AGP-III
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
            Kategori Penilaian Periode I – IV (CRUD)
          </h1>
          <p className="text-xs sm:text-sm text-[#B8D8D0]">
            Kelola skema kategori Golongan A (SD/MI), Golongan B (SMP/MTs), dan Golongan C (SMA/SMK/MA) sesuai Juklak AGP-III SMKN 1 Soreang.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Tambah Kategori Baru
        </Button>
      </div>

      {/* Ringkasan Golongan A, B, C Juklak AGP-III */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 space-y-1.5" hoverGlow={false}>
          <div className="flex items-center justify-between">
            <Badge variant="success">GOLONGAN A</Badge>
            <span className="text-xs font-mono text-[#E3EF26]">27 Aba-Aba PBB</span>
          </div>
          <h3 className="text-sm font-semibold text-white">Penggalang SD / MI Sederajat</h3>
          <p className="text-xs text-[#94B8AE]">
            8 Orang/Regu • 16 Orang/Basis LKBB • Morse Audio 8 WPM • Pionering Sumpit 8 Buah.
          </p>
        </Card>
        <Card className="p-5 space-y-1.5" hoverGlow={false}>
          <div className="flex items-center justify-between">
            <Badge variant="info">GOLONGAN B</Badge>
            <span className="text-xs font-mono text-[#E3EF26]">28 Aba-Aba PBB</span>
          </div>
          <h3 className="text-sm font-semibold text-white">Penggalang SMP / MTs Sederajat</h3>
          <p className="text-xs text-[#94B8AE]">
            8 Orang/Regu • 16 Orang/Basis LKBB • Morse Audio 12 WPM • Pionering Sumpit 8 Buah.
          </p>
        </Card>
        <Card className="p-5 space-y-1.5" hoverGlow={false}>
          <div className="flex items-center justify-between">
            <Badge variant="primary">GOLONGAN C</Badge>
            <span className="text-xs font-mono text-[#E3EF26]">28 Aba-Aba PBB</span>
          </div>
          <h3 className="text-sm font-semibold text-white">Penegak SMA / SMK / MA Sederajat</h3>
          <p className="text-xs text-[#94B8AE]">
            8 Orang/Regu • 16 Orang/Basis LKBB • Morse Audio 15 WPM • Pionering Sumpit 8 Buah.
          </p>
        </Card>
      </div>

      {feedback && (
        <Toast
          message={feedback}
          type={
            feedbackType === 'success' ? 'success' : feedbackType === 'error' ? 'error' : 'info'
          }
          onClose={() => setFeedback(null)}
        />
      )}

      <Card className="p-6">
        <h3 className="text-xs font-mono uppercase text-[#B8D8D0] tracking-wider mb-6">
          Skema Kategori Aktif ({categories.length})
        </h3>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={categories}
            isLoading={loading}
            emptyTitle="Kategori Kosong"
            emptyDescription="Tidak ada skema kategori penilaian terdaftar."
          />
        )}
      </Card>

      {/* CREATE CATEGORY MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Kategori Penilaian Baru"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#B8D8D0] uppercase tracking-wider">
              Golongan &amp; Jenjang Sekolah *
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-[#061C18] text-xs font-medium text-white focus:border-[#56c2ff] outline-none"
            >
              <option value="SD">Golongan A — Penggalang SD / MI Sederajat</option>
              <option value="SMP">Golongan B — Penggalang SMP / MTs Sederajat</option>
              <option value="SMA">Golongan C — Penegak SMA / SMK / MA Sederajat</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-[#B8D8D0] uppercase tracking-wider flex items-center gap-1.5">
              <Bookmark className="w-3 h-3 text-[#E3EF26]" />
              Pilih Cepat Template Juklak AGP-III
            </label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) setCompetitionName(e.target.value);
              }}
              className="w-full px-3.5 py-2 rounded-lg border border-[#076653] bg-[#082620] text-xs font-mono text-[#E3EF26] outline-none"
            >
              <option value="">-- Pilih Mata Lomba Sesuai Juklak AGP-III --</option>
              {JUKLAK_PRESET_COMPETITIONS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>

          <Input
            id="cat-name"
            label="Nama Mata Lomba *"
            placeholder="Contoh: LKBB PRAMUKA AGP-III"
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            required
            className="uppercase"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Simpan Kategori
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Kategori"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#061C18] border border-white/[0.06]">
            <AlertTriangle className="w-5 h-5 text-[#E3EF26] shrink-0 mt-0.5" />
            <p className="text-xs text-[#B8D8D0] leading-relaxed">
              Apakah Anda yakin ingin menghapus kategori{' '}
              <strong className="font-medium text-white">{deleteTarget?.competition_name}</strong> (
              {deleteTarget?.level}) dari database?
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleConfirmDelete}
            >
              Hapus Kategori
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
