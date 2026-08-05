'use client';

import { useState, useEffect } from 'react';
import { generateSkPdf } from '@/lib/pdf';
import { SchoolLevel } from '@/lib/dynamicStore';

interface ParticipantRecap {
  noTampil: string;
  teamName: string;
  schoolName: string;
  gender: 'PUTERA' | 'PUTERI';
  // LKBB
  lkbbPbb: number;
  lkbbFavor: number;
  lkbbDanton: number;
  lkbbTotal: number;
  // Others
  bankSoal: number;
  semaphore: number;
  morse: number;
  miniPionering: number;
  kebersihan: number;
  fashionShow: number;
  administrasi: number;
  // Grand totals
  materiTotal: number; // A + B + C + D + E
}

const DEFAULT_PARTICIPANTS: Record<SchoolLevel, Omit<ParticipantRecap, 'lkbbPbb'|'lkbbFavor'|'lkbbDanton'|'lkbbTotal'|'bankSoal'|'semaphore'|'morse'|'miniPionering'|'kebersihan'|'fashionShow'|'administrasi'|'materiTotal'>[]> = {
  SD: [
    { noTampil: 'SD-01', teamName: 'PASBRAMA CILIK', schoolName: 'SDN 1 KOTA BANDUNG', gender: 'PUTERA' },
    { noTampil: 'SD-02', teamName: 'GARUDA CILIK', schoolName: 'SDN 3 KOTA BANDUNG', gender: 'PUTERI' },
  ],
  SMP: [
    { noTampil: 'SMP-01', teamName: 'SATRIA MUDA', schoolName: 'SMPN 1 KOTA BANDUNG', gender: 'PUTERA' },
    { noTampil: 'SMP-02', teamName: 'PANG LIMA MUDA', schoolName: 'SMPN 3 KOTA BANDUNG', gender: 'PUTERI' },
    { noTampil: 'SMP-03', teamName: 'TRISULA JUNIOR', schoolName: 'SMPN 5 KOTA BANDUNG', gender: 'PUTERA' },
  ],
  SMA: [
    { noTampil: 'SMA-01', teamName: 'PASBRATA UTAMA', schoolName: 'SMAN 1 KOTA BANDUNG', gender: 'PUTERA' },
    { noTampil: 'SMA-02', teamName: 'GARUDA KENCANA', schoolName: 'SMAN 3 KOTA BANDUNG', gender: 'PUTERI' },
    { noTampil: 'SMA-03', teamName: 'KOSGARA SATRIA', schoolName: 'SMAN 5 KOTA BANDUNG', gender: 'PUTERA' },
  ],
};

