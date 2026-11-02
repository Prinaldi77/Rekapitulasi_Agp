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
            <Tent className="w-3.5 h-3.5" />
            <span>02 / DIREKTORI RUANG TRANSIT &amp; BARAK</span>
          </motion.div>

          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.75, ease: EASE_AWWWARDS }}
              className="text-3xl sm:text-5xl font-black text-white tracking-[-0.03em] leading-tight"
            >
              Lokasi Ruang Transit <span className="text-[#E3EF26]">&amp; Barak.</span>
            </motion.h1>
          </div>
          <p className="text-xs sm:text-sm text-[#94B8AE] mt-2 max-w-xl">
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
            icon={<Search className="w-3.5 h-3.5" />}
          />
        </motion.div>
      </div>

      {/* Featured 3D Overview Banner */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.08, ease: EASE_AWWWARDS }}
        className="relative overflow-hidden rounded-[26px] bg-[#092922]/90 border border-[#076653]/75 p-6 sm:p-7 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center gap-5">
          <img
            src="/images/landing/card-pionering.jpg"
            alt="Barack Zone"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-[#E3EF26]/40 shrink-0"
          />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#E3EF26] mb-1">
              LOGISTIK, AKOMODASI &amp; PERIODE IV KEBERSIHAN BARAK (MAKS 100 PTS)
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Pemetaan Ruang Kelas Transit Kontingen SMK Negeri 1 Soreang
            </h2>
            <p className="text-xs text-[#94B8AE] mt-1 max-w-lg">
              Pastikan kontingen menempati ruang barak sesuai alokasi panitia. Kebersihan barak dan
              lapangan dinilai sebanyak 2 tahap oleh Tim Juri Periode IV (Nilai Maksimal 100 Poin).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-stretch sm:self-center">
          <div className="px-4 py-3 rounded-2xl bg-[#0C342C] border border-[#076653] text-center">
            <div className="text-xl font-black font-mono text-[#E3EF26]">
              {barackList.length}
            </div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#94B8AE]">
              REGU TERDAFTAR
            </div>
          </div>
          <div className="px-4 py-3 rounded-2xl bg-[#0C342C] border border-[#076653] text-center">
            <div className="text-xl font-black font-mono text-white">{uniqueRooms}</div>
            <div className="text-[9px] font-mono uppercase tracking-wider text-[#94B8AE]">
              RUANG BARAK
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter Pills Jenjang SD / SMP / SMA */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/65 backdrop-blur-xl overflow-x-auto max-w-full">
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
                className={`relative px-4 py-2 rounded-full text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  active ? 'text-[#0C342C]' : 'text-[#A9C6BE] hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="barack-jenjang-pill"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-[#E3EF26] shadow-[0_0_18px_rgba(227,239,38,0.35)]"
                  />
                )}
                <span className="relative z-10">
                  {lvl === 'ALL' ? 'SEMUA JENJANG' : `JENJANG ${lvl}`} ({count})
                </span>
              </button>
            );
          })}
        </div>

        <span className="text-xs font-mono text-[#7FA69A]">
          Menampilkan {filteredBarack.length} titik barak
        </span>
      </div>

      {/* Grid of Barack Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-2xl" />
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
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, delay: idx * 0.03, ease: EASE_AWWWARDS }}
                whileHover={{ y: -4 }}
                className="group p-6 rounded-[24px] bg-[#092922]/85 border border-[#076653]/65 hover:border-[#E3EF26]/65 backdrop-blur-xl flex flex-col justify-between transition-colors shadow-[0_18px_45px_rgba(0,0,0,0.45)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#0C342C] text-[#E3EF26] border border-[#076653] font-mono text-[11px] font-bold">
                      NO. {item.noTampil}
                    </span>
                    <Badge variant="primary">{item.jenjang}</Badge>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight group-hover:text-[#E3EF26] transition-colors">
                    {item.teamName}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#94B8AE] mt-1 mb-6 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#7FA69A] shrink-0" />
                    <span className="truncate">{item.schoolName}</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-[#076653]/45 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-[#94B8AE]">
                    <MapPin className="w-4 h-4 text-[#E3EF26] shrink-0" />
                    <span>Ruang Transit:</span>
                  </div>
                  <strong className="text-xs sm:text-sm font-mono font-extrabold text-[#0C342C] bg-[#E3EF26] px-3 py-1 rounded-full shadow-[0_0_15px_rgba(227,239,38,0.25)]">
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
