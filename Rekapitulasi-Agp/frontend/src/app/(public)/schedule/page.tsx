'use client';

import { useState, useEffect } from 'react';
import { getStoredSchedules, DynamicScheduleItem, SchoolLevel } from '@/lib/dynamicStore';

export default function PublicSchedulePage() {
  const [scheduleList, setScheduleList] = useState<DynamicScheduleItem[]>([]);
  const [selectedJenjang, setSelectedJenjang] = useState<'ALL' | SchoolLevel>('ALL');

  useEffect(() => {
    setScheduleList(getStoredSchedules());

    const handleStorageChange = () => {
      setScheduleList(getStoredSchedules());
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(() => {
      setScheduleList(getStoredSchedules());
    }, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const filteredSchedule = scheduleList.filter(item => {
    if (selectedJenjang === 'ALL') return true;
    return item.jenjang === selectedJenjang;
  });

  const getJenjangBadge = (jenjang: SchoolLevel) => {
    switch (jenjang) {
      case 'SD':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black">🎒 SD / MI</span>;
      case 'SMP':
        return <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px] font-black">🏫 SMP / MTs</span>;
      case 'SMA':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-black">🏛️ SMA / SMK / MA</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NOW PERFORMING':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5 animate-ping"></span>
            🔴 NOW PERFORMING (SEDANG TAMPIL)
          </span>
        );
      case 'STANDBY':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
            ⏳ STANDBY (BERSIAP PINTU ARENA)
          </span>
        );
      case 'NEXT':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            ➡️ NEXT (GILIRAN BERIKUTNYA)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400">
            ✓ SELESAI TAMPIL
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-900 text-slate-500 border border-slate-800">
            ⏳ MENUNGGU GILIRAN
          </span>
        );
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>⏱️</span> Urutan Tampil Realtime Lapangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau pergerakan giliran tampil peserta secara live dari router lokal / Wi-Fi venue.
          </p>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            LIVE ARENA BROADCAST
          </span>
        </div>
      </div>

      {/* Filter Tabs Jenjang SD / SMP / SMA */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedJenjang('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            selectedJenjang === 'ALL'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          🌐 SEMUA JENJANG ({scheduleList.length})
        </button>

        <button
          onClick={() => setSelectedJenjang('SD')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            selectedJenjang === 'SD'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <span>🎒</span>
          <span>SD / MI ({scheduleList.filter(s => s.jenjang === 'SD').length})</span>
        </button>

        <button
          onClick={() => setSelectedJenjang('SMP')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            selectedJenjang === 'SMP'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-lg shadow-sky-500/10'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <span>🏫</span>
          <span>SMP / MTs ({scheduleList.filter(s => s.jenjang === 'SMP').length})</span>
        </button>

        <button
          onClick={() => setSelectedJenjang('SMA')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            selectedJenjang === 'SMA'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <span>🏛️</span>
          <span>SMA / SMK / MA ({scheduleList.filter(s => s.jenjang === 'SMA').length})</span>
        </button>
      </div>

      {/* Schedule Table / List */}
      {filteredSchedule.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
          <p className="font-bold text-sm mb-1">Belum Ada Jadwal Tampil untuk Jenjang Ini</p>
          <p className="text-slate-500">Jadwal tampil akan diperbarui secara realtime oleh Operator Lapangan.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSchedule.map((item) => {
            const isPerforming = item.status === 'NOW PERFORMING';
            const isStandby = item.status === 'STANDBY';

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl ${
                  isPerforming
                    ? 'bg-slate-900/90 border-rose-500/50 shadow-rose-500/10 ring-1 ring-rose-500/30'
                    : isStandby
                    ? 'bg-slate-900/80 border-amber-500/40'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center font-mono font-black text-emerald-400 text-lg shadow-inner shrink-0">
                    {item.noTampil}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                      {getJenjangBadge(item.jenjang)}
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-400 font-bold">
                        {item.participantNo}
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">{item.category}</span>
                    </div>

                    <h3 className="text-lg font-extrabold text-white">{item.teamName}</h3>
                    <p className="text-xs text-slate-400">{item.schoolName}</p>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-2 self-start md:self-center">
                  {getStatusBadge(item.status)}
                  <span className="text-[11px] font-mono text-slate-400">
                    Est. Jam Tampil: <strong className="text-slate-200 font-extrabold">{item.timeSlot}</strong>
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
