'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown, Search, ScanLine, Printer, RotateCcw, AlertTriangle, CheckCircle2, FileCheck2 } from 'lucide-react';
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
  | 'ADMINISTRASI'
  | 'FOTO_EKSPRESI';

interface PenaltyRule {
  id: string;
  label: string;
  description: string;
  pointsPerUnit: number;
  unitLabel: string;
  maxUnits: number;
}

const LKBB_PENALTY_RULES: PenaltyRule[] = [
  {
    id: 'pen_dp',
    label: '1. Terlambat Masuk Daerah Persiapan (DP)',
    description: 'Tidak masuk DP setelah pemanggilan 3 kali berturut-turut (-100 poin)',
    pointsPerUnit: 100,
    unitLabel: 'Pelanggaran (0/1)',
    maxUnits: 1,
  },
  {
    id: 'pen_personel',
    label: '2. Pasukan Tampil Tidak Lengkap (< 16 Orang)',
    description: 'Jumlah anggota kurang dari 16 orang termasuk Danton (-150 poin / orang)',
    pointsPerUnit: 150,
    unitLabel: 'Orang Kurang',
    maxUnits: 15,
  },
  {
    id: 'pen_waktu',
    label: '3. Melebihi Batas Waktu Tampil (> 8 Menit)',
    description: 'Kelebihan durasi tampil di atas 8 menit (-5 poin / 10 detik)',
    pointsPerUnit: 5,
    unitLabel: 'Kelipatan 10 Detik',
    maxUnits: 30,
  },
  {
    id: 'pen_garis',
    label: '4. Melewati / Menginjak Garis Lapangan (20 x 12 m)',
    description: 'Anggota menginjak atau keluar garis batas kavling (-5 poin / orang)',
    pointsPerUnit: 5,
    unitLabel: 'Orang / Kejadian',
    maxUnits: 30,
  },
  {
    id: 'pen_bantuan',
    label: '5. Pembina / Pihak Lain Memberi Tahu Aba-Aba',
    description: 'Intervensi aba-aba dari luar lapangan saat tampil (-50 poin)',
    pointsPerUnit: 50,
    unitLabel: 'Pelanggaran (0/1)',
    maxUnits: 5,
  },
];

