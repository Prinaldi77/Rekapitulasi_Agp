-- ==============================================================================
-- FIX AUTH TRIGGER SCHEMA SEARCH PATH & USER CREATION
-- Eksekusi script ini di Supabase SQL Editor untuk memperbaiki Trigger User
-- ==============================================================================

-- 1. Hapus user lama (jika ada)
DELETE FROM auth.users WHERE email IN ('grandmaster@agp.local', 'operator@agp.local');

-- 2. Perbaiki Function & Trigger handle_new_user dengan Explicit public.user_role & EXCEPTION SAFE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'GRAND_MASTER' THEN 'GRAND_MASTER'::public.user_role
      ELSE 'OPERATOR'::public.user_role
    END
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Pastikan pembuatan user Auth tidak pernah digagalkan oleh trigger
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Pasang ulang Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
