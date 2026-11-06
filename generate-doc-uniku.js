const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType,
  convertInchesToTwip,
  Header,
  Footer,
  PageNumber,
} = require('./Rekapitulasi-Agp/node_modules/docx');

const LOGO_PATH = 'C:/Users/AldiPrinaldi/laporan_generator/logo_0.jpg';
const FONT_NAME = 'Times New Roman';
const COLOR_PRIMARY = '076653'; // Emerald brand accent
const COLOR_DARK = '000000';
const COLOR_MUTED = '4A5568';
const COLOR_BORDER = 'CCCCCC';

function p(text = '', opts = {}) {
  const {
    bold = false,
    italic = false,
    size = 24, // 12pt
    align = AlignmentType.JUSTIFIED,
    spaceBefore = 0,
    spaceAfter = 120, // 6pt
    line = 360, // 1.5 spacing
  } = opts;

  return new Paragraph({
    alignment: align,
    spacing: { before: spaceBefore, after: spaceAfter, line },
    children: [
      new TextRun({
        text,
        font: FONT_NAME,
        size,
        bold,
        italics: italic,
        color: opts.color || COLOR_DARK,
      }),
    ],
  });
}

function pEmpty(space = 240) {
  return new Paragraph({
    spacing: { before: 0, after: space },
    children: [],
  });
}

function bullet(prefix, desc) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 40, after: 100, line: 360 },
    indent: { left: 400, hanging: 240 },
    children: [
      new TextRun({ text: '• ', font: FONT_NAME, size: 24, bold: true, color: COLOR_PRIMARY }),
      new TextRun({ text: prefix + ': ', font: FONT_NAME, size: 24, bold: true, color: COLOR_DARK }),
      new TextRun({ text: desc, font: FONT_NAME, size: 24, color: COLOR_DARK }),
    ],
  });
}

function headingMajor(title) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 300, after: 140, line: 360 },
    children: [
      new TextRun({
        text: title,
        font: FONT_NAME,
        size: 28, // 14pt
        bold: true,
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function headingSub(title) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 200, after: 100, line: 360 },
    children: [
      new TextRun({
        text: title,
        font: FONT_NAME,
        size: 25, // 12.5pt
        bold: true,
        color: COLOR_DARK,
      }),
    ],
  });
}

function tableCell(text, opts = {}) {
  const { isHeader = false, bold = false, align = AlignmentType.LEFT, widthPercent = null } = opts;

  return new TableCell({
    width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
    shading: isHeader
      ? { type: ShadingType.CLEAR, fill: COLOR_PRIMARY }
      : opts.bgColor
      ? { type: ShadingType.CLEAR, fill: opts.bgColor }
      : undefined,
    margins: { top: 120, bottom: 120, left: 140, right: 140 },
    borders: {
      left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
    },
    children: [
      new Paragraph({
        alignment: align,
        spacing: { before: 0, after: 0, line: 260 },
        children: [
          new TextRun({
            text,
            font: FONT_NAME,
            size: isHeader ? 22 : 22,
            bold: isHeader || bold,
            color: isHeader ? 'FFFFFF' : COLOR_DARK,
          }),
        ],
      }),
    ],
  });
}

function screenshotSlot(title, instruction) {
  const cell = new TableCell({
    shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
    borders: {
      left: { style: BorderStyle.DASHED, size: 8, color: '076653' },
      right: { style: BorderStyle.DASHED, size: 8, color: '076653' },
      top: { style: BorderStyle.DASHED, size: 8, color: '076653' },
      bottom: { style: BorderStyle.DASHED, size: 8, color: '076653' },
    },
    margins: { top: 220, bottom: 220, left: 200, right: 200 },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 60, line: 300 },
        children: [
          new TextRun({
            text: `[ TEMPAT TANGKAPAN LAYAR: ${title.toUpperCase()} ]`,
            font: FONT_NAME,
            size: 22,
            bold: true,
            color: COLOR_PRIMARY,
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 0, line: 280 },
        children: [
          new TextRun({
            text: instruction,
            font: FONT_NAME,
            size: 20,
            italics: true,
            color: COLOR_MUTED,
          }),
        ],
      }),
    ],
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [cell] })],
  });
}