const ADMIN_RUBRIC_ITEMS = [
  { id: 'adm_formulir', label: '1. Formulir Pendaftaran', points: 15 },
  { id: 'adm_kwitansi', label: '2. Fotokopi Kwitansi Pembayaran', points: 20 },
  { id: 'adm_kta', label: '3. Fotokopi KTA Pramuka', points: 15 },
  { id: 'adm_bpjs', label: '4. Fotokopi Kartu Pelajar / BPJS', points: 15 },
  { id: 'adm_mandat', label: '5. Surat Mandat Gugus Depan', points: 10 },
  { id: 'adm_izin', label: '6. Surat Izin Orang Tua', points: 10 },
  { id: 'adm_bumbung', label: '7. Bumbung Kemanusiaan', points: 15 },
];

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
  { id: 'sd_1', categoryGroup: 'PBB_DASAR', subGroup: 'A. GERAKAN BERKUMPUL', no: 1, name: 'BERSAF KUMPUL', minScore: 15, maxScore: 25 },
  { id: 'sd_2', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 2, name: 'SIKAP SEMPURNA', minScore: 8, maxScore: 18 },
  { id: 'sd_3', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 3, name: 'ISTIRAHAT DI TEMPAT', minScore: 8, maxScore: 18 },
  { id: 'sd_4', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 4, name: 'PARADE PERIKSA KERAPIHAN', minScore: 15, maxScore: 25 },
  { id: 'sd_5', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 5, name: 'BERHITUNG', minScore: 8, maxScore: 18 },
  { id: 'sd_6', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 6, name: 'HORMAT', minScore: 8, maxScore: 18 },
  { id: 'sd_7', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 7, name: '1/2 LENGAN LENCANG KANAN', minScore: 8, maxScore: 18 },
  { id: 'sd_8', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 8, name: 'LENCANG KANAN', minScore: 8, maxScore: 18 },
  { id: 'sd_9', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 9, name: 'HADAP SERONG KANAN', minScore: 8, maxScore: 18 },
  { id: 'sd_10', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 10, name: 'HADAP SERONG KIRI', minScore: 8, maxScore: 18 },
  { id: 'sd_11', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 11, name: 'BALIK KANAN', minScore: 8, maxScore: 18 },
  { id: 'sd_12', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 12, name: 'HADAP KANAN', minScore: 8, maxScore: 18 },
  { id: 'sd_13', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 13, name: 'LENCANG DEPAN', minScore: 8, maxScore: 18 },
  { id: 'sd_14', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 14, name: 'JALAN DI TEMPAT', minScore: 8, maxScore: 18 },
  { id: 'sd_15', categoryGroup: 'PBB_DASAR', subGroup: 'C. GERAKAN PINDAH TEMPAT', no: 15, name: '4 LANGKAH KE BELAKANG', minScore: 16, maxScore: 26 },
  { id: 'sd_16', categoryGroup: 'PBB_DASAR', subGroup: 'C. GERAKAN PINDAH TEMPAT', no: 16, name: '3 LANGKAH KE DEPAN', minScore: 16, maxScore: 26 },
  { id: 'sd_17', categoryGroup: 'PBB_DASAR', subGroup: 'C. GERAKAN PINDAH TEMPAT', no: 17, name: '4 LANGKAH KE KIRI', minScore: 16, maxScore: 26 },
  { id: 'sd_18', categoryGroup: 'PBB_DASAR', subGroup: 'C. GERAKAN PINDAH TEMPAT', no: 18, name: '3 LANGKAH KE KANAN', minScore: 16, maxScore: 26 },
  { id: 'sd_19', categoryGroup: 'PBB_DASAR', subGroup: 'D. GERAKAN BERHENTI KE BERJALAN', no: 19, name: 'LANGKAH PERLAHAN', minScore: 15, maxScore: 35 },
  { id: 'sd_20', categoryGroup: 'PBB_DASAR', subGroup: 'D. GERAKAN BERHENTI KE BERJALAN', no: 20, name: 'LANGKAH BIASA', minScore: 15, maxScore: 35 },
  { id: 'sd_21', categoryGroup: 'PBB_DASAR', subGroup: 'D. GERAKAN BERHENTI KE BERJALAN', no: 21, name: 'LANGKAH LARI', minScore: 15, maxScore: 35 },
  { id: 'sd_22', categoryGroup: 'PBB_DASAR', subGroup: 'E. GERAKAN BERJALAN KE BERJALAN', no: 22, name: 'TIAP-TIAP BANJAR 2X BELOK KANAN', minScore: 10, maxScore: 40 },
  { id: 'sd_23', categoryGroup: 'PBB_DASAR', subGroup: 'E. GERAKAN BERJALAN KE BERJALAN', no: 23, name: 'LANGKAH TEGAP', minScore: 10, maxScore: 40 },
  { id: 'sd_24', categoryGroup: 'PBB_DASAR', subGroup: 'E. GERAKAN BERJALAN KE BERJALAN', no: 24, name: 'HORMAT KANAN', minScore: 10, maxScore: 40 },
  { id: 'sd_25', categoryGroup: 'PBB_DASAR', subGroup: 'E. GERAKAN BERJALAN KE BERJALAN', no: 25, name: 'TIAP-TIAP BANJAR 2X BELOK KIRI', minScore: 10, maxScore: 40 },
  { id: 'sd_26', categoryGroup: 'PBB_DASAR', subGroup: 'E. GERAKAN BERJALAN KE BERJALAN', no: 26, name: 'HADAP KANAN HENTI', minScore: 10, maxScore: 40 },
  { id: 'sd_27', categoryGroup: 'PBB_DASAR', subGroup: 'F. GERAKAN BUBAR', no: 27, name: 'BUBAR JALAN', minScore: 15, maxScore: 25 },
  { id: 'sd_v1', categoryGroup: 'VARIASI_FORMASI', subGroup: 'G. VARIASI FORMASI (20%)', no: 1, name: 'KEINDAHAN GERAKAN', minScore: 21, maxScore: 30 },
  { id: 'sd_v2', categoryGroup: 'VARIASI_FORMASI', subGroup: 'G. VARIASI FORMASI (20%)', no: 2, name: 'KEKOMPAKAN', minScore: 21, maxScore: 30 },
  { id: 'sd_v3', categoryGroup: 'VARIASI_FORMASI', subGroup: 'G. VARIASI FORMASI (20%)', no: 3, name: 'KESULITAN GERAKAN', minScore: 31, maxScore: 40 },
  { id: 'sd_v4', categoryGroup: 'VARIASI_FORMASI', subGroup: 'G. VARIASI FORMASI (20%)', no: 4, name: 'UNSUR PBB MURNI', minScore: 31, maxScore: 40 },
  { id: 'sd_v5', categoryGroup: 'VARIASI_FORMASI', subGroup: 'G. VARIASI FORMASI (20%)', no: 5, name: 'KEKREATIFAN', minScore: 21, maxScore: 30 },
  { id: 'sd_v6', categoryGroup: 'VARIASI_FORMASI', subGroup: 'G. VARIASI FORMASI (20%)', no: 6, name: 'ETIKA', minScore: 21, maxScore: 30 },
  { id: 'sd_d1', categoryGroup: 'DANTON', no: 1, name: 'SIKAP / POSTUR', minScore: 5, maxScore: 15 },
  { id: 'sd_d2', categoryGroup: 'DANTON', no: 2, name: 'CARA MEMBERIKAN INSTRUKSI (LAGAM)', minScore: 10, maxScore: 20 },
  { id: 'sd_d3', categoryGroup: 'DANTON', no: 3, name: 'KETEPATAN PEMBERIAN ABA-ABA', minScore: 15, maxScore: 25 },
  { id: 'sd_d4', categoryGroup: 'DANTON', no: 4, name: 'PENGUASAAN LAPANGAN', minScore: 15, maxScore: 25 },
  { id: 'sd_d5', categoryGroup: 'DANTON', no: 5, name: 'INTONASI / INTERVAL PEMBERIAN ABA-ABA', minScore: 5, maxScore: 15 },
];

