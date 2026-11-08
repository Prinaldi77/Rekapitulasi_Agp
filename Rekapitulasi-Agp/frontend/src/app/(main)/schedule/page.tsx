'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicScheduleItem, SchoolLevel, getStoredSchedules } from '@/lib/dynamicStore';
import { fetchSchedulesFromApi } from '@/lib/api';
import { Badge, EmptyState, Input, LiveClock, PerformanceTimer, Skeleton } from '@/components/ui';
import { Clock, Radio, CheckCircle2, ArrowRight, Hourglass, Search } from 'lucide-react';

const EASE_AWWWARDS: [number, number, number, number] = [0.16, 1, 0.3, 1];

interface ExtendedScheduleItem extends DynamicScheduleItem {
  updatedAt?: string;
}

export default function PublicSchedulePage() {
  const [scheduleList, setScheduleList] = useState<ExtendedScheduleItem[]>([]);
  const [selectedJenjang, setSelectedJenjang] = useState<'ALL' | SchoolLevel>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSchedules = async () => {
    try {
      const result = await fetchSchedulesFromApi();
      if (result.success && result.data && result.data.length > 0) {
        const mapped: ExtendedScheduleItem[] = result.data.map((item: any) => ({
          id: item.id,
          noTampil: item.participant?.show_number || item.no_tampil || 1,
          participantNo: item.participant?.participant_no || item.participant_no || '',
          teamName: item.participant?.team_name || item.team_name || '',
          schoolName: item.participant?.school_name || item.school_name || '',
          category: item.participant?.category_id || 'LKBB PRAMUKA',
          jenjang: (item.participant?.category?.level || item.jenjang || 'SMA') as SchoolLevel,
          timeSlot: item.time_slot || '09:00 - 09:20',
          status: (item.status || 'WAITING') as DynamicScheduleItem['status'],
          updatedAt: item.updated_at || new Date().toISOString(),
        }));
        setScheduleList(mapped);
      } else {
        const localData = getStoredSchedules();
        setScheduleList(localData);
      }
    } catch {
      const localData = getStoredSchedules();
      setScheduleList(localData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
    const interval = setInterval(() => {
      loadSchedules();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const filteredSchedule = scheduleList.filter((item) => {
    const matchJenjang = selectedJenjang === 'ALL' || item.jenjang === selectedJenjang;
    const matchQuery =
      !searchQuery ||
      item.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.noTampil).includes(searchQuery) ||
      item.participantNo.toLowerCase().includes(searchQuery.toLowerCase());
    return matchJenjang && matchQuery;
  });

  const performingItem = scheduleList.find((s) => s.status === 'NOW PERFORMING');
  const nextItem = scheduleList.find((s) => s.status === 'NEXT' || s.status === 'STANDBY');

  let dynamicRemainingSeconds = 480;
  if (performingItem && performingItem.updatedAt) {
    const updatedTime = new Date(performingItem.updatedAt).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - updatedTime) / 1000));
    dynamicRemainingSeconds = Math.max(0, 480 - elapsedSeconds);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOW PERFORMING':
        return (
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#E3EF26] text-[#0C342C] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#0C342C] animate-ping" />
            SEDANG TAMPIL DI ARENA
          </span>
        );
      case 'STANDBY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#0E332B] text-[#E3EF26] border border-[#E3EF26]/50">
            <Hourglass className="w-3.5 h-3.5" />
            DAERAH PERSIAPAN (DP)
          </span>
        );
      case 'NEXT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#0A2620] text-[#FFFFFF] border border-[#1E564A]">
            <ArrowRight className="w-3.5 h-3.5 text-[#E3EF26]" />
            GILIRAN BERIKUTNYA
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-[#061C18] text-[#A7C7BE] border border-[#123E34]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#E3EF26]" />
            SELESAI TAMPIL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-[#061C18] text-[#A7C7BE] border border-[#123E34]">
            <Clock className="w-3.5 h-3.5" />
            MENUNGGU GILIRAN
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header with Live Telemetry */}
      <div className="pb-6 border-b border-[#123E34] flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_AWWWARDS }}
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#0A2620] border border-[#1E564A] text-xs font-mono font-semibold tracking-wider text-[#E3EF26] mb-3"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>TELEMETRI ARENA UTAMA • SINKRONISASI 3 DETIK</span>
          </motion.div>

          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.75, ease: EASE_AWWWARDS }}
              className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight"
            >
              Waktu &amp; Urutan <span className="text-[#E3EF26]">Tampil Peserta.</span>
            </motion.h1>
          </div>
          <p className="text-xs sm:text-sm text-[#C5E0D8] mt-2 max-w-xl leading-relaxed">
            Pantau regu yang sedang tampil di kavling lapangan utama SMKN 1 Soreang (20 x 12 m •
            Batas 8 Menit • 16 Orang/Basis) beserta antrean siaga Daerah Persiapan (DP).
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE_AWWWARDS }}
          className="flex flex-wrap items-center gap-3"
        >
          <LiveClock />
          <PerformanceTimer
            key={performingItem?.id || 'timer'}
            initialSeconds={dynamicRemainingSeconds}
            isRunning={!!performingItem}
          />
        </motion.div>
      </div>

      {/* Spotlight Stage: Now Performing & Next Standby */}
      {performingItem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: EASE_AWWWARDS }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-5"
        >
          {/* Now Performing Card */}
          <div className="lg:col-span-8 rounded-2xl bg-[#0A2620] border border-[#E3EF26]/60 p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-xl bg-[#E3EF26] text-[#0C342C] flex flex-col items-center justify-center font-mono shrink-0 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-wider opacity-85">
                  URUT
                </span>
                <span className="text-3xl sm:text-4xl font-black leading-none mt-0.5">
                  {performingItem.noTampil}
                </span>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#0E332B] border border-[#E3EF26]/40 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#E3EF26] animate-ping" />
                  <span className="text-xs font-mono uppercase tracking-wider text-[#E3EF26] font-bold">
                    SEDANG TAMPIL • ARENA UTAMA
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {performingItem.teamName}
                </h2>
                <p className="text-sm text-[#C5E0D8] mt-0.5">
                  {performingItem.schoolName}
                </p>
              </div>
            </div>

            <div className="relative z-10 sm:text-right font-mono space-y-2">
              <Badge variant="primary">
                {performingItem.jenjang} • {performingItem.participantNo}
              </Badge>
              <div className="text-xs text-[#A7C7BE]">
                Slot Waktu: <strong className="text-white">{performingItem.timeSlot}</strong>
              </div>
            </div>
          </div>

          {/* Next Standby Card */}
          <div className="lg:col-span-4 rounded-2xl bg-[#0A2620] border border-[#1E564A] p-6 flex flex-col justify-between shadow-sm">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#E3EF26] font-bold">
                <Hourglass className="w-4 h-4" />
                DAERAH PERSIAPAN (DP)
              </span>
              <span className="text-xs font-mono text-[#A7C7BE]">NOMOR BERIKUTNYA</span>
            </div>

            {nextItem ? (
              <div className="mt-4">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {nextItem.teamName}
                </h3>
                <p className="text-xs text-[#C5E0D8] mt-0.5 mb-4">{nextItem.schoolName}</p>
                <div className="pt-3 border-t border-[#123E34] flex items-center justify-between text-xs font-mono">
                  <span className="text-[#E3EF26] font-bold">
                    NO. URUT #{nextItem.noTampil}
                  </span>
                  <span className="text-white font-medium">{nextItem.timeSlot}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#A7C7BE] mt-4">
                Belum ada regu berikutnya di Daerah Persiapan (DP).
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#0A2620] border border-[#1E564A] overflow-x-auto max-w-full">
          {(['ALL', 'SD', 'SMP', 'SMA'] as const).map((lvl) => {
            const count =
              lvl === 'ALL'
                ? scheduleList.length
                : scheduleList.filter((s) => s.jenjang === lvl).length;
            const active = selectedJenjang === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedJenjang(lvl)}
                className={`relative px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  active ? 'text-[#0C342C]' : 'text-[#C5E0D8] hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="schedule-jenjang-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-[#E3EF26]"
                  />
                )}
                <span className="relative z-10">
                  {lvl === 'ALL' ? 'SEMUA' : `JENJANG ${lvl}`} ({count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="w-full sm:w-80">
          <Input
            placeholder="Cari regu, pangkalan, no urut..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-[#A7C7BE]" />}
          />
        </div>
      </div>

      {/* Schedule Queue List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredSchedule.length === 0 ? (
        <EmptyState
          title="Jadwal Tampil Tidak Ditemukan"
          description="Belum ada jadwal tampil yang sesuai filter atau Operator Lapangan belum memperbarui antrean."
          actionLabel={searchQuery || selectedJenjang !== 'ALL' ? 'Reset Filter' : undefined}
          onAction={() => {
            setSearchQuery('');
            setSelectedJenjang('ALL');
          }}
        />
      ) : (
        <motion.div layout className="space-y-3.5">
          <AnimatePresence mode="popLayout">
            {filteredSchedule.map((item, idx) => {
              const isPerforming = item.status === 'NOW PERFORMING';
              const isStandby = item.status === 'STANDBY' || item.status === 'NEXT';

              return (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.45, delay: idx * 0.025, ease: EASE_AWWWARDS }}
                  className={`p-5 sm:p-6 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isPerforming
                      ? 'bg-[#0E332B] border-[#E3EF26]'
                      : isStandby
                        ? 'bg-[#0A2620] border-[#E3EF26]/40'
                        : 'bg-[#0A2620] border-[#1E564A] hover:border-[#1E564A]'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center font-mono shrink-0 ${
                        isPerforming
                          ? 'bg-[#E3EF26] text-[#0C342C] border-[#E3EF26] font-black'
                          : 'bg-[#061C18] text-white border-[#1E564A] font-bold'
                      }`}
                    >
                      <span className="text-xs opacity-75">NO</span>
                      <span className="text-lg leading-none">{item.noTampil}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="primary">{item.jenjang}</Badge>
                        {item.participantNo && (
                          <span className="px-2.5 py-0.5 rounded text-xs font-mono bg-[#061C18] border border-[#123E34] text-[#C5E0D8]">
                            {item.participantNo}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {item.teamName}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#C5E0D8]">{item.schoolName}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2 self-start md:self-center">
                    {getStatusBadge(item.status)}
                    <span className="text-xs font-mono text-[#A7C7BE]">
                      Slot Waktu: <strong className="text-white">{item.timeSlot}</strong>
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
