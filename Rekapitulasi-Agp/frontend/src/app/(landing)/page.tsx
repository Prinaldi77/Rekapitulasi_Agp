'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  ShieldCheck,
  Sparkles,
  Trophy,
  Download,
  Radio,
  MapPin,
  ChevronDown,
  Layers,
  Clock,
  CheckCircle2,
  Eye,
  FileText,
  AlertTriangle,
  ListChecks,
  Phone,
} from 'lucide-react';

const EASE_AWWWARDS: [number, number, number, number] = [0.16, 1, 0.3, 1];

const JUKLAK_PDF_URL = '/Juklak_AGP_IV_SMKN1_Soreang.pdf';
const JUKLAK_DOWNLOAD_NAME = 'Juklak_Resmi_AGP_IV_SMKN1_Soreang.pdf';

type ShowcaseCategory = 'ALL' | 'PERIODE_1' | 'PERIODE_2' | 'PERIODE_3' | 'PERIODE_4';

interface FloatingHeroCardData {
  id: string;
  code: string;
  category: string;
  year: string;
  title: string;
  subtitle: string;
  metric: string;
  imageUrl: string;
  staggerClass: string;
  parallaxFactorX: number;
  parallaxFactorY: number;
  accentLime?: boolean;
}

interface ShowcaseCardItem {
  id: string;
  code: string;
  category: Exclude<ShowcaseCategory, 'ALL'>;
  categoryLabel: string;
  year: string;
  title: string;
  subtitle: string;
  weightLabel: string;
  arenaLabel: string;
  description: string;
  tags: string[];
  colSpan: string;
  imageUrl: string;
  highlightLime?: boolean;
  badge: string;
}

const HERO_FLOATING_CARDS: FloatingHeroCardData[] = [
  {
    id: 'hero-card-01',
    code: 'P-III',
    category: 'LKBB PERBASIS',
    year: 'AGP-IV',
    title: 'PBB Dasar, Variasi & Danton',
    subtitle: '16 Orang/Basis • Kavling 20x12m',
    metric: '70% PBB • 20% Vafor • 10% Danton',
    imageUrl: '/images/landing/card-lkbb.jpg',
    staggerClass: 'lg:-translate-y-3',
    parallaxFactorX: -14,
    parallaxFactorY: -10,
  },
  {
    id: 'hero-card-02',
    code: 'P-II',
    category: 'KONSTRUKSI',
    year: 'AGP-IV',
    title: 'Mini Pionering Bendera',
    subtitle: '8 Sumpit • Durasi 10 Menit',
    metric: 'Stiker Hijau / Kuning / Merah',
    imageUrl: '/images/landing/card-pionering.jpg',
    staggerClass: 'lg:translate-y-4',
    parallaxFactorX: -7,
    parallaxFactorY: 12,
  },
  {
    id: 'hero-card-03',
    code: '106 PIALA',
    category: 'PIALA UTAMA',
    year: 'AGP-IV',
    title: 'Piala Bergilir & Tetap AGP-IV',
    subtitle: 'Golongan A (SD), B (SMP), C (SMA)',
    metric: 'Juara Umum & 106 Kategori',
    imageUrl: '/images/landing/card-trophy.jpg',
    staggerClass: 'lg:-translate-y-4',
    parallaxFactorX: 0,
    parallaxFactorY: -14,
    accentLime: true,
  },
  {
    id: 'hero-card-04',
    code: 'P-II',
    category: 'ISYARAT TAKTIS',
    year: 'AGP-IV',
    title: 'Semaphore & Morse',
    subtitle: '10 Kata Acak • Ruang Kelas',
    metric: 'SD 8 • SMP 12 • SMA 15 WPM',
    imageUrl: '/images/landing/card-sandi.jpg',
    staggerClass: 'lg:translate-y-3',
    parallaxFactorX: 8,
    parallaxFactorY: 11,
  },
  {
    id: 'hero-card-05',
    code: 'P-II',
    category: 'WAWASAN',
    year: 'AGP-IV',
    title: 'Bank Soal 100 PG',
    subtitle: 'PK, PU, PA, BIK & Sandi-Sandi',
    metric: '5 Orang/Regu • 15 Menit',
    imageUrl: '/images/landing/card-knowledge.jpg',
    staggerClass: 'lg:-translate-y-2',
    parallaxFactorX: 14,
    parallaxFactorY: -9,
  },
];

const SHOWCASE_ITEMS: ShowcaseCardItem[] = [
  {
    id: 'sc-01',
    code: 'P-IV / 01',
    category: 'PERIODE_4',
    categoryLabel: 'PERIODE IV • UTAMA',
    year: 'AGP-IV',
    title: 'LKBB (PBB Dasar, Variasi Formasi & Danton)',
    subtitle: 'Acuan PERPANG TNI Nomor 58 Tahun 2018 • Juri TNI, Polisi & Satlak PBB',
    weightLabel: '70% PBB • 20% Variasi • 10% Danton',
    arenaLabel: 'Lapangan Utama 20 x 12 m',
    description:
      'Dilaksanakan per basis (16 orang termasuk Danton; Putra/Putri/Campuran) dengan waktu tampil 8 menit. PBB Dasar dilaksanakan tanpa membawa tongkat dan seluruh aba-aba wajib dihafal secara berurutan.',
    tags: ['16 Orang/Basis', 'Durasi 8 Menit', 'PERPANG TNI No. 58/2018'],
    colSpan: 'md:col-span-7',
    imageUrl: '/images/landing/card-lkbb.jpg',
    highlightLime: true,
    badge: 'PERIODE IV',
  },
  {
    id: 'sc-02',
    code: 'P-IV / 02',
    category: 'PERIODE_2',
    categoryLabel: 'PERIODE II • KONSTRUKSI',
    year: 'AGP-IV',
    title: 'Mini Pionering "Bendera"',
    subtitle: 'Kerapihan, Ketepatan Simpul & Ikatan, Kekuatan + Stiker Kecepatan',
    weightLabel: '1 Orang/Regu • 10 Menit',
    arenaLabel: 'Arena Lapangan Terbuka',
    description:
      'Peserta membawa 8 batang sumpit, benang kasur, dan bendera kecil berisi identitas regu/sangga & basis. Selesai menit 3–4 mendapat Stiker Hijau, menit 5–6 Stiker Kuning, dan menit 7–8 Stiker Merah.',
    tags: ['8 Batang Sumpit', 'Stiker Hijau 3-4 Menit', 'Simpul & Kekuatan'],
    colSpan: 'md:col-span-5',
    imageUrl: '/images/landing/card-pionering.jpg',
    badge: 'PERIODE II',
  },
  {
    id: 'sc-03',
    code: 'P-II / 03',
    category: 'PERIODE_2',
    categoryLabel: 'PERIODE IV • ISYARAT',
    year: 'AGP-IV',
    title: 'Semaphore & Morse (Putra / Putri)',
    subtitle: '1 Kalimat Acak (10 Kata) • Penilaian Per Kata • Huruf Kapital',
    weightLabel: '1 Orang/Regu per Lomba',
    arenaLabel: 'Ruang Kelas SMKN 1 Soreang',
    description:
      'Semaphore disajikan lewat video proyektor (waktu salin 2 menit). Morse disajikan lewat audio (SD/MI 8 WPM, SMP/MTs 12 WPM, SMA/SMK 15 WPM; waktu salin 3 menit) dengan 1x pengulangan soal.',
    tags: ['Semaphore Proyektor 2m', 'Morse 8/12/15 WPM', '10 Kata Acak'],
    colSpan: 'md:col-span-5',
    imageUrl: '/images/landing/card-sandi.jpg',
    badge: 'PERIODE II',
  },
  {
    id: 'sc-04',
    code: 'P-II / 04',
    category: 'PERIODE_2',
    categoryLabel: 'PERIODE II • AKADEMIK',
    year: 'AGP-IV',
    title: 'Bank Soal (PK, PU, PA, BIK, Sandi-Sandi)',
    subtitle: '100 Soal Pilihan Ganda via Google Form • Estafet 5 Orang/Regu',
    weightLabel: '5 Orang/Regu • 15 Menit',
    arenaLabel: 'Lapangan Upacara',
    description:
      'Dilaksanakan langsung setelah upacara pembukaan selesai menggunakan 1 Handphone per regu. Setiap orang dari 5 perwakilan mendapat giliran waktu 3 menit (total 15 menit).',
    tags: ['100 Soal PG', '3 Menit x 5 Orang', 'Google Form'],
    colSpan: 'md:col-span-7',
    imageUrl: '/images/landing/card-knowledge.jpg',
    badge: 'PERIODE II',
  },
  {
    id: 'sc-05',
    code: 'P-III / 05',
    category: 'PERIODE_3',
    categoryLabel: 'PERIODE III • KREATIVITAS',
    year: 'AGP-IV',
    title: 'Fashion Show Kreasi Barang Bekas',
    subtitle: 'Kreativitas Kostum Daur Ulang, Aksi Panggung & Blocking Pose Gerakan',
    weightLabel: '2 Orang/Basis (PA/PI/Campuran)',
    arenaLabel: 'Panggung Utama AGP-III',
    description:
      'Menggunakan kostum unik berbahan barang bekas (sisa kain, karung, koran, plastik/trash bag, dll). Urutan tampil mengalir mengikuti nomor urut peserta LKBB dari tingkat SD/MI, SMP/MTs, hingga SMA/SMK/MA.',
    tags: ['Daur Ulang Barang Bekas', 'Aksi Panggung', 'Blocking Pose'],
    colSpan: 'md:col-span-6',
    imageUrl: '/images/landing/card-trophy.jpg',
    badge: 'PERIODE III',
  },
  {
    id: 'sc-06',
    code: 'P-I & IV / 06',
    category: 'PERIODE_1',
    categoryLabel: 'PERIODE I & IV • KOMPONEN REGU',
    year: 'AGP-IV',
    title: 'Administrasi Regu, Foto Kreasi & Kebersihan Barak',
    subtitle: '7 Komponen Berkas Airmail 310 (100 Poin), Foto IG @kiranicrew_official & Kebersihan',
    weightLabel: 'Admin 100 Poin • Kebersihan 100 Poin',
    arenaLabel: 'Sekretariat & Ruang Barak',
    description:
      'Penilaian kelengkapan 7 berkas pendaftaran di amplop kabinet Airmail No. 310, lomba Foto Ekspresi Pramuka di Instagram @kiranicrew_official, serta inspeksi kebersihan barak dan lapangan 2 tahap.',
    tags: ['Amplop Airmail 310', 'IG @kiranicrew_official', 'Inspeksi Barak 2x'],
    colSpan: 'md:col-span-6',
    imageUrl: '/images/landing/card-pionering.jpg',
    badge: 'PERIODE I & IV',
  },
];

