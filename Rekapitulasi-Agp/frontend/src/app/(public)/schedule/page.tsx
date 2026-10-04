'use client';

import { useState, useEffect } from 'react';
import { DynamicScheduleItem, SchoolLevel } from '@/lib/dynamicStore';
import { fetchSchedulesFromApi } from '@/lib/api';
import { Badge, Card, EmptyState, LiveClock, PerformanceTimer } from '@/components/ui';

interface ExtendedScheduleItem extends DynamicScheduleItem {
  updatedAt?: string;
}

export default function PublicSchedulePage() {
  const [scheduleList, setScheduleList] = useState<ExtendedScheduleItem[]>([]);
  const [selectedJenjang, setSelectedJenjang] = useState<'ALL' | SchoolLevel>('ALL');

  const loadSchedules = async () => {
    try {
      const result = await fetchSchedulesFromApi();
      if (result.success && result.data) {
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
      }
    } catch (err) {
      console.error('Error fetching schedules:', err);
    }
  };

  useEffect(() => {
    loadSchedules();

    // Fast polling every 2 seconds for live sync
    const interval = setInterval(() => {
      loadSchedules();
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const filteredSchedule = scheduleList.filter(item => {
    if (selectedJenjang === 'ALL') return true;
    return item.jenjang === selectedJenjang;
  });

  // Calculate dynamic countdown for currently performing team
  const performingItem = scheduleList.find((s) => s.status === 'NOW PERFORMING');
  let dynamicRemainingSeconds = 600; // default 10m
  if (performingItem && performingItem.updatedAt) {
    const updatedTime = new Date(performingItem.updatedAt).getTime();
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - updatedTime) / 1000));
    dynamicRemainingSeconds = Math.max(0, 600 - elapsedSeconds);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOW PERFORMING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600 mr-1.5 animate-ping" />
            🔴 SEDANG TAMPIL
          </span>
        );
      case 'STANDBY':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-200">
            ⏳ STANDBY (BERSIAP PINTU ARENA)
          </span>
        );
      case 'NEXT':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-green-100 text-green-800 border border-green-200">
            ➡️ NEXT (GILIRAN BERIKUTNYA)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
            ✓ SELESAI TAMPIL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-600 border border-green-100">
            ⏳ MENUNGGU GILIRAN
          </span>
        );
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="pb-6 border-b border-green-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="primary" className="font-black text-[9px] mb-1">⏱️ LIVE SCOREBOARD</Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">Urutan Tampil Realtime</h1>
          <p className="text-xs sm:text-sm text-green-700/70 mt-1">
            Pantau giliran tampil peserta secara live di arena kompetisi AGP 2026.
          </p>
        </div>

        {/* Live Indicator & Timer */}
        <div className="flex flex-wrap items-center gap-3">
          <LiveClock />
          <PerformanceTimer key={performingItem?.id || 'timer'} initialSeconds={dynamicRemainingSeconds} isRunning={!!performingItem} />
        </div>
      </div>

      {/* Filter Tabs Jenjang SD / SMP / SMA */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedJenjang('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            selectedJenjang === 'ALL'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-800 border border-green-200 hover:bg-green-50'
          }`}
        >
          🌐 SEMUA JENJANG ({scheduleList.length})
        </button>

        <button
          onClick={() => setSelectedJenjang('SD')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            selectedJenjang === 'SD'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-800 border border-green-200 hover:bg-green-50'
          }`}
        >
          🎒 SD / MI ({scheduleList.filter(s => s.jenjang === 'SD').length})
        </button>

        <button
          onClick={() => setSelectedJenjang('SMP')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            selectedJenjang === 'SMP'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-800 border border-green-200 hover:bg-green-50'
          }`}
        >
          🏫 SMP / MTs ({scheduleList.filter(s => s.jenjang === 'SMP').length})
        </button>

        <button
          onClick={() => setSelectedJenjang('SMA')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
            selectedJenjang === 'SMA'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-800 border border-green-200 hover:bg-green-50'
          }`}
        >
          🏛️ SMA / SMK / MA ({scheduleList.filter(s => s.jenjang === 'SMA').length})
        </button>
      </div>

      {/* Schedule Table / List */}
      {filteredSchedule.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            title="Belum Ada Jadwal Tampil"
            description="Jadwal tampil akan diperbarui secara realtime oleh Operator Lapangan."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSchedule.map((item) => {
            const isPerforming = item.status === 'NOW PERFORMING';
            const isStandby = item.status === 'STANDBY';

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                  isPerforming
                    ? 'bg-red-50/60 border-red-300 ring-2 ring-red-400'
                    : isStandby
                    ? 'bg-amber-50/60 border-amber-300'
                    : 'bg-white border-green-200 hover:border-green-400'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 border border-green-200 flex items-center justify-center font-mono font-black text-green-950 text-lg shadow-inner shrink-0">
                    {item.noTampil}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                      <Badge variant="primary" className="text-[9px] font-extrabold">{item.jenjang}</Badge>
                      <span className="px-2 py-0.5 rounded bg-green-50 border border-green-200 font-mono text-[10px] text-green-900 font-bold">
                        {item.participantNo}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-green-950">{item.teamName}</h3>
                    <p className="text-xs text-green-800 font-semibold">{item.schoolName}</p>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2 self-start md:self-center">
                  {getStatusBadge(item.status)}
                  <span className="text-[11px] font-mono text-green-800 font-bold">
                    Est. Jam Tampil: <strong className="text-green-950 font-black">{item.timeSlot}</strong>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
