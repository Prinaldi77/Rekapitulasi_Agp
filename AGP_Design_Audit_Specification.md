# REKAPITULASI AGP — DESIGN AUDIT & SPECIFICATION DOCUMENT

**Disusun untuk:** Tim Pengembang Frontend & AI Developer (Antigravity)
**Disusun oleh:** Design & UX Consulting Team
**Ruang lingkup:** Audit UI/UX menyeluruh + Design System + Spesifikasi Redesign (Konseptual, tanpa kode)
**Basis analisis:** Source code aktual `Rekapitulasi-Agp/frontend` (Next.js 15 + TypeScript + Tailwind v4 + Supabase), bukan asumsi.

> **Catatan penting soal batasan:** Seluruh rekomendasi di dokumen ini bersifat **visual, struktural-layout, dan interaksi** saja. Tidak ada perubahan business logic, routing, struktur folder, backend, API, Supabase schema, atau mekanisme autentikasi yang diusulkan. Setiap temuan dan rekomendasi merujuk langsung ke file dan komponen nyata di dalam project.

---

## DAFTAR ISI

1. Ringkasan Eksekutif
2. Audit Project (Struktur, Flow, Kekuatan, Kelemahan)
3. UX Audit (End-to-End Journey & Friction)
4. Design System
5. Component Library
6. Spesifikasi Per Halaman (10 halaman)
7. Konsep Dashboard
8. Konsep Leaderboard
9. Konsep Live Score
10. Audit & Rekomendasi Halaman CRUD
11. Spesifikasi Responsive
12. Spesifikasi Accessibility
13. Roadmap Implementasi (Prioritas)
14. Handoff Document untuk AI Developer (Antigravity)

---

## 1. RINGKASAN EKSEKUTIF

Rekapitulasi AGP adalah sistem manajemen kompetisi (LKBB/PBB Pramuka) berbasis Next.js App Router dengan dua ruang akses: **Portal Publik** (hasil, jadwal tampil, lokasi barak — dapat diakses siapa saja via LAN) dan **Portal Panitia** (Admin) dengan dua role: **GRAND MASTER** (akses penuh: input nilai, rekap master, kelola user) dan **OPERATOR LAPANGAN** (akses terbatas: kelola urutan tampil & barak per divisi jenjang).

Secara fungsional, aplikasi ini **sudah lengkap** — seluruh alur (login → input nilai per juri → rekap otomatis → publish hasil → cetak SK PDF) sudah berjalan. Namun audit menemukan bahwa kualitas UI saat ini didominasi oleh **pola "developer-styled UI"**: styling Tailwind yang fungsional dan konsisten secara warna gelap, tetapi belum melalui proses design system formal — terlihat dari radius yang tidak konsisten (`rounded-lg` s.d. `rounded-3xl` dipakai bergantian tanpa aturan), skala tipografi ad-hoc (banyak `text-[10px]`, `text-[11px]` custom alih-alih skala baku), ikon berbasis emoji mentah, serta absennya loading/skeleton/error state di hampir semua halaman.

Temuan paling kritis (Prioritas **High**) ada tiga:

1. **Kalkulator nilai berbasis tombol-per-angka** di halaman Input Nilai Juri (`/admin/score-entry`) merender satu tombol kecil untuk **setiap kemungkinan angka** dalam rentang skor (contoh: kriteria dengan rentang 10–40 merender 31 tombol). Dengan hingga 38 kriteria per jenjang pada kategori LKBB, satu layar bisa memuat **800+ tombol berukuran ±28px** — jauh di bawah target sentuh 44px, berat secara visual, dan sangat rentan salah pencet oleh juri di lapangan.
2. **Ketidakkonsistenan sumber data**: halaman publik "Hasil & SK Juara" (`live-score/page.tsx`) menampilkan **data mock yang di-hardcode** (`MOCK_WINNERS`), sepenuhnya terputus dari nilai yang dimasukkan juri di `/admin/score-entry` maupun rekap di `/admin/leaderboard`. Toggle "Publish" yang dikelola Grand Master tidak benar-benar mengontrol apa yang tampil ke publik.
3. **Fallback skor palsu**: `admin/leaderboard/page.tsx` menggunakan pola `getMateriScore(...) || 85` — jika juri belum menilai suatu materi, sistem menampilkan angka default (85, 70, 75, dst.) seolah itu adalah nilai asli, tanpa penanda "belum dinilai". Ini berisiko tinggi pada dokumen resmi seperti SK Juara.

Dokumen ini menyusun cara memperbaiki seluruh lapisan visual dan interaksi tersebut — termasu Design System penuh, spesifikasi ulang tiap halaman, dan dokumen handoff siap pakai — tanpa menyentuh logika atau arsitektur data yang sudah berjalan.

---

## 2. AUDIT PROJECT

### 2.1 Struktur Aplikasi (Peta Nyata)

```
(public)                       — akses tanpa login, dapat dibuka semua orang di jaringan LAN
 ├─ /                          page.tsx            → Landing/Hub 3 kartu navigasi
 ├─ /live-score                live-score/page.tsx → Pengumuman Juara & SK PDF (data MOCK)
 ├─ /schedule                  schedule/page.tsx   → Urutan tampil realtime (localStorage)
 └─ /barack                    barack/page.tsx     → Pencarian lokasi barak (localStorage)

(auth)
 └─ /login                     login/page.tsx      → Login Panitia (Supabase Auth)

(admin)                        — dilindungi middleware.ts, butuh session Supabase
 ├─ /admin/schedule-manage     → CRUD urutan tampil (Operator + Grand Master)
 ├─ /admin/barack-manage       → CRUD alokasi barak (Operator + Grand Master)
 ├─ /admin/score-entry         → Input nilai juri, khusus GRAND_MASTER (Grand Master only)
 ├─ /admin/leaderboard         → Rekap master 3 tab + Publish + Cetak SK (Grand Master only)
 └─ /admin/users               → Kelola akun panitia (Grand Master only)

Global:
 ├─ layout.tsx + Navbar.tsx    → Shell aplikasi, dark theme paksa (`className="dark"`)
 └─ middleware.ts              → Role gate: OPERATOR diarahkan otomatis ke schedule-manage
```

**Total 10 halaman fungsional** (bukan termasuk shell/layout). Tidak ada nested layout khusus untuk grup `(admin)` — setiap halaman admin mengulang pola header sendiri-sendiri, yang menjadi salah satu akar inkonsistensi visual (lihat 2.4).

### 2.2 Alur Pengguna (User Flow) Nyata

**Flow Panitia (Grand Master):**
`/login` → deteksi role via `profiles.role` (dengan fallback heuristik e-mail mengandung "grandmaster") → redirect `/admin/leaderboard` → dari Navbar bisa ke `/admin/score-entry` (input nilai) → `/admin/users` (kelola akun) → kembali ke `/admin/leaderboard` untuk **Publish** dan **Cetak PDF**.

**Flow Panitia (Operator Lapangan):**
`/login` → redirect `/admin/schedule-manage` (dipaksa oleh middleware, tidak bisa mengakses 3 rute Grand-Master-only) → mengelola status tampil (`NOW PERFORMING`/`STANDBY`/`NEXT`/`COMPLETED`) → `/admin/barack-manage` untuk alokasi ruang.

**Flow Publik (peserta/pengunjung):**
`/` (landing) → pilih salah satu dari 3 kartu → `/live-score` (lihat juara, unduh SK) **atau** `/schedule` (lihat urutan tampil) **atau** `/barack` (cari ruang transit) — ketiganya independen, tanpa breadcrumb kembali selain logo/navbar.

### 2.3 Kekuatan UI Saat Ini

- **Konsistensi tema warna dasar** (dark slate + accent emerald/amber/cyan/purple) sudah diterapkan di semua halaman — fondasi bagus untuk diformalkan jadi design token.
- **Struktur informasi form CRUD sudah logis**: form di kiri, list/tabel di kanan (barack-manage, schedule-manage) — pola yang tepat dipertahankan.
- **Copy Bahasa Indonesia domain-spesifik sudah matang** (istilah "Danton", "Pembina", "Basis/Pangkalan") — tidak perlu diubah, hanya perlu dirapikan penyajiannya.
- **State filter jenjang (SD/SMP/SMA) konsisten dipakai di banyak halaman** — pola tab filter ini layak dijadikan komponen standar.
- **Middleware role-gating sudah bekerja dengan baik** secara fungsional — Operator benar-benar tidak bisa mengakses halaman Grand-Master-only.
- **Ada precedent desain internal yang lebih matang**: folder `stitch_screens/` di root repo berisi 6 mockup (`secure_login_portal`, `leaderboard_and_finalization`, `rapid_score_entry`, `barack_and_transit`, `live_schedule`) dengan pendekatan **light theme, sidebar admin, kartu metrik ringkas, dan search-first table**. Mockup ini belum diimplementasikan sama sekali di kode, tapi menunjukkan bahwa tim sebelumnya sudah punya visi arah desain yang lebih terstruktur — dokumen ini akan mengambil *prinsip* baiknya (hierarki informasi, search-first, metric card di atas tabel) tanpa mengklaim halaman gelap harus diganti terang (keputusan tema dibahas di bagian Design System).

### 2.4 Kelemahan UI Saat Ini (dengan Prioritas)

