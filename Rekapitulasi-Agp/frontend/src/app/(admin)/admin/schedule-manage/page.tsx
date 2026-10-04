'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchSchedulesFromApi, createScheduleApi, updateScheduleStatusApi, deleteScheduleApi } from '@/lib/api';
import { SchoolLevel, DynamicScheduleItem } from '@/lib/dynamicStore';
import { Card, Button, Input, Badge, Modal, EmptyState, Skeleton, Toast } from '@/components/ui';

type ViewMode = 'AGENDA' | 'TIMELINE' | 'CALENDAR';

export default function ScheduleManagePage() {
  const [schedules, setSchedules] = useState<DynamicScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'error'>('info');

  // View state switcher
  const [viewMode, setViewMode] = useState<ViewMode>('AGENDA');

  // User division restriction
  const [assignedJenjang, setAssignedJenjang] = useState<SchoolLevel | null>(null);

  // Arena Timer State (Control oleh Admin)
  const [allocatedMinutes, setAllocatedMinutes] = useState<number>(10);
  const [secondsLeft, setSecondsLeft] = useState<number>(600);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [participantNo, setParticipantNo] = useState('');
  const [teamName, setTeamName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [category, setCategory] = useState('LKBB PRAMUKA');
  const [jenjang, setJenjang] = useState<SchoolLevel>('SMA');
  const [timeSlot, setTimeSlot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterJenjang, setSelectedFilterJenjang] = useState<'ALL' | SchoolLevel>('ALL');

  // Delete confirm dialog
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState('');
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Realtime Timer Interval
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerRunning(false);
          setFeedbackType('info');
          setFeedback('⚠️ Waktu arena telah habis! Silakan ubah status peserta ke COMPLETED.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const handleStartTimer = () => {
    if (secondsLeft === 0) {
      setSecondsLeft(allocatedMinutes * 60);
    }
    setIsTimerRunning(true);
    setFeedbackType('success');
    setFeedback('▶️ Timer arena LKBB resmi dimulai!');
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    setFeedbackType('info');
    setFeedback('⏸️ Timer arena dijeda (pause).');
  };

  const handleResetTimer = (minutes = allocatedMinutes) => {
    setIsTimerRunning(false);
    setAllocatedMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setFeedbackType('info');
    setFeedback(`🔄 Timer arena direset ke ${minutes} menit.`);
  };

  const refreshSchedules = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchSchedulesFromApi();
      if (result.success && result.data) {
        const mapped: DynamicScheduleItem[] = result.data.map((item: any) => ({
          id: item.id,
          noTampil: item.participant?.show_number || 1,
          participantNo: item.participant?.participant_no || '',
          teamName: item.participant?.team_name || '',
          schoolName: item.participant?.school_name || '',
          category: item.participant?.category_id || 'LKBB PRAMUKA',
          jenjang: (item.participant?.category?.level || 'SMA') as SchoolLevel,
          timeSlot: item.time_slot || '09:00 - 09:20',
          status: (item.status || 'WAITING') as DynamicScheduleItem['status'],
        }));
        setSchedules(mapped);
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback('⚠️ Gagal mengambil jadwal dari server API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSchedules();

    // Fast polling every 2 seconds for live sync with public page
    const interval = setInterval(() => {
      refreshSchedules();
    }, 2000);

    // Auto-detect division from active operator session
    const detectUserDivision = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const email = data?.session?.user?.email?.toLowerCase() || '';
        
        if (email.includes('sma')) {
          setJenjang('SMA');
          setSelectedFilterJenjang('SMA');
          setAssignedJenjang('SMA');
        } else if (email.includes('smp')) {
          setJenjang('SMP');
          setSelectedFilterJenjang('SMP');
          setAssignedJenjang('SMP');
        } else if (email.includes('sd')) {
          setJenjang('SD');
          setSelectedFilterJenjang('SD');
          setAssignedJenjang('SD');
        }
      } catch (err) {
        console.warn('detectUserDivision session notice:', err);
      }
    };

    detectUserDivision();

    return () => clearInterval(interval);
  }, [refreshSchedules]);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!teamName || !schoolName) {
      setFeedbackType('error');
      setFeedback('⚠️ Nama Tim Pasukan dan Sekolah wajib diisi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        participant_no: participantNo || `${jenjang}-0${schedules.length + 1}`,
        team_name: teamName,
        school_name: schoolName,
        category,
        jenjang,
        time_slot: timeSlot || '09:00 - 09:20',
        status: 'WAITING' as const,
      };

      const result = await createScheduleApi(payload);
      if (!result.success) {
        throw new Error(result.message);
      }

      await refreshSchedules();
      setFeedbackType('success');
      setFeedback(`✨ Peserta '${teamName}' (${jenjang}) berhasil ditambahkan!`);
      setIsModalOpen(false);
      
      // Reset Form
      setParticipantNo('');
      setTeamName('');
      setSchoolName('');
      setTimeSlot('');
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal menyimpan jadwal: ${err.message || 'Kesalahan koneksi API.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: DynamicScheduleItem['status']) => {
    setFeedback(null);
    try {
      const target = schedules.find(s => s.id === id);
      if (!target) return;

      const result = await updateScheduleStatusApi(id, newStatus);
      if (!result.success) {
        throw new Error(result.message);
      }

      await refreshSchedules();

      // If status changed to NOW PERFORMING, auto-reset and start timer
      if (newStatus === 'NOW PERFORMING') {
        handleResetTimer(allocatedMinutes);
        setIsTimerRunning(true);
      }

      setFeedbackType('success');
      setFeedback(`⚡ Status '${target.teamName}' diperbarui menjadi: ${newStatus}`);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal memperbarui status: ${err.message || 'Kesalahan koneksi API.'}`);
    }
  };

  const handleDeleteTrigger = (id: string, name: string) => {
    setDeleteTargetId(id);
    setDeleteTargetName(name);
    setIsConfirmDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsConfirmDeleteOpen(false);
    try {
      const result = await deleteScheduleApi(deleteTargetId);
      if (!result.success) {
        throw new Error(result.message);
      }
      await refreshSchedules();
      setFeedbackType('success');
      setFeedback(`🗑️ Peserta '${deleteTargetName}' berhasil dihapus dari server.`);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal menghapus jadwal: ${err.message || 'Kesalahan koneksi API.'}`);
    }
  };

  // Filter & Search Logic
  const filteredSchedules = (schedules || []).filter(s => {
    if (!s) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesJenjang = selectedFilterJenjang === 'ALL' || s.jenjang === selectedFilterJenjang;
    const teamName = (s.teamName || '').toLowerCase();
    const schoolName = (s.schoolName || '').toLowerCase();
    const participantNo = (s.participantNo || '').toLowerCase();

    const matchesSearch = teamName.includes(q) || schoolName.includes(q) || participantNo.includes(q);
    return matchesJenjang && matchesSearch;
  });

  const currentlyPerformingTeam = schedules.find((s) => s.status === 'NOW PERFORMING');

  // Format Timer Display
  const timerMinutesDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const timerSecondsDisplay = String(secondsLeft % 60).padStart(2, '0');

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="pb-6 border-b border-green-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="font-extrabold text-[9px]">
              🎛️ CONTROL ARENA LAPANGAN
            </Badge>
            {assignedJenjang && (
              <Badge variant="warning" className="font-black text-[9px] uppercase">
                DIVISI {assignedJenjang}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">
            Urutan Tampil Realtime
          </h1>
          <p className="text-xs sm:text-sm text-green-700/70">
            {assignedJenjang 
              ? `Anda bertindak sebagai Operator Divisi LKBB ${assignedJenjang}. Mengelola urutan panggung peserta secara live.`
              : 'Ganti status panggung (NOW PERFORMING / STANDBY / NEXT) secara live per Jenjang (SD, SMP, SMA).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Controller */}
          <div className="flex bg-green-50 border border-green-200 p-1 rounded-xl">
            {(['AGENDA', 'TIMELINE', 'CALENDAR'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-green-700 text-white font-black shadow-sm'
                    : 'text-green-800 hover:bg-green-100'
                }`}
              >
                {mode === 'AGENDA' ? '📋 Agenda' : mode === 'TIMELINE' ? '📈 Timeline' : '📅 Calendar'}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-bold shrink-0 shadow-md"
          >
            ➕ Tambah Jadwal
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

      {/* ⏱️ MASTER TIMER CONTROL ARENA (KONTROL ADMIN) */}
      <Card className="bg-gradient-to-r from-green-950 to-green-900 border-green-800 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="primary" className="text-[9px] font-black uppercase bg-green-800 text-white border-green-700">
                ⏱️ CONTROL TIMER ARENA (OPERATOR)
              </Badge>
              {isTimerRunning && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  COUNTDOWN AKTIF
                </span>
              )}
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              {currentlyPerformingTeam ? (
                <span>Sedang Tampil: <strong className="text-emerald-300 font-black">{currentlyPerformingTeam.teamName}</strong> ({currentlyPerformingTeam.participantNo})</span>
              ) : (
                <span>Stopwatch Timer Penampilan LKBB Arena</span>
              )}
            </h3>
            <p className="text-xs text-green-200/80">
              Mulai, jeda, atau reset durasi waktu tampil pasukan peserta yang berada di arena secara realtime.
            </p>
          </div>

          {/* Timer Display & Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/15 backdrop-blur-md">
            <div className="text-center font-mono pr-4 border-r border-white/20">
              <div className="text-[9px] uppercase font-extrabold tracking-wider text-emerald-300">Waktu Berjalan</div>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-widest leading-none mt-1">
                {timerMinutesDisplay}:{timerSecondsDisplay}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isTimerRunning ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartTimer}
                  className="font-black text-xs shadow-md cursor-pointer"
                >
                  ▶️ Start Arena
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePauseTimer}
                  className="font-black text-xs shadow-md cursor-pointer"
                >
                  ⏸️ Pause
                </Button>
              )}

              {/* Set Preset Durasi Menit */}
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/15">
                <button
                  onClick={() => handleResetTimer(8)}
                  className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                    allocatedMinutes === 8 ? 'bg-emerald-500 text-green-950 font-black' : 'text-white hover:bg-white/10'
                  }`}
                >
                  8M (SD)
                </button>
                <button
                  onClick={() => handleResetTimer(10)}
                  className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                    allocatedMinutes === 10 ? 'bg-emerald-500 text-green-950 font-black' : 'text-white hover:bg-white/10'
                  }`}
                >
                  10M (SMP/SMA)
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResetTimer(allocatedMinutes)}
                className="font-extrabold text-xs text-white border-white/30 hover:bg-white/10 cursor-pointer"
              >
                🔄 Reset
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Filter Tabs Jenjang */}
        {!assignedJenjang && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Button
              variant={selectedFilterJenjang === 'ALL' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilterJenjang('ALL')}
              className="text-[10px] font-black uppercase"
            >
              Semua ({schedules.length})
            </Button>
            <Button
              variant={selectedFilterJenjang === 'SD' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilterJenjang('SD')}
              className="text-[10px] font-black uppercase"
            >
              🎒 SD ({schedules.filter(s => s.jenjang === 'SD').length})
            </Button>
            <Button
              variant={selectedFilterJenjang === 'SMP' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilterJenjang('SMP')}
              className="text-[10px] font-black uppercase"
            >
              🏫 SMP ({schedules.filter(s => s.jenjang === 'SMP').length})
            </Button>
            <Button
              variant={selectedFilterJenjang === 'SMA' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilterJenjang('SMA')}
              className="text-[10px] font-black uppercase"
            >
              🏛️ SMA ({schedules.filter(s => s.jenjang === 'SMA').length})
            </Button>
          </div>
        )}

        <div className="w-full sm:w-80">
          <Input
            placeholder="Cari nama regu, pangkalan, no dada..."
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

      {/* Mode Tampilan: AGENDA / TIMELINE / CALENDAR */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : filteredSchedules.length === 0 ? (
        <Card>
          <EmptyState
            title="Tidak Ada Jadwal"
            description="Belum ada urutan peserta terdaftar untuk filter ini."
          />
        </Card>
      ) : viewMode === 'AGENDA' ? (
        /* AGENDA VIEW (DAFTAR KARTU STATUS CONTROL) */
        <div className="space-y-4">
          {filteredSchedules.map((item) => {
            const isPerforming = item.status === 'NOW PERFORMING';
            const isStandby = item.status === 'STANDBY';

            return (
              <Card
                key={item.id}
                className={`transition-all duration-300 ${
                  isPerforming
                    ? 'border-red-300 bg-red-50/60 ring-2 ring-red-400'
                    : isStandby
                    ? 'border-amber-300 bg-amber-50/60'
                    : 'border-green-100 bg-white'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center font-mono font-black text-green-950 text-lg shrink-0 shadow-inner">
                      {item.noTampil}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                        <Badge variant="primary" className="text-[9px] font-black">{item.jenjang}</Badge>
                        <span className="px-2 py-0.5 rounded bg-green-50 border border-green-200 font-mono text-[10px] text-green-900 font-bold">
                          {item.participantNo}
                        </span>
                        <span className="text-xs text-green-800 font-semibold">{item.category}</span>
                      </div>

                      <h3 className="text-lg font-black text-green-950">{item.teamName}</h3>
                      <p className="text-xs text-green-700 font-medium">{item.schoolName}</p>
                    </div>
                  </div>

                  {/* Status Control Actions */}
                  <div className="flex flex-col md:items-end gap-3 shrink-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        size="sm"
                        variant={item.status === 'NOW PERFORMING' ? 'danger' : 'outline'}
                        onClick={() => handleStatusChange(item.id, 'NOW PERFORMING')}
                        className="text-[10px] font-black py-1 px-2.5 cursor-pointer"
                      >
                        🔴 NOW PERFORMING
                      </Button>
                      <Button
                        size="sm"
                        variant={item.status === 'STANDBY' ? 'secondary' : 'outline'}
                        onClick={() => handleStatusChange(item.id, 'STANDBY')}
                        className="text-[10px] font-black py-1 px-2.5 cursor-pointer"
                      >
                        ⏳ STANDBY
                      </Button>
                      <Button
                        size="sm"
                        variant={item.status === 'NEXT' ? 'primary' : 'outline'}
                        onClick={() => handleStatusChange(item.id, 'NEXT')}
                        className="text-[10px] font-black py-1 px-2.5 cursor-pointer"
                      >
                        ➡️ NEXT
                      </Button>
                      <Button
                        size="sm"
                        variant={item.status === 'COMPLETED' ? 'secondary' : 'outline'}
                        onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                        className="text-[10px] font-black py-1 px-2.5 cursor-pointer"
                      >
                        ✓ COMPLETED
                      </Button>
                      <button
                        onClick={() => handleDeleteTrigger(item.id, item.teamName)}
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200 cursor-pointer"
                        title="Hapus Jadwal"
                      >
                        🗑️
                      </button>
                    </div>

                    <span className="text-[11px] font-mono text-green-800">
                      Est. Jam: <strong className="text-green-950 font-black">{item.timeSlot}</strong>
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : viewMode === 'TIMELINE' ? (
        /* TIMELINE VIEW */
        <Card>
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase text-green-900 tracking-wider">
              Timeline Alur Tampil Lapangan
            </h3>
            <div className="relative border-l-2 border-green-200 ml-4 space-y-6 pl-6">
              {filteredSchedules.map((item, idx) => (
                <div key={item.id} className="relative">
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-green-600 shadow-sm" />
                  <div className="p-4 rounded-xl border border-green-200 bg-white shadow-xs">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-green-700">Urutan #{idx + 1} &bull; {item.timeSlot}</span>
                        <h4 className="text-base font-black text-green-950">{item.teamName} ({item.participantNo})</h4>
                        <p className="text-xs text-green-800">{item.schoolName} &bull; {item.jenjang}</p>
                      </div>
                      <Badge variant={item.status === 'NOW PERFORMING' ? 'danger' : 'primary'}>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      ) : (
        /* CALENDAR VIEW */
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase text-green-900 tracking-wider">
              Kalender Slot Jam Lapangan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredSchedules.map((item) => (
                <div key={item.id} className="p-4 rounded-2xl border border-green-200 bg-green-50/40 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono font-black text-green-800">{item.timeSlot}</span>
                    <Badge variant="primary" className="text-[8px]">{item.jenjang}</Badge>
                  </div>
                  <h4 className="font-extrabold text-sm text-green-950 truncate">{item.teamName}</h4>
                  <p className="text-xs text-green-700 truncate">{item.schoolName}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* CREATE SCHEDULE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="➕ Tambah Urutan Tampil Baru"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4 pt-2">
          <Input
            id="sched-no"
            label="Nomor Dada / Peserta *"
            placeholder="Contoh: A-01 / SD-05"
            value={participantNo}
            onChange={(e) => setParticipantNo(e.target.value)}
            required
            className="font-mono font-bold"
          />

          <Input
            id="sched-team"
            label="Nama Pasukan / Tim *"
            placeholder="Contoh: PASBRATA UTAMA"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
            className="font-bold"
          />

          <Input
            id="sched-school"
            label="Asal Pangkalan Sekolah *"
            placeholder="Contoh: SMAN 1 BANDUNG"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-green-900 uppercase tracking-wide">
                Jenjang Sekolah *
              </label>
              <select
                value={jenjang}
                onChange={(e) => setJenjang(e.target.value as SchoolLevel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-green-200 bg-white text-xs font-bold text-green-900 focus:ring-2 focus:ring-green-500 outline-none"
              >
                <option value="SD">🎒 SD / MI</option>
                <option value="SMP">🏫 SMP / MTs</option>
                <option value="SMA">🏛️ SMA / SMK / MA</option>
              </select>
            </div>

            <Input
              id="sched-slot"
              label="Est. Slot Jam Tampil *"
              placeholder="Contoh: 09:00 - 09:20"
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              required
            />
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
              Simpan Jadwal
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="⚠️ Konfirmasi Hapus Jadwal"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-green-800 leading-relaxed">
            Apakah Anda yakin ingin menghapus peserta <strong className="font-bold text-green-950">{deleteTargetName}</strong> dari urutan tampil arena?
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-green-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
              className="text-xs font-bold"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteConfirm}
              className="text-xs font-black"
            >
              Hapus dari Jadwal
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
