'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Search,
  ListOrdered,
  GitCommitHorizontal,
  Calendar,
  Radio,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchSchedulesFromApi, createScheduleApi, updateScheduleStatusApi, deleteScheduleApi } from '@/lib/api';
import { SchoolLevel, DynamicScheduleItem, getStoredSchedules, saveStoredSchedules } from '@/lib/dynamicStore';
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

  // Arena Timer State (Control oleh Admin - Default 8 Menit sesuai Juklak AGP-III)
  const [allocatedMinutes, setAllocatedMinutes] = useState<number>(8);
  const [secondsLeft, setSecondsLeft] = useState<number>(480);
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
          setFeedback('Waktu arena telah habis! Silakan ubah status peserta ke COMPLETED.');
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
    setFeedback('Timer arena LKBB resmi dimulai.');
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
    setFeedbackType('info');
    setFeedback('Timer arena dijeda (pause).');
  };

  const handleResetTimer = (minutes = allocatedMinutes) => {
    setIsTimerRunning(false);
    setAllocatedMinutes(minutes);
    setSecondsLeft(minutes * 60);
    setFeedbackType('info');
    setFeedback(`Timer arena direset ke ${minutes} menit.`);
  };

  const refreshSchedules = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
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
        saveStoredSchedules(mapped);
      } else {
        setSchedules(getStoredSchedules());
      }
    } catch {
      setSchedules(getStoredSchedules());
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSchedules(true);

    // Fast polling every 2 seconds for live sync with public page (without skeleton flicker)
    const interval = setInterval(() => {
      refreshSchedules(false);
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
      setFeedback('Nama Tim Pasukan dan Sekolah wajib diisi.');
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
      setFeedback(`Peserta '${teamName}' (${jenjang}) berhasil ditambahkan!`);
      setIsModalOpen(false);

      // Reset Form
      setParticipantNo('');
      setTeamName('');
      setSchoolName('');
      setTimeSlot('');
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`Gagal menyimpan jadwal: ${err.message || 'Kesalahan koneksi API.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: DynamicScheduleItem['status']) => {
    setFeedback(null);
    try {
      const target = schedules.find((s) => s.id === id);
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
      setFeedback(`Status '${target.teamName}' diperbarui menjadi: ${newStatus}`);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`Gagal memperbarui status: ${err.message || 'Kesalahan koneksi API.'}`);
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
      setFeedback(`Peserta '${deleteTargetName}' berhasil dihapus dari jadwal.`);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`Gagal menghapus jadwal: ${err.message || 'Kesalahan koneksi API.'}`);
    }
  };

  // Filter & Search Logic
  const filteredSchedules = (schedules || []).filter((s) => {
    if (!s) return false;
    const q = (searchQuery || '').toLowerCase();
    const matchesJenjang = selectedFilterJenjang === 'ALL' || s.jenjang === selectedFilterJenjang;
    const teamNameStr = (s.teamName || '').toLowerCase();
    const schoolNameStr = (s.schoolName || '').toLowerCase();
    const participantNoStr = (s.participantNo || '').toLowerCase();

    const matchesSearch =
      teamNameStr.includes(q) || schoolNameStr.includes(q) || participantNoStr.includes(q);
    return matchesJenjang && matchesSearch;
  });

  const currentlyPerformingTeam = schedules.find((s) => s.status === 'NOW PERFORMING');

  // Format Timer Display
  const timerMinutesDisplay = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const timerSecondsDisplay = String(secondsLeft % 60).padStart(2, '0');

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="pb-6 border-b border-white/[0.06] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="primary" className="gap-1.5">
              <Radio className="w-3 h-3" />
              CONTROL ARENA LAPANGAN
            </Badge>
            {assignedJenjang && (
              <Badge variant="warning" className="font-mono uppercase">
                DIVISI {assignedJenjang}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
            Urutan Tampil Realtime
          </h1>
          <p className="text-xs sm:text-sm text-[#B8D8D0]">
            {assignedJenjang
              ? `Anda bertindak sebagai Operator Divisi LKBB ${assignedJenjang}. Mengelola urutan panggung peserta secara live.`
              : 'Ganti status panggung (NOW PERFORMING / STANDBY / NEXT) secara live per Jenjang (SD, SMP, SMA).'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Controller */}
          <div className="flex bg-[#082620] border border-white/[0.06] p-1 rounded-xl key-card">
            {[
              { mode: 'AGENDA' as const, label: 'Agenda', icon: ListOrdered },
              { mode: 'TIMELINE' as const, label: 'Timeline', icon: GitCommitHorizontal },
              { mode: 'CALENDAR' as const, label: 'Calendar', icon: Calendar },
            ].map(({ mode, label, icon: IconComponent }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all cursor-pointer ${
                  viewMode === mode
                    ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                    : 'text-[#B8D8D0] hover:text-white'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Jadwal
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

      {/* MASTER TIMER CONTROL ARENA (KONTROL ADMIN) */}
      <Card className="p-6 border-[#E3EF26]/30 bg-gradient-to-r from-[#076653]/35 via-[#082620] to-[#082620]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="primary" className="gap-1.5">
                <Timer className="w-3 h-3" />
                CONTROL TIMER ARENA
              </Badge>
              {isTimerRunning && (
                <span className="flex items-center gap-1.5 text-xs text-[#E3EF26] font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#E3EF26] animate-ping" />
                  COUNTDOWN AKTIF
                </span>
              )}
            </div>
            <h3 className="text-lg font-medium text-white tracking-tight">
              {currentlyPerformingTeam ? (
                <span>
                  Sedang Tampil:{' '}
                  <strong className="text-[#E3EF26] font-semibold">
                    {currentlyPerformingTeam.teamName}
                  </strong>{' '}
                  <span className="font-mono text-sm text-[#B8D8D0]">
                    ({currentlyPerformingTeam.participantNo})
                  </span>
                </span>
              ) : (
                <span>Stopwatch Timer Penampilan LKBB Arena</span>
              )}
            </h3>
            <p className="text-xs text-[#B8D8D0]">
              Durasi resmi LKBB Juklak AGP-III: <strong className="text-white">8 Menit</strong> di Lapangan <strong className="text-white">20 x 12 Meter</strong> (Penalti -5 poin / 10 detik jika melebihi waktu). Pemanggilan Daerah Persiapan (DP) maksimal 3x berturut-turut.
            </p>
          </div>

          {/* Timer Display & Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 bg-[#061C18] p-4 rounded-xl border border-white/[0.08]">
            <div className="text-center font-mono pr-4 border-r border-white/[0.08]">
              <div className="text-[10px] uppercase tracking-wider text-[#7AA89C]">
                Waktu Arena
              </div>
              <div className="text-3xl sm:text-4xl font-semibold text-white tracking-widest leading-none mt-1">
                {timerMinutesDisplay}:{timerSecondsDisplay}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isTimerRunning ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartTimer}
                  className="gap-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  Start Arena
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePauseTimer}
                  className="gap-1.5"
                >
                  <Pause className="w-3.5 h-3.5" />
                  Pause
                </Button>
              )}

              {/* Set Preset Durasi Menit Sesuai Juklak AGP-III */}
              <div className="flex items-center gap-1 bg-[#082620] p-1 rounded-lg border border-white/[0.06] flex-wrap">
                <button
                  type="button"
                  onClick={() => handleResetTimer(8)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-all cursor-pointer ${
                    allocatedMinutes === 8
                      ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                      : 'text-[#B8D8D0] hover:text-white'
                  }`}
                >
                  8M (LKBB)
                </button>
                <button
                  type="button"
                  onClick={() => handleResetTimer(10)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-all cursor-pointer ${
                    allocatedMinutes === 10
                      ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                      : 'text-[#B8D8D0] hover:text-white'
                  }`}
                >
                  10M (Pionering)
                </button>
                <button
                  type="button"
                  onClick={() => handleResetTimer(15)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-all cursor-pointer ${
                    allocatedMinutes === 15
                      ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30'
                      : 'text-[#B8D8D0] hover:text-white'
                  }`}
                >
                  15M (Bank Soal)
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResetTimer(allocatedMinutes)}
                className="gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
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
            {(['ALL', 'SD', 'SMP', 'SMA'] as const).map((lvl) => {
              const count =
                lvl === 'ALL'
                  ? schedules.length
                  : schedules.filter((s) => s.jenjang === lvl).length;
              return (
                <Button
                  key={lvl}
                  variant={selectedFilterJenjang === lvl ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedFilterJenjang(lvl)}
                  className="text-xs font-mono uppercase"
                >
                  {lvl === 'ALL' ? 'SEMUA' : lvl} ({count})
                </Button>
              );
            })}
          </div>
        )}

        <div className="w-full sm:w-80">
          <Input
            placeholder="Cari nama regu, pangkalan, no dada..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-2 text-xs"
            icon={<Search className="w-3.5 h-3.5 text-[#7AA89C]" />}
          />
        </div>
      </div>

      {/* Mode Tampilan: AGENDA / TIMELINE / CALENDAR */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : filteredSchedules.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="Tidak Ada Jadwal"
            description="Belum ada urutan peserta terdaftar untuk filter ini."
          />
        </Card>
      ) : viewMode === 'AGENDA' ? (
        /* AGENDA VIEW (DAFTAR KARTU STATUS CONTROL) */
        <div className="space-y-3">
          {filteredSchedules.map((item) => {
            const isPerforming = item.status === 'NOW PERFORMING';
            const isStandby = item.status === 'STANDBY';

            return (
              <Card
                key={item.id}
                className={`p-5 transition-all duration-200 ${
                  isPerforming
                    ? 'border-[#E3EF26]/50 bg-gradient-to-r from-[#076653]/30 to-[#082620]'
                    : isStandby
                    ? 'border-[#56c2ff]/40 bg-[#082620]'
                    : 'border-white/[0.06] bg-[#082620]'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#061C18] border border-white/[0.08] flex items-center justify-center font-mono font-semibold text-white text-lg shrink-0">
                      {item.noTampil}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="primary" className="text-[10px]">
                          {item.jenjang}
                        </Badge>
                        <span className="px-2 py-0.5 rounded bg-[#061C18] border border-white/[0.08] font-mono text-[11px] text-[#E3EF26]">
                          {item.participantNo}
                        </span>
                        <span className="text-xs text-[#7AA89C] font-mono">{item.category}</span>
                      </div>

                      <h3 className="text-base font-medium text-white">{item.teamName}</h3>
                      <p className="text-xs text-[#B8D8D0]">{item.schoolName}</p>
                    </div>
                  </div>

                  {/* Status Control Actions */}
                  <div className="flex flex-col md:items-end gap-2.5 shrink-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        size="sm"
                        variant={item.status === 'NOW PERFORMING' ? 'danger' : 'outline'}
                        onClick={() => handleStatusChange(item.id, 'NOW PERFORMING')}
                        className="text-[11px] font-mono py-1.5 px-2.5 gap-1"
                      >
                        <Radio className="w-3 h-3" />
                        NOW PERFORMING
                      </Button>
                      <Button
                        size="sm"
                        variant={item.status === 'STANDBY' ? 'secondary' : 'outline'}
                        onClick={() => handleStatusChange(item.id, 'STANDBY')}
                        className="text-[11px] font-mono py-1.5 px-2.5 gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        STANDBY
                      </Button>
                      <Button
                        size="sm"
                        variant={item.status === 'NEXT' ? 'primary' : 'outline'}
                        onClick={() => handleStatusChange(item.id, 'NEXT')}
                        className="text-[11px] font-mono py-1.5 px-2.5 gap-1"
                      >
                        <ArrowRight className="w-3 h-3" />
                        NEXT
                      </Button>
                      <Button
                        size="sm"
                        variant={item.status === 'COMPLETED' ? 'secondary' : 'outline'}
                        onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                        className="text-[11px] font-mono py-1.5 px-2.5 gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        COMPLETED
                      </Button>
                      <button
                        onClick={() => handleDeleteTrigger(item.id, item.teamName)}
                        className="p-2 rounded-lg bg-[#061C18] text-[#B8D8D0] hover:text-[#E3EF26] hover:border-[#E3EF26]/40 transition-colors border border-white/[0.08] cursor-pointer"
                        title="Hapus Jadwal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-[11px] font-mono text-[#7AA89C]">
                      Est. Jam: <strong className="text-[#ffffff]">{item.timeSlot}</strong>
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : viewMode === 'TIMELINE' ? (
        /* TIMELINE VIEW */
        <Card className="p-6">
          <div className="space-y-6">
            <h3 className="text-xs font-mono uppercase text-[#B8D8D0] tracking-wider">
              Timeline Alur Tampil Lapangan
            </h3>
            <div className="relative border-l border-white/[0.1] ml-4 space-y-5 pl-6">
              {filteredSchedules.map((item, idx) => (
                <div key={item.id} className="relative">
                  <div
                    className={`absolute -left-[30px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#0C342C] ${
                      item.status === 'NOW PERFORMING' ? 'bg-[#E3EF26]' : 'bg-[#56c2ff]'
                    }`}
                  />
                  <div className="p-4 rounded-xl border border-white/[0.06] bg-[#061C18]">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[11px] font-mono text-[#7AA89C]">
                          Urutan #{idx + 1} &bull; {item.timeSlot}
                        </span>
                        <h4 className="text-sm font-medium text-white mt-0.5">
                          {item.teamName} <span className="font-mono text-[#E3EF26]">({item.participantNo})</span>
                        </h4>
                        <p className="text-xs text-[#B8D8D0]">
                          {item.schoolName} &bull; {item.jenjang}
                        </p>
                      </div>
                      <Badge variant={item.status === 'NOW PERFORMING' ? 'danger' : 'secondary'}>
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
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-xs font-mono uppercase text-[#B8D8D0] tracking-wider">
              Kalender Slot Jam Lapangan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredSchedules.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-white/[0.06] bg-[#061C18] space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-[#ffffff]">{item.timeSlot}</span>
                    <Badge variant="primary" className="text-[10px]">
                      {item.jenjang}
                    </Badge>
                  </div>
                  <h4 className="font-medium text-sm text-white truncate">{item.teamName}</h4>
                  <p className="text-xs text-[#B8D8D0] truncate">{item.schoolName}</p>
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
        title="Tambah Urutan Tampil Baru"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4 pt-2">
          <Input
            id="sched-no"
            label="Nomor Dada / Peserta *"
            placeholder="Contoh: A-01 / SD-05"
            value={participantNo}
            onChange={(e) => setParticipantNo(e.target.value)}
            required
            className="font-mono"
          />

          <Input
            id="sched-team"
            label="Nama Pasukan / Tim *"
            placeholder="Contoh: PASBRATA UTAMA"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            required
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
              <label className="text-xs font-mono text-[#B8D8D0] uppercase tracking-wider">
                Jenjang Sekolah *
              </label>
              <select
                value={jenjang}
                onChange={(e) => setJenjang(e.target.value as SchoolLevel)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-white/[0.08] bg-[#061C18] text-xs font-medium text-white focus:border-[#56c2ff] outline-none"
              >
                <option value="SD">SD / MI</option>
                <option value="SMP">SMP / MTs</option>
                <option value="SMA">SMA / SMK / MA</option>
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
              Simpan Jadwal
            </Button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        title="Konfirmasi Hapus Jadwal"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#061C18] border border-white/[0.06]">
            <AlertTriangle className="w-5 h-5 text-[#E3EF26] shrink-0 mt-0.5" />
            <p className="text-xs text-[#B8D8D0] leading-relaxed">
              Apakah Anda yakin ingin menghapus peserta{' '}
              <strong className="font-medium text-white">{deleteTargetName}</strong> dari urutan
              tampil arena?
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button type="button" variant="danger" size="sm" onClick={handleDeleteConfirm}>
              Hapus dari Jadwal
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