| # | Temuan | Lokasi | Prioritas |
|---|---|---|---|
| 1 | Kalkulator skor tombol-per-angka (hingga 800+ tombol/halaman) | `admin/score-entry/page.tsx` → `renderRatingOptions()` | **High** |
| 2 | Data publik "Hasil & SK Juara" 100% hardcoded (`MOCK_WINNERS`), tidak sinkron dengan input nilai asli | `(public)/live-score/page.tsx` | **High** |
| 3 | Fallback nilai palsu (`|| 85`, `|| 70`, dst.) tampil seolah nilai asli tanpa indikator "belum dinilai" | `admin/leaderboard/page.tsx` | **High** |
| 4 | Ikon 100% emoji mentah tanpa sistem ikon konsisten (ukuran/stroke berbeda antar OS, tidak accessible) | Seluruh halaman | High |
| 5 | Tidak ada loading state / skeleton di manapun — data localStorage/Supabase "pop-in" mendadak | Seluruh halaman | Medium |
| 6 | Radius tombol/kartu tidak konsisten: `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-3xl` dipakai campur pada elemen setara | Seluruh halaman | Medium |
| 7 | Skala tipografi tidak baku — banyak ukuran arbitrary (`text-[10px]`, `text-[11px]`) dipakai untuk teks informasi penting (skor, status) | Seluruh halaman | Medium |
| 8 | Warna aksen tidak semantik konsisten — emerald berarti "SD" di satu halaman, "Grand Master OK" di navbar, dan "CTA utama" di halaman lain | Seluruh halaman | Medium |
| 9 | Konfirmasi hapus data pakai `window.confirm()` native browser — keluar dari visual bahasa aplikasi, tidak dapat diberi styling, mem-blok thread | `barack-manage`, `schedule-manage` | Medium |
| 10 | Tombol "Auto-Fill Skor Rata-Rata Default (Fast Testing)" tampil di form produksi yang dipakai juri sungguhan — risiko salah pencet saat kompetisi nyata | `admin/score-entry/page.tsx` | High |
| 11 | Deteksi role berulang & rawan (mengandalkan string email "grandmaster") di 3 tempat berbeda (`Navbar`, `middleware`, `login`) — bukan masalah kode, tapi menciptakan potensi *flash of wrong role UI* saat profile masih loading | `Navbar.tsx`, `middleware.ts`, `login/page.tsx` | Medium |
| 12 | Status Publish/Lock bersifat global (satu flag `agp_published` untuk semua jenjang), padahal UI menyiratkan granularitas per jenjang SD/SMP/SMA | `(public)/page.tsx`, `admin/leaderboard/page.tsx` | Medium |
| 13 | Tidak ada pagination di tabel manapun — akan pecah tampilannya saat data riil (puluhan/ratusan peserta) masuk | `admin/leaderboard`, `admin/users`, `schedule-manage`, `barack-manage` | Medium |
| 14 | Search bar diduplikasi dengan styling berbeda-beda di tiap halaman alih-alih komponen bersama | `(public)/barack`, `admin/barack-manage` | Low |
| 15 | Tidak ada breadcrumb / ringkasan konteks aktif di halaman dengan banyak state bertingkat (materi → jenjang → gender → juri) | `admin/score-entry` | Medium |
| 16 | Layout grid admin baru menyusut di breakpoint `lg:` (1024px), menyisakan zona canggung di tablet (768–1023px) | `schedule-manage`, `barack-manage`, `users` | Low |

### 2.5 Masalah UX (Ringkasan — detail di Bagian 3)

- Juri harus mengingat/menavigasi kombinasi 5 dimensi (materi, jenjang, gender, no. peserta, juri ke berapa) sebelum bisa mulai menilai — tanpa ringkasan visual "Anda sedang menilai: ...".
- Tidak ada indikasi progres pengisian (berapa dari 38 kriteria yang sudah diisi) di form LKBB yang panjang.
- Halaman publik tidak auto-refresh secara real jaringan (hanya `setInterval` 3 detik + storage event, yang hanya berfungsi lintas-tab di browser yang sama, bukan lintas-device) — padahal Navbar mengklaim "LAN ONLINE" seolah live sinkron multi-perangkat.

### 2.6 Masalah Inkonsistensi Desain

- **Border radius**: 4 skala berbeda dipakai untuk kelas komponen yang sama (badge kecil vs kartu besar tidak dibedakan secara sistematis, murni preferensi saat menulis kode).
- **Font-weight**: `font-bold`, `font-extrabold`, `font-black` dipakai bergantian pada teks dengan peran visual yang sama (judul kartu di satu halaman `font-extrabold`, di halaman lain `font-black`).
- **Warna status**: rose = "sedang tampil" di jadwal, tapi rose juga = "tombol hapus" di form CRUD — tabrakan makna warna.
- **Bahasa tombol aksi**: campur emoji + huruf kapital semua (`➕ TAMBAH KE JADWAL ARENA`) di beberapa tempat, tapi title-case tanpa emoji di tempat lain (`Kelola Ruang Barak` di Navbar) — level formalitas tidak konsisten.

### 2.7 Masalah Accessibility (Ringkasan — detail di Bagian 12)

- Emoji dipakai sebagai satu-satunya penyampai makna ikon (tanpa `aria-hidden` + label teks terpisah untuk screen reader).
- Kontras teks `text-slate-400`/`text-slate-500` di atas `bg-slate-900`/`bg-slate-950` berisiko di bawah rasio 4.5:1 WCAG AA untuk teks kecil.
- Tombol skor 28×28px pada `score-entry` jauh di bawah target sentuh minimum 44×44px (WCAG 2.5.5, penting karena ini dipakai di lapangan, kemungkinan di perangkat mobile/tablet).
- Tidak ada `aria-label` konsisten pada tombol berbasis emoji-only (misalnya tombol 🗑️ hapus tanpa teks di `barack-manage`... walau di sana ada `title`, atribut `title` saja tidak cukup untuk sebagian screen reader/mobile).
- Tidak terlihat definisi `:focus-visible` kustom — mengandalkan default browser yang biasanya nyaris tak terlihat di atas background gelap.

### 2.8 Masalah Responsive (Ringkasan — detail di Bagian 11)

- Grid 3-kolom form+tabel admin (`lg:grid-cols-3`) melompat langsung dari 1 kolom ke 3 kolom pada 1024px, tanpa state 2 kolom di tablet — form jadi terlalu lebar atau tabel terlalu sempit di rentang 768–1023px.
- Tab filter jenjang (`overflow-x-auto`) berpotensi terpotong di layar sempit tanpa indikator visual "scroll ke samping" (fade edge / chevron).
- Tombol skor grid pada `score-entry` benar-benar tidak dioptimalkan untuk mobile — `flex-wrap` menyebabkan puluhan baris tombol kecil bertumpuk vertikal, membuat scroll sangat panjang di HP.

### 2.9 Masalah Visual Hierarchy

- Semua kartu ringkasan (LKBB total, subtotal grup) memakai bobot visual serupa dengan kartu form input — grand total sebagai keputusan paling penting seharusnya jauh lebih menonjol.
- Judul halaman (`h1`) dan badge kategori di atasnya memiliki kontras ukuran yang tidak konsisten antar halaman (kadang badge lebih menonjol dari h1).

### 2.10 Masalah Typography & Spacing

- Tidak ada baseline grid/skala spacing — nilai padding (`p-3`, `p-3.5`, `p-4`, `p-5`, `p-6`, `p-8`) dipilih ad-hoc per komponen mirip, bukan berdasarkan token skala 4/8px yang konsisten.
- Ukuran font di bawah 12px (`text-[10px]`, `text-[11px]`) dipakai untuk informasi penting berulang kali — seharusnya jadi pengecualian langka, bukan pola utama label.

### 2.11 Masalah Navigasi

- Navbar admin tidak menunjukkan "current page" secara jelas selain warna berbeda tipis pada Link aktif — tanpa indikator garis bawah/latar tegas, mudah terlewat terutama untuk Operator yang berpindah antara 2 halaman saja.
- Tidak ada jalan pintas dari halaman publik ke `/login` — pengguna publik yang sebetulnya panitia harus tahu URL `/login` secara manual (tidak ada tombol Login di Navbar publik).

---

## 3. UX AUDIT

### 3.1 End-to-End Journey: Grand Master Menilai Sampai Menerbitkan SK

| Tahap | Yang Terjadi Sekarang | Friction | Solusi UX |
|---|---|---|---|
| 1. Login | Ketik username/email + password, sistem mencoba domain `@agp.local` lalu fallback `@agp.com` jika gagal | Perilaku "coba dua domain" tidak terlihat oleh pengguna — jika gagal, pesan error mentah dari Supabase kadang muncul (`res.error.message`) yang tidak ramah pengguna | Satu pesan error yang dikurasi ("Username atau password tidak sesuai"), indikator loading yang jelas selama percobaan ganda berlangsung |
| 2. Memilih materi & konteks nilai | Grand Master harus mengklik: tab materi (8 pilihan) → toggle jenjang (3) → toggle gender (2) → isi No. Peserta manual → toggle juri (3) | 5 keputusan berurutan sebelum bisa mulai menilai; No. Peserta diisi manual (rawan typo, storage key akan pecah dan nilai "hilang" di kombinasi key lain) | Ubah No. Peserta dari input teks bebas menjadi **dropdown/pencarian peserta terdaftar** (bersumber dari data schedule/participant yang sudah ada), sehingga key penyimpanan selalu konsisten dan tidak typo |
| 3. Mengisi skor LKBB | Klak-klik satu-satu di antara puluhan tombol angka per kriteria, x 38 kriteria | Beban kognitif & motorik tinggi, tidak ada indikator progres, mudah lupa kriteria mana yang sudah/belum diisi | Ganti UI ke stepper/slider bernomor + input angka langsung, tambahkan progress bar "24/38 kriteria terisi" yang sticky di atas |
| 4. Menyimpan | Klik "Simpan LKBB Juri X", feedback muncul sebagai banner info di atas | Setelah simpan, pengguna tidak diarahkan ke langkah berikut (peserta berikutnya) — harus mengulang 5 langkah dari awal secara manual | Tambahkan tombol "Simpan & Lanjut ke Peserta Berikutnya" yang otomatis maju ke No. Peserta selanjutnya dalam antrian jadwal |
| 5. Melihat rekap | Grand Master pindah ke `/admin/leaderboard`, memilih tab & jenjang lagi | Konteks yang sudah dipilih di score-entry (jenjang) tidak terbawa; harus mengulang filter dari awal | Simpan preferensi jenjang terakhir (bisa via query-param, tanpa mengubah routing besar-besaran — cukup default tab mengikuti pilihan terakhir dalam session) |
| 6. Publish hasil | Klik toggle "PUBLISH HASIL" | Tidak ada konfirmasi/preview sebelum publish — sekali klik langsung tayang ke publik, tanpa "tinjau dulu" | Tambahkan modal konfirmasi ringkas berisi ringkasan (jumlah peserta per rank) sebelum publish final |
| 7. Cetak SK PDF | Klik "Cetak Rekapitulasi PDF" | Baik, tapi tidak ada preview sebelum unduh — jika data salah, panitia baru sadar setelah membuka file PDF | Tambahkan preview modal / thumbnail sebelum trigger unduhan |

