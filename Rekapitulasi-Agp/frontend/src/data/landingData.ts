export const JUKLAK_PDF_URL = '/Juklak_AGP_IV_SMKN1_Soreang.pdf';
export const JUKLAK_DOWNLOAD_NAME = 'Juklak_Resmi_AGP_IV_SMKN1_Soreang.pdf';

export type ShowcaseCategory = 'ALL' | 'PERIODE_1' | 'PERIODE_2' | 'PERIODE_3' | 'PERIODE_4';

export interface HeroStat {
  label: string;
  value: string;
  desc?: string;
}

export interface HeroHighlightCard {
  id: string;
  code: string;
  category: string;
  title: string;
  subtitle: string;
  metric: string;
  imageUrl: string;
  accent?: boolean;
}

export interface PortalAccessCard {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  badge: string;
  href: string;
  imageUrl: string;
  isDownload?: boolean;
}

export interface ShowcaseCardItem {
  id: string;
  code: string;
  category: Exclude<ShowcaseCategory, 'ALL'>;
  categoryLabel: string;
  title: string;
  subtitle: string;
  weightLabel: string;
  arenaLabel: string;
  description: string;
  tags: string[];
  imageUrl: string;
  highlight?: boolean;
}

export interface AbaAbaGroup {
  groupCode: string;
  groupTitle: string;
  items: string[];
}

export interface LkbbPenalty {
  code: string;
  rule: string;
  deduction: string;
}

