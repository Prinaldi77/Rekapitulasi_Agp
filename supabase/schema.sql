-- ==============================================================================
-- AGP COMPETITION SYSTEM 2026 - COMPLETE SUPABASE DATABASE SCHEMA DDL & SEED SQL
-- Paste script ini di Supabase SQL Editor (Dashboard Supabase -> SQL Editor -> Run)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES DEFINITION
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('GRAND_MASTER', 'OPERATOR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE school_level AS ENUM ('SD', 'SMP', 'SMA');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE show_status AS ENUM ('WAITING', 'PERFORMING', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABEL CATEGORIES (Kategori Lomba & Jenjang)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level school_level NOT NULL,
    competition_name TEXT NOT NULL, -- e.g., "LKBB UTAMA AGP 2026", "Fashion Show Kreasi"
    is_published BOOLEAN DEFAULT FALSE, -- Toggle Lock & Publish status oleh Grand Master
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABEL PROFILES (Ekstensi auth.users untuk Hak Akses Panitia & Operator)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'OPERATOR',
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABEL CRITERIA / ASSESSMENT ITEMS (Unsur Penilaian & Bobot Nilai Juri)
CREATE TABLE IF NOT EXISTS public.criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    group_type TEXT NOT NULL, -- 'PBB_DASAR', 'VARIASI_FORMASI', 'DANTON'
    sub_group TEXT, -- e.g., "Gerakan Diam ke Diam"
    item_no INT NOT NULL,
    name TEXT NOT NULL, -- e.g., "Sikap Sempurna & Hormat"
    min_score FLOAT DEFAULT 50 NOT NULL,
    max_score FLOAT DEFAULT 100 NOT NULL,
    weight FLOAT DEFAULT 1.0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABEL PARTICIPANTS (Data Peserta / Pasukan Tim Lomba)
CREATE TABLE IF NOT EXISTS public.participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    show_number INT NOT NULL,
    participant_no VARCHAR(20) NOT NULL, -- e.g., "A-01", "C-05"
    team_name TEXT NOT NULL,             -- e.g., "PASBRATA UTAMA"
    school_name TEXT NOT NULL,           -- e.g., "SMAN 1 KOTA BANDUNG"
    gender VARCHAR(10) DEFAULT 'PA',     -- 'PA', 'PI', 'CAMPURAN'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABEL SCORES (Skor Lembar Penilaian Juri 1, 2, & 3)
CREATE TABLE IF NOT EXISTS public.scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    criterion_id UUID REFERENCES public.criteria(id) ON DELETE CASCADE NOT NULL,
    juri_number INT NOT NULL CHECK (juri_number IN (1, 2, 3)),
    score_value FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_score_entry UNIQUE(participant_id, criterion_id, juri_number)
);

-- 8. TABEL SCHEDULES (Urutan Tampil Arena Realtime)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID UNIQUE REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    status show_status DEFAULT 'WAITING',
    time_slot VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABEL BARACKS (Pembagian Ruangan Transit / Barak Peserta)
CREATE TABLE IF NOT EXISTS public.baracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID UNIQUE REFERENCES public.participants(id) ON DELETE CASCADE NOT NULL,
    room_name TEXT NOT NULL, -- e.g., "Ruang Transit A-01 (Kelas X-1)"
    building TEXT NOT NULL,  -- e.g., "Gedung Utama (Gedung A)"
    floor TEXT DEFAULT 'Lantai 1',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baracks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
DROP POLICY IF EXISTS "Panitia Manage Categories" ON public.categories;
DROP POLICY IF EXISTS "Public Read Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Panitia Manage Profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public Read Criteria" ON public.criteria;
DROP POLICY IF EXISTS "Panitia Manage Criteria" ON public.criteria;
DROP POLICY IF EXISTS "Public Read Participants" ON public.participants;
DROP POLICY IF EXISTS "Panitia Manage Participants" ON public.participants;
DROP POLICY IF EXISTS "Public Read Scores" ON public.scores;
DROP POLICY IF EXISTS "Panitia Manage Scores" ON public.scores;
DROP POLICY IF EXISTS "Public Read Schedules" ON public.schedules;
DROP POLICY IF EXISTS "Panitia Manage Schedules" ON public.schedules;
DROP POLICY IF EXISTS "Public Read Baracks" ON public.baracks;
DROP POLICY IF EXISTS "Panitia Manage Baracks" ON public.baracks;