### 3.2 End-to-End Journey: Operator Lapangan Mengelola Panggung

Alur sudah relatif sederhana (2 halaman saja: schedule-manage & barack-manage). Friction utama:

- Status "NOW PERFORMING/STANDBY/NEXT/COMPLETED" hanya bisa diubah satu klik tanpa undo — kalau salah pencet saat momen live kompetisi, tidak ada cara cepat membatalkan selain klik status lain (yang berarti kehilangan histori transisi).
- Tidak ada urutan visual yang menunjukkan "siapa selanjutnya" secara otomatis — status ditentukan manual oleh Operator, bukan disusun otomatis berdasar antrian nomor tampil. Ini murni pilihan produk (bisa disengaja demikian), tapi secara UX perlu highlight lebih kuat untuk peserta yang sudah lama menunggu (misal item yang statusnya "WAITING" lebih dari 30 menit).

### 3.3 End-to-End Journey: Pengunjung Publik

- Pengunjung tiba di `/`, tidak tahu status kompetisi (aktif/sudah selesai) tanpa membaca kartu "Status Pengumuman Juara" — bisa diperjelas dengan mengangkat status ini ke level yang lebih mencolok di hero, bukan di kartu terpisah di bawah judul.
- `/schedule` dan `/barack` polling tiap 3 detik via `localStorage` — di device milik pengunjung publik (bukan device milik panitia yang meng-input data), **data ini justru tidak pernah berubah**, karena `localStorage` bersifat per-browser/per-device dan tidak disinkronkan lintas perangkat oleh backend nyata. Ini adalah gap fungsional besar yang harus disadari tim (dicatat di bagian Handoff Document, bukan untuk diperbaiki lewat desain semata).

### 3.4 Friction Tambahan Lintas Halaman

- **Tidak ada state "sedang menyimpan" yang konsisten** — sebagian tombol submit disable saat `isSaving`, sebagian lain tidak.
- **Konfirmasi destructive action tidak seragam**: sebagian pakai `window.confirm()` (barack-manage, schedule-manage delete), sebagian tidak ada konfirmasi sama sekali (role toggle di `users`).
- **Tidak ada global toast/notification system** — feedback tampil sebagai banner statis di dalam alur halaman, bisa terlewat jika pengguna sudah scroll ke bawah.

---

## 4. DESIGN SYSTEM

Prinsip dasar: **pertahankan dark theme sebagai identitas** (sudah konsisten dipakai dan cocok untuk penggunaan luar ruangan/lapangan dengan cahaya terik — dark UI mengurangi silau layar), tetapi formalisasi seluruh token yang saat ini ad-hoc.

### 4.1 Color Palette

**Base / Surface**
| Token | Nilai | Kegunaan |
|---|---|---|
| `surface-0` | `#020617` (slate-950) | Background utama aplikasi |
| `surface-1` | `#0f172a` (slate-900) | Kartu, panel, header sticky |
| `surface-2` | `#1e293b` (slate-800) | Border, divider, kartu di atas kartu |
| `surface-3` | `#334155` (slate-700) | Elemen interaktif non-aktif (tombol sekunder) |

**Teks**
| Token | Nilai | Kegunaan |
|---|---|---|
| `text-primary` | `#f1f5f9` (slate-100) | Judul, teks utama |
| `text-secondary` | `#cbd5e1` (slate-300) | Sub-judul, label penting |
| `text-tertiary` | `#94a3b8` (slate-400) | Deskripsi, metadata — **naikkan dari slate-500 saat ini untuk kontras lebih baik** |
| `text-disabled` | `#64748b` (slate-500) | Placeholder, teks nonaktif saja |

**Aksen Semantik (bukan dekoratif) — setiap warna hanya boleh punya SATU makna tetap di seluruh aplikasi:**
| Token | Nilai dasar | Makna tunggal |
|---|---|---|
| `accent-primary` (emerald) | `#10b981` | Aksi utama/positif/konfirmasi (tombol simpan, status "berhasil", CTA utama) |
| `accent-warning` (amber) | `#f59e0b` | Perhatian/menunggu/role Grand Master |
| `accent-danger` (rose) | `#f43b5e` | Destruktif/live-sekarang-tampil/error |
| `accent-info` (sky) | `#0ea5e9` | Informasi netral, kategori SMP |
| `accent-alt` (purple) | `#a855f7` | Kategori SMA, elemen "khusus" |
| `accent-neutral` (cyan) | `#06b6d4` | Modul Barak/Transit/Logistik |

> **Aturan baru:** warna jenjang (SD/SMP/SMA) dipisahkan secara eksplisit dari warna status/aksi. Gunakan `accent-primary` (emerald) **khusus** untuk SD, `accent-info` (sky) untuk SMP, `accent-alt` (purple) untuk SMA — dan JANGAN pernah memakai emerald untuk arti lain (CTA, status Grand Master, dll.) di layar yang sama dengan filter jenjang, guna menghindari tabrakan makna seperti temuan 2.6.

### 4.2 Typography

**Font:** Pertahankan Inter (sudah dimuat di `layout.tsx`), tambahkan `font-mono` (mis. JetBrains Mono / IBM Plex Mono) khusus untuk seluruh angka skor, nomor peserta, dan kode — konsisten dengan pola `font-mono` yang sudah dipakai sebagian di app saat ini.

**Skala baku (ganti seluruh ukuran arbitrary):**
| Token | Ukuran | Line-height | Kegunaan |
|---|---|---|---|
| `text-display` | 30–36px | 1.15 | Judul halaman utama (`h1`) |
| `text-title` | 20–24px | 1.25 | Judul kartu/section |
| `text-subtitle` | 16px | 1.4 | Sub-header, nama tim/peserta |
| `text-body` | 14px | 1.5 | Paragraf, deskripsi |
| `text-label` | 12px | 1.4 | Label form, badge, metadata — **ukuran minimum di seluruh aplikasi** |
| `text-caption` | 12px (uppercase, letter-spacing 0.04em) | 1.3 | Eyebrow/kategori kecil, dipakai amat terbatas |

> Hapus seluruh pemakaian `text-[10px]`/`text-[11px]`. Jika ruang benar-benar sempit (badge kecil), gunakan `text-label` 12px dengan padding lebih kecil, bukan menurunkan ukuran font di bawah ambang keterbacaan.

**Bobot font — 3 tingkat saja, dengan aturan tetap:**
- `font-semibold` (600) → teks body yang perlu ditekankan, label form.
- `font-bold` (700) → judul kartu, nama peserta/tim.
- `font-black` (900) → HANYA untuk h1 halaman dan angka skor total/grand total (elemen paling penting di layar).

### 4.3 Grid & Layout

- Container utama: `max-w-7xl` dipertahankan (sudah konsisten).
- Grid admin form+tabel: ganti dari `grid-cols-1 lg:grid-cols-3` menjadi **`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`** — form span 1 kolom, tabel span 1 (md) atau 2 (xl), menghindari zona canggung di tablet.
- Spacing scale baku (kelipatan 4px, buang nilai custom lain): `4, 8, 12, 16, 24, 32, 48, 64px` → dipetakan ke `p-1, p-2, p-3, p-4, p-6, p-8, p-12, p-16`.

### 4.4 Border Radius (baku, 4 tingkat saja)

| Token | Nilai | Kegunaan |
|---|---|---|
| `radius-sm` | 8px | Badge, chip, input kecil |
| `radius-md` | 12px | Tombol, input form |
| `radius-lg` | 16px | Kartu konten, modal |
| `radius-xl` | 24px | Kartu panel besar (container form/section) — dipakai terbatas, bukan default |

### 4.5 Elevation & Shadow

3 tingkat saja, semua dengan warna shadow mengikuti warna aksen elemen (bukan hitam generik), konsisten dengan gaya glow yang sudah ada:
- `elevation-0`: tanpa shadow, border 1px `surface-2` (kartu datar dalam list panjang).
- `elevation-1`: shadow halus (untuk kartu interaktif/hover).
- `elevation-2`: shadow + glow warna aksen (untuk CTA utama, kartu tersorot/status live).

### 4.6 Icon Style

**Ganti seluruh emoji dengan icon set konsisten** (rekomendasi: Lucide, garis 1.5–2px, ukuran tetap 16/20/24px). Emoji dipertahankan HANYA untuk konteks yang benar-benar dekoratif/perayaan (mis. badge 🥇🥈🥉 di podium juara publik boleh tetap emoji sebagai elemen playful), tapi seluruh ikon fungsional navigasi, status, dan aksi (kelola, hapus, simpan, filter, cari) wajib pakai icon set vektor agar konsisten lintas device dan dapat diberi `aria-label`.

### 4.7 Illustration Style

