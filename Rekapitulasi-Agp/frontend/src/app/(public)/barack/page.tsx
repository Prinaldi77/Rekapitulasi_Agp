'use client';

import { useState, useEffect } from 'react';
import { getStoredBaracks, DynamicBarackItem, SchoolLevel } from '@/lib/dynamicStore';

export default function PublicBarackPage() {
  const [barackList, setBarackList] = useState<DynamicBarackItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState<'ALL' | SchoolLevel>('ALL');

  useEffect(() => {
    setBarackList(getStoredBaracks());

    const handleStorageChange = () => {
      setBarackList(getStoredBaracks());
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(() => {
      setBarackList(getStoredBaracks());
    }, 3000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const filteredBarack = barackList.filter((item) => {
    const matchesJenjang = selectedJenjang === 'ALL' || item.jenjang === selectedJenjang;
    const matchesQuery =
      item.teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.noTampil.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.roomName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesJenjang && matchesQuery;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>🏕️</span> Pembagian Ruang Transit / Barak Peserta
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Cari lokasi dan pemetaan ruang istirahat tim kontingen sekolah Anda.
          </p>
        </div>

        {/* Quick Search Bar */}
        <div className="w-full md:w-80">
          <input
            type="text"
            placeholder="🔍 Cari Sekolah / Tim / No. Tampil..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-xs font-semibold placeholder:text-slate-500 outline-none focus:border-cyan-500 transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs Jenjang SD / SMP / SMA */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedJenjang('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            selectedJenjang === 'ALL'
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
          }`}
        >
          🌐 SEMUA JENJANG ({barackList.length})
        </button>

        <button
          onClick={() => setSelectedJenjang('SD')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            selectedJenjang === 'SD'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <span>🎒</span>
          <span>SD / MI ({barackList.filter(b => b.jenjang === 'SD').length})</span>
        </button>

        <button
          onClick={() => setSelectedJenjang('SMP')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            selectedJenjang === 'SMP'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <span>🏫</span>
          <span>SMP / MTs ({barackList.filter(b => b.jenjang === 'SMP').length})</span>
        </button>

        <button
          onClick={() => setSelectedJenjang('SMA')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            selectedJenjang === 'SMA'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <span>🏛️</span>
          <span>SMA / SMK ({barackList.filter(b => b.jenjang === 'SMA').length})</span>
        </button>
      </div>

      {/* Grid of Barack Cards */}
      {filteredBarack.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
          <p className="font-bold text-sm mb-1">Belum Ada Data Ruang Transit</p>
          <p className="text-slate-500">Data lokasi barak peserta akan diumumkan oleh Panitia Logistik.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBarack.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-cyan-500/40 transition-all shadow-xl"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="px-3 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-extrabold text-xs">
                  NO. TAMPIL {item.noTampil}
                </span>
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase ${
                  item.jenjang === 'SD' ? 'bg-emerald-500/20 text-emerald-300' :
                  item.jenjang === 'SMP' ? 'bg-sky-500/20 text-sky-300' : 'bg-purple-500/20 text-purple-300'
                }`}>
                  {item.jenjang}
                </span>
              </div>

              <h3 className="text-base font-extrabold text-white mb-1">{item.teamName}</h3>
              <p className="text-xs text-slate-400 mb-4">{item.schoolName}</p>

              <div className="pt-3 border-t border-slate-800">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <span>📍 Ruang Transit:</span>
                  <span className="text-white font-extrabold text-sm">{item.roomName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
