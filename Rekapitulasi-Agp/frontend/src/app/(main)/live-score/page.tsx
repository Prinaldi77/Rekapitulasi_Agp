'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSkPdf, printMateriLombaRecapPDF } from '@/lib/pdf';
import { SchoolLevel } from '@/lib/dynamicStore';
import { fetchLeaderboardFromApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Button, Badge, Skeleton, EmptyState } from '@/components/ui';
import Link from 'next/link';
import { Lock, Unlock, Download, Trophy, Eye, Radio, Award, Medal, ShieldCheck, Crown, Target, FolderKanban } from 'lucide-react';

const EASE_AWWWARDS: [number, number, number, number] = [0.16, 1, 0.3, 1];

function getOfficialLkbbTier(rank: number): { title: string; pillClass: string } {
  if (rank === 1) return { title: 'JUARA UTAMA 1 + UMUM', pillClass: 'bg-[#E3EF26] text-[#0C342C] font-black' };
  if (rank === 2) return { title: 'JUARA UTAMA 2', pillClass: 'bg-[#E3EF26] text-[#0C342C] font-bold' };
  if (rank === 3) return { title: 'JUARA UTAMA 3', pillClass: 'bg-[#E3EF26] text-[#0C342C] font-bold' };
  if (rank <= 6) return { title: `HARAPAN UTAMA ${rank - 3}`, pillClass: 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-semibold' };
  if (rank <= 9) return { title: `JUARA MADYA ${rank - 6}`, pillClass: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 font-semibold' };
  if (rank <= 12) return { title: `JUARA BINA ${rank - 9}`, pillClass: 'bg-sky-400/20 text-sky-300 border border-sky-400/40 font-semibold' };
  if (rank <= 15) return { title: `JUARA MULA ${rank - 12}`, pillClass: 'bg-teal-400/20 text-teal-300 border border-teal-400/40 font-semibold' };
  if (rank <= 18) return { title: `JUARA PURWA ${rank - 15}`, pillClass: 'bg-purple-400/20 text-purple-300 border border-purple-400/40 font-semibold' };
  return { title: `JUARA CARAKA ${rank - 18}`, pillClass: 'bg-rose-400/20 text-rose-300 border border-rose-400/40 font-semibold' };
}

interface WinnerItem {
  rank: number;
  noTampil: string;
  teamName: string;
  schoolName: string;
  gender: 'PUTERA' | 'PUTERI';
  pbbTotal: number;
  variasiTotal: number;
  dantonTotal: number;
  totalScore: number;
  materiTotal: number;
  khususTotal: number;
  badgeTitle: string;
  badgeBg: string;
  jenjang: SchoolLevel;
  rawItem?: any;
}

interface FeedItem {
  id: string;
  message: string;
  time: string;
  type: 'performing' | 'completed' | 'standby';
}

export default function WinnerAnnouncementPage() {
  const [user, setUser] = useState<any>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedJenjang, setSelectedJenjang] = useState<SchoolLevel>('SMA');
  const [activeCategoryTab, setActiveCategoryTab] = useState<'LKBB' | 'MATERI' | 'KHUSUS'>('LKBB');
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<FeedItem[]>([]);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        let currentUser = session?.user ?? null;

        if (!currentUser && typeof window !== 'undefined') {
          const savedDevUser = localStorage.getItem('agp_dev_user');
          if (savedDevUser) {
            try {
              currentUser = JSON.parse(savedDevUser);
            } catch {
              currentUser = null;
            }
          }
        }
        setUser(currentUser);
      } catch (err) {
        console.warn('Live score getSession notice:', err);
      }
    };
    getSession();
  }, []);

  const fetchWinnersAndFeed = async () => {
    try {
      const { data: cat } = await supabase
        .from('categories')
        .select('id, is_published')
        .eq('level', selectedJenjang)
        .limit(1)
        .maybeSingle();

      if (cat) {
        setIsPublished(cat.is_published);

        const result = await fetchLeaderboardFromApi(cat.id);
        if (result.success && result.data) {
          const mapped: WinnerItem[] = result.data.map((item: any, idx: number) => {
            const r = item.rank || idx + 1;
            const tier = getOfficialLkbbTier(r);
            return {
              rank: r,
              noTampil: item.participantNo || `P-${r}`,
              teamName: item.teamName || 'Regu Pramuka',
              schoolName: item.schoolName || 'Pangkalan Sekolah',
              gender: (item.gender || 'PUTERA') as 'PUTERA' | 'PUTERI',
              pbbTotal: item.pbbTotal || 0,
              variasiTotal: item.variasiTotal || 0,
              dantonTotal: item.dantonTotal || 0,
              totalScore: item.grandTotal || 0,
              materiTotal: item.materiTotal || 0,
              khususTotal: (item.fashionShow || 0) + (item.administrasi || 0),
              badgeTitle: tier.title,
              badgeBg: tier.pillClass,
              jenjang: selectedJenjang,
              rawItem: item,
            };
          });
          setWinners(mapped);
        } else {
          setWinners([]);
        }
      }

      const { data: scheds } = await supabase
        .from('schedules')
        .select('*, participant:participants(*)')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (scheds) {
        const mappedFeed: FeedItem[] = scheds.map((s: any) => {
          let msg = '';
          let type: FeedItem['type'] = 'standby';

          if (s.status === 'NOW PERFORMING' || s.status === 'PERFORMING') {
            msg = `Regu ${s.participant?.team_name || 'Peserta'} sedang tampil LIVE di arena utama.`;
            type = 'performing';
          } else if (s.status === 'COMPLETED') {
            msg = `Regu ${s.participant?.team_name || 'Peserta'} telah selesai tampil.`;
            type = 'completed';
          } else {
            msg = `Regu ${s.participant?.team_name || 'Peserta'} bersiap (STANDBY) di gerbang arena.`;
            type = 'standby';
          }

          return {
            id: s.id,
            message: msg,
            time: 'Baru saja',
            type,
          };
        });
        setFeed(mappedFeed);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinnersAndFeed();
    const interval = setInterval(() => {
      fetchWinnersAndFeed();
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedJenjang]);

  const currentWinners = [...winners]
    .sort((a, b) => {
      if (activeCategoryTab === 'MATERI') return b.materiTotal - a.materiTotal;
      if (activeCategoryTab === 'KHUSUS') return b.khususTotal - a.khususTotal;
      return b.totalScore - a.totalScore;
    })
    .map((w, idx) => {
      const r = idx + 1;
      const tier = getOfficialLkbbTier(r);
      return {
        ...w,
        rank: r,
        badgeTitle: activeCategoryTab === 'LKBB' ? tier.title : `JUARA ${r}`,
        badgeBg: tier.pillClass,
      };
    });

  const getDisplayedScore = (w: WinnerItem) => {
    if (activeCategoryTab === 'MATERI') return w.materiTotal;
    if (activeCategoryTab === 'KHUSUS') return w.khususTotal;
    return w.totalScore;
  };

  const categoryTitle = `LKBB RESMI AGP-III SMKN 1 SOREANG (JENJANG ${selectedJenjang})`;

  const handleDownloadPdf = () => {
    if (activeCategoryTab === 'MATERI') {
      printMateriLombaRecapPDF(
        selectedJenjang,
        currentWinners.map((w) => ({
          noTampil: w.noTampil,
          teamName: w.teamName,
          schoolName: w.schoolName,
          gender: w.gender,
          bankSoal: w.rawItem?.bankSoal ?? null,
          semaphore: w.rawItem?.semaphore ?? null,
          morse: w.rawItem?.morse ?? null,
          miniPionering: w.rawItem?.miniPionering ?? null,
          kebersihan: w.rawItem?.kebersihan ?? null,
          materiTotal: w.materiTotal,
        }))
      );
      return;
    }

    generateSkPdf(
      categoryTitle,
      currentWinners.map((w) => ({
        rank: w.rank,
        noTampil: w.noTampil,
        teamName: w.teamName,
        schoolName: w.schoolName,
        juri1Score: w.pbbTotal,
        juri2Score: w.variasiTotal,
        juri3Score: w.dantonTotal,
        totalScore: getDisplayedScore(w),
      }))
    );
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
            <Trophy className="w-3.5 h-3.5" />
            <span>
              03 / {isPublished ? 'HASIL RESMI DIPUBLIKASIKAN' : 'BRANKAS REKAPITULASI TERSEGEL'}
            </span>
          </motion.div>

          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.75, ease: EASE_AWWWARDS }}
              className="text-3xl sm:text-5xl font-black text-white tracking-[-0.03em] leading-tight"
            >
              Pengumuman Juara <span className="text-[#E3EF26]">&amp; SK Resmi.</span>
            </motion.h1>
          </div>
          <p className="text-xs sm:text-sm text-[#94B8AE] mt-2 max-w-xl">
            Daftar pemenang resmi terverifikasi Dewan Juri AGP-III SMKN 1 Soreang (Total 106 Trophy Perebutan Juara Umum) beserta unduhan Surat Keputusan (SK) Penetapan Juara.
          </p>
        </div>

        {/* Lock Status & Download PDF */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.1, ease: EASE_AWWWARDS }}
          className="flex flex-wrap items-center gap-3"
        >
          <span
            className={`px-4 py-2 rounded-full text-xs font-mono font-bold border flex items-center gap-2 ${
              isPublished
                ? 'bg-[#E3EF26] text-[#0C342C] border-[#E3EF26] shadow-[0_0_20px_rgba(227,239,38,0.3)]'
                : 'bg-[#092922] text-[#E3EF26] border-[#E3EF26]/45'
            }`}
          >
            {isPublished ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isPublished ? 'DIPUBLIKASIKAN' : 'TERSEGEL / DIKUNCI'}</span>
          </span>

          {isPublished && (
            <Button
              onClick={handleDownloadPdf}
              variant="primary"
              size="sm"
              className="gap-2 rounded-full"
              disabled={currentWinners.length === 0}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh SK Juara (PDF)</span>
            </Button>
          )}
        </motion.div>
      </div>

      {/* Segmented Filter Pills Jenjang SD, SMP, SMA + Category Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/65 backdrop-blur-xl overflow-x-auto max-w-full">
          {(['SD', 'SMP', 'SMA'] as const).map((lvl) => {
            const active = selectedJenjang === lvl;
            const golLabel = lvl === 'SD' ? 'GOL A • SD/MI' : lvl === 'SMP' ? 'GOL B • SMP/MTs' : 'GOL C • SMA/SMK/MA';
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedJenjang(lvl)}
                className={`relative px-5 py-2 rounded-full text-xs font-mono font-bold tracking-wider transition-colors cursor-pointer whitespace-nowrap ${
                  active ? 'text-[#0C342C]' : 'text-[#A9C6BE] hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="score-jenjang-pill"
                    transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-[#E3EF26] shadow-[0_0_18px_rgba(227,239,38,0.35)]"
                  />
                )}
                <span className="relative z-10">{golLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/65 backdrop-blur-xl overflow-x-auto max-w-full">
          {[
            { key: 'LKBB', label: 'LKBB (21 PIALA)', icon: Target },
            { key: 'MATERI', label: 'MATERI KEPRAMUKAAN (PA/PI)', icon: Award },
            { key: 'KHUSUS', label: 'ADMIN & FASHION SHOW', icon: FolderKanban },
          ].map((tab) => {
            const IconComp = tab.icon;
            const active = activeCategoryTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveCategoryTab(tab.key as any)}
                className={`px-4 py-1.5 rounded-full text-[11px] font-mono font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/40'
                    : 'text-[#A9C6BE] hover:text-white'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* IF PUBLIC USER AND NOT PUBLISHED YET: SHOW AWWWARDS 3D SEALED VAULT SCREEN */}
      {!isPublished && !user ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_AWWWARDS }}
          className="rounded-[32px] bg-[#092922]/90 border border-[#076653]/80 overflow-hidden backdrop-blur-2xl shadow-[0_30px_70px_rgba(0,0,0,0.6)] grid grid-cols-1 lg:grid-cols-12"
        >
          {/* Left 5 Cols: 3D Monolithic Trophy Render */}
          <div className="lg:col-span-5 relative min-h-[280px] sm:min-h-[360px] bg-[#061A15] overflow-hidden">
            <img
              src="/images/landing/card-trophy.jpg"
              alt="AGP Championship Trophy"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-transparent to-[#092922]/95" />
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#08241E]/85 border border-[#E3EF26]/40 backdrop-blur-md text-[10px] font-mono uppercase tracking-[0.16em] text-[#E3EF26]">
              <Lock className="w-3 h-3" />
              <span>ENCRYPTED SCOREBOARD</span>
            </div>
          </div>

          {/* Right 7 Cols: Official Sealed Notice */}
          <div className="lg:col-span-7 p-7 sm:p-10 lg:p-12 flex flex-col justify-center space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0C342C] border border-[#076653] text-[11px] font-mono uppercase tracking-[0.16em] text-[#E3EF26] w-fit">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>REKAPITULASI PENILAIAN RAHASIA</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Pengumuman Juara Jenjang <span className="text-[#E3EF26]">{selectedJenjang}</span>{' '}
              Masih Disegel.
            </h2>

            <p className="text-sm sm:text-base text-[#94B8AE] leading-relaxed">
              Seluruh akumulasi nilai juri dan perolehan juara jenjang{' '}
              <strong className="text-white">{selectedJenjang}</strong> saat ini sedang dalam
              proses verifikasi oleh Dewan Juri &amp; Grand Master Rekapitulasi.
            </p>

            <div className="p-5 rounded-2xl bg-[#061C18]/90 border border-[#076653]/70 text-xs sm:text-sm text-[#B8D8D0] space-y-1.5">
              <div className="font-mono font-bold text-[#E3EF26] uppercase tracking-wider text-xs">
                JADWAL BUKA SEGEL OTOMATIS
              </div>
              <p className="leading-relaxed text-[#94B8AE]">
                Klasemen Peringkat Juara dan Dokumen PDF Surat Keputusan (SK) Penetapan Juara
                akan dibuka serentak oleh Panitia saat{' '}
                <strong className="text-white">Acara Pengumuman Pemenang di Arena Utama</strong>.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* UNLOCKED FOR PUBLIC OR ADMIN PREVIEW MODE */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Admin Preview Warning Banner */}
          {!isPublished && user && (
            <div className="lg:col-span-12 p-4 sm:px-6 rounded-2xl bg-[#092922] border border-[#E3EF26]/50 text-white text-xs flex flex-wrap items-center justify-between gap-3 shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-[#E3EF26] shrink-0" />
                <span>
                  <strong className="text-[#E3EF26] font-mono">
                    MODE PRATINJAU PANITIA (LOCKED):
                  </strong>{' '}
                  Halaman ini masih terkunci bagi pengunjung umum sampai Grand Master
                  mengaktifkan tombol Publish.
                </span>
              </div>
              <Link href="/admin/leaderboard">
                <Button variant="primary" size="sm">
                  Kelola Publish di Leaderboard Admin
                </Button>
              </Link>
            </div>
          )}

          {/* Left 8 Cols: Standings Leaderboard */}
          <div className="lg:col-span-8 space-y-6">
            <div className="rounded-[26px] bg-[#092922]/85 border border-[#076653]/70 p-6 sm:p-8 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
              <div className="border-b border-[#076653]/50 pb-4 mb-6 flex justify-between items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <Trophy className="w-4 h-4 text-[#E3EF26]" />
                  <h3 className="text-sm font-bold uppercase text-white tracking-wider">
                    {isPublished
                      ? `Klasemen Akhir Juara (${selectedJenjang})`
                      : `Klasemen Sementara (${selectedJenjang})`}
                  </h3>
                </div>
                <Badge variant={isPublished ? 'success' : 'warning'}>
                  {isPublished ? 'TERVERIFIKASI RESMI' : 'PRATINJAU PANITIA'}
                </Badge>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : currentWinners.length === 0 ? (
                <EmptyState
                  title="Belum Ada Data Nilai"
                  description="Belum ada rekapitulasi nilai juri yang masuk untuk jenjang ini."
                />
              ) : (
                <div className="space-y-6">
                  {/* Visual Podium Showcase */}
                  {currentWinners.length >= 3 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-[#076653]/50 items-end">
                      {/* 2nd Place */}
                      <div className="p-5 rounded-2xl bg-[#061C18]/90 border border-[#076653] flex flex-col items-center text-center order-2 sm:order-1">
                        <Medal className="w-6 h-6 text-white mb-2" />
                        <span className="text-[10px] font-mono uppercase text-[#94B8AE]">
                          {currentWinners[1]?.badgeTitle || 'JUARA 2'}
                        </span>
                        <div className="font-bold text-sm text-white truncate max-w-full mt-1">
                          {currentWinners[1]?.teamName}
                        </div>
                        <div className="text-xs text-[#7AA89C] truncate max-w-full mb-3">
                          {currentWinners[1]?.schoolName}
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#076653] font-mono text-xs font-bold text-white">
                          {getDisplayedScore(currentWinners[1])} PTS
                        </span>
                      </div>

                      {/* 1st Place */}
                      <div className="p-6 rounded-2xl bg-[#0C342C] border border-[#E3EF26]/65 flex flex-col items-center text-center order-1 sm:order-2 shadow-[0_0_30px_rgba(227,239,38,0.15)]">
                        <Trophy className="w-8 h-8 text-[#E3EF26] mb-2" />
                        <span className="text-[10px] font-mono font-bold uppercase text-[#E3EF26] tracking-widest">
                          {currentWinners[0]?.badgeTitle || 'JUARA UTAMA 1'}
                        </span>
                        <div className="font-black text-base text-white truncate max-w-full mt-1">
                          {currentWinners[0]?.teamName}
                        </div>
                        <div className="text-xs text-[#B8D8D0] truncate max-w-full mb-3">
                          {currentWinners[0]?.schoolName}
                        </div>
                        <span className="px-3.5 py-1 rounded-full bg-[#E3EF26] text-[#0C342C] font-mono text-sm font-black">
                          {getDisplayedScore(currentWinners[0])} PTS
                        </span>
                      </div>

                      {/* 3rd Place */}
                      <div className="p-5 rounded-2xl bg-[#061C18]/90 border border-[#076653] flex flex-col items-center text-center order-3">
                        <Award className="w-6 h-6 text-[#B8D8D0] mb-2" />
                        <span className="text-[10px] font-mono uppercase text-[#94B8AE]">
                          {currentWinners[2]?.badgeTitle || 'JUARA 3'}
                        </span>
                        <div className="font-bold text-sm text-white truncate max-w-full mt-1">
                          {currentWinners[2]?.teamName}
                        </div>
                        <div className="text-xs text-[#7AA89C] truncate max-w-full mb-3">
                          {currentWinners[2]?.schoolName}
                        </div>
                        <span className="px-3 py-1 rounded-full bg-[#076653] font-mono text-xs font-bold text-white">
                          {getDisplayedScore(currentWinners[2])} PTS
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Complete Rankings List */}
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {currentWinners.map((winner) => (
                        <motion.div
                          layout
                          key={winner.noTampil}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                            winner.rank === 1
                              ? 'bg-[#0C342C]/90 border-[#E3EF26]/55'
                              : 'bg-[#061C18]/85 border-[#076653]/65 hover:border-[#076653]'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                                winner.rank === 1 || winner.rank === 2
                                  ? 'bg-[#E3EF26] text-[#0C342C]'
                                  : 'bg-[#076653] text-white'
                              }`}
                            >
                              #{winner.rank}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm sm:text-base font-bold text-white truncate">
                                  {winner.teamName}
                                </h4>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#092922] text-[#E3EF26] border border-[#076653]">
                                  {winner.noTampil}
                                </span>
                                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full ${winner.badgeBg}`}>
                                  {winner.badgeTitle}
                                </span>
                              </div>
                              <p className="text-xs text-[#94B8AE] truncate mt-0.5">
                                {winner.schoolName}
                              </p>
                              {activeCategoryTab === 'LKBB' && (
                                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-[#7AA89C] mt-1">
                                  <span>PBB: <strong className="text-white">{winner.pbbTotal}</strong></span>
                                  <span>•</span>
                                  <span>Vafor: <strong className="text-white">{winner.variasiTotal}</strong></span>
                                  <span>•</span>
                                  <span>Danton: <strong className="text-white">{winner.dantonTotal}</strong></span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono">
                            <div className="text-lg font-black text-white">
                              {getDisplayedScore(winner)}
                            </div>
                            <div className="text-[9px] text-[#E3EF26] uppercase tracking-wider">
                              TOTAL SKOR
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right 4 Cols: 3D Trophy Card + 106 Trophy Breakdown + Live Activity Feed */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-[26px] bg-[#092922]/85 border border-[#076653]/70 overflow-hidden backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
              <div className="relative h-44 w-full bg-[#061A15]">
                <img
                  src="/images/landing/card-trophy.jpg"
                  alt="Trophy AGP"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#092922] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0C342C]/90 border border-[#E3EF26]/50 text-[10px] font-mono font-bold text-[#E3EF26]">
                  <Crown className="w-3 h-3" />
                  <span>106 PIALA JUKLAK AGP-III</span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2 text-xs">
                  <h4 className="font-mono font-bold uppercase text-white tracking-wider text-[11px]">
                    Struktur Kejuaraan Resmi AGP-III
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#061C18]/90 border border-[#076653]/60 flex justify-between items-center">
                      <span className="text-[#B8D8D0]">LKBB (Utama s/d Caraka)</span>
                      <span className="font-mono font-bold text-[#E3EF26]">21 Piala/Gol</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#061C18]/90 border border-[#076653]/60 flex justify-between items-center">
                      <span className="text-[#B8D8D0]">PBB, Vafor &amp; Danton Terbaik</span>
                      <span className="font-mono font-bold text-[#E3EF26]">9 Piala/Gol</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#061C18]/90 border border-[#076653]/60 flex justify-between items-center">
                      <span className="text-[#B8D8D0]">Materi Pramuka PA &amp; PI (1-3)</span>
                      <span className="font-mono font-bold text-[#E3EF26]">24 Piala/Gol</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#061C18]/90 border border-[#076653]/60 flex justify-between items-center">
                      <span className="text-[#B8D8D0]">Admin, Fashion, Barak &amp; Foto</span>
                      <span className="font-mono font-bold text-[#E3EF26]">Piala Tetap</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#076653]/50 pt-4">
                  <div className="pb-3 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#E3EF26]" />
                    <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                      Aktivitas Arena Live
                    </h3>
                  </div>
                  {feed.length === 0 ? (
                    <p className="text-xs text-[#7AA89C]">Belum ada aktivitas arena terbaru.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {feed.map((item) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl bg-[#061C18]/90 border border-[#076653]/60 text-xs text-white"
                        >
                          <p className="leading-relaxed">{item.message}</p>
                          <span className="text-[10px] font-mono text-[#E3EF26] mt-1.5 block">
                            {item.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