Tidak ada ilustrasi saat ini. Untuk empty state & halaman kosong, gunakan ilustrasi garis sederhana (line-art monokrom dengan aksen warna tunggal sesuai konteks halaman) — hindari ilustrasi flat-color penuh yang kontras dengan tema gelap.

### 4.8 Button Style

3 tingkat:
- **Primary**: solid `accent-primary`, teks gelap, `radius-md`, dipakai 1x per layar untuk aksi paling penting.
- **Secondary**: outline/`surface-2` background, teks `text-secondary`, untuk aksi pendukung (Edit, Cetak, Batal).
- **Destructive**: outline rose (bukan solid, agar tidak menyaingi Primary secara visual) — solid rose disimpan untuk konfirmasi final di dalam modal saja.
- Ukuran minimum touch target: **44×44px** di semua breakpoint, termasuk (khususnya) tombol skor di score-entry.

### 4.9 Card Style

Satu pola kartu baku: `surface-1` background, border `surface-2` 1px, `radius-lg`, padding `p-6` desktop / `p-4` mobile. Kartu status (live/highlight) mendapat ring 1px warna aksen + shadow glow — bukan mengganti seluruh background kartu seperti sekarang.

### 4.10 Modal Style

**Belum ada modal sama sekali di app saat ini** (semua pakai `window.confirm()` atau banner inline). Tambahkan komponen Modal baku: overlay `bg-slate-950/70` blur, panel `surface-1` `radius-lg`, dipakai untuk: konfirmasi hapus, konfirmasi publish, preview sebelum cetak PDF.

### 4.11 Form Style

Baku: input `surface-0` background, border `surface-2`, `radius-md`, padding `12px 16px`, fokus → border `accent-primary` + ring 2px transparan-emerald (bukan hanya ganti warna border seperti sekarang, tambahkan ring agar lebih terlihat sesuai prinsip accessibility fokus).

### 4.12 Table Style

Header sticky, baris zebra opsional tipis (`surface-1`/`surface-0` selang-seling) untuk tabel panjang (leaderboard materi lomba dengan 11 kolom), font angka wajib `font-mono`, kolom aksi selalu di ujung kanan dengan lebar tetap.

### 4.13 Badge Style

Satu pola: `radius-sm`, padding `4px 10px`, `text-label` (12px), background aksen 15% opacity + teks aksen solid + border aksen 30% opacity — pola ini SUDAH konsisten dipakai di banyak tempat di app saat ini (`bg-emerald-500/20 text-emerald-300 border-emerald-500/40`), jadi cukup diformalkan sebagai token, tidak perlu diubah bentuknya.

### 4.14 Alert / Toast Style

- **Alert inline** (dalam form, kontekstual): dipertahankan seperti sekarang (banner di atas form), tapi standardisasi 1 komponen dengan 4 varian warna (info/success/warning/error).
- **Toast global** (baru): notifikasi non-blocking di pojok kanan-atas dengan auto-dismiss 4 detik, dipakai untuk konfirmasi aksi cepat (simpan, hapus, ubah status) — menggantikan banner statis yang mudah terlewat saat pengguna sudah scroll.

### 4.15 Empty State

Pola baku 3 elemen: ikon garis besar (48–64px) + judul singkat + deskripsi 1 baris + (opsional) CTA. Diterapkan di SEMUA tabel/list yang berpotensi kosong (saat ini baru ada di 2 halaman publik).

### 4.16 Loading State

Setiap fetch data (Supabase, localStorage-hydration pertama kali) menampilkan skeleton, bukan konten kosong lalu "pop-in". Durasi minimum tampil 150ms untuk mencegah flicker pada data yang sangat cepat termuat.

### 4.17 Error State

Pola baku: ikon peringatan + pesan yang **dikurasi** (bukan pesan mentah dari Supabase/exception) + tombol "Coba Lagi" jika relevan. Pesan teknis mentah (seperti di `login/page.tsx` saat ini) disembunyikan dari pengguna, dicatat ke console saja.

### 4.18 Skeleton Loading

Bentuk skeleton mengikuti bentuk asli konten (skeleton kartu untuk grid kartu, skeleton baris untuk tabel), warna `surface-2` dengan animasi shimmer halus, durasi 1.5s ease-in-out infinite.

### 4.19 Animation Style & Transition Duration

| Konteks | Durasi | Easing |
|---|---|---|
| Hover state (tombol, kartu) | 150ms | ease-out |
| Perubahan status/badge | 200ms | ease-in-out |
| Modal masuk/keluar | 250ms | ease-out (masuk), ease-in (keluar) |
| Toast masuk/keluar | 300ms | spring halus |
| Skeleton shimmer | 1500ms | linear, infinite |

Batasi animasi `animate-pulse`/`animate-ping` (dipakai berlebihan saat ini — misalnya pada badge "LAN ONLINE" yang selalu berkedip) hanya untuk elemen yang benar-benar merepresentasikan status *live* (indikator "NOW PERFORMING"), bukan elemen statis dekoratif.

### 4.20 Responsive Rules

Breakpoint baku Tailwind dipertahankan (`sm`640 / `md`768 / `lg`1024 / `xl`1280), dengan aturan tambahan: **setiap grid 3-kolom admin wajib punya state 2-kolom di `md`**, bukan lompat langsung dari 1 ke 3 di `lg`. Detail penuh di Bagian 11.

### 4.21 Accessibility Rules

Ringkasan aturan wajib (detail penuh di Bagian 12): kontras teks minimum AA, target sentuh minimum 44px, seluruh ikon fungsional punya label aksesibel, fokus keyboard selalu terlihat jelas, tidak ada informasi yang disampaikan lewat warna semata.

---

## 5. COMPONENT LIBRARY

Daftar komponen reusable yang perlu dibakukan sebagai satu sumber kebenaran visual (saat ini semua ditulis ulang manual per halaman).

| Komponen | Fungsi | Dipakai di (contoh nyata dari kode) |
|---|---|---|
| **Button** | 3 varian (Primary/Secondary/Destructive) + state loading bawaan | Semua form submit, semua tombol aksi |
| **IconButton** | Tombol ikon-saja dengan `aria-label` wajib | Tombol hapus (🗑️), tombol edit (✏️), hamburger menu |
| **Input / Textarea** | Field teks baku dengan label, helper text, error state | Semua form CRUD |
| **Select / Dropdown** | Pemilih baku, termasuk varian "searchable" | Pemilih jenjang, pemilih peserta (baru, ganti input bebas) |
| **Card** | Kontainer konten baku (lihat 4.9) | Semua kartu ringkasan, kartu peserta, kartu barak |
| **Modal / Dialog** | Overlay konfirmasi & preview (baru) | Konfirmasi hapus, konfirmasi publish, preview PDF |
| **Drawer** | Panel geser dari sisi (baru, opsional mobile) | Form tambah/edit di mobile agar tidak mendorong layout |
| **Sidebar (Admin)** | Navigasi admin vertikal (baru, menggantikan navbar horizontal khusus di dalam `(admin)`) | Semua halaman `/admin/*` |
| **Navbar (Publik)** | Navigasi atas untuk area publik saja (disederhanakan dari Navbar gabungan saat ini) | Semua halaman `(public)` |
| **Table** | Tabel data baku dengan header sticky, sort indicator, empty state bawaan | `admin/leaderboard`, `admin/users` |
| **SearchBar** | Input pencarian baku dengan ikon & clear button | `barack` publik, `barack-manage` |
| **FilterTabs** | Grup tab filter (jenjang SD/SMP/SMA) baku, dengan hitungan otomatis | Hampir semua halaman |
| **Badge** | Label status/kategori kecil (lihat 4.13) | Status jadwal, role user, jenjang |
| **Avatar** | Representasi inisial nama pengguna (baru — saat ini nama panitia hanya teks polos di navbar) | Navbar, daftar user panitia |
| **ProgressBar** | Indikator progres pengisian form (baru) | Form input nilai LKBB (progres 24/38 kriteria) |
| **Breadcrumb** | Jejak navigasi kontekstual (baru) | Halaman admin dengan banyak state bertingkat |
| **Pagination** | Navigasi halaman data (baru) | Semua tabel yang berpotensi besar |
| **ScoreStepper** | Pengganti grid tombol angka — kombinasi input angka + tombol +/- + preset cepat (baru, krusial) | `admin/score-entry` |
| **Toast/Notification** | Notifikasi non-blocking global (baru) | Menggantikan seluruh banner feedback statis |
| **Tooltip** | Info tambahan saat hover (baru) | Ikon status, singkatan istilah (LKBB, PBB, Danton) |
| **Tabs** | Tab navigasi dalam halaman (dibakukan dari pola yang sudah ada) | `admin/leaderboard` (3 tab rekap), `admin/score-entry` (8 tab materi) |
| **StatCard / MetricCard** | Kartu ringkasan angka besar dengan label (baru, terinspirasi dari `stitch_screens`) | Dashboard baru, atas tabel leaderboard |
| **EmptyState** | Placeholder data kosong baku (lihat 4.15) | Semua tabel/list |
| **Skeleton** | Placeholder loading baku (lihat 4.16/4.18) | Semua halaman saat fetch data |

---

## 6. SPESIFIKASI PER HALAMAN

### 6.1 `(public)/page.tsx` — Landing / Hub Publik

