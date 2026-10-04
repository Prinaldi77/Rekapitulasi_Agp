'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, Button, Input, Badge, Modal, DataTable, Skeleton, Toast } from '@/components/ui';
import { useDebounce } from '@/lib/useDebounce';
import { Pencil, Trash2, Search } from 'lucide-react';

export type CompetitionCategoryType = 'LKBB' | 'PRAMUKA_REGU' | 'LOMBA_SEKOLAH';

interface Participant {
  id: string;
  participant_no: string;
  team_name: string;
  school_name: string;
  gender: string;
  sub_category?: string;
  category_id?: string;
  category?: {
    level: string;
    competition_name: string;
  };
}

interface CategoryOption {
  id: string;
  level: string;
  competition_name: string;
}

const DEFAULT_CATEGORIES: CategoryOption[] = [
  // LKBB
  { id: 'c-sd-lkbb', level: 'SD', competition_name: 'LKBB UTAMA AGP 2026' },
  { id: 'c-smp-lkbb', level: 'SMP', competition_name: 'LKBB UTAMA AGP 2026' },
  { id: 'c-sma-lkbb', level: 'SMA', competition_name: 'LKBB UTAMA AGP 2026' },
  
  // PRAMUKA REGU
  { id: 'c-sd-pionering', level: 'SD', competition_name: 'PIONERING & RANCANG BANGUN' },
  { id: 'c-sd-semaphore', level: 'SD', competition_name: 'SEMAPHORE & MORSE' },
  { id: 'c-sd-soal', level: 'SD', competition_name: 'BANK SOAL & PENGETAHUAN PRAMUKA' },
  
  { id: 'c-smp-pionering', level: 'SMP', competition_name: 'PIONERING & RANCANG BANGUN' },
  { id: 'c-smp-semaphore', level: 'SMP', competition_name: 'SEMAPHORE & MORSE' },
  { id: 'c-smp-soal', level: 'SMP', competition_name: 'BANK SOAL & PENGETAHUAN PRAMUKA' },
  
  { id: 'c-sma-pionering', level: 'SMA', competition_name: 'PIONERING & RANCANG BANGUN' },
  { id: 'c-sma-semaphore', level: 'SMA', competition_name: 'SEMAPHORE & MORSE' },
  { id: 'c-sma-soal', level: 'SMA', competition_name: 'BANK SOAL & PENGETAHUAN PRAMUKA' },
  
  // LOMBA SEKOLAH
  { id: 'c-sd-kebersihan', level: 'SD', competition_name: 'KEBERSIHAN BARAK & TENDA' },
  { id: 'c-smp-kebersihan', level: 'SMP', competition_name: 'KEBERSIHAN BARAK & TENDA' },
  { id: 'c-sma-kebersihan', level: 'SMA', competition_name: 'KEBERSIHAN BARAK & TENDA' },
  { id: 'c-sma-fashion', level: 'SMA', competition_name: 'FASHION SHOW & SERAGAM' },
  { id: 'c-sma-admin', level: 'SMA', competition_name: 'ADMINISTRASI & KEARSIPAN' },
];

