-- ==============================================================================
-- AUTO-CONFIRM ALL USERS & AUTO-CONFIRM FUTURE SIGNUPS IN SUPABASE AUTH
-- Eksekusi script ini di Supabase SQL Editor untuk meng-autoconfirm user
-- ==============================================================================

-- 1. Konfirmasi instan seluruh user yang pending
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Buat Trigger Auto-Confirm sebelum User Baru Disimpan ke auth.users
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at := COALESCE(NEW.email_confirmed_at, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. Pasang Trigger Auto-Confirm pada auth.users
DROP TRIGGER IF EXISTS on_auth_user_auto_confirm ON auth.users;
CREATE TRIGGER on_auth_user_auto_confirm
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.auto_confirm_new_user();
