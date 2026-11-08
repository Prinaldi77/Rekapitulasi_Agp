'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DynamicBarackItem, SchoolLevel, getStoredBaracks } from '@/lib/dynamicStore';
import { fetchBaracksFromApi } from '@/lib/api';
import { Badge, EmptyState, Input, Skeleton } from '@/components/ui';
import { Search, MapPin, Tent, Building2 } from 'lucide-react';

const EASE_AWWWARDS: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function PublicBarackPage() {
  const [barackList, setBarackList] = useState<DynamicBarackItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState<'ALL' | SchoolLevel>('ALL');
  const [loading, setLoading] = useState(true);

  const loadBaracks = async () => {
    try {
      const result = await fetchBaracksFromApi();
      if (result.success && result.data && result.data.length > 0) {
        const mapped: DynamicBarackItem[] = result.data.map((item: any) => ({
          id: item.id,
          noTampil: item.participant?.participant_no || item.no_tampil || 'A-00',
          teamName: item.participant?.team_name || item.team_name || '',
          schoolName: item.participant?.school_name || item.school_name || '',
          roomName: item.room_name || '',
          jenjang: (item.participant?.category?.level || item.jenjang || 'SMA') as SchoolLevel,
        }));
        setBarackList(mapped);
      } else {
        const localData = getStoredBaracks();
        setBarackList(localData);
      }
    } catch {
      const localData = getStoredBaracks();
      setBarackList(localData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBaracks();
    const interval = setInterval(() => {
      loadBaracks();
    }, 4000);
    return () => clearInterval(interval);
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

  const uniqueRooms = new Set(barackList.map((b) => b.roomName)).size;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-[#123E34] flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_AWWWARDS }}
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#0A2620] border border-[#1E564A] text-xs font-mono font-semibold tracking-wider text-[#E3EF26] mb-3"
          >
            <Tent className="w-4 h-4" />
            <span>DIREKTORI RUANG TRANSIT &amp; BARAK KONTINGEN</span>
          </motion.div>

          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.75, ease: EASE_AWWWARDS }}
              className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight"
            >
              Lokasi Ruang Transit <span className="text-[#E3EF26]">&amp; Barak.</span>
            </motion.h1>
          </div>
          <p className="text-xs sm:text-sm text-[#C5E0D8] mt-2 max-w-xl leading-relaxed">
            Cari titik ruangan istirahat/barak kontingen pangkalan sekolah Anda berdasarkan
            nama sekolah, nama regu, atau nomor peserta.
          </p>
        </div>

        {/* Quick Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE_AWWWARDS }}
          className="w-full lg:w-80"
        >
          <Input
            placeholder="Cari sekolah, regu, ruangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={<Search className="w-4 h-4 text-[#A7C7BE]" />}
          />
        </motion.div>
      </div>

      {/* Overview Banner */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.08, ease: EASE_AWWWARDS }}
        className="rounded-2xl bg-[#0A2620] border border-[#1E564A] p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm"
      >
        <div className="flex items-center gap-5">
          <img
            src="/images/landing/card-pionering.jpg"
            alt="Barack Zone"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-[#1E564A] shrink-0"
          />
          <div>
            <div className="text-xs font-mono font-semibold uppercase tracking-wider text-[#E3EF26] mb-1">
              LOGISTIK, AKOMODASI &amp; EVALUASI BARAK (100 POIN)
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Pemetaan Ruang Kelas Transit Kontingen SMKN 1 Soreang
            </h2>
            <p className="text-xs text-[#C5E0D8] mt-1 max-w-lg leading-relaxed">
              Pastikan kontingen menempati ruang barak sesuai alokasi panitia. Kebersihan barak dan
              lapangan dinilai sebanyak 2 tahap oleh Tim Juri Penilai.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-center">
          <div className="px-5 py-3 rounded-xl bg-[#0E332B] border border-[#1E564A] text-center">
            <div className="text-2xl font-black font-mono text-[#E3EF26]">
              {barackList.length}
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#A7C7BE] mt-0.5">
              REGU TERDAFTAR
            </div>
          </div>
          <div className="px-5 py-3 rounded-xl bg-[#0E332B] border border-[#1E564A] text-center">
            <div className="text-2xl font-black font-mono text-white">{uniqueRooms}</div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#A7C7BE] mt-0.5">
              RUANG BARAK
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs Jenjang SD / SMP / SMA */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#0A2620] border border-[#1E564A] overflow-x-auto max-w-full">
          {(['ALL', 'SD', 'SMP', 'SMA'] as const).map((lvl) => {
            const count =
              lvl === 'ALL'
                ? barackList.length
                : barackList.filter((b) => b.jenjang === lvl).length;
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
                    layoutId="barack-jenjang-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-[#E3EF26]"
                  />
                )}
                <span className="relative z-10">
                  {lvl === 'ALL' ? 'SEMUA JENJANG' : `JENJANG ${lvl}`} ({count})
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs font-mono text-[#A7C7BE]">
          Menampilkan {filteredBarack.length} titik barak
        </span>
      </div>

      {/* Grid of Barack Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredBarack.length === 0 ? (
        <EmptyState
          title="Data Barak Tidak Ditemukan"
          description="Belum ada alokasi barak yang cocok dengan pencarian Anda."
          icon={<Tent className="w-5 h-5" />}
          actionLabel={searchQuery || selectedJenjang !== 'ALL' ? 'Reset Pencarian' : undefined}
          onAction={() => {
            setSearchQuery('');
            setSelectedJenjang('ALL');
          }}
        />
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence mode="popLayout">
            {filteredBarack.map((item, idx) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, delay: idx * 0.03, ease: EASE_AWWWARDS }}
                whileHover={{ y: -3 }}
                className="p-6 rounded-xl bg-[#0A2620] border border-[#1E564A] hover:border-[#E3EF26] flex flex-col justify-between transition-colors shadow-sm group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-md bg-[#0E332B] text-[#E3EF26] border border-[#1E564A] font-mono text-xs font-bold">
                      NO. {item.noTampil}
                    </span>
                    <Badge variant="primary">{item.jenjang}</Badge>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-[#E3EF26] transition-colors">
                    {item.teamName}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#C5E0D8] mt-1 mb-6 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-[#A7C7BE] shrink-0" />
                    <span className="truncate">{item.schoolName}</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-[#123E34] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-[#A7C7BE]">
                    <MapPin className="w-4 h-4 text-[#E3EF26] shrink-0" />
                    <span>Ruang Transit:</span>
                  </div>
                  <strong className="text-xs sm:text-sm font-mono font-bold text-[#0C342C] bg-[#E3EF26] px-3 py-1 rounded-md shadow-sm">
                    {item.roomName}
                  </strong>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
