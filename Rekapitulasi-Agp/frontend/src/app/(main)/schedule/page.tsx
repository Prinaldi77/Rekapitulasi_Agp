'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicScheduleItem, SchoolLevel, getStoredSchedules } from '@/lib/dynamicStore';
import { fetchSchedulesFromApi } from '@/lib/api';
import { Badge, EmptyState, Input, LiveClock, PerformanceTimer, Skeleton } from '@/components/ui';
import { Clock, Radio, CheckCircle2, ArrowRight, Hourglass, Search, Sparkles } from 'lucide-react';

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold bg-[#E3EF26] text-[#0C342C] shadow-[0_0_16px_rgba(227,239,38,0.35)]">
            <span className="w-2 h-2 rounded-full bg-[#0C342C] animate-ping" />
            SEDANG TAMPIL (LANGSUNG)
          </span>
        );
      case 'STANDBY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#0C342C] text-[#E3EF26] border border-[#E3EF26]/50">
            <Hourglass className="w-3 h-3" />
            SIAGA GERBANG ARENA
          </span>
        );
      case 'NEXT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-[#0C342C] text-[#D7EAE3] border border-[#076653]">
            <ArrowRight className="w-3 h-3 text-[#E3EF26]" />
            PERSIAPAN BERIKUTNYA
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-[#061C18] text-[#94B8AE] border border-[#076653]/60">
            <CheckCircle2 className="w-3 h-3 text-[#E3EF26]" />
            SELESAI TAMPIL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium bg-[#061C18] text-[#8AB0A5] border border-[#076653]/50">
            <Clock className="w-3 h-3" />
            MENUNGGU GILIRAN
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Awwwards Editorial Header */}
      <div className="pb-6 border-b border-[#076653]/45 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_AWWWARDS }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#092922] border border-[#076653]/70 text-[11px] font-mono uppercase tracking-[0.16em] text-[#E3EF26] mb-3"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>01 / TELEMETRI ARENA LANGSUNG • SINKRONISASI 3 DETIK</span>
          </motion.div>

          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.75, ease: EASE_AWWWARDS }}
              className="text-3xl sm:text-5xl font-black text-white tracking-[-0.03em] leading-tight"
            >
              Waktu &amp; Urutan <span className="text-[#E3EF26]">Tampil.</span>
            </motion.h1>
          </div>
          <p className="text-xs sm:text-sm text-[#94B8AE] mt-2 max-w-xl">
            Pantau regu yang sedang tampil di kavling lapangan utama SMKN 1 Soreang (20 x 12 m • Durasi Maksimal 8 Menit • 16 Orang/Basis) beserta antrean Daerah Persiapan (DP).
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

      {/* Bento Spotlight Stage for Now Performing & Next Standby */}
      {performingItem && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: EASE_AWWWARDS }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-5"
        >
          {/* Left 8 Cols: Now Performing with 3D Visual Backdrop */}
          <div className="lg:col-span-8 relative overflow-hidden rounded-[26px] bg-[#092922]/90 border border-[#E3EF26]/55 p-6 sm:p-7 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.55)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <img
              src="/images/landing/card-lkbb.jpg"
              alt="Arena Telemetry"
              className="absolute right-0 top-0 h-full w-64 object-cover opacity-20 pointer-events-none select-none mask-image-left"
            />
            <div className="relative z-10 flex items-center gap-5">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#E3EF26] text-[#0C342C] flex flex-col items-center justify-center font-mono shrink-0 shadow-[0_0_30px_rgba(227,239,38,0.3)]">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                  URUT
                </span>
                <span className="text-2xl sm:text-3xl font-black leading-none mt-0.5">
                  {performingItem.noTampil}
                </span>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#0C342C] border border-[#E3EF26]/40 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#E3EF26] animate-ping" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#E3EF26] font-bold">
                    SEDANG TAMPIL • ARENA UTAMA
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {performingItem.teamName}
                </h2>
                <p className="text-xs sm:text-sm text-[#B8D8D0] mt-0.5">
                  {performingItem.schoolName}
                </p>
              </div>
            </div>

            <div className="relative z-10 sm:text-right font-mono space-y-1.5">
              <Badge variant="primary">
                {performingItem.jenjang} • {performingItem.participantNo}
              </Badge>
              <div className="text-xs text-[#94B8AE]">
                Slot Waktu: <strong className="text-white">{performingItem.timeSlot}</strong>
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Next Standby Card */}
          <div className="lg:col-span-4 rounded-[26px] bg-[#092922]/85 border border-[#076653]/75 p-6 backdrop-blur-xl flex flex-col justify-between shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.15em] text-[#E3EF26]">
                <Sparkles className="w-3.5 h-3.5" />
                PERSIAPAN BERIKUTNYA
              </span>
              <span className="text-[10px] font-mono text-[#7FA69A]">GERBANG PERSIAPAN</span>
            </div>

            {nextItem ? (
              <div className="mt-4">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {nextItem.teamName}
                </h3>
                <p className="text-xs text-[#94B8AE] mt-0.5 mb-4">{nextItem.schoolName}</p>
                <div className="pt-3 border-t border-[#076653]/50 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#E3EF26] font-bold">
                    NO. URUT #{nextItem.noTampil}
                  </span>
                  <span className="text-[#D7EAE3]">{nextItem.timeSlot}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#7AA89C] mt-4">
                Belum ada antrean persiapan berikutnya.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Filter Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/65 backdrop-blur-xl overflow-x-auto max-w-full">
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
                className={`relative px-4 py-2 rounded-full text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  active ? 'text-[#0C342C]' : 'text-[#A9C6BE] hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="schedule-jenjang-pill"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-[#E3EF26] shadow-[0_0_18px_rgba(227,239,38,0.35)]"
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
            icon={<Search className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Animated Schedule Queue List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
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
                  className={`p-5 sm:p-6 rounded-[22px] border backdrop-blur-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isPerforming
                      ? 'bg-[#0C342C]/95 border-[#E3EF26]/65 shadow-[0_18px_45px_rgba(0,0,0,0.5),0_0_25px_rgba(227,239,38,0.12)]'
                      : isStandby
                        ? 'bg-[#092922]/90 border-[#E3EF26]/35'
                        : 'bg-[#092922]/75 border-[#076653]/60 hover:border-[#076653]'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4">
                    <div
                      className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border flex flex-col items-center justify-center font-mono shrink-0 ${
                        isPerforming
                          ? 'bg-[#E3EF26] text-[#0C342C] border-[#E3EF26] font-black'
                          : 'bg-[#061C18] text-white border-[#076653] font-bold'
                      }`}
                    >
                      <span className="text-[9px] opacity-75">NO</span>
                      <span className="text-lg leading-none">{item.noTampil}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge variant="primary">{item.jenjang}</Badge>
                        {item.participantNo && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#061C18] border border-[#076653] font-mono text-[11px] text-[#B8D8D0]">
                            {item.participantNo}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {item.teamName}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#94B8AE]">{item.schoolName}</p>
                    </div>
                  </div>

                  <div className="flex flex-col md:items-end gap-2 self-start md:self-center">
                    {getStatusBadge(item.status)}
                    <span className="text-xs font-mono text-[#94B8AE]">
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
