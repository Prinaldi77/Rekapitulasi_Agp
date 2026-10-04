'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Button, Input, Badge, Modal, DataTable, Skeleton, Toast } from '@/components/ui';
import { Plus, Trash2, Lock, Unlock } from 'lucide-react';

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
      const { data } = await supabase.from('categories').select('*').order('created_at', { ascending: true });
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
      setFeedback(`✅ Kategori Lomba "${competitionName}" (${level}) berhasil ditambahkan!`);
      setIsModalOpen(false);
      setCompetitionName('LKBB PRAMUKA UTAMA');
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal menambah kategori: ${err.message}`);
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
      setFeedback(nextState ? `🔓 Kategori ${c.level} dipublish ke publik.` : `🔒 Kategori ${c.level} terkunci.`);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal mengubah status publish: ${err.message}`);
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
      setFeedback(`🗑️ Kategori "${deleteTarget.competition_name}" (${deleteTarget.level}) berhasil dihapus.`);
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal menghapus kategori: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'level',
      label: 'Jenjang Tingkat',
      render: (c: Category) => (
        <Badge variant={c.level === 'SD' ? 'success' : c.level === 'SMP' ? 'primary' : 'warning'} className="font-black">
          🏫 JENJANG {c.level}
        </Badge>
      )
    },
    {
      key: 'competition_name',
      label: 'Nama Mata Lomba',
      render: (c: Category) => (
        <span className="font-extrabold text-green-950 text-sm">{c.competition_name}</span>
      )
    },
    {
      key: 'status',
      label: 'Status Penilaian Publik',
      render: (c: Category) => (
        <Badge variant={c.is_published ? 'success' : 'danger'} className="text-[9px] font-black uppercase">
          {c.is_published ? '🔓 TERPUBLIKASI' : '🔒 TERKUNCI (LOCK)'}
        </Badge>
      )
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
            className="text-[10px] font-bold py-1 px-2.5"
          >
            {c.is_published ? (
              <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Lock</span>
            ) : (
              <span className="flex items-center gap-1"><Unlock className="w-3 h-3" /> Publish</span>
            )}
          </Button>
          <button
            type="button"
            onClick={() => {
              setDeleteTarget(c);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer border border-red-200"
            title="Hapus Kategori"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-green-100">
        <div className="space-y-1">
          <Badge variant="warning" className="font-black text-[9px]">📋 MATA LOMBA MASTER</Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">Kategori Penilaian (CRUD)</h1>
          <p className="text-xs sm:text-sm text-green-700/70">Kelola skema kategori tingkat SD, SMP, dan SMA dalam AGP Competition.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="font-black text-xs shrink-0 shadow-md"
        >
          ➕ Tambah Kategori Baru
        </Button>
      </div>

      {feedback && (
        <Toast
          message={feedback}
          type={feedbackType === 'success' ? 'success' : feedbackType === 'error' ? 'error' : 'info'}
          onClose={() => setFeedback(null)}
        />
      )}

      <Card>
        <h3 className="text-sm font-black uppercase text-green-900 tracking-wider mb-6">
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
        title="➕ Tambah Kategori Penilaian Baru"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-green-900 uppercase tracking-wide">
              Jenjang Sekolah *
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-green-200 bg-white text-xs font-bold text-green-900 focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="SD">🎒 SD / MI</option>
              <option value="SMP">🏫 SMP / MTs</option>
              <option value="SMA">🏛️ SMA / SMK / MA</option>
            </select>
          </div>

          <Input
            id="cat-name"
            label="Nama Mata Lomba *"
            placeholder="Contoh: LKBB PRAMUKA UTAMA"
            value={competitionName}
            onChange={(e) => setCompetitionName(e.target.value)}
            required
            className="font-bold uppercase"
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-green-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              className="text-xs font-black"
            >
              Simpan Kategori
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="⚠️ Konfirmasi Hapus Kategori"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-green-800 leading-relaxed">
            Apakah Anda yakin ingin menghapus kategori{' '}
            <strong className="font-bold text-green-950">{deleteTarget?.competition_name}</strong> ({deleteTarget?.level}) dari database?
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-green-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              isLoading={isSubmitting}
              onClick={handleConfirmDelete}
              className="text-xs font-black"
            >
              Hapus Kategori
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