const ABA_ABA_SD_GROUPS = [
  {
    groupCode: 'A',
    groupTitle: 'GERAKAN BERKUMPUL',
    items: ['1. Bersaf Kumpul'],
  },
  {
    groupCode: 'B',
    groupTitle: 'GERAKAN DI TEMPAT',
    items: [
      '2. Sikap Sempurna',
      '3. Istirahat di Tempat',
      '4. Parade Periksa Kerapihan',
      '5. Berhitung',
      '6. Hormat',
      '7. ½ Lengan Lencang Kanan',
      '8. Lencang Kanan',
      '9. Hadap Serong Kanan',
      '10. Hadap Serong Kiri',
      '11. Balik Kanan',
      '12. Hadap Kanan',
      '13. Lencang Depan',
      '14. Jalan di Tempat',
    ],
  },
  {
    groupCode: 'C',
    groupTitle: 'GERAKAN BERPINDAH TEMPAT',
    items: [
      '15. 4 Langkah ke Belakang',
      '16. 3 Langkah ke Depan',
      '17. 4 Langkah ke Kiri',
      '18. 3 Langkah ke Kanan',
    ],
  },
  {
    groupCode: 'D',
    groupTitle: 'GERAKAN DIAM KE BERJALAN',
    items: ['19. Langkah Perlahan', '20. Langkah Biasa', '21. Langkah Lari'],
  },
  {
    groupCode: 'E',
    groupTitle: 'GERAKAN BERJALAN-BERJALAN',
    items: [
      '22. Tiap-tiap Banjar 2x Belok Kanan',
      '23. Langkah Tegap',
      '24. Hormat Kanan',
      '25. Tiap-tiap Banjar 2x Belok Kiri',
      '26. Hadap Kanan Henti',
    ],
  },
  {
    groupCode: 'F & G',
    groupTitle: 'VARIASI/FORMASI & GERAKAN BUBAR',
    items: ['F. Variasi / Formasi Pasukan', '27. Bubar'],
  },
];

const ABA_ABA_SMP_SMA_GROUPS = [
  {
    groupCode: 'A',
    groupTitle: 'GERAKAN BERKUMPUL',
    items: ['1. Bersaf Kumpul'],
  },
  {
    groupCode: 'B',
    groupTitle: 'GERAKAN DI TEMPAT',
    items: [
      '2. Sikap Sempurna',
      '3. Istirahat di Tempat',
      '4. Berhitung',
      '5. Hormat',
      '6. ½ Lengan Lencang Kanan',
      '7. Lencang Kiri',
      '8. Hadap Serong Kanan',
      '9. Parade Periksa Kerapihan',
      '10. Hadap Serong Kiri',
      '11. Balik Kanan',
      '12. Hadap Kanan',
      '13. Lencang Depan',
      '14. Jalan di Tempat',
    ],
  },
  {
    groupCode: 'H',
    groupTitle: 'GERAKAN BERPINDAH TEMPAT',
    items: ['15. 4 Langkah ke Belakang', '16. 3 Langkah ke Depan'],
  },
  {
    groupCode: 'I',
    groupTitle: 'GERAKAN DIAM KE BERJALAN',
    items: ['17. Langkah Perlahan', '18. Langkah Biasa', '19. Langkah Tegap'],
  },
  {
    groupCode: 'J',
    groupTitle: 'GERAKAN BERJALAN KE BERJALAN',
    items: [
      '20. Langkah Lari',
      '21. Langkah Biasa',
      '22. Belok Kanan',
      '23. Tiap-tiap Banjar 2x Belok Kanan',
      '24. Belok Kiri',
      '25. Hormat Kanan',
      '26. Melintang Kiri/Kanan',
      '27. Haluan Kanan/Kiri',
    ],
  },
  {
    groupCode: 'K & L',
    groupTitle: 'VARIASI/FORMASI & GERAKAN BUBAR',
    items: ['K. Variasi / Formasi Pasukan', '28. Bubar'],
  },
];

const LKBB_PENALTIES = [
  {
    code: 'PENALTI 01',
    rule: 'Tidak memasuki Daerah Persiapan setelah dipanggil 3x berturut-turut (disimpan di urutan akhir)',
    deduction: '-100 Poin',
  },
  {
    code: 'PENALTI 02',
    rule: 'Pasukan pada saat memasuki Daerah Persiapan dan tampil tidak lengkap (kurang dari 16 orang)',
    deduction: '-150 Poin / Orang',
  },
  {
    code: 'PENALTI 03',
    rule: 'Melebihi batas waktu tampil (lebih dari 8 menit, berlaku kelipatan)',
    deduction: '-5 Poin / 10 Detik',
  },
  {
    code: 'PENALTI 04',
    rule: 'Melewati atau menginjak garis kavling lapangan perlombaan (20 x 12 meter)',
    deduction: '-5 Poin / Orang',
  },
  {
    code: 'PENALTI 05',
    rule: 'Pembina atau pihak lainnya memberi tahu aba-aba kepada peserta saat tampil',
    deduction: '-50 Poin',
  },
];

const FAN_DECK_CARDS = [
  {
    id: 'deck-1',
    code: 'PORTAL 01',
    title: 'Live Urutan Tampil',
    subtitle: 'Monitor antrean kavling 20x12m real-time',
    stat: 'SEDANG TAMPIL',
    href: '/schedule',
    imageUrl: '/images/landing/card-lkbb.jpg',
    rotateDesktop: -12,
    offsetXDesktop: -85,
    offsetYDesktop: 18,
    isDownload: false,
  },
  {
    id: 'deck-2',
    code: 'PORTAL 02',
    title: 'Direktori Lokasi Barak',
    subtitle: 'Pencarian ruang transit SMKN 1 Soreang',
    stat: 'KUOTA 50 BASIS',
    href: '/barack',
    imageUrl: '/images/landing/card-pionering.jpg',
    rotateDesktop: -4,
    offsetXDesktop: -28,
    offsetYDesktop: 6,
    isDownload: false,
  },
  {
    id: 'deck-3',
    code: 'PORTAL 03',
    title: 'Klasemen & 106 Piala',
    subtitle: 'Transparansi nilai akhir & SK Juara',
    stat: 'NILAI RESMI',
    href: '/live-score',
    imageUrl: '/images/landing/card-trophy.jpg',
    rotateDesktop: 5,
    offsetXDesktop: 28,
    offsetYDesktop: -6,
    isDownload: false,
  },
  {
    id: 'deck-4',
    code: 'JUKLAK RESMI',
    title: 'Unduh Juklak AGP-III',
    subtitle: 'Petunjuk pelaksanaan & form pendaftaran',
    stat: 'PDF 12 HALAMAN',
    href: JUKLAK_PDF_URL,
    imageUrl: '/images/landing/card-sandi.jpg',
    rotateDesktop: 13,
    offsetXDesktop: 85,
    offsetYDesktop: -18,
    isDownload: true,
  },
];