export default function ParticipantsManagementPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'error'>('info');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedBidang, setSelectedBidang] = useState<'ALL' | CompetitionCategoryType>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State (Create & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [compType, setCompType] = useState<CompetitionCategoryType>('LKBB');
  const [participantNo, setParticipantNo] = useState('');
  const [teamName, setTeamName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [gender, setGender] = useState('PI');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Participant | null>(null);

  const fetchParticipantsAndCategories = useCallback(async () => {
    try {
      setLoading(true);
      const { data: catData } = await supabase.from('categories').select('id, level, competition_name').order('level');
      if (catData && catData.length > 0) {
        // Combine DB categories with default categories to ensure all branches are listed
        const existingIds = new Set(catData.map(c => c.id));
        const combined = [...catData];
        DEFAULT_CATEGORIES.forEach(dc => {
          if (!existingIds.has(dc.id)) {
            combined.push(dc);
          }
        });
        setCategories(combined);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      const { data: partData } = await supabase
        .from('participants')
        .select('*, category:categories(*)')
        .order('created_at', { ascending: false });

      if (partData) {
        setParticipants(partData as Participant[]);
      }
    } catch (err: any) {
      console.error('Error fetching participants:', err);
      setCategories(DEFAULT_CATEGORIES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParticipantsAndCategories();
  }, [fetchParticipantsAndCategories]);

  // Dynamic Filtering of Category Options based on selected Format (compType)
  const filteredCategoryOptions = useMemo(() => {
    if (compType === 'LKBB') {
      const list = categories.filter(c => c.competition_name.toUpperCase().includes('LKBB'));
      return list.length > 0 ? list : DEFAULT_CATEGORIES.filter(c => c.competition_name.toUpperCase().includes('LKBB'));
    } else if (compType === 'PRAMUKA_REGU') {
      const list = categories.filter(c => 
        c.competition_name.toUpperCase().includes('PIONERING') ||
        c.competition_name.toUpperCase().includes('SEMAPHORE') ||
        c.competition_name.toUpperCase().includes('MORSE') ||
        c.competition_name.toUpperCase().includes('SOAL') ||
        c.competition_name.toUpperCase().includes('PRAMUKA')
      );
      return list.length > 0 ? list : DEFAULT_CATEGORIES.filter(c => 
        c.competition_name.toUpperCase().includes('PIONERING') ||
        c.competition_name.toUpperCase().includes('SEMAPHORE') ||
        c.competition_name.toUpperCase().includes('MORSE') ||
        c.competition_name.toUpperCase().includes('SOAL')
      );
    } else {
      const list = categories.filter(c => 
        c.competition_name.toUpperCase().includes('KEBERSIHAN') ||
        c.competition_name.toUpperCase().includes('FASHION') ||
        c.competition_name.toUpperCase().includes('ADMIN')
      );
      return list.length > 0 ? list : DEFAULT_CATEGORIES.filter(c => 
        c.competition_name.toUpperCase().includes('KEBERSIHAN') ||
        c.competition_name.toUpperCase().includes('FASHION') ||
        c.competition_name.toUpperCase().includes('ADMIN')
      );
    }
  }, [categories, compType]);

  // Set default categoryId whenever filteredCategoryOptions changes
  useEffect(() => {
    if (filteredCategoryOptions.length > 0) {
      if (!filteredCategoryOptions.some(c => c.id === categoryId)) {
        setCategoryId(filteredCategoryOptions[0].id);
      }
    }
  }, [filteredCategoryOptions, categoryId]);

  // Helper to categorize participant row
  const getParticipantCompType = (p: Participant): CompetitionCategoryType => {
    const compName = (p.category?.competition_name || '').toUpperCase();
    const teamUpper = (p.team_name || '').toUpperCase();

    if (compName.includes('KEBERSIHAN') || compName.includes('FASHION') || compName.includes('ADMIN') || teamUpper.includes('FASHION') || teamUpper.includes('KEBERSIHAN')) {
      return 'LOMBA_SEKOLAH';
    }
    if (teamUpper.startsWith('REGU') || compName.includes('SEMAPHORE') || compName.includes('MORSE') || compName.includes('PIONERING') || compName.includes('SOAL')) {
      return 'PRAMUKA_REGU';
    }
    return 'LKBB';
  };

  const filteredParticipants = useMemo(() => {
    const q = (debouncedSearchQuery || '').toLowerCase();
    return (participants || []).filter(p => {
      if (!p) return false;
      const type = getParticipantCompType(p);
      const matchesBidang = selectedBidang === 'ALL' || selectedBidang === type;

      const teamName = (p.team_name || '').toLowerCase();
      const schoolName = (p.school_name || '').toLowerCase();
      const partNo = (p.participant_no || '').toLowerCase();

      const matchesQuery = teamName.includes(q) || schoolName.includes(q) || partNo.includes(q);

      return matchesBidang && matchesQuery;
    });
  }, [participants, selectedBidang, debouncedSearchQuery]);

  // Open Create Modal
  const handleOpenCreateModal = (type: CompetitionCategoryType = 'LKBB') => {
    setEditingId(null);
    setCompType(type);
    setParticipantNo('');
    setTeamName('');
    setSchoolName('');
    setGender(type === 'PRAMUKA_REGU' ? 'PI' : 'CAMPURAN');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (p: Participant) => {
    const type = getParticipantCompType(p);
    setEditingId(p.id);
    setCompType(type);
    setParticipantNo(p.participant_no);
    setTeamName(p.team_name);
    setSchoolName(p.school_name);
    setGender(p.gender || 'CAMPURAN');
    setCategoryId(p.category_id || (categories.length > 0 ? categories[0].id : ''));
    setIsModalOpen(true);
  };

  // Save Participant (Create or Update)
  const handleSaveParticipant = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalTeamName = teamName.trim();
    const finalSchoolName = schoolName.trim();

    // Rule: For LKBB & LOMBA_SEKOLAH, use School Name as team_name if empty
    if (compType === 'LKBB' || compType === 'LOMBA_SEKOLAH') {
      if (!finalTeamName) {
        finalTeamName = finalSchoolName;
      }
    }

    if (!participantNo.trim() || !finalSchoolName) {
      setFeedbackType('error');
      setFeedback('Nomor Dada/Peserta dan Pangkalan Sekolah wajib diisi.');
      return;
    }

    if (compType === 'PRAMUKA_REGU' && !finalTeamName) {
      setFeedbackType('error');
      setFeedback('Untuk Lomba Regu Pramuka, Nama Regu wajib diisi (Contoh: Regu Mawar).');
      return;
    }

    try {
      setIsSubmitting(true);

      const isUuid = (str?: string) => Boolean(str && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str));

      // Resolve category ID safely
      let finalCategoryId = categoryId;
      if (finalCategoryId && !isUuid(finalCategoryId)) {
        const matchingCat = filteredCategoryOptions.find(c => c.id === finalCategoryId);
        if (matchingCat) {
          try {
            const { data: dbCat } = await supabase
              .from('categories')
              .select('id')
              .eq('level', matchingCat.level)
              .ilike('competition_name', `%${matchingCat.competition_name.split(' ')[0]}%`)
              .limit(1)
              .maybeSingle();

            if (dbCat && isUuid(dbCat.id)) {
              finalCategoryId = dbCat.id;
            } else {
              const { data: newCat } = await supabase
                .from('categories')
                .insert({
                  level: matchingCat.level,
                  competition_name: matchingCat.competition_name,
                  is_published: false,
                })
                .select('id')
                .maybeSingle();

              if (newCat && isUuid(newCat.id)) {
                finalCategoryId = newCat.id;
              } else {
                finalCategoryId = '';
              }
            }
          } catch {
            finalCategoryId = '';
          }
        } else {
          finalCategoryId = '';
        }
      }

      // Extract numeric show_number from participantNo (e.g. "SMA-05" -> 5) or fallback to integer
      const extractedNum = parseInt(participantNo.replace(/\D/g, ''), 10);
      const showNumberVal = !isNaN(extractedNum) && extractedNum > 0 ? extractedNum : Math.floor(Math.random() * 100) + 1;

      const payload: any = {
        participant_no: participantNo.trim().toUpperCase(),
        show_number: showNumberVal,
        team_name: finalTeamName,
        school_name: finalSchoolName,
        gender: compType === 'PRAMUKA_REGU' ? gender : 'CAMPURAN',
      };

      if (isUuid(finalCategoryId)) {
        payload.category_id = finalCategoryId;
      }

      let saveSuccess = false;
      let saveErrorMsg = '';

      if (editingId) {
        const { error } = await supabase.from('participants').update(payload).eq('id', editingId);
        if (error) {
          saveErrorMsg = error.message || error.details || 'Supabase DB error';
          console.error('Participant update error:', saveErrorMsg, error);
        } else {
          saveSuccess = true;
        }
      } else {
        const { error } = await supabase.from('participants').insert([payload]);
        if (error) {
          saveErrorMsg = error.message || error.details || 'Supabase DB error';
          console.error('Participant insert error:', saveErrorMsg, error);
        } else {
          saveSuccess = true;
        }
      }

      // Local State Fallback (Offline / Dev resilience)
      const matchingCategory = categories.find(c => c.id === categoryId);
      const newParticipantObj: Participant = {
        id: editingId || 'p_' + Date.now(),
        participant_no: payload.participant_no,
        team_name: payload.team_name,
        school_name: payload.school_name,
        gender: payload.gender,
        category_id: isUuid(finalCategoryId) ? finalCategoryId : undefined,
        category: matchingCategory ? { level: matchingCategory.level, competition_name: matchingCategory.competition_name } : undefined,
      };

      setParticipants(prev => {
        if (editingId) {
          return prev.map(p => p.id === editingId ? { ...p, ...newParticipantObj } : p);
        }
        return [newParticipantObj, ...prev];
      });

      setIsModalOpen(false);

      if (saveSuccess) {
        setFeedbackType('success');
        setFeedback(`✅ Data kontingen "${finalSchoolName}" (${payload.participant_no}) berhasil disimpan ke database!`);
      } else {
        setFeedbackType('info');
        setFeedback(`⚡ Data kontingen "${finalSchoolName}" disimpan dalam mode lokal (${saveErrorMsg || 'Mode Offline'}).`);
      }
    } catch (err: any) {
      console.error('Save participant exception:', err?.message || err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal menyimpan data peserta: ${err?.message || 'Kesalahan koneksi database.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      const targetId = deleteTarget.id;
      const targetName = deleteTarget.school_name;

      const { error } = await supabase.from('participants').delete().eq('id', targetId);
      
      setParticipants(prev => prev.filter(p => p.id !== targetId));
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);

      if (error) {
        console.error('Delete participant notice:', error.message || error);
        setFeedbackType('info');
        setFeedback(`🗑️ Data peserta "${targetName}" dihapus dari tampilan lokal.`);
      } else {
        setFeedbackType('success');
        setFeedback(`🗑️ Data peserta "${targetName}" berhasil dihapus dari database.`);
      }
    } catch (err: any) {
      console.error('Delete participant exception:', err?.message || err);
    } finally {
      setIsSubmitting(false);
    }
  };



  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage) || 1;
  const paginatedParticipants = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredParticipants.slice(start, start + itemsPerPage);
  }, [filteredParticipants, currentPage, itemsPerPage]);

  const columns = [
    {
      key: 'participant_no',
      label: 'No Dada / Regu',
      render: (p: Participant) => (
        <span className="font-mono font-black text-green-800 text-sm px-2.5 py-1 rounded-lg bg-green-100 border border-green-300">
          {p.participant_no}
        </span>
      )
    },
    {
      key: 'identitas',
      label: 'Pangkalan Sekolah / Kontingen',
      render: (p: Participant) => {
        const type = getParticipantCompType(p);
        return (
          <div className="flex flex-col">
            <span className="font-black text-green-950 text-sm">{p.school_name}</span>
            {type === 'PRAMUKA_REGU' && p.team_name && p.team_name !== p.school_name && (
              <span className="text-xs font-extrabold text-green-700">🏕️ {p.team_name}</span>
            )}
          </div>
        );
      }
    },
    {
      key: 'bidang_lomba',
      label: 'Kategori & Mata Lomba',
      render: (p: Participant) => {
        const type = getParticipantCompType(p);
        return (
          <div className="flex flex-col gap-1 items-start">
            <Badge
              variant={type === 'LKBB' ? 'primary' : type === 'PRAMUKA_REGU' ? 'success' : 'warning'}
              className="text-[9px] font-black uppercase"
            >
              {type === 'LKBB' ? '💂‍♂️ LOMBA LKBB' : type === 'PRAMUKA_REGU' ? '🏕️ LOMBA REGU PRAMUKA' : '🎨 KONTINGEN SEKOLAH'}
            </Badge>
            <span className="text-[10px] font-bold text-green-800/80">
              [{p.category?.level || 'SMA'}] {p.category?.competition_name || 'LKBB UTAMA'}
            </span>
          </div>
        );
      }
    },
    {
      key: 'gender',
      label: 'Satuan Gender',
      render: (p: Participant) => {
        const type = getParticipantCompType(p);
        if (type !== 'PRAMUKA_REGU') {
          return <span className="text-xs text-green-800 font-bold">🏢 SEKOLAH / PASUKAN</span>;
        }
        return (
          <Badge variant={p.gender === 'PI' ? 'warning' : p.gender === 'PA' ? 'primary' : 'success'} className="text-[9px] font-black uppercase">
            {p.gender === 'PI' ? '👧 REGU PUTERI (PI)' : p.gender === 'PA' ? '👦 REGU PUTERA (PA)' : '👥 CAMPURAN'}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      label: 'Aksi Kontrol (CRUD)',
      render: (p: Participant) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenEditModal(p)}
            className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors cursor-pointer border border-green-200"
            title="Edit Peserta"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteTarget(p);
              setIsDeleteModalOpen(true);
            }}
            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors cursor-pointer border border-red-200"
            title="Hapus Peserta"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-green-100">
        <div className="space-y-1">
          <Badge variant="primary" className="font-black text-[9px]">🏃 KONTINGEN ARENA</Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">Manajemen Peserta (CRUD)</h1>
          <p className="text-xs sm:text-sm text-green-800 font-semibold">
            Kelola data kontingen Lomba LKBB (Sekolah), Regu Pramuka (Regu &amp; Satuan Gender PI/PA), serta Lomba Sekolah (Kebersihan, Fashion, Admin).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button
            variant="outline"
            onClick={() => handleOpenCreateModal('LKBB')}
            className="font-black text-xs shadow-xs border-green-300"
          >
            💂‍♂️ + LKBB (Sekolah)
          </Button>
          <Button
            variant="primary"
            onClick={() => handleOpenCreateModal('PRAMUKA_REGU')}
            className="font-black text-xs shadow-md"
          >
            🏕️ + Regu Pramuka
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOpenCreateModal('LOMBA_SEKOLAH')}
            className="font-black text-xs shadow-xs border-green-300"
          >
            🎨 + Lomba Sekolah
          </Button>
        </div>
      </div>

      {feedback && (
        <Toast
          message={feedback}
          type={feedbackType === 'success' ? 'success' : feedbackType === 'error' ? 'error' : 'info'}
          onClose={() => setFeedback(null)}
        />
      )}

      {/* Tabs Filter Bidang Lomba */}
      <div className="flex items-center gap-2 overflow-x-auto touch-pan-x pb-1">
        <button
          type="button"
          onClick={() => { setSelectedBidang('ALL'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            selectedBidang === 'ALL'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-900 border border-green-200 hover:bg-green-50'
          }`}
        >
          🌐 SEMUA BIDANG LOMBA ({participants.length})
        </button>

        <button
          type="button"
          onClick={() => { setSelectedBidang('LKBB'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            selectedBidang === 'LKBB'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-900 border border-green-200 hover:bg-green-50'
          }`}
        >
          💂‍♂️ LOMBA LKBB ({participants.filter(p => getParticipantCompType(p) === 'LKBB').length})
        </button>

        <button
          type="button"
          onClick={() => { setSelectedBidang('PRAMUKA_REGU'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            selectedBidang === 'PRAMUKA_REGU'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-900 border border-green-200 hover:bg-green-50'
          }`}
        >
          🏕️ REGU PRAMUKA ({participants.filter(p => getParticipantCompType(p) === 'PRAMUKA_REGU').length})
        </button>

        <button
          type="button"
          onClick={() => { setSelectedBidang('LOMBA_SEKOLAH'); setCurrentPage(1); }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            selectedBidang === 'LOMBA_SEKOLAH'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-900 border border-green-200 hover:bg-green-50'
          }`}
        >
          🎨 LOMBA SEKOLAH ({participants.filter(p => getParticipantCompType(p) === 'LOMBA_SEKOLAH').length})
        </button>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-6 gap-4 flex-wrap">
          <h3 className="text-sm font-black uppercase text-green-950 tracking-wider">
            Database Kontingen Peserta ({filteredParticipants.length})
          </h3>
          <div className="w-full sm:w-80">
            <Input
              placeholder="Cari pangkalan sekolah, regu, no dada..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2.5 text-xs"
              icon={<Search className="w-3.5 h-3.5 text-green-700/60" />}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={paginatedParticipants}
            isLoading={loading}
            emptyTitle="Peserta Kosong"
            emptyDescription="Belum ada kontingen peserta terdaftar pada bidang lomba ini."
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            totalItems={filteredParticipants.length}
            itemsPerPage={itemsPerPage}
          />
        )}
      </Card>

      {/* CREATE / EDIT PARTICIPANT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? '✏️ Sunting Data Peserta' : '➕ Input Kontingen Baru'}
      >
        <form onSubmit={handleSaveParticipant} className="space-y-4 pt-2">
          
          {/* Format Selector Bar */}
          <div className="p-3 rounded-xl bg-green-50 border border-green-200 space-y-2">
            <span className="text-xs font-bold text-green-950 block">Pilih Bidang &amp; Format Lomba:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setCompType('LKBB'); setGender('CAMPURAN'); }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer text-center ${
                  compType === 'LKBB' ? 'bg-green-700 text-white shadow-xs' : 'bg-white text-green-900 border border-green-200'
                }`}
              >
                💂‍♂️ LKBB (Sekolah)
              </button>

              <button
                type="button"
                onClick={() => { setCompType('PRAMUKA_REGU'); setGender('PI'); }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer text-center ${
                  compType === 'PRAMUKA_REGU' ? 'bg-green-700 text-white shadow-xs' : 'bg-white text-green-900 border border-green-200'
                }`}
              >
                🏕️ Regu Pramuka
              </button>

              <button
                type="button"
                onClick={() => { setCompType('LOMBA_SEKOLAH'); setGender('CAMPURAN'); }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer text-center ${
                  compType === 'LOMBA_SEKOLAH' ? 'bg-green-700 text-white shadow-xs' : 'bg-white text-green-900 border border-green-200'
                }`}
              >
                🎨 Lomba Sekolah
              </button>
            </div>
          </div>

          <Input
            id="participant-no"
            label={compType === 'LKBB' ? 'Nomor Dada LKBB *' : compType === 'PRAMUKA_REGU' ? 'Nomor Regu Pramuka *' : 'Nomor Kontingen Sekolah *'}
            placeholder={compType === 'LKBB' ? 'Contoh: A-01 / SD-05' : compType === 'PRAMUKA_REGU' ? 'Contoh: REG-01 / P-02' : 'Contoh: K-01'}
            value={participantNo}
            onChange={(e) => setParticipantNo(e.target.value)}
            required
            className="font-mono font-bold"
          />

          <Input
            id="school-name"
            label={compType === 'PRAMUKA_REGU' ? 'Pangkalan Sekolah / Gudep *' : 'Pangkalan Sekolah / Instansi *'}
            placeholder="Contoh: SMAN 1 BANDUNG"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
            className="font-bold"
          />

          {/* Form Field Specific to REGU PRAMUKA */}
          {compType === 'PRAMUKA_REGU' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="team-name"
                label="Nama Regu Pramuka *"
                placeholder="Contoh: REGU MAWAR / REGU ELANG"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="font-bold"
              />

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-green-950 uppercase tracking-wide">
                  Satuan Gender Regu *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-green-200 bg-white text-xs font-bold text-green-950 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="PI">👧 REGU PUTERI (PI)</option>
                  <option value="PA">👦 REGU PUTERA (PA)</option>
                  <option value="CAMPURAN">👥 REGU CAMPURAN</option>
                </select>
              </div>
            </div>
          )}

          {/* Single Unified Category & Competition Name Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-green-950 uppercase tracking-wide">
              Kategori &amp; Mata Lomba *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-green-200 bg-white text-xs font-bold text-green-950 focus:ring-2 focus:ring-green-500 outline-none font-bold"
            >
              {filteredCategoryOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.level}] {c.competition_name}
                </option>
              ))}
            </select>
          </div>

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
              {editingId ? 'Simpan Perubahan' : 'Tambah Peserta'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="⚠️ Konfirmasi Hapus Peserta"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-green-800 leading-relaxed">
            Apakah Anda yakin ingin menghapus data kontingen{' '}
            <strong className="font-bold text-green-950">{deleteTarget?.school_name}</strong> ({deleteTarget?.participant_no}) dari database?
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
              Hapus Peserta
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
