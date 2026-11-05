# KIRANI AGP-III — Sistem Rekapitulasi Nilai & Manajemen Arena Terpadu
> **Tugas Project: Pengembangan & Pengamanan Aplikasi Web — Mata Kuliah Cyber Security**

[![Production URL](https://img.shields.io/badge/Production-https%3A%2F%2Fwww.kiraniagp.my.id-076653?style=for-the-badge&logo=vercel)](https://www.kiraniagp.my.id)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.5-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Security Audit](https://img.shields.io/badge/npm%20audit-0%20vulnerabilities-brightgreen?style=for-the-badge&logo=shield)](https://github.com/Prinaldi77/Rekapitulasi_Agp)
[![Security Headers](https://img.shields.io/badge/OWASP%20Headers-A%2B%20Grade-success?style=for-the-badge&logo=securityscorecard)](https://securityheaders.com/?q=https%3A%2F%2Fwww.kiraniagp.my.id%2F)

---

## 1. Deskripsi Aplikasi

**KIRANI AGP-III** (*Komputasi & Informasi Rekapitulasi Angka Nilai Induk AGP*) adalah platform rekapitulasi penilaian kompetisi baris-berbaris (LKBB) terpadu berskala nasional. Aplikasi ini dirancang untuk menggantikan rekapitulasi manual berbasis spreadsheet yang rentan terhadap human-error, keterlambatan distribusi hasil, manipulasi data, dan ketidaktransparanan skor.

Aplikasi memisahkan alur kerja antara:
1. **Portal Publik (`/`, `/schedule`, `/live-score`, `/barack`):** Akses real-time untuk peserta, official, dan audiens guna memantau klasemen langsung (*Live Leaderboard*), jadwal tampil arena, denah barak kontingen, dan unduhan dokumen teknis.
2. **Ruang Kendali Panitia (`/login`, `/admin/*`):** Portal tertutup berbasis Role-Based Access Control (RBAC) bagi Sekretaris Utama (Super Admin), Pengelola Master Data (Admin), dan Operator Entri Nilai (PJ Rekap) untuk mengelola data master, validasi lembar skor dewan juri, audit trail, serta ekspor laporan/SK Juara.

---

## 2. Fitur Utama

* **Autentikasi & Otorisasi Ketat (RBAC):**
  * Tiga tingkat hak akses: `SUPER_ADMIN` (Grand Master), `ADMIN` (Master Data), dan `OPERATOR_REKAP` (Entri Nilai).
  * Proteksi route server-side melalui Middleware Next.js & Row Level Security (RLS) PostgreSQL.
* **Pengelolaan Data Terpadu (CRUD):**
  * Manajemen Peserta & Kontingen (No. Urut, Kategori, Asal Daerah/Sekolah).
  * Manajemen Jadwal Tampil & Alokasi Barak Istirahat.
  * Manajemen Kategori Lomba & Formula Pembobotan Nilai.
* **Scoring Engine & Real-Time Live Score:**
  * Entri skor presisi per kriteria penjurian dewan juri.
  * Perhitungan agregasi nilai akhir otomatis dengan sistem deteksi tie-breaker.
  * Integrasi OCR lembar nilai (*Optical Character Recognition*) untuk verifikasi cepat.
* **Pusat Laporan & Ekspor Berkas:**
  * Rekapitulasi akumulasi nilai per kategori dalam format tabel terperinci.
  * Generator Surat Keputusan (SK) Pemenang dan Sertifikat Juara dalam format PDF resmi siap cetak.
* **Audit Trail & Log Aktivitas:**
  * Pencatatan timestamp, identitas operator, dan histori perubahan skor secara transparan untuk mencegah sengketa nilai.

---

## 3. Arsitektur & Teknologi

* **Frontend:** Next.js 16.4.5 (App Router, Turbopack, React 19, Tailwind CSS, Lucide Icons, Framer Motion).
* **Backend:** Express.js, TypeScript, Node.js (REST API & OCR Scoring Service).
* **Database & Auth:** Supabase PostgreSQL, Supabase Auth (JWT HttpOnly Session, Row Level Security, bcrypt password hashing).
* **Deployment & Infrastruktur:**
  * **Frontend:** Vercel Edge Network (Auto-deploy dari branch `main`).
  * **Backend API:** Render Cloud Web Service (`https://rekapitulasi-agp.onrender.com`).
  * **Domain & DNS:** Fully Qualified Domain Name (FQDN) `https://www.kiraniagp.my.id` dengan sertifikat SSL/TLS valid (Let's Encrypt).

---

## 4. Penerapan Keamanan (Cyber Security Implementation)

Aplikasi dibangun dengan mematuhi standar keamanan web modern (OWASP Top 10):
1. **Password Hashing:** Menggunakan algoritma hash adaptif aman (bcrypt) bawaan Supabase Auth, tidak ada kata sandi yang tersimpan dalam format plaintext.
2. **Perlindungan Injeksi (SQLi & XSS):** 
   * Semua query database dieksekusi melalui parameterized queries Supabase SDK (PostgREST) untuk mengeliminasi celah SQL Injection.
   * Framework React/Next.js secara default melakukan context-aware output encoding untuk mencegah Cross-Site Scripting (XSS).
3. **Manajemen Sesi & Token:** Autentikasi berbasis token JWT tersimpan dalam cookie sesi terproteksi dengan flag `Secure` dan `SameSite`.
4. **Row Level Security (RLS):** Kebijakan RLS diterapkan pada level database PostgreSQL Supabase guna mencegah *Insecure Direct Object Reference* (IDOR).
5. **CORS Whitelist:** Peladen backend Render hanya mengizinkan permintaan dari origin resmi (`https://www.kiraniagp.my.id`, `https://kiraniagp.my.id`).
6. **OWASP HTTP Security Headers:** Diterapkan di `next.config.ts`:
   * `Strict-Transport-Security`: Memaksa koneksi HTTPS (`max-age=63072000; includeSubDomains; preload`).
   * `X-Frame-Options: DENY`: Melindungi portal dari serangan *Clickjacking*.
   * `X-Content-Type-Options: nosniff`: Mencegah eksploitasi MIME-type sniffing.
   * `Referrer-Policy: strict-origin-when-cross-origin`: Menjaga privasi data referrer.
   * `Content-Security-Policy (CSP)`: Membatasi sumber eksekusi script, style, koneksi API, dan gambar.
   * `Permissions-Policy`: Menonaktifkan akses sensor browser yang tidak diperlukan (kamera, mikrofon, geolokasi).
7. **Pengelolaan Rahasia (Secret Management):** Tidak ada kredensial database, API keys privat, atau token yang di-commit ke repositori Git. Seluruh rahasia dikelola secara terisolasi via Environment Variables di Vercel dan Render.

---

## 5. Ringkasan Penggunaan AI Agent

Sesuai ketentuan tugas, pengembangan dan audit keamanan aplikasi dibantu oleh **AI Agent (Antigravity by Google DeepMind)**:
* **Bagian Pekerjaan yang Dibantu:**
  * Refaktorisasi dan audit kode frontend Next.js 16 untuk mengeliminasi pola *AI-slop* dan menghasilkan desain antarmuka standar industri yang bersih.
  * Audit celah keamanan dependensi (`npm audit`), upgrade Next.js 16.4.5, dan konfigurasi selective npm `overrides` untuk mengatasi kerentanan CVE pada sub-dependensi `minimatch`.
  * Pembuatan dan verifikasi konfigurasi OWASP Security Headers (CSP, HSTS, X-Frame-Options) serta integrasi DNS custom domain FQDN.
* **Metode Verifikasi Mahasiswa:**
  * Mahasiswa menguji kode hasil bantuan secara mandiri menggunakan pengujian fungsional browser, pengujian header respons dengan `curl -I`, verifikasi scanner independen ([securityheaders.com](https://securityheaders.com)), serta kompilasi lokal `npm run build` sebelum push ke Git.

---

## 6. Ringkasan Hasil Self-Testing Keamanan

| Skenario Pengujian | Metode Uji | Status Sebelum | Tindakan Perbaikan | Status Akhir |
| :--- | :--- | :--- | :--- | :--- |
| **SQL Injection & XSS** | Form input username/password & URL query payload | Rentan jika menggunakan raw query | Parameterized query via Supabase SDK + sanitasi string | **LOLOS (Aman)** |
| **Kontrol Akses (IDOR)** | Akses langsung `/admin/*` tanpa sesi login | Risiko pembobolan halaman internal | Next.js middleware guard & server session check | **LOLOS (Redirect)** |
| **Penyimpanan Secret** | Audit riwayat Git & codebase | Terdapat fallback anon key di source code | Pembersihan seluruh string fallback ke `.env` | **LOLOS (Bersih)** |
| **Security Headers** | Scan via `securityheaders.com` & `curl -I` | Awalnya Grade D (Missing CSP, HSTS, nosniff) | Implementasi OWASP headers & CSP di `next.config.ts` | **LOLOS (Grade A+)** |
| **Audit Dependensi** | `npm audit` di terminal frontend | 15 celah (1 Critical Next.js, 5 High, 9 Moderate) | Upgrade Next.js ke `16.4.5` & npm override `minimatch@11.0.4` | **LOLOS (0 Vulnerability)** |

---

## 7. Panduan Instalasi & Menjalankan Lokal

### Prasyarat
* Node.js versi 20.x atau 22.x
* npm versi 10.x atau lebih baru
* Akun & Proyek Supabase aktif

### Langkah Instalasi

1. **Clone Repositori:**
   ```bash
   git clone https://github.com/Prinaldi77/Rekapitulasi_Agp.git
   cd Rekapitulasi_Agp
   ```

2. **Setup Frontend:**
   ```bash
   cd frontend
   npm install
   ```

3. **Konfigurasi Environment Variable Frontend:**
   Buat file `.env.local` di dalam folder `frontend/` (gunakan template tanpa kredensial rahasia):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   NEXT_PUBLIC_API_URL=https://rekapitulasi-agp.onrender.com
   ```

4. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Buka peramban di `http://localhost:3000`.

5. **Uji Build Produksi Lokal:**
   ```bash
   npm run build
   npm run start
   ```

---

## 8. Tautan Resmi Proyek

* **Aplikasi Live (Produksi):** [https://www.kiraniagp.my.id](https://www.kiraniagp.my.id)
* **Backend API Health Check:** [https://rekapitulasi-agp.onrender.com/health](https://rekapitulasi-agp.onrender.com/health)
* **Repositori GitHub:** [https://github.com/Prinaldi77/Rekapitulasi_Agp](https://github.com/Prinaldi77/Rekapitulasi_Agp)

---
*Dikembangkan oleh Muhamad Prinaldi — Tugas Project Cyber Security Pra-UTS.*