const TIMELINE_DATA = [
  {
    step: '01',
    date: '06 NOV 2024 – 08 FEB 2025',
    title: 'Pendaftaran Basis & Lomba Foto Kreasi IG',
    description:
      'Pendaftaran di Sekretariat SMKN 1 Soreang (Senin–Sabtu 10.00–16.00 WIB, kuota 50 Basis, Rp 350.000/Regu via BJB 0025448987100 a.n. Santika Yunita) & batas foto IG @kiranicrew_official 14 Feb 2025.',
    status: 'PERIODE AWAL',
  },
  {
    step: '02',
    date: 'SABTU, 08 FEB 2025 (08.00–12.00)',
    title: 'Jumpa Teknik (Technical Meeting)',
    description:
      'Dilaksanakan di Kampus SMK Negeri 1 Soreang. Masing-masing Basis wajib diwakili oleh 1 orang Pembina dan 1 orang Peserta AGP-III.',
    status: 'JUMPA TEKNIK',
  },
  {
    step: '03',
    date: 'SABTU, 15 FEB 2025 (09.00–15.00)',
    title: 'Periode I: Daftar Ulang Ke-1 & Penilaian Administrasi',
    description:
      'Pengumpulan amplop kabinet Airmail No. 310 berisi 7 komponen administrasi (Formulir, Kwitansi, KTA, BPJS, Surat Mandat, Izin Orang Tua, Bumbung Kemanusiaan — Total 100 Poin).',
    status: 'PERIODE I',
  },
  {
    step: '04',
    date: 'SABTU, 22 FEB 2025 (06.00–SELESAI)',
    title: 'Daftar Ulang Ke-2 & Pelaksanaan Periode II, III, IV',
    description:
      'Daftar ulang Regu lengkap (06.00–06.45 WIB), Upacara Pembukaan, Bank Soal, Semaphore, Morse, Mini Pionering, LKBB, Fashion Show, Kebersihan Barak & Pengumuman 106 Piala.',
    status: 'HARI-H UTAMA',
  },
];

const FAQ_DATA = [
  {
    q: 'Berapa jumlah anggota setiap Regu/Sangga dan Pasukan LKBB di AGP-III?',
    a: 'Setiap Regu/Sangga terdiri dari 8 orang (tiap Basis mengirimkan minimal 2 Regu/Sangga). Khusus untuk mata lomba LKBB (PBB Dasar & Variasi) dilaksanakan Per Basis yang diwakili oleh 16 orang termasuk Danton (dapat terdiri dari Putra saja, Putri saja, atau Campuran).',
  },
  {
    q: 'Bagaimana rincian biaya pendaftaran dan nomor rekening resmi panitia?',
    a: 'Biaya pendaftaran sebesar Rp 350.000,- (Tiga Ratus Lima Puluh Ribu Rupiah) tiap Regu/Sangga. Pembayaran dapat ditransfer melalui Bank BJB No. Rekening 0025448987100 a.n. Santika Yunita, atau langsung di Sekretariat Kampus SMK Negeri 1 Soreang (Jl. Nyalindung No. 1, Kec. Soreang, Kab. Bandung).',
  },
  {
    q: 'Bagaimana pembagian bobot nilai Juara Umum LKBB dan aturan aba-aba PBB?',
    a: 'Juara Umum LKBB merupakan gabungan dari 70% PBB Dasar, 20% Variasi Formasi, dan 10% Danton dengan acuan PERPANG TNI Nomor 58 Tahun 2018 (Juri dari TNI, Polisi, dan Satlak PBB). Seluruh aba-aba wajib dihafal (tidak boleh dibaca) dan harus dilakukan secara berurutan.',
  },
  {
    q: 'Bagaimana mekanisme pengajuan protes dan siapa narahubung resmi Sangga Kerja?',
    a: 'Protes hanya berlaku maksimal 3 jam setelah pengumuman juara lomba oleh Pembina yang mengikuti Jumpa Teknik dengan melengkapi Surat Pengajuan Protes dan bukti sah. Informasi lebih lanjut hubungi WA: 0821-1523-5323 (Kak Redittia), 0831-2860-3800 (Kak Bayu), atau 0812-2455-0525 (Kak Naza).',
  },
];