export interface TimelineItem {
  step: string;
  date: string;
  title: string;
  description: string;
  status: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ContactPerson {
  name: string;
  phone: string;
  role: string;
}

// ==========================================
// DATA COLLECTIONS
// ==========================================

export const HERO_STATS: HeroStat[] = [
  { label: 'KUOTA MAKSIMAL', value: '50 Basis', desc: 'Penggalang & Penegak' },
  { label: 'PIALA KEJUARAAN', value: '106 Piala', desc: 'Bergilir & Tetap' },
  { label: 'PASUKAN LKBB', value: '16 Orang', desc: 'Termasuk Danton' },
  { label: 'ANGGOTA REGU', value: '8 Orang', desc: 'Putra / Putri / Campuran' },
];

export const HERO_HIGHLIGHTS: HeroHighlightCard[] = [
  {
    id: 'highlight-01',
    code: 'P-IV',
    category: 'LKBB PERBASIS',
    title: 'PBB Dasar, Variasi & Danton',
    subtitle: '16 Orang/Basis • Lapangan 20x12m',
    metric: '70% PBB • 20% Vafor • 10% Danton',
    imageUrl: '/images/landing/card-lkbb.jpg',
  },
  {
    id: 'highlight-02',
    code: 'P-II',
    category: 'KONSTRUKSI',
    title: 'Mini Pionering Bendera',
    subtitle: '8 Sumpit • Durasi 10 Menit',
    metric: 'Stiker Hijau / Kuning / Merah',
    imageUrl: '/images/landing/card-pionering.jpg',
  },
  {
    id: 'highlight-03',
    code: '106 PIALA',
    category: 'PIALA UTAMA',
    title: 'Piala Bergilir & Tetap AGP',
    subtitle: 'SD (A), SMP (B), SMA (C)',
    metric: 'Juara Umum & Kategori',
    imageUrl: '/images/landing/card-trophy.jpg',
    accent: true,
  },
  {
    id: 'highlight-04',
    code: 'P-II',
    category: 'ISYARAT TAKTIS',
    title: 'Semaphore & Morse',
    subtitle: '10 Kata Acak • Ruang Kelas',
    metric: 'SD 8 • SMP 12 • SMA 15 WPM',
    imageUrl: '/images/landing/card-sandi.jpg',
  },
  {
    id: 'highlight-05',
    code: 'P-II',
    category: 'WAWASAN',
    title: 'Bank Soal 100 PG',
    subtitle: 'PK, PU, PA, BIK & Sandi',
    metric: '5 Orang/Regu • 15 Menit',
    imageUrl: '/images/landing/card-knowledge.jpg',
  },
];

export const PORTAL_CARDS: PortalAccessCard[] = [
  {
    id: 'portal-1',
    code: 'PORTAL 01',
    title: 'Live Urutan Tampil',
    subtitle: 'Pantau antrean kavling 20x12m secara real-time',
    badge: 'SEDANG TAMPIL',
    href: '/schedule',
    imageUrl: '/images/landing/card-lkbb.jpg',
  },
  {
    id: 'portal-2',
    code: 'PORTAL 02',
    title: 'Direktori Barak',
    subtitle: 'Pencarian lokasi ruang transit SMKN 1 Soreang',
    badge: 'KUOTA 50 BASIS',
    href: '/barack',
    imageUrl: '/images/landing/card-pionering.jpg',
  },
  {
    id: 'portal-3',
    code: 'PORTAL 03',
    title: 'Klasemen & Nilai',
    subtitle: 'Transparansi rekapitulasi nilai akhir & pengumuman juara',
    badge: 'NILAI RESMI',
    href: '/live-score',
    imageUrl: '/images/landing/card-trophy.jpg',
  },
  {
    id: 'portal-4',
    code: 'JUKLAK RESMI',
    title: 'Unduh Juklak PDF',
    subtitle: 'Petunjuk pelaksanaan & formulir pendaftaran resmi',
    badge: 'PDF 12 HALAMAN',
    href: JUKLAK_PDF_URL,
    imageUrl: '/images/landing/card-sandi.jpg',
    isDownload: true,
  },
];

export const SHOWCASE_ITEMS: ShowcaseCardItem[] = [
  {
    id: 'sc-01',
    code: 'P-IV / 01',
    category: 'PERIODE_4',
    categoryLabel: 'Periode IV • Utama',
    title: 'LKBB (PBB Dasar, Variasi Formasi & Danton)',
    subtitle: 'Acuan PERPANG TNI Nomor 58 Tahun 2018 • Dewan Juri TNI, Polisi & Satlak PBB',
    weightLabel: '70% PBB • 20% Variasi • 10% Danton',
    arenaLabel: 'Lapangan Utama 20 x 12 m',
    description:
      'Dilaksanakan per basis (16 orang termasuk Danton; Putra, Putri, atau Campuran) dengan durasi 8 menit. PBB Dasar dilaksanakan tanpa membawa tongkat dan seluruh aba-aba wajib dihafal secara berurutan.',
    tags: ['16 Orang/Basis', 'Durasi 8 Menit', 'PERPANG TNI No. 58/2018'],
    imageUrl: '/images/landing/card-lkbb.jpg',
    highlight: true,
  },
  {
    id: 'sc-02',
    code: 'P-II / 02',
    category: 'PERIODE_2',
    categoryLabel: 'Periode II • Konstruksi',
    title: 'Mini Pionering "Bendera"',
    subtitle: 'Kerapihan, Ketepatan Simpul & Ikatan, Kekuatan serta Kecepatan',
    weightLabel: '1 Orang/Regu • 10 Menit',
    arenaLabel: 'Arena Lapangan Terbuka',
    description:
      'Peserta membawa 8 batang sumpit, benang kasur, dan bendera kecil identitas regu/sangga & basis. Penyelesaian menit 3–4 mendapat Stiker Hijau, menit 5–6 Stiker Kuning, dan menit 7–8 Stiker Merah.',
    tags: ['8 Batang Sumpit', 'Stiker Waktu 3-4 Menit', 'Simpul & Kekuatan'],
    imageUrl: '/images/landing/card-pionering.jpg',
  },
  {
    id: 'sc-03',
    code: 'P-II / 03',
    category: 'PERIODE_2',
    categoryLabel: 'Periode II • Isyarat',
    title: 'Semaphore & Morse (Putra / Putri)',
    subtitle: '1 Kalimat Acak (10 Kata) • Penilaian Per Kata • Huruf Kapital',
    weightLabel: '1 Orang/Regu per Lomba',
    arenaLabel: 'Ruang Kelas SMKN 1 Soreang',
    description:
      'Semaphore disajikan melalui video proyektor (waktu salin 2 menit). Morse disajikan melalui audio (SD/MI 8 WPM, SMP/MTs 12 WPM, SMA/SMK 15 WPM; waktu salin 3 menit) dengan 1x pengulangan soal.',
    tags: ['Semaphore Proyektor 2 Menit', 'Morse 8/12/15 WPM', '10 Kata Acak'],
    imageUrl: '/images/landing/card-sandi.jpg',
  },
  {
    id: 'sc-04',
    code: 'P-II / 04',
    category: 'PERIODE_2',
    categoryLabel: 'Periode II • Wawasan Akademik',
    title: 'Bank Soal (PK, PU, PA, BIK, Sandi-Sandi)',
    subtitle: '100 Soal Pilihan Ganda via Google Form • Estafet 5 Orang/Regu',
    weightLabel: '5 Orang/Regu • 15 Menit',
    arenaLabel: 'Lapangan Upacara',
    description:
      'Dilaksanakan langsung setelah upacara pembukaan menggunakan 1 smartphone per regu. Setiap peserta dari 5 perwakilan mendapat giliran waktu 3 menit secara estafet (total 15 menit).',
    tags: ['100 Soal PG', 'Estafet 3 Menit x 5 Orang', 'Google Form'],
    imageUrl: '/images/landing/card-knowledge.jpg',
  },
  {
    id: 'sc-05',
    code: 'P-III / 05',
    category: 'PERIODE_3',
    categoryLabel: 'Periode III • Kreativitas',
    title: 'Fashion Show Kreasi Barang Bekas',
    subtitle: 'Kreativitas Kostum Daur Ulang, Aksi Panggung & Blocking Pose',
    weightLabel: '2 Orang/Basis (PA/PI/Campuran)',
    arenaLabel: 'Panggung Utama AGP',
    description:
      'Menggunakan kostum unik berbahan dasar daur ulang (kain perca, karung, koran, kantong plastik, dll). Urutan tampil beriringan dengan nomor urut peserta LKBB dari jenjang SD/MI, SMP/MTs, hingga SMA/SMK/MA.',
    tags: ['Kostum Daur Ulang', 'Aksi Panggung', 'Blocking Pose'],
    imageUrl: '/images/landing/card-trophy.jpg',
  },
  {
    id: 'sc-06',
    code: 'P-I & IV / 06',
    category: 'PERIODE_1',
    categoryLabel: 'Periode I & IV • Administrasi & Barak',
    title: 'Administrasi Regu, Foto Kreasi & Kebersihan Barak',
    subtitle: '7 Komponen Berkas Airmail 310, Foto IG @kiranicrew_official & Evaluasi Barak',
    weightLabel: 'Administrasi 100 Poin • Kebersihan 100 Poin',
    arenaLabel: 'Sekretariat & Ruang Barak',
    description:
      'Penilaian kelengkapan berkas administrasi dalam amplop kabinet Airmail No. 310, lomba Foto Ekspresi Pramuka di akun Instagram @kiranicrew_official, serta inspeksi kebersihan barak secara berkala.',
    tags: ['Amplop Airmail 310', 'Instagram @kiranicrew_official', 'Inspeksi Barak 2 Tahap'],
    imageUrl: '/images/landing/card-pionering.jpg',
  },
];

export const ABA_ABA_SD_GROUPS: AbaAbaGroup[] = [
  {
    groupCode: 'A',
    groupTitle: 'Gerakan Berkumpul',
    items: ['1. Bersaf Kumpul'],
  },
  {
    groupCode: 'B',
    groupTitle: 'Gerakan Di Tempat',
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
    groupTitle: 'Gerakan Berpindah Tempat',
    items: [
      '15. 4 Langkah ke Belakang',
      '16. 3 Langkah ke Depan',
      '17. 4 Langkah ke Kiri',
      '18. 3 Langkah ke Kanan',
    ],
  },
  {
    groupCode: 'D',
    groupTitle: 'Gerakan Diam ke Berjalan',
    items: ['19. Langkah Perlahan', '20. Langkah Biasa', '21. Langkah Lari'],
  },
  {
    groupCode: 'E',
    groupTitle: 'Gerakan Berjalan ke Berjalan',
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
    groupTitle: 'Variasi / Formasi & Gerakan Bubar',
    items: ['F. Variasi / Formasi Pasukan', '27. Bubar'],
  },
];

export const ABA_ABA_SMP_SMA_GROUPS: AbaAbaGroup[] = [
  {
    groupCode: 'A',
    groupTitle: 'Gerakan Berkumpul',
    items: ['1. Bersaf Kumpul'],
  },
  {
    groupCode: 'B',
    groupTitle: 'Gerakan Di Tempat',
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
    groupTitle: 'Gerakan Berpindah Tempat',
    items: ['15. 4 Langkah ke Belakang', '16. 3 Langkah ke Depan'],
  },
  {
    groupCode: 'I',
    groupTitle: 'Gerakan Diam ke Berjalan',
    items: ['17. Langkah Perlahan', '18. Langkah Biasa', '19. Langkah Tegap'],
  },
  {
    groupCode: 'J',
    groupTitle: 'Gerakan Berjalan ke Berjalan',
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
    groupTitle: 'Variasi / Formasi & Gerakan Bubar',
    items: ['K. Variasi / Formasi Pasukan', '28. Bubar'],
  },
];

export const LKBB_PENALTIES: LkbbPenalty[] = [
  {
    code: 'PENALTI 01',
    rule: 'Tidak memasuki Daerah Persiapan (DP) setelah dipanggil 3x berturut-turut (urutan dipindah ke akhir)',
    deduction: '-100 Poin',
  },
  {
    code: 'PENALTI 02',
    rule: 'Pasukan pada saat memasuki Daerah Persiapan dan tampil tidak lengkap (kurang dari 16 orang)',
    deduction: '-150 Poin / Orang',
  },
  {
    code: 'PENALTI 03',
    rule: 'Melebihi batas waktu tampil (lebih dari 8 menit, berlaku akumulasi kelipatan)',
    deduction: '-5 Poin / 10 Detik',
  },
  {
    code: 'PENALTI 04',
    rule: 'Melewati atau menginjak garis batas kavling lapangan perlombaan (20 x 12 meter)',
    deduction: '-5 Poin / Orang',
  },
  {
    code: 'PENALTI 05',
    rule: 'Pembina atau pihak pendukung memberi instruksi / aba-aba kepada peserta saat tampil',
    deduction: '-50 Poin',
  },
];

export const TIMELINE_DATA: TimelineItem[] = [
  {
    step: '01',
    date: '06 Nov 2024 – 08 Feb 2025',
    title: 'Pendaftaran Basis & Lomba Foto Kreasi IG',
    description:
      'Pendaftaran di Sekretariat SMKN 1 Soreang (Senin–Sabtu 10.00–16.00 WIB, kuota 50 Basis, Rp 350.000/Regu via BJB 0025448987100 a.n. Santika Yunita). Batas upload foto IG @kiranicrew_official sampai 14 Feb 2025.',
    status: 'Periode Awal',
  },
  {
    step: '02',
    date: 'Sabtu, 08 Feb 2025 (08.00–12.00 WIB)',
    title: 'Jumpa Teknik (Technical Meeting)',
    description:
      'Dilaksanakan di Kampus SMK Negeri 1 Soreang. Masing-masing Basis wajib diwakili oleh 1 orang Pembina dan 1 orang Peserta lomba.',
    status: 'Jumpa Teknik',
  },
  {
    step: '03',
    date: 'Sabtu, 15 Feb 2025 (09.00–15.00 WIB)',
    title: 'Periode I: Daftar Ulang Ke-1 & Penilaian Administrasi',
    description:
      'Pengumpulan amplop kabinet Airmail No. 310 berisi 7 komponen administrasi lengkap (Formulir, Kwitansi, KTA, BPJS, Surat Mandat, Izin Orang Tua, Bumbung Kemanusiaan — Total bobot 100 Poin).',
    status: 'Periode I',
  },
  {
    step: '04',
    date: 'Sabtu, 22 Feb 2025 (06.00 WIB – Selesai)',
    title: 'Hari Utama: Pelaksanaan Periode II, III, & IV',
    description:
      'Daftar ulang regu lengkap (06.00–06.45 WIB), Upacara Pembukaan, Bank Soal, Semaphore, Morse, Mini Pionering, LKBB Utama, Fashion Show Daur Ulang, dan Upacara Penutupan / Pengumuman 106 Piala.',
    status: 'Hari Utama',
  },
];

export const FAQ_DATA: FaqItem[] = [
  {
    q: 'Berapa jumlah anggota setiap Regu/Sangga dan Pasukan LKBB di AGP?',
    a: 'Setiap Regu/Sangga terdiri dari 8 orang (tiap Basis mengirimkan minimal 2 Regu/Sangga). Khusus untuk mata lomba LKBB (PBB Dasar & Variasi) dilaksanakan Per Basis yang diwakili oleh 16 orang termasuk Danton (dapat terdiri dari Putra saja, Putri saja, atau Campuran).',
  },
  {
    q: 'Bagaimana rincian biaya pendaftaran dan nomor rekening resmi panitia?',
    a: 'Biaya pendaftaran sebesar Rp 350.000,- (Tiga Ratus Lima Puluh Ribu Rupiah) tiap Regu/Sangga. Pembayaran dapat ditransfer melalui Bank BJB No. Rekening 0025448987100 a.n. Santika Yunita, atau tunai di Sekretariat Kampus SMK Negeri 1 Soreang (Jl. Nyalindung No. 1, Kec. Soreang, Kab. Bandung).',
  },
  {
    q: 'Bagaimana pembagian bobot nilai Juara Umum LKBB dan aturan aba-aba PBB?',
    a: 'Juara Umum LKBB merupakan gabungan dari 70% PBB Dasar, 20% Variasi Formasi, dan 10% Danton dengan acuan resmi PERPANG TNI Nomor 58 Tahun 2018 (Dewan Juri independen dari unsur TNI, Polisi, dan Satlak PBB). Seluruh aba-aba wajib dihafal dan diperagakan secara berurutan tanpa membaca naskah.',
  },
  {
    q: 'Bagaimana mekanisme pengajuan protes dan siapa narahubung resmi panitia?',
    a: 'Pengajuan protes hanya dilayani maksimal 3 jam setelah pengumuman hasil kejuaraan oleh Pembina yang menghadiri Jumpa Teknik dengan melampirkan Surat Pengajuan Protes resmi dan bukti otentik. Informasi lebih lanjut hubungi narahubung resmi Sangga Kerja.',
  },
];

export const CONTACT_PERSONS: ContactPerson[] = [
  { name: 'Kak Redittia', phone: '0821-1523-5323', role: 'Koordinator Acara' },
  { name: 'Kak Bayu', phone: '0831-2860-3800', role: 'Sekretariat Pendaftaran' },
  { name: 'Kak Naza', phone: '0812-2455-0525', role: 'Teknis Lapangan' },
];