export default function GrandMasterLeaderboardPage() {
  const [selectedJenjang, setSelectedJenjang] = useState<SchoolLevel>('SMA');
  const [activeTab, setActiveTab] = useState<'LKBB' | 'MATERI_LOMBA' | 'KHUSUS'>('LKBB');
  const [participantsData, setParticipantsData] = useState<ParticipantRecap[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Load and accumulate scores from localStorage dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const published = localStorage.getItem('agp_published') === 'true';
    setIsPublished(published);

    const baseList = DEFAULT_PARTICIPANTS[selectedJenjang];
    const loadedData: ParticipantRecap[] = baseList.map(p => {
      // 1. Load LKBB Juri 1, 2, 3
      let pbb = 0;
      let favor = 0;
      let danton = 0;
      for (let juri = 1; juri <= 3; juri++) {
        const key = `agp_scores_LKBB_${selectedJenjang}_${p.gender}_${p.noTampil}_juri${juri}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            pbb += parsed.totalPbb || 0;
            favor += parsed.totalVariasi || 0;
            danton += parsed.totalDanton || 0;
          } catch {}
        }
      }

      // 2. Load other materi
      const getMateriScore = (mat: string) => {
        const key = `agp_scores_${mat}_${selectedJenjang}_${p.gender}_${p.noTampil}_juri1`;
        const raw = localStorage.getItem(key);
        if (raw) {
          try { return JSON.parse(raw).grandTotal || 0; } catch {}
        }
        return 0;
      };

      const bankSoal = getMateriScore('BANK_SOAL') || 85; // Fallbacks for demo
      const semaphore = getMateriScore('SEMAPHORE') || 70;
      const morse = getMateriScore('MORSE') || 75;
      const miniPionering = getMateriScore('MINI_PIONERING') || 120;
      const kebersihan = getMateriScore('KEBERSIHAN') || 130;
      const fashionShow = getMateriScore('FASHION_SHOW') || 250;
      const administrasi = getMateriScore('ADMINISTRASI') || 80;

      const lkbbTotal = pbb + favor + danton;
      const materiTotal = bankSoal + semaphore + morse + miniPionering + kebersihan;

      return {
        ...p,
        lkbbPbb: pbb || 650,
        lkbbFavor: favor || 240,
        lkbbDanton: danton || 110,
        lkbbTotal: lkbbTotal || 1000,
        bankSoal,
        semaphore,
        morse,
        miniPionering,
        kebersihan,
        fashionShow,
        administrasi,
        materiTotal,
      };
    });

    setParticipantsData(loadedData);
  }, [selectedJenjang, activeTab]);

  const handleTogglePublish = async () => {
    const nextState = !isPublished;
    setIsPublished(nextState);
    localStorage.setItem('agp_published', String(nextState));
    setFeedback(nextState ? '🔓 Published ke Portal Publik!' : '🔒 Locked kembali!');
  };

  const handlePrintLeaderboardPdf = () => {
    if (activeTab === 'MATERI_LOMBA') {
      const { printMateriLombaRecapPDF } = require('@/lib/pdf');
      printMateriLombaRecapPDF(selectedJenjang, participantsData);
      return;
    }

    const winnerData = participantsData.map((p, idx) => ({
      rank: idx + 1,
      noTampil: p.noTampil,
      teamName: p.teamName,
      schoolName: p.schoolName,
      juri1Score: p.lkbbPbb,
      juri2Score: p.lkbbFavor,
      juri3Score: p.lkbbDanton,
      totalScore: activeTab === 'LKBB' ? p.lkbbTotal : p.materiTotal,
    }));
    generateSkPdf(`LKBB UTAMA AGP (JENJANG ${selectedJenjang})`, winnerData);
  };

  // Sort participants based on activeTab
  const sortedParticipants = [...participantsData].sort((a, b) => {
    if (activeTab === 'LKBB') return b.lkbbTotal - a.lkbbTotal;
    if (activeTab === 'MATERI_LOMBA') return b.materiTotal - a.materiTotal;
    return b.fashionShow - a.fashionShow;
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black mb-2">
            <span>👑</span>
            <span>MASTER CONTROL PANEL (GRAND MASTER)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            Rekapitulasi Nilai &amp; Auto-Generate SK Juara
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau akumulasi nilai 3 juri, materi lomba A-E, dan cetak lembar rekap resmi kejuaraan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTogglePublish}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center space-x-2 border shadow-lg ${
              isPublished
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-emerald-500 text-slate-950 border-emerald-400'
            }`}
          >
            <span>{isPublished ? '🔒 LOCK' : '🔓 PUBLISH HASIL'}</span>
          </button>

          <button
            onClick={handlePrintLeaderboardPdf}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg flex items-center space-x-2"
          >
            <span>📄</span>
            <span>CETAK REKAPITULASI PDF ({selectedJenjang})</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white font-bold text-xs">✕</button>
        </div>
      )}

      {/* Tab Switchers */}
      <div className="flex flex-wrap items-center gap-3 mb-6 bg-slate-950 p-2 rounded-2xl border border-slate-800">
        <button
          onClick={() => setActiveTab('LKBB')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'LKBB' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          🎯 REKAP PENILAIAN LKBB (NAMA BASIS ONLY)
        </button>

        <button
          onClick={() => setActiveTab('MATERI_LOMBA')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'MATERI_LOMBA' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          🏆 REKAP MATERI LOMBA (REGU, SEKOLAH &amp; GENDER)
        </button>

        <button
          onClick={() => setActiveTab('KHUSUS')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'KHUSUS' ? 'bg-purple-500 text-white font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          👗 REKAP KHUSUS (FASHION SHOW &amp; ADMINISTRASI)
        </button>
      </div>

      {/* Jenjang Filter */}
      <div className="flex items-center gap-3 mb-8">
        {['SD', 'SMP', 'SMA'].map(lvl => (
          <button
            key={lvl}
            onClick={() => setSelectedJenjang(lvl as SchoolLevel)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
              selectedJenjang === lvl
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            JENJANG {lvl}
          </button>
        ))}
      </div>

      {/* Dynamic Tables rendering */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-x-auto">
        {activeTab === 'LKBB' ? (
          /* LKBB TABLE: FOCUS ONLY ON NAMA BASIS */
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">PERINGKAT</th>
                <th className="py-3 px-4">NO PES</th>
                <th className="py-3 px-4">NAMA BASIS (SEKOLAH)</th>
                <th className="py-3 px-4 text-center">PBB DASAR</th>
                <th className="py-3 px-4 text-center">VARIASI FORMASI</th>
                <th className="py-3 px-4 text-center">DANTON</th>
                <th className="py-3 px-4 text-right">TOTAL NILAI LKBB</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {sortedParticipants.map((item, idx) => (
                <tr key={item.noTampil} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 px-4 font-black">#{idx + 1}</td>
                  <td className="py-4 px-4 font-mono font-bold text-emerald-400">{item.noTampil}</td>
                  <td className="py-4 px-4 font-extrabold text-white text-sm">
                    {item.schoolName}
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-300">{item.lkbbPbb} PTS</td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-300">{item.lkbbFavor} PTS</td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-300">{item.lkbbDanton} PTS</td>
                  <td className="py-4 px-4 text-right font-mono font-black text-emerald-400 text-base">{item.lkbbTotal} PTS</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === 'MATERI_LOMBA' ? (
          /* MATERI LOMBA TABLE: REGU, SATUAN (PA/PI), BASIS (SEKOLAH) */
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">RANK</th>
                <th className="py-3 px-4">PEST</th>
                <th className="py-3 px-4">NAMA REGU</th>
                <th className="py-3 px-4 text-center">SATUAN</th>
                <th className="py-3 px-4">BASIS (SEKOLAH)</th>
                <th className="py-3 px-4 text-center">A: BANK SOAL</th>
                <th className="py-3 px-4 text-center">B: SEMAPHORE</th>
                <th className="py-3 px-4 text-center">C: MORSE</th>
                <th className="py-3 px-4 text-center">D: PIONERING</th>
                <th className="py-3 px-4 text-center">E: KEBERSIHAN</th>
                <th className="py-3 px-4 text-right">TOTAL MATERI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {sortedParticipants.map((item, idx) => (
                <tr key={item.noTampil} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 px-4 font-black">#{idx + 1}</td>
                  <td className="py-4 px-4 font-mono font-bold text-amber-400">{item.noTampil}</td>
                  <td className="py-4 px-4 font-extrabold text-white text-sm">{item.teamName}</td>
                  <td className="py-4 px-4 text-center font-bold text-slate-300">
                    {item.gender === 'PUTERA' ? 'PA (PUTRA)' : 'PI (PUTRI)'}
                  </td>
                  <td className="py-4 px-4 text-slate-300 font-medium">{item.schoolName}</td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-300">{item.bankSoal}</td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-300">{item.semaphore}</td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-300">{item.morse}</td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-300">{item.miniPionering}</td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-300">{item.kebersihan}</td>
                  <td className="py-4 px-4 text-right font-mono font-black text-amber-400 text-base">{item.materiTotal} PTS</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* KHUSUS TABLE */
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-4">RANK</th>
                <th className="py-3 px-4">NO PES</th>
                <th className="py-3 px-4">NAMA REGU / PANGKALAN</th>
                <th className="py-3 px-4 text-center">👗 FASHION SHOW</th>
                <th className="py-3 px-4 text-center">📁 ADMINISTRASI</th>
                <th className="py-3 px-4 text-right">TOTAL KHUSUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {sortedParticipants.map((item, idx) => (
                <tr key={item.noTampil} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4 px-4 font-black">#{idx + 1}</td>
                  <td className="py-4 px-4 font-mono font-bold text-purple-400">{item.noTampil}</td>
                  <td className="py-4 px-4">
                    <h3 className="font-extrabold text-white text-sm">{item.teamName}</h3>
                    <p className="text-slate-400 text-[11px]">{item.schoolName} ({item.gender})</p>
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-300">{item.fashionShow} PTS</td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-300">{item.administrasi} PTS</td>
                  <td className="py-4 px-4 text-right font-mono font-black text-purple-400 text-base">
                    {item.fashionShow + item.administrasi} PTS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