function MaskRevealLine({
  children,
  delay = 0,
  duration = 0.85,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <span className={`block overflow-hidden pb-[0.08em] -mb-[0.08em] ${className}`}>
      <motion.span
        className="block will-change-transform"
        initial={{ y: '108%', opacity: 0 }}
        animate={{ y: '0%', opacity: 1 }}
        transition={{ duration, delay, ease: EASE_AWWWARDS }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function HeroParallaxCard({
  card,
  index,
  smoothX,
  smoothY,
  isMobile,
  onSelect,
}: {
  card: FloatingHeroCardData;
  index: number;
  smoothX: ReturnType<typeof useSpring>;
  smoothY: ReturnType<typeof useSpring>;
  isMobile: boolean;
  onSelect: (card: FloatingHeroCardData) => void;
}) {
  const x = useTransform(smoothX, [-0.5, 0.5], [
    isMobile ? 0 : -card.parallaxFactorX,
    isMobile ? 0 : card.parallaxFactorX,
  ]);
  const y = useTransform(smoothY, [-0.5, 0.5], [
    isMobile ? 0 : -card.parallaxFactorY,
    isMobile ? 0 : card.parallaxFactorY,
  ]);

  return (
    <motion.div
      style={{ x, y }}
      initial={{ opacity: 0, y: isMobile ? 24 : 44, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: isMobile ? 0.55 : 0.9,
        delay: (isMobile ? 0.12 : 0.22) + index * (isMobile ? 0.04 : 0.07),
        ease: EASE_AWWWARDS,
      }}
      className={`group relative cursor-pointer select-none ${card.staggerClass}`}
      onClick={() => onSelect(card)}
    >
      {/* 3-Column Metadata Strip Above Card */}
      <div className="grid grid-cols-3 items-center text-[10px] font-mono tracking-[0.14em] uppercase text-[#94B8AE] mb-2 px-1">
        <span className="font-bold text-[#E3EF26]">{card.code}</span>
        <span className="text-center truncate text-[#B8D4CC]">{card.category}</span>
        <span className="text-right text-[#70968B]">{card.year}</span>
      </div>

      {/* Rounded Glassmorphism Visual Card with Custom 3D Studio Render */}
      <motion.div
        whileHover={{ y: isMobile ? -2 : -6, scale: isMobile ? 1.01 : 1.025 }}
        transition={{ duration: 0.45, ease: EASE_AWWWARDS }}
        className={`relative overflow-hidden rounded-[22px] border backdrop-blur-xl transition-colors duration-500 ${card.accentLime
          ? 'bg-[#0C342C]/90 border-[#E3EF26]/50 shadow-[0_20px_50px_rgba(0,0,0,0.6),0_0_30px_rgba(227,239,38,0.14)]'
          : 'bg-[#092922]/85 border-[#076653]/65 hover:border-[#E3EF26]/55 shadow-[0_20px_45px_rgba(0,0,0,0.55)]'
          }`}
      >
        <div className="relative h-40 sm:h-44 xl:h-48 w-full overflow-hidden bg-[#061C17]">
          <img
            src={card.imageUrl}
            alt={card.title}
            loading="eager"
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#08241E] via-transparent to-black/20" />

          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-[0.12em] backdrop-blur-md border ${card.accentLime
                ? 'bg-[#E3EF26] text-[#0C342C] border-[#E3EF26] font-bold'
                : 'bg-[#08241E]/80 text-[#D7EAE3] border-white/15'
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${card.accentLime ? 'bg-[#0C342C]' : 'bg-[#E3EF26]'
                  }`}
              />
              {card.metric}
            </span>
            <span className="w-7 h-7 rounded-full bg-[#08241E]/80 border border-white/15 backdrop-blur-md flex items-center justify-center text-[#E3EF26] group-hover:bg-[#E3EF26] group-hover:text-[#0C342C] transition-colors duration-300">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        <div className="p-3.5 sm:p-4 bg-[#092922]/95 border-t border-white/5">
          <h3 className="text-sm sm:text-[15px] font-bold text-white tracking-tight truncate group-hover:text-[#E3EF26] transition-colors">
            {card.title}
          </h3>
          <p className="text-[11px] text-[#8AB0A5] truncate mt-0.5">{card.subtitle}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AwwwardsLandingPage() {
  const [activeNav, setActiveNav] = useState<
    'HOME' | 'EXPLORE' | 'ABA_ABA' | 'TIMELINE' | 'FAQ'
  >('HOME');
  const [activeCategory, setActiveCategory] = useState<ShowcaseCategory>('ALL');
  const [activeAbaJenjang, setActiveAbaJenjang] = useState<'SD' | 'SMP_SMA'>('SMP_SMA');
  const [selectedHeroCard, setSelectedHeroCard] = useState<FloatingHeroCardData | null>(
    null
  );
  const [selectedShowcase, setSelectedShowcase] = useState<ShowcaseCardItem | null>(null);
  const [hoveredDeckIndex, setHoveredDeckIndex] = useState<number | null>(null);
  const [deckExpanded, setDeckExpanded] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect desktop vs mobile for adaptive animation speed & parallax behavior
  useEffect(() => {
    const updateViewportMode = () => {
      const coarse = window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(window.innerWidth < 1024 || coarse);
    };
    updateViewportMode();
    window.addEventListener('resize', updateViewportMode);
    return () => window.removeEventListener('resize', updateViewportMode);
  }, []);

  // Track scroll position to sync top pill switcher
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const exploreEl = document.getElementById('explore');
      const abaEl = document.getElementById('aba-aba');
      const timelineEl = document.getElementById('timeline');
      const faqEl = document.getElementById('faq');

      if (faqEl && y >= faqEl.offsetTop - 280) {
        setActiveNav('FAQ');
      } else if (timelineEl && y >= timelineEl.offsetTop - 280) {
        setActiveNav('TIMELINE');
      } else if (abaEl && y >= abaEl.offsetTop - 280) {
        setActiveNav('ABA_ABA');
      } else if (exploreEl && y >= exploreEl.offsetTop - 280) {
        setActiveNav('EXPLORE');
      } else {
        setActiveNav('HOME');
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth 60fps Mouse Parallax using Framer Motion values (active on desktop)
  const heroRef = useRef<HTMLElement | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 38, stiffness: 80, mass: 1.15 });
  const smoothY = useSpring(mouseY, { damping: 38, stiffness: 80, mass: 1.15 });

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (isMobile || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(nx);
    mouseY.set(ny);
  };

  const handleHeroMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const filteredShowcase =
    activeCategory === 'ALL'
      ? SHOWCASE_ITEMS
      : SHOWCASE_ITEMS.filter((item) => item.category === activeCategory);

  const scrollToSection = (
    id: string,
    tab: 'HOME' | 'EXPLORE' | 'ABA_ABA' | 'TIMELINE' | 'FAQ'
  ) => {
    setActiveNav(tab);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const enterDuration = isMobile ? 0.55 : 0.85;
  const activeAbaGroups =
    activeAbaJenjang === 'SD' ? ABA_ABA_SD_GROUPS : ABA_ABA_SMP_SMA_GROUPS;

  return (
    <div className="min-h-screen bg-[#07201B] text-[#F4F9F7] selection:bg-[#E3EF26] selection:text-[#0C342C] overflow-x-hidden">
      {/* Subtle Ambient Studio Lighting & Fine Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="absolute -top-48 left-1/2 -translate-x-1/2 w-[1100px] h-[560px] rounded-full opacity-30 blur-[150px]"
          style={{
            background:
              'radial-gradient(circle, rgba(7,102,83,0.65) 0%, rgba(227,239,38,0.12) 50%, transparent 75%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #E3EF26 1px, transparent 1px), linear-gradient(to bottom, #E3EF26 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      {/* =====================================================================
          1. MINIMALIST AWWWARDS NAVIGATION BAR
         ===================================================================== */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 sm:px-8 pt-4 pb-2 pointer-events-none">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
          {/* Left: Clean Brand Identity with Official Kirani Shield Logo */}
          <Link
            href="/"
            className="pointer-events-auto group inline-flex items-center gap-3 pl-2.5 pr-4 py-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/65 backdrop-blur-xl hover:border-[#E3EF26]/65 transition-all duration-300 shadow-[0_10px_28px_rgba(0,0,0,0.4)]"
          >
            <img
              src="/kirani.svg"
              alt="Logo Kirani AGP-IV"
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(227,239,38,0.28)] group-hover:scale-105 transition-transform duration-300"
            />
            <div className="flex flex-col leading-none">
              <span className="text-xs sm:text-[13px] font-black tracking-[0.14em] uppercase text-white">
                KIRANI<span className="text-[#E3EF26]">.AGP-IV</span>
              </span>
              <span className="text-[9px] font-mono tracking-[0.14em] text-[#94B8AE] mt-0.5">
                SMKN 1 SOREANG
              </span>
            </div>
          </Link>

          {/* Center: Segmented Pill Switcher */}
          <nav
            aria-label="Landing Navigation"
            className="pointer-events-auto hidden lg:flex items-center gap-1 p-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/65 backdrop-blur-2xl shadow-[0_16px_36px_rgba(0,0,0,0.45)]"
          >
            {(
              [
                { id: 'HOME', label: 'BERANDA', target: 'home' },
                { id: 'EXPLORE', label: 'MATA LOMBA', target: 'explore' },
                { id: 'ABA_ABA', label: 'ABA-ABA LKBB', target: 'aba-aba' },
                { id: 'TIMELINE', label: 'JADWAL', target: 'timeline' },
                { id: 'FAQ', label: 'FAQ', target: 'faq' },
              ] as const
            ).map((item) => {
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.target, item.id)}
                  className={`relative px-4 py-1.5 rounded-full text-[11px] font-bold tracking-[0.13em] uppercase transition-colors duration-300 cursor-pointer ${active ? 'text-[#0C342C]' : 'text-[#A9C6BE] hover:text-white'
                    }`}
                >
                  {active && (
                    <motion.span
                      layoutId="landing-nav-pill"
                      transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                      className="absolute inset-0 rounded-full bg-[#E3EF26] shadow-[0_0_20px_rgba(227,239,38,0.4)]"
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right: Direct Juklak PDF Download + Pill-Shaped Action Button to Public Live Arena */}
          <div className="pointer-events-auto flex items-center gap-2.5">
            <a
              href={JUKLAK_PDF_URL}
              download={JUKLAK_DOWNLOAD_NAME}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#092922]/90 border border-[#E3EF26]/55 text-xs font-bold text-[#E3EF26] hover:bg-[#E3EF26] hover:text-[#0C342C] backdrop-blur-xl transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Juklak PDF</span>
            </a>

            <Link
              href="/schedule"
              className="group inline-flex items-center gap-2.5 pl-4 pr-2.5 py-2 rounded-full bg-[#E3EF26] text-[#0C342C] text-xs font-extrabold tracking-wide shadow-[0_10px_28px_rgba(227,239,38,0.28)] hover:bg-[#eef842] transition-all duration-300"
            >
              <span>Portal Live Arena</span>
              <span className="w-6 h-6 rounded-full bg-[#0C342C] text-[#E3EF26] flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* =====================================================================
          2. SCENE 01 — HERO SECTION (STRUCTURED 3-TIER NON-OVERLAPPING LAYOUT)
         ===================================================================== */}
      <section
        id="home"
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative z-10 min-h-screen flex flex-col justify-between pt-24 sm:pt-28 pb-8 sm:pb-10 px-4 sm:px-8 max-w-[1440px] mx-auto"
      >
        {/* TIER 1: Top Editorial Meta & Subtitle Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pb-6 border-b border-[#076653]/35">
          <div className="lg:col-span-7 space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: enterDuration, ease: EASE_AWWWARDS }}
              className="inline-flex flex-wrap items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/70"
            >
              <span className="w-2 h-2 rounded-full bg-[#E3EF26] animate-pulse" />
              <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.15em] text-[#D7EAE3]">
                TINGKAT JAWA BARAT • BASIS SMK NEGERI 1 SOREANG • PENGGALANG &amp; PENEGAK
              </span>
            </motion.div>

            <MaskRevealLine delay={0.05} duration={enterDuration}>
              <h2 className="text-xl sm:text-2xl lg:text-[27px] font-bold tracking-tight text-white leading-snug">
                Lomba Aktivitas Gerakan Pramuka Ke-III (AGP-III){' '}
                <span className="text-[#8FB7AC] font-normal">
                  — Ambalan Ki Hajar Dewantara &amp; R.A Kartini 04.105–04.106 SMKN 1 Soreang.
                </span>
              </h2>
            </MaskRevealLine>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: enterDuration, delay: 0.12, ease: EASE_AWWWARDS }}
            className="lg:col-span-5 flex flex-wrap items-center lg:justify-end gap-2.5"
          >
            <a
              href={JUKLAK_PDF_URL}
              download={JUKLAK_DOWNLOAD_NAME}
              className="group inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#E3EF26] text-[#0C342C] font-extrabold text-xs sm:text-sm tracking-wide shadow-[0_12px_30px_rgba(227,239,38,0.24)] hover:bg-[#eef842] transition-all duration-300"
            >
              <Download className="w-4 h-4" />
              <span>Download Juklak Resmi (PDF)</span>
            </a>

            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#092922]/90 border border-[#076653]/80 text-xs sm:text-sm font-semibold text-white hover:border-[#E3EF26] hover:text-[#E3EF26] transition-all duration-300"
            >
              <Radio className="w-3.5 h-3.5 text-[#E3EF26]" />
              <span>Cek Urutan Tampil &amp; Barak</span>
            </Link>
          </motion.div>
        </div>

        {/* TIER 2: Dedicated 5-Card Floating Showcase Stage */}
        <div className="my-8 sm:my-10 lg:my-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 xl:gap-5 items-center">
            {HERO_FLOATING_CARDS.map((card, index) => (
              <HeroParallaxCard
                key={card.id}
                card={card}
                index={index}
                smoothX={smoothX}
                smoothY={smoothY}
                isMobile={isMobile}
                onSelect={(c) => setSelectedHeroCard(c)}
              />
            ))}
          </div>

          {/* Interactive Selected Card Quick Bar */}
          <AnimatePresence>
            {selectedHeroCard && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.35, ease: EASE_AWWWARDS }}
                className="mt-6 rounded-2xl bg-[#092922]/95 border border-[#E3EF26]/50 backdrop-blur-2xl p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.65)]"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={selectedHeroCard.imageUrl}
                    alt={selectedHeroCard.title}
                    className="w-12 h-12 rounded-xl object-cover border border-[#E3EF26]/40 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-[#E3EF26]">
                      <span>{selectedHeroCard.code}</span>
                      <span>•</span>
                      <span>{selectedHeroCard.metric}</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-white">
                      {selectedHeroCard.title} —{' '}
                      <span className="text-[#94B8AE] font-normal">
                        {selectedHeroCard.subtitle}
                      </span>
                    </h4>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedHeroCard(null);
                      scrollToSection('explore', 'EXPLORE');
                    }}
                    className="px-4 py-2 rounded-full bg-[#E3EF26] text-[#0C342C] text-xs font-extrabold tracking-wide hover:bg-[#eef842] transition-colors cursor-pointer"
                  >
                    Lihat Detail Juklak
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedHeroCard(null)}
                    className="px-3 py-2 rounded-full bg-white/5 text-xs text-[#94B8AE] hover:text-white transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* TIER 3: Monumental Bottom Mask-Reveal Wordmark (AGP-III) */}
        <div className="pt-2 border-t border-[#076653]/35">
          <div className="overflow-hidden py-1">
            <div className="flex items-baseline justify-between select-none">
              {['A', 'G', 'P', '-', 'I', 'I', 'I'].map((char, idx) => (
                <div key={idx} className="overflow-hidden">
                  <motion.span
                    initial={{ y: '112%' }}
                    animate={{ y: '0%' }}
                    transition={{
                      duration: isMobile ? 0.65 : 1.0,
                      delay: 0.08 + idx * (isMobile ? 0.03 : 0.05),
                      ease: EASE_AWWWARDS,
                    }}
                    className={`block font-black leading-[0.82] tracking-[-0.05em] text-[clamp(3.8rem,14.5vw,14.5rem)] ${char === '-'
                      ? 'text-[#E3EF26]'
                      : idx >= 4
                        ? 'text-transparent bg-clip-text bg-gradient-to-b from-white via-[#D7EAE3] to-[#076653]'
                        : 'text-white'
                      }`}
                  >
                    {char}
                  </motion.span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Metadata Baseline Strip */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono uppercase tracking-[0.15em] text-[#7FA69A]">
            <span>BASIS SMK NEGERI 1 SOREANG • JL. NYALINDUNG NO. 1 KAB. BANDUNG</span>
            <span className="hidden sm:inline text-[#E3EF26]">
              GOLONGAN A (SD/MI) • B (SMP/MTS) • C (SMA/SMK/MA)
            </span>
            <span>SABTU, 22 FEBRUARI 2025 • 07.00 WIB – SELESAI</span>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. SCENE 02 — KINETIC EDITORIAL HEADLINE & 3D FAN-OUT CARD STACK
         ===================================================================== */}
      <section className="relative z-10 py-20 sm:py-28 px-4 sm:px-8 max-w-[1440px] mx-auto border-t border-[#076653]/35">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left 6 Columns: Crisp 3-Line Kinetic Typography + Official Key Metrics */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#092922] border border-[#076653]/65 text-[11px] font-mono uppercase tracking-[0.16em] text-[#E3EF26]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>01 / JUKLAK &amp; EKOSISTEM DIGITAL AGP-III</span>
            </div>

            <div className="space-y-1">
              <MaskRevealLine delay={0.04} duration={enterDuration}>
                <h2 className="text-[clamp(2.2rem,4.3vw,4.25rem)] font-black tracking-[-0.035em] leading-[1.05] text-white">
                  Transformasi Digital
                </h2>
              </MaskRevealLine>
              <MaskRevealLine delay={0.12} duration={enterDuration}>
                <h2 className="text-[clamp(2.2rem,4.3vw,4.25rem)] font-black tracking-[-0.035em] leading-[1.05] text-[#E3EF26]">
                  Kompetisi Pramuka
                </h2>
              </MaskRevealLine>
              <MaskRevealLine delay={0.2} duration={enterDuration}>
                <h2 className="text-[clamp(2.2rem,4.3vw,4.25rem)] font-black tracking-[-0.035em] leading-[1.05] text-[#B8D4CC]">
                  &amp; Rekapitulasi Nilai.
                </h2>
              </MaskRevealLine>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: enterDuration, delay: 0.25, ease: EASE_AWWWARDS }}
              className="text-sm sm:text-base text-[#94B8AE] max-w-xl leading-relaxed"
            >
              Diselenggarakan oleh Sangga Kerja Ambalan{' '}
              <strong className="text-white font-semibold">
                Ki Hajar Dewantara &amp; R.A Kartini 04.105–04.106
              </strong>{' '}
              Basis SMK Negeri 1 Soreang. Memperebutkan{' '}
              <strong className="text-[#E3EF26] font-semibold">106 Kategori Piala</strong>{' '}
              dengan transparansi jadwal tampil, direktori barak, dan rekapitulasi nilai
              terpadu.
            </motion.p>

            {/* Key Juklak Metrics Strip */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: enterDuration, delay: 0.32, ease: EASE_AWWWARDS }}
              className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 max-w-xl"
            >
              {[
                { label: 'KUOTA MAKSIMAL', value: '50 Basis' },
                { label: 'PIALA KEJUARAAN', value: '106 Piala' },
                { label: 'PASUKAN LKBB', value: '16 Orang' },
                { label: 'ANGGOTA REGU', value: '8 Orang' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-[#092922]/90 border border-[#076653]/60 p-3.5 text-center backdrop-blur-xl"
                >
                  <div className="text-lg sm:text-xl font-black font-mono text-white tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[9px] font-mono tracking-[0.15em] text-[#E3EF26] mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right 6 Columns: Contained Interactive 3D Fan-Out Card Deck */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div
              onMouseEnter={() => !isMobile && setDeckExpanded(true)}
              onMouseLeave={() => {
                if (!isMobile) {
                  setDeckExpanded(false);
                  setHoveredDeckIndex(null);
                }
              }}
              className="relative w-full max-w-[540px] h-[390px] sm:h-[420px] flex items-center justify-center"
            >
              {FAN_DECK_CARDS.map((card, idx) => {
                const isHovered = hoveredDeckIndex === idx;
                const spreadMultiplier = deckExpanded ? 1.15 : 0.65;
                const xOffset = isMobile
                  ? (idx - 1.5) * 28
                  : card.offsetXDesktop * spreadMultiplier;
                const yOffset = isMobile
                  ? Math.abs(idx - 1.5) * 8
                  : card.offsetYDesktop * spreadMultiplier + (isHovered ? -18 : 0);
                const rotateDeg = isMobile
                  ? (idx - 1.5) * 4
                  : card.rotateDesktop * (deckExpanded ? 1.05 : 0.55);

                const cardInner = (
                  <>
                    <div className="relative h-44 w-full overflow-hidden bg-[#061C17]">
                      <img
                        src={card.imageUrl}
                        alt={card.title}
                        className="h-full w-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#092922] via-transparent to-black/25" />
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-[#08241E]/85 border border-white/15 text-[9px] font-mono tracking-[0.16em] text-[#E3EF26] uppercase">
                          {card.code}
                        </span>
                        <span className="w-7 h-7 rounded-full bg-[#E3EF26] text-[#0C342C] flex items-center justify-center">
                          {card.isDownload ? (
                            <Download className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-[#092922]">
                      <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#E3EF26] mb-1">
                        {card.stat}
                      </div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {card.title}
                      </h3>
                      <p className="text-xs text-[#94B8AE] mt-1 line-clamp-1">
                        {card.subtitle}
                      </p>
                    </div>
                  </>
                );

                return (
                  <motion.div
                    key={card.id}
                    onMouseEnter={() => setHoveredDeckIndex(idx)}
                    animate={{
                      x: xOffset,
                      y: yOffset,
                      rotate: isHovered ? 0 : rotateDeg,
                      scale: isHovered ? 1.05 : 1,
                    }}
                    transition={{ duration: 0.6, ease: EASE_AWWWARDS }}
                    style={{ zIndex: isHovered ? 40 : 10 + idx }}
                    className="absolute w-60 sm:w-64 rounded-[24px] overflow-hidden bg-[#092922] border border-[#076653]/80 hover:border-[#E3EF26] shadow-[0_24px_60px_rgba(0,0,0,0.65)] transition-colors"
                  >
                    {card.isDownload ? (
                      <a
                        href={card.href}
                        download={JUKLAK_DOWNLOAD_NAME}
                        className="block"
                      >
                        {cardInner}
                      </a>
                    ) : (
                      <Link href={card.href} className="block">
                        {cardInner}
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeckExpanded((prev) => !prev)}
                className="px-4 py-1.5 rounded-full bg-[#092922] border border-[#076653]/70 text-[11px] font-mono uppercase tracking-[0.14em] text-[#A9C6BE] hover:text-[#E3EF26] hover:border-[#E3EF26]/50 transition-colors cursor-pointer"
              >
                {deckExpanded ? 'Rapatkan Tumpukan Kartu' : 'Rentangkan Kartu Akses Cepat'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. SCENE 03 — INTERACTIVE BENTO SHOWCASE GRID (PERIODE I – IV)
         ===================================================================== */}
      <section
        id="explore"
        className="relative z-10 py-20 sm:py-28 px-4 sm:px-8 max-w-[1440px] mx-auto border-t border-[#076653]/35"
      >
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#092922] border border-[#076653]/70 text-[11px] font-mono uppercase tracking-[0.18em] text-[#E3EF26] mb-4">
            <Layers className="w-3.5 h-3.5" />
            <span>02 / SPESIFIKASI MATA LOMBA (PERIODE I – IV)</span>
          </div>

          <MaskRevealLine delay={0.04} duration={enterDuration}>
            <h2 className="text-[clamp(2rem,4.5vw,4rem)] font-black tracking-[-0.035em] leading-[1.06] text-white">
              Rincian Teknis{' '}
              <span className="text-[#E3EF26]">Cabang Perlombaan.</span>
            </h2>
          </MaskRevealLine>

          <p className="mt-3 text-sm sm:text-base text-[#94B8AE] max-w-2xl mx-auto leading-relaxed">
            Seluruh cabang perlombaan AGP-III dibagi ke dalam 4 Periode untuk Tingkat
            Penggalang SD/MI (A), Penggalang SMP/MTs (B), dan Penegak SMA/SMK/MA (C).
          </p>

          {/* Interactive Category Switcher Pills */}
          <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/65 backdrop-blur-xl">
            {(
              [
                { id: 'ALL', label: 'Semua Periode' },
                { id: 'PERIODE_3', label: 'Periode III (LKBB & Fashion)' },
                { id: 'PERIODE_2', label: 'Periode II (Materi Pramuka)' },
                { id: 'PERIODE_1', label: 'Periode I & IV (Admin & Kebersihan)' },
              ] as const
            ).map((tab) => {
              const active = activeCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveCategory(tab.id)}
                  className={`relative px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-colors duration-300 cursor-pointer ${active ? 'text-[#0C342C]' : 'text-[#A9C6BE] hover:text-white'
                    }`}
                >
                  {active && (
                    <motion.span
                      layoutId="showcase-filter-pill"
                      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                      className="absolute inset-0 rounded-full bg-[#E3EF26] shadow-[0_0_20px_rgba(227,239,38,0.35)]"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bento Grid Showcase */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
          <AnimatePresence mode="popLayout">
            {filteredShowcase.map((item, idx) => (
              <motion.article
                layout
                key={item.id}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: isMobile ? 0.45 : 0.65,
                  delay: idx * 0.04,
                  ease: EASE_AWWWARDS,
                }}
                onClick={() => setSelectedShowcase(item)}
                className={`${item.colSpan} group cursor-pointer rounded-[28px] bg-[#092922]/85 border ${item.highlightLime
                  ? 'border-[#E3EF26]/50 hover:border-[#E3EF26]'
                  : 'border-[#076653]/65 hover:border-[#E3EF26]/65'
                  } p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between transition-colors duration-500 shadow-[0_20px_50px_rgba(0,0,0,0.45)]`}
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-[#0C342C] border border-[#076653] text-[10px] font-mono font-bold text-[#E3EF26]">
                        {item.code}
                      </span>
                      <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#94B8AE]">
                        {item.categoryLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-white/5 text-[10px] font-mono uppercase tracking-[0.14em] text-[#D7EAE3]">
                        {item.badge}
                      </span>
                      <span className="w-8 h-8 rounded-full bg-[#0C342C] border border-[#076653] flex items-center justify-center text-[#E3EF26] group-hover:bg-[#E3EF26] group-hover:text-[#0C342C] transition-colors duration-300">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>

                  {/* Dedicated 3D Visual Frame */}
                  <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden bg-[#061A15] border border-white/5 mb-5">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#061A15]/90 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#D7EAE3]">
                      <span className="px-2.5 py-1 rounded-lg bg-[#092922]/85 backdrop-blur-md border border-white/10 text-[#E3EF26] font-semibold">
                        {item.weightLabel}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#092922]/85 backdrop-blur-md border border-white/10">
                        {item.arenaLabel}
                      </span>
                    </div>
                  </div>

                  {/* Clean Typography Block Below Image */}
                  <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight group-hover:text-[#E3EF26] transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-[#94B8AE] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                {/* Bottom Tags Row */}
                <div className="mt-5 pt-4 border-t border-[#076653]/40 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full bg-[#0C342C]/90 border border-[#076653]/60 text-[11px] text-[#C6E0D8]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-[#E3EF26] inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Detail
                  </span>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Modal Drawer when a Showcase Card is clicked */}
        <AnimatePresence>
          {selectedShowcase && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedShowcase(null)}
              className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.96 }}
                transition={{ duration: 0.4, ease: EASE_AWWWARDS }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl rounded-[28px] bg-[#092922] border border-[#E3EF26]/50 overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
              >
                <div className="relative h-56 sm:h-64 w-full bg-[#061A15]">
                  <img
                    src={selectedShowcase.imageUrl}
                    alt={selectedShowcase.title}
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#092922] via-[#092922]/30 to-transparent" />
                  <button
                    type="button"
                    onClick={() => setSelectedShowcase(null)}
                    className="absolute top-4 right-4 px-3.5 py-1.5 rounded-full bg-[#08241E]/90 border border-white/15 text-xs font-semibold text-white hover:border-[#E3EF26] hover:text-[#E3EF26] cursor-pointer"
                  >
                    Tutup [ESC]
                  </button>
                </div>

                <div className="p-6 sm:p-8 -mt-8 relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono uppercase tracking-[0.15em] text-[#E3EF26]">
                    <span>{selectedShowcase.code}</span>
                    <span>•</span>
                    <span>{selectedShowcase.weightLabel}</span>
                    <span>•</span>
                    <span>{selectedShowcase.arenaLabel}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {selectedShowcase.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#A9C6BE] leading-relaxed">
                    {selectedShowcase.description}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedShowcase.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-[#0C342C] border border-[#076653] text-xs text-[#E3EF26]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[#076653]/50 flex flex-wrap items-center justify-between gap-3">
                    <Link
                      href="/schedule"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#E3EF26] text-[#0C342C] text-xs font-extrabold tracking-wide hover:bg-[#eef842]"
                    >
                      <span>Lihat Urutan Tampil Lomba Ini</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                    <a
                      href={JUKLAK_PDF_URL}
                      download={JUKLAK_DOWNLOAD_NAME}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0C342C] border border-[#076653] text-xs font-semibold text-[#D7EAE3] hover:border-[#E3EF26]"
                    >
                      <Download className="w-3.5 h-3.5 text-[#E3EF26]" />
                      <span>Unduh Juklak Lengkap (PDF)</span>
                    </a>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* =====================================================================
          5. SCENE 04 — OFFICIAL ABA-ABA PBB LKBB & REGULASI PENALTI (#aba-aba)
         ===================================================================== */}
      <section
        id="aba-aba"
        className="relative z-10 py-20 sm:py-28 px-4 sm:px-8 max-w-[1440px] mx-auto border-t border-[#076653]/35"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#092922] border border-[#076653]/70 text-[11px] font-mono uppercase tracking-[0.18em] text-[#E3EF26] mb-3">
              <ListChecks className="w-3.5 h-3.5" />
              <span>03 / PERPANG TNI NOMOR 58 TAHUN 2018 (WAJIB BERURUTAN)</span>
            </div>
            <MaskRevealLine duration={enterDuration}>
              <h2 className="text-[clamp(1.85rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-white">
                Daftar Resmi <span className="text-[#E3EF26]">Aba-Aba PBB LKBB.</span>
              </h2>
            </MaskRevealLine>
            <p className="text-xs sm:text-sm text-[#94B8AE] mt-2 max-w-2xl">
              Seluruh aba-aba wajib dihafal (tidak boleh dibaca) dan harus dilaksanakan
              secara berurutan pada kavling ukuran <strong className="text-white">20 x 12 meter</strong>{' '}
              dalam waktu maksimal <strong className="text-white">8 menit</strong>.
            </p>
          </div>

          {/* Switcher Golongan SD/MI vs SMP/MTs & SMA/SMK/MA */}
          <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#092922]/90 border border-[#076653]/70 backdrop-blur-xl self-start lg:self-end">
            <button
              type="button"
              onClick={() => setActiveAbaJenjang('SD')}
              className={`relative px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-colors cursor-pointer ${activeAbaJenjang === 'SD'
                ? 'text-[#0C342C]'
                : 'text-[#A9C6BE] hover:text-white'
                }`}
            >
              {activeAbaJenjang === 'SD' && (
                <motion.span
                  layoutId="aba-jenjang-pill"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-[#E3EF26] shadow-[0_0_18px_rgba(227,239,38,0.35)]"
                />
              )}
              <span className="relative z-10">Penggalang SD/MI (27 Aba-aba)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAbaJenjang('SMP_SMA')}
              className={`relative px-4 py-2 rounded-full text-xs font-bold tracking-wide transition-colors cursor-pointer ${activeAbaJenjang === 'SMP_SMA'
                ? 'text-[#0C342C]'
                : 'text-[#A9C6BE] hover:text-white'
                }`}
            >
              {activeAbaJenjang === 'SMP_SMA' && (
                <motion.span
                  layoutId="aba-jenjang-pill"
                  transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                  className="absolute inset-0 rounded-full bg-[#E3EF26] shadow-[0_0_18px_rgba(227,239,38,0.35)]"
                />
              )}
              <span className="relative z-10">SMP/MTs &amp; SMA/SMK/MA (28 Aba-aba)</span>
            </button>
          </div>
        </div>

        {/* Aba-Aba Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <AnimatePresence mode="popLayout">
            {activeAbaGroups.map((grp, idx) => (
              <motion.div
                layout
                key={`${activeAbaJenjang}-${grp.groupCode}`}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, delay: idx * 0.04, ease: EASE_AWWWARDS }}
                className="rounded-[24px] bg-[#092922]/85 border border-[#076653]/70 p-6 backdrop-blur-xl flex flex-col justify-between shadow-[0_18px_45px_rgba(0,0,0,0.4)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-[#076653]/45">
                    <span className="px-2.5 py-1 rounded-full bg-[#0C342C] border border-[#076653] text-[10px] font-mono font-bold text-[#E3EF26]">
                      BAGIAN {grp.groupCode}
                    </span>
                    <span className="text-[11px] font-mono text-[#8AB0A5]">
                      {grp.items.length} GERAKAN
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
                    {grp.groupTitle}
                  </h3>
                  <ul className="space-y-2">
                    {grp.items.map((ab) => (
                      <li
                        key={ab}
                        className="text-xs sm:text-sm text-[#D7EAE3] font-medium flex items-center gap-2 py-1 px-2.5 rounded-lg bg-[#061C18]/75 border border-white/5"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E3EF26] shrink-0" />
                        <span>{ab}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Penalty Rules & Direct Juklak Download Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 rounded-[26px] bg-[#092922]/90 border border-[#076653]/75 p-6 sm:p-7 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 mb-4">
              <AlertTriangle className="w-4 h-4 text-[#E3EF26]" />
              <h3 className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-white">
                Ketentuan Pengurangan Nilai (Penalti LKBB AGP-III)
              </h3>
            </div>
            <div className="space-y-2.5">
              {LKBB_PENALTIES.map((p) => (
                <div
                  key={p.code}
                  className="p-3.5 rounded-xl bg-[#061C18]/90 border border-[#076653]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <span className="text-[#D7EAE3] leading-relaxed">{p.rule}</span>
                  <span className="px-3 py-1 rounded-full bg-[#0C342C] border border-[#E3EF26]/45 font-mono font-bold text-[#E3EF26] shrink-0 self-start sm:self-center">
                    {p.deduction}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Direct Download Juklak Card */}
          <div className="lg:col-span-4 rounded-[26px] bg-gradient-to-br from-[#0C342C] via-[#092922] to-[#061A15] border border-[#E3EF26]/55 p-6 sm:p-7 flex flex-col justify-between shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E3EF26] text-[#0C342C] flex items-center justify-center shadow-[0_0_24px_rgba(227,239,38,0.35)]">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#E3EF26]">
                BERKAS RESMI SANGGA KERJA
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Unduh Juklak &amp; Formulir AGP-III (PDF)
              </h3>
              <p className="text-xs sm:text-sm text-[#94B8AE] leading-relaxed">
                Berisi surat undangan resmi, daftar 106 piala kejuaraan, denah kavling
                20x12m, formulir pendaftaran regu, format barisan LKBB, dan form Fashion Show.
              </p>
            </div>

            <div className="pt-6 space-y-2.5">
              <a
                href={JUKLAK_PDF_URL}
                download={JUKLAK_DOWNLOAD_NAME}
                className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-full bg-[#E3EF26] text-[#0C342C] text-xs sm:text-sm font-extrabold tracking-wide hover:bg-[#eef842] transition-all shadow-[0_10px_28px_rgba(227,239,38,0.28)]"
              >
                <Download className="w-4 h-4" />
                <span>Download Juklak PDF Sekarang</span>
              </a>
              <a
                href={JUKLAK_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#061C18] border border-[#076653] text-xs font-semibold text-[#D7EAE3] hover:border-[#E3EF26] transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-[#E3EF26]" />
                <span>Buka Pratinjau PDF di Tab Baru</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          6. SCENE 05 — EVENT TIMELINE SECTION (#timeline)
         ===================================================================== */}
      <section
        id="timeline"
        className="relative z-10 py-20 sm:py-28 px-4 sm:px-8 max-w-[1440px] mx-auto border-t border-[#076653]/35"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#092922] border border-[#076653]/70 text-[11px] font-mono uppercase tracking-[0.18em] text-[#E3EF26] mb-3">
              <Clock className="w-3.5 h-3.5" />
              <span>04 / JADWAL RESMI SANGGA KERJA</span>
            </div>
            <MaskRevealLine duration={enterDuration}>
              <h2 className="text-[clamp(1.85rem,4vw,3.5rem)] font-black tracking-[-0.03em] text-white">
                Tahapan Pelaksanaan <span className="text-[#E3EF26]">AGP-III.</span>
              </h2>
            </MaskRevealLine>
          </div>
          <p className="text-sm text-[#94B8AE] max-w-md">
            Bertempat di Kampus SMK Negeri 1 Soreang (Jl. Nyalindung No. 1, Kec. Soreang,
            Kab. Bandung).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TIMELINE_DATA.map((item, idx) => {
            const isMain = item.status === 'HARI-H UTAMA' || item.status === 'PERIODE I';
            return (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: enterDuration,
                  delay: idx * 0.06,
                  ease: EASE_AWWWARDS,
                }}
                className={`rounded-[24px] p-6 border backdrop-blur-xl flex flex-col justify-between ${isMain
                  ? 'bg-[#0C342C]/90 border-[#E3EF26]/55 shadow-[0_18px_40px_rgba(0,0,0,0.5)]'
                  : 'bg-[#092922]/75 border-[#076653]/60'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <span className="text-xs font-mono font-bold text-[#E3EF26]">
                      TAHAP {item.step}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-[0.14em] ${isMain
                        ? 'bg-[#E3EF26] text-[#0C342C] font-bold'
                        : 'bg-[#0C342C] text-[#94B8AE] border border-[#076653]'
                        }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <div className="text-xs font-mono uppercase tracking-[0.12em] text-[#8AB0A5] mb-2">
                    {item.date}
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight leading-snug">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-[#94B8AE] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#076653]/40 flex items-center justify-between text-xs text-[#C6E0D8]">
                  <span>SMKN 1 Soreang</span>
                  <CheckCircle2 className="w-4 h-4 text-[#E3EF26]" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          7. SCENE 06 — FAQ ACCORDION & NARAHUBUNG SANGGA KERJA (#faq)
         ===================================================================== */}
      <section
        id="faq"
        className="relative z-10 py-20 sm:py-28 px-4 sm:px-8 max-w-[1440px] mx-auto border-t border-[#076653]/35"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#092922] border border-[#076653]/70 text-[11px] font-mono uppercase tracking-[0.18em] text-[#E3EF26]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>05 / KETENTUAN &amp; NARAHUBUNG</span>
            </div>
            <MaskRevealLine duration={enterDuration}>
              <h2 className="text-[clamp(1.85rem,3.8vw,3.25rem)] font-black tracking-[-0.03em] leading-tight text-white">
                Informasi Resmi <span className="text-[#E3EF26]">Peserta.</span>
              </h2>
            </MaskRevealLine>
            <p className="text-sm sm:text-base text-[#94B8AE] leading-relaxed">
              Ketentuan pendaftaran, tata tertib perlombaan, serta kontak narahubung resmi
              Sangga Kerja AGP-III SMK Negeri 1 Soreang.
            </p>

            {/* Contact Persons Card */}
            <div className="rounded-2xl bg-[#092922]/90 border border-[#076653]/70 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#E3EF26]">
                <Phone className="w-3.5 h-3.5" />
                <span>NARAHUBUNG SANGGA KERJA (WHATSAPP)</span>
              </div>
              <div className="space-y-2 text-xs sm:text-sm text-[#D7EAE3]">
                <div className="flex items-center justify-between py-1.5 border-b border-[#076653]/40">
                  <span className="font-semibold text-white">Kak Redittia</span>
                  <span className="font-mono text-[#E3EF26]">0821-1523-5323</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-[#076653]/40">
                  <span className="font-semibold text-white">Kak Bayu</span>
                  <span className="font-mono text-[#E3EF26]">0831-2860-3800</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="font-semibold text-white">Kak Naza</span>
                  <span className="font-mono text-[#E3EF26]">0812-2455-0525</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3.5">
            {FAQ_DATA.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-colors duration-300 ${isOpen
                    ? 'bg-[#0C342C]/90 border-[#E3EF26]/55'
                    : 'bg-[#092922]/75 border-[#076653]/60 hover:border-[#076653]'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span className="text-sm sm:text-base font-bold text-white">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 text-[#E3EF26] shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: EASE_AWWWARDS }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-5 text-sm text-[#A9C6BE] leading-relaxed border-t border-[#076653]/40 pt-4">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================================
          8. CLEAN AWWWARDS FOOTER
         ===================================================================== */}
      <footer className="relative z-10 border-t border-[#076653]/35 bg-[#061A15] pt-16 pb-10 px-4 sm:px-8">
        <div className="max-w-[1440px] mx-auto space-y-12">
          {/* Top CTA Card */}
          <div className="rounded-[28px] bg-[#092922]/90 border border-[#076653]/70 p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 backdrop-blur-xl">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-[#E3EF26]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E3EF26]" />
                PORTAL LIVE ARENA &amp; JUKLAK AGP-III
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Siap Mengikuti &amp; Memantau AGP-III SMKN 1 Soreang?
              </h3>
              <p className="text-sm text-[#94B8AE] leading-relaxed">
                Unduh berkas Juklak resmi (PDF) atau masuk ke Portal Live Arena untuk
                memantau giliran waktu tampil, ruangan barak, dan pengumuman juara.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href={JUKLAK_PDF_URL}
                download={JUKLAK_DOWNLOAD_NAME}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#E3EF26] text-[#0C342C] text-xs sm:text-sm font-extrabold tracking-wide hover:bg-[#eef842] transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Juklak PDF</span>
              </a>
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#0C342C] border border-[#076653] text-xs sm:text-sm font-semibold text-white hover:border-[#E3EF26] transition-colors"
              >
                <Radio className="w-4 h-4 text-[#E3EF26]" />
                <span>Waktu Tampil</span>
              </Link>
              <Link
                href="/barack"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#0C342C] border border-[#076653] text-xs sm:text-sm font-semibold text-white hover:border-[#E3EF26] transition-colors"
              >
                <MapPin className="w-4 h-4 text-[#E3EF26]" />
                <span>Lokasi Barak</span>
              </Link>
              <Link
                href="/live-score"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#0C342C] border border-[#076653] text-xs sm:text-sm font-semibold text-white hover:border-[#E3EF26] transition-colors"
              >
                <Trophy className="w-4 h-4 text-[#E3EF26]" />
                <span>Pengumuman Juara</span>
              </Link>
            </div>
          </div>

          {/* Bottom Clean Bar */}
          <div className="pt-6 border-t border-[#076653]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8AB0A5]">
            <div className="flex items-center gap-3">
              <img
                src="/kirani.svg"
                alt="Logo Kirani AGP-III"
                className="w-9 h-9 object-contain shrink-0 drop-shadow-[0_2px_8px_rgba(227,239,38,0.22)]"
              />
              <span className="font-bold text-white tracking-wider uppercase">
                KIRANI AGP-III
              </span>
              <span className="text-[#076653]">•</span>
              <span>Basis SMK Negeri 1 Soreang Kab. Bandung</span>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-[#8AB0A5]">
              <button
                type="button"
                onClick={() => scrollToSection('home', 'HOME')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Beranda
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('explore', 'EXPLORE')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Mata Lomba
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('aba-aba', 'ABA_ABA')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Aba-Aba LKBB
              </button>
              <button
                type="button"
                onClick={() => scrollToSection('timeline', 'TIMELINE')}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Jadwal
              </button>
              <a
                href={JUKLAK_PDF_URL}
                download={JUKLAK_DOWNLOAD_NAME}
                className="text-[#E3EF26] hover:underline font-semibold"
              >
                Unduh Juklak
              </a>
            </div>

            <span className="text-[#7FA69A]">
              © Sangga Kerja AGP-III SMKN 1 Soreang. Hak Cipta Dilindungi.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