const CRITERIA_SMP_SMA: ScoreCriterion[] = [
  { id: 'ss_1', categoryGroup: 'PBB_DASAR', subGroup: 'A. GERAKAN BERKUMPUL', no: 1, name: 'BERSAF KUMPUL', minScore: 15, maxScore: 25 },
  { id: 'ss_2', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 2, name: 'SIKAP SEMPURNA', minScore: 8, maxScore: 18 },
  { id: 'ss_3', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 3, name: 'ISTIRAHAT DI TEMPAT', minScore: 8, maxScore: 18 },
  { id: 'ss_4', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 4, name: 'BERHITUNG', minScore: 8, maxScore: 18 },
  { id: 'ss_5', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 5, name: 'HORMAT', minScore: 8, maxScore: 18 },
  { id: 'ss_6', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 6, name: '1/2 LENGAN LENCANG KANAN', minScore: 8, maxScore: 18 },
  { id: 'ss_7', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 7, name: 'LENCANG KIRI', minScore: 8, maxScore: 18 },
  { id: 'ss_8', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 8, name: 'HADAP SERONG KANAN', minScore: 8, maxScore: 18 },
  { id: 'ss_9', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 9, name: 'PARADE PERIKSA KERAPIHAN', minScore: 15, maxScore: 25 },
  { id: 'ss_10', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 10, name: 'HADAP SERONG KIRI', minScore: 8, maxScore: 18 },
  { id: 'ss_11', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 11, name: 'BALIK KANAN', minScore: 8, maxScore: 18 },
  { id: 'ss_12', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 12, name: 'HADAP KANAN', minScore: 8, maxScore: 18 },
  { id: 'ss_13', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 13, name: 'LENCANG DEPAN', minScore: 8, maxScore: 18 },
  { id: 'ss_14', categoryGroup: 'PBB_DASAR', subGroup: 'B. GERAKAN DI TEMPAT', no: 14, name: 'JALAN DI TEMPAT', minScore: 8, maxScore: 18 },
  { id: 'ss_15', categoryGroup: 'PBB_DASAR', subGroup: 'H. GERAKAN PINDAH TEMPAT', no: 15, name: '4 LANGKAH KE BELAKANG', minScore: 14, maxScore: 24 },
  { id: 'ss_16', categoryGroup: 'PBB_DASAR', subGroup: 'H. GERAKAN PINDAH TEMPAT', no: 16, name: '3 LANGKAH KE DEPAN', minScore: 14, maxScore: 24 },
  { id: 'ss_17', categoryGroup: 'PBB_DASAR', subGroup: 'I. GERAKAN BERHENTI KE BERJALAN', no: 17, name: 'LANGKAH PERLAHAN', minScore: 7, maxScore: 27 },
  { id: 'ss_18', categoryGroup: 'PBB_DASAR', subGroup: 'I. GERAKAN BERHENTI KE BERJALAN', no: 18, name: 'LANGKAH BIASA', minScore: 7, maxScore: 27 },
  { id: 'ss_19', categoryGroup: 'PBB_DASAR', subGroup: 'I. GERAKAN BERHENTI KE BERJALAN', no: 19, name: 'LANGKAH TEGAP', minScore: 7, maxScore: 27 },
  { id: 'ss_20', categoryGroup: 'PBB_DASAR', subGroup: 'J. GERAKAN BERJALAN KE BERJALAN', no: 20, name: 'LANGKAH LARI', minScore: 15, maxScore: 35 },
  { id: 'ss_21', categoryGroup: 'PBB_DASAR', subGroup: 'J. GERAKAN BERJALAN KE BERJALAN', no: 21, name: 'LANGKAH BIASA', minScore: 15, maxScore: 35 },
  { id: 'ss_22', categoryGroup: 'PBB_DASAR', subGroup: 'J. GERAKAN BERJALAN KE BERJALAN', no: 22, name: 'BELOK KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_23', categoryGroup: 'PBB_DASAR', subGroup: 'J. GERAKAN BERJALAN KE BERJALAN', no: 23, name: 'TIAP-TIAP BANJAR 2X BELOK KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_24', categoryGroup: 'PBB_DASAR', subGroup: 'J. GERAKAN BERJALAN KE BERJALAN', no: 24, name: 'BELOK KIRI', minScore: 15, maxScore: 35 },
  { id: 'ss_25', categoryGroup: 'PBB_DASAR', subGroup: 'J. GERAKAN BERJALAN KE BERJALAN', no: 25, name: 'HORMAT KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_26', categoryGroup: 'PBB_DASAR', subGroup: 'J. GERAKAN BERJALAN KE BERJALAN', no: 26, name: 'MELINTANG KIRI / KANAN', minScore: 15, maxScore: 35 },
  { id: 'ss_27', categoryGroup: 'PBB_DASAR', subGroup: 'J. GERAKAN BERJALAN KE BERJALAN', no: 27, name: 'HALUAN KANAN / KIRI', minScore: 15, maxScore: 35 },
  { id: 'ss_28', categoryGroup: 'PBB_DASAR', subGroup: 'K. GERAKAN BUBAR', no: 28, name: 'BUBAR JALAN', minScore: 15, maxScore: 25 },
  { id: 'ss_v1', categoryGroup: 'VARIASI_FORMASI', subGroup: 'L. VARIASI FORMASI (20%)', no: 1, name: 'KEINDAHAN GERAKAN', minScore: 21, maxScore: 30 },
  { id: 'ss_v2', categoryGroup: 'VARIASI_FORMASI', subGroup: 'L. VARIASI FORMASI (20%)', no: 2, name: 'KEKOMPAKAN', minScore: 21, maxScore: 30 },
  { id: 'ss_v3', categoryGroup: 'VARIASI_FORMASI', subGroup: 'L. VARIASI FORMASI (20%)', no: 3, name: 'KESULITAN GERAKAN', minScore: 31, maxScore: 40 },
  { id: 'ss_v4', categoryGroup: 'VARIASI_FORMASI', subGroup: 'L. VARIASI FORMASI (20%)', no: 4, name: 'UNSUR PBB MURNI', minScore: 31, maxScore: 40 },
  { id: 'ss_v5', categoryGroup: 'VARIASI_FORMASI', subGroup: 'L. VARIASI FORMASI (20%)', no: 5, name: 'KEKREATIFAN', minScore: 21, maxScore: 30 },
  { id: 'ss_v6', categoryGroup: 'VARIASI_FORMASI', subGroup: 'L. VARIASI FORMASI (20%)', no: 6, name: 'ETIKA', minScore: 21, maxScore: 30 },
  { id: 'ss_d1', categoryGroup: 'DANTON', no: 1, name: 'SIKAP / POSTUR', minScore: 5, maxScore: 15 },
  { id: 'ss_d2', categoryGroup: 'DANTON', no: 2, name: 'CARA MEMBERIKAN INSTRUKSI (LAGAM)', minScore: 10, maxScore: 20 },
  { id: 'ss_d3', categoryGroup: 'DANTON', no: 3, name: 'KETEPATAN PEMBERIAN ABA-ABA', minScore: 15, maxScore: 25 },
  { id: 'ss_d4', categoryGroup: 'DANTON', no: 4, name: 'PENGUASAAN LAPANGAN', minScore: 15, maxScore: 25 },
  { id: 'ss_d5', categoryGroup: 'DANTON', no: 5, name: 'INTONASI / INTERVAL PEMBERIAN ABA-ABA', minScore: 5, maxScore: 15 },
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

  // Penalty counts for LKBB (5 official rules in Juklak AGP-III)
  const [penaltyUnits, setPenaltyUnits] = useState<Record<string, number>>({});

  // Administrasi 7-component checklist (total 100 pts)
  const [adminChecks, setAdminChecks] = useState<Record<string, boolean>>({
    adm_formulir: true,
    adm_kwitansi: true,
    adm_kta: true,
    adm_bpjs: true,
    adm_mandat: true,
    adm_izin: true,
    adm_bumbung: true,
  });

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
    PENALTI: true,
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
        setPenaltyUnits(parsed.penaltyUnits || {});
        if (parsed.singleScore !== undefined) setSingleScore(parsed.singleScore);
        if (parsed.namaTim) setNamaTim(parsed.namaTim);
        if (parsed.namaSekolah) setNamaSekolah(parsed.namaSekolah);
        setFeedbackType('info');
        setFeedback(`Memuat nilai tersimpan: ${materi} - Peserta ${noPeserta}`);
      } catch {
        setScores({});
        setPenaltyUnits({});
      }
    } else {
      setScores({});
      setPenaltyUnits({});
      if (materi === 'ADMINISTRASI') {
        setSingleScore(100);
        setAdminChecks({
          adm_formulir: true,
          adm_kwitansi: true,
          adm_kta: true,
          adm_bpjs: true,
          adm_mandat: true,
          adm_izin: true,
          adm_bumbung: true,
        });
      }
      setFeedback(null);
    }
  }, [storageKey, materi, jenjang, genderRegu, noPeserta, selectedJuri]);

  const calculateGroupTotal = useCallback((scoresObj: Record<string, number>, group: 'PBB_DASAR' | 'VARIASI_FORMASI' | 'DANTON') => {
    return criteriaList
      .filter(c => c.categoryGroup === group)
      .reduce((sum, c) => sum + (scoresObj[c.id] || 0), 0);
  }, [criteriaList]);

  const calculatePenaltyTotal = useCallback((penObj: Record<string, number>) => {
    return LKBB_PENALTY_RULES.reduce((sum, rule) => sum + ((penObj[rule.id] || 0) * rule.pointsPerUnit), 0);
  }, []);

  // Auto Save into localStorage as users type/modify
  const handleScoreChange = useCallback((criterionId: string, value: number) => {
    setScores(prev => {
      const newScores = { ...prev, [criterionId]: value };
      const pbb = calculateGroupTotal(newScores, 'PBB_DASAR');
      const vaf = calculateGroupTotal(newScores, 'VARIASI_FORMASI');
      const dan = calculateGroupTotal(newScores, 'DANTON');
      const pen = calculatePenaltyTotal(penaltyUnits);
      
      const sheetData = {
        materi,
        jenjang,
        genderRegu,
        noPeserta: noPeserta.trim().toUpperCase(),
        namaTim,
        namaSekolah,
        juri: selectedJuri,
        scores: newScores,
        penaltyUnits,
        singleScore: materi !== 'LKBB' ? singleScore : undefined,
        totalPbb: pbb,
        totalVariasi: vaf,
        totalDanton: dan,
        totalPenalty: pen,
        grandTotal: (materi === 'LKBB' ? Math.max(0, pbb + vaf + dan - pen) : singleScore),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(sheetData));
      return newScores;
    });
  }, [storageKey, materi, jenjang, genderRegu, noPeserta, namaTim, namaSekolah, selectedJuri, singleScore, penaltyUnits, calculateGroupTotal, calculatePenaltyTotal]);

  const handlePenaltyChange = useCallback((ruleId: string, unitCount: number) => {
    setPenaltyUnits(prev => {
      const next = { ...prev, [ruleId]: Math.max(0, unitCount) };
      const pbb = calculateGroupTotal(scores, 'PBB_DASAR');
      const vaf = calculateGroupTotal(scores, 'VARIASI_FORMASI');
      const dan = calculateGroupTotal(scores, 'DANTON');
      const pen = calculatePenaltyTotal(next);
      const sheetData = {
        materi,
        jenjang,
        genderRegu,
        noPeserta: noPeserta.trim().toUpperCase(),
        namaTim,
        namaSekolah,
        juri: selectedJuri,
        scores,
        penaltyUnits: next,
        totalPbb: pbb,
        totalVariasi: vaf,
        totalDanton: dan,
        totalPenalty: pen,
        grandTotal: Math.max(0, pbb + vaf + dan - pen),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(sheetData));
      return next;
    });
  }, [storageKey, materi, jenjang, genderRegu, noPeserta, namaTim, namaSekolah, selectedJuri, scores, calculateGroupTotal, calculatePenaltyTotal]);

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

  const handleAdminCheckToggle = useCallback((itemId: string) => {
    setAdminChecks(prev => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      const sum = ADMIN_RUBRIC_ITEMS.reduce((acc, item) => acc + (next[item.id] ? item.points : 0), 0);
      handleSingleScoreChange(sum);
      return next;
    });
  }, [handleSingleScoreChange]);

  const handleAutoFillDefault = () => {
    const defaultMap: Record<string, number> = {};
    criteriaList.forEach(c => {
      defaultMap[c.id] = Math.floor((c.minScore + c.maxScore) / 2);
    });
    setScores(defaultMap);
    setPenaltyUnits({});
    setSingleScore(85);
    setFeedbackType('success');
    setFeedback('Berhasil mengisi skor rata-rata default.');
  };

  const totalPbb = useMemo(() => calculateGroupTotal(scores, 'PBB_DASAR'), [scores, calculateGroupTotal]);
  const totalVariasi = useMemo(() => calculateGroupTotal(scores, 'VARIASI_FORMASI'), [scores, calculateGroupTotal]);
  const totalDanton = useMemo(() => calculateGroupTotal(scores, 'DANTON'), [scores, calculateGroupTotal]);
  const totalPenalty = useMemo(() => calculatePenaltyTotal(penaltyUnits), [penaltyUnits, calculatePenaltyTotal]);
  const rawTotalLkbb = useMemo(() => totalPbb + totalVariasi + totalDanton, [totalPbb, totalVariasi, totalDanton]);
  const grandTotalLkbb = useMemo(() => Math.max(0, rawTotalLkbb - totalPenalty), [rawTotalLkbb, totalPenalty]);
  const weightedLkbbScore = useMemo(() => {
    const weighted = (totalPbb * 0.7) + (totalVariasi * 0.2) + (totalDanton * 0.1) - totalPenalty;
    return Math.max(0, Number(weighted.toFixed(1)));
  }, [totalPbb, totalVariasi, totalDanton, totalPenalty]);
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
        setFeedback(`Nilai item '${outOfBounds.name}' berada di luar batas (${outOfBounds.minScore} - ${outOfBounds.maxScore} PTS).`);
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
      setFeedback(`LEMBAR PENILAIAN BERHASIL DISIMPAN! TOTAL: ${currentFinalTotal} PTS.`);
    } catch (err: any) {
      console.error(err);
      setFeedbackType('error');
      setFeedback(`GAGAL MENYIMPAN NILAI: ${err.message || 'Kesalahan koneksi API Backend.'}`);
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
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Top Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#082620] p-2 rounded-[14px] key-card">
          {[
            { key: 'LKBB', label: 'LKBB (PBB / VAFOR / DANTON)' },
            { key: 'BANK_SOAL', label: 'BANK SOAL' },
            { key: 'SEMAPHORE', label: 'SEMAPHORE' },
            { key: 'MORSE', label: 'MORSE' },
            { key: 'MINI_PIONERING', label: 'MINI PIONERING' },
            { key: 'KEBERSIHAN', label: 'KEBERSIHAN' },
            { key: 'FASHION_SHOW', label: 'FASHION SHOW' },
            { key: 'ADMINISTRASI', label: 'ADMINISTRASI' },
            { key: 'FOTO_EKSPRESI', label: 'FOTO KREASI' },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMateri(m.key as MateriLombaType)}
              className={`px-3.5 py-2 rounded-[8px] text-xs font-mono font-medium transition-all duration-150 cursor-pointer min-h-[38px] ${
                materi === m.key
                  ? 'bg-[#E3EF26] text-[#0C342C] font-semibold shadow-key-btn'
                  : 'text-[#B8D8D0] hover:text-[#ffffff] hover:bg-[#061C18]'
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
            <Card className="p-5 space-y-4" hoverGlow={false}>
              <h3 className="text-xs font-mono font-semibold uppercase text-[#ffffff] tracking-wider">
                Daftar Kontingen Peserta
              </h3>
              <Input
                placeholder="Cari No / Regu / Sekolah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-2 text-xs"
                icon={<Search className="w-3.5 h-3.5 text-[#7AA89C]" />}
              />

              <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                {filteredParticipants.length === 0 ? (
                  <p className="text-xs text-[#7AA89C] text-center py-4 font-mono">TIDAK ADA PESERTA</p>
                ) : (
                  filteredParticipants.map((p) => {
                    const isActive = noPeserta === p.participant_no;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectParticipant(p)}
                        className={`w-full text-left p-3.5 rounded-[10px] border text-xs transition-all flex flex-col gap-1 cursor-pointer ${
                          isActive
                            ? 'border-[#E3EF26]/60 bg-[#076653]/40 text-[#ffffff]'
                            : 'border-[#076653] bg-[#061C18] hover:bg-[#076653] text-[#B8D8D0] hover:text-[#ffffff]'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className={`font-mono font-bold ${isActive ? 'text-[#E3EF26]' : 'text-[#ffffff]'}`}>
                            {p.participant_no}
                          </span>
                          <Badge variant={isActive ? 'danger' : 'secondary'}>{p.category?.level || jenjang}</Badge>
                        </div>
                        <span className="font-medium truncate text-[#ffffff]">{p.team_name}</span>
                        <span className="text-xs text-[#7AA89C] truncate">{p.school_name}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </Card>

            <Card className="p-4 space-y-2 text-xs" hoverGlow={false}>
              <div className="font-mono font-semibold text-[#ffffff] uppercase tracking-wider text-xs">
                Navigasi Keyboard Cepat
              </div>
              <p className="text-[#B8D8D0] leading-relaxed text-xs">
                Gunakan tombol{' '}
                <kbd className="bg-[#061C18] px-1.5 py-0.5 rounded text-[#ffffff] border border-[#076653] font-mono inline-flex items-center">
                  <ArrowUp className="w-3 h-3" />
                </kbd>{' '}
                /{' '}
                <kbd className="bg-[#061C18] px-1.5 py-0.5 rounded text-[#ffffff] border border-[#076653] font-mono inline-flex items-center">
                  <ArrowDown className="w-3 h-3" />
                </kbd>{' '}
                atau{' '}
                <kbd className="bg-[#061C18] px-1.5 py-0.5 rounded text-[#ffffff] border border-[#076653] font-mono">
                  Enter
                </kbd>{' '}
                untuk berpindah baris kriteria skor secara instan.
              </p>
            </Card>
          </div>

          {/* Right Side: Score Input Form */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="p-6 space-y-6" hoverGlow={false}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#076653]">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Badge variant="danger">MATERI: {materi}</Badge>
                    <Badge variant="primary">JENJANG {jenjang}</Badge>
                  </div>
                  <h2 className="text-lg sm:text-xl font-medium text-[#ffffff] uppercase">
                    Lembar Penilaian {materi} ({jenjang})
                  </h2>
                </div>

                {/* Form Controls */}
                <div className="flex flex-wrap gap-2 items-center">
                  <div className="flex bg-[#061C18] p-1 rounded-[8px] border border-[#076653]">
                    {(['PUTERA', 'PUTERI'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGenderRegu(g)}
                        className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[6px] transition-all cursor-pointer ${
                          genderRegu === g
                            ? 'bg-[#E3EF26] text-[#0C342C] font-semibold'
                            : 'text-[#B8D8D0] hover:text-[#ffffff]'
                        }`}
                      >
                        {g === 'PUTERA' ? 'PUTERA' : 'PUTERI'}
                      </button>
                    ))}
                  </div>

                  <div className="flex bg-[#061C18] p-1 rounded-[8px] border border-[#076653]">
                    {(['SD', 'SMP', 'SMA'] as const).map((j) => (
                      <button
                        key={j}
                        type="button"
                        onClick={() => setJenjang(j)}
                        className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[6px] transition-all cursor-pointer ${
                          jenjang === j
                            ? 'bg-[#E3EF26] text-[#0C342C] font-semibold'
                            : 'text-[#B8D8D0] hover:text-[#ffffff]'
                        }`}
                      >
                        {j}
                      </button>
                    ))}
                  </div>

                  {materi === 'LKBB' && (
                    <div className="flex bg-[#061C18] p-1 rounded-[8px] border border-[#076653]">
                      {[1, 2, 3].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setSelectedJuri(num as any)}
                          className={`px-3 py-1.5 text-xs font-mono font-medium rounded-[6px] transition-all cursor-pointer ${
                            selectedJuri === num
                              ? 'bg-[#E3EF26] text-[#0C342C] font-bold'
                              : 'text-[#B8D8D0] hover:text-[#ffffff]'
                          }`}
                        >
                          JURI {num}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Quick Fill & OCR Scan Buttons */}
                  {materi === 'LKBB' && (
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={handleAutoFillDefault}
                      className="font-mono text-xs gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#E3EF26]" />
                      Isi Rata-Rata
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => setIsOcrModalOpen(true)}
                    className="font-mono text-xs border-[#E3EF26]/40 text-[#ffffff] gap-1.5"
                  >
                    <ScanLine className="w-3.5 h-3.5 text-[#E3EF26]" />
                    Scan Lembar Juri (OCR)
                  </Button>
                </div>
              </div>

              {/* Inputs identity */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  id="score-noPeserta"
                  label="Nomor Peserta / Dada *"
                  value={noPeserta}
                  onChange={(e) => setNoPeserta(e.target.value)}
                  className="font-mono font-bold"
                />
                <Input
                  id="score-teamName"
                  label="Nama Regu *"
                  value={namaTim}
                  onChange={(e) => setNamaTim(e.target.value)}
                />
                <Input
                  id="score-schoolName"
                  label="Pangkalan / Sekolah *"
                  value={namaSekolah}
                  onChange={(e) => setNamaSekolah(e.target.value)}
                />
              </div>

              {/* Progress Bar */}
              {materi === 'LKBB' && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-mono text-[#B8D8D0] uppercase">
                    <span>Progres Pengisian Kriteria</span>
                    <span className="text-[#ffffff]">
                      {filledCriteriaCount} / {totalCriteriaCount} ITEM ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#061C18] overflow-hidden border border-[#076653]">
                    <div
                      className="h-full rounded-full bg-[#E3EF26] transition-all duration-300"
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
              <form onSubmit={handleSaveScoreSheet}>
                <Card className="p-8 sm:p-10 space-y-6 text-center" hoverGlow={false}>
                  <div className="space-y-1.5">
                    <Badge variant="info">
                      {materi === 'ADMINISTRASI' ? 'PERIODE I • AMPLOP AIRMAIL NO. 310' : 'SINGLE SCORE ENTRY • JUKLAK AGP-III'}
                    </Badge>
                    <h3 className="text-base font-medium text-[#ffffff] uppercase tracking-wider mt-2">
                      Nilai Materi {materi.replace('_', ' ')}
                    </h3>
                    <p className="text-xs text-[#B8D8D0]">
                      {materi === 'ADMINISTRASI'
                        ? 'Centang kelengkapan 7 berkas pendaftaran di Amplop Kabinet Airmail No. 310 (Total Maksimal 100 Poin).'
                        : materi === 'MINI_PIONERING'
                        ? '1 Orang/Regu • Durasi Maks 10 Menit (8 Sumpit + Benang Kasur + Bendera). Kriteria: Kekuatan, Kerapihan, Ketepatan Simpul.'
                        : materi === 'MORSE'
                        ? `1 Orang/Regu • Audio 10 Kata Acak (${jenjang === 'SD' ? '8 WPM' : jenjang === 'SMP' ? '12 WPM' : '15 WPM'}), Salin ke Lembar Jawaban (3 Menit).`
                        : materi === 'SEMAPHORE'
                        ? '1 Orang/Regu • Visual Proyektor 10 Kata Acak, Salin ke Lembar Jawaban (2 Menit).'
                        : materi === 'BANK_SOAL'
                        ? '5 Orang/Regu • 100 Soal Pilihan Ganda (Google Form), Durasi 15 Menit (3 Menit/Orang).'
                        : 'Masukkan akumulasi nilai akhir sesuai Juklak AGP-III SMKN 1 Soreang.'}
                    </p>
                  </div>

                  {materi === 'ADMINISTRASI' && (
                    <div className="max-w-xl mx-auto text-left bg-[#061C18] border border-[#076653] rounded-[12px] p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-mono text-[#E3EF26] uppercase pb-2 border-b border-[#076653]">
                        <span className="flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          Rubrik Kelengkapan Administrasi Regu
                        </span>
                        <span>Maks: 100 PTS</span>
                      </div>
                      {ADMIN_RUBRIC_ITEMS.map((item) => {
                        const checked = !!adminChecks[item.id];
                        return (
                          <label
                            key={item.id}
                            className={`flex items-center justify-between p-2.5 rounded-[8px] border text-xs cursor-pointer transition-all ${
                              checked
                                ? 'bg-[#076653]/30 border-[#E3EF26]/50 text-[#ffffff]'
                                : 'bg-[#082620]/50 border-[#076653] text-[#7AA89C]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleAdminCheckToggle(item.id)}
                                className="accent-[#E3EF26] w-4 h-4 rounded cursor-pointer"
                              />
                              <span>{item.label}</span>
                            </div>
                            <span className="font-mono font-bold text-[#E3EF26]">+{item.points} PTS</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {materi === 'MINI_PIONERING' && (
                    <div className="max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left">
                      <div className="p-3 rounded-[10px] bg-emerald-950/50 border border-emerald-500/40 text-xs">
                        <div className="font-mono font-bold text-emerald-300">STIKER HIJAU</div>
                        <div className="text-xs text-[#B8D8D0] mt-0.5">Selesai menit ke 3 – 4</div>
                      </div>
                      <div className="p-3 rounded-[10px] bg-amber-950/50 border border-amber-400/40 text-xs">
                        <div className="font-mono font-bold text-amber-300">STIKER KUNING</div>
                        <div className="text-xs text-[#B8D8D0] mt-0.5">Selesai menit ke 5 – 6</div>
                      </div>
                      <div className="p-3 rounded-[10px] bg-rose-950/50 border border-rose-500/40 text-xs">
                        <div className="font-mono font-bold text-rose-300">STIKER MERAH</div>
                        <div className="text-xs text-[#B8D8D0] mt-0.5">Selesai menit ke 7 – 8</div>
                      </div>
                    </div>
                  )}

                  <div className="max-w-[220px] mx-auto">
                    <input
                      type="number"
                      required
                      min={0}
                      max={500}
                      value={singleScore}
                      onChange={(e) => handleSingleScoreChange(Number(e.target.value))}
                      className="w-full text-center py-5 rounded-[12px] bg-[#061C18] border border-[#076653] focus:border-[#E3EF26] text-[#ffffff] font-mono font-bold text-4xl outline-none transition-all"
                    />
                  </div>
                  <Button variant="primary" type="submit" className="w-full max-w-[240px]" isLoading={isSaving}>
                    Simpan Nilai {materi.replace('_', ' ')} ({singleScore} PTS)
                  </Button>
                </Card>
              </form>
            ) : (
              <form onSubmit={handleSaveScoreSheet} className="space-y-6">
                {/* Accordion Group 1: PBB Dasar */}
                <div className="rounded-[16px] overflow-hidden bg-[#082620] key-card">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('PBB_DASAR')}
                    className="w-full bg-[#061C18] px-5 py-4 flex justify-between items-center text-xs font-mono font-semibold text-[#ffffff] hover:bg-[#076653] transition-colors cursor-pointer border-b border-[#076653]"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>01 / GERAKAN PBB DASAR</span>
                      <Badge variant="success">{totalPbb} PTS</Badge>
                    </span>
                    <span className="text-[#B8D8D0]">
                      {expandedGroups.PBB_DASAR ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {expandedGroups.PBB_DASAR && (
                    <div className="p-5 space-y-3.5 divide-y divide-[#076653] max-h-[520px] overflow-y-auto">
                      {criteriaList
                        .filter((c) => c.categoryGroup === 'PBB_DASAR')
                        .map((item, index) => (
                          <div
                            key={item.id}
                            className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3 min-w-0 pr-2">
                              <span className="w-7 h-7 rounded-[6px] bg-[#061C18] text-[#B8D8D0] font-mono text-xs font-semibold flex items-center justify-center border border-[#076653] shrink-0">
                                {item.no}
                              </span>
                              <div className="min-w-0">
                                {item.subGroup && (
                                  <span className="text-xs font-mono text-[#7AA89C] uppercase block">
                                    {item.subGroup}
                                  </span>
                                )}
                                <h4 className="text-xs sm:text-sm font-medium text-[#ffffff] truncate">
                                  {item.name}
                                </h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              <span className="text-xs font-mono text-[#7AA89C]">
                                [{item.minScore}–{item.maxScore}]
                              </span>
                              <ScoreStepper
                                minScore={item.minScore}
                                maxScore={item.maxScore}
                                value={scores[item.id] || 0}
                                inputRef={(el) => {
                                  inputRefs.current[item.id] = el;
                                }}
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
                <div className="rounded-[16px] overflow-hidden bg-[#082620] key-card">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('VARIASI_FORMASI')}
                    className="w-full bg-[#061C18] px-5 py-4 flex justify-between items-center text-xs font-mono font-semibold text-[#ffffff] hover:bg-[#076653] transition-colors cursor-pointer border-b border-[#076653]"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>02 / VARIASI &amp; FORMASI</span>
                      <Badge variant="info">{totalVariasi} PTS</Badge>
                    </span>
                    <span className="text-[#B8D8D0]">
                      {expandedGroups.VARIASI_FORMASI ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {expandedGroups.VARIASI_FORMASI && (
                    <div className="p-5 space-y-3.5 divide-y divide-[#076653]">
                      {criteriaList
                        .filter((c) => c.categoryGroup === 'VARIASI_FORMASI')
                        .map((item) => {
                          const globalIndex = criteriaList.findIndex((c) => c.id === item.id);
                          return (
                            <div
                              key={item.id}
                              className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-[6px] bg-[#061C18] text-[#B8D8D0] font-mono text-xs font-semibold flex items-center justify-center border border-[#076653] shrink-0">
                                  {item.no}
                                </span>
                                <h4 className="text-xs sm:text-sm font-medium text-[#ffffff]">{item.name}</h4>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center">
                                <span className="text-xs font-mono text-[#7AA89C]">
                                  [{item.minScore}–{item.maxScore}]
                                </span>
                                <ScoreStepper
                                  minScore={item.minScore}
                                  maxScore={item.maxScore}
                                  value={scores[item.id] || 0}
                                  inputRef={(el) => {
                                    inputRefs.current[item.id] = el;
                                  }}
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
                <div className="rounded-[16px] overflow-hidden bg-[#082620] key-card">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('DANTON')}
                    className="w-full bg-[#061C18] px-5 py-4 flex justify-between items-center text-xs font-mono font-semibold text-[#ffffff] hover:bg-[#076653] transition-colors cursor-pointer border-b border-[#076653]"
                  >
                    <span className="flex items-center gap-2.5">
                      <span>03 / KOMANDAN PELETON (DANTON)</span>
                      <Badge variant="danger">{totalDanton} PTS</Badge>
                    </span>
                    <span className="text-[#B8D8D0]">
                      {expandedGroups.DANTON ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {expandedGroups.DANTON && (
                    <div className="p-5 space-y-3.5 divide-y divide-[#076653]">
                      {criteriaList
                        .filter((c) => c.categoryGroup === 'DANTON')
                        .map((item) => {
                          const globalIndex = criteriaList.findIndex((c) => c.id === item.id);
                          return (
                            <div
                              key={item.id}
                              className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-[6px] bg-[#061C18] text-[#B8D8D0] font-mono text-xs font-semibold flex items-center justify-center border border-[#076653] shrink-0">
                                  {item.no}
                                </span>
                                <h4 className="text-xs sm:text-sm font-medium text-[#ffffff]">{item.name}</h4>
                              </div>

                              <div className="flex items-center gap-3 self-end sm:self-center">
                                <span className="text-xs font-mono text-[#7AA89C]">
                                  [{item.minScore}–{item.maxScore}]
                                </span>
                                <ScoreStepper
                                  minScore={item.minScore}
                                  maxScore={item.maxScore}
                                  value={scores[item.id] || 0}
                                  inputRef={(el) => {
                                    inputRefs.current[item.id] = el;
                                  }}
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

                {/* Accordion Group 4: Pengurangan Nilai / Penalti LKBB */}
                <div className="rounded-[16px] overflow-hidden bg-[#082620] key-card border border-rose-500/30">
                  <button
                    type="button"
                    onClick={() => toggleAccordion('PENALTI')}
                    className="w-full bg-[#061C18] px-5 py-4 flex justify-between items-center text-xs font-mono font-semibold text-[#ffffff] hover:bg-[#076653] transition-colors cursor-pointer border-b border-[#076653]"
                  >
                    <span className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>04 / PENGURANGAN NILAI (PENALTI JUKLAK AGP-III)</span>
                      <Badge variant="danger">-{totalPenalty} PTS</Badge>
                    </span>
                    <span className="text-[#B8D8D0]">
                      {expandedGroups.PENALTI ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {expandedGroups.PENALTI && (
                    <div className="p-5 space-y-3.5 divide-y divide-[#076653]">
                      {LKBB_PENALTY_RULES.map((rule) => {
                        const count = penaltyUnits[rule.id] || 0;
                        const deduction = count * rule.pointsPerUnit;
                        return (
                          <div
                            key={rule.id}
                            className="pt-3.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5 pr-2">
                              <h4 className="text-xs sm:text-sm font-medium text-[#ffffff]">{rule.label}</h4>
                              <p className="text-xs text-[#7AA89C]">{rule.description}</p>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                              <span className="text-xs font-mono text-rose-400 font-semibold">
                                {deduction > 0 ? `-${deduction} PTS` : '0 PTS'}
                              </span>
                              <ScoreStepper
                                minScore={0}
                                maxScore={rule.maxUnits}
                                value={count}
                                onChange={(newVal) => handlePenaltyChange(rule.id, newVal)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer */}
                <div className="bg-[#082620] rounded-[16px] p-6 key-card flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-mono text-[#B8D8D0] uppercase tracking-wider">
                      Ringkasan Akumulasi Juri {selectedJuri} ({genderRegu}) • Bobot 70% PBB / 20% Vafor / 10% Danton
                    </h3>
                    <div className="flex flex-wrap items-center gap-3.5 text-xs font-mono text-[#ffffff]">
                      <span>
                        PBB (70%): <strong className="text-[#E3EF26]">{totalPbb}</strong>
                      </span>
                      <span>|</span>
                      <span>
                        VAFOR (20%): <strong className="text-[#56c2ff]">{totalVariasi}</strong>
                      </span>
                      <span>|</span>
                      <span>
                        DANTON (10%): <strong className="text-[#E3EF26]">{totalDanton}</strong>
                      </span>
                      <span>|</span>
                      <span>
                        PENALTI: <strong className="text-rose-400">-{totalPenalty}</strong>
                      </span>
                      <span>|</span>
                      <span>
                        TOTAL MURNI: <strong className="text-[#ffffff] text-sm">{grandTotalLkbb} PTS</strong>
                      </span>
                      <span>|</span>
                      <span>
                        BOBOT AKHIR: <strong className="text-[#E3EF26] text-sm">{weightedLkbbScore} PTS</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" type="button" onClick={handlePrintPembinaScoreSheet} className="gap-1.5">
                      <Printer className="w-3.5 h-3.5" />
                      Cetak Lembar Pembina (PDF)
                    </Button>
                    <Button variant="primary" type="submit" disabled={isSaving} className="px-6" isLoading={isSaving}>
                      {isSaving ? 'Menyimpan...' : `Simpan Nilai LKBB (${grandTotalLkbb} PTS)`}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* OCR Scan Modal */}
      <Modal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        title="Scan Lembar Nilai Juri dengan AI OCR"
        size="lg"
      >
        <ScoreOcrUploader
          criteriaNames={criteriaList.map((c) => c.name)}
          onConfirm={(ocrScores) => {
            const updatedScores: Record<string, number> = { ...scores };
            ocrScores.forEach((ocrItem) => {
              const matched = criteriaList.find(
                (c) =>
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
            setFeedback(
              `${ocrScores.length} nilai berhasil diisi dari hasil scan lembar juri. Silakan periksa sebelum menyimpan.`
            );
            setIsOcrModalOpen(false);
          }}
          onClose={() => setIsOcrModalOpen(false)}
        />
      </Modal>
    </>
  );
}