- **Tujuan halaman:** Titik masuk publik yang mengarahkan ke 3 area (Hasil, Jadwal, Barak) dan menampilkan status kompetisi.
- **Masalah UI:** Status "Published/Locked" tampil di kartu terpisah kecil di bawah judul — kurang menonjol untuk info sepenting itu; 3 kartu navigasi punya bobot visual sama padahal "Hasil & SK Juara" kemungkinan aksi paling dicari saat kompetisi selesai.
- **Masalah UX:** Tidak ada indikasi jam/hari kompetisi berlangsung; tidak ada link masuk ke `/login` untuk panitia yang mendarat di halaman ini secara tidak sengaja.
- **Rekomendasi layout baru:** Status kompetisi naik ke hero sebagai badge besar di bawah judul utama (bukan kartu terpisah), 3 kartu navigasi tetap grid 3 kolom tapi kartu "Hasil & SK Juara" mendapat aksen visual lebih (border lebih tebal / label "Populer") saat status = Published.
- **Rekomendasi komponen baru:** `StatCard` untuk status, `Badge` besar untuk indikator live/locked.
- **Rekomendasi visual:** Tambahkan micro-illustration garis di hero (opsional) agar tidak terasa kosong di atas 3 kartu.
- **Rekomendasi hierarchy:** Urutan h1 → status besar → 3 kartu → footer info LAN.
- **Rekomendasi responsive:** Grid 3 kartu → 1 kolom di mobile (sudah begitu), pastikan urutan kartu tetap "Hasil" di posisi teratas di mobile (prioritas konten).
- **Rekomendasi interaction:** Tambahkan link kecil "Masuk sebagai Panitia →" di footer/navbar publik.

### 6.2 `(public)/live-score/page.tsx` — Hasil & SK Juara

