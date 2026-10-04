'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { generateSkPdf } from '@/lib/pdf';
import { SchoolLevel } from '@/lib/dynamicStore';
import { fetchLeaderboardFromApi, togglePublishStatusApi } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Card, Button, Badge, Input, EmptyState, Skeleton } from '@/components/ui';
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

export default function GrandMasterLeaderboardPage() {
  const [selectedJenjang, setSelectedJenjang] = useState<SchoolLevel>('SMA');
  const [activeTab, setActiveTab] = useState<'LKBB' | 'MATERI_LOMBA' | 'KHUSUS'>('LKBB');
  const [participantsData, setParticipantsData] = useState<ParticipantRecap[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'error'>('info');
  const [loading, setLoading] = useState(true);

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
          setFeedback(`⚠️ Kategori Lomba untuk jenjang ${selectedJenjang} belum diinisialisasi.`);
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
        setFeedback('⚠️ Gagal memuat data papan peringkat dari server API.');
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndData();
  }, [selectedJenjang, activeTab]);

  const handleTogglePublish = async () => {
    try {
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
      setFeedback(nextState ? '🔓 Hasil resmi berhasil dipublish ke Portal Publik!' : '🔒 Sesi penilaian berhasil di-lock.');
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ Gagal memperbarui status publikasi: ${err.message}`);
    }
  };

  const handlePrintLeaderboardPdf = () => {
    if (activeTab === 'MATERI_LOMBA') {
      const { printMateriLombaRecapPDF } = require('@/lib/pdf');
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

    generateSkPdf(`LKBB REKAPITULASI RESMI AGP 2026 (${selectedJenjang})`, winnerData);
  };

  const getActiveScore = (p: ParticipantRecap) => {
    if (activeTab === 'LKBB') return p.lkbbTotal;
    if (activeTab === 'MATERI_LOMBA') return p.materiTotal;
    return (p.fashionShow || 0) + (p.administrasi || 0);
  };

  const sortedParticipants = useMemo(() => {
    return [...participantsData]
      .filter(p => 
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
  const highestScore = useMemo(() => totalTeams > 0 ? getActiveScore(sortedParticipants[0]) : 0, [sortedParticipants, totalTeams, activeTab]);
  const averageScore = useMemo(() => {
    return totalTeams > 0 
      ? Math.round(sortedParticipants.reduce((sum, p) => sum + getActiveScore(p), 0) / totalTeams) 
      : 0;
  }, [sortedParticipants, totalTeams, activeTab]);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Panel */}
      <div className="pb-6 border-b border-green-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="warning" className="font-black text-[9px]">
            👑 MASTER CONTROL PANEL (GRAND MASTER)
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-black text-green-950 tracking-tight">
            Rekapitulasi Nilai &amp; SK Juara
          </h1>
          <p className="text-xs sm:text-sm text-green-700/70">
            Kalkulasi akumulasi nilai juri, cetak SK Penetapan Juara resmi PDF, dan kelola publish portal publik.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant={isPublished ? 'danger' : 'primary'}
            size="sm"
            onClick={handleTogglePublish}
            className="text-xs font-bold"
          >
            {isPublished ? '🔒 Lock Papan Skor' : '🔓 Publish Hasil'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handlePrintLeaderboardPdf}
            className="text-xs font-bold"
            disabled={sortedParticipants.length === 0}
          >
            📄 Cetak Rekap PDF
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex justify-between items-center animate-in slide-in-from-top-2 duration-300 ${
            feedbackType === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : feedbackType === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-green-600 hover:text-green-900">✕</button>
        </div>
      )}

      {/* Selector Tabs */}
      <div className="flex flex-wrap gap-2 bg-green-50/60 border border-green-100 p-2 rounded-2xl">
        {[
          { key: 'LKBB', label: '🎯 REKAP PENILAIAN LKBB' },
          { key: 'MATERI_LOMBA', label: '🏆 REKAP MATERI LOMBA A-E' },
          { key: 'KHUSUS', label: '👗 REKAP KHUSUS (FASHION & ADMIN)' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-green-700 text-white shadow-sm'
                : 'text-green-800 hover:bg-green-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jenjang Filter Selector & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['SD', 'SMP', 'SMA'] as SchoolLevel[]).map(lvl => (
            <Button
              key={lvl}
              variant={selectedJenjang === lvl ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setSelectedJenjang(lvl)}
              className="text-xs font-black flex-1 sm:flex-none"
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
            className="py-2.5 text-xs"
            icon={
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <span className="text-[10px] font-black uppercase text-green-700/70 block mb-1">TOTAL REGAL / TIM</span>
          <span className="text-2xl font-black text-green-900 font-mono">{totalTeams} <span className="text-xs font-bold text-green-700/70">Tim</span></span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-black uppercase text-green-700/70 block mb-1">SKOR TERTINGGI (TOP 1)</span>
          <span className="text-2xl font-black text-green-700 font-mono">{highestScore} <span className="text-xs font-bold text-green-700/70">Pts</span></span>
        </Card>
        <Card className="p-4">
          <span className="text-[10px] font-black uppercase text-green-700/70 block mb-1">RATA-RATA SKOR JENJANG</span>
          <span className="text-2xl font-black text-amber-700 font-mono">{averageScore} <span className="text-xs font-bold text-green-700/70">Pts</span></span>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-14 w-full" />
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
          <div className="flex flex-col md:flex-row items-end justify-center gap-4 pt-4 pb-2">
            {/* 2nd Place Podium */}
            {secondPlace && (
              <div className="w-full md:w-64 flex flex-col items-center">
                <div className="text-center space-y-1 mb-2">
                  <div className="font-extrabold text-sm text-green-900">{secondPlace.teamName}</div>
                  <div className="text-[10px] text-green-600/70">{secondPlace.schoolName}</div>
                  <Badge variant="primary" className="text-[10px] py-0.5">{getActiveScore(secondPlace)} pts</Badge>
                </div>
                <div className="w-full h-24 bg-gradient-to-t from-green-100 to-white border-x border-t border-green-200 rounded-t-2xl flex flex-col items-center justify-center shadow-sm relative">
                  <div className="text-2xl font-black text-slate-500">🥈</div>
                  <div className="text-[9px] font-extrabold text-green-800 uppercase">2ND PLACE</div>
                </div>
              </div>
            )}

            {/* 1st Place Champion Podium */}
            {firstPlace && (
              <div className="w-full md:w-72 flex flex-col items-center">
                <div className="text-center space-y-1 mb-2">
                  <div className="font-black text-base text-amber-700">{firstPlace.teamName}</div>
                  <div className="text-[10px] font-bold text-green-800">{firstPlace.schoolName}</div>
                  <Badge variant="warning" className="text-[10px] py-0.5 font-mono font-black">{getActiveScore(firstPlace)} pts</Badge>
                </div>
                <div className="w-full h-36 bg-gradient-to-t from-amber-100 to-white border-x border-t border-amber-300 rounded-t-3xl flex flex-col items-center justify-center shadow-md relative">
                  <div className="text-3xl font-black">🏆</div>
                  <div className="text-[10px] font-black text-amber-800 uppercase tracking-wider">CHAMPION</div>
                </div>
              </div>
            )}

            {/* 3rd Place Podium */}
            {thirdPlace && (
              <div className="w-full md:w-64 flex flex-col items-center">
                <div className="text-center space-y-1 mb-2">
                  <div className="font-extrabold text-sm text-green-900">{thirdPlace.teamName}</div>
                  <div className="text-[10px] text-green-600/70">{thirdPlace.schoolName}</div>
                  <Badge variant="primary" className="text-[10px] py-0.5">{getActiveScore(thirdPlace)} pts</Badge>
                </div>
                <div className="w-full h-20 bg-gradient-to-t from-amber-50 to-white border-x border-t border-amber-200 rounded-t-2xl flex flex-col items-center justify-center shadow-sm relative">
                  <div className="text-xl font-black text-amber-800">🥉</div>
                  <div className="text-[9px] font-bold text-amber-800 uppercase">3RD PLACE</div>
                </div>
              </div>
            )}
          </div>

          {/* Ranking Cards / Detail Table */}
          <Card>
            <div className="overflow-x-auto">
              {activeTab === 'LKBB' ? (
                /* LKBB Table List */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-green-100 text-[10px] font-extrabold uppercase text-green-700 tracking-wider bg-green-50/80">
                      <th className="py-4 px-4">Rank</th>
                      <th className="py-4 px-4">Dada</th>
                      <th className="py-4 px-4">Basis Sekolah</th>
                      <th className="py-4 px-4 text-center">PBB Dasar</th>
                      <th className="py-4 px-4 text-center">Vafor</th>
                      <th className="py-4 px-4 text-center">Danton</th>
                      <th className="py-4 px-4 text-right">Trend Gaps</th>
                      <th className="py-4 px-4 text-right">Total LKBB</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50 text-xs">
                    {sortedParticipants.map((item, idx) => {
                      const gap = highestScore - item.lkbbTotal;
                      return (
                        <tr key={item.noTampil} className="hover:bg-green-50/60 transition-colors">
                          <td className="py-4 px-4 font-black text-green-900">
                            {idx < 3 ? (
                              <span className="text-base">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                            ) : (
                              `#${idx + 1}`
                            )}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold text-green-700">{item.noTampil}</td>
                          <td className="py-4 px-4 font-extrabold text-green-900 text-sm">{item.schoolName}</td>
                          <td className="py-4 px-4 text-center font-mono text-green-900">{item.lkbbPbb} pts</td>
                          <td className="py-4 px-4 text-center font-mono text-green-900">{item.lkbbFavor} pts</td>
                          <td className="py-4 px-4 text-center font-mono text-green-900">{item.lkbbDanton} pts</td>
                          <td className="py-4 px-4 text-right text-[10px] font-bold text-green-600/70">
                            {gap === 0 ? <span className="text-green-700 font-bold">Leader</span> : `-${gap} pts`}
                          </td>
                          <td className="py-4 px-4 text-right font-mono font-black text-green-800 text-sm">{item.lkbbTotal} pts</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : activeTab === 'MATERI_LOMBA' ? (
                /* Materi Lomba Table list */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-green-100 text-[10px] font-extrabold uppercase text-green-700 tracking-wider bg-green-50/80">
                      <th className="py-4 px-4">Rank</th>
                      <th className="py-4 px-4">Dada</th>
                      <th className="py-4 px-4">Nama Regu</th>
                      <th className="py-4 px-4 text-center">Satuan</th>
                      <th className="py-4 px-4">Basis Sekolah</th>
                      <th className="py-4 px-4 text-center">A: Soal</th>
                      <th className="py-4 px-4 text-center">B: Sem</th>
                      <th className="py-4 px-4 text-center">C: Morse</th>
                      <th className="py-4 px-4 text-center">D: Pion</th>
                      <th className="py-4 px-4 text-center">E: Bersih</th>
                      <th className="py-4 px-4 text-right">Total Materi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50 text-xs">
                    {sortedParticipants.map((item, idx) => (
                      <tr key={item.noTampil} className="hover-kirani-row transition-all duration-200 cursor-pointer">
                        <td className="py-4 px-4 font-black text-green-900">
                          {idx < 3 ? <span className="text-base">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span> : `#${idx + 1}`}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-green-700">{item.noTampil}</td>
                        <td className="py-4 px-4 font-extrabold text-green-900 text-sm">{item.teamName}</td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="primary" className="text-[8px] scale-95">{item.gender}</Badge>
                        </td>
                        <td className="py-4 px-4 text-green-800 font-semibold">{item.schoolName}</td>
                        <td className="py-4 px-4 text-center font-mono text-green-900">
                          {item.bankSoal !== null ? item.bankSoal : <Badge variant="warning" className="text-[8px]">Belum Dinilai</Badge>}
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-green-900">
                          {item.semaphore !== null ? item.semaphore : <Badge variant="warning" className="text-[8px]">Belum Dinilai</Badge>}
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-green-900">
                          {item.morse !== null ? item.morse : <Badge variant="warning" className="text-[8px]">Belum Dinilai</Badge>}
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-green-900">
                          {item.miniPionering !== null ? item.miniPionering : <Badge variant="warning" className="text-[8px]">Belum Dinilai</Badge>}
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-green-900">
                          {item.kebersihan !== null ? item.kebersihan : <Badge variant="warning" className="text-[8px]">Belum Dinilai</Badge>}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-black text-green-800 text-sm">{item.materiTotal} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                /* Khusus Table list */
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-green-100 text-[10px] font-extrabold uppercase text-green-700 tracking-wider bg-green-50/80">
                      <th className="py-4 px-4">Rank</th>
                      <th className="py-4 px-4">Dada</th>
                      <th className="py-4 px-4">Nama Regu / Pangkalan</th>
                      <th className="py-4 px-4 text-center">👗 Fashion Show</th>
                      <th className="py-4 px-4 text-center">📁 Administrasi</th>
                      <th className="py-4 px-4 text-right">Total Khusus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50 text-xs">
                    {sortedParticipants.map((item, idx) => (
                      <tr key={item.noTampil} className="hover-kirani-row transition-all duration-200 cursor-pointer">
                        <td className="py-4 px-4 font-black text-green-900">
                          {idx < 3 ? <span className="text-base">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span> : `#${idx + 1}`}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-green-700">{item.noTampil}</td>
                        <td className="py-4 px-4">
                          <h3 className="font-extrabold text-green-900 text-sm">{item.teamName}</h3>
                          <p className="text-green-700/70 text-[10px]">{item.schoolName} ({item.gender})</p>
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-green-900">
                          {item.fashionShow !== null ? `${item.fashionShow} pts` : <Badge variant="warning" className="text-[8px]">Belum Dinilai</Badge>}
                        </td>
                        <td className="py-4 px-4 text-center font-mono text-green-900">
                          {item.administrasi !== null ? `${item.administrasi} pts` : <Badge variant="warning" className="text-[8px]">Belum Dinilai</Badge>}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-black text-green-800 text-sm">
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
    </main>
  );
}
