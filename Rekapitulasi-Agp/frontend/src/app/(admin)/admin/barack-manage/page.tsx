'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchBaracksFromApi, createBarackApi, deleteBarackApi } from '@/lib/api';
import { SchoolLevel, DynamicBarackItem } from '@/lib/dynamicStore';
import { Card, Button, Input, Badge, Modal, EmptyState, Skeleton, Toast } from '@/components/ui';
import { useDebounce } from '@/lib/useDebounce';

interface GroupedRoom {
  roomName: string;
  allocations: DynamicBarackItem[];
}

export default function BarackManagePage() {
  const [baracks, setBaracks] = useState<DynamicBarackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'error'>('info');

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noTampil, setNoTampil] = useState('');
  const [teamName, setTeamName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [jenjang, setJenjang] = useState<SchoolLevel>('SMA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedFilterJenjang, setSelectedFilterJenjang] = useState<'ALL' | SchoolLevel>('ALL');

  // Modal confirm states
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [deleteTargetName, setDeleteTargetName] = useState('');

  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  const refreshBaracks = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchBaracksFromApi();
      if (result.success && result.data) {
        const mapped: DynamicBarackItem[] = result.data.map((item: any) => ({
          id: item.id,
          noTampil: item.participant?.participant_no || item.no_tampil || 'A-00',
          teamName: item.participant?.team_name || item.team_name || '',
          schoolName: item.participant?.school_name || item.school_name || '',
          roomName: item.room_name || '',
          jenjang: (item.participant?.category?.level || 'SMA') as SchoolLevel,
        }));
        setBaracks(mapped);
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback('⚠️ Gagal mengambil data barak dari server API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBaracks();
  }, [refreshBaracks]);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setNoTampil('');
    setTeamName('');
    setSchoolName('');
    setRoomName('');
  }, []);

  const handleSaveBarack = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!teamName || !roomName) {
      setFeedbackType('error');
      setFeedback('⚠️ Nama Tim Pasukan dan Nama Ruangan wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        no_tampil: noTampil || `${jenjang}-0${baracks.length + 1}`,
        team_name: teamName,
        school_name: schoolName,
        room_name: roomName,
        building: 'Gedung Utama (Gedung A)',
        floor: jenjang,
      };

      const result = await createBarackApi(payload);
      if (!result.success) throw new Error(result.message);

      await refreshBaracks();
      setFeedbackType('success');
      setFeedback(`✨ Alokasi barack untuk '${teamName}' (${jenjang}) berhasil disimpan!`);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal menyimpan alokasi barak: ${err.message || 'Kesalahan koneksi API.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = useCallback((item: DynamicBarackItem) => {
    setEditingId(item.id);
    setNoTampil(item.noTampil);
    setTeamName(item.teamName);
    setSchoolName(item.schoolName);
    setRoomName(item.roomName);
    setJenjang(item.jenjang);
    setIsModalOpen(true);
  }, []);

  const handleDeleteTrigger = useCallback((id: string, name: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setIsConfirmDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = async () => {
    setIsConfirmDeleteOpen(false);
    try {
      const result = await deleteBarackApi(deleteTargetId);
      if (!result.success) throw new Error(result.message);
      await refreshBaracks();
      setFeedbackType('success');
      setFeedback(`🗑️ Alokasi barack untuk '${deleteTargetName}' berhasil dihapus.`);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal menghapus alokasi barak: ${err.message || 'Kesalahan koneksi API.'}`);
    }
  };

  const handleClearAllBaracksConfirm = async () => {
    setIsConfirmResetOpen(false);
    try {
      setFeedbackType('info');
      setFeedback('⏳ Menghapus seluruh data barak...');
      await Promise.all(baracks.map(b => deleteBarackApi(b.id)));
      await refreshBaracks();
      setFeedbackType('success');
      setFeedback('🔥 SELURUH DATA ALOKASI BARAK BERHASIL DI-RESET!');
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal mereset data barak: ${err.message}`);
    }
  };

  // Memoized filtered baracks
  const filteredBaracks = useMemo(() => {
    const q = (debouncedSearchQuery || '').toLowerCase();
    return (baracks || []).filter(b => {
      if (!b) return false;
      const matchesJenjang = selectedFilterJenjang === 'ALL' || b.jenjang === selectedFilterJenjang;
      const teamName = (b.teamName || '').toLowerCase();
      const schoolName = (b.schoolName || '').toLowerCase();
      const roomName = (b.roomName || '').toLowerCase();
      const noTampil = (b.noTampil || '').toLowerCase();

      const matchesQuery = teamName.includes(q) || schoolName.includes(q) || roomName.includes(q) || noTampil.includes(q);

      return matchesJenjang && matchesQuery;
    });
  }, [baracks, debouncedSearchQuery, selectedFilterJenjang]);

  // Memoized Grouped allocations by unique Room Name
  const groupedRooms = useMemo(() => {
    const rooms: GroupedRoom[] = [];
    const roomsMap: { [key: string]: DynamicBarackItem[] } = {};

    filteredBaracks.forEach(b => {
      if (!roomsMap[b.roomName]) {
        roomsMap[b.roomName] = [];
      }
      roomsMap[b.roomName].push(b);
    });

    Object.keys(roomsMap).forEach(roomName => {
      rooms.push({
        roomName,
        allocations: roomsMap[roomName]
      });
    });
    return rooms;
  }, [filteredBaracks]);

  // Capacity assumptions
  const maxCapacityPerRoom = 4;

  // Stats calculation memoized
  const totalUniqueRooms = useMemo(() => groupedRooms.length, [groupedRooms]);
  const totalAllocatedTeams = useMemo(() => baracks.length, [baracks]);
  const sdCount = useMemo(() => baracks.filter(b => b.jenjang === 'SD').length, [baracks]);
  const smpCount = useMemo(() => baracks.filter(b => b.jenjang === 'SMP').length, [baracks]);
  const smaCount = useMemo(() => baracks.filter(b => b.jenjang === 'SMA').length, [baracks]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="pb-6 border-b border-green-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="primary" className="font-extrabold text-[9px]">
            ⛺ PANEL LOGISTIK &amp; TRANSIT
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">
            Pengelola Ruang Transit / Barak
          </h1>
          <p className="text-xs sm:text-sm text-green-800 font-semibold">
            Kelola alokasi ruangan transit kontingen sekolah per jenjang SD, SMP, dan SMA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {baracks.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmResetOpen(true)}
              className="text-xs font-bold border-brand-rose-500/20 text-brand-rose-400 hover:bg-brand-rose-500/10"
            >
              🔥 Reset Data Barak
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="text-xs font-bold"
          >
            ➕ Alokasi Baru
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hoverGlow>
          <div className="text-[10px] font-bold text-green-700/80 uppercase tracking-wide mb-1">Total Ruang Transit</div>
          <div className="text-2xl font-black text-green-900">{totalUniqueRooms}</div>
          <p className="text-[9px] text-green-600/70 mt-1">Ruangan aktif digunakan</p>
        </Card>

        <Card hoverGlow>
          <div className="text-[10px] font-bold text-green-700/80 uppercase tracking-wide mb-1">Tim Teralokasi</div>
          <div className="text-2xl font-black text-green-900">{totalAllocatedTeams} tim</div>
          <p className="text-[9px] text-green-600/70 mt-1">Regu peserta yang terdaftar</p>
        </Card>

        <Card hoverGlow>
          <div className="text-[10px] font-bold text-green-700/80 uppercase tracking-wide mb-1">Okupansi Barak</div>
          <div className="text-2xl font-black text-green-900">
            {totalUniqueRooms > 0 ? Math.round((totalAllocatedTeams / (totalUniqueRooms * maxCapacityPerRoom)) * 100) : 0}%
          </div>
          <p className="text-[9px] text-green-600/70 mt-1">Berdasarkan kapasitas maks. 4 tim / ruang</p>
        </Card>

        <Card hoverGlow>
          <div className="text-[10px] font-bold text-green-700/80 uppercase tracking-wide mb-1">Rincian Jenjang</div>
          <div className="flex gap-3 text-xs font-black mt-2">
            <span className="text-green-800">🎒 SD: {sdCount}</span>
            <span className="text-green-700">🏫 SMP: {smpCount}</span>
            <span className="text-green-900">🏛️ SMA: {smaCount}</span>
          </div>
        </Card>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs Jenjang */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Button
            variant={selectedFilterJenjang === 'ALL' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilterJenjang('ALL')}
            className="text-[10px] font-black uppercase"
          >
            Semua ({baracks.length})
          </Button>
          <Button
            variant={selectedFilterJenjang === 'SD' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilterJenjang('SD')}
            className="text-[10px] font-black uppercase"
          >
            🎒 SD ({sdCount})
          </Button>
          <Button
            variant={selectedFilterJenjang === 'SMP' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilterJenjang('SMP')}
            className="text-[10px] font-black uppercase"
          >
            🏫 SMP ({smpCount})
          </Button>
          <Button
            variant={selectedFilterJenjang === 'SMA' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilterJenjang('SMA')}
            className="text-[10px] font-black uppercase"
          >
            🏛️ SMA ({smaCount})
          </Button>
        </div>

        <div className="w-full sm:w-80">
          <Input
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2.5 text-xs"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64 rounded-3xl" />
          ))}
        </div>
      ) : groupedRooms.length === 0 ? (
        <EmptyState
          title="Tidak Ada Alokasi Ruang Transit"
          description="Alokasi barak transitan peserta kosong atau tidak cocok dengan filter Anda."
        />
      ) : (
        /* Barack Room Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupedRooms.map((room) => {
            const currentOccupancy = room.allocations.length;
            const occupancyPercentage = Math.min((currentOccupancy / maxCapacityPerRoom) * 100, 100);
            
            return (
              <Card key={room.roomName} hoverGlow className="flex flex-col justify-between h-full space-y-5">
                
                {/* Card Header */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-black text-white">{room.roomName}</h3>
                    <Badge
                      variant={
                        currentOccupancy >= maxCapacityPerRoom 
                          ? 'danger' 
                          : currentOccupancy >= maxCapacityPerRoom - 1 
                          ? 'warning' 
                          : 'success'
                      }
                      className="text-[9px] font-black"
                    >
                      {currentOccupancy} / {maxCapacityPerRoom} Tim
                    </Badge>
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    📍 Gedung Utama A &bull; Transit Kontingen
                  </p>
                </div>

                {/* Occupancy Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>Tingkat Kepadatan</span>
                    <span>{Math.round(occupancyPercentage)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${occupancyPercentage}%`,
                        backgroundColor: occupancyPercentage >= 100 
                          ? '#f43f5e' 
                          : occupancyPercentage >= 75 
                          ? '#f59e0b' 
                          : '#10b981'
                      }}
                    />
                  </div>
                </div>

                {/* Member List (Detail Barack / Assigned Teams) */}
                <div className="space-y-3 flex-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Daftar Regu Terpeta ({currentOccupancy})
                  </div>
                  <div className="space-y-2">
                    {room.allocations.map((team) => (
                      <div
                        key={team.id}
                        className="p-3 rounded-xl border border-slate-950 bg-slate-950/40 hover:bg-slate-950/80 transition-colors flex justify-between items-center"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <Badge variant={team.jenjang === 'SD' ? 'success' : team.jenjang === 'SMP' ? 'primary' : 'warning'} className="text-[8px] px-1 py-0 scale-90">
                              {team.jenjang}
                            </Badge>
                            <span className="font-extrabold text-xs text-slate-200 truncate">{team.teamName}</span>
                          </div>
                          <p className="text-[9px] text-slate-500 truncate">{team.schoolName}</p>
                        </div>

                        {/* Assign actions */}
                        <div className="flex gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleEditClick(team)}
                            className="p-1 text-[11px] hover:text-white transition-colors cursor-pointer"
                            title="Edit Alokasi"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(team.id, team.teamName)}
                            className="p-1 text-[11px] hover:text-brand-rose-400 transition-colors cursor-pointer"
                            title="Hapus Alokasi"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT ALLOCATION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingId ? 'Edit Alokasi Ruang Transit' : 'Buat Alokasi Ruang Transit Baru'}
        size="md"
      >
        <form onSubmit={handleSaveBarack} className="space-y-5">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
              Tingkat Jenjang Sekolah
            </label>
            <select
              value={jenjang}
              onChange={(e) => setJenjang(e.target.value as SchoolLevel)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-brand-emerald-500 focus:ring-1 focus:ring-brand-emerald-500 outline-none text-slate-100 text-sm font-bold transition-all duration-300"
            >
              <option value="SD">🎒 SD / MI (Sekolah Dasar)</option>
              <option value="SMP">🏫 SMP / MTs (Sekolah Menengah Pertama)</option>
              <option value="SMA">🏛️ SMA / SMK / MA (Sekolah Menengah Atas)</option>
            </select>
          </div>

          <Input
            id="barack-noTampil"
            label="Nomor Dada / Tampil"
            placeholder="Contoh: SMA-01"
            value={noTampil}
            onChange={(e) => setNoTampil(e.target.value)}
          />

          <Input
            id="barack-teamName"
            label="Nama Pasukan / Tim"
            placeholder="Contoh: PASBRATA UTAMA"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
          />

          <Input
            id="barack-schoolName"
            label="Asal Sekolah / Pangkalan"
            placeholder="Contoh: SMAN 1 KOTA BANDUNG"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />

          <Input
            id="barack-roomName"
            label="Nama Ruangan / Kelas Transit"
            placeholder="Contoh: Kelas X-1"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-900 mt-6">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting}>
              {editingId ? 'Simpan' : 'Alokasikan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Konfirmasi Hapus Alokasi"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Apakah Anda yakin ingin menghapus alokasi barak untuk tim <strong className="text-white">'{deleteTargetName}'</strong>?
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsConfirmDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="button" onClick={handleDeleteConfirm}>
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>

      {/* CONFIRM RESET MODAL */}
      <Modal
        isOpen={isConfirmResetOpen}
        onClose={() => setIsConfirmResetOpen(false)}
        title="Konfirmasi Reset Data Barak"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">
            Apakah Anda yakin ingin **menghapus seluruh data barak**? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-900">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsConfirmResetOpen(false)}>
              Batal
            </Button>
            <Button variant="primary" size="sm" type="button" onClick={handleClearAllBaracksConfirm}>
              Ya, Hapus Semua
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
