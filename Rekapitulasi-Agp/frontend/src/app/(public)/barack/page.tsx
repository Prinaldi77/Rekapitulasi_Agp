'use client';

import { useState, useEffect } from 'react';
import { DynamicBarackItem, SchoolLevel } from '@/lib/dynamicStore';
import { fetchBaracksFromApi } from '@/lib/api';
import { Badge, Card, EmptyState, Input } from '@/components/ui';
import { Search, MapPin } from 'lucide-react';

export default function PublicBarackPage() {
  const [barackList, setBarackList] = useState<DynamicBarackItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState<'ALL' | SchoolLevel>('ALL');

  const loadBaracks = async () => {
    try {
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
        setBarackList(mapped);
      }
    } catch (err) {
      console.error('Error fetching baracks:', err);
    }
  };

  useEffect(() => {
    loadBaracks();

    const interval = setInterval(() => {
      loadBaracks();
    }, 4000);

    return () => {
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
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="pb-6 border-b border-green-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge variant="primary" className="font-black text-[9px] mb-1">🏕️ TRANSIT AREA</Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">
            Pembagian Ruang Transit / Barak Peserta
          </h1>
          <p className="text-xs sm:text-sm text-green-800/80 font-medium mt-1">
            Cari lokasi dan pemetaan ruang istirahat tim kontingen sekolah Anda.
          </p>
        </div>

        {/* Quick Search Bar */}
        <div className="w-full md:w-80">
          <Input
            placeholder="Cari Sekolah / Tim / No. Tampil..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-2.5 text-xs font-semibold"
            icon={<Search className="w-3.5 h-3.5 text-green-700/60" />}
          />
        </div>
      </div>

      {/* Filter Tabs Jenjang SD / SMP / SMA */}
      <div className="flex items-center gap-2 overflow-x-auto touch-pan-x pb-2">
        <button
          type="button"
          onClick={() => setSelectedJenjang('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            selectedJenjang === 'ALL'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-900 border border-green-200 hover:bg-green-50'
          }`}
        >
          🌐 SEMUA JENJANG ({barackList.length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedJenjang('SD')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            selectedJenjang === 'SD'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-900 border border-green-200 hover:bg-green-50'
          }`}
        >
          🎒 SD / MI ({barackList.filter(b => b.jenjang === 'SD').length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedJenjang('SMP')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            selectedJenjang === 'SMP'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-900 border border-green-200 hover:bg-green-50'
          }`}
        >
          🏫 SMP / MTs ({barackList.filter(b => b.jenjang === 'SMP').length})
        </button>

        <button
          type="button"
          onClick={() => setSelectedJenjang('SMA')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            selectedJenjang === 'SMA'
              ? 'bg-green-700 text-white shadow-md'
              : 'bg-white text-green-900 border border-green-200 hover:bg-green-50'
          }`}
        >
          🏛️ SMA / SMK ({barackList.filter(b => b.jenjang === 'SMA').length})
        </button>
      </div>

      {/* Grid of Barack Cards */}
      {filteredBarack.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            title="Belum Ada Data Ruang Transit"
            description="Data lokasi barak peserta akan diumumkan oleh Panitia Logistik."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBarack.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white border border-green-200 hover:border-green-400 transition-all shadow-xs hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="px-3 py-1 rounded-xl bg-green-100 text-green-900 border border-green-300 font-mono font-black text-xs">
                  NO. TAMPIL {item.noTampil}
                </span>
                <Badge variant="primary" className="text-[9px] font-black uppercase">
                  {item.jenjang}
                </Badge>
              </div>

              <h3 className="text-base font-black text-green-950 mb-1">{item.teamName}</h3>
              <p className="text-xs text-green-800 font-semibold mb-4">{item.schoolName}</p>

              <div className="pt-3 border-t border-green-100">
                <div className="text-xs font-bold text-green-800 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-green-700 shrink-0" />
                  <span>Ruang Transit:</span>
                  <strong className="text-green-950 font-black text-sm">{item.roomName}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