- **Tujuan halaman:** Menampilkan podium juara resmi per jenjang dan menyediakan unduh SK PDF.
- **Masalah UI:** Podium ditampilkan sebagai 3 kartu sejajar tanpa hierarki visual rank 1 vs 2 vs 3 (secara visual semua kartu berukuran sama, hanya beda badge warna).
- **Masalah UX:** **Data 100% mock** — tidak merefleksikan nilai riil (temuan kritis #2 di Bagian 2.4). Ini catatan untuk tim engineering, tapi desain harus disiapkan agar begitu data riil terhubung, layout tetap valid untuk N peserta per rank (bukan cuma 2-3 seperti mock).
- **Rekomendasi layout baru:** Podium 3 besar dengan rank 1 secara visual lebih tinggi/lebih besar (pola podium fisik: 2-1-3 dari kiri ke kanan), diikuti daftar peringkat 4 dst. dalam bentuk tabel/list ringkas di bawah podium (saat ini peringkat setelah top 3 tidak ditampilkan sama sekali).
- **Rekomendasi komponen baru:** `PodiumCard` (varian khusus Card untuk rank 1/2/3), `Table` untuk sisa peringkat.
- **Rekomendasi visual:** Rank 1 mendapat glow amber lebih kuat + sedikit elevasi (`translate-y` negatif) dibanding rank 2/3.
- **Rekomendasi hierarchy:** Total skor tetap elemen angka terbesar di tiap kartu (sudah tepat), pertahankan.
- **Rekomendasi responsive:** Podium 3 kolom → tetap 1 kolom di mobile tapi urutan render tetap 1-2-3 (bukan 2-1-3) untuk memudahkan pembacaan linear di layar sempit.
- **Rekomendasi interaction:** Tombol unduh PDF tetap di header (sudah tepat), tambahkan preview modal sebelum unduh.

### 6.3 `(public)/schedule/page.tsx` — Urutan Tampil Realtime

- **Tujuan halaman:** Menunjukkan status tampil tiap peserta secara live ke publik.
- **Masalah UI:** 5 varian badge status dengan styling berbeda cukup baik secara warna, tapi ukuran & padding badge antar status sedikit tidak seragam (`STANDBY` dan `NEXT` beda padding dari `COMPLETED`).
- **Masalah UX:** Tidak ada auto-scroll/highlight otomatis ke item "NOW PERFORMING" saat halaman dibuka — pengguna harus mencari manual di antara list panjang.
- **Rekomendasi layout baru:** Sematkan (pin) kartu "NOW PERFORMING" di paling atas daftar terlepas dari urutan nomor tampil aslinya, dengan card yang secara visual jelas beda (bukan hanya ring, tapi ukuran sedikit lebih besar).
- **Rekomendasi komponen baru:** `LiveIndicatorCard` (varian card khusus status tampil).
- **Rekomendasi visual:** Kurangi elemen `animate-ping` ganda (saat ini badge live + dot indicator sama-sama animasi terus-menerus, berlebihan) — cukup satu elemen animasi per kartu live.
- **Rekomendasi hierarchy:** No. tampil (kotak mono besar di kiri) sudah menjadi anchor visual yang baik, pertahankan.
- **Rekomendasi responsive:** Sudah cukup baik (`flex-col md:flex-row`), tambahkan sticky mini-bar di mobile menampilkan ringkasan "Sedang tampil: [nama tim]" saat pengguna scroll jauh ke bawah.
- **Rekomendasi interaction:** Tab filter jenjang sudah baik, tambahkan indikator jumlah "NOW PERFORMING" di badge tab (mis. titik merah kecil) agar terlihat tanpa harus klik.

### 6.4 `(public)/barack/page.tsx` — Pencarian Lokasi Barak

- **Tujuan halaman:** Pencarian cepat lokasi ruang transit berdasarkan nama tim/sekolah/nomor.
- **Masalah UI:** Search bar diposisikan sejajar header (baik di desktop), tapi tidak ada ikon "clear" untuk menghapus cepat query pencarian.
- **Masalah UX:** Search dan filter jenjang berjalan independen tanpa umpan balik jumlah hasil real-time yang menonjol (jumlah hanya muncul kecil di dalam label tab).
- **Rekomendasi layout baru:** Tambahkan baris ringkasan "Menampilkan X dari Y lokasi" tepat di atas grid kartu, terutama penting saat hasil pencarian kosong (state ini sudah ada, tapi terpisah jauh secara visual dari search bar).
- **Rekomendasi komponen baru:** `SearchBar` baku dengan tombol clear (×).
- **Rekomendasi visual:** Pertahankan pola kartu grid 3 kolom, cukup standardisasi radius & padding sesuai token baru.
- **Rekomendasi hierarchy:** Nama ruangan transit (info paling dicari pengguna) sudah ditonjolkan di bagian bawah kartu — pertahankan, atau naikkan ke bagian atas kartu agar terlihat tanpa scroll dalam kartu panjang.
- **Rekomendasi responsive:** Grid 3 → 2 → 1 kolom sudah tepat (`md:grid-cols-2 lg:grid-cols-3`).
- **Rekomendasi interaction:** Tambahkan debounce ringan (300ms) pada input pencarian agar tidak filter di setiap keystroke pada dataset besar nantinya.

### 6.5 `(auth)/login/page.tsx` — Login Panitia

- **Tujuan halaman:** Autentikasi panitia (Grand Master / Operator).
- **Masalah UI:** Card login sudah rapi dan fokus (single-column, centered) — salah satu halaman dengan hierarki visual terbaik di app saat ini.
- **Masalah UX:** Pesan error menampilkan teks mentah dari Supabase (`res.error.message`) yang bisa membingungkan pengguna non-teknis (misalnya pesan bahasa Inggris teknis).
- **Rekomendasi layout baru:** Pertahankan struktur, tambahkan bagian kecil "Lupa akses? Hubungi Sekretaris Utama" di footer card untuk kasus lupa password (fitur reset belum ada, minimal beri jalur bantuan manual).
- **Rekomendasi komponen baru:** `Alert` varian error baku (ganti banner ad-hoc saat ini dengan pesan terkurasi, lihat 4.17).
- **Rekomendasi visual:** Pertahankan radial glow di pojok kartu — elemen ini sudah selaras dengan gaya "arena kompetisi" aplikasi.
- **Rekomendasi hierarchy:** Sudah baik: logo → judul → form → footer info keamanan.
- **Rekomendasi responsive:** Sudah baik di semua breakpoint (card max-width terkontrol).
- **Rekomendasi interaction:** Tambahkan toggle show/hide password (saat ini `type="password"` polos tanpa opsi lihat), penting karena password sering di-generate default (`Password123!`) dan rawan salah ketik ulang manual oleh Operator baru.

### 6.6 `(admin)/admin/schedule-manage/page.tsx` — Kelola Urutan Tampil

- **Tujuan halaman:** CRUD entri jadwal tampil per jenjang + pengubahan status panggung secara live.
- **Masalah UI:** 4 tombol status + 1 tombol hapus berjejer di kartu menjadi cukup ramai secara visual, terutama di mobile (`flex-wrap` membuat baris tombol tidak rata).
- **Masalah UX:** Tidak ada undo setelah mengubah status; delete langsung lewat `window.confirm()`.
- **Rekomendasi layout baru:** Pisahkan Status Switcher menjadi 1 komponen `SegmentedControl` (bukan 4 tombol lepas), sehingga terlihat sebagai satu grup pilihan status, bukan 4 aksi independen. Tombol hapus dipindah ke menu ikon "..." di pojok kartu agar tidak bersaing visual dengan status.
- **Rekomendasi komponen baru:** `SegmentedControl`, `Modal` konfirmasi hapus, `IconButton` menu "...".
- **Rekomendasi visual:** Beri badge jumlah "menunggu >30 menit" otomatis pada item WAITING lama (lihat 3.2), memakai `accent-warning`.
- **Rekomendasi hierarchy:** No. tampil + badge jenjang tetap anchor kiri (baik), status tetap anchor kanan (baik) — pertahankan struktur, perbaiki hanya styling grup tombol.
- **Rekomendasi responsive:** Form tambah peserta pindah ke `Drawer` di mobile (bukan kartu statis di atas tabel) agar tabel jadwal jadi fokus utama layar kecil.
- **Rekomendasi interaction:** Setelah submit form tambah peserta, auto-scroll & highlight singkat (flash) ke entri baru di tabel.

### 6.7 `(admin)/admin/barack-manage/page.tsx` — Kelola Ruang Barak

- **Tujuan halaman:** CRUD alokasi ruang transit per peserta.
- **Masalah UI:** Mirip schedule-manage — 2 tombol aksi (Edit/Hapus) OK secara jumlah, tapi tombol "RESET/HAPUS SEMUA DATA" berada di header sejajar judul, berisiko diklik tidak sengaja karena posisinya cukup mencolok untuk aksi sedestruktif itu.
- **Masalah UX:** Aksi "Hapus Semua Data" (irreversible, mempengaruhi seluruh dataset) hanya dilindungi satu `confirm()` teks panjang — perlindungan tidak sepadan dengan dampak aksi.
- **Rekomendasi layout baru:** Pindahkan "Reset Semua Data" ke area terpisah (mis. bagian bawah halaman/pengaturan lanjutan) dengan pola konfirmasi 2 langkah (modal + ketik ulang kata konfirmasi), bukan sejajar tombol-tombol operasional harian di header.
- **Rekomendasi komponen baru:** `Modal` dengan pola "type to confirm" untuk aksi destruktif skala besar.
- **Rekomendasi visual:** Form Tambah/Edit menggunakan judul dinamis (✏️ Edit vs ➕ Tambah) — pola ini sudah baik, pertahankan konsepnya dengan ikon vektor pengganti emoji.
- **Rekomendasi hierarchy:** Nama ruangan transit sudah ditonjolkan sebagai info kunci di kartu — pertahankan.
- **Rekomendasi responsive:** Sama seperti 6.6 — form ke `Drawer` di mobile.
- **Rekomendasi interaction:** Tambahkan validasi live (bukan hanya saat submit) untuk field wajib, agar pengguna tahu lebih awal field mana yang kurang.

### 6.8 `(admin)/admin/score-entry/page.tsx` — Input Nilai Juri ⚠️ Prioritas Redesign Tertinggi

- **Tujuan halaman:** Form input nilai juri untuk 8 materi lomba berbeda, dengan struktur skor granular per kriteria untuk LKBB.
- **Masalah UI:** Grid tombol angka per kriteria (temuan #1, Bagian 2.4) adalah masalah UI paling berat di seluruh aplikasi. Selain itu, terlalu banyak selector (tab materi, toggle gender, toggle jenjang, toggle juri) ditumpuk di satu header tanpa pengelompokan visual yang jelas — kelimanya punya bobot visual serupa padahal levelnya berbeda (materi = konteks utama, juri = sub-konteks).
- **Masalah UX:** (Detail penuh di Bagian 3.1) — tidak ada indikator progres pengisian; No. Peserta input bebas rawan typo; tombol "Auto-Fill... (Fast Testing)" berbahaya ada di form produksi.
- **Rekomendasi layout baru:**
  1. Header disusun 2 tingkat jelas: **Baris konteks kompetisi** (Jenjang → Gender → No. Peserta sebagai satu grup "siapa yang dinilai") secara visual dipisah dari **baris konteks penilaian** (Materi → Juri, sebagai grup "apa & oleh siapa dinilai").
  2. Tambahkan **ringkasan sticky** di bagian atas saat men-scroll form panjang: "Menilai: [No.Peserta] [Nama Tim] — Materi LKBB — Juri 2 — Progres 24/38".
  3. Ganti grid tombol angka → `ScoreStepper`: field angka besar dengan tombol +/- dan slider halus di sampingnya, ATAU sekumpulan preset cepat berjumlah maksimal 5–7 chip (mis. Min / Min+25% / Median / Min+75% / Max) plus input manual — bukan satu tombol per integer.
  4. Hilangkan tombol "Auto-Fill... Fast Testing" dari build produksi, pindahkan ke halaman/mode developer terpisah jika tetap dibutuhkan untuk QA internal.
- **Rekomendasi komponen baru:** `ScoreStepper`, `ProgressBar` sticky, `ContextSummaryBar` sticky, `Select` searchable untuk No. Peserta.
- **Rekomendasi visual:** Subtotal per kategori (PBB/Variasi/Danton) dipertahankan sebagai badge di header tiap section (sudah baik secara konsep), styling diseragamkan dengan token baru.
- **Rekomendasi hierarchy:** Grand Total di footer sudah menjadi elemen paling besar/mono (baik) — pertahankan sebagai satu-satunya angka `font-black` terbesar di halaman.
- **Rekomendasi responsive:** Ini yang paling krusial di mobile — `ScoreStepper` per baris kriteria wajib full-width dan tidak wrap ke banyak baris kecil seperti grid tombol saat ini. Target: tiap kriteria = satu baris konsisten di semua breakpoint, hanya lebar kontrol yang menyesuaikan.
- **Rekomendasi interaction:** Simpan otomatis (auto-save) tiap beberapa detik ke storage sementara (draft), independen dari tombol "Simpan" final, agar juri tidak kehilangan input jika halaman ter-refresh tidak sengaja di tengah kompetisi.

### 6.9 `(admin)/admin/leaderboard/page.tsx` — Rekap Master & SK

- **Tujuan halaman:** Rekap agregat nilai per jenjang dalam 3 tampilan (LKBB/Materi Lomba/Khusus), kontrol Publish, dan cetak SK PDF.
- **Masalah UI:** Tabel Materi Lomba memiliki 11 kolom pada layar sempit tanpa strategi responsive selain `overflow-x-auto` polos — pengalaman scroll horizontal panjang tanpa indikator kolom mana yang sedang dilihat.
- **Masalah UX:** (Detail di 2.4 #3) — fallback nilai palsu tanpa penanda; tidak ada preview sebelum Publish.
- **Rekomendasi layout baru:** Tambahkan baris `StatCard` ringkas di atas tabel (Total Peserta, Kategori Terverifikasi, Skor Tertinggi — terinspirasi `stitch_screens/3_leaderboard_and_finalization`), sebelum tabel detail. Untuk tabel 11-kolom, terapkan kolom "beku" (freeze) pada 2 kolom pertama (Rank + Nama) saat scroll horizontal, dan kelompokkan kolom A–E materi menjadi grup visual dengan header gabungan.
- **Rekomendasi komponen baru:** `StatCard`, `Modal` konfirmasi Publish dengan ringkasan, indikator "belum dinilai" (badge abu-abu "—" bukan angka) untuk kriteria yang masih memakai fallback.
- **Rekomendasi visual:** Tab switcher 3 tampilan (LKBB/Materi/Khusus) dipertahankan konsepnya, disederhanakan jadi komponen `Tabs` baku.
- **Rekomendasi hierarchy:** Tombol "Publish" dan "Cetak PDF" di header sudah tepat secara posisi (aksi utama halaman) — pertahankan, tambahkan hierarki: Publish adalah aksi yang lebih signifikan (butuh konfirmasi), Cetak PDF aksi turunan yang lebih ringan.
- **Rekomendasi responsive:** Di mobile, ganti tabel besar dengan tampilan `Card` per peserta yang bisa di-expand (accordion) menampilkan rincian skor, mengikuti pola yang sama dengan kartu peserta di halaman publik.
- **Rekomendasi interaction:** Klik baris tabel membuka detail panel/slide-over berisi rincian skor per juri untuk keperluan audit sengketa nilai.

### 6.10 `(admin)/admin/users/page.tsx` — Kelola User Panitia

- **Tujuan halaman:** Membuat akun Operator/Grand Master baru dan mengganti role.
- **Masalah UI:** Password default ditampilkan sebagai teks polos di banner feedback setelah akun dibuat (`Password: ${pwd}`) — secara visual perlu diberi treatment khusus (kotak tersalin, ikon copy) agar mudah dan aman disalin panitia, bukan tercampur dalam kalimat panjang.
- **Masalah UX:** Toggle "Tukar Role" adalah aksi sensitif (bisa memberi akses Grand Master penuh ke siapa pun) tapi hanya satu klik tanpa konfirmasi sama sekali — paling tidak dilindungi dibanding aksi hapus barak yang justru punya `confirm()`.
- **Rekomendasi layout baru:** Tambahkan kolom "Terakhir diubah" pada daftar user; field Password pada form dipisah dengan tombol "Generate" + tampilan hasil dalam kotak `code`/mono dengan tombol salin (copy-to-clipboard), bukan digabung dalam kalimat feedback.
- **Rekomendasi komponen baru:** `Modal` konfirmasi untuk perubahan role (aksi sensitif harus setara/lebih ketat dari aksi hapus data operasional).
- **Rekomendasi visual:** Badge role (👑/⚡) dipertahankan sebagai pembeda cepat, standardisasi ke token warna baru.
- **Rekomendasi hierarchy:** Form buat akun (kiri) vs daftar akun (kanan) — struktur sudah tepat mengikuti pola CRUD halaman lain, pertahankan konsistensi ini sebagai standar seluruh halaman CRUD admin.
- **Rekomendasi responsive:** Sama seperti CRUD lain, form ke `Drawer` di mobile.
- **Rekomendasi interaction:** Setelah generate password, tampilkan pengingat "Sampaikan password ini secara langsung/aman ke Operator, tidak akan ditampilkan lagi setelah halaman ditutup."

---

## 7. KONSEP DASHBOARD

Saat ini **tidak ada halaman dashboard ringkasan** — Grand Master mendarat langsung di `/admin/leaderboard` (tabel detail), dan Operator langsung di `/admin/schedule-manage` (form operasional). Ini membuat panitia langsung dilempar ke tugas mendalam tanpa gambaran situasi besar. Konsep berikut memakai **data yang sudah ada** di aplikasi (tidak perlu data baru):

**Dashboard Grand Master** (bisa berupa bagian atas `/admin/leaderboard` yang diperluas, tanpa menambah rute baru):
- Baris `StatCard` 4 kartu: Total Peserta Terdaftar (dari jumlah entri schedule), Peserta Sudah Dinilai vs Belum (dihitung dari keberadaan storage key skor per peserta), Status Publikasi per Jenjang (3 indikator SD/SMP/SMA), Peserta Sedang Tampil Saat Ini (dari status `NOW PERFORMING` di schedule).
- Panel "Perlu Perhatian": daftar peserta yang statusnya `COMPLETED` di jadwal tapi belum punya nilai LKBB Juri 1/2/3 lengkap — sangat berguna secara operasional dan sepenuhnya bisa dihitung dari data yang sudah ada.
- Shortcut cepat ke 3 aksi tersering: "Lanjutkan Input Nilai", "Lihat Rekap", "Kelola User".

**Dashboard Operator Lapangan** (bagian atas `/admin/schedule-manage`):
- `StatCard` 3 kartu: Total Antrian Divisi (sesuai `assignedJenjang`), Sedang Tampil, Sisa Menunggu.
- Panel highlight otomatis peserta `WAITING` terlama (lihat 3.2) sebagai pengingat visual, tanpa perlu logika baru selain membandingkan timestamp entri.

Prinsip desain dashboard: **informasi tersaji dalam <5 detik pandangan pertama** — angka besar, warna status, tanpa perlu klik apa pun.

---

## 8. KONSEP LEADERBOARD

Bangun di atas struktur data yang sudah ada di `admin/leaderboard/page.tsx` (3 tab: LKBB / Materi Lomba / Khusus):

- **Podium visual di atas tabel** untuk tab yang sedang aktif (top 3 dari `sortedParticipants`), memberi gambaran cepat sebelum melihat tabel lengkap — pola ini sudah ada di halaman publik (`live-score`), tinggal direplikasi dengan gaya "admin" (lebih padat, tanpa dekorasi berlebih) di halaman rekap master.
- **Indikator "belum lengkap"**: baris dengan skor yang masih fallback (belum dinilai penuh oleh 3 juri) mendapat badge kecil abu-abu "Data Belum Lengkap" di ujung baris — krusial untuk mencegah SK diterbitkan dengan data yang sebagian palsu (temuan #3).
- **Highlight perubahan rank**: saat data diperbarui (juri baru saja menyimpan nilai), baris yang naik/turun peringkat mendapat indikator panah kecil sesaat (▲/▼) — memberi rasa "hidup" pada rekap tanpa mengubah logika data.
- **Filter & Search di atas tabel** (belum ada saat ini — `admin/leaderboard` hanya punya filter jenjang, tidak ada search nama tim/sekolah) — tambahkan `SearchBar` konsisten dengan halaman publik `barack`.
- Gaya visual: pertahankan warna emas/perak/perunggu untuk rank 1-2-3 (sudah dipakai di publik), terapkan juga di versi admin agar bahasa visual "juara" konsisten lintas publik-admin.

---

## 9. KONSEP LIVE SCORE

"Live Score" di konteks aplikasi ini sebenarnya terbagi jadi 2 kebutuhan berbeda yang sebaiknya dipisahkan secara visual meski tetap 1 halaman (`/live-score`):

1. **Selama kompetisi berlangsung (belum Published):** halaman publik saat ini menampilkan podium meski status "Locked" — ini membingungkan (data yang mana yang ditampilkan saat locked?). Rekomendasi: saat status `LOCKED`, tampilkan **state "Sesi Penilaian Sedang Berlangsung"** (ilustrasi + pesan, mengarahkan pengguna ke `/schedule` untuk pantau live tampil) alih-alih memperlihatkan podium kosong/placeholder yang berpotensi disalahartikan sebagai hasil sementara resmi.
2. **Setelah Published:** podium final seperti dijelaskan di 6.2/8, dengan tambahan **efek "reveal"** halus (fade-in berurutan rank 3 → 2 → 1) saat pengguna pertama kali membuka halaman setelah live jadi published — meningkatkan rasa momen kemenangan tanpa mengorbankan performa (animasi CSS ringan, bukan JS berat).

Untuk kesan "real-time" yang sesuai realita arsitektur data saat ini (localStorage per-device, bukan push realtime lintas perangkat — lihat 3.3), desain harus jujur: tampilkan label kecil "Diperbarui otomatis setiap beberapa detik" alih-alih mengklaim "LIVE" penuh tanpa syarat, sampai backend benar-benar mendukung sinkronisasi lintas perangkat.

---

## 10. AUDIT & REKOMENDASI HALAMAN CRUD

Empat halaman CRUD (`schedule-manage`, `barack-manage`, `score-entry` non-LKBB, `users`) berbagi pola yang sama: **Form di kartu kiri, List/Tabel di kanan**. Ini pola yang baik dan konsisten — rekomendasi berikut berlaku seragam ke semuanya agar proses input data lebih cepat, sederhana, dan nyaman:

1. **Auto-focus** ke field pertama form setiap kali form dibuka/direset, agar panitia bisa langsung mengetik tanpa klik dulu.
2. **Validasi live per-field** (bukan hanya saat submit) dengan indikator kecil di sebelah label (✓ hijau saat valid), mengurangi trial-and-error submit gagal.
3. **Simpan & Tambah Lagi**: tombol submit sekunder yang menyimpan lalu langsung mereset form tanpa reload, mempercepat entri data berturut-turut (skenario umum: memasukkan puluhan peserta berturut-turut saat technical meeting).
4. **Keyboard shortcut**: `Enter` untuk submit form dari field terakhir, `Esc` untuk membatalkan mode edit — konsisten di semua form CRUD.
5. **Konfirmasi destruktif seragam**: semua aksi hapus (baik barak, jadwal, maupun ke depannya user) memakai `Modal` baku yang sama, bukan campuran `confirm()` browser dan tanpa konfirmasi sama sekali seperti kondisi saat ini.
6. **Feedback via Toast, bukan banner statis** (lihat 4.14) — agar tidak mengganggu posisi scroll form saat entri berturut-turut.
7. **Duplikasi entri cepat**: tombol "Duplikat" pada baris tabel (mis. peserta dari sekolah sama, beda regu) untuk mengisi ulang form dengan data mirip tanpa mengetik dari nol — berguna khusus di `barack-manage`/`schedule-manage` di mana banyak peserta berasal dari sekolah yang sama.

---

## 11. SPESIFIKASI RESPONSIVE

| Breakpoint | Rentang | Perilaku Utama |
|---|---|---|
| **Mobile** | < 640px | 1 kolom penuh di semua halaman; form CRUD admin pindah ke `Drawer` bottom-sheet; grid tombol skor (`score-entry`) jadi 1 baris per kriteria full-width dengan `ScoreStepper`; Navbar admin jadi bottom tab bar (terinspirasi `stitch_screens/6_live_schedule_cloud`) untuk akses 1-tangan; tabel besar (`leaderboard` materi 11-kolom) berubah jadi kartu accordion per peserta. |
| **Tablet** | 640–1023px | **State baru yang belum ada di kode saat ini**: grid form+tabel admin menjadi 2 kolom seimbang (bukan 1 kolom dipaksa sampai 1024px seperti sekarang); tab filter jenjang tetap horizontal-scroll tapi dengan fade-edge indicator; tabel leaderboard tampil dengan kolom di-scroll horizontal namun 2 kolom pertama di-freeze. |
| **Laptop** | 1024–1279px | Layout 3-kolom admin (form 1 : tabel 2) seperti desain saat ini, dengan spacing yang diperhalus sesuai token baru. |
| **Desktop** | ≥ 1280px | Layout penuh, `max-w-7xl` dipertahankan, tambahkan ruang bernapas ekstra (padding horizontal lebih besar) alih-alih meregangkan komponen lebih lebar dari yang perlu. |

Aturan tambahan lintas breakpoint:
- Target sentuh minimum 44×44px berlaku mutlak di ≤1023px (mobile+tablet), termasuk seluruh kontrol skor.
- Sticky elements (header form score-entry, ringkasan konteks) wajib tetap dapat di-collapse manual di mobile agar tidak memakan terlalu banyak ruang vertikal di layar kecil saat form sudah panjang.

---

## 12. SPESIFIKASI ACCESSIBILITY

Rekomendasi mengikuti WCAG 2.1 level AA sebagai baseline (aplikasi ini dipakai petugas lapangan dalam kondisi kerja cepat/tergesa, sehingga aksesibilitas = juga kecepatan kerja untuk semua orang, bukan hanya kepatuhan formal):

1. **Kontras warna**: seluruh pasangan teks/background di token Bagian 4.1 diverifikasi mencapai rasio ≥4.5:1 untuk teks body, ≥3:1 untuk teks besar (≥24px bold). `text-tertiary` dinaikkan dari slate-500 ke slate-400 sebagai bagian dari perbaikan ini (sudah dicatat di 4.1).
2. **Target sentuh**: minimum 44×44px untuk semua elemen interaktif, tanpa pengecualian — termasuk `ScoreStepper` baru pengganti grid tombol angka.
3. **Ikon fungsional**: setiap ikon (vektor, hasil migrasi dari emoji di 4.6) yang membawa makna aksi WAJIB disertai `aria-label` teks, bukan hanya `title`. Ikon dekoratif murni (emoji podium 🥇🥈🥉 misalnya) diberi `aria-hidden="true"`.
4. **Fokus keyboard**: definisikan `:focus-visible` kustom dengan ring 2px warna aksen kontras tinggi di semua elemen interaktif (tombol, input, link, tab) — saat ini mengandalkan default browser yang minim terlihat di atas background gelap.
5. **Tidak mengandalkan warna semata**: status (NOW PERFORMING/STANDBY/dst.) sudah menyertakan teks di dalam badge (baik!), pertahankan pola ini di semua badge baru — jangan pernah membuat badge hanya berupa dot warna tanpa label teks.
6. **Form**: setiap `<input>`/`<select>` memiliki `<label>` terhubung eksplisit (bukan hanya placeholder sebagai pengganti label, yang hilang saat pengguna mulai mengetik) — audit kode menemukan beberapa field form CRUD sudah punya `<label>` terpisah (baik), pastikan pola ini konsisten di semua field termasuk field baru (`ScoreStepper`, `Select` searchable peserta).
7. **Live region**: notifikasi Toast baru (4.14) menggunakan `aria-live="polite"` agar pembaca layar mengumumkan feedback simpan/hapus tanpa memutus alur pengguna.
8. **Skip link**: tambahkan "Lewati ke konten utama" tersembunyi (muncul saat fokus tab pertama) khususnya di halaman admin dengan navigasi sidebar/tab yang panjang sebelum konten utama.
9. **Bahasa halaman**: `lang="id"` sudah benar diset di `layout.tsx` — pertahankan.

---

## 13. ROADMAP IMPLEMENTASI (PRIORITAS)

### Fase 1 — Kritis (High Priority, dampak langsung ke integritas hasil kompetisi)
1. Redesain kontrol input skor (`ScoreStepper`) menggantikan grid tombol per-angka di `score-entry`.
2. Tambahkan indikator "Data Belum Lengkap/Belum Dinilai" di `leaderboard` untuk menggantikan tampilan fallback yang menyamar sebagai nilai asli.
3. Hapus/nonaktifkan tombol "Auto-Fill Fast Testing" dari tampilan produksi.
4. Bangun `Modal` konfirmasi baku untuk seluruh aksi destruktif dan aksi sensitif (Publish, ganti role, hapus semua data).
5. Tandai secara visual keterbatasan sinkronisasi data publik ("Diperbarui otomatis" bukan klaim "LIVE" mutlak) sampai isu arsitektur data (dicatat di Bagian 14) diselesaikan tim engineering.

### Fase 2 — Fondasi Design System (Medium Priority)
6. Formalisasi token warna, tipografi, radius, spacing sesuai Bagian 4 ke seluruh halaman.
7. Migrasi ikon emoji → icon set vektor konsisten.
8. Bangun komponen `Toast` global, ganti seluruh banner feedback statis.
9. Tambahkan `Skeleton`/loading state di semua titik fetch data.
10. Perbaiki grid responsive admin agar punya state tablet (`md:grid-cols-2`) yang layak.

### Fase 3 — Peningkatan Pengalaman (Medium–Low Priority)
11. Bangun Dashboard ringkas untuk Grand Master & Operator (Bagian 7).
12. Tambahkan `Pagination` ke semua tabel.
13. Tambahkan `SearchBar` baku & konsisten ke halaman yang belum punya pencarian (`leaderboard`, `schedule-manage`, `users`).
14. Tambahkan progress indicator & context summary sticky di `score-entry`.
15. Tambahkan efek "reveal" podium & polish visual `live-score` publik.

### Fase 4 — Polish & Accessibility (Low Priority, tapi wajib sebelum go-live publik luas)
16. Audit kontras warna penuh & perbaikan `text-tertiary`.
17. Implementasi fokus keyboard kustom & `aria-label` menyeluruh.
18. Empty state & error state baku di semua halaman.
19. Micro-interaction & animasi sesuai token durasi Bagian 4.19.

---

## 14. HANDOFF DOCUMENT UNTUK AI DEVELOPER (ANTIGRAVITY)

Bagian ini merangkum instruksi implementasi dalam format ringkas & tidak ambigu, sebagai referensi cepat tanpa perlu membaca ulang seluruh dokumen naratif di atas.

### 14.1 Batasan Mutlak (Non-Negotiable)
- **DILARANG** mengubah: routing (`app/` folder structure & path), business logic (perhitungan skor, aturan role, format storage key), skema Supabase, kontrak API di `lib/api.ts`, mekanisme autentikasi di `middleware.ts` dan `lib/supabase.ts`.
- **DIPERBOLEHKAN**: mengubah/menambah komponen UI, class Tailwind, struktur JSX di dalam tiap `page.tsx`, menambah komponen baru di `src/components/`, menambah state UI-only (mis. progress bar lokal, toggle collapse) yang tidak mengubah data yang dikirim ke storage/Supabase.

### 14.2 Urutan Kerja yang Disarankan
1. Bangun dahulu **komponen dasar Design System** (Bagian 4–5) sebagai unit terisolasi: `Button`, `Card`, `Badge`, `Input`, `Modal`, `Toast`, `Tabs`, `FilterTabs`, `EmptyState`, `Skeleton`.
2. Terapkan token warna/tipografi/spacing (Bagian 4.1–4.4) secara global lewat konfigurasi Tailwind (tanpa mengubah struktur `globals.css` di luar penambahan token), lalu migrasi halaman satu per satu mengikuti urutan Roadmap Fase 1 → 4 (Bagian 13).
3. Untuk `score-entry`, prioritaskan mengganti `renderRatingOptions()` (yang me-render 1 tombol per integer) dengan komponen `ScoreStepper` baru — ini SATU-SATUNYA perubahan struktur UI yang funsional-signifikan yang diminta dalam dokumen ini; semua kalkulasi total/subtotal (`totalPbb`, `totalVariasi`, `totalDanton`, `grandTotal`) tetap dihitung dari `Record<string, number>` yang sama seperti sekarang, hanya cara pengguna menghasilkan nilai integer itu yang berubah dari klik tombol menjadi input/stepper/preset.
4. Migrasi ikon emoji → icon set vektor dilakukan bertahap per halaman, bukan cari-ganti global sekaligus (untuk memudahkan review visual per halaman).

### 14.3 Checklist Definition of Done per Halaman

Setiap halaman dianggap selesai diredesain jika:
- [ ] Tidak ada lagi nilai warna/radius/font-size arbitrary (`text-[Npx]`, hex/rgb inline) — seluruhnya memakai token dari Bagian 4.
- [ ] Semua ikon fungsional adalah vektor dengan `aria-label`, bukan emoji (kecuali dekoratif yang diizinkan di 4.6/9).
- [ ] Semua target sentuh ≥44×44px.
- [ ] Ada state: loading (skeleton), empty, error — bukan hanya "happy path".
- [ ] Aksi destruktif/sensitif memakai `Modal` konfirmasi baku, bukan `window.confirm()`.
- [ ] Feedback aksi memakai `Toast`, bukan banner statis yang tercampur di alur konten.
- [ ] Responsive diverifikasi di 4 breakpoint (Bagian 11), termasuk state tablet 2-kolom yang baru.
- [ ] Kontras warna & fokus keyboard diverifikasi sesuai Bagian 12.

### 14.4 Peta Referensi Cepat: Temuan → Solusi → Lokasi Kode

| Temuan Kritis | Solusi Desain | File Terdampak (UI-only) |
|---|---|---|
| Grid tombol skor per-integer | `ScoreStepper` component | `admin/score-entry/page.tsx` |
| Data publik live-score hardcoded | (Catatan engineering, bukan desain — lihat 14.5) | `(public)/live-score/page.tsx` |
| Fallback skor palsu tanpa penanda | Badge "Belum Dinilai" pada nilai fallback | `admin/leaderboard/page.tsx` |
| Ikon emoji tak konsisten | Migrasi ke icon set vektor | Semua `page.tsx` + `Navbar.tsx` |
| Tidak ada loading/skeleton | Komponen `Skeleton` di titik fetch | Semua halaman dengan `useEffect` fetch |
| Radius/tipografi tidak baku | Terapkan token Bagian 4.3–4.4 | Semua `page.tsx` |
| `window.confirm()` untuk hapus | Komponen `Modal` konfirmasi | `barack-manage`, `schedule-manage` |
| Grid 3 kolom lompat di tablet | `md:grid-cols-2 xl:grid-cols-3` | `schedule-manage`, `barack-manage`, `users` |
| Tombol Auto-Fill di form produksi | Hapus dari build user-facing | `admin/score-entry/page.tsx` |

### 14.5 Catatan Non-Desain untuk Tim Engineering (Di Luar Ruang Lingkup Dokumen Ini)

Dokumen ini murni desain/UX dan sengaja tidak mengusulkan perubahan logika. Namun 3 temuan berikut **tidak bisa diperbaiki lewat desain UI saja** dan perlu didiskusikan terpisah oleh tim engineering/product owner sebelum go-live penuh:
1. Sinkronisasi data `(public)/live-score`, `(public)/schedule`, `(public)/barack` saat ini bersumber dari `localStorage` per-device (`dynamicStore.ts`), bukan dari Supabase/API terpusat — data yang diinput panitia di satu perangkat tidak otomatis muncul di perangkat pengunjung lain.
2. Nilai fallback hardcoded (`|| 85`, dst.) di `admin/leaderboard/page.tsx` sebaiknya diganti `null`/`undefined` eksplisit di level data agar desain "Badge Belum Dinilai" (14.4) punya kondisi nyata untuk dideteksi, bukan disamarkan sebagai angka valid.
3. `lib/api.ts` (Express REST client) tidak dipanggil oleh halaman manapun saat ini — sebaiknya diklarifikasi apakah ini modul yang direncanakan dipakai ke depan atau dead code yang aman dihapus, karena mempengaruhi arsitektur data yang mendasari poin 1.

---

*Akhir dokumen. Dokumen ini disusun murni berdasarkan pembacaan source code aktual project (bukan asumsi), mencakup 10 halaman, 1 komponen navigasi global, 1 middleware, dan 4 modul pustaka pendukung (`api.ts`, `dynamicStore.ts`, `pdf.ts`, `supabase.ts`), serta mempertimbangkan 6 mockup referensi internal (`stitch_screens/`) sebagai konteks arah desain yang pernah dieksplorasi tim.*
