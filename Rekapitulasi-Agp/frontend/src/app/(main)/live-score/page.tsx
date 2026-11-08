'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateSkPdf, printMateriLombaRecapPDF } from '@/lib/pdf';
import { SchoolLevel } from '@/lib/dynamicStore';
import { fetchLeaderboardFromApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Button, Badge, Skeleton, EmptyState } from '@/components/ui';
import Link from 'next/link';
import {
  Lock,
  Unlock,
  Download,
  Trophy,
  Eye,
  Radio,
  Award,
  Medal,
  ShieldCheck,
  Crown,
  Target,
  FolderKanban,
} from 'lucide-react';

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
            msg = `Regu ${s.participant?.team_name || 'Peserta'} bersiap (STANDBY) di gerbang siaga.`;
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="pb-6 border-b border-[#123E34] flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE_AWWWARDS }}
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-[#0A2620] border border-[#1E564A] text-xs font-mono font-semibold tracking-wider text-[#E3EF26] mb-3"
          >
            <Trophy className="w-4 h-4" />
            <span>
              {isPublished ? 'HASIL RESMI DIPUBLIKASIKAN' : 'BRANKAS REKAPITULASI TERSEGEL'}
            </span>
          </motion.div>

          <div className="overflow-hidden">
            <motion.h1
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 0.75, ease: EASE_AWWWARDS }}
              className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight"
            >
              Pengumuman Juara <span className="text-[#E3EF26]">&amp; SK Resmi.</span>
            </motion.h1>
          </div>
          <p className="text-xs sm:text-sm text-[#C5E0D8] mt-2 max-w-xl leading-relaxed">
            Daftar pemenang resmi terverifikasi Dewan Juri AGP-III SMKN 1 Soreang (total 106 kategori
            piala kejuaraan umum) beserta unduhan Surat Keputusan (SK) Penetapan Juara.
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
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold border flex items-center gap-2 ${
              isPublished
                ? 'bg-[#E3EF26] text-[#0C342C] border-[#E3EF26] shadow-sm'
                : 'bg-[#0A2620] text-[#E3EF26] border-[#1E564A]'
            }`}
          >
            {isPublished ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{isPublished ? 'DIPUBLIKASIKAN' : 'TERSEGEL / DIKUNCI'}</span>
          </span>

          {isPublished && (
            <Button
              onClick={handleDownloadPdf}
              variant="primary"
              size="sm"
              className="gap-2 rounded-lg"
              disabled={currentWinners.length === 0}
            >
              <Download className="w-4 h-4" />
              <span>Unduh SK Juara (PDF)</span>
            </Button>
          )}
        </motion.div>
      </div>

      {/* Filter Jenjang & Category Switcher */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#0A2620] border border-[#1E564A] overflow-x-auto max-w-full">
          {(['SD', 'SMP', 'SMA'] as const).map((lvl) => {
            const active = selectedJenjang === lvl;
            const golLabel =
              lvl === 'SD'
                ? 'GOL A • SD/MI'
                : lvl === 'SMP'
                ? 'GOL B • SMP/MTs'
                : 'GOL C • SMA/SMK/MA';
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
                    layoutId="score-jenjang-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-[#E3EF26]"
                  />
                )}
                <span className="relative z-10">{golLabel}</span>
              </button>
            );
          })}
        </div>

        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-[#0A2620] border border-[#1E564A] overflow-x-auto max-w-full">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#0E332B] text-[#E3EF26] border border-[#E3EF26]/50'
                    : 'text-[#C5E0D8] hover:text-white'
                }`}
              >
                <IconComp className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* IF PUBLIC USER AND NOT PUBLISHED YET: SEALED VAULT SCREEN */}
      {!isPublished && !user ? (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_AWWWARDS }}
          className="rounded-2xl bg-[#0A2620] border border-[#1E564A] overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12"
        >
          {/* Trophy Render */}
          <div className="lg:col-span-5 relative min-h-[260px] sm:min-h-[320px] bg-[#061A15] overflow-hidden">
            <img
              src="/images/landing/card-trophy.jpg"
              alt="Piala Kejuaraan AGP"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-transparent via-transparent to-[#0A2620]" />
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0A2620]/90 border border-[#E3EF26]/40 text-xs font-mono uppercase tracking-wider text-[#E3EF26]">
              <Lock className="w-3.5 h-3.5" />
              <span>ENCRYPTED SCOREBOARD</span>
            </div>
          </div>

          {/* Official Sealed Notice */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0E332B] border border-[#1E564A] text-xs font-mono uppercase tracking-wider text-[#E3EF26] w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>REKAPITULASI PENILAIAN RAHASIA</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
              Pengumuman Juara Jenjang <span className="text-[#E3EF26]">{selectedJenjang}</span>{' '}
              Masih Disegel.
            </h2>

            <p className="text-sm text-[#C5E0D8] leading-relaxed">
              Seluruh akumulasi nilai juri dan perolehan juara jenjang{' '}
              <strong className="text-white">{selectedJenjang}</strong> saat ini sedang dalam
              proses verifikasi oleh Dewan Juri &amp; Grand Master Rekapitulasi.
            </p>

            <div className="p-4 rounded-xl bg-[#07201B] border border-[#123E34] text-xs text-[#A7C7BE] space-y-1">
              <div className="font-mono font-bold text-[#E3EF26] uppercase tracking-wider text-xs">
                JADWAL BUKA SEGEL OTOMATIS
              </div>
              <p className="leading-relaxed">
                Klasemen Peringkat Juara dan Dokumen PDF Surat Keputusan (SK) Penetapan Juara
                akan dibuka serentak oleh Panitia saat{' '}
                <strong className="text-white">Acara Pengumuman Pemenang di Arena Utama</strong>.
              </p>
            </div>
          </div>
        </motion.div>
      ) : (
        /* UNLOCKED OR ADMIN PREVIEW */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Admin Preview Banner */}
          {!isPublished && user && (
            <div className="lg:col-span-12 p-4 sm:px-6 rounded-xl bg-[#0A2620] border border-[#E3EF26]/50 text-white text-xs flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2.5">
                <Eye className="w-4 h-4 text-[#E3EF26] shrink-0" />
                <span>
                  <strong className="text-[#E3EF26] font-mono">
                    MODE PRATINJAU PANITIA (LOCKED):
                  </strong>{' '}
                  Halaman ini masih terkunci bagi pengunjung umum sampai Grand Master mengaktifkan
                  tombol Publish.
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
            <div className="rounded-2xl bg-[#0A2620] border border-[#1E564A] p-6 sm:p-7 shadow-sm">
              <div className="border-b border-[#123E34] pb-4 mb-6 flex justify-between items-center gap-3 flex-wrap">
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
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-6 border-b border-[#123E34] items-end">
                      {/* 2nd Place */}
                      <div className="p-5 rounded-xl bg-[#07201B] border border-[#1E564A] flex flex-col items-center text-center order-2 sm:order-1">
                        <Medal className="w-6 h-6 text-white mb-2" />
                        <span className="text-xs font-mono uppercase text-[#A7C7BE]">
                          {currentWinners[1]?.badgeTitle || 'JUARA 2'}
                        </span>
                        <div className="font-bold text-sm text-white truncate max-w-full mt-1">
                          {currentWinners[1]?.teamName}
                        </div>
                        <div className="text-xs text-[#A7C7BE] truncate max-w-full mb-3">
                          {currentWinners[1]?.schoolName}
                        </div>
                        <span className="px-3 py-1 rounded-md bg-[#0E332B] font-mono text-xs font-bold text-white border border-[#1E564A]">
                          {getDisplayedScore(currentWinners[1])} PTS
                        </span>
                      </div>

                      {/* 1st Place */}
                      <div className="p-6 rounded-xl bg-[#0E332B] border border-[#E3EF26] flex flex-col items-center text-center order-1 sm:order-2 shadow-sm">
                        <Crown className="w-8 h-8 text-[#E3EF26] mb-2" />
                        <span className="text-xs font-mono font-bold uppercase text-[#E3EF26]">
                          {currentWinners[0]?.badgeTitle || 'JUARA 1 UTAMA'}
                        </span>
                        <div className="font-black text-base text-white truncate max-w-full mt-1">
                          {currentWinners[0]?.teamName}
                        </div>
                        <div className="text-xs text-[#C5E0D8] truncate max-w-full mb-3">
                          {currentWinners[0]?.schoolName}
                        </div>
                        <span className="px-3.5 py-1.5 rounded-md bg-[#E3EF26] font-mono text-xs font-black text-[#0C342C]">
                          {getDisplayedScore(currentWinners[0])} PTS
                        </span>
                      </div>

                      {/* 3rd Place */}
                      <div className="p-5 rounded-xl bg-[#07201B] border border-[#1E564A] flex flex-col items-center text-center order-3">
                        <Award className="w-6 h-6 text-[#C5E0D8] mb-2" />
                        <span className="text-xs font-mono uppercase text-[#A7C7BE]">
                          {currentWinners[2]?.badgeTitle || 'JUARA 3'}
                        </span>
                        <div className="font-bold text-sm text-white truncate max-w-full mt-1">
                          {currentWinners[2]?.teamName}
                        </div>
                        <div className="text-xs text-[#A7C7BE] truncate max-w-full mb-3">
                          {currentWinners[2]?.schoolName}
                        </div>
                        <span className="px-3 py-1 rounded-md bg-[#0E332B] font-mono text-xs font-bold text-white border border-[#1E564A]">
                          {getDisplayedScore(currentWinners[2])} PTS
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Complete Rankings List */}
                  <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                      {currentWinners.map((winner, idx) => (
                        <motion.div
                          layout
                          key={winner.noTampil}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: idx * 0.02, ease: EASE_AWWWARDS }}
                          className={`p-4 sm:p-5 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                            winner.rank === 1
                              ? 'bg-[#0E332B] border-[#E3EF26]'
                              : 'bg-[#07201B] border-[#1E564A] hover:border-[#1E564A]'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-lg flex items-center justify-center font-mono font-black text-sm shrink-0 ${
                                winner.rank === 1 || winner.rank === 2
                                  ? 'bg-[#E3EF26] text-[#0C342C]'
                                  : 'bg-[#0A2620] text-white border border-[#1E564A]'
                              }`}
                            >
                              #{winner.rank}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm sm:text-base font-bold text-white truncate">
                                  {winner.teamName}
                                </h4>
                                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#0A2620] text-[#E3EF26] border border-[#1E564A]">
                                  {winner.noTampil}
                                </span>
                                <span className={`text-xs font-mono px-2.5 py-0.5 rounded ${winner.badgeBg}`}>
                                  {winner.badgeTitle}
                                </span>
                              </div>
                              <p className="text-xs text-[#A7C7BE] truncate mt-0.5">
                                {winner.schoolName}
                              </p>
                              {activeCategoryTab === 'LKBB' && (
                                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#C5E0D8] mt-1">
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
                            <div className="text-xs text-[#E3EF26] uppercase tracking-wider font-bold">
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

          {/* Right 4 Cols: 106 Piala Breakdown & Live Activity Feed */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl bg-[#0A2620] border border-[#1E564A] overflow-hidden shadow-sm">
              <div className="relative h-44 w-full bg-[#061A15]">
                <img
                  src="/images/landing/card-trophy.jpg"
                  alt="Piala AGP"
                  className="h-full w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A2620] via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#07201B]/90 border border-[#E3EF26]/50 text-xs font-mono font-bold text-[#E3EF26]">
                  <Crown className="w-3.5 h-3.5" />
                  <span>106 PIALA JUKLAK RESMI</span>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2 text-xs">
                  <h4 className="font-mono font-bold uppercase text-white tracking-wider">
                    Struktur Kejuaraan Resmi AGP
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-2.5 rounded-lg bg-[#07201B] border border-[#123E34] flex justify-between items-center">
                      <span className="text-[#C5E0D8]">LKBB (Utama s/d Caraka)</span>
                      <span className="font-mono font-bold text-[#E3EF26]">21 Piala/Gol</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#07201B] border border-[#123E34] flex justify-between items-center">
                      <span className="text-[#C5E0D8]">PBB, Vafor &amp; Danton Terbaik</span>
                      <span className="font-mono font-bold text-[#E3EF26]">9 Piala/Gol</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#07201B] border border-[#123E34] flex justify-between items-center">
                      <span className="text-[#C5E0D8]">Materi Pramuka PA &amp; PI (1-3)</span>
                      <span className="font-mono font-bold text-[#E3EF26]">24 Piala/Gol</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#07201B] border border-[#123E34] flex justify-between items-center">
                      <span className="text-[#C5E0D8]">Admin, Fashion, Barak &amp; Foto</span>
                      <span className="font-mono font-bold text-[#E3EF26]">Piala Tetap</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#123E34] pt-4">
                  <div className="pb-3 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-[#E3EF26]" />
                    <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                      Aktivitas Arena Live
                    </h3>
                  </div>
                  {feed.length === 0 ? (
                    <p className="text-xs text-[#A7C7BE]">Belum ada aktivitas arena terbaru.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {feed.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-lg bg-[#07201B] border border-[#123E34] text-xs text-white"
                        >
                          <p className="leading-relaxed">{item.message}</p>
                          <span className="text-xs font-mono text-[#E3EF26] mt-1 block">
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
