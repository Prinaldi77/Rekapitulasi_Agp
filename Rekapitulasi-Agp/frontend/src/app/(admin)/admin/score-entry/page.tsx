'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SchoolLevel } from '@/lib/dynamicStore';
import { supabase } from '@/lib/supabase';
import { printLembarPenilaianDetailPDF } from '@/lib/pdf';
import { submitScoresToApi } from '@/lib/api';
import { Card, Button, Input, Badge, Modal, ScoreStepper, Toast } from '@/components/ui';
import { useDebounce } from '@/lib/useDebounce';
import ScoreOcrUploader from '@/components/ScoreOcrUploader';

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

const CRITERIA_SD: ScoreCriterion[] = [
  { id: 'sd_1', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERKUMPUL', no: 1, name: 'BERSAF KUMPUL', minScore: 15, maxScore: 25 },
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
  { id: 'sd_15', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 15, name: '4 LANGKAH BELAKANG', minScore: 16, maxScore: 26 },
  { id: 'sd_16', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 16, name: '3 LANGKAH DEPAN', minScore: 16, maxScore: 26 },
  { id: 'sd_17', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 17, name: '4 LANGKAH KIRI', minScore: 16, maxScore: 26 },
  { id: 'sd_18', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 18, name: '3 LANGKAH KANAN', minScore: 16, maxScore: 26 },
  { id: 'sd_19', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 19, name: 'LANGKAH PERLAHAN', minScore: 15, maxScore: 35 },
  { id: 'sd_20', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 20, name: 'LANGKAH BIASA', minScore: 15, maxScore: 35 },
  { id: 'sd_21', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 21, name: 'LANGKAH LARI', minScore: 15, maxScore: 35 },
  { id: 'sd_22', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 22, name: 'TIAP2 BANJAR 2 KALI BELOK KANAN', minScore: 10, maxScore: 40 },
  { id: 'sd_23', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 23, name: 'LANGKAH TEGAP', minScore: 10, maxScore: 40 },
  { id: 'sd_24', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 24, name: 'HORMAT KANAN', minScore: 10, maxScore: 40 },
  { id: 'sd_25', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 25, name: 'TIAP2 BANJAR 2 KALI BELOK KIRI', minScore: 10, maxScore: 40 },
  { id: 'sd_26', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 26, name: 'HADAP KANAN HENTI', minScore: 10, maxScore: 40 },
  { id: 'sd_27', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BUBAR', no: 27, name: 'BUBAR JALAN', minScore: 15, maxScore: 25 },
  { id: 'sd_v1', categoryGroup: 'VARIASI_FORMASI', no: 1, name: 'KEINDAHAN GERAKAN', minScore: 21, maxScore: 30 },
  { id: 'sd_v2', categoryGroup: 'VARIASI_FORMASI', no: 2, name: 'KEKOMPAKAN', minScore: 21, maxScore: 30 },
  { id: 'sd_v3', categoryGroup: 'VARIASI_FORMASI', no: 3, name: 'KESULITAN GERAKAN', minScore: 31, maxScore: 40 },
  { id: 'sd_v4', categoryGroup: 'VARIASI_FORMASI', no: 4, name: 'UNSUR PBB MURNI', minScore: 31, maxScore: 40 },
  { id: 'sd_v5', categoryGroup: 'VARIASI_FORMASI', no: 5, name: 'KEKREATIFAN', minScore: 21, maxScore: 30 },
  { id: 'sd_v6', categoryGroup: 'VARIASI_FORMASI', no: 6, name: 'ETIKA', minScore: 21, maxScore: 30 },
  { id: 'sd_d1', categoryGroup: 'DANTON', no: 1, name: 'SIKAP/POSTUR', minScore: 5, maxScore: 15 },
  { id: 'sd_d2', categoryGroup: 'DANTON', no: 2, name: 'CARA MEMBERIKAN INSTRUKSI (LAGAM)', minScore: 10, maxScore: 20 },
  { id: 'sd_d3', categoryGroup: 'DANTON', no: 3, name: 'KETEPATAN PEMBERIAN ABA-ABA', minScore: 15, maxScore: 25 },
  { id: 'sd_d4', categoryGroup: 'DANTON', no: 4, name: 'PENGUASAAN LAPANGAN', minScore: 15, maxScore: 25 },
  { id: 'sd_d5', categoryGroup: 'DANTON', no: 5, name: 'INTONASI/INTERFAL PEMBERIAN ABA-ABA', minScore: 5, maxScore: 15 },
];

const CRITERIA_SMP_SMA: ScoreCriterion[] = [
  { id: 'ss_1', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERKUMPUL', no: 1, name: 'BERSAF KUMPUL', minScore: 15, maxScore: 25 },
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
  { id: 'ss_15', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 15, name: '4 LANGKAH BELAKANG', minScore: 14, maxScore: 24 },
  { id: 'ss_16', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN PINDAH TEMPAT', no: 16, name: '3 LANGKAH DEPAN', minScore: 14, maxScore: 24 },
  { id: 'ss_17', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 17, name: 'LANGKAH PERLAHAN', minScore: 7, maxScore: 27 },
  { id: 'ss_18', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 18, name: 'LANGKAH BIASA', minScore: 7, maxScore: 27 },
  { id: 'ss_19', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERHENTI KE BERJALAN', no: 19, name: 'LANGKAH TEGAP', minScore: 7, maxScore: 27 },
  { id: 'ss_20', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 20, name: 'LANGKAH LARI', minScore: 15, maxScore: 35 },
  { id: 'ss_21', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 21, name: 'LANGKAH BIASA', minScore: 15, maxScore: 35 },
  { id: 'ss_22', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 22, name: 'BELOK KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_23', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 23, name: 'TIAP2 BANJAR 2 KALI BELOK KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_24', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 24, name: 'BELOK KIRI', minScore: 15, maxScore: 35 },
  { id: 'ss_25', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 25, name: 'HORMAT KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_26', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 26, name: 'MELINTANG KIRI/KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_27', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BERJALAN KE BERJALAN', no: 27, name: 'HALUAN KANAN/KIRI', minScore: 15, maxScore: 35 },
  { id: 'ss_28', categoryGroup: 'PBB_DASAR', subGroup: 'GERAKAN BUBAR', no: 28, name: 'BUBAR JALAN', minScore: 15, maxScore: 25 },
  { id: 'ss_v1', categoryGroup: 'VARIASI_FORMASI', no: 1, name: 'KEINDAHAN GERAKAN', minScore: 21, maxScore: 30 },
  { id: 'ss_v2', categoryGroup: 'VARIASI_FORMASI', no: 2, name: 'KEKOMPAKAN', minScore: 21, maxScore: 30 },
  { id: 'ss_v3', categoryGroup: 'VARIASI_FORMASI', no: 3, name: 'KESULITAN GERAKAN', minScore: 31, maxScore: 40 },
  { id: 'ss_v4', categoryGroup: 'VARIASI_FORMASI', no: 4, name: 'UNSUR PBB MURNI', minScore: 31, maxScore: 40 },
  { id: 'ss_v5', categoryGroup: 'VARIASI_FORMASI', no: 5, name: 'KEKREATIFAN', minScore: 21, maxScore: 30 },
  { id: 'ss_v6', categoryGroup: 'VARIASI_FORMASI', no: 6, name: 'ETIKA', minScore: 21, maxScore: 30 },
  { id: 'ss_d1', categoryGroup: 'DANTON', no: 1, name: 'SIKAP/POSTUR', minScore: 5, maxScore: 15 },
  { id: 'ss_d2', categoryGroup: 'DANTON', no: 2, name: 'CARA MEMBERIKAN INSTRUKSI (LAGAM)', minScore: 10, maxScore: 20 },
  { id: 'ss_d3', categoryGroup: 'DANTON', no: 3, name: 'KETEPATAN PEMBERIAN ABA-ABA', minScore: 15, maxScore: 25 },
  { id: 'ss_d4', categoryGroup: 'DANTON', no: 4, name: 'PENGUASAAN LAPANGAN', minScore: 15, maxScore: 25 },
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

  // Participant Search & List Sidebar
  const [participants, setParticipants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Single Numeric Score state for non-LKBB materi
  const [singleScore, setSingleScore] = useState<number>(85);

  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'info'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);

  // Accordion Expand/Collapse State
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    PBB_DASAR: true,
    VARIASI_FORMASI: true,
    DANTON: true,
  });

  const criteriaList = useMemo(() => {
    return jenjang === 'SD' ? CRITERIA_SD : CRITERIA_SMP_SMA;
  }, [jenjang]);

  // Refs array for input keyboard shortcuts
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Key for local storage persistence
  const storageKey = `agp_scores_${materi}_${jenjang}_${genderRegu}_${noPeserta.trim().toUpperCase()}_juri${selectedJuri}`;

  // Fetch participants on mount
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const { data } = await supabase
          .from('participants')
          .select('*, category:categories(*)');
        if (data && data.length > 0) {
          setParticipants(data);
        } else {
          setParticipants([
            { id: 'p_sma1', participant_no: 'SMA-01', team_name: 'PASBRATA UTAMA', school_name: 'SMAN 1 KOTA BANDUNG', category: { level: 'SMA' } },
            { id: 'p_smp1', participant_no: 'SMP-01', team_name: 'PASKIBRA SMP 1', school_name: 'SMPN 1 KOTA BANDUNG', category: { level: 'SMP' } },
            { id: 'p_sd1', participant_no: 'SD-01', team_name: 'TUNAS BANGSA', school_name: 'SDN 1 KOTA BANDUNG', category: { level: 'SD' } },
          ]);
        }
      } catch (err) {
        console.error('Error fetching participants:', err);
        setParticipants([
          { id: 'p_sma1', participant_no: 'SMA-01', team_name: 'PASBRATA UTAMA', school_name: 'SMAN 1 KOTA BANDUNG', category: { level: 'SMA' } },
          { id: 'p_smp1', participant_no: 'SMP-01', team_name: 'PASKIBRA SMP 1', school_name: 'SMPN 1 KOTA BANDUNG', category: { level: 'SMP' } },
          { id: 'p_sd1', participant_no: 'SD-01', team_name: 'TUNAS BANGSA', school_name: 'SDN 1 KOTA BANDUNG', category: { level: 'SD' } },
        ]);
      }
    };
    fetchParticipants();
  }, []);

  // Load existing scores whenever key variables change
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
        setFeedbackType('info');
        setFeedback(`📂 Memuat nilai tersimpan: ${materi} - Peserta ${noPeserta}`);
      } catch {
        setScores({});
      }
    } else {
      setScores({});
      setFeedback(null);
    }
  }, [storageKey, materi, jenjang, genderRegu, noPeserta, selectedJuri]);

  const calculateGroupTotal = useCallback((scoresObj: Record<string, number>, group: 'PBB_DASAR' | 'VARIASI_FORMASI' | 'DANTON') => {
    return criteriaList
      .filter(c => c.categoryGroup === group)
      .reduce((sum, c) => sum + (scoresObj[c.id] || 0), 0);
  }, [criteriaList]);

  // Auto Save into localStorage as users type/modify
  const handleScoreChange = useCallback((criterionId: string, value: number) => {
    setScores(prev => {
      const newScores = { ...prev, [criterionId]: value };
      
      const sheetData = {
        materi,
        jenjang,
        genderRegu,
        noPeserta: noPeserta.trim().toUpperCase(),
        namaTim,
        namaSekolah,
        juri: selectedJuri,
        scores: newScores,
        singleScore: materi !== 'LKBB' ? singleScore : undefined,
        totalPbb: calculateGroupTotal(newScores, 'PBB_DASAR'),
        totalVariasi: calculateGroupTotal(newScores, 'VARIASI_FORMASI'),
        totalDanton: calculateGroupTotal(newScores, 'DANTON'),
        grandTotal: (materi === 'LKBB' 
          ? calculateGroupTotal(newScores, 'PBB_DASAR') + calculateGroupTotal(newScores, 'VARIASI_FORMASI') + calculateGroupTotal(newScores, 'DANTON')
          : singleScore
        ),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(sheetData));
      return newScores;
    });
  }, [storageKey, materi, jenjang, genderRegu, noPeserta, namaTim, namaSekolah, selectedJuri, singleScore, calculateGroupTotal]);

  const handleSingleScoreChange = useCallback((value: number) => {
    setSingleScore(value);
    const sheetData = {
      materi,
      jenjang,
      genderRegu,
      noPeserta: noPeserta.trim().toUpperCase(),
      namaTim,
      namaSekolah,
      juri: selectedJuri,
      scores: undefined,
      singleScore: value,
      totalPbb: 0,
      totalVariasi: 0,
      totalDanton: 0,
      grandTotal: value,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(sheetData));
  }, [storageKey, materi, jenjang, genderRegu, noPeserta, namaTim, namaSekolah, selectedJuri]);

  const handleAutoFillDefault = () => {
    const defaultMap: Record<string, number> = {};
    criteriaList.forEach(c => {
      defaultMap[c.id] = Math.floor((c.minScore + c.maxScore) / 2);
    });
    setScores(defaultMap);
    setSingleScore(85);
    setFeedbackType('success');
    setFeedback('✨ Berhasil mengisi skor rata-rata default!');
  };

  const totalPbb = useMemo(() => calculateGroupTotal(scores, 'PBB_DASAR'), [scores, calculateGroupTotal]);
  const totalVariasi = useMemo(() => calculateGroupTotal(scores, 'VARIASI_FORMASI'), [scores, calculateGroupTotal]);
  const totalDanton = useMemo(() => calculateGroupTotal(scores, 'DANTON'), [scores, calculateGroupTotal]);
  const grandTotalLkbb = useMemo(() => totalPbb + totalVariasi + totalDanton, [totalPbb, totalVariasi, totalDanton]);
  const currentFinalTotal = materi === 'LKBB' ? grandTotalLkbb : singleScore;

  // Track progress of filled criteria
  const filledCriteriaCount = useMemo(() => criteriaList.filter(c => scores[c.id] !== undefined && scores[c.id] > 0).length, [criteriaList, scores]);
  const totalCriteriaCount = useMemo(() => criteriaList.length, [criteriaList]);
  const progressPercent = useMemo(() => totalCriteriaCount > 0 ? Math.round((filledCriteriaCount / totalCriteriaCount) * 100) : 0, [filledCriteriaCount, totalCriteriaCount]);

  const handleSaveScoreSheet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    if (materi === 'LKBB') {
      const outOfBounds = criteriaList.find(c => {
        const val = scores[c.id];
        return val !== undefined && (val < c.minScore || val > c.maxScore);
      });
      if (outOfBounds) {
        setFeedbackType('error');
        setFeedback(`❌ Nilai item '${outOfBounds.name}' berada di luar batas (${outOfBounds.minScore} - ${outOfBounds.maxScore} PTS).`);
        setIsSaving(false);
        return;
      }
    }

    try {
      let participantId = '';
      const { data: part } = await supabase
        .from('participants')
        .select('id')
        .eq('participant_no', noPeserta.trim().toUpperCase())
        .limit(1)
        .maybeSingle();

      if (part) {
        participantId = part.id;
      } else {
        const { data: cat } = await supabase
          .from('categories')
          .select('id')
          .eq('level', jenjang)
          .limit(1)
          .maybeSingle();

        const categoryId = cat?.id || 'c1111111-1111-1111-1111-111111111111';

        const { data: newPart, error: partErr } = await supabase
          .from('participants')
          .insert({
            participant_no: noPeserta.trim().toUpperCase(),
            team_name: namaTim.trim(),
            school_name: namaSekolah.trim(),
            category_id: categoryId,
            show_number: Math.floor(Math.random() * 100) + 1
          })
          .select()
          .single();

        if (partErr || !newPart) throw new Error(partErr?.message || 'Gagal mendaftarkan peserta baru.');
        participantId = newPart.id;
      }

      const scoresMap = materi === 'LKBB' ? scores : { [materi]: singleScore };
      const result = await submitScoresToApi(participantId, selectedJuri, scoresMap);

      if (!result.success) throw new Error(result.message);

      setFeedbackType('success');
      setFeedback(`💾 LEMBAR PENILAIAN BERHASIL DISIMPAN! TOTAL: ${currentFinalTotal} PTS.`);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`❌ GAGAL MENYIMPAN NILAI: ${err.message || 'Kesalahan koneksi API Backend.'}`);
    } finally {
      setIsSaving(false);
    }
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, currentId: string, idx: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextCriterion = criteriaList[idx + 1];
      if (nextCriterion) {
        inputRefs.current[nextCriterion.id]?.focus();
        inputRefs.current[nextCriterion.id]?.select();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevCriterion = criteriaList[idx - 1];
      if (prevCriterion) {
        inputRefs.current[prevCriterion.id]?.focus();
        inputRefs.current[prevCriterion.id]?.select();
      }
    }
  }, [criteriaList]);

  const toggleAccordion = useCallback((group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  }, []);

  const selectParticipant = useCallback((p: any) => {
    setNoPeserta(p.participant_no);
    setNamaTim(p.team_name);
    setNamaSekolah(p.school_name);
    if (p.category?.level) setJenjang(p.category.level);
  }, []);

  // Filtered Participants List - Memoized and Debounced
  const filteredParticipants = useMemo(() => {
    const q = (debouncedSearchQuery || '').toLowerCase();
    return (participants || []).filter(p => {
      if (!p) return false;
      const teamName = (p.team_name || '').toLowerCase();
      const schoolName = (p.school_name || '').toLowerCase();
      const partNo = (p.participant_no || '').toLowerCase();
      return teamName.includes(q) || schoolName.includes(q) || partNo.includes(q);
    });
  }, [participants, debouncedSearchQuery]);

  return (
    <>
    <main className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-green-50/50 border border-green-200/60 p-2 rounded-2xl shadow-sm">
        {[
          { key: 'LKBB', label: '🎯 LKBB (PBB/VAFOR/DANTON)' },
          { key: 'BANK_SOAL', label: '📚 BANK SOAL' },
          { key: 'SEMAPHORE', label: '🚩 SEMAPHORE' },
          { key: 'MORSE', label: '📻 MORSE' },
          { key: 'MINI_PIONERING', label: '🏗️ PIONERING' },
          { key: 'KEBERSIHAN', label: '🧹 KEBERSIHAN' },
          { key: 'FASHION_SHOW', label: '👗 FASHION' },
          { key: 'ADMINISTRASI', label: '📁 ADMIN' },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMateri(m.key as MateriLombaType)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              materi === m.key
                ? 'bg-white text-green-900 border border-green-300 shadow-sm ring-1 ring-green-100'
                : 'text-green-800/60 hover:text-green-900 hover:bg-green-100/50 border border-transparent'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Split Layout Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Participant List Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-4 space-y-4">
            <h3 className="text-xs font-black uppercase text-green-800 tracking-wider">Antrean Peserta</h3>
            <Input
              placeholder="Cari No / Tim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="py-2 text-xs"
              icon={
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />


            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {filteredParticipants.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic text-center py-4">Tidak ada tim.</p>
              ) : (
                filteredParticipants.map((p) => {
                  const isActive = noPeserta === p.participant_no;
                  return (
                    <button
                      key={p.id}
                      onClick={() => selectParticipant(p)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex flex-col gap-1.5 ${
                        isActive
                          ? 'border-green-400 bg-green-50 text-green-950 shadow-sm ring-1 ring-green-400/30'
                          : 'border-green-100 bg-white hover:bg-green-50/60 hover:border-green-200'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className={`font-black ${isActive ? 'text-green-900' : 'text-green-800'}`}>@{p.participant_no}</span>
                        <Badge variant={isActive ? 'success' : 'secondary'} className="text-[9px] scale-90">{p.category?.level}</Badge>
                      </div>
                      <span className={`font-bold truncate ${isActive ? 'text-green-800' : 'text-slate-600'}`}>{p.team_name}</span>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="p-4 space-y-2 text-xs">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Petunjuk Pengisian</div>
            <p className="text-slate-400 leading-relaxed text-[10px]">
              Gunakan tombol <kbd className="bg-slate-950 px-1.5 py-0.5 rounded text-white border border-slate-800">▲</kbd> / <kbd className="bg-slate-950 px-1.5 py-0.5 rounded text-white border border-slate-800">▼</kbd> atau <kbd className="bg-slate-950 px-1.5 py-0.5 rounded text-white border border-slate-800">Enter</kbd> untuk berpindah kolom skor secara instan.
            </p>
          </Card>
        </div>

        {/* Right Side: Score Input Form */}
        <div className="lg:col-span-3 space-y-6">
          
          <Card className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-green-200/60">
              <div className="space-y-1">
                <Badge variant="success" className="text-[9px] font-black">Materi: {materi}</Badge>
                <h2 className="text-lg font-black text-green-950 uppercase">FORMAT NILAI {materi} ({jenjang})</h2>
              </div>

              {/* Form Controls */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex bg-green-50/50 p-0.5 rounded-lg border border-green-200/80 shadow-sm">
                  {(['PUTERA', 'PUTERI'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setGenderRegu(g)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        genderRegu === g ? 'bg-white text-green-900 shadow-sm border border-green-200' : 'text-green-800/60 hover:text-green-900 border border-transparent'
                      }`}
                    >
                      {g === 'PUTERA' ? '👦 PA' : '👧 PI'}
                    </button>
                  ))}
                </div>

                <div className="flex bg-green-50/50 p-0.5 rounded-lg border border-green-200/80 shadow-sm">
                  {(['SD', 'SMP', 'SMA'] as const).map(j => (
                    <button
                      key={j}
                      onClick={() => setJenjang(j)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        jenjang === j ? 'bg-white text-green-900 shadow-sm border border-green-200' : 'text-green-800/60 hover:text-green-900 border border-transparent'
                      }`}
                    >
                      {j}
                    </button>
                  ))}
                </div>

                {materi === 'LKBB' && (
                  <div className="flex bg-amber-50/50 p-0.5 rounded-lg border border-amber-200/80 shadow-sm">
                    {[1, 2, 3].map(num => (
                      <button
                        key={num}
                        onClick={() => setSelectedJuri(num as any)}
                        className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                          selectedJuri === num ? 'bg-white text-amber-900 shadow-sm border border-amber-200' : 'text-amber-800/60 hover:text-amber-900 border border-transparent'
                        }`}
                      >
                        JURI {num}
                      </button>
                    ))}
                  </div>
                )}

                {/* OCR Scan Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOcrModalOpen(true)}
                  className="text-[10px] font-black border-green-300 text-green-800 hover:bg-green-50 hover:text-green-950 py-1.5 px-3 bg-white"
                >
                  📷 Scan Kertas Juri
                </Button>
              </div>
            </div>

            {/* Inputs identity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                id="score-noPeserta"
                label="Nomor Dada *"
                value={noPeserta}
                onChange={(e) => setNoPeserta(e.target.value)}
                className="py-2 font-mono font-bold text-xs"
              />
              <Input
                id="score-teamName"
                label="Nama Tim *"
                value={namaTim}
                onChange={(e) => setNamaTim(e.target.value)}
                className="py-2 font-bold text-xs"
              />
              <Input
                id="score-schoolName"
                label="Asal Sekolah *"
                value={namaSekolah}
                onChange={(e) => setNamaSekolah(e.target.value)}
                className="py-2 font-bold text-xs"
              />
            </div>

            {/* Progress Bar */}
            {materi === 'LKBB' && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-[10px] font-bold text-green-700/80 uppercase tracking-wide">
                  <span>Progres Penilaian</span>
                  <span>{filledCriteriaCount} / {totalCriteriaCount} Item ({progressPercent}%)</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-green-100 overflow-hidden p-0.5 border border-green-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-600 to-green-500 transition-all duration-300 shadow-sm"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </Card>

          {feedback && (
            <Toast
              message={feedback}
              type={feedbackType === 'success' ? 'success' : feedbackType === 'error' ? 'error' : 'info'}
              onClose={() => setFeedback(null)}
            />
          )}

          {/* Form Content */}
          {materi !== 'LKBB' ? (
            /* NON-LKBB Form */
            <form onSubmit={handleSaveScoreSheet}>
              <Card className="p-10 space-y-8 text-center border-green-200 bg-gradient-to-b from-white to-green-50/30">
                <div className="space-y-2">
                  <h3 className="text-sm font-black text-green-900 uppercase tracking-widest">Skor Angka {materi}</h3>
                  <p className="text-xs font-semibold text-green-700/60">Masukkan skor langsung tanpa kriteria detail</p>
                </div>
                <div className="max-w-[200px] mx-auto">
                  <input
                    type="number"
                    required
                    min={0}
                    max={500}
                    value={singleScore}
                    onChange={(e) => handleSingleScoreChange(Number(e.target.value))}
                    className="w-full text-center py-5 rounded-2xl bg-white border-2 border-green-300 focus:border-green-600 focus:ring-4 focus:ring-green-500/20 text-green-950 font-mono font-black text-5xl outline-none transition-all shadow-inner"
                  />
                </div>
                <Button variant="primary" type="submit" className="w-full max-w-[200px] py-4 mt-4 text-xs font-bold" isLoading={isSaving}>
                  💾 SIMPAN NILAI
                </Button>
              </Card>
            </form>
          ) : (
            /* LKBB Full Form */
            <form onSubmit={handleSaveScoreSheet} className="space-y-6">

              {/* Accordion Group 1: PBB Dasar */}
              <div className="border border-green-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('PBB_DASAR')}
                  className="w-full bg-green-50/80 px-5 py-4 flex justify-between items-center text-xs font-black text-green-900 hover:bg-green-100 transition-colors cursor-pointer border-b border-green-100"
                >
                  <span className="flex items-center gap-2">
                    <span>1. PBB DASAR</span>
                    <Badge variant="primary" className="text-[8px] scale-90">{totalPbb} PTS</Badge>
                  </span>
                  <span>{expandedGroups.PBB_DASAR ? '▲' : '▼'}</span>
                </button>

                {expandedGroups.PBB_DASAR && (
                  <div className="p-4 space-y-3.5 divide-y divide-green-100 max-h-[480px] overflow-y-auto custom-scrollbar">
                    {criteriaList
                      .filter(c => c.categoryGroup === 'PBB_DASAR')
                      .map((item, index) => (
                        <div key={item.id} className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="w-6 h-6 rounded bg-green-100 text-green-800 font-mono text-[10px] font-bold flex items-center justify-center border border-green-200">
                              {item.no}
                            </span>
                            <div className="min-w-0">
                              {item.subGroup && <span className="text-[8px] text-green-600 font-black block">{item.subGroup}</span>}
                              <h4 className="text-xs font-bold text-green-900 truncate">{item.name}</h4>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-center">
                            <span className="text-[9px] text-green-600/70 font-semibold">({item.minScore} - {item.maxScore} pts)</span>
                            <ScoreStepper
                              minScore={item.minScore}
                              maxScore={item.maxScore}
                              value={scores[item.id] || 0}
                              inputRef={el => { inputRefs.current[item.id] = el; }}
                              onChange={(newVal) => handleScoreChange(item.id, newVal)}
                              onKeyDown={(e) => handleKeyDown(e, item.id, index)}
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Accordion Group 2: Variasi Formasi */}
              <div className="border border-green-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('VARIASI_FORMASI')}
                  className="w-full bg-green-50/80 px-5 py-4 flex justify-between items-center text-xs font-black text-green-900 hover:bg-green-100 transition-colors cursor-pointer border-b border-green-100"
                >
                  <span className="flex items-center gap-2">
                    <span>2. VARIASI FORMASI</span>
                    <Badge variant="warning" className="text-[8px] scale-90">{totalVariasi} PTS</Badge>
                  </span>
                  <span>{expandedGroups.VARIASI_FORMASI ? '▲' : '▼'}</span>
                </button>

                {expandedGroups.VARIASI_FORMASI && (
                  <div className="p-4 space-y-3.5 divide-y divide-green-100">
                    {criteriaList
                      .filter(c => c.categoryGroup === 'VARIASI_FORMASI')
                      .map((item, index) => {
                        const globalIndex = criteriaList.findIndex(c => c.id === item.id);
                        return (
                          <div key={item.id} className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded bg-green-100 text-green-800 font-mono text-[10px] font-bold flex items-center justify-center border border-green-200">
                                {item.no}
                              </span>
                              <h4 className="text-xs font-bold text-green-900">{item.name}</h4>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <span className="text-[9px] text-green-600/70 font-semibold">({item.minScore} - {item.maxScore} pts)</span>
                              <ScoreStepper
                                minScore={item.minScore}
                                maxScore={item.maxScore}
                                value={scores[item.id] || 0}
                                inputRef={el => { inputRefs.current[item.id] = el; }}
                                onChange={(newVal) => handleScoreChange(item.id, newVal)}
                                onKeyDown={(e) => handleKeyDown(e, item.id, globalIndex)}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Accordion Group 3: Danton */}
              <div className="border border-green-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleAccordion('DANTON')}
                  className="w-full bg-green-50/80 px-5 py-4 flex justify-between items-center text-xs font-black text-green-900 hover:bg-green-100 transition-colors cursor-pointer border-b border-green-100"
                >
                  <span className="flex items-center gap-2">
                    <span>3. DANTON</span>
                    <Badge variant="warning" className="text-[8px] scale-90">{totalDanton} PTS</Badge>
                  </span>
                  <span>{expandedGroups.DANTON ? '▲' : '▼'}</span>
                </button>

                {expandedGroups.DANTON && (
                  <div className="p-4 space-y-3.5 divide-y divide-green-100">
                    {criteriaList
                      .filter(c => c.categoryGroup === 'DANTON')
                      .map((item, index) => {
                        const globalIndex = criteriaList.findIndex(c => c.id === item.id);
                        return (
                          <div key={item.id} className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded bg-green-100 text-green-800 font-mono text-[10px] font-bold flex items-center justify-center border border-green-200">
                                {item.no}
                              </span>
                              <h4 className="text-xs font-bold text-green-900">{item.name}</h4>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <span className="text-[9px] text-green-600/70 font-semibold">({item.minScore} - {item.maxScore} pts)</span>
                              <ScoreStepper
                                minScore={item.minScore}
                                maxScore={item.maxScore}
                                value={scores[item.id] || 0}
                                inputRef={el => { inputRefs.current[item.id] = el; }}
                                onChange={(newVal) => handleScoreChange(item.id, newVal)}
                                onKeyDown={(e) => handleKeyDown(e, item.id, globalIndex)}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Bottom Sticky Action Footer */}
              <div className="bg-white border border-green-200 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-green-800 uppercase tracking-wider">
                    Ringkasan Hasil Juri {selectedJuri} ({genderRegu})
                  </h3>
                  <div className="flex items-center space-x-4 text-xs font-extrabold text-green-900">
                    <span>PBB: <strong className="text-green-700">{totalPbb}</strong></span>
                    <span>VARIASI: <strong className="text-amber-700">{totalVariasi}</strong></span>
                    <span>DANTON: <strong className="text-emerald-700">{totalDanton}</strong></span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" type="button" onClick={handlePrintPembinaScoreSheet} className="text-xs font-bold">
                    🖨️ Cetak Hasil
                  </Button>
                  <Button variant="primary" type="submit" disabled={isSaving} className="px-8 text-xs font-bold" isLoading={isSaving}>
                    {isSaving ? 'Menyimpan...' : `💾 Simpan LKBB (${grandTotalLkbb} Pts)`}
                  </Button>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>

    </main>

    {/* OCR Scan Modal */}
    <Modal
      isOpen={isOcrModalOpen}
      onClose={() => setIsOcrModalOpen(false)}
      title="📷 Scan Lembar Nilai Juri dengan AI"
      size="lg"
    >
      <ScoreOcrUploader
        criteriaNames={criteriaList.map(c => c.name)}
        onConfirm={(ocrScores) => {
          const updatedScores: Record<string, number> = { ...scores };
          ocrScores.forEach(ocrItem => {
            const matched = criteriaList.find(c =>
              c.name.toLowerCase().includes(ocrItem.criteriaName.toLowerCase()) ||
              ocrItem.criteriaName.toLowerCase().includes(c.name.toLowerCase())
            );
            if (matched) {
              const clamped = Math.min(Math.max(ocrItem.value, matched.minScore), matched.maxScore);
              updatedScores[matched.id] = clamped;
            }
          });
          setScores(updatedScores);
          setFeedbackType('success');
          setFeedback(`🤖 ${ocrScores.length} nilai berhasil diisi dari hasil scan kertas juri. Periksa kembali sebelum menyimpan.`);
          setIsOcrModalOpen(false);
        }}
        onClose={() => setIsOcrModalOpen(false)}
      />
    </Modal>
    </>
  );
}