-- Create Policies
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Panitia Manage Categories" ON public.categories FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Panitia Manage Profiles" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Criteria" ON public.criteria FOR SELECT USING (true);
CREATE POLICY "Panitia Manage Criteria" ON public.criteria FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Participants" ON public.participants FOR SELECT USING (true);
CREATE POLICY "Panitia Manage Participants" ON public.participants FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Scores" ON public.scores FOR SELECT USING (true);
CREATE POLICY "Panitia Manage Scores" ON public.scores FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Schedules" ON public.schedules FOR SELECT USING (true);
CREATE POLICY "Panitia Manage Schedules" ON public.schedules FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Public Read Baracks" ON public.baracks FOR SELECT USING (true);
CREATE POLICY "Panitia Manage Baracks" ON public.baracks FOR ALL USING (auth.role() = 'authenticated');

-- ==============================================================================
-- 11. AUTOMATIC PROFILE TRIGGER ON SUPABASE AUTH USER CREATION
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'OPERATOR')
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 12. INITIAL SEED USERS (AKUN GRAND MASTER & OPERATOR LAPANGAN)
-- ==============================================================================

-- Seed User 1: Grand Master (Sekretaris Utama)
-- Login: grandmaster@agp.local / Password: Grandmaster123!
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'e1111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'grandmaster@agp.local',
    crypt('Grandmaster123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"grandmaster","full_name":"Sekretaris Utama AGP (Grand Master)","role":"GRAND_MASTER"}',
    false,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Explicitly upsert Profile for Grand Master
INSERT INTO public.profiles (id, username, full_name, role)
VALUES ('e1111111-1111-1111-1111-111111111111', 'grandmaster', 'Sekretaris Utama AGP (Grand Master)', 'GRAND_MASTER')
ON CONFLICT (id) DO UPDATE SET role = 'GRAND_MASTER';

-- Seed User 2: Operator Lapangan & Live Scoreboard
-- Login: operator@agp.local / Password: Operator123!
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'e2222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'operator@agp.local',
    crypt('Operator123!', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"username":"operator_lapangan","full_name":"Operator Lapangan & Live Scoreboard","role":"OPERATOR"}',
    false,
    now(),
    now()
) ON CONFLICT (id) DO NOTHING;

-- Explicitly upsert Profile for Operator Lapangan
INSERT INTO public.profiles (id, username, full_name, role)
VALUES ('e2222222-2222-2222-2222-222222222222', 'operator_lapangan', 'Operator Lapangan & Live Scoreboard', 'OPERATOR')
ON CONFLICT (id) DO UPDATE SET role = 'OPERATOR';

-- ==============================================================================
-- 13. INITIAL SEED LOMBA DATA (KATEGORI, PESERTA, JADWAL & BARAK)
-- ==============================================================================

-- Seed Categories
INSERT INTO public.categories (id, level, competition_name, is_published)
VALUES 
  ('c1111111-1111-1111-1111-111111111111', 'SMA', 'LKBB UTAMA AGP 2026 - JENJANG SMA', false),
  ('c2222222-2222-2222-2222-222222222222', 'SMP', 'LKBB UTAMA AGP 2026 - JENJANG SMP', false)
ON CONFLICT (id) DO NOTHING;

-- Seed Participants
INSERT INTO public.participants (id, category_id, show_number, participant_no, team_name, school_name, gender)
VALUES
  ('a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 1, 'A-01', 'PASBRATA UTAMA', 'SMAN 1 KOTA BANDUNG', 'PA'),
  ('a2222222-2222-2222-2222-222222222222', 'c1111111-1111-1111-1111-111111111111', 2, 'A-02', 'GARUDA KENCANA', 'SMAN 3 KOTA BANDUNG', 'CAMPURAN'),
  ('a3333333-3333-3333-3333-333333333333', 'c1111111-1111-1111-1111-111111111111', 3, 'A-03', 'KOSGARA SATRIA', 'SMAN 5 KOTA BANDUNG', 'PI')
ON CONFLICT (id) DO NOTHING;

-- Seed Schedules Initial State
INSERT INTO public.schedules (id, participant_id, status, time_slot)
VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'COMPLETED', '08:00 - 08:20'),
  ('b2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'PERFORMING', '08:20 - 08:40'),
  ('b3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'WAITING', '08:40 - 09:00')
ON CONFLICT (participant_id) DO NOTHING;

-- Seed Baracks Initial State
INSERT INTO public.baracks (id, participant_id, room_name, building, floor)
VALUES
  ('d1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Ruang Transit A-01 (Kelas X-1)', 'Gedung Utama (Gedung A)', 'Lantai 1'),
  ('d2222222-2222-2222-2222-222222222222', 'a2222222-2222-2222-2222-222222222222', 'Ruang Transit A-02 (Kelas X-2)', 'Gedung Utama (Gedung A)', 'Lantai 1'),
  ('d3333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 'Ruang Transit A-03 (Kelas X-3)', 'Gedung Utama (Gedung A)', 'Lantai 1')
ON CONFLICT (participant_id) DO NOTHING;