async function generateUnikuDocx() {
  const logoData = fs.readFileSync(LOGO_PATH);

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: FONT_NAME,
            size: 24,
            color: COLOR_DARK,
          },
        },
      },
    },
    sections: [
      // ================= SECTION 1: COVER PAGE =================
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: [
          pEmpty(100),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60, line: 300 },
            children: [
              new TextRun({
                text: 'TUGAS PROJECT',
                font: FONT_NAME,
                size: 30, // 15pt
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60, line: 300 },
            children: [
              new TextRun({
                text: 'PENGEMBANGAN & PENGAMANAN APLIKASI WEB',
                font: FONT_NAME,
                size: 30,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 80, line: 300 },
            children: [
              new TextRun({
                text: 'MATA KULIAH CYBER SECURITY',
                font: FONT_NAME,
                size: 26,
                bold: true,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 260, line: 320 },
            children: [
              new TextRun({
                text: 'Rancang Bangun & Pengamanan Sistem Rekapitulasi Nilai & Manajemen Arena Terpadu (KIRANI AGP-III) Berbasis Cloud',
                font: FONT_NAME,
                size: 24,
                italics: true,
              }),
            ],
          }),

          pEmpty(200),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 200 },
            children: [
              new ImageRun({
                data: logoData,
                transformation: { width: 140, height: 146 },
              }),
            ],
          }),
          pEmpty(240),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40, line: 300 },
            children: [new TextRun({ text: 'Disusun Oleh :', font: FONT_NAME, size: 24, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40, line: 300 },
            children: [
              new TextRun({
                text: 'MUHAMAD PRINALDI KHOIRUL ANAM',
                font: FONT_NAME,
                size: 26,
                bold: true,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40, line: 300 },
            children: [new TextRun({ text: '20240810049', font: FONT_NAME, size: 24, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 400, line: 300 },
            children: [new TextRun({ text: 'TINFC-2024-02', font: FONT_NAME, size: 24, bold: true })],
          }),

          pEmpty(200),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40, line: 300 },
            children: [new TextRun({ text: 'PRODI TEKNIK INFORMATIKA', font: FONT_NAME, size: 26, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40, line: 300 },
            children: [new TextRun({ text: 'FAKULTAS ILMU KOMPUTER', font: FONT_NAME, size: 26, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40, line: 300 },
            children: [new TextRun({ text: 'UNIVERSITAS KUNINGAN', font: FONT_NAME, size: 26, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0, line: 300 },
            children: [new TextRun({ text: '2026', font: FONT_NAME, size: 24, bold: true })],
          }),
        ],
      },

      // ================= SECTION 2: ISI LAPORAN (1 s/d 10) =================
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: [
          headingMajor('1. Identitas Mahasiswa'),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  tableCell('Nama Lengkap', { bold: true, widthPercent: 32 }),
                  tableCell('Muhamad Prinaldi Khoirul Anam', { widthPercent: 68 }),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('Nomor Induk Mahasiswa (NIM)', { bold: true }),
                  tableCell('20240810049'),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('Kelas', { bold: true }),
                  tableCell('TINFC-2024-02'),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('Program Studi', { bold: true }),
                  tableCell('Teknik Informatika'),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('Fakultas / Universitas', { bold: true }),
                  tableCell('Fakultas Ilmu Komputer / Universitas Kuningan (UNIKU)'),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('Mata Kuliah', { bold: true }),
                  tableCell('Cyber Security (Pra-UTS)'),
                ],
              }),
            ],
          }),

          p('', { spaceAfter: 160 }),

          headingMajor('2. URL Aplikasi Aktif'),
          p(
            'Aplikasi web telah berhasil dipublikasikan dan beroperasi aktif secara online pada arsitektur cloud ber-domain publik FQDN dengan sertifikat SSL/TLS HTTPS valid:'
          ),
          bullet(
            'URL Portal Utama (Live Production)',
            'https://www.kiraniagp.my.id (Dapat diakses publik untuk melihat Live Leaderboard, Jadwal Tampil, dan Informasi Barak)'
          ),
          bullet(
            'URL Ruang Kendali Panitia (Admin Portal)',
            'https://www.kiraniagp.my.id/login (Akses resmi terotentikasi bagi panitia dan dewan rekapitulasi nilai)'
          ),
          bullet(
            'URL Peladen Backend API (Render Cloud)',
            'https://rekapitulasi-agp.onrender.com/health (Layanan API backend dengan status kesehatan aktif)'
          ),

          p('', { spaceAfter: 160 }),

          headingMajor('3. URL Repositori Git'),
          p(
            'Pengembangan aplikasi dikelola menggunakan version control Git dan diunggah pada repositori publik GitHub dengan riwayat commit bertahap:'
          ),
          bullet('URL Repositori GitHub', 'https://github.com/Prinaldi77/Rekapitulasi_Agp'),
          bullet('Branch Utama', 'main (Terintegrasi otomatis dengan CI/CD deployment Vercel)'),
          bullet(
            'README.md Terstruktur',
            'Tersedia lengkap di root repositori memuat deskripsi sistem, fitur, arsitektur, instalasi lokal, konfigurasi environment variable, dan ringkasan audit keamanan.'
          ),

          p('', { spaceAfter: 160 }),

          headingMajor('4. Akun Uji Coba Pengujian (Testing Accounts)'),
          p(
            'Untuk memfasilitasi pengujian oleh Dosen Pengampu terhadap seluruh hak akses Role-Based Access Control (RBAC), disediakan 3 akun uji coba resmi yang telah terkonfirmasi pada Supabase Auth:'
          ),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  tableCell('No', { isHeader: true, widthPercent: 8, align: AlignmentType.CENTER }),
                  tableCell('Tingkat Peran (Role)', { isHeader: true, widthPercent: 24 }),
                  tableCell('Username / Email', { isHeader: true, widthPercent: 26 }),
                  tableCell('Kata Sandi', { isHeader: true, widthPercent: 18 }),
                  tableCell('Hak Akses & Cakupan Fitur', { isHeader: true, widthPercent: 24 }),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('1', { align: AlignmentType.CENTER }),
                  tableCell('Super Admin (Grand Master)', { bold: true }),
                  tableCell('superadmin@email.com\natau: superadmin'),
                  tableCell('Password123!'),
                  tableCell('Akses penuh sistem: Manajemen Akun, Penugasan Role, Audit Logs, Backup/Restore data, Konfigurasi Global.'),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('2', { align: AlignmentType.CENTER, bgColor: 'F8FAFC' }),
                  tableCell('Admin (Master Data)', { bold: true, bgColor: 'F8FAFC' }),
                  tableCell('admin@email.com\natau: admin', { bgColor: 'F8FAFC' }),
                  tableCell('Password123!', { bgColor: 'F8FAFC' }),
                  tableCell('Pengelolaan Master Data: Kontingen Peserta, Kategori Lomba, Barak Istirahat, dan Penjadwalan Arena.', { bgColor: 'F8FAFC' }),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('3', { align: AlignmentType.CENTER }),
                  tableCell('Operator (PJ Rekap)', { bold: true }),
                  tableCell('operator@email.com\natau: operator'),
                  tableCell('Password123!'),
                  tableCell('Operasional Penilaian: Entri Nilai Dewan Juri, Pemindaian OCR Lembar Skor, Validasi Rekapitulasi, Ekspor Laporan Juara.'),
                ],
              }),
            ],
          }),

          p(
            'Catatan Pengujian: Formulir login panitia mendukung fleksibilitas input: Penguji dapat memasukkan alamat email lengkap (superadmin@email.com) maupun cukup mengetikkan username singkatnya (superadmin).',
            { italic: true, size: 22, color: COLOR_MUTED, spaceBefore: 80, spaceAfter: 160 }
          ),

          headingMajor('5. Penjelasan Aplikasi'),

          headingSub('a. Latar Belakang & Tujuan Aplikasi'),
          p(
            'Kompetisi Lomba Ketangkasan Baris-Berbaris (LKBB) tingkat nasional merupakan ajang perlombaan bergengsi yang melibatkan puluhan kontingen pelajar dengan ratusan kriteria penilaian teknis (PBB Murni, Variasi, Formasi, Komandan Peleton, dan Kostum). Rekapitulasi manual menggunakan spreadsheet offline memiliki kelemahan kritis: rawan tertimpa rumus, keterlambatan pengumuman juara, serta ketiadaan jejak audit jika terjadi sengketa nilai.'
          ),
          p(
            'KIRANI AGP-III (Komputasi & Informasi Rekapitulasi Angka Nilai Induk AGP) hadir sebagai sistem rekapitulasi nilai berbasis web terpadu untuk menghadirkan otomasi kalkulasi skor instan, transparansi papan peringkat langsung (Live Leaderboard), manajemen akomodasi barak, dan jaminan keamanan data bertingkat.'
          ),

          headingSub('b. Fitur Utama Aplikasi'),
          bullet(
            'Autentikasi & Otorisasi RBAC',
            'Pemisahan hak akses bertingkat antara Super Admin, Pengelola Master Data, dan Operator Entri Nilai yang diproteksi server-side via Next.js Middleware.'
          ),
          bullet(
            'Pengelolaan Data Terpadu (CRUD)',
            'Manajemen lengkap data peserta kontingen, penempatan gedung barak istirahat, giliran daerah persiapan (DP), dan formula bobot nilai juri.'
          ),
          bullet(
            'Scoring Engine & Live Leaderboard',
            'Formulir entri skor dengan validasi batas nilai otomatis, kalkulasi total agregat per juri, dan perangkingan live score real-time tanpa refresh halaman.'
          ),
          bullet(
            'Pusat Laporan & Ekspor Berkas',
            'Generator otomatis berkas resmi format PDF mencakup Lembar Rekapitulasi Nilai Akhir, Surat Keputusan (SK) Dewan Juri, serta Sertifikat Juara siap cetak.'
          ),
          bullet(
            'Audit Trail & Jejak Aktivitas',
            'Pencatatan riwayat perubahan nilai secara transparan mencakup timestamp, nama operator, dan nilai sebelum/sesudah perbaikan.'
          ),

          headingSub('c. Arsitektur & Teknologi yang Digunakan'),
          bullet(
            'Frontend Framework',
            'Next.js 16.4.5 (App Router, Turbopack, React 19, Tailwind CSS, Framer Motion) yang di-hosting pada Vercel Global Edge Network.'
          ),
          bullet(
            'Backend API Service',
            'Express.js & TypeScript yang berjalan di Render Cloud Web Service (https://rekapitulasi-agp.onrender.com) untuk penanganan layanan OCR dan health monitoring.'
          ),
          bullet(
            'Database & Identity Layer',
            'Supabase PostgreSQL Managed Cloud dengan integrasi Supabase Auth (JWT HttpOnly Session, Row Level Security, bcrypt password hashing).'
          ),
          bullet(
            'Domain & DNS Infrastructure',
            'Fully Qualified Domain Name (FQDN) https://www.kiraniagp.my.id dengan DNS Anycast DomaiNesia dan enkripsi sertifikat SSL/TLS valid (Let\'s Encrypt).'
          ),

          headingSub('d. Penerapan Keamanan (Cyber Security Implementation)'),
          bullet(
            'Penyimpanan Password Aman',
            'Kata sandi pengguna dienkripsi satu arah menggunakan algoritma hashing adaptif bcrypt dengan salt unik per user via Supabase Auth. Tidak ada password plaintext yang tersimpan di basis data.'
          ),
          bullet(
            'Pencegahan SQL Injection',
            'Interaksi basis data menggunakan PostgREST parameterized queries via Supabase Client SDK, mengeliminasi risiko perakitan query mentah berkarakter injeksi.'
          ),
          bullet(
            'Pencegahan Cross-Site Scripting (XSS)',
            'React 19 secara bawaan melakukan context-aware data escaping pada seluruh DOM rendering, diperkuat pembatasan Content-Security-Policy (CSP).'
          ),
          bullet(
            'Kontrol Akses Berlapis & IDOR Prevention',
            'Next.js Middleware memblokir akses rute /admin/* jika tidak memiliki sesi valid. Pada level basis data, kebijakan PostgreSQL Row Level Security (RLS) memastikan pengguna hanya dapat memodifikasi data sesuai peran mereka.'
          ),
          bullet(
            'Strict CORS Whitelist',
            'Backend Express menolak seluruh permintaan origin asing dan hanya mengizinkan origin resmi https://www.kiraniagp.my.id.'
          ),
          bullet(
            'OWASP HTTP Security Headers',
            'Dikonfigurasi pada next.config.ts: Strict-Transport-Security (HSTS 2 tahun preload), X-Frame-Options: DENY (anti-clickjacking), X-Content-Type-Options: nosniff, Referrer-Policy, dan Content-Security-Policy.'
          ),
          bullet(
            'Zero Secret Leakage',
            'Seluruh kunci API privat dan kredensial database diisolasi di Environment Variables peladen cloud Vercel dan Render. Tidak ada secret yang ter-commit di Git.'
          ),

          p('', { spaceAfter: 160 }),

          headingMajor('6. Potensi Pengembangan ke Skripsi'),
          bullet(
            'Rencana Judul Skripsi',
            'Rancang Bangun Sistem Rekapitulasi Penilaian Kompetisi Nasional Terintegrasi dengan Optical Character Recognition (OCR) dan Audit Trail Kriptografis Berbasis Web'
          ),
          bullet(
            'Rumusan Masalah 1',
            'Bagaimana merancang model pemrosesan citra (Computer Vision & OCR) yang adaptif terhadap variasi tulisan tangan dewan juri pada lembar skor fisik untuk mengotomasi input nilai secara cepat dan akurat?'
          ),
          bullet(
            'Rumusan Masalah 2',
            'Bagaimana mengimplementasikan mekanisme audit trail kriptografis (hash chaining / immutable log) guna menjamin keaslian data nilai rekapitulasi dari potensi modifikasi pihak internal?'
          ),
          bullet(
            'Fitur Lanjutan yang Direncanakan',
            '1. Otomasi OCR Scoring Sheet cerdas berbasis Vision API; 2. Algoritma optimasi alokasi barak (Smart Bin-Packing) berbasis kapasitas dan asal kontingen; 3. Verifikasi sertifikat digital pemenang berbasis QR Code HMAC-SHA256.'
          ),

          p('', { spaceAfter: 160 }),

          headingMajor('7. Penggunaan AI Agent'),
          bullet(
            'Alat AI yang Digunakan',
            'Google Antigravity Agentic Assistant (bertenaga model Gemini 2.5 Flash & Pro).'
          ),
          bullet(
            'Bagian Pekerjaan yang Dibantu',
            '1. Refaktorisasi antarmuka login untuk mengeliminasi pola "AI-slop" dan menghasilkan kartu autentikasi standar industri yang bersih; 2. Pembersihan hardcoded credentials pada login dan modal user; 3. Diagnosis dan perbaikan 15 celah keamanan npm audit (upgrade Next.js 16.4.5 & npm override minimatch); 4. Penyusunan konfigurasi OWASP Security Headers.'
          ),
          bullet(
            'Contoh Prompt Utama 1',
            '"kamu bisa lihat dulu design halaman login, bisakah dibuat lebih clean lagi standart industri gitu aku rasa itu ai-slop dan generic ai dan juga masih ada hardcode di username dan passwordnya"'
          ),
          bullet(
            'Contoh Prompt Utama 2',
            '"hasil npm audit bisa diperbaiki dan jelaskan dulu kesaya cara memperbaikinya bagaimana: 15 vulnerabilities (9 moderate, 5 high, 1 critical)"'
          ),
          bullet(
            'Metode Peninjauan & Verifikasi Mahasiswa',
            'Mahasiswa melakukan peninjauan kode secara mandiri, menguji fungsionalitas formulir di peramban, menjalankan uji kompilasi lokal via "npm run build", memeriksa respons header live via terminal "curl -I", serta memvalidasi skor pemindai independen securityheaders.com dan audit paket npm.'
          ),

          p('', { spaceAfter: 160 }),

          headingMajor('8. Hasil Self-Testing Keamanan'),
          p(
            'Mahasiswa telah melakukan pengujian keamanan mandiri (self-testing) terhadap 5 domain teknis utama, dengan hasil dokumentasi sebagai berikut:'
          ),

          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  tableCell('No', { isHeader: true, widthPercent: 6, align: AlignmentType.CENTER }),
                  tableCell('Skenario Uji', { isHeader: true, widthPercent: 22 }),
                  tableCell('Metode / Alat Uji', { isHeader: true, widthPercent: 22 }),
                  tableCell('Kondisi Awal (Temuan)', { isHeader: true, widthPercent: 24 }),
                  tableCell('Tindakan Perbaikan & Status', { isHeader: true, widthPercent: 26 }),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('1', { align: AlignmentType.CENTER }),
                  tableCell('SQL Injection & XSS pada Form Input', { bold: true }),
                  tableCell('Uji coba payload input:\n\' OR 1=1 --\n<script>alert(1)</script>'),
                  tableCell('Potensi eksekusi jika input digabung secara string concatenation.'),
                  tableCell('Menggunakan parameterized queries PostgREST Supabase SDK dan sanitasi bawaan React JSX.\nStatus: LOLOS (Aman)'),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('2', { align: AlignmentType.CENTER, bgColor: 'F8FAFC' }),
                  tableCell('Kontrol Akses & IDOR Protection', { bold: true, bgColor: 'F8FAFC' }),
                  tableCell('Navigasi langsung ke URL internal /admin/* pada jendela incognito tanpa login.', { bgColor: 'F8FAFC' }),
                  tableCell('Halaman admin berisiko terbuka jika hanya dicek pada sisi visual klien.', { bgColor: 'F8FAFC' }),
                  tableCell('Penerapan Next.js Middleware guard: Akses tanpa token auth langsung di-redirect ke /login.\nStatus: LOLOS (Aman)', { bgColor: 'F8FAFC' }),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('3', { align: AlignmentType.CENTER }),
                  tableCell('Autentikasi & Keamanan Sesi', { bold: true }),
                  tableCell('Percobaan password acak, brute-force simulation, uji coba tombol logout.'),
                  tableCell('Sebelumnya terdapat tombol shortcut di UI yang mengisikan Password123! otomatis.'),
                  tableCell('Menghapus seluruh tombol shortcut autofill password, menerapkan hash bcrypt dan token JWT session.\nStatus: LOLOS (Aman)'),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('4', { align: AlignmentType.CENTER, bgColor: 'F8FAFC' }),
                  tableCell('HTTPS & OWASP Security Headers', { bold: true, bgColor: 'F8FAFC' }),
                  tableCell('Pengecekan live domain via securityheaders.com dan terminal:\ncurl -I https://www.kiraniagp.my.id/', { bgColor: 'F8FAFC' }),
                  tableCell('Awalnya berstatus Grade D (Header CSP, HSTS, X-Frame-Options tidak ditemukan).', { bgColor: 'F8FAFC' }),
                  tableCell('Konfigurasi blok headers() di next.config.ts (CSP, HSTS 2 tahun preload, DENY, nosniff).\nStatus: LOLOS (Grade A+)', { bgColor: 'F8FAFC' }),
                ],
              }),
              new TableRow({
                children: [
                  tableCell('5', { align: AlignmentType.CENTER }),
                  tableCell('Manajemen Secret & Audit Dependensi', { bold: true }),
                  tableCell('Pemeriksaan riwayat git commit dan eksekusi command: npm audit pada folder frontend.'),
                  tableCell('Terdeteksi 15 celah keamanan (1 Critical pada Next.js <16.4.1, 5 High, 9 Moderate).'),
                  tableCell('Pembersihan fallback secret, upgrade Next.js ke 16.4.5, dan override minimatch@11.0.4.\nStatus: LOLOS (0 Vulnerabilities)'),
                ],
              }),
            ],
          }),

          p('', { spaceAfter: 160 }),

          headingMajor('9. Tangkapan Layar (Dokumentasi Visual)'),
          p(
            'Berikut adalah slot bingkai dokumentasi tangkapan layar sistem KIRANI AGP-III. Silakan sisipkan gambar screenshot hasil tangkapan Anda pada bingkai di bawah ini:'
          ),

          headingSub('a. Halaman Registrasi / Login Panitia'),
          screenshotSlot(
            'Halaman Login Panitia Bersih',
            'Sisipkan tangkapan layar halaman https://www.kiraniagp.my.id/login yang telah berdesain clean standar industri.'
          ),

          p('', { spaceAfter: 120 }),

          headingSub('b. Halaman Pengelolaan Data (CRUD Peserta & Barak)'),
          screenshotSlot(
            'Dashboard Kelola Data Panitia',
            'Sisipkan tangkapan layar ruang kerja panitia setelah login (Tabel manajemen peserta, penjadwalan, atau barak).'
          ),

          p('', { spaceAfter: 120 }),

          headingSub('c. Halaman Laporan & Live Score Publik'),
          screenshotSlot(
            'Halaman Publik Live Score & Leaderboard',
            'Sisipkan tangkapan layar halaman https://www.kiraniagp.my.id/live-score yang menampilkan klasemen nilai terbuka.'
          ),

          p('', { spaceAfter: 120 }),

          headingSub('d. Bukti HTTPS & Domain Aktif'),
          screenshotSlot(
            'Bilah URL Browser Ber-HTTPS & Sertifikat SSL Valid',
            'Sisipkan tangkapan layar peramban web yang memperlihatkan gembok hijau https://www.kiraniagp.my.id dan jendela detail sertifikat SSL Let\'s Encrypt.'
          ),

          p('', { spaceAfter: 120 }),

          headingSub('e. Bukti Konfigurasi Hosting & DNS'),
          screenshotSlot(
            'Dashboard Vercel Deployment & DNS DomaiNesia',
            'Sisipkan tangkapan layar dashboard Vercel (Production status: Ready) dan tabel DNS Record DomaiNesia (Record A & CNAME).'
          ),

          p('', { spaceAfter: 120 }),

          headingSub('f. Bukti Self-Testing Keamanan'),
          screenshotSlot(
            'Hasil Scan SecurityHeaders.com & Terminal NPM Audit',
            'Sisipkan tangkapan layar hasil scan securityheaders.com (Grade A/A+) serta terminal eksekusi npm audit (found 0 vulnerabilities).'
          ),

          p('', { spaceAfter: 160 }),

          headingMajor('10. Kendala dan Rencana Perbaikan'),
          bullet(
            'Kendala Waktu Propagasi DNS & Caching Scanner',
            'Saat menghubungkan domain kiraniagp.my.id ke Vercel, pemindai keamanan sempat menampilkan status cache lama sebelum rekaman DNS baru dan konfigurasi header terbaca utuh.'
          ),
          bullet(
            'Kendala Potensi Konflik npm audit fix --force',
            'Perintah pembaruan otomatis npm audit fix --force berisiko menurunkan (downgrade) pustaka linter ke versi Next.js 15 yang merusak kompatibilitas React 19.'
          ),
          bullet(
            'Solusi yang Telah Diterapkan',
            'Menggunakan fitur selective package overrides pada package.json sehingga kerentanan CVE pada pustaka minimatch berhasil ditambal tanpa menurunkan versi framework.'
          ),
          bullet(
            'Rencana Perbaikan Masa Depan',
            'Menambahkan proteksi Rate Limiting terdistribusi berbasis Redis (Upstash) pada rute API otentikasi untuk memperkuat pertahanan dari potensi serangan DDoS dan brute-force otomatis.'
          ),

          p('', { spaceAfter: 200 }),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 40, line: 300 },
            children: [
              new TextRun({
                text: 'Disusun dengan penuh kejujuran dan integritas akademik.',
                font: FONT_NAME,
                size: 22,
                italics: true,
                color: COLOR_MUTED,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0, line: 300 },
            children: [
              new TextRun({
                text: 'Muhamad Prinaldi Khoirul Anam — 20240810049',
                font: FONT_NAME,
                size: 24,
                bold: true,
                color: COLOR_PRIMARY,
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  const fileName = 'TugasProject_CyberSec_MuhamadPrinaldiKhoirulAnam_20240810049.docx';
  const outPath1 = path.join('c:/FOLDER KULIAH/PROJECT WEB REKAPITULASI NILAI AGP', fileName);
  fs.writeFileSync(outPath1, buffer);
  console.log('✅ File DOCX UNIKU berhasil dibuat di:', outPath1);

  const artifactDir = 'C:/Users/AldiPrinaldi/.gemini/antigravity/brain/68eef986-1f1f-46a3-a619-90397f1e409e';
  const outPath2 = path.join(artifactDir, fileName);
  fs.writeFileSync(outPath2, buffer);
  console.log('✅ File DOCX UNIKU berhasil disalin ke artifact di:', outPath2);
}

generateUnikuDocx().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});

