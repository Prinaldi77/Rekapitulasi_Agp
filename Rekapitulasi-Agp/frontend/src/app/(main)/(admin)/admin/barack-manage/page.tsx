'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Plus,
  RotateCcw,
  Search,
  Pencil,
  Trash2,
  MapPin,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { fetchBaracksFromApi, createBarackApi, deleteBarackApi } from '@/lib/api';
import { SchoolLevel, DynamicBarackItem, getStoredBaracks, saveStoredBaracks } from '@/lib/dynamicStore';
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

  // Periode IV Kebersihan Barak 2-stage inspection tracker (stored in localStorage)
  const [inspectionStages, setInspectionStages] = useState<Record<string, { stage1: boolean; stage2: boolean }>>({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agp_barack_inspections_v1');
      if (saved) {
        try {
          setInspectionStages(JSON.parse(saved));
        } catch {
          setInspectionStages({});
        }
      }
    }
  }, []);

  const toggleInspectionStage = (roomName: string, stageKey: 'stage1' | 'stage2') => {
    setInspectionStages((prev) => {
      const cur = prev[roomName] || { stage1: false, stage2: false };
      const next = {
        ...prev,
        [roomName]: { ...cur, [stageKey]: !cur[stageKey] },
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('agp_barack_inspections_v1', JSON.stringify(next));
      }
      return next;
    });
  };

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
        saveStoredBaracks(mapped);
      } else {
        setBaracks(getStoredBaracks());
      }
    } catch {
      setBaracks(getStoredBaracks());
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
      setFeedback('Nama Tim Pasukan dan Nama Ruangan wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingId) {
        await deleteBarackApi(editingId).catch(() => null);
      }

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
      setFeedback(
        editingId
          ? `Alokasi barak untuk '${teamName}' (${jenjang}) berhasil diperbarui!`
          : `Alokasi barak untuk '${teamName}' (${jenjang}) berhasil disimpan!`
      );
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`Gagal menyimpan alokasi barak: ${err.message || 'Kesalahan koneksi API.'}`);
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
      setFeedback(`Alokasi barak untuk '${deleteTargetName}' berhasil dihapus.`);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`Gagal menghapus alokasi barak: ${err.message || 'Kesalahan koneksi API.'}`);
    }
  };

  const handleClearAllBaracksConfirm = async () => {
    setIsConfirmResetOpen(false);
    try {
      setFeedbackType('info');
      setFeedback('Menghapus seluruh data barak...');
      await Promise.all(baracks.map((b) => deleteBarackApi(b.id)));
      await refreshBaracks();
      setFeedbackType('success');
      setFeedback('Seluruh data alokasi barak berhasil di-reset.');
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`Gagal mereset data barak: ${err.message}`);
    }
  };

  // Memoized filtered baracks
  const filteredBaracks = useMemo(() => {
    const q = (debouncedSearchQuery || '').toLowerCase();
    return (baracks || []).filter((b) => {
      if (!b) return false;
      const matchesJenjang =
        selectedFilterJenjang === 'ALL' || b.jenjang === selectedFilterJenjang;
      const teamNameStr = (b.teamName || '').toLowerCase();
      const schoolNameStr = (b.schoolName || '').toLowerCase();
      const roomNameStr = (b.roomName || '').toLowerCase();
      const noTampilStr = (b.noTampil || '').toLowerCase();

      const matchesQuery =
        teamNameStr.includes(q) ||
        schoolNameStr.includes(q) ||
        roomNameStr.includes(q) ||
        noTampilStr.includes(q);

      return matchesJenjang && matchesQuery;
    });
  }, [baracks, debouncedSearchQuery, selectedFilterJenjang]);

  // Memoized Grouped allocations by unique Room Name
  const groupedRooms = useMemo(() => {
    const rooms: GroupedRoom[] = [];
    const roomsMap: { [key: string]: DynamicBarackItem[] } = {};

    filteredBaracks.forEach((b) => {
      if (!roomsMap[b.roomName]) {
        roomsMap[b.roomName] = [];
      }
      roomsMap[b.roomName].push(b);
    });

    Object.keys(roomsMap).forEach((roomName) => {
      rooms.push({
        roomName,
        allocations: roomsMap[roomName],
      });
    });
    return rooms;
  }, [filteredBaracks]);

  // Capacity assumptions
  const maxCapacityPerRoom = 4;

  // Stats calculation memoized
  const totalUniqueRooms = useMemo(() => groupedRooms.length, [groupedRooms]);
  const totalAllocatedTeams = useMemo(() => baracks.length, [baracks]);
  const sdCount = useMemo(() => baracks.filter((b) => b.jenjang === 'SD').length, [baracks]);
  const smpCount = useMemo(() => baracks.filter((b) => b.jenjang === 'SMP').length, [baracks]);
  const smaCount = useMemo(() => baracks.filter((b) => b.jenjang === 'SMA').length, [baracks]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-6 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="primary" className="gap-1.5">
            <Building2 className="w-3 h-3" />
            PANEL LOGISTIK, TRANSIT &amp; PERIODE IV KEBERSIHAN BARAK
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
            Pengelola Ruang Transit / Barak (SMKN 1 Soreang)
          </h1>
          <p className="text-xs sm:text-sm text-[#B8D8D0]">
            Kelola alokasi ruang kelas transit kontingen Golongan A (SD/MI), B (SMP/MTs), dan C (SMA/SMK/MA) serta pantau 2 tahap inspeksi kebersihan barak (Nilai Maksimal 100 Poin).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {baracks.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsConfirmResetOpen(true)}
              className="gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Data Barak
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Alokasi Baru
          </Button>
        </div>
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="text-xs font-mono text-[#7AA89C] uppercase tracking-wider mb-1">
            Total Ruang Transit
          </div>
          <div className="text-2xl font-semibold text-white font-mono">{totalUniqueRooms}</div>
          <p className="text-xs text-[#B8D8D0] mt-1">Ruangan aktif digunakan</p>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono text-[#7AA89C] uppercase tracking-wider mb-1">
            Tim Teralokasi
          </div>
          <div className="text-2xl font-semibold text-[#56c2ff] font-mono">
            {totalAllocatedTeams} tim
          </div>
          <p className="text-xs text-[#B8D8D0] mt-1">Regu peserta yang terdaftar</p>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono text-[#7AA89C] uppercase tracking-wider mb-1">
            Okupansi Barak
          </div>
          <div className="text-2xl font-semibold text-[#E3EF26] font-mono">
            {totalUniqueRooms > 0
              ? Math.round((totalAllocatedTeams / (totalUniqueRooms * maxCapacityPerRoom)) * 100)
              : 0}
            %
          </div>
          <p className="text-xs text-[#B8D8D0] mt-1">Kapasitas maks. 4 tim / ruang</p>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-mono text-[#7AA89C] uppercase tracking-wider mb-2">
            Rincian Jenjang
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="success">SD: {sdCount}</Badge>
            <Badge variant="info">SMP: {smpCount}</Badge>
            <Badge variant="primary">SMA: {smaCount}</Badge>
          </div>
        </Card>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {(
            [
              { key: 'ALL', label: `SEMUA (${baracks.length})` },
              { key: 'SD', label: `SD (${sdCount})` },
              { key: 'SMP', label: `SMP (${smpCount})` },
              { key: 'SMA', label: `SMA (${smaCount})` },
            ] as const
          ).map((item) => (
            <Button
              key={item.key}
              variant={selectedFilterJenjang === item.key ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilterJenjang(item.key)}
              className="text-xs font-mono uppercase"
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="w-full sm:w-80">
          <Input
            placeholder="Cari ruangan, nama regu, sekolah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-2 text-xs"
            icon={<Search className="w-3.5 h-3.5 text-[#7AA89C]" />}
          />
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : groupedRooms.length === 0 ? (
        <EmptyState
          title="Tidak Ada Alokasi Ruang Transit"
          description="Alokasi barak transitan peserta kosong atau tidak cocok dengan filter Anda."
        />
      ) : (
        /* Barack Room Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groupedRooms.map((room) => {
            const currentOccupancy = room.allocations.length;
            const occupancyPercentage = Math.min(
              (currentOccupancy / maxCapacityPerRoom) * 100,
              100
            );

            return (
              <Card
                key={room.roomName}
                className="p-5 flex flex-col justify-between h-full space-y-5"
              >
                {/* Card Header */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-semibold text-white">{room.roomName}</h3>
                    <Badge
                      variant={
                        currentOccupancy >= maxCapacityPerRoom
                          ? 'danger'
                          : currentOccupancy >= maxCapacityPerRoom - 1
                          ? 'warning'
                          : 'success'
                      }
                      className="font-mono"
                    >
                      {currentOccupancy} / {maxCapacityPerRoom} Tim
                    </Badge>
                  </div>
                  <p className="text-xs text-[#7AA89C] font-mono uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#E3EF26]" />
                    Kampus SMKN 1 Soreang &bull; Periode IV Kebersihan Barak
                  </p>
                </div>

                {/* Periode IV Inspection Stage Toggles (2x Penilaian Juklak AGP-III) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(['stage1', 'stage2'] as const).map((stg, idx) => {
                    const isChecked = !!inspectionStages[room.roomName]?.[stg];
                    return (
                      <button
                        key={stg}
                        type="button"
                        onClick={() => toggleInspectionStage(room.roomName, stg)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-[#076653]/40 border-[#E3EF26]/50 text-[#E3EF26]'
                            : 'bg-[#061C18] border-white/[0.08] text-[#7AA89C] hover:text-white'
                        }`}
                      >
                        <span>INSPEKSI TAHAP {idx + 1}</span>
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isChecked ? 'text-[#E3EF26]' : 'text-[#7AA89C]/50'}`} />
                      </button>
                    );
                  })}
                </div>

                {/* Occupancy Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono text-[#B8D8D0]">
                    <span>Tingkat Kepadatan</span>
                    <span>{Math.round(occupancyPercentage)}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#061C18] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${occupancyPercentage}%`,
                        backgroundColor:
                          occupancyPercentage >= 100
                            ? '#E3EF26'
                            : occupancyPercentage >= 75
                            ? '#56c2ff'
                            : '#E3EF26',
                      }}
                    />
                  </div>
                </div>

                {/* Member List (Detail Barack / Assigned Teams) */}
                <div className="space-y-2.5 flex-1">
                  <div className="text-xs font-mono text-[#7AA89C] uppercase tracking-wider">
                    Daftar Regu Terpeta ({currentOccupancy})
                  </div>
                  <div className="space-y-2">
                    {room.allocations.map((team) => (
                      <div
                        key={team.id}
                        className="p-3 rounded-lg border border-white/[0.06] bg-[#061C18] hover:border-white/[0.12] transition-colors flex justify-between items-center"
                      >
                        <div className="space-y-0.5 min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant={
                                team.jenjang === 'SD'
                                  ? 'success'
                                  : team.jenjang === 'SMP'
                                  ? 'info'
                                  : 'primary'
                              }
                              className="text-xs px-1.5 py-0"
                            >
                              {team.jenjang}
                            </Badge>
                            <span className="font-medium text-xs text-white truncate">
                              {team.teamName}
                            </span>
                          </div>
                          <p className="text-xs text-[#B8D8D0] truncate">{team.schoolName}</p>
                        </div>

                        {/* Assign actions */}
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleEditClick(team)}
                            className="p-1.5 rounded-md text-[#B8D8D0] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Edit Alokasi"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrigger(team.id, team.teamName)}
                            className="p-1.5 rounded-md text-[#B8D8D0] hover:text-[#E3EF26] hover:bg-[#076653]/40 transition-colors cursor-pointer"
                            title="Hapus Alokasi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        <form onSubmit={handleSaveBarack} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-[#B8D8D0] tracking-wider uppercase">
              Tingkat Jenjang Sekolah
            </label>
            <select
              value={jenjang}
              onChange={(e) => setJenjang(e.target.value as SchoolLevel)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#061C18] border border-white/[0.08] focus:border-[#56c2ff] outline-none text-white text-xs font-medium transition-all"
            >
              <option value="SD">SD / MI (Sekolah Dasar)</option>
              <option value="SMP">SMP / MTs (Sekolah Menengah Pertama)</option>
              <option value="SMA">SMA / SMK / MA (Sekolah Menengah Atas)</option>
            </select>
          </div>

          <Input
            id="barack-noTampil"
            label="Nomor Dada / Tampil"
            placeholder="Contoh: SMA-01"
            value={noTampil}
            onChange={(e) => setNoTampil(e.target.value)}
            className="font-mono"
          />

          <Input
            id="barack-teamName"
            label="Nama Pasukan / Tim *"
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
            label="Nama Ruangan / Kelas Transit *"
            placeholder="Contoh: Kelas X-1"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06] mt-6">
            <Button
              variant="secondary"
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
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#061C18] border border-white/[0.06]">
            <AlertTriangle className="w-5 h-5 text-[#E3EF26] shrink-0 mt-0.5" />
            <p className="text-xs text-[#B8D8D0] leading-relaxed">
              Apakah Anda yakin ingin menghapus alokasi barak untuk tim{' '}
              <strong className="text-white">&apos;{deleteTargetName}&apos;</strong>?
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button variant="danger" size="sm" type="button" onClick={handleDeleteConfirm}>
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
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#061C18] border border-white/[0.06]">
            <AlertTriangle className="w-5 h-5 text-[#E3EF26] shrink-0 mt-0.5" />
            <p className="text-xs text-[#B8D8D0] leading-relaxed">
              Apakah Anda yakin ingin <strong className="text-white">menghapus seluruh data barak</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setIsConfirmResetOpen(false)}
            >
              Batal
            </Button>
            <Button variant="danger" size="sm" type="button" onClick={handleClearAllBaracksConfirm}>
              Ya, Hapus Semua
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
