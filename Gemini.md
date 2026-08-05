# 🏆 GEMINI.md - AGP Competition Management System (Supabase Edition)

Sistem Manajemen Rekapitulasi Nilai Lomba, Urutan Tampil, Pembagian Barak, dan Auto-Generate SK Juara berbasis Web.

---

## 📐 Arsitektur Sistem

* **Frontend Framework:** Next.js (App Router), TypeScript, Tailwind CSS, Lucide React.
* **Backend & Database:** Supabase (PostgreSQL, Supabase Auth, Row Level Security / RLS, Realtime).
* **Client Library:** `@supabase/supabase-js` & `@supabase/ssr`.
* **PDF Engine:** `@react-pdf/renderer` / `jspdf`.
* **Deployment Target:** 
  * Primary: **Local Server (LAN)** — Run via `host: 0.0.0.0` (100% Offline via Router Wi-Fi / Supabase CLI Local).
  * Secondary: Cloud Deployment via **Vercel** + **Supabase Cloud Project**.

---

## 👥 Hak Akses & Peran (User Roles & Supabase Auth)

Sistem menggunakan **Supabase Auth** yang dihubungkan dengan tabel custom `profiles` untuk manajemen *Role*:

1. **Grand Master / Super Admin (Sekretaris Utama)**
   * Mengatur Master Data (Kategori, Jenjang SD/SMP/SMA, Kriteria, & Bobot Nilai).
   * Membuka/mengunci sesi input nilai.
   * Mengatur & Menyetujui Pengumuman Juara (**Lock & Publish System**).
   * Meng-generate dan mendownload **SK Penetapan Juara (PDF)**.
2. **Division Operator (Operator Divisi / Mata Lomba)**
   * Login khusus per divisi (misal: `operator_lkbb_sma`).
   * Hanya memiliki akses ke halaman **Rapid Score Entry**.
   * Memasukkan nilai berdasarkan lembar kertas juri dengan validasi skor maksimum.
3. **Public / Participant (Peserta & Pendamping)**
   * Mengakses **Portal Publik (Mobile Web)** via Scan QR Code.
   * Bebas memilih tab: *Urutan Tampil*, *Pembagian Barak*, dan *Pengumuman Juara*.
   * Akses publik menggunakan aturan *Supabase RLS (Read-Only)* tanpa perlu login.

---

## 🗄️ Skema Database SQL (Supabase DDL)

Eksekusi skrip SQL berikut di **Supabase SQL Editor** untuk membuat tabel, tipe enum, dan relasinya:

```sql
-- 1. Tipe ENUM
CREATE TYPE user_role AS ENUM ('GRAND_MASTER', 'OPERATOR');
CREATE TYPE school_level AS ENUM ('SD', 'SMP', 'SMA');
CREATE TYPE show_status AS ENUM ('WAITING', 'PERFORMING', 'COMPLETED');

-- 2. Tabel Profiles (Extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'OPERATOR',
  category_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Categories (Kategori & Jenjang)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level school_level NOT NULL,
  competition_name TEXT NOT NULL, -- e.g., "LKBB", "Fashion Show"
  is_published BOOLEAN DEFAULT FALSE, -- Toggle Lock/Publish ke Publik
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Foreign key link for profiles.category_id
ALTER TABLE profiles ADD CONSTRAINT fk_profile_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- 4. Tabel Criteria (Kriteria Penilaian)
CREATE TABLE criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., "PBB & Formasi"
  max_score FLOAT DEFAULT 100 NOT NULL,
  weight FLOAT DEFAULT 1.0 NOT NULL
);

-- 5. Tabel Participants (Peserta)
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  show_number INT NOT NULL,
  participant_no VARCHAR(20) NOT NULL, -- e.g., "C-01"
  team_name TEXT NOT NULL,
  school_name TEXT NOT NULL,
  gender VARCHAR(10) -- "PA" or "PI"
);

-- 6. Tabel Scores (Nilai dari Juri)
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  criterion_id UUID REFERENCES criteria(id) ON DELETE CASCADE NOT NULL,
  score_value FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabel Schedules (Urutan Tampil Live)
CREATE TABLE schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID UNIQUE REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  status show_status DEFAULT 'WAITING',
  time_slot VARCHAR(50)
);

-- 8. Tabel Baracks (Pembagian Barak / Transit)
CREATE TABLE baracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID UNIQUE REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  room_name TEXT NOT NULL, -- e.g., "Kelas X-1"
  building TEXT NOT NULL   -- e.g., "Gedung A Lt. 2"
);