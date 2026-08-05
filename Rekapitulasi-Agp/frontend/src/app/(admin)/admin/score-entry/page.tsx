'use client';

import React, { useState, useEffect } from 'react';
import { SchoolLevel } from '@/lib/dynamicStore';
import { supabase } from '@/lib/supabase';
import { printLembarPenilaianDetailPDF } from '@/lib/pdf';

export type MateriLombaType = 
  | 'LKBB'
  | 'BANK_SOAL'
  | 'SEMAPHORE'
  | 'MORSE'
  | 'MINI_PIONERING'
  | 'KEBERSIHAN'
  | 'FASHION_SHOW'
  | 'ADMINISTRASI';

interface ScoreCriterion {
  id: string;
  categoryGroup: 'PBB_DASAR' | 'VARIASI_FORMASI' | 'DANTON';
  subGroup?: string;
  no: number;
  name: string;
  minScore: number;
  maxScore: number;
}

// 1. ITEMS FOR SD / MI
const CRITERIA_SD: ScoreCriterion[] = [
  // PBB DASAR - GERAKAN BERKUMPUL
  { id: 'sd_1', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERKUMPUL', no: 1, name: 'BERSAF KUMPUL', minScore: 15, maxScore: 25 },
  // PBB DASAR - GERAKAN DITEMPAT
  { id: 'sd_2', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 2, name: 'SIKAP SEMPURNA', minScore: 8, maxScore: 18 },
  { id: 'sd_3', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 3, name: 'ISTIRAHAT DI TEMPAT', minScore: 8, maxScore: 18 },
  { id: 'sd_4', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 4, name: 'PARADE PERIKSA KERAPIHAN', minScore: 15, maxScore: 25 },
  { id: 'sd_5', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 5, name: 'BERHITUNG', minScore: 8, maxScore: 18 },
  { id: 'sd_6', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 6, name: 'HORMAT', minScore: 8, maxScore: 18 },
  { id: 'sd_7', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 7, name: '1/2 LENGAN LENCANG KANAN', minScore: 8, maxScore: 18 },
  { id: 'sd_8', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 8, name: 'LENCANG KANAN', minScore: 8, maxScore: 18 },
  { id: 'sd_9', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 9, name: 'HADAP SERONG KANAN', minScore: 8, maxScore: 18 },
  { id: 'sd_10', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 10, name: 'HADAP SERONG KIRI', minScore: 8, maxScore: 18 },
  { id: 'sd_11', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 11, name: 'BALIK KANAN', minScore: 8, maxScore: 18 },
  { id: 'sd_12', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 12, name: 'HADAP KANAN', minScore: 8, maxScore: 18 },
  { id: 'sd_13', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 13, name: 'LENCANG DEPAN', minScore: 8, maxScore: 18 },
  { id: 'sd_14', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 14, name: 'JALAN DITEMPAT', minScore: 8, maxScore: 18 },
  // GERAKAN PINDAH TEMPAT
  { id: 'sd_15', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 15, name: '4 LANGKAH BELAKANG', minScore: 16, maxScore: 26 },
  { id: 'sd_16', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 16, name: '3 LANGKAH DEPAN', minScore: 16, maxScore: 26 },
  { id: 'sd_17', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 17, name: '4 LANGKAH KIRI', minScore: 16, maxScore: 26 },
  { id: 'sd_18', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 18, name: '3 LANGKAH KANAN', minScore: 16, maxScore: 26 },
  // GERAKAN BERHENTI KE BERJALAN
  { id: 'sd_19', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 19, name: 'LANGKAH PERLAHAN', minScore: 15, maxScore: 35 },
  { id: 'sd_20', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 20, name: 'LANGKAH BIASA', minScore: 15, maxScore: 35 },
  { id: 'sd_21', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 21, name: 'LANGKAH LARI', minScore: 15, maxScore: 35 },
  // GERAKAN BERJALAN KE BERJALAN
  { id: 'sd_22', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 22, name: 'TIAP2 BANJAR 2 KALI BELOK KANAN', minScore: 10, maxScore: 40 },
  { id: 'sd_23', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 23, name: 'LANGKAH TEGAP', minScore: 10, maxScore: 40 },
  { id: 'sd_24', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 24, name: 'HORMAT KANAN', minScore: 10, maxScore: 40 },
  { id: 'sd_25', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 25, name: 'TIAP2 BANJAR 2 KALI BELOK KIRI', minScore: 10, maxScore: 40 },
  { id: 'sd_26', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 26, name: 'HADAP KANAN HENTI', minScore: 10, maxScore: 40 },
  // BUBAR
  { id: 'sd_27', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BUBAR', no: 27, name: 'BUBAR JALAN', minScore: 15, maxScore: 25 },

  // VARIASI FORMASI
  { id: 'sd_v1', categoryGroup: 'VARIASI_FORMASI', no: 1, name: 'KEINDAHAN GERAKAN', minScore: 21, maxScore: 30 },
  { id: 'sd_v2', categoryGroup: 'VARIASI_FORMASI', no: 2, name: 'KEKOMPAKAN', minScore: 21, maxScore: 30 },
  { id: 'sd_v3', categoryGroup: 'VARIASI_FORMASI', no: 3, name: 'KESULITAN GERAKAN', minScore: 31, maxScore: 40 },
  { id: 'sd_v4', categoryGroup: 'VARIASI_FORMASI', no: 4, name: 'UNSUR PBB MURNI', minScore: 31, maxScore: 40 },
  { id: 'sd_v5', categoryGroup: 'VARIASI_FORMASI', no: 5, name: 'KEKREATIFAN', minScore: 21, maxScore: 30 },
  { id: 'sd_v6', categoryGroup: 'VARIASI_FORMASI', no: 6, name: 'ETIKA', minScore: 21, maxScore: 30 },

  // DANTON
  { id: 'sd_d1', categoryGroup: 'DANTON', no: 1, name: 'SIKAP/POSTUR', minScore: 5, maxScore: 15 },
  { id: 'sd_d2', categoryGroup: 'DANTON', no: 2, name: 'CARA MEMBERIKAN INSTRUKSI (LAGAM)', minScore: 10, maxScore: 20 },
  { id: 'sd_d3', categoryGroup: 'DANTON', no: 3, name: 'KETEPATAN PEMBERIAN ABA-ABA', minScore: 15, maxScore: 25 },
  { id: 'sd_d4', categoryGroup: 'DANTON', no: 4, name: 'PENGUASAAN LAPANGAN', minScore: 15, maxScore: 25 },
  { id: 'sd_d5', categoryGroup: 'DANTON', no: 5, name: 'INTONASI/INTERFAL PEMBERIAN ABA-ABA', minScore: 5, maxScore: 15 },
];

// 2. ITEMS FOR SMP/MTS AND SMA/SMK/MA
const CRITERIA_SMP_SMA: ScoreCriterion[] = [
  // PBB DASAR - GERAKAN BERKUMPUL
  { id: 'ss_1', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERKUMPUL', no: 1, name: 'BERSAF KUMPUL', minScore: 15, maxScore: 25 },
  // GERAKAN DITEMPAT
  { id: 'ss_2', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 2, name: 'SIKAP SEMPURNA', minScore: 8, maxScore: 18 },
  { id: 'ss_3', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 3, name: 'ISTIRAHAT DI TEMPAT', minScore: 8, maxScore: 18 },
  { id: 'ss_4', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 4, name: 'BERHITUNG', minScore: 8, maxScore: 18 },
  { id: 'ss_5', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 5, name: 'HORMAT', minScore: 8, maxScore: 18 },
  { id: 'ss_6', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 6, name: '1/2 LENGAN LENCANG KANAN', minScore: 8, maxScore: 18 },
  { id: 'ss_7', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 7, name: 'LENCANG KIRI', minScore: 8, maxScore: 18 },
  { id: 'ss_8', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 8, name: 'HADAP SERONG KANAN', minScore: 8, maxScore: 18 },
  { id: 'ss_9', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 9, name: 'PARADE PERIKSA KERAPIHAN', minScore: 15, maxScore: 25 },
  { id: 'ss_10', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 10, name: 'HADAP SERONG KIRI', minScore: 8, maxScore: 18 },
  { id: 'ss_11', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 11, name: 'BALIK KANAN', minScore: 8, maxScore: 18 },
  { id: 'ss_12', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 12, name: 'HADAP KANAN', minScore: 8, maxScore: 18 },
  { id: 'ss_13', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 13, name: 'LENCANG DEPAN', minScore: 8, maxScore: 18 },
  { id: 'ss_14', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN DITEMPAT', no: 14, name: 'JALAN DITEMPAT', minScore: 8, maxScore: 18 },
  // GERAKAN PINDAH TEMPAT
  { id: 'ss_15', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 15, name: '4 LANGKAH BELAKANG', minScore: 14, maxScore: 24 },
  { id: 'ss_16', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 16, name: '3 LANGKAH DEPAN', minScore: 14, maxScore: 24 },
  // GERAKAN BERHENTI KE BERJALAN
  { id: 'ss_17', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 17, name: 'LANGKAH PERLAHAN', minScore: 7, maxScore: 27 },
  { id: 'ss_18', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 18, name: 'LANGKAH BIASA', minScore: 7, maxScore: 27 },
  { id: 'ss_19', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 19, name: 'LANGKAH TEGAP', minScore: 7, maxScore: 27 },
  // GERAKAN BERJALAN KE BERJALAN
  { id: 'ss_20', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 20, name: 'LANGKAH LARI', minScore: 15, maxScore: 35 },
  { id: 'ss_21', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 21, name: 'LANGKAH BIASA', minScore: 15, maxScore: 35 },
  { id: 'ss_22', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 22, name: 'BELOK KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_23', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 23, name: 'TIAP2 BANJAR 2 KALI BELOK KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_24', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 24, name: 'BELOK KIRI', minScore: 15, maxScore: 35 },
  { id: 'ss_25', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 25, name: 'HORMAT KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_26', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 26, name: 'MELINTANG KIRI/KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_27', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 27, name: 'HALUAN KANAN/KIRI', minScore: 15, maxScore: 35 },
  // BUBAR
  { id: 'ss_28', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BUBAR', no: 28, name: 'BUBAR JALAN', minScore: 15, maxScore: 25 },

  // VARIASI FORMASI
  { id: 'ss_v1', categoryGroup: 'VARIASI_FORMASI', no: 1, name: 'KEINDAHAN GERAKAN', minScore: 21, maxScore: 30 },
  { id: 'ss_v2', categoryGroup: 'VARIASI_FORMASI', no: 2, name: 'KEKOMPAKAN', minScore: 21, maxScore: 30 },
  { id: 'ss_v3', categoryGroup: 'VARIASI_FORMASI', no: 3, name: 'KESULITAN GERAKAN', minScore: 31, maxScore: 40 },
  { id: 'ss_v4', categoryGroup: 'VARIASI_FORMASI', no: 4, name: 'UNSUR PBB MURNI', minScore: 31, maxScore: 40 },
  { id: 'ss_v5', categoryGroup: 'VARIASI_FORMASI', no: 5, name: 'KEKREATIFAN', minScore: 21, maxScore: 30 },
  { id: 'ss_v6', categoryGroup: 'VARIASI_FORMASI', no: 6, name: 'ETIKA', minScore: 21, maxScore: 30 },

  // DANTON
  { id: 'ss_d1', categoryGroup: 'DANTON', no: 1, name: 'SIKAP/POSTUR', minScore: 5, maxScore: 15 },
  { id: 'ss_d2', categoryGroup: 'DANTON', no: 2, name: 'CARA MEMBERIKAN INSTRUKSI (LAGAM)', minScore: 10, maxScore: 20 },
  { id: 'ss_d3', categoryGroup: 'DANTON', no: 3, name: 'KETEPATAN PEMBERIAN ABA-ABA', minScore: 15, maxScore: 25 },
  { id: 'sd_d4', categoryGroup: 'DANTON', no: 4, name: 'PENGUASAAN LAPANGAN', minScore: 15, maxScore: 25 },
  { id: 'ss_d5', categoryGroup: 'DANTON', no: 5, name: 'INTONASI/INTERFAL PEMBERIAN ABA-ABA', minScore: 5, maxScore: 15 },
];

export default function RapidScoreEntryPage() {
  const [materi, setMateri] = useState<MateriLombaType>('LKBB');
  const [jenjang, setJenjang] = useState<SchoolLevel>('SMA');
  const [genderRegu, setGenderRegu] = useState<'PUTERA' | 'PUTERI'>('PUTERA');
  const [selectedJuri, setSelectedJuri] = useState<1 | 2 | 3>(1);
  const [noPeserta, setNoPeserta] = useState('SMA-01');
  const [namaSekolah, setNamaSekolah] = useState('SMAN 1 KOTA BANDUNG');
  const [namaTim, setNamaTim] = useState('PASBRATA UTAMA');

  // Single Numeric Score state for non-LKBB materi (Bank Soal, Semaphore, Morse, Pionering, Kebersihan, etc)
  const [singleScore, setSingleScore] = useState<number>(85);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const criteriaList = jenjang === 'SD' ? CRITERIA_SD : CRITERIA_SMP_SMA;

  // Key for local storage persistence: agp_scores_<materi>_<jenjang>_<gender>_<noPeserta>_juri<selectedJuri>
  const storageKey = `agp_scores_${materi}_${jenjang}_${genderRegu}_${noPeserta.trim().toUpperCase()}_juri${selectedJuri}`;

  // Load existing scores whenever materi, jenjang, gender, noPeserta, or selectedJuri changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const existingData = localStorage.getItem(storageKey);
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        setScores(parsed.scores || {});
        if (parsed.singleScore !== undefined) setSingleScore(parsed.singleScore);
        if (parsed.namaTim) setNamaTim(parsed.namaTim);
        if (parsed.namaSekolah) setNamaSekolah(parsed.namaSekolah);
        setFeedback(`📂 Memuat lembar nilai tersimpan: ${materi} (${genderRegu}) - Peserta ${noPeserta}`);
      } catch {
        setScores({});
      }
    } else {
      setScores({});
      setFeedback(null);
    }
  }, [storageKey, materi, jenjang, genderRegu, noPeserta, selectedJuri]);

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: value,
    }));
  };

  // Pre-fill default median score for fast entry testing
  const handleAutoFillDefault = () => {
    const defaultMap: Record<string, number> = {};
    criteriaList.forEach(c => {
      defaultMap[c.id] = Math.floor((c.minScore + c.maxScore) / 2);
    });
    setScores(defaultMap);
    setSingleScore(85);
    setFeedback('✨ Berhasil mengisikan skor rata-rata default untuk seluruh item!');
  };

  // Calculate totals per category group for LKBB
  const calculateGroupTotal = (group: 'PBB_DASAR' | 'VARIASI_FORMASI' | 'DANTON') => {
    return criteriaList
      .filter(c => c.categoryGroup === group)
      .reduce((sum, c) => sum + (scores[c.id] || 0), 0);
  };

  const totalPbb = calculateGroupTotal('PBB_DASAR');
  const totalVariasi = calculateGroupTotal('VARIASI_FORMASI');
  const totalDanton = calculateGroupTotal('DANTON');
  const grandTotalLkbb = totalPbb + totalVariasi + totalDanton;

  const currentFinalTotal = materi === 'LKBB' ? grandTotalLkbb : singleScore;

  const handleSaveScoreSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    const sheetData = {
      materi,
      jenjang,
      genderRegu,
      noPeserta: noPeserta.trim().toUpperCase(),
      namaTim,
      namaSekolah,
      juri: selectedJuri,
      scores: materi === 'LKBB' ? scores : undefined,
      singleScore: materi !== 'LKBB' ? singleScore : undefined,
      totalPbb: materi === 'LKBB' ? totalPbb : 0,
      totalVariasi: materi === 'LKBB' ? totalVariasi : 0,
      totalDanton: materi === 'LKBB' ? totalDanton : 0,
      grandTotal: currentFinalTotal,
      updatedAt: new Date().toISOString(),
    };

    // Save to LocalStorage for offline LAN persistence
    localStorage.setItem(storageKey, JSON.stringify(sheetData));

    setIsSaving(false);
    setFeedback(`💾 LEMBAR PENILAIAN ${materi} (${genderRegu}) UNTUK '${namaTim}' (${noPeserta}) BERHASIL DISIMPAN! TOTAL: ${currentFinalTotal} PTS.`);
  };

  const handlePrintPembinaScoreSheet = () => {
    printLembarPenilaianDetailPDF({
      jenjang,
      noPeserta: noPeserta.trim().toUpperCase(),
      namaTim,
      namaSekolah,
      juri: selectedJuri,
      scores,
      totalPbb,
      totalVariasi,
      totalDanton,
      grandTotal: currentFinalTotal,
      criteriaList,
    });
  };

  const renderRatingOptions = (criterion: ScoreCriterion) => {
    const range: number[] = [];
    for (let i = criterion.minScore; i <= criterion.maxScore; i++) {
      range.push(i);
    }

    const currentScore = scores[criterion.id];

    return (
      <div className="flex flex-wrap items-center gap-1">
        {range.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => handleScoreChange(criterion.id, val)}
            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all border ${
              currentScore === val
                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black scale-110 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {val}
          </button>
        ))}
      </div>
    );
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Selector Materi Lomba Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800">
        {[
          { key: 'LKBB', label: '🎯 LKBB (PBB/VAFOR/DANTON)', color: 'bg-emerald-500 text-slate-950' },
          { key: 'BANK_SOAL', label: '📚 MATERI A: BANK SOAL', color: 'bg-amber-500 text-slate-950' },
          { key: 'SEMAPHORE', label: '🚩 MATERI B: SEMAPHORE', color: 'bg-sky-500 text-slate-950' },
          { key: 'MORSE', label: '📻 MATERI C: MORSE', color: 'bg-indigo-500 text-white' },
          { key: 'MINI_PIONERING', label: '🏗️ MATERI D: MINI PIONERING', color: 'bg-purple-500 text-white' },
          { key: 'KEBERSIHAN', label: '🧹 MATERI E: KEBERSIHAN BARAK', color: 'bg-teal-500 text-slate-950' },
          { key: 'FASHION_SHOW', label: '👗 FASHION SHOW', color: 'bg-rose-500 text-white' },
          { key: 'ADMINISTRASI', label: '📁 ADMINISTRASI & PEMBINA', color: 'bg-slate-700 text-white' },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMateri(m.key as MateriLombaType)}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
              materi === m.key
                ? `${m.color} shadow-lg scale-105`
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Header Form Penilaian Resmi */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black mb-2">
              <span>📋</span>
              <span>INPUT NILAI MATERI: {materi}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              FORMAT PENILAIAN {materi.replace('_', ' ')} - AGP 2026 ({jenjang})
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Pilih Kategori Regu (Putera/Puteri), Nomor Peserta, dan masukkan nilai hasil penilaian juri.
            </p>
          </div>

          {/* Selector Regu Putera/Puteri & Jenjang */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Putera / Puteri Switcher */}
            <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setGenderRegu('PUTERA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  genderRegu === 'PUTERA'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👦 REGU PUTERA (PA)
              </button>

              <button
                type="button"
                onClick={() => setGenderRegu('PUTERI')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  genderRegu === 'PUTERI'
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                👧 REGU PUTERI (PI)
              </button>
            </div>

            {/* Jenjang Switcher */}
            <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setJenjang('SD')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  jenjang === 'SD'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🎒 SD
              </button>

              <button
                type="button"
                onClick={() => setJenjang('SMP')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  jenjang === 'SMP'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏫 SMP
              </button>

              <button
                type="button"
                onClick={() => setJenjang('SMA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  jenjang === 'SMA'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🏛️ SMA
              </button>
            </div>

            {/* Juri Selector */}
            {materi === 'LKBB' && (
              <div className="bg-slate-950 p-1 rounded-2xl border border-slate-800 flex items-center gap-1">
                <span className="text-[10px] font-black uppercase text-slate-500 px-2">JURI:</span>
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedJuri(num as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                      selectedJuri === num
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    JURI {num}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Identity Bar (No Peserta & Sekolah) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
              NO PESERTA / DADA *
            </label>
            <input
              type="text"
              required
              value={noPeserta}
              onChange={(e) => setNoPeserta(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
              NAMA REGU / PASUKAN *
            </label>
            <input
              type="text"
              required
              value={namaTim}
              onChange={(e) => setNamaTim(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-extrabold text-sm outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-slate-400 mb-1">
              NAMA BASIS SEKOLAH / PANGKALAN *
            </label>
            <input
              type="text"
              required
              value={namaSekolah}
              onChange={(e) => setNamaSekolah(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold text-sm outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {feedback && (
        <div className="mb-6 p-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-between">
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* NON-LKBB MATERI SINGLE SCORE FORM */}
      {materi !== 'LKBB' ? (
        <form onSubmit={handleSaveScoreSheet} className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6 max-w-2xl mx-auto">
          <div className="text-center space-y-2">
            <span className="text-4xl">
              {materi === 'BANK_SOAL' ? '📚' :
               materi === 'SEMAPHORE' ? '🚩' :
               materi === 'MORSE' ? '📻' :
               materi === 'MINI_PIONERING' ? '🏗️' :
               materi === 'KEBERSIHAN' ? '🧹' :
               materi === 'FASHION_SHOW' ? '👗' : '📁'}
            </span>
            <h2 className="text-lg font-black text-white uppercase">
              NILAI MATERI {materi.replace('_', ' ')} ({genderRegu})
            </h2>
            <p className="text-xs text-slate-400">
              Masukkan perolehan skor angka untuk {namaTim} ({noPeserta}) dari {namaSekolah}
            </p>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-300 mb-2 text-center">
              TOTAL SKOR ANGKA DITERIMA *
            </label>
            <input
              type="number"
              required
              min={0}
              max={500}
              value={singleScore}
              onChange={(e) => setSingleScore(Number(e.target.value))}
              className="w-full text-center py-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/80 text-emerald-400 font-mono font-black text-4xl outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
          >
            {isSaving ? 'MENYIMPAN...' : `💾 SIMPAN NILAI ${materi.replace('_', ' ')} (${singleScore} PTS)`}
          </button>
        </form>
      ) : (
        /* LKBB MATERI FULL FORM */
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrintPembinaScoreSheet}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-2"
            >
              <span>🖨️</span>
              <span>PRINT LEMBAR PENILAIAN LENGKAP (UNTUK PEMBINA)</span>
            </button>

            <button
              type="button"
              onClick={handleAutoFillDefault}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded-xl text-xs font-bold transition-all"
            >
              ⚡ Auto-Fill Skor Rata-Rata Default (Fast Testing)
            </button>
          </div>

          <form onSubmit={handleSaveScoreSheet} className="space-y-8">
            {/* 1. PBB DASAR */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span>📋</span>
                  <span>1. KATEGORI PENILAIAN PBB DASAR</span>
                </h2>
                <span className="text-xs font-mono font-black text-slate-300">
                  SUBTOTAL: <strong className="text-emerald-400 text-sm">{totalPbb} PTS</strong>
                </span>
              </div>

              <div className="p-4 space-y-4 overflow-x-auto">
                {criteriaList
                  .filter(c => c.categoryGroup === 'PBB_DASAR')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3 shrink-0 lg:w-1/3">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-slate-400 font-mono text-xs font-bold flex items-center justify-center border border-slate-800">
                          {item.no}
                        </span>
                        <div>
                          {item.subGroup && (
                            <span className="text-[9px] font-black uppercase text-emerald-500 tracking-wider block">
                              {item.subGroup}
                            </span>
                          )}
                          <h4 className="text-xs font-extrabold text-white">{item.name}</h4>
                        </div>
                      </div>

                      <div className="flex-1">
                        {renderRatingOptions(item)}
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-xs font-mono font-black text-emerald-400">
                          {scores[item.id] !== undefined ? `${scores[item.id]} PTS` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 2. VARIASI FORMASI */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <span>🎨</span>
                  <span>2. KATEGORI PENILAIAN VARIASI FORMASI</span>
                </h2>
                <span className="text-xs font-mono font-black text-slate-300">
                  SUBTOTAL: <strong className="text-amber-400 text-sm">{totalVariasi} PTS</strong>
                </span>
              </div>

              <div className="p-4 space-y-4 overflow-x-auto">
                {criteriaList
                  .filter(c => c.categoryGroup === 'VARIASI_FORMASI')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3 shrink-0 lg:w-1/3">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-slate-400 font-mono text-xs font-bold flex items-center justify-center border border-slate-800">
                          {item.no}
                        </span>
                        <h4 className="text-xs font-extrabold text-white">{item.name}</h4>
                      </div>

                      <div className="flex-1">
                        {renderRatingOptions(item)}
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-xs font-mono font-black text-amber-400">
                          {scores[item.id] !== undefined ? `${scores[item.id]} PTS` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* 3. DANTON */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-sm font-black text-purple-400 uppercase tracking-wider flex items-center gap-2">
                  <span>🗣️</span>
                  <span>3. KATEGORI PENILAIAN DANTON</span>
                </h2>
                <span className="text-xs font-mono font-black text-slate-300">
                  SUBTOTAL: <strong className="text-purple-400 text-sm">{totalDanton} PTS</strong>
                </span>
              </div>

              <div className="p-4 space-y-4 overflow-x-auto">
                {criteriaList
                  .filter(c => c.categoryGroup === 'DANTON')
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3 shrink-0 lg:w-1/3">
                        <span className="w-7 h-7 rounded-lg bg-slate-900 text-slate-400 font-mono text-xs font-bold flex items-center justify-center border border-slate-800">
                          {item.no}
                        </span>
                        <h4 className="text-xs font-extrabold text-white">{item.name}</h4>
                      </div>

                      <div className="flex-1">
                        {renderRatingOptions(item)}
                      </div>

                      <div className="shrink-0 text-right">
                        <span className="text-xs font-mono font-black text-purple-400">
                          {scores[item.id] !== undefined ? `${scores[item.id]} PTS` : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* FOOTER SUMMARY & GRAND TOTAL */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-1">
                <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                  REKAPITULASI TOTAL SKOR LKBB JURI {selectedJuri} ({genderRegu})
                </h3>
                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-300">
                  <span>PBB: <strong className="text-emerald-400">{totalPbb}</strong></span>
                  <span>VARIASI: <strong className="text-amber-400">{totalVariasi}</strong></span>
                  <span>DANTON: <strong className="text-purple-400">{totalDanton}</strong></span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handlePrintPembinaScoreSheet}
                  className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-black rounded-2xl text-xs transition-all flex items-center space-x-2"
                >
                  <span>🖨️</span>
                  <span>CETAK LEMBAR PEMBINA</span>
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSaving ? 'MENYIMPAN...' : `💾 SIMPAN LKBB JURI ${selectedJuri}`}
                </button>
              </div>
            </div>
          </form>
        </>
      )}
    </main>
  );
}
