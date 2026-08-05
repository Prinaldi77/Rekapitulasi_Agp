'use client';

import { useState, useEffect } from 'react';
import { generateSkPdf } from '@/lib/pdf';
import { SchoolLevel } from '@/lib/dynamicStore';

interface WinnerItem {
  rank: number;
  noTampil: string;
  teamName: string;
  schoolName: string;
  totalScore: number;
  badgeTitle: string;
  badgeBg: string;
  jenjang: SchoolLevel;
}

const MOCK_WINNERS: Record<SchoolLevel, WinnerItem[]> = {
  SD: [
    { rank: 1, noTampil: 'SD-01', teamName: 'PASBRAMA CILIK', schoolName: 'SDN 1 KOTA BANDUNG', totalScore: 1980, badgeTitle: '🥇 JUARA 1 (EMAS)', badgeBg: 'bg-amber-400 text-slate-950 font-black', jenjang: 'SD' },
    { rank: 2, noTampil: 'SD-02', teamName: 'GARUDA CILIK', schoolName: 'SDN 3 KOTA BANDUNG', totalScore: 1945, badgeTitle: '🥈 JUARA 2 (PERAK)', badgeBg: 'bg-slate-300 text-slate-950 font-black', jenjang: 'SD' },
  ],
  SMP: [
    { rank: 1, noTampil: 'SMP-01', teamName: 'SATRIA MUDA', schoolName: 'SMPN 1 KOTA BANDUNG', totalScore: 2040, badgeTitle: '🥇 JUARA 1 (EMAS)', badgeBg: 'bg-amber-400 text-slate-950 font-black', jenjang: 'SMP' },
    { rank: 2, noTampil: 'SMP-02', teamName: 'PANG LIMA MUDA', schoolName: 'SMPN 3 KOTA BANDUNG', totalScore: 2010, badgeTitle: '🥈 JUARA 2 (PERAK)', badgeBg: 'bg-slate-300 text-slate-950 font-black', jenjang: 'SMP' },
    { rank: 3, noTampil: 'SMP-03', teamName: 'TRISULA JUNIOR', schoolName: 'SMPN 5 KOTA BANDUNG', totalScore: 1990, badgeTitle: '🥉 JUARA 3 (PERUNGGU)', badgeBg: 'bg-amber-700 text-white font-black', jenjang: 'SMP' },
  ],
  SMA: [
    { rank: 1, noTampil: 'SMA-02', teamName: 'GARUDA KENCANA', schoolName: 'SMAN 3 KOTA BANDUNG', totalScore: 2065, badgeTitle: '🥇 JUARA 1 (EMAS)', badgeBg: 'bg-amber-400 text-slate-950 font-black', jenjang: 'SMA' },
    { rank: 2, noTampil: 'SMA-01', teamName: 'PASBRATA UTAMA', schoolName: 'SMAN 1 KOTA BANDUNG', totalScore: 2035, badgeTitle: '🥈 JUARA 2 (PERAK)', badgeBg: 'bg-slate-300 text-slate-950 font-black', jenjang: 'SMA' },
    { rank: 3, noTampil: 'SMA-03', teamName: 'KOSGARA SATRIA', schoolName: 'SMAN 5 KOTA BANDUNG', totalScore: 2000, badgeTitle: '🥉 JUARA 3 (PERUNGGU)', badgeBg: 'bg-amber-700 text-white font-black', jenjang: 'SMA' },
  ]
};

export default function WinnerAnnouncementPage() {
  const [isPublished, setIsPublished] = useState(false);
  const [selectedJenjang, setSelectedJenjang] = useState<SchoolLevel>('SMA');

  useEffect(() => {
    const published = localStorage.getItem('agp_published') === 'true';
    setIsPublished(published);
  }, []);

  const currentWinners = MOCK_WINNERS[selectedJenjang];
  const categoryTitle = `LKBB UTAMA AGP 2026 (JENJANG ${selectedJenjang})`;

  const handleDownloadPdf = () => {
    generateSkPdf(categoryTitle, currentWinners);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-2">
            <span>📜</span>
            <span>HASIL RESMI PENETAPAN JUARA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <span>🏆</span> Pengumuman Juara &amp; Rekapitulasi Lomba
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Daftar pemenang resmi terverifikasi Dewan Juri AGP Competition 2026.
          </p>
        </div>

        {/* Lock Status & Download PDF */}
        <div className="flex items-center gap-3">
          <span className={`px-3 py-2 rounded-xl text-xs font-black border flex items-center gap-1.5 ${
            isPublished 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            <span>{isPublished ? '🔓 PUBLISHED' : '🔒 PREVIEW (LOCKED)'}</span>
          </span>

          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
          >
            <span>📄</span>
            <span>DOWNLOAD SK PDF ({selectedJenjang})</span>
          </button>
        </div>
      </div>

      {/* Tabs Filter Category Jenjang SD, SMP, SMA */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setSelectedJenjang('SD')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            selectedJenjang === 'SD'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <span>🎒</span>
          <span>JENJANG SD / MI</span>
        </button>

        <button
          onClick={() => setSelectedJenjang('SMP')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            selectedJenjang === 'SMP'
              ? 'bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/20 scale-105'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <span>🏫</span>
          <span>JENJANG SMP / MTs</span>
        </button>

        <button
          onClick={() => setSelectedJenjang('SMA')}
          className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 ${
            selectedJenjang === 'SMA'
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20 scale-105'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          <span>🏛️</span>
          <span>JENJANG SMA / SMK / MA</span>
        </button>
      </div>

      {/* Podium Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {currentWinners.map((winner) => (
          <div
            key={winner.rank}
            className="relative bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-3 py-1 rounded-xl text-xs ${winner.badgeBg}`}>
                  {winner.badgeTitle}
                </span>
                <span className="font-mono text-xs text-slate-400 font-bold">
                  NO: {winner.noTampil}
                </span>
              </div>

              <h2 className="text-xl font-black text-white mb-1">{winner.teamName}</h2>
              <p className="text-xs text-slate-400 font-semibold mb-6">{winner.schoolName}</p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-500">TOTAL SKOR PENILAIAN</span>
              <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                {winner.totalScore} <span className="text-xs text-slate-500">PTS</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
