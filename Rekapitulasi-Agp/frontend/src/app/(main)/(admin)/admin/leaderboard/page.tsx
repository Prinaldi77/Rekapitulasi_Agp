'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Lock,
  Unlock,
  FileDown,
  Search,
  Medal,
  Crown,
  Target,
  Award,
  FolderKanban,
  AlertTriangle,
} from 'lucide-react';
import { generateSkPdf, printMateriLombaRecapPDF } from '@/lib/pdf';
import { SchoolLevel } from '@/lib/dynamicStore';
import { fetchLeaderboardFromApi, togglePublishStatusApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Card, Button, Badge, Input, EmptyState, Skeleton, Modal, Toast } from '@/components/ui';
import { useDebounce } from '@/lib/useDebounce';

interface ParticipantRecap {
  noTampil: string;
  teamName: string;
  schoolName: string;
  gender: 'PUTERA' | 'PUTERI';
  lkbbPbb: number;
  lkbbFavor: number;
  lkbbDanton: number;
  lkbbTotal: number;
  bankSoal: number | null;
  semaphore: number | null;
  morse: number | null;
  miniPionering: number | null;
  kebersihan: number | null;
  fashionShow: number | null;
  administrasi: number | null;
  materiTotal: number;
}

function getLkbbTierBadge(rank: number): { label: string; className: string } {
  if (rank === 1) return { label: 'JUARA UTAMA 1 + UMUM', className: 'bg-[#E3EF26] text-[#0C342C] font-bold' };
  if (rank === 2) return { label: 'JUARA UTAMA 2', className: 'bg-[#E3EF26] text-[#0C342C] font-bold' };
  if (rank === 3) return { label: 'JUARA UTAMA 3', className: 'bg-[#E3EF26] text-[#0C342C] font-bold' };
  if (rank <= 6) return { label: `HARAPAN UTAMA ${rank - 3}`, className: 'bg-amber-400/20 text-amber-300 border border-amber-400/40' };
  if (rank <= 9) return { label: `JUARA MADYA ${rank - 6}`, className: 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40' };
  if (rank <= 12) return { label: `JUARA BINA ${rank - 9}`, className: 'bg-sky-400/20 text-sky-300 border border-sky-400/40' };
  if (rank <= 15) return { label: `JUARA MULA ${rank - 12}`, className: 'bg-teal-400/20 text-teal-300 border border-teal-400/40' };
  if (rank <= 18) return { label: `JUARA PURWA ${rank - 15}`, className: 'bg-purple-400/20 text-purple-300 border border-purple-400/40' };
  return { label: `JUARA CARAKA ${rank - 18}`, className: 'bg-rose-400/20 text-rose-300 border border-rose-400/40' };
}

export default function GrandMasterLeaderboardPage() {
  const [selectedJenjang, setSelectedJenjang] = useState<SchoolLevel>('SMA');
  const [activeTab, setActiveTab] = useState<'LKBB' | 'MATERI_LOMBA' | 'KHUSUS' | 'JUARA_UMUM'>('LKBB');
  const [participantsData, setParticipantsData] = useState<ParticipantRecap[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'error'>('info');
  const [loading, setLoading] = useState(true);
  const [isConfirmPublishOpen, setIsConfirmPublishOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Search filter Optimized
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Load and accumulate scores
  useEffect(() => {
    const fetchCategoryAndData = async () => {
      try {
        setLoading(true);
        const { data: cat } = await supabase
          .from('categories')
          .select('id, is_published')
          .eq('level', selectedJenjang)
          .limit(1)
          .maybeSingle();

        if (!cat) {
          setFeedbackType('error');
          setFeedback(`Kategori Lomba untuk jenjang ${selectedJenjang} belum diinisialisasi.`);
          setParticipantsData([]);
          return;
        }

        setIsPublished(cat.is_published);

        const result = await fetchLeaderboardFromApi(cat.id);
        if (result.success && result.data) {
          const mapped: ParticipantRecap[] = result.data.map((item: any) => ({
            noTampil: item.participantNo || '',
            teamName: item.teamName || '',
            schoolName: item.schoolName || '',
            gender: (item.gender || 'PUTERA') as 'PUTERA' | 'PUTERI',
            lkbbPbb: item.pbbTotal || 0,
            lkbbFavor: item.variasiTotal || 0,
            lkbbDanton: item.dantonTotal || 0,
            lkbbTotal: item.grandTotal || 0,
            bankSoal: item.bankSoal ?? null,
            semaphore: item.semaphore ?? null,
            morse: item.morse ?? null,
            miniPionering: item.miniPionering ?? null,
            kebersihan: item.kebersihan ?? null,
            fashionShow: item.fashionShow ?? null,
            administrasi: item.administrasi ?? null,
            materiTotal: item.materiTotal || 0,
          }));
          setParticipantsData(mapped);
        }
      } catch (err: any) {
        console.error(err);
        setFeedbackType('error');
        setFeedback('Gagal memuat data papan peringkat dari server API.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndData();
  }, [selectedJenjang, activeTab]);

  const handleTogglePublish = async () => {
    try {
      setIsPublishing(true);
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('level', selectedJenjang)
        .limit(1)
        .maybeSingle();

      if (!cat) throw new Error('Kategori tidak ditemukan.');

      const nextState = !isPublished;
      const result = await togglePublishStatusApi(cat.id, nextState);
      if (!result.success) throw new Error(result.message);

      setIsPublished(nextState);
      localStorage.setItem('agp_published', String(nextState));
      setFeedbackType('success');
      setFeedback(
        nextState
          ? `Hasil resmi jenjang ${selectedJenjang} berhasil dipublish ke Portal Publik!`
          : `Papan skor jenjang ${selectedJenjang} berhasil di-lock dari Portal Publik.`
      );
      setIsConfirmPublishOpen(false);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`Gagal memperbarui status publikasi: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePrintLeaderboardPdf = () => {
    if (activeTab === 'MATERI_LOMBA') {
      printMateriLombaRecapPDF(selectedJenjang, participantsData);
      return;
    }

    const winnerData = sortedParticipants.map((p, idx) => ({
      rank: idx + 1,
      noTampil: p.noTampil,
      teamName: p.teamName,
      schoolName: p.schoolName,
      juri1Score: p.lkbbPbb,
      juri2Score: p.lkbbFavor,
      juri3Score: p.lkbbDanton,
      totalScore: activeTab === 'LKBB' ? p.lkbbTotal : p.materiTotal,
    }));

    generateSkPdf(`LKBB REKAPITULASI RESMI AGP-III SMKN 1 SOREANG (${selectedJenjang})`, winnerData);
  };

  const getActiveScore = (p: ParticipantRecap) => {
    if (activeTab === 'LKBB') return p.lkbbTotal;
    if (activeTab === 'MATERI_LOMBA') return p.materiTotal;
    if (activeTab === 'KHUSUS') return (p.fashionShow || 0) + (p.administrasi || 0);
    return p.lkbbTotal + p.materiTotal + (p.fashionShow || 0) + (p.administrasi || 0);
  };

  const sortedParticipants = useMemo(() => {
    return [...participantsData]
      .filter(
        (p) =>
          p.teamName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          p.schoolName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
          p.noTampil.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      )
      .sort((a, b) => getActiveScore(b) - getActiveScore(a));
  }, [participantsData, debouncedSearchQuery, activeTab]);

  // Top 3 Podium Winners
  const firstPlace = useMemo(() => sortedParticipants[0], [sortedParticipants]);
  const secondPlace = useMemo(() => sortedParticipants[1], [sortedParticipants]);
  const thirdPlace = useMemo(() => sortedParticipants[2], [sortedParticipants]);

  // Stats
  const totalTeams = useMemo(() => sortedParticipants.length, [sortedParticipants]);
  const highestScore = useMemo(
    () => (totalTeams > 0 ? getActiveScore(sortedParticipants[0]) : 0),
    [sortedParticipants, totalTeams, activeTab]
  );
  const averageScore = useMemo(() => {
    return totalTeams > 0
      ? Math.round(sortedParticipants.reduce((sum, p) => sum + getActiveScore(p), 0) / totalTeams)
      : 0;
  }, [sortedParticipants, totalTeams, activeTab]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="pb-6 border-b border-white/[0.06] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="warning" className="gap-1.5">
              <Crown className="w-3 h-3" />
              MASTER CONTROL PANEL
            </Badge>
            <Badge variant={isPublished ? 'success' : 'secondary'} className="gap-1.5">
              {isPublished ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isPublished ? 'PUBLISHED LIVE' : 'SEALED / INTERNAL'}
            </Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
            Rekapitulasi Nilai &amp; SK Juara
          </h1>
          <p className="text-xs sm:text-sm text-[#B8D8D0]">
            Kalkulasi akumulasi nilai juri, cetak SK Penetapan Juara resmi PDF, dan kelola publish portal publik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={isPublished ? 'danger' : 'primary'}
            size="sm"
            onClick={() => setIsConfirmPublishOpen(true)}
            className="gap-2"
          >
            {isPublished ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                Lock Papan Skor
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" />
                Publish Hasil
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintLeaderboardPdf}
            className="gap-2"
            disabled={sortedParticipants.length === 0}
          >
            <FileDown className="w-3.5 h-3.5" />
            Cetak Rekap PDF
          </Button>
        </div>
      </div>

      {/* Selector Tabs */}
      <div className="flex flex-wrap gap-2 bg-[#082620] border border-white/[0.06] p-1.5 rounded-xl key-card">
        {[
          { key: 'LKBB', label: 'REKAP LKBB (21 TROPHY)', icon: Target },
          { key: 'MATERI_LOMBA', label: 'REKAP MATERI PRAMUKA A-E (PA/PI)', icon: Award },
          { key: 'KHUSUS', label: 'REKAP KHUSUS (FASHION & ADMIN)', icon: FolderKanban },
          { key: 'JUARA_UMUM', label: 'PIALA BERGILIR JUARA UMUM (106 TROPHY)', icon: Crown },
        ].map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono tracking-wider uppercase transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#076653] text-[#E3EF26] border border-[#E3EF26]/30 shadow-sm'
                  : 'text-[#B8D8D0] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Jenjang Filter Selector & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['SD', 'SMP', 'SMA'] as SchoolLevel[]).map((lvl) => (
            <Button
              key={lvl}
              variant={selectedJenjang === lvl ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedJenjang(lvl)}
              className="font-mono text-xs flex-1 sm:flex-none"
            >
              JENJANG {lvl}
            </Button>
          ))}
        </div>

        <div className="w-full sm:w-80">
          <Input
            placeholder="Cari nama regu, nomor dada, atau sekolah..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="py-2 text-xs"
            icon={<Search className="w-3.5 h-3.5 text-[#7AA89C]" />}
          />
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#7AA89C] block mb-1.5">
            TOTAL REGU / TIM ({selectedJenjang})
          </span>
          <span className="text-2xl font-semibold text-white font-mono">
            {totalTeams} <span className="text-xs font-normal text-[#B8D8D0]">Tim</span>
          </span>
        </Card>
        <Card className="p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#7AA89C] block mb-1.5">
            SKOR TERTINGGI (TOP 1)
          </span>
          <span className="text-2xl font-semibold text-[#E3EF26] font-mono">
            {highestScore} <span className="text-xs font-normal text-[#B8D8D0]">Pts</span>
          </span>
        </Card>
        <Card className="p-5">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#7AA89C] block mb-1.5">
            RATA-RATA SKOR JENJANG
          </span>
          <span className="text-2xl font-semibold text-[#56c2ff] font-mono">
            {averageScore} <span className="text-xs font-normal text-[#B8D8D0]">Pts</span>
          </span>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : sortedParticipants.length === 0 ? (
        <EmptyState
          title="Tidak Ada Data Rekap"
          description="Belum ada data peserta atau skor untuk filter yang dipilih."
        />
      ) : (
        <>
          {/* Top 3 Podium Winners */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-2">
            {/* 2nd Place Podium */}
            {secondPlace && (
              <Card className="p-5 border-white/[0.08] flex flex-col justify-between order-2 md:order-1">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="info" className="gap-1">
                    <Medal className="w-3 h-3" />
                    JUARA 2
                  </Badge>
                  <span className="text-xs font-mono text-[#7AA89C]">{secondPlace.noTampil}</span>
                </div>
                <div className="space-y-1 mb-4">
                  <div className="font-medium text-base text-white truncate">{secondPlace.teamName}</div>
                  <div className="text-xs text-[#B8D8D0] truncate">{secondPlace.schoolName}</div>
                </div>
                <div className="pt-3 border-t border-white/[0.06] flex items-baseline justify-between">
                  <span className="text-[11px] font-mono uppercase text-[#7AA89C]">TOTAL SKOR</span>
                  <span className="text-lg font-mono font-semibold text-[#56c2ff]">
                    {getActiveScore(secondPlace)} pts
                  </span>
                </div>
              </Card>
            )}

            {/* 1st Place Champion Podium */}
            {firstPlace && (
              <Card className="p-6 border-[#E3EF26]/40 bg-gradient-to-b from-[#076653]/30 to-[#082620] flex flex-col justify-between order-1 md:order-2">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="primary" className="gap-1">
                    <Trophy className="w-3 h-3" />
                    JUARA 1 / CHAMPION
                  </Badge>
                  <span className="text-xs font-mono text-[#E3EF26]">{firstPlace.noTampil}</span>
                </div>
                <div className="space-y-1 mb-5">
                  <div className="font-semibold text-lg text-white truncate">{firstPlace.teamName}</div>
                  <div className="text-xs text-[#ffffff] truncate">{firstPlace.schoolName}</div>
                </div>
                <div className="pt-3 border-t border-white/[0.08] flex items-baseline justify-between">
                  <span className="text-[11px] font-mono uppercase text-[#B8D8D0]">TOTAL SKOR</span>
                  <span className="text-xl font-mono font-semibold text-[#E3EF26]">
                    {getActiveScore(firstPlace)} pts
                  </span>
                </div>
              </Card>
            )}

            {/* 3rd Place Podium */}
            {thirdPlace && (
              <Card className="p-5 border-white/[0.08] flex flex-col justify-between order-3">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="success" className="gap-1">
                    <Medal className="w-3 h-3" />
                    JUARA 3
                  </Badge>
                  <span className="text-xs font-mono text-[#7AA89C]">{thirdPlace.noTampil}</span>
                </div>
                <div className="space-y-1 mb-4">
                  <div className="font-medium text-base text-white truncate">{thirdPlace.teamName}</div>
                  <div className="text-xs text-[#B8D8D0] truncate">{thirdPlace.schoolName}</div>
                </div>
                <div className="pt-3 border-t border-white/[0.06] flex items-baseline justify-between">
                  <span className="text-[11px] font-mono uppercase text-[#7AA89C]">TOTAL SKOR</span>
                  <span className="text-lg font-mono font-semibold text-[#E3EF26]">
                    {getActiveScore(thirdPlace)} pts
                  </span>
                </div>
              </Card>
            )}
          </div>

          {/* Ranking Cards / Detail Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              {activeTab === 'LKBB' ? (
                /* LKBB Table List */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-mono uppercase text-[#7AA89C] tracking-wider bg-[#061C18]">
                      <th className="py-3.5 px-4">Rank</th>
                      <th className="py-3.5 px-4">Dada</th>
                      <th className="py-3.5 px-4">Basis Sekolah</th>
                      <th className="py-3.5 px-4 text-center">PBB Dasar (70%)</th>
                      <th className="py-3.5 px-4 text-center">Vafor (20%)</th>
                      <th className="py-3.5 px-4 text-center">Danton (10%)</th>
                      <th className="py-3.5 px-4 text-center">Kategori Juara LKBB</th>
                      <th className="py-3.5 px-4 text-right">Total LKBB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {sortedParticipants.map((item, idx) => {
                      const rank = idx + 1;
                      const tier = getLkbbTierBadge(rank);
                      return (
                        <tr
                          key={item.noTampil}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono font-semibold text-white">
                            {idx < 3 ? (
                              <Badge
                                variant={idx === 0 ? 'primary' : idx === 1 ? 'info' : 'success'}
                                className="font-mono"
                              >
                                #{rank}
                              </Badge>
                            ) : (
                              <span className="text-[#7AA89C]">#{rank}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#E3EF26]">{item.noTampil}</td>
                          <td className="py-3.5 px-4 font-medium text-white text-sm">
                            {item.schoolName}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-[#ffffff]">
                            {item.lkbbPbb} pts
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-[#ffffff]">
                            {item.lkbbFavor} pts
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-[#ffffff]">
                            {item.lkbbDanton} pts
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono ${tier.className}`}>
                              {tier.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold text-white text-sm">
                            {item.lkbbTotal} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : activeTab === 'JUARA_UMUM' ? (
                /* Akumulasi Piala Bergilir Juara Umum (106 Trophy) */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-mono uppercase text-[#7AA89C] tracking-wider bg-[#061C18]">
                      <th className="py-3.5 px-4">Rank</th>
                      <th className="py-3.5 px-4">Dada</th>
                      <th className="py-3.5 px-4">Basis / Pangkalan Sekolah</th>
                      <th className="py-3.5 px-4 text-center">Skor LKBB</th>
                      <th className="py-3.5 px-4 text-center">Skor Materi A-E</th>
                      <th className="py-3.5 px-4 text-center">Skor Admin &amp; Fashion</th>
                      <th className="py-3.5 px-4 text-right">Akumulasi Juara Umum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {sortedParticipants.map((item, idx) => {
                      const khusus = (item.fashionShow || 0) + (item.administrasi || 0);
                      const grand = item.lkbbTotal + item.materiTotal + khusus;
                      return (
                        <tr key={item.noTampil} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4 font-mono font-semibold text-white">
                            {idx === 0 ? (
                              <Badge variant="primary" className="font-mono">JUARA UMUM</Badge>
                            ) : (
                              <span className="text-[#7AA89C]">#{idx + 1}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[#E3EF26]">{item.noTampil}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-medium text-white text-sm">{item.schoolName}</div>
                            <div className="text-[11px] text-[#7AA89C]">{item.teamName} ({item.gender})</div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-white">{item.lkbbTotal} pts</td>
                          <td className="py-3.5 px-4 text-center font-mono text-white">{item.materiTotal} pts</td>
                          <td className="py-3.5 px-4 text-center font-mono text-white">{khusus} pts</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[#E3EF26] text-sm">
                            {grand} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : activeTab === 'MATERI_LOMBA' ? (
                /* Materi Lomba Table list */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-mono uppercase text-[#7AA89C] tracking-wider bg-[#061C18]">
                      <th className="py-3.5 px-4">Rank</th>
                      <th className="py-3.5 px-4">Dada</th>
                      <th className="py-3.5 px-4">Nama Regu</th>
                      <th className="py-3.5 px-4 text-center">Satuan</th>
                      <th className="py-3.5 px-4">Basis Sekolah</th>
                      <th className="py-3.5 px-4 text-center">A: Soal</th>
                      <th className="py-3.5 px-4 text-center">B: Sem</th>
                      <th className="py-3.5 px-4 text-center">C: Morse</th>
                      <th className="py-3.5 px-4 text-center">D: Pion</th>
                      <th className="py-3.5 px-4 text-center">E: Bersih</th>
                      <th className="py-3.5 px-4 text-right">Total Materi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {sortedParticipants.map((item, idx) => (
                      <tr
                        key={item.noTampil}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-white">
                          {idx < 3 ? (
                            <Badge
                              variant={idx === 0 ? 'primary' : idx === 1 ? 'info' : 'success'}
                              className="font-mono"
                            >
                              #{idx + 1}
                            </Badge>
                          ) : (
                            <span className="text-[#7AA89C]">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#E3EF26]">{item.noTampil}</td>
                        <td className="py-3.5 px-4 font-medium text-white text-sm">
                          {item.teamName}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant="secondary" className="text-[10px]">
                            {item.gender}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-[#B8D8D0]">{item.schoolName}</td>
                        <td className="py-3.5 px-4 text-center font-mono text-[#ffffff]">
                          {item.bankSoal !== null ? (
                            item.bankSoal
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              Belum Dinilai
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[#ffffff]">
                          {item.semaphore !== null ? (
                            item.semaphore
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              Belum Dinilai
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[#ffffff]">
                          {item.morse !== null ? (
                            item.morse
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              Belum Dinilai
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[#ffffff]">
                          {item.miniPionering !== null ? (
                            item.miniPionering
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              Belum Dinilai
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[#ffffff]">
                          {item.kebersihan !== null ? (
                            item.kebersihan
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              Belum Dinilai
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-white text-sm">
                          {item.materiTotal} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* Khusus Table list */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[11px] font-mono uppercase text-[#7AA89C] tracking-wider bg-[#061C18]">
                      <th className="py-3.5 px-4">Rank</th>
                      <th className="py-3.5 px-4">Dada</th>
                      <th className="py-3.5 px-4">Nama Regu / Pangkalan</th>
                      <th className="py-3.5 px-4 text-center">Fashion Show</th>
                      <th className="py-3.5 px-4 text-center">Administrasi</th>
                      <th className="py-3.5 px-4 text-right">Total Khusus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {sortedParticipants.map((item, idx) => (
                      <tr
                        key={item.noTampil}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-3.5 px-4 font-mono font-semibold text-white">
                          {idx < 3 ? (
                            <Badge
                              variant={idx === 0 ? 'primary' : idx === 1 ? 'info' : 'success'}
                              className="font-mono"
                            >
                              #{idx + 1}
                            </Badge>
                          ) : (
                            <span className="text-[#7AA89C]">#{idx + 1}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#E3EF26]">{item.noTampil}</td>
                        <td className="py-3.5 px-4">
                          <h3 className="font-medium text-white text-sm">{item.teamName}</h3>
                          <p className="text-[#B8D8D0] text-[11px]">
                            {item.schoolName} ({item.gender})
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[#ffffff]">
                          {item.fashionShow !== null ? (
                            `${item.fashionShow} pts`
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              Belum Dinilai
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-[#ffffff]">
                          {item.administrasi !== null ? (
                            `${item.administrasi} pts`
                          ) : (
                            <Badge variant="warning" className="text-[10px]">
                              Belum Dinilai
                            </Badge>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-white text-sm">
                          {(item.fashionShow || 0) + (item.administrasi || 0)} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </>
      )}

      {/* Confirmation Modal before Publish / Lock */}
      <Modal
        isOpen={isConfirmPublishOpen}
        onClose={() => setIsConfirmPublishOpen(false)}
        title={isPublished ? 'Konfirmasi Lock Papan Skor' : 'Konfirmasi Publish Hasil Resmi'}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsConfirmPublishOpen(false)}
              disabled={isPublishing}
            >
              Batal
            </Button>
            <Button
              variant={isPublished ? 'danger' : 'primary'}
              size="sm"
              onClick={handleTogglePublish}
              isLoading={isPublishing}
            >
              {isPublished ? 'Ya, Lock Sekarang' : 'Ya, Publish Sekarang'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-[#061C18] border border-white/[0.06]">
            <AlertTriangle className="w-5 h-5 text-[#E3EF26] shrink-0 mt-0.5" />
            <p className="text-xs text-[#B8D8D0] leading-relaxed">
              {isPublished
                ? `Menyembunyikan papan skor jenjang ${selectedJenjang} akan menutup akses publik pada halaman Pengumuman Juara (/live-score).`
                : `Mempublikasikan hasil jenjang ${selectedJenjang} akan membuka seluruh peringkat dan skor resmi kepada publik di halaman Pengumuman Juara (/live-score).`}
            </p>
          </div>
        </div>
      </Modal>

      {/* Accessible Toast Notification */}
      {feedback && (
        <Toast
          message={feedback}
          type={feedbackType}
          onClose={() => setFeedback(null)}
        />
      )}
    </main>
  );
}
